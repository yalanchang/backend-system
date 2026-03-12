
'use client';

import { useState, useEffect } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    PointElement,
    LineElement,
} from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    PointElement,
    LineElement
);

interface ReportData {
    projectStats: {
        total: number;
        by_status: { status: string; count: number }[];
    };
    taskStats: {
        total: number;
        by_status: { status: string; count: number }[];
        by_priority: { priority: string; count: number }[];
    };
    userStats: {
        total: number;
        by_role: { role: string; count: number }[];
    };
    weeklyTasks: { date: string; completed: number; created: number }[];
    topUsers: { name: string; completed_tasks: number }[];
}

export default function ReportsPage() {
    const [data, setData] = useState<ReportData | null>(null);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState('7'); // 7, 30, 90 days

    useEffect(() => {
        fetchReportData();
    }, [dateRange]);

    const fetchReportData = async () => {
        try {
            const res = await fetch(`/api/reports?days=${dateRange}`);
            const result = await res.json();
            if (result.success) {
                setData(result.data);
            }
        } catch (error) {
            console.error('取得報表失敗:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="text-gray-800">載入中...</div>;
    }

    if (!data) {
        return <div className="text-gray-800">無法載入報表資料</div>;
    }

    // 任務狀態圓餅圖
    const taskStatusData = {
        labels: data.weeklyTasks.map(d => formatDate(d.date)),
                datasets: [{
            data: data.taskStats.by_status.map(s => s.count),
            backgroundColor: ['#9CA3AF', '#3B82F6', '#F59E0B', '#22C55E'],
        }],
    };

    // 專案狀態長條圖
    const projectStatusData = {
        labels: data.projectStats.by_status.map(s => getProjectStatusLabel(s.status)),
        datasets: [{
            label: '專案數量',
            data: data.projectStats.by_status.map(s => s.count),
            backgroundColor: '#3B82F6',
        }],
    };

    // 每週任務趨勢
    const weeklyData = {
        labels: data.weeklyTasks.map(d => d.date),
        datasets: [
            {
                label: '新增任務',
                data: data.weeklyTasks.map(d => d.created),
                borderColor: '#3B82F6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                fill: true,
            },
            {
                label: '完成任務',
                data: data.weeklyTasks.map(d => d.completed),
                borderColor: '#22C55E',
                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                fill: true,
            },
        ],
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900">報表統計</h1>
                <select
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-800 bg-white"
                >
                    <option value="7">最近 7 天</option>
                    <option value="30">最近 30 天</option>
                    <option value="90">最近 90 天</option>
                </select>
            </div>

            {/* 統計卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <StatCard title="總專案數" value={data.projectStats.total} color="blue" />
                <StatCard title="總任務數" value={data.taskStats.total}  color="green" />
                <StatCard title="總使用者" value={data.userStats.total} color="purple" />
                <StatCard 
                    title="完成率" 
                    value={`${calculateCompletionRate(data.taskStats.by_status)}%`} 
                    color="orange" 
                />
            </div>

            {/* 圖表 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <div className="bg-white rounded-xl p-6 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">任務狀態分佈</h3>
                    <div className="h-64">
                        <Pie data={taskStatusData} options={{ maintainAspectRatio: false }} />
                    </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">專案狀態統計</h3>
                    <div className="h-64">
                        <Bar data={projectStatusData} options={{ maintainAspectRatio: false }} />
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm mb-8">
                <h3 className="text-lg font-bold text-gray-800 mb-4">任務趨勢</h3>
                <div className="h-80">
                    <Line data={weeklyData} options={{ maintainAspectRatio: false }} />
                </div>
            </div>

            {/* 排行榜 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white rounded-xl p-6 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">任務完成排行</h3>
                    <div className="space-y-3">
                        {data.topUsers.map((user, index) => (
                            <div key={user.name} className="flex items-center gap-3">
                                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${
                                    index === 0 ? 'bg-yellow-100 text-yellow-600' :
                                    index === 1 ? 'bg-gray-100 text-gray-600' :
                                    index === 2 ? 'bg-orange-100 text-orange-600' :
                                    'bg-gray-50 text-gray-500'
                                }`}>
                                    {index + 1}
                                </span>
                                <span className="flex-1 text-gray-800">{user.name}</span>
                                <span className="font-bold text-gray-800">{user.completed_tasks} 個任務</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">任務優先級分佈</h3>
                    <div className="space-y-3">
                        {data.taskStats.by_priority.map((p) => (
                            <div key={p.priority} className="flex items-center gap-3">
                                <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityClass(p.priority)}`}>
                                    {getPriorityLabel(p.priority)}
                                </span>
                                <div className="flex-1 bg-gray-100 rounded-full h-2">
                                    <div
                                        className={`h-2 rounded-full ${getPriorityBarClass(p.priority)}`}
                                        style={{ width: `${(p.count / data.taskStats.total) * 100}%` }}
                                    />
                                </div>
                                <span className="text-gray-600 text-sm">{p.count}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatCard({ title, value,  color }: { title: string; value: number | string; color: string }) {
    const colorClasses: Record<string, string> = {
        blue: 'bg-blue-100 text-blue-600',
        green: 'bg-green-100 text-green-600',
        purple: 'bg-purple-100 text-purple-600',
        orange: 'bg-orange-100 text-orange-600',
    };

    return (
        <div className="bg-white rounded-xl p-6 shadow-sm">
           
           <div className=" items-center">
           <p className="text-gray-500 text-sm">{title}</p>
                    <p className="text-2xl font-bold text-gray-800">{value}</p>
                </div>
        </div>
    );
}

function getStatusLabel(status: string) {
    const labels: Record<string, string> = {
        todo: '待處理',
        in_progress: '進行中',
        review: '審核中',
        done: '已完成',
    };
    return labels[status] || status;
}

function getProjectStatusLabel(status: string) {
    const labels: Record<string, string> = {
        planning: '規劃中',
        in_progress: '進行中',
        on_hold: '暫停',
        completed: '已完成',
        cancelled: '已取消',
    };
    return labels[status] || status;
}

function getPriorityLabel(priority: string) {
    const labels: Record<string, string> = {
        low: '低',
        medium: '中',
        high: '高',
        urgent: '緊急',
    };
    return labels[priority] || priority;
}

function getPriorityClass(priority: string) {
    const classes: Record<string, string> = {
        low: 'bg-gray-100 text-gray-600',
        medium: 'bg-blue-100 text-blue-600',
        high: 'bg-orange-100 text-orange-600',
        urgent: 'bg-red-100 text-red-600',
    };
    return classes[priority] || '';
}

function getPriorityBarClass(priority: string) {
    const classes: Record<string, string> = {
        low: 'bg-gray-400',
        medium: 'bg-blue-500',
        high: 'bg-orange-500',
        urgent: 'bg-red-500',
    };
    return classes[priority] || 'bg-gray-400';
}

function calculateCompletionRate(byStatus: { status: string; count: number }[]) {
    const total = byStatus.reduce((sum, s) => sum + s.count, 0);
    const done = byStatus.find(s => s.status === 'done')?.count || 0;
    return total > 0 ? Math.round((done / total) * 100) : 0;
}
function formatDate(dateStr: string) {
    const d = new Date(dateStr);
    return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
}