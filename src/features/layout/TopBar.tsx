import type { AuthUser } from '../auth/types';
import type { XpLevel } from '../home/useXP';

const DEFAULT_AVATAR = 'https://lh3.googleusercontent.com/aida-public/AB6AXuBgNKNaVqWu7orFFAIrGfAV1JelJ5ydOTJh-a_CLY_Ww3ICx4EixAV4wmC6kZzUbUCVT5Aq8T2byBaHQokPgO-84ihTNK0z0BE-rSnlPo4tngru4pBNgLBUQPHWNq1g6CfN1ziiZ9X0Za8eeoDlKF9PdiEmS3aR5-AJSc2mX6SxpYHdVxGleH4gk6Eky81qYE8xTcg-Wga4U8aZoGDVXlxtTasNy5fYhcwYyRbB6xh5chhTBGbAfoumChi4mzMmQFP5gO87Sd6huTtZ';

export type TopBarProps = {
  user: AuthUser;
  xpData: XpLevel;
  coins?: number;
  onLogout: () => Promise<void> | void;
};

export function TopBar({ user, xpData, coins = 0, onLogout }: TopBarProps) {
  return (
    <header className="topbar">
      <div className="topbar__brand">
        <span className="topbar__title">PythonQuest</span>
      </div>

      <div className="topbar__profile">
        

        <div className="practice-topbar__coins">
          <span className="material-symbols-outlined practice-topbar__coin-icon">social_leaderboard</span>
          <span className="practice-topbar__coin-value">{xpData.totalXp.toLocaleString()} XP</span>
        </div>

        <div className="practice-topbar__coins">
          <span className="material-symbols-outlined practice-topbar__coin-icon">monetization_on</span>
          <span className="practice-topbar__coin-value">{coins.toLocaleString()}</span>
        </div>
        <span className="topbar__welcome">{user.username}</span>
        <div className="topbar__avatar">
          <img alt="Junior Coder Avatar" src={user.avatarUrl ?? DEFAULT_AVATAR} />
        </div>
        <button className="pressable topbar__logout" type="button" onClick={() => void onLogout()}>
          Đăng xuất
        </button>
      </div>
    </header>
  );
}