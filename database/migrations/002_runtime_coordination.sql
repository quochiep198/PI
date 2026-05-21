CREATE TABLE IF NOT EXISTS online_presence_leases (
  connection_id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS online_presence_leases_expires_at_idx
ON online_presence_leases (expires_at);

CREATE INDEX IF NOT EXISTS online_presence_leases_user_id_idx
ON online_presence_leases (user_id);

CREATE TABLE IF NOT EXISTS ai_hint_request_log (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  lesson_id INTEGER REFERENCES lessons(id) ON DELETE SET NULL,
  request_ip TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS ai_hint_request_log_ip_created_idx
ON ai_hint_request_log (request_ip, created_at ASC);

CREATE INDEX IF NOT EXISTS ai_hint_request_log_user_created_idx
ON ai_hint_request_log (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS user_hint_cooldowns (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  last_requested_at TIMESTAMPTZ NOT NULL
);
