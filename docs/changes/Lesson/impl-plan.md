# Kế hoạch triển khai — Gamification Pet (Phase 1)

> Tạo ngày: 2026-06-24
> Được suy ra từ: `docs/changes/Lesson/spec-pack.md`  
> Nhánh: `main`

---

## 1. Cách tiếp cận

Triển khai tính năng Gamification Pet (Thú cưng đồng hành) theo hướng **"lược đồ dữ liệu database và backend contract trước, UI component frontend sau"**.

Cụ thể:
1.  **Thiết kế Database**: Tạo các bảng để lưu thông tin Pet mẫu và trạng thái nuôi của từng user. Chúng ta sẽ mở rộng bảng `items` bằng cách định nghĩa thêm `asset_type` mới để bán thức ăn cho Pet tại Shop bằng Coins có sẵn.
2.  **Xây dựng Backend**: Tạo riêng controller `server/controllers/pets.mjs` để cô lập logic nghiệp vụ của Pet, giữ cho `gamification.mjs` cũ gọn gàng.
3.  **Xây dựng Frontend**: Tạo module độc lập `src/features/pet` tuân thủ mô hình Feature-based của dự án.
4.  **Tích hợp UI**: 
    *   Tích hợp modal chọn pet ban đầu (`PetSelectionModal.tsx`) trên `HomePage.tsx` cho user chưa có Pet.
    *   Nhúng Widget Pet (`PetWidget.tsx`) vào góc màn hình soạn thảo code `WorkspacePanel.tsx` để phản ứng thời gian thực (real-time) với kết quả chạy code Pyodide.
    *   Đọc chỉ số streak từ hệ thống để nhân hệ số kinh nghiệm (Excited state) cho Pet.

---

## 2. Phạm vi ảnh hưởng

### Các tệp / mô-đun cần thay đổi

| #   | Tệp | Loại thay đổi | Ghi chú |
| --- | --- | ------------- | ------- |
| 1   | `database/migrations/021_create_pets.sql` | Thêm | Định nghĩa bảng `pet_templates`, `user_pets`. Seed dữ liệu mẫu cho 3 loại Pet ban đầu. |
| 2   | `server/controllers/pets.mjs` | Thêm | Xử lý các handler API: lấy active pet, nhận nuôi, cho ăn, trang bị phụ kiện. |
| 3   | `server/index.mjs` | Sửa | Đăng ký các API route mới cho Pet. |
| 4   | `src/features/pet/types.ts` | Thêm | Định nghĩa các kiểu dữ liệu TypeScript cho Pet và UserPet. |
| 5   | `src/features/pet/petApi.ts` | Thêm | Chứa các hàm gọi API tương tác Pet. |
| 6   | `src/features/pet/components/PetWidget.tsx` | Thêm | Widget Pet mini hiển thị hoạt ảnh trong Editor. |
| 7   | `src/features/pet/components/PetStatusCard.tsx` | Thêm | Thẻ hiển thị cấp độ, độ no, trạng thái trên Dashboard. |
| 8   | `src/features/pet/components/PetSelectionModal.tsx` | Thêm | Modal chọn Pet cho học sinh mới. |
| 9   | `src/features/pet/index.ts` | Thêm | Entrypoint xuất các thành phần của module Pet. |
| 10  | `src/features/home/HomePage.tsx` | Sửa | Quản lý logic gọi API Pet khi tải trang, mở modal nhận nuôi. |
| 11  | `src/features/home/components/WorkspacePanel.tsx` | Sửa | Truyền trạng thái chạy code (success/error/idle) cho `PetWidget`. |

### Các khu vực ảnh hưởng khác

| #   | Hạng mục | Mức ảnh hưởng | Ghi chú |
| --- | -------- | ------------- | ------- |
| 1   | Lược đồ DB | Cao | Thêm 2 bảng mới có ràng buộc khóa ngoại (Foreign Key) với `users`. |
| 2   | Hợp đồng API | Cao | Thêm 4 endpoint API mới liên quan đến Pet. |
| 3   | Cấu hình | Thấp | Không thay đổi cấu hình hệ thống. |
| 4   | Nhật ký | Thấp | Log lỗi thông qua middleware Express hiện tại. |
| 5   | Quyền/Vai trò | Trung bình | Chỉ cho phép user đã đăng nhập gọi các API tương tác Pet. |
| 6   | Thành phần FE | Trung bình | Thêm khu vực hiển thị Pet trên Dashboard và trong màn hình soạn thảo code. |

---

## 3. Mã hiện có cần đọc trước

- [ ] `docs/changes/Lesson/spec-pack.md`
- [ ] `database/schema.sql`
- [ ] `server/index.mjs`
- [ ] `server/controllers/gamification.mjs`
- [ ] `src/features/home/HomePage.tsx`
- [ ] `src/features/home/components/WorkspacePanel.tsx`
- [ ] `src/features/inventory/InventoryPage.tsx` (Tham khảo cách xử lý items/active)

---

## 4. Các bước triển khai

| #   | Bước | Tệp được chỉnh sửa | Cách xác minh |
| --- | ---- | ------------------ | ------------- |
| 1   | Tạo migration database định nghĩa bảng `pet_templates` (chứa 3 mẫu pet Cyber Cat, PyDragon, Algorithm Owl kèm ảnh tiến hóa) và `user_pets`. | `database/migrations/021_create_pets.sql` | Chạy `npm run db:migrate`, kiểm tra các bảng được sinh ra trong Neon Postgres mà không gặp lỗi. |
| 2   | Tạo controller `pets.mjs` ở backend và cài đặt API `GET /api/user-pets/active` để kiểm tra thông tin thú cưng đang hoạt động. | `server/controllers/pets.mjs`, `server/index.mjs` | Gọi thử API bằng Postman/Browser sau khi đăng nhập, kiểm tra xem có trả về đúng dữ liệu trống khi chưa nuôi Pet. |
| 3   | Cài đặt API `POST /api/user-pets/adopt` để ghi nhận sự kiện nhận nuôi Pet đầu tiên của học sinh vào bảng `user_pets`. | `server/controllers/pets.mjs`, `server/index.mjs` | Gửi request adopt với `templateId` hợp lệ, xác nhận DB đã chèn bản ghi mới với level 1 và độ no ban đầu. |
| 4   | Cài đặt API `POST /api/user-pets/feed` thực hiện trừ Coins của user, cộng độ no và XP của Pet, đồng thời nâng cấp cấp độ (`level`) của Pet khi tích lũy đủ XP. | `server/controllers/pets.mjs`, `server/index.mjs` | Gọi API cho ăn, xác nhận Coins bị trừ, điểm `fullness` tăng, khi XP vượt ngưỡng thì level tăng lên. |
| 5   | Tích hợp kiểm tra Streak của user từ `user_streaks`. Nếu streak $\ge 3$ ngày, nhân 1.5x lượng XP mà Pet nhận được từ thức ăn. | `server/controllers/pets.mjs` | Cho Pet ăn khi có streak $\ge 3$, kiểm tra lượng XP cộng thêm có nhân hệ số 1.5. |
| 6   | Tạo các định nghĩa kiểu dữ liệu và module gọi API tại frontend. | `src/features/pet/types.ts`, `src/features/pet/petApi.ts` | Đảm bảo TypeScript compile thành công không bị lỗi cú pháp/kiểu dữ liệu. |
| 7   | Xây dựng modal chọn Pet `PetSelectionModal.tsx` để hiển thị 3 linh thú ban đầu bằng ảnh và mô tả để người dùng chọn. | `src/features/pet/components/PetSelectionModal.tsx` | Nhấn chọn pet trên giao diện, modal gửi đúng request API adopt. |
| 8   | Xây dựng Widget Pet mini `PetWidget.tsx` hỗ trợ 3 trạng thái hoạt ảnh chính (Success, Error, Idle) sử dụng ảnh hoạt họa/CSS. | `src/features/pet/components/PetWidget.tsx` | Component hiển thị ảnh/hoạt ảnh đúng theo props truyền vào. |
| 9   | Dựng thẻ trạng thái `PetStatusCard.tsx` hiển thị các chỉ số Level, thanh XP, thanh độ no Fullness và cờ Excited. | `src/features/pet/components/PetStatusCard.tsx` | Kiểm tra giao diện hiển thị mượt mà, căn chỉnh đúng CSS. |
| 10  | Kết hợp các thành phần vào `HomePage.tsx` và `WorkspacePanel.tsx`. Lắng nghe sự kiện Pyodide chạy code thành công/thất bại để cập nhật trạng thái hoạt ảnh cho Pet. | `src/features/home/HomePage.tsx`, `src/features/home/components/WorkspacePanel.tsx` | Chạy code đúng/sai trên giao diện, kiểm tra Pet có thay đổi biểu cảm tương ứng. |
| 11  | Kiểm tra tích hợp cuối cùng, đảm bảo các lỗi kết nối/tải thông tin Pet không làm vỡ giao diện học bài chính. | Toàn bộ tệp thay đổi | Chạy `npm run lint` và `npm run build` không có lỗi. |

---

## 5. Rủi ro & Biện pháp giảm thiểu

| #   | Rủi ro | Biện pháp giảm thiểu |
| --- | ------ | -------------------- |
| 1   | Lạm dụng spam API cho ăn liên tục làm Pet lớn quá nhanh hoặc âm tiền Coins | Backend kiểm tra nếu chỉ số no `fullness` đạt 100% thì chặn không cho phép ăn tiếp. |
| 2   | Lệch ảnh hoạt họa của Pet khi không tải được tài nguyên | Lưu trữ ảnh tĩnh mặc định cho từng giai đoạn tiến hóa trong thư mục `/public/assets/pets/` để làm fallback nếu ảnh hoạt họa lỗi. |
| 3   | Lỗi tải thông tin Pet từ API làm đứng trang `HomePage` | Thực hiện bọc hàm gọi API Pet trong khối `try/catch` tại `HomePage.tsx`, hiển thị giao diện học bài bình thường nếu Pet bị lỗi. |

---

## 6. Quy trình hoàn tác

1.  Ẩn/Disable Widget Pet trên frontend thông qua một cờ cấu hình hoặc ẩn CSS để giao diện trở về trạng thái cơ bản.
2.  Rollback phiên bản deploy về commit trước khi tích hợp Pet.
3.  Giữ nguyên các bảng `pet_templates` và `user_pets` trong cơ sở dữ liệu để tránh mất dữ liệu đã nuôi của học sinh trong thời gian sửa chữa nóng (hotfix).

---

## 7. Các bước xác minh

```bash
# Chạy migration database
npm run db:migrate

# Kiểm tra chất lượng code và build bundle
npm run lint
npm run format:check
npm run build

# Chạy server và frontend local để kiểm thử
npm run dev:server
npm run dev
```

Xác minh thủ công:
1.  Đăng nhập bằng tài khoản mới hoàn toàn $\rightarrow$ Xác nhận modal chọn Pet xuất hiện.
2.  Chọn nuôi `PyDragon` $\rightarrow$ Xác nhận modal biến mất, Pet cấp 1 (Trứng/Baby) xuất hiện ở góc Workspace.
3.  Viết code Python đúng yêu cầu bài tập và bấm nút chạy $\rightarrow$ Xác nhận Pet nhảy múa ăn mừng.
4.  Viết code cố tình sai $\rightarrow$ Xác nhận Pet đổi hoạt ảnh lo lắng/gãi đầu.
5.  Mở menu Pet và thực hiện cho ăn bằng Coins $\rightarrow$ Coins của người dùng bị trừ và Pet nhận được XP/No.
6.  Cho Pet ăn liên tục đến khi no $\ge 100\%$ $\rightarrow$ Nút cho ăn bị disable hoặc API trả về lỗi hợp lệ.

---

## Bảng ánh xạ AC

| #   | AC | (Các) bước đáp ứng | Cách xác minh |
| --- | -- | ------------------ | ------------- |
| 1   | AC-LESSON-HOME-20: Hiển thị modal chọn Pet | Bước 1, 2, 3, 7, 10 | Đăng nhập tài khoản mới chưa có Pet và kiểm tra xem modal hiển thị đúng. |
| 2   | AC-LESSON-HOME-21: Pet phản hồi kết quả code | Bước 8, 10 | Chạy code Đúng / Sai trong editor và xem phản ứng hoạt họa của Pet Widget. |
| 3   | AC-LESSON-HOME-22: Cho Pet ăn, trừ coins, tiến hóa | Bước 1, 4, 9, 10 | Cho pet ăn bằng Coins, kiểm tra trừ tiền, tăng XP và thay đổi hình ảnh khi tăng cấp. |
| 4   | AC-LESSON-HOME-23: Excited state khi có streak | Bước 5, 9, 10 | Đăng nhập tài khoản có streak $\ge 3$, cho ăn và kiểm tra xem có hiển thị cờ Excited và nhân 1.5x XP. |
