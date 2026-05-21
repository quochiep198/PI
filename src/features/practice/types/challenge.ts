export type ChallengeDifficulty = 'easy' | 'medium' | 'hard';

export type Challenge = {
  id: number;
  title: string;
  description: string;
  difficulty: ChallengeDifficulty;
  xpReward: number;
  coinsReward: number;
  starterCode: string;
  track?: string;
  completed: boolean;
  testCases?: TestCase[];
};

export type TestCase = {
  input: string;
  expectedOutput: string;
};

export type ChallengeSubmitResult = {
  success: boolean;
  alreadyCompleted: boolean;
  xpEarned: number;
  coinsEarned: number;
  totalXp: number;
  totalCoins?: number;
  xpData?: {
    totalXp: number;
    level: number;
    name: string;
    minXp: number;
    xpInCurrentLevel: number;
    xpToNextLevel: number;
    progressPercent: number;
  };
  message: string;
};