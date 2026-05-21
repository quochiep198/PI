import type { StreakData, CheckInResult } from '../types/streak';

const API_BASE = '/api/streak';

async function parseResponse<T>(response: Response): Promise<T> {
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      data && typeof data === 'object' && 'message' in data && typeof data.message === 'string'
        ? data.message
        : 'Streak request failed';
    throw new Error(message);
  }

  return data as T;
}

export async function fetchStreakData(userId: number): Promise<StreakData> {
  const response = await fetch(`${API_BASE}/${userId}`);
  return parseResponse<StreakData>(response);
}

export async function checkIn(userId: number): Promise<CheckInResult> {
  const response = await fetch(`${API_BASE}/${userId}/checkin`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  return parseResponse<CheckInResult>(response);
}
