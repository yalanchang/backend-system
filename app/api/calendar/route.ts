import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { CalendarEvent, CalendarQueryParams, CalendarEventFormData } from '@/lib/types';

// GET - 取得行事曆事件
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // 解析查詢參數
    const start_date = searchParams.get('start_date');
    const end_date = searchParams.get('end_date');
    const project_id = searchParams.get('project_id');
    const user_id = searchParams.get('user_id');
    const event_type = searchParams.get('event_type');
    
    if (!start_date || !end_date) {
      return NextResponse.json(
        { success: false, error: '必須提供 start_date 和 end_date 參數' },
        { status: 400 }
      );
    }
    
    // 建立查詢條件
    const conditions: string[] = [
      '(start_time <= ? AND end_time >= ?) OR (start_time BETWEEN ? AND ?)'
    ];
    const params: any[] = [end_date, start_date, start_date, end_date];
    
    if (project_id) {
      conditions.push('(ce.project_id = ? OR ce.entity_type = "project" AND ce.entity_id = ?)');
      params.push(project_id, project_id);
    }
    
    if (user_id) {
      conditions.push(`(
        ce.created_by = ? 
        OR ce.id IN (SELECT event_id FROM event_participants WHERE user_id = ?)
      )`);
      params.push(user_id, user_id);
    }
    
    if (event_type) {
      conditions.push('ce.event_type = ?');
      params.push(event_type);
    }
    
    const whereClause = conditions.length > 0 
      ? `WHERE ${conditions.join(' AND ')}` 
      : '';
    
    // 查詢事件
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT 
        ce.*,
        p.name as project_name,
        u.name as created_by_name
       FROM calendar_events ce
       LEFT JOIN projects p ON ce.project_id = p.id
       LEFT JOIN users u ON ce.created_by = u.id
       ${whereClause}
       ORDER BY ce.start_time ASC`,
      params
    );
    
    // 查詢每個事件的參與者
    const events = await Promise.all(
      rows.map(async (row) => {
        const [participants] = await pool.query<RowDataPacket[]>(
          `SELECT 
            ep.*,
            u.name as user_name,
            u.email as user_email
           FROM event_participants ep
           LEFT JOIN users u ON ep.user_id = u.id
           WHERE ep.event_id = ?`,
          [row.id]
        );
        
        return {
          ...row,
          all_day: Boolean(row.all_day),
          participants: participants.map(p => ({
            id: p.id,
            event_id: p.event_id,
            user_id: p.user_id,
            user_name: p.user_name,
            user_email: p.user_email,
            status: p.status,
            response_note: p.response_note,
            responded_at: p.responded_at
          }))
        };
      })
    );
    
    return NextResponse.json({
      success: true,
      data: events as CalendarEvent[]
    });
    
  } catch (error) {
    console.error('GET 行事曆事件錯誤:', error);
    return NextResponse.json(
      { success: false, error: '取得行事曆事件失敗' },
      { status: 500 }
    );
  }
}


export async function POST(request: NextRequest) {
    try {
      const body = await request.json();
      console.log('收到請求:', JSON.stringify(body, null, 2));
      
      const {
        title,
        description,
        start_time,
        end_time,
        all_day = false,
        event_type = 'custom',
        project_id,
        location,
        color
      } = body;
  
      // 基本驗證
      if (!title?.trim()) {
        return NextResponse.json(
          { success: false, error: '事件標題不能為空' },
          { status: 400 }
        );
      }
  
      if (!start_time || !end_time) {
        return NextResponse.json(
          { success: false, error: '必須提供開始和結束時間' },
          { status: 400 }
        );
      }
  
      // 檢查時間是否有效
      const startTime = new Date(start_time);
      const endTime = new Date(end_time);
      
      if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
        return NextResponse.json(
          { success: false, error: '時間格式錯誤' },
          { status: 400 }
        );
      }
  
      if (startTime >= endTime) {
        return NextResponse.json(
          { success: false, error: '結束時間必須晚於開始時間' },
          { status: 400 }
        );
      }
  
      // 準備資料
      const eventId = crypto.randomUUID();
      const currentUserId = 'user-001'; // 測試用
      
      const eventData = {
        id: eventId,
        title: title.trim(),
        description: description?.trim() || null,
        start_time: startTime.toISOString().slice(0, 19).replace('T', ' '),
        end_time: endTime.toISOString().slice(0, 19).replace('T', ' '),
        all_day: all_day ? 1 : 0,
        event_type: event_type,
        project_id: project_id || null,
        location: location?.trim() || null,
        color: color || getDefaultColor(event_type),
        created_by: currentUserId
      };
  
      console.log('準備插入的資料:', eventData);
  
      // 執行 SQL
      const query = `
        INSERT INTO calendar_events 
          (id, title, description, start_time, end_time, all_day, 
           event_type, project_id, location, color, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
  
      const params = [
        eventData.id,
        eventData.title,
        eventData.description,
        eventData.start_time,
        eventData.end_time,
        eventData.all_day,
        eventData.event_type,
        eventData.project_id,
        eventData.location,
        eventData.color,
        eventData.created_by
      ];
  
      console.log('執行 SQL:', query);
      console.log('參數:', params);
  
      const [result] = await pool.query(query, params);
      console.log('插入結果:', result);
  
      // 取得剛建立的資料
      const [rows] = await pool.query(
        'SELECT * FROM calendar_events WHERE id = ?',
        [eventId]
      );
  
      const event = {
        ...(rows as any)[0],
        all_day: Boolean((rows as any)[0].all_day)
      };
  
      return NextResponse.json({
        success: true,
        message: '事件建立成功',
        data: event
      });
  
    } catch (error: any) {
      console.error('建立事件錯誤詳細資訊:', {
        message: error.message,
        code: error.code,
        sqlMessage: error.sqlMessage,
        sql: error.sql,
        stack: error.stack
      });
  
      return NextResponse.json(
        {
          success: false,
          error: '建立事件失敗',
          details: error.sqlMessage || error.message,
          code: error.code
        },
        { status: 500 }
      );
    }
  }
  
  // 輔助函數
  function getDefaultColor(eventType: string): string {
    const colors: Record<string, string> = {
      meeting: '#3B82F6',
      task: '#10B981',
      milestone: '#8B5CF6',
      reminder: '#F59E0B',
      holiday: '#EF4444',
      custom: '#6B7280'
    };
    return colors[eventType] || '#6B7280';
  }