-- Fix track names in lessons to match with challenges
-- Previously lessons may have had garbled track names that caused mismatch with challenges

-- Get all current track names to see what we're dealing with
-- SELECT DISTINCT track FROM lessons ORDER BY track;

-- Update for "Cơ bản" track (covers variations like 'Cơ bản lớp 6', 'Cﾆ｡b蘯｡n l盻孅6', etc.)
UPDATE lessons SET track = 'Cơ bản' WHERE track != 'Nâng cao';

-- Explicitly set Nâng cao for any remaining variations
-- If there are any tracks that still don't match, check them:
-- SELECT DISTINCT track FROM lessons;

-- Sync challenge tracks to match lesson tracks
-- Get the track from the associated lesson and update challenges
UPDATE challenges c
SET track = l.track
FROM lessons l
WHERE c.lesson_id = l.id;

-- Verify the updates
SELECT 'lessons' as table_name, track, COUNT(*) as count FROM lessons GROUP BY track
UNION ALL
SELECT 'challenges' as table_name, track, COUNT(*) as count FROM challenges GROUP BY track;