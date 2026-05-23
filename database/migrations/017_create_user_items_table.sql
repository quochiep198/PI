-- Create user_items table for 1-N relationship (user has many items)
CREATE TABLE IF NOT EXISTS user_items (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (user_id, item_id)
);

CREATE INDEX IF NOT EXISTS user_items_user_id_idx ON user_items (user_id);
CREATE INDEX IF NOT EXISTS user_items_item_id_idx ON user_items (item_id);

-- Index for fast lookup of active items by type
CREATE INDEX IF NOT EXISTS user_items_user_active_type_idx ON user_items (user_id, is_active) WHERE is_active = TRUE;