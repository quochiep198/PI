import { useEffect, useState, useSyncExternalStore } from 'react';
import { DEFAULT_COINS, getCachedCoins, setCachedCoins, subscribeCoinsChanges, isCacheValid } from '../shared/coinsCache';

export function useCoinsCached() {
  const coins = useSyncExternalStore(
    subscribeCoinsChanges,
    getCachedCoins,
    getCachedCoins,
  );

  const [loading, setLoading] = useState(() => !isCacheValid());

  useEffect(() => {
    let active = true;

    if (!isCacheValid()) {
      async function loadCoins() {
        try {
          const response = await fetch('/api/coins');
          if (!response.ok) {
            if (active) setLoading(false);
            return;
          }
          const data = await response.json();
          if (active) {
            setCachedCoins(data.coins ?? DEFAULT_COINS);
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

  return { coins, loading };
}
