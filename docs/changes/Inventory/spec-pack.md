## 1. Bối cảnh / Mục đích

Xây dựng tính năng Inventory phục vụ gamification cho hệ thống:
- Người dùng có một avatar cá nhân.
- Người dùng có thể sở hữu item.
- Người dùng có thể trang bị item lên avatar.
- Hệ thống lưu lại trạng thái avatar hiện tại của người dùng.

## 2. Phạm vi

- Tham chiếu thiết kế từ `raw/design/Inventory`.
- Tận dụng `TopBar`, `SideBar` hiện có, không tạo mới layout khung.
- Inventory là màn hình dành cho người dùng đã đăng nhập.
- Phase 1 tập trung vào dữ liệu inventory, trạng thái equip/unequip và UI hiển thị.
- Phase 1 chưa bắt buộc dựng 3D viewer hoàn chỉnh. Có thể dùng ảnh/mock preview thay cho avatar 3D thật nếu chưa có renderer.
- Shop thuộc cùng domain nghiệp vụ Inventory nhưng phần Phase 2 sẽ được triển khai trong màn Daily Practice, không nằm trong phạm vi màn Inventory này.

## 3. Storage cho asset

- Asset có thể lưu trên Vercel Blob.
- Có thể tách bảng `avatars` để lưu danh sách nhân vật/base avatar của hệ thống nếu cần quản lý nhiều avatar gốc.
- `asset_url` dùng cho model/asset chính.
- `thumbnail_url` dùng cho ảnh preview trong danh sách item.
- `base_avatar_url` là asset gốc của avatar, có thể lấy từ cấu hình server, từ bảng `avatars`, hoặc bảng cấu hình riêng.

## 4. Flow trang bị item

```text
User mở Inventory
   ->
Frontend gọi API lấy inventory + avatar hiện tại
   ->
User chọn 1 item đã sở hữu
   ->
Frontend gọi API equip item
   ->
Backend kiểm tra item có tồn tại, đang active, đúng owner
   ->
Backend cập nhật slot tương ứng trong user_avatar
   ->
Frontend reload avatar preview và trạng thái item
```

## 5. Inventory Screen

Chức năng:
- Hiển thị avatar preview hiện tại của user.
- Hiển thị danh sách item user đã sở hữu.
- Hiển thị item đang được trang bị.
- Cho phép equip item.
- Cho phép unequip item theo từng slot.
- Hiển thị phân loại item theo tab/type.

Ghi chú phase 1:
- Chưa bắt buộc xoay/zoom avatar nếu chưa có engine 3D.
- Ưu tiên API contract và trạng thái equip đúng trước.
- UI Inventory đã được dựng xong trong phase 1, các bước còn lại của phase 1 tập trung vào nối dữ liệu và thao tác equip/unequip.

## 6. Database Design

Lưu ý:
- Codebase hiện tại đang dùng `users.id` kiểu `INTEGER/SERIAL`, không dùng UUID.
- Tất cả foreign key tới `users` phải dùng `INTEGER`.
- Item vẫn có thể dùng `UUID` để tiện quản lý độc lập.

Ghi chú tương thích:
- Repo hiện đã có migration `007_user_avatar.sql` thêm cột `users.avatar_url`.
- Phase này không sửa migration cũ mà bổ sung schema mới để quản lý Inventory đúng domain hơn.

### 6.1. items

```sql
CREATE TABLE items (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  price INTEGER NOT NULL DEFAULT 0,
  asset_url TEXT NOT NULL,
  thumbnail_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

Item type đề xuất:

```text
hair
hat
glasses
clothes
back
accessory
background
effect
```

Ghi chú:
- Taxonomy type phải thống nhất giữa DB, API và tab frontend.
- Nếu UI chỉ dùng một tập con type trong phase 1 thì backend vẫn nên giữ enum mở rộng để tránh đổi schema sau này.

### 6.2. user_items

```sql
CREATE TABLE user_items (
  id UUID PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (user_id, item_id)
);
```

### 6.3. user_avatar

```sql
CREATE TABLE user_avatar (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  hair_item_id UUID REFERENCES items(id) ON DELETE SET NULL,
  hat_item_id UUID REFERENCES items(id) ON DELETE SET NULL,
  glasses_item_id UUID REFERENCES items(id) ON DELETE SET NULL,
  clothes_item_id UUID REFERENCES items(id) ON DELETE SET NULL,
  back_item_id UUID REFERENCES items(id) ON DELETE SET NULL,
  accessory_item_id UUID REFERENCES items(id) ON DELETE SET NULL,
  background_item_id UUID REFERENCES items(id) ON DELETE SET NULL,
  effect_item_id UUID REFERENCES items(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

Business rule ở mức DB/service:
- Mỗi slot chỉ chứa tối đa 1 item.
- Item được equip phải thuộc đúng type tương ứng với slot.
- Item được equip phải là item user đang sở hữu.
- `user_avatar` lưu trạng thái avatar hiện tại của từng user, không phải danh mục nhân vật gốc của hệ thống.

### 6.4. avatars

```sql
CREATE TABLE avatars (
  id UUID PRIMARY KEY,
  code VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  base_avatar_url TEXT NOT NULL,
  thumbnail_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

Ghi chú:
- `avatars` dùng để lưu danh sách nhân vật/base avatar của hệ thống.
- Nếu phase 1 chỉ có một base avatar mặc định, backend có thể dùng 1 bản ghi mặc định hoặc tạm lấy từ cấu hình server.

Ghi chú chuyển tiếp:
- Có thể giữ `users.avatar_url` như fallback tương thích ngược trong giai đoạn chuyển tiếp.
- Không dùng cột này thay cho `user_avatar`.

## 7. API

Tất cả API bên dưới yêu cầu user đã đăng nhập.

### 7.1. Get User Inventory

```http
GET /api/inventory
```

Response:

```json
{
  "items": [
    {
      "id": "item-id",
      "name": "Red Hat",
      "type": "hat",
      "price": 100,
      "assetUrl": "https://cdn.example.com/items/red-hat.glb",
      "thumbnailUrl": "https://cdn.example.com/items/red-hat.png",
      "isActive": true,
      "isOwned": true,
      "isEquipped": true
    }
  ]
}
```

### 7.2. Get User Avatar

```http
GET /api/avatar/me
```

Response:

```json
{
  "baseAvatarUrl": "https://cdn.example.com/avatar/base-avatar.glb",
  "equippedItems": {
    "hair": null,
    "hat": "item-id",
    "glasses": null,
    "clothes": "item-id",
    "back": null,
    "accessory": null,
    "background": null,
    "effect": null
  },
  "assets": [
    {
      "id": "item-id",
      "type": "hat",
      "assetUrl": "https://cdn.example.com/items/red-hat.glb"
    }
  ]
}
```

### 7.3. Equip Item

```http
POST /api/avatar/equip
```

Request:

```json
{
  "itemId": "item-id"
}
```

Success response:

```json
{
  "success": true,
  "message": "Item equipped successfully"
}
```

Business rule:
- User chỉ được equip item đã sở hữu.
- Item phải tồn tại và `is_active = true`.
- Mỗi type chỉ được equip tối đa 1 item tại một thời điểm.
- Nếu equip item cùng type, item cũ sẽ bị thay thế.
- Backend phải map `item.type` sang đúng slot trong `user_avatar`.

Error case tối thiểu:
- `400` nếu `itemId` thiếu hoặc không hợp lệ.
- `404` nếu item không tồn tại.
- `403` nếu item không thuộc quyền sở hữu của user.
- `409` nếu item không thể equip do sai type/slot.

### 7.4. Unequip Item

```http
POST /api/avatar/unequip
```

Request:

```json
{
  "type": "hat"
}
```

Success response:

```json
{
  "success": true,
  "message": "Item unequipped successfully"
}
```

Business rule:
- Chỉ unequip theo slot/type hợp lệ.
- Nếu slot đang trống vẫn nên trả response an toàn, không gây lỗi hệ thống.

Error case tối thiểu:
- `400` nếu `type` không hợp lệ.

## 8. Triển khai theo phase

### Phase 1
- UI Inventory đã hoàn thành.
- Lấy inventory của user.
- Lấy avatar hiện tại.
- Equip / unequip item.
- Dùng mock preview hoặc ảnh tĩnh cho avatar nếu chưa có 3D renderer.

### Phase 2
- Không nằm trong phạm vi màn Inventory.
- Sẽ được triển khai trong màn Daily Practice cho shop/purchase flow.

### Phase 3
- 3D viewer hoàn chỉnh.
- Xoay / zoom avatar.
- Animation hoặc effect asset nếu cần.
