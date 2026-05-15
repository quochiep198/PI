import crypto from 'node:crypto';
import { promisify } from 'node:util';
import { ensureAppSchema, execute, query } from './db.mjs';

const scryptAsync = promisify(crypto.scrypt);
const SESSION_COOKIE_NAME = 'python_adventure_session';
const SESSION_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;
const groqApiKey = process.env.GROQ_API_KEY;
const groqPrimaryModel = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
const groqSmallModel = process.env.GROQ_SMALL_MODEL || 'llama-3.1-8b-instant';
const onlinePresenceConnections = new Map();
const PRO_TRACKS = new Set(['Nâng cao lớp 6']);
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
const hintIpRequestLog = new Map();
const hintCooldownByUser = new Map();

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
  response.write(`event: ${event}\n`);
  response.write(`data: ${JSON.stringify(data)}\n\n`);
}

function getOnlineLearnerCount() {
  const activeUserIds = new Set();

  for (const connection of onlinePresenceConnections.values()) {
    activeUserIds.add(connection.userId);
  }

  return activeUserIds.size;
}

function broadcastOnlineLearnerCount() {
  const payload = { count: getOnlineLearnerCount() };

  for (const connection of onlinePresenceConnections.values()) {
    sendSseEvent(connection.response, 'presence', payload);
  }
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

function pruneOldTimestamps(timestamps, now, windowMs) {
  return timestamps.filter((timestamp) => now - timestamp < windowMs);
}

function enforceHintIpRateLimit(request) {
  const now = Date.now();
  const ip = getClientIp(request);
  const existing = pruneOldTimestamps(hintIpRequestLog.get(ip) || [], now, HINT_IP_WINDOW_MS);

  if (existing.length >= HINT_IP_LIMIT) {
    const retryAfterSeconds = Math.max(1, Math.ceil((existing[0] + HINT_IP_WINDOW_MS - now) / 1000));
    return {
      allowed: false,
      ip,
      retryAfterSeconds,
    };
  }

  existing.push(now);
  hintIpRequestLog.set(ip, existing);
  return {
    allowed: true,
    ip,
    retryAfterSeconds: 0,
  };
}

function getHintCooldownStatus(userId, cooldownMs) {
  const lastRequestedAt = hintCooldownByUser.get(userId);
  if (!lastRequestedAt) {
    return { allowed: true, retryAfterSeconds: 0 };
  }

  const remainingMs = cooldownMs - (Date.now() - lastRequestedAt);
  if (remainingMs <= 0) {
    return { allowed: true, retryAfterSeconds: 0 };
  }

  return {
    allowed: false,
    retryAfterSeconds: Math.max(1, Math.ceil(remainingMs / 1000)),
  };
}

function markHintCooldownUsed(userId) {
  hintCooldownByUser.set(userId, Date.now());
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

async function analyzeLessonError({ lesson, code, errorOutput, errorHistory }) {
  const historySummary =
    errorHistory.length > 0
      ? errorHistory
          .map((item, index) => {
            const tags = extractMistakeTags(item.mistakeTags).join(', ') || 'không có tag';
            return `${index + 1}. Lỗi: ${item.errorMessage}\nGiải thích cũ: ${item.aiExplanation}\nGợi ý cũ: ${item.aiGuidance}\nTag: ${tags}`;
          })
          .join('\n\n')
      : 'Chưa có lịch sử lỗi trước đó.';

  const systemPrompt = `
Bạn là trợ lý dạy Python cho học sinh lớp 6.

Nguồn phân tích chính:
- Ưu tiên đọc kỹ Traceback/lỗi Python được cung cấp.
- Không đoán bừa nếu Traceback đã chỉ rõ nguyên nhân.
- Phải nói rõ lỗi nằm ở đâu, vì sao Python báo lỗi đó, và học sinh cần chú ý điểm nào.

Mục tiêu phản hồi:
- Giải thích thật rõ ràng nhưng ngắn gọn, dễ hiểu với học sinh 11-12 tuổi.
- Dùng giọng khuyến khích, giúp học sinh thấy lỗi là bình thường và có thể sửa được.
- Chỉ ra lỗi đang lặp lại nếu lịch sử lỗi cho thấy điều đó.
- Luôn thêm cách tránh bị lại lần sau.
- Không đưa full đáp án hoàn chỉnh.

Yêu cầu đầu ra:
- Trả về JSON hợp lệ.
- Dùng đúng schema:
  {
    "explanation": "string",
    "fixFocus": "string",
    "preventionTip": "string",
    "guidance": "string",
    "mistakeTags": ["string"]
  }

Ràng buộc nội dung:
- \`explanation\` gồm 2-4 câu, giải thích dựa trên Traceback, nêu nguyên nhân và vị trí/ngữ cảnh lỗi.
- \`fixFocus\` gồm 1-3 câu, nói rõ học sinh nên nhìn vào chỗ nào để sửa.
- \`preventionTip\` gồm 1-3 câu, mang tính khuyến khích và chỉ cách để tránh lặp lại lỗi lần sau.
- \`guidance\` là bản gộp ngắn của \`fixFocus\` và \`preventionTip\`.
- Nếu là lỗi lặp lại, hãy nói nhẹ nhàng rằng học sinh đang gặp lại lỗi quen thuộc này.
- \`mistakeTags\` gồm 1-5 nhãn ngắn như "syntax", "indentation", "variable-name", "print", "colon".
`.trim();

  const content = await callGroqChat(
    [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: [
          `Bài học: ${lesson.title}`,
          `Mục tiêu: ${lesson.objective}`,
          lesson.starterCode ? `Starter code:\n${lesson.starterCode}` : '',
          `Code hiện tại:\n${code}`,
          `Traceback / lỗi Python:\n${errorOutput}`,
          `Lịch sử lỗi gần đây của học sinh:\n${historySummary}`,
          'Hãy phân tích bám sát Traceback trước, rồi trả lời thật rõ ràng, tích cực, và có mẹo để không bị lại lần sau.',
        ]
          .filter(Boolean)
          .join('\n\n'),
      },
    ],
    0.2,
  );

  const parsed = safeJsonParse(content);
  const explanation =
    parsed && typeof parsed.explanation === 'string' && parsed.explanation.trim()
      ? parsed.explanation.trim()
      : 'Code đang gặp lỗi Python. Không sao cả, mình sửa từng chút là được. Hãy nhìn kỹ dòng báo lỗi cuối cùng vì đó thường là manh mối quan trọng nhất.';
  const guidance =
    parsed && typeof parsed.guidance === 'string' && parsed.guidance.trim()
      ? parsed.guidance.trim()
      : 'Em hãy kiểm tra lại dấu ngoặc, dấu hai chấm, tên biến và cách thụt lề ở gần dòng báo lỗi. Lần sau, sau mỗi lần viết một đoạn ngắn, em chạy thử ngay để phát hiện lỗi sớm hơn.';
  const fixFocus =
    parsed && typeof parsed.fixFocus === 'string' && parsed.fixFocus.trim()
      ? parsed.fixFocus.trim()
      : 'Em hãy nhìn vào dòng gần chỗ Python báo lỗi nhất, rồi kiểm tra lại dấu ngoặc, dấu hai chấm và tên biến ở đoạn đó.';
  const preventionTip =
    parsed && typeof parsed.preventionTip === 'string' && parsed.preventionTip.trim()
      ? parsed.preventionTip.trim()
      : 'Không sao cả, lỗi này sửa được. Lần sau em hãy viết từng đoạn ngắn rồi chạy thử ngay để bắt lỗi sớm hơn.';
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

function sanitizeUser(user) {
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    isPro: Boolean(user.isPro ?? user.is_pro),
  };
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
        users.is_pro AS "isPro"
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
    await ensureAppSchema();
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

export async function onlinePresenceStreamHandler(request, response) {
  try {
    await ensureAppSchema();
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
    const heartbeat = setInterval(() => {
      sendSseEvent(response, 'heartbeat', { ts: Date.now() });
    }, 15000);

    onlinePresenceConnections.set(connectionId, {
      userId: user.id,
      response,
      heartbeat,
    });

    sendSseEvent(response, 'presence', { count: getOnlineLearnerCount() });
    broadcastOnlineLearnerCount();

    request.on('close', () => {
      const connection = onlinePresenceConnections.get(connectionId);
      if (!connection) {
        return;
      }

      clearInterval(connection.heartbeat);
      onlinePresenceConnections.delete(connectionId);
      broadcastOnlineLearnerCount();
    });
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
    await ensureAppSchema();
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
        RETURNING id, username, email, is_pro AS "isPro"
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
    await ensureAppSchema();
    const users = await query(
      `
        SELECT id, username, email, is_pro AS "isPro", password_hash AS "passwordHash"
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

export async function logoutHandler(request, response) {
  try {
    await ensureAppSchema();
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
    await ensureAppSchema();
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
    await ensureAppSchema();
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
    await ensureAppSchema();
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

    await query(
      `
        INSERT INTO user_lesson_progress (user_id, lesson_id)
        VALUES ($1, $2)
        ON CONFLICT (user_id, lesson_id)
        DO UPDATE SET completed_at = CURRENT_TIMESTAMP
      `,
      [user.id, lessonId],
    );

    response.status(201).json({ ok: true });
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
    await ensureAppSchema();
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
    await ensureAppSchema();
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
    const ipLimitStatus = enforceHintIpRateLimit(request);
    if (!ipLimitStatus.allowed) {
      response.setHeader('Retry-After', String(ipLimitStatus.retryAfterSeconds));
      response.status(429).json({
        message: `Ban dang gui qua nhieu yeu cau goi y AI tu cung mot mang. Hay thu lai sau khoang ${ipLimitStatus.retryAfterSeconds} giay.`,
      });
      return;
    }

    const dayBounds = getUtcDayBounds();
    const userDailyUsage = await getDailyHintUsageCount(user.id, dayBounds);
    if (userDailyUsage >= entitlement.dailyQuota) {
      response.status(429).json({
        message: `Ban da dung het ${entitlement.dailyQuota} luot goi y AI hom nay. Hay quay lai vao ngay mai hoac nang cap Pro neu can them quota.`,
      });
      return;
    }

    const lessonDailyUsage = await getDailyHintUsageCountByLesson(user.id, lesson.id, dayBounds);
    if (lessonDailyUsage >= entitlement.lessonDailyQuota) {
      response.status(429).json({
        message: `Ban da dung het ${entitlement.lessonDailyQuota} luot goi y cho bai hoc nay trong hom nay. Hay thu tu chinh code truoc roi quay lai sau.`,
      });
      return;
    }

    const cooldownStatus = getHintCooldownStatus(user.id, entitlement.cooldownMs);
    if (!cooldownStatus.allowed) {
      response.setHeader('Retry-After', String(cooldownStatus.retryAfterSeconds));
      response.status(429).json({
        message: `Hay cho them ${cooldownStatus.retryAfterSeconds} giay roi xin goi y tiep nhe.`,
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

    markHintCooldownUsed(user.id);

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
              const tags = extractMistakeTags(item.mistakeTags).join(', ') || 'khong co tag';
              return `${index + 1}. Loi hay gap: ${item.errorMessage}\nGoi y tung dua: ${item.aiGuidance}\nTag: ${tags}`;
            })
            .join('\n\n')
        : 'Chua co lich su loi cho bai hoc nay.';

    const systemPrompt = `
Ban la ban dong hanh day Python cho hoc sinh lop 6.

Muc tieu:
- Giup tre thay hoc Python vui va de hieu.
- Khuyen khich tre tu sua code.
- Khong lam tre cam thay that bai.

Quy tac:
- Chi dua goi y ngan gon.
- Khong giai full bai.
- Khong dua nguyen dap an hoan chinh.
- Chi cho ra buoc tiep theo hoac loi nho can sua.
- Uu tien dat cau hoi goi mo.
- Luon khuyen khich tich cuc.
- Dung tieng Viet don gian cho tre 11-12 tuoi.
- Moi phan hoi toi da 3 cau ngan.

Phong cach:
- Giong nguoi ban dong hanh trong game.
- Khong giong giao vien nghiem khac.
- Khong dung thuat ngu ky thuat kho.
`.trim();

    const latestRuntimeContext = [
      errorOutput ? `Loi Python gan nhat:\n${normalizeMultilineText(errorOutput)}` : '',
      !errorOutput && output ? `Ket qua chay gan nhat:\n${normalizeMultilineText(output)}` : '',
    ]
      .filter(Boolean)
      .join('\n\n');

    const hintPrompt = [
      `Bai hoc: ${lesson.title}`,
      `Muc tieu: ${lesson.objective}`,
      lesson.starterCode ? `Starter code:\n${lesson.starterCode}` : '',
      `Code hien tai cua hoc sinh:\n${normalizedCode}`,
      latestRuntimeContext,
      `Lich su loi hay gap cua hoc sinh o bai nay:\n${mistakeSummary}`,
      'Hay dua ra 1-3 goi y ngan giup hoc sinh tu sua, uu tien dung cho cac loi em ay hay lap lai.',
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

    const hint = hintResult.hint || 'Chua nhan duoc goi y tu Groq.';

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
        message: 'He thong goi y AI dang ban hoac tam cham gioi han. Ban thu lai sau it phut nhe.',
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

