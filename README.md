# Python Adventure

Frontend React/Vite cho bài học Python, kèm backend Node/Express nhỏ để:
- đọc danh sách bài học từ Neon Postgres
- lưu tiến trình hoàn thành
- gọi Groq để tạo gợi ý AI

## Stack

- React
- TypeScript
- Vite
- Express
- Neon Postgres
- Pyodide
- Groq API

## Cài đặt

```bash
npm install
```

Tạo `.env` từ `.env.example`.

## Chuẩn bị Neon DB

```bash
psql "postgresql://user:password@ep-example.ap-southeast-1.aws.neon.tech/neondb?sslmode=require" -f D:\python-ai\python-adventure\database\schema.sql
psql "postgresql://user:password@ep-example.ap-southeast-1.aws.neon.tech/neondb?sslmode=require" -f D:\python-ai\python-adventure\database\seed_lessons.sql
```

## Biến môi trường

```env
DATABASE_URL=postgresql://user:password@ep-example.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
API_PORT=3001
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=llama-3.3-70b-versatile
```

## Chạy ứng dụng

Terminal 1:

```bash
npm run dev:server
```

Terminal 2:

```bash
npm run dev
```

## Chức năng hiện có

- danh sách bài học từ Neon Postgres
- editor Python chạy bằng Pyodide trong browser
- lưu tiến trình hoàn thành bài học
- gợi ý AI qua Groq
