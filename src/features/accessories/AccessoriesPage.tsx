import { useState } from 'react';
import type { AccessoriesTab } from './types';

const DEFAULT_AVATAR = 'https://lh3.googleusercontent.com/aida-public/AB6AXuCIkAiQkgSAnU6vT1eJbdd29RFBKCvirjBnjNFsbvtTYJOIoPqMDkzoGgeeMQbtOWZ1QsotjNXoRQRlfPJRtx_RqWNJX8TJuj95nAeZPhEt4u2W4NboSi5oi0bTO1bevMSPHeAoDqmC0xXCSEya7HFfa-hkhgpZpLhJhQYnC5p8Dh0_upeGYKLTOqWJGPxaBRbnzR8a3vcPh8sE8yW9rqrn9uH6gQT-Ycc9mEm72iSk57LF4B_07q7u2MaajmO2Lgh9fmJsFRpX3WUl';

const TABS: { id: AccessoriesTab; label: string; icon: string }[] = [
  { id: 'all', label: 'Tất cả', icon: 'apps' },
  { id: 'hats', label: 'Mũ/Tóc', icon: 'style' },
  { id: 'glasses', label: 'Kính', icon: 'visibility' },
  { id: 'clothes', label: 'Trang phục', icon: 'apparel' },
  { id: 'back', label: 'Phụ kiện lưng', icon: 'backpack' },
];

const SAMPLE_ACCESSORIES = [
  { id: '1', name: 'Mũ Quý Tộc', icon: 'fort', rarity: 'rare' as const, equipped: true, category: 'hats' as AccessoriesTab },
  { id: '2', name: 'Vương Miện Vàng', icon: 'crown', rarity: 'legendary' as const, equipped: false, category: 'hats' as AccessoriesTab },
  { id: '3', name: 'Kính Cyber', icon: 'smart_toy', rarity: 'common' as const, equipped: false, category: 'glasses' as AccessoriesTab },
  { id: '4', name: 'Tai Nghe Neon', icon: 'headphones', rarity: 'common' as const, equipped: false, category: 'glasses' as AccessoriesTab },
  { id: '5', name: 'Giáp Python', icon: 'shield', rarity: 'rare' as const, equipped: false, category: 'clothes' as AccessoriesTab },
  { id: '6', name: 'Áo Choàng Rồng', icon: 'psychology', rarity: 'epic' as const, equipped: false, category: 'clothes' as AccessoriesTab },
  { id: '7', name: 'Balo Tên Lửa', icon: 'rocket_launch', rarity: 'epic' as const, equipped: false, category: 'back' as AccessoriesTab },
  { id: '8', name: 'Cánh Thiên Thần', icon: 'flight', rarity: 'legendary' as const, equipped: false, category: 'back' as AccessoriesTab },
];

const RARITY_COLORS: Record<string, string> = {
  common: 'var(--color-outline)',
  rare: 'var(--color-secondary)',
  epic: 'var(--color-tertiary-container)',
  legendary: 'var(--color-primary)',
};

const RARITY_LABELS: Record<string, string> = {
  common: 'C',
  rare: 'H',
  epic: 'E',
  legendary: 'L',
};

const RARITY_NAMES: Record<string, string> = {
  common: 'Thường',
  rare: 'Hiếm',
  epic: 'Epic',
  legendary: 'Huyền Thoại',
};

export function AccessoriesPage() {
  const [activeTab, setActiveTab] = useState<AccessoriesTab>('all');

  const filteredItems = activeTab === 'all'
    ? SAMPLE_ACCESSORIES
    : SAMPLE_ACCESSORIES.filter((item) => item.category === activeTab);

  return (
    <div className="accessories-layout">
      {/* Left: Character Preview */}
      <section className="accessories-character">
        <div className="accessories-character__bg" />
        <h2 className="accessories-character__title">Nhân Vật Của Bạn</h2>

        <div className="accessories-character__stage">
          <div className="accessories-character__glow" />
          <div className="accessories-character__bot">
            <img
              alt="Py-Bot"
              className="accessories-character__bot-image"
              src={DEFAULT_AVATAR}
            />
            <div className="accessories-character__equipped-badge">
              <span className="material-symbols-outlined">verified</span>
            </div>
          </div>
          <div className="accessories-character__shadow" />
        </div>

        <div className="accessories-character__name-plate">
          <span className="accessories-character__player-name">PyMaster_2024</span>
          <span className="accessories-character__level">Cấp 42</span>
        </div>

        <div className="accessories-character__stats">
          <div className="accessories-stat">
            <span className="accessories-stat__value">8</span>
            <span className="accessories-stat__label">Vật phẩm</span>
          </div>
          <div className="accessories-stat">
            <span className="accessories-stat__value">3</span>
            <span className="accessories-stat__label">Đã trang bị</span>
          </div>
        </div>
      </section>

      {/* Right: Accessories Grid */}
      <section className="accessories-grid-section">
        <div className="accessories-header">
          <div className="accessories-header__title-row">
            <h3 className="accessories-header__title">Phụ Kiện & Trang Bị</h3>
            <span className="accessories-header__count">{filteredItems.length} vật phẩm</span>
          </div>

          <div className="accessories-tabs">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                className={`accessories-tab${activeTab === tab.id ? ' is-active' : ''}`}
                type="button"
                onClick={() => setActiveTab(tab.id)}
              >
                <span className="material-symbols-outlined">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="accessories-items-container">
          <div className="accessories-items">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className={`accessories-item${item.equipped ? ' is-equipped' : ''}`}
              >
                <div className="accessories-item__rarity-badge" style={{ backgroundColor: RARITY_COLORS[item.rarity] }}>
                  {RARITY_LABELS[item.rarity]}
                </div>
                {item.equipped && (
                  <div className="accessories-item__equipped-check">
                    <span className="material-symbols-outlined">check</span>
                  </div>
                )}
                <div className="accessories-item__icon">
                  <span className="material-symbols-outlined" style={{ color: RARITY_COLORS[item.rarity] }}>
                    {item.icon}
                  </span>
                </div>
                <p className="accessories-item__name">{item.name}</p>
                <p className="accessories-item__rarity">{RARITY_NAMES[item.rarity]}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mobile Bottom Navigation */}
      <nav className="accessories-mobile-nav">
        <button className="accessories-mobile-nav__item" type="button">
          <span className="material-symbols-outlined">map</span>
          <span>Map</span>
        </button>
        <button className="accessories-mobile-nav__item" type="button">
          <span className="material-symbols-outlined">code</span>
          <span>Luyện tập</span>
        </button>
        <button className="accessories-mobile-nav__item" type="button">
          <span className="material-symbols-outlined">military_tech</span>
          <span>Phụ kiện</span>
        </button>
        <button className="accessories-mobile-nav__item" type="button">
          <span className="material-symbols-outlined">account_circle</span>
          <span>Hồ sơ</span>
        </button>
      </nav>
    </div>
  );
}