import { mobileNavItems, sideNavItems, topNavItems, type IconNavItem } from './navigation';

export function TopNavigation() {
  return (
    <nav className="topbar__nav" aria-label="Primary">
      {topNavItems.map((item) => (
        <a key={item.label} className={`topbar__link${item.active ? ' is-active' : ''}`} href={item.href}>
          {item.label}
        </a>
      ))}
    </nav>
  );
}

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

export function MobileNavigation() {
  return (
    <nav className="mobile-nav" aria-label="Mobile">
      {mobileNavItems.map((item) => (
        <button
          key={item.label}
          className={`mobile-nav__item${item.active ? ' is-active' : ''}`}
          type="button"
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