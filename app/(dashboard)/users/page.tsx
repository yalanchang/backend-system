'use client';

import { useState, useEffect } from 'react';

interface User {
    id: number;
    name: string;
    email: string;
    role: 'admin' | 'manager' | 'member';
    avatar?: string;
    created_at: string;
    project_count?: number;
    task_count?: number;
}

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [filter, setFilter] = useState({ role: '', search: '' });

    useEffect(() => {
        fetchUsers();
    }, [filter.role]);

    const fetchUsers = async () => {
        const params = new URLSearchParams();
        if (filter.role) params.set('role', filter.role);

        const res = await fetch(`/api/users?${params}`);
        const data = await res.json();
        if (data.success) {
            setUsers(data.data);
        }
        setLoading(false);
    };

    const handleDelete = async (id: number) => {
        if (!confirm('確定要刪除這個使用者嗎？')) return;

        const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
        const data = await res.json();
        if (data.success) {
            fetchUsers();
        } else {
            alert(data.error);
        }
    };

    const handleEdit = (user: User) => {
        setEditingUser(user);
        setShowModal(true);
    };

    const handleAdd = () => {
        setEditingUser(null);
        setShowModal(true);
    };

    const filteredUsers = users.filter(user => 
        user.name.toLowerCase().includes(filter.search.toLowerCase()) ||
        user.email.toLowerCase().includes(filter.search.toLowerCase())
    );

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">使用者管理</h1>
                <button
                    onClick={handleAdd}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                    + 新增使用者
                </button>
            </div>

            {/* 篩選器 */}
            <div className="flex gap-4 mb-6">
                <input
                    type="text"
                    placeholder="搜尋姓名或 Email..."
                    value={filter.search}
                    onChange={(e) => setFilter({ ...filter, search: e.target.value })}
                    className="px-4 py-2 border rounded-lg w-64"
                />

                <select
                    value={filter.role}
                    onChange={(e) => setFilter({ ...filter, role: e.target.value })}
                    className="px-4 py-2 border rounded-lg"
                >
                    <option value="">所有角色</option>
                    <option value="admin">管理員</option>
                    <option value="manager">經理</option>
                    <option value="member">成員</option>
                </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <StatCard 
                    title="總使用者" 
                    value={users.length} 
                    icon="👥" 
                    color="blue" 
                />
                <StatCard 
                    title="管理員" 
                    value={users.filter(u => u.role === 'admin').length} 
                    icon="👑" 
                    color="purple" 
                />
                <StatCard 
                    title="經理" 
                    value={users.filter(u => u.role === 'manager').length} 
                    icon="💼" 
                    color="green" 
                />
                <StatCard 
                    title="成員" 
                    value={users.filter(u => u.role === 'member').length} 
                    icon="👤" 
                    color="gray" 
                />
            </div>

            {/* 使用者列表 */}
            {loading ? (
                <div>載入中...</div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">使用者</th>
                                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Email</th>
                                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">角色</th>
                                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">專案數</th>
                                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">任務數</th>
                                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">建立時間</th>
                                <th className="px-6 py-4 text-right text-sm font-medium text-gray-500">操作</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {filteredUsers.map((user) => (
                                <tr key={user.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            {user.avatar ? (
                                                <img
                                                    src={user.avatar}
                                                    alt={user.name}
                                                    className="w-10 h-10 rounded-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium">
                                                    {user.name.charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                            <span className="font-medium">{user.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-500">{user.email}</td>
                                    <td className="px-6 py-4">
                                        <RoleBadge role={user.role} />
                                    </td>
                                    <td className="px-6 py-4 text-gray-500">{user.project_count || 0}</td>
                                    <td className="px-6 py-4 text-gray-500">{user.task_count || 0}</td>
                                    <td className="px-6 py-4 text-gray-500">
                                        {new Date(user.created_at).toLocaleDateString('zh-TW')}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => handleEdit(user)}
                                            className="text-blue-600 hover:text-blue-800 mr-3"
                                        >
                                            編輯
                                        </button>
                                        <button
                                            onClick={() => handleDelete(user.id)}
                                            className="text-red-600 hover:text-red-800"
                                        >
                                            刪除
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {filteredUsers.length === 0 && (
                        <div className="text-center py-12 text-gray-500">
                            沒有找到使用者
                        </div>
                    )}
                </div>
            )}

            {showModal && (
                <UserModal
                    user={editingUser}
                    onClose={() => setShowModal(false)}
                    onSave={() => {
                        setShowModal(false);
                        fetchUsers();
                    }}
                />
            )}
        </div>
    );
}

function StatCard({ title, value, icon, color }: { title: string; value: number; icon: string; color: string }) {
    const colorClasses: Record<string, string> = {
        blue: 'bg-blue-100 text-blue-600',
        purple: 'bg-purple-100 text-purple-600',
        green: 'bg-green-100 text-green-600',
        gray: 'bg-gray-100 text-gray-600',
    };

    return (
        <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl ${colorClasses[color]}`}>
                    {icon}
                </div>
                <div>
                    <p className="text-gray-500 text-sm">{title}</p>
                    <p className="text-xl font-bold">{value}</p>
                </div>
            </div>
        </div>
    );
}

function RoleBadge({ role }: { role: string }) {
    const config: Record<string, { label: string; class: string }> = {
        admin: { label: '管理員', class: 'bg-purple-100 text-purple-600' },
        manager: { label: '經理', class: 'bg-blue-100 text-blue-600' },
        member: { label: '成員', class: 'bg-gray-100 text-gray-600' },
    };

    const c = config[role] || config.member;

    return (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${c.class}`}>
            {c.label}
        </span>
    );
}

function UserModal({
    user,
    onClose,
    onSave,
}: {
    user: User | null;
    onClose: () => void;
    onSave: () => void;
}) {
    const [form, setForm] = useState({
        name: user?.name || '',
        email: user?.email || '',
        password: '',
        role: user?.role || 'member',
    });
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        const url = user ? `/api/users/${user.id}` : '/api/users';
        const method = user ? 'PUT' : 'POST';

        // 編輯時如果密碼為空，不送密碼
        const payload = { ...form };
        if (user && !payload.password) {
            delete (payload as any).password;
        }

        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (data.success) {
            onSave();
        } else {
            alert(data.error);
        }
        setSaving(false);
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
                <h2 className="text-xl font-bold mb-4">
                    {user ? '編輯使用者' : '新增使用者'}
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">姓名 *</label>
                        <input
                            type="text"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            className="w-full px-3 py-2 border rounded-lg"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Email *</label>
                        <input
                            type="email"
                            value={form.email}
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                            className="w-full px-3 py-2 border rounded-lg"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">
                            密碼 {user ? '（留空表示不修改）' : '*'}
                        </label>
                        <input
                            type="password"
                            value={form.password}
                            onChange={(e) => setForm({ ...form, password: e.target.value })}
                            className="w-full px-3 py-2 border rounded-lg"
                            required={!user}
                            minLength={6}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">角色</label>
                        <select
                            value={form.role}
                            onChange={(e) => setForm({ ...form, role: e.target.value as any })}
                            className="w-full px-3 py-2 border rounded-lg"
                        >
                            <option value="member">成員</option>
                            <option value="manager">經理</option>
                            <option value="admin">管理員</option>
                        </select>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                            {saving ? '儲存中...' : (user ? '更新' : '建立')}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
                        >
                            取消
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}