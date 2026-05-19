import { useEffect, useState, useSyncExternalStore } from 'react';
import { getCachedCoins, setCachedCoins, subscribeCoinsChanges, isCacheValid, addCoins } from '../shared/coinsCache';

export function useCoinsCached() {
  const coins = useSyncExternalStore(
    subscribeCoinsChanges,
    getCachedCoins,
    getCachedCoins,
  );

  const [loading, setLoading] = useState(() => !isCacheValid());
 let active = true;
  useEffect(() => {
    if (!isCacheValid()) {
      let active = true;

      async function loadCoins() {
        try {
          const response = await fetch('/api/coins');
          if (!response.ok) {
            if (active) setLoading(false);
            return;
          }
          const data = await response.json();
          if (active) {
            setCachedCoins(data.coins ?? 1250);
            setLoading(false);
          }
        } catch {
          if (active) {
            setLoading(false);
          }
        }
      }

      void loadCoins();
    }

    return () => {
      active = false;
    };
  }, []);

  return { coins, loading, addCoins };
}