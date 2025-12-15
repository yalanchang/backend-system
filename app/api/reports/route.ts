import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const days = parseInt(searchParams.get('days') || '7');

        // 專案統計
        const [projectTotal] = await pool.query<RowDataPacket[]>(
            'SELECT COUNT(*) as total FROM projects'
        );

        const [projectByStatus] = await pool.query<RowDataPacket[]>(
            'SELECT status, COUNT(*) as count FROM projects GROUP BY status'
        );

        // 任務統計
        const [taskTotal] = await pool.query<RowDataPacket[]>(
            'SELECT COUNT(*) as total FROM tasks'
        );

        const [taskByStatus] = await pool.query<RowDataPacket[]>(
            'SELECT status, COUNT(*) as count FROM tasks GROUP BY status'
        );

        const [taskByPriority] = await pool.query<RowDataPacket[]>(
            'SELECT priority, COUNT(*) as count FROM tasks GROUP BY priority ORDER BY FIELD(priority, "urgent", "high", "medium", "low")'
        );

        // 使用者統計
        const [userTotal] = await pool.query<RowDataPacket[]>(
            'SELECT COUNT(*) as total FROM users'
        );

        const [userByRole] = await pool.query<RowDataPacket[]>(
            'SELECT role, COUNT(*) as count FROM users GROUP BY role'
        );

        // 每週任務趨勢
        const [weeklyTasks] = await pool.query<RowDataPacket[]>(
            `SELECT 
                DATE(created_at) as date,
                COUNT(*) as created,
                SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END) as completed
             FROM tasks
             WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
             GROUP BY DATE(created_at)
             ORDER BY date`,
            [days]
        );

        // 任務完成排行
        const [topUsers] = await pool.query<RowDataPacket[]>(
            `SELECT u.name, COUNT(t.id) as completed_tasks
             FROM users u
             LEFT JOIN tasks t ON u.id = t.assignee_id AND t.status = 'done'
             GROUP BY u.id, u.name
             ORDER BY completed_tasks DESC
             LIMIT 5`
        );

        return NextResponse.json({
            success: true,
            data: {
                projectStats: {
                    total: projectTotal[0].total,
                    by_status: projectByStatus,
                },
                taskStats: {
                    total: taskTotal[0].total,
                    by_status: taskByStatus,
                    by_priority: taskByPriority,
                },
                userStats: {
                    total: userTotal[0].total,
                    by_role: userByRole,
                },
                weeklyTasks,
                topUsers,
            },
        });
    } catch (error) {
        console.error('報表錯誤:', error);
        return NextResponse.json({ success: false, error: '取得報表失敗' }, { status: 500 });
    }
}