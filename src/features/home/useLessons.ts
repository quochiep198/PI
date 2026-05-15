import { useEffect, useState } from 'react';
import { VI_MESSAGES } from '../../content/messages';

export type Lesson = {
  id: number;
  slug: string;
  track: string;
  lessonOrder: number;
  chapter: string;
  title: string;
  description: string;
  objective: string;
  starterCode: string;
  completionCheckType: 'output_contains' | 'code_contains';
  completionCheckValue: string;
};

export function useLessons() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadLessons() {
      try {
        setLoading(true);
        const response = await fetch('/api/lessons');

        if (!response.ok) {
          throw new Error(VI_MESSAGES.lessons.loadFailed);
        }

        const data = (await response.json()) as Lesson[];
        if (!active) {
          return;
        }

        setLessons(data);
        setError(null);
      } catch (loadError) {
        if (!active) {
          return;
        }

        setError(loadError instanceof Error ? loadError.message : VI_MESSAGES.lessons.loadFallbackFailed);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadLessons();

    return () => {
      active = false;
    };
  }, []);

  return {
    lessons,
    loading,
    error,
  };
}
