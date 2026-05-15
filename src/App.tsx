import { useEffect, useState } from 'react';
import { AuthPage } from './features/auth/AuthPage';
import type { AuthUser } from './features/auth/types';
import { HomePage } from './features/home/HomePage';

type AuthMeResponse = {
  authenticated: boolean;
  user: AuthUser | null;
};

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    let active = true;

    async function loadSession() {
      try {
        const response = await fetch('/api/auth/me');
        const data = (await response.json()) as AuthMeResponse;

        if (!active) {
          return;
        }

        setUser(response.ok && data.authenticated ? data.user : null);
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

  return <HomePage user={user} onLogout={handleLogout} />;
}
