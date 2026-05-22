## 1. Bối cảnh / Mục đích
Thiết kế màn hình để tạo nhân vật và các vật phẩm trong ứng dụng
## 2. Phạm vi
- Tham chiếu thiết kế tới các file thiết kế màn hình thiết kế tại raw/design/Accessories, UI đầu ra phải giống như thư mục thiết kế này
## 3. Yêu cầu
3.1 Tận dụng lại button Achievements đã tồn tại ở navigate side bar để liên kết với màn hình này
3.2 Tạn dụng Topbar, SideBar hiện tại không được phép tạo cái mới
3.3 Giai đoạn này chỉ cần dựng UI chưa cần thực hiện bất cứ thao tác nào khác
3.4 Chỉ có user có is_admin = true thì mới hiển thị được Achievements ở navigate bar
3.5 Tạo ra 2 bảng để lưu avatar và lưu vật phẩm item (hat, jacket ...) (ví dụ bảng là avartar, items)
3.6 Hình ảnh sẽ được lưu dạng blod ở vercel
3.7 Có thể xem trực tiếp ảnh vừa upload ở khu vựa accessories-preview-stage
3.8 Một user tại 1 thời điểm chỉ có quan hệ 1-1 với bảng avartar, 1 avartar có quan hệ 1-n với bảng items
3.9 Khi nhấn nút publish thì phải lưu được thông tin đã đăng ký xuống db
