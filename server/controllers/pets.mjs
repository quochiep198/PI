import { execute, query } from '../db.mjs';
import {
  getRequestBody,
  requireAuthenticatedUser,
  getUserStreakData,
  getUserCoins,
  addUserCoins,
  ensureUserCoins,
} from '../utils/core.mjs';

// Get active pet and all pet templates
export async function getActivePetHandler(request, response) {
  try {
    const user = await requireAuthenticatedUser(request, response);
    if (!user) {
      return;
    }

    // Get active pet for user
    const activePetRows = await query(
      `
        SELECT up.id, up.nickname, up.level, up.current_xp AS "currentXp", up.next_level_xp AS "nextLevelXp", up.fullness, up.is_active AS "isActive",
               pt.id AS "templateId", pt.name, pt.code_name AS "codeName", pt.description, 
               pt.image_baby AS "imageBaby", pt.image_teen AS "imageTeen", pt.image_adult AS "imageAdult", pt.image_master AS "imageMaster"
        FROM user_pets up
        INNER JOIN pet_templates pt ON pt.id = up.pet_template_id
        WHERE up.user_id = $1 AND up.is_active = TRUE
        LIMIT 1
      `,
      [user.id]
    );

    // Fetch all available templates
    const templates = await query(
      `
        SELECT id, name, code_name AS "codeName", description, price_coins AS "priceCoins",
               image_baby AS "imageBaby", image_teen AS "imageTeen", image_adult AS "imageAdult", image_master AS "imageMaster"
        FROM pet_templates
        ORDER BY id ASC
      `
    );

    // Fetch active pet accessories (equipped items of type 'pet_accessory')
    const activeAccessories = await query(
      `
        SELECT ui.id, i.id AS "itemId", i.name, i.asset_type AS "assetType", i.image_data AS "imageData"
        FROM user_items ui
        INNER JOIN items i ON i.id = ui.item_id
        WHERE ui.user_id = $1 AND ui.is_active = TRUE AND i.asset_type = 'pet_accessory'
      `,
      [user.id]
    );

    // Fetch user streak data to determine if excited
    const streakData = await getUserStreakData(user.id);
    const isStreakExcited = streakData.currentStreak >= 3;

    response.json({
      activePet: activePetRows[0] || null,
      templates,
      activeAccessories,
      isStreakExcited
    });
  } catch (error) {
    response.status(500).json({
      message: error instanceof Error ? error.message : 'Không thể lấy thông tin thú cưng.',
    });
  }
}

// Adopt a new pet
export async function adoptPetHandler(request, response) {
  try {
    const user = await requireAuthenticatedUser(request, response);
    if (!user) {
      return;
    }

    const { templateId, nickname } = getRequestBody(request);
    if (!templateId) {
      response.status(400).json({ message: 'Mẫu thú cưng ID không hợp lệ.' });
      return;
    }

    // Check if template exists
    const templateRows = await query(
      `SELECT id, name FROM pet_templates WHERE id = $1`,
      [templateId]
    );
    if (templateRows.length === 0) {
      response.status(404).json({ message: 'Không tìm thấy mẫu thú cưng này.' });
      return;
    }

    // Check if user already has an active pet
    const activePetRows = await query(
      `SELECT id FROM user_pets WHERE user_id = $1 AND is_active = TRUE`,
      [user.id]
    );
    if (activePetRows.length > 0) {
      response.status(400).json({ message: 'Bạn đã có thú cưng đang hoạt động.' });
      return;
    }

    // Deactivate all pets just in case
    await execute(
      `UPDATE user_pets SET is_active = FALSE WHERE user_id = $1`,
      [user.id]
    );

    // Adopt and set active
    const result = await query(
      `
        INSERT INTO user_pets (user_id, pet_template_id, nickname, level, current_xp, next_level_xp, fullness, is_active)
        VALUES ($1, $2, $3, 1, 0, 100, 50, TRUE)
        RETURNING id, nickname, level, current_xp AS "currentXp", next_level_xp AS "nextLevelXp", fullness, is_active AS "isActive"
      `,
      [user.id, templateId, nickname?.trim() || templateRows[0].name]
    );

    response.status(201).json({
      success: true,
      message: 'Nhận nuôi thú cưng thành công!',
      pet: result[0]
    });
  } catch (error) {
    response.status(500).json({
      message: error instanceof Error ? error.message : 'Không thể nhận nuôi thú cưng.',
    });
  }
}

// Feed active pet
export async function feedPetHandler(request, response) {
  try {
    const user = await requireAuthenticatedUser(request, response);
    if (!user) {
      return;
    }

    // Get active pet
    const activePetRows = await query(
      `
        SELECT up.id, up.nickname, up.level, up.current_xp AS "currentXp", up.next_level_xp AS "nextLevelXp", up.fullness
        FROM user_pets up
        WHERE up.user_id = $1 AND up.is_active = TRUE
        LIMIT 1
      `,
      [user.id]
    );

    if (activePetRows.length === 0) {
      response.status(404).json({ message: 'Bạn chưa có thú cưng nào đang hoạt động.' });
      return;
    }

    const pet = activePetRows[0];

    // Check fullness limit
    if (pet.fullness >= 100) {
      response.status(400).json({ message: 'Thú cưng của bạn đã no rồi, không thể ăn thêm!' });
      return;
    }

    // Cost and nutrition configuration
    const FEED_COST = 20;
    const FULLNESS_GAIN = 20;
    const BASE_XP_GAIN = 15;

    // Check coins balance
    await ensureUserCoins(user.id);
    const coins = await getUserCoins(user.id);

    if (coins < FEED_COST) {
      response.status(400).json({ message: `Bạn không đủ Coins. Cho ăn cần ${FEED_COST} Coins, bạn hiện có ${coins} Coins.` });
      return;
    }

    // Get streak to check if excited
    const streakData = await getUserStreakData(user.id);
    const isExcited = streakData.currentStreak >= 3;
    const xpMultiplier = isExcited ? 1.5 : 1.0;
    const xpToAdd = Math.round(BASE_XP_GAIN * xpMultiplier);

    // Deduct coins
    await addUserCoins(user.id, -FEED_COST);
    const newCoins = coins - FEED_COST;

    // Calculate growth logic
    let newFullness = Math.min(100, pet.fullness + FULLNESS_GAIN);
    let newXp = pet.currentXp + xpToAdd;
    let newLevel = pet.level;
    let newNextLevelXp = pet.nextLevelXp;
    let leveledUp = false;

    // Multi-level up support
    while (newXp >= newNextLevelXp) {
      newXp -= newNextLevelXp;
      newLevel += 1;
      newNextLevelXp = newLevel * 100;
      leveledUp = true;
    }

    // Save status
    await execute(
      `
        UPDATE user_pets
        SET level = $1, current_xp = $2, next_level_xp = $3, fullness = $4, last_fed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE id = $5
      `,
      [newLevel, newXp, newNextLevelXp, newFullness, pet.id]
    );

    response.json({
      success: true,
      message: leveledUp 
        ? `Chúc mừng! Thú cưng của bạn đã thăng cấp lên Level ${newLevel}!` 
        : `Đã cho Pet ăn! Pet nhận được +${xpToAdd} XP và +${FULLNESS_GAIN} độ no.`,
      leveledUp,
      xpAdded: xpToAdd,
      newCoins,
      pet: {
        id: pet.id,
        nickname: pet.nickname,
        level: newLevel,
        currentXp: newXp,
        nextLevelXp: newNextLevelXp,
        fullness: newFullness
      }
    });
  } catch (error) {
    response.status(500).json({
      message: error instanceof Error ? error.message : 'Không thể cho thú cưng ăn.',
    });
  }
}

// Equip accessory on pet (wraps around user_items activation logic for 'pet_accessory')
export async function equipAccessoryHandler(request, response) {
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

    // Verify item ownership and type
    const userItemRows = await query(
      `
        SELECT ui.id, i.asset_type
        FROM user_items ui
        INNER JOIN items i ON i.id = ui.item_id
        WHERE ui.id = $1 AND ui.user_id = $2
      `,
      [userItemId, user.id]
    );

    if (userItemRows.length === 0) {
      response.status(404).json({ message: 'Trang bị không tìm thấy trong kho đồ.' });
      return;
    }

    const item = userItemRows[0];
    if (item.asset_type !== 'pet_accessory') {
      response.status(400).json({ message: 'Vật phẩm này không dành cho thú cưng.' });
      return;
    }

    // Deactivate other pet accessories
    await execute(
      `
        UPDATE user_items
        SET is_active = FALSE
        WHERE user_id = $1 AND item_id IN (
          SELECT id FROM items WHERE asset_type = 'pet_accessory'
        )
      `,
      [user.id]
    );

    // Equip selected accessory
    await execute(
      `UPDATE user_items SET is_active = TRUE, updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [userItemId]
    );

    response.json({
      success: true,
      message: 'Đã trang bị phụ kiện cho thú cưng.',
    });
  } catch (error) {
    response.status(500).json({
      message: error instanceof Error ? error.message : 'Không thể thay trang bị.',
    });
  }
}
