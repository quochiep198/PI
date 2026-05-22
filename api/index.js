import express from 'express';
import cors from 'cors';
import {
  authMeHandler,
  checkInHandler,
  completeProgressHandler,
  createLessonHandler,
  errorFeedbackHandler,
  forgotPasswordHandler,
  getChallengesHandler,
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
  submitChallengeHandler,
  updateAvatarHandler,
  updateSettingsHandler,
  verifyOtpHandler,
} from '../server/handlers.mjs';
import { runMigrations } from '../server/db.mjs';

const app = express();

await runMigrations();

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
app.post('/api/auth/forgot-password/verify-otp', verifyOtpHandler);
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

// Challenge routes
app.get('/api/challenges', getChallengesHandler);
app.post('/api/challenges/submit', submitChallengeHandler);

export default app;
