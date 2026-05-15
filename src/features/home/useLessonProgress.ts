import { useEffect, useState } from 'react';

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
  }, []);

  async function markLessonCompleted(lessonId: number) {
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
      throw new Error('Không lưu được tiến trình học tập.');
    }

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
