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

export async function setActiveAvatarHandler(request, response) {
  try {
    const user = await requireAuthenticatedUser(request, response);
    if (!user) {
      return;
    }

    const { avatarId } = getRequestBody(request);

    if (!avatarId) {
      response.status(400).json({ message: 'Avatar ID không hợp lệ.' });
      return;
    }

    // Verify avatar belongs to user
    const avatarRows = await query(
      `SELECT id FROM avatars WHERE id = $1 AND user_id = $2`,
      [avatarId, user.id],
    );

    if (avatarRows.length === 0) {
      response.status(404).json({ message: 'Avatar không tìm thấy.' });
      return;
    }

    // Deactivate all avatars for this user (using execute for UPDATE)
    await execute(
      `UPDATE avatars SET is_active = FALSE WHERE user_id = $1`,
      [user.id],
    );

    // Activate the selected avatar
    await execute(
      `UPDATE avatars SET is_active = TRUE WHERE id = $1 AND user_id = $2`,
      [avatarId, user.id],
    );

    response.json({
      success: true,
      message: 'Đã cập nhật avatar mặc định.',
    });
  } catch (error) {
    response.status(500).json({
      message: error instanceof Error ? error.message : 'Không thể cập nhật avatar.',
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
        SELECT i.id, i.avatar_id AS "avatarId", i.name, i.asset_type AS "assetType", i.description, i.image_data AS "imageData", i.price, i.accessory_class AS "accessoryClass", i.created_at AS "createdAt", i.updated_at AS "updatedAt"
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

    const { name, assetType, description, price, imageData, accessoryClass } = getRequestBody(request);

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
        INSERT INTO items (avatar_id, name, asset_type, description, image_data, price, accessory_class)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id, avatar_id AS "avatarId", name, asset_type AS "assetType", description, image_data AS "imageData", price, accessory_class AS "accessoryClass", created_at AS "createdAt", updated_at AS "updatedAt"
      `,
      [avatarId, name.trim(), assetType, description?.trim() || null, imageData, itemPrice, accessoryClass || null],
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

// Get user items by type
export async function getUserItemsHandler(request, response) {
  try {
    const user = await requireAuthenticatedUser(request, response);
    if (!user) {
      return;
    }

    const { type } = getRequestBody(request) || {};

    let queryText = `
      SELECT ui.id, ui.is_active AS "isActive", ui.created_at AS "createdAt",
             i.id AS "itemId", i.name, i.asset_type AS "assetType", i.description,
             i.image_data AS "imageData", i.price, i.accessory_class AS "accessoryClass"
      FROM user_items ui
      INNER JOIN items i ON i.id = ui.item_id
      WHERE ui.user_id = $1
    `;
    const params = [user.id];

    if (type && type !== 'all') {
      queryText += ` AND i.asset_type = $2`;
      params.push(type);
    }

    queryText += ` ORDER BY i.asset_type, ui.is_active DESC, ui.created_at DESC`;

    const rows = await query(queryText, params);

    response.json({ items: rows });
  } catch (error) {
    response.status(500).json({
      message: error instanceof Error ? error.message : 'Không thể lấy danh sách items.',
    });
  }
}

// Set active item for a specific type
export async function setActiveUserItemHandler(request, response) {
  try {
    const user = await requireAuthenticatedUser(request, response);
    if (!user) {
      return;
    }

    const { userItemId } = getRequestBody(request);

    if (!userItemId) {
      response.status(400).json({ message: 'User Item ID không hợp lệ.' });
      return;
    }

    // Verify user_item belongs to user and get its asset_type
    const userItemRows = await query(
      `SELECT ui.*, i.asset_type
       FROM user_items ui
       INNER JOIN items i ON i.id = ui.item_id
       WHERE ui.id = $1 AND ui.user_id = $2`,
      [userItemId, user.id],
    );

    if (userItemRows.length === 0) {
      response.status(404).json({ message: 'Item không tìm thấy.' });
      return;
    }

    const assetType = userItemRows[0].asset_type;

    // Deactivate all items of same type for this user
    await execute(`
      UPDATE user_items
      SET is_active = FALSE
      WHERE user_id = $1
        AND item_id IN (SELECT id FROM items WHERE asset_type = $2)
    `, [user.id, assetType]);

    // Activate the selected item
    await execute(
      `UPDATE user_items SET is_active = TRUE, updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [userItemId],
    );

    response.json({
      success: true,
      message: 'Đã cập nhật trang bị.',
    });
  } catch (error) {
    response.status(500).json({
      message: error instanceof Error ? error.message : 'Không thể cập nhật item.',
    });
  }
}

// Add item to user's inventory
export async function addUserItemHandler(request, response) {
  try {
    const user = await requireAuthenticatedUser(request, response);
    if (!user) {
      return;
    }

    const { itemId } = getRequestBody(request);

    if (!itemId) {
      response.status(400).json({ message: 'Item ID không hợp lệ.' });
      return;
    }

    // Check if item exists
    const itemRows = await query(`SELECT id, asset_type FROM items WHERE id = $1`, [itemId]);
    if (itemRows.length === 0) {
      response.status(404).json({ message: 'Item không tồn tại.' });
      return;
    }

    // Check if already owned
    const existingRows = await query(
      `SELECT id FROM user_items WHERE user_id = $1 AND item_id = $2`,
      [user.id, itemId],
    );

    if (existingRows.length > 0) {
      response.status(400).json({ message: 'Bạn đã sở hữu item này rồi.' });
      return;
    }

    const assetType = itemRows[0].asset_type;

    // Deactivate other items of same type if any exist
    await execute(`
      UPDATE user_items
      SET is_active = FALSE
      WHERE user_id = $1
        AND item_id IN (SELECT id FROM items WHERE asset_type = $2)
        AND id NOT IN (SELECT id FROM user_items WHERE user_id = $1 AND item_id = $2)
    `, [user.id, assetType]);

    // Add new item (and make active if first item of this type)
    const isFirstOfType = await query(
      `SELECT COUNT(*)::int as count FROM user_items ui INNER JOIN items i ON i.id = ui.item_id WHERE ui.user_id = $1 AND i.asset_type = $2`,
      [user.id, assetType],
    );

    const rows = await query(
      `
        INSERT INTO user_items (user_id, item_id, is_active)
        VALUES ($1, $2, $3)
        RETURNING id, is_active AS "isActive", created_at AS "createdAt"
      `,
      [user.id, itemId, isFirstOfType[0].count === 0],
    );

    response.status(201).json({
      success: true,
      message: 'Đã thêm item vào kho.',
      userItem: rows[0],
    });
  } catch (error) {
    response.status(500).json({
      message: error instanceof Error ? error.message : 'Không thể thêm item.',
    });
  }
}

