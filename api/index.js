import express from 'express';
import cors from 'cors';
import {
  authMeHandler,
  completeProgressHandler,
  createLessonHandler,
  errorFeedbackHandler,
  getXpHandler,
  hintHandler,
  lessonsHandler,
  loginHandler,
  logoutHandler,
  postXpHandler,
  progressHandler,
  registerHandler,
} from '../server/handlers.mjs';

const app = express();

app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);
app.use(express.json());

app.get('/api/health', authMeHandler);

app.get('/api/auth/me', authMeHandler);
app.post('/api/auth/login', loginHandler);
app.post('/api/auth/register', registerHandler);
app.post('/api/auth/logout', logoutHandler);

app.get('/api/lessons', lessonsHandler);
app.post('/api/lessons', createLessonHandler);

app.get('/api/progress', progressHandler);
app.post('/api/progress/complete', completeProgressHandler);

app.get('/api/xp', getXpHandler);
app.post('/api/xp', postXpHandler);

app.post('/api/error-feedback', errorFeedbackHandler);
app.post('/api/hint', hintHandler);

export default app;