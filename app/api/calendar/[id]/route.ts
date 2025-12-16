import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> } 
) {
    try {
        const { id: eventId } = await params; 

        if (!eventId) {
            return NextResponse.json({
                success: false,
                error: '缺少事件 ID'
            }, { status: 400 });
        }

        const [events]: any = await pool.execute(
            `SELECT ce.*, p.name as project_name 
             FROM calendar_events ce 
             LEFT JOIN projects p ON ce.project_id = p.id 
             WHERE ce.id = ?`,
            [eventId]
        );

        if (events.length === 0) {
            return NextResponse.json({
                success: false,
                error: '事件不存在'
            }, { status: 404 });
        }

        const event = events[0];

        return NextResponse.json({
            success: true,
            data: {
                id: event.id,
                title: event.title,
                description: event.description || '',
                start_time: event.start_time,
                end_time: event.end_time,
                event_type: event.event_type,
                project_id: event.project_id || null,
                project_name: event.project_name || null,
                location: event.location || '',
                color: event.color || '#3B82F6',
                all_day: event.all_day === 1,
                created_at: event.created_at,
                updated_at: event.updated_at,
                participants: []
            }
        });

    } catch (error) {
        console.error('獲取事件錯誤:', error);
        return NextResponse.json({
            success: false,
            error: '獲取事件失敗'
        }, { status: 500 });
    }
}

// PUT - 更新事件
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }  
) {
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();
        
        const { id: eventId } = await params;  
        
        if (!eventId) {
            return NextResponse.json({
                success: false,
                error: '缺少事件 ID'
            }, { status: 400 });
        }

        const body = await request.json();
        
        const requiredFields = ['title', 'start_time', 'end_time', 'event_type'];
        for (const field of requiredFields) {
            if (!body[field]) {
                return NextResponse.json({
                    success: false,
                    error: `缺少必要欄位: ${field}`
                }, { status: 400 });
            }
        }

        const [existingEvents]: any = await connection.execute(
            'SELECT id FROM calendar_events WHERE id = ?',
            [eventId]
        );

        if (existingEvents.length === 0) {
            await connection.rollback();
            return NextResponse.json({
                success: false,
                error: '事件不存在'
            }, { status: 404 });
        }

        const formatDateTime = (dateStr: string) => {
            const date = new Date(dateStr);
            return date.toISOString().slice(0, 19).replace('T', ' ');
        };

        await connection.execute(
            `UPDATE calendar_events 
             SET title = ?, 
                 description = ?, 
                 start_time = ?, 
                 end_time = ?, 
                 event_type = ?, 
                 project_id = ?, 
                 location = ?, 
                 color = ?, 
                 all_day = ?, 
                 updated_at = NOW()
             WHERE id = ?`,
            [
                body.title,
                body.description || null,
                formatDateTime(body.start_time),
                formatDateTime(body.end_time),
                body.event_type,
                body.project_id || null,
                body.location || null,
                body.color || null,
                body.all_day ? 1 : 0,
                eventId
            ]
        );

        const [updatedEvents]: any = await connection.execute(
            `SELECT ce.*, p.name as project_name 
             FROM calendar_events ce 
             LEFT JOIN projects p ON ce.project_id = p.id 
             WHERE ce.id = ?`,
            [eventId]
        );

        await connection.commit();

        return NextResponse.json({
            success: true,
            data: updatedEvents[0]
        });

    } catch (error: any) {
        await connection.rollback();
        console.error('更新事件錯誤:', error);
        return NextResponse.json({
            success: false,
            error: '更新事件失敗: ' + error.message
        }, { status: 500 });
    } finally {
        connection.release();
    }
}

// DELETE - 刪除事件
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }  
) {
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();
        
        const { id: eventId } = await params; 

        if (!eventId) {
            return NextResponse.json({
                success: false,
                error: '缺少事件 ID'
            }, { status: 400 });
        }

        const [existingEvents]: any = await connection.execute(
            'SELECT id FROM calendar_events WHERE id = ?',
            [eventId]
        );

        if (existingEvents.length === 0) {
            await connection.rollback();
            return NextResponse.json({
                success: false,
                error: '事件不存在'
            }, { status: 404 });
        }

        await connection.execute(
            'DELETE FROM calendar_events WHERE id = ?',
            [eventId]
        );

        await connection.commit();

        return NextResponse.json({
            success: true,
            message: '事件已刪除'
        });

    } catch (error: any) {
        await connection.rollback();
        console.error('刪除事件錯誤:', error);
        return NextResponse.json({
            success: false,
            error: '刪除事件失敗: ' + error.message
        }, { status: 500 });
    } finally {
        connection.release();
    }
}

// PATCH - 部分更新事件
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }  
) {
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();
        
        const { id: eventId } = await params;  

        if (!eventId) {
            return NextResponse.json({
                success: false,
                error: '缺少事件 ID'
            }, { status: 400 });
        }

        const body = await request.json();

        const [existingEvents]: any = await connection.execute(
            'SELECT id FROM calendar_events WHERE id = ?',
            [eventId]
        );

        if (existingEvents.length === 0) {
            await connection.rollback();
            return NextResponse.json({
                success: false,
                error: '事件不存在'
            }, { status: 404 });
        }

        const updateFields: string[] = [];
        const updateValues: any[] = [];

        const allowedFields = [
            'title', 'description', 'start_time', 'end_time',
            'event_type', 'project_id', 'location', 'color', 'all_day'
        ];

        allowedFields.forEach(field => {
            if (body[field] !== undefined) {
                updateFields.push(`${field} = ?`);
                if (field === 'start_time' || field === 'end_time') {
                    updateValues.push(new Date(body[field]).toISOString().slice(0, 19).replace('T', ' '));
                } else if (field === 'all_day') {
                    updateValues.push(body[field] ? 1 : 0);
                } else {
                    updateValues.push(body[field] === '' ? null : body[field]);
                }
            }
        });

        if (updateFields.length === 0) {
            await connection.rollback();
            return NextResponse.json({
                success: false,
                error: '沒有提供要更新的欄位'
            }, { status: 400 });
        }

        updateFields.push('updated_at = NOW()');

        await connection.execute(
            `UPDATE calendar_events SET ${updateFields.join(', ')} WHERE id = ?`,
            [...updateValues, eventId]
        );

        await connection.commit();

        const [updatedEvents]: any = await pool.execute(
            `SELECT ce.*, p.name as project_name 
             FROM calendar_events ce 
             LEFT JOIN projects p ON ce.project_id = p.id 
             WHERE ce.id = ?`,
            [eventId]
        );

        return NextResponse.json({
            success: true,
            data: updatedEvents[0]
        });

    } catch (error: any) {
        await connection.rollback();
        console.error('部分更新事件錯誤:', error);
        return NextResponse.json({
            success: false,
            error: '更新事件失敗: ' + error.message
        }, { status: 500 });
    } finally {
        connection.release();
    }
}