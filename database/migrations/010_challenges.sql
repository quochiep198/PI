-- Create challenges table
CREATE TABLE IF NOT EXISTS challenges (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  difficulty VARCHAR(20) NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  xp_reward INTEGER NOT NULL DEFAULT 10,
  coins_reward INTEGER NOT NULL DEFAULT 0,
  starter_code TEXT NOT NULL,
  solution_code TEXT,
  test_cases JSONB NOT NULL DEFAULT '[]'::jsonb,
  track VARCHAR(100) DEFAULT 'Cơ bản',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create index for fetching active challenges
CREATE INDEX IF NOT EXISTS challenges_active_idx ON challenges (is_active) WHERE is_active = TRUE;

-- ============================================================
-- LESSON 1: hello-python - print cơ bản
-- ============================================================
INSERT INTO challenges (title, description, difficulty, xp_reward, coins_reward, starter_code, solution_code, test_cases, track) VALUES
('Chào Py-Bot!', 'Sử dụng print để in ra dòng chữ Chào Py-Bot!', 'easy', 10, 20,
 E'# In lời chào cho Py-Bot\n',
 'print("Chào Py-Bot!")',
 '[{"input":"","expected_output":"Chào Py-Bot!"}]',
 'Cơ bản'),
('Xin chào Python', 'Sử dụng print để in ra dòng chữ Xin chào Python', 'easy', 10, 20,
 E'# In lời chào Python\n',
 'print("Xin chào Python")',
 '[{"input":"","expected_output":"Xin chào Python"}]',
 'Cơ bản'),
('Chào hai người bạn', 'Sử dụng hai lệnh print để in hai dòng: Py-Bot và Python', 'medium', 20, 40,
 E'# In hai dòng\n',
 E'print("Py-Bot")\nprint("Python")',
 '[{"input":"","expected_output":"Py-Bot\nPython"}]',
 'Cơ bản'),
('Giới thiệu bản thân', 'In ra hai dòng: Tôi là và một tên tùy chọn', 'medium', 20, 40,
 E'# In thông tin cá nhân\n',
 E'print("Tôi là")\nprint("Minh")',
 '[{"input":"","expected_output":"Tôi là\nMinh"}]',
 'Cơ bản'),
('Thông điệp bí mật', 'In ra chính xác ba dòng: Python, Là, Tuyệt vời', 'hard', 30, 60,
 E'# In ba dòng\n',
 E'print("Python")\nprint("Là")\nprint("Tuyệt vời")',
 '[{"input":"","expected_output":"Python\nLà\nTuyệt vời"}]',
 'Cơ bản');

-- ============================================================
-- LESSON 2: print-multiple-lines - In nhiều dòng
-- ============================================================
INSERT INTO challenges (title, description, difficulty, xp_reward, coins_reward, starter_code, solution_code, test_cases, track) VALUES
('Hai dòng đầu tiên', 'In ra hai dòng: Xin chào và Py-Bot', 'easy', 10, 20,
 E'# In hai dòng\n',
 E'print("Xin chào")\nprint("Py-Bot")',
 '[{"input":"","expected_output":"Xin chào\nPy-Bot"}]',
 'Cơ bản'),
('Nhật ký học tập', 'In ra hai dòng: Hôm nay và Mình học Python', 'easy', 10, 20,
 E'# In nhật ký học tập\n',
 E'print("Hôm nay")\nprint("Mình học Python")',
 '[{"input":"","expected_output":"Hôm nay\nMình học Python"}]',
 'Cơ bản'),
('Ba bước chuẩn bị', 'In ra ba dòng: Mở máy tính, Mở Python, Bắt đầu học', 'medium', 20, 40,
 E'# In ba bước chuẩn bị\n',
 E'print("Mở máy tính")\nprint("Mở Python")\nprint("Bắt đầu học")',
 '[{"input":"","expected_output":"Mở máy tính\nMở Python\nBắt đầu học"}]',
 'Cơ bản'),
('Thông tin học sinh', 'In ra thông tin: Tên, An, Lớp, 6A (mỗi thông tin trên một dòng)', 'medium', 20, 40,
 E'# In thông tin học sinh\n',
 E'print("Tên")\nprint("An")\nprint("Lớp")\nprint("6A")',
 '[{"input":"","expected_output":"Tên\nAn\nLớp\n6A"}]',
 'Cơ bản'),
('Bảng thành tích', 'In ra chính xác bốn dòng: Toán: 10, Tin: 10, Khoa học: 9, Tiếng Anh: 10', 'hard', 30, 60,
 E'# In bảng thành tích\n',
 E'print("Toán: 10")\nprint("Tin: 10")\nprint("Khoa học: 9")\nprint("Tiếng Anh: 10")',
 '[{"input":"","expected_output":"Toán: 10\nTin: 10\nKhoa học: 9\nTiếng Anh: 10"}]',
 'Cơ bản');

-- ============================================================
-- LESSON 3: variables-basic - Biến cơ bản
-- ============================================================
INSERT INTO challenges (title, description, difficulty, xp_reward, coins_reward, starter_code, solution_code, test_cases, track) VALUES
('Lưu tên Py-Bot', 'Tạo biến name chứa "Py-Bot" và in ra màn hình', 'easy', 10, 20,
 E'# Tạo biến name và in ra\n',
 E'name = "Py-Bot"\nprint(name)',
 '[{"input":"","expected_output":"Py-Bot"}]',
 'Cơ bản'),
('Lưu tuổi robot', 'Tạo biến age chứa giá trị 5 và in ra màn hình', 'easy', 10, 20,
 E'# Tạo biến age\n',
 E'age = 5\nprint(age)',
 '[{"input":"","expected_output":"5"}]',
 'Cơ bản'),
('Lời chào với biến', 'Tạo biến name chứa "An", tạo biến greeting chứa "Xin chào " và in ra "Xin chào An"', 'medium', 20, 40,
 E'# Tạo lời chào\n',
 E'name = "An"\ngreeting = "Xin chào "\nprint(greeting + name)',
 '[{"input":"","expected_output":"Xin chào An"}]',
 'Cơ bản'),
('Tính tổng hai số', 'Tạo hai biến a = 5, b = 3 và in ra tổng', 'medium', 20, 40,
 E'# Tính tổng hai số\n',
 E'a = 5\nb = 3\nprint(a + b)',
 '[{"input":"","expected_output":"8"}]',
 'Cơ bản'),
('Thẻ thông tin học sinh', 'Tạo các biến name="An", age=11, city="Huế" và in ra đúng định dạng mỗi thông tin trên một dòng', 'hard', 30, 60,
 E'# Tạo thẻ thông tin học sinh\n',
 E'name = "An"\nage = 11\ncity = "Huế"\nprint("Tên:", name)\nprint("Tuổi:", age)\nprint("Thành phố:", city)',
 '[{"input":"","expected_output":"Tên: An\nTuổi: 11\nThành phố: Huế"}]',
 'Cơ bản');

-- ============================================================
-- LESSON 4: numbers-and-math - Số và phép tính
-- ============================================================
INSERT INTO challenges (title, description, difficulty, xp_reward, coins_reward, starter_code, solution_code, test_cases, track) VALUES
('Phép cộng đầu tiên', 'Tính tổng của 5 và 7 rồi in kết quả', 'easy', 10, 20,
 E'# Tính tổng hai số\n',
 'print(5 + 7)',
 '[{"input":"","expected_output":"12"}]',
 'Cơ bản'),
('Phép trừ cơ bản', 'Tính hiệu của 20 và 8 rồi in kết quả', 'easy', 10, 20,
 E'# Tính hiệu hai số\n',
 'print(20 - 8)',
 '[{"input":"","expected_output":"12"}]',
 'Cơ bản'),
('Nhân số ngôi sao', 'Tính tích của 6 và 4 rồi in kết quả', 'medium', 20, 40,
 E'# Tính tích hai số\n',
 'print(6 * 4)',
 '[{"input":"","expected_output":"24"}]',
 'Cơ bản'),
('Tính tổng với biến', 'Tạo biến team_a = 15, team_b = 25 và in tổng điểm hai đội', 'medium', 20, 40,
 E'# Tính tổng điểm hai đội\n',
 E'team_a = 15\nteam_b = 25\nprint(team_a + team_b)',
 '[{"input":"","expected_output":"40"}]',
 'Cơ bản'),
('Kho báu toán học', 'Tính biểu thức (10 + 5) * 2 và in kết quả', 'hard', 30, 60,
 E'# Tính biểu thức\n',
 'print((10 + 5) * 2)',
 '[{"input":"","expected_output":"30"}]',
 'Cơ bản');

-- ============================================================
-- LESSON 5: strings-basic - Chuỗi ký tự
-- ============================================================
INSERT INTO challenges (title, description, difficulty, xp_reward, coins_reward, starter_code, solution_code, test_cases, track) VALUES
('Ghép lời chào', 'Tạo biến greeting = "Chào" và name = "Py-Bot", ghép và in ra "Chào Py-Bot"', 'easy', 10, 20,
 E'# Ghép chuỗi và in\n',
 E'greeting = "Chào"\nname = "Py-Bot"\nprint(greeting + " " + name)',
 '[{"input":"","expected_output":"Chào Py-Bot"}]',
 'Cơ bản'),
('Tên đầy đủ', 'Tạo biến first_name = "Nguyễn" và last_name = "An", in ra "Nguyễn An"', 'easy', 10, 20,
 E'# Ghép họ và tên\n',
 E'first_name = "Nguyễn"\nlast_name = "An"\nprint(first_name + " " + last_name)',
 '[{"input":"","expected_output":"Nguyễn An"}]',
 'Cơ bản'),
('Câu khẩu hiệu', 'Tạo biến language = "Python" và message = "thật thú vị!", in ra "Python thật thú vời!"', 'medium', 20, 40,
 E'# Ghép câu khẩu hiệu\n',
 E'language = "Python"\nmessage = "thật thú vị!"\nprint(language + " " + message)',
 '[{"input":"","expected_output":"Python thật thú vị!"}]',
 'Cơ bản'),
('Lời chào cá nhân', 'Tạo biến name = "Lan", in ra "Xin chào Lan"', 'medium', 20, 40,
 E'# Tạo lời chào cá nhân\n',
 E'name = "Lan"\nprint("Xin chào " + name)',
 '[{"input":"","expected_output":"Xin chào Lan"}]',
 'Cơ bản'),
('Hồ sơ người dùng', 'Tạo biến name = "An" và city = "Huế", in ra "Tôi là An, đến từ Huế"', 'hard', 30, 60,
 E'# Tạo hồ sơ người dùng\n',
 E'name = "An"\ncity = "Huế"\nprint("Tôi là " + name + ", đến từ " + city)',
 '[{"input":"","expected_output":"Tôi là An, đến từ Huế"}]',
 'Cơ bản');

-- ============================================================
-- LESSON 6: input-simulation - Dữ liệu đầu vào mô phỏng
-- ============================================================
INSERT INTO challenges (title, description, difficulty, xp_reward, coins_reward, starter_code, solution_code, test_cases, track) VALUES
('Chào người dùng', 'Đã có biến user_name = "Lan". In ra "Xin chào, Lan"', 'easy', 10, 20,
 E'user_name = "Lan"\n# In lời chào\n',
 E'user_name = "Lan"\nprint("Xin chào, " + user_name)',
 '[{"input":"","expected_output":"Xin chào, Lan"}]',
 'Cơ bản'),
('In tên người dùng', 'Tạo biến user_name = "Minh" và in ra giá trị của nó', 'easy', 10, 20,
 E'# Tạo và in user_name\n',
 E'user_name = "Minh"\nprint(user_name)',
 '[{"input":"","expected_output":"Minh"}]',
 'Cơ bản'),
('Lời chào thân thiện', 'Tạo biến user_name = "An", in ra "Chào mừng An đến với Python!"', 'medium', 20, 40,
 E'# Tạo lời chào thân thiện\n',
 E'user_name = "An"\nprint("Chào mừng " + user_name + " đến với Python!")',
 '[{"input":"","expected_output":"Chào mừng An đến với Python!"}]',
 'Cơ bản'),
('Thông tin học sinh v2', 'Tạo biến name = "Lan" và age = 11, in ra "Tên: Lan" và "Tuổi: 11" (mỗi dòng một thông tin)', 'medium', 20, 40,
 E'# Hiển thị thông tin học sinh\n',
 E'name = "Lan"\nage = 11\nprint("Tên: " + name)\nprint("Tuổi: " + str(age))',
 '[{"input":"","expected_output":"Tên: Lan\nTuổi: 11"}]',
 'Cơ bản'),
('Thẻ thành viên PythonQuest', 'Tạo biến name = "An", age = 12, city = "Huế" và in ra ba dòng theo đúng định dạng', 'hard', 30, 60,
 E'# Tạo thẻ thành viên PythonQuest\n',
 E'name = "An"\nage = 12\ncity = "Huế"\nprint("Tên: " + name)\nprint("Tuổi: " + str(age))\nprint("Thành phố: " + city)',
 '[{"input":"","expected_output":"Tên: An\nTuổi: 12\nThành phố: Huế"}]',
 'Cơ bản');

-- ============================================================
-- LESSON 7: comparison-operators - Toán tử so sánh
-- ============================================================
INSERT INTO challenges (title, description, difficulty, xp_reward, coins_reward, starter_code, solution_code, test_cases, track) VALUES
('Điểm đạt yêu cầu', 'Kiểm tra xem điểm số 8 có lớn hơn hoặc bằng 5 hay không. In kết quả', 'easy', 10, 20,
 E'# Kiểm tra điểm\n',
 E'score = 8\nprint(score >= 5)',
 '[{"input":"","expected_output":"True"}]',
 'Cơ bản'),
('So sánh hai số', 'Kiểm tra xem 10 có lớn hơn 15 hay không. In kết quả', 'easy', 10, 20,
 E'# So sánh hai số\n',
 'print(10 > 15)',
 '[{"input":"","expected_output":"False"}]',
 'Cơ bản'),
('Kiểm tra bằng nhau', 'Kiểm tra xem 7 có bằng 7 hay không. In kết quả', 'medium', 20, 40,
 E'# Kiểm tra bằng nhau\n',
 'print(7 == 7)',
 '[{"input":"","expected_output":"True"}]',
 'Cơ bản'),
('So sánh tuổi', 'Tạo biến age = 12, kiểm tra age có khác 10 hay không. In kết quả', 'medium', 20, 40,
 E'# So sánh tuổi\n',
 E'age = 12\nprint(age != 10)',
 '[{"input":"","expected_output":"True"}]',
 'Cơ bản'),
('Kiểm tra nhiều điều kiện', 'In ra kết quả của 15 <= 12 và 20 >= 20 trên hai dòng riêng biệt', 'hard', 30, 60,
 E'# In hai kết quả so sánh\n',
 E'print(15 <= 12)\nprint(20 >= 20)',
 '[{"input":"","expected_output":"False\nTrue"}]',
 'Cơ bản');

-- ============================================================
-- LESSON 8: if-basic - Điều kiện if cơ bản
-- ============================================================
INSERT INTO challenges (title, description, difficulty, xp_reward, coins_reward, starter_code, solution_code, test_cases, track) VALUES
('Đạt bài kiểm tra', 'Tạo biến score = 8. Nếu score >= 5 thì in ra "Đạt"', 'easy', 10, 20,
 E'# Kiểm tra điểm\n',
 E'score = 8\nif score >= 5:\n    print("Đạt")',
 '[{"input":"","expected_output":"Đạt"}]',
 'Cơ bản'),
('Mở cửa kho báu', 'Tạo biến key = True. Nếu key đúng thì in ra "Mở khóa"', 'easy', 10, 20,
 E'# Kiểm tra chìa khóa\n',
 E'key = True\nif key:\n    print("Mở khóa")',
 '[{"input":"","expected_output":"Mở khóa"}]',
 'Cơ bản'),
('Nhận thưởng', 'Tạo biến coins = 120. Nếu coins >= 100 thì in ra "Thưởng"', 'medium', 20, 40,
 E'# Kiểm tra số xu\n',
 E'coins = 120\nif coins >= 100:\n    print("Thưởng")',
 '[{"input":"","expected_output":"Thưởng"}]',
 'Cơ bản'),
('Chiến binh đủ cấp', 'Tạo biến level = 12. Nếu level >= 10 thì in ra "Tham gia trận đấu"', 'medium', 20, 40,
 E'# Kiểm tra cấp độ\n',
 E'level = 12\nif level >= 10:\n    print("Tham gia trận đấu")',
 '[{"input":"","expected_output":"Tham gia trận đấu"}]',
 'Cơ bản'),
('Hoàn thành nhiệm vụ', 'Tạo biến xp = 150. Nếu xp >= 100 thì in ra hai dòng', 'hard', 30, 60,
 E'# Kiểm tra XP và nhận thưởng\n',
 E'xp = 150\nif xp >= 100:\n    print("Mở chương mới")\n    print("Nhận huy hiệu")',
 '[{"input":"","expected_output":"Mở chương mới\nNhận huy hiệu"}]',
 'Cơ bản');

-- ============================================================
-- LESSON 9: if-else - Điều kiện if else
-- ============================================================
INSERT INTO challenges (title, description, difficulty, xp_reward, coins_reward, starter_code, solution_code, test_cases, track) VALUES
('Qua bài hay làm lại', 'Tạo biến score = 8. Nếu score >= 5 in "Qua bài", ngược lại in "Làm lại"', 'easy', 10, 20,
 E'# Kiểm tra điểm\n',
 E'score = 8\nif score >= 5:\n    print("Qua bài")\nelse:\n    print("Làm lại")',
 '[{"input":"","expected_output":"Qua bài"}]',
 'Cơ bản'),
('Đèn giao thông', 'Tạo biến light = "green". Nếu light == "green" in "Đi", ngược lại in "Dừng"', 'easy', 10, 20,
 E'# Kiểm tra đèn giao thông\n',
 E'light = "green"\nif light == "green":\n    print("Đi")\nelse:\n    print("Dừng")',
 '[{"input":"","expected_output":"Đi"}]',
 'Cơ bản'),
('Phân loại độ tuổi', 'Tạo biến age = 13. Nếu age >= 12 in "Thiếu niên", ngược lại in "Thiếu nhi"', 'medium', 20, 40,
 E'# Phân loại độ tuổi\n',
 E'age = 13\nif age >= 12:\n    print("Thiếu niên")\nelse:\n    print("Thiếu nhi")',
 '[{"input":"","expected_output":"Thiếu niên"}]',
 'Cơ bản'),
('Kiểm tra năng lượng', 'Tạo biến energy = 5. Nếu energy > 0 in "Tiếp tục chơi", ngược lại in "Hết năng lượng"', 'medium', 20, 40,
 E'# Kiểm tra năng lượng\n',
 E'energy = 5\nif energy > 0:\n    print("Tiếp tục chơi")\nelse:\n    print("Hết năng lượng")',
 '[{"input":"","expected_output":"Tiếp tục chơi"}]',
 'Cơ bản'),
('Người gác cổng', 'Tạo biến password = "python123". Kiểm tra và in kết quả', 'hard', 30, 60,
 E'# Kiểm tra mật khẩu\n',
 E'password = "python123"\nif password == "python123":\n    print("Truy cập thành công")\nelse:\n    print("Từ chối truy cập")',
 '[{"input":"","expected_output":"Truy cập thành công"}]',
 'Cơ bản');

-- ============================================================
-- LESSON 10: elif-branches - Nhiều nhánh với elif
-- ============================================================
INSERT INTO challenges (title, description, difficulty, xp_reward, coins_reward, starter_code, solution_code, test_cases, track) VALUES
('Xếp loại khá', 'Tạo biến score = 8. Xếp loại: >=9 Giỏi, >=7 Khá, ngược lại Cần cố gắng', 'easy', 10, 20,
 E'# Xếp loại học lực\n',
 E'score = 8\nif score >= 9:\n    print("Giỏi")\nelif score >= 7:\n    print("Khá")\nelse:\n    print("Cần cố gắng")',
 '[{"input":"","expected_output":"Khá"}]',
 'Cơ bản'),
('Phân loại thời tiết', 'Tạo biến temp = 28. Phân loại: >=35 Nóng, >=25 Mát, ngược lại Lạnh', 'easy', 10, 20,
 E'# Phân loại thời tiết\n',
 E'temp = 28\nif temp >= 35:\n    print("Nóng")\nelif temp >= 25:\n    print("Mát")\nelse:\n    print("Lạnh")',
 '[{"input":"","expected_output":"Mát"}]',
 'Cơ bản'),
('Xếp hạng game thủ', 'Tạo biến points = 700. Xếp hạng: >=1000 Kim cương, >=500 Vàng, ngược lại Bạc', 'medium', 20, 40,
 E'# Xếp hạng game thủ\n',
 E'points = 700\nif points >= 1000:\n    print("Kim cương")\nelif points >= 500:\n    print("Vàng")\nelse:\n    print("Bạc")',
 '[{"input":"","expected_output":"Vàng"}]',
 'Cơ bản'),
('Đánh giá pin', 'Tạo biến battery = 45. Đánh giá: >=80 Cao, >=30 Trung bình, ngược lại Thấp', 'medium', 20, 40,
 E'# Đánh giá pin\n',
 E'battery = 45\nif battery >= 80:\n    print("Cao")\nelif battery >= 30:\n    print("Trung bình")\nelse:\n    print("Thấp")',
 '[{"input":"","expected_output":"Trung bình"}]',
 'Cơ bản'),
('Học sinh xuất sắc', 'Tạo biến score = 9. Xếp loại 4 bậc: Xuất sắc, Khá, Trung bình, Cần cố gắng', 'hard', 30, 60,
 E'# Xếp loại học lực chi tiết\n',
 E'score = 9\nif score >= 9:\n    print("Xuất sắc")\nelif score >= 7:\n    print("Khá")\nelif score >= 5:\n    print("Trung bình")\nelse:\n    print("Cần cố gắng")',
 '[{"input":"","expected_output":"Xuất sắc"}]',
 'Cơ bản');

-- ============================================================
-- LESSON 11: for-range - Vòng lặp for với range
-- ============================================================
INSERT INTO challenges (title, description, difficulty, xp_reward, coins_reward, starter_code, solution_code, test_cases, track) VALUES
('Đếm 3 lần', 'Sử dụng range(3) để in các số 0, 1, 2', 'easy', 10, 20,
 E'# Dùng range(3) để đếm\n',
 E'for i in range(3):\n    print(i)',
 '[{"input":"","expected_output":"0\n1\n2"}]',
 'Cơ bản'),
('In Py-Bot 3 lần', 'Sử dụng vòng lặp for để in "Py-Bot" 3 lần', 'easy', 10, 20,
 E'# In Py-Bot 3 lần\n',
 E'for i in range(3):\n    print("Py-Bot")',
 '[{"input":"","expected_output":"Py-Bot\nPy-Bot\nPy-Bot"}]',
 'Cơ bản'),
('Đếm từ 1 đến 5', 'Sử dụng range(1, 6) để in các số 1, 2, 3, 4, 5', 'medium', 20, 40,
 E'# Đếm từ 1 đến 5\n',
 E'for i in range(1, 6):\n    print(i)',
 '[{"input":"","expected_output":"1\n2\n3\n4\n5"}]',
 'Cơ bản'),
('Thu thập sao', 'Sử dụng vòng lặp for để in dấu "*" 5 lần', 'medium', 20, 40,
 E'# In 5 dấu sao\n',
 E'for i in range(5):\n    print("*")',
 '[{"input":"","expected_output":"*\n*\n*\n*\n*"}]',
 'Cơ bản'),
('Bảng nhân 2', 'Sử dụng range(1, 6) để in bảng nhân 2: 2, 4, 6, 8, 10', 'hard', 30, 60,
 E'# In bảng nhân 2\n',
 E'for i in range(1, 6):\n    print(2 * i)',
 '[{"input":"","expected_output":"2\n4\n6\n8\n10"}]',
 'Cơ bản');

-- ============================================================
-- LESSON 12: for-list - Duyệt danh sách bằng for
-- ============================================================
INSERT INTO challenges (title, description, difficulty, xp_reward, coins_reward, starter_code, solution_code, test_cases, track) VALUES
('Duyệt trái cây', 'Cho danh sách fruits = ["táo", "cam", "chuối"]. In từng phần tử', 'easy', 10, 20,
 E'# Duyệt danh sách trái cây\n',
 E'fruits = ["táo", "cam", "chuối"]\nfor fruit in fruits:\n    print(fruit)',
 '[{"input":"","expected_output":"táo\ncam\nchuối"}]',
 'Cơ bản'),
('Danh sách động vật', 'Cho danh sách animals = ["mèo", "chó"]. In từng con vật', 'easy', 10, 20,
 E'# Duyệt danh sách động vật\n',
 E'animals = ["mèo", "chó"]\nfor animal in animals:\n    print(animal)',
 '[{"input":"","expected_output":"mèo\nchó"}]',
 'Cơ bản'),
('Các màu sắc', 'Cho danh sách colors = ["đỏ", "xanh", "vàng"]. In từng màu', 'medium', 20, 40,
 E'# Duyệt danh sách màu\n',
 E'colors = ["đỏ", "xanh", "vàng"]\nfor color in colors:\n    print(color)',
 '[{"input":"","expected_output":"đỏ\nxanh\nvàng"}]',
 'Cơ bản'),
('Lời chào bạn bè', 'Cho danh sách friends = ["An", "Lan"]. In lời chào cho mỗi người', 'medium', 20, 40,
 E'# Chào từng người bạn\n',
 E'friends = ["An", "Lan"]\nfor name in friends:\n    print("Chào " + name)',
 '[{"input":"","expected_output":"Chào An\nChào Lan"}]',
 'Cơ bản'),
('Kho vật phẩm', 'Cho danh sách items = ["Kiếm", "Khiên", "Áo giáp"]. In từng vật phẩm', 'hard', 30, 60,
 E'# Liệt kê vật phẩm\n',
 E'items = ["Kiếm", "Khiên", "Áo giáp"]\nfor item in items:\n    print(item)',
 '[{"input":"","expected_output":"Kiếm\nKhiên\nÁo giáp"}]',
 'Cơ bản');

-- ============================================================
-- LESSON 13: while-loop - Vòng lặp while
-- ============================================================
INSERT INTO challenges (title, description, difficulty, xp_reward, coins_reward, starter_code, solution_code, test_cases, track) VALUES
('Đếm từ 1 đến 3', 'Sử dụng vòng lặp while để đếm từ 1 đến 3', 'easy', 10, 20,
 E'# Đếm từ 1 đến 3\n',
 E'count = 1\nwhile count <= 3:\n    print(count)\n    count += 1',
 '[{"input":"","expected_output":"1\n2\n3"}]',
 'Cơ bản'),
('In Py-Bot bằng while', 'Sử dụng vòng lặp while để in "Py-Bot" 3 lần', 'easy', 10, 20,
 E'# In Py-Bot 3 lần bằng while\n',
 E'i = 0\nwhile i < 3:\n    print("Py-Bot")\n    i += 1',
 '[{"input":"","expected_output":"Py-Bot\nPy-Bot\nPy-Bot"}]',
 'Cơ bản'),
('Đếm ngược', 'Sử dụng vòng lặp while để đếm ngược từ 3 xuống 1', 'medium', 20, 40,
 E'# Đếm ngược từ 3\n',
 E'n = 3\nwhile n > 0:\n    print(n)\n    n -= 1',
 '[{"input":"","expected_output":"3\n2\n1"}]',
 'Cơ bản'),
('Thu thập xu', 'Sử dụng vòng lặp while để in các số từ 1 đến 5', 'medium', 20, 40,
 E'# In số xu từ 1 đến 5\n',
 E'coin = 1\nwhile coin <= 5:\n    print(coin)\n    coin += 1',
 '[{"input":"","expected_output":"1\n2\n3\n4\n5"}]',
 'Cơ bản'),
('Tính tổng từ 1 đến 5', 'Sử dụng vòng lặp while để tính tổng các số từ 1 đến 5', 'hard', 30, 60,
 E'# Tính tổng từ 1 đến 5\n',
 E'i = 1\ntotal = 0\nwhile i <= 5:\n    total += i\n    i += 1\nprint(total)',
 '[{"input":"","expected_output":"15"}]',
 'Cơ bản');

-- ============================================================
-- LESSON 14: break-continue - Break và Continue
-- ============================================================
INSERT INTO challenges (title, description, difficulty, xp_reward, coins_reward, starter_code, solution_code, test_cases, track) VALUES
('Bỏ qua số 3', 'Sử dụng continue để bỏ qua số 3 khi đếm từ 1 đến 5', 'easy', 10, 20,
 E'# Bỏ qua số 3\n',
 E'for i in range(1, 6):\n    if i == 3:\n        continue\n    print(i)',
 '[{"input":"","expected_output":"1\n2\n4\n5"}]',
 'Cơ bản'),
('Dừng ở số 3', 'Sử dụng break để dừng vòng lặp khi gặp số 3', 'easy', 10, 20,
 E'# Dừng ở số 3\n',
 E'for i in range(1, 6):\n    if i == 3:\n        break\n    print(i)',
 '[{"input":"","expected_output":"1\n2"}]',
 'Cơ bản'),
('Bỏ qua số chẵn', 'Sử dụng continue để chỉ in các số lẻ từ 1 đến 5', 'medium', 20, 40,
 E'# Chỉ in số lẻ\n',
 E'for i in range(1, 6):\n    if i % 2 == 0:\n        continue\n    print(i)',
 '[{"input":"","expected_output":"1\n3\n5"}]',
 'Cơ bản'),
('Tìm kho báu', 'Sử dụng break để dừng vòng lặp khi gặp số 4', 'medium', 20, 40,
 E'# Tìm kho báu\n',
 E'for i in range(1, 10):\n    if i == 4:\n        break\n    print(i)',
 '[{"input":"","expected_output":"1\n2\n3"}]',
 'Cơ bản'),
('Lọc nhiệm vụ', 'Bỏ qua nhiệm vụ số 2 (continue) và dừng ở nhiệm vụ số 5 (break)', 'hard', 30, 60,
 E'# Lọc nhiệm vụ\n',
 E'for i in range(1, 10):\n    if i == 2:\n        continue\n    if i == 5:\n        break\n    print(i)',
 '[{"input":"","expected_output":"1\n3\n4"}]',
 'Cơ bản');

-- ============================================================
-- user_challenge_progress table
-- ============================================================
CREATE TABLE IF NOT EXISTS user_challenge_progress (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  challenge_id INTEGER NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  code_submitted TEXT,
  UNIQUE(user_id, challenge_id)
);

CREATE INDEX IF NOT EXISTS user_challenge_progress_user_idx ON user_challenge_progress (user_id);