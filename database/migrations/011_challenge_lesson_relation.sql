-- Add explicit relationship between challenges and lessons
-- This allows mapping each challenge to a specific lesson.
-- Quy ước: mỗi lesson có đúng 10 challenges:
--   order 1-3  = easy
--   order 4-6  = medium
--   order 7-10 = hard

-- Step 1: Add lesson_id column (nullable before mapping)
ALTER TABLE challenges
ADD COLUMN IF NOT EXISTS lesson_id INTEGER REFERENCES lessons(id) ON DELETE SET NULL;

-- Step 2: Add challenge_order to maintain ordering within a lesson
ALTER TABLE challenges
ADD COLUMN IF NOT EXISTS challenge_order INTEGER DEFAULT 0;

-- Step 3: Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS challenges_lesson_idx ON challenges (lesson_id);
CREATE INDEX IF NOT EXISTS challenges_lesson_order_idx ON challenges (lesson_id, challenge_order);

-- Step 4: Map challenges to lessons

-- ============================================================
-- LESSON 1: hello-python (Làm quen với Python)
-- ============================================================
UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'hello-python'),
    challenge_order = 1
WHERE title = 'Làm quen với Python - Khởi động';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'hello-python'),
    challenge_order = 2
WHERE title = 'Làm quen với Python - Gọi tên chủ đề';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'hello-python'),
    challenge_order = 3
WHERE title = 'Làm quen với Python - Thông tin bài học';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'hello-python'),
    challenge_order = 4
WHERE title = 'Làm quen với Python - Biến chủ đề';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'hello-python'),
    challenge_order = 5
WHERE title = 'Làm quen với Python - Hai dòng kết quả';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'hello-python'),
    challenge_order = 6
WHERE title = 'Làm quen với Python - Thứ tự bài học';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'hello-python'),
    challenge_order = 7
WHERE title = 'Làm quen với Python - Hàm thông điệp';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'hello-python'),
    challenge_order = 8
WHERE title = 'Làm quen với Python - Ba bước luyện tập';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'hello-python'),
    challenge_order = 9
WHERE title = 'Làm quen với Python - Từ điển bài học';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'hello-python'),
    challenge_order = 10
WHERE title = 'Làm quen với Python - Tổng kết thử thách';


-- ============================================================
-- LESSON 2: print-multiple-lines (In nhiều dòng)
-- ============================================================
UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'print-multiple-lines'),
    challenge_order = 1
WHERE title = 'In nhiều dòng - Khởi động';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'print-multiple-lines'),
    challenge_order = 2
WHERE title = 'In nhiều dòng - Gọi tên chủ đề';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'print-multiple-lines'),
    challenge_order = 3
WHERE title = 'In nhiều dòng - Thông tin bài học';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'print-multiple-lines'),
    challenge_order = 4
WHERE title = 'In nhiều dòng - Biến chủ đề';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'print-multiple-lines'),
    challenge_order = 5
WHERE title = 'In nhiều dòng - Hai dòng kết quả';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'print-multiple-lines'),
    challenge_order = 6
WHERE title = 'In nhiều dòng - Thứ tự bài học';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'print-multiple-lines'),
    challenge_order = 7
WHERE title = 'In nhiều dòng - Hàm thông điệp';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'print-multiple-lines'),
    challenge_order = 8
WHERE title = 'In nhiều dòng - Ba bước luyện tập';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'print-multiple-lines'),
    challenge_order = 9
WHERE title = 'In nhiều dòng - Từ điển bài học';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'print-multiple-lines'),
    challenge_order = 10
WHERE title = 'In nhiều dòng - Tổng kết thử thách';


-- ============================================================
-- LESSON 3: variables-basic (Biến đầu tiên)
-- ============================================================
UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'variables-basic'),
    challenge_order = 1
WHERE title = 'Biến đầu tiên - Khởi động';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'variables-basic'),
    challenge_order = 2
WHERE title = 'Biến đầu tiên - Gọi tên chủ đề';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'variables-basic'),
    challenge_order = 3
WHERE title = 'Biến đầu tiên - Thông tin bài học';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'variables-basic'),
    challenge_order = 4
WHERE title = 'Biến đầu tiên - Biến chủ đề';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'variables-basic'),
    challenge_order = 5
WHERE title = 'Biến đầu tiên - Hai dòng kết quả';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'variables-basic'),
    challenge_order = 6
WHERE title = 'Biến đầu tiên - Thứ tự bài học';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'variables-basic'),
    challenge_order = 7
WHERE title = 'Biến đầu tiên - Hàm thông điệp';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'variables-basic'),
    challenge_order = 8
WHERE title = 'Biến đầu tiên - Ba bước luyện tập';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'variables-basic'),
    challenge_order = 9
WHERE title = 'Biến đầu tiên - Từ điển bài học';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'variables-basic'),
    challenge_order = 10
WHERE title = 'Biến đầu tiên - Tổng kết thử thách';


-- ============================================================
-- LESSON 4: numbers-and-math (Số và phép tính)
-- ============================================================
UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'numbers-and-math'),
    challenge_order = 1
WHERE title = 'Số và phép tính - Khởi động';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'numbers-and-math'),
    challenge_order = 2
WHERE title = 'Số và phép tính - Gọi tên chủ đề';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'numbers-and-math'),
    challenge_order = 3
WHERE title = 'Số và phép tính - Thông tin bài học';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'numbers-and-math'),
    challenge_order = 4
WHERE title = 'Số và phép tính - Biến chủ đề';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'numbers-and-math'),
    challenge_order = 5
WHERE title = 'Số và phép tính - Hai dòng kết quả';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'numbers-and-math'),
    challenge_order = 6
WHERE title = 'Số và phép tính - Thứ tự bài học';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'numbers-and-math'),
    challenge_order = 7
WHERE title = 'Số và phép tính - Hàm thông điệp';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'numbers-and-math'),
    challenge_order = 8
WHERE title = 'Số và phép tính - Ba bước luyện tập';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'numbers-and-math'),
    challenge_order = 9
WHERE title = 'Số và phép tính - Từ điển bài học';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'numbers-and-math'),
    challenge_order = 10
WHERE title = 'Số và phép tính - Tổng kết thử thách';


-- ============================================================
-- LESSON 5: strings-basic (Chuỗi ký tự)
-- ============================================================
UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'strings-basic'),
    challenge_order = 1
WHERE title = 'Chuỗi ký tự - Khởi động';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'strings-basic'),
    challenge_order = 2
WHERE title = 'Chuỗi ký tự - Gọi tên chủ đề';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'strings-basic'),
    challenge_order = 3
WHERE title = 'Chuỗi ký tự - Thông tin bài học';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'strings-basic'),
    challenge_order = 4
WHERE title = 'Chuỗi ký tự - Biến chủ đề';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'strings-basic'),
    challenge_order = 5
WHERE title = 'Chuỗi ký tự - Hai dòng kết quả';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'strings-basic'),
    challenge_order = 6
WHERE title = 'Chuỗi ký tự - Thứ tự bài học';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'strings-basic'),
    challenge_order = 7
WHERE title = 'Chuỗi ký tự - Hàm thông điệp';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'strings-basic'),
    challenge_order = 8
WHERE title = 'Chuỗi ký tự - Ba bước luyện tập';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'strings-basic'),
    challenge_order = 9
WHERE title = 'Chuỗi ký tự - Từ điển bài học';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'strings-basic'),
    challenge_order = 10
WHERE title = 'Chuỗi ký tự - Tổng kết thử thách';


-- ============================================================
-- LESSON 6: input-simulation (Dữ liệu đầu vào mô phỏng)
-- ============================================================
UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'input-simulation'),
    challenge_order = 1
WHERE title = 'Dữ liệu đầu vào mô phỏng - Khởi động';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'input-simulation'),
    challenge_order = 2
WHERE title = 'Dữ liệu đầu vào mô phỏng - Gọi tên chủ đề';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'input-simulation'),
    challenge_order = 3
WHERE title = 'Dữ liệu đầu vào mô phỏng - Thông tin bài học';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'input-simulation'),
    challenge_order = 4
WHERE title = 'Dữ liệu đầu vào mô phỏng - Biến chủ đề';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'input-simulation'),
    challenge_order = 5
WHERE title = 'Dữ liệu đầu vào mô phỏng - Hai dòng kết quả';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'input-simulation'),
    challenge_order = 6
WHERE title = 'Dữ liệu đầu vào mô phỏng - Thứ tự bài học';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'input-simulation'),
    challenge_order = 7
WHERE title = 'Dữ liệu đầu vào mô phỏng - Hàm thông điệp';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'input-simulation'),
    challenge_order = 8
WHERE title = 'Dữ liệu đầu vào mô phỏng - Ba bước luyện tập';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'input-simulation'),
    challenge_order = 9
WHERE title = 'Dữ liệu đầu vào mô phỏng - Từ điển bài học';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'input-simulation'),
    challenge_order = 10
WHERE title = 'Dữ liệu đầu vào mô phỏng - Tổng kết thử thách';


-- ============================================================
-- LESSON 7: comparison-operators (Toán tử so sánh)
-- ============================================================
UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'comparison-operators'),
    challenge_order = 1
WHERE title = 'Toán tử so sánh - Khởi động';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'comparison-operators'),
    challenge_order = 2
WHERE title = 'Toán tử so sánh - Gọi tên chủ đề';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'comparison-operators'),
    challenge_order = 3
WHERE title = 'Toán tử so sánh - Thông tin bài học';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'comparison-operators'),
    challenge_order = 4
WHERE title = 'Toán tử so sánh - Biến chủ đề';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'comparison-operators'),
    challenge_order = 5
WHERE title = 'Toán tử so sánh - Hai dòng kết quả';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'comparison-operators'),
    challenge_order = 6
WHERE title = 'Toán tử so sánh - Thứ tự bài học';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'comparison-operators'),
    challenge_order = 7
WHERE title = 'Toán tử so sánh - Hàm thông điệp';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'comparison-operators'),
    challenge_order = 8
WHERE title = 'Toán tử so sánh - Ba bước luyện tập';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'comparison-operators'),
    challenge_order = 9
WHERE title = 'Toán tử so sánh - Từ điển bài học';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'comparison-operators'),
    challenge_order = 10
WHERE title = 'Toán tử so sánh - Tổng kết thử thách';


-- ============================================================
-- LESSON 8: if-basic (Điều kiện if)
-- ============================================================
UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'if-basic'),
    challenge_order = 1
WHERE title = 'Điều kiện if - Khởi động';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'if-basic'),
    challenge_order = 2
WHERE title = 'Điều kiện if - Gọi tên chủ đề';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'if-basic'),
    challenge_order = 3
WHERE title = 'Điều kiện if - Thông tin bài học';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'if-basic'),
    challenge_order = 4
WHERE title = 'Điều kiện if - Biến chủ đề';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'if-basic'),
    challenge_order = 5
WHERE title = 'Điều kiện if - Hai dòng kết quả';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'if-basic'),
    challenge_order = 6
WHERE title = 'Điều kiện if - Thứ tự bài học';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'if-basic'),
    challenge_order = 7
WHERE title = 'Điều kiện if - Hàm thông điệp';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'if-basic'),
    challenge_order = 8
WHERE title = 'Điều kiện if - Ba bước luyện tập';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'if-basic'),
    challenge_order = 9
WHERE title = 'Điều kiện if - Từ điển bài học';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'if-basic'),
    challenge_order = 10
WHERE title = 'Điều kiện if - Tổng kết thử thách';


-- ============================================================
-- LESSON 9: if-else (Điều kiện if else)
-- ============================================================
UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'if-else'),
    challenge_order = 1
WHERE title = 'Điều kiện if else - Khởi động';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'if-else'),
    challenge_order = 2
WHERE title = 'Điều kiện if else - Gọi tên chủ đề';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'if-else'),
    challenge_order = 3
WHERE title = 'Điều kiện if else - Thông tin bài học';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'if-else'),
    challenge_order = 4
WHERE title = 'Điều kiện if else - Biến chủ đề';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'if-else'),
    challenge_order = 5
WHERE title = 'Điều kiện if else - Hai dòng kết quả';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'if-else'),
    challenge_order = 6
WHERE title = 'Điều kiện if else - Thứ tự bài học';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'if-else'),
    challenge_order = 7
WHERE title = 'Điều kiện if else - Hàm thông điệp';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'if-else'),
    challenge_order = 8
WHERE title = 'Điều kiện if else - Ba bước luyện tập';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'if-else'),
    challenge_order = 9
WHERE title = 'Điều kiện if else - Từ điển bài học';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'if-else'),
    challenge_order = 10
WHERE title = 'Điều kiện if else - Tổng kết thử thách';


-- ============================================================
-- LESSON 10: elif-branches (Nhiều nhánh với elif)
-- ============================================================
UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'elif-branches'),
    challenge_order = 1
WHERE title = 'Nhiều nhánh với elif - Khởi động';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'elif-branches'),
    challenge_order = 2
WHERE title = 'Nhiều nhánh với elif - Gọi tên chủ đề';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'elif-branches'),
    challenge_order = 3
WHERE title = 'Nhiều nhánh với elif - Thông tin bài học';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'elif-branches'),
    challenge_order = 4
WHERE title = 'Nhiều nhánh với elif - Biến chủ đề';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'elif-branches'),
    challenge_order = 5
WHERE title = 'Nhiều nhánh với elif - Hai dòng kết quả';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'elif-branches'),
    challenge_order = 6
WHERE title = 'Nhiều nhánh với elif - Thứ tự bài học';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'elif-branches'),
    challenge_order = 7
WHERE title = 'Nhiều nhánh với elif - Hàm thông điệp';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'elif-branches'),
    challenge_order = 8
WHERE title = 'Nhiều nhánh với elif - Ba bước luyện tập';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'elif-branches'),
    challenge_order = 9
WHERE title = 'Nhiều nhánh với elif - Từ điển bài học';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'elif-branches'),
    challenge_order = 10
WHERE title = 'Nhiều nhánh với elif - Tổng kết thử thách';


-- ============================================================
-- LESSON 11: for-range (Vòng lặp for với range)
-- ============================================================
UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'for-range'),
    challenge_order = 1
WHERE title = 'Vòng lặp for với range - Khởi động';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'for-range'),
    challenge_order = 2
WHERE title = 'Vòng lặp for với range - Gọi tên chủ đề';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'for-range'),
    challenge_order = 3
WHERE title = 'Vòng lặp for với range - Thông tin bài học';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'for-range'),
    challenge_order = 4
WHERE title = 'Vòng lặp for với range - Biến chủ đề';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'for-range'),
    challenge_order = 5
WHERE title = 'Vòng lặp for với range - Hai dòng kết quả';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'for-range'),
    challenge_order = 6
WHERE title = 'Vòng lặp for với range - Thứ tự bài học';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'for-range'),
    challenge_order = 7
WHERE title = 'Vòng lặp for với range - Hàm thông điệp';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'for-range'),
    challenge_order = 8
WHERE title = 'Vòng lặp for với range - Ba bước luyện tập';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'for-range'),
    challenge_order = 9
WHERE title = 'Vòng lặp for với range - Từ điển bài học';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'for-range'),
    challenge_order = 10
WHERE title = 'Vòng lặp for với range - Tổng kết thử thách';


-- ============================================================
-- LESSON 12: for-list (Duyệt danh sách bằng for)
-- ============================================================
UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'for-list'),
    challenge_order = 1
WHERE title = 'Duyệt danh sách bằng for - Khởi động';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'for-list'),
    challenge_order = 2
WHERE title = 'Duyệt danh sách bằng for - Gọi tên chủ đề';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'for-list'),
    challenge_order = 3
WHERE title = 'Duyệt danh sách bằng for - Thông tin bài học';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'for-list'),
    challenge_order = 4
WHERE title = 'Duyệt danh sách bằng for - Biến chủ đề';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'for-list'),
    challenge_order = 5
WHERE title = 'Duyệt danh sách bằng for - Hai dòng kết quả';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'for-list'),
    challenge_order = 6
WHERE title = 'Duyệt danh sách bằng for - Thứ tự bài học';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'for-list'),
    challenge_order = 7
WHERE title = 'Duyệt danh sách bằng for - Hàm thông điệp';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'for-list'),
    challenge_order = 8
WHERE title = 'Duyệt danh sách bằng for - Ba bước luyện tập';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'for-list'),
    challenge_order = 9
WHERE title = 'Duyệt danh sách bằng for - Từ điển bài học';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'for-list'),
    challenge_order = 10
WHERE title = 'Duyệt danh sách bằng for - Tổng kết thử thách';


-- ============================================================
-- LESSON 13: while-loop (Vòng lặp while)
-- ============================================================
UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'while-loop'),
    challenge_order = 1
WHERE title = 'Vòng lặp while - Khởi động';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'while-loop'),
    challenge_order = 2
WHERE title = 'Vòng lặp while - Gọi tên chủ đề';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'while-loop'),
    challenge_order = 3
WHERE title = 'Vòng lặp while - Thông tin bài học';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'while-loop'),
    challenge_order = 4
WHERE title = 'Vòng lặp while - Biến chủ đề';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'while-loop'),
    challenge_order = 5
WHERE title = 'Vòng lặp while - Hai dòng kết quả';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'while-loop'),
    challenge_order = 6
WHERE title = 'Vòng lặp while - Thứ tự bài học';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'while-loop'),
    challenge_order = 7
WHERE title = 'Vòng lặp while - Hàm thông điệp';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'while-loop'),
    challenge_order = 8
WHERE title = 'Vòng lặp while - Ba bước luyện tập';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'while-loop'),
    challenge_order = 9
WHERE title = 'Vòng lặp while - Từ điển bài học';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'while-loop'),
    challenge_order = 10
WHERE title = 'Vòng lặp while - Tổng kết thử thách';


-- ============================================================
-- LESSON 14: break-continue (Break và continue)
-- ============================================================
UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'break-continue'),
    challenge_order = 1
WHERE title = 'Break và continue - Khởi động';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'break-continue'),
    challenge_order = 2
WHERE title = 'Break và continue - Gọi tên chủ đề';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'break-continue'),
    challenge_order = 3
WHERE title = 'Break và continue - Thông tin bài học';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'break-continue'),
    challenge_order = 4
WHERE title = 'Break và continue - Biến chủ đề';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'break-continue'),
    challenge_order = 5
WHERE title = 'Break và continue - Hai dòng kết quả';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'break-continue'),
    challenge_order = 6
WHERE title = 'Break và continue - Thứ tự bài học';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'break-continue'),
    challenge_order = 7
WHERE title = 'Break và continue - Hàm thông điệp';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'break-continue'),
    challenge_order = 8
WHERE title = 'Break và continue - Ba bước luyện tập';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'break-continue'),
    challenge_order = 9
WHERE title = 'Break và continue - Từ điển bài học';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'break-continue'),
    challenge_order = 10
WHERE title = 'Break và continue - Tổng kết thử thách';


-- ============================================================
-- LESSON 15: functions-basic (Hàm đầu tiên)
-- ============================================================
UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'functions-basic'),
    challenge_order = 1
WHERE title = 'Hàm đầu tiên - Khởi động';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'functions-basic'),
    challenge_order = 2
WHERE title = 'Hàm đầu tiên - Gọi tên chủ đề';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'functions-basic'),
    challenge_order = 3
WHERE title = 'Hàm đầu tiên - Thông tin bài học';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'functions-basic'),
    challenge_order = 4
WHERE title = 'Hàm đầu tiên - Biến chủ đề';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'functions-basic'),
    challenge_order = 5
WHERE title = 'Hàm đầu tiên - Hai dòng kết quả';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'functions-basic'),
    challenge_order = 6
WHERE title = 'Hàm đầu tiên - Thứ tự bài học';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'functions-basic'),
    challenge_order = 7
WHERE title = 'Hàm đầu tiên - Hàm thông điệp';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'functions-basic'),
    challenge_order = 8
WHERE title = 'Hàm đầu tiên - Ba bước luyện tập';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'functions-basic'),
    challenge_order = 9
WHERE title = 'Hàm đầu tiên - Từ điển bài học';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'functions-basic'),
    challenge_order = 10
WHERE title = 'Hàm đầu tiên - Tổng kết thử thách';


-- ============================================================
-- LESSON 16: functions-return (Giá trị trả về)
-- ============================================================
UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'functions-return'),
    challenge_order = 1
WHERE title = 'Giá trị trả về - Khởi động';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'functions-return'),
    challenge_order = 2
WHERE title = 'Giá trị trả về - Gọi tên chủ đề';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'functions-return'),
    challenge_order = 3
WHERE title = 'Giá trị trả về - Thông tin bài học';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'functions-return'),
    challenge_order = 4
WHERE title = 'Giá trị trả về - Biến chủ đề';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'functions-return'),
    challenge_order = 5
WHERE title = 'Giá trị trả về - Hai dòng kết quả';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'functions-return'),
    challenge_order = 6
WHERE title = 'Giá trị trả về - Thứ tự bài học';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'functions-return'),
    challenge_order = 7
WHERE title = 'Giá trị trả về - Hàm thông điệp';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'functions-return'),
    challenge_order = 8
WHERE title = 'Giá trị trả về - Ba bước luyện tập';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'functions-return'),
    challenge_order = 9
WHERE title = 'Giá trị trả về - Từ điển bài học';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'functions-return'),
    challenge_order = 10
WHERE title = 'Giá trị trả về - Tổng kết thử thách';


-- ============================================================
-- LESSON 17: function-parameters (Tham số hàm)
-- ============================================================
UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'function-parameters'),
    challenge_order = 1
WHERE title = 'Tham số hàm - Khởi động';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'function-parameters'),
    challenge_order = 2
WHERE title = 'Tham số hàm - Gọi tên chủ đề';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'function-parameters'),
    challenge_order = 3
WHERE title = 'Tham số hàm - Thông tin bài học';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'function-parameters'),
    challenge_order = 4
WHERE title = 'Tham số hàm - Biến chủ đề';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'function-parameters'),
    challenge_order = 5
WHERE title = 'Tham số hàm - Hai dòng kết quả';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'function-parameters'),
    challenge_order = 6
WHERE title = 'Tham số hàm - Thứ tự bài học';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'function-parameters'),
    challenge_order = 7
WHERE title = 'Tham số hàm - Hàm thông điệp';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'function-parameters'),
    challenge_order = 8
WHERE title = 'Tham số hàm - Ba bước luyện tập';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'function-parameters'),
    challenge_order = 9
WHERE title = 'Tham số hàm - Từ điển bài học';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'function-parameters'),
    challenge_order = 10
WHERE title = 'Tham số hàm - Tổng kết thử thách';


-- ============================================================
-- LESSON 18: lists-basic (Danh sách cơ bản)
-- ============================================================
UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'lists-basic'),
    challenge_order = 1
WHERE title = 'Danh sách cơ bản - Khởi động';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'lists-basic'),
    challenge_order = 2
WHERE title = 'Danh sách cơ bản - Gọi tên chủ đề';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'lists-basic'),
    challenge_order = 3
WHERE title = 'Danh sách cơ bản - Thông tin bài học';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'lists-basic'),
    challenge_order = 4
WHERE title = 'Danh sách cơ bản - Biến chủ đề';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'lists-basic'),
    challenge_order = 5
WHERE title = 'Danh sách cơ bản - Hai dòng kết quả';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'lists-basic'),
    challenge_order = 6
WHERE title = 'Danh sách cơ bản - Thứ tự bài học';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'lists-basic'),
    challenge_order = 7
WHERE title = 'Danh sách cơ bản - Hàm thông điệp';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'lists-basic'),
    challenge_order = 8
WHERE title = 'Danh sách cơ bản - Ba bước luyện tập';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'lists-basic'),
    challenge_order = 9
WHERE title = 'Danh sách cơ bản - Từ điển bài học';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'lists-basic'),
    challenge_order = 10
WHERE title = 'Danh sách cơ bản - Tổng kết thử thách';


-- ============================================================
-- LESSON 19: lists-update (Thêm phần tử vào list)
-- ============================================================
UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'lists-update'),
    challenge_order = 1
WHERE title = 'Thêm phần tử vào list - Khởi động';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'lists-update'),
    challenge_order = 2
WHERE title = 'Thêm phần tử vào list - Gọi tên chủ đề';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'lists-update'),
    challenge_order = 3
WHERE title = 'Thêm phần tử vào list - Thông tin bài học';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'lists-update'),
    challenge_order = 4
WHERE title = 'Thêm phần tử vào list - Biến chủ đề';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'lists-update'),
    challenge_order = 5
WHERE title = 'Thêm phần tử vào list - Hai dòng kết quả';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'lists-update'),
    challenge_order = 6
WHERE title = 'Thêm phần tử vào list - Thứ tự bài học';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'lists-update'),
    challenge_order = 7
WHERE title = 'Thêm phần tử vào list - Hàm thông điệp';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'lists-update'),
    challenge_order = 8
WHERE title = 'Thêm phần tử vào list - Ba bước luyện tập';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'lists-update'),
    challenge_order = 9
WHERE title = 'Thêm phần tử vào list - Từ điển bài học';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'lists-update'),
    challenge_order = 10
WHERE title = 'Thêm phần tử vào list - Tổng kết thử thách';


-- ============================================================
-- LESSON 20: list-slicing (Cắt danh sách)
-- ============================================================
UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'list-slicing'),
    challenge_order = 1
WHERE title = 'Cắt danh sách - Khởi động';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'list-slicing'),
    challenge_order = 2
WHERE title = 'Cắt danh sách - Gọi tên chủ đề';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'list-slicing'),
    challenge_order = 3
WHERE title = 'Cắt danh sách - Thông tin bài học';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'list-slicing'),
    challenge_order = 4
WHERE title = 'Cắt danh sách - Biến chủ đề';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'list-slicing'),
    challenge_order = 5
WHERE title = 'Cắt danh sách - Hai dòng kết quả';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'list-slicing'),
    challenge_order = 6
WHERE title = 'Cắt danh sách - Thứ tự bài học';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'list-slicing'),
    challenge_order = 7
WHERE title = 'Cắt danh sách - Hàm thông điệp';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'list-slicing'),
    challenge_order = 8
WHERE title = 'Cắt danh sách - Ba bước luyện tập';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'list-slicing'),
    challenge_order = 9
WHERE title = 'Cắt danh sách - Từ điển bài học';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'list-slicing'),
    challenge_order = 10
WHERE title = 'Cắt danh sách - Tổng kết thử thách';


-- ============================================================
-- LESSON 21: strings-methods (Phương thức chuỗi)
-- ============================================================
UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'strings-methods'),
    challenge_order = 1
WHERE title = 'Phương thức chuỗi - Khởi động';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'strings-methods'),
    challenge_order = 2
WHERE title = 'Phương thức chuỗi - Gọi tên chủ đề';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'strings-methods'),
    challenge_order = 3
WHERE title = 'Phương thức chuỗi - Thông tin bài học';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'strings-methods'),
    challenge_order = 4
WHERE title = 'Phương thức chuỗi - Biến chủ đề';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'strings-methods'),
    challenge_order = 5
WHERE title = 'Phương thức chuỗi - Hai dòng kết quả';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'strings-methods'),
    challenge_order = 6
WHERE title = 'Phương thức chuỗi - Thứ tự bài học';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'strings-methods'),
    challenge_order = 7
WHERE title = 'Phương thức chuỗi - Hàm thông điệp';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'strings-methods'),
    challenge_order = 8
WHERE title = 'Phương thức chuỗi - Ba bước luyện tập';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'strings-methods'),
    challenge_order = 9
WHERE title = 'Phương thức chuỗi - Từ điển bài học';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'strings-methods'),
    challenge_order = 10
WHERE title = 'Phương thức chuỗi - Tổng kết thử thách';


-- ============================================================
-- LESSON 22: dictionaries-basic (Từ điển cơ bản)
-- ============================================================
UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'dictionaries-basic'),
    challenge_order = 1
WHERE title = 'Từ điển cơ bản - Khởi động';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'dictionaries-basic'),
    challenge_order = 2
WHERE title = 'Từ điển cơ bản - Gọi tên chủ đề';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'dictionaries-basic'),
    challenge_order = 3
WHERE title = 'Từ điển cơ bản - Thông tin bài học';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'dictionaries-basic'),
    challenge_order = 4
WHERE title = 'Từ điển cơ bản - Biến chủ đề';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'dictionaries-basic'),
    challenge_order = 5
WHERE title = 'Từ điển cơ bản - Hai dòng kết quả';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'dictionaries-basic'),
    challenge_order = 6
WHERE title = 'Từ điển cơ bản - Thứ tự bài học';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'dictionaries-basic'),
    challenge_order = 7
WHERE title = 'Từ điển cơ bản - Hàm thông điệp';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'dictionaries-basic'),
    challenge_order = 8
WHERE title = 'Từ điển cơ bản - Ba bước luyện tập';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'dictionaries-basic'),
    challenge_order = 9
WHERE title = 'Từ điển cơ bản - Từ điển bài học';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'dictionaries-basic'),
    challenge_order = 10
WHERE title = 'Từ điển cơ bản - Tổng kết thử thách';


-- ============================================================
-- LESSON 23: dictionaries-update (Cập nhật dictionary)
-- ============================================================
UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'dictionaries-update'),
    challenge_order = 1
WHERE title = 'Cập nhật dictionary - Khởi động';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'dictionaries-update'),
    challenge_order = 2
WHERE title = 'Cập nhật dictionary - Gọi tên chủ đề';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'dictionaries-update'),
    challenge_order = 3
WHERE title = 'Cập nhật dictionary - Thông tin bài học';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'dictionaries-update'),
    challenge_order = 4
WHERE title = 'Cập nhật dictionary - Biến chủ đề';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'dictionaries-update'),
    challenge_order = 5
WHERE title = 'Cập nhật dictionary - Hai dòng kết quả';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'dictionaries-update'),
    challenge_order = 6
WHERE title = 'Cập nhật dictionary - Thứ tự bài học';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'dictionaries-update'),
    challenge_order = 7
WHERE title = 'Cập nhật dictionary - Hàm thông điệp';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'dictionaries-update'),
    challenge_order = 8
WHERE title = 'Cập nhật dictionary - Ba bước luyện tập';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'dictionaries-update'),
    challenge_order = 9
WHERE title = 'Cập nhật dictionary - Từ điển bài học';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'dictionaries-update'),
    challenge_order = 10
WHERE title = 'Cập nhật dictionary - Tổng kết thử thách';


-- ============================================================
-- LESSON 24: nested-data (Dữ liệu lồng nhau)
-- ============================================================
UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'nested-data'),
    challenge_order = 1
WHERE title = 'Dữ liệu lồng nhau - Khởi động';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'nested-data'),
    challenge_order = 2
WHERE title = 'Dữ liệu lồng nhau - Gọi tên chủ đề';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'nested-data'),
    challenge_order = 3
WHERE title = 'Dữ liệu lồng nhau - Thông tin bài học';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'nested-data'),
    challenge_order = 4
WHERE title = 'Dữ liệu lồng nhau - Biến chủ đề';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'nested-data'),
    challenge_order = 5
WHERE title = 'Dữ liệu lồng nhau - Hai dòng kết quả';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'nested-data'),
    challenge_order = 6
WHERE title = 'Dữ liệu lồng nhau - Thứ tự bài học';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'nested-data'),
    challenge_order = 7
WHERE title = 'Dữ liệu lồng nhau - Hàm thông điệp';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'nested-data'),
    challenge_order = 8
WHERE title = 'Dữ liệu lồng nhau - Ba bước luyện tập';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'nested-data'),
    challenge_order = 9
WHERE title = 'Dữ liệu lồng nhau - Từ điển bài học';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'nested-data'),
    challenge_order = 10
WHERE title = 'Dữ liệu lồng nhau - Tổng kết thử thách';


-- ============================================================
-- LESSON 25: import-math (Import module math)
-- ============================================================
UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'import-math'),
    challenge_order = 1
WHERE title = 'Import module math - Khởi động';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'import-math'),
    challenge_order = 2
WHERE title = 'Import module math - Gọi tên chủ đề';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'import-math'),
    challenge_order = 3
WHERE title = 'Import module math - Thông tin bài học';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'import-math'),
    challenge_order = 4
WHERE title = 'Import module math - Biến chủ đề';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'import-math'),
    challenge_order = 5
WHERE title = 'Import module math - Hai dòng kết quả';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'import-math'),
    challenge_order = 6
WHERE title = 'Import module math - Thứ tự bài học';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'import-math'),
    challenge_order = 7
WHERE title = 'Import module math - Hàm thông điệp';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'import-math'),
    challenge_order = 8
WHERE title = 'Import module math - Ba bước luyện tập';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'import-math'),
    challenge_order = 9
WHERE title = 'Import module math - Từ điển bài học';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'import-math'),
    challenge_order = 10
WHERE title = 'Import module math - Tổng kết thử thách';


-- ============================================================
-- LESSON 26: random-module (Module random)
-- ============================================================
UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'random-module'),
    challenge_order = 1
WHERE title = 'Module random - Khởi động';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'random-module'),
    challenge_order = 2
WHERE title = 'Module random - Gọi tên chủ đề';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'random-module'),
    challenge_order = 3
WHERE title = 'Module random - Thông tin bài học';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'random-module'),
    challenge_order = 4
WHERE title = 'Module random - Biến chủ đề';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'random-module'),
    challenge_order = 5
WHERE title = 'Module random - Hai dòng kết quả';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'random-module'),
    challenge_order = 6
WHERE title = 'Module random - Thứ tự bài học';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'random-module'),
    challenge_order = 7
WHERE title = 'Module random - Hàm thông điệp';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'random-module'),
    challenge_order = 8
WHERE title = 'Module random - Ba bước luyện tập';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'random-module'),
    challenge_order = 9
WHERE title = 'Module random - Từ điển bài học';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'random-module'),
    challenge_order = 10
WHERE title = 'Module random - Tổng kết thử thách';


-- ============================================================
-- LESSON 27: mini-project-quiz (Mini project câu hỏi)
-- ============================================================
UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'mini-project-quiz'),
    challenge_order = 1
WHERE title = 'Mini project câu hỏi - Khởi động';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'mini-project-quiz'),
    challenge_order = 2
WHERE title = 'Mini project câu hỏi - Gọi tên chủ đề';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'mini-project-quiz'),
    challenge_order = 3
WHERE title = 'Mini project câu hỏi - Thông tin bài học';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'mini-project-quiz'),
    challenge_order = 4
WHERE title = 'Mini project câu hỏi - Biến chủ đề';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'mini-project-quiz'),
    challenge_order = 5
WHERE title = 'Mini project câu hỏi - Hai dòng kết quả';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'mini-project-quiz'),
    challenge_order = 6
WHERE title = 'Mini project câu hỏi - Thứ tự bài học';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'mini-project-quiz'),
    challenge_order = 7
WHERE title = 'Mini project câu hỏi - Hàm thông điệp';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'mini-project-quiz'),
    challenge_order = 8
WHERE title = 'Mini project câu hỏi - Ba bước luyện tập';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'mini-project-quiz'),
    challenge_order = 9
WHERE title = 'Mini project câu hỏi - Từ điển bài học';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'mini-project-quiz'),
    challenge_order = 10
WHERE title = 'Mini project câu hỏi - Tổng kết thử thách';


-- ============================================================
-- LESSON 28: mini-project-greeter (Mini project lời chào)
-- ============================================================
UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'mini-project-greeter'),
    challenge_order = 1
WHERE title = 'Mini project lời chào - Khởi động';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'mini-project-greeter'),
    challenge_order = 2
WHERE title = 'Mini project lời chào - Gọi tên chủ đề';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'mini-project-greeter'),
    challenge_order = 3
WHERE title = 'Mini project lời chào - Thông tin bài học';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'mini-project-greeter'),
    challenge_order = 4
WHERE title = 'Mini project lời chào - Biến chủ đề';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'mini-project-greeter'),
    challenge_order = 5
WHERE title = 'Mini project lời chào - Hai dòng kết quả';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'mini-project-greeter'),
    challenge_order = 6
WHERE title = 'Mini project lời chào - Thứ tự bài học';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'mini-project-greeter'),
    challenge_order = 7
WHERE title = 'Mini project lời chào - Hàm thông điệp';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'mini-project-greeter'),
    challenge_order = 8
WHERE title = 'Mini project lời chào - Ba bước luyện tập';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'mini-project-greeter'),
    challenge_order = 9
WHERE title = 'Mini project lời chào - Từ điển bài học';

UPDATE challenges
SET lesson_id = (SELECT id FROM lessons WHERE slug = 'mini-project-greeter'),
    challenge_order = 10
WHERE title = 'Mini project lời chào - Tổng kết thử thách';

-- Step 5: Add uniqueness constraint for ordering inside each lesson
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'challenges_lesson_order_unique'
  ) THEN
    ALTER TABLE challenges
    ADD CONSTRAINT challenges_lesson_order_unique UNIQUE (lesson_id, challenge_order);
  END IF;
END $$;
