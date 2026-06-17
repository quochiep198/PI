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

export async function googleLoginHandler(request, response) {
  const clientHint = process.env.GOOGLE_CLIENT_ID;
  if (!clientHint) {
    response.status(500).json({
      message: 'GOOGLE_CLIENT_ID is not configured on the server.',
    });
    return;
  }

  const callbackUrl = process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3001/api/auth/google/callback';
  const rootUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
  const options = {
    redirect_uri: callbackUrl,
    client_id: clientHint,
    access_type: 'offline',
    response_type: 'code',
    prompt: 'consent',
    scope: [
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email'
    ].join(' '),
  };

  const googleAuthUrl = `${rootUrl}?${new URLSearchParams(options).toString()}`;
  response.redirect(googleAuthUrl);
}

export async function googleCallbackHandler(request, response) {
  const code = request.query.code;
  if (!code) {
    response.redirect('/login?error=no_authorization_code');
    return;
  }

  const clientHint = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const callbackUrl = process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3001/api/auth/google/callback';

  if (!clientHint || !clientSecret) {
    response.status(500).json({
      message: 'Google OAuth credentials are not configured on the server.',
    });
    return;
  }

  try {
    // 1. Exchange auth code for tokens
    const tokenUrl = 'https://oauth2.googleapis.com/token';
    const values = {
      code,
      client_id: clientHint,
      client_secret: clientSecret,
      redirect_uri: callbackUrl,
      grant_type: 'authorization_code',
    };

    const tokenRes = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(values),
    });

    if (!tokenRes.ok) {
      const errorText = await tokenRes.text();
      console.error('Failed to exchange code for tokens:', errorText);
      response.redirect('/login?error=token_exchange_failed');
      return;
    }

    const tokenData = await tokenRes.json();
    const { access_token, id_token } = tokenData;

    // 2. Fetch user profile info
    const googleUserRes = await fetch(
      `https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${access_token}`,
      {
        headers: {
          Authorization: `Bearer ${id_token}`,
        },
      }
    );

    if (!googleUserRes.ok) {
      const errorText = await googleUserRes.text();
      console.error('Failed to fetch Google user info:', errorText);
      response.redirect('/login?error=userinfo_fetch_failed');
      return;
    }

    const googleUser = await googleUserRes.json();
    const email = normalizeIdentifier(googleUser.email);
    if (!email) {
      response.redirect('/login?error=invalid_google_email');
      return;
    }

    // 3. Check existing user
    const users = await query(
      `
        SELECT id, username, email, is_admin AS "isAdmin", is_pro AS "isPro", avatar_url AS "avatarUrl"
        FROM users
        WHERE email = $1
        LIMIT 1
      `,
      [email],
    );

    let userRecord = users[0];

    if (userRecord) {
      // User exists, optionally update avatar if they don't have one
      if (!userRecord.avatarUrl && googleUser.picture) {
        await execute(
          `
            UPDATE users
            SET avatar_url = $2
            WHERE id = $1
          `,
          [userRecord.id, googleUser.picture],
        );
        userRecord.avatarUrl = googleUser.picture;
      }
    } else {
      // User does not exist, auto-register
      // Generate a unique username
      let baseUsername = email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '_');
      if (baseUsername.length < 3) {
        baseUsername = 'user_' + baseUsername;
      }
      let finalUsername = baseUsername;
      let isUnique = false;
      let suffixAttempts = 0;

      while (!isUnique && suffixAttempts < 10) {
        const check = await query(`SELECT id FROM users WHERE username = $1 LIMIT 1`, [finalUsername]);
        if (check.length === 0) {
          isUnique = true;
        } else {
          finalUsername = `${baseUsername}_${Math.floor(1000 + Math.random() * 9000)}`;
          suffixAttempts += 1;
        }
      }

      if (!isUnique) {
        finalUsername = `${baseUsername}_${Date.now()}`;
      }

      // Generate a random password hash for scrypt compatibility since column is NOT NULL
      const randomPass = 'google-oauth-locked-' + Math.random().toString(36).slice(2) + Date.now().toString(36);
      const passwordHash = await hashPassword(randomPass);

      const newUserRows = await query(
        `
          INSERT INTO users (username, email, password_hash, avatar_url)
          VALUES ($1, $2, $3, $4)
          RETURNING id, username, email, is_admin AS "isAdmin", is_pro AS "isPro", avatar_url AS "avatarUrl"
        `,
        [finalUsername, email, passwordHash, googleUser.picture || null],
      );
      userRecord = newUserRows[0];
    }

    // 4. Clean user data and start session
    const user = sanitizeUser(userRecord);
    const sessionToken = await createSession(user.id);

    response.setHeader('Set-Cookie', serializeCookie(SESSION_COOKIE_NAME, sessionToken, SESSION_MAX_AGE_MS));
    response.redirect('/');
  } catch (error) {
    console.error('Google OAuth callback error:', error);
    response.redirect('/login?error=google_auth_exception');
  }
}

