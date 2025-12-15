// 專案類型
export interface Project {
    id: string;
    name: string;
    description: string;
    status: 'planning' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled';
    priority: 'low' | 'medium' | 'high';
    start_date: string;
    end_date: string;
    budget: number;
    owner_id: string;
    owner_name?: string;
    created_at?: string;
    updated_at?: string;
  }
  
  // 使用者類型
  export interface User {
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'manager' | 'member';
    department?: string;
    avatar_url?: string;
    created_at?: string;
    updated_at?: string;
  }
  
  // 任務類型
  export interface Task {
    id: string;
    project_id: string;
    title: string;
    description: string;
    status: 'todo' | 'in_progress' | 'review' | 'done';
    priority: 'low' | 'medium' | 'high';
    assignee_id?: string;
    assignee_name?: string;
    due_date?: string;
    estimated_hours?: number;
    actual_hours?: number;
    created_at?: string;
    updated_at?: string;
  }
  
  // 專案統計
  export interface ProjectStats {
    total_projects: number;
    active_projects: number;
    completed_projects: number;
    total_budget: number;
    average_budget: number;
  }
  
  // API 回應格式
  export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
  }
  
  // 分頁參數
  export interface PaginationParams {
    page?: number;
    limit?: number;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
  }
  
  // 分頁回應
  export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      total_pages: number;
      has_next: boolean;
      has_prev: boolean;
    };
  }
  
  // 專案查詢參數
  export interface ProjectQueryParams extends PaginationParams {
    status?: Project['status'];
    priority?: Project['priority'];
    owner_id?: string;
    search?: string;
    start_date_from?: string;
    start_date_to?: string;
  }
  
  // 專案建立/更新資料
  export interface ProjectFormData {
    name: string;
    description: string;
    status: Project['status'];
    priority: Project['priority'];
    start_date: string;
    end_date: string;
    budget: number;
    owner_id: string;
  }
  
  // 使用者查詢參數
  export interface UserQueryParams extends PaginationParams {
    role?: User['role'];
    department?: string;
    search?: string;
  }
  
  // 任務查詢參數
  export interface TaskQueryParams extends PaginationParams {
    project_id?: string;
    status?: Task['status'];
    priority?: Task['priority'];
    assignee_id?: string;
    search?: string;
  }
  
  // 表單驗證錯誤
  export interface ValidationError {
    field: string;
    message: string;
  }
  
  // API 錯誤回應
  export interface ApiError {
    success: false;
    error: string;
    validation_errors?: ValidationError[];
    status?: number;
  }
  
  // 成功回應
  export interface ApiSuccess<T = any> {
    success: true;
    data: T;
    message?: string;
  }
  
  // 合併的 API 回應類型
  export type ApiResult<T = any> = ApiSuccess<T> | ApiError;
  
  // 圖表資料點
  export interface ChartDataPoint {
    label: string;
    value: number;
    color?: string;
  }
  
  // 時間序列資料
  export interface TimeSeriesData {
    date: string;
    value: number;
  }
  
  // 專案進度報告
  export interface ProjectProgressReport {
    project_id: string;
    project_name: string;
    completion_percentage: number;
    tasks_completed: number;
    tasks_total: number;
    budget_utilization: number;
    timeline_status: 'on_track' | 'delayed' | 'ahead';
  }
  
  // 通知類型
  export interface Notification {
    id: string;
    type: 'info' | 'warning' | 'error' | 'success';
    title: string;
    message: string;
    read: boolean;
    created_at: string;
    link?: string;
  }
  
  // 檔案附件
  export interface Attachment {
    id: string;
    filename: string;
    filetype: string;
    filesize: number;
    url: string;
    uploaded_by: string;
    uploaded_by_name?: string;
    created_at: string;
  }
  
  // 評論
  export interface Comment {
    id: string;
    content: string;
    user_id: string;
    user_name: string;
    user_avatar?: string;
    created_at: string;
    updated_at: string;
  }
  
  // 專案活動記錄
  export interface ActivityLog {
    id: string;
    action: string;
    description: string;
    user_id: string;
    user_name: string;
    entity_type: 'project' | 'task' | 'user' | string;
    entity_id: string;
    ip_address?: string;
    user_agent?: string;
    old_values?: Record<string, any> | null;
    new_values?: Record<string, any> | null;
    metadata?: Record<string, any> | null;
    created_at: string;
    updated_at?: string;
  }
  
  // 儀表板統計
  export interface DashboardStats {
    projects: {
      total: number;
      by_status: Record<Project['status'], number>;
      by_priority: Record<Project['priority'], number>;
    };
    tasks: {
      total: number;
      by_status: Record<Task['status'], number>;
      overdue: number;
    };
    users: {
      total: number;
      active: number;
    };
    recent_activities: ActivityLog[];
  }
  
  // 匯入/匯出設定
  export interface ExportConfig {
    format: 'csv' | 'excel' | 'pdf';
    include_fields: string[];
    filters?: Record<string, any>;
  }
  
  // 系統設定
  export interface SystemSettings {
    theme: 'light' | 'dark' | 'auto';
    language: 'zh-TW' | 'en' | 'ja';
    notifications: {
      email: boolean;
      push: boolean;
      desktop: boolean;
    };
    date_format: string;
    time_format: string;
  }
  
  // 角色權限
  export interface RolePermission {
    role: User['role'];
    permissions: string[];
  }
  
  // 選項列表類型
  export interface SelectOption {
    value: string;
    label: string;
    disabled?: boolean;
  }
  
  // 狀態映射
  export const STATUS_OPTIONS: SelectOption[] = [
    { value: 'pending', label: '待處理' },
    { value: 'in_progress', label: '進行中' },
    { value: 'completed', label: '已完成' },
    { value: 'cancelled', label: '已取消' },
  ];
  
  // 優先級映射
  export const PRIORITY_OPTIONS: SelectOption[] = [
    { value: 'low', label: '低' },
    { value: 'medium', label: '中' },
    { value: 'high', label: '高' },
  ];
  
  // 使用者角色映射
  export const ROLE_OPTIONS: SelectOption[] = [
    { value: 'admin', label: '管理員' },
    { value: 'manager', label: '經理' },
    { value: 'member', label: '成員' },
  ];
  
  // 任務狀態映射
  export const TASK_STATUS_OPTIONS: SelectOption[] = [
    { value: 'todo', label: '待處理' },
    { value: 'in_progress', label: '進行中' },
    { value: 'review', label: '審核中' },
    { value: 'done', label: '已完成' },
  ];

  // lib/types.ts - 新增行事曆相關類型

// 行事曆事件
export interface CalendarEvent {
    id: string;
    title: string;
    description?: string;
    start_time: string;
    end_time: string;
    all_day: boolean;
    event_type: 'meeting' | 'task' | 'milestone' | 'reminder' | 'holiday' | 'custom';
    entity_type?: 'project' | 'task' | 'user' | 'none';
    entity_id?: string;
    project_id?: string;
    project_name?: string;
    location?: string;
    color?: string;
    recurrence_rule?: string;
    created_by: string;
    created_by_name?: string;
    created_at: string;
    updated_at: string;
    participants?: EventParticipant[];
  }
  
  // 事件參與者
  export interface EventParticipant {
    id: string;
    event_id: string;
    user_id: string;
    user_name?: string;
    user_email?: string;
    status: 'pending' | 'accepted' | 'declined' | 'tentative';
    response_note?: string;
    responded_at?: string;
  }
  
  // 行事曆檢視類型
  export type CalendarView = 'day' | 'week' | 'month' | 'agenda';
  
  // 行事曆查詢參數
  export interface CalendarQueryParams {
    start_date: string;
    end_date: string;
    project_id?: string;
    user_id?: string;
    event_type?: CalendarEvent['event_type'];
  }
  
  // 事件建立/更新資料
  export interface CalendarEventFormData {
    title: string;
    description?: string;
    start_time: string;
    end_time: string;
    all_day?: boolean;
    event_type: CalendarEvent['event_type'];
    entity_type?: CalendarEvent['entity_type'];
    entity_id?: string;
    project_id?: string;
    location?: string;
    color?: string;
    recurrence_rule?: string;
    participants?: string[]; // 使用者ID陣列
  }