-- Fix track names in challenges to match with lessons
-- Previously challenges had "Cơ bản lớp 6" but lessons have "Cơ bản"

UPDATE challenges SET track = 'Cơ bản' WHERE track = 'Cơ bản lớp 6';
UPDATE challenges SET track = 'Nâng cao' WHERE track = 'Nâng cao lớp 6';

-- Verify the update
SELECT track, COUNT(*) as challenge_count FROM challenges GROUP BY track;