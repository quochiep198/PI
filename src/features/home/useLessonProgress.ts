import { useEffect, useState } from 'react';
import { VI_MESSAGES } from '../../content/messages';
import { addCoins } from '../shared/coinsCache';

export function useLessonProgress() {
  const [completedLessonIds, setCompletedLessonIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadProgress() {
      try {
        setLoading(true);
        const response = await fetch('/api/progress');
        if (!response.ok) {
          throw new Error(VI_MESSAGES.progress.loadFailed);
        }

        const data = (await response.json()) as Array<{ lessonId: number }>;
        if (!active) {
          return;
        }

        setCompletedLessonIds(data.map((item) => item.lessonId));
      } catch {
        if (active) {
          setCompletedLessonIds([]);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadProgress();

    return () => {
      active = false;
    };
  }, []);

  async function markLessonCompleted(lessonId: number): Promise<{ coinsEarned?: number }> {
    try {
      const response = await fetch('/api/progress/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lessonId,
        }),
      });

      if (!response.ok) {
        throw new Error(VI_MESSAGES.progress.saveFailed);
      }

      const data = await response.json();
      const coinsEarned = data?.coins ?? 0;

      if (coinsEarned > 0) {
        addCoins(coinsEarned);
      }

      setCompletedLessonIds((currentIds) =>
        currentIds.includes(lessonId) ? currentIds : [...currentIds, lessonId],
      );

      return { coinsEarned };
    } catch (err) {
      throw err instanceof Error ? err : new Error(VI_MESSAGES.progress.saveFailed);
    }
  }

  return {
    completedLessonIds,
    loading,
    markLessonCompleted,
  };
}
