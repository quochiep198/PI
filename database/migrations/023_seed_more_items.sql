-- Migration: Seed 12 more pet accessories to items table (F-03 Section 5.1 extension)

-- 13. Cà Phê Lập Trình
INSERT INTO items (name, asset_type, description, image_data, price)
SELECT 'Cà Phê Lập Trình', 'pet_accessory', 'Tách cà phê giúp Pet tỉnh táo debug xuyên màn đêm.', '☕', 35
WHERE NOT EXISTS (SELECT 1 FROM items WHERE name = 'Cà Phê Lập Trình');

-- 14. Khiên Bảo Mật
INSERT INTO items (name, asset_type, description, image_data, price)
SELECT 'Khiên Bảo Mật', 'pet_accessory', 'Khiên chắn bảo vệ code của Pet khỏi mọi đợt tấn công.', '🛡️', 120
WHERE NOT EXISTS (SELECT 1 FROM items WHERE name = 'Khiên Bảo Mật');

-- 15. Búa Thor Quyền Lực
INSERT INTO items (name, asset_type, description, image_data, price)
SELECT 'Búa Thor Quyền Lực', 'pet_accessory', 'Búa đập tan mọi bug cứng đầu trong nháy mắt.', '🔨', 110
WHERE NOT EXISTS (SELECT 1 FROM items WHERE name = 'Búa Thor Quyền Lực');

-- 16. Cỏ 4 Lá May Mắn
INSERT INTO items (name, asset_type, description, image_data, price)
SELECT 'Cỏ 4 Lá May Mắn', 'pet_accessory', 'Đem lại may mắn cho Pet, chạy testcase nào cũng xanh mướt.', '🍀', 45
WHERE NOT EXISTS (SELECT 1 FROM items WHERE name = 'Cỏ 4 Lá May Mắn');

-- 17. Trà Sữa Trân Châu
INSERT INTO items (name, asset_type, description, image_data, price)
SELECT 'Trà Sữa Trân Châu', 'pet_accessory', 'Thức uống ngọt ngào tiếp thêm 200% năng lượng cho Pet học tập.', '🥤', 50
WHERE NOT EXISTS (SELECT 1 FROM items WHERE name = 'Trà Sữa Trân Châu');

-- 18. Nến Lập Trình
INSERT INTO items (name, asset_type, description, image_data, price)
SELECT 'Nến Lập Trình', 'pet_accessory', 'Ánh nến lung linh đồng hành cùng Pet qua những đêm gõ code cô đơn.', '🕯️', 20
WHERE NOT EXISTS (SELECT 1 FROM items WHERE name = 'Nến Lập Trình');

-- 19. Hamburger Khổng Lồ
INSERT INTO items (name, asset_type, description, image_data, price)
SELECT 'Hamburger Khổng Lồ', 'pet_accessory', 'Bữa ăn burger siêu to khổng lồ giúp Pet nạp năng lượng tức thì.', '🍔', 65
WHERE NOT EXISTS (SELECT 1 FROM items WHERE name = 'Hamburger Khổng Lồ');

-- 20. Đèn Học Thông Minh
INSERT INTO items (name, asset_type, description, image_data, price)
SELECT 'Đèn Học Thông Minh', 'pet_accessory', 'Khơi nguồn ý tưởng sáng tạo cho những dòng code đỉnh cao.', '💡', 75
WHERE NOT EXISTS (SELECT 1 FROM items WHERE name = 'Đèn Học Thông Minh');

-- 21. Nhẫn Cực Phẩm
INSERT INTO items (name, asset_type, description, image_data, price)
SELECT 'Nhẫn Cực Phẩm', 'pet_accessory', 'Nhẫn kim cương lấp lánh thể hiện sự giàu sang quý phái của Pet.', '💎', 300
WHERE NOT EXISTS (SELECT 1 FROM items WHERE name = 'Nhẫn Cực Phẩm');

-- 22. Gấu Bông Debug
INSERT INTO items (name, asset_type, description, image_data, price)
SELECT 'Gấu Bông Debug', 'pet_accessory', 'Người bạn đồng hành dễ thương giúp Pet giảm stress khi debug.', '🧸', 85
WHERE NOT EXISTS (SELECT 1 FROM items WHERE name = 'Gấu Bông Debug');

-- 23. Quạt Trầm Tĩnh
INSERT INTO items (name, asset_type, description, image_data, price)
SELECT 'Quạt Trầm Tĩnh', 'pet_accessory', 'Làm mát tâm trạng khi code gặp lỗi biên dịch.', '🎐', 15
WHERE NOT EXISTS (SELECT 1 FROM items WHERE name = 'Quạt Trầm Tĩnh');

-- 24. Giày Sneaker Tốc Độ
INSERT INTO items (name, asset_type, description, image_data, price)
SELECT 'Giày Sneaker Tốc Độ', 'pet_accessory', 'Giúp Pet di chuyển nhanh nhẹn và gõ phím nhanh gấp đôi.', '👟', 95
WHERE NOT EXISTS (SELECT 1 FROM items WHERE name = 'Giày Sneaker Tốc Độ');
