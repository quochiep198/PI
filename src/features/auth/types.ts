export type AuthUser = {
  id: number;
  username: string;
  email: string;
  isPro?: boolean;
  avatarUrl?: string;
  theme?: 'light' | 'dark';
  profileVisible?: boolean;
  emailNotifications?: boolean;
  musicEnabled?: boolean;
  soundVolume?: number;
};

export type AuthMode = 'login' | 'register' | 'forgot' | 'reset';
