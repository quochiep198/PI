CREATE TABLE IF NOT EXISTS user_lesson_reviews (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lesson_id INTEGER NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  code_snapshot TEXT NOT NULL,
  ai_review_text TEXT NOT NULL,
  coins_earned INTEGER NOT NULL DEFAULT 0,
  xp_earned INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS user_lesson_reviews_user_lesson_idx ON user_lesson_reviews (user_id, lesson_id);
