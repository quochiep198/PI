-- Migration: Add accessory_class column to items table and populate for seeded accessories

ALTER TABLE items ADD COLUMN IF NOT EXISTS accessory_class VARCHAR(50);

-- Populate accessory_class based on item image_data (emoji) categories
-- 1. Hats and headwear
UPDATE items 
SET accessory_class = 'accessory-hat' 
WHERE image_data IN ('🎩', '👑', '🎧', '🧣', '💡', '💎');

-- 2. Glasses and eyewear
UPDATE items 
SET accessory_class = 'accessory-glasses' 
WHERE image_data IN ('🕶️', '👓');

-- 3. Keyboards, books, back items, handheld food
UPDATE items 
SET accessory_class = 'accessory-keyboard' 
WHERE image_data IN ('⌨️', '📖', '🎒', '🧸', '☕', '🍔', '👟');

-- 4. Handheld wands, weapons, shields, cup/trophy
UPDATE items 
SET accessory_class = 'accessory-wand' 
WHERE image_data IN ('🪄', '✨', '🎈', '🏆', '🛡️', '🔨', '🍀', '🥤', '🕯️', '🎐');

-- 5. Fallback for any other pet accessories
UPDATE items 
SET accessory_class = 'accessory-fallback' 
WHERE asset_type = 'pet_accessory' AND accessory_class IS NULL;
