import { ActivityLog } from './types';

interface ActivityParams {
  action: string;
  description: string;
  entity_type: 'project' | 'task' | 'user' | 'calendar_event';
  entity_id: string;
  user_id: string;
  user_name?: string;
  old_values?: any;
  new_values?: any;
  metadata?: any;
}

const fieldNameMap: Record<string, string> = {
  project_id: '所屬專案',
  title: '標題',
  description: '描述',
  status: '狀態',
  priority: '優先級',
  assignee_id: '負責人',
  due_date: '截止日期',
  estimated_hours: '預估時數',
  actual_hours: '實際時數',
  name: '名稱',
  start_date: '開始日期',
  end_date: '結束日期',
  budget: '預算',
  owner_id: '負責人',
  role: '角色',
  email: '信箱',
};

const statusMap: Record<string, string> = {
  todo: '待處理',
  in_progress: '進行中',
  review: '審核中',
  done: '已完成',
  planning: '規劃中',
  on_hold: '暫停',
  completed: '已完成',
  cancelled: '已取消',
};

const priorityMap: Record<string, string> = {
  low: '低',
  medium: '中',
  high: '高',
  urgent: '緊急',
};

function formatValue(key: string, value: any): string {
  if (value === null || value === undefined) return '無';
  if (key === 'status') return statusMap[value] || value;
  if (key === 'priority') return priorityMap[value] || value;
  return String(value);
}

/**
 * 格式化活動紀錄描述（純文字，不含圖示）
 */
export function formatActivityDescription(activity: ActivityLog): string {
  const { action, description, old_values, new_values } = activity;

  switch (action) {
    case 'update':
      if (old_values && new_values) {
        const changes = Object.keys(new_values)
          .filter(key => JSON.stringify(old_values[key]) !== JSON.stringify(new_values[key]))
          .map(key => {
            const label = fieldNameMap[key] || key;
            const oldVal = formatValue(key, old_values[key]);
            const newVal = formatValue(key, new_values[key]);
            return `${label}: ${oldVal} → ${newVal}`;
          });

        return changes.length > 0
          ? `${description} (${changes.join(', ')})`
          : description;
      }
      return description;
    default:
      return description;
  }
}

// SVG 路徑定義
const svgPaths: Record<string, string> = {
  create: 'M12 4v16m8-8H4',                                                                                          // plus
  update: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z', // pencil
  delete: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16', // trash
  login: 'M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1',          // login
  logout: 'M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1',            // logout
  upload: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12',                                        // upload
  download: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4',                                      // download
  comment: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z', // chat
  approve: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',                                                         // check-circle
  reject: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z',                                  // x-circle
  complete: 'M5 13l4 4L19 7',                                                                                         // check
  start: 'M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z M21 12a9 9 0 11-18 0 9 9 0 0118 0z', // play
  pause: 'M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z',                                                           // pause
  resume: 'M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z M21 12a9 9 0 11-18 0 9 9 0 0118 0z', // play
  default: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2', // clipboard
};

/**
 * 取得活動 SVG 圖示（回傳 JSX string，需在元件中用 dangerouslySetInnerHTML 或直接用 getActivityIconJSX）
 */
export function getActivityIcon(action: string): string {
  // 保留給需要純字串的地方，回傳 action 名稱
  return action;
}

/**
 * 取得活動 SVG 圖示 React 元素
 */
// activity.ts 裡
export function getActivityIconConfig(action: string): { path: string; colorClass: string } {
  const path = svgPaths[action] || svgPaths.default;
  const colorMap: Record<string, string> = {
    create: 'text-green-600 bg-green-100',
    update: 'text-yellow-600 bg-yellow-100',
    delete: 'text-red-600 bg-red-100',
    login: 'text-blue-600 bg-blue-100',
    logout: 'text-gray-600 bg-gray-100',
    comment: 'text-cyan-600 bg-cyan-100',
  };
  return { path, colorClass: colorMap[action] || 'text-gray-600 bg-gray-100' };
}   