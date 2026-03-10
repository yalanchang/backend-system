'use client';

import { useState, useEffect } from 'react';

export default function DashboardPage() {
    const [stats, setStats] = useState({
        projects: { total: 0, in_progress: 0, completed: 0 },
        tasks: { total: 0, todo: 0, in_progress: 0, done: 0 },
        upcomingTasks: [],
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchStats() {
            try {
                const res = await fetch('/api/reports?days=7');
                const data = await res.json();
                
                if (data.success) {
                    const projectStats = data.data.projectStats || {};
                    const taskStats = data.data.taskStats || {};
                    
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
                        upcomingTasks: data.data.upcomingTasks || [],
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
                <div className="text-gray-500">載入中...</div>
            </div>
        );
    }

    return (
        <div>
            <h1 className="text-3xl font-bold mb-8 text-gray-900">儀表板</h1>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <StatCard title="專案總數" value={stats.projects.total}  color="blue" />
                <StatCard title="進行中專案" value={stats.projects.in_progress}color="yellow" />
                <StatCard title="待處理任務" value={stats.tasks.todo} color="red" />
                <StatCard title="已完成任務" value={stats.tasks.done} color="green" />
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm">
                <h2 className="text-xl font-bold mb-4 text-gray-900">即將到期任務</h2>
                <div className="space-y-3">
                    {stats.upcomingTasks.length === 0 ? (
                        <p className="text-gray-500">沒有即將到期的任務</p>
                    ) : (
                        stats.upcomingTasks.map((task: any) => (
                            <div key={task.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                <div>
                                    <p className="font-medium text-gray-900">{task.title}</p>
                                    <p className="text-sm text-gray-500">{task.project_name}</p>
                                </div>
                                <span className="text-sm text-gray-500">{task.due_date}</span>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

function StatCard({ title, value,  color }: { title: string; value: number; color: string }) {
    const colorClasses: Record<string, string> = {
        blue: 'bg-blue-100 text-blue-600',
        yellow: 'bg-yellow-100 text-yellow-600',
        red: 'bg-red-100 text-red-600',
        green: 'bg-green-100 text-green-600',
    };

    return (
        <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-4">
               
                <div>
                    <p className="text-gray-500 text-sm">{title}</p>
                    <p className="text-2xl font-bold text-gray-900">{value}</p>
                </div>
            </div>
        </div>
    );
}