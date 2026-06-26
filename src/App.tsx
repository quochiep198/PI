import { useEffect, useState } from 'react';
import { AuthPage } from './features/auth/AuthPage';
import type { AuthUser } from './features/auth/types';
import { HomePage } from './features/home/HomePage';
import { InventoryPage } from './features/inventory/InventoryPage';
import { AccessoriesPage } from './features/accessories/AccessoriesPage';
import { PracticePage } from './features/practice/PracticePage';
import { SettingsPage } from './features/settings/SettingsPage';
import { TopBar } from './features/layout/TopBar';
import { SideNav } from './features/layout/SideNav';
import { useXPCached } from './features/home/useXPCached';
import { useCoinsCached } from './features/home/useCoinsCached';
import { useOnlineLearners } from './features/home/useOnlineLearners';
import { MobileNavigation } from './features/navigate/NavigateNavigation';
import { clearCachedXp } from './features/shared/xpCache';
import { clearCachedCoins, setCachedCoins } from './features/shared/coinsCache';
import { installAudioUnlock } from './features/shared/soundEffects';
import { PetSelectionModal, PetShopPage, fetchPetState, adoptPet, feedPet, type UserPet, type PetTemplate, type PetAccessory } from './features/pet';

type View = 'home' | 'practice' | 'inventory' | 'accessories' | 'settings' | 'shop';

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
  const { onlineLearners, connected: onlineConnected, failed: onlineFailed } = useOnlineLearners(!!user);

  // Pet states
  const [activePet, setActivePet] = useState<UserPet | null>(null);
  const [petTemplates, setPetTemplates] = useState<PetTemplate[]>([]);
  const [showPetAdoptModal, setShowPetAdoptModal] = useState(false);
  const [isStreakExcited, setIsStreakExcited] = useState(false);
  const [activeAccessories, setActiveAccessories] = useState<PetAccessory[]>([]);

  const refreshPetState = async () => {
    if (!user) return;
    try {
      const data = await fetchPetState();
      setActivePet(data.activePet);
      setPetTemplates(data.templates);
      setIsStreakExcited(data.isStreakExcited);
      setActiveAccessories(data.activeAccessories || []);
      if (!data.activePet) {
        setShowPetAdoptModal(true);
      }
    } catch {
      // Fail silently
    }
  };

  useEffect(() => {
    if (!user) {
      setActivePet(null);
      setActiveAccessories([]);
      return;
    }
    void refreshPetState();
  }, [user]);

  const handleAdoptPet = async (templateId: number, nickname?: string) => {
    const result = await adoptPet(templateId, nickname);
    if (result.success) {
      setActivePet(result.pet);
      setShowPetAdoptModal(false);
      void refreshPetState();
    }
  };

  const handleFeedPet = async () => {
    const result = await feedPet();
    if (result.success) {
      setActivePet((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          level: result.pet.level,
          currentXp: result.pet.currentXp,
          nextLevelXp: result.pet.nextLevelXp,
          fullness: result.pet.fullness,
        };
      });
      setCachedCoins(result.newCoins);
    }
  };

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

  useEffect(() => {
    installAudioUnlock();
  }, []);

  useEffect(() => {
    if (view === 'accessories' && !user?.isAdmin) {
      setView('home');
    }
  }, [user?.isAdmin, view]);

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
          activeLabel={view === 'home' ? 'Lessons' : view === 'practice' ? 'Daily Practice' : view === 'shop' ? 'Shop' : view === 'inventory' ? 'Inventory' : view === 'accessories' ? 'Achievements' : 'Settings'}
          isAdmin={Boolean(user.isAdmin)}
          onlineCount={onlineLearners}
          onlineLoading={!onlineConnected && !onlineFailed}
          onlineError={onlineFailed}
          onNavigateLessons={() => setView('home')}
          onNavigatePractice={() => setView('practice')}
          onNavigateShop={() => setView('shop')}
          onNavigateInventory={() => setView('inventory')}
          onNavigateAccessories={() => setView('accessories')}
          onNavigateSettings={() => setView('settings')}
        />

        {view === 'home'
          ? <HomePage
              user={user}
              activePet={activePet}
              activeAccessories={activeAccessories}
              isStreakExcited={isStreakExcited}
              onFeedPet={handleFeedPet}
              onOpenShop={() => setView('shop')}
              onUpdateActivePet={setActivePet}
            />
          : view === 'practice'
            ? <PracticePage
                user={user}
                activePet={activePet}
                activeAccessories={activeAccessories}
                onNavigateUpgrade={() => setView('settings')}
                onUpdateActivePet={setActivePet}
              />
            : view === 'inventory'
              ? <InventoryPage />
              : view === 'accessories' && user.isAdmin
                ? <AccessoriesPage />
                : view === 'shop'
                  ? <PetShopPage
                      activePet={activePet}
                      activeAccessories={activeAccessories}
                      currentCoins={coins}
                      onCoinsUpdated={(newCoins) => setCachedCoins(newCoins)}
                      onRefreshPetState={refreshPetState}
                    />
                  : <SettingsPage user={user} onUserUpdated={handleUserUpdated} onLogout={handleLogout} />}
      </div>

      <MobileNavigation
        activeView={view === 'home' ? 'home' : view === 'practice' ? 'practice' : 'settings'}
        onNavigateLessons={() => setView('home')}
        onNavigatePractice={() => setView('practice')}
        onNavigateSettings={() => setView('settings')}
      />

      <PetSelectionModal
        show={showPetAdoptModal}
        templates={petTemplates}
        onAdopt={handleAdoptPet}
      />

    </div>
  );
}
