import { TopNavigation } from '../../navigate/NavigateNavigation';
import type { AuthUser } from '../../auth/types';

type HomeHeaderProps = {
  user: AuthUser;
  onLogout: () => Promise<void> | void;
};

export function HomeHeader({ user, onLogout }: HomeHeaderProps) {
  return (
    <header className="topbar">
      <div className="topbar__brand">
        <span className="topbar__title">PythonQuest</span>
      </div>

      <TopNavigation />

      <div className="topbar__profile">
        <span className="topbar__welcome">{user.username}</span>
        <span aria-hidden="true" className="material-symbols-outlined topbar__star">
          star
        </span>
        <div className="topbar__avatar">
          <img
            alt="Junior Coder Avatar"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBgNKNaVqWu7orFFAIrGfAV1JelJ5ydOTJh-a_CLY_Ww3ICx4EixAV4wmC6kZzUbUCVT5Aq8T2byBaHQokPgO-84ihTNK0z0BE-rSnlPo4tngru4pBNgLBUQPHWNq1g6CfN1ziiZ9X0Za8eeoDlKF9PdiEmS3aR5-AJSc2mX6SxpYHdVxGleH4gk6Eky81qYE8xTcg-Wga4U8aZoGDVXlxtTasNy5fYhcwYyRbB6xh5chhTBGbAfoumChi4mzMmQFP5gO87Sd6huTtZ"
          />
        </div>
        <button className="pressable topbar__logout" type="button" onClick={() => void onLogout()}>
          Đăng xuất
        </button>
      </div>
    </header>
  );
}