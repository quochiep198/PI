import type { Challenge, ChallengeSubmitResult } from '../types/challenge';

export async function fetchChallenges(): Promise<Challenge[]> {
  const response = await fetch('/api/challenges');
  if (!response.ok) {
    throw new Error('Failed to load challenges');
  }
  return response.json();
}

export async function submitChallenge(challengeId: number, code: string): Promise<ChallengeSubmitResult> {
  const response = await fetch('/api/challenges/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ challengeId, code }),
  });

  if (!response.ok) {
    throw new Error('Failed to submit challenge');
  }

  return response.json();
}