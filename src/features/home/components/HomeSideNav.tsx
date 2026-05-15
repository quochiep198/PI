import type { XpLevel } from '../useXP';
import { XpBar } from './XpBar';
import { SideNavigation } from '../../navigate/NavigateNavigation';

type HomeSideNavProps = {
  onlineLearners: number;
  onlinePresenceConnected: boolean;
  onlinePresenceFailed: boolean;
  xpData: XpLevel;
  xpLoading: boolean;
  pendingXpAnimation: number | null;
};

export function HomeSideNav({
  onlineLearners,
  onlinePresenceConnected,
  onlinePresenceFailed,
  xpData,
  xpLoading,
  pendingXpAnimation,
}: HomeSideNavProps) {
  return (
    <aside className="sidenav">
      <XpBar xpData={xpData} loading={xpLoading} animatedXp={pendingXpAnimation} />

      <div className="online-status">
        <span
          className={`online-status__dot${onlinePresenceConnected ? ' is-live' : ''}${onlinePresenceFailed ? ' is-error' : ''}`}
          aria-hidden="true"
        />
        <span className="online-status__text">
          {onlinePresenceConnected
            ? `${onlineLearners} người học online`
            : onlinePresenceFailed
              ? 'Không thể cập nhật'
              : 'Đang cập nhật...'}
        </span>
      </div>

      <SideNavigation />

      <div className="upgrade-card">
        <p className="upgrade-card__title">Học không giới hạn!</p>
        <button className="pressable upgrade-card__button" type="button">
          Nâng cấp Pro
        </button>
      </div>
    </aside>
  );
}