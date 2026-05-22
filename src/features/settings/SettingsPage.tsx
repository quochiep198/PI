import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { saveSettings } from '../auth/authApi';
import type { AuthUser } from '../auth/types';
import { playCelebrationChime } from '../shared/soundEffects';

const DEFAULT_AVATAR = 'https://lh3.googleusercontent.com/aida-public/AB6AXuBgNKNaVqWu7orFFAIrGfAV1JelJ5ydOTJh-a_CLY_Ww3ICx4EixAV4wmC6kZzUbUCVT5Aq8T2byBaHQokPgO-84ihTNK0z0BE-rSnlPo4tngru4pBNgLBUQPHWNq1g6CfN1ziiZ9X0Za8eeoDlKF9PdiEmS3aR5-AJSc2mX6SxpYHdVxGleH4gk6Eky81qYE8xTcg-Wga4U8aZoGDVXlxtTasNy5fYhcwYyRbB6xh5chhTBGbAfoumChi4mzMmQFP5gO87Sd6huTtZ';
const PYBOT_AVATAR = 'https://lh3.googleusercontent.com/aida-public/AB6AXuAPHAHh5RESROfJz7silhkCtpTjeR4DhtCWtmbqOsl7fJaaRUr7sxtkrFhabr2K0ekL3dUwOtPmKn5aK59VvJnMk2SfES1F41gvTxJs3HPg-1J6_eCBrZoA5D7yTFV4DLOto7Z50XEM62Sv9ylMv6Db0mvEO2UcXqGzkQINzvCvcjxNKZH5v-VYG_Uq1fHdPVMScHBhjI6JeLmIRt00hCIH66QpFMuRIv4vzS6KQTPPpIBKsngbKbWmZj4D3pVGOUa-JCaAUOwA_1zm';

type SettingsPageProps = {
  user: AuthUser;
  onUserUpdated: (user: AuthUser) => void;
  onLogout: () => Promise<void>;
};

export function SettingsPage({ user, onUserUpdated, onLogout }: SettingsPageProps) {
  const [displayName, setDisplayName] = useState(user.username);
  const [email, setEmail] = useState(user.email);
  const [profileVisible, setProfileVisible] = useState(user.profileVisible ?? true);
  const [emailNotifications, setEmailNotifications] = useState(user.emailNotifications ?? false);
  const [musicEnabled, setMusicEnabled] = useState(user.musicEnabled ?? true);
  const [theme, setTheme] = useState<'light' | 'dark'>(user.theme === 'dark' ? 'dark' : 'light');
  const [volume, setVolume] = useState(user.soundVolume ?? 80);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState(user.avatarUrl ?? DEFAULT_AVATAR);
  const [pendingAvatarDataUrl, setPendingAvatarDataUrl] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setDisplayName(user.username);
    setEmail(user.email);
    setProfileVisible(user.profileVisible ?? true);
    setEmailNotifications(user.emailNotifications ?? false);
    setMusicEnabled(user.musicEnabled ?? true);
    setTheme(user.theme === 'dark' ? 'dark' : 'light');
    setVolume(user.soundVolume ?? 80);
    setAvatarPreviewUrl(user.avatarUrl ?? DEFAULT_AVATAR);
    setPendingAvatarDataUrl(null);
  }, [user]);

  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }

    const previousTheme = document.documentElement.dataset.theme || 'light';
    document.documentElement.dataset.theme = theme;

    return () => {
      document.documentElement.dataset.theme = user.theme === 'dark' ? 'dark' : previousTheme;
    };
  }, [theme, user.theme]);

  async function handleAvatarChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      setAvatarError('Vui long chon một tệp hình ảnh hợp lệ.');
      event.target.value = '';
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setAvatarError('Avatar phai nho hon 2MB.');
      event.target.value = '';
      return;
    }

    setAvatarError(null);
    setSaveMessage(null);

    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(new Error('Không thể đọc tệp hình ảnh.'));
        reader.readAsDataURL(file);
      });

      setAvatarPreviewUrl(dataUrl);
      setPendingAvatarDataUrl(dataUrl);
    } catch (error) {
      setAvatarPreviewUrl(user.avatarUrl ?? DEFAULT_AVATAR);
      setAvatarError(error instanceof Error ? error.message : 'Không thể tải avatar lên server.');
    } finally {
      event.target.value = '';
    }
  }

  async function handleSaveChanges() {
    setAvatarError(null);
    setSaveMessage(null);
    if (newPassword && newPassword !== confirmNewPassword) {
      setAvatarError('Xác nhận mật khẩu mới không khớp.');
      return;
    }

    setIsUploadingAvatar(true);

    try {
      const updatedUser = await saveSettings({
        username: displayName,
        email,
        avatarDataUrl: pendingAvatarDataUrl,
        currentPassword,
        newPassword,
        theme,
        profileVisible,
        emailNotifications,
        musicEnabled,
        soundVolume: volume,
      });
      onUserUpdated(updatedUser);
      setAvatarPreviewUrl(updatedUser.avatarUrl ?? avatarPreviewUrl);
      setPendingAvatarDataUrl(null);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setSaveMessage('Da luu tat ca cai dat thanh cong.');
    } catch (error) {
      setAvatarError(error instanceof Error ? error.message : 'Không thể lưu cài đặt.');
    } finally {
      setIsUploadingAvatar(false);
    }
  }

  async function handleLogoutFromSettings() {
    setAvatarError(null);
    setSaveMessage(null);
    setIsLoggingOut(true);

    try {
      await onLogout();
    } finally {
      setIsLoggingOut(false);
    }
  }

  return (
    <main className="settings-main">
      <header className="settings-hero">
        <div className="settings-hero__copy">
          <h1 className="settings-hero__title">Cài đặt</h1>
          <p className="settings-hero__subtitle">
            Tùy chinh giao diện, thông báo, quyền riêng tư và nhiều hơn nữa để có trải nghiệm học tập tốt nhất.
          </p>
        </div>

        <div className="settings-bot">
          <div className="settings-bot__avatar">
            <img alt="Py-Bot" src={PYBOT_AVATAR} />
          </div>
          <div className="settings-bot__content">
            <p className="settings-bot__name">Py-Bot đang đợi!</p>
            <p className="settings-bot__message">Cần mình giúp bạn chỉnh lại giao diện không?</p>
          </div>
        </div>
      </header>

      <div className="settings-grid">
        <section className="settings-column">
          <article className="settings-card">
            <div className="settings-card__header">
              <span className="material-symbols-outlined settings-card__icon">person</span>
              <h2 className="settings-card__title">Thông tin cá nhân</h2>
            </div>

            <div className="settings-profile">
              <div className="settings-profile__avatar-wrap">
                <div className="settings-profile__avatar">
                  <img alt={user.username} src={avatarPreviewUrl} />
                </div>
                <button
                  type="button"
                  className="settings-profile__edit pressable"
                  aria-label="Chỉnh avatar"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingAvatar}
                >
                  <span className="material-symbols-outlined">edit</span>
                </button>
                <input
                  ref={fileInputRef}
                  className="settings-profile__input"
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  onChange={handleAvatarChange}
                />
              </div>

              <div className="settings-form">
                <label className="settings-field">
                  <span className="settings-field__label">Tên hiển thị</span>
                  <input
                    className="settings-field__input"
                    type="text"
                    value={displayName}
                    onChange={(event) => setDisplayName(event.target.value)}
                  />
                </label>

                <label className="settings-field">
                  <span className="settings-field__label">Email</span>
                  <input
                    className="settings-field__input"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                  />
                </label>
              </div>
            </div>

            {pendingAvatarDataUrl ? (
              <p className="settings-avatar__status">Avatar mới đang chờ lưu. Nhấn "Lưu thay đổi" để cập nhật.</p>
            ) : null}
            {isUploadingAvatar ? <p className="settings-avatar__status">Đang lưu avatar lên server...</p> : null}
            {saveMessage ? <p className="settings-avatar__status settings-avatar__status--success">{saveMessage}</p> : null}
            {avatarError ? <p className="settings-avatar__status settings-avatar__status--error">{avatarError}</p> : null}
          </article>

          <article className="settings-card">
            <div className="settings-card__header">
              <span className="material-symbols-outlined settings-card__icon">lock</span>
              <h2 className="settings-card__title">Đổi mật khẩu</h2>
            </div>

            <div className="settings-form">
              <label className="settings-field">
                <span className="settings-field__label">Mật khẩu hiện tại</span>
                <input
                  className="settings-field__input"
                  type="password"
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                />
              </label>

              <label className="settings-field">
                <span className="settings-field__label">Mật khẩu mới</span>
                <input
                  className="settings-field__input"
                  type="password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                />
              </label>

              <label className="settings-field">
                <span className="settings-field__label">Xác nhận mật khẩu mới</span>
                <input
                  className="settings-field__input"
                  type="password"
                  value={confirmNewPassword}
                  onChange={(event) => setConfirmNewPassword(event.target.value)}
                />
              </label>
            </div>
          </article>

          <article className="settings-card">
            <div className="settings-card__header">
              <span className="material-symbols-outlined settings-card__icon settings-card__icon--tertiary">
                shield
              </span>
              <h2 className="settings-card__title">Quyền riêng tư và bảo mật</h2>
            </div>

            <div className="settings-toggle-list">
              <div className="settings-toggle-row">
                <div className="settings-toggle-row__copy">
                  <div className="settings-toggle-row__icon">
                    <span className="material-symbols-outlined">public</span>
                  </div>
                  <div>
                    <p className="settings-toggle-row__title">Hiển thị hồ sơ công khai</p>
                    <p className="settings-toggle-row__text">
                      Cho phép bạn bè xem tiến độ và thành tích Python của bạn.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  className={`settings-switch ${profileVisible ? 'is-on' : ''}`}
                  aria-pressed={profileVisible}
                  onClick={() => setProfileVisible((value) => !value)}
                >
                  <span className="settings-switch__thumb" />
                </button>
              </div>

              <div className="settings-toggle-row">
                <div className="settings-toggle-row__copy">
                  <div className="settings-toggle-row__icon">
                    <span className="material-symbols-outlined">mail</span>
                  </div>
                  <div>
                    <p className="settings-toggle-row__title">Nhận thông báo qua email</p>
                    <p className="settings-toggle-row__text">
                      Nhận cập nhật về bài học mới, sự kiện và thông tin hệ thống.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  className={`settings-switch ${emailNotifications ? 'is-on' : ''}`}
                  aria-pressed={emailNotifications}
                  onClick={() => setEmailNotifications((value) => !value)}
                >
                  <span className="settings-switch__thumb" />
                </button>
              </div>
            </div>
          </article>
        </section>

        <section className="settings-column settings-column--side">
          <article className="settings-card">
            <div className="settings-card__header">
              <span className="material-symbols-outlined settings-card__icon settings-card__icon--secondary">
                tune
              </span>
              <h2 className="settings-card__title">Trải nghiệm</h2>
            </div>

            <div className="settings-experience">
              <div className="settings-slider">
                <div className="settings-slider__meta">
                  <div className="settings-slider__label">
                    <span className="material-symbols-outlined">volume_up</span>
                    <span>Âm thanh</span>
                  </div>
                  <span className="settings-slider__value">{volume}%</span>
                </div>

                <input
                  className="settings-slider__input"
                  type="range"
                  min="0"
                  max="100"
                  value={volume}
                  onChange={(event) => setVolume(Number(event.target.value))}
                />
              </div>

              <div className="settings-inline-toggle">
                <div className="settings-inline-toggle__label">
                  <span className="material-symbols-outlined">music_note</span>
                  <span>Âm nhạc</span>
                </div>
                <button
                  type="button"
                  className={`settings-switch ${musicEnabled ? 'is-on' : ''}`}
                  aria-pressed={musicEnabled}
                  onClick={() => setMusicEnabled((value) => !value)}
                >
                  <span className="settings-switch__thumb" />
                </button>
              </div>

              <button
                type="button"
                className="settings-secondary-btn pressable"
                onClick={() =>
                  playCelebrationChime({
                    enabled: musicEnabled,
                    volume,
                  })
                }
              >
                <span className="material-symbols-outlined">volume_up</span>
                Nghe thử âm thanh
              </button>

              <div className="settings-theme">
                <p className="settings-theme__title">Chế độ giao diện</p>
                <div className="settings-theme__grid">
                  <button
                    type="button"
                    className={`settings-theme__option ${theme === 'light' ? 'is-active' : ''}`}
                    onClick={() => setTheme('light')}
                  >
                    <span className="material-symbols-outlined">light_mode</span>
                    <span>Ánh sáng</span>
                  </button>

                  <button
                    type="button"
                    className={`settings-theme__option ${theme === 'dark' ? 'is-active' : ''}`}
                    onClick={() => setTheme('dark')}
                  >
                    <span className="material-symbols-outlined">dark_mode</span>
                    <span>Tối</span>
                  </button>
                </div>
              </div>
            </div>
          </article>

          <div className="settings-actions">
            <button
              type="button"
              className="settings-primary-btn pressable"
              onClick={() => void handleSaveChanges()}
              disabled={isUploadingAvatar}
            >
              <span className="material-symbols-outlined">save</span>
              Lưu thay đổi
            </button>

            <button
              type="button"
              className="settings-danger-btn pressable"
              onClick={() => void handleLogoutFromSettings()}
              disabled={isLoggingOut}
            >
              <span className="material-symbols-outlined">logout</span>
              {isLoggingOut ? 'Đang đăng xuất...' : 'Đăng xuất khỏi tài khoản'}
            </button>
          </div>

          <article className="settings-highlight">
            <div className="settings-highlight__content">
              <h2 className="settings-highlight__title">Thử thách hàng ngày</h2>
              <p className="settings-highlight__text">
                Hoàn thành 3 bài tập Python để mở khóa hiệu quả Code Master trong ngày hôm nay.
              </p>

              <div className="settings-highlight__progress">
                <div className="settings-highlight__progress-bar" style={{ width: '66%' }} />
              </div>
              <p className="settings-highlight__meta">2/3 bài tập đã hoàn thành</p>
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}
