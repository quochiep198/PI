import { useState } from 'react';
import type { UserPet, PetAccessory } from '../types';
import '../pet.css';

interface PetStatusCardProps {
  pet: UserPet;
  isStreakExcited: boolean;
  onFeed: () => Promise<void> | void;
  activeAccessories?: PetAccessory[];
  onOpenShop?: () => void;
}

function getAccessoryClass(acc: PetAccessory | undefined) {
  return acc?.accessoryClass || 'accessory-fallback';
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

  const getPetImage = () => {
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

  const xpPercent = Math.min(100, Math.max(0, (pet.currentXp / pet.nextLevelXp) * 100));

  return (
    <div className="pet-status-card-compact" title={`${pet.nickname} (${pet.name}) - Cấp ${pet.level}`}>
      <div className="pet-status-avatar-wrapper-compact">
        <div
          className="pet-status-avatar-compact"
          onClick={onOpenShop}
          style={{ cursor: onOpenShop ? 'pointer' : 'default' }}
        >
          {getPetImage()}
        </div>
        {activeAccessories.map((acc) => (
          <span
            key={acc.id}
            className={`accessory-overlay ${getAccessoryClass(acc)}`}
            title={acc.name}
          >
            {acc.imageData}
          </span>
        ))}
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
