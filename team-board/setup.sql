-- ========================================
-- TeamBoard 数据库初始化脚本
-- 在 Supabase SQL Editor 中执行
-- ========================================

-- 1. 项目表
create table projects (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  icon text default '📁',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. 看板列表
create table columns (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references projects(id) on delete cascade not null,
  name text not null,
  color text default 'todo',
  "order" integer not null default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. 任务卡片表
create table tasks (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references projects(id) on delete cascade not null,
  column_id uuid references columns(id) on delete cascade not null,
  title text not null,
  description text,
  assignee text,
  tags text[],
  due_date timestamp with time zone,
  created_by text,
  updated_by text,
  "order" integer not null default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. 评论表
create table comments (
  id uuid default gen_random_uuid() primary key,
  task_id uuid references tasks(id) on delete cascade not null,
  content text not null,
  author text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. 操作历史表
create table activity_log (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references projects(id) on delete cascade not null,
  task_id uuid references tasks(id) on delete set null,
  action text not null,
  content text,
  author text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. 开启实时订阅（多人协作必需）
alter publication supabase_realtime add table projects;
alter publication supabase_realtime add table columns;
alter publication supabase_realtime add table tasks;
alter publication supabase_realtime add table comments;
alter publication supabase_realtime add table activity_log;
