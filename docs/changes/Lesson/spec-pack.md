# Gói đặc tả thay đổi - Lesson Homepage

> Tạo: 2026-05-15
> Nguồn tham chiếu: source hiện tại trong `src/`, `server/`, `api/`

---

## 1. Bối cảnh / Mục đích
Trang `HomePage` là màn hình học bài Python chính của ứng dụng. Theo source hiện tại, màn hình này kết hợp các luồng sau:

- tải danh sách bài học từ `GET /api/lessons`
- tải và ghi nhận tiến trình học theo user đã đăng nhập qua session
- chạy Python trực tiếp trên client bằng Pyodide
- xin gợi ý AI theo bài học hiện tại qua `POST /api/hint`
- phân quyền track Pro ở frontend dựa trên `user.isPro`
- cập nhật trực tiếp số người học đang online qua SSE `GET /api/presence/stream`

Tài liệu này phản ánh hành vi thực tế của code hiện tại và thay thế baseline cũ đã lệch với source.

---

## 2. Phạm vi

### Trong phạm vi
- `src/features/home/HomePage.tsx`
- `src/features/home/useLessons.ts`
- `src/features/home/useLessonProgress.ts`
- `src/features/home/usePyodideRunner.ts`
- `src/features/home/useOnlineLearners.ts`
- `server/handlers.mjs`
- `server/db.mjs`
- các API route liên quan trong `api/`

### Ngoài phạm vi
- thay đổi thiết kế tổng thể ngoài các thành phần đã có
- thay đổi logic biên soạn nội dung bài học
- admin flow nâng cấp user lên Pro
- thống kê online đa instance / đa server

---

## 3. Thuật ngữ

| Thuật ngữ | Mô tả |
|---|---|
| Lesson | Bản ghi bài học trả về từ `/api/lessons` |
| Track | Nhóm bài học theo `lesson.track` |
| Pro Track | Track bị khóa với user thường, hiện tại là `Nâng cao lớp 6` |
| Auth Session | Phiên đăng nhập qua cookie server-managed |
| Completion Check | Điều kiện hoàn thành bài học theo `code_contains` hoặc `output_contains` |
| Presence Stream | SSE stream trả số người học đang online |

---

## 4. Hiện trạng / Trạng thái mục tiêu

| Khía cạnh | Hiện tại trong source |
|---|---|
| Tải bài học | `HomePage` gọi `useLessons`, fetch `/api/lessons` khi mount |
| Tiến trình học | `useLessonProgress` gọi `GET /api/progress` và `POST /api/progress/complete`, gắn với user đã đăng nhập |
| Đăng nhập | `App.tsx` tải session qua `GET /api/auth/me` và render `HomePage` khi có user |
| Phân quyền Pro | `HomePage` dùng `user.isPro`; track `Nâng cao lớp 6` bị khóa với user thường |
| AI hint | `HomePage` gọi `POST /api/hint` theo bài học đang chọn |
| Runtime Python | chạy ở client bằng Pyodide |
| Presence online | `useOnlineLearners` subscribe `/api/presence/stream`; server broadcast số user online theo `user.id` duy nhất |

---

## 5. Chi tiết đặc tả

### 5.1 Khởi tạo trang

**Pre-conditions**
- User đã đăng nhập hợp lệ.
- `App.tsx` đã có `user` từ `GET /api/auth/me`.

**Luồng chính**
1. `HomePage` mount.
2. `useLessons` gọi `GET /api/lessons`.
3. `useLessonProgress` gọi `GET /api/progress`.
4. `useOnlineLearners` mở `EventSource('/api/presence/stream')`.
5. `usePyodideRunner` bắt đầu nạp runtime Python.
6. Editor khởi tạo từ `localStorage` key `python-adventure.home-editor-code`, fallback về `DEFAULT_CODE`.
7. Sau khi lessons tải xong:
   - `tracks` được sinh từ tập unique `lesson.track`
   - nếu `selectedTrack` không còn hợp lệ thì chuyển sang track đầu tiên
   - nếu `selectedLessonId` không còn thuộc track hiện tại thì chọn lesson đầu tiên của track

**Business rules**
- BR-1: lỗi tải lessons hiển thị trong `lessons-card`, không crash trang.
- BR-2: lỗi tải progress fallback về danh sách hoàn thành rỗng.
- BR-3: output ban đầu bám theo `startupMessage` của Pyodide khi runtime đang loading hoặc lỗi.

**Post-conditions**
- Trang hiển thị lesson list, tiến trình, editor, output và trạng thái online.

---

### 5.2 Chọn track và bài học

**Luồng chính**
1. User bấm vào một `track-tab`.
2. `HomePage` cập nhật `selectedTrack`.
3. `filteredLessons` được tính theo track đang chọn.
4. Nếu lesson hiện tại không còn thuộc track mới, hệ thống tự chọn lesson đầu tiên trong track.
5. Khi user bấm vào một lesson:
   - cập nhật `selectedLessonId`
   - nạp `starterCode` vào editor
   - reset `outputTone` về `idle`
   - hiển thị thông báo đã mở bài học

**Business rules**
- BR-4: `tracks` được sinh từ dữ liệu lessons thực tế.
- BR-5: nếu `filteredLessons` rỗng thì `selectedLessonId = null`.
- BR-6: khi không có lesson được chọn, phần header và task card dùng nội dung fallback.

**Post-conditions**
- Lesson đang chọn, nội dung editor và thông tin mô tả đồng bộ với track/lesson mới.

---

### 5.3 Track Pro

**Luồng chính**
1. `HomePage` đọc `user.isPro`.
2. Với mỗi tab track:
   - nếu `track === 'Nâng cao lớp 6'` và user không Pro, tab bị `disabled`
   - tab hiện icon khóa và tooltip `Chỉ dành cho tài khoản Pro`
3. Nếu user thường cố chọn track này qua handler, `handleTrackSelect` chặn lại và hiển thị thông báo trong output.

**Business rules**
- BR-7: `Nâng cao lớp 6` là Pro-only theo logic frontend hiện tại.
- BR-8: user Pro vẫn chọn được track này bình thường.
- BR-9: backend auth phải trả `isPro` qua `auth/me`, `login`, `register`.

**Post-conditions**
- Track Pro chỉ dùng được với tài khoản Pro.

---

### 5.4 Editor và persistence

**Luồng chính**
1. User nhập code trong textarea.
2. Mỗi lần `code` đổi, hệ thống lưu lại vào `localStorage`.
3. Khi user nhấn `Tab`:
   - chặn hành vi mặc định
   - chèn 4 dấu cách
   - đưa con trỏ về đúng vị trí sau khi chèn
4. Khi user bấm `Reset`:
   - nạp lại `starterCode` của lesson hiện tại, hoặc `DEFAULT_CODE` nếu chưa có lesson
   - chuẩn hóa newline
   - hiển thị thông báo reset
5. Khi user nhấn `Ctrl+Enter` hoặc `Cmd+Enter`, hệ thống chạy code.

**Business rules**
- BR-10: editor chỉ lưu plain text.
- BR-11: `normalizeEditorCode` phải xử lý cả `\\n` và `\r\n`.
- BR-12: line number được tính theo `code.split('\n')`.

---

### 5.5 Chạy Python

**Luồng chính**
1. User bấm nút chạy hoặc dùng shortcut.
2. `HomePage` set output tạm là trạng thái đang chạy.
3. `runCode(code)` được gọi từ `usePyodideRunner`.
4. Kết quả trả về gồm `kind` và `output`.
5. UI hiển thị kết quả thành công hoặc lỗi tương ứng.

**Business rules**
- BR-13: nếu Pyodide đang `loading` hoặc `running`, nút chạy bị disable.
- BR-14: output success/error được map sang `outputTone`.

---

### 5.6 Đánh dấu hoàn thành bài học

**Pre-conditions**
- Có `selectedLesson`.
- Kết quả `runCode` trả về `success`.

**Luồng chính**
1. `HomePage` kiểm tra lesson hiện tại chưa hoàn thành.
2. Kiểm tra điều kiện hoàn thành:
   - `code_contains` thì so sánh với code hiện tại
   - còn lại thì so sánh với output hiện tại
3. Nếu đạt điều kiện:
   - gọi `markLessonCompleted`
   - `markLessonCompleted` gọi `POST /api/progress/complete`
   - state local `completedLessonIds` được append nếu chưa có
   - output thêm thông báo hoàn thành bài học

**Business rules**
- BR-15: progress hiện tại gắn với user đang đăng nhập, không còn dùng `learnerKey`.
- BR-16: nếu API progress trả lỗi, `markLessonCompleted` throw error.

---

### 5.7 Gợi ý AI

**Luồng chính**
1. User bấm `Gợi ý AI`.
2. Nếu chưa chọn lesson, UI hiển thị lỗi và không gọi API.
3. Nếu đã chọn lesson:
   - set `isHintLoading = true`
   - gọi `POST /api/hint` với `lessonTitle`, `objective`, `starterCode`, `code`
4. Nếu thành công, output hiển thị phần hint.
5. Nếu lỗi, output hiển thị message trả về hoặc fallback.
6. Kết thúc request, `isHintLoading = false`.

**Business rules**
- BR-17: nút hint bị disable khi đang loading hoặc chưa có lesson.

---

### 5.8 Cập nhật trực tiếp số người học đang online

**Pre-conditions**
- User đã đăng nhập.
- Trình duyệt hỗ trợ `EventSource`.

**Luồng chính**
1. `useOnlineLearners` mở kết nối tới `GET /api/presence/stream`.
2. Server xác thực session hiện tại.
3. Nếu hợp lệ, server mở SSE stream và đăng ký connection.
4. Server gửi event `presence` đầu tiên ngay khi subscribe.
5. Khi có user vào/ra stream, server broadcast lại event `presence`.
6. Client parse payload `{ count }` và cập nhật UI.
7. Khi tab đóng hoặc kết nối mất, server dọn connection và broadcast lại số mới.
8. Nếu stream lỗi hoặc mất kết nối:
   - client set `connected = false`
   - client tự thử reconnect sau 3 giây
   - số lần retry tối đa là 5; sau đó hiển thị `"Không thể cập nhật số người học online"`

**Business rules**
- BR-18: số online được đếm theo `user.id` duy nhất, không theo số tab.
- BR-19: server gửi heartbeat định kỳ để giữ stream sống.
- BR-20: nếu stream lỗi, client set trạng thái `connected = false`.
- BR-21: endpoint stream yêu cầu user đã đăng nhập; unauthenticated trả `401`.

**Post-conditions**
- `HomePage` hiển thị dòng `X người học đang online` trong thẻ profile.

---

## 6. API liên quan

| Method | Path | Mục đích |
|---|---|---|
| `GET` | `/api/auth/me` | lấy session hiện tại và `user.isPro` |
| `POST` | `/api/auth/login` | đăng nhập |
| `POST` | `/api/auth/register` | đăng ký |
| `GET` | `/api/lessons` | lấy lessons |
| `GET` | `/api/progress` | lấy tiến trình theo user hiện tại |
| `POST` | `/api/progress/complete` | đánh dấu hoàn thành lesson |
| `POST` | `/api/hint` | lấy gợi ý AI |
| `GET` | `/api/presence/stream` | stream SSE số người học online |

---

## 7. Yêu cầu phi chức năng

| Danh mục | Yêu cầu |
|---|---|
| Tính sẵn sàng | lỗi progress hoặc presence không được làm crash Homepage |
| Hiệu năng | render ban đầu không bị chặn bởi progress, hint hay presence |
| Khả năng phục hồi | SSE mất kết nối chỉ làm mất badge live, không ảnh hưởng lesson/editor |
| Tính nhất quán | progress, chọn lesson và output phải bám đúng lesson hiện tại |
| Bảo mật | stream presence và progress chỉ dành cho user đã xác thực |

---

## 8. Tiêu chí chấp nhận

| ID | Mô tả | Loại kiểm thử |
|---|---|---|
| AC-LESSON-HOME-1 | Mở Homepage sẽ tải lessons, progress, runtime và stream online | E2E |
| AC-LESSON-HOME-2 | Nếu có lesson hợp lệ, lesson đầu tiên của track đang chọn được tự động chọn | E2E |
| AC-LESSON-HOME-3 | Chọn lesson khác cập nhật header, task card, starter code và output message | E2E |
| AC-LESSON-HOME-4 | Nhấn `Tab` trong editor chèn 4 spaces | E2E |
| AC-LESSON-HOME-5 | Chạy code có `print()` hiển thị output thành công | E2E |
| AC-LESSON-HOME-6 | Chạy code lỗi Python hiển thị error output | E2E |
| AC-LESSON-HOME-7 | Đạt `completionCheck` sẽ gọi complete progress và tăng trạng thái hoàn thành | E2E |
| AC-LESSON-HOME-8 | Chưa chọn lesson mà bấm `Gợi ý AI` thì không gọi API và hiển thị lỗi | E2E |
| AC-LESSON-HOME-9 | User thường thấy tab `Nâng cao lớp 6` bị khóa và không chọn được | E2E |
| AC-LESSON-HOME-10 | User Pro chọn được `Nâng cao lớp 6` | E2E |
| AC-LESSON-HOME-11 | Khi có thêm user đăng nhập mở Homepage, số online tăng realtime | E2E |
| AC-LESSON-HOME-12 | Khi user đóng tab hoặc logout, số online giảm realtime | E2E |

---

## 9. Ví dụ luồng

1. **User thường mở trang:** thấy bài học, progress, editor và dòng `Đang cập nhật số người học online...`, sau đó hiện `X người học đang online`. Tab `Nâng cao lớp 6` có icon khóa và không bấm được.
2. **User Pro mở trang:** mọi thứ như trên nhưng chọn được tab `Nâng cao lớp 6`.
3. **Hoàn thành bài học:** user sửa code đúng yêu cầu, chạy thành công, lesson được đánh dấu completed và progress tăng.
4. **Presence realtime:** mở thêm một phiên đăng nhập khác, counter online ở phiên đầu tăng mà không cần refresh.

---

## 10. Open issues

| # | Câu hỏi |
|---|---|
| 1 | Presence hiện lưu trong memory của process hiện tại; có cần hỗ trợ đa instance bằng Redis/pub-sub không? |
| 2 | Có cần fallback polling khi `EventSource` không khả dụng không? |
| 3 | Có cần backend enforce Pro track ở API level nếu sau này lessons Pro được tách nội dung thật không? |
| 4 | Có cần chuẩn hóa toàn bộ chuỗi tiếng Việt đang lỗi encoding trong `HomePage` và auth flow không? |
