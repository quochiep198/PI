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
