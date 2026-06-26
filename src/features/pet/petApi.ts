import type { PetStateResponse, FeedResponse, UserPet } from './types';

export async function fetchPetState(): Promise<PetStateResponse> {
  const response = await fetch('/api/user-pets/active');
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Không thể tải thông tin thú cưng.');
  }
  return response.json() as Promise<PetStateResponse>;
}

export async function adoptPet(templateId: number, nickname?: string): Promise<{ success: boolean; pet: UserPet }> {
  const response = await fetch('/api/user-pets/adopt', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ templateId, nickname }),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Không thể nhận nuôi thú cưng.');
  }
  return response.json() as Promise<{ success: boolean; pet: UserPet }>;
}

export async function feedPet(): Promise<FeedResponse> {
  const response = await fetch('/api/user-pets/feed', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Không thể cho thú cưng ăn.');
  }
  return response.json() as Promise<FeedResponse>;
}

export async function fetchPetShop(): Promise<import('./types').PetShopResponse> {
  const response = await fetch('/api/user-pets/shop');
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Không thể tải cửa hàng phụ kiện.');
  }
  return response.json() as Promise<import('./types').PetShopResponse>;
}

export async function buyPetAccessory(itemId: number): Promise<{ success: boolean; newCoins: number; itemId: number }> {
  const response = await fetch('/api/user-pets/shop/buy', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ itemId }),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Không thể mua phụ kiện.');
  }
  return response.json() as Promise<{ success: boolean; newCoins: number; itemId: number }>;
}

export async function equipPetAccessory(itemId: number | null, active?: boolean): Promise<{ success: boolean }> {
  const response = await fetch('/api/user-pets/accessories/equip', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ itemId, active }),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Không thể thay đổi phụ kiện.');
  }
  return response.json() as Promise<{ success: boolean }>;
}

export async function switchPetTemplate(templateId: number): Promise<{ success: boolean }> {
  const response = await fetch('/api/user-pets/switch-template', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ templateId }),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Không thể đổi mẫu thú cưng.');
  }
  return response.json() as Promise<{ success: boolean }>;
}
