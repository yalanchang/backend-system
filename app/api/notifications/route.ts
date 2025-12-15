import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// 取得通知
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ success: false, error: '請先登入' }, { status: 401 });
        }

        const searchParams = request.nextUrl.searchParams;
        const unreadOnly = searchParams.get('unread') === 'true';

        let query = 'SELECT * FROM notifications WHERE user_id = ?';
        const params: any[] = [(session.user as any).id];

        if (unreadOnly) {
            query += ' AND is_read = FALSE';
        }

        query += ' ORDER BY created_at DESC LIMIT 50';

        const [rows] = await pool.query<RowDataPacket[]>(query, params);

        // 取得未讀數量
        const [countResult] = await pool.query<RowDataPacket[]>(
            'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = FALSE',
            [(session.user as any).id]
        );

        return NextResponse.json({
            success: true,
            data: rows,
            unreadCount: countResult[0].count
        });
    } catch (error) {
        return NextResponse.json({ success: false, error: '取得通知失敗' }, { status: 500 });
    }
}

// 標記已讀
export async function PUT(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ success: false, error: '請先登入' }, { status: 401 });
        }

        const body = await request.json();
        const { id, markAll } = body;

        if (markAll) {
            await pool.query<ResultSetHeader>(
                'UPDATE notifications SET is_read = TRUE WHERE user_id = ?',
                [(session.user as any).id]
            );
        } else if (id) {
            await pool.query<ResultSetHeader>(
                'UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?',
                [id, (session.user as any).id]
            );
        }

        return NextResponse.json({ success: true, message: '已標記為已讀' });
    } catch (error) {
        return NextResponse.json({ success: false, error: '更新失敗' }, { status: 500 });
    }
}