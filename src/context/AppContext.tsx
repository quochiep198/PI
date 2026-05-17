import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { AuthUser } from '../features/auth/types';
import type { XpLevel } from '../features/home/useXP';

type AppContextType = {
  user: AuthUser | null;
  setUser: (user: AuthUser | null) => void;
  xpData: XpLevel;
  xpLoading: boolean;
  refreshXP: () => void;
};

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const DEFAULT_XP_DATA: XpLevel = {
    level: 1,
    name: 'Người mới',
    minXp: 0,
    xpInCurrentLevel: 0,
    xpToNextLevel: 100,
    progressPercent: 0,
    totalXp: 0,
  };
  const [xpData, setXpData] = useState<XpLevel>(DEFAULT_XP_DATA);
  const [xpLoading, setXpLoading] = useState(true);

  const fetchXP = useCallback(async () => {
    try {
      const res = await fetch('/api/xp');
      if (res.ok) {
        const data = await res.json();
        setXpData(data);
      }
    } catch {
      // use default
    } finally {
      setXpLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      void fetchXP();
    }
  }, [user, fetchXP]);

  return (
    <AppContext.Provider value={{ user, setUser, xpData, xpLoading, refreshXP: fetchXP }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useApp must be used within AppProvider');
  }
  return ctx;
}