'use client';

import { useState, useEffect } from 'react';
import { Task, Project } from '@/types';

export default function TasksPage() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [filter, setFilter] = useState({ status: '', project_id: '', assignee_id: '' });

    useEffect(() => {
        fetchTasks();
        fetchProjects();
        fetchUsers();
    }, [filter]);

    const fetchTasks = async () => {
        const params = new URLSearchParams();
        if (filter.status) params.set('status', filter.status);
        if (filter.project_id) params.set('project_id', filter.project_id);
        if (filter.assignee_id) params.set('assignee_id', filter.assignee_id);

        const res = await fetch(`/api/tasks?${params}`);
        const data = await res.json();
        if (data.success) {
            setTasks(data.data);
        }
        setLoading(false);
    };

    const fetchProjects = async () => {
        const res = await fetch('/api/projects');
        const data = await res.json();
        if (data.success) setProjects(data.data);
    };

    const fetchUsers = async () => {
        const res = await fetch('/api/users');
        const data = await res.json();
        if (data.success) setUsers(data.data);
    };

    const handleDelete = async (id: number) => {
        if (!confirm('確定要刪除這個任務嗎？')) return;
        const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
        const data = await res.json();
        if (data.success) fetchTasks();
    };

    const handleStatusChange = async (id: number, status: string) => {
        const res = await fetch(`/api/tasks/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status }),
        });
        const data = await res.json();
        if (data.success) fetchTasks();
    };

    const handleEdit = (task: Task) => {
        setEditingTask(task);
        setShowModal(true);
    };

    const handleAdd = () => {
        setEditingTask(null);
        setShowModal(true);
    };

    const tasksByStatus = {
        todo: tasks.filter(t => t.status === 'todo'),
        in_progress: tasks.filter(t => t.status === 'in_progress'),
        review: tasks.filter(t => t.status === 'review'),
        done: tasks.filter(t => t.status === 'done'),
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">任務管理</h1>
                <button onClick={handleAdd} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    + 新增任務
                </button>
            </div>

            <div className="flex gap-4 mb-6">
                <select value={filter.project_id} onChange={(e) => setFilter({ ...filter, project_id: e.target.value })} className="px-4 py-2 border rounded-lg">
                    <option value="">所有專案</option>
                    {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <select value={filter.assignee_id} onChange={(e) => setFilter({ ...filter, assignee_id: e.target.value })} className="px-4 py-2 border rounded-lg">
                    <option value="">所有負責人</option>
                    {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
                <select value={filter.status} onChange={(e) => setFilter({ ...filter, status: e.target.value })} className="px-4 py-2 border rounded-lg">
                    <option value="">所有狀態</option>
                    <option value="todo">待處理</option>
                    <option value="in_progress">進行中</option>
                    <option value="review">審核中</option>
                    <option value="done">已完成</option>
                </select>
            </div>

            {loading ? (
                <div>載入中...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <TaskColumn title="待處理" tasks={tasksByStatus.todo} color="gray" onStatusChange={handleStatusChange} onEdit={handleEdit} onDelete={handleDelete} />
                    <TaskColumn title="進行中" tasks={tasksByStatus.in_progress} color="blue" onStatusChange={handleStatusChange} onEdit={handleEdit} onDelete={handleDelete} />
                    <TaskColumn title="審核中" tasks={tasksByStatus.review} color="yellow" onStatusChange={handleStatusChange} onEdit={handleEdit} onDelete={handleDelete} />
                    <TaskColumn title="已完成" tasks={tasksByStatus.done} color="green" onStatusChange={handleStatusChange} onEdit={handleEdit} onDelete={handleDelete} />
                </div>
            )}

            {showModal && (
                <TaskModal
                    task={editingTask}
                    projects={projects}
                    users={users}
                    onClose={() => setShowModal(false)}
                    onSave={() => { setShowModal(false); fetchTasks(); }}
                />
            )}
        </div>
    );
}

function TaskColumn({ title, tasks, color, onStatusChange, onEdit, onDelete }: {
    title: string; tasks: Task[]; color: string;
    onStatusChange: (id: number, status: string) => void;
    onEdit: (task: Task) => void;
    onDelete: (id: number) => void;
}) {
    const colorClasses: Record<string, string> = {
        gray: 'bg-gray-100 border-gray-300',
        blue: 'bg-blue-50 border-blue-300',
        yellow: 'bg-yellow-50 border-yellow-300',
        green: 'bg-green-50 border-green-300',
    };

    return (
        <div className={`rounded-xl p-4 border-2 ${colorClasses[color]}`}>
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold">{title}</h3>
                <span className="bg-white px-2 py-1 rounded-full text-sm">{tasks.length}</span>
            </div>
            <div className="space-y-3">
                {tasks.map((task) => (
                    <TaskCard key={task.id} task={task} onStatusChange={onStatusChange} onEdit={onEdit} onDelete={onDelete} />
                ))}
            </div>
        </div>
    );
}

function toLocalDateString(dateStr: string | null | undefined): string {
    if (!dateStr) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function TaskCard({ task, onStatusChange, onEdit, onDelete }: {
    task: Task;
    onStatusChange: (id: number, status: string) => void;
    onEdit: (task: Task) => void;
    onDelete: (id: number) => void;
}) {
    const priorityColors: Record<string, string> = {
        low: 'bg-gray-100 text-gray-600',
        medium: 'bg-blue-100 text-blue-600',
        high: 'bg-orange-100 text-orange-600',
        urgent: 'bg-red-100 text-red-600',
    };
    const priorityLabels: Record<string, string> = {
        low: '低', medium: '中', high: '高', urgent: '緊急',
    };

    const dueDateStr = toLocalDateString(task.due_date);

    return (
        <div className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-2">
                <h4 className="font-medium text-sm">{task.title}</h4>
                <span className={`px-2 py-0.5 rounded text-xs ${priorityColors[task.priority]}`}>
                    {priorityLabels[task.priority]}
                </span>
            </div>
            <p className="text-xs text-gray-500 mb-3">{task.project_name}</p>
            {task.description && (
                <p className="text-xs text-gray-400 mb-3 line-clamp-2">{task.description}</p>
            )}
            <div className="flex justify-between items-center text-xs text-gray-500 mb-3">
                <span className="flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    {task.assignee_name || '未指派'}
                </span>
                {dueDateStr && (
                    <span className={`flex items-center gap-1 ${isOverdue(dueDateStr) ? 'text-red-500' : ''}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {dueDateStr}
                    </span>
                )}
            </div>
            <div className="flex gap-1 mb-2">
                <select value={task.status} onChange={(e) => onStatusChange(task.id, e.target.value)} className="flex-1 text-xs px-2 py-1 border rounded">
                    <option value="todo">待處理</option>
                    <option value="in_progress">進行中</option>
                    <option value="review">審核中</option>
                    <option value="done">已完成</option>
                </select>
            </div>
            <div className="flex gap-2">
                <button onClick={() => onEdit(task)} className="flex-1 text-xs px-2 py-1 bg-gray-100 rounded hover:bg-gray-200">編輯</button>
                <button onClick={() => onDelete(task.id)} className="text-xs px-2 py-1 text-red-500 hover:bg-red-50 rounded">刪除</button>
            </div>
        </div>
    );
}

function isOverdue(dateString: string): boolean {
    return new Date(dateString) < new Date();
}

function TaskModal({ task, projects, users, onClose, onSave }: {
    task: Task | null; projects: Project[]; users: any[];
    onClose: () => void; onSave: () => void;
}) {
    const [form, setForm] = useState({
        project_id: String(task?.project_id || ''),
        title: task?.title || '',
        description: task?.description || '',
        status: (task?.status || 'todo') as string,
        priority: (task?.priority || 'medium') as string,
        assignee_id: task?.assignee_id ? String(task.assignee_id) : '',
        due_date: toLocalDateString(task?.due_date),
        estimated_hours: task?.estimated_hours || '',
    });
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        const url = task ? `/api/tasks/${task.id}` : '/api/tasks';
        const method = task ? 'PUT' : 'POST';

        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(form),
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
            <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <h2 className="text-xl font-bold mb-4">{task ? '編輯任務' : '新增任務'}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">所屬專案 *</label>
                        <select value={form.project_id} onChange={(e) => setForm({ ...form, project_id: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required>
                            <option value="">選擇專案</option>
                            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">任務標題 *</label>
                        <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">描述</label>
                        <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2 border rounded-lg" rows={3} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">狀態</label>
                            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full px-3 py-2 border rounded-lg">
                                <option value="todo">待處理</option>
                                <option value="in_progress">進行中</option>
                                <option value="review">審核中</option>
                                <option value="done">已完成</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">優先級</label>
                            <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="w-full px-3 py-2 border rounded-lg">
                                <option value="low">低</option>
                                <option value="medium">中</option>
                                <option value="high">高</option>
                                <option value="urgent">緊急</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">負責人</label>
                        <select value={form.assignee_id} onChange={(e) => setForm({ ...form, assignee_id: e.target.value })} className="w-full px-3 py-2 border rounded-lg">
                            <option value="">未指派</option>
                            {users.map((u) => <option key={u.id} value={String(u.id)}>{u.name}</option>)}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">截止日期</label>
                            <input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">預估工時</label>
                            <input type="number" value={form.estimated_hours} onChange={(e) => setForm({ ...form, estimated_hours: e.target.value })} className="w-full px-3 py-2 border rounded-lg" placeholder="小時" min="0" step="0.5" />
                        </div>
                    </div>
                    <div className="flex gap-3 pt-4">
                        <button type="submit" disabled={saving} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                            {saving ? '儲存中...' : (task ? '更新任務' : '建立任務')}
                        </button>
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200">取消</button>
                    </div>
                </form>
            </div>
        </div>
    );
}