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
| Thú cưng đồng hành | [Mới] Cho phép người dùng nhận nuôi, tương tác và tiến hóa thú cưng thông qua điểm coins từ các bài tập |

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
### 5.9 Chống spam AI hint và tối ưu Groq quota

**Bối cảnh vận hành**
- Model chính hiện dùng cho AI hint là `llama-3.3-70b-versatile`.
- Giới hạn Groq hiện tại được xác định ở mức tối đa `30 requests/phút` và `1.000 requests/ngày`.
- Do giới hạn ngày thấp hơn đáng kể so với giới hạn phút, hệ thống phải tối ưu theo quota ngày trước, sau đó mới tối ưu theo giới hạn phút.

**Pre-conditions**
- User đã đăng nhập hợp lệ.
- Có `selectedLesson`.
- Payload hint đã có `lessonTitle`, `objective`, `starterCode`, `code` và có thể bổ sung `lessonId`, `output` hoặc error gần nhất nếu frontend có dữ liệu.

**Luồng chính**
1. User bấm `Gợi ý AI`.
2. Frontend vẫn disable nút khi `isHintLoading = true` hoặc chưa có lesson để tránh double click ở UI.
3. Backend `POST /api/hint` xác thực session.
4. Backend kiểm tra IP rate limit.
5. Backend kiểm tra quota ngày theo user.
6. Backend kiểm tra quota ngày theo lesson của user.
7. Backend kiểm tra cooldown theo user.
8. Backend chuẩn hóa payload để tạo cache key.
9. Nếu cache hit:
   - trả hint từ cache
   - không gọi Groq
   - không trừ quota gọi AI thực tế
10. Nếu cache miss:
   - chọn model theo model routing
   - gọi Groq
   - lưu kết quả vào cache
   - ghi nhận usage
   - trả hint cho frontend
11. Nếu Groq trả lỗi quá tải hoặc rate limit, backend thử model fallback hợp lệ trong danh sách cấu hình.
12. Nếu tất cả model đều lỗi hoặc quota đã hết, backend trả message thân thiện để UI hiển thị trong output.

**Business rules**
- BR-22: `POST /api/hint` bắt buộc yêu cầu user đã đăng nhập; user chưa đăng nhập trả `401`.
- BR-23: frontend chỉ hỗ trợ UX chống bấm liên tục; rate limit bắt buộc phải enforce ở backend.
- BR-24: quota beta mặc định cho Free user là `5 hints/ngày`.
- BR-25: quota beta mặc định cho Pro user là `40 hints/ngày`.
- BR-26: cooldown mặc định cho Free user là `20 giây/lần`.
- BR-27: cooldown mặc định cho Pro user là `8 giây/lần`.
- BR-28: IP limit mặc định là `10 requests/10 phút/IP` cho endpoint hint.
- BR-29: Free user tối đa `2 hints/lesson/ngày`.
- BR-30: Pro user tối đa `8 hints/lesson/ngày`.
- BR-31: cache key được tạo từ `lessonId`, `objective`, và `normalizedCode`; nếu chưa có `lessonId` thì dùng định danh lesson tương đương đang có trong payload.
- BR-32: cache TTL mặc định là `7 ngày`.
- BR-33: cache hit không gọi Groq và không trừ quota gọi AI thực tế.
- BR-34: Free user ưu tiên model nhỏ trước, sau đó fallback sang `llama-3.3-70b-versatile` khi cần.
- BR-35: Pro user ưu tiên `llama-3.3-70b-versatile`, sau đó fallback sang model nhỏ nếu model chính bị rate limit hoặc tạm lỗi.
- BR-36: Model fallback chỉ dùng để tăng độ ổn định và tiết kiệm quota, không dùng để né giới hạn hoặc abuse nhà cung cấp.
- BR-37: `max_completion_tokens` mặc định là `300` cho Free user và `500` cho Pro user.
- BR-38: `temperature` mặc định cho AI hint là `0.3`.
- BR-39: Backend không gửi dữ liệu dài không cần thiết lên AI; payload gửi model chỉ gồm thông tin bài học, mục tiêu, starter code, code của học sinh và output/error gần nhất nếu có.
- BR-40: Khi vượt quota/cooldown/IP limit, backend trả `429` kèm message tiếng Việt phù hợp để frontend hiển thị.

**Model routing đề xuất**

| Nhóm user | Thứ tự model | Ghi chú |
|---|---|---|
| Free | model nhỏ đã cấu hình → `llama-3.1-8b-instant` | Dùng model nhỏ cho hint đơn giản để tiết kiệm request chất lượng cao |
| Pro | `llama-3.3-70b-versatile` → model nhỏ đã cấu hình | Ưu tiên chất lượng, fallback để tăng ổn định |

**Pseudo flow backend**

```text
POST /api/hint
  -> requireAuth
  -> validatePayload
  -> checkIpLimit
  -> checkUserDailyQuota
  -> checkUserLessonDailyQuota
  -> checkUserCooldown
  -> buildCacheKey
  -> return cached hint if exists
  -> call Groq with model routing/fallback
  -> save cache
  -> save usage
  -> return hint
```

**Post-conditions**
- User không thể spam nút AI để tạo nhiều request Groq vượt quota nội bộ.
- Khi cache hit, user vẫn nhận hint nhanh nhưng không làm tăng chi phí/request tới Groq.
- Khi Groq bị rate limit hoặc model chính lỗi tạm thời, hệ thống có thể chuyển model fallback trước khi trả lỗi cho user.
---

### 5.10 Hệ thống XP & Level (F-01)

**Luồng chính**
1. Sau mỗi hành động đủ điều kiện, hệ thống gọi `POST /api/xp` với số điểm tương ứng.
2. `useXP` cập nhật `totalXP` local.
3. Nếu `totalXP` vượt ngưỡng level tiếp theo, `currentLevel` tăng lên.
4. Thanh XP hiển thị animation tăng dần; nếu lên level, hiển thị modal chúc mừng level mới.

**Bảng XP theo hành động**

| Hành động | XP |
|---|---|
| Hoàn thành bài lần đầu | +50 |
| Chạy code không lỗi lần đầu trong bài | +10 |
| Hoàn thành Daily Challenge | +30 |
| Hoàn thành Daily Challenge trước 20:00 | +30 bonus (tổng +60) |

**Bảng Level**

| Level | Tên | XP tối thiểu |
|---|---|---|
| 1 | Người mới | 0 |
| 2 | Học viên | 100 |
| 3 | Lập trình viên | 300 |
| 4 | Phù thủy code | 700 |
| 5 | Huyền thoại Python | 1500 |

**Business rules**
- BR-F01-1: XP chỉ cộng sau khi server xác nhận `response.ok`.
- BR-F01-2: Không cộng XP nếu bài đã completed trước đó.
- BR-F01-3: Thanh XP hiển thị phía trên progress bar; animation chạy mượt trong 600ms.

---
### 5.11 Hệ thống Huy hiệu — Badges (F-02)

**Luồng chính**
1. Sau mỗi sự kiện có thể trigger badge (complete lesson, run code, v.v.), `useBadges` kiểm tra điều kiện.
2. Nếu điều kiện thỏa và badge chưa được mở khóa, gọi `POST /api/badges/unlock`.
3. Server lưu badge vào DB và trả về thông tin badge.
4. Client hiển thị modal chúc mừng với tên badge, icon và mô tả.
5. Modal có nút `Chia sẻ` (copy text) và `Tiếp tục`.

**Danh sách badge**

| Badge | Icon | Điều kiện |
|---|---|---|
| Khởi đầu bùng nổ | 🔥 | Hoàn thành 3 bài trong cùng 1 ngày |
| Thợ săn bug | 🐛 | Sửa lỗi thành công sau ít nhất 3 lần chạy lỗi liên tiếp |
| Tự lực | 🤔 | Hoàn thành bài mà `hintCount = 0` |
| Siêu tốc | ⚡ | Hoàn thành bài trong vòng 2 phút kể từ khi mở |
| Chinh phục track | 🏆 | Hoàn thành tất cả bài trong 1 track |
| Streak 7 ngày | 🔥🔥 | Hoàn thành Daily Challenge 7 ngày liên tiếp |

**Business rules**
- BR-F02-1: Mỗi badge chỉ mở khóa một lần; lần sau không hiển thị lại modal.
- BR-F02-2: Modal badge không được che editor; hiển thị sau khi output đã cập nhật xong.
- BR-F02-3: Lỗi unlock badge không ảnh hưởng luồng học chính; fail silently với log.

---

### 5.12 Thẩm định code bằng Mascot AI (Mascot AI Code Reviewer)

**Luồng chính**
1. Học sinh viết mã trong editor và có thể bấm nút `AI Nhận Xét` bất kỳ lúc nào để nhận đánh giá về phong cách lập trình sạch.
2. Frontend set `isReviewLoading = true` và hiển thị thông báo chờ.
3. Gửi `POST /api/ai/review-code` kèm `lessonId` và `code`.
4. Backend nhận yêu cầu, kiểm tra quyền truy cập bài học và kiểm tra xem học sinh đã được nhận thưởng cho bài học này chưa.
5. Gọi Groq AI với prompt đóng vai Mascot AI (giọng điệu trẻ trung, dễ mến) để nhận xét 3 phần: Khen ngợi cấu trúc -> Điểm cải tiến nhẹ nhàng -> Khích lệ tích cực (không chứa code giải hoặc lời giải trực tiếp).
6. Nếu đây là lần đầu yêu cầu nhận xét bài học này:
   - Cộng thưởng 15 Coins và 5 XP cho học sinh.
   - Ghi nhận Coins & XP vào cơ sở dữ liệu (`user_coins`, `user_xp`, `user_xp_log`).
   - Lưu kết quả nhận xét code vào `user_lesson_reviews` với số Coins/XP nhận được.
7. Nếu đã từng yêu cầu nhận xét bài học này từ trước:
   - Lưu kết quả vào `user_lesson_reviews` với giá trị thưởng Coins/XP bằng `0` (không cộng thêm).
8. Backend trả kết quả đánh giá về cùng với thông số cập nhật Coins/XP của user.
9. Frontend hiển thị đánh giá của AI trong Output panel và cập nhật cache coin/XP cùng hiệu ứng thăng cấp nếu có.

**Business rules**
- BR-CR-1: Nút nhận xét bị disable khi đang loading hoặc chưa chọn bài học.
- BR-CR-2: Phần thưởng Coins (15) và XP (5) chỉ được trao một lần duy nhất cho mỗi bài học để tránh lạm dụng (spam).
- BR-CR-3: AI không được cung cấp lời giải hoặc code hoàn chỉnh trực tiếp để học sinh tự suy nghĩ và sửa lỗi.

---

### 5.13 Trò chuyện trực tiếp cùng Bạn AI (Chatbot companion)

**Luồng chính**
1. Giao diện Output Shell được cải tiến thành giao diện Tab song song: Tab "Màn hình" hiển thị kết quả biên dịch và Tab "Trò chuyện AI" hiển thị chatbot.
2. Khi chọn một bài học mới:
   - Hệ thống gọi `GET /api/ai/chat/history?lessonId=...` để tải lịch sử 15 tin nhắn gần nhất.
   - Nếu lịch sử trống, chatbot hiển thị một tin nhắn chào chào mừng thân thiện từ Mascot AI.
3. Học sinh có thể gửi tin nhắn để hỏi bất kỳ câu hỏi nào về Python.
4. Gửi `POST /api/ai/chat` kèm `{ lessonId, message, code }` (code hiện tại trong editor).
5. Backend xác thực session, lấy 10 tin nhắn gần nhất làm ngữ cảnh hội thoại, ghép cùng System Prompt Mascot AI.
6. Groq AI tạo phản hồi. Cả tin nhắn của học sinh và của AI được lưu vào bảng `user_chat_messages`.
7. Trả phản hồi về frontend để hiển thị dạng bong bóng chat. AI phản hồi với phong cách xưng hô tớ-cậu thân mật, dùng ví dụ dễ hiểu cho lứa tuổi học sinh lớp 6, và nghiêm cấm đưa lời giải code hoàn chỉnh trực tiếp.
8. Di chuyển chatbot về phía bên trái màn hình 

**Business rules**
- BR-CH-1: Chatbot hoạt động theo ngữ cảnh từng bài học riêng biệt. Khi chuyển bài học, lịch sử chat bài cũ được thay bằng bài mới.
- BR-CH-2: AI phải từ chối khéo léo khi học sinh yêu cầu viết hộ code giải bài tập, thay vào đó dẫn dắt bằng các gợi ý nhỏ.

---

### 5.14 Nhiệm vụ phụ tự động bằng AI (AI Side-quests)

**Luồng chính**
1. Khi học sinh chọn một bài học trên giao diện HomePage:
   - Hệ thống tự động gửi yêu cầu `GET /api/ai/side-quests?lessonId=...` để tải danh sách các nhiệm vụ phụ của bài học đó.
2. Tại backend, hệ thống kiểm tra cache trong bảng `lesson_side_quests`:
   - Nếu đã có nhiệm vụ phụ cho bài học này, trả về ngay lập tức để tiết kiệm chi phí gọi AI.
   - Nếu chưa có, backend sẽ gọi Groq AI (Llama 3) sinh ra 3 nhiệm vụ phụ phù hợp với mục tiêu học tập của bài học dưới dạng JSON có cấu trúc. Mỗi nhiệm vụ gồm: `title` (tiêu đề nhiệm vụ), `description` (hướng dẫn cụ thể), `rewardXp` (+10 XP), `rewardCoins` (+5 Coins), và một `verificationRule` (quy tắc xác thực, ví dụ: loại `code_contains` và giá trị cụ thể). Sau đó lưu vào bảng `lesson_side_quests`.
3. Frontend hiển thị danh sách nhiệm vụ phụ bên dưới phần mục tiêu bài học dưới dạng các checkbox. Các nhiệm vụ đã hoàn thành trước đó (được check qua bảng `user_completed_side_quests`) sẽ hiển thị trạng thái hoàn tất (checked).
4. Khi học sinh bấm nút "Chạy Code" và Pyodide chạy thành công:
   - Frontend sẽ tự động kiểm tra code trong editor hoặc output hiển thị với các `verificationRule` của từng nhiệm vụ phụ chưa hoàn thành.
   - Nếu một nhiệm vụ phụ thỏa mãn quy tắc, frontend tự động đánh dấu hoàn thành trên giao diện, hiển thị thông báo thăng tiến nhỏ, và gửi yêu cầu `POST /api/progress/side-quest/complete` lên backend.
5. Backend xác thực người dùng, lưu vết hoàn thành vào bảng `user_completed_side_quests` để tránh nhận thưởng lặp lại, và cộng thưởng XP/Coins tương ứng vào tài khoản học sinh.

**Quy tắc xác thực (Verification Rules) được hỗ trợ ở Frontend:**
- `code_contains`: Mã nguồn phải chứa chuỗi con xác định (ví dụ: chứa hàm `input`, chứa từ khóa `#`, hoặc chứa ký tự cụ thể).
- `code_excludes`: Mã nguồn KHÔNG ĐƯỢC chứa chuỗi con xác định.
- `output_contains`: Kết quả hiển thị trên màn hình console (output) phải chứa chuỗi con xác định.
- `output_excludes`: Kết quả hiển thị trên màn hình console (output) KHÔNG ĐƯỢC chứa chuỗi con xác định.

**Business rules**
- BR-SQ-1: Mỗi nhiệm vụ phụ chỉ được hoàn thành và nhận phần thưởng một lần duy nhất cho mỗi tài khoản học sinh.
- BR-SQ-2: Phần thưởng mặc định cho mỗi nhiệm vụ phụ là +10 XP và +5 Coins.
- BR-SQ-3: Các lỗi xảy ra trong quá trình kiểm tra hoặc lưu vết nhiệm vụ phụ không được ảnh hưởng đến luồng chạy code chính hoặc đánh dấu hoàn thành bài học chính.

---

### 5.15 Hệ thống Thú cưng đồng hành — Gamification Pet (F-03)

**Luồng chính**
1. Khi học sinh vào `HomePage` học bài:
   - Hệ thống gọi `GET /api/user-pets/active` để kiểm tra thông tin thú cưng đang hoạt động của học sinh.
   - Nếu học sinh chưa sở hữu thú cưng nào, hiển thị modal chọn thú cưng ban đầu (`PetSelectionModal`) bao gồm: Cyber Cat, PyDragon, Algorithm Owl.
2. Thú cưng được render dưới dạng Widget đồng hành (Mini-Companion) trong `WorkspacePanel` (khu vực editor/console).
3. Phản ứng thời gian thực (Real-time reactions):
   - Khi Pyodide chạy thành công code và vượt qua kiểm tra bài học: Pet nhảy múa chúc mừng, thả tim.
   - Khi chạy code gặp lỗi biên dịch/logic: Pet gãi đầu suy nghĩ, lo lắng và xuất hiện bóng thoại gợi ý bấm nút AI.
   - Trạng thái rảnh (Idle): Pet tự chơi đùa, gõ phím mini, hoặc ngủ.
4. Cơ chế chăm sóc và tiến hóa:
   - Học sinh có thể click vào Pet để mở hộp thoại tương tác, cho Pet ăn bằng thức ăn mua từ Shop bằng Coins.
   - Mỗi lần cho ăn sẽ tăng điểm No (`fullness`) và điểm Thân thiết / Kinh nghiệm Pet (`petXP`).
   - Khi Pet đạt đủ `petXP` của cấp hiện tại, Pet sẽ tiến hóa (nâng cấp level và tự động đổi hình ảnh tương ứng với cấp độ mới).
5. Ảnh hưởng của Daily Streak:
   - Nếu học sinh có chuỗi streak học tập liên tiếp >= 3 ngày, Pet sẽ kích hoạt trạng thái "Hưng phấn" (Excited), nhận gấp 1.5 lần kinh nghiệm từ thức ăn.
   - Nếu đứt chuỗi streak quá 36h, Pet sẽ buồn bã/đói, tạm dừng tiến hóa hoặc giảm nhẹ chỉ số vui vẻ.

**Business rules**
- BR-PET-1: Mỗi người học chỉ được kích hoạt hoạt động 1 Pet duy nhất tại một thời điểm.
- BR-PET-2: Chỉ cho phép cho Pet ăn tối đa khi độ no (`fullness`) đạt 100%. Điểm no giảm dần theo thời gian (ví dụ: -5 điểm mỗi giờ).
- BR-PET-3: Phụ kiện mua cho Pet trong `user_items` được lưu và đồng bộ trực quan ngay khi thay đổi.
- BR-PET-4: Trạng thái tiến hóa gồm 4 giai đoạn: Trứng (Level 1) -> Sơ sinh (Level 2-4) -> Trưởng thành (Level 5-9) -> Siêu cấp (Level 10+).

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
| `POST` | `/api/ai/review-code` | lấy nhận xét code từ Mascot AI và nhận phần thưởng một lần |
| `GET` | `/api/ai/chat/history` | tải lịch sử chat của bài học |
| `POST` | `/api/ai/chat` | gửi tin nhắn chat và nhận phản hồi từ Mascot AI |
| `GET` | `/api/ai/side-quests` | Lấy danh sách nhiệm vụ phụ của bài học (hoặc tự động sinh bằng AI nếu chưa có cache) |
| `POST` | `/api/progress/side-quest/complete` | Ghi nhận hoàn thành nhiệm vụ phụ và nhận phần thưởng Coins/XP |
| `GET` | `/api/user-pets/active` | Lấy thông tin thú cưng đang hoạt động của người dùng |
| `POST` | `/api/user-pets/adopt` | Nhận nuôi linh thú ban đầu (chọn loại pet) |
| `POST` | `/api/user-pets/feed` | Cho thú cưng ăn bằng Coins / vật phẩm thức ăn |
| `POST` | `/api/user-pets/accessories/equip` | Thay phụ kiện (mũ, kính...) cho thú cưng |

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
| AC-LESSON-HOME-13 | Nhấn nút AI Nhận Xét hiển thị nhận xét từ Mascot AI trong khung Output | E2E |
| AC-LESSON-HOME-14 | Nhận xét lần đầu ở mỗi bài học được cộng 15 Coins và 5 XP, các lần sau không được cộng | E2E |
| AC-LESSON-HOME-15 | Bấm Tab "Trò chuyện AI" mở ra giao diện chat bong bóng và hiển thị tin nhắn chào của Mascot | E2E |
| AC-LESSON-HOME-16 | Chat với AI nhận được phản hồi tớ-cậu thân thiện, không cho code giải trực tiếp, chuyển bài học sẽ đổi lịch sử chat tương ứng | E2E |
| AC-LESSON-HOME-17 | Khi chọn bài học, hiển thị danh sách 3 nhiệm vụ phụ tự động ở Lesson Panel | E2E |
| AC-LESSON-HOME-18 | Chạy code thành công và thỏa mãn điều kiện nhiệm vụ phụ sẽ tự động tích xanh checkbox và nhận thưởng Coins/XP | E2E |
| AC-LESSON-HOME-19 | Đã nhận thưởng nhiệm vụ phụ thì các lần chạy code sau không được cộng thêm thưởng nữa | E2E |
| AC-LESSON-HOME-20 | Người dùng mới mở Homepage chưa có Pet sẽ kích hoạt modal chọn Pet ban đầu | E2E |
| AC-LESSON-HOME-21 | Pet mini-widget trong WorkspacePanel làm các động tác vui mừng khi chạy code đúng và buồn bã khi chạy lỗi | E2E |
| AC-LESSON-HOME-22 | Thực hiện cho Pet ăn thành công trừ tiền Coins, tăng độ no và XP của Pet, đồng thời đổi hình ảnh tiến hóa khi đủ cấp | E2E |
| AC-LESSON-HOME-23 | Trạng thái Excited của Pet được hiển thị trực quan khi streak tích lũy từ 3 ngày trở lên | E2E |

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
| 5 | AI Side-quests sinh ra bằng AI có thể bị bypass nếu học sinh viết code lách luật (ví dụ: viết comment chứa chuỗi yêu cầu thay vì viết code thực tế); có cần nâng cấp cơ chế chấm điểm động bằng AI ở backend trong tương lai không? |
| 6 | Có nên cho phép Pet "bỏ trốn" hoặc "bị ốm nặng" nếu người dùng đứt chuỗi streak quá lâu (ví dụ > 7 ngày) hay chỉ dừng lại ở đóng băng cấp độ tiến hóa? |

