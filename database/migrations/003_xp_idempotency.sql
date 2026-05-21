CREATE UNIQUE INDEX IF NOT EXISTS user_xp_log_user_source_lesson_uidx
ON user_xp_log (user_id, source, lesson_id);
