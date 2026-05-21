-- Add explicit relationship between challenges and lessons
-- This allows mapping each challenge to a specific lesson
-- Each lesson has: 2 easy (order 1-2), 2 medium (order 3-4), 1 hard (order 5)

-- Step 1: Add lesson_id column (nullable for existing data that needs mapping)
ALTER TABLE challenges
ADD COLUMN IF NOT EXISTS lesson_id INTEGER REFERENCES lessons(id) ON DELETE SET NULL;

-- Step 2: Add challenge_order to maintain ordering within a lesson
ALTER TABLE challenges
ADD COLUMN IF NOT EXISTS challenge_order INTEGER DEFAULT 0;

-- Step 3: Create index for faster lookups by lesson
CREATE INDEX IF NOT EXISTS challenges_lesson_idx ON challenges (lesson_id);

-- ============================================================
-- LESSON 1: hello-python (Cơ bản lớp 6, lesson_order 1)
-- ============================================================
UPDATE challenges SET lesson_id = 1, challenge_order = 1
WHERE title = 'Chào Py-Bot!';

UPDATE challenges SET lesson_id = 1, challenge_order = 2
WHERE title = 'Xin chào Python';

UPDATE challenges SET lesson_id = 1, challenge_order = 3
WHERE title = 'Chào hai người bạn';

UPDATE challenges SET lesson_id = 1, challenge_order = 4
WHERE title = 'Giới thiệu bản thân';

UPDATE challenges SET lesson_id = 1, challenge_order = 5
WHERE title = 'Thông điệp bí mật';

-- ============================================================
-- LESSON 2: print-multiple-lines (Cơ bản lớp 6, lesson_order 2)
-- ============================================================
UPDATE challenges SET lesson_id = 2, challenge_order = 1
WHERE title = 'Hai dòng đầu tiên';

UPDATE challenges SET lesson_id = 2, challenge_order = 2
WHERE title = 'Nhật ký học tập';

UPDATE challenges SET lesson_id = 2, challenge_order = 3
WHERE title = 'Ba bước chuẩn bị';

UPDATE challenges SET lesson_id = 2, challenge_order = 4
WHERE title = 'Thông tin học sinh';

UPDATE challenges SET lesson_id = 2, challenge_order = 5
WHERE title = 'Bảng thành tích';

-- ============================================================
-- LESSON 3: variables-basic (Cơ bản lớp 6, lesson_order 3)
-- ============================================================
UPDATE challenges SET lesson_id = 3, challenge_order = 1
WHERE title = 'Lưu tên Py-Bot';

UPDATE challenges SET lesson_id = 3, challenge_order = 2
WHERE title = 'Lưu tuổi robot';

UPDATE challenges SET lesson_id = 3, challenge_order = 3
WHERE title = 'Lời chào với biến';

UPDATE challenges SET lesson_id = 3, challenge_order = 4
WHERE title = 'Tính tổng hai số';

UPDATE challenges SET lesson_id = 3, challenge_order = 5
WHERE title = 'Thẻ thông tin học sinh';

-- ============================================================
-- LESSON 4: numbers-and-math (Cơ bản lớp 6, lesson_order 4)
-- ============================================================
UPDATE challenges SET lesson_id = 4, challenge_order = 1
WHERE title = 'Phép cộng đầu tiên';

UPDATE challenges SET lesson_id = 4, challenge_order = 2
WHERE title = 'Phép trừ cơ bản';

UPDATE challenges SET lesson_id = 4, challenge_order = 3
WHERE title = 'Nhân số ngôi sao';

UPDATE challenges SET lesson_id = 4, challenge_order = 4
WHERE title = 'Tính tổng với biến';

UPDATE challenges SET lesson_id = 4, challenge_order = 5
WHERE title = 'Kho báu toán học';

-- ============================================================
-- LESSON 5: strings-basic (Cơ bản lớp 6, lesson_order 5)
-- ============================================================
UPDATE challenges SET lesson_id = 5, challenge_order = 1
WHERE title = 'Ghép lời chào';

UPDATE challenges SET lesson_id = 5, challenge_order = 2
WHERE title = 'Tên đầy đủ';

UPDATE challenges SET lesson_id = 5, challenge_order = 3
WHERE title = 'Câu khẩu hiệu';

UPDATE challenges SET lesson_id = 5, challenge_order = 4
WHERE title = 'Lời chào cá nhân';

UPDATE challenges SET lesson_id = 5, challenge_order = 5
WHERE title = 'Hồ sơ người dùng';

-- ============================================================
-- LESSON 6: input-simulation (Cơ bản lớp 6, lesson_order 6)
-- ============================================================
UPDATE challenges SET lesson_id = 6, challenge_order = 1
WHERE title = 'Chào người dùng';

UPDATE challenges SET lesson_id = 6, challenge_order = 2
WHERE title = 'In tên người dùng';

UPDATE challenges SET lesson_id = 6, challenge_order = 3
WHERE title = 'Lời chào thân thiện';

UPDATE challenges SET lesson_id = 6, challenge_order = 4
WHERE title = 'Thông tin học sinh v2';

UPDATE challenges SET lesson_id = 6, challenge_order = 5
WHERE title = 'Thẻ thành viên PythonQuest';

-- ============================================================
-- LESSON 7: comparison-operators (Cơ bản lớp 6, lesson_order 7)
-- ============================================================
UPDATE challenges SET lesson_id = 7, challenge_order = 1
WHERE title = 'Điểm đạt yêu cầu';

UPDATE challenges SET lesson_id = 7, challenge_order = 2
WHERE title = 'So sánh hai số';

UPDATE challenges SET lesson_id = 7, challenge_order = 3
WHERE title = 'Kiểm tra bằng nhau';

UPDATE challenges SET lesson_id = 7, challenge_order = 4
WHERE title = 'So sánh tuổi';

UPDATE challenges SET lesson_id = 7, challenge_order = 5
WHERE title = 'Kiểm tra nhiều điều kiện';

-- ============================================================
-- LESSON 8: if-basic (Cơ bản lớp 6, lesson_order 8)
-- ============================================================
UPDATE challenges SET lesson_id = 8, challenge_order = 1
WHERE title = 'Đạt bài kiểm tra';

UPDATE challenges SET lesson_id = 8, challenge_order = 2
WHERE title = 'Mở cửa kho báu';

UPDATE challenges SET lesson_id = 8, challenge_order = 3
WHERE title = 'Nhận thưởng';

UPDATE challenges SET lesson_id = 8, challenge_order = 4
WHERE title = 'Chiến binh đủ cấp';

UPDATE challenges SET lesson_id = 8, challenge_order = 5
WHERE title = 'Hoàn thành nhiệm vụ';

-- ============================================================
-- LESSON 9: if-else (Cơ bản lớp 6, lesson_order 9)
-- ============================================================
UPDATE challenges SET lesson_id = 9, challenge_order = 1
WHERE title = 'Qua bài hay làm lại';

UPDATE challenges SET lesson_id = 9, challenge_order = 2
WHERE title = 'Đèn giao thông';

UPDATE challenges SET lesson_id = 9, challenge_order = 3
WHERE title = 'Phân loại độ tuổi';

UPDATE challenges SET lesson_id = 9, challenge_order = 4
WHERE title = 'Kiểm tra năng lượng';

UPDATE challenges SET lesson_id = 9, challenge_order = 5
WHERE title = 'Người gác cổng';

-- ============================================================
-- LESSON 10: elif-branches (Cơ bản lớp 6, lesson_order 10)
-- ============================================================
UPDATE challenges SET lesson_id = 10, challenge_order = 1
WHERE title = 'Xếp loại khá';

UPDATE challenges SET lesson_id = 10, challenge_order = 2
WHERE title = 'Phân loại thời tiết';

UPDATE challenges SET lesson_id = 10, challenge_order = 3
WHERE title = 'Xếp hạng game thủ';

UPDATE challenges SET lesson_id = 10, challenge_order = 4
WHERE title = 'Đánh giá pin';

UPDATE challenges SET lesson_id = 10, challenge_order = 5
WHERE title = 'Học sinh xuất sắc';

-- ============================================================
-- LESSON 11: for-range (Cơ bản lớp 6, lesson_order 11)
-- ============================================================
UPDATE challenges SET lesson_id = 11, challenge_order = 1
WHERE title = 'Đếm 3 lần';

UPDATE challenges SET lesson_id = 11, challenge_order = 2
WHERE title = 'In Py-Bot 3 lần';

UPDATE challenges SET lesson_id = 11, challenge_order = 3
WHERE title = 'Đếm từ 1 đến 5';

UPDATE challenges SET lesson_id = 11, challenge_order = 4
WHERE title = 'Thu thập sao';

UPDATE challenges SET lesson_id = 11, challenge_order = 5
WHERE title = 'Bảng nhân 2';

-- ============================================================
-- LESSON 12: for-list (Cơ bản lớp 6, lesson_order 12)
-- ============================================================
UPDATE challenges SET lesson_id = 12, challenge_order = 1
WHERE title = 'Duyệt trái cây';

UPDATE challenges SET lesson_id = 12, challenge_order = 2
WHERE title = 'Danh sách động vật';

UPDATE challenges SET lesson_id = 12, challenge_order = 3
WHERE title = 'Các màu sắc';

UPDATE challenges SET lesson_id = 12, challenge_order = 4
WHERE title = 'Lời chào bạn bè';

UPDATE challenges SET lesson_id = 12, challenge_order = 5
WHERE title = 'Kho vật phẩm';

-- ============================================================
-- LESSON 13: while-loop (Cơ bản lớp 6, lesson_order 13)
-- ============================================================
UPDATE challenges SET lesson_id = 13, challenge_order = 1
WHERE title = 'Đếm từ 1 đến 3';

UPDATE challenges SET lesson_id = 13, challenge_order = 2
WHERE title = 'In Py-Bot bằng while';

UPDATE challenges SET lesson_id = 13, challenge_order = 3
WHERE title = 'Đếm ngược';

UPDATE challenges SET lesson_id = 13, challenge_order = 4
WHERE title = 'Thu thập xu';

UPDATE challenges SET lesson_id = 13, challenge_order = 5
WHERE title = 'Tính tổng từ 1 đến 5';

-- ============================================================
-- LESSON 14: break-continue (Cơ bản lớp 6, lesson_order 14)
-- ============================================================
UPDATE challenges SET lesson_id = 14, challenge_order = 1
WHERE title = 'Bỏ qua số 3';

UPDATE challenges SET lesson_id = 14, challenge_order = 2
WHERE title = 'Dừng ở số 3';

UPDATE challenges SET lesson_id = 14, challenge_order = 3
WHERE title = 'Bỏ qua số chẵn';

UPDATE challenges SET lesson_id = 14, challenge_order = 4
WHERE title = 'Tìm kho báu';

UPDATE challenges SET lesson_id = 14, challenge_order = 5
WHERE title = 'Lọc nhiệm vụ';

-- Add helpful constraint comment
COMMENT ON COLUMN challenges.lesson_id IS 'Foreign key to lessons.id - links challenge to its parent lesson';
COMMENT ON COLUMN challenges.challenge_order IS 'Order of challenge within a lesson (1-2=easy, 3-4=medium, 5=hard)';