import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// 取得任務
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const project_id = searchParams.get('project_id');
        const status = searchParams.get('status');
        const assignee_id = searchParams.get('assignee_id');

        let query = `
            SELECT 
                t.*,
                p.name as project_name,
                u.name as assignee_name
            FROM tasks t
            LEFT JOIN projects p ON t.project_id = p.id
            LEFT JOIN users u ON t.assignee_id = u.id
            WHERE 1=1
        `;
        const params: any[] = [];

        if (project_id) {
            query += ' AND t.project_id = ?';
            params.push(project_id);
        }

        if (status) {
            query += ' AND t.status = ?';
            params.push(status);
        }

        if (assignee_id) {
            query += ' AND t.assignee_id = ?';
            params.push(assignee_id);
        }

        query += ' ORDER BY t.due_date ASC, t.priority DESC';

        const [rows] = await pool.query<RowDataPacket[]>(query, params);

        return NextResponse.json({ success: true, data: rows });
    } catch (error) {
        console.error('取得任務錯誤:', error);
        return NextResponse.json({ success: false, error: '取得任務失敗' }, { status: 500 });
    }
}

// 建立任務
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { project_id, title, description, status, priority, assignee_id, due_date, estimated_hours } = body;

        if (!project_id || !title) {
            return NextResponse.json({ success: false, error: '專案和任務標題必填' }, { status: 400 });
        }

        const [result] = await pool.query<ResultSetHeader>(
            `INSERT INTO tasks (project_id, title, description, status, priority, assignee_id, due_date, estimated_hours)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [project_id, title, description, status || 'todo', priority || 'medium', assignee_id || null, due_date || null, estimated_hours || null]
        );

        return NextResponse.json({
            success: true,
            data: { id: result.insertId },
            message: '任務建立成功'
        });
    } catch (error) {
        console.error('建立任務錯誤:', error);
        return NextResponse.json({ success: false, error: '建立任務失敗' }, { status: 500 });
    }
}