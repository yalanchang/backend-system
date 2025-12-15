export interface User {
    id: number;
    name: string;
    email: string;
    role: 'admin' | 'manager' | 'member';
    avatar?: string;
    created_at: string;
}

export interface Project {
    id: number;
    name: string;
    description?: string;
    status: 'planning' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    start_date?: string;
    end_date?: string;
    budget?: number;
    owner_id?: number;
    owner_name?: string;
    task_count?: number;
    completed_tasks?: number;
    created_at: string;
}

export interface Task {
    id: number;
    project_id: number;
    project_name?: string;
    title: string;
    description?: string;
    status: 'todo' | 'in_progress' | 'review' | 'done';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    assignee_id?: number;
    assignee_name?: string;
    due_date?: string;
    estimated_hours?: number;
    actual_hours?: number;
    created_at: string;
}