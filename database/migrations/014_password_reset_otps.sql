CREATE TABLE IF NOT EXISTS password_reset_otps (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  otp_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS password_reset_otps_user_id_idx
ON password_reset_otps (user_id);

CREATE INDEX IF NOT EXISTS password_reset_otps_expires_at_idx
ON password_reset_otps (expires_at);

CREATE INDEX IF NOT EXISTS password_reset_otps_otp_hash_idx
ON password_reset_otps (otp_hash);