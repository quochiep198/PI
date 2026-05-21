export type LeaderboardEntry = {
  id: number;
  username: string;
  title: string;
  avatarUrl?: string | null;
  xp: number;
  coins: number;
  rank: number;
  isCurrentUser: boolean;
};

export type LeaderboardResponse = {
  topEntries: LeaderboardEntry[];
  currentUserEntry: LeaderboardEntry | null;
  currentUserId: number;
};
