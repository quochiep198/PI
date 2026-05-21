export type DayStatus = 'completed' | 'today' | 'locked' | 'future';

export interface StreakDay {
  date: string;
  label: string;
  status: DayStatus;
  isToday: boolean;
  dayOfWeek: number;
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastCheckIn: string | null;
  weekDays: StreakDay[];
  totalCheckIns: number;
  isCheckedInToday: boolean;
}

export interface CheckInResult {
  success: boolean;
  newStreak: number;
  reward: number;
  achievement?: string;
  message: string;
  totalCoins?: number;
  streakData?: StreakData;
}

export interface StreakBadgeProps {
  streak: number;
  isAnimating?: boolean;
}

export interface DayCellProps {
  day: StreakDay;
  onClick?: () => void;
  isCheckInDisabled?: boolean;
}

export interface CelebrationModalProps {
  isOpen: boolean;
  streak: number;
  reward: number;
  achievement?: string;
  onClose: () => void;
}

export type StreakState = 'idle' | 'loading' | 'success' | 'error';

export interface UseStreakReturn {
  streakData: StreakData | null;
  state: StreakState;
  error: string | null;
  checkIn: () => Promise<CheckInResult | null>;
  refetch: () => Promise<void>;
}
