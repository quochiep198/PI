import type { XpLevel } from '../home/useXP';

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

interface CachedXpData {
  data: XpLevel | null;
  timestamp: number;
}

let cachedXpData: CachedXpData = {
  data: null,
  timestamp: 0,
};

// Listeners that will be notified when XP changes
const listeners = new Set<() => void>();

// Default XP data
export const DEFAULT_XP: XpLevel = {
  level: 1,
  name: 'Người mới',
  minXp: 0,
  totalXp: 0,
  xpInCurrentLevel: 0,
  xpToNextLevel: 100,
  progressPercent: 0,
};

export function getCachedXp(): XpLevel {
  const now = Date.now();
  if (cachedXpData.data && (now - cachedXpData.timestamp) < CACHE_DURATION) {
    return cachedXpData.data;
  }
  return DEFAULT_XP;
}

export function setCachedXp(data: XpLevel): void {
  cachedXpData = {
    data,
    timestamp: Date.now(),
  };
  // Notify all listeners
  listeners.forEach(listener => listener());
}

export function addXp(amount: number): XpLevel | null {
  if (!cachedXpData.data) return null;
  const newTotal = cachedXpData.data.totalXp + amount;
  const newData = {
    ...cachedXpData.data!,
    totalXp: newTotal,
  };
  setCachedXp(newData);
  return newData;
}

export function subscribeXpChanges(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function isCacheValid(): boolean {
  const now = Date.now();
  return cachedXpData.data !== null && (now - cachedXpData.timestamp) < CACHE_DURATION;
}