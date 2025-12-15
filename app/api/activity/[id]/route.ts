import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { CalendarEvent } from '@/lib/types';

// GET - 取得單一事件
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT 
        ce.*,
        p.name as project_name,
        u.name as created_by_name
       FROM calendar_events ce
       LEFT JOIN projects p ON ce.project_id = p.id
       LEFT JOIN users u ON ce.created_by = u.id
       WHERE ce.id = ?`,
      [id]
    );
    
    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, error: '事件不存在' },
        { status: 404 }
      );
    }
    
    // 取得參與者
    const [participants] = await pool.query<RowDataPacket[]>(
      `SELECT 
        ep.*,
        u.name as user_name,
        u.email as user_email
       FROM event_participants ep
       LEFT JOIN users u ON ep.user_id = u.id
       WHERE ep.event_id = ?`,
      [id]
    );
    
    const event = {
      ...rows[0],
      all_day: Boolean(rows[0].all_day),
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
    
    return NextResponse.json({
      success: true,
      data: event as CalendarEvent
    });
    
  } catch (error) {
    console.error('GET 單一事件錯誤:', error);
    return NextResponse.json(
      { success: false, error: '取得事件失敗' },
      { status: 500 }
    );
  }
}

// PUT - 更新事件
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    const {
      title,
      description,
      start_time,
      end_time,
      all_day = false,
      event_type,
      entity_type = 'none',
      entity_id,
      project_id,
      location,
      color,
      recurrence_rule
    } = body;
    
    // 檢查事件是否存在
    const [checkRows] = await pool.query<RowDataPacket[]>(
      'SELECT id FROM calendar_events WHERE id = ?',
      [id]
    );
    
    if (checkRows.length === 0) {
      return NextResponse.json(
        { success: false, error: '事件不存在' },
        { status: 404 }
      );
    }
    
    // 更新事件
    const [result] = await pool.query<ResultSetHeader>(
      `UPDATE calendar_events SET 
        title = ?, description = ?, start_time = ?, end_time = ?,
        all_day = ?, event_type = ?, entity_type = ?, entity_id = ?,
        project_id = ?, location = ?, color = ?, recurrence_rule = ?,
        updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        title,
        description || null,
        start_time,
        end_time,
        all_day,
        event_type,
        entity_type,
        entity_id || null,
        project_id || null,
        location || null,
        color || null,
        recurrence_rule || null,
        id
      ]
    );
    
    return NextResponse.json({
      success: true,
      message: '事件更新成功'
    });
    
  } catch (error) {
    console.error('PUT 事件錯誤:', error);
    return NextResponse.json(
      { success: false, error: '更新事件失敗' },
      { status: 500 }
    );
  }
}

// DELETE - 刪除事件
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // 檢查事件是否存在
    const [checkRows] = await pool.query<RowDataPacket[]>(
      'SELECT id FROM calendar_events WHERE id = ?',
      [id]
    );
    
    if (checkRows.length === 0) {
      return NextResponse.json(
        { success: false, error: '事件不存在' },
        { status: 404 }
      );
    }
    
    // 刪除事件（會級聯刪除參與者）
    await pool.query<ResultSetHeader>(
      'DELETE FROM calendar_events WHERE id = ?',
      [id]
    );
    
    return NextResponse.json({
      success: true,
      message: '事件刪除成功'
    });
    
  } catch (error) {
    console.error('DELETE 事件錯誤:', error);
    return NextResponse.json(
      { success: false, error: '刪除事件失敗' },
      { status: 500 }
    );
  }
}