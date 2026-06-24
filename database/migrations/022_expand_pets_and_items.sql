-- Migration: Make avatar_id nullable in items, add affection to user_pets, seed pet accessories (F-03 Phase 2)

-- Make avatar_id nullable
ALTER TABLE items ALTER COLUMN avatar_id DROP NOT NULL;

-- Add affection column to user_pets if not exists
ALTER TABLE user_pets ADD COLUMN IF NOT EXISTS affection INTEGER NOT NULL DEFAULT 50;

-- Seed pet accessories only if they do not exist

-- 1. Mũ Phù Thủy
INSERT INTO items (name, asset_type, description, image_data, price)
SELECT 'Mũ Phù Thủy', 'pet_accessory', 'Chiếc mũ ma thuật lấp lánh giúp Pet thông thái hơn.', '🎩', 50
WHERE NOT EXISTS (SELECT 1 FROM items WHERE name = 'Mũ Phù Thủy');

-- 2. Kính Râm Cực Ngầu
INSERT INTO items (name, asset_type, description, image_data, price)
SELECT 'Kính Râm Cực Ngầu', 'pet_accessory', 'Kính bảo vệ mắt khi Pet phải nhìn màn hình code quá lâu.', '🕶️', 30
WHERE NOT EXISTS (SELECT 1 FROM items WHERE name = 'Kính Râm Cực Ngầu');

-- 3. Bàn Phím Cơ Mini
INSERT INTO items (name, asset_type, description, image_data, price)
SELECT 'Bàn Phím Cơ Mini', 'pet_accessory', 'Bàn phím cơ phát ra tiếng clicky vui tai của lập trình viên.', '⌨️', 80
WHERE NOT EXISTS (SELECT 1 FROM items WHERE name = 'Bàn Phím Cơ Mini');

-- 4. Cây Đũa Thần Python
INSERT INTO items (name, asset_type, description, image_data, price)
SELECT 'Cây Đũa Thần Python', 'pet_accessory', 'Đũa phép đúc từ logo Python giúp viết code không bao giờ lỗi.', '✨', 100
WHERE NOT EXISTS (SELECT 1 FROM items WHERE name = 'Cây Đũa Thần Python');

-- 5. Vương Miện Hoàng Gia
INSERT INTO items (name, asset_type, description, image_data, price)
SELECT 'Vương Miện Hoàng Gia', 'pet_accessory', 'Dành cho thú cưng xuất sắc nhất vương quốc Python.', '👑', 150
WHERE NOT EXISTS (SELECT 1 FROM items WHERE name = 'Vương Miện Hoàng Gia');

-- 6. Tai Nghe Gaming Pro
INSERT INTO items (name, asset_type, description, image_data, price)
SELECT 'Tai Nghe Gaming Pro', 'pet_accessory', 'Tai nghe chống ồn giúp Pet tập trung nghe nhạc lo-fi gõ code.', '🎧', 90
WHERE NOT EXISTS (SELECT 1 FROM items WHERE name = 'Tai Nghe Gaming Pro');

-- 7. Kính Cận Học Thức
INSERT INTO items (name, asset_type, description, image_data, price)
SELECT 'Kính Cận Học Thức', 'pet_accessory', 'Gọng kính tri thức giúp Pet tăng 100 điểm IQ khi đọc logic code.', '👓', 25
WHERE NOT EXISTS (SELECT 1 FROM items WHERE name = 'Kính Cận Học Thức');

-- 8. Bóng Bay Sắc Màu
INSERT INTO items (name, asset_type, description, image_data, price)
SELECT 'Bóng Bay Sắc Màu', 'pet_accessory', 'Chiếc bóng bay bay lơ lửng mang lại niềm vui cho linh thú.', '🎈', 15
WHERE NOT EXISTS (SELECT 1 FROM items WHERE name = 'Bóng Bay Sắc Màu');

-- 9. Cúp Vô Địch Python
INSERT INTO items (name, asset_type, description, image_data, price)
SELECT 'Cúp Vô Địch Python', 'pet_accessory', 'Cúp danh giá dành cho thú cưng lập trình xuất sắc nhất.', '🏆', 200
WHERE NOT EXISTS (SELECT 1 FROM items WHERE name = 'Cúp Vô Địch Python');

-- 10. Sách Thuật Toán Cổ
INSERT INTO items (name, asset_type, description, image_data, price)
SELECT 'Sách Thuật Toán Cổ', 'pet_accessory', 'Cuốn sách lưu giữ những bí kíp tối ưu hóa thuật toán cổ xưa.', '📖', 60
WHERE NOT EXISTS (SELECT 1 FROM items WHERE name = 'Sách Thuật Toán Cổ');

-- 11. Balô Học Giả
INSERT INTO items (name, asset_type, description, image_data, price)
SELECT 'Balô Học Giả', 'pet_accessory', 'Đựng laptop và tài liệu hướng dẫn học Python của Pet.', '🎒', 70
WHERE NOT EXISTS (SELECT 1 FROM items WHERE name = 'Balô Học Giả');

-- 12. Khăn Len Ấm Áp
INSERT INTO items (name, asset_type, description, image_data, price)
SELECT 'Khăn Len Ấm Áp', 'pet_accessory', 'Giữ ấm cho Pet vào những ngày đông gõ phím lạnh giá.', '🧣', 40
WHERE NOT EXISTS (SELECT 1 FROM items WHERE name = 'Khăn Len Ấm Áp');
