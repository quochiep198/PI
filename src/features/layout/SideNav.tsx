import { PetStatusCard, PetWidget, type UserPet, type PetAccessory } from '../pet';

export type SideNavProps = {
  activeLabel?: string;
  isAdmin?: boolean;
  onlineCount?: number;
  onlineLoading?: boolean;
  onlineError?: boolean;
  activePet: UserPet | null;
  isStreakExcited: boolean;
  onFeedPet: () => Promise<void> | void;
  activeAccessories?: PetAccessory[];
  onOpenShop?: () => void;
  onNavigateLessons?: () => void;
  onNavigatePractice?: () => void;
  onNavigateShop?: () => void;
  onNavigateInventory?: () => void;
  onNavigateAccessories?: () => void;
  onNavigateSettings?: () => void;
};

export function SideNav({
  activeLabel,
  isAdmin = false,
  onlineCount = 0,
  onlineLoading = false,
  onlineError = false,
  activePet,
  isStreakExcited,
  onFeedPet,
  activeAccessories = [],
  onOpenShop,
  onNavigateLessons,
  onNavigatePractice,
  onNavigateShop,
  onNavigateInventory,
  onNavigateAccessories,
  onNavigateSettings
}: SideNavProps) {
  const handleNavigation = (label: string) => {
    switch (label) {
      case 'Lessons':
        onNavigateLessons?.();
        break;
      case 'Daily Practice':
        onNavigatePractice?.();
        break;
      case 'Shop':
        onNavigateShop?.();
        break;
      // case 'Inventory':
      //   onNavigateInventory?.();
      //   break;
      case 'Achievements':
        onNavigateAccessories?.();
        break;
      case 'Settings':
        onNavigateSettings?.();
        break;
    }
  };

  const itemClickHandlers: Record<string, () => void> = {};
  if (onNavigateLessons) itemClickHandlers['Lessons'] = onNavigateLessons;
  if (onNavigatePractice) itemClickHandlers['Daily Practice'] = onNavigatePractice;
  if (onNavigateShop) itemClickHandlers['Shop'] = onNavigateShop;
  if (onNavigateInventory) itemClickHandlers['Inventory'] = onNavigateInventory;
  if (onNavigateAccessories) itemClickHandlers['Achievements'] = onNavigateAccessories;
  if (onNavigateSettings) itemClickHandlers['Settings'] = onNavigateSettings;

  return (
    <aside className="sidenav">
      <div className="online-status">
        <span
          className={`online-status__dot${!onlineLoading && onlineCount > 0 ? ' is-live' : ''}${onlineError ? ' is-error' : ''}`}
          aria-hidden="true"
        />
        <span className="online-status__text">
          {onlineLoading
            ? 'Đang cập nhật...'
            : onlineError
              ? 'Không thể cập nhật'
              : `${onlineCount} người học online`}
        </span>
      </div>

      <nav className="sidenav__nav" aria-label="Section navigation">
        <button
          className={`pressable sidenav__item${activeLabel === 'Lessons' ? ' is-active' : ''}`}
          type="button"
          onClick={() => handleNavigation('Lessons')}
        >
          <span aria-hidden="true" className="material-symbols-outlined">menu_book</span>
          <span>Bài Học</span>
        </button>

        <button
          className={`pressable sidenav__item${activeLabel === 'Daily Practice' ? ' is-active' : ''}`}
          type="button"
          onClick={() => handleNavigation('Daily Practice')}
        >
          <span aria-hidden="true" className="material-symbols-outlined">event_repeat</span>
          <span>Luyện Tập</span>
        </button>

        <button
          className={`pressable sidenav__item${activeLabel === 'Shop' ? ' is-active' : ''}`}
          type="button"
          onClick={() => handleNavigation('Shop')}
        >
          <span aria-hidden="true" className="material-symbols-outlined">storefront</span>
          <span>Cửa Hàng</span>
        </button>

        {/* <button
          className={`pressable sidenav__item${activeLabel === 'Playground' ? ' is-active' : ''}`}
          type="button"
        >
          <span aria-hidden="true" className="material-symbols-outlined">code</span>
          <span>Playground</span>
        </button> */}

        {/* <button
          className={`pressable sidenav__item${activeLabel === 'Inventory' ? ' is-active' : ''}`}
          type="button"
          onClick={() => handleNavigation('Inventory')}
        >
          <span aria-hidden="true" className="material-symbols-outlined">inventory_2</span>
          <span>Thành Tựu</span>
        </button> */}

        {isAdmin ? (
          <button
            className={`pressable sidenav__item${activeLabel === 'Achievements' ? ' is-active' : ''}`}
            type="button"
            onClick={() => handleNavigation('Achievements')}
          >
            <span aria-hidden="true" className="material-symbols-outlined">military_tech</span>
            <span>Upload Ảnh</span>
          </button>
        ) : null}

        <button
          className={`pressable sidenav__item${activeLabel === 'Settings' ? ' is-active' : ''}`}
          type="button"
          onClick={() => handleNavigation('Settings')}
        >
          <span aria-hidden="true" className="material-symbols-outlined">settings</span>
          <span>Cài Đặt</span>
        </button>
      </nav>

      {activePet && (
        <div style={{ marginTop: 'auto', width: '100%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <PetWidget pet={activePet} tone="idle" activeAccessories={activeAccessories} />
          <PetStatusCard
            pet={activePet}
            isStreakExcited={isStreakExcited}
            onFeed={onFeedPet}
            activeAccessories={activeAccessories}
            onOpenShop={onOpenShop}
          />
        </div>
      )}
    </aside>
  );
}
