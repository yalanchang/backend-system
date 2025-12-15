import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const query = searchParams.get('q')?.trim();

        if (!query || query.length < 2) {
            return NextResponse.json({ success: true, data: [] });
        }

        const searchTerm = `%${query}%`;
        const results: any[] = [];

        // 搜尋專案
        const [projects] = await pool.query<RowDataPacket[]>(
            `SELECT id, name, description FROM projects 
             WHERE name LIKE ? OR description LIKE ? 
             LIMIT 5`,
            [searchTerm, searchTerm]
        );

        projects.forEach((p) => {
            results.push({
                type: 'project',
                id: p.id,
                title: p.name,
                subtitle: p.description?.substring(0, 50),
            });
        });

        // 搜尋任務
        const [tasks] = await pool.query<RowDataPacket[]>(
            `SELECT t.id, t.title, p.name as project_name 
             FROM tasks t
             LEFT JOIN projects p ON t.project_id = p.id
             WHERE t.title LIKE ? OR t.description LIKE ?
             LIMIT 5`,
            [searchTerm, searchTerm]
        );

        tasks.forEach((t) => {
            results.push({
                type: 'task',
                id: t.id,
                title: t.title,
                subtitle: t.project_name,
            });
        });

        // 搜尋使用者
        const [users] = await pool.query<RowDataPacket[]>(
            `SELECT id, name, email FROM users 
             WHERE name LIKE ? OR email LIKE ?
             LIMIT 5`,
            [searchTerm, searchTerm]
        );

        users.forEach((u) => {
            results.push({
                type: 'user',
                id: u.id,
                title: u.name,
                subtitle: u.email,
            });
        });

        return NextResponse.json({ success: true, data: results });
    } catch (error) {
        console.error('搜尋錯誤:', error);
        return NextResponse.json({ success: false, error: '搜尋失敗' }, { status: 500 });
    }
}