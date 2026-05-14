import { mobileNavItems, sideNavItems, topNavItems } from './navigation';

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

export function SideNavigation() {
  return (
    <nav className="sidenav__nav" aria-label="Section">
      {sideNavItems.map((item) => (
        <button
          key={item.label}
          className={`pressable sidenav__item${item.active ? ' is-active' : ''}`}
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
