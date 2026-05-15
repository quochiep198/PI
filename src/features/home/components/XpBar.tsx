import { VI_MESSAGES } from '../../../content/messages';
import type { XpLevel } from '../useXP';

type XpBarProps = {
  xpData: XpLevel;
  loading: boolean;
  animatedXp: number | null;
};

const LEVEL_ICONS: Record<number, string> = {
  1: '🌱',
  2: '📚',
  3: '💻',
  4: '✨',
  5: '💎',
};

export function XpBar({ xpData, loading, animatedXp }: XpBarProps) {
  const displayXp = animatedXp ?? xpData.totalXp;
  const levelIcon = LEVEL_ICONS[xpData.level] || '⭐';

  if (loading) {
    return (
      <div className="xp-bar">
        <div className="xp-bar__loading" />
      </div>
    );
  }

  return (
    <div className="xp-bar">
      <div className="xp-bar__level">
        <span className="xp-bar__level-badge">Lv.{xpData.level}</span>
        <span className="xp-bar__level-icon">{levelIcon}</span>
        <span className="xp-bar__level-name">{xpData.name}</span>
      </div>

      <div className="xp-bar__track">
        <div
          className="xp-bar__progress"
          style={{ width: `${xpData.progressPercent}%` }}
          role="progressbar"
          aria-valuenow={xpData.progressPercent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Cấp ${xpData.level}: ${xpData.progressPercent}%`}
        />
      </div>

      <div className="xp-bar__info">
        <span className="xp-bar__xp-text">
          {VI_MESSAGES.xp.displayXp(displayXp, xpData.xpToNextLevel)}
        </span>
        <span className="xp-bar__xp-icon">⚡</span>
      </div>
    </div>
  );
}