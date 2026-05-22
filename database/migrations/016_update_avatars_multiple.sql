-- Migration: Update avatars table to support multiple avatars per user
-- This migration handles the transition from 1:1 to 1:N relationship

-- Step 1: Add is_active column if not exists (MySQL/Postgres compatible)
ALTER TABLE avatars ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT FALSE;

-- Step 2: Remove the unique constraint on user_id if it exists
-- Note: This may vary by database. For PostgreSQL:
ALTER TABLE avatars DROP CONSTRAINT IF EXISTS avatars_user_id_key;

-- Step 3: For any users with multiple avatars, keep only the most recent one as active
-- and deactivate others
WITH latest_avatars AS (
  SELECT DISTINCT ON (user_id)
    user_id,
    id
  FROM avatars
  ORDER BY user_id, created_at DESC
)
UPDATE avatars
SET is_active = TRUE
WHERE id IN (SELECT id FROM latest_avatars);

-- Step 4: Create index for faster active avatar lookup
CREATE INDEX IF NOT EXISTS avatars_user_active_idx ON avatars (user_id) WHERE is_active = TRUE;