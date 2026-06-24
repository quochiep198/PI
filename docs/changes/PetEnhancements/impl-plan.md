# Kế hoạch triển khai — Gamification Pet Enhancements (Nâng cấp kích thích trẻ học tập)

> Tạo ngày: 2026-06-24
> Được suy ra từ: `docs/changes/PetEnhancements/spec-pack.md`  
> Nhánh: `main`

---

## 1. Cách tiếp cận

Triển khai gói nâng cấp Gamification Pet theo lộ trình từ thấp lên cao để đảm bảo hệ thống luôn hoạt động ổn định qua từng commit:
1.  **Cập nhật Database**: Thiết lập lại lược đồ để hỗ trợ phụ kiện Pet độc lập (làm cột `avatar_id` trong `items` thành Nullable) và bổ sung cột `affection` vào `user_pets`. Seed thêm các phụ kiện Pet mẫu.
2.  **Mở rộng REST API Backend**:
    *   Xây dựng API Cửa hàng vật phẩm và mua phụ kiện bằng Coins.
    *   Cài đặt API Luyện tập/Chơi đùa Quiz nhanh.
    *   Tự động tính toán suy hao độ no theo thời gian thực mỗi khi truy vấn thông tin Pet.
3.  **Xây dựng Giao diện & Hiệu ứng Frontend**:
    *   Tạo giao diện Cửa hàng Shop và kho phụ kiện trang bị.
    *   Xây dựng Modal mừng Tiến hóa cực kỳ hoành tráng (Evolution Celebration Modal).
    *   Kết nối Editor keystrokes để đổi trạng thái biểu cảm Pet thời gian thực.
    *   Xây dựng Popup đố vui trắc nghiệm nhanh.

---

## 2. Phạm vi ảnh hưởng

### Các tệp cần thay đổi / bổ sung

| #   | Tệp | Loại thay đổi | Ghi chú |
| --- | --- | ------------- | ------- |
| 1   | `database/migrations/022_expand_pets_and_items.sql` | Thêm | Cho phép `items.avatar_id` NULL, thêm cột `affection` vào `user_pets`, seed dữ liệu phụ kiện Pet. |
| 2   | `server/controllers/pets.mjs` | Sửa | Cài đặt các API: `/api/user-pets/shop`, `/api/user-pets/shop/buy`, `/api/user-pets/play`. Tích hợp logic suy hao fullness theo thời gian. |
| 3   | `src/features/pet/types.ts` | Sửa | Thêm định nghĩa cho phụ kiện, shop item, quiz và affection. |
| 4   | `src/features/pet/components/PetShopModal.tsx` | Thêm | Giao diện Shop đổi Coins lấy phụ kiện và tủ đồ trang bị đồ cho Pet. |
| 5   | `src/features/pet/components/EvolutionCelebrationModal.tsx` | Thêm | Modal mừng tiến hóa hoành tráng dùng CSS/Canvas Confetti. |
| 6   | `src/features/pet/components/PetQuickQuizModal.tsx` | Thêm | Modal đố vui trắc nghiệm nhanh 1 câu. |
| 7   | `src/features/pet/components/PetWidget.tsx` | Sửa | Nhận thêm các sự kiện gõ code từ Editor để đổi sang ảnh/emoji suy nghĩ `🤔`. |
| 8   | `src/features/layout/SideNav.tsx` | Sửa | Thêm nút Đố vui/Chơi đùa bên cạnh nút Cho ăn. |

---

## 3. Mã hiện có cần đọc trước
- [ ] `database/migrations/021_create_pets.sql`
- [ ] `server/controllers/pets.mjs`
- [ ] `src/features/pet/components/PetWidget.tsx`
- [ ] `src/features/pet/components/PetStatusCard.tsx`
- [ ] `src/features/home/components/WorkspacePanel.tsx` (Tham khảo luồng tương tác của Editor)

---

## 4. Các bước triển khai

| #   | Bước | Tệp được chỉnh sửa | Cách xác minh |
| --- | ---- | ------------------ | ------------- |
| 1   | Tạo migration database gỡ bỏ ràng buộc NOT NULL của `items.avatar_id`. Thêm cột `affection` (mặc định 50) vào `user_pets`. Seed thêm 5 phụ kiện thú cưng mẫu (Mũ phù thủy, kính râm, bàn phím cơ...). | `database/migrations/022_expand_pets_and_items.sql` | Chạy `npm run db:migrate`, kiểm tra cấu trúc bảng `items` bằng SQL client xem `avatar_id` đã cho phép Null chưa. |
| 2   | Viết API `GET /api/user-pets/shop` trả về danh sách phụ kiện Pet có trong Store và `POST /api/user-pets/shop/buy` kiểm tra Coins của user, trừ Coins, và cấp vật phẩm mới vào `user_items`. | `server/controllers/pets.mjs` | Test API qua Postman, xác nhận Coins bị trừ đúng lượng và vật phẩm xuất hiện trong kho đồ của user. |
| 3   | Cài đặt logic suy hao tự động: Mỗi khi gọi API lấy Pet (`/api/user-pets/active`), tính toán khoảng cách từ lần ăn cuối (`last_fed_at`), tự động giảm độ no (`fullness`). | `server/controllers/pets.mjs` | Thay đổi `last_fed_at` trong DB lùi lại 2 ngày, gọi API, kiểm tra xem `fullness` có tự động giảm và đổi biểu cảm đói tương ứng. |
| 4   | Cài đặt API `POST /api/user-pets/play` nhận câu trả lời Quiz trắc nghiệm nhanh, kiểm tra kết quả, cộng điểm `affection` và XP cho Pet. | `server/controllers/pets.mjs` | Gọi API với đáp án đúng/sai, xác nhận điểm thân thiết tăng tương ứng. |
| 5   | Tạo `PetShopModal.tsx` hiển thị danh sách phụ kiện bán trong cửa hàng. Cho phép học sinh mua đồ trực tiếp và mặc đồ cho Pet. | `src/features/pet/components/PetShopModal.tsx` | Mở Shop trên UI, mua một vật phẩm và xác nhận Pet hiển thị kèm phụ kiện đó (Ví dụ: 🐱 🕶️). |
| 6   | Tạo `EvolutionCelebrationModal.tsx` hiển thị hoạt ảnh ăn mừng tiến hóa toàn màn hình khi level của Pet tăng qua các mốc 2, 5, 10. | `src/features/pet/components/EvolutionCelebrationModal.tsx` | Gọi API cho ăn nâng cấp Level của Pet, xác nhận màn hình ăn mừng xuất hiện lộng lẫy kèm pháo hoa giấy. |
| 7   | Xây dựng `PetQuickQuizModal.tsx` hiển thị câu hỏi trắc nghiệm ngắn khi bấm nút 🎮 ở chân SideNav. | `src/features/pet/components/PetQuickQuizModal.tsx` | Nhấn nút chơi đùa, chọn đáp án đúng/sai, nhận thông báo thưởng và thay đổi biểu cảm của Pet. |
| 8   | Kết nối các sự kiện bàn phím từ Editor (WorkspacePanel) đến component `PetWidget` thông qua callback hoặc state để đổi biểu cảm Pet sang dạng suy nghĩ `🤔` tạm thời khi trẻ đang gõ code. | `src/features/home/components/WorkspacePanel.tsx`, `src/features/pet/components/PetWidget.tsx` | Nhập code vào editor, xác nhận Pet đổi emoji thành suy nghĩ. Dừng gõ 2 giây, Pet trở lại trạng thái thường. |

---

## 5. Rủi ro & Biện pháp giảm thiểu

| #   | Rủi ro | Biện pháp giảm thiểu |
| --- | ------ | -------------------- |
| 1   | Trẻ spam API quiz liên tục để hack điểm thân thiết và Coins | Giới hạn ở backend: mỗi user chỉ được chơi tối đa 2 lần Quiz mỗi ngày. |
| 2   | Suy hao độ no làm Pet bị đói lả / biến mất hoàn toàn khiến trẻ chán nản | Độ no không bao giờ giảm xuống dưới 0. Dù đói lả, Pet chỉ mệt mỏi (`😿`) chứ không bị xóa khỏi tài khoản của trẻ. Cho ăn lại sẽ giúp Pet hồi phục năng lượng lập tức. |

---

## 6. Quy trình hoàn tác

1.  Ẩn các cổng Shop và Quiz trên SideNav bằng cấu hình ẩn nút bấm.
2.  Giữ nguyên các cột trong DB để tránh phá hỏng cấu trúc dữ liệu của các phiên bản cũ.
3.  Rollback mã nguồn frontend về commit ổn định trước khi tích hợp các modal Shop/Quiz.
