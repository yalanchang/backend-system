import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const status = searchParams.get('status');
        const priority = searchParams.get('priority');

        let query = `
            SELECT 
                p.*,
                u.name as owner_name,
                (SELECT COUNT(*) FROM tasks WHERE project_id = p.id) as task_count,
                (SELECT COUNT(*) FROM tasks WHERE project_id = p.id AND status = 'done') as completed_tasks
            FROM projects p
            LEFT JOIN users u ON p.owner_id = u.id
            WHERE 1=1
        `;
        const params: any[] = [];

        if (status) {
            query += ' AND p.status = ?';
            params.push(status);
        }

        if (priority) {
            query += ' AND p.priority = ?';
            params.push(priority);
        }

        query += ' ORDER BY p.created_at DESC';

        const [rows] = await pool.query<RowDataPacket[]>(query, params);

        return NextResponse.json({ success: true, data: rows });
    } catch (error) {
        console.error('取得專案錯誤:', error);
        return NextResponse.json({ success: false, error: '取得專案失敗' }, { status: 500 });
    }
}

// 建立專案
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, description, status, priority, start_date, end_date, budget, owner_id } = body;

        if (!name) {
            return NextResponse.json({ success: false, error: '專案名稱必填' }, { status: 400 });
        }

        const [result] = await pool.query<ResultSetHeader>(
            `INSERT INTO projects (name, description, status, priority, start_date, end_date, budget, owner_id)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [name, description, status || 'planning', priority || 'medium', start_date, end_date, budget, owner_id]
        );

        return NextResponse.json({ 
            success: true, 
            data: { id: result.insertId },
            message: '專案建立成功'
        });
    } catch (error) {
        console.error('建立專案錯誤:', error);
        return NextResponse.json({ success: false, error: '建立專案失敗' }, { status: 500 });
    }
}