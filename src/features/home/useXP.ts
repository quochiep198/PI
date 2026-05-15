import { useCallback, useEffect, useRef, useState } from 'react';

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

export function useXP() {
  const [xpData, setXpData] = useState<XpLevel>({
    level: 1,
    name: 'Người mới',
    minXp: 0,
    totalXp: 0,
    xpInCurrentLevel: 0,
    xpToNextLevel: 100,
    progressPercent: 0,
  });
  const [loading, setLoading] = useState(true);
  const [showLevelUpModal, setShowLevelUpModal] = useState(false);
  const [pendingXpAnimation, setPendingXpAnimation] = useState<number | null>(null);
  const animatedXpRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    let active = true;

    async function loadXp() {
      try {
        const response = await fetch('/api/xp');
        if (!response.ok) {
          setLoading(false);
          return;
        }
        const data = (await response.json()) as XpResponse;
        if (!active) return;
        setXpData({
          level: data.level,
          name: data.name,
          minXp: data.minXp,
          totalXp: data.totalXp,
          xpInCurrentLevel: data.xpInCurrentLevel,
          xpToNextLevel: data.xpToNextLevel,
          progressPercent: data.progressPercent,
        });
      } catch {
        if (active) {
          setXpData({
            level: 1,
            name: 'Người mới',
            minXp: 0,
            totalXp: 0,
            xpInCurrentLevel: 0,
            xpToNextLevel: 100,
            progressPercent: 0,
          });
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadXp();

    return () => {
      active = false;
    };
  }, []);

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

        animateXpGain(data.xpAdded || xpAmount);

        setXpData({
          level: data.level,
          name: data.name,
          minXp: data.minXp,
          totalXp: data.totalXp,
          xpInCurrentLevel: data.xpInCurrentLevel,
          xpToNextLevel: data.xpToNextLevel,
          progressPercent: data.progressPercent,
        });

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
        const response = await fetch('/api/xp/first-success', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lessonId }),
        });

        if (!response.ok) {
          return null;
        }

        const data = (await response.json()) as { xpGranted: number; totalXp: number; alreadyRecorded: boolean };

        if (!data.alreadyRecorded && data.xpGranted > 0) {
          animateXpGain(data.xpGranted);

          const newTotalXp = data.totalXp;
          const levels = [
            { level: 1, name: 'Người mới', minXp: 0 },
            { level: 2, name: 'Học viên', minXp: 100 },
            { level: 3, name: 'Lập trình viên', minXp: 300 },
            { level: 4, name: 'Phù thủy code', minXp: 700 },
            { level: 5, name: 'Huyền thoại Python', minXp: 1500 },
          ];

          let currentLevel = levels[0];
          let nextLevel = levels[1];
          for (let i = 0; i < levels.length; i++) {
            if (newTotalXp >= levels[i].minXp) {
              currentLevel = levels[i];
              nextLevel = levels[i + 1] || null;
            }
          }

          const newProgressPercent = nextLevel
            ? Math.min(100, Math.round(((newTotalXp - currentLevel.minXp) / (nextLevel.minXp - currentLevel.minXp)) * 100))
            : 100;

          setXpData({
            level: currentLevel.level,
            name: currentLevel.name,
            minXp: currentLevel.minXp,
            totalXp: newTotalXp,
            xpInCurrentLevel: newTotalXp - currentLevel.minXp,
            xpToNextLevel: nextLevel ? nextLevel.minXp - currentLevel.minXp : 0,
            progressPercent: newProgressPercent,
          });
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