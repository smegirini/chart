-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS schedule_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE schedule_db;

-- Set timezone if necessary (example: UTC)
-- SET time_zone = '+00:00';

-- 카테고리 테이블
CREATE TABLE categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE, -- Ensure category names are unique
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 공정 유형 테이블
CREATE TABLE process_types (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE, -- Ensure process type names are unique
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 태스크 단계 테이블 (1 Spec, 2 PR, 3 PO 등)
CREATE TABLE task_stages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE, -- Ensure stage names are unique
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 작업 상태 테이블 (미진행, 진행중, 완료)
CREATE TABLE task_statuses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE, -- Ensure status names are unique
  color VARCHAR(20), -- e.g., hex color code like '#1890ff'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 작업 테이블
CREATE TABLE tasks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  category_id INT,
  process_type_id INT,
  stage_id INT,
  status_id INT DEFAULT 1, -- Default to '미진행' status ID
  start_date DATE NOT NULL, -- Make start_date mandatory
  end_date DATE NOT NULL,   -- Make end_date mandatory
  actual_start_date DATE NULL, -- Allow null
  actual_end_date DATE NULL,   -- Allow null
  progress FLOAT DEFAULT 0, -- Range 0-100
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_task_name (name), -- Add index for searching by name
  INDEX idx_task_dates (start_date, end_date), -- Add index for date range filtering
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL ON UPDATE CASCADE, -- Set null if category deleted
  FOREIGN KEY (process_type_id) REFERENCES process_types(id) ON DELETE SET NULL ON UPDATE CASCADE, -- Set null if process type deleted
  FOREIGN KEY (stage_id) REFERENCES task_stages(id) ON DELETE SET NULL ON UPDATE CASCADE,       -- Set null if stage deleted
  FOREIGN KEY (status_id) REFERENCES task_statuses(id) ON DELETE SET DEFAULT ON UPDATE CASCADE   -- Set default status if status deleted
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 작업 의존성 테이블 (Gantt Links)
CREATE TABLE task_dependencies (
  id INT AUTO_INCREMENT PRIMARY KEY,
  predecessor_id INT NOT NULL,
  successor_id INT NOT NULL,
  dependency_type VARCHAR(2) DEFAULT 'FS', -- FS, FF, SS, SF (standard types)
  lag INT DEFAULT 0, -- Lag in days (can be negative)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (predecessor_id) REFERENCES tasks(id) ON DELETE CASCADE ON UPDATE CASCADE, -- Delete dependency if predecessor deleted
  FOREIGN KEY (successor_id) REFERENCES tasks(id) ON DELETE CASCADE ON UPDATE CASCADE,     -- Delete dependency if successor deleted
  UNIQUE KEY uk_dependency (predecessor_id, successor_id, dependency_type) -- Prevent duplicate dependencies
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 초기 데이터 삽입 --

-- Categories
INSERT INTO categories (name) VALUES 
('Installation works'),
('부대공사');

-- Process Types
INSERT INTO process_types (name) VALUES 
('Mixing'),
('Testing'),
('Assembly');

-- Task Stages
INSERT INTO task_stages (name) VALUES 
('1 Spec'),
('2 PR'),
('3 PO');

-- Task Statuses
INSERT INTO task_statuses (name, color) VALUES 
('미진행', '#1890ff'),
('진행중', '#fa8c16'),
('완료', '#52c41a');

-- Sample Task Data (Ensure status_id matches inserted statuses)
-- Assuming '미진행' ID is 1, '진행중' ID is 2, '완료' ID is 3 based on insertion order above
INSERT INTO tasks (name, category_id, process_type_id, stage_id, status_id, start_date, end_date, progress) VALUES
('Batch off 1호/2호 설치공사', 1, 1, 1, 2, '2024-01-15', '2024-01-30', 50), -- Example progress and status
('Batch off 집진 ROOM', 2, 1, 1, 1, '2024-03-15', '2024-03-30', 0),
('BATCH TEST ROOM(MDR, RPA)설치공사', 1, 2, 1, 1, '2024-01-01', '2024-01-20', 0),
('Mixer line 유압 및 Oil line 배관공사', 1, 3, 1, 1, '2024-02-15', '2024-03-01', 0);

-- Sample Task Dependency Data (Example)
-- Assuming task IDs are 1, 2, 3, 4 based on insertion order above
-- Example: Task 2 depends on Task 1 (Finish-to-Start)
-- INSERT INTO task_dependencies (predecessor_id, successor_id, dependency_type) VALUES (1, 2, 'FS');
-- Example: Task 4 depends on Task 3 (Finish-to-Start) with 5 days lag
-- INSERT INTO task_dependencies (predecessor_id, successor_id, dependency_type, lag) VALUES (3, 4, 'FS', 5);

-- Add more initial data as needed

-- You might want to create specific users and grant privileges here
-- CREATE USER 'app_user'@'%' IDENTIFIED BY 'app_password';
-- GRANT SELECT, INSERT, UPDATE, DELETE ON schedule_db.* TO 'app_user'@'%';
-- FLUSH PRIVILEGES;
