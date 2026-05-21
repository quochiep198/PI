import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import {
  authMeHandler,
  checkInHandler,
  completeProgressHandler,
  createLessonHandler,
  errorFeedbackHandler,
  forgotPasswordHandler,
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
  resetPasswordHandler,
  postXpHandler,
  getCoinsHandler,
  getStreakHandler,
  updateAvatarHandler,
  updateSettingsHandler,
  getChallengesHandler,
  submitChallengeHandler,
} from './handlers.mjs';
import { runMigrations } from './db.mjs';

dotenv.config();

const app = express();
const port = Number(process.env.API_PORT || 3001);

app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);
app.use(express.json({ limit: '5mb' }));

app.get('/api/health', healthHandler);
app.get('/api/auth/me', authMeHandler);
app.get('/api/presence/stream', onlinePresenceStreamHandler);
app.post('/api/auth/login', loginHandler);
app.post('/api/auth/register', registerHandler);
app.post('/api/auth/forgot-password', forgotPasswordHandler);
app.post('/api/auth/reset-password', resetPasswordHandler);
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
app.get('/api/challenges', getChallengesHandler);
app.post('/api/challenges/submit', submitChallengeHandler);
app.post('/api/error-feedback', errorFeedbackHandler);
app.post('/api/hint', hintHandler);
app.post('/api/lessons', createLessonHandler);

await runMigrations();

app.listen(port, () => {
  console.log(`Lessons API listening on http://localhost:${port}`);
});
