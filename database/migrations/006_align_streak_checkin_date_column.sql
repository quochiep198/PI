ALTER TABLE user_streak_checkins
ADD COLUMN IF NOT EXISTS check_in_date DATE;

CREATE UNIQUE INDEX IF NOT EXISTS user_streak_checkins_user_date_uidx
ON user_streak_checkins (user_id, check_in_date);

CREATE INDEX IF NOT EXISTS user_streak_checkins_user_date_idx
ON user_streak_checkins (user_id, check_in_date DESC);
