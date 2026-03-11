'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
    const router = useRouter();
    const [stats, setStats] = useState<{
        projects: { total: number; in_progress: number; completed: number };
        tasks: { total: number; todo: number; in_progress: number; done: number };
        upcomingTasks: any[];  
    }>({
        projects: { total: 0, in_progress: 0, completed: 0 },
        tasks: { total: 0, todo: 0, in_progress: 0, done: 0 },
        upcomingTasks: [],
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchStats() {
            try {
                const [reportRes, tasksRes] = await Promise.all([
                    fetch('/api/reports?days=7'),
                    fetch('/api/tasks')
                ]);
                
                const reportData = await reportRes.json();
                const tasksData = await tasksRes.json();

                if (reportData.success) {
                    const projectStats = reportData.data.projectStats || {};
                    const taskStats = reportData.data.taskStats || {};
                    const allTasks = tasksData.success ? tasksData.data : [];
                    console.log('篩選前:', allTasks);
                    const upcoming = allTasks
                        .filter((t: any) => t.status !== 'done')
                        .sort((a: any, b: any) => {
                            if (!a.due_date) return 1;
                            if (!b.due_date) return -1;
                            return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
                        })
                        .slice(0, 5);
                    console.log('篩選後:', upcoming);
                    setStats({
                        projects: {
                            total: projectStats.total || 0,
                            in_progress: projectStats.by_status?.find((s: any) => s.status === 'in_progress')?.count || 0,
                            completed: projectStats.by_status?.find((s: any) => s.status === 'completed')?.count || 0,
                        },
                        tasks: {
                            total: taskStats.total || 0,
                            todo: taskStats.by_status?.find((s: any) => s.status === 'todo')?.count || 0,
                            in_progress: taskStats.by_status?.find((s: any) => s.status === 'in_progress')?.count || 0,
                            done: taskStats.by_status?.find((s: any) => s.status === 'done')?.count || 0,
                        },
                        upcomingTasks: upcoming,
                    });
                }
            } catch (error) {
                console.error('取得統計資料錯誤:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchStats();
        
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <svg className="animate-spin w-6 h-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span className="ml-2 text-gray-500">載入中...</span>
            </div>
        );
    }

    return (
        <div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 text-gray-900">儀表板</h1>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
                <StatCard title="專案總數" value={stats.projects.total} color="blue" icon="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                <StatCard title="進行中專案" value={stats.projects.in_progress} color="yellow" icon="M13 10V3L4 14h7v7l9-11h-7z" />
                <StatCard title="待處理任務" value={stats.tasks.todo} color="red" icon="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                <StatCard title="已完成任務" value={stats.tasks.done} color="green" icon="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </div>

            {/* 即將到期任務 */}
            <div className="bg-white rounded-xl p-5 sm:p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900">即將到期任務</h2>
                    <button
                        onClick={() => router.push('/tasks')}
                        className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    >
                        查看全部
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                </div>

                {stats.upcomingTasks.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 mx-auto mb-2 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-sm">沒有即將到期的任務</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {stats.upcomingTasks.map((task: any) => (
                            <UpcomingTaskRow key={task.id} task={task} onClick={() => router.push('/tasks')} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function UpcomingTaskRow({ task, onClick }: { task: any; onClick: () => void }) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(task.due_date);
    due.setHours(0, 0, 0, 0);
    const isOverdue = due < today;
    const isDueToday = due.getTime() === today.getTime();

    const priorityConfig: Record<string, { label: string; class: string }> = {
        low:    { label: '低', class: 'bg-gray-100 text-gray-600' },
        medium: { label: '中', class: 'bg-blue-100 text-blue-600' },
        high:   { label: '高', class: 'bg-orange-100 text-orange-600' },
        urgent: { label: '緊急', class: 'bg-red-100 text-red-600' },
    };
    const priority = priorityConfig[task.priority] || priorityConfig.medium;

    const dueDateLabel = isOverdue ? '已逾期' : isDueToday ? '今天到期' : task.due_date;

    return (
        <div
            onClick={onClick}
            className={`flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 rounded-lg border cursor-pointer transition-colors gap-2 sm:gap-0
                ${isOverdue ? 'bg-red-50 border-red-200 hover:bg-red-100' : isDueToday ? 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'}`}
        >
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <p className="font-medium text-gray-900 text-sm truncate">{task.title}</p>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium flex-shrink-0 ${priority.class}`}>
                        {priority.label}
                    </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
                    <span className="flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                        </svg>
                        {task.project_name}
                    </span>
                    {task.assignee_name && (
                        <span className="flex items-center gap-1">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            {task.assignee_name}
                        </span>
                    )}
                </div>
            </div>

            <div className={`flex items-center gap-1 text-xs font-medium flex-shrink-0 sm:ml-4
                ${isOverdue ? 'text-red-600' : isDueToday ? 'text-yellow-600' : 'text-gray-500'}`}>
                {isOverdue && (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                    </svg>
                )}
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {dueDateLabel}
            </div>
        </div>
    );
}

function StatCard({ title, value, color, icon }: { title: string; value: number; color: string; icon: string }) {
    const colorClasses: Record<string, string> = {
        blue:   'bg-blue-100 text-blue-600',
        yellow: 'bg-yellow-100 text-yellow-600',
        red:    'bg-red-100 text-red-600',
        green:  'bg-green-100 text-green-600',
    };
    const textClasses: Record<string, string> = {
        blue: 'text-blue-600', yellow: 'text-yellow-600',
        red: 'text-red-600', green: 'text-green-600',
    };

    return (
        <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm">
            <div className="flex items-center gap-3 sm:gap-4">
                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${colorClasses[color]}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
                    </svg>
                </div>
                <div>
                    <p className="text-gray-500 text-xs sm:text-sm">{title}</p>
                    <p className={`text-xl sm:text-2xl font-bold ${textClasses[color]}`}>{value}</p>
                </div>
            </div>
        </div>
    );
}