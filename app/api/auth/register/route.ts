import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, email, password } = body;

        // 驗證
        if (!name || !email || !password) {
            return NextResponse.json(
                { success: false, error: '請填寫所有欄位' },
                { status: 400 }
            );
        }

        if (password.length < 6) {
            return NextResponse.json(
                { success: false, error: '密碼至少需要 6 個字元' },
                { status: 400 }
            );
        }

        // 檢查 email 是否已存在
        const [existing] = await pool.query<RowDataPacket[]>(
            'SELECT id FROM users WHERE email = ?',
            [email]
        );

        if (existing.length > 0) {
            return NextResponse.json(
                { success: false, error: 'Email 已被註冊' },
                { status: 400 }
            );
        }

        // 加密密碼
        const hashedPassword = await bcrypt.hash(password, 10);

        // 建立使用者
        const [result] = await pool.query<ResultSetHeader>(
            'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
            [name, email, hashedPassword, 'member']
        );

        return NextResponse.json({
            success: true,
            data: { id: result.insertId },
            message: '註冊成功'
        });

    } catch (error) {
        console.error('註冊錯誤:', error);
        return NextResponse.json(
            { success: false, error: '註冊失敗，請稍後再試' },
            { status: 500 }
        );
    }
}