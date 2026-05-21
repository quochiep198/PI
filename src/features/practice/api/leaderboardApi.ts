import type { LeaderboardResponse } from '../types/leaderboard';

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

export async function fetchLeaderboard(): Promise<LeaderboardResponse> {
  const response = await fetch('/api/leaderboard');
  const payload = await parseJsonSafely<LeaderboardResponse & { message?: string }>(response);

  if (!response.ok || !payload) {
    throw new Error(payload?.message || 'Failed to load leaderboard');
  }

  return payload;
}
