export type StarterModule = {
  id: string;
  order: string;
  title: string;
  description: string;
};

export const starterModules: StarterModule[] = [
  {
    id: 'hello-python',
    order: '01',
    title: 'Làm quen với Python',
    description: 'Dùng print, biến và câu thoại để thấy code tạo ra kết quả ngay.',
  },
  {
    id: 'robot-basics',
    order: '02',
    title: 'Điều khiển robot',
    description: 'Dùng move, turn và collect để giúp robot đi lấy đồng xu.',
  },
  {
    id: 'loops',
    order: '03',
    title: 'Vòng lặp đầu tiên',
    description: 'Giúp robot lặp lại hành động bằng for và range.',
  },
];
