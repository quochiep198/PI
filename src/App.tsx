import { useEffect, useState } from 'react';
import { AuthPage } from './features/auth/AuthPage';
import type { AuthUser } from './features/auth/types';
import { HomePage } from './features/home/HomePage';
import { PracticePage } from './features/practice/PracticePage';
import { TopBar } from './features/layout/TopBar';
import { SideNav } from './features/layout/SideNav';
import { useXPCached } from './features/home/useXPCached';
import { useOnlineLearners } from './features/home/useOnlineLearners';
import { MobileNavigation } from './features/navigate/NavigateNavigation';

type View = 'home' | 'practice';

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
  const coins = 1250;

  // Shared hooks
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
        setUser(authUser);
      } catch {
        if (active) setUser(null);
      } finally {
        if (active) setIsLoading(false);
      }
    }

    void loadSession();
    return () => { active = false; };
  }, []);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
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
    return <AuthPage onAuthenticated={setUser} />;
  }

  return (
    <div className="quest-page">
      <TopBar
        user={user}
        xpData={xpData}
        coins={coins}
        onLogout={handleLogout}
      />

      <div className="quest-layout">
        <SideNav
          activeLabel={view === 'home' ? 'Lessons' : 'Daily Practice'}
          onlineCount={onlineLearners}
          onlineLoading={!onlineConnected && !onlineFailed}
          onlineError={onlineFailed}
          onNavigateLessons={() => setView('home')}
          onNavigatePractice={() => setView('practice')}
        />

        {view === 'home' ? (
          <HomePage user={user} />
        ) : (
          <PracticePage user={user} />
        )}
      </div>

      <MobileNavigation />
    </div>
  );
}