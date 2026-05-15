# Backend Code Rules

## Project Structure

### File Organization
```
server/
├── index.mjs       # Express app entry point, route definitions
├── handlers.mjs     # All route handlers and business logic
└── db.mjs          # Database connection and schema setup
```

### Configuration
- Environment variables loaded via `dotenv` at startup
- Required env vars: `DATABASE_URL`, `GROQ_API_KEY`
- Optional env vars: `API_PORT`, `GROQ_MODEL`, `GROQ_SMALL_MODEL`

## Database (Neon PostgreSQL via `@neondatabase/serverless`)

### Connection Pattern
```javascript
import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

const sql = neon(process.env.DATABASE_URL);

export async function query(text, params = []) {
  const result = await sql.query(text, params);
  return Array.isArray(result) ? result : result?.rows ?? [];
}

export async function execute(text, params = []) {
  return sql.query(text, params);
}
```

### Schema Management (db.mjs)
- Use `CREATE TABLE IF NOT EXISTS` for migrations
- Add new columns with `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`
- Create indexes after table creation
- Always verify foreign key references exist before adding them

### SQL Style
```javascript
// Parameterized queries (NEVER concatenate user input)
await query(
  `SELECT id, username FROM users WHERE email = $1 LIMIT 1`,
  [normalizedEmail]
);

// Returning data
const result = await query(
  `INSERT INTO users (username, email) VALUES ($1, $2) RETURNING *`,
  [username, email]
);

// JSONB operations
await query(
  `INSERT INTO data (tags) VALUES ($1::jsonb)`,
  [JSON.stringify(tags)]
);
```

### Query Naming Conventions
- Use descriptive names: `getUserById`, `getDailyHintUsageCount`
- Prefix read queries with `get`, `fetch`, `load`
- Prefix write queries with `create`, `update`, `delete`, `insert`

## Express Server (index.mjs)

### App Setup
```javascript
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';

dotenv.config();

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Routes registered with HTTP method + path
app.get('/api/health', healthHandler);
app.post('/api/auth/login', loginHandler);

// Start server
app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});

// Initialize database schema at startup
await ensureAppSchema();
```

## Route Handlers (handlers.mjs)

### Handler Signature
```javascript
export async function handlerName(request, response) {
  try {
    // 1. Authenticate if needed
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return response.status(401).json({ message: 'Authentication required.' });
    }

    // 2. Parse and validate input
    const { field1, field2 } = request.body ?? {};
    if (!field1) {
      return response.status(400).json({ message: 'Missing required field.' });
    }

    // 3. Business logic
    const result = await doSomething(user.id, field1, field2);

    // 4. Return response
    response.status(200).json(result);
  } catch (error) {
    response.status(500).json({
      message: error instanceof Error ? error.message : 'Internal server error.',
    });
  }
}
```

### Response Patterns
```javascript
// Success with 200
response.json({ data: result });

// Created with 201
response.status(201).json({ item: newItem });

// No content with 204
response.status(204).send();

// Error responses
response.status(400).json({ message: 'Validation error.' });
response.status(401).json({ message: 'Authentication required.' });
response.status(403).json({ message: 'Access denied.' });
response.status(404).json({ message: 'Resource not found.' });
response.status(500).json({ message: 'Internal server error.' });

// Rate limited with Retry-After header
response.setHeader('Retry-After', String(retryAfterSeconds));
response.status(429).json({ message: 'Too many requests.' });
```

## Authentication

### Session Cookie Pattern
```javascript
const SESSION_COOKIE_NAME = 'python_adventure_session';
const SESSION_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

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
```

### Session Token Hashing
```javascript
import crypto from 'node:crypto';

function hashSessionToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

async function createSession(userId) {
  const sessionToken = crypto.randomBytes(32).toString('hex');
  const sessionTokenHash = hashSessionToken(sessionToken);
  await execute(
    `INSERT INTO user_sessions (user_id, session_token_hash, expires_at) VALUES ($1, $2, $3)`,
    [userId, sessionTokenHash, expiresAt.toISOString()]
  );
  return sessionToken; // Return unhashed for client
}
```

### Pro User Access Control
```javascript
const PRO_TRACKS = new Set(['Nâng cao lớp 6']);

function canAccessTrack(user, track) {
  if (!PRO_TRACKS.has(track)) {
    return true; // Free track
  }
  return Boolean(user?.isPro ?? user?.is_pro);
}

// Usage in handler
if (!canAccessTrack(user, lesson.track)) {
  return response.status(403).json({
    message: 'This lesson is only available for Pro accounts.',
  });
}
```

## External API Integration (Groq)

### Groq API Client Pattern
```javascript
class GroqRequestError extends Error {
  constructor(message, { status = 500, body = '' } = {}) {
    super(message);
    this.name = 'GroqRequestError';
    this.status = status;
    this.body = body;
  }
}

async function callGroqChat(input = {}, legacyTemperature) {
  const options = Array.isArray(input) ? { messages: input, temperature: legacyTemperature } : input;
  const { messages, temperature = 0.2, model = groqPrimaryModel } = options;

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${groqApiKey}`,
    },
    body: JSON.stringify({ model, temperature, messages }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new GroqRequestError(errorText, { status: response.status, body: errorText });
  }

  const payload = await response.json();
  return payload?.choices?.[0]?.message?.content?.trim() || '';
}
```

### Retry with Fallback
```javascript
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

async function generateWithFallback({ messages, modelOrder }) {
  const uniqueModels = [...new Set(modelOrder.filter(Boolean))];
  let lastError = null;

  for (let i = 0; i < uniqueModels.length; i++) {
    try {
      return { hint: await callGroqChat({ messages, model: uniqueModels[i] }), model: uniqueModels[i] };
    } catch (error) {
      lastError = error;
      if (i < uniqueModels.length - 1 && isRetryableGroqError(error)) {
        continue;
      }
      throw error;
    }
  }
}
```

## Rate Limiting

### Strategy Per Feature
```javascript
const HINT_IP_WINDOW_MS = 10 * 60 * 1000;      // 10 minutes
const HINT_IP_LIMIT = 10;                      // 10 requests per window
const HINT_DAILY_QUOTA_FREE = 5;               // Free: 5 hints/day
const HINT_DAILY_QUOTA_PRO = 40;                // Pro: 40 hints/day

// IP-based rate limit
const hintIpRequestLog = new Map();
function enforceHintIpRateLimit(request) {
  const now = Date.now();
  const ip = getClientIp(request);
  const timestamps = pruneOldTimestamps(hintIpRequestLog.get(ip) || [], now, HINT_IP_WINDOW_MS);

  if (timestamps.length >= HINT_IP_LIMIT) {
    return { allowed: false, retryAfterSeconds: 10 };
  }

  timestamps.push(now);
  hintIpRequestLog.set(ip, timestamps);
  return { allowed: true, retryAfterSeconds: 0 };
}

// User-based quota
async function getDailyHintUsageCount(userId) {
  const result = await query(`SELECT COUNT(*)::int AS count FROM ai_hint_usage WHERE user_id = $1 AND created_at >= $2`, [userId, startOfDay]);
  return result[0]?.count || 0;
}
```

## Request Validation

### Helper Functions
```javascript
function getClientIp(request) {
  const forwardedFor = request.headers?.['x-forwarded-for'];
  if (typeof forwardedFor === 'string' && forwardedFor.trim()) {
    return forwardedFor.split(',')[0].trim();
  }
  return request.socket?.remoteAddress || request.ip || 'unknown';
}

function safeJsonParse(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}
```

### Input Normalization
```javascript
function normalizeIdentifier(value) {
  return String(value || '').trim().toLowerCase();
}

function normalizeMultilineText(value) {
  return String(value || '')
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .trim();
}
```

## Error Logging

### Structured Error Responses
```javascript
response.status(500).json({
  message: error instanceof Error ? error.message : 'Internal server error.',
  // Include for debugging (remove in production)
  ...(process.env.NODE_ENV !== 'production' && { stack: error?.stack }),
});
```

## Security

### Password Hashing
```javascript
import { promisify } from 'node:util';
import crypto from 'node:crypto';

const scryptAsync = promisify(crypto.scrypt);

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = await scryptAsync(password, salt, 64);
  return `${salt}:${Buffer.from(derivedKey).toString('hex')}`;
}

async function verifyPassword(password, storedHash) {
  const [salt, expectedHash] = String(storedHash || '').split(':');
  if (!salt || !expectedHash) return false;

  const derivedKey = await scryptAsync(password, salt, 64);
  return crypto.timingSafeEqual(
    Buffer.from(expectedHash, 'hex'),
    Buffer.from(derivedKey)
  );
}
```

### SSE (Server-Sent Events) Cleanup
```javascript
const onlinePresenceConnections = new Map();

request.on('close', () => {
  const connection = onlinePresenceConnections.get(connectionId);
  if (!connection) return;

  clearInterval(connection.heartbeat);
  onlinePresenceConnections.delete(connectionId);
  // ... broadcast update
});
```

## Code Style

### ES Modules
```javascript
import crypto from 'node:crypto';
import { promisify } from 'node:util';
```

### Async/Await
```javascript
// Always use async/await, avoid .then() chains
// Exception: batch queries in parallel when independent
const [users, lessons] = await Promise.all([
  query('SELECT * FROM users'),
  query('SELECT * FROM lessons'),
]);
```

### Naming
- Handlers: `nounHandler` or `verbNounHandler` (e.g., `loginHandler`, `getUserHandler`)
- Functions: camelCase, descriptive (e.g., `getDailyHintUsageCount`)
- Constants: SCREAMING_SNAKE_CASE for config, camelCase for runtime Maps/Sets
- SQL aliases: use `"alias"` for camelCase columns that become snake_case

### Comment Style
- Minimal comments; use descriptive naming instead
- Exception: explain non-obvious edge cases or workarounds