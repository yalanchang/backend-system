import pool from '@/lib/db';

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

/**
 * 記錄活動紀錄
 */
export async function logActivity(params: ActivityParams): Promise<void> {
  try {
    await pool.query(
      `INSERT INTO activity_logs (
        action, description, entity_type, entity_id,
        user_id, user_name, old_values, new_values, metadata
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        params.action,
        params.description,
        params.entity_type,
        params.entity_id,
        params.user_id,
        params.user_name || null,
        params.old_values ? JSON.stringify(params.old_values) : null,
        params.new_values ? JSON.stringify(params.new_values) : null,
        params.metadata ? JSON.stringify(params.metadata) : null,
      ]
    );
  } catch (error) {
    console.error('logActivity 失敗:', error);
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
