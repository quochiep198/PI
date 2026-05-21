import { useState } from 'react';
import type { InventoryTab } from './types';

const BOT_AVATAR = 'https://lh3.googleusercontent.com/aida-public/AB6AXuDXqdRO6SjMOvckH7v5nZuYJQHYG5y5FtuGan2T4KfSejVa9SNn5nANq5q-_SsBR-NvlyaYO9Mw6nnLabHT8eYrTvf4ad8MO_O7On3FUniYNrIvbbAlLVh-e3syV8Oc-JY9-86xxyj6zNQYJ1jkBShR-eh-n2nu6PBQvHlEPNVHBYSr4ZD_HJtz_PQyIOiwEhXa-Okd_oLele8Q_rQ2ppqyBNoy6ByFxlNEd_SP5kzq9ig4R7VVbwj5xS9aIWiR57LFqVeHzaq7blUu';

const TABS: { id: InventoryTab; label: string; icon: string }[] = [
  { id: 'hats', label: 'Mũ/Tóc', icon: 'style' },
  { id: 'glasses', label: 'Kính', icon: 'visibility' },
  { id: 'clothes', label: 'Trang phục', icon: 'apparel' },
  { id: 'back', label: 'Phụ kiện lưng', icon: 'backpack' },
];

const SAMPLE_ITEMS = [
  { id: '1', name: 'Mũ Quý Tộc', icon: 'fort', rarity: 'rare' as const, equipped: true },
  { id: '2', name: 'Balo Tên Lửa', icon: 'rocket_launch', rarity: 'epic' as const, equipped: false },
  { id: '3', name: 'Kính Cyber', icon: 'smart_toy', rarity: 'common' as const, equipped: false },
  { id: '4', name: 'Tai Nghe Neon', icon: 'headphones', rarity: 'common' as const, equipped: false },
  { id: '5', name: 'Giáp Python', icon: 'shield', rarity: 'rare' as const, equipped: false },
  { id: '6', name: 'Vương Miện', icon: 'crown', rarity: 'legendary' as const, equipped: false },
];

const RARITY_COLORS: Record<string, string> = {
  common: 'var(--color-outline)',
  rare: 'var(--color-secondary)',
  epic: 'var(--color-tertiary-container)',
  legendary: 'var(--color-primary)',
};

export function InventoryPage() {
  const [activeTab, setActiveTab] = useState<InventoryTab>('hats');

  return (
    <div className="inventory-layout">
      {/* Left: Character Preview */}
      <section className="inventory-character">
        <div className="inventory-character__bg" />
        <h2 className="inventory-character__title">Tạo Nhân Vật</h2>

        <div className="inventory-character__stage">
          <div className="inventory-character__glow" />
          <div className="inventory-character__bot">
            <img
              alt="Py-Bot Base"
              className="inventory-character__bot-image"
              src={BOT_AVATAR}
            />
            <div className="inventory-character__equipped-hat">
              <span className="material-symbols-outlined">fort</span>
            </div>
          </div>
          <div className="inventory-character__shadow" />
        </div>

        <button className="inventory-character__save-btn" type="button">
          <span className="material-symbols-outlined">save</span>
          Lưu Nhân Vật
        </button>
      </section>

      {/* Right: Inventory Grid */}
      <section className="inventory-grid-section">
        <div className="inventory-header">
          <div className="inventory-header__title-row">
            <h3 className="inventory-header__title">Kho Đồ Của Bạn</h3>
            <span className="inventory-header__count">48/100 Vật phẩm</span>
          </div>

          <div className="inventory-tabs">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                className={`inventory-tab${activeTab === tab.id ? ' is-active' : ''}`}
                type="button"
                onClick={() => setActiveTab(tab.id)}
              >
                <span className="material-symbols-outlined">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="inventory-items-container">
          <div className="inventory-items">
            {SAMPLE_ITEMS.map((item) => (
              <div
                key={item.id}
                className={`inventory-item${item.equipped ? ' is-equipped' : ''}`}
              >
                <div className="inventory-item__check">
                  <span className="material-symbols-outlined">check</span>
                </div>
                <div className="inventory-item__icon">
                  <span className="material-symbols-outlined" style={{ color: RARITY_COLORS[item.rarity] }}>
                    {item.icon}
                  </span>
                </div>
                <p className="inventory-item__name">{item.name}</p>
                <p className="inventory-item__rarity">
                  Rarity: {item.rarity.charAt(0).toUpperCase()}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mobile Bottom Navigation */}
      <nav className="inventory-mobile-nav">
        <button className="inventory-mobile-nav__item" type="button">
          <span className="material-symbols-outlined">map</span>
          <span>Map</span>
        </button>
        <button className="inventory-mobile-nav__item" type="button">
          <span className="material-symbols-outlined">code</span>
          <span>Luyện tập</span>
        </button>
        <button className="inventory-mobile-nav__item is-active" type="button">
          <span className="material-symbols-outlined">inventory</span>
          <span>Kho đồ</span>
        </button>
        <button className="inventory-mobile-nav__item" type="button">
          <span className="material-symbols-outlined">account_circle</span>
          <span>Hồ sơ</span>
        </button>
      </nav>
    </div>
  );
}