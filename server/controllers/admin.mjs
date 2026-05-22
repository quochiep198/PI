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

export async function getAvatarsHandler(request, response) {
  try {
    const user = await requireAuthenticatedUser(request, response);
    if (!user) {
      return;
    }

    const rows = await query(
      `
        SELECT id, name, description, image_data AS "imageData", is_active AS "isActive", created_at AS "createdAt", updated_at AS "updatedAt"
        FROM avatars
        WHERE user_id = $1
        ORDER BY is_active DESC, updated_at DESC
      `,
      [user.id],
    );

    response.json({ avatars: rows });
  } catch (error) {
    response.status(500).json({
      message: error instanceof Error ? error.message : 'Không thể lấy danh sách avatar.',
    });
  }
}

export async function createAvatarHandler(request, response) {
  try {
    const user = await requireAuthenticatedUser(request, response);
    if (!user) {
      return;
    }

    // Check if user is admin
    if (!user.isAdmin) {
      response.status(403).json({ message: 'Chỉ admin mới có quyền tạo avatar.' });
      return;
    }

    const { name, description, imageData, setActive } = getRequestBody(request);

    if (!name?.trim()) {
      response.status(400).json({ message: 'Tên avatar không được để trống.' });
      return;
    }

    if (!imageData?.trim()) {
      response.status(400).json({ message: 'Hình ảnh không được để trống.' });
      return;
    }

    // Check if image data is valid base64
    if (!imageData.startsWith('data:image/')) {
      response.status(400).json({ message: 'Định dạng hình ảnh không hợp lệ.' });
      return;
    }

    // Start transaction to ensure only one active avatar
    const shouldSetActive = setActive === true;

    if (shouldSetActive) {
      // Deactivate all other avatars for this user
      await execute(
        `UPDATE avatars SET is_active = FALSE WHERE user_id = $1`,
        [user.id],
      );
    }

    // Check if this avatar name already exists for user
    const existingAvatar = await query(
      `SELECT id FROM avatars WHERE user_id = $1 AND name = $2`,
      [user.id, name.trim()],
    );

    let rows;
    if (existingAvatar.length > 0) {
      // Update existing avatar
      rows = await query(
        `
          UPDATE avatars
          SET description = $3, image_data = $4, is_active = $5, updated_at = CURRENT_TIMESTAMP
          WHERE id = $1 AND user_id = $2
          RETURNING id, name, description, image_data AS "imageData", is_active AS "isActive", created_at AS "createdAt", updated_at AS "updatedAt"
        `,
        [existingAvatar[0].id, user.id, description?.trim() || null, imageData, shouldSetActive],
      );
    } else {
      // Insert new avatar
      rows = await query(
        `
          INSERT INTO avatars (user_id, name, description, image_data, is_active)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING id, name, description, image_data AS "imageData", is_active AS "isActive", created_at AS "createdAt", updated_at AS "updatedAt"
        `,
        [user.id, name.trim(), description?.trim() || null, imageData, shouldSetActive],
      );
    }

    response.status(201).json({
      success: true,
      message: 'Avatar đã được lưu thành công.',
      avatar: rows[0],
    });
  } catch (error) {
    response.status(500).json({
      message: error instanceof Error ? error.message : 'Không thể tạo avatar.',
    });
  }
}

export async function getItemsHandler(request, response) {
  try {
    const user = await requireAuthenticatedUser(request, response);
    if (!user) {
      return;
    }

    // Get items for user's avatar
    const rows = await query(
      `
        SELECT i.id, i.avatar_id AS "avatarId", i.name, i.asset_type AS "assetType", i.description, i.image_data AS "imageData", i.price, i.created_at AS "createdAt", i.updated_at AS "updatedAt"
        FROM items i
        INNER JOIN avatars a ON a.id = i.avatar_id
        WHERE a.user_id = $1
        ORDER BY i.created_at DESC
      `,
      [user.id],
    );

    response.json({ items: rows });
  } catch (error) {
    response.status(500).json({
      message: error instanceof Error ? error.message : 'Không thể lấy danh sách items.',
    });
  }
}

export async function createItemHandler(request, response) {
  try {
    const user = await requireAuthenticatedUser(request, response);
    if (!user) {
      return;
    }

    // Check if user is admin
    if (!user.isAdmin) {
      response.status(403).json({ message: 'Chỉ admin mới có quyền tạo item.' });
      return;
    }

    const { name, assetType, description, price, imageData } = getRequestBody(request);

    if (!name?.trim()) {
      response.status(400).json({ message: 'Tên item không được để trống.' });
      return;
    }

    if (!assetType) {
      response.status(400).json({ message: 'Loại item không được để trống.' });
      return;
    }

    if (assetType === 'avatar') {
      response.status(400).json({ message: 'Không thể tạo item với loại avatar. Sử dụng API avatars.' });
      return;
    }

    if (!imageData?.trim()) {
      response.status(400).json({ message: 'Hình ảnh không được để trống.' });
      return;
    }

    if (!imageData.startsWith('data:image/')) {
      response.status(400).json({ message: 'Định dạng hình ảnh không hợp lệ.' });
      return;
    }

    // Check if user has an active avatar (priority) or any avatar (fallback)
    const avatarRows = await query(
      `SELECT id FROM avatars WHERE user_id = $1 ORDER BY is_active DESC, created_at DESC LIMIT 1`,
      [user.id],
    );

    if (avatarRows.length === 0) {
      response.status(400).json({ message: 'Bạn cần tạo avatar trước khi thêm items.' });
      return;
    }

    const avatarId = avatarRows[0].id;
    const itemPrice = typeof price === 'number' && price >= 0 ? price : 0;

    // Save the item
    const rows = await query(
      `
        INSERT INTO items (avatar_id, name, asset_type, description, image_data, price)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, avatar_id AS "avatarId", name, asset_type AS "assetType", description, image_data AS "imageData", price, created_at AS "createdAt", updated_at AS "updatedAt"
      `,
      [avatarId, name.trim(), assetType, description?.trim() || null, imageData, itemPrice],
    );

    response.status(201).json({
      success: true,
      message: 'Item đã được lưu thành công.',
      item: rows[0],
    });
  } catch (error) {
    response.status(500).json({
      message: error instanceof Error ? error.message : 'Không thể tạo item.',
    });
  }
}

