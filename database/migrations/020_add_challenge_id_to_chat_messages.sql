ALTER TABLE user_chat_messages
ADD COLUMN challenge_id INTEGER REFERENCES challenges(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS user_chat_messages_user_challenge_idx ON user_chat_messages (user_id, challenge_id, created_at ASC);
