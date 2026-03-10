-- ============================
-- 使用者表
-- ============================
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) DEFAULT NULL,
    role ENUM('admin', 'manager', 'member') DEFAULT 'member',
    avatar VARCHAR(500) DEFAULT NULL,
    provider VARCHAR(50) DEFAULT NULL,
    provider_id VARCHAR(255) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================
-- 專案表
-- ============================
CREATE TABLE IF NOT EXISTS projects (
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

-- ============================
-- 專案成員表
-- ============================
CREATE TABLE IF NOT EXISTS project_members (
    id INT PRIMARY KEY AUTO_INCREMENT,
    project_id INT NOT NULL,
    user_id INT NOT NULL,
    role ENUM('owner', 'manager', 'member', 'viewer') DEFAULT 'member',
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_member (project_id, user_id)
);

-- ============================
-- 任務表
-- ============================
CREATE TABLE IF NOT EXISTS tasks (
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

-- ============================
-- 評論表
-- ============================
CREATE TABLE IF NOT EXISTS comments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    task_id INT NOT NULL,
    user_id INT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================
-- 檔案附件表
-- ============================
CREATE TABLE IF NOT EXISTS attachments (
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

-- ============================
-- 通知表
-- ============================
CREATE TABLE IF NOT EXISTS notifications (
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

-- ============================
-- 標籤表
-- ============================
CREATE TABLE IF NOT EXISTS tags (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL,
    color VARCHAR(20) DEFAULT '#3B82F6',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================
-- 任務標籤關聯表
-- ============================
CREATE TABLE IF NOT EXISTS task_tags (
    task_id INT NOT NULL,
    tag_id INT NOT NULL,
    PRIMARY KEY (task_id, tag_id),
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

-- ============================
-- 活動日誌表
-- ============================
CREATE TABLE activity_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    action VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    user_name VARCHAR(100),
    ip_address VARCHAR(45),
    user_agent TEXT,
    old_values JSON,
    new_values JSON,
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_entity (entity_type, entity_id),
    INDEX idx_user (user_id),
    INDEX idx_created_at (created_at)
);
-- ============================
-- 時間記錄表
-- ============================
CREATE TABLE IF NOT EXISTS time_logs (
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

-- ============================
-- 行事曆事件表
-- ============================
CREATE TABLE IF NOT EXISTS calendar_events (
    id VARCHAR(36) PRIMARY KEY,
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

-- ============================
-- 事件參與者表
-- ============================
CREATE TABLE IF NOT EXISTS event_participants (
    id VARCHAR(36) PRIMARY KEY,
    event_id VARCHAR(36) NOT NULL,
    user_id INT NOT NULL,
    status ENUM('pending', 'accepted', 'declined', 'tentative') DEFAULT 'pending',
    response_note TEXT,
    responded_at TIMESTAMP NULL,
    FOREIGN KEY (event_id) REFERENCES calendar_events(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_participation (event_id, user_id)
);

-- ============================
-- 測試資料
-- ============================
INSERT INTO users (name, email, password, role) VALUES
('Admin', 'admin@example.com', '$2a$10$xxxxx', 'admin'),
('張經理', 'manager@example.com', '$2a$10$xxxxx', 'manager'),
('李成員', 'member@example.com', '$2a$10$xxxxx', 'member');

INSERT INTO projects (name, description, status, priority, start_date, end_date, owner_id) VALUES
('電商網站重構', '重新設計電商網站前端架構', 'in_progress', 'high', '2025-01-01', '2025-03-31', 1),
('手機 App 開發', '開發 iOS 和 Android 版本', 'planning', 'medium', '2025-02-01', '2025-06-30', 2),
('後台管理系統', '建立內部管理後台', 'in_progress', 'urgent', '2025-01-15', '2025-04-15', 1);

INSERT INTO project_members (project_id, user_id, role) VALUES
(2, 2, 'owner');

INSERT INTO tasks (project_id, title, status, priority, assignee_id) VALUES
(1, '設計首頁', 'todo', 'high', 1),
(1, '開發購物車', 'in_progress', 'medium', 2);

INSERT INTO tags (name, color) VALUES
('Bug', '#EF4444'),
('Feature', '#22C55E'),
('Enhancement', '#3B82F6'),
('Documentation', '#8B5CF6'),
('Urgent', '#F97316');

INSERT INTO notifications (user_id, type, title, content, link, is_read, created_at) VALUES
(1, 'task_assigned', '新任務指派', '您被指派了一個新任務：網站首頁設計', '/tasks/123', FALSE, '2024-12-15 09:30:00'),
(1, 'task_comment', '任務有新留言', '李大明在「會員系統開發」任務中留言', '/tasks/456', FALSE, '2024-12-15 10:15:00'),
(1, 'task_due', '任務即將到期', '「專案報告撰寫」任務將於明天到期', '/tasks/789', FALSE, '2024-12-15 11:00:00'),
(1, 'project_invite', '專案邀請', '您被邀請加入「電商平台開發」專案', '/projects/101', FALSE, '2024-12-15 12:00:00'),
(1, 'mention', '您被提及', '張經理在專案討論中提到您', '/discussions/55', FALSE, '2024-12-15 13:20:00');