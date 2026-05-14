export type TopNavItem = {
  label: string;
  href: string;
  active?: boolean;
};

export type IconNavItem = {
  icon: string;
  label: string;
  active?: boolean;
};

export const topNavItems: TopNavItem[] = [
  { label: 'Lessons', href: '#', active: true },
  { label: 'Playground', href: '#' },
  { label: 'Achievements', href: '#' },
];

export const sideNavItems: IconNavItem[] = [
  { icon: 'menu_book', label: 'Lessons', active: true },
  { icon: 'code', label: 'Playground' },
  { icon: 'military_tech', label: 'Achievements' },
  { icon: 'settings', label: 'Settings' },
];

export const mobileNavItems: IconNavItem[] = [
  { icon: 'menu_book', label: 'Bài học', active: true },
  { icon: 'code', label: 'Playground' },
  { icon: 'military_tech', label: 'Thành tích' },
  { icon: 'account_circle', label: 'Tôi' },
];
