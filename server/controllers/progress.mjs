import { promisify } from 'node:util';
import { put } from '@vercel/blob';
import { execute, query } from '../db.mjs';

import {
  getLevelFromXp,
  getRequestBody,
  isProduction,
  normalizeIdentifier,
  serializeCookie,
  clearCookie,
  parseCookies,
  sendSseEvent,
  pruneExpiredPresenceLeases,
  touchPresenceLease,
  deletePresenceLease,
  getOnlineLearnerCount,
  sendPresenceUpdate,
  canAccessTrack,
  safeJsonParse,
  extractMistakeTags,
  normalizeMultilineText,
  normalizeHintCode,
  getClientIp,
  getHintEntitlement,
  getUtcDayBounds,
  getUtcDateString,
  addUtcDays,
  getUtcWeekBounds,
  buildWeekDaysFromCheckins,
  getHintIpRateLimitStatus,
  recordHintRequest,
  getHintCooldownStatus,
  markHintCooldownUsed,
  buildHintCacheKey,
  getDailyHintUsageCount,
  getDailyHintUsageCountByLesson,
  getCachedHint,
  saveCachedHint,
  recordHintUsage,
  getUserXp,
  ensureUserXp,
  hasUserClaimedLessonXp,
  addUserXp,
  ensureUserCoins,
  ensureUserStreak,
  getUserStreakData,
  getStreakAchievement,
  getStreakReward,
  getUserCoins,
  getLeaderboardEntries,
  addUserCoins,
  markFirstSuccessRun,
  hasFirstSuccessRun,
  getLessonById,
  getRecentLessonErrors,
  callGroqChat,
  isRetryableGroqError,
  generateHintWithFallback,
  analyzeLessonError,
  hashSessionToken,
  generateOtp,
  hashOtp,
  hashPassword,
  verifyPassword,
  getPasswordStrengthError,
  checkOtpRequestRateLimit,
  createPasswordResetOtp,
  sendPasswordResetOtpEmail,
  sanitizeUser,
  parseAvatarDataUrl,
  saveAvatarForUser,
  deleteExpiredSessions,
  createSession,
  getAuthenticatedUser,
  requireAuthenticatedUser,
  ensureAppSchema,
  getTodayDateString,
  seededShuffle,
  getDailySeed,
  scryptAsync,
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_MS,
  PASSWORD_RESET_GENERIC_MESSAGE,
  OTP_EXPIRY_MS,
  OTP_LENGTH,
  OTP_REQUEST_WINDOW_MS,
  OTP_REQUEST_LIMIT,
  MAX_AVATAR_BYTES,
  groqApiKey,
  groqPrimaryModel,
  groqSmallModel,
  PRO_TRACKS,
  ERROR_HISTORY_LIMIT,
  HINT_CACHE_TTL_MS,
  HINT_IP_WINDOW_MS,
  HINT_IP_LIMIT,
  HINT_DAILY_QUOTA_FREE,
  HINT_DAILY_QUOTA_PRO,
  HINT_LESSON_DAILY_QUOTA_FREE,
  HINT_LESSON_DAILY_QUOTA_PRO,
  HINT_COOLDOWN_FREE_MS,
  HINT_COOLDOWN_PRO_MS,
  HINT_MAX_TOKENS_FREE,
  HINT_MAX_TOKENS_PRO,
  HINT_TEMPERATURE,
  PRESENCE_HEARTBEAT_MS,
  PRESENCE_LEASE_MS,
  XP_LESSON_COMPLETE_FIRST,
  XP_FIRST_SUCCESS_RUN,
  XP_DAILY_CHALLENGE,
  XP_DAILY_CHALLENGE_BONUS,
  COINS_LESSON_COMPLETE,
  COINS_STREAK_BASE,
  COINS_STREAK_STEP,
  STREAK_ACHIEVEMENTS,
  LEVEL_THRESHOLDS,
  XP_SOURCES,
  GroqRequestError
} from '../utils/core.mjs';

export async function progressHandler(request, response) {
  try {
    const user = await requireAuthenticatedUser(request, response);
    if (!user) {
      return;
    }

    const progress = await query(
      `
        SELECT lesson_id AS "lessonId", lessons.track
        FROM user_lesson_progress
        INNER JOIN lessons ON lessons.id = user_lesson_progress.lesson_id
        WHERE user_id = $1
      `,
      [user.id],
    );

    response.json(progress.filter((item) => canAccessTrack(user, item.track)));
  } catch (error) {
    response.status(500).json({
      message: error instanceof Error ? error.message : 'Failed to load lesson progress.',
    });
  }
}

export async function completeProgressHandler(request, response) {
  const { lessonId } = getRequestBody(request);

  if (!lessonId) {
    response.status(400).json({
      message: 'Missing lessonId.',
    });
    return;
  }

  try {
    const user = await requireAuthenticatedUser(request, response);
    if (!user) {
      return;
    }

    const lessons = await query(
      `
        SELECT track
        FROM lessons
        WHERE id = $1
        LIMIT 1
      `,
      [lessonId],
    );

    const lesson = lessons[0];
    if (!lesson) {
      response.status(404).json({
        message: 'Lesson not found.',
      });
      return;
    }

    if (!canAccessTrack(user, lesson.track)) {
      response.status(403).json({
        message: 'This lesson is only available for Pro accounts.',
      });
      return;
    }

    const rewardRows = await query(
      `
        WITH progress_insert AS (
          INSERT INTO user_lesson_progress (user_id, lesson_id)
          VALUES ($1, $2)
          ON CONFLICT (user_id, lesson_id) DO NOTHING
          RETURNING 1
        ),
        xp_log_insert AS (
          INSERT INTO user_xp_log (user_id, xp_amount, source, lesson_id)
          SELECT $1, $3, $4, $2
          FROM progress_insert
          ON CONFLICT (user_id, source, lesson_id) DO NOTHING
          RETURNING xp_amount
        ),
        xp_upsert AS (
          INSERT INTO user_xp (user_id, total_xp)
          VALUES ($1, COALESCE((SELECT xp_amount FROM xp_log_insert), 0))
          ON CONFLICT (user_id)
          DO UPDATE SET total_xp = user_xp.total_xp + EXCLUDED.total_xp
          RETURNING total_xp
        ),
        coins_upsert AS (
          INSERT INTO user_coins (user_id, coins)
          VALUES ($1, CASE WHEN EXISTS (SELECT 1 FROM progress_insert) THEN $5 ELSE 0 END)
          ON CONFLICT (user_id)
          DO UPDATE SET coins = user_coins.coins + EXCLUDED.coins
          RETURNING coins
        )
        SELECT
          EXISTS (SELECT 1 FROM progress_insert) AS "completedNow",
          COALESCE((SELECT xp_amount FROM xp_log_insert), 0) AS "xpGranted",
          CASE WHEN EXISTS (SELECT 1 FROM progress_insert) THEN $5 ELSE 0 END AS "coinsGranted",
          COALESCE((SELECT total_xp FROM xp_upsert), 0) AS "totalXp"
      `,
      [user.id, lessonId, XP_LESSON_COMPLETE_FIRST, XP_SOURCES.LESSON_COMPLETE_FIRST, COINS_LESSON_COMPLETE],
    );

    const reward = rewardRows[0] ?? { completedNow: false, xpGranted: 0, coinsGranted: 0, totalXp: 0 };
    const totalXp = Number(reward.totalXp || 0);
    const xpData = {
      totalXp,
      ...getLevelFromXp(totalXp),
    };

    response.status(reward.completedNow ? 201 : 200).json({
      ok: true,
      xp: xpData,
      coins: Number(reward.coinsGranted || 0),
    });
  } catch (error) {
    response.status(500).json({
      message: error instanceof Error ? error.message : 'Failed to save lesson progress.',
    });
  }
}

