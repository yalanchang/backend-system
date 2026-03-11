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
    const [showFilters, setShowFilters] = useState(false);

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
        if (data.success) setTasks(data.data);
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

    const columns = [
        { key: 'todo', title: '待處理', color: 'gray', tasks: tasksByStatus.todo },
        { key: 'in_progress', title: '進行中', color: 'blue', tasks: tasksByStatus.in_progress },
        { key: 'review', title: '審核中', color: 'yellow', tasks: tasksByStatus.review },
        { key: 'done', title: '已完成', color: 'green', tasks: tasksByStatus.done },
    ];

    return (
        <div>
            {/* 標題列 */}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl sm:text-3xl font-bold">任務管理</h1>
                <button onClick={handleAdd} className="px-3 py-2 sm:px-4 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm sm:text-base flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    新增任務
                </button>
            </div>

            {/* 篩選器 */}
            <div className="mb-6">
                <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="md:hidden flex items-center gap-2 px-4 py-2.5 border rounded-lg text-sm mb-3 w-full justify-between bg-white"
                >
                    <span className="flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
                        </svg>
                        篩選條件
                    </span>
                    <svg xmlns="http://www.w3.org/2000/svg" className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>

                <div className={`${showFilters ? 'flex' : 'hidden'} md:flex flex-col md:flex-row gap-3`}>
                    <select value={filter.project_id} onChange={(e) => setFilter({ ...filter, project_id: e.target.value })} className="px-3 py-2 border rounded-lg text-sm w-full md:w-auto bg-white">
                        <option value="">所有專案</option>
                        {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    <select value={filter.assignee_id} onChange={(e) => setFilter({ ...filter, assignee_id: e.target.value })} className="px-3 py-2 border rounded-lg text-sm w-full md:w-auto bg-white">
                        <option value="">所有負責人</option>
                        {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                    <select value={filter.status} onChange={(e) => setFilter({ ...filter, status: e.target.value })} className="px-3 py-2 border rounded-lg text-sm w-full md:w-auto bg-white">
                        <option value="">所有狀態</option>
                        <option value="todo">待處理</option>
                        <option value="in_progress">進行中</option>
                        <option value="review">審核中</option>
                        <option value="done">已完成</option>
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <svg className="animate-spin w-6 h-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span className="ml-2 text-gray-500">載入中...</span>
                </div>
            ) : (
                <>
                    {/* 手機：卡片式垂直列表（依狀態分組） */}
                    <div className="md:hidden space-y-6">
                        {columns.map(col => col.tasks.length > 0 && (
                            <div key={col.key}>
                                <StatusHeader title={col.title} count={col.tasks.length} color={col.color} />
                                <div className="space-y-3 mt-3">
                                    {col.tasks.map(task => (
                                        <MobileTaskCard key={task.id} task={task} onStatusChange={handleStatusChange} onEdit={handleEdit} onDelete={handleDelete} />
                                    ))}
                                </div>
                            </div>
                        ))}
                        {tasks.length === 0 && (
                            <div className="text-center py-12 text-gray-400">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 mx-auto mb-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                                <p>目前沒有任何任務</p>
                            </div>
                        )}
                    </div>

                    {/* 桌面：看板欄位 */}
                    <div className="hidden md:grid md:grid-cols-4 gap-6">
                        {columns.map(col => (
                            <TaskColumn key={col.key} title={col.title} tasks={col.tasks} color={col.color} onStatusChange={handleStatusChange} onEdit={handleEdit} onDelete={handleDelete} />
                        ))}
                    </div>
                </>
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

function StatusHeader({ title, count, color }: { title: string; count: number; color: string }) {
    const colorClasses: Record<string, string> = {
        gray: 'bg-gray-100 text-gray-700 border-gray-300',
        blue: 'bg-blue-50 text-blue-700 border-blue-300',
        yellow: 'bg-yellow-50 text-yellow-700 border-yellow-300',
        green: 'bg-green-50 text-green-700 border-green-300',
    };
    const dotColors: Record<string, string> = {
        gray: 'bg-gray-400', blue: 'bg-blue-500', yellow: 'bg-yellow-500', green: 'bg-green-500',
    };
    return (
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${colorClasses[color]}`}>
            <span className={`w-2 h-2 rounded-full ${dotColors[color]}`} />
            <span className="font-semibold text-sm">{title}</span>
            <span className="ml-auto text-xs font-medium bg-white px-2 py-0.5 rounded-full border">{count}</span>
        </div>
    );
}

function MobileTaskCard({ task, onStatusChange, onEdit, onDelete }: {
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
    const priorityLabels: Record<string, string> = { low: '低', medium: '中', high: '高', urgent: '緊急' };
    const dueDateStr = toLocalDateString(task.due_date);

    return (
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex justify-between items-start mb-1">
                <h4 className="font-semibold text-sm flex-1 mr-2">{task.title}</h4>
                <span className={`px-2 py-0.5 rounded text-xs flex-shrink-0 ${priorityColors[task.priority]}`}>
                    {priorityLabels[task.priority]}
                </span>
            </div>
            <p className="text-xs text-gray-500 mb-2">{task.project_name}</p>
            {task.description && <p className="text-xs text-gray-400 mb-2 line-clamp-2">{task.description}</p>}
            <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
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
            <div className="flex gap-2 items-center">
                <select value={task.status} onChange={(e) => onStatusChange(task.id, e.target.value)} className="flex-1 text-xs px-2 py-1.5 border rounded-lg bg-gray-50">
                    <option value="todo">待處理</option>
                    <option value="in_progress">進行中</option>
                    <option value="review">審核中</option>
                    <option value="done">已完成</option>
                </select>
                <button onClick={() => onEdit(task)} className="text-xs px-3 py-1.5 bg-gray-100 rounded-lg hover:bg-gray-200">編輯</button>
                <button onClick={() => onDelete(task.id)} className="text-xs px-3 py-1.5 text-red-500 hover:bg-red-50 rounded-lg">刪除</button>
            </div>
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
        <div className={`rounded-xl p-4 border-2 ${colorClasses[color]} h-full`}>
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-sm">{title}</h3>
                <span className="bg-white px-2 py-1 rounded-full text-xs">{tasks.length}</span>
            </div>
            <div className="space-y-3">
                {tasks.map((task) => (
                    <TaskCard key={task.id} task={task} onStatusChange={onStatusChange} onEdit={onEdit} onDelete={onDelete} />
                ))}
                {tasks.length === 0 && <p className="text-xs text-gray-400 text-center py-4">無任務</p>}
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
    const priorityLabels: Record<string, string> = { low: '低', medium: '中', high: '高', urgent: '緊急' };
    const dueDateStr = toLocalDateString(task.due_date);

    return (
        <div className="bg-white rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-2">
                <h4 className="font-medium text-sm flex-1 mr-2 leading-tight">{task.title}</h4>
                <span className={`px-2 py-0.5 rounded text-xs flex-shrink-0 ${priorityColors[task.priority]}`}>
                    {priorityLabels[task.priority]}
                </span>
            </div>
            <p className="text-xs text-gray-500 mb-2">{task.project_name}</p>
            {task.description && <p className="text-xs text-gray-400 mb-2 line-clamp-2">{task.description}</p>}
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
            <select value={task.status} onChange={(e) => onStatusChange(task.id, e.target.value)} className="w-full text-xs px-2 py-1 border rounded mb-2">
                <option value="todo">待處理</option>
                <option value="in_progress">進行中</option>
                <option value="review">審核中</option>
                <option value="done">已完成</option>
            </select>
            <div className="flex gap-2">
                <button onClick={() => onEdit(task)} className="flex-1 text-xs px-2 py-1.5 bg-gray-100 rounded hover:bg-gray-200">編輯</button>
                <button onClick={() => onDelete(task.id)} className="text-xs px-2 py-1.5 text-red-500 hover:bg-red-50 rounded">刪除</button>
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
        if (data.success) onSave();
        else alert(data.error);
        setSaving(false);
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 sm:p-8">
            <div className="bg-white rounded-xl p-4 sm:p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4 sm:mb-5">
                    <h2 className="text-lg sm:text-xl font-bold">{task ? '編輯任務' : '新增任務'}</h2>
                    <button 
                        onClick={onClose} 
                        className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 -mr-1"
                        type="button"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">所屬專案 *</label>
                        <select 
                            value={form.project_id} 
                            onChange={(e) => setForm({ ...form, project_id: e.target.value })} 
                            className="w-full px-3 py-2.5 border rounded-lg text-sm bg-white"
                            required
                        >
                            <option value="">選擇專案</option>
                            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">任務標題 *</label>
                        <input 
                            type="text" 
                            value={form.title} 
                            onChange={(e) => setForm({ ...form, title: e.target.value })} 
                            className="w-full px-3 py-2.5 border rounded-lg text-sm"
                            placeholder="請輸入任務標題"
                            required 
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">描述</label>
                        <textarea 
                            value={form.description} 
                            onChange={(e) => setForm({ ...form, description: e.target.value })} 
                            className="w-full px-3 py-2.5 border rounded-lg text-sm" 
                            rows={3}
                            placeholder="請輸入任務描述（選填）"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-2 sm:gap-3">
                        <div>
                            <label className="block text-sm font-medium mb-1">狀態</label>
                            <select 
                                value={form.status} 
                                onChange={(e) => setForm({ ...form, status: e.target.value })} 
                                className="w-full px-3 py-2.5 border rounded-lg text-sm bg-white"
                            >
                                <option value="todo">待處理</option>
                                <option value="in_progress">進行中</option>
                                <option value="review">審核中</option>
                                <option value="done">已完成</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">優先級</label>
                            <select 
                                value={form.priority} 
                                onChange={(e) => setForm({ ...form, priority: e.target.value })} 
                                className="w-full px-3 py-2.5 border rounded-lg text-sm bg-white"
                            >
                                <option value="low">低</option>
                                <option value="medium">中</option>
                                <option value="high">高</option>
                                <option value="urgent">緊急</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">負責人</label>
                        <select 
                            value={form.assignee_id} 
                            onChange={(e) => setForm({ ...form, assignee_id: e.target.value })} 
                            className="w-full px-3 py-2.5 border rounded-lg text-sm bg-white"
                        >
                            <option value="">未指派</option>
                            {users.map((u) => <option key={u.id} value={String(u.id)}>{u.name}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">截止日期</label>
                        <input 
                            type="date" 
                            value={form.due_date} 
                            onChange={(e) => setForm({ ...form, due_date: e.target.value })} 
                            className="w-full px-3 py-2.5 border rounded-lg text-sm"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">預估工時</label>
                        <input 
                            type="number" 
                            value={form.estimated_hours} 
                            onChange={(e) => setForm({ ...form, estimated_hours: e.target.value })} 
                            className="w-full px-3 py-2.5 border rounded-lg text-sm" 
                            placeholder="請輸入小時"
                            min="0" 
                            step="0.5" 
                        />
                    </div>

                    <div className="flex gap-2 sm:gap-3 pt-2">
                        <button 
                            type="submit" 
                            disabled={saving} 
                            className="flex-1 px-4 py-3 sm:py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
                        >
                            {saving ? '儲存中...' : (task ? '更新任務' : '建立任務')}
                        </button>
                        <button 
                            type="button" 
                            onClick={onClose} 
                            className="px-4 py-3 sm:py-2.5 bg-gray-100 rounded-lg hover:bg-gray-200 text-sm font-medium"
                        >
                            取消
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}