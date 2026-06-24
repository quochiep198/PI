-- Migration: Create tables for Gamification Pet system (F-03)

CREATE TABLE IF NOT EXISTS pet_templates (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  code_name VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  image_baby TEXT NOT NULL,
  image_teen TEXT NOT NULL,
  image_adult TEXT NOT NULL,
  image_master TEXT NOT NULL,
  price_coins INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_pets (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pet_template_id INTEGER NOT NULL REFERENCES pet_templates(id) ON DELETE CASCADE,
  nickname VARCHAR(255),
  level INTEGER NOT NULL DEFAULT 1,
  current_xp INTEGER NOT NULL DEFAULT 0,
  next_level_xp INTEGER NOT NULL DEFAULT 100,
  fullness INTEGER NOT NULL DEFAULT 50,
  is_active BOOLEAN NOT NULL DEFAULT FALSE,
  last_fed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Index to ensure only one active pet per user
CREATE UNIQUE INDEX IF NOT EXISTS uq_user_active_pet ON user_pets (user_id) WHERE (is_active = TRUE);

-- Index for performance lookups
CREATE INDEX IF NOT EXISTS user_pets_user_id_idx ON user_pets (user_id);
CREATE INDEX IF NOT EXISTS user_pets_is_active_idx ON user_pets (user_id, is_active);

-- Seed basic pet templates
INSERT INTO pet_templates (name, code_name, description, image_baby, image_teen, image_adult, image_master, price_coins)
VALUES 
  ('Cyber Cat', 'cyber_cat', 'Chú mèo máy siêu nhanh, thông minh và cực kỳ yêu thích Python.', '🐱', '😸', '😼', '🦁', 0),
  ('PyDragon', 'py_dragon', 'Chú rồng Python dũng mãnh, thích phun lửa logic và chinh phục các bài tập khó.', '🥚', '🐉', '🦖', '🐲', 0),
  ('Algorithm Owl', 'algorithm_owl', 'Cú thuật toán đeo kính cận tri thức, luôn thức khuya cùng bạn học thuật toán.', '🐣', '🐦', '🦉', '🦉🎓', 0)
ON CONFLICT (code_name) DO NOTHING;
