import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// 取得任務評論
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    try {
        const [rows] = await pool.query<RowDataPacket[]>(
            `SELECT c.*, u.name as user_name, u.avatar as user_avatar
             FROM comments c
             LEFT JOIN users u ON c.user_id = u.id
             WHERE c.task_id = ?
             ORDER BY c.created_at DESC`,
            [id]
        );

        return NextResponse.json({ success: true, data: rows });
    } catch (error) {
        return NextResponse.json({ success: false, error: '取得評論失敗' }, { status: 500 });
    }
}

// 新增評論
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ success: false, error: '請先登入' }, { status: 401 });
        }

        const body = await request.json();
        const { content } = body;

        if (!content?.trim()) {
            return NextResponse.json({ success: false, error: '評論內容不能為空' }, { status: 400 });
        }

        const [result] = await pool.query<ResultSetHeader>(
            'INSERT INTO comments (task_id, user_id, content) VALUES (?, ?, ?)',
            [id, (session.user as any).id, content]
        );

        // 記錄活動
        await pool.query(
            `INSERT INTO activity_logs (user_id, action, entity_type, entity_id, description)
             VALUES (?, 'comment', 'task', ?, ?)`,
            [(session.user as any).id, id, `新增了評論`]
        );

        // 取得任務資訊，發送通知給負責人
        const [tasks] = await pool.query<RowDataPacket[]>(
            'SELECT assignee_id, title FROM tasks WHERE id = ?',
            [id]
        );

        if (tasks.length > 0 && tasks[0].assignee_id && tasks[0].assignee_id !== (session.user as any).id) {
            await pool.query(
                `INSERT INTO notifications (user_id, type, title, content, link)
                 VALUES (?, 'task_comment', ?, ?, ?)`,
                [
                    tasks[0].assignee_id,
                    '新評論',
                    `${session.user.name} 在任務「${tasks[0].title}」新增了評論`,
                    `/tasks/${id}`
                ]
            );
        }

        return NextResponse.json({
            success: true,
            data: { id: result.insertId },
            message: '評論新增成功'
        });
    } catch (error) {
        console.error('新增評論錯誤:', error);
        return NextResponse.json({ success: false, error: '新增評論失敗' }, { status: 500 });
    }
}