
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';
import { Project } from '@/types';

export default function ProjectsPage() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [filter, setFilter] = useState({ status: '', priority: '' });

    useEffect(() => {
        fetchProjects();
    }, [filter]);

    const fetchProjects = async () => {
        const params = new URLSearchParams();
        if (filter.status) params.set('status', filter.status);
        if (filter.priority) params.set('priority', filter.priority);

        const res = await fetch(`/api/projects?${params}`);
        const data = await res.json();
        if (data.success) {
            setProjects(data.data);
        }
        setLoading(false);
    };

    const handleDelete = async (id: number) => {
        if (!confirm('確定要刪除這個專案嗎？')) return;

        const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
        const data = await res.json();
        if (data.success) {
            fetchProjects();
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">專案管理</h1>
                <button
                    onClick={() => setShowModal(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                    + 新增專案
                </button>
            </div>

            {/* 篩選器 */}
            <div className="flex gap-4 mb-6">
                <select
                    value={filter.status}
                    onChange={(e) => setFilter({ ...filter, status: e.target.value })}
                    className="px-4 py-2 border rounded-lg"
                >
                    <option value="">所有狀態</option>
                    <option value="planning">規劃中</option>
                    <option value="in_progress">進行中</option>
                    <option value="on_hold">暫停</option>
                    <option value="completed">已完成</option>
                </select>

                <select
                    value={filter.priority}
                    onChange={(e) => setFilter({ ...filter, priority: e.target.value })}
                    className="px-4 py-2 border rounded-lg"
                >
                    <option value="">所有優先級</option>
                    <option value="low">低</option>
                    <option value="medium">中</option>
                    <option value="high">高</option>
                    <option value="urgent">緊急</option>
                </select>
            </div>

            {/* 專案列表 */}
            {loading ? (
                <div>載入中...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {projects.map((project) => (
                        <ProjectCard 
                            key={project.id} 
                            project={project} 
                            onDelete={() => handleDelete(project.id)}
                        />
                    ))}
                </div>
            )}

            {/* 新增專案 Modal */}
            {showModal && (
                <ProjectModal
                    onClose={() => setShowModal(false)}
                    onSave={() => {
                        setShowModal(false);
                        fetchProjects();
                    }}
                />
            )}
        </div>
    );
}

function ProjectCard({ project, onDelete }: { project: Project; onDelete: () => void }) {
 
    const progress = project.task_count && project.task_count > 0
        ? Math.round((project.completed_tasks || 0) / project.task_count * 100) 
        : 0;

    return (
        <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
                <h3 className="font-bold text-lg text-gray-900">{project.name}</h3>
                <PriorityBadge priority={project.priority} />
            </div>

            <p className="text-gray-500 text-sm mb-4 line-clamp-2">
                {project.description || '無描述'}
            </p>

            {/* 進度條 */}
            <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700">進度</span>
                    <span className="text-gray-700">{progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                    />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                    {project.completed_tasks || 0} / {project.task_count || 0} 任務完成
                </p>
            </div>

            <div className="flex justify-between items-center text-sm text-gray-600 mb-4">
    <span className="flex items-center gap-1">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        {project.owner_name || '未指派'}
    </span>
    <span className="flex items-center gap-1">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        {formatDate(project.end_date) || '無截止日'}
    </span>
</div>
            <div className="flex gap-2">
                <Link
                    href={`/projects/${project.id}`}
                    className="flex-1 text-center px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 text-gray-800"
                >
                    查看
                </Link>
                <button
                    onClick={onDelete}
                    className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                >
                    刪除
                </button>
            </div>
        </div>
    );
}

function PriorityBadge({ priority }: { priority: string }) {
    const config: Record<string, { label: string; class: string }> = {
        low: { label: '低', class: 'bg-gray-100 text-gray-600' },
        medium: { label: '中', class: 'bg-blue-100 text-blue-600' },
        high: { label: '高', class: 'bg-orange-100 text-orange-600' },
        urgent: { label: '緊急', class: 'bg-red-100 text-red-600' },
    };

    const c = config[priority] || config.medium;

    return (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${c.class}`}>
            {c.label}
        </span>
    );
}

function ProjectModal({ onClose, onSave }: { onClose: () => void; onSave: () => void }) {
    const [form, setForm] = useState({
        name: '',
        description: '',
        status: 'planning',
        priority: 'medium',
        start_date: '',
        end_date: '',
    });
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        const res = await fetch('/api/projects', {
            method: 'POST',
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
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
                <h2 className="text-xl font-bold mb-4">新增專案</h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">專案名稱 *</label>
                        <input
                            type="text"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            className="w-full px-3 py-2 border rounded-lg"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">描述</label>
                        <textarea
                            value={form.description}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                            className="w-full px-3 py-2 border rounded-lg"
                            rows={3}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">狀態</label>
                            <select
                                value={form.status}
                                onChange={(e) => setForm({ ...form, status: e.target.value })}
                                className="w-full px-3 py-2 border rounded-lg"
                            >
                                <option value="planning">規劃中</option>
                                <option value="in_progress">進行中</option>
                                <option value="on_hold">暫停</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">優先級</label>
                            <select
                                value={form.priority}
                                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                                className="w-full px-3 py-2 border rounded-lg"
                            >
                                <option value="low">低</option>
                                <option value="medium">中</option>
                                <option value="high">高</option>
                                <option value="urgent">緊急</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">開始日期</label>
                            <input
                                type="date"
                                value={form.start_date}
                                onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                                className="w-full px-3 py-2 border rounded-lg"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">結束日期</label>
                            <input
                                type="date"
                                value={form.end_date}
                                onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                                className="w-full px-3 py-2 border rounded-lg"
                            />
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                            {saving ? '儲存中...' : '建立專案'}
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