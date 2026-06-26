export interface PetTemplate {
  id: number;
  name: string;
  codeName: string;
  description: string;
  imageBaby: string;
  imageTeen: string;
  imageAdult: string;
  imageMaster: string;
  priceCoins: number;
}

export interface UserPet {
  id: number;
  templateId: number;
  name: string;
  codeName: string;
  description: string;
  nickname: string;
  level: number;
  currentXp: number;
  nextLevelXp: number;
  fullness: number;
  isActive: boolean;
  imageBaby: string;
  imageTeen: string;
  imageAdult: string;
  imageMaster: string;
}

export interface PetAccessory {
  id: number;
  itemId: number;
  name: string;
  assetType: string;
  imageData: string;
  accessoryClass?: string;
}

export interface PetShopItem {
  id: number;
  name: string;
  description: string;
  imageData: string;
  price: number;
  isOwned: boolean;
  accessoryClass?: string;
}

export interface PetShopResponse {
  shopItems: PetShopItem[];
  coins: number;
}

export interface PetStateResponse {
  activePet: UserPet | null;
  templates: PetTemplate[];
  activeAccessories: PetAccessory[];
  isStreakExcited: boolean;
}

export interface FeedResponse {
  success: boolean;
  message: string;
  leveledUp: boolean;
  xpAdded: number;
  newCoins: number;
  pet: {
    id: number;
    nickname: string;
    level: number;
    currentXp: number;
    nextLevelXp: number;
    fullness: number;
  };
}
