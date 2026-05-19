import { useEffect, useState, useSyncExternalStore } from 'react';
import { getCachedXp, setCachedXp, subscribeXpChanges, isCacheValid, DEFAULT_XP } from '../shared/xpCache';

export function useXPCached() {
  // Use useSyncExternalStore for automatic re-renders when cache changes
  const xpData = useSyncExternalStore(
    subscribeXpChanges,
    getCachedXp,
    getCachedXp, // SSR fallback
  );

  // Fetch initial data if cache is invalid
  const [loading, setLoading] = useState(() => !isCacheValid());

  useEffect(() => {
    let active = true;

    if (!isCacheValid()) {
      async function loadXp() {
        try {
          const response = await fetch('/api/xp');
          if (!response.ok) {
            setCachedXp(DEFAULT_XP);
            if (active) setLoading(false);
            return;
          }
          const data = await response.json();
          if (active) {
            setCachedXp(data);
            setLoading(false);
          }
        } catch {
          if (active) {
            setCachedXp(DEFAULT_XP);
            setLoading(false);
          }
        }
      }

      void loadXp();
    }

    return () => {
      active = false;
    };
  }, []);

  return { xpData, loading };
}