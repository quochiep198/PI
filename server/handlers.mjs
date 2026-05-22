import crypto from 'node:crypto';
import { promisify } from 'node:util';
import { put } from '@vercel/blob';
import { execute, query } from './db.mjs';

const scryptAsync = promisify(crypto.scrypt);
const SESSION_COOKIE_NAME = 'python_adventure_session';
const SESSION_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;
const PASSWORD_RESET_TOKEN_MAX_AGE_MS = Number(process.env.PASSWORD_RESET_TOKEN_MAX_AGE_MS || 60 * 60 * 1000);
const PASSWORD_RESET_GENERIC_MESSAGE = 'Nếu tài khoản tồn tại, chúng tôi đã gửi hướng dẫn đặt lại mật khẩu.';
const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const groqApiKey = process.env.GROQ_API_KEY;
const groqPrimaryModel = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
const groqSmallModel = process.env.GROQ_SMALL_MODEL || 'llama-3.1-8b-instant';
const PRO_TRACKS = new Set(['Nﾃ｢ng cao l盻孅 6']);
const ERROR_HISTORY_LIMIT = 5;
const HINT_CACHE_TTL_MS = Number(process.env.HINT_CACHE_TTL_MS || 7 * 24 * 60 * 60 * 1000);
const HINT_IP_WINDOW_MS = Number(process.env.HINT_IP_WINDOW_MS || 10 * 60 * 1000);
const HINT_IP_LIMIT = Number(process.env.HINT_IP_LIMIT || 10);
const HINT_DAILY_QUOTA_FREE = Number(process.env.HINT_DAILY_QUOTA_FREE || 5);
const HINT_DAILY_QUOTA_PRO = Number(process.env.HINT_DAILY_QUOTA_PRO || 40);
const HINT_LESSON_DAILY_QUOTA_FREE = Number(process.env.HINT_LESSON_DAILY_QUOTA_FREE || 2);
const HINT_LESSON_DAILY_QUOTA_PRO = Number(process.env.HINT_LESSON_DAILY_QUOTA_PRO || 8);
const HINT_COOLDOWN_FREE_MS = Number(process.env.HINT_COOLDOWN_FREE_MS || 20_000);
const HINT_COOLDOWN_PRO_MS = Number(process.env.HINT_COOLDOWN_PRO_MS || 8_000);
const HINT_MAX_TOKENS_FREE = Number(process.env.HINT_MAX_TOKENS_FREE || 300);
const HINT_MAX_TOKENS_PRO = Number(process.env.HINT_MAX_TOKENS_PRO || 500);
const HINT_TEMPERATURE = Number(process.env.HINT_TEMPERATURE || 0.3);
const PRESENCE_HEARTBEAT_MS = 15_000;
const PRESENCE_LEASE_MS = 45_000;

// XP System Constants
const XP_LESSON_COMPLETE_FIRST = 50;
const XP_FIRST_SUCCESS_RUN = 10;
const XP_DAILY_CHALLENGE = 30;
const XP_DAILY_CHALLENGE_BONUS = 30;

// Coins System Constants
const COINS_LESSON_COMPLETE = 100;
const COINS_STREAK_BASE = 10;
const COINS_STREAK_STEP = 2;
const STREAK_ACHIEVEMENTS = {
  7: 'Tuần lễ đầu tiên!',
  14: 'Hai tuần kiên trì!',
  30: 'Một tháng champion!',
  100: '100 ngày huyền thoại!',
};

const LEVEL_THRESHOLDS = [
  { level: 1, name: 'Người mới', minXp: 0 },
  { level: 2, name: 'Học viên', minXp: 100 },
  { level: 3, name: 'Lập trình viên', minXp: 300 },
  { level: 4, name: 'Phù thủy code', minXp: 700 },
  { level: 5, name: 'Huyền thoại Python', minXp: 1500 },
];

// Cookies System Constants
const XP_SOURCES = {
  LESSON_COMPLETE_FIRST: 'lesson_complete_first',
  FIRST_SUCCESS_RUN: 'first_success_run',
  DAILY_CHALLENGE: 'daily_challenge',
  DAILY_CHALLENGE_BONUS: 'daily_challenge_bonus',
  CHALLENGE_COMPLETE: 'challenge_complete',
};

function getLevelFromXp(xp) {
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

function getRequestBody(request) {
  return request.body ?? {};
}

function isProduction() {
  return process.env.NODE_ENV === 'production';
}

function normalizeIdentifier(value) {
  return String(value || '').trim().toLowerCase();
}

function serializeCookie(name, value, maxAgeMs) {
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

function clearCookie(name) {
  const parts = [`${name}=`, 'Path=/', 'HttpOnly', 'SameSite=Lax', 'Max-Age=0'];

  if (isProduction()) {
    parts.push('Secure');
  }

  return parts.join('; ');
}

function parseCookies(request) {
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

function sendSseEvent(response, event, data) {
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

async function pruneExpiredPresenceLeases() {
  await execute(`
    DELETE FROM online_presence_leases
    WHERE expires_at <= CURRENT_TIMESTAMP
  `);
}

async function touchPresenceLease(connectionId, userId) {
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

async function deletePresenceLease(connectionId) {
  await execute(
    `
      DELETE FROM online_presence_leases
      WHERE connection_id = $1
    `,
    [connectionId],
  );
}

async function getOnlineLearnerCount() {
  await pruneExpiredPresenceLeases();

  const rows = await query(`
    SELECT COUNT(DISTINCT user_id)::int AS count
    FROM online_presence_leases
    WHERE expires_at > CURRENT_TIMESTAMP
  `);

  return Number(rows[0]?.count || 0);
}

async function sendPresenceUpdate(response) {
  const count = await getOnlineLearnerCount();
  return sendSseEvent(response, 'presence', { count });
}

function canAccessTrack(user, track) {
  if (!PRO_TRACKS.has(track)) {
    return true;
  }

  return Boolean(user?.isPro ?? user?.is_pro);
}

function safeJsonParse(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function extractMistakeTags(rawValue) {
  if (!Array.isArray(rawValue)) {
    return [];
  }

  return rawValue
    .map((tag) => String(tag).trim())
    .filter(Boolean)
    .slice(0, 5);
}

class GroqRequestError extends Error {
  constructor(message, { status = 500, body = '', model = '' } = {}) {
    super(message);
    this.name = 'GroqRequestError';
    this.status = status;
    this.body = body;
    this.model = model;
  }
}

function normalizeMultilineText(value) {
  return String(value || '')
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .trim();
}

function normalizeHintCode(value) {
  return normalizeMultilineText(value)
    .split('\n')
    .map((line) => line.trimEnd())
    .join('\n');
}

function getClientIp(request) {
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

function getHintEntitlement(user) {
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

function getUtcDayBounds(reference = new Date()) {
  const start = new Date(Date.UTC(reference.getUTCFullYear(), reference.getUTCMonth(), reference.getUTCDate()));
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return {
    startIso: start.toISOString(),
    endIso: end.toISOString(),
  };
}

function getUtcDateString(reference = new Date()) {
  return reference.toISOString().slice(0, 10);
}

function addUtcDays(dateString, days) {
  const date = new Date(`${dateString}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return getUtcDateString(date);
}

function getUtcWeekBounds(reference = new Date()) {
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

function buildWeekDaysFromCheckins(checkedInDates, reference = new Date()) {
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

async function getHintIpRateLimitStatus(request) {
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

async function recordHintRequest({ userId, lessonId, requestIp }) {
  await execute(
    `
      INSERT INTO ai_hint_request_log (user_id, lesson_id, request_ip)
      VALUES ($1, $2, $3)
    `,
    [userId, lessonId || null, requestIp || null],
  );
}

async function getHintCooldownStatus(userId, cooldownMs) {
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

async function markHintCooldownUsed(userId) {
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

function buildHintCacheKey({ lessonId, lessonTitle, objective, starterCode, code }) {
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

async function getDailyHintUsageCount(userId, { startIso, endIso }) {
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

async function getDailyHintUsageCountByLesson(userId, lessonId, { startIso, endIso }) {
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

async function getCachedHint(cacheKey) {
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

async function saveCachedHint({ cacheKey, lessonId, hint, model }) {
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

async function recordHintUsage({ userId, lessonId, model, requestIp }) {
  await query(
    `
      INSERT INTO ai_hint_usage (user_id, lesson_id, model, request_ip)
      VALUES ($1, $2, $3, $4)
    `,
    [userId, lessonId || null, model, requestIp || null],
  );
}

async function getUserXp(userId) {
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

async function ensureUserXp(userId) {
  await query(
    `INSERT INTO user_xp (user_id, total_xp) VALUES ($1, 0) ON CONFLICT (user_id) DO NOTHING`,
    [userId],
  );
}

async function hasUserClaimedLessonXp(userId, lessonId, source) {
  const result = await query(
    `SELECT 1 FROM user_xp_log WHERE user_id = $1 AND lesson_id = $2 AND source = $3 LIMIT 1`,
    [userId, lessonId, source],
  );
  return result.length > 0;
}

async function addUserXp(userId, xpAmount, source, lessonId = null) {
  await query(
    `INSERT INTO user_xp (user_id, total_xp) VALUES ($1, $2) ON CONFLICT (user_id) DO UPDATE SET total_xp = user_xp.total_xp + $2`,
    [userId, xpAmount],
  );
  await query(
    `INSERT INTO user_xp_log (user_id, xp_amount, source, lesson_id) VALUES ($1, $2, $3, $4)`,
    [userId, xpAmount, source, lessonId || null],
  );
}

async function ensureUserCoins(userId) {
  await query(
    `INSERT INTO user_coins (user_id, coins) VALUES ($1, 0) ON CONFLICT (user_id) DO NOTHING`,
    [userId],
  );
}

async function ensureUserStreak(userId) {
  await query(
    `
      INSERT INTO user_streaks (user_id)
      VALUES ($1)
      ON CONFLICT (user_id) DO NOTHING
    `,
    [userId],
  );
}

async function getUserStreakData(userId) {
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

function getStreakAchievement(streak) {
  return STREAK_ACHIEVEMENTS[streak];
}

function getStreakReward(streak) {
  return COINS_STREAK_BASE + streak * COINS_STREAK_STEP;
}

async function getUserCoins(userId) {
  const result = await query(
    `SELECT coins FROM user_coins WHERE user_id = $1 LIMIT 1`,
    [userId],
  );
  return result[0]?.coins ?? 0;
}

async function getLeaderboardEntries(currentUserId, limit = 3) {
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

async function addUserCoins(userId, coinsAmount) {
  await query(
    `INSERT INTO user_coins (user_id, coins) VALUES ($1, $2) ON CONFLICT (user_id) DO UPDATE SET coins = user_coins.coins + $2`,
    [userId, coinsAmount],
  );
}

async function markFirstSuccessRun(userId, lessonId) {
  await query(
    `INSERT INTO user_lesson_first_success (user_id, lesson_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
    [userId, lessonId],
  );
}

async function hasFirstSuccessRun(userId, lessonId) {
  const result = await query(
    `SELECT 1 FROM user_lesson_first_success WHERE user_id = $1 AND lesson_id = $2 LIMIT 1`,
    [userId, lessonId],
  );
  return result.length > 0;
}

async function getLessonById(lessonId) {
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

async function getRecentLessonErrors(userId, lessonId, limit = ERROR_HISTORY_LIMIT) {
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

async function callGroqChat(input = {}, legacyTemperature) {
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

function isRetryableGroqError(error) {
  if (!(error instanceof GroqRequestError)) {
    return false;
  }

  if (error.status === 429 || error.status >= 500) {
    return true;
  }

  const body = String(error.body || '').toLowerCase();
  return body.includes('rate limit') || body.includes('temporar') || body.includes('overload');
}

async function generateHintWithFallback({ messages, modelOrder, maxCompletionTokens }) {
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

async function analyzeLessonError({ lesson, code, errorOutput, errorHistory = [] }) {
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


function hashSessionToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function hashPasswordResetToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = await scryptAsync(password, salt, 64);
  return `${salt}:${Buffer.from(derivedKey).toString('hex')}`;
}

async function verifyPassword(password, storedHash) {
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

function getPasswordStrengthError(password) {
  const value = String(password || '');

  if (value.length < 8) {
    return 'Mật khẩu phải từ 8 ký tự trở lên.';
  }

  if (!/[a-z]/.test(value) || !/[A-Z]/.test(value) || !/[^A-Za-z0-9]/.test(value)) {
    return 'Mật khẩu phải có chữ hoa, chữ thường và ký tự đặc biệt.';
  }

  return null;
}

function getPasswordResetBaseUrl() {
  const explicitBaseUrl =
    process.env.PASSWORD_RESET_BASE_URL || process.env.APP_BASE_URL || process.env.PUBLIC_APP_URL;

  if (explicitBaseUrl) {
    return explicitBaseUrl.replace(/\/+$/, '');
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return 'http://localhost:5173';
}

function buildPasswordResetUrl(token) {
  const url = new URL(getPasswordResetBaseUrl());
  url.pathname = '/';
  url.searchParams.set('token', token);
  return url.toString();
}

async function createPasswordResetToken(userId) {
  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashPasswordResetToken(token);
  const expiresAt = new Date(Date.now() + PASSWORD_RESET_TOKEN_MAX_AGE_MS);

  await execute(
    `
      INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
      VALUES ($1, $2, $3)
    `,
    [userId, tokenHash, expiresAt.toISOString()],
  );

  return {
    token,
    expiresAt,
  };
}

async function sendPasswordResetEmail({ email, username, resetUrl }) {
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
      subject: 'Đặt lại mật khẩu PythonQuest',
      html: [
        `<p>Chào ${username || 'bạn'},</p>`,
        '<p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản PythonQuest của bạn.</p>',
        `<p><a href="${resetUrl}">Đặt lại mật khẩu</a></p>`,
        `<p>Nếu nút không hoạt động, hãy dùng liên kết này:</p><p>${resetUrl}</p>`,
        `<p>Liên kết này sẽ hết hạn sau ${Math.round(PASSWORD_RESET_TOKEN_MAX_AGE_MS / 60000)} phút và chỉ dùng được một lần.</p>`,
      ].join(''),
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to send reset email: ${response.status}`);
  }

  return true;
}

function sanitizeUser(user) {
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    username: user.username,
    email: user.email,
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

function parseAvatarDataUrl(value) {
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

async function saveAvatarForUser(userId, avatarDataUrl) {
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

async function deleteExpiredSessions() {
  await execute(
    `
      DELETE FROM user_sessions
      WHERE expires_at <= CURRENT_TIMESTAMP
    `,
  );
}

async function createSession(userId) {
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

async function getAuthenticatedUser(request) {
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

async function requireAuthenticatedUser(request, response) {
  const user = await getAuthenticatedUser(request);

  if (!user) {
    response.status(401).json({
      message: 'Authentication required.',
    });
    return null;
  }

  return user;
}

export async function healthHandler(_request, response) {
  try {
    await query('SELECT 1');
    response.json({ ok: true });
  } catch (error) {
    response.status(500).json({
      ok: false,
      message: error instanceof Error ? error.message : 'Database connection failed.',
    });
  }
}

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

export async function onlinePresenceStreamHandler(request, response) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user) {
      response.status(401).json({
        message: 'Authentication required.',
      });
      return;
    }

    response.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    });

    const connectionId = crypto.randomUUID();
    let closed = false;
    let heartbeat = null;

    const cleanup = () => {
      if (closed) {
        return;
      }

      closed = true;
      if (heartbeat) {
        clearInterval(heartbeat);
      }
      void deletePresenceLease(connectionId);
    };

    await touchPresenceLease(connectionId, user.id);
    await sendPresenceUpdate(response);

    heartbeat = setInterval(() => {
      void (async () => {
        try {
          await touchPresenceLease(connectionId, user.id);
          sendSseEvent(response, 'heartbeat', { ts: Date.now() });
          await sendPresenceUpdate(response);
        } catch {
          cleanup();
        }
      })();
    }, PRESENCE_HEARTBEAT_MS);

    request.on('close', cleanup);
    request.on('error', cleanup);
  } catch (error) {
    response.status(500).json({
      message: error instanceof Error ? error.message : 'Failed to stream online presence.',
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
        RETURNING id, username, email, is_pro AS "isPro", avatar_url AS "avatarUrl"
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
        SELECT id, username, email, is_pro AS "isPro", avatar_url AS "avatarUrl", password_hash AS "passwordHash"
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

export async function forgotPasswordHandler(request, response) {
  const { identifier } = getRequestBody(request);
  const normalizedIdentifier = normalizeIdentifier(identifier);

  if (!normalizedIdentifier) {
    response.status(400).json({
      message: 'Vui lòng nhập email, tên đăng nhập hoặc số điện thoại.',
    });
    return;
  }

  try {
    const users = await query(
      `
        SELECT id, username, email
        FROM users
        WHERE username = $1 OR email = $1
        LIMIT 1
      `,
      [normalizedIdentifier],
    );

    const user = users[0];
    let resetUrl = null;

    if (user) {
      const { token } = await createPasswordResetToken(user.id);
      resetUrl = buildPasswordResetUrl(token);

      try {
        const sent = await sendPasswordResetEmail({
          email: user.email,
          username: user.username,
          resetUrl,
        });

        if (!sent && !isProduction()) {
          console.warn(`Password reset email not configured. Preview link for ${user.email}: ${resetUrl}`);
        }
      } catch (error) {
        console.error(error instanceof Error ? error.message : 'Failed to send password reset email.');
      }
    }

    response.json({
      message: PASSWORD_RESET_GENERIC_MESSAGE,
      resetUrl: !isProduction() ? resetUrl : undefined,
    });
  } catch (error) {
    response.status(500).json({
      message: error instanceof Error ? error.message : 'Failed to process password reset request.',
    });
  }
}

export async function resetPasswordHandler(request, response) {
  const { token, password, confirmPassword } = getRequestBody(request);
  const rawToken = String(token || '').trim();
  const rawPassword = String(password || '');
  const rawConfirmPassword = String(confirmPassword || '');

  if (!rawToken) {
    response.status(400).json({
      message: 'Thiếu token đặt lại mật khẩu.',
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
    const tokenHash = hashPasswordResetToken(rawToken);
    const rows = await query(
      `
        SELECT
          password_reset_tokens.id,
          password_reset_tokens.user_id AS "userId",
          users.password_hash AS "passwordHash"
        FROM password_reset_tokens
        INNER JOIN users ON users.id = password_reset_tokens.user_id
        WHERE password_reset_tokens.token_hash = $1
          AND password_reset_tokens.used_at IS NULL
          AND password_reset_tokens.expires_at > CURRENT_TIMESTAMP
        LIMIT 1
      `,
      [tokenHash],
    );

    const tokenRecord = rows[0];
    if (!tokenRecord) {
      response.status(400).json({
        message: 'Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.',
      });
      return;
    }

    const isSameAsCurrentPassword = await verifyPassword(rawPassword, tokenRecord.passwordHash);
    if (isSameAsCurrentPassword) {
      response.status(400).json({
        message: 'Mật khẩu mới không được trùng với mật khẩu cũ.',
      });
      return;
    }

    const nextPasswordHash = await hashPassword(rawPassword);
    const claimedTokenRows = await query(
      `
        UPDATE password_reset_tokens
        SET used_at = CURRENT_TIMESTAMP
        WHERE id = $1
          AND used_at IS NULL
          AND expires_at > CURRENT_TIMESTAMP
        RETURNING user_id AS "userId"
      `,
      [tokenRecord.id],
    );

    if (!claimedTokenRows[0]?.userId) {
      response.status(400).json({
        message: 'Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.',
      });
      return;
    }

    await execute(
      `
        UPDATE users
        SET password_hash = $2
        WHERE id = $1
      `,
      [tokenRecord.userId, nextPasswordHash],
    );

    await execute(
      `
        DELETE FROM user_sessions
        WHERE user_id = $1
      `,
      [tokenRecord.userId],
    );

    await execute(
      `
        UPDATE password_reset_tokens
        SET used_at = COALESCE(used_at, CURRENT_TIMESTAMP)
        WHERE user_id = $1
      `,
      [tokenRecord.userId],
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

export async function errorFeedbackHandler(request, response) {
  const { lessonId, code, errorOutput } = getRequestBody(request);

  if (!groqApiKey) {
    response.status(500).json({
      message: 'GROQ_API_KEY is not configured on the server.',
    });
    return;
  }

  if (!lessonId || !code || !errorOutput) {
    response.status(400).json({
      message: 'Missing lessonId, code, or errorOutput.',
    });
    return;
  }

  try {
    const user = await requireAuthenticatedUser(request, response);
    if (!user) {
      return;
    }

    const lesson = await getLessonById(lessonId);
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

    const errorHistory = await getRecentLessonErrors(user.id, lessonId);
    const analysis = await analyzeLessonError({
      lesson,
      code,
      errorOutput,
      errorHistory,
    });

    await query(
      `
        INSERT INTO user_lesson_errors (
          user_id,
          lesson_id,
          error_message,
          code_snapshot,
          ai_explanation,
          ai_guidance,
          mistake_tags
        ) VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)
      `,
      [
        user.id,
        lessonId,
        errorOutput,
        code,
        analysis.explanation,
        analysis.guidance,
        JSON.stringify(analysis.mistakeTags),
      ],
    );

    response.json(analysis);
  } catch (error) {
    response.status(500).json({
      message: error instanceof Error ? error.message : 'Failed to analyze lesson error.',
    });
  }
}

export async function hintHandler(request, response) {
  const { lessonId, lessonTitle, objective, starterCode, code, output, errorOutput } = getRequestBody(request);

  if (!groqApiKey) {
    response.status(500).json({
      message: 'GROQ_API_KEY is not configured on the server.',
    });
    return;
  }

  if (!lessonId || !code) {
    response.status(400).json({
      message: 'Missing lessonId or code.',
    });
    return;
  }

  try {
    const user = await requireAuthenticatedUser(request, response);
    if (!user) {
      return;
    }

    const lesson = await getLessonById(lessonId);
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

    const entitlement = getHintEntitlement(user);
    const ipLimitStatus = await getHintIpRateLimitStatus(request);
    if (!ipLimitStatus.allowed) {
      response.setHeader('Retry-After', String(ipLimitStatus.retryAfterSeconds));
      response.status(429).json({
        message: `Bạn đang gửi quá nhiều yêu cầu gợi ý AI từ cùng một mạng. Hãy thử lại sau khoảng ${ipLimitStatus.retryAfterSeconds} giây.`,
      });
      return;
    }

    const dayBounds = getUtcDayBounds();
    const userDailyUsage = await getDailyHintUsageCount(user.id, dayBounds);
    if (userDailyUsage >= entitlement.dailyQuota) {
      response.status(429).json({
        message: `Bạn đã dùng hết ${entitlement.dailyQuota} lượt gợi ý AI hôm nay. Hãy quay lại vào ngày mai hoặc nâng cấp Pro nếu cần thêm quota.`,
      });
      return;
    }

    const lessonDailyUsage = await getDailyHintUsageCountByLesson(user.id, lesson.id, dayBounds);
    if (lessonDailyUsage >= entitlement.lessonDailyQuota) {
      response.status(429).json({
        message: `Bạn đã dùng hết ${entitlement.lessonDailyQuota} lượt gợi ý cho bài học này trong hôm nay. Hãy thử tự chỉnh code trước rồi quay lại sau.`,
      });
      return;
    }

    const cooldownStatus = await getHintCooldownStatus(user.id, entitlement.cooldownMs);
    if (!cooldownStatus.allowed) {
      response.setHeader('Retry-After', String(cooldownStatus.retryAfterSeconds));
      response.status(429).json({
        message: `Hãy chờ thêm ${cooldownStatus.retryAfterSeconds} giây rồi xin gợi ý tiếp nhé.`,
      });
      return;
    }

    const normalizedCode = normalizeHintCode(code);
    const cacheKey = buildHintCacheKey({
      lessonId,
      lessonTitle: lessonTitle || lesson.title,
      objective: objective || lesson.objective,
      starterCode: starterCode || lesson.starterCode,
      code: normalizedCode,
    });
    const cachedHint = await getCachedHint(cacheKey);

    await markHintCooldownUsed(user.id);
    await recordHintRequest({
      userId: user.id,
      lessonId: lesson.id,
      requestIp: ipLimitStatus.ip,
    });

    if (cachedHint?.responseText) {
      response.json({
        hint: cachedHint.responseText,
        cached: true,
        model: cachedHint.model,
      });
      return;
    }

    const errorHistory = await getRecentLessonErrors(user.id, lessonId);
    const mistakeSummary =
      errorHistory.length > 0
        ? errorHistory
            .map((item, index) => {
              const tags = extractMistakeTags(item.mistakeTags).join(', ') || 'không có tag';
              return `${index + 1}. Loi hay gap: ${item.errorMessage}\nGoi y tung dua: ${item.aiGuidance}\nTag: ${tags}`;
            })
            .join('\n\n')
        : 'Chưa có lịch sử lỗi cho bài học này.';

    const systemPrompt = `
Bạn là bạn đồng hành dạy Python cho học sinh lớp 6.

NHIỆM VỤ BẮT BUỘC:
1. Đầu tiên giải thích ngắn gọn ý nghĩa các lệnh Python học sinh đang dùng.
2. Sau đó mới chỉ ra lỗi hoặc điều cần sửa.
3. Cuối cùng đưa 1 gợi ý nhỏ để học sinh tự sửa.

QUY TẮC:
- Không giải full bài.
- Không đưa đáp án hoàn chỉnh.
- Mỗi phản hồi tối đa 5 câu ngắn.
- Dùng tiếng Việt đơn giản cho trẻ 11-12 tuổi.
- Nếu học sinh dùng biến, print(), input(), if, for, while, function, method hoặc list thì phải giải thích nó đang làm gì trước.
- Nếu có lỗi Python thì giải thích lỗi đó bằng ngôn ngữ dễ hiểu.
- Ưu tiên đặt câu hỏi gợi mở.
- Luôn khuyến khích tích cực.

PHONG CÁCH:
- Thân thiện.
- Giống đồng đội trong game.
- Không giống giáo viên nghiêm khắc.
- Không dùng thuật ngữ kỹ thuật khó.

ĐỊNH DẠNG PHẢN HỒI BẮT BUỘC:

1. Giải thích:
<giải thích ngắn gọn ý nghĩa lệnh/hàm đang dùng>

2. Lỗi:
<chỉ ra lỗi hoặc điều cần sửa, nếu có>

3. Gợi ý:
<1 gợi ý nhỏ để học sinh tự làm tiếp>
`.trim();

    const latestRuntimeContext = [
      errorOutput ? `Lỗi Python gần nhất:\n${normalizeMultilineText(errorOutput)}` : '',
      !errorOutput && output ? `Kết quả chạy gần nhất:\n${normalizeMultilineText(output)}` : '',
    ]
      .filter(Boolean)
      .join('\n\n');

    const hintPrompt = [
    `Bài học: ${lesson.title}`,
    `Mục tiêu: ${lesson.objective}`,
    lesson.starterCode ? `Starter code:\n${lesson.starterCode}` : '',
    `Code hiện tại của học sinh:\n${normalizedCode}`,
    latestRuntimeContext,
    `Lỗi học sinh hay gặp trước đây:\n${mistakeSummary}`,
    'Hãy phản hồi đúng định dạng bắt buộc: Giải thích -> Lỗi -> Gợi ý. Ưu tiên giải thích ý nghĩa lệnh Python trước khi đưa gợi ý sửa lỗi.',
  ]
    .filter(Boolean)
    .join('\n\n');

    const hintResult = await generateHintWithFallback({
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: hintPrompt,
        },
      ],
      modelOrder: entitlement.modelOrder,
      maxCompletionTokens: entitlement.maxCompletionTokens,
    });

    const hint = hintResult.hint || 'Chưa nhận được gợi ý từ Groq.';

    await saveCachedHint({
      cacheKey,
      lessonId: lesson.id,
      hint,
      model: hintResult.model,
    });

    await recordHintUsage({
      userId: user.id,
      lessonId: lesson.id,
      model: hintResult.model,
      requestIp: ipLimitStatus.ip,
    });

    response.json({
      hint,
      cached: false,
      model: hintResult.model,
    });
  } catch (error) {
    if (error instanceof GroqRequestError && (error.status === 429 || error.status >= 500)) {
      response.status(429).json({
        message: 'Hệ thống gợi ý AI đang bận hoặc tạm chạm giới hạn. Bạn thử lại sau ít phút nhé.',
      });
      return;
    }

    response.status(500).json({
      message: error instanceof Error ? error.message : 'Failed to generate hint.',
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

export async function postXpHandler(request, response) {
  const { source } = getRequestBody(request);
  if (source === 'first_success_run') {
    return recordFirstSuccessHandler(request, response);
  }
  return addXpHandler(request, response);
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

// Challenge Handlers

async function ensureAppSchema() {
  // Tables are created via migrations at server startup.
  // No additional schema checks needed here.
}

function getTodayDateString() {
  return new Date().toISOString().slice(0, 10);
}

function seededShuffle(array, seed) {
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

function getDailySeed(userId) {
  const today = getTodayDateString();
  return userId * 1000 + new Date(today).getTime() / 1000000;
}

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


