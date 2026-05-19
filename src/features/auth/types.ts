export type AuthUser = {
  id: number;
  username: string;
  email: string;
  isPro?: boolean;
  avatarUrl?: string;
};

export type AuthMode = 'login' | 'register';
