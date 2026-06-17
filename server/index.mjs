import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import { runMigrations } from './db.mjs';
import { authMeHandler, loginHandler, registerHandler, forgotPasswordHandler, verifyOtpHandler, logoutHandler, googleLoginHandler, googleCallbackHandler } from './controllers/auth.mjs';
import { lessonsHandler, createLessonHandler } from './controllers/lessons.mjs';
import { progressHandler, completeProgressHandler } from './controllers/progress.mjs';
import { updateAvatarHandler, updateSettingsHandler } from './controllers/users.mjs';
import { getXpHandler, postXpHandler, addXpHandler, getCoinsHandler, getLeaderboardHandler, getStreakHandler, checkInHandler, recordFirstSuccessHandler } from './controllers/gamification.mjs';
import { getChallengesHandler, submitChallengeHandler } from './controllers/challenges.mjs';
import { getAvatarsHandler, createAvatarHandler, getItemsHandler, createItemHandler, setActiveAvatarHandler, getUserItemsHandler, setActiveUserItemHandler, addUserItemHandler } from './controllers/admin.mjs';
import { healthHandler, onlinePresenceStreamHandler } from './controllers/system.mjs';
import { errorFeedbackHandler, hintHandler, codeReviewHandler, getChatHistoryHandler, chatHandler } from './controllers/ai.mjs';

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
app.post('/api/auth/forgot-password/verify-otp', verifyOtpHandler);
app.post('/api/auth/logout', logoutHandler);
app.get('/api/auth/google', googleLoginHandler);
app.get('/api/auth/google/callback', googleCallbackHandler);
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

// Avatar routes (admin only)
app.get('/api/avatars', getAvatarsHandler);
app.post('/api/avatars', createAvatarHandler);
app.post('/api/avatars/set-active', setActiveAvatarHandler);

// User Items routes (user inventory)
app.post('/api/user-items', addUserItemHandler);
app.post('/api/user-items/list', getUserItemsHandler);
app.post('/api/user-items/set-active', setActiveUserItemHandler);

// Item routes (admin only)
app.get('/api/items', getItemsHandler);
app.post('/api/items', createItemHandler);
app.post('/api/error-feedback', errorFeedbackHandler);
app.post('/api/hint', hintHandler);
app.post('/api/ai/review-code', codeReviewHandler);
app.get('/api/ai/chat/history', getChatHistoryHandler);
app.post('/api/ai/chat', chatHandler);
app.post('/api/lessons', createLessonHandler);

await runMigrations();

app.listen(port, () => {
  console.log(`Lessons API listening on http://localhost:${port}`);
});
