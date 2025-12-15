import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// 取得單一專案
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    try {
        const [rows] = await pool.query<RowDataPacket[]>(
            `SELECT p.*, u.name as owner_name
             FROM projects p
             LEFT JOIN users u ON p.owner_id = u.id
             WHERE p.id = ?`,
            [id]
        );

        if (rows.length === 0) {
            return NextResponse.json({ success: false, error: '專案不存在' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: rows[0] });
    } catch (error) {
        return NextResponse.json({ success: false, error: '取得專案失敗' }, { status: 500 });
    }
}

// 更新專案
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    try {
        const body = await request.json();
        const { name, description, status, priority, start_date, end_date, budget, owner_id } = body;

        await pool.query<ResultSetHeader>(
            `UPDATE projects SET 
                name = ?, description = ?, status = ?, priority = ?,
                start_date = ?, end_date = ?, budget = ?, owner_id = ?
             WHERE id = ?`,
            [name, description, status, priority, start_date, end_date, budget, owner_id, id]
        );

        return NextResponse.json({ success: true, message: '專案更新成功' });
    } catch (error) {
        return NextResponse.json({ success: false, error: '更新專案失敗' }, { status: 500 });
    }
}

// 刪除專案
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    try {
        await pool.query<ResultSetHeader>('DELETE FROM projects WHERE id = ?', [id]);
        return NextResponse.json({ success: true, message: '專案刪除成功' });
    } catch (error) {
        return NextResponse.json({ success: false, error: '刪除專案失敗' }, { status: 500 });
    }
}