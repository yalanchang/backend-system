import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import bcrypt from 'bcryptjs';

// 取得單一使用者
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    try {
        const [rows] = await pool.query<RowDataPacket[]>(
            'SELECT id, name, email, role, avatar, created_at FROM users WHERE id = ?',
            [id]
        );

        if (rows.length === 0) {
            return NextResponse.json({ success: false, error: '使用者不存在' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: rows[0] });
    } catch (error) {
        return NextResponse.json({ success: false, error: '取得使用者失敗' }, { status: 500 });
    }
}

// 更新使用者
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    try {
        const body = await request.json();
        const { name, email, password, role } = body;

        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            await pool.query<ResultSetHeader>(
                'UPDATE users SET name = ?, email = ?, password = ?, role = ? WHERE id = ?',
                [name, email, hashedPassword, role, id]
            );
        } else {
            await pool.query<ResultSetHeader>(
                'UPDATE users SET name = ?, email = ?, role = ? WHERE id = ?',
                [name, email, role, id]
            );
        }

        return NextResponse.json({ success: true, message: '使用者更新成功' });
    } catch (error) {
        return NextResponse.json({ success: false, error: '更新使用者失敗' }, { status: 500 });
    }
}

// 刪除使用者
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    try {
        await pool.query<ResultSetHeader>('DELETE FROM users WHERE id = ?', [id]);
        return NextResponse.json({ success: true, message: '使用者刪除成功' });
    } catch (error) {
        return NextResponse.json({ success: false, error: '刪除使用者失敗' }, { status: 500 });
    }
}