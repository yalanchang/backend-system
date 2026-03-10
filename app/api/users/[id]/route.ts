import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import bcrypt from 'bcryptjs';
import { logActivity } from '@/lib/activity-server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const fieldNameMap: Record<string, string> = {
    name: '姓名',
    email: '信箱',
    role: '角色',
};

const roleMap: Record<string, string> = {
    admin: '管理員',
    manager: '專案經理',
    member: '成員',
    viewer: '觀察者',
};

function formatValue(key: string, value: any): string {
    if (value === null || value === undefined) return '無';
    if (key === 'role') return roleMap[value] || value;
    return String(value);
}

// 取得單一使用者
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    try {
        const [rows] = await pool.query<RowDataPacket[]>(
            'SELECT id, name, email, role, avatar, created_at FROM users WHERE id = ?',
            [id]
        );

        if (rows.length === 0) {
            return NextResponse.json({ success: false, error: '使用者不存在' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: rows[0] });
    } catch (error) {
        return NextResponse.json({ success: false, error: '取得使用者失敗' }, { status: 500 });
    }
}

// 更新使用者
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    try {
        const body = await request.json();
        const { name, email, password, role } = body;
        const session = await getServerSession(authOptions);

        // 取得舊資料
        const [oldRows] = await pool.query<RowDataPacket[]>(
            'SELECT id, name, email, role FROM users WHERE id = ?',
            [id]
        );

        if (oldRows.length === 0) {
            return NextResponse.json({ success: false, error: '使用者不存在' }, { status: 404 });
        }

        const oldData = {
            name: oldRows[0].name,
            email: oldRows[0].email,
            role: oldRows[0].role,
        };

        const newData = {
            name,
            email,
            role,
        };

        // 找出實際變更的欄位
        const changes: Record<string, any> = {};
        Object.keys(newData).forEach(key => {
            const k = key as keyof typeof newData;
            if (JSON.stringify(oldData[k]) !== JSON.stringify(newData[k])) {
                changes[key] = { old: oldData[k], new: newData[k] };
            }
        });

        const changedFieldNames = Object.keys(changes)
            .map(k => fieldNameMap[k] || k)
            .join('、');

        const changeDesc = Object.keys(changes).length > 0
            ? `更新使用者「${oldData.name}」的${changedFieldNames}`
            : `更新使用者「${oldData.name}」`;

        // 中文化變更內容
        const chineseChanges: Record<string, any> = {};
        Object.keys(changes).forEach(key => {
            const label = fieldNameMap[key] || key;
            chineseChanges[label] = {
                old: formatValue(key, changes[key].old),
                new: formatValue(key, changes[key].new),
            };
        });

        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            await pool.query<ResultSetHeader>(
                'UPDATE users SET name = ?, email = ?, password = ?, role = ? WHERE id = ?',
                [name, email, hashedPassword, role, id]
            );
        } else {
            await pool.query<ResultSetHeader>(
                'UPDATE users SET name = ?, email = ?, role = ? WHERE id = ?',
                [name, email, role, id]
            );
        }

        await logActivity({
            action: 'update',
            description: changeDesc,
            entity_type: 'user',
            entity_id: id,
            user_id: (session?.user as any)?.id || 'unknown',
            user_name: session?.user?.name || undefined,
            old_values: Object.keys(changes).length > 0 ? oldData : null,
            new_values: Object.keys(changes).length > 0 ? newData : null,
            metadata: Object.keys(changes).length > 0 ? { changes: chineseChanges } : null,
        });

        return NextResponse.json({ success: true, message: '使用者更新成功' });
    } catch (error) {
        return NextResponse.json({ success: false, error: '更新使用者失敗' }, { status: 500 });
    }
}

// 刪除使用者
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    try {
        const session = await getServerSession(authOptions);

        const [oldRows] = await pool.query<RowDataPacket[]>(
            'SELECT id, name, email, role FROM users WHERE id = ?',
            [id]
        );

        await pool.query<ResultSetHeader>('DELETE FROM users WHERE id = ?', [id]);

        await logActivity({
            action: 'delete',
            description: `刪除使用者「${oldRows[0]?.name}」`,
            entity_type: 'user',
            entity_id: id,
            user_id: (session?.user as any)?.id || 'unknown',
            user_name: session?.user?.name || undefined,
            old_values: oldRows[0] || null,
        });

        return NextResponse.json({ success: true, message: '使用者刪除成功' });
    } catch (error) {
        return NextResponse.json({ success: false, error: '刪除使用者失敗' }, { status: 500 });
    }
}