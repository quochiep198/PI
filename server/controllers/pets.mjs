import { execute, query } from '../db.mjs';
import {
  getRequestBody,
  requireAuthenticatedUser,
  getUserStreakData,
  getUserCoins,
  addUserCoins,
  ensureUserCoins,
} from '../utils/core.mjs';

// Helper to fetch active pet and apply hunger decay logic
export async function getAndUpdateActivePet(userId) {
  const activePetRows = await query(
    `
      SELECT up.id, up.nickname, up.level, up.current_xp AS "currentXp", up.next_level_xp AS "nextLevelXp", up.fullness, up.is_active AS "isActive", up.last_fed_at AS "lastFedAt",
             pt.id AS "templateId", pt.name, pt.code_name AS "codeName", pt.description, 
             pt.image_baby AS "imageBaby", pt.image_teen AS "imageTeen", pt.image_adult AS "imageAdult", pt.image_master AS "imageMaster"
      FROM user_pets up
      INNER JOIN pet_templates pt ON pt.id = up.pet_template_id
      WHERE up.user_id = $1 AND up.is_active = TRUE
      LIMIT 1
    `,
    [userId]
  );

  if (activePetRows.length === 0) {
    return null;
  }

  const pet = activePetRows[0];
  const lastFed = new Date(pet.lastFedAt);
  const now = new Date();
  const msPassed = now.getTime() - lastFed.getTime();
  const hoursPassed = Math.floor(msPassed / (1000 * 60 * 60));

  if (hoursPassed > 0) {
    // Decay 3 points of fullness per hour (takes ~33 hours to go from 100 to 0)
    const DECAY_RATE_PER_HOUR = 3;
    const decay = hoursPassed * DECAY_RATE_PER_HOUR;
    const newFullness = Math.max(0, pet.fullness - decay);
    const newLastFedAt = new Date(lastFed.getTime() + hoursPassed * 60 * 60 * 1000);

    await execute(
      `
        UPDATE user_pets
        SET fullness = $1, last_fed_at = $2, updated_at = CURRENT_TIMESTAMP
        WHERE id = $3
      `,
      [newFullness, newLastFedAt, pet.id]
    );

    pet.fullness = newFullness;
    pet.lastFedAt = newLastFedAt;
  }

  return pet;
}

// Get active pet and all pet templates
export async function getActivePetHandler(request, response) {
  try {
    const user = await requireAuthenticatedUser(request, response);
    if (!user) {
      return;
    }

    // Get active pet for user using helper to apply decay logic
    const activePet = await getAndUpdateActivePet(user.id);

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
        SELECT ui.id, i.id AS "itemId", i.name, i.asset_type AS "assetType", i.image_data AS "imageData", i.accessory_class AS "accessoryClass"
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
      activePet,
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

// Switch pet template for user's active pet
export async function switchPetTemplateHandler(request, response) {
  try {
    const user = await requireAuthenticatedUser(request, response);
    if (!user) {
      return;
    }

    const { templateId } = getRequestBody(request);
    if (!templateId) {
      response.status(400).json({ message: 'Template ID không hợp lệ.' });
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

    // Verify user has an active pet
    const activePetRows = await query(
      `SELECT id FROM user_pets WHERE user_id = $1 AND is_active = TRUE`,
      [user.id]
    );
    if (activePetRows.length === 0) {
      response.status(400).json({ message: 'Bạn chưa nhận nuôi thú cưng nào.' });
      return;
    }

    // Update active pet's template
    await execute(
      `
        UPDATE user_pets
        SET pet_template_id = $1, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $2 AND is_active = TRUE
      `,
      [templateId, user.id]
    );

    response.json({
      success: true,
      message: `Đã đổi thành công sang thú cưng ${templateRows[0].name}!`
    });
  } catch (error) {
    response.status(500).json({
      message: error instanceof Error ? error.message : 'Không thể đổi mẫu thú cưng.',
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

    // Get active pet and apply decay if needed
    const pet = await getAndUpdateActivePet(user.id);

    if (!pet) {
      response.status(404).json({ message: 'Bạn chưa có thú cưng nào đang hoạt động.' });
      return;
    }

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

    const { itemId, active } = getRequestBody(request);
    
    // If itemId is null or undefined, deactivate all pet accessories (unequip)
    if (itemId === null || itemId === undefined) {
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
      response.json({
        success: true,
        message: 'Đã tháo tất cả phụ kiện thú cưng.',
      });
      return;
    }

    // Verify item ownership and type
    const userItemRows = await query(
      `
        SELECT ui.id, ui.is_active, i.asset_type
        FROM user_items ui
        INNER JOIN items i ON i.id = ui.item_id
        WHERE ui.item_id = $1 AND ui.user_id = $2
      `,
      [itemId, user.id]
    );

    if (userItemRows.length === 0) {
      response.status(404).json({ message: 'Bạn chưa sở hữu phụ kiện này.' });
      return;
    }

    const item = userItemRows[0];
    if (item.asset_type !== 'pet_accessory') {
      response.status(400).json({ message: 'Vật phẩm này không dành cho thú cưng.' });
      return;
    }

    // Determine target active state: use 'active' parameter if provided, otherwise toggle
    const targetActive = active !== undefined ? Boolean(active) : !item.is_active;

    // Update selected accessory state
    await execute(
      `UPDATE user_items SET is_active = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
      [targetActive, item.id]
    );

    response.json({
      success: true,
      message: targetActive ? 'Đã trang bị phụ kiện cho thú cưng.' : 'Đã tháo phụ kiện thú cưng.',
    });
  } catch (error) {
    response.status(500).json({
      message: error instanceof Error ? error.message : 'Không thể thay trang bị.',
    });
  }
}

// Get pet accessories available in shop
export async function getPetShopHandler(request, response) {
  try {
    const user = await requireAuthenticatedUser(request, response);
    if (!user) {
      return;
    }

    // Fetch all items of asset_type 'pet_accessory'
    const shopItems = await query(
      `
        SELECT id, name, description, image_data AS "imageData", price, accessory_class AS "accessoryClass"
        FROM items
        WHERE asset_type = 'pet_accessory'
        ORDER BY price ASC, id ASC
      `
    );

    // Fetch user items (to know what accessories the user already owns)
    const ownedItemRows = await query(
      `
        SELECT item_id AS "itemId"
        FROM user_items
        WHERE user_id = $1
      `,
      [user.id]
    );

    const ownedItemIds = new Set(ownedItemRows.map((row) => row.itemId));

    // Mark items as purchased if the user already owns them
    const itemsWithStatus = shopItems.map((item) => ({
      ...item,
      isOwned: ownedItemIds.has(item.id),
    }));

    // Fetch user coins balance
    const coins = await getUserCoins(user.id);

    response.json({
      shopItems: itemsWithStatus,
      coins,
    });
  } catch (error) {
    response.status(500).json({
      message: error instanceof Error ? error.message : 'Không thể tải danh sách cửa hàng.',
    });
  }
}

// Buy pet accessory
export async function buyPetAccessoryHandler(request, response) {
  try {
    const user = await requireAuthenticatedUser(request, response);
    if (!user) {
      return;
    }

    const { itemId } = getRequestBody(request);
    if (!itemId) {
      response.status(400).json({ message: 'Vật phẩm không hợp lệ.' });
      return;
    }

    // Fetch item details
    const itemRows = await query(
      `
        SELECT id, name, price, asset_type AS "assetType"
        FROM items
        WHERE id = $1 AND asset_type = 'pet_accessory'
        LIMIT 1
      `,
      [itemId]
    );

    if (itemRows.length === 0) {
      response.status(404).json({ message: 'Vật phẩm không tồn tại.' });
      return;
    }

    const item = itemRows[0];

    // Check if user already owns this item
    const ownedRows = await query(
      `
        SELECT id FROM user_items
        WHERE user_id = $1 AND item_id = $2
        LIMIT 1
      `,
      [user.id, itemId]
    );

    if (ownedRows.length > 0) {
      response.status(400).json({ message: 'Bạn đã sở hữu phụ kiện này rồi.' });
      return;
    }

    // Check user coins balance
    const coins = await getUserCoins(user.id);
    if (coins < item.price) {
      response.status(400).json({
        message: `Bạn không đủ Coins. Phụ kiện này cần ${item.price} Coins, bạn hiện chỉ có ${coins} Coins.`,
      });
      return;
    }

    // Deduct coins and insert into user_items
    const newCoins = coins - item.price;
    
    await execute(
      `
        INSERT INTO user_items (user_id, item_id, is_active)
        VALUES ($1, $2, FALSE)
      `,
      [user.id, itemId]
    );

    // Update user coins
    await execute(
      `
        INSERT INTO user_coins (user_id, coins)
        VALUES ($1, $2)
        ON CONFLICT (user_id)
        DO UPDATE SET coins = EXCLUDED.coins
      `,
      [user.id, newCoins]
    );

    response.json({
      success: true,
      message: `Đã mua thành công ${item.name}!`,
      newCoins,
      itemId,
    });
  } catch (error) {
    response.status(500).json({
      message: error instanceof Error ? error.message : 'Không thể thực hiện giao dịch.',
    });
  }
}
