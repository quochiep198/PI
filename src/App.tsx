import { useEffect, useState } from 'react';
import { AuthPage } from './features/auth/AuthPage';
import type { AuthUser } from './features/auth/types';
import { HomePage } from './features/home/HomePage';
import { PracticePage } from './features/practice/PracticePage';

type View = 'home' | 'practice';

type AuthMeResponse = {
  authenticated: boolean;
  user: AuthUser | null;
};

async function readJsonSafely<T>(response: Response): Promise<T | null> {
  const text = await response.text();

  if (!text) {
    return null;
  }

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

  useEffect(() => {
    let active = true;

    async function loadSession() {
      try {
        const response = await fetch('/api/auth/me');
        const data = await readJsonSafely<AuthMeResponse>(response);

        if (!active) {
          return;
        }

        const authUser = response.ok && data?.authenticated ? data.user : null;
        setUser(authUser);
      } catch {
        if (active) {
          setUser(null);
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    void loadSession();

    return () => {
      active = false;
    };
  }, []);

  async function handleLogout() {
    await fetch('/api/auth/logout', {
      method: 'POST',
    });

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
    <>
      {view === 'home' && (
        <HomePage
          user={user}
          onLogout={handleLogout}
          onNavigatePractice={() => setView('practice')}
        />
      )}
      {view === 'practice' && (
        <PracticePage
          user={user}
          onLogout={handleLogout}
          onNavigateHome={() => setView('home')}
        />
      )}
    </>
  );
}