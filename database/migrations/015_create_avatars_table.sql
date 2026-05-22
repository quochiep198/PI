-- Create avatars table (1-N with users - user can have multiple avatars)
CREATE TABLE IF NOT EXISTS avatars (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  image_data TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS avatars_user_id_idx ON avatars (user_id);
CREATE INDEX IF NOT EXISTS avatars_user_active_idx ON avatars (user_id) WHERE is_active = TRUE;

-- Create items table (1-N with avatars)
CREATE TABLE IF NOT EXISTS items (
  id SERIAL PRIMARY KEY,
  avatar_id INTEGER NOT NULL REFERENCES avatars(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  asset_type VARCHAR(50) NOT NULL,
  description TEXT,
  image_data TEXT NOT NULL,
  price INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS items_avatar_id_idx ON items (avatar_id);
CREATE INDEX IF NOT EXISTS items_asset_type_idx ON items (asset_type);