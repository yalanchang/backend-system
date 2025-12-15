import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import bcrypt from 'bcryptjs';

export const authOptions: NextAuthOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),

        CredentialsProvider({
            name: 'Credentials',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error('請輸入 Email 和密碼');
                }

                const [users] = await pool.query<RowDataPacket[]>(
                    'SELECT * FROM users WHERE email = ? AND (provider IS NULL OR provider = "local")',
                    [credentials.email]
                );

                if (users.length === 0) {
                    throw new Error('Email 或密碼錯誤');
                }

                const user = users[0];

                const isValid = await bcrypt.compare(credentials.password, user.password);
                if (!isValid) {
                    throw new Error('Email 或密碼錯誤');
                }

                return {
                    id: user.id.toString(),
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    image: user.avatar,
                };
            },
        }),
    ],

    callbacks: {
        async signIn({ user, account, profile }) {
            if (!account) return false;

            if (account.provider === 'google') {
                try {
                    const connection = await pool.getConnection();
                    
                    try {
                        const [existingByProvider] = await connection.query<RowDataPacket[]>(
                            'SELECT * FROM users WHERE provider = ? AND provider_id = ?',
                            ['google', account.providerAccountId]
                        );

                        if (existingByProvider.length > 0) {
                            await connection.query(
                                `UPDATE users SET 
                                    name = ?, 
                                    avatar = ?, 
                                    updated_at = NOW() 
                                 WHERE id = ?`,
                                [
                                    user.name || existingByProvider[0].name,
                                    user.image || existingByProvider[0].avatar,
                                    existingByProvider[0].id
                                ]
                            );
                            return true;
                        }

                        const [existingByEmail] = await connection.query<RowDataPacket[]>(
                            'SELECT * FROM users WHERE email = ?',
                            [user.email]
                        );

                        if (existingByEmail.length > 0) {
                            await connection.query(
                                `UPDATE users SET 
                                    provider = ?, 
                                    provider_id = ?, 
                                    avatar = COALESCE(avatar, ?),
                                    updated_at = NOW() 
                                 WHERE id = ?`,
                                [
                                    'google',
                                    account.providerAccountId,
                                    user.image,
                                    existingByEmail[0].id
                                ]
                            );
                            console.log('已綁定 Google 帳號:', existingByEmail[0].id);
                            return true;
                        }

                        const [result] = await connection.query<ResultSetHeader>(
                            `INSERT INTO users (name, email, provider, provider_id, avatar, role, created_at) 
                             VALUES (?, ?, ?, ?, ?, ?, NOW())`,
                            [
                                user.name || 'Google User',
                                user.email,
                                'google',
                                account.providerAccountId,
                                user.image || null,
                                'member'
                            ]
                        );

                        console.log('新 Google 用戶已創建:', result.insertId);
                        return true;

                    } finally {
                        connection.release();
                    }
                } catch (error) {
                    console.error('Google 登入錯誤:', error);
                    return false;
                }
            }

            return true;
        },

        async jwt({ token, user, account }) {
            // 首次登入時
            if (account && user) {
                // Google 登入
                if (account.provider === 'google') {
                    const [users] = await pool.query<RowDataPacket[]>(
                        'SELECT id, name, email, role, avatar FROM users WHERE provider = ? AND provider_id = ?',
                        ['google', account.providerAccountId]
                    );

                    if (users.length > 0) {
                        token.id = users[0].id.toString();
                        token.role = users[0].role;
                        token.name = users[0].name;
                        token.email = users[0].email;
                        token.picture = users[0].avatar;
                    }
                } else {
                    // Credentials 登入
                    token.id = user.id;
                    token.role = (user as any).role;
                }
            }

            return token;
        },

        async session({ session, token }) {
            if (session.user) {
                (session.user as any).id = token.id;
                (session.user as any).role = token.role;
                session.user.name = token.name as string;
                session.user.email = token.email as string;
                session.user.image = token.picture as string;
            }
            return session;
        },
    },

    pages: {
        signIn: '/login',
    },

    session: {
        strategy: 'jwt',
    },

    debug: process.env.NODE_ENV === 'development',
};