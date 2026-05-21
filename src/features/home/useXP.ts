import { useCallback, useEffect, useRef, useState } from 'react';
import { setCachedXp } from '../shared/xpCache';
import { useXPCached } from './useXPCached';

export type XpLevel = {
  level: number;
  name: string;
  minXp: number;
  xpInCurrentLevel: number;
  xpToNextLevel: number;
  progressPercent: number;
  totalXp: number;
};

export type XpResponse = {
  totalXp: number;
  level: number;
  name: string;
  minXp: number;
  xpInCurrentLevel: number;
  xpToNextLevel: number;
  progressPercent: number;
  xpAdded?: number;
  leveledUp?: boolean;
  oldLevel?: number;
  newLevel?: number;
};

const LEVELS: Array<Pick<XpLevel, 'level' | 'name' | 'minXp'>> = [
  { level: 1, name: 'Người mới', minXp: 0 },
  { level: 2, name: 'Học viên', minXp: 100 },
  { level: 3, name: 'Lập trình viên', minXp: 300 },
  { level: 4, name: 'Phù thủy code', minXp: 700 },
  { level: 5, name: 'Huyền thoại Python', minXp: 1500 },
];

function getLevelData(totalXp: number): XpLevel {
  let currentLevel = LEVELS[0];
  let nextLevel = LEVELS[1];

  for (let index = 0; index < LEVELS.length; index += 1) {
    if (totalXp >= LEVELS[index].minXp) {
      currentLevel = LEVELS[index];
      nextLevel = LEVELS[index + 1];
    }
  }

  return {
    level: currentLevel.level,
    name: currentLevel.name,
    minXp: currentLevel.minXp,
    totalXp,
    xpInCurrentLevel: totalXp - currentLevel.minXp,
    xpToNextLevel: nextLevel ? nextLevel.minXp - currentLevel.minXp : 0,
    progressPercent: nextLevel
      ? Math.min(100, Math.round(((totalXp - currentLevel.minXp) / (nextLevel.minXp - currentLevel.minXp)) * 100))
      : 100,
  };
}

function toXpLevel(data: XpResponse): XpLevel {
  return {
    level: data.level,
    name: data.name,
    minXp: data.minXp,
    totalXp: data.totalXp,
    xpInCurrentLevel: data.xpInCurrentLevel,
    xpToNextLevel: data.xpToNextLevel,
    progressPercent: data.progressPercent,
  };
}

export function useXP() {
  const { xpData, loading } = useXPCached();
  const [showLevelUpModal, setShowLevelUpModal] = useState(false);
  const [pendingXpAnimation, setPendingXpAnimation] = useState<number | null>(null);
  const animatedXpRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    animatedXpRef.current = xpData.totalXp;
  }, [xpData.totalXp]);

  const animateXpGain = useCallback((totalGain: number) => {
    const duration = 600;
    const startTime = performance.now();
    const startXp = animatedXpRef.current;
    const endXp = startXp + totalGain;

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    function tick(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startXp + (endXp - startXp) * eased);

      setPendingXpAnimation(current);

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(tick);
      } else {
        animatedXpRef.current = endXp;
        setPendingXpAnimation(null);
      }
    }

    animationFrameRef.current = requestAnimationFrame(tick);
  }, []);

  const addXp = useCallback(
    async (xpAmount: number, source: string, lessonId?: number): Promise<XpResponse | null> => {
      try {
        const response = await fetch('/api/xp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            xp: xpAmount,
            source,
            lessonId,
          }),
        });

        if (!response.ok) {
          return null;
        }

        const data = (await response.json()) as XpResponse;
        const grantedXp = data.xpAdded || 0;

        if (grantedXp > 0) {
          animateXpGain(grantedXp);
        }

        setCachedXp(toXpLevel(data));

        if (data.leveledUp) {
          setShowLevelUpModal(true);
        }

        return data;
      } catch {
        return null;
      }
    },
    [animateXpGain],
  );

  const recordFirstSuccess = useCallback(
    async (lessonId: number) => {
      try {
        const response = await fetch('/api/xp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lessonId, source: 'first_success_run' }),
        });

        if (!response.ok) {
          return null;
        }

        const data = (await response.json()) as { xpGranted: number; totalXp: number; alreadyRecorded: boolean };

        if (!data.alreadyRecorded && data.xpGranted > 0) {
          animateXpGain(data.xpGranted);
          setCachedXp(getLevelData(data.totalXp));
        }

        return data;
      } catch {
        return null;
      }
    },
    [animateXpGain],
  );

  const dismissLevelUpModal = useCallback(() => {
    setShowLevelUpModal(false);
  }, []);

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return {
    xpData,
    loading,
    showLevelUpModal,
    pendingXpAnimation,
    addXp,
    recordFirstSuccess,
    dismissLevelUpModal,
  };
}
