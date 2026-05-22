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

export async function lessonsHandler(request, response) {
  try {
    const user = await requireAuthenticatedUser(request, response);
    if (!user) {
      return;
    }

    const lessons = await query(`
      SELECT
        id,
        slug,
        track,
        lesson_order AS "lessonOrder",
        chapter,
        title,
        description,
        objective,
        starter_code AS "starterCode",
        completion_check_type AS "completionCheckType",
        completion_check_value AS "completionCheckValue"
      FROM lessons
      ORDER BY lesson_order ASC
    `);

    response.json(lessons.filter((lesson) => canAccessTrack(user, lesson.track)));
  } catch (error) {
    response.status(500).json({
      message: error instanceof Error ? error.message : 'Failed to load lessons.',
    });
  }
}

export async function createLessonHandler(request, response) {
  const {
    slug,
    track,
    lessonOrder,
    chapter,
    title,
    description,
    objective,
    starterCode,
    completionCheckType,
    completionCheckValue,
  } = getRequestBody(request);

  if (
    !slug ||
    !track ||
    !lessonOrder ||
    !chapter ||
    !title ||
    !description ||
    !objective ||
    !starterCode ||
    !completionCheckType ||
    !completionCheckValue
  ) {
    response.status(400).json({
      message: 'Missing required lesson fields.',
    });
    return;
  }

  try {
    const result = await query(
      `
        INSERT INTO lessons (
          slug,
          track,
          lesson_order,
          chapter,
          title,
          description,
          objective,
          starter_code,
          completion_check_type,
          completion_check_value
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING
          id,
          slug,
          track,
          lesson_order AS "lessonOrder",
          chapter,
          title,
          description,
          objective,
          starter_code AS "starterCode",
          completion_check_type AS "completionCheckType",
          completion_check_value AS "completionCheckValue"
      `,
      [
        slug,
        track,
        lessonOrder,
        chapter,
        title,
        description,
        objective,
        starterCode,
        completionCheckType,
        completionCheckValue,
      ],
    );

    response.status(201).json(result[0]);
  } catch (error) {
    response.status(500).json({
      message: error instanceof Error ? error.message : 'Failed to create lesson.',
    });
  }
}

