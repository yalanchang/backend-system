import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { logActivity } from '@/lib/activity-server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const fieldNameMap: Record<string, string> = {
    project_id: '所屬專案',
    title: '標題',
    description: '描述',
    status: '狀態',
    priority: '優先級',
    assignee_id: '負責人',
    due_date: '截止日期',
    estimated_hours: '預估時數',
    actual_hours: '實際時數',
};

const statusMap: Record<string, string> = {
    todo: '待處理',
    in_progress: '進行中',
    review: '審核中',
    done: '已完成',
};

const priorityMap: Record<string, string> = {
    low: '低',
    medium: '中',
    high: '高',
    urgent: '緊急',
};

function formatValue(key: string, value: any): string {
    if (value === null || value === undefined) return '無';
    if (key === 'status') return statusMap[value] || value;
    if (key === 'priority') return priorityMap[value] || value;
    return String(value);
}

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
        const session = await getServerSession(authOptions);

        // 取得舊資料
        const [oldRows] = await pool.query<RowDataPacket[]>(
            'SELECT * FROM tasks WHERE id = ?', [id]
        );

        if (oldRows.length === 0) {
            return NextResponse.json({ success: false, error: '任務不存在' }, { status: 404 });
        }

        // 格式化舊資料
        const oldData = {
            project_id: oldRows[0].project_id ? Number(oldRows[0].project_id) : null,
            title: oldRows[0].title,
            description: oldRows[0].description || null,
            status: oldRows[0].status,
            priority: oldRows[0].priority,
            assignee_id: oldRows[0].assignee_id ? Number(oldRows[0].assignee_id) : null,
            due_date: oldRows[0].due_date
                ? new Date(oldRows[0].due_date).toISOString().split('T')[0]
                : null,
            estimated_hours: oldRows[0].estimated_hours ? Number(oldRows[0].estimated_hours) : null,
            actual_hours: oldRows[0].actual_hours ? Number(oldRows[0].actual_hours) : null,
        };

        // 前端沒送的欄位用舊值，避免誤判變更
        const newData = {
            project_id: project_id !== undefined ? (project_id ? Number(project_id) : null) : oldData.project_id,
            title: title !== undefined ? title : oldData.title,
            description: description !== undefined ? (description || null) : oldData.description,
            status: status !== undefined ? status : oldData.status,
            priority: priority !== undefined ? priority : oldData.priority,
            assignee_id: assignee_id !== undefined ? (assignee_id ? Number(assignee_id) : null) : oldData.assignee_id,
            due_date: due_date !== undefined ? (due_date || null) : oldData.due_date,
            estimated_hours: estimated_hours !== undefined ? (estimated_hours ? Number(estimated_hours) : null) : oldData.estimated_hours,
            actual_hours: actual_hours !== undefined ? (actual_hours ? Number(actual_hours) : null) : oldData.actual_hours,
        };

        // 找出實際變更的欄位
        const changes: Record<string, any> = {};
        Object.keys(newData).forEach(key => {
            const k = key as keyof typeof newData;
            if (JSON.stringify(oldData[k]) !== JSON.stringify(newData[k])) {
                changes[key] = { old: oldData[k], new: newData[k] };
            }
        });

        // 中文欄位名稱
        const changedFieldNames = Object.keys(changes)
            .map(k => fieldNameMap[k] || k)
            .join('、');

        const changeDesc = Object.keys(changes).length > 0
            ? `更新任務「${oldData.title}」的${changedFieldNames}`
            : `更新任務「${oldData.title}」`;

        // 中文化變更內容
        const chineseChanges: Record<string, any> = {};
        Object.keys(changes).forEach(key => {
            const label = fieldNameMap[key] || key;
            chineseChanges[label] = {
                old: formatValue(key, changes[key].old),
                new: formatValue(key, changes[key].new),
            };
        });

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

        await logActivity({
            action: 'update',
            description: changeDesc,
            entity_type: 'task',
            entity_id: id,
            user_id: (session?.user as any)?.id || 'unknown',
            user_name: session?.user?.name || undefined,
            old_values: Object.keys(changes).length > 0 ? oldData : null,
            new_values: Object.keys(changes).length > 0 ? newData : null,
            metadata: Object.keys(changes).length > 0 ? { changes: chineseChanges } : null,
        });

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
        const session = await getServerSession(authOptions);

        const [oldRows] = await pool.query<RowDataPacket[]>(
            'SELECT * FROM tasks WHERE id = ?', [id]
        );

        await pool.query<ResultSetHeader>('DELETE FROM tasks WHERE id = ?', [id]);

        await logActivity({
            action: 'delete',
            description: `刪除任務「${oldRows[0]?.title}」`,
            entity_type: 'task',
            entity_id: id,
            user_id: (session?.user as any)?.id || 'unknown',
            user_name: session?.user?.name || undefined,
            old_values: oldRows[0] || null,
        });

        return NextResponse.json({ success: true, message: '任務刪除成功' });
    } catch (error) {
        return NextResponse.json({ success: false, error: '刪除任務失敗' }, { status: 500 });
    }
}