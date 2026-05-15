export type AuthUser = {
  id: number;
  username: string;
  email: string;
  isPro?: boolean;
};

export type AuthMode = 'login' | 'register';
