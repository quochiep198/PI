import { useEffect, useState } from 'react';

const LEARNER_KEY_STORAGE = 'python-adventure.learner-key';

function getLearnerKey() {
  if (typeof window === 'undefined') {
    return 'server-render';
  }

  const existingKey = window.localStorage.getItem(LEARNER_KEY_STORAGE);
  if (existingKey) {
    return existingKey;
  }

  const nextKey = window.crypto.randomUUID();
  window.localStorage.setItem(LEARNER_KEY_STORAGE, nextKey);
  return nextKey;
}

export function useLessonProgress() {
  const [learnerKey] = useState(getLearnerKey);
  const [completedLessonIds, setCompletedLessonIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadProgress() {
      try {
        setLoading(true);
        const response = await fetch(`/api/progress/${learnerKey}`);
        if (!response.ok) {
          throw new Error('Không tải được tiến trình học tập.');
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
  }, [learnerKey]);

  async function markLessonCompleted(lessonId: number) {
    await fetch('/api/progress/complete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        learnerKey,
        lessonId,
      }),
    });

    setCompletedLessonIds((currentIds) =>
      currentIds.includes(lessonId) ? currentIds : [...currentIds, lessonId],
    );
  }

  return {
    completedLessonIds,
    loading,
    markLessonCompleted,
  };
}
