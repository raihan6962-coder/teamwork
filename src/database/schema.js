export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  telegram_user_id BIGINT UNIQUE NOT NULL,
  telegram_chat_id BIGINT NOT NULL,
  username TEXT,
  first_name TEXT,
  last_name TEXT,
  timezone TEXT DEFAULT 'UTC',
  default_reminder_minutes INTEGER DEFAULT 60,
  time_format TEXT DEFAULT '12h',
  notifications_enabled BOOLEAN DEFAULT true,
  is_admin BOOLEAN DEFAULT false,
  created_at TEXT DEFAULT NOW(),
  updated_at TEXT DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  telegram_user_id BIGINT NOT NULL,
  telegram_chat_id BIGINT NOT NULL,
  app_name TEXT NOT NULL,
  country TEXT NOT NULL,
  country_code TEXT NOT NULL,
  completed_at TEXT NOT NULL,
  reminder_at TEXT NOT NULL,
  reminder_duration INTEGER NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TEXT DEFAULT NOW(),
  updated_at TEXT DEFAULT NOW(),
  timezone TEXT DEFAULT 'UTC',
  notes TEXT,
  reminder_sent BOOLEAN DEFAULT false,
  deleted_at TEXT
);
CREATE TABLE IF NOT EXISTS reminders (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL,
  telegram_user_id BIGINT NOT NULL,
  telegram_chat_id BIGINT NOT NULL,
  reminder_at TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  sent_at TEXT,
  error_message TEXT,
  created_at TEXT DEFAULT NOW(),
  FOREIGN KEY (task_id) REFERENCES tasks(id)
);
CREATE TABLE IF NOT EXISTS broadcast_logs (
  id TEXT PRIMARY KEY,
  admin_user_id BIGINT NOT NULL,
  message TEXT NOT NULL,
  total_recipients INTEGER NOT NULL,
  successful INTEGER DEFAULT 0,
  failed INTEGER DEFAULT 0,
  created_at TEXT DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS processed_updates (
  update_id BIGINT PRIMARY KEY,
  processed_at TEXT DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS conversation_states (
  telegram_user_id BIGINT PRIMARY KEY,
  state TEXT NOT NULL,
  data TEXT NOT NULL,
  updated_at TEXT DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_tasks_user ON tasks(telegram_user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_reminder ON tasks(reminder_at, status);
`;
