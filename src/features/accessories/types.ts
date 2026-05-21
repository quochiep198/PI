export type AccessoriesTab = 'hats' | 'glasses' | 'clothes' | 'back' | 'all';

export interface AccessoriesItem {
  id: string;
  name: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  equipped: boolean;
  category: AccessoriesTab;
}