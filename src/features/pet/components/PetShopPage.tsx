import { useState, useEffect } from 'react';
import { fetchPetShop, buyPetAccessory, equipPetAccessory } from '../petApi';
import type { PetShopItem, PetAccessory, UserPet, PetTemplate } from '../types';
import '../pet.css';

interface PetShopPageProps {
  activePet: UserPet | null;
  petTemplates: PetTemplate[];
  activeAccessories: PetAccessory[];
  currentCoins: number;
  onCoinsUpdated: (coins: number) => void;
  onRefreshPetState: () => void;
}

export function PetShopPage({
  activePet,
  petTemplates,
  activeAccessories,
  currentCoins,
  onCoinsUpdated,
  onRefreshPetState,
}: PetShopPageProps) {
  const [activeTab, setActiveTab] = useState<'shop' | 'wardrobe'>('shop');
  const [shopItems, setShopItems] = useState<PetShopItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
  const [searchQuery, setSearchQuery] = useState('');
  const [priceFilter, setPriceFilter] = useState<'all' | 'under50' | '50to100' | 'over100'>('all');

  // Pet template preview index state
  const [previewTemplateIndex, setPreviewTemplateIndex] = useState(0);

  // Synchronize initial preview template with the user's active pet template
  useEffect(() => {
    if (activePet && petTemplates.length > 0) {
      const idx = petTemplates.findIndex((t) => t.id === activePet.templateId);
      if (idx !== -1) {
        setPreviewTemplateIndex(idx);
      }
    } else if (petTemplates.length > 0) {
      setPreviewTemplateIndex(0);
    }
  }, [activePet, petTemplates]);

  const handlePrevTemplate = () => {
    if (petTemplates.length === 0) return;
    setPreviewTemplateIndex((prev) => (prev === 0 ? petTemplates.length - 1 : prev - 1));
  };

  const handleNextTemplate = () => {
    if (petTemplates.length === 0) return;
    setPreviewTemplateIndex((prev) => (prev === petTemplates.length - 1 ? 0 : prev + 1));
  };

  const loadShopData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchPetShop();
      setShopItems(data.shopItems);
      onCoinsUpdated(data.coins);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải cửa hàng.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadShopData();
    setActiveTab('shop');
  }, []);

  const handleBuy = async (item: PetShopItem) => {
    if (currentCoins < item.price) {
      setError('Bạn không có đủ Coins!');
      return;
    }
    setActionLoading(item.id);
    setError(null);
    try {
      const res = await buyPetAccessory(item.id);
      if (res.success) {
        onCoinsUpdated(res.newCoins);
        await loadShopData();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Giao dịch thất bại.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleEquipToggle = async (item: PetShopItem) => {
    const isEquipped = activeAccessories.some((acc) => acc.itemId === item.id);
    setActionLoading(item.id);
    setError(null);
    try {
      if (isEquipped) {
        // Unequip specific item
        await equipPetAccessory(item.id, false);
      } else {
        // Equip specific item
        await equipPetAccessory(item.id, true);
      }
      onRefreshPetState();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Thao tác thất bại.');
    } finally {
      setActionLoading(null);
    }
  };

  // Helper functions for large avatar preview rendering
  const getPetImage = (pet: UserPet) => {
    if (pet.fullness === 0) {
      return '💤';
    }
    if (pet.fullness < 30) {
      return pet.codeName === 'cyber_cat' ? '😿' : '🥺';
    }
    if (pet.level === 1) return pet.imageBaby;
    if (pet.level >= 2 && pet.level <= 4) return pet.imageTeen;
    if (pet.level >= 5 && pet.level <= 9) return pet.imageAdult;
    return pet.imageMaster;
  };

  // Determine avatar icon based on selected template
  const getPreviewImage = (template: PetTemplate) => {
    // If it matches the user's active pet, use the dynamic level/fullness image
    if (activePet && template.id === activePet.templateId) {
      return getPetImage(activePet);
    }
    // Otherwise show the Adult stage as a default preview
    return template.imageAdult;
  };

  const getAccessoryClass = (acc: PetAccessory | PetShopItem | undefined) => {
    return acc?.accessoryClass || 'accessory-fallback';
  };

  const ownedItems = shopItems.filter((item) => item.isOwned);
  const displayedItems = activeTab === 'shop' ? shopItems : ownedItems;

  const filteredItems = displayedItems.filter((item) => {
    // Search by name (case-insensitive)
    const matchesName = item.name.toLowerCase().includes(searchQuery.toLowerCase());

    // Filter by price range
    let matchesPrice = true;
    if (priceFilter === 'under50') {
      matchesPrice = item.price < 50;
    } else if (priceFilter === '50to100') {
      matchesPrice = item.price >= 50 && item.price <= 100;
    } else if (priceFilter === 'over100') {
      matchesPrice = item.price > 100;
    }

    return matchesName && matchesPrice;
  });

  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);
  const activePage = Math.min(currentPage, Math.max(1, totalPages));
  const startIndex = (activePage - 1) * ITEMS_PER_PAGE;
  const paginatedItems = filteredItems.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // Selected preview pet template
  const currentTemplate = petTemplates[previewTemplateIndex] || null;
  const isCurrentlyActivePet = activePet && currentTemplate && activePet.templateId === currentTemplate.id;

  return (
    <main className="settings-main pet-shop-container">
      <div className="pet-shop-new-layout">

        {/* PANEL 1: Left Showcase Panel */}
        {currentTemplate ? (
          <article className="pet-shop-side-card pet-shop-preview-card">
            <h3>🐾 Thú cưng</h3>

            <div className="pet-shop-avatar-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', margin: '8px 0' }}>
              <button 
                type="button" 
                className="pet-stage-slide-btn prev pressable"
                onClick={handlePrevTemplate}
                title="Xem thú cưng trước"
                disabled={petTemplates.length <= 1}
              >
                <span className="material-symbols-outlined">chevron_left</span>
              </button>

              <div className="pet-shop-avatar-large" title={currentTemplate.name}>
                {getPreviewImage(currentTemplate)}
                {activeAccessories.map((acc) => (
                  <span
                    key={acc.id}
                    className={`accessory-overlay ${getAccessoryClass(acc)}`}
                    title={acc.name}
                  >
                    {acc.imageData}
                  </span>
                ))}
              </div>

              <button 
                type="button" 
                className="pet-stage-slide-btn next pressable"
                onClick={handleNextTemplate}
                title="Xem thú cưng tiếp theo"
                disabled={petTemplates.length <= 1}
              >
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </div>

            <div className="pet-shop-preview-stage-label" style={{ textAlign: 'center', display: 'block', margin: '0 auto 12px auto' }}>
              {isCurrentlyActivePet ? 'Thú cưng của bạn' : 'Xem trước (Chưa nuôi)'}
            </div>

            {isCurrentlyActivePet && activePet ? (
              <>
                <div className="pet-shop-preview-nickname">{activePet.nickname}</div>
                <div className="pet-shop-preview-codename">@{activePet.codeName}</div>

                {/* Stats: Fullness & XP */}
                <div className="pet-shop-preview-stat-row">
                  <div className="pet-shop-preview-stat-label">
                    <span>🍖 Độ no</span>
                    <span>{activePet.fullness}/100</span>
                  </div>
                  <div className="pet-shop-preview-progress-bg">
                    <div
                      className="pet-shop-preview-progress-fill fullness"
                      style={{ width: `${activePet.fullness}%` }}
                    />
                  </div>
                </div>

                <div className="pet-shop-preview-stat-row">
                  <div className="pet-shop-preview-stat-label">
                    <span>⭐ Cấp độ {activePet.level}</span>
                    <span>{activePet.currentXp}/{activePet.nextLevelXp} XP</span>
                  </div>
                  <div className="pet-shop-preview-progress-bg">
                    <div
                      className="pet-shop-preview-progress-fill xp"
                      style={{ width: `${Math.min(100, (activePet.currentXp / activePet.nextLevelXp) * 100)}%` }}
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="pet-shop-preview-nickname">{currentTemplate.name}</div>
                <div className="pet-shop-preview-codename">@{currentTemplate.codeName}</div>
                
                <div style={{ textAlign: 'center', padding: '10px 0', fontSize: '0.8rem', color: '#94a3b8' }}>
                  <p style={{ margin: '0 0 10px 0', lineHeight: '1.4' }}>{currentTemplate.description}</p>
                  <span className="pet-shop-equipped-tag" style={{ background: 'rgba(234, 179, 8, 0.1)', borderColor: 'rgba(234, 179, 8, 0.2)', color: '#fbbf24', cursor: 'default' }}>
                    Nhận nuôi: 🪙 {currentTemplate.priceCoins} Coins tại trang chủ
                  </span>
                </div>
              </>
            )}

            {/* Currently Equipped Accessories */}
            <div className="pet-shop-equipped-section">
              <div className="pet-shop-equipped-title">Đang mặc thử</div>
              {activeAccessories.length === 0 ? (
                <div className="pet-shop-no-equipped">Chưa trang bị phụ kiện nào.</div>
              ) : (
                <div className="pet-shop-equipped-tags">
                  {activeAccessories.map((acc) => {
                    const itemMatch = shopItems.find((item) => item.id === acc.itemId);
                    return (
                      <span
                        key={acc.id}
                        className="pet-shop-equipped-tag"
                        onClick={() => itemMatch && handleEquipToggle(itemMatch)}
                        title="Nhấn để tháo nhanh"
                      >
                        {acc.imageData} {acc.name} <span className="close-icon">✕</span>
                      </span>
                    );
                  })}
                </div>
              )}
            </div>

          </article>
        ) : (
          <article className="pet-shop-side-card pet-shop-preview-card">
            <h3>🐾 Thú cưng</h3>
            <div style={{ textAlign: 'center', padding: '40px 10px', color: '#94a3b8' }}>
              <span style={{ fontSize: '3.5rem', display: 'block', marginBottom: '16px', animation: 'float 3s ease-in-out infinite' }}>🥚</span>
              <p style={{ fontSize: '0.85rem', lineHeight: '1.4', margin: 0 }}>
                Bạn chưa nhận nuôi thú cưng nào. Hãy quay lại trang chủ và chọn nhận nuôi thú cưng để làm điệu nhé!
              </p>
            </div>
          </article>
        )}

        {/* PANEL 2: Center Items Catalog */}
        <article className="settings-card pet-shop-catalog-card">
          <div className="pet-shop-catalog-title">
            <span>{activeTab === 'shop' ? '🛒 Cửa hàng phụ kiện' : '👕 Tủ đồ của Pet'}</span>
            <span className="pet-shop-catalog-badge">
              {filteredItems.length} phụ kiện
            </span>
          </div>

          {/* Error Alert */}
          {error && <div className="pet-shop-error-alert">{error}</div>}

          {/* Loading Spinner or Grid */}
          {loading ? (
            <div className="pet-shop-loading">
              <div className="pet-spinner"></div>
              <p>Đang tải cửa hàng...</p>
            </div>
          ) : (
            <div className="pet-shop-content" style={{ maxHeight: 'none', overflowY: 'visible' }}>
              {filteredItems.length === 0 ? (
                <div className="pet-wardrobe-empty" style={{ padding: '60px 0' }}>
                  <span className="empty-icon">🔍</span>
                  <p>Không tìm thấy phụ kiện nào phù hợp với bộ lọc.</p>
                  {activeTab === 'wardrobe' && ownedItems.length === 0 && (
                    <button
                      className="pet-shop-btn buy-btn pressable"
                      style={{ padding: '8px 20px', marginTop: '12px' }}
                      onClick={() => {
                        setActiveTab('shop');
                        setCurrentPage(1);
                        setSearchQuery('');
                        setPriceFilter('all');
                      }}
                    >
                      Ghé Cửa Hàng
                    </button>
                  )}
                </div>
              ) : (
                <div className="pet-shop-grid">
                  {paginatedItems.map((item) => {
                    const isOwned = item.isOwned;
                    const isEquipped = activeAccessories.some((acc) => acc.itemId === item.id);
                    const canAfford = currentCoins >= item.price;

                    return (
                      <div key={item.id} className={`pet-shop-item-card ${isOwned ? 'owned' : ''} ${isEquipped ? 'equipped' : ''}`}>
                        <div className="pet-shop-item-avatar-bg">
                          <span className="pet-shop-item-emoji">{item.imageData}</span>
                        </div>
                        <div className="pet-shop-item-info">
                          <span className="pet-shop-item-name">{item.name}</span>
                          <p className="pet-shop-item-desc">{item.description}</p>
                        </div>

                        <div className="pet-shop-item-actions">
                          {isOwned ? (
                            <button
                              type="button"
                              className={`pet-shop-btn equip-btn pressable ${isEquipped ? 'equipped' : ''}`}
                              onClick={() => handleEquipToggle(item)}
                              disabled={actionLoading === item.id}
                            >
                              {actionLoading === item.id ? '...' : isEquipped ? 'Tháo' : 'Trang bị'}
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="pet-shop-btn buy-btn pressable"
                              onClick={() => handleBuy(item)}
                              disabled={actionLoading === item.id || !canAfford}
                              title={!canAfford ? 'Bạn không đủ Coins' : `Mua với ${item.price} Coins`}
                            >
                              {actionLoading === item.id ? (
                                '...'
                              ) : (
                                <>
                                  <span className="material-symbols-outlined" style={{ fontSize: '0.9rem', marginRight: '3px' }}>monetization_on</span>
                                  {item.price}
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="pet-shop-pagination">
                  <button
                    type="button"
                    className="pet-shop-pagination-btn pressable"
                    disabled={activePage === 1}
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  >
                    Trước
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      type="button"
                      className={`pet-shop-pagination-btn page-num pressable ${activePage === page ? 'active' : ''}`}
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    type="button"
                    className="pet-shop-pagination-btn pressable"
                    disabled={activePage === totalPages}
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  >
                    Sau
                  </button>
                </div>
              )}
            </div>
          )}
        </article>

        {/* PANEL 3: Right Control Panel */}
        <article className="pet-shop-side-card pet-shop-control-side-col">
          <h3>⚙️ Cài đặt & Tủ đồ</h3>

          {/* User Coins Badge */}
          <div className="pet-shop-premium-coins" title={`Bạn có ${currentCoins} Coins`}>
            <span className="coin-icon">🪙</span>
            <span>{currentCoins} Coins</span>
          </div>

          {/* Tab Switcher */}
          <div className="pet-shop-control-tabs">
            <button
              className={activeTab === 'shop' ? 'active' : ''}
              onClick={() => {
                setActiveTab('shop');
                setCurrentPage(1);
                setSearchQuery('');
                setPriceFilter('all');
                setError(null);
              }}
            >
              <span className="material-symbols-outlined">storefront</span>
              <span>Ghé Cửa hàng</span>
            </button>
            <button
              className={activeTab === 'wardrobe' ? 'active' : ''}
              onClick={() => {
                setActiveTab('wardrobe');
                setCurrentPage(1);
                setSearchQuery('');
                setPriceFilter('all');
                setError(null);
              }}
            >
              <span className="material-symbols-outlined">checkroom</span>
              <span>Tủ đồ của Pet ({ownedItems.length})</span>
            </button>
          </div>

          {/* Filter Section */}
          <div className="pet-shop-control-filters">
            <div className="search-input-wrapper">
              <span className="material-symbols-outlined search-icon">search</span>
              <input
                type="text"
                placeholder="Tìm phụ kiện..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="pet-search-input"
              />
            </div>

            <div className="filter-select-wrapper">
              <span className="material-symbols-outlined filter-icon">filter_list</span>
              <select
                value={priceFilter}
                onChange={(e) => {
                  setPriceFilter(e.target.value as 'all' | 'under50' | '50to100' | 'over100');
                  setCurrentPage(1);
                }}
                className="pet-filter-select"
              >
                <option value="all">Tất cả mức giá</option>
                <option value="under50">Dưới 50 Coins</option>
                <option value="50to100">Từ 50 - 100 Coins</option>
                <option value="over100">Trên 100 Coins</option>
              </select>
            </div>
          </div>

          {/* Shop Progress Stats */}
          <div className="pet-shop-progress-stats">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span>Đã thu thập</span>
              <strong>{ownedItems.length} / {shopItems.length}</strong>
            </div>
            <div className="pet-shop-progress-bar-bg">
              <div
                className="pet-shop-progress-bar-fill"
                style={{ width: `${shopItems.length > 0 ? (ownedItems.length / shopItems.length) * 100 : 0}%` }}
              />
            </div>
          </div>
        </article>

      </div>
    </main>
  );
}
