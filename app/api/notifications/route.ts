import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth';
import pool from '@/lib/db';

// GET - 獲取通知列表
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        
        if (!session || !session.user) {
            return NextResponse.json({
                success: false,
                error: '未授權'
            }, { status: 401 });
        }

        const userId = (session.user as any).id;
        
        if (!userId) {
            return NextResponse.json({
                success: false,
                error: '無法取得使用者 ID'
            }, { status: 401 });
        }

        // 獲取所有通知
        const [rows]: any = await pool.execute(
            'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 20',
            [userId]
        );

        // 獲取未讀通知數量
        const [unreadResult]: any = await pool.execute(
            'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = FALSE',
            [userId]
        );

        const unreadCount = unreadResult[0]?.count || 0;

        return NextResponse.json({
            success: true,
            data: rows.map((row: any) => ({
                id: row.id,
                user_id: row.user_id,
                type: row.type,
                title: row.title,
                content: row.content || '',
                link: row.link || '',
                is_read: row.is_read === 1 || row.is_read === true,
                created_at: row.created_at
            })),
            unreadCount: unreadCount
        });

    } catch (error: any) {
        console.error('獲取通知錯誤:', error);
        
        if (error.code === 'ER_NO_SUCH_TABLE') {
            return NextResponse.json({
                success: true,
                data: [],
                unreadCount: 0
            });
        }
        
        return NextResponse.json({
            success: false,
            error: '獲取通知失敗: ' + error.message
        }, { status: 500 });
    }
}

// PUT - 標記通知已讀
export async function PUT(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        
        if (!session || !session.user) {
            return NextResponse.json({
                success: false,
                error: '未授權'
            }, { status: 401 });
        }

        const userId = (session.user as any).id;
        
        if (!userId) {
            return NextResponse.json({
                success: false,
                error: '無法取得使用者 ID'
            }, { status: 401 });
        }

        const body = await request.json();

        if (body.markAll) {
            await pool.execute(
                'UPDATE notifications SET is_read = TRUE WHERE user_id = ?',
                [userId]
            );
        } else if (body.id) {
            await pool.execute(
                'UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?',
                [body.id, userId]
            );
        }

        return NextResponse.json({
            success: true,
            message: '已標記為已讀'
        });

    } catch (error: any) {
        console.error('標記已讀錯誤:', error);
        return NextResponse.json({
            success: false,
            error: '標記已讀失敗: ' + error.message
        }, { status: 500 });
    }
}