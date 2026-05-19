const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

interface CachedCoinsData {
  data: number;
  timestamp: number;
}

let cachedCoinsData: CachedCoinsData = {
  data: 1250, // Default starting coins
  timestamp: 0,
};

const listeners = new Set<() => void>();

export function getCachedCoins(): number {
  const now = Date.now();
  if ((now - cachedCoinsData.timestamp) < CACHE_DURATION) {
    return cachedCoinsData.data;
  }
  return cachedCoinsData.data;
}

export function setCachedCoins(coins: number): void {
  cachedCoinsData = {
    data: coins,
    timestamp: Date.now(),
  };
  listeners.forEach(listener => listener());
}

export function addCoins(amount: number): number {
  const newTotal = cachedCoinsData.data + amount;
  setCachedCoins(newTotal);
  return newTotal;
}

export function subscribeCoinsChanges(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function isCacheValid(): boolean {
  const now = Date.now();
  return (now - cachedCoinsData.timestamp) < CACHE_DURATION;
}