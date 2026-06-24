# Gói đặc tả thay đổi - Gamification Pet Enhancements (Nâng cấp kích thích trẻ học tập)

> Tạo: 2026-06-24
> Nguồn tham chiếu: Ý tưởng thiết kế gamification cho học sinh tiểu học/trung học cơ sở

---

## 1. Bối cảnh / Mục đích
Mô hình "Thú cưng đồng hành" hiện tại đã hỗ trợ các tính năng cơ bản như hiển thị chỉ số, streak và cho ăn. Để tăng cường sự gắn kết của trẻ em, ứng dụng cần thêm các yếu tố kích thích trực quan, nhiệm vụ động lực và cơ chế cá nhân hóa.

Mục tiêu của gói nâng cấp này là:
- Cho phép trẻ sử dụng Coins tích lũy từ bài học để mua sắm phụ kiện trang trí cho Pet.
- Kỷ niệm cột mốc tiến hóa bằng các hoạt ảnh sinh động nhằm mang lại cảm giác thỏa mãn khi đạt thành tựu.
- Tăng tính gắn kết qua hệ thống nhiệm vụ ước nguyện hàng ngày của Pet.
- Tạo thói quen học hàng ngày thông qua cơ chế mệt mỏi/đói của Pet khi trẻ bỏ học.
- Đưa thêm tương tác nhanh (trắc nghiệm vui) và thay đổi biểu cảm Pet theo thời gian thực khi viết code.

---

## 2. Phạm vi

### Trong phạm vi
- Cấu trúc dữ liệu: Cấu hình nullable cho `avatar_id` trong bảng `items` để bán vật phẩm độc lập.
- Backend API:
  - `GET /api/user-pets/shop`: Danh sách vật phẩm phụ kiện bán trong Shop cho Pet.
  - `POST /api/user-pets/shop/buy`: Thực hiện mua phụ kiện bằng Coins.
  - `POST /api/user-pets/play`: Chơi mini-game trắc nghiệm nhanh với Pet (cộng Affection/XP).
  - `GET /api/user-pets/daily-wish`: Lấy nhiệm vụ ước nguyện của Pet hôm nay.
- Frontend:
  * Giao diện Pet Shop & Tủ đồ trang bị phụ kiện.
  * Hiệu ứng tiến hóa hoành tráng với pháo hoa giấy và âm thanh.
  * Tối ưu hiển thị Pet trong SideNav và thay đổi biểu cảm tương tác trong Editor.

### Ngoài phạm vi
- Thiết kế hệ thống phụ kiện chuyển động phức tạp (chỉ dùng ghép đè ảnh/emoji).
- Mua bán phụ kiện bằng tiền thật (chỉ dùng Coins nội bộ của game).

---

## 3. Thuật ngữ

| Thuật ngữ | Mô tả |
|---|---|
| Affection | Điểm thân thiết của Pet với User, tăng khi chơi đùa hoặc làm nhiệm vụ Pet giao |
| Pet Shop | Cửa hàng bán phụ kiện trang trí cho Pet bằng Coins |
| Evolution Celebration | Hoạt ảnh kỷ niệm khi Pet chuyển đổi giai đoạn tiến hóa (Baby -> Teen -> Adult -> Master) |
| Daily Wish | Nhiệm vụ nhỏ hàng ngày do Pet yêu cầu để tăng tương tác |
| Idle Expression | Biểu cảm mặc định dựa trên chỉ số đói của Pet |

---

## 4. Hiện trạng / Trạng thái mục tiêu

| Khía cạnh | Hiện tại | Trạng thái mục tiêu |
|---|---|---|
| Phụ kiện | Đã có API trang bị thô nhưng chưa có Shop mua phụ kiện, các items trong DB bắt buộc phải gắn với Avatar | Cho phép `avatar_id` nullable, bổ sung Shop mua đồ trang trí Pet bằng Coins, hỗ trợ đeo/tháo phụ kiện động |
| Tiến hóa | Chỉ đổi emoji hiển thị âm thầm khi tăng cấp độ bài học | Kích hoạt hiệu ứng chúc mừng tràn màn hình (Confetti + Sound) tại khoảnh khắc nâng cấp tiến hóa |
| Động lực hàng ngày | Trẻ tự làm bài, Pet không phản ứng khi bị bỏ đói | Độ no tụt dần mỗi ngày, Pet chuyển sang trạng thái buồn bã/đói lả khi bỏ học 2 ngày để kéo trẻ trở lại |
| Tương tác trực tiếp | PetWidget hiển thị câu thoại tĩnh | Tích hợp nút "Chơi đùa" mở mini-game quiz nhanh, Pet đổi biểu cảm theo trạng thái viết code trong Editor |

---

## 5. Chi tiết đặc tả

### 5.1 Cửa hàng phụ kiện & Hệ thống trang bị
- **Cơ sở dữ liệu (Database)**: 
  - Cột `avatar_id` trong bảng `items` được cấu hình là Nullable để hỗ trợ phụ kiện Pet độc lập.
  - Seeding danh sách **24 phụ kiện thú cưng** đa dạng (Mũ phù thủy `🎩`, Vương miện `👑`, Cốc nước có ống hút `🥤`, Chuông gió `🎐`, Bàn phím cơ `⌨️`...).
  - Tất cả các emoji đều được tối ưu hóa tương thích phông chữ hiển thị trên Windows (ví dụ: đổi `🧋` thành `🥤`, `🪭` thành `🎐` để tránh lỗi font ô vuông).
- **Quy trình mua & trang bị**:
  - Học sinh mở Cửa hàng -> Mua phụ kiện bằng Coins -> Trừ Coins và thêm vào tủ đồ người dùng.
  - **Trang bị cùng lúc nhiều phụ kiện**: Hệ thống hỗ trợ bật/tắt trang bị cho từng phụ kiện riêng biệt mà không tháo các vật phẩm khác. Học sinh có thể kết hợp cùng lúc nhiều món đồ khác danh mục (ví dụ: vừa đội mũ `🎩` vừa đeo kính `🕶️`).
- **Hệ thống hiển thị overlays thông minh**:
  - Các phụ kiện được xếp chồng tự động đè lên avatar Pet ở các vị trí tọa độ cụ thể (`position: absolute`):
    - Đỉnh đầu (`accessory-hat`): mũ, vương miện, đèn học...
    - Giữa mặt (`accessory-glasses`): kính râm, kính cận...
    - Góc dưới bên trái (`accessory-keyboard`): bàn phím, gấu bông, cốc nước, burger, sneaker...
    - Góc dưới bên phải (`accessory-wand`): đũa phép, chuông gió, khiên, búa, cỏ 4 lá...
  - Hỗ trợ 3 kích thước responsive phù hợp: Thẻ trạng thái Avatar thường, Bong bóng Widget Editor, và Avatar thu nhỏ dưới SideNav (compact).
- **Giao diện trang Cửa hàng toàn màn hình (Pet Shop Page)**:
  - Cửa hàng được tích hợp trực tiếp vào thanh điều hướng SideNav (biểu tượng `storefront`), bố trí giữa phần Luyện Tập và Thành Tựu.
  - **Tìm kiếm và lọc bộ lọc nâng cao**: Hỗ trợ tìm kiếm theo tên phụ kiện (không phân biệt hoa thường) và lọc theo 4 khoảng giá (Tất cả, Dưới 50 Coins, Từ 50 - 100, Trên 100 Coins). Tự động hiển thị trạng thái rỗng `🔍` đẹp mắt khi không tìm thấy kết quả.
  - **Phân trang (Pagination)**: Cửa hàng và tủ đồ được phân trang client-side mượt mà với **10 vật phẩm mỗi trang**, đi kèm bộ nút điều khiển trang (Trước, 1, 2, 3, Sau) có thiết kế glassmorphism sang trọng và đổi màu theo chủ đề Light/Dark Mode.
- **Tương tác nhanh**: Click trực tiếp vào hình mặt Pet trên thẻ Pet ở thanh SideNav sẽ chuyển hướng nhanh sang Cửa Hàng Pet.

### 5.2 Kỷ niệm tiến hóa hoành tráng
- Khi gọi `/api/user-pets/feed` trả về `leveledUp = true` và cấp độ mới chạm các mốc tiến hóa (Level 2, Level 5, Level 10):
  - Kích hoạt component `EvolutionCelebrationModal`.
  - Bắn pháo hoa giấy Canvas-Confetti liên tục trong 3 giây.
  - Phát âm thanh nhạc kèn mừng chiến thắng (`celebration_chime`).
  - Hiển thị hình ảnh thay đổi rõ rệt của Pet kèm tên danh hiệu tiến hóa mới (ví dụ: *PyDragon Tập Sự* nâng lên *PyDragon Thần Thoại*).

### 5.3 Nhiệm vụ ước nguyện hàng ngày (Daily Wishes)
- Mỗi ngày Pet sẽ đưa ra 1 ước nguyện ngẫu nhiên từ danh sách (ví dụ: *"Cậu hãy đạt 100 XP hôm nay nhé"*, *"Hãy làm đúng 1 bài luyện tập"*).
- Hoàn thành ước nguyện giúp trẻ nhận thưởng thêm Coins và tăng 10 điểm thân thiết (`affection`).

### 5.4 Cơ chế đói bụng kiệt sức (Streak Penalty)
- Mỗi 24 giờ kể từ `last_fed_at`, độ no (`fullness`) giảm 15 điểm.
- Nếu `fullness` dưới 30, Pet chuyển sang biểu cảm mệt mỏi (`😿`, `🥺`).
- Nếu bỏ học/không cho ăn quá 48 giờ (`fullness` chạm 0), Pet sẽ ngủ thiếp đi (`💤`, `🥀`) và không trò chuyện nữa cho đến khi được cho ăn.

### 5.5 Mini-game trắc nghiệm vui (Pet Quick Quiz)
- Ngay tại `PetStatusCard`, thêm nút 🎮 (Chơi đùa). Bấm vào sẽ mở Popup trắc nghiệm nhanh 1 câu hỏi vui về Python (ví dụ: *"Đâu là cú pháp đúng của hàm print?"*).
- Đúng: Pet nhảy múa (+5 Affection). Sai: Pet ngơ ngác (+1 Affection khích lệ). Tối đa chơi 2 lần mỗi ngày.

### 5.6 Biểu cảm thời gian thực trong Editor
- Kết nối trạng thái gõ code của Editor với `PetWidget`:
  - Khi gõ phím (`onChange`): Pet đổi biểu cảm suy nghĩ (`🤔`).
  - Khi bấm chạy code thành công: Pet bắn tim ăn mừng (`🎉` / `💖`).
  - Khi lỗi biên dịch/Pyodide báo lỗi: Pet chóng mặt (`😵`) và đưa ra lời thoại động viên.
