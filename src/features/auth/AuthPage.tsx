import { VI_MESSAGES } from '../../content/messages';
import type { AuthUser } from './types';
import { useAuthForm } from './useAuthForm';

type AuthPageProps = {
  onAuthenticated: (user: AuthUser) => void;
};

export function AuthPage({ onAuthenticated }: AuthPageProps) {
  const {
    mode,
    identifier,
    username,
    email,
    password,
    confirmPassword,
    isSubmitting,
    error,
    setIdentifier,
    setUsername,
    setEmail,
    setPassword,
    setConfirmPassword,
    switchMode,
    handleSubmit,
  } = useAuthForm({ onAuthenticated });

  return (
    <div className="auth-page">
      <main className="auth-shell">
        <section className="auth-hero">
          <div className="auth-hero__decor" aria-hidden="true">
            <div className="auth-hero__circle auth-hero__circle--small" />
            <div className="auth-hero__circle auth-hero__circle--large" />
            <div className="auth-hero__code">print()</div>
          </div>
          <div className="auth-hero__content">
            <div className="auth-hero__image">
              <img
                alt="Py-Bot Mascot"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuD4W4yro3Ao69fO9mvugy7WJ2x80WYW8ClcglnZ1wscTvZdpRqjENTInseCgmHetmfernXsDqVHm2dVQ7xMatuDGanvHGVum-838TejsV61zDpJ9OeWMEY2ehkTl3iRzUWJbtShpoIhRczplI8g5Mer3PwjPFv469wXvmoRudzKmA2tmZv0e8KeT5uTcMg_Vu0RS1m3udyk3jHF8dCE4oA6Z7WD0JuvH1A7PjdagTHCAVYSnoVQy3XUw0k2xvRg0cbthH10Gd7BZVqJ"
              />
            </div>
            <h1 className="auth-hero__title">PythonQuest</h1>
            <p className="auth-hero__copy">
              Khám phá thế giới của những dòng code và trở thành bậc thầy lập trình cùng Py-Bot!
            </p>
          </div>
        </section>

        <section className="auth-panel">
          <div className="auth-panel__inner">
            <div className="auth-panel__brand">
              <span aria-hidden="true" className="material-symbols-outlined">
                smart_toy
              </span>
              <span>PythonQuest</span>
            </div>

            <header className="auth-panel__header">
              <h2>{mode === 'login' ? 'Chào mừng nhỏ thám hiểm!' : 'Tạo tài khoản mới'}</h2>
              <p>
                {mode === 'login'
                 ? 'Sẵn sàng để tiếp tục cuộc hành trình lập trình của bạn?'
                  : 'Tạo tài khoản để lưu tiến trình học Python của riêng bạn.'}
              </p>
            </header>

            <div className="auth-toggle" role="tablist" aria-label="Authentication mode">
              <button
                className={`pressable auth-toggle__button${mode === 'login' ? ' is-active' : ''}`}
                type="button"
                onClick={() => switchMode('login')}
              >
                Đăng nhập
              </button>
              <button
                className={`pressable auth-toggle__button${mode === 'register' ? ' is-active' : ''}`}
                type="button"
                onClick={() => switchMode('register')}
              >
                Tạo tài khoản
              </button>
            </div>

            <form className="auth-form" onSubmit={handleSubmit}>
              {mode === 'register' ? (
                <>
                  <label className="auth-field">
                    <span className="auth-field__label">Tên đăng nhập</span>
                    <input
                      autoComplete="username"
                      className="auth-input"
                      placeholder="Vi du: explorer_01"
                      type="text"
                      value={username}
                      onChange={(event) => setUsername(event.target.value)}
                    />
                  </label>

                  <label className="auth-field">
                    <span className="auth-field__label">Email</span>
                    <input
                      autoComplete="email"
                      className="auth-input"
                      placeholder="be@example.com"
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                    />
                  </label>
                </>
              ) : (
                <label className="auth-field">
                  <span className="auth-field__label">{VI_MESSAGES.auth.labels.emailOrUsername}</span>
                  <input
                    autoComplete="username"
                    className="auth-input"
                    placeholder="Vi du: explorer_01"
                    type="text"
                    value={identifier}
                    onChange={(event) => setIdentifier(event.target.value)}
                  />
                </label>
              )}

              <label className="auth-field">
                <span className="auth-field__label">{VI_MESSAGES.auth.labels.password}</span>
                <input
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  className="auth-input"
                  placeholder="........"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </label>

              {mode === 'register' ? (
                <label className="auth-field">
                  <span className="auth-field__label">{VI_MESSAGES.auth.labels.confirmPassword}</span>
                  <input
                    autoComplete="new-password"
                    className="auth-input"
                    placeholder="........"
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                  />
                </label>
              ) : (
                <div className="auth-form__meta">
                  <span />
                  <button className="auth-link" disabled type="button">
                    {VI_MESSAGES.auth.labels.forgotPassword}
                  </button>
                </div>
              )}

              {error ? <p className="auth-error">{error}</p> : null}

              <button className="pressable auth-submit" disabled={isSubmitting} type="submit">
                <span>
                  {isSubmitting
                    ? 'Đang xử lý...'
                    : mode === 'login'
                      ? 'Bắt đầu tham quan'
                      : 'Tạo tài khoản'}
                </span>
                <span aria-hidden="true" className="material-symbols-outlined">
                  {mode === 'login' ? 'rocket_launch' : 'person_add'}
                </span>
              </button>
            </form>

            <div className="auth-divider">
              <span>Hoặc đăng nhập bằng</span>
            </div>

            <div className="auth-social">
              <button className="pressable auth-social__button" disabled type="button">
                <img
                  alt="Google"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAkccZawS2sDX8JfJFSyk6R4xO-BaWZ05VmDV1CCLfmSdM9eUuZqX_nuzLdDvsAppWPH9b3BdejbJhlGrVN1qVUWAraR1ui5fdGSPusrnWNoIWYlUPwIr-xWPIa9PXHsuB9YbNOgcYihQv8_mfXWX1vJ0PfqYltgy-l0edBuVpUteBwWqrjYMXiN8D3hpsvcKyRZrri68vCVOCd1HDrAHUjHpBmbybtZgA13_9-5Ha4sT2SFrkqeFtFr2c-JyBy-JSHQBXpFi6OayI8"
                />
                <span>Google</span>
              </button>
              <button className="pressable auth-social__button" disabled type="button">
                <svg aria-hidden="true" viewBox="0 0 24 24">
                  <path
                    d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483
                    0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466
                    -.908-.62.069-.008.069-.008 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647
                    .35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272
                    .098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844c.85.004 1.705.115 2.504.337
                    1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688
                    0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747
                    0 .268.18.58.688.482A10.019 10.019 0 0 0 22 12.017C22 6.484 17.522 2 12 2Z"
                    fill="currentColor"
                  />
                </svg>
                <span>Github</span>
              </button>
            </div>

            <footer className="auth-footer">
              <p>
                {mode === 'login' ? 'Chưa có tài khoản?' : 'Đã có tài khoản?'}{' '}
                <button
                  className="auth-link"
                  type="button"
                  onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}
                >
                  {mode === 'login' ? 'Tham gia ngay!' : 'Đăng nhập ngay!'}
                </button>
              </p>
            </footer>
          </div>
        </section>
      </main>
    </div>
  );
}
