import { useEffect, useState, useCallback } from 'react';
import { fetchChallenges } from '../api/challengeApi';
import type { Challenge } from '../types/challenge';

export function useChallenges() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadChallenges = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchChallenges();
      setChallenges(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load challenges');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadChallenges();
  }, [loadChallenges]);

  const markCompleted = useCallback((challengeId: number) => {
    setChallenges((prev) =>
      prev.map((c) => (c.id === challengeId ? { ...c, completed: true } : c))
    );
  }, []);

  return {
    challenges,
    loading,
    error,
    refetch: loadChallenges,
    markCompleted,
  };
}