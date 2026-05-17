import { XpBar } from '../home/components/XpBar';
import { useXPCached } from '../home/useXPCached';
import { SideNavigation } from '../navigate/NavigateNavigation';

type PracticeSideNavProps = {
  onNavigateHome: () => void;
};

export function PracticeSideNav({ onNavigateHome }: PracticeSideNavProps) {
  const { xpData, loading: xpLoading } = useXPCached();

  return (
    <aside className="sidenav">
      <XpBar xpData={xpData} loading={xpLoading} animatedXp={null} />

      <div className="online-status">
        <span className="online-status__dot is-live" aria-hidden="true" />
        <span className="online-status__text">12 người học online</span>
      </div>

      <SideNavigation
        activeLabel="Daily Practice"
        itemClickHandlers={{
          'Lessons': onNavigateHome,
        }}
      />

      <div className="upgrade-card">
        <p className="upgrade-card__title">Học không giới hạn!</p>
        <button className="pressable upgrade-card__button" type="button">
          Nâng cấp Pro
        </button>
      </div>
    </aside>
  );
}