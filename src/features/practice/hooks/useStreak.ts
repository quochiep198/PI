import { useState, useCallback, useEffect } from 'react';
import { fetchStreakData, checkIn as checkInApi } from '../api/streakApi';
import type { StreakData, CheckInResult, UseStreakReturn } from '../types/streak';
import { setCachedCoins } from '../../shared/coinsCache';

export function useStreak(userId: number): UseStreakReturn {
  const [streakData, setStreakData] = useState<StreakData | null>(null);
  const [state, setState] = useState<UseStreakReturn['state']>('idle');
  const [error, setError] = useState<string | null>(null);

  const loadStreakData = useCallback(async () => {
    setState('loading');
    setError(null);

    try {
      const data = await fetchStreakData(userId);
      setStreakData(data);
      setState('success');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load streak data';
      setError(message);
      setState('error');
    }
  }, [userId]);

  useEffect(() => {
    void loadStreakData();
  }, [loadStreakData]);

  const handleCheckIn = useCallback(async (): Promise<CheckInResult | null> => {
    if (!streakData?.isCheckedInToday) {
      setState('loading');
      setError(null);

      try {
        const result = await checkInApi(userId);

        if (result.streakData) {
          setStreakData(result.streakData);
        }
        if (typeof result.totalCoins === 'number') {
          setCachedCoins(result.totalCoins);
        }

        setState('success');
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Check-in failed';
        setError(message);
        setState('error');
        return null;
      }
    }

    return {
      success: false,
      newStreak: streakData?.currentStreak ?? 0,
      reward: 0,
      message: 'Bạn đã check-in hôm nay rồi!',
    };
  }, [userId, streakData?.currentStreak, streakData?.isCheckedInToday]);

  return {
    streakData,
    state,
    error,
    checkIn: handleCheckIn,
    refetch: loadStreakData,
  };
}
