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
                    'SELECT * FROM users WHERE email = ?',
                    [credentials.email]
                );

                if (users.length === 0) {
                    throw new Error('Email 或密碼錯誤');
                }

                const user = users[0];

                if (!user.password) {
                    throw new Error('此帳號請使用 Google 登入');
                }

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
        async signIn({ user, account }) {
            if (account?.provider === 'google') {
                try {
                    const [existing] = await pool.query<RowDataPacket[]>(
                        'SELECT * FROM users WHERE email = ?',
                        [user.email]
                    );

                    if (existing.length === 0) {
                        await pool.query<ResultSetHeader>(
                            `INSERT INTO users (name, email, avatar, provider, provider_id, role) 
                             VALUES (?, ?, ?, ?, ?, ?)`,
                            [
                                user.name || 'Google User',
                                user.email,
                                user.image || null,
                                'google',
                                account.providerAccountId,
                                'member'
                            ]
                        );
                        console.log('新 Google 用戶已建立:', user.email);
                    } else {
                        // 更新現有用戶
                        await pool.query(
                            `UPDATE users SET 
                                name = COALESCE(?, name),
                                avatar = COALESCE(?, avatar),
                                provider = 'google',
                                provider_id = ?
                             WHERE email = ?`,
                            [user.name, user.image, account.providerAccountId, user.email]
                        );
                        console.log('Google 用戶已更新:', user.email);
                    }
                } catch (error) {
                    console.error('Google 登入寫入資料庫錯誤:', error);
                }
            }
            return true;
        },

        async jwt({ token, user, account }) {
            if (account && user) {
                const [users] = await pool.query<RowDataPacket[]>(
                    'SELECT id, role FROM users WHERE email = ?',
                    [user.email]
                );

                if (users.length > 0) {
                    token.id = users[0].id.toString();
                    token.role = users[0].role;
                }
            }
            return token;
        },

        async session({ session, token }) {
            if (session.user) {
                (session.user as any).id = token.id;
                (session.user as any).role = token.role;
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