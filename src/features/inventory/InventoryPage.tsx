import { useState, useEffect } from 'react';
import type { InventoryTab } from './types';
import './inventory.css';

interface Avatar {
  id: number;
  name: string;
  description: string;
  imageData: string;
  isActive: boolean;
}

interface UserItem {
  id: number;
  itemId: number;
  name: string;
  assetType: string;
  description: string;
  imageData: string;
  price: number;
  isActive: boolean;
}

const BOT_AVATAR = 'https://lh3.googleusercontent.com/aida-public/AB6AXuDXqdRO6SjMOvckH7v5nZuYJQHYG5y5FtuGan2T4KfSejVa9SNn5nANq5q-_SsBR-NvlyaYO9Mw6nnLabHT8eYrTvf4ad8MO_O7On3FUniYNrIvbbAlLVh-e3syV8Oc-JY9-86xxyj6zNQYJ1jkBShR-eh-n2nu6PBQvHlEPNVHBYSr4ZD_HJtz_PQyIOiwEhXa-Okd_oLele8Q_rQ2ppqyBNoy6ByFxlNEd_SP5kzq9ig4R7VVbwj5xS9aIWiR57LFqVeHzaq7blUu';

const TABS: { id: InventoryTab; label: string; icon: string; assetType: string }[] = [
  { id: 'hats', label: 'Mũ/Tóc', icon: 'style', assetType: 'hat' },
  { id: 'glasses', label: 'Kính', icon: 'visibility', assetType: 'glasses' },
  { id: 'clothes', label: 'Trang phục', icon: 'apparel', assetType: 'jacket' },
  { id: 'back', label: 'Phụ kiện lưng', icon: 'backpack', assetType: 'backpack' },
];

export function InventoryPage() {
  const [activeTab, setActiveTab] = useState<InventoryTab>('hats');
  const [avatars, setAvatars] = useState<Avatar[]>([]);
  const [currentAvatarIndex, setCurrentAvatarIndex] = useState<number>(0);
  const [isLoadingAvatars, setIsLoadingAvatars] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const [userItems, setUserItems] = useState<UserItem[]>([]);
  const [isLoadingItems, setIsLoadingItems] = useState(false);

  const currentTab = TABS.find((t) => t.id === activeTab);

  // Fetch avatars
  useEffect(() => {
    let active = true;
    async function fetchAvatars() {
      try {
        const response = await fetch('/api/avatars');
        if (response.ok) {
          const data = await response.json();
          if (active) {
            setAvatars(data.avatars || []);
            setIsLoadingAvatars(false);
            const activeIndex = data.avatars?.findIndex((a: Avatar) => a.isActive) ?? -1;
            if (activeIndex !== -1) {
              setCurrentAvatarIndex(activeIndex);
            }
          }
        } else {
          if (active) setIsLoadingAvatars(false);
        }
      } catch (error) {
        console.error('Failed to fetch avatars:', error);
        if (active) setIsLoadingAvatars(false);
      }
    }
    void fetchAvatars();
    return () => { active = false; };
  }, []);

  // Fetch user items by type when tab changes
  useEffect(() => {
    let active = true;
    async function fetchUserItems() {
      if (!currentTab) return;

      setIsLoadingItems(true);
      try {
        const response = await fetch('/api/user-items/list', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: currentTab.assetType }),
        });

        if (response.ok) {
          const data = await response.json();
          if (active) {
            setUserItems(data.items || []);
          }
        }
      } catch (error) {
        console.error('Failed to fetch user items:', error);
        if (active) setUserItems([]);
      } finally {
        if (active) setIsLoadingItems(false);
      }
    }
    void fetchUserItems();
    return () => { active = false; };
  }, [activeTab, currentTab]);

  const handlePrevAvatar = () => {
    setCurrentAvatarIndex((prev) => (prev > 0 ? prev - 1 : avatars.length - 1));
  };

  const handleNextAvatar = () => {
    setCurrentAvatarIndex((prev) => (prev < avatars.length - 1 ? prev + 1 : 0));
  };

  const handleSaveAvatar = async () => {
    if (avatars.length === 0 || !avatars[currentAvatarIndex]) return;

    setIsSaving(true);
    setSaveMessage(null);

    try {
      const response = await fetch('/api/avatars/set-active', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatarId: avatars[currentAvatarIndex].id }),
      });

      const data = await response.json();

      if (response.ok) {
        const updatedAvatars = avatars.map((avatar, index) => ({
          ...avatar,
          isActive: index === currentAvatarIndex,
        }));
        setAvatars(updatedAvatars);
        setSaveMessage('Đã lưu thành công!');
        setTimeout(() => setSaveMessage(null), 2000);
      } else {
        setSaveMessage(data.message || 'Lỗi khi lưu.');
      }
    } catch (error) {
      console.error('Failed to save avatar:', error);
      setSaveMessage('Không thể kết nối server.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleItem = async (item: UserItem) => {
    try {
      const response = await fetch('/api/user-items/set-active', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userItemId: item.id }),
      });

      if (response.ok) {
        // Update local state
        setUserItems((prev) =>
          prev.map((i) => ({
            ...i,
            isActive: i.id === item.id,
          }))
        );
      }
    } catch (error) {
      console.error('Failed to toggle item:', error);
    }
  };

  return (
    <div className="inventory-layout">
      {/* Left: Character Preview */}
      <section className="inventory-character">
        <div className="inventory-character__bg" />
        <h2 className="inventory-character__title">Chọn Nhân Vật</h2>

        <div className="inventory-character__stage">
          <div className="inventory-character__glow" />
          <div className="inventory-character__bot">
            {isLoadingAvatars ? (
              <div className="inventory-character__loading">
                <span className="material-symbols-outlined rotating">hourglass_empty</span>
              </div>
            ) : (
              <>
                {avatars.length > 1 && (
                  <button
                    className="inventory-character__nav-btn prev-btn"
                    onClick={handlePrevAvatar}
                    type="button"
                    aria-label="Previous Avatar"
                  >
                    <span className="material-symbols-outlined">chevron_left</span>
                  </button>
                )}
                <img
                  className="inventory-character__bot-image"
                  src={avatars[currentAvatarIndex]?.imageData || BOT_AVATAR}
                  alt={avatars[currentAvatarIndex]?.name || 'Bot Avatar'}
                />
                {avatars.length > 1 && (
                  <button
                    className="inventory-character__nav-btn next-btn"
                    onClick={handleNextAvatar}
                    type="button"
                    aria-label="Next Avatar"
                  >
                    <span className="material-symbols-outlined">chevron_right</span>
                  </button>
                )}
              </>
            )}
          </div>
          <div className="inventory-character__shadow" />
        </div>

        <button
          className="inventory-character__save-btn"
          type="button"
          onClick={handleSaveAvatar}
          disabled={isSaving || avatars.length === 0}
        >
          <span className="material-symbols-outlined">{isSaving ? 'hourglass_empty' : 'save'}</span>
          {isSaving ? 'Đang lưu...' : saveMessage || 'Lưu Nhân Vật'}
        </button>
      </section>

      {/* Right: Inventory Grid */}
      <section className="inventory-grid-section">
        <div className="inventory-header">
          <div className="inventory-header__title-row">
            <h3 className="inventory-header__title">Kho Đồ Của Bạn</h3>
            <span className="inventory-header__count">{userItems.length} vật phẩm</span>
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
          {isLoadingItems ? (
            <div className="inventory-items__loading">
              <span className="material-symbols-outlined rotating">hourglass_empty</span>
              <span>Đang tải...</span>
            </div>
          ) : userItems.length === 0 ? (
            <div className="inventory-items__empty">
              <span className="material-symbols-outlined">inventory_2</span>
              <p>Chưa có vật phẩm nào</p>
              <span className="inventory-items__empty-hint">Mua vật phẩm tại cửa hàng</span>
            </div>
          ) : (
            <div className="inventory-items">
              {userItems.map((item) => (
                <div
                  key={item.id}
                  className={`inventory-item${item.isActive ? ' is-equipped' : ''}`}
                  onClick={() => handleToggleItem(item)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && handleToggleItem(item)}
                >
                  <div className="inventory-item__check">
                    <span className="material-symbols-outlined">check</span>
                  </div>
                  {item.imageData && (
                    <img
                      className="inventory-item__image"
                      src={item.imageData}
                      alt={item.name}
                    />
                  )}
                  <p className="inventory-item__name">{item.name}</p>
                  {item.price > 0 && (
                    <p className="inventory-item__price">
                      <span className="material-symbols-outlined">toll</span>
                      {item.price}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
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