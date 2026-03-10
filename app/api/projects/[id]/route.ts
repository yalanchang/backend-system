import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { Project } from '@/lib/types';
import { logActivity } from '@/lib/activity-server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// 取得單一專案
export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const { id } = await context.params;

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
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        const body = await request.json();
        const session = await getServerSession(authOptions);

        const { name, description, status, priority, start_date, end_date, budget, owner_id } = body;

        if (!name || !owner_id) {
            return NextResponse.json(
                {
                    success: false,
                    error: '缺少必要欄位',
                    validation_errors: [
                        ...(!name ? [{ field: 'name', message: '專案名稱不能為空' }] : []),
                        ...(!owner_id ? [{ field: 'owner_id', message: '必須選擇負責人' }] : [])
                    ]
                },
                { status: 400 }
            );
        }

        if (start_date && end_date) {
            const start = new Date(start_date);
            const end = new Date(end_date);
            if (start > end) {
                return NextResponse.json(
                    {
                        success: false,
                        error: '開始日期不能晚於結束日期',
                        validation_errors: [{ field: 'start_date', message: '開始日期不能晚於結束日期' }]
                    },
                    { status: 400 }
                );
            }
        }

        // 取得舊資料
        const [oldRows] = await pool.query<RowDataPacket[]>(
            'SELECT * FROM projects WHERE id = ?', [id]
        );

        if (oldRows.length === 0) {
            return NextResponse.json({ success: false, error: '專案不存在' }, { status: 404 });
        }

        // 格式化舊資料，跟前端格式一致
        const oldData = {
            name: oldRows[0].name,
            description: oldRows[0].description,
            status: oldRows[0].status,
            priority: oldRows[0].priority,
            start_date: oldRows[0].start_date
                ? new Date(oldRows[0].start_date).toISOString().split('T')[0]
                : null,
            end_date: oldRows[0].end_date
                ? new Date(oldRows[0].end_date).toISOString().split('T')[0]
                : null,
            budget: oldRows[0].budget ? Number(oldRows[0].budget) : null,
            owner_id: oldRows[0].owner_id ? Number(oldRows[0].owner_id) : null,
        };

        const newData = {
            name,
            description,
            status,
            priority,
            start_date,
            end_date,
            budget: budget ? Number(budget) : null,
            owner_id: owner_id ? Number(owner_id) : null,
        };

        // 找出實際變更的欄位
        const changes: Record<string, any> = {};
        Object.keys(newData).forEach(key => {
            const k = key as keyof typeof newData;
            if (JSON.stringify(oldData[k]) !== JSON.stringify(newData[k])) {
                changes[key] = { old: oldData[k], new: newData[k] };
            }
        });

        const changeDesc = Object.keys(changes).length > 0
            ? `更新專案「${name}」的 ${Object.keys(changes).join('、')}`
            : `更新專案「${name}」`;

        const [result] = await pool.query<ResultSetHeader>(
            `UPDATE projects SET 
              name = ?, description = ?, status = ?, priority = ?,
              start_date = ?, end_date = ?, budget = ?, owner_id = ?,
              updated_at = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [name, description || null, status || 'pending', priority || 'medium',
             start_date || null, end_date || null, budget || 0, owner_id, id]
        );

        if (result.affectedRows === 0) {
            return NextResponse.json({ success: false, error: '更新失敗' }, { status: 500 });
        }

        const [updatedRows] = await pool.query<RowDataPacket[]>(
            `SELECT p.*, u.name as owner_name
             FROM projects p
             LEFT JOIN users u ON p.owner_id = u.id
             WHERE p.id = ?`,
            [id]
        );

        await logActivity({
            action: 'update',
            description: changeDesc,
            entity_type: 'project',
            entity_id: id,
            user_id: (session?.user as any)?.id || 'unknown',
            user_name: session?.user?.name || undefined,
            old_values: Object.keys(changes).length > 0 ? oldData : null,
            new_values: Object.keys(changes).length > 0 ? newData : null,
            metadata: Object.keys(changes).length > 0 ? { changes } : null,
        });

        return NextResponse.json({ success: true, message: '專案更新成功', data: updatedRows[0] as Project });
    } catch (error) {
        console.error('PUT 專案錯誤:', error);
        if (error instanceof Error && error.message.includes('foreign key constraint')) {
            return NextResponse.json({ success: false, error: '指定的負責人不存在' }, { status: 400 });
        }
        return NextResponse.json({ success: false, error: '更新專案失敗' }, { status: 500 });
    }
}

// 刪除專案
export async function DELETE(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const { id } = await context.params;

    try {
        const session = await getServerSession(authOptions);

        const [oldRows] = await pool.query<RowDataPacket[]>(
            'SELECT * FROM projects WHERE id = ?', [id]
        );

        await pool.query<ResultSetHeader>('DELETE FROM projects WHERE id = ?', [id]);

        await logActivity({
            action: 'delete',
            description: `刪除專案「${oldRows[0]?.name}」`,
            entity_type: 'project',
            entity_id: id,
            user_id: (session?.user as any)?.id || 'unknown',
            user_name: session?.user?.name || undefined,
            old_values: oldRows[0] || null,
        });

        return NextResponse.json({ success: true, message: '專案刪除成功' });
    } catch (error) {
        return NextResponse.json({ success: false, error: '刪除專案失敗' }, { status: 500 });
    }
}