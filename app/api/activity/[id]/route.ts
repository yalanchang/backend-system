import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { logActivity } from '@/lib/activity-server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET - 取得事件與參與者名單
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT ce.*, p.name as project_name, u.name as created_by_name
       FROM calendar_events ce
       LEFT JOIN projects p ON ce.project_id = p.id
       LEFT JOIN users u ON ce.created_by = u.id
       WHERE ce.id = ?`, [id]
    );
    
    if (rows.length === 0) {
      return NextResponse.json({ success: false, error: '找不到事件' }, { status: 404 });
    }
    
    const [participants] = await pool.query<RowDataPacket[]>(
      `SELECT ep.*, u.name as user_name, u.email as user_email
       FROM event_participants ep
       JOIN users u ON ep.user_id = u.id
       WHERE ep.event_id = ?`, [id]
    );
    
    const data = {
      ...rows[0],
      all_day: !!rows[0].all_day,
      participants: participants
    };
    
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ success: false, error: '資料讀取失敗' }, { status: 500 });
  }
}

// PUT - 更新事件及其參與者名單
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const connection = await pool.getConnection();
  try {
    const { id } = await params;
    const body = await request.json();
    const { title, description, start_time, end_time, all_day, project_id, location, color, participants } = body;

    const session = await getServerSession(authOptions);

    // 取得舊資料
    const [oldRows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM calendar_events WHERE id = ?', [id]
    );

    await connection.beginTransaction();

    await connection.query(
      `UPDATE calendar_events SET 
        title=?, description=?, start_time=?, end_time=?, all_day=?, 
        project_id=?, location=?, color=?, updated_at=CURRENT_TIMESTAMP 
       WHERE id=?`,
      [title, description, start_time, end_time, all_day ? 1 : 0, project_id, location, color, id]
    );

    if (participants && Array.isArray(participants)) {
      await connection.query('DELETE FROM event_participants WHERE event_id = ?', [id]);
      if (participants.length > 0) {
        const values = participants.map((p: any) => [id, p.user_id, p.status || 'pending']);
        await connection.query('INSERT INTO event_participants (event_id, user_id, status) VALUES ?', [values]);
      }
    }

    await connection.commit();

    // 記錄活動
    await logActivity({
      action: 'update',
      description: `更新行事曆事件「${title}」`,
      entity_type: 'calendar_event',
      entity_id: id,
      user_id: (session?.user as any)?.id || 'unknown',
      user_name: session?.user?.name || undefined,
      old_values: oldRows[0] || null,
      new_values: { title, description, start_time, end_time, all_day, project_id, location, color },
    });

    return NextResponse.json({ success: true, message: '更新成功' });
  } catch (error) {
    await connection.rollback();
    return NextResponse.json({ success: false, error: '更新失敗' }, { status: 500 });
  } finally {
    connection.release();
  }
}

// DELETE
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    // 取得舊資料
    const [oldRows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM calendar_events WHERE id = ?', [id]
    );

    const [result] = await pool.query<ResultSetHeader>(
      'DELETE FROM calendar_events WHERE id = ?', [id]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ success: false, error: '找不到該事件' }, { status: 404 });
    }

    // 記錄活動
    await logActivity({
      action: 'delete',
      description: `刪除行事曆事件「${oldRows[0]?.title}」`,
      entity_type: 'calendar_event',
      entity_id: id,
      user_id: (session?.user as any)?.id || 'unknown',
      user_name: session?.user?.name || undefined,
      old_values: oldRows[0] || null,
    });

    return NextResponse.json({ success: true, message: '刪除成功，相關參與者已一併移除' });
  } catch (error) {
    return NextResponse.json({ success: false, error: '刪除失敗' }, { status: 500 });
  }
}