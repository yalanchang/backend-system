-- 建立資料庫
CREATE DATABASE project_management;
USE project_management;

-- 使用者表
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'manager', 'member') DEFAULT 'member',
    avatar VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 專案表
CREATE TABLE projects (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    status ENUM('planning', 'in_progress', 'on_hold', 'completed', 'cancelled') DEFAULT 'planning',
    priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
    start_date DATE,
    end_date DATE,
    budget DECIMAL(15, 2),
    owner_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 專案成員表
CREATE TABLE project_members (
    id INT PRIMARY KEY AUTO_INCREMENT,
    project_id INT NOT NULL,
    user_id INT NOT NULL,
    role ENUM('owner', 'manager', 'member', 'viewer') DEFAULT 'member',
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_member (project_id, user_id)
);

-- 任務表
CREATE TABLE tasks (
    id INT PRIMARY KEY AUTO_INCREMENT,
    project_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    status ENUM('todo', 'in_progress', 'review', 'done') DEFAULT 'todo',
    priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
    assignee_id INT,
    due_date DATE,
    estimated_hours DECIMAL(5, 2),
    actual_hours DECIMAL(5, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (assignee_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 新增測試資料
INSERT INTO users (name, email, password, role) VALUES
('Admin', 'admin@example.com', '$2a$10$xxxxx', 'admin'),
('張經理', 'manager@example.com', '$2a$10$xxxxx', 'manager'),
('李成員', 'member@example.com', '$2a$10$xxxxx', 'member');

INSERT INTO projects (name, description, status, priority, start_date, end_date, owner_id) VALUES
('電商網站重構', '重新設計電商網站前端架構', 'in_progress', 'high', '2025-01-01', '2025-03-31', 1),
('手機 App 開發', '開發 iOS 和 Android 版本', 'planning', 'medium', '2025-02-01', '2025-06-30', 2),
('後台管理系統', '建立內部管理後台', 'in_progress', 'urgent', '2025-01-15', '2025-04-15', 1);

INSERT INTO tasks (project_id, title, status, priority, assignee_id) VALUES
(1, '設計首頁', 'todo', 'high', 1),
(1, '開發購物車', 'in_progress', 'medium', 2);

SET FOREIGN_KEY_CHECKS = 1;

-- 評論表
CREATE TABLE comments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    task_id INT NOT NULL,
    user_id INT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 檔案附件表
CREATE TABLE attachments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    task_id INT,
    project_id INT,
    user_id INT NOT NULL,
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_size INT NOT NULL,
    file_type VARCHAR(100),
    file_path VARCHAR(500) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 通知表
CREATE TABLE notifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    type ENUM('task_assigned', 'task_comment', 'task_due', 'project_invite', 'mention') NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    link VARCHAR(500),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 標籤表
CREATE TABLE tags (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL,
    color VARCHAR(20) DEFAULT '#3B82F6',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 任務標籤關聯表
CREATE TABLE task_tags (
    task_id INT NOT NULL,
    tag_id INT NOT NULL,
    PRIMARY KEY (task_id, tag_id),
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

-- 活動日誌表
CREATE TABLE activity_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    action VARCHAR(50) NOT NULL,
    entity_type ENUM('project', 'task', 'user', 'comment') NOT NULL,
    entity_id INT NOT NULL,
    old_value TEXT,
    new_value TEXT,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 時間記錄表
CREATE TABLE time_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    task_id INT NOT NULL,
    user_id INT NOT NULL,
    hours DECIMAL(5,2) NOT NULL,
    description TEXT,
    log_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 新增預設標籤
INSERT INTO tags (name, color) VALUES
('Bug', '#EF4444'),
('Feature', '#22C55E'),
('Enhancement', '#3B82F6'),
('Documentation', '#8B5CF6'),
('Urgent', '#F97316');

INSERT INTO project_members (id, project_id, user_id, role) VALUES
(1, 2, 2, 'owner')

-- 建立活動紀錄表
CREATE TABLE IF NOT EXISTS activity_logs (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  action VARCHAR(50) NOT NULL COMMENT '操作類型',
  description TEXT NOT NULL COMMENT '操作描述',
  entity_type VARCHAR(50) NOT NULL COMMENT '實體類型: project, task, user',
  entity_id VARCHAR(36) NOT NULL COMMENT '實體ID',
  user_id VARCHAR(36) NOT NULL COMMENT '操作者ID',
  user_name VARCHAR(100) COMMENT '操作者姓名',
  ip_address VARCHAR(45) COMMENT 'IP地址',
  user_agent TEXT COMMENT '瀏覽器資訊',
  old_values JSON COMMENT '修改前的值',
  new_values JSON COMMENT '修改後的值',
  metadata JSON COMMENT '額外資訊',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_entity (entity_type, entity_id),
  INDEX idx_user (user_id),
  INDEX idx_created_at (created_at)
);

DROP TABLE activity_logs;
-- 插入測試資料
INSERT INTO activity_logs (id, action, description, entity_type, entity_id, user_id, user_name, old_values, new_values) VALUES
('act-001', 'create', '建立新的專案「網站改版專案」', 'project', '1', 'user-001', '張三', NULL, '{"name": "網站改版專案", "status": "pending"}'),
('act-002', 'update', '更新專案狀態為進行中', 'project', '1', 'user-001', '張三', '{"status": "pending"}', '{"status": "in_progress"}'),
('act-003', 'create', '建立新任務「設計首頁」', 'task', 'task-001', 'user-002', '李四', NULL, '{"title": "設計首頁", "status": "todo"}'),
('act-004', 'delete', '刪除使用者「測試帳號」', 'user', 'user-999', 'user-001', '張三', '{"name": "測試帳號", "email": "test@example.com"}', NULL),
('act-005', 'login', '使用者登入系統', 'user', 'user-002', 'user-002', '李四', NULL, '{"login_time": "2024-01-15T10:30:00Z"}');

  -- 建立行事曆事件表
CREATE TABLE IF NOT EXISTS calendar_events (
  id VARCHAR(36) PRIMARY KEY,
  title VARCHAR(200) NOT NULL COMMENT '事件標題',
  description TEXT COMMENT '事件描述',
  start_time DATETIME NOT NULL COMMENT '開始時間',
  end_time DATETIME NOT NULL COMMENT '結束時間',
  all_day BOOLEAN DEFAULT FALSE COMMENT '是否全天事件',
  event_type ENUM('meeting', 'task', 'milestone', 'reminder', 'holiday', 'custom') DEFAULT 'custom',
  entity_type ENUM('project', 'task', 'user', 'none') DEFAULT 'none',
  entity_id VARCHAR(36) COMMENT '關聯實體ID',
  project_id VARCHAR(36) COMMENT '關聯專案ID',
  location VARCHAR(500) COMMENT '地點',
  color VARCHAR(7) COMMENT '顏色代碼',
  recurrence_rule TEXT COMMENT '重複規則',
  created_by VARCHAR(36) NOT NULL COMMENT '建立者',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  INDEX idx_time_range (start_time, end_time),
  INDEX idx_entity (entity_type, entity_id),
  INDEX idx_project (project_id),
  INDEX idx_created_by (created_by)
);

-- 建立事件參與者表
CREATE TABLE IF NOT EXISTS event_participants (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  event_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  status ENUM('pending', 'accepted', 'declined', 'tentative') DEFAULT 'pending',
  response_note TEXT COMMENT '回覆備註',
  responded_at TIMESTAMP NULL,
  FOREIGN KEY (event_id) REFERENCES calendar_events(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_participation (event_id, user_id),
  INDEX idx_event (event_id),
  INDEX idx_user (user_id)
);

-- 插入測試資料
INSERT INTO calendar_events (id, title, description, start_time, end_time, event_type, project_id, color, created_by) VALUES
('event-001', '專案啟動會議', '網站改版專案啟動會議', '2024-01-15 09:00:00', '2024-01-15 11:00:00', 'meeting', '1', '#3B82F6', 'user-001'),
('event-002', '設計稿審核', '首頁設計稿審核會議', '2024-01-18 14:00:00', '2024-01-18 16:00:00', 'meeting', '1', '#8B5CF6', 'user-002'),
('event-003', '開發階段開始', '開始進行網站開發', '2024-01-20 00:00:00', '2024-01-20 23:59:59', 'milestone', '1', '#10B981', 'user-001'),
('event-004', '測試階段', '進行系統測試', '2024-03-01 00:00:00', '2024-03-07 23:59:59', 'task', '1', '#F59E0B', 'user-003'),
('event-005', '團隊聚餐', '團隊季度聚餐', '2024-01-25 18:00:00', '2024-01-25 20:00:00', 'custom', NULL, '#EC4899', 'user-001');

INSERT INTO event_participants (event_id, user_id, status) VALUES
('event-001', 'user-001', 'accepted'),
('event-001', 'user-002', 'accepted'),
('event-001', 'user-003', 'pending'),
('event-002', 'user-002', 'accepted'),
('event-002', 'user-001', 'pending');

-- 簡單版本，沒有外鍵約束
DROP TABLE IF EXISTS calendar_events;

CREATE TABLE calendar_events (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  title VARCHAR(200) NOT NULL,
  description TEXT,
  start_time DATETIME NOT NULL,
  end_time DATETIME NOT NULL,
  all_day BOOLEAN DEFAULT FALSE,
  event_type VARCHAR(50) NOT NULL DEFAULT 'custom',
  project_id VARCHAR(36),
  location VARCHAR(500),
  color VARCHAR(7),
  created_by VARCHAR(36) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 插入測試資料
INSERT INTO calendar_events (id, title, start_time, end_time, event_type, created_by) VALUES
(UUID(), '測試會議', '2024-01-15 09:00:00', '2024-01-15 10:00:00', 'meeting', 'user-001'),
(UUID(), '專案審核', '2024-01-16 14:00:00', '2024-01-16 15:30:00', 'meeting', 'user-002');

-- 插入測試通知資料
INSERT INTO notifications (user_id, type, title, content, link, is_read, created_at) VALUES
(1, 'task_assigned', '新任務指派', '您被指派了一個新任務：網站首頁設計', '/tasks/123', FALSE, '2024-12-15 09:30:00'),
(1, 'task_comment', '任務有新留言', '李大明在「會員系統開發」任務中留言', '/tasks/456', FALSE, '2024-12-15 10:15:00'),
(1, 'task_due', '任務即將到期', '「專案報告撰寫」任務將於明天到期', '/tasks/789', FALSE, '2024-12-15 11:00:00'),
(1, 'project_invite', '專案邀請', '您被邀請加入「電商平台開發」專案', '/projects/101', FALSE, '2024-12-15 12:00:00'),
(1, 'mention', '您被提及', '張經理在專案討論中提到您', '/discussions/55', FALSE, '2024-12-15 13:20:00'),
(1, 'task_assigned', '週報撰寫任務', '請於每週五前提交專案週報', '/tasks/202', TRUE, '2024-12-14 15:20:00'),
(1, 'task_comment', '設計稿確認', '王設計師在「UI設計審核」中回覆', '/tasks/303', TRUE, '2024-12-14 16:45:00'),
(1, 'project_invite', '團隊專案邀請', '您被邀請加入「內部工具開發」團隊', '/projects/202', TRUE, '2024-12-13 10:00:00'),
(1, 'mention', '會議記錄提及', '您在上週會議中的建議已被採納', '/meetings/88', TRUE, '2024-12-13 14:30:00'),
(1, 'task_due', '請假申請核准', '您的請假申請已核准', '/hr/leave/56', TRUE, '2024-12-12 08:45:00'),
(1, 'task_assigned', '客戶需求分析', '請分析新客戶的技術需求', '/tasks/404', FALSE, '2024-12-15 14:00:00'),
(1, 'task_comment', '程式碼審查意見', '您的程式碼提交有審查意見', '/code-reviews/77', FALSE, '2024-12-15 15:30:00'),
(1, 'project_invite', '跨部門專案合作', '邀請參與跨部門流程改善專案', '/projects/303', FALSE, '2024-12-15 16:00:00'),
(1, 'mention', '績效考核通知', '您的年度績效考核即將開始', '/performance/99', TRUE, '2024-12-14 09:00:00'),
(1, 'task_due', '培訓課程提醒', '明日有技術培訓課程', '/trainings/44', FALSE, '2024-12-15 17:00:00');




-- 檢查 users 表是否有這些欄位，沒有就新增
ALTER TABLE users ADD COLUMN IF NOT EXISTS provider VARCHAR(50) DEFAULT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS provider_id VARCHAR(255) DEFAULT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar VARCHAR(500) DEFAULT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;


ALTER TABLE users MODIFY COLUMN password VARCHAR(255) DEFAULT NULL;