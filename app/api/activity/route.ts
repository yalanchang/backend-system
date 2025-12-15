import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { ActivityLog, PaginatedResponse, ApiResponse } from '@/lib/types';

// GET - 取得活動紀錄列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // 取得查詢參數
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;
    
    const entityType = searchParams.get('entity_type');
    const entityId = searchParams.get('entity_id');
    const userId = searchParams.get('user_id');
    const action = searchParams.get('action');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const search = searchParams.get('search');
    
    // 建立查詢條件
    const conditions: string[] = [];
    const params: any[] = [];
    
    if (entityType) {
      conditions.push('entity_type = ?');
      params.push(entityType);
    }
    
    if (entityId) {
      conditions.push('entity_id = ?');
      params.push(entityId);
    }
    
    if (userId) {
      conditions.push('user_id = ?');
      params.push(userId);
    }
    
    if (action) {
      conditions.push('action = ?');
      params.push(action);
    }
    
    if (startDate) {
      conditions.push('created_at >= ?');
      params.push(startDate);
    }
    
    if (endDate) {
      conditions.push('created_at <= ?');
      params.push(endDate);
    }
    
    if (search) {
      conditions.push('(description LIKE ? OR user_name LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }
    
    const whereClause = conditions.length > 0 
      ? `WHERE ${conditions.join(' AND ')}` 
      : '';
    
    // 取得總數
    const [countRows] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) as total FROM activity_logs ${whereClause}`,
      params
    );
    const total = countRows[0].total;
    
    // 取得資料
 const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT 
        id, action, description, entity_type, entity_id,
        user_id, user_name, ip_address, user_agent,
        COALESCE(old_values, '{}') as old_values,
        COALESCE(new_values, '{}') as new_values,
        COALESCE(metadata, '{}') as metadata,
        created_at
       FROM activity_logs 
       ${whereClause}
       ORDER BY created_at DESC 
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );
    
    // 格式化資料
    const activities = rows.map(row => ({
      ...row,
      old_values: row.old_values ? JSON.parse(row.old_values) : null,
      new_values: row.new_values ? JSON.parse(row.new_values) : null,
      metadata: row.metadata ? JSON.parse(row.metadata) : null
    }));
    
    const response: PaginatedResponse<ActivityLog> = {
      data: activities as ActivityLog[],
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
        has_next: page * limit < total,
        has_prev: page > 1
      }
    };
    
    return NextResponse.json({
      success: true,
      data: response
    });
    
  } catch (error) {
    console.error('GET 活動紀錄錯誤:', error);
    return NextResponse.json(
      { success: false, error: '取得活動紀錄失敗' },
      { status: 500 }
    );
  }
}

// POST - 建立新的活動紀錄（系統內部使用）
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      action,
      description,
      entity_type,
      entity_id,
      user_id,
      user_name,
      ip_address,
      user_agent,
      old_values,
      new_values,
      metadata
    } = body;
    
    // 驗證必填欄位
    if (!action || !description || !entity_type || !entity_id || !user_id) {
      return NextResponse.json(
        { success: false, error: '缺少必要欄位' },
        { status: 400 }
      );
    }
    
    const [result] = await pool.query(
      `INSERT INTO activity_logs (
        action, description, entity_type, entity_id, 
        user_id, user_name, ip_address, user_agent,
        old_values, new_values, metadata
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        action,
        description,
        entity_type,
        entity_id,
        user_id,
        user_name || null,
        ip_address || null,
        user_agent || null,
        old_values ? JSON.stringify(old_values) : null,
        new_values ? JSON.stringify(new_values) : null,
        metadata ? JSON.stringify(metadata) : null
      ]
    );
    
    return NextResponse.json({
      success: true,
      message: '活動紀錄已建立'
    });
    
  } catch (error) {
    console.error('POST 活動紀錄錯誤:', error);
    return NextResponse.json(
      { success: false, error: '建立活動紀錄失敗' },
      { status: 500 }
    );
  }
}