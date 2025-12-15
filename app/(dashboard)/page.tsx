
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

async function getStats() {
    const [projectStats] = await pool.query<RowDataPacket[]>(`
        SELECT 
            COUNT(*) as total,
            SUM(status = 'in_progress') as in_progress,
            SUM(status = 'completed') as completed
        FROM projects
    `);

    const [taskStats] = await pool.query<RowDataPacket[]>(`
        SELECT 
            COUNT(*) as total,
            SUM(status = 'todo') as todo,
            SUM(status = 'in_progress') as in_progress,
            SUM(status = 'done') as done
        FROM tasks
    `);

    const [recentProjects] = await pool.query<RowDataPacket[]>(`
        SELECT p.*, u.name as owner_name
        FROM projects p
        LEFT JOIN users u ON p.owner_id = u.id
        ORDER BY p.created_at DESC
        LIMIT 5
    `);

    const [upcomingTasks] = await pool.query<RowDataPacket[]>(`
        SELECT t.*, p.name as project_name, u.name as assignee_name
        FROM tasks t
        LEFT JOIN projects p ON t.project_id = p.id
        LEFT JOIN users u ON t.assignee_id = u.id
        WHERE t.status != 'done' AND t.due_date IS NOT NULL
        ORDER BY t.due_date ASC
        LIMIT 5
    `);

    return {
        projects: projectStats[0],
        tasks: taskStats[0],
        recentProjects,
        upcomingTasks,
    };
}

export default async function DashboardPage() {
    const stats = await getStats();

    return (
        <div>
            <h1 className="text-3xl font-bold mb-8">儀表板</h1>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <StatCard title="專案總數" value={stats.projects.total} icon="📁" color="blue" />
                <StatCard title="進行中專案" value={stats.projects.in_progress} icon="🚀" color="yellow" />
                <StatCard title="待處理任務" value={stats.tasks.todo} icon="📝" color="red" />
                <StatCard title="已完成任務" value={stats.tasks.done} icon="✅" color="green" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white rounded-xl p-6 shadow-sm">
                    <h2 className="text-xl font-bold mb-4">最近專案</h2>
                    <div className="space-y-3">
                        {stats.recentProjects.map((project: any) => (
                            <div key={project.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                <div>
                                    <p className="font-medium">{project.name}</p>
                                    <p className="text-sm text-gray-500">{project.owner_name}</p>
                                </div>
                                <StatusBadge status={project.status} />
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm">
                    <h2 className="text-xl font-bold mb-4">即將到期任務</h2>
                    <div className="space-y-3">
                        {stats.upcomingTasks.map((task: any) => (
                            <div key={task.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                <div>
                                    <p className="font-medium">{task.title}</p>
                                    <p className="text-sm text-gray-500">{task.project_name}</p>
                                </div>
                                <span className="text-sm text-gray-500">{task.due_date}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatCard({ title, value, icon, color }: { title: string; value: number; icon: string; color: string }) {
    const colorClasses: Record<string, string> = {
        blue: 'bg-blue-100 text-blue-600',
        yellow: 'bg-yellow-100 text-yellow-600',
        red: 'bg-red-100 text-red-600',
        green: 'bg-green-100 text-green-600',
    };

    return (
        <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl ${colorClasses[color]}`}>
                    {icon}
                </div>
                <div>
                    <p className="text-gray-500 text-sm">{title}</p>
                    <p className="text-2xl font-bold">{value || 0}</p>
                </div>
            </div>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const statusConfig: Record<string, { label: string; class: string }> = {
        planning: { label: '規劃中', class: 'bg-gray-100 text-gray-600' },
        in_progress: { label: '進行中', class: 'bg-blue-100 text-blue-600' },
        on_hold: { label: '暫停', class: 'bg-yellow-100 text-yellow-600' },
        completed: { label: '已完成', class: 'bg-green-100 text-green-600' },
        cancelled: { label: '已取消', class: 'bg-red-100 text-red-600' },
    };

    const config = statusConfig[status] || statusConfig.planning;

    return (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.class}`}>
            {config.label}
        </span>
    );
}