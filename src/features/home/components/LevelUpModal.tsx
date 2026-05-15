import { useEffect } from 'react';
import type { XpLevel } from '../useXP';

type LevelUpModalProps = {
  show: boolean;
  newLevel: XpLevel;
  onDismiss: () => void;
};

const LEVEL_EMOJIS = ['🌱', '📚', '💻', '🔮', '👑'];

export function LevelUpModal({ show, newLevel, onDismiss }: LevelUpModalProps) {
  useEffect(() => {
    if (!show) return;

    const timer = setTimeout(onDismiss, 4000);
    return () => clearTimeout(timer);
  }, [show, onDismiss]);

  if (!show) return null;

  const emoji = LEVEL_EMOJIS[newLevel.level - 1] || '⭐';

  return (
    <div className="level-up-modal" role="dialog" aria-modal="true" aria-label={`Lên cấp ${newLevel.level}: ${newLevel.name}`}>
      <div className="level-up-modal__backdrop" onClick={onDismiss} />
      <div className="level-up-modal__card">
        <div className="level-up-modal__emoji">{emoji}</div>
        <div className="level-up-modal__title">Lên cấp!</div>
        <div className="level-up-modal__level">
          <span className="level-up-modal__level-badge">Lv.{newLevel.level}</span>
          <span className="level-up-modal__level-name">{newLevel.name}</span>
        </div>
        <p className="level-up-modal__message">
          Chúc mừng bạn đã đạt cấp mới! Tiếp tục học hỏi để lên cấp cao hơn nhé.
        </p>
        <button
          className="level-up-modal__close pressable"
          type="button"
          onClick={onDismiss}
        >
          Tiếp tục học
        </button>
      </div>
    </div>
  );
}