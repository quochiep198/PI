import { useState, useEffect } from 'react';
import { fetchPetShop, buyPetAccessory, equipPetAccessory } from '../petApi';
import type { PetShopItem, PetAccessory } from '../types';
import '../pet.css';

interface PetShopPageProps {
  activeAccessories: PetAccessory[];
  currentCoins: number;
  onCoinsUpdated: (coins: number) => void;
  onRefreshPetState: () => void;
}

export function PetShopPage({
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

  return (
    <main className="settings-main pet-shop-container">
      <div className="settings-grid" style={{ gridTemplateColumns: '1fr', margin: 0 }}>
        <article className="settings-card" style={{ padding: '24px' }}>
          {/* Stats & Tabs Row */}
          <div className="pet-shop-header-row" style={{ marginTop: 0 }}>
            <div className="pet-shop-tabs">
              <button
                className={`pet-shop-tab-btn pressable ${activeTab === 'shop' ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab('shop');
                  setCurrentPage(1);
                  setSearchQuery('');
                  setPriceFilter('all');
                  setError(null);
                }}
              >
                🛒 Cửa hàng
              </button>
              <button
                className={`pet-shop-tab-btn pressable ${activeTab === 'wardrobe' ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab('wardrobe');
                  setCurrentPage(1);
                  setSearchQuery('');
                  setPriceFilter('all');
                  setError(null);
                }}
              >
                👕 Tủ đồ của Pet ({ownedItems.length})
              </button>
            </div>
          </div>

          {/* Search and Filter Row */}
          <div className="pet-shop-search-bar">
            <div className="search-input-wrapper">
              <span className="material-symbols-outlined search-icon">search</span>
              <input
                type="text"
                placeholder="Tìm phụ kiện theo tên..."
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
                  setPriceFilter(e.target.value as any);
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

          {/* Error Alert */}
          {error && <div className="pet-shop-error-alert">{error}</div>}

          {/* Loading Spinner */}
          {loading ? (
            <div className="pet-shop-loading">
              <div className="pet-spinner"></div>
              <p>Đang tải cửa hàng...</p>
            </div>
          ) : (
            <div className="pet-shop-content" style={{ maxHeight: 'none', overflowY: 'visible' }}>
              {activeTab === 'shop' ? (
                filteredItems.length === 0 ? (
                  <div className="pet-wardrobe-empty" style={{ padding: '60px 0' }}>
                    <span className="empty-icon">🔍</span>
                    <p>Không tìm thấy phụ kiện nào phù hợp với bộ lọc.</p>
                  </div>
                ) : (
                  <div className="pet-shop-grid">
                    {paginatedItems.map((item) => {
                      const isOwned = item.isOwned;
                      const isEquipped = activeAccessories.some((acc) => acc.itemId === item.id);
                      const canAfford = currentCoins >= item.price;

                      return (
                        <div key={item.id} className={`pet-shop-item-card ${isOwned ? 'owned' : ''}`}>
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
                )
              ) : (
                // Wardrobe Tab
                <div className="pet-wardrobe-container" style={{ padding: '20px 0' }}>
                  {ownedItems.length === 0 ? (
                    <div className="pet-wardrobe-empty">
                      <span className="empty-icon">🛍️</span>
                      <p>Tủ đồ hiện tại chưa có phụ kiện nào.</p>
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
                    </div>
                  ) : filteredItems.length === 0 ? (
                    <div className="pet-wardrobe-empty" style={{ padding: '40px 0' }}>
                      <span className="empty-icon">🔍</span>
                      <p>Không tìm thấy phụ kiện nào trong tủ đồ khớp với bộ lọc.</p>
                    </div>
                  ) : (
                    <div className="pet-shop-grid">
                      {paginatedItems.map((item) => {
                        const isEquipped = activeAccessories.some((acc) => acc.itemId === item.id);

                        return (
                          <div key={item.id} className="pet-shop-item-card owned">
                            <div className="pet-shop-item-avatar-bg">
                              <span className="pet-shop-item-emoji">{item.imageData}</span>
                            </div>
                            <div className="pet-shop-item-info">
                              <span className="pet-shop-item-name">{item.name}</span>
                              <p className="pet-shop-item-desc">{item.description}</p>
                            </div>

                            <div className="pet-shop-item-actions">
                              <button
                                type="button"
                                className={`pet-shop-btn equip-btn pressable ${isEquipped ? 'equipped' : ''}`}
                                onClick={() => handleEquipToggle(item)}
                                disabled={actionLoading === item.id}
                              >
                                {actionLoading === item.id ? '...' : isEquipped ? 'Tháo' : 'Trang bị'}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
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
      </div>
    </main>
  );
}
