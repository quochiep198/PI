import { useEffect, useState } from 'react';
import { AuthPage } from './features/auth/AuthPage';
import type { AuthUser } from './features/auth/types';
import { HomePage } from './features/home/HomePage';
import { PracticePage } from './features/practice/PracticePage';
import { SettingsPage } from './features/settings/SettingsPage';
import { TopBar } from './features/layout/TopBar';
import { SideNav } from './features/layout/SideNav';
import { useXPCached } from './features/home/useXPCached';
import { useCoinsCached } from './features/home/useCoinsCached';
import { useOnlineLearners } from './features/home/useOnlineLearners';
import { MobileNavigation } from './features/navigate/NavigateNavigation';
import { clearCachedXp } from './features/shared/xpCache';
import { clearCachedCoins } from './features/shared/coinsCache';

type View = 'home' | 'practice' | 'settings';

type AuthMeResponse = {
  authenticated: boolean;
  user: AuthUser | null;
};

async function readJsonSafely<T>(response: Response): Promise<T | null> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [view, setView] = useState<View>('home');
  const { coins } = useCoinsCached();
  const { xpData } = useXPCached();
  const { onlineLearners, connected: onlineConnected, failed: onlineFailed } = useOnlineLearners();

  useEffect(() => {
    let active = true;

    async function loadSession() {
      try {
        const response = await fetch('/api/auth/me');
        const data = await readJsonSafely<AuthMeResponse>(response);
        if (!active) return;

        const authUser = response.ok && data?.authenticated ? data.user : null;
        if (!authUser) {
          clearCachedXp();
          clearCachedCoins();
        }
        setUser(authUser);
      } catch {
        if (active) {
          clearCachedXp();
          clearCachedCoins();
          setUser(null);
        }
      } finally {
        if (active) setIsLoading(false);
      }
    }

    void loadSession();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }

    document.documentElement.dataset.theme = user?.theme === 'dark' ? 'dark' : 'light';
  }, [user?.theme]);

  function handleAuthenticated(nextUser: AuthUser) {
    clearCachedXp();
    clearCachedCoins();
    setUser(nextUser);
  }

  function handleUserUpdated(nextUser: AuthUser) {
    setUser(nextUser);
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    clearCachedXp();
    clearCachedCoins();
    setUser(null);
  }

  if (isLoading) {
    return (
      <div className="app-splash">
        <div className="app-splash__card">
          <span className="app-splash__title">PythonQuest</span>
          <p>Đang kiểm tra phiên đăng nhập...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage onAuthenticated={handleAuthenticated} />;
  }

  return (
    <div className="quest-page">
      <TopBar user={user} xpData={xpData} coins={coins} onLogout={handleLogout} />

      <div className="quest-layout">
        <SideNav
          activeLabel={view === 'home' ? 'Lessons' : view === 'practice' ? 'Daily Practice' : 'Settings'}
          onlineCount={onlineLearners}
          onlineLoading={!onlineConnected && !onlineFailed}
          onlineError={onlineFailed}
          onNavigateLessons={() => setView('home')}
          onNavigatePractice={() => setView('practice')}
          onNavigateSettings={() => setView('settings')}
        />

        {view === 'home'
          ? <HomePage user={user} />
          : view === 'practice'
            ? <PracticePage user={user} />
            : <SettingsPage user={user} onUserUpdated={handleUserUpdated} onLogout={handleLogout} />}
      </div>

      <MobileNavigation />
    </div>
  );
}
