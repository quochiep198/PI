import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  authMeHandler,
  checkInHandler,
  completeProgressHandler,
  createLessonHandler,
  errorFeedbackHandler,
  getLeaderboardHandler,
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
  getCoinsHandler,
  getStreakHandler,
  updateAvatarHandler,
  updateSettingsHandler,
} from './handlers.mjs';
import { runMigrations } from './db.mjs';

dotenv.config();

const app = express();
const port = Number(process.env.API_PORT || 3001);
const uploadsDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../uploads');

app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);
app.use(express.json({ limit: '5mb' }));
app.use('/uploads', express.static(uploadsDir));

app.get('/api/health', healthHandler);
app.get('/api/auth/me', authMeHandler);
app.get('/api/presence/stream', onlinePresenceStreamHandler);
app.post('/api/auth/login', loginHandler);
app.post('/api/auth/register', registerHandler);
app.post('/api/auth/logout', logoutHandler);
app.post('/api/users/me/avatar', updateAvatarHandler);
app.post('/api/users/me/settings', updateSettingsHandler);
app.get('/api/lessons', lessonsHandler);
app.get('/api/progress', progressHandler);
app.post('/api/progress/complete', completeProgressHandler);
app.get('/api/xp', getXpHandler);
app.post('/api/xp', postXpHandler);
app.get('/api/coins', getCoinsHandler);
app.get('/api/leaderboard', getLeaderboardHandler);
app.get('/api/streak/:userId', getStreakHandler);
app.post('/api/streak/:userId/checkin', checkInHandler);
app.post('/api/error-feedback', errorFeedbackHandler);
app.post('/api/hint', hintHandler);
app.post('/api/lessons', createLessonHandler);

await runMigrations();

app.listen(port, () => {
  console.log(`Lessons API listening on http://localhost:${port}`);
});
