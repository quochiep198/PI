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

export async function authMeHandler(request, response) {
  try {
    const user = await getAuthenticatedUser(request);
    response.json({
      authenticated: Boolean(user),
      user,
    });
  } catch (error) {
    response.status(500).json({
      message: error instanceof Error ? error.message : 'Failed to load auth session.',
    });
  }
}

export async function loginHandler(request, response) {
  const { identifier, password } = getRequestBody(request);
  const normalizedIdentifier = normalizeIdentifier(identifier);
  const rawPassword = String(password || '');

  if (!normalizedIdentifier || !rawPassword) {
    response.status(400).json({
      message: 'Identifier and password are required.',
    });
    return;
  }

  try {
    const users = await query(
      `
        SELECT id, username, email, is_admin AS "isAdmin", is_pro AS "isPro", avatar_url AS "avatarUrl", password_hash AS "passwordHash"
        FROM users
        WHERE username = $1 OR email = $1
        LIMIT 1
      `,
      [normalizedIdentifier],
    );

    const userRecord = users[0];
    const isValid = userRecord ? await verifyPassword(rawPassword, userRecord.passwordHash) : false;

    if (!userRecord || !isValid) {
      response.status(401).json({
        message: 'Thông tin đăng nhập không hợp lệ.',
      });
      return;
    }

    const user = sanitizeUser(userRecord);
    const sessionToken = await createSession(user.id);

    response.setHeader('Set-Cookie', serializeCookie(SESSION_COOKIE_NAME, sessionToken, SESSION_MAX_AGE_MS));
    response.json({
      user,
    });
  } catch (error) {
    response.status(500).json({
      message: error instanceof Error ? error.message : 'Failed to log in.',
    });
  }
}

export async function registerHandler(request, response) {
  const { username, email, password } = getRequestBody(request);
  const normalizedUsername = normalizeIdentifier(username);
  const normalizedEmail = normalizeIdentifier(email);
  const rawPassword = String(password || '');

  if (!normalizedUsername || !normalizedEmail || rawPassword.length < 8) {
    response.status(400).json({
      message: 'Username, email, and a password of at least 8 characters are required.',
    });
    return;
  }

  try {
    const existingUsers = await query(
      `
        SELECT id
        FROM users
        WHERE username = $1 OR email = $2
        LIMIT 1
      `,
      [normalizedUsername, normalizedEmail],
    );

    if (existingUsers.length > 0) {
      response.status(409).json({
        message: 'Username or email already exists.',
      });
      return;
    }

    const passwordHash = await hashPassword(rawPassword);
    const users = await query(
      `
        INSERT INTO users (username, email, password_hash)
        VALUES ($1, $2, $3)
        RETURNING id, username, email, is_admin AS "isAdmin", is_pro AS "isPro", avatar_url AS "avatarUrl"
      `,
      [normalizedUsername, normalizedEmail, passwordHash],
    );

    const user = sanitizeUser(users[0]);
    const sessionToken = await createSession(user.id);

    response.setHeader('Set-Cookie', serializeCookie(SESSION_COOKIE_NAME, sessionToken, SESSION_MAX_AGE_MS));
    response.status(201).json({
      user,
    });
  } catch (error) {
    response.status(500).json({
      message: error instanceof Error ? error.message : 'Failed to register user.',
    });
  }
}

export async function forgotPasswordHandler(request, response) {
  const { email, identifier } = getRequestBody(request);
  const inputEmail = email || identifier;
  const normalizedEmail = normalizeIdentifier(inputEmail);

  if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    response.status(400).json({
      message: 'Vui lòng nhập địa chỉ email hợp lệ.',
    });
    return;
  }

  try {
    const isRateLimited = await checkOtpRequestRateLimit(normalizedEmail);
    if (isRateLimited) {
      response.status(429).json({
        message: 'Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau 1 phút.',
      });
      return;
    }

    const users = await query(
      `
        SELECT id, username, email
        FROM users
        WHERE email = $1
        LIMIT 1
      `,
      [normalizedEmail],
    );

    const user = users[0];
    let previewOtp = null;

    if (user) {
      try {
        const { otp } = await createPasswordResetOtp(user.id);

        const sent = await sendPasswordResetOtpEmail({
          email: user.email,
          username: user.username,
          otp,
        });

        if (!sent && !isProduction()) {
          console.warn(`Password reset OTP email not configured. Preview OTP for ${user.email}: ${otp}`);
          previewOtp = otp;
        }
      } catch (error) {
        console.error(error instanceof Error ? error.message : 'Failed to create OTP or send email.');
      }
    }

    response.json({
      message: PASSWORD_RESET_GENERIC_MESSAGE,
      previewOtp: !isProduction() ? previewOtp : undefined,
    });
  } catch (error) {
    response.status(500).json({
      message: error instanceof Error ? error.message : 'Failed to process password reset request.',
    });
  }
}

export async function verifyOtpHandler(request, response) {
  const { email, identifier, otp, password, confirmPassword } = getRequestBody(request);
  const inputEmail = email || identifier;
  const normalizedEmail = normalizeIdentifier(inputEmail);
  const rawOtp = String(otp || '').trim();
  const rawPassword = String(password || '');
  const rawConfirmPassword = String(confirmPassword || '');

  if (!normalizedEmail || !rawOtp) {
    response.status(400).json({
      message: 'Email và mã xác thực là bắt buộc.',
    });
    return;
  }

  const passwordStrengthError = getPasswordStrengthError(rawPassword);
  if (passwordStrengthError) {
    response.status(400).json({
      message: passwordStrengthError,
    });
    return;
  }

  if (rawPassword !== rawConfirmPassword) {
    response.status(400).json({
      message: 'Mật khẩu xác nhận chưa khớp.',
    });
    return;
  }

  try {
    const otpHash = hashOtp(rawOtp);
    const rows = await query(
      `
        SELECT
          password_reset_otps.id,
          password_reset_otps.user_id AS "userId",
          users.password_hash AS "passwordHash"
        FROM password_reset_otps
        INNER JOIN users ON users.id = password_reset_otps.user_id
        WHERE password_reset_otps.otp_hash = $1
          AND users.email = $2
          AND password_reset_otps.used_at IS NULL
          AND password_reset_otps.expires_at > CURRENT_TIMESTAMP
        ORDER BY password_reset_otps.created_at DESC
        LIMIT 1
      `,
      [otpHash, normalizedEmail],
    );

    const otpRecord = rows[0];
    if (!otpRecord) {
      response.status(400).json({
        message: 'Mã xác thực không hợp lệ hoặc đã hết hạn.',
      });
      return;
    }

    const isSameAsCurrentPassword = await verifyPassword(rawPassword, otpRecord.passwordHash);
    if (isSameAsCurrentPassword) {
      response.status(400).json({
        message: 'Mật khẩu mới không được trùng với mật khẩu cũ.',
      });
      return;
    }

    const nextPasswordHash = await hashPassword(rawPassword);

    await execute(
      `
        UPDATE users
        SET password_hash = $2
        WHERE id = $1
      `,
      [otpRecord.userId, nextPasswordHash],
    );

    await execute(
      `
        UPDATE password_reset_otps
        SET used_at = CURRENT_TIMESTAMP
        WHERE user_id = $1
          AND used_at IS NULL
      `,
      [otpRecord.userId],
    );

    await execute(
      `
        DELETE FROM user_sessions
        WHERE user_id = $1
      `,
      [otpRecord.userId],
    );

    response.json({
      message: 'Đổi mật khẩu thành công.',
    });
  } catch (error) {
    response.status(500).json({
      message: error instanceof Error ? error.message : 'Failed to reset password.',
    });
  }
}

export async function logoutHandler(request, response) {
  try {
    const cookies = parseCookies(request);
    const sessionToken = cookies[SESSION_COOKIE_NAME];

    if (sessionToken) {
      await execute(
        `
          DELETE FROM user_sessions
          WHERE session_token_hash = $1
        `,
        [hashSessionToken(sessionToken)],
      );
    }

    response.setHeader('Set-Cookie', clearCookie(SESSION_COOKIE_NAME));
    response.status(204).send();
  } catch (error) {
    response.status(500).json({
      message: error instanceof Error ? error.message : 'Failed to log out.',
    });
  }
}

