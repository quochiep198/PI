import { useEffect, useState } from 'react';
import type { XpLevel } from './useXP';

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const cachedXpData = {
  data: null as XpLevel | null,
  timestamp: 0,
};

export function useXPCached() {
  const [xpData, setXpData] = useState<XpLevel>(
    cachedXpData.data ?? {
      level: 1,
      name: 'Người mới',
      minXp: 0,
      totalXp: 0,
      xpInCurrentLevel: 0,
      xpToNextLevel: 100,
      progressPercent: 0,
    }
  );
  const [loading, setLoading] = useState(!cachedXpData.data);

  useEffect(() => {
    const now = Date.now();

    if (cachedXpData.data && (now - cachedXpData.timestamp) < CACHE_DURATION) {
      setXpData(cachedXpData.data);
      setLoading(false);
      return;
    }

    let active = true;

    async function loadXp() {
      try {
        const response = await fetch('/api/xp');
        if (!response.ok) {
          setLoading(false);
          return;
        }
        const data = await response.json();
        if (!active) return;

        cachedXpData.data = data;
        cachedXpData.timestamp = now;

        setXpData(data);
      } catch {
        // keep cached or default
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadXp();

    return () => {
      active = false;
    };
  }, []);

  return { xpData, loading };
}