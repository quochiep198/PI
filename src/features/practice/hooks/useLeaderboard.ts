import { useCallback, useEffect, useState } from 'react';
import { fetchLeaderboard } from '../api/leaderboardApi';
import type { LeaderboardEntry } from '../types/leaderboard';

type LoadState = 'idle' | 'loading' | 'success' | 'error';

export function useLeaderboard() {
  const [topEntries, setTopEntries] = useState<LeaderboardEntry[]>([]);
  const [currentUserEntry, setCurrentUserEntry] = useState<LeaderboardEntry | null>(null);
  const [state, setState] = useState<LoadState>('idle');
  const [error, setError] = useState<string | null>(null);

  const loadLeaderboard = useCallback(async () => {
    setState('loading');
    setError(null);

    try {
      const data = await fetchLeaderboard();
      setTopEntries(data.topEntries);
      setCurrentUserEntry(data.currentUserEntry);
      setState('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load leaderboard');
      setState('error');
    }
  }, []);

  useEffect(() => {
    void loadLeaderboard();
  }, [loadLeaderboard]);

  return {
    topEntries,
    currentUserEntry,
    state,
    error,
    refetch: loadLeaderboard,
  };
}
