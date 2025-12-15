import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import bcrypt from 'bcryptjs';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const role = searchParams.get('role');

        let query = `
            SELECT 
                u.id, u.name, u.email, u.role, u.avatar, u.created_at,
                (SELECT COUNT(*) FROM project_members WHERE user_id = u.id) as project_count,
                (SELECT COUNT(*) FROM tasks WHERE assignee_id = u.id) as task_count
            FROM users u
            WHERE 1=1
        `;
        const params: any[] = [];

        if (role) {
            query += ' AND u.role = ?';
            params.push(role);
        }

        query += ' ORDER BY u.created_at DESC';

        const [rows] = await pool.query<RowDataPacket[]>(query, params);

        return NextResponse.json({ success: true, data: rows });
    } catch (error) {
        console.error('取得使用者錯誤:', error);
        return NextResponse.json({ success: false, error: '取得使用者失敗' }, { status: 500 });
    }
}

// 建立使用者
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, email, password, role } = body;

        if (!name || !email || !password) {
            return NextResponse.json({ success: false, error: '姓名、Email 和密碼必填' }, { status: 400 });
        }

        // 檢查 email 是否已存在
        const [existing] = await pool.query<RowDataPacket[]>(
            'SELECT id FROM users WHERE email = ?',
            [email]
        );

        if (existing.length > 0) {
            return NextResponse.json({ success: false, error: 'Email 已存在' }, { status: 400 });
        }

        // 加密密碼
        const hashedPassword = await bcrypt.hash(password, 10);

        const [result] = await pool.query<ResultSetHeader>(
            'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
            [name, email, hashedPassword, role || 'member']
        );

        return NextResponse.json({
            success: true,
            data: { id: result.insertId },
            message: '使用者建立成功'
        });
    } catch (error) {
        console.error('建立使用者錯誤:', error);
        return NextResponse.json({ success: false, error: '建立使用者失敗' }, { status: 500 });
    }
}