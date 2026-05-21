import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  authMeHandler,
  checkInHandler,
  completeProgressHandler,
  createLessonHandler,
  errorFeedbackHandler,
  getCoinsHandler,
  getLeaderboardHandler,
  getStreakHandler,
  getXpHandler,
  healthHandler,
  hintHandler,
  lessonsHandler,
  loginHandler,
  logoutHandler,
  onlinePresenceStreamHandler,
  postXpHandler,
  progressHandler,
  registerHandler,
  updateAvatarHandler,
  updateSettingsHandler,
} from '../server/handlers.mjs';
import { runMigrations } from '../server/db.mjs';

const app = express();
const uploadsDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../uploads');

await runMigrations();

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
app.post('/api/lessons', createLessonHandler);

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

export default app;
