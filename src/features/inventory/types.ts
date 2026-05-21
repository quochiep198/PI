export interface InventoryItem {
  id: string;
  name: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  equipped: boolean;
}

export interface InventoryCategory {
  id: string;
  name: string;
  icon: string;
  items: InventoryItem[];
}

export type InventoryTab = 'hats' | 'glasses' | 'clothes' | 'back';