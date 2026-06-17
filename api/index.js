import express from 'express';
import cors from 'cors';
import { runMigrations } from '../server/db.mjs';
import { authMeHandler, loginHandler, registerHandler, forgotPasswordHandler, verifyOtpHandler, logoutHandler } from '../server/controllers/auth.mjs';
import { lessonsHandler, createLessonHandler } from '../server/controllers/lessons.mjs';
import { progressHandler, completeProgressHandler } from '../server/controllers/progress.mjs';
import { updateAvatarHandler, updateSettingsHandler } from '../server/controllers/users.mjs';
import { getXpHandler, postXpHandler, addXpHandler, getCoinsHandler, getLeaderboardHandler, getStreakHandler, checkInHandler, recordFirstSuccessHandler } from '../server/controllers/gamification.mjs';
import { getChallengesHandler, submitChallengeHandler } from '../server/controllers/challenges.mjs';
import { getAvatarsHandler, createAvatarHandler, getItemsHandler, createItemHandler, setActiveAvatarHandler, getUserItemsHandler, setActiveUserItemHandler, addUserItemHandler } from '../server/controllers/admin.mjs';
import { healthHandler, onlinePresenceStreamHandler } from '../server/controllers/system.mjs';
import { errorFeedbackHandler, hintHandler, codeReviewHandler, getChatHistoryHandler, chatHandler } from '../server/controllers/ai.mjs';

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

// Avatar routes (admin only)
app.get('/api/avatars', getAvatarsHandler);
app.post('/api/avatars', createAvatarHandler);
app.post('/api/avatars/set-active', setActiveAvatarHandler);

// Item routes (admin only)
app.get('/api/items', getItemsHandler);
app.post('/api/items', createItemHandler);

// User Items routes (user inventory)
app.post('/api/user-items', addUserItemHandler);
app.post('/api/user-items/list', getUserItemsHandler);
app.post('/api/user-items/set-active', setActiveUserItemHandler);


app.post('/api/ai/review-code', codeReviewHandler);
app.get('/api/ai/chat/history', getChatHistoryHandler);
app.post('/api/ai/chat', chatHandler);

export default app;
