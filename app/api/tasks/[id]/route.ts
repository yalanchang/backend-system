import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// 取得單一任務
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    try {
        const [rows] = await pool.query<RowDataPacket[]>(
            `SELECT t.*, p.name as project_name, u.name as assignee_name
             FROM tasks t
             LEFT JOIN projects p ON t.project_id = p.id
             LEFT JOIN users u ON t.assignee_id = u.id
             WHERE t.id = ?`,
            [id]
        );

        if (rows.length === 0) {
            return NextResponse.json({ success: false, error: '任務不存在' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: rows[0] });
    } catch (error) {
        return NextResponse.json({ success: false, error: '取得任務失敗' }, { status: 500 });
    }
}

// 更新任務
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    try {
        const body = await request.json();
        const { project_id, title, description, status, priority, assignee_id, due_date, estimated_hours, actual_hours } = body;

        await pool.query<ResultSetHeader>(
            `UPDATE tasks SET 
                project_id = COALESCE(?, project_id),
                title = COALESCE(?, title),
                description = ?,
                status = COALESCE(?, status),
                priority = COALESCE(?, priority),
                assignee_id = ?,
                due_date = ?,
                estimated_hours = ?,
                actual_hours = ?
             WHERE id = ?`,
            [project_id, title, description, status, priority, assignee_id || null, due_date || null, estimated_hours || null, actual_hours || null, id]
        );

        return NextResponse.json({ success: true, message: '任務更新成功' });
    } catch (error) {
        return NextResponse.json({ success: false, error: '更新任務失敗' }, { status: 500 });
    }
}

// 刪除任務
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    try {
        await pool.query<ResultSetHeader>('DELETE FROM tasks WHERE id = ?', [id]);
        return NextResponse.json({ success: true, message: '任務刪除成功' });
    } catch (error) {
        return NextResponse.json({ success: false, error: '刪除任務失敗' }, { status: 500 });
    }
}