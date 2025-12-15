import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET /api/calendar/[id] - 獲取單一事件
export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        
        const [rows]: any = await pool.execute(
            `SELECT ce.*, p.name as project_name 
             FROM calendar_events ce 
             LEFT JOIN projects p ON ce.project_id = p.id 
             WHERE ce.id = ?`,
            [id]
        );

        if (rows.length === 0) {
            return NextResponse.json({
                success: false,
                error: '事件不存在'
            }, { status: 404 });
        }

        const row = rows[0];
        
        return NextResponse.json({
            success: true,
            data: {
                id: row.id,
                title: row.title,
                description: row.description,
                start_time: row.start_time,
                end_time: row.end_time,
                event_type: row.event_type,
                project_id: row.project_id,
                project_name: row.project_name,
                location: row.location,
                color: row.color,
                all_day: row.all_day === 1,
                created_at: row.created_at,
                updated_at: row.updated_at,
                participants: []
            }
        });

    } catch (error) {
        console.error('獲取單一事件錯誤:', error);
        return NextResponse.json({
            success: false,
            error: '獲取事件失敗: ' + (error as Error).message
        }, { status: 500 });
    }
}

// PUT /api/calendar/[id] - 更新事件
export async function PUT(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        const body = await request.json();

        // 驗證必要欄位
        const requiredFields = ['title', 'start_time', 'end_time', 'event_type'];
        for (const field of requiredFields) {
            if (!body[field]) {
                return NextResponse.json({
                    success: false,
                    error: `缺少必要欄位: ${field}`
                }, { status: 400 });
            }
        }

        // 檢查事件是否存在
        const [checkRows]: any = await pool.execute(
            'SELECT id FROM calendar_events WHERE id = ?',
            [id]
        );

        if (checkRows.length === 0) {
            return NextResponse.json({
                success: false,
                error: '事件不存在'
            }, { status: 404 });
        }

        // 更新事件
        await pool.execute(
            `UPDATE calendar_events SET 
                title = ?,
                description = ?,
                start_time = ?,
                end_time = ?,
                event_type = ?,
                project_id = ?,
                location = ?,
                color = ?,
                all_day = ?,
                updated_at = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [
                body.title,
                body.description || null,
                new Date(body.start_time),
                new Date(body.end_time),
                body.event_type,
                body.project_id || null,
                body.location || null,
                body.color || null,
                body.all_day ? 1 : 0,
                id
            ]
        );

        return NextResponse.json({
            success: true,
            message: '事件更新成功',
            data: {
                id,
                ...body
            }
        });

    } catch (error) {
        console.error('更新事件錯誤:', error);
        return NextResponse.json({
            success: false,
            error: '更新事件失敗: ' + (error as Error).message
        }, { status: 500 });
    }
}

// DELETE /api/calendar/[id] - 刪除事件
export async function DELETE(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;

        // 檢查事件是否存在
        const [checkRows]: any = await pool.execute(
            'SELECT id FROM calendar_events WHERE id = ?',
            [id]
        );

        if (checkRows.length === 0) {
            return NextResponse.json({
                success: false,
                error: '事件不存在'
            }, { status: 404 });
        }

        // 刪除事件
        await pool.execute(
            'DELETE FROM calendar_events WHERE id = ?',
            [id]
        );

        return NextResponse.json({
            success: true,
            message: '事件刪除成功'
        });

    } catch (error) {
        console.error('刪除事件錯誤:', error);
        return NextResponse.json({
            success: false,
            error: '刪除事件失敗: ' + (error as Error).message
        }, { status: 500 });
    }
}