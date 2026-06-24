import { execute } from '../server/db.mjs';

const newItems = [
  { name: 'Tai Nghe Gaming Pro', desc: 'Tai nghe chống ồn giúp Pet tập trung nghe nhạc lo-fi gõ code.', emoji: '🎧', price: 90 },
  { name: 'Kính Cận Học Thức', desc: 'Gọng kính tri thức giúp Pet tăng 100 điểm IQ khi đọc logic code.', emoji: '👓', price: 25 },
  { name: 'Bóng Bay Sắc Màu', desc: 'Chiếc bóng bay bay lơ lửng mang lại niềm vui cho linh thú.', emoji: '🎈', price: 15 },
  { name: 'Cúp Vô Địch Python', desc: 'Cúp danh giá dành cho thú cưng lập trình xuất sắc nhất.', emoji: '🏆', price: 200 },
  { name: 'Sách Thuật Toán Cổ', desc: 'Cuốn sách lưu giữ những bí kíp tối ưu hóa thuật toán cổ xưa.', emoji: '📖', price: 60 },
  { name: 'Balô Học Giả', desc: 'Đựng laptop và tài liệu học Python của Pet.', emoji: '🎒', price: 70 },
  { name: 'Khăn Len Ấm Áp', desc: 'Giữ ấm cho Pet vào những ngày đông gõ phím lạnh giá.', emoji: '🧣', price: 40 }
];

async function main() {
  console.log('Seeding new pet accessories...');
  for (const item of newItems) {
    try {
      await execute(
        `INSERT INTO items (name, asset_type, description, image_data, price)
         SELECT $1::varchar, 'pet_accessory', $2::text, $3::text, $4::integer
         WHERE NOT EXISTS (SELECT 1 FROM items WHERE name = $1::varchar)`,
        [item.name, item.desc, item.emoji, item.price]
      );
      console.log(`Seeded or verified: ${item.name}`);
    } catch (error) {
      console.error(`Failed to seed ${item.name}:`, error);
    }
  }
  process.exit(0);
}

main();
