import crypto from 'node:crypto';
import { promisify } from 'node:util';
import { put } from '@vercel/blob';
import { execute, query } from '../db.mjs';

export const scryptAsync = promisify(crypto.scrypt);
export const SESSION_COOKIE_NAME = 'python_adventure_session';
export const SESSION_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;
export const PASSWORD_RESET_GENERIC_MESSAGE = 'Nếu tài khoản tồn tại, chúng tôi đã gửi mã xác thực đến email của bạn.';
export const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
export const OTP_LENGTH = 6;
export const OTP_REQUEST_WINDOW_MS = 60 * 1000; // 1 minute
export const OTP_REQUEST_LIMIT = 3; // max 3 OTP requests per minute per email
export const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
export const groqApiKey = process.env.GROQ_API_KEY;
export const groqPrimaryModel = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
export const groqSmallModel = process.env.GROQ_SMALL_MODEL || 'llama-3.1-8b-instant';
export const PRO_TRACKS = new Set(['Nâng cao lớp 6']);
export const ERROR_HISTORY_LIMIT = 5;
export const HINT_CACHE_TTL_MS = Number(process.env.HINT_CACHE_TTL_MS || 7 * 24 * 60 * 60 * 1000);
export const HINT_IP_WINDOW_MS = Number(process.env.HINT_IP_WINDOW_MS || 10 * 60 * 1000);
export const HINT_IP_LIMIT = Number(process.env.HINT_IP_LIMIT || 10);
export const HINT_DAILY_QUOTA_FREE = Number(process.env.HINT_DAILY_QUOTA_FREE || 5);
export const HINT_DAILY_QUOTA_PRO = Number(process.env.HINT_DAILY_QUOTA_PRO || 40);
export const HINT_LESSON_DAILY_QUOTA_FREE = Number(process.env.HINT_LESSON_DAILY_QUOTA_FREE || 2);
export const HINT_LESSON_DAILY_QUOTA_PRO = Number(process.env.HINT_LESSON_DAILY_QUOTA_PRO || 8);
export const HINT_COOLDOWN_FREE_MS = Number(process.env.HINT_COOLDOWN_FREE_MS || 20_000);
export const HINT_COOLDOWN_PRO_MS = Number(process.env.HINT_COOLDOWN_PRO_MS || 8_000);
export const HINT_MAX_TOKENS_FREE = Number(process.env.HINT_MAX_TOKENS_FREE || 300);
export const HINT_MAX_TOKENS_PRO = Number(process.env.HINT_MAX_TOKENS_PRO || 500);
export const HINT_TEMPERATURE = Number(process.env.HINT_TEMPERATURE || 0.3);
export const PRESENCE_HEARTBEAT_MS = 15_000;
export const PRESENCE_LEASE_MS = 45_000;

// XP System Constants
export const XP_LESSON_COMPLETE_FIRST = 50;
export const XP_FIRST_SUCCESS_RUN = 10;
export const XP_DAILY_CHALLENGE = 30;
export const XP_DAILY_CHALLENGE_BONUS = 30;

// Coins System Constants
export const COINS_LESSON_COMPLETE = 100;
export const COINS_STREAK_BASE = 10;
export const COINS_STREAK_STEP = 2;
export const COINS_CODE_REVIEW = 15;
export const XP_CODE_REVIEW = 5;
export const STREAK_ACHIEVEMENTS = {
  7: 'Tuần lễ đầu tiên!',
  14: 'Hai tuần kiên trì!',
  30: 'Một tháng champion!',
  100: '100 ngày huyền thoại!',
};

export const LEVEL_THRESHOLDS = [
  { level: 1, name: 'Người mới', minXp: 0 },
  { level: 2, name: 'Học viên', minXp: 100 },
  { level: 3, name: 'Lập trình viên', minXp: 300 },
  { level: 4, name: 'Phù thủy code', minXp: 700 },
  { level: 5, name: 'Huyền thoại Python', minXp: 1500 },
];

// Cookies System Constants
export const XP_SOURCES = {
  LESSON_COMPLETE_FIRST: 'lesson_complete_first',
  FIRST_SUCCESS_RUN: 'first_success_run',
  DAILY_CHALLENGE: 'daily_challenge',
  DAILY_CHALLENGE_BONUS: 'daily_challenge_bonus',
  CHALLENGE_COMPLETE: 'challenge_complete',
  CODE_REVIEW: 'code_review',
};

export function getLevelFromXp(xp) {
  let currentLevel = LEVEL_THRESHOLDS[0];
  for (const threshold of LEVEL_THRESHOLDS) {
    if (xp >= threshold.minXp) {
      currentLevel = threshold;
    } else {
      break;
    }
  }
  const currentIndex = LEVEL_THRESHOLDS.indexOf(currentLevel);
  const nextThreshold = LEVEL_THRESHOLDS[currentIndex + 1];
  return {
    ...currentLevel,
    xpInCurrentLevel: xp - currentLevel.minXp,
    xpToNextLevel: nextThreshold ? nextThreshold.minXp - currentLevel.minXp : 0,
    progressPercent: nextThreshold
      ? Math.min(100, Math.round((xp - currentLevel.minXp) / (nextThreshold.minXp - currentLevel.minXp) * 100))
      : 100,
  };
}

export function getRequestBody(request) {
  return request.body ?? {};
}

export function isProduction() {
  return process.env.NODE_ENV === 'production';
}

export function normalizeIdentifier(value) {
  return String(value || '').trim().toLowerCase();
}

export function serializeCookie(name, value, maxAgeMs) {
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${Math.floor(maxAgeMs / 1000)}`,
  ];

  if (isProduction()) {
    parts.push('Secure');
  }

  return parts.join('; ');
}

export function clearCookie(name) {
  const parts = [`${name}=`, 'Path=/', 'HttpOnly', 'SameSite=Lax', 'Max-Age=0'];

  if (isProduction()) {
    parts.push('Secure');
  }

  return parts.join('; ');
}

export function parseCookies(request) {
  const header = request.headers?.cookie;
  if (!header) {
    return {};
  }

  return header.split(';').reduce((cookies, pair) => {
    const separatorIndex = pair.indexOf('=');
    if (separatorIndex < 0) {
      return cookies;
    }

    const key = pair.slice(0, separatorIndex).trim();
    const value = pair.slice(separatorIndex + 1).trim();
    cookies[key] = decodeURIComponent(value);
    return cookies;
  }, {});
}

export function sendSseEvent(response, event, data) {
  if (response.writableEnded) {
    return false;
  }
  try {
    response.write(`event: ${event}\n`);
    response.write(`data: ${JSON.stringify(data)}\n\n`);
    return true;
  } catch {
    return false;
  }
}

export async function pruneExpiredPresenceLeases() {
  await execute(`
    DELETE FROM online_presence_leases
    WHERE expires_at <= CURRENT_TIMESTAMP
  `);
}

export async function touchPresenceLease(connectionId, userId) {
  const expiresAt = new Date(Date.now() + PRESENCE_LEASE_MS).toISOString();

  await execute(
    `
      INSERT INTO online_presence_leases (connection_id, user_id, expires_at)
      VALUES ($1, $2, $3)
      ON CONFLICT (connection_id)
      DO UPDATE SET
        user_id = EXCLUDED.user_id,
        expires_at = EXCLUDED.expires_at,
        updated_at = CURRENT_TIMESTAMP
    `,
    [connectionId, userId, expiresAt],
  );
}

export async function deletePresenceLease(connectionId) {
  await execute(
    `
      DELETE FROM online_presence_leases
      WHERE connection_id = $1
    `,
    [connectionId],
  );
}

export async function getOnlineLearnerCount() {
  await pruneExpiredPresenceLeases();

  const rows = await query(`
    SELECT COUNT(DISTINCT user_id)::int AS count
    FROM online_presence_leases
    WHERE expires_at > CURRENT_TIMESTAMP
  `);

  return Number(rows[0]?.count || 0);
}

export async function sendPresenceUpdate(response) {
  const count = await getOnlineLearnerCount();
  return sendSseEvent(response, 'presence', { count });
}

export function canAccessTrack(user, track) {
  if (!PRO_TRACKS.has(track)) {
    return true;
  }

  return Boolean(user?.isPro ?? user?.is_pro);
}

export function safeJsonParse(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

export function extractMistakeTags(rawValue) {
  if (!Array.isArray(rawValue)) {
    return [];
  }

  return rawValue
    .map((tag) => String(tag).trim())
    .filter(Boolean)
    .slice(0, 5);
}

export class GroqRequestError extends Error {
  constructor(message, { status = 500, body = '', model = '' } = {}) {
    super(message);
    this.name = 'GroqRequestError';
    this.status = status;
    this.body = body;
    this.model = model;
  }
}

export function normalizeMultilineText(value) {
  return String(value || '')
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .trim();
}

export function normalizeHintCode(value) {
  return normalizeMultilineText(value)
    .split('\n')
    .map((line) => line.trimEnd())
    .join('\n');
}

export function getClientIp(request) {
  const forwardedFor = request.headers?.['x-forwarded-for'];
  if (typeof forwardedFor === 'string' && forwardedFor.trim()) {
    return forwardedFor.split(',')[0].trim();
  }

  const realIp = request.headers?.['x-real-ip'];
  if (typeof realIp === 'string' && realIp.trim()) {
    return realIp.trim();
  }

  return request.socket?.remoteAddress || request.ip || 'unknown';
}

export function getHintEntitlement(user) {
  const isPro = Boolean(user?.isPro ?? user?.is_pro);
  return {
    isPro,
    dailyQuota: isPro ? HINT_DAILY_QUOTA_PRO : HINT_DAILY_QUOTA_FREE,
    lessonDailyQuota: isPro ? HINT_LESSON_DAILY_QUOTA_PRO : HINT_LESSON_DAILY_QUOTA_FREE,
    cooldownMs: isPro ? HINT_COOLDOWN_PRO_MS : HINT_COOLDOWN_FREE_MS,
    maxCompletionTokens: isPro ? HINT_MAX_TOKENS_PRO : HINT_MAX_TOKENS_FREE,
    modelOrder: isPro ? [groqPrimaryModel, groqSmallModel] : [groqSmallModel, groqPrimaryModel],
  };
}

export function getUtcDayBounds(reference = new Date()) {
  const start = new Date(Date.UTC(reference.getUTCFullYear(), reference.getUTCMonth(), reference.getUTCDate()));
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return {
    startIso: start.toISOString(),
    endIso: end.toISOString(),
  };
}

export function getUtcDateString(reference = new Date()) {
  return reference.toISOString().slice(0, 10);
}

export function addUtcDays(dateString, days) {
  const date = new Date(`${dateString}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return getUtcDateString(date);
}

export function getUtcWeekBounds(reference = new Date()) {
  const dayOfWeek = reference.getUTCDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(Date.UTC(
    reference.getUTCFullYear(),
    reference.getUTCMonth(),
    reference.getUTCDate() + mondayOffset,
  ));
  const nextMonday = new Date(monday);
  nextMonday.setUTCDate(nextMonday.getUTCDate() + 7);

  return {
    startDate: getUtcDateString(monday),
    endDate: getUtcDateString(nextMonday),
  };
}

export function buildWeekDaysFromCheckins(checkedInDates, reference = new Date()) {
  const dayLabels = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  const checkedInSet = new Set(checkedInDates);
  const { startDate } = getUtcWeekBounds(reference);
  const monday = new Date(`${startDate}T00:00:00.000Z`);
  const todayDate = getUtcDateString(reference);

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(monday);
    date.setUTCDate(monday.getUTCDate() + index);
    const dateString = getUtcDateString(date);
    const isToday = dateString === todayDate;
    const isFuture = dateString > todayDate;
    const isCompleted = checkedInSet.has(dateString);

    return {
      date: dateString,
      label: dayLabels[date.getUTCDay()],
      status: isCompleted ? 'completed' : isToday ? 'today' : isFuture ? 'future' : 'locked',
      isToday,
      dayOfWeek: date.getUTCDay(),
    };
  });
}

export async function getHintIpRateLimitStatus(request) {
  const ip = getClientIp(request);
  const windowStart = new Date(Date.now() - HINT_IP_WINDOW_MS).toISOString();
  const rows = await query(
    `
      SELECT created_at AS "createdAt"
      FROM ai_hint_request_log
      WHERE request_ip = $1
        AND created_at >= $2
      ORDER BY created_at ASC
    `,
    [ip, windowStart],
  );

  if (rows.length >= HINT_IP_LIMIT) {
    const oldestTimestamp = new Date(rows[0].createdAt).getTime();
    const retryAfterSeconds = Math.max(1, Math.ceil((oldestTimestamp + HINT_IP_WINDOW_MS - Date.now()) / 1000));
    return {
      allowed: false,
      ip,
      retryAfterSeconds,
    };
  }

  return {
    allowed: true,
    ip,
    retryAfterSeconds: 0,
  };
}

export async function recordHintRequest({ userId, lessonId, requestIp }) {
  await execute(
    `
      INSERT INTO ai_hint_request_log (user_id, lesson_id, request_ip)
      VALUES ($1, $2, $3)
    `,
    [userId, lessonId || null, requestIp || null],
  );
}

export async function getHintCooldownStatus(userId, cooldownMs) {
  const rows = await query(
    `
      SELECT last_requested_at AS "lastRequestedAt"
      FROM user_hint_cooldowns
      WHERE user_id = $1
      LIMIT 1
    `,
    [userId],
  );

  const lastRequestedAtValue = rows[0]?.lastRequestedAt;
  if (!lastRequestedAtValue) {
    return { allowed: true, retryAfterSeconds: 0 };
  }

  const lastRequestedAt = new Date(lastRequestedAtValue).getTime();
  const remainingMs = cooldownMs - (Date.now() - lastRequestedAt);
  if (remainingMs <= 0) {
    return { allowed: true, retryAfterSeconds: 0 };
  }

  return {
    allowed: false,
    retryAfterSeconds: Math.max(1, Math.ceil(remainingMs / 1000)),
  };
}

export async function markHintCooldownUsed(userId) {
  await execute(
    `
      INSERT INTO user_hint_cooldowns (user_id, last_requested_at)
      VALUES ($1, CURRENT_TIMESTAMP)
      ON CONFLICT (user_id)
      DO UPDATE SET last_requested_at = CURRENT_TIMESTAMP
    `,
    [userId],
  );
}

export function buildHintCacheKey({ lessonId, lessonTitle, objective, starterCode, code }) {
  const normalizedLessonId = lessonId ? String(lessonId).trim() : '';
  const lessonIdentity = normalizedLessonId
    ? `lesson:${normalizedLessonId}`
    : `lesson-meta:${crypto
        .createHash('sha256')
        .update(
          JSON.stringify({
            lessonTitle: normalizeMultilineText(lessonTitle),
            objective: normalizeMultilineText(objective),
            starterCode: normalizeHintCode(starterCode),
          }),
        )
        .digest('hex')}`;

  const payload = JSON.stringify({
    lessonIdentity,
    objective: normalizeMultilineText(objective),
    normalizedCode: normalizeHintCode(code),
  });

  return crypto.createHash('sha256').update(payload).digest('hex');
}

export async function getDailyHintUsageCount(userId, { startIso, endIso }) {
  const result = await query(
    `
      SELECT COUNT(*)::int AS count
      FROM ai_hint_usage
      WHERE user_id = $1
        AND created_at >= $2
        AND created_at < $3
    `,
    [userId, startIso, endIso],
  );

  return Number(result[0]?.count || 0);
}

export async function getDailyHintUsageCountByLesson(userId, lessonId, { startIso, endIso }) {
  const result = await query(
    `
      SELECT COUNT(*)::int AS count
      FROM ai_hint_usage
      WHERE user_id = $1
        AND lesson_id = $2
        AND created_at >= $3
        AND created_at < $4
    `,
    [userId, lessonId, startIso, endIso],
  );

  return Number(result[0]?.count || 0);
}

export async function getCachedHint(cacheKey) {
  await execute(`
    DELETE FROM ai_hint_cache
    WHERE expires_at <= CURRENT_TIMESTAMP
  `);

  const cached = await query(
    `
      SELECT response_text AS "responseText", model
      FROM ai_hint_cache
      WHERE cache_key = $1
        AND expires_at > CURRENT_TIMESTAMP
      LIMIT 1
    `,
    [cacheKey],
  );

  return cached[0] ?? null;
}

export async function saveCachedHint({ cacheKey, lessonId, hint, model }) {
  const expiresAt = new Date(Date.now() + HINT_CACHE_TTL_MS).toISOString();

  await query(
    `
      INSERT INTO ai_hint_cache (cache_key, lesson_id, response_text, model, expires_at)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (cache_key)
      DO UPDATE SET
        lesson_id = EXCLUDED.lesson_id,
        response_text = EXCLUDED.response_text,
        model = EXCLUDED.model,
        created_at = CURRENT_TIMESTAMP,
        expires_at = EXCLUDED.expires_at
    `,
    [cacheKey, lessonId || null, hint, model, expiresAt],
  );
}

export async function recordHintUsage({ userId, lessonId, model, requestIp }) {
  await query(
    `
      INSERT INTO ai_hint_usage (user_id, lesson_id, model, request_ip)
      VALUES ($1, $2, $3, $4)
    `,
    [userId, lessonId || null, model, requestIp || null],
  );
}

export async function getUserXp(userId) {
  const result = await query(
    `SELECT total_xp AS "totalXp" FROM user_xp WHERE user_id = $1 LIMIT 1`,
    [userId],
  );
  const totalXp = result[0]?.totalXp ?? 0;
  return {
    totalXp,
    ...getLevelFromXp(totalXp),
  };
}

export async function ensureUserXp(userId) {
  await query(
    `INSERT INTO user_xp (user_id, total_xp) VALUES ($1, 0) ON CONFLICT (user_id) DO NOTHING`,
    [userId],
  );
}

export async function hasUserClaimedLessonXp(userId, lessonId, source) {
  const result = await query(
    `SELECT 1 FROM user_xp_log WHERE user_id = $1 AND lesson_id = $2 AND source = $3 LIMIT 1`,
    [userId, lessonId, source],
  );
  return result.length > 0;
}

export async function addUserXp(userId, xpAmount, source, lessonId = null) {
  await query(
    `INSERT INTO user_xp (user_id, total_xp) VALUES ($1, $2) ON CONFLICT (user_id) DO UPDATE SET total_xp = user_xp.total_xp + $2`,
    [userId, xpAmount],
  );
  await query(
    `INSERT INTO user_xp_log (user_id, xp_amount, source, lesson_id) VALUES ($1, $2, $3, $4)`,
    [userId, xpAmount, source, lessonId || null],
  );
}

export async function ensureUserCoins(userId) {
  await query(
    `INSERT INTO user_coins (user_id, coins) VALUES ($1, 0) ON CONFLICT (user_id) DO NOTHING`,
    [userId],
  );
}

export async function ensureUserStreak(userId) {
  await query(
    `
      INSERT INTO user_streaks (user_id)
      VALUES ($1)
      ON CONFLICT (user_id) DO NOTHING
    `,
    [userId],
  );
}

export async function getUserStreakData(userId) {
  await ensureUserStreak(userId);

  const { startDate, endDate } = getUtcWeekBounds();
  const [streakRows, checkinRows] = await Promise.all([
    query(
      `
        SELECT
          current_streak AS "currentStreak",
          longest_streak AS "longestStreak",
          total_check_ins AS "totalCheckIns",
          last_check_in_date::text AS "lastCheckIn"
        FROM user_streaks
        WHERE user_id = $1
        LIMIT 1
      `,
      [userId],
    ),
    query(
      `
        SELECT check_in_date::text AS date
        FROM user_streak_checkins
        WHERE user_id = $1
          AND check_in_date >= $2::date
          AND check_in_date < $3::date
        ORDER BY check_in_date ASC
      `,
      [userId, startDate, endDate],
    ),
  ]);

  const streak = streakRows[0] ?? {
    currentStreak: 0,
    longestStreak: 0,
    totalCheckIns: 0,
    lastCheckIn: null,
  };
  const checkedInDates = checkinRows.map((row) => row.date);
  const todayDate = getUtcDateString();

  return {
    currentStreak: Number(streak.currentStreak || 0),
    longestStreak: Number(streak.longestStreak || 0),
    lastCheckIn: streak.lastCheckIn || null,
    weekDays: buildWeekDaysFromCheckins(checkedInDates),
    totalCheckIns: Number(streak.totalCheckIns || 0),
    isCheckedInToday: checkedInDates.includes(todayDate),
  };
}

export function getStreakAchievement(streak) {
  return STREAK_ACHIEVEMENTS[streak];
}

export function getStreakReward(streak) {
  return COINS_STREAK_BASE + streak * COINS_STREAK_STEP;
}

export async function getUserCoins(userId) {
  const result = await query(
    `SELECT coins FROM user_coins WHERE user_id = $1 LIMIT 1`,
    [userId],
  );
  return result[0]?.coins ?? 0;
}

export async function getLeaderboardEntries(currentUserId, limit = 3) {
  const rows = await query(
    `
      WITH ranked_users AS (
        SELECT
          users.id,
          users.username,
          users.is_pro AS "isPro",
          users.avatar_url AS "avatarUrl",
          COALESCE(user_xp.total_xp, 0) AS xp,
          COALESCE(user_coins.coins, 0) AS coins,
          ROW_NUMBER() OVER (
            ORDER BY COALESCE(user_xp.total_xp, 0) DESC, COALESCE(user_coins.coins, 0) DESC, users.username ASC
          ) AS rank
        FROM users
        LEFT JOIN user_xp ON user_xp.user_id = users.id
        LEFT JOIN user_coins ON user_coins.user_id = users.id
      ),
      top_users AS (
        SELECT *
        FROM ranked_users
        WHERE rank <= $2
      ),
      current_user_entry AS (
        SELECT *
        FROM ranked_users
        WHERE id = $1
      )
      SELECT DISTINCT ON (id)
        id,
        username,
        "isPro",
        "avatarUrl",
        xp,
        coins,
        rank
      FROM (
        SELECT * FROM top_users
        UNION ALL
        SELECT * FROM current_user_entry
      ) combined
      ORDER BY id, rank
    `,
    [currentUserId, limit],
  );

  return rows
    .map((row) => ({
      id: Number(row.id),
      username: row.username,
      title: Number(row.id) === currentUserId ? 'Ban' : row.isPro ? 'Pro Learner' : 'Explorer',
      avatarUrl: row.avatarUrl || null,
      xp: Number(row.xp || 0),
      coins: Number(row.coins || 0),
      rank: Number(row.rank || 0),
      isCurrentUser: Number(row.id) === currentUserId,
    }))
    .sort((left, right) => left.rank - right.rank);
}

export async function addUserCoins(userId, coinsAmount) {
  await query(
    `INSERT INTO user_coins (user_id, coins) VALUES ($1, $2) ON CONFLICT (user_id) DO UPDATE SET coins = user_coins.coins + $2`,
    [userId, coinsAmount],
  );
}

export async function markFirstSuccessRun(userId, lessonId) {
  await query(
    `INSERT INTO user_lesson_first_success (user_id, lesson_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
    [userId, lessonId],
  );
}

export async function hasFirstSuccessRun(userId, lessonId) {
  const result = await query(
    `SELECT 1 FROM user_lesson_first_success WHERE user_id = $1 AND lesson_id = $2 LIMIT 1`,
    [userId, lessonId],
  );
  return result.length > 0;
}

export async function getLessonById(lessonId) {
  const lessons = await query(
    `
      SELECT
        id,
        track,
        title,
        objective,
        starter_code AS "starterCode"
      FROM lessons
      WHERE id = $1
      LIMIT 1
    `,
    [lessonId],
  );

  return lessons[0] ?? null;
}

export async function getRecentLessonErrors(userId, lessonId, limit = ERROR_HISTORY_LIMIT) {
  return query(
    `
      SELECT
        error_message AS "errorMessage",
        ai_explanation AS "aiExplanation",
        ai_guidance AS "aiGuidance",
        mistake_tags AS "mistakeTags",
        created_at AS "createdAt"
      FROM user_lesson_errors
      WHERE user_id = $1 AND lesson_id = $2
      ORDER BY created_at DESC
      LIMIT $3
    `,
    [userId, lessonId, limit],
  );
}

export async function callGroqChat(input = {}, legacyTemperature) {
  const options = Array.isArray(input) ? { messages: input, temperature: legacyTemperature } : input;
  const {
    messages,
    temperature = 0.2,
    model = groqPrimaryModel,
    maxCompletionTokens,
  } = options;

  const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${groqApiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature,
      messages,
      ...(typeof maxCompletionTokens === 'number' ? { max_completion_tokens: maxCompletionTokens } : {}),
    }),
  });

  if (!groqResponse.ok) {
    const errorText = await groqResponse.text();
    throw new GroqRequestError(errorText || 'Groq request failed.', {
      status: groqResponse.status,
      body: errorText,
      model,
    });
  }

  const payload = await groqResponse.json();
  return payload?.choices?.[0]?.message?.content?.trim() || '';
}

export function isRetryableGroqError(error) {
  if (!(error instanceof GroqRequestError)) {
    return false;
  }

  if (error.status === 429 || error.status >= 500) {
    return true;
  }

  const body = String(error.body || '').toLowerCase();
  return body.includes('rate limit') || body.includes('temporar') || body.includes('overload');
}

export async function generateHintWithFallback({ messages, modelOrder, maxCompletionTokens }) {
  const uniqueModels = [...new Set(modelOrder.filter(Boolean))];
  let lastError = null;

  for (let index = 0; index < uniqueModels.length; index += 1) {
    const model = uniqueModels[index];

    try {
      const hint = await callGroqChat({
        messages,
        model,
        temperature: HINT_TEMPERATURE,
        maxCompletionTokens,
      });

      return {
        hint,
        model,
      };
    } catch (error) {
      lastError = error;
      const hasFallback = index < uniqueModels.length - 1;
      if (!hasFallback || !isRetryableGroqError(error)) {
        throw error;
      }
    }
  }

  throw lastError || new Error('Failed to generate hint.');
}

export async function analyzeLessonError({ lesson, code, errorOutput, errorHistory = [] }) {
  const historySummary =
    errorHistory.length > 0
      ? errorHistory
          .map((item, index) => {
            const tags = extractMistakeTags(item.mistakeTags).join(', ') || 'không có tag';

            return [
              `${index + 1}. Lỗi: ${item.errorMessage || 'Không rõ lỗi'}`,
              `Giải thích cũ: ${item.aiExplanation || 'Không có'}`,
              `Gợi ý cũ: ${item.aiGuidance || 'Không có'}`,
              `Tag: ${tags}`,
            ].join('\n');
          })
          .join('\n\n')
      : 'Chưa có lịch sử lỗi trước đó.';

  const systemPrompt = `
Bạn là trợ lý dạy Python cho học sinh lớp 6.

Nguyên tắc phân tích chính:
- Ưu tiên đọc kỹ Traceback/lỗi Python được cung cấp.
- Không đoán bừa nếu Traceback đã chỉ rõ nguyên nhân.
- Phải nói rõ lỗi nằm ở đâu, vì sao Python báo lỗi đó, và học sinh cần chú ý điều nào.

Mục tiêu phản hồi:
- Giải thích thật rõ ràng nhưng ngắn gọn, dễ hiểu với học sinh 11-12 tuổi.
- Dùng giọng khuyến khích, giúp học sinh thấy lỗi là bình thường và có thể sửa được.
- Chỉ ra lỗi đang lặp lại nếu lịch sử lỗi cho thấy điều đó.
- Luôn thêm cách tránh bị lặp lại lỗi lần sau.
- Không đưa full đáp án hoàn chỉnh.

Yêu cầu đầu ra:
- Chỉ trả về JSON hợp lệ.
- Không bọc JSON trong markdown.
- Không thêm giải thích bên ngoài JSON.
- Dùng đúng schema:

{
  "explanation": "string",
  "fixFocus": "string",
  "preventionTip": "string",
  "guidance": "string",
  "mistakeTags": ["string"]
}

Ràng buộc nội dung:
- "explanation" gồm 2-4 câu, giải thích dựa trên Traceback, nêu nguyên nhân và vị trí/ngữ cảnh lỗi.
- "fixFocus" gồm 1-3 câu, nói rõ học sinh nên nhìn vào chỗ nào để sửa.
- "preventionTip" gồm 1-3 câu, mang tính khuyến khích và chỉ cách tránh lặp lại lỗi lần sau.
- "guidance" là bản gợi ý ngắn, kết hợp "fixFocus" và "preventionTip".
- Nếu là lỗi lặp lại, hãy nói nhẹ nhàng rằng học sinh đang gặp lại lỗi quen thuộc này.
- "mistakeTags" gồm 1-5 nhãn ngắn như "syntax", "indentation", "variable-name", "print", "colon", "parentheses", "string", "input", "loop", "condition".
`.trim();

  const userPrompt = [
    `Bài học: ${lesson?.title || 'Không rõ bài học'}`,
    `Mục tiêu: ${lesson?.objective || 'Không rõ mục tiêu'}`,
    lesson?.starterCode ? `Starter code:\n${lesson.starterCode}` : '',
    `Code hiện tại:\n${code || ''}`,
    `Traceback / lỗi Python:\n${errorOutput || 'Không có traceback cụ thể.'}`,
    `Lịch sử lỗi gần đây của học sinh:\n${historySummary}`,
    'Hãy phân tích bám sát Traceback trước, rồi trả lời bằng JSON hợp lệ theo đúng schema.',
  ]
    .filter(Boolean)
    .join('\n\n');

  const content = await callGroqChat(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    0.2,
  );

  const parsed = safeJsonParse(content);

  const explanation =
    parsed && typeof parsed.explanation === 'string' && parsed.explanation.trim()
      ? parsed.explanation.trim()
      : 'Code đang gặp lỗi Python. Không sao cả, lỗi này có thể sửa từng chút một. Hãy nhìn kỹ dòng báo lỗi cuối cùng vì đó thường là manh mối quan trọng nhất.';

  const fixFocus =
    parsed && typeof parsed.fixFocus === 'string' && parsed.fixFocus.trim()
      ? parsed.fixFocus.trim()
      : 'Em hãy nhìn vào dòng gần chỗ Python báo lỗi nhất, rồi kiểm tra lại dấu ngoặc, dấu hai chấm, tên biến và cách thụt lề.';

  const preventionTip =
    parsed && typeof parsed.preventionTip === 'string' && parsed.preventionTip.trim()
      ? parsed.preventionTip.trim()
      : 'Không sao cả, lỗi này sửa được. Lần sau em hãy viết từng đoạn ngắn rồi chạy thử ngay để phát hiện lỗi sớm hơn.';

  const guidance =
    parsed && typeof parsed.guidance === 'string' && parsed.guidance.trim()
      ? parsed.guidance.trim()
      : `${fixFocus} ${preventionTip}`;

  const mistakeTags = extractMistakeTags(parsed?.mistakeTags);

  return {
    explanation,
    fixFocus,
    preventionTip,
    guidance,
    mistakeTags: mistakeTags.length > 0 ? mistakeTags : ['python-error'],
  };
}


export function hashSessionToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function generateOtp() {
  let otp = '';
  const bytes = crypto.randomBytes(6);
  for (let i = 0; i < OTP_LENGTH; i++) {
    otp += String(bytes[i] % 10);
  }
  return otp;
}

export function hashOtp(otp) {
  return crypto.createHash('sha256').update(otp).digest('hex');
}

export async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = await scryptAsync(password, salt, 64);
  return `${salt}:${Buffer.from(derivedKey).toString('hex')}`;
}

export async function verifyPassword(password, storedHash) {
  const [salt, expectedHash] = String(storedHash || '').split(':');
  if (!salt || !expectedHash) {
    return false;
  }

  const derivedKey = await scryptAsync(password, salt, 64);
  const expectedBuffer = Buffer.from(expectedHash, 'hex');
  const actualBuffer = Buffer.from(derivedKey);

  if (expectedBuffer.length !== actualBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuffer, actualBuffer);
}

export function getPasswordStrengthError(password) {
  const value = String(password || '');

  if (value.length < 8) {
    return 'Mật khẩu phải từ 8 ký tự trở lên.';
  }

  if (!/[a-z]/.test(value) || !/[A-Z]/.test(value) || !/[^A-Za-z0-9]/.test(value)) {
    return 'Mật khẩu phải có chữ hoa, chữ thường và ký tự đặc biệt.';
  }

  return null;
}

export async function checkOtpRequestRateLimit(email) {
  const windowStart = new Date(Date.now() - OTP_REQUEST_WINDOW_MS).toISOString();

  const rows = await query(
    `
      SELECT COUNT(*)::int AS count
      FROM password_reset_otps
      WHERE user_id = (SELECT id FROM users WHERE email = $1)
        AND created_at >= $2
    `,
    [email, windowStart],
  );

  const count = rows[0]?.count || 0;
  return count >= OTP_REQUEST_LIMIT;
}

export async function createPasswordResetOtp(userId) {
  const otp = generateOtp();
  const otpHash = hashOtp(otp);
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS);

  await execute(
    `
      UPDATE password_reset_otps
      SET used_at = CURRENT_TIMESTAMP
      WHERE user_id = $1
        AND used_at IS NULL
    `,
    [userId],
  );

  await execute(
    `
      INSERT INTO password_reset_otps (user_id, otp_hash, expires_at)
      VALUES ($1, $2, $3)
    `,
    [userId, otpHash, expiresAt.toISOString()],
  );

  return {
    otp,
    expiresAt,
  };
}

export async function sendPasswordResetOtpEmail({ email, username, otp }) {
  const resendApiKey = process.env.RESEND_API_KEY;
  const resendFromEmail = process.env.RESEND_FROM_EMAIL;

  if (!resendApiKey || !resendFromEmail) {
    return false;
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: resendFromEmail,
      to: [email],
      subject: 'Mã xác thực đặt lại mật khẩu PythonQuest',
      html: [
        `<p>Chào ${username || 'bạn'},</p>`,
        '<p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản PythonQuest của bạn.</p>',
        `<p>Mã xác thực của bạn là: <strong style="font-size: 24px; letter-spacing: 4px;">${otp}</strong></p>`,
        `<p>Mã này sẽ hết hạn sau 5 phút và chỉ dùng được một lần.</p>`,
        '<p>Nếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này.</p>',
      ].join(''),
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to send OTP email: ${response.status}`);
  }

  return true;
}

export function sanitizeUser(user) {
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    isAdmin: Boolean(user.isAdmin ?? user.is_admin),
    isPro: Boolean(user.isPro ?? user.is_pro),
    avatarUrl: user.avatarUrl ?? user.avatar_url ?? null,
    theme: user.theme === 'dark' ? 'dark' : 'light',
    profileVisible: Boolean(user.profileVisible ?? user.profile_visible ?? true),
    emailNotifications: Boolean(user.emailNotifications ?? user.email_notifications ?? false),
    musicEnabled: Boolean(user.musicEnabled ?? user.music_enabled ?? true),
    soundVolume: Number.isFinite(Number(user.soundVolume ?? user.sound_volume))
      ? Math.min(100, Math.max(0, Number(user.soundVolume ?? user.sound_volume)))
      : 80,
  };
}

export function parseAvatarDataUrl(value) {
  const match = String(value || '').match(/^data:(image\/(?:png|jpeg|jpg|webp|gif));base64,([A-Za-z0-9+/=]+)$/);
  if (!match) {
    return null;
  }

  const mimeType = match[1];
  const base64Payload = match[2];
  const buffer = Buffer.from(base64Payload, 'base64');

  if (!buffer.length || buffer.length > MAX_AVATAR_BYTES) {
    return null;
  }

  const extension = mimeType === 'image/jpeg' || mimeType === 'image/jpg'
    ? 'jpg'
    : mimeType.replace('image/', '');

  return {
    buffer,
    extension,
    mimeType,
  };
}

export async function saveAvatarForUser(userId, avatarDataUrl) {
  const parsedAvatar = parseAvatarDataUrl(avatarDataUrl);
  if (!parsedAvatar) {
    throw new Error('Avatar must be a valid image under 2MB.');
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error('BLOB_READ_WRITE_TOKEN is required for avatar uploads.');
  }

  const blobFilename = `avatars/user-${userId}.${parsedAvatar.extension}`;
  const blob = await put(blobFilename, parsedAvatar.buffer, {
    access: 'public',
    addRandomSuffix: true,
    contentType: parsedAvatar.mimeType,
    token: process.env.BLOB_READ_WRITE_TOKEN,
  });
  return blob.url;
}

export async function deleteExpiredSessions() {
  await execute(
    `
      DELETE FROM user_sessions
      WHERE expires_at <= CURRENT_TIMESTAMP
    `,
  );
}

export async function createSession(userId) {
  const sessionToken = crypto.randomBytes(32).toString('hex');
  const sessionTokenHash = hashSessionToken(sessionToken);
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_MS);

  await query(
    `
      INSERT INTO user_sessions (user_id, session_token_hash, expires_at)
      VALUES ($1, $2, $3)
    `,
    [userId, sessionTokenHash, expiresAt.toISOString()],
  );

  return sessionToken;
}

export async function getAuthenticatedUser(request) {
  await deleteExpiredSessions();

  const cookies = parseCookies(request);
  const sessionToken = cookies[SESSION_COOKIE_NAME];

  if (!sessionToken) {
    return null;
  }

  const sessionTokenHash = hashSessionToken(sessionToken);
  const sessions = await query(
    `
      SELECT
        users.id,
        users.username,
        users.email,
        users.is_admin AS "isAdmin",
        users.is_pro AS "isPro",
        users.avatar_url AS "avatarUrl",
        users.theme,
        users.profile_visible AS "profileVisible",
        users.email_notifications AS "emailNotifications",
        users.music_enabled AS "musicEnabled",
        users.sound_volume AS "soundVolume"
      FROM user_sessions
      INNER JOIN users ON users.id = user_sessions.user_id
      WHERE user_sessions.session_token_hash = $1
        AND user_sessions.expires_at > CURRENT_TIMESTAMP
      LIMIT 1
    `,
    [sessionTokenHash],
  );

  return sanitizeUser(sessions[0]);
}

export async function requireAuthenticatedUser(request, response) {
  const user = await getAuthenticatedUser(request);

  if (!user) {
    response.status(401).json({
      message: 'Authentication required.',
    });
    return null;
  }

  return user;
}

























// Challenge Handlers

export async function ensureAppSchema() {
  // Tables are created via migrations at server startup.
  // No additional schema checks needed here.
}

export function getTodayDateString() {
  return new Date().toISOString().slice(0, 10);
}

export function seededShuffle(array, seed) {
  const shuffled = [...array];
  let currentIndex = shuffled.length;
  let randomValue;

  // Simple seeded random number generator
  function seededRandom() {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  }

  // Fisher-Yates shuffle with seeded random
  while (currentIndex !== 0) {
    randomValue = Math.floor(seededRandom() * currentIndex);
    currentIndex--;
    [shuffled[currentIndex], shuffled[randomValue]] = [shuffled[randomValue], shuffled[currentIndex]];
  }

  return shuffled;
}

export function getDailySeed(userId) {
  const today = getTodayDateString();
  return userId * 1000 + new Date(today).getTime() / 1000000;
}



// Avatar CRUD handlers


// Item CRUD handlers



