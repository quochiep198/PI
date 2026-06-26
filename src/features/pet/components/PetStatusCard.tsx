import { useState } from 'react';
import type { UserPet, PetAccessory } from '../types';
import { PetAvatar } from './PetAvatar';
import '../pet.css';

interface PetStatusCardProps {
  pet: UserPet;
  isStreakExcited: boolean;
  onFeed: () => Promise<void> | void;
  activeAccessories?: PetAccessory[];
  onOpenShop?: () => void;
}

export function PetStatusCard({
  pet,
  isStreakExcited,
  onFeed,
  activeAccessories = [],
  onOpenShop,
}: PetStatusCardProps) {
  const [isFeeding, setIsFeeding] = useState(false);
  const [feedError, setFeedError] = useState<string | null>(null);

  const handleFeed = async () => {
    setIsFeeding(true);
    setFeedError(null);
    try {
      await onFeed();
    } catch (error) {
      setFeedError(error instanceof Error ? error.message : 'Lỗi');
      setTimeout(() => setFeedError(null), 3000);
    } finally {
      setIsFeeding(false);
    }
  };

  const xpPercent = Math.min(100, Math.max(0, (pet.currentXp / pet.nextLevelXp) * 100));

  return (
    <div className="pet-status-card-compact" title={`${pet.nickname} (${pet.name}) - Cấp ${pet.level}`}>
      <div className="pet-status-avatar-wrapper-compact" onClick={onOpenShop} style={{ cursor: onOpenShop ? 'pointer' : 'default' }}>
        <PetAvatar
          pet={pet}
          size="small"
          activeAccessories={activeAccessories}
          className="pet-status-avatar-compact"
        />
        <div className="pet-status-level-badge-compact">L.{pet.level}</div>
      </div>

      <div className="pet-status-details-compact">
        <div className="pet-status-header-compact">
          <span className="pet-status-name-compact">
            {pet.nickname} {isStreakExcited && '🔥'}
          </span>
        </div>

        {feedError ? (
          <span className="pet-feed-error-compact">{feedError}</span>
        ) : (
          <div className="pet-stats-bars-compact">
            {/* Fullness Bar */}
            <div className="pet-stat-row-compact" title={`Độ no: ${pet.fullness}/100`}>
              <span className="pet-stat-icon-compact">🍖</span>
              <div className="pet-stat-progress-bg-compact">
                <div
                  className="pet-stat-progress-fill-compact fullness"
                  style={{ width: `${pet.fullness}%` }}
                />
              </div>
            </div>

            {/* XP Bar */}
            <div className="pet-stat-row-compact" title={`XP: ${pet.currentXp}/${pet.nextLevelXp}`}>
              <span className="pet-stat-icon-compact">⭐</span>
              <div className="pet-stat-progress-bg-compact">
                <div
                  className="pet-stat-progress-fill-compact xp"
                  style={{ width: `${xpPercent}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="pet-status-actions-compact" style={{ display: 'flex', flexDirection: 'column', gap: '4px', flexShrink: 0 }}>
        <button
          type="button"
          className="pet-feed-action-btn-compact pressable"
          onClick={handleFeed}
          disabled={pet.fullness >= 100 || isFeeding}
          title={pet.fullness >= 100 ? 'Pet đã no căng bụng rồi!' : 'Cho ăn (20 Coins)'}
        >
          {isFeeding ? '...' : 'Cho ăn'}
        </button>
      </div>
    </div>
  );
}
