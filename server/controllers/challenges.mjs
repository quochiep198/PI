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

export async function getChallengesHandler(request, response) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      response.status(401).json({ message: 'Authentication required.' });
      return;
    }

    await ensureAppSchema();

    // Get lesson IDs where user has completed at least one lesson
    const completedLessonsResult = await query(`
      SELECT DISTINCT ulp.lesson_id
      FROM user_lesson_progress ulp
      INNER JOIN lessons l ON l.id = ulp.lesson_id
      WHERE ulp.user_id = $1
    `, [user.id]);

    const completedLessonIds = completedLessonsResult.map((r) => r.lesson_id);

    // If user hasn't completed any lessons, return empty
    if (completedLessonIds.length === 0) {
      response.json([]);
      return;
    }

    // Get ALL active challenges from lessons the user has completed (via lesson_id)
    // Completed challenges are marked with "completed: true" but still shown
    const challengesRaw = await query(`
      SELECT
        c.id,
        c.title,
        c.description,
        c.difficulty,
        c.xp_reward AS "xpReward",
        c.coins_reward AS "coinsReward",
        c.starter_code AS "starterCode",
        c.track,
        c.test_cases,
        ufp.id IS NOT NULL AS "completed"
      FROM challenges c
      LEFT JOIN user_challenge_progress ufp ON c.id = ufp.challenge_id AND ufp.user_id = $1
      WHERE c.is_active = true
        AND c.lesson_id = ANY($2)
      ORDER BY
        CASE c.difficulty
          WHEN 'easy' THEN 1
          WHEN 'medium' THEN 2
          WHEN 'hard' THEN 3
        END,
        c.challenge_order ASC
    `, [user.id, completedLessonIds]);

    // Transform test_cases to camelCase format
    const challenges = challengesRaw.map((challenge) => {
      const testCases = Array.isArray(challenge.test_cases)
        ? challenge.test_cases.map((tc) => ({
            input: tc.input ?? '',
            expectedOutput: tc.expected_output ?? tc.expectedOutput ?? '',
          }))
        : [];

      return {
        ...challenge,
        testCases,
      };
    });

    // Limit to 5 challenges per day using seeded shuffle
    const dailyLimit = 5;
    const dailySeed = getDailySeed(user.id);
    const shuffledChallenges = seededShuffle(challenges, dailySeed);
    const dailyChallenges = shuffledChallenges.slice(0, dailyLimit);

    response.json(dailyChallenges);
  } catch (error) {
    response.status(500).json({
      message: error instanceof Error ? error.message : 'Failed to load challenges.',
    });
  }
}

export async function submitChallengeHandler(request, response) {
  const { challengeId, code } = getRequestBody(request);

  if (!challengeId || !code) {
    response.status(400).json({
      message: 'Missing challengeId or code.',
    });
    return;
  }

  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      response.status(401).json({ message: 'Authentication required.' });
      return;
    }

    await ensureAppSchema();

    // Get challenge details
    const challenges = await query(`
      SELECT id, lesson_id, xp_reward, coins_reward, test_cases, solution_code
      FROM challenges
      WHERE id = $1 AND is_active = true
      LIMIT 1
    `, [challengeId]);

    const challenge = challenges[0];
    if (!challenge) {
      response.status(404).json({ message: 'Challenge not found.' });
      return;
    }

    // Check if already completed
    const existingProgress = await query(`
      SELECT id FROM user_challenge_progress
      WHERE user_id = $1 AND challenge_id = $2
      LIMIT 1
    `, [user.id, challengeId]);

    const alreadyCompleted = existingProgress.length > 0;

    // Parse test cases
    const testCases = typeof challenge.test_cases === 'string'
      ? JSON.parse(challenge.test_cases)
      : challenge.test_cases || [];

    // For now, we mark as complete if code is submitted (since Pyodide runs client-side)
    // In production, you'd validate the output here
    if (!alreadyCompleted) {
      // Record completion
      await query(`
        INSERT INTO user_challenge_progress (user_id, challenge_id, code_submitted)
        VALUES ($1, $2, $3)
        ON CONFLICT (user_id, challenge_id) DO NOTHING
      `, [user.id, challengeId, code]);

      // Award XP and coins
      await ensureUserXp(user.id);
      const currentXpData = await getUserXp(user.id);
      const newTotalXp = currentXpData.totalXp + challenge.xp_reward;
      await query(`
        UPDATE user_xp SET total_xp = $2 WHERE user_id = $1
      `, [user.id, newTotalXp]);

      await query(`
        INSERT INTO user_xp_log (user_id, xp_amount, source, lesson_id)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (user_id, source, lesson_id) DO NOTHING
      `, [user.id, challenge.xp_reward, XP_SOURCES.CHALLENGE_COMPLETE, challenge.lesson_id]);

      // Award coins
      await ensureUserCoins(user.id);
      await addUserCoins(user.id, challenge.coins_reward);
      const newTotalCoins = await getUserCoins(user.id);

      const newXpData = {
        ...currentXpData,
        totalXp: newTotalXp,
        ...getLevelFromXp(newTotalXp),
      };

      response.json({
        success: true,
        alreadyCompleted: false,
        xpEarned: challenge.xp_reward,
        coinsEarned: challenge.coins_reward,
        totalXp: newTotalXp,
        totalCoins: newTotalCoins,
        xpData: newXpData,
        message: 'Chúc mừng! Bạn đã hoàn thành thử thách!',
      });
    } else {
      response.json({
        success: true,
        alreadyCompleted: true,
        xpEarned: 0,
        coinsEarned: 0,
        message: 'Bạn đã hoàn thành thử thách này rồi!',
      });
    }
  } catch (error) {
    response.status(500).json({
      message: error instanceof Error ? error.message : 'Failed to submit challenge.',
    });
  }
}

