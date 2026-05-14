import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import {
  completeProgressHandler,
  createLessonHandler,
  healthHandler,
  hintHandler,
  lessonsHandler,
  progressHandler,
} from './handlers.mjs';

dotenv.config();

const app = express();
const port = Number(process.env.API_PORT || 3001);

app.use(cors());
app.use(express.json());

app.get('/api/health', healthHandler);
app.get('/api/lessons', lessonsHandler);
app.get('/api/progress/:learnerKey', progressHandler);
app.post('/api/progress/complete', completeProgressHandler);
app.post('/api/hint', hintHandler);
app.post('/api/lessons', createLessonHandler);

app.listen(port, () => {
  console.log(`Lessons API listening on http://localhost:${port}`);
});
