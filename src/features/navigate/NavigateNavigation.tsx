import { sideNavItems, type IconNavItem } from './navigation';

interface NavButtonProps {
  item: IconNavItem;
  isActive?: boolean;
}

function NavButton({ item, isActive }: NavButtonProps) {
  return (
    <button
      className={`pressable sidenav__item${isActive ? ' is-active' : ''}`}
      type="button"
      onClick={item.onClick}
    >
      <span aria-hidden="true" className="material-symbols-outlined">
        {item.icon}
      </span>
      <span>{item.label}</span>
    </button>
  );
}

interface SideNavigationProps {
  activeLabel?: string;
  itemClickHandlers?: Record<string, () => void>;
}

export function SideNavigation({ activeLabel, itemClickHandlers }: SideNavigationProps) {
  const navItems = activeLabel
    ? sideNavItems.map(item => ({
        ...item,
        active: item.label === activeLabel,
        onClick: itemClickHandlers?.[item.label] ?? item.onClick,
      }))
    : sideNavItems;

  return (
    <nav className="sidenav__nav" aria-label="Section">
      {navItems.map((item) => (
        <NavButton key={item.label} item={item} isActive={item.active} />
      ))}
    </nav>
  );
}

type MobileNavView = 'home' | 'practice' | 'settings';

interface MobileNavigationProps {
  activeView: MobileNavView;
  onNavigateLessons?: () => void;
  onNavigatePractice?: () => void;
  onNavigateSettings?: () => void;
}

export function MobileNavigation({
  activeView,
  onNavigateLessons,
  onNavigatePractice,
  onNavigateSettings,
}: MobileNavigationProps) {
  const items: Array<{
    icon: string;
    label: string;
    isActive: boolean;
    onClick?: () => void;
  }> = [
    {
      icon: 'menu_book',
      label: 'Bài Học',
      isActive: activeView === 'home',
      onClick: onNavigateLessons,
    },
    {
      icon: 'code',
      label: 'Luyện Tập',
      isActive: activeView === 'practice',
      onClick: onNavigatePractice,
    },
    {
      icon: 'settings',
      label: 'Cài Đặt',
      isActive: activeView === 'settings',
      onClick: onNavigateSettings,
    },
  ];

  return (
    <nav className="mobile-nav" aria-label="Mobile">
      {items.map((item) => (
        <button
          key={item.label}
          className={`mobile-nav__item${item.isActive ? ' is-active' : ''}`}
          type="button"
          onClick={item.onClick}
        >
          <span aria-hidden="true" className="material-symbols-outlined">
            {item.icon}
          </span>
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  );
}
