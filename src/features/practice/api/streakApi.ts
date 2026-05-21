import type { CheckInResult, StreakData } from '../types/streak';

const API_BASE = '/api/streak';

async function parseJsonSafely<T>(response: Response): Promise<T | null> {
  const text = await response.text();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

export async function fetchStreakData(userId: number): Promise<StreakData> {
  const response = await fetch(`${API_BASE}/${userId}`);
  const payload = await parseJsonSafely<StreakData & { message?: string }>(response);

  if (!response.ok || !payload) {
    throw new Error(payload?.message || 'Failed to load streak data');
  }

  return payload;
}

export async function checkIn(userId: number): Promise<CheckInResult> {
  const response = await fetch(`${API_BASE}/${userId}/checkin`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  const payload = await parseJsonSafely<CheckInResult & { message?: string }>(response);

  if (!response.ok || !payload) {
    throw new Error(payload?.message || 'Check-in failed');
  }

  return payload;
}
