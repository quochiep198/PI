import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import {
  authMeHandler,
  completeProgressHandler,
  createLessonHandler,
  errorFeedbackHandler,
  getXpHandler,
  healthHandler,
  hintHandler,
  lessonsHandler,
  loginHandler,
  onlinePresenceStreamHandler,
  logoutHandler,
  progressHandler,
  registerHandler,
  postXpHandler,
} from './handlers.mjs';
import { ensureAppSchema } from './db.mjs';

dotenv.config();

const app = express();
const port = Number(process.env.API_PORT || 3001);

app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);
app.use(express.json());

app.get('/api/health', healthHandler);
app.get('/api/auth/me', authMeHandler);
app.get('/api/presence/stream', onlinePresenceStreamHandler);
app.post('/api/auth/login', loginHandler);
app.post('/api/auth/register', registerHandler);
app.post('/api/auth/logout', logoutHandler);
app.get('/api/lessons', lessonsHandler);
app.get('/api/progress', progressHandler);
app.post('/api/progress/complete', completeProgressHandler);
app.get('/api/xp', getXpHandler);
app.post('/api/xp', postXpHandler);
app.post('/api/error-feedback', errorFeedbackHandler);
app.post('/api/hint', hintHandler);
app.post('/api/lessons', createLessonHandler);

await ensureAppSchema();

app.listen(port, () => {
  console.log(`Lessons API listening on http://localhost:${port}`);
});
