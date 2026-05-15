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

      <div className="profile-card">
        <div className="profile-card__icon">
          <span aria-hidden="true" className="material-symbols-outlined">
            military_tech
          </span>
        </div>
        <div>
          <p className="profile-card__title">Level {xpData.level}</p>
          <p className="profile-card__subtitle">{xpData.name}</p>
          <p
            className={`profile-card__presence${onlinePresenceConnected ? ' is-live' : ''}${onlinePresenceFailed ? ' is-error' : ''}`}
          >
            <span aria-hidden="true" className="material-symbols-outlined profile-card__presence-icon">
              {onlinePresenceConnected
                ? 'radio_button_checked'
                : onlinePresenceFailed
                  ? 'error'
                  : 'sync'}
            </span>
            {onlinePresenceConnected
              ? `${onlineLearners} người học đang online`
              : onlinePresenceFailed
                ? 'Không thể cập nhật số người học online'
                : 'Đang cập nhật số người học online...'}
          </p>
        </div>
      </div>

      <SideNavigation />

      <div className="upgrade-card">
        <p className="upgrade-card__title">Học không giới hạn!</p>
        <button className="pressable upgrade-card__button" type="button">
          Upgrade to Pro
        </button>
      </div>
    </aside>
  );
}