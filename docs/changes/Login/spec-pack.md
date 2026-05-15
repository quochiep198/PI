# Gói đặc tả thay đổi - Login

> Tạo: 2026-05-15 · Giai đoạn: 1
> **Nguồn tham chiếu duy nhất cho thay đổi này.**
> Không triển khai bất kỳ nội dung nào không được viết ở đây. Các điểm chưa rõ được liệt kê trong Open Issues.

---

## 1. Bối cảnh / Mục đích
Ứng dụng hiện cần bổ sung hệ thống xác thực người dùng để thay thế trạng thái học ẩn danh hiện tại. Màn hình đăng nhập phải bám hoàn toàn theo thiết kế tại `docs/raw/design/Login/code.html`, đồng thời cung cấp đăng nhập bền vững, đăng ký tài khoản mới, lưu tiến trình học theo từng user, và bảo vệ thông tin mật khẩu theo chuẩn an toàn.

Spec-pack này xác định hành vi mục tiêu của khu vực `Login`, đồng thời ràng buộc UI với file thiết kế gốc để tránh sai khác giữa implementation và raw design.

---

## 2. Phạm vi

### Trong phạm vi
- Trang Login và Register của ứng dụng
- UI/UX tham chiếu trực tiếp từ `docs/raw/design/Login/code.html`
- API đăng nhập, đăng xuất, đăng ký user mới
- Cơ chế session/cookie tồn tại 30 ngày
- Cơ chế giữ trạng thái đăng nhập khi người dùng refresh trang
- Lưu trữ mật khẩu ở dạng mã hóa băm an toàn
- Gắn tiến trình học với user đã đăng nhập
- Nạp lại tiến trình học đúng user ở Homepage

### Ngoài phạm vi
- Đăng nhập mạng xã hội Google/GitHub thực tế
- Quên mật khẩu / reset mật khẩu qua email
- Xác thực đa yếu tố
- Quản trị user / phân quyền admin
- Chỉnh sửa profile ngoài thông tin cần thiết cho auth

---

## 3. Thuật ngữ

| # | Thuật ngữ | Định nghĩa |
|---|---|---|
| 1 | Login UI | Giao diện đăng nhập hiển thị cho người dùng cuối |
| 2 | Register UI | Giao diện tạo tài khoản mới |
| 3 | Auth Session | Phiên đăng nhập sau khi xác thực thành công |
| 4 | Session Cookie | Cookie xác thực dùng để duy trì đăng nhập |
| 5 | Persistent Login | Trạng thái đăng nhập được giữ sau refresh và các lần mở lại trong thời hạn cookie |
| 6 | Password Hash | Chuỗi băm mật khẩu đã được xử lý an toàn, không lưu plaintext |
| 7 | User Progress | Tiến trình bài học gắn theo user thay vì theo khóa ẩn danh local |
| 8 | Raw Design | File HTML thiết kế chuẩn tại `docs/raw/design/Login/code.html` |

---

## 4. Hiện trạng / Trạng thái mục tiêu

| # | Khía cạnh | Hiện trạng | Trạng thái mục tiêu |
|---|---|---|---|
| 1 | Xác thực | Chưa có login chính thức | Có login bằng username/email và password |
| 2 | UI login | Chưa có màn hình login production | UI phải bám hoàn toàn `docs/raw/design/Login/code.html` |
| 3 | Session | Tiến trình học đang dựa vào khóa local ẩn danh | Chuyển sang session gắn với user đã xác thực |
| 4 | Persistence | Refresh có thể mất trạng thái auth vì chưa có auth flow | Giữ trạng thái đăng nhập khi refresh và trong 30 ngày |
| 5 | User creation | Chưa có luồng tạo user mới | Có màn hình/luồng đăng ký tài khoản mới |
| 6 | Bảo mật mật khẩu | Chưa xác định cơ chế | Mật khẩu phải được băm an toàn, không lưu thô |

---

## 5. Chi tiết đặc tả

### 5.1 Giao diện Login

**Pre-conditions:**
- Người dùng truy cập trang login khi chưa đăng nhập.

**Luồng chính:**
1. Hệ thống hiển thị trang login.
2. Bố cục, typography, spacing, copy, thành phần minh họa và cấu trúc chính của trang phải tham chiếu hoàn toàn từ `docs/raw/design/Login/code.html`.
3. Trang phải gồm tối thiểu các thành phần theo raw design:
   - khối minh họa bên trái trên desktop
   - branding PythonQuest
   - input `Email hoặc Tên đăng nhập`
   - input `Mật khẩu`
   - nút CTA đăng nhập chính
   - divider
   - cụm social buttons chỉ ở mức UI nếu chưa tích hợp
   - footer dẫn tới tạo tài khoản mới
4. Trên mobile, trang phải giữ đúng tinh thần raw design, bao gồm phần branding mobile-only và khối form trung tâm.

**Business rules:**
- BR-1: Không được tự ý thay đổi bố cục hoặc visual direction khác với raw design nếu không có change request riêng.
- BR-2: Nếu một thành phần trong raw design chưa có chức năng backend, vẫn phải hiển thị đúng UI nhưng có thể ở trạng thái disabled hoặc no-op rõ ràng.
- BR-3: Copy hiển thị có thể được chuẩn hóa encoding tiếng Việt, nhưng không được thay đổi ý nghĩa nội dung thiết kế.

**Post-conditions:**
- Người dùng nhìn thấy màn hình login đồng nhất với raw design.

---

### 5.2 Đăng nhập bằng email hoặc tên đăng nhập

**Pre-conditions:**
- User đã có tài khoản hợp lệ.

**Luồng chính:**
1. Người dùng nhập `email hoặc tên đăng nhập` và `mật khẩu`.
2. Người dùng bấm nút đăng nhập.
3. Hệ thống gửi request xác thực tới backend.
4. Backend kiểm tra user tồn tại theo email hoặc username.
5. Backend đối chiếu password bằng cơ chế verify hash.
6. Nếu xác thực thành công:
   - tạo auth session
   - set session cookie 30 ngày
   - trả về thông tin user tối thiểu cần thiết cho frontend
   - điều hướng người dùng vào khu vực học bài
7. Nếu xác thực thất bại, hiển thị lỗi không làm lộ user có tồn tại hay không.

**Business rules:**
- BR-4: Cho phép đăng nhập bằng `email` hoặc `username` trong cùng một field.
- BR-5: Thông báo lỗi phải là generic, ví dụ tương đương “Thông tin đăng nhập không hợp lệ”.
- BR-6: Không log plaintext password ở client, server hoặc log truy vết.

**Post-conditions:**
- User ở trạng thái authenticated và có session hợp lệ.

---

### 5.3 Session cookie 30 ngày và giữ đăng nhập khi refresh

**Pre-conditions:**
- User đã đăng nhập thành công.

**Luồng chính:**
1. Backend set auth cookie với thời hạn sống 30 ngày kể từ lúc đăng nhập.
2. Cookie phải được trình duyệt gửi lại ở các request tiếp theo.
3. Khi người dùng refresh trang:
   - frontend không được coi user là logged out chỉ vì reload
   - frontend phải gọi endpoint xác thực session hiện tại hoặc đọc auth state từ server bootstrap
4. Nếu session còn hiệu lực:
   - giữ user ở trạng thái đã đăng nhập
   - điều hướng đúng về trang đang truy cập hoặc khu vực học tập
5. Nếu session hết hạn hoặc không hợp lệ:
   - xóa auth state ở client
   - chuyển user về login

**Business rules:**
- BR-7: Cookie auth phải có `HttpOnly`.
- BR-8: Cookie auth phải có `Secure` trong môi trường HTTPS/production.
- BR-9: Cookie auth phải có `SameSite=Lax` hoặc chặt hơn, trừ khi có yêu cầu tích hợp cross-site riêng.
- BR-10: Không dùng localStorage để lưu password, raw token dài hạn, hoặc session secret.

**Post-conditions:**
- Refresh trang không làm mất phiên đăng nhập trong vòng 30 ngày nếu session còn hợp lệ.

---

### 5.4 Tạo user mới

**Pre-conditions:**
- Người dùng chưa có tài khoản.

**Luồng chính:**
1. Người dùng chọn CTA tạo tài khoản từ footer của login hoặc route register riêng.
2. Hệ thống hiển thị form tạo user mới.
3. Form tối thiểu thu thập:
   - username
   - email
   - password
   - xác nhận password nếu UX cần
4. Khi submit:
   - validate dữ liệu đầu vào
   - kiểm tra email và username chưa tồn tại
   - băm mật khẩu
   - tạo user record mới
   - có thể tự động đăng nhập ngay sau khi tạo thành công hoặc chuyển về login, theo quyết định implementation

**Business rules:**
- BR-11: `username` phải unique.
- BR-12: `email` phải unique.
- BR-13: Password phải có ràng buộc tối thiểu về độ dài và độ mạnh.
- BR-14: Nếu auto-login sau đăng ký, hệ thống vẫn phải tuân thủ cookie 30 ngày.

**Post-conditions:**
- User mới được tạo thành công và có thể đăng nhập ngay.

---

### 5.5 Bảo mật mật khẩu

**Pre-conditions:**
- Hệ thống nhận password mới hoặc password đăng nhập.

**Luồng chính:**
1. Khi đăng ký user:
   - password được xử lý server-side
   - không lưu password gốc vào DB
2. Hệ thống tạo password hash bằng thuật toán băm an toàn có salt, ví dụ Argon2 hoặc bcrypt với cost phù hợp.
3. Khi login:
   - backend lấy password hash đã lưu
   - verify password nhập vào bằng hàm verify của thư viện tương ứng
4. Nếu verify thất bại, trả lỗi đăng nhập thất bại mà không nêu chi tiết kỹ thuật.

**Business rules:**
- BR-15: Không tự chế thuật toán mã hóa/băm mật khẩu.
- BR-16: Không được dùng mã hóa đối xứng để “giấu” password rồi giải mã lại.
- BR-17: Password hash phải được lưu riêng trong bảng user/auth, không lẫn với session data.

**Post-conditions:**
- Mật khẩu được lưu và xác thực theo chuẩn an toàn.

---

### 5.6 Tiến trình học theo từng user

**Pre-conditions:**
- User đã đăng nhập.

**Luồng chính:**
1. Mỗi user có một identity ổn định trong hệ thống.
2. Khi user vào Homepage, frontend tải tiến trình dựa trên user đang đăng nhập, không dùng khóa ẩn danh local cũ làm nguồn chính.
3. Khi user hoàn thành bài học:
   - backend lưu lesson progress theo `userId`
   - tiến trình đó chỉ thuộc về đúng user hiện tại
4. Khi user logout và user khác login trên cùng trình duyệt:
   - Homepage phải nạp tiến trình của user mới
   - không được hiển thị nhầm tiến trình của user cũ

**Business rules:**
- BR-18: Tiến trình học là dữ liệu riêng theo user.
- BR-19: Nếu hệ thống vẫn cần hỗ trợ anonymous mode, tiến trình anonymous phải tách biệt hoàn toàn với progress authenticated.
- BR-20: Khi migrate từ `learnerKey` sang `userId`, cần xác định rõ có nhập tiến trình cũ hay bỏ qua.

**Post-conditions:**
- Tiến trình học được lưu và nạp đúng theo tài khoản người dùng.

---

### 5.7 Đăng xuất

**Pre-conditions:**
- User đang có session hợp lệ.

**Luồng chính:**
1. User chọn logout.
2. Backend hủy session hiện tại.
3. Cookie auth bị xóa hoặc hết hiệu lực ngay.
4. Frontend xóa auth state đang giữ trong memory.
5. User được chuyển về trang login.

**Business rules:**
- BR-21: Logout trên cùng trình duyệt phải ngăn refresh tiếp tục vào app bằng session cũ.

**Post-conditions:**
- User không còn authenticated.

---

## 6. Yêu cầu phi chức năng

| # | Danh mục | Yêu cầu |
|---|---|---|
| 1 | Bảo mật | Password phải được băm an toàn; cookie auth phải là `HttpOnly`, `Secure` ở production, và có `SameSite` phù hợp |
| 2 | Tính nhất quán UI | Login UI phải bám hoàn toàn `docs/raw/design/Login/code.html` |
| 3 | Khả năng dùng lại | Auth state phải dùng được xuyên suốt giữa login, homepage và progress |
| 4 | Tính bền vững session | Phiên đăng nhập phải tồn tại 30 ngày nếu chưa logout hoặc bị thu hồi |
| 5 | Tương thích refresh | Refresh trình duyệt không làm mất đăng nhập nếu cookie còn hiệu lực |
| 6 | Tách biệt dữ liệu | Progress giữa các user phải được cách ly tuyệt đối |

---

## 7. Tiêu chí chấp nhận

| # | ID | Mô tả | Loại kiểm thử |
|---|---|---|---|
| 1 | AC-LOGIN-1 | Trang login production phải khớp bố cục và thành phần chính của `docs/raw/design/Login/code.html` | UI Review / E2E |
| 2 | AC-LOGIN-2 | User có thể đăng nhập bằng email hoặc username và password hợp lệ | E2E |
| 3 | AC-LOGIN-3 | Sau đăng nhập thành công, hệ thống set cookie auth có hạn 30 ngày | API / E2E |
| 4 | AC-LOGIN-4 | Refresh trang trong thời hạn session không làm user bị logout | E2E |
| 5 | AC-LOGIN-5 | Password trong DB không được lưu plaintext và verify thành công qua hash | IT |
| 6 | AC-LOGIN-6 | User mới có thể đăng ký nếu email/username chưa tồn tại | E2E |
| 7 | AC-LOGIN-7 | Hai user khác nhau trên cùng máy phải thấy tiến trình học khác nhau đúng theo tài khoản | E2E |
| 8 | AC-LOGIN-8 | Logout xóa session hiện tại và refresh không tự đăng nhập lại | E2E |
| 9 | AC-LOGIN-9 | Sai password phải trả lỗi generic, không lộ user tồn tại hay không | E2E / Security |
| 10 | AC-LOGIN-10 | Nếu session hết hạn, refresh phải đưa user về login | E2E |

---

## 8. Ví dụ

### Các luồng bình thường

1. **Đăng nhập thành công:** User nhập `explorer_01` và password đúng, hệ thống tạo session cookie 30 ngày và chuyển vào Homepage.
2. **Refresh vẫn giữ phiên:** User vừa login, nhấn F5 hoặc refresh tab, app vẫn giữ user đã đăng nhập và tiếp tục hiển thị tiến trình đúng.
3. **Đăng ký tài khoản mới:** User nhập username/email/password hợp lệ, hệ thống tạo user mới và cho phép bắt đầu học.
4. **Tiến trình riêng theo user:** User A hoàn thành 3 bài, logout; User B đăng nhập chỉ thấy đúng tiến trình của B.

### Các luồng lỗi

1. **Sai password:** User nhập email đúng nhưng password sai, hệ thống trả thông báo lỗi đăng nhập chung.
2. **Email đã tồn tại khi đăng ký:** User đăng ký bằng email đã dùng, hệ thống báo lỗi trùng email.
3. **Session hết hạn:** Sau 30 ngày hoặc khi session bị thu hồi, refresh sẽ chuyển user về login.
4. **Cookie không hợp lệ:** Nếu cookie bị sửa hoặc giả mạo, backend từ chối session và yêu cầu đăng nhập lại.

### Các trường hợp biên

1. **Đổi user trên cùng trình duyệt:** Logout user A rồi login user B, progress phải chuyển sang dữ liệu của B.
2. **Mở lại tab sau vài ngày:** Nếu còn trong 30 ngày và session hợp lệ, user vẫn được giữ đăng nhập.
3. **Thiếu backend social login:** Nút Google/GitHub vẫn hiển thị đúng UI theo raw design nhưng không được gây lỗi JS nếu chưa tích hợp.

---

## 9. Wireframe ASCII

```text
+----------------------------------------------------------------------------------+
| Main container                                                                   |
|----------------------------------------------------------------------------------|
| Left illustration panel (desktop only) | Right auth panel                        |
|----------------------------------------|-----------------------------------------|
| Py-Bot image                           | Mobile branding                         |
| PythonQuest title                      | Welcome header                          |
| Hero supporting text                   | Username/email input                    |
| Decorative circles / print() backdrop  | Password input + forgot password link   |
|                                        | Primary login CTA                       |
|                                        | Divider                                 |
|                                        | Google / GitHub buttons                 |
|                                        | Footer CTA: create new account          |
+----------------------------------------------------------------------------------+
```

Ghi chú:
- Layout, hierarchy và visual direction phải bám `docs/raw/design/Login/code.html`.
- Register screen có thể dùng chung visual system của Login nhưng cần spec riêng ở implementation nếu khác bố cục.

---

## 10. Các vấn đề mở

| # | Câu hỏi | Người phụ trách | Hạn chót |
|---|---|---|---|
| 1 | Route register sẽ là trang riêng hay modal/inline switch từ login? | FE/UX | TBD |
| 2 | Có tự động migrate progress anonymous hiện tại sang user mới sau login không? | FE/BE | TBD |
| 3 | Chọn thư viện hash nào: `argon2` hay `bcrypt`? | BE/Security | TBD |
| 4 | Social login chỉ là UI placeholder hay sẽ được triển khai ở phase sau? | FE/BE | TBD |
| 5 | Session store dùng DB, Redis hay signed cookie session? | BE | TBD |

---

## 11. Rủi ro

| # | Rủi ro | Khả năng xảy ra | Mức độ ảnh hưởng | Biện pháp giảm thiểu |
|---|---|---|---|---|
| 1 | UI implementation lệch raw design | Trung bình | Trung bình | Review theo file `docs/raw/design/Login/code.html` trước merge |
| 2 | Session chỉ lưu ở client và mất sau refresh | Trung bình | Cao | Bắt buộc cookie auth server-backed hoặc signed session hợp lệ |
| 3 | Lưu password không an toàn | Thấp | Rất cao | Chỉ dùng Argon2/bcrypt, review bảo mật backend |
| 4 | Progress của user cũ rò sang user mới trên cùng máy | Trung bình | Cao | Ràng buộc truy vấn progress theo `userId`, clear auth state khi logout |
| 5 | Cookie thiếu `Secure`/`HttpOnly` làm tăng rủi ro tấn công | Trung bình | Cao | Chốt cờ cookie trong middleware/auth layer |

---

## Bảng truy vết

| # | AC | Màn hình/API | DB | Logs | Quyền | Loại kiểm thử |
|---|---|---|---|---|---|---|
| 1 | AC-LOGIN-1 | Login page, raw design reference | - | UI review notes | Public | UI Review / E2E |
| 2 | AC-LOGIN-2 | `POST /auth/login` | Users, Sessions | Auth audit log | Public | E2E |
| 3 | AC-LOGIN-3 | `POST /auth/login`, session middleware | Sessions | Access log | Public | API / E2E |
| 4 | AC-LOGIN-4 | `GET /auth/me` hoặc bootstrap session | Sessions | Access log | Authenticated | E2E |
| 5 | AC-LOGIN-5 | User auth repository | Users | Security review log | System | IT |
| 6 | AC-LOGIN-6 | `POST /auth/register` | Users | Access log | Public | E2E |
| 7 | AC-LOGIN-7 | Homepage progress API theo user | Progress | Access log | Authenticated | E2E |
| 8 | AC-LOGIN-8 | `POST /auth/logout` | Sessions | Access log | Authenticated | E2E |
