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

export async function updateAvatarHandler(request, response) {
  const { avatarDataUrl } = getRequestBody(request);

  if (!avatarDataUrl) {
    response.status(400).json({
      message: 'Missing avatarDataUrl.',
    });
    return;
  }

  const parsedAvatar = parseAvatarDataUrl(avatarDataUrl);
  if (!parsedAvatar) {
    response.status(400).json({
      message: 'Avatar must be a valid image under 2MB.',
    });
    return;
  }

  try {
    const user = await requireAuthenticatedUser(request, response);
    if (!user) {
      return;
    }

    const avatarUrl = await saveAvatarForUser(user.id, avatarDataUrl);

    const rows = await query(
      `
        UPDATE users
        SET avatar_url = $2
        WHERE id = $1
        RETURNING
          id,
          username,
          email,
          is_admin AS "isAdmin",
          is_pro AS "isPro",
          avatar_url AS "avatarUrl",
          theme,
          profile_visible AS "profileVisible",
          email_notifications AS "emailNotifications",
          music_enabled AS "musicEnabled",
          sound_volume AS "soundVolume"
      `,
      [user.id, avatarUrl],
    );

    response.json({
      user: sanitizeUser(rows[0]),
    });
  } catch (error) {
    response.status(500).json({
      message: error instanceof Error ? error.message : 'Failed to update avatar.',
    });
  }
}

export async function updateSettingsHandler(request, response) {
  const {
    username,
    email,
    avatarDataUrl,
    currentPassword,
    newPassword,
    theme,
    profileVisible,
    emailNotifications,
    musicEnabled,
    soundVolume,
  } = getRequestBody(request);

  try {
    const user = await requireAuthenticatedUser(request, response);
    if (!user) {
      return;
    }

    const normalizedUsername = normalizeIdentifier(username || user.username);
    const normalizedEmail = normalizeIdentifier(email || user.email);

    if (!normalizedUsername || !normalizedEmail) {
      response.status(400).json({
        message: 'Ten hien thi va email khong duoc de trong.',
      });
      return;
    }

    const existingUsers = await query(
      `
        SELECT id
        FROM users
        WHERE (username = $1 OR email = $2)
          AND id <> $3
        LIMIT 1
      `,
      [normalizedUsername, normalizedEmail, user.id],
    );

    if (existingUsers.length > 0) {
      response.status(409).json({
        message: 'Ten hien thi hoac email da duoc su dung.',
      });
      return;
    }

    let avatarUrl = user.avatarUrl ?? null;

    if (avatarDataUrl) {
      avatarUrl = await saveAvatarForUser(user.id, avatarDataUrl);
    }

    let nextPasswordHash = null;
    const trimmedNewPassword = String(newPassword || '');
    const trimmedCurrentPassword = String(currentPassword || '');

    if (trimmedNewPassword) {
      if (trimmedNewPassword.length < 8) {
        response.status(400).json({
          message: 'Mat khau moi phai co it nhat 8 ky tu.',
        });
        return;
      }

      if (!trimmedCurrentPassword) {
        response.status(400).json({
          message: 'Can nhap mat khau hien tai de doi mat khau.',
        });
        return;
      }

      const passwordRows = await query(
        `
          SELECT password_hash AS "passwordHash"
          FROM users
          WHERE id = $1
          LIMIT 1
        `,
        [user.id],
      );

      const passwordHash = passwordRows[0]?.passwordHash;
      const isValid = passwordHash
        ? await verifyPassword(trimmedCurrentPassword, passwordHash)
        : false;

      if (!isValid) {
        response.status(401).json({
          message: 'Mat khau hien tai khong dung.',
        });
        return;
      }

      nextPasswordHash = await hashPassword(trimmedNewPassword);
    }

    const normalizedTheme = theme === 'dark' ? 'dark' : 'light';
    const normalizedProfileVisible = typeof profileVisible === 'boolean' ? profileVisible : user.profileVisible ?? true;
    const normalizedEmailNotifications = typeof emailNotifications === 'boolean' ? emailNotifications : user.emailNotifications ?? false;
    const normalizedMusicEnabled = typeof musicEnabled === 'boolean' ? musicEnabled : user.musicEnabled ?? true;
    const normalizedSoundVolume = Number.isFinite(Number(soundVolume))
      ? Math.min(100, Math.max(0, Number(soundVolume)))
      : user.soundVolume ?? 80;

    const rows = await query(
      `
        UPDATE users
        SET
          username = $2,
          email = $3,
          avatar_url = $4,
          theme = $5,
          profile_visible = $6,
          email_notifications = $7,
          music_enabled = $8,
          sound_volume = $9,
          password_hash = COALESCE($10, password_hash)
        WHERE id = $1
        RETURNING
          id,
          username,
          email,
          is_admin AS "isAdmin",
          is_pro AS "isPro",
          avatar_url AS "avatarUrl",
          theme,
          profile_visible AS "profileVisible",
          email_notifications AS "emailNotifications",
          music_enabled AS "musicEnabled",
          sound_volume AS "soundVolume"
      `,
      [
        user.id,
        normalizedUsername,
        normalizedEmail,
        avatarUrl,
        normalizedTheme,
        normalizedProfileVisible,
        normalizedEmailNotifications,
        normalizedMusicEnabled,
        normalizedSoundVolume,
        nextPasswordHash,
      ],
    );

    response.json({
      user: sanitizeUser(rows[0]),
    });
  } catch (error) {
    response.status(500).json({
      message: error instanceof Error ? error.message : 'Failed to save settings.',
    });
  }
}

