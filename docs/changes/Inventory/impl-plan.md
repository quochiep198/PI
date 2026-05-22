# Kế hoạch triển khai — Inventory (Phase 1)

> Tạo ngày: 2026-05-22
> Được suy ra từ: `docs/changes/Inventory/spec-pack.md`  
> Nhánh: `main`

---

## 1. Cách tiếp cận

Triển khai Phase 1 theo hướng "backend contract trước, UI binding sau". UI Inventory đã có sẵn cấu trúc và CSS, nên phần việc chính là bổ sung lược đồ dữ liệu inventory, mở API đọc/trang bị/tháo item, sau đó thay mock data trong frontend bằng dữ liệu thật từ server.

Avatar preview ở phase 1 sẽ dùng ảnh/mock preview thay vì 3D renderer hoàn chỉnh. Cách này giữ đúng phạm vi spec, giảm rủi ro kỹ thuật, và vẫn cho phép verify đầy đủ các luồng nghiệp vụ `get inventory`, `get avatar`, `equip`, `unequip`.

Thêm bảng `avatars` để lưu danh sách nhân vật/base avatar của hệ thống; giữ `user_avatar` cho trạng thái avatar hiện tại và các item đang trang bị của từng user.

## 2. Phạm vi ảnh hưởng

### Các tệp / mô-đun cần thay đổi

| #   | Tệp | Loại thay đổi | Ghi chú |
| --- | --- | ------------- | ------- |
| 1   | `database/migrations/014_inventory.sql` | Thêm | Tạo bảng `avatars`, `items`, `user_items`, `user_avatar`; giữ tương thích với cột `users.avatar_url` đã có từ migration `007_user_avatar.sql`; thêm seed tối thiểu nếu cần để test local |
| 2   | `server/handlers.mjs` | Sửa | Thêm handler đọc inventory/avatar và xử lý equip/unequip |
| 3   | `api/index.js` | Sửa | Đăng ký route `/api/inventory`, `/api/avatar/me`, `/api/avatar/equip`, `/api/avatar/unequip` |
| 4   | `src/features/inventory/InventoryPage.tsx` | Sửa | Bỏ sample data, nối API thật, render loading/error/equipped state |
| 5   | `src/features/inventory/types.ts` | Sửa | Chuẩn hóa type theo contract backend thay vì type demo hiện tại |
| 6   | `src/features/inventory/inventoryApi.ts` | Thêm | Tách các lời gọi API Inventory để đồng nhất với `authApi.ts` |
| 7   | `src/styles/global.css` | Sửa | Bổ sung state class nhỏ cho loading/error/empty/disabled nếu UI hiện tại chưa đủ |
| 8   | `src/App.tsx` | Sửa | Chỉ cần nếu `InventoryPage` cần nhận `user` hoặc state chung để đồng bộ avatar preview |

### Các khu vực ảnh hưởng khác

| #   | Hạng mục | Mức ảnh hưởng | Ghi chú |
| --- | -------- | ------------- | ------- |
| 1   | Lược đồ DB | Cao | Có migration mới và quan hệ FK với `users` |
| 2   | Hợp đồng API | Cao | Thêm 4 endpoint mới cho domain Inventory |
| 3   | Cấu hình | Trung bình | Có thể cần `BASE_AVATAR_URL` hoặc fallback asset URL cho preview |
| 4   | Nhật ký | Thấp | Chỉ cần log lỗi server ở mức handler nếu theo pattern hiện có |
| 5   | Quyền/Vai trò | Trung bình | Chỉ user đã đăng nhập được gọi API |
| 6   | Thành phần FE | Cao | Inventory UI chuyển từ mock sang dữ liệu thật và thêm thao tác equip/unequip |

## 3. Mã hiện có cần đọc trước

- [ ] `docs/changes/Inventory/spec-pack.md`
- [ ] `src/features/inventory/InventoryPage.tsx`
- [ ] `src/features/inventory/types.ts`
- [ ] `src/styles/global.css`
- [ ] `api/index.js`
- [ ] `server/handlers.mjs`
- [ ] `server/db.mjs`
- [ ] `src/features/auth/authApi.ts`
- [ ] `docs/raw/design/Inventory/DESIGN.md`

## 4. Các bước triển khai

| #   | Bước | Tệp được chỉnh sửa | Cách xác minh |
| --- | ---- | ------------------ | ------------- |
| 1   | Khóa taxonomy item type và mapping slot backend/frontend (`hair`, `hat`, `glasses`, `clothes`, `back`, `accessory`, `background`, `effect`) để tránh lệch tên tab, DB và API | `server/handlers.mjs`, `src/features/inventory/types.ts` | Review type/constant; thử serialize response mẫu theo spec |
| 2   | Tạo migration cho `avatars`, `items`, `user_items`, `user_avatar`; bảo đảm FK `user_id` dùng `INTEGER`, slot trong `user_avatar` dùng `UUID`; không sửa file `007_user_avatar.sql`, chỉ mở rộng schema bằng migration mới; thêm index/constraint tối thiểu cần thiết | `database/migrations/014_inventory.sql` | Chạy `npm run db:migrate`; kiểm tra bảng được tạo và migration không lỗi |
| 3   | Cài đặt API `GET /api/inventory` để trả danh sách item user sở hữu kèm cờ `isOwned`, `isEquipped`, `thumbnailUrl`, `assetUrl`, `isActive` | `server/handlers.mjs`, `api/index.js` | Gọi endpoint sau đăng nhập; đối chiếu JSON với spec |
| 4   | Cài đặt API `GET /api/avatar/me` để trả `baseAvatarUrl`, map `equippedItems`, và danh sách asset đã equip phục vụ preview | `server/handlers.mjs`, `api/index.js` | Gọi endpoint; kiểm tra slot trống trả `null`, slot có item trả đúng `itemId` |
| 5   | Cài đặt API `POST /api/avatar/equip` với kiểm tra đăng nhập, item tồn tại, `is_active = true`, item thuộc user, type map đúng slot, và replace item cùng type | `server/handlers.mjs`, `api/index.js` | Test các case `200/400/403/404/409`; verify DB `user_avatar` cập nhật đúng |
| 6   | Cài đặt API `POST /api/avatar/unequip` theo `type`, cho phép idempotent khi slot đang trống | `server/handlers.mjs`, `api/index.js` | Gọi lặp nhiều lần cùng `type`; response vẫn an toàn và DB không lỗi |
| 7   | Tạo lớp API frontend cho Inventory và chuẩn hóa response parsing/error handling theo pattern `readJsonSafely` đang dùng | `src/features/inventory/inventoryApi.ts`, `src/features/inventory/types.ts` | Lint/type-check; mô phỏng lỗi API để bảo đảm message hiển thị được |
| 8   | Nối `InventoryPage` với API thật: load inventory + avatar khi vào màn, lọc item theo tab, hiển thị trạng thái equipped, gọi equip/unequip khi user thao tác | `src/features/inventory/InventoryPage.tsx`, `src/features/inventory/types.ts`, `src/App.tsx` | Chạy app local; chuyển tab, equip, unequip và reload vẫn giữ trạng thái |
| 9   | Thay preview demo bằng mock/avatar preview lấy từ `baseAvatarUrl` + equipped assets hoặc fallback ảnh tĩnh khi chưa có renderer 3D | `src/features/inventory/InventoryPage.tsx`, `src/styles/global.css` | Kiểm tra màn Inventory vẫn usable trên desktop/mobile khi không có 3D engine |
| 10  | Bổ sung state UX tối thiểu: loading, empty inventory, request in-flight, error message, disable action khi item không hợp lệ hoặc chưa owned | `src/features/inventory/InventoryPage.tsx`, `src/styles/global.css` | Kiểm tra bằng dữ liệu rỗng/lỗi API; UI không vỡ layout |
| 11  | Chạy kiểm tra cuối cùng và rà soát contract phase 1, bảo đảm không kéo shop/purchase flow vào phạm vi | Các tệp đã sửa | `npm run lint`, `npm run build`, test tay 4 endpoint chính |

## 5. Rủi ro & Biện pháp giảm thiểu

| #   | Rủi ro | Biện pháp giảm thiểu |
| --- | ------ | -------------------- |
| 1   | Lệch taxonomy giữa tab FE (`hats`) và type nghiệp vụ (`hat`) gây map sai slot | Dùng một bảng mapping tập trung giữa UI tab và item type; không hardcode rải rác |
| 2   | API equip cập nhật sai slot hoặc cho phép equip item không thuộc user | Kiểm tra ownership + `is_active` + type trước khi `UPDATE`; thêm test tay đủ các mã lỗi |
| 3   | Avatar preview phase 1 phụ thuộc asset 3D chưa sẵn sàng | Dùng fallback ảnh tĩnh/mock preview; không block tiến độ backend contract |
| 4   | Migration mới xung đột với dữ liệu hiện có hoặc thứ tự file migration | Dùng số migration tiếp theo `014_...`; chạy migrate trên local từ trạng thái hiện tại trước khi merge |
| 5   | UI hiện tại dựng từ sample data nên thiếu state loading/error/empty | Bổ sung state UX tối thiểu ngay trong vòng nối API đầu tiên |
| 6   | Repo đã có `users.avatar_url` từ migration cũ nên dễ trùng nghĩa với `avatars`/`user_avatar` mới | Giữ `users.avatar_url` để tương thích ngược trong phase 1; quy định rõ `avatars` là danh mục base avatar, `user_avatar` là trạng thái equip, tránh tái sử dụng tên cũ sai ngữ nghĩa |

## 6. Quy trình hoàn tác

1. Tắt route Inventory mới ở bản deploy nếu phát hiện lỗi runtime nghiêm trọng phía API.
2. Roll back ứng dụng về commit trước khi thêm Inventory phase 1.
3. Nếu migration đã áp dụng trên production, không xóa bảng ngay; trước tiên dừng traffic vào feature rồi chuẩn bị migration rollback riêng nếu thật sự cần.
4. Khôi phục `InventoryPage` về trạng thái chỉ hiển thị UI tĩnh nếu cần giữ màn hình hoạt động trong khi sửa backend.

## 7. Các bước xác minh

```bash
# Migration
npm run db:migrate

# Quality checks
npm run lint
npm run build

# Chạy app/server local nếu cần test tay
npm run dev
npm run start:server
```

Test tay tối thiểu:
- Đăng nhập user hợp lệ rồi mở màn Inventory.
- `GET /api/inventory` trả item owned và cờ `isEquipped` đúng.
- `GET /api/avatar/me` trả đúng slot đang equip.
- Equip một item hợp lệ và reload trang, trạng thái vẫn giữ nguyên.
- Unequip theo `type` hợp lệ và gọi lặp lại không phát sinh lỗi.
- Thử equip item không owned / item không tồn tại để xác nhận `403` và `404`.

---

## Bảng ánh xạ AC

| #   | AC | (Các) bước đáp ứng | Cách xác minh |
| --- | -- | ------------------ | ------------- |
| 1   | AC-inventory-1/v1: Lấy inventory của user | Bước 2, 3, 7, 8 | Gọi `GET /api/inventory`, mở màn Inventory và đối chiếu item list |
| 2   | AC-inventory-2/v1: Lấy avatar hiện tại của user | Bước 2, 4, 8, 9 | Gọi `GET /api/avatar/me`, reload UI và kiểm tra preview/equipped slots |
| 3   | AC-inventory-3/v1: Equip item đã sở hữu theo đúng type/slot | Bước 1, 5, 7, 8 | Test `POST /api/avatar/equip` với case thành công và lỗi `400/403/404/409` |
| 4   | AC-inventory-4/v1: Unequip item theo slot/type | Bước 1, 6, 7, 8 | Test `POST /api/avatar/unequip`; kiểm tra idempotent khi slot trống |
| 5   | AC-inventory-5/v1: Dùng mock preview hoặc ảnh tĩnh thay cho 3D viewer | Bước 8, 9, 10 | Mở Inventory trên local khi chưa có renderer 3D và xác nhận UI vẫn đầy đủ chức năng |
