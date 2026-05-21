ALTER TABLE user_streaks
ADD COLUMN IF NOT EXISTS current_streak INTEGER NOT NULL DEFAULT 0;

ALTER TABLE user_streaks
ADD COLUMN IF NOT EXISTS longest_streak INTEGER NOT NULL DEFAULT 0;

ALTER TABLE user_streaks
ADD COLUMN IF NOT EXISTS total_check_ins INTEGER NOT NULL DEFAULT 0;

ALTER TABLE user_streaks
ADD COLUMN IF NOT EXISTS last_check_in_date DATE;

ALTER TABLE user_streaks
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE user_streaks
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE user_streak_checkins
ADD COLUMN IF NOT EXISTS check_in_date DATE;

ALTER TABLE user_streak_checkins
ADD COLUMN IF NOT EXISTS reward_coins INTEGER NOT NULL DEFAULT 0;

ALTER TABLE user_streak_checkins
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE UNIQUE INDEX IF NOT EXISTS user_streak_checkins_user_date_uidx
ON user_streak_checkins (user_id, check_in_date);

CREATE INDEX IF NOT EXISTS user_streak_checkins_user_date_idx
ON user_streak_checkins (user_id, check_in_date DESC);
