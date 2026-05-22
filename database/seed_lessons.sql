INSERT INTO lessons (
  slug,
  track,
  lesson_order,
  chapter,
  title,
  description,
  objective,
  starter_code,
  completion_check_type,
  completion_check_value
)
VALUES
  (
    'hello-python',
    'Cơ bản lớp 6',
    1,
    'Cơ bản lớp 6 - Chương 1',
    'Làm quen với Python',
    'Làm quen với lệnh print và cách chương trình hiển thị kết quả đầu tiên.',
    'Viết lệnh print để chào Py-Bot.',
    '# Hãy viết mã của bạn bên dưới\nprint("Chào Py-Bot!")',
    'output_contains',
    'Chào Py-Bot!'
  ),
  (
    'print-multiple-lines',
    'Cơ bản lớp 6',
    2,
    'Cơ bản lớp 6 - Chương 1',
    'In nhiều dòng',
    'Học cách dùng nhiều lệnh print để tạo ra nhiều dòng kết quả.',
    'In ra hai dòng văn bản khác nhau.',
    'print("Xin chào")\nprint("Mình đang học Python")',
    'output_contains',
    'Mình đang học Python'
  ),
  (
    'variables-basic',
    'Cơ bản lớp 6',
    3,
    'Cơ bản lớp 6 - Chương 1',
    'Biến đầu tiên',
    'Biết cách tạo biến để lưu dữ liệu và dùng lại trong chương trình.',
    'Tạo biến name và in ra giá trị của nó.',
    'name = "Py-Bot"\nprint(name)',
    'output_contains',
    'Py-Bot'
  ),
  (
    'numbers-and-math',
    'Cơ bản lớp 6',
    4,
    'Cơ bản lớp 6 - Chương 1',
    'Số và phép tính',
    'Làm quen với số nguyên, cộng, trừ, nhân trong Python.',
    'Tính tổng của hai số và in kết quả.',
    'a = 7\nb = 5\nprint(a + b)',
    'output_contains',
    '12'
  ),
  (
    'strings-basic',
    'Cơ bản lớp 6',
    5,
    'Cơ bản lớp 6 - Chương 1',
    'Chuỗi ký tự',
    'Biết cách ghép chuỗi và hiển thị câu hoàn chỉnh.',
    'Ghép hai chuỗi và in ra câu chào.',
    'greeting = "Chào"\nname = "Py-Bot"\nprint(greeting + " " + name)',
    'output_contains',
    'Chào Py-Bot'
  ),
  (
    'input-simulation',
    'Cơ bản lớp 6',
    6,
    'Cơ bản lớp 6 - Chương 1',
    'Dữ liệu đầu vào mô phỏng',
    'Hiểu ý tưởng lấy dữ liệu từ người dùng thông qua biến mô phỏng.',
    'Dùng biến user_name và in ra lời chào cá nhân hóa.',
    'user_name = "Lan"\nprint("Xin chào, " + user_name)',
    'output_contains',
    'Xin chào, Lan'
  ),
  (
    'comparison-operators',
    'Cơ bản lớp 6',
    7,
    'Cơ bản lớp 6 - Chương 2',
    'Toán tử so sánh',
    'Làm quen với các phép so sánh như lớn hơn, nhỏ hơn, bằng nhau.',
    'So sánh hai số và in ra kết quả True hoặc False.',
    'score = 8\nprint(score >= 5)',
    'output_contains',
    'True'
  ),
  (
    'if-basic',
    'Cơ bản lớp 6',
    8,
    'Cơ bản lớp 6 - Chương 2',
    'Điều kiện if',
    'Tạo nhánh xử lý khi điều kiện đúng.',
    'Dùng if để in ra "Đạt" khi điểm lớn hơn hoặc bằng 5.',
    'score = 8\nif score >= 5:\n    print("Đạt")',
    'output_contains',
    'Đạt'
  ),
  (
    'if-else',
    'Cơ bản lớp 6',
    9,
    'Cơ bản lớp 6 - Chương 2',
    'Điều kiện if else',
    'Chương trình phản hồi khác nhau theo từng trường hợp.',
    'Viết điều kiện if else để kiểm tra điểm số.',
    'score = 8\nif score >= 5:\n    print("Qua bài")\nelse:\n    print("Làm lại")',
    'output_contains',
    'Qua bài'
  ),
  (
    'elif-branches',
    'Cơ bản lớp 6',
    10,
    'Cơ bản lớp 6 - Chương 2',
    'Nhiều nhánh với elif',
    'Biết cách xử lý nhiều trường hợp khác nhau bằng elif.',
    'Phân loại điểm thành giỏi, khá hoặc cần cố gắng.',
    'score = 8\nif score >= 9:\n    print("Giỏi")\nelif score >= 7:\n    print("Khá")\nelse:\n    print("Cần cố gắng")',
    'output_contains',
    'Khá'
  ),
  (
    'for-range',
    'Cơ bản lớp 6',
    11,
    'Cơ bản lớp 6 - Chương 3',
    'Vòng lặp for với range',
    'Lặp hành động nhiều lần mà không viết lại mã.',
    'Viết vòng lặp for chạy 3 lần.',
    'for i in range(3):\n    print("Lần lặp", i)',
    'output_contains',
    'Lần lặp 2'
  ),
  (
    'for-list',
    'Cơ bản lớp 6',
    12,
    'Cơ bản lớp 6 - Chương 3',
    'Duyệt danh sách bằng for',
    'Lặp qua từng phần tử trong một danh sách.',
    'In lần lượt các món đồ trong danh sách.',
    'items = ["bút", "vở", "thước"]\nfor item in items:\n    print(item)',
    'output_contains',
    'thước'
  ),
  (
    'while-loop',
    'Cơ bản lớp 6',
    13,
    'Cơ bản lớp 6 - Chương 3',
    'Vòng lặp while',
    'Hiểu cách lặp khi điều kiện còn đúng.',
    'Dùng while để đếm từ 1 đến 3.',
    'count = 1\nwhile count <= 3:\n    print(count)\n    count += 1',
    'output_contains',
    '3'
  ),
  (
    'break-continue',
    'Cơ bản lớp 6',
    14,
    'Cơ bản lớp 6 - Chương 3',
    'Break và continue',
    'Điều khiển vòng lặp bỏ qua hoặc dừng sớm.',
    'Dùng continue để bỏ qua số 3.',
    'for i in range(1, 6):\n    if i == 3:\n        continue\n    print(i)',
    'output_contains',
    '5'
  ),
  (
    'functions-basic',
    'Cơ bản lớp 6',
    15,
    'Cơ bản lớp 6 - Chương 4',
    'Hàm đầu tiên',
    'Gom các câu lệnh lặp lại vào hàm để tái sử dụng dễ dàng.',
    'Tạo hàm greet và gọi hàm.',
    'def greet(name):\n    print(f"Chào {name}!")\n\ngreet("Py-Bot")',
    'output_contains',
    'Chào Py-Bot!'
  ),
  (
    'functions-return',
    'Cơ bản lớp 6',
    16,
    'Cơ bản lớp 6 - Chương 4',
    'Giá trị trả về',
    'Biết cách dùng return để lấy kết quả từ hàm.',
    'Viết hàm cộng hai số và in kết quả trả về.',
    'def add(a, b):\n    return a + b\n\nprint(add(4, 6))',
    'output_contains',
    '10'
  ),
  (
    'function-parameters',
    'Cơ bản lớp 6',
    17,
    'Cơ bản lớp 6 - Chương 4',
    'Tham số hàm',
    'Truyền dữ liệu vào hàm thông qua tham số.',
    'Tạo hàm mô tả con vật nhận vào tên con vật.',
    'def describe_pet(name):\n    print("Đây là", name)\n\ndescribe_pet("mèo")',
    'output_contains',
    'Đây là mèo'
  ),
  (
    'lists-basic',
    'Cơ bản lớp 6',
    18,
    'Cơ bản lớp 6 - Chương 5',
    'Danh sách cơ bản',
    'Tạo list, truy cập phần tử và in dữ liệu.',
    'In phần tử đầu tiên của danh sách fruits.',
    'fruits = ["táo", "cam", "chuối"]\nprint(fruits[0])',
    'output_contains',
    'táo'
  ),
  (
    'lists-update',
    'Cơ bản lớp 6',
    19,
    'Cơ bản lớp 6 - Chương 5',
    'Thêm phần tử vào list',
    'Biết cách append để thêm dữ liệu mới vào danh sách.',
    'Thêm một phần tử mới vào list và in ra list.',
    'fruits = ["táo", "cam"]\nfruits.append("chuối")\nprint(fruits)',
    'output_contains',
    'chuối'
  ),
  (
    'list-slicing',
    'Cơ bản lớp 6',
    20,
    'Cơ bản lớp 6 - Chương 5',
    'Cắt danh sách',
    'Lấy một phần của list bằng slicing.',
    'In ra hai phần tử đầu tiên của list.',
    'numbers = [1, 2, 3, 4, 5]\nprint(numbers[:2])',
    'output_contains',
    '[1, 2]'
  ),
  (
    'strings-methods',
    'Nâng cao lớp 6',
    21,
    'Nâng cao lớp 6 - Chương 1',
    'Phương thức chuỗi',
    'Học cách dùng upper, lower và replace với chuỗi.',
    'Chuyển chuỗi thành in hoa và in ra.',
    'message = "python"\nprint(message.upper())',
    'output_contains',
    'PYTHON'
  ),
  (
    'dictionaries-basic',
    'Nâng cao lớp 6',
    22,
    'Nâng cao lớp 6 - Chương 1',
    'Từ điển cơ bản',
    'Lưu dữ liệu dạng key-value và đọc giá trị từ key.',
    'In tên từ dictionary student.',
    'student = {"name": "An", "age": 11}\nprint(student["name"])',
    'output_contains',
    'An'
  ),
  (
    'dictionaries-update',
    'Nâng cao lớp 6',
    23,
    'Nâng cao lớp 6 - Chương 1',
    'Cập nhật dictionary',
    'Thêm key mới và cập nhật dữ liệu trong dictionary.',
    'Thêm key city và in toàn bộ dictionary.',
    'student = {"name": "An"}\nstudent["city"] = "Hà Nội"\nprint(student)',
    'output_contains',
    'Hà Nội'
  ),
  (
    'nested-data',
    'Nâng cao lớp 6',
    24,
    'Nâng cao lớp 6 - Chương 1',
    'Dữ liệu lồng nhau',
    'Làm việc với dictionary chứa list.',
    'In ra môn học đầu tiên của học sinh.',
    'student = {"name": "An", "subjects": ["Toán", "Tin"]}\nprint(student["subjects"][0])',
    'output_contains',
    'Toán'
  ),
  (
    'import-math',
    'Nâng cao lớp 6',
    25,
    'Nâng cao lớp 6 - Chương 2',
    'Import module math',
    'Biết cách dùng module có sẵn trong Python.',
    'Import math và in căn bậc hai của 16.',
    'import math\nprint(math.sqrt(16))',
    'output_contains',
    '4.0'
  ),
  (
    'random-module',
    'Nâng cao lớp 6',
    26,
    'Nâng cao lớp 6 - Chương 2',
    'Module random',
    'Làm quen với việc dùng random để chọn dữ liệu ngẫu nhiên.',
    'Dùng random.choice để chọn một màu trong danh sách.',
    'import random\ncolors = ["đỏ", "xanh", "vàng"]\nprint(random.choice(colors))',
    'code_contains',
    'random.choice'
  ),
  (
    'mini-project-quiz',
    'Nâng cao lớp 6',
    27,
    'Nâng cao lớp 6 - Chương 3',
    'Mini project câu hỏi',
    'Kết hợp biến, điều kiện và in kết quả trong một chương trình nhỏ.',
    'Viết chương trình kiểm tra một câu trả lời đơn giản.',
    'answer = "python"\nif answer == "python":\n    print("Chính xác")\nelse:\n    print("Thử lại")',
    'output_contains',
    'Chính xác'
  ),
  (
    'mini-project-greeter',
    'Nâng cao lớp 6',
    28,
    'Nâng cao lớp 6 - Chương 3',
    'Mini project lời chào',
    'Kết hợp hàm và vòng lặp để tạo một chương trình hoàn chỉnh nhỏ.',
    'In ra 3 lời chào bằng hàm và vòng lặp.',
    'def greet(name):\n    print(f"Chào {name}!")\n\nfor _ in range(3):\n    greet("Py-Bot")',
    'output_contains',
    'Chào Py-Bot!'
  )
ON CONFLICT (slug) DO UPDATE SET
  track = EXCLUDED.track,
  chapter = EXCLUDED.chapter,
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  objective = EXCLUDED.objective,
  starter_code = EXCLUDED.starter_code,
  completion_check_type = EXCLUDED.completion_check_type,
  completion_check_value = EXCLUDED.completion_check_value;




  UPDATE lessons
SET starter_code = CASE slug
    WHEN 'hello-python' THEN '# Bài học:
# print() dùng để hiển thị nội dung ra màn hình.

# Nhiệm vụ:
# In ra dòng chữ Chào Py-Bot!

# Gợi ý:
# Dùng hàm print(...)

# Viết code bên dưới:
'
    WHEN 'print-multiple-lines' THEN '# Bài học:
# Mỗi lệnh print() sẽ in ra một dòng.

# Nhiệm vụ:
# In ra hai dòng văn bản khác nhau.

# Gợi ý:
# Dùng 2 lệnh print(...)

# Viết code bên dưới:
'
    WHEN 'variables-basic' THEN '# Bài học:
# Biến giúp lưu dữ liệu để dùng lại.

# Nhiệm vụ:
# Tạo biến name và in giá trị của nó.

# Gợi ý:
# name = ... và print(...)

# Viết code bên dưới:
'
    WHEN 'numbers-and-math' THEN '# Bài học:
# Python có thể thực hiện phép tính.

# Nhiệm vụ:
# Tạo hai số và in tổng của chúng.

# Gợi ý:
# Dùng dấu +

# Viết code bên dưới:
'
    WHEN 'strings-basic' THEN '# Bài học:
# Chuỗi là dữ liệu dạng văn bản.

# Nhiệm vụ:
# Ghép hai chuỗi để tạo lời chào.

# Gợi ý:
# Dùng dấu + để nối chuỗi

# Viết code bên dưới:
'
    WHEN 'input-simulation' THEN '# Bài học:
# Có thể mô phỏng dữ liệu người dùng bằng biến.

# Nhiệm vụ:
# Tạo biến user_name và in lời chào.

# Gợi ý:
# Ghép chuỗi với biến

# Viết code bên dưới:
'
    WHEN 'comparison-operators' THEN '# Bài học:
# Toán tử so sánh giúp kiểm tra điều kiện.

# Nhiệm vụ:
# Kiểm tra một số có lớn hơn hoặc bằng 5 không.

# Gợi ý:
# Dùng >=

# Viết code bên dưới:
'
    WHEN 'if-basic' THEN '# Bài học:
# if dùng để kiểm tra điều kiện.

# Nhiệm vụ:
# Nếu điểm >= 5 thì in Đạt.

# Gợi ý:
# if điều_kiện:

# Viết code bên dưới:
'
    WHEN 'if-else' THEN '# Bài học:
# if else giúp xử lý hai trường hợp.

# Nhiệm vụ:
# Nếu đạt thì in Qua bài, ngược lại in Làm lại.

# Gợi ý:
# Dùng if và else

# Viết code bên dưới:
'
    WHEN 'elif-branches' THEN '# Bài học:
# elif dùng để kiểm tra nhiều trường hợp.

# Nhiệm vụ:
# Phân loại điểm thành Giỏi, Khá hoặc Cần cố gắng.

# Gợi ý:
# Dùng if, elif, else

# Viết code bên dưới:
'
    WHEN 'for-range' THEN '# Bài học:
# for kết hợp range() để lặp nhiều lần.

# Nhiệm vụ:
# Viết vòng lặp chạy 3 lần.

# Gợi ý:
# range(3)

# Viết code bên dưới:
'
    WHEN 'for-list' THEN '# Bài học:
# for có thể duyệt từng phần tử trong danh sách.

# Nhiệm vụ:
# In từng món đồ trong list.

# Gợi ý:
# for item in items:

# Viết code bên dưới:
'
    WHEN 'while-loop' THEN '# Bài học:
# while lặp khi điều kiện còn đúng.

# Nhiệm vụ:
# Đếm từ 1 đến 3.

# Gợi ý:
# Nhớ tăng biến đếm

# Viết code bên dưới:
'
    WHEN 'break-continue' THEN '# Bài học:
# continue giúp bỏ qua một lần lặp.

# Nhiệm vụ:
# In từ 1 đến 5 nhưng bỏ qua số 3.

# Gợi ý:
# if i == 3: continue

# Viết code bên dưới:
'
    WHEN 'functions-basic' THEN '# Bài học:
# Hàm giúp tái sử dụng code.

# Nhiệm vụ:
# Tạo hàm greet và gọi hàm.

# Gợi ý:
# def greet(...):

# Viết code bên dưới:
'
    WHEN 'functions-return' THEN '# Bài học:
# return dùng để trả về kết quả.

# Nhiệm vụ:
# Viết hàm cộng hai số.

# Gợi ý:
# return a + b

# Viết code bên dưới:
'
    WHEN 'function-parameters' THEN '# Bài học:
# Tham số giúp truyền dữ liệu vào hàm.

# Nhiệm vụ:
# Tạo hàm nhận tên con vật.

# Gợi ý:
# def describe_pet(name):

# Viết code bên dưới:
'
    WHEN 'lists-basic' THEN '# Bài học:
# Danh sách lưu nhiều giá trị.

# Nhiệm vụ:
# In phần tử đầu tiên của list.

# Gợi ý:
# list[0]

# Viết code bên dưới:
'
    WHEN 'lists-update' THEN '# Bài học:
# append() dùng để thêm phần tử.

# Nhiệm vụ:
# Thêm phần tử mới vào list.

# Gợi ý:
# list.append(...)

# Viết code bên dưới:
'
    WHEN 'list-slicing' THEN '# Bài học:
# Slicing giúp lấy một phần danh sách.

# Nhiệm vụ:
# In ra hai phần tử đầu tiên.

# Gợi ý:
# numbers[:2]

# Viết code bên dưới:
'
    WHEN 'strings-methods' THEN '# Bài học:
# Chuỗi có nhiều phương thức hữu ích.

# Nhiệm vụ:
# Chuyển chuỗi thành in hoa.

# Gợi ý:
# upper()

# Viết code bên dưới:
'
    WHEN 'dictionaries-basic' THEN '# Bài học:
# Dictionary lưu dữ liệu dạng key-value.

# Nhiệm vụ:
# In tên từ dictionary.

# Gợi ý:
# student["name"]

# Viết code bên dưới:
'
    WHEN 'dictionaries-update' THEN '# Bài học:
# Có thể thêm dữ liệu mới vào dictionary.

# Nhiệm vụ:
# Thêm key city.

# Gợi ý:
# student["city"] = ...

# Viết code bên dưới:
'
    WHEN 'nested-data' THEN '# Bài học:
# Dữ liệu có thể lồng nhau.

# Nhiệm vụ:
# Lấy môn học đầu tiên trong list.

# Gợi ý:
# student["subjects"][0]

# Viết code bên dưới:
'
    WHEN 'import-math' THEN '# Bài học:
# Python có các module hỗ trợ sẵn.

# Nhiệm vụ:
# In căn bậc hai của 16.

# Gợi ý:
# import math

# Viết code bên dưới:
'
    WHEN 'random-module' THEN '# Bài học:
# random giúp chọn dữ liệu ngẫu nhiên.

# Nhiệm vụ:
# Chọn ngẫu nhiên một màu.

# Gợi ý:
# random.choice(...)

# Viết code bên dưới:
'
    WHEN 'mini-project-quiz' THEN '# Bài học:
# Kết hợp biến và điều kiện.

# Nhiệm vụ:
# Kiểm tra câu trả lời đúng hay sai.

# Gợi ý:
# Dùng if

# Viết code bên dưới:
'
    WHEN 'mini-project-greeter' THEN '# Bài học:
# Kết hợp hàm và vòng lặp.

# Nhiệm vụ:
# In lời chào nhiều lần.

# Gợi ý:
# Gọi hàm trong vòng lặp

# Viết code bên dưới:
'
END
WHERE slug IN (
    'hello-python',
    'print-multiple-lines',
    'variables-basic',
    'numbers-and-math',
    'strings-basic',
    'input-simulation',
    'comparison-operators',
    'if-basic',
    'if-else',
    'elif-branches',
    'for-range',
    'for-list',
    'while-loop',
    'break-continue',
    'functions-basic',
    'functions-return',
    'function-parameters',
    'lists-basic',
    'lists-update',
    'list-slicing',
    'strings-methods',
    'dictionaries-basic',
    'dictionaries-update',
    'nested-data',
    'import-math',
    'random-module',
    'mini-project-quiz',
    'mini-project-greeter'
);
