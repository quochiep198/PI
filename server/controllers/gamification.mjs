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

export async function getXpHandler(request, response) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      response.status(401).json({ message: 'Authentication required.' });
      return;
    }

    const xpData = await getUserXp(user.id);
    response.json(xpData);
  } catch (error) {
    response.status(500).json({
      message: error instanceof Error ? error.message : 'Failed to load XP.',
    });
  }
}

export async function postXpHandler(request, response) {
  const { source } = getRequestBody(request);
  if (source === 'first_success_run') {
    return recordFirstSuccessHandler(request, response);
  }
  return addXpHandler(request, response);
}

export async function addXpHandler(request, response) {
  const { xp, source, lessonId } = getRequestBody(request);
  const xpAmount = Number(xp);

  if (!xpAmount || xpAmount <= 0) {
    response.status(400).json({ message: 'Invalid XP amount.' });
    return;
  }

  if (!Object.values(XP_SOURCES).includes(source)) {
    response.status(400).json({ message: 'Invalid XP source.' });
    return;
  }

  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      response.status(401).json({ message: 'Authentication required.' });
      return;
    }

    const resultRows = await query(
      lessonId
        ? `
            WITH previous_xp AS (
              SELECT COALESCE((SELECT total_xp FROM user_xp WHERE user_id = $1), 0) AS total_xp
            ),
            xp_log_insert AS (
              INSERT INTO user_xp_log (user_id, xp_amount, source, lesson_id)
              VALUES ($1, $2, $3, $4)
              ON CONFLICT (user_id, source, lesson_id) DO NOTHING
              RETURNING xp_amount
            ),
            xp_upsert AS (
              INSERT INTO user_xp (user_id, total_xp)
              VALUES ($1, COALESCE((SELECT xp_amount FROM xp_log_insert), 0))
              ON CONFLICT (user_id)
              DO UPDATE SET total_xp = user_xp.total_xp + EXCLUDED.total_xp
              RETURNING total_xp
            )
            SELECT
              (SELECT total_xp FROM previous_xp) AS "oldTotalXp",
              COALESCE((SELECT xp_amount FROM xp_log_insert), 0) AS "xpGranted",
              COALESCE((SELECT total_xp FROM xp_upsert), 0) AS "newTotalXp"
          `
        : `
            WITH previous_xp AS (
              SELECT COALESCE((SELECT total_xp FROM user_xp WHERE user_id = $1), 0) AS total_xp
            ),
            xp_log_insert AS (
              INSERT INTO user_xp_log (user_id, xp_amount, source, lesson_id)
              VALUES ($1, $2, $3, NULL)
              RETURNING xp_amount
            ),
            xp_upsert AS (
              INSERT INTO user_xp (user_id, total_xp)
              VALUES ($1, COALESCE((SELECT xp_amount FROM xp_log_insert), 0))
              ON CONFLICT (user_id)
              DO UPDATE SET total_xp = user_xp.total_xp + EXCLUDED.total_xp
              RETURNING total_xp
            )
            SELECT
              (SELECT total_xp FROM previous_xp) AS "oldTotalXp",
              COALESCE((SELECT xp_amount FROM xp_log_insert), 0) AS "xpGranted",
              COALESCE((SELECT total_xp FROM xp_upsert), 0) AS "newTotalXp"
          `,
      lessonId ? [user.id, xpAmount, source, lessonId] : [user.id, xpAmount, source],
    );

    const result = resultRows[0] ?? { oldTotalXp: 0, xpGranted: 0, newTotalXp: 0 };
    const oldTotalXp = Number(result.oldTotalXp || 0);
    const xpGranted = Number(result.xpGranted || 0);
    const newTotalXp = Number(result.newTotalXp || 0);
    const newXpData = {
      totalXp: newTotalXp,
      ...getLevelFromXp(newTotalXp),
    };

    if (lessonId && xpGranted === 0) {
      response.json({
        message: 'XP already claimed for this lesson.',
        totalXp: newTotalXp,
      });
      return;
    }

    response.json({
      xpAdded: xpGranted,
      totalXp: newXpData.totalXp,
      oldLevel: getLevelFromXp(oldTotalXp).level,
      newLevel: newXpData.level,
      leveledUp: newXpData.level > getLevelFromXp(oldTotalXp).level,
      ...newXpData,
    });
  } catch (error) {
    response.status(500).json({
      message: error instanceof Error ? error.message : 'Failed to add XP.',
    });
  }
}

export async function getCoinsHandler(request, response) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      response.status(401).json({ message: 'Authentication required.' });
      return;
    }

    await ensureUserCoins(user.id);
    const coins = await getUserCoins(user.id);
    response.json({ coins });
  } catch (error) {
    response.status(500).json({
      message: error instanceof Error ? error.message : 'Failed to load coins.',
    });
  }
}

export async function getLeaderboardHandler(request, response) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      response.status(401).json({ message: 'Authentication required.' });
      return;
    }

    const entries = await getLeaderboardEntries(user.id);
    const topEntries = entries
      .filter((entry) => entry.rank <= 3)
      .slice(0, 3)
      .map((entry) => ({ ...entry, isCurrentUser: false }));
    const currentUserEntry = entries.find((entry) => entry.id === user.id) ?? null;

    response.json({
      topEntries,
      currentUserEntry,
      currentUserId: user.id,
    });
  } catch (error) {
    response.status(500).json({
      message: error instanceof Error ? error.message : 'Failed to load leaderboard.',
    });
  }
}

export async function getStreakHandler(request, response) {
  const requestedUserId = Number(request.params?.userId);

  if (!Number.isInteger(requestedUserId) || requestedUserId <= 0) {
    response.status(400).json({ message: 'Invalid user id.' });
    return;
  }

  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      response.status(401).json({ message: 'Authentication required.' });
      return;
    }

    if (user.id !== requestedUserId) {
      response.status(403).json({ message: 'You can only access your own streak.' });
      return;
    }

    const streakData = await getUserStreakData(user.id);
    response.json(streakData);
  } catch (error) {
    response.status(500).json({
      message: error instanceof Error ? error.message : 'Failed to load streak data.',
    });
  }
}

export async function checkInHandler(request, response) {
  const requestedUserId = Number(request.params?.userId);

  if (!Number.isInteger(requestedUserId) || requestedUserId <= 0) {
    response.status(400).json({ message: 'Invalid user id.' });
    return;
  }

  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      response.status(401).json({ message: 'Authentication required.' });
      return;
    }

    if (user.id !== requestedUserId) {
      response.status(403).json({ message: 'You can only check in for your own account.' });
      return;
    }

    await ensureUserStreak(user.id);
    await ensureUserCoins(user.id);

    const todayDate = getUtcDateString();
    const yesterdayDate = addUtcDays(todayDate, -1);

    const resultRows = await query(
      `
        WITH streak_row AS (
          SELECT
            current_streak,
            longest_streak,
            total_check_ins,
            last_check_in_date
          FROM user_streaks
          WHERE user_id = $1
        ),
        checkin_insert AS (
          INSERT INTO user_streak_checkins (user_id, check_in_date, reward_coins)
          VALUES ($1, $2::date, 0)
          ON CONFLICT (user_id, check_in_date) DO NOTHING
          RETURNING 1
        ),
        streak_values AS (
          SELECT
            CASE
              WHEN (SELECT COUNT(*) FROM checkin_insert) = 0 THEN COALESCE((SELECT current_streak FROM streak_row), 0)
              WHEN (SELECT last_check_in_date FROM streak_row) = $3::date THEN COALESCE((SELECT current_streak FROM streak_row), 0) + 1
              ELSE 1
            END AS new_current_streak,
            GREATEST(
              COALESCE((SELECT longest_streak FROM streak_row), 0),
              CASE
                WHEN (SELECT COUNT(*) FROM checkin_insert) = 0 THEN COALESCE((SELECT current_streak FROM streak_row), 0)
                WHEN (SELECT last_check_in_date FROM streak_row) = $3::date THEN COALESCE((SELECT current_streak FROM streak_row), 0) + 1
                ELSE 1
              END
            ) AS new_longest_streak,
            CASE
              WHEN (SELECT COUNT(*) FROM checkin_insert) = 0 THEN COALESCE((SELECT total_check_ins FROM streak_row), 0)
              ELSE COALESCE((SELECT total_check_ins FROM streak_row), 0) + 1
            END AS new_total_check_ins,
            CASE
              WHEN (SELECT COUNT(*) FROM checkin_insert) = 0 THEN 0
              ELSE $4 + (
                CASE
                  WHEN (SELECT last_check_in_date FROM streak_row) = $3::date THEN (COALESCE((SELECT current_streak FROM streak_row), 0) + 1) * $5
                  ELSE $5
                END
              )
            END AS reward_coins
        ),
        streak_update AS (
          UPDATE user_streaks
          SET
            current_streak = (SELECT new_current_streak FROM streak_values),
            longest_streak = (SELECT new_longest_streak FROM streak_values),
            total_check_ins = (SELECT new_total_check_ins FROM streak_values),
            last_check_in_date = CASE
              WHEN (SELECT COUNT(*) FROM checkin_insert) = 0 THEN last_check_in_date
              ELSE $2::date
            END,
            updated_at = CURRENT_TIMESTAMP
          WHERE user_id = $1
          RETURNING
            current_streak AS "currentStreak",
            longest_streak AS "longestStreak",
            total_check_ins AS "totalCheckIns",
            last_check_in_date::text AS "lastCheckIn"
        ),
        coins_upsert AS (
          INSERT INTO user_coins (user_id, coins)
          VALUES ($1, (SELECT reward_coins FROM streak_values))
          ON CONFLICT (user_id)
          DO UPDATE SET coins = user_coins.coins + EXCLUDED.coins
          RETURNING coins
        ),
        checkin_reward_update AS (
          UPDATE user_streak_checkins
          SET reward_coins = (SELECT reward_coins FROM streak_values)
          WHERE user_id = $1
            AND check_in_date = $2::date
            AND EXISTS (SELECT 1 FROM checkin_insert)
          RETURNING reward_coins
        )
        SELECT
          EXISTS (SELECT 1 FROM checkin_insert) AS success,
          COALESCE((SELECT "currentStreak" FROM streak_update), 0) AS "currentStreak",
          COALESCE((SELECT "longestStreak" FROM streak_update), 0) AS "longestStreak",
          COALESCE((SELECT "totalCheckIns" FROM streak_update), 0) AS "totalCheckIns",
          (SELECT "lastCheckIn" FROM streak_update) AS "lastCheckIn",
          COALESCE((SELECT reward_coins FROM streak_values), 0) AS reward,
          COALESCE((SELECT coins FROM coins_upsert), 0) AS "totalCoins"
      `,
      [user.id, todayDate, yesterdayDate, COINS_STREAK_BASE, COINS_STREAK_STEP],
    );

    const result = resultRows[0];
    const success = Boolean(result?.success);
    const currentStreak = Number(result?.currentStreak || 0);
    const reward = success ? getStreakReward(currentStreak) : 0;

    const streakData = await getUserStreakData(user.id);
    const totalCoins = Number(result?.totalCoins || 0);

    response.status(success ? 201 : 200).json({
      success,
      newStreak: currentStreak,
      reward,
      achievement: success ? getStreakAchievement(currentStreak) : undefined,
      message: success ? `+${reward} coins! Tiếp tục giữ vững phong độ!` : 'Bạn đã check-in hôm nay rồi!',
      totalCoins: Number(totalCoins || 0),
      streakData,
    });
  } catch (error) {
    response.status(500).json({
      message: error instanceof Error ? error.message : 'Failed to check in.',
    });
  }
}

export async function recordFirstSuccessHandler(request, response) {
  const { lessonId } = getRequestBody(request);

  if (!lessonId) {
    response.status(400).json({ message: 'Missing lessonId.' });
    return;
  }

  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      response.status(401).json({ message: 'Authentication required.' });
      return;
    }

    const resultRows = await query(
      `
        WITH first_success_insert AS (
          INSERT INTO user_lesson_first_success (user_id, lesson_id)
          VALUES ($1, $2)
          ON CONFLICT DO NOTHING
          RETURNING 1
        ),
        xp_log_insert AS (
          INSERT INTO user_xp_log (user_id, xp_amount, source, lesson_id)
          SELECT $1, $3, $4, $2
          FROM first_success_insert
          ON CONFLICT (user_id, source, lesson_id) DO NOTHING
          RETURNING xp_amount
        ),
        xp_upsert AS (
          INSERT INTO user_xp (user_id, total_xp)
          VALUES ($1, COALESCE((SELECT xp_amount FROM xp_log_insert), 0))
          ON CONFLICT (user_id)
          DO UPDATE SET total_xp = user_xp.total_xp + EXCLUDED.total_xp
          RETURNING total_xp
        )
        SELECT
          EXISTS (SELECT 1 FROM first_success_insert) AS "recordedNow",
          COALESCE((SELECT xp_amount FROM xp_log_insert), 0) AS "xpGranted",
          COALESCE((SELECT total_xp FROM xp_upsert), 0) AS "totalXp"
      `,
      [user.id, lessonId, XP_FIRST_SUCCESS_RUN, XP_SOURCES.FIRST_SUCCESS_RUN],
    );

    const result = resultRows[0] ?? { recordedNow: false, xpGranted: 0, totalXp: 0 };
    response.json({
      alreadyRecorded: Number(result.xpGranted || 0) === 0,
      xpGranted: Number(result.xpGranted || 0),
      totalXp: Number(result.totalXp || 0),
    });
  } catch (error) {
    response.status(500).json({
      message: error instanceof Error ? error.message : 'Failed to record first success.',
    });
  }
}

