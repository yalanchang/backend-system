import { ActivityLog } from './types';

interface ActivityParams {
  action: string;
  description: string;
  entity_type: 'project' | 'task' | 'user';
  entity_id: string;
  user_id: string;
  user_name?: string;
  old_values?: any;
  new_values?: any;
  metadata?: any;
}

/**
 * 記錄活動紀錄
 */
export async function logActivity(params: ActivityParams): Promise<void> {
  try {
    const { 
      action, 
      description, 
      entity_type, 
      entity_id,
      user_id, 
      user_name,
      old_values,
      new_values,
      metadata
    } = params;
    
    // 在伺服器端記錄
    const response = await fetch('/api/activity', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action,
        description,
        entity_type,
        entity_id,
        user_id,
        user_name,
        ip_address: '', // 可從 headers 取得
        user_agent: '', // 可從 headers 取得
        old_values,
        new_values,
        metadata: {
          ...metadata,
          timestamp: new Date().toISOString()
        }
      })
    });
    
    const data = await response.json();
    
    if (!data.success) {
      console.error('記錄活動失敗:', data.error);
    }
  } catch (error) {
    console.error('記錄活動錯誤:', error);
  }
}

/**
 * 專案相關活動紀錄
 */
export const projectActivities = {
  create: (project: any, user: any) => 
    logActivity({
      action: 'create',
      description: `建立新的專案「${project.name}」`,
      entity_type: 'project',
      entity_id: project.id,
      user_id: user.id,
      user_name: user.name,
      new_values: project
    }),
  
  update: (projectId: string, oldData: any, newData: any, user: any) => {
    const changes: Record<string, any> = {};
    
    Object.keys(newData).forEach(key => {
      if (JSON.stringify(oldData[key]) !== JSON.stringify(newData[key])) {
        changes[key] = {
          old: oldData[key],
          new: newData[key]
        };
      }
    });
    
    if (Object.keys(changes).length > 0) {
      return logActivity({
        action: 'update',
        description: `更新專案「${oldData.name}」的${Object.keys(changes).join('、')}`,
        entity_type: 'project',
        entity_id: projectId,
        user_id: user.id,
        user_name: user.name,
        old_values: oldData,
        new_values: newData,
        metadata: { changes }
      });
    }
  },
  
  delete: (project: any, user: any) =>
    logActivity({
      action: 'delete',
      description: `刪除專案「${project.name}」`,
      entity_type: 'project',
      entity_id: project.id,
      user_id: user.id,
      user_name: user.name,
      old_values: project
    })
};

/**
 * 使用者相關活動紀錄
 */
export const userActivities = {
  login: (user: any, ip?: string, userAgent?: string) =>
    logActivity({
      action: 'login',
      description: '使用者登入系統',
      entity_type: 'user',
      entity_id: user.id,
      user_id: user.id,
      user_name: user.name,
      metadata: { ip, userAgent }
    }),
  
  logout: (user: any) =>
    logActivity({
      action: 'logout',
      description: '使用者登出系統',
      entity_type: 'user',
      entity_id: user.id,
      user_id: user.id,
      user_name: user.name
    })
};

/**
 * 格式化活動紀錄描述
 */
export function formatActivityDescription(activity: ActivityLog): string {
  const { action, description, old_values, new_values } = activity;
  
  switch (action) {
    case 'create':
      return `📝 ${description}`;
    case 'update':
      if (old_values && new_values) {
        const changes = Object.keys(new_values)
          .filter(key => JSON.stringify(old_values[key]) !== JSON.stringify(new_values[key]))
          .map(key => `${key}: ${old_values[key]} → ${new_values[key]}`);
        
        return `✏️ ${description} (${changes.join(', ')})`;
      }
      return `✏️ ${description}`;
    case 'delete':
      return `🗑️ ${description}`;
    case 'login':
      return `🔐 ${description}`;
    case 'logout':
      return `👋 ${description}`;
    default:
      return `📋 ${description}`;
  }
}

/**
 * 取得活動圖示
 */
export function getActivityIcon(action: string): string {
  const icons: Record<string, string> = {
    create: '📝',
    update: '✏️',
    delete: '🗑️',
    login: '🔐',
    logout: '👋',
    upload: '📤',
    download: '📥',
    share: '📤',
    comment: '💬',
    approve: '✅',
    reject: '❌',
    complete: '🏁',
    start: '🚀',
    pause: '⏸️',
    resume: '▶️'
  };
  
  return icons[action] || '📋';
}