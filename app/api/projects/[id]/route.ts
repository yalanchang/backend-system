import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { Project } from '@/lib/types';


// 取得單一專案
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

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
    { params }: { params: Promise<{ id: string }> }
  ) {
    try {
      const { id } = await params;
      const body = await request.json();
      
      const {
        name,
        description,
        status,
        priority,
        start_date,
        end_date,
        budget,
        owner_id
      } = body;
  
      // 驗證必填欄位
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
  
      // 驗證日期格式
      if (start_date && end_date) {
        const start = new Date(start_date);
        const end = new Date(end_date);
        
        if (start > end) {
          return NextResponse.json(
            { 
              success: false, 
              error: '開始日期不能晚於結束日期',
              validation_errors: [
                { field: 'start_date', message: '開始日期不能晚於結束日期' }
              ]
            },
            { status: 400 }
          );
        }
      }
  
      // 檢查專案是否存在
      const [checkRows] = await pool.query<RowDataPacket[]>(
        'SELECT id FROM projects WHERE id = ?',
        [id]
      );
  
      if (checkRows.length === 0) {
        return NextResponse.json(
          { success: false, error: '專案不存在' },
          { status: 404 }
        );
      }
  
      // 更新專案
      const [result] = await pool.query<ResultSetHeader>(
        `UPDATE projects SET 
          name = ?, 
          description = ?, 
          status = ?, 
          priority = ?,
          start_date = ?, 
          end_date = ?, 
          budget = ?, 
          owner_id = ?,
          updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [name, description || null, status || 'pending', priority || 'medium', 
         start_date || null, end_date || null, budget || 0, owner_id, id]
      );
  
      if (result.affectedRows === 0) {
        return NextResponse.json(
          { success: false, error: '更新失敗' },
          { status: 500 }
        );
      }
  
      // 取得更新後的資料
      const [updatedRows] = await pool.query<RowDataPacket[]>(
        `SELECT p.*, u.name as owner_name
         FROM projects p
         LEFT JOIN users u ON p.owner_id = u.id
         WHERE p.id = ?`,
        [id]
      );
  
      return NextResponse.json({
        success: true,
        message: '專案更新成功',
        data: updatedRows[0] as Project
      });
    } catch (error) {
      console.error('PUT 專案錯誤:', error);
      
      // 檢查是否為 MySQL 錯誤
      if (error instanceof Error) {
        if (error.message.includes('foreign key constraint')) {
          return NextResponse.json(
            { success: false, error: '指定的負責人不存在' },
            { status: 400 }
          );
        }
      }
      
      return NextResponse.json(
        { success: false, error: '更新專案失敗' },
        { status: 500 }
      );
    }
  }

// 刪除專案
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    try {
        await pool.query<ResultSetHeader>('DELETE FROM projects WHERE id = ?', [id]);
        return NextResponse.json({ success: true, message: '專案刪除成功' });
    } catch (error) {
        return NextResponse.json({ success: false, error: '刪除專案失敗' }, { status: 500 });
    }
}