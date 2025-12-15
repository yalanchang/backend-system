import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET - 獲取行事曆事件
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const startDate = searchParams.get('start_date');
        const endDate = searchParams.get('end_date');
        const projectId = searchParams.get('project_id');
        const eventType = searchParams.get('event_type');
        const excludeTypes = searchParams.get('exclude_types');

        if (!startDate || !endDate) {
            return NextResponse.json({
                success: false,
                error: '缺少 start_date 或 end_date 參數'
            }, { status: 400 });
        }

        // 基礎查詢
        let query = `
            SELECT ce.*, p.name as project_name 
            FROM calendar_events ce 
            LEFT JOIN projects p ON ce.project_id = p.id 
            WHERE start_time >= ? AND end_time <= ?
        `;
        const params: any[] = [startDate, endDate];

        // 添加篩選條件
        if (projectId) {
            query += ' AND ce.project_id = ?';
            params.push(projectId);
        }

        if (eventType) {
            query += ' AND ce.event_type = ?';
            params.push(eventType);
        }

        if (excludeTypes) {
            const types = excludeTypes.split(',');
            if (types.length > 0) {
                query += ` AND ce.event_type NOT IN (${types.map(() => '?').join(',')})`;
                params.push(...types);
            }
        }

        query += ' ORDER BY start_time ASC';

        const [rows]: any = await pool.execute(query, params);

        return NextResponse.json({
            success: true,
            data: rows.map((row: any) => ({
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
            }))
        });

    } catch (error) {
        console.error('獲取行事曆事件錯誤:', error);
        return NextResponse.json({
            success: false,
            error: '獲取行事曆事件失敗: ' + (error as Error).message
        }, { status: 500 });
    }
}

// POST - 建立新事件
export async function POST(request: NextRequest) {
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();
        
        const body = await request.json();
        const eventId = require('uuid').v4();

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

        // 插入事件
        await connection.execute(
            `INSERT INTO calendar_events 
             (id, title, description, start_time, end_time, event_type, project_id, location, color, all_day) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                eventId,
                body.title,
                body.description || null,
                new Date(body.start_time),
                new Date(body.end_time),
                body.event_type,
                body.project_id || null,
                body.location || null,
                body.color || null,
                body.all_day ? 1 : 0
            ]
        );

        await connection.commit();

        return NextResponse.json({
            success: true,
            data: {
                id: eventId,
                title: body.title,
                description: body.description,
                start_time: body.start_time,
                end_time: body.end_time,
                event_type: body.event_type,
                project_id: body.project_id,
                location: body.location,
                color: body.color,
                all_day: body.all_day || false
            }
        });

    } catch (error) {
        await connection.rollback();
        console.error('建立事件錯誤:', error);
        return NextResponse.json({
            success: false,
            error: '建立事件失敗: ' + (error as Error).message
        }, { status: 500 });
    } finally {
        connection.release();
    }
}