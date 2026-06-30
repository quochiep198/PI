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
    forgotIdentifier,
    resetEmail,
    otp,
    isSubmitting,
    error,
    successMessage,
    resetPreviewOtp,
    setIdentifier,
    setUsername,
    setEmail,
    setPassword,
    setConfirmPassword,
    setForgotIdentifier,
    setResetEmail,
    setOtp,
    switchMode,
    handleSubmit,
  } = useAuthForm({ onAuthenticated });

  const isLogin = mode === 'login';
  const isRegister = mode === 'register';
  const isForgot = mode === 'forgot';
  const isReset = mode === 'reset';
  const showToggle = isLogin || isRegister;

  const title = isLogin
    ? 'Chào mừng nhỏ thám hiểm!'
    : isRegister
      ? 'Tạo tài khoản mới'
      : isForgot
        ? 'Quên mật khẩu'
        : 'Đặt lại mật khẩu';

  const description = isLogin
    ? 'Sẵn sàng để tiếp tục cuộc hành trình lập trình của bạn?'
    : isRegister
      ? 'Tạo tài khoản để lưu tiến trình học Python của riêng bạn.'
      : isForgot
        ? 'Nhập email đã đăng ký để nhận mã xác thực đặt lại mật khẩu.'
        : 'Nhập mã xác thực đã gửi qua email và tạo mật khẩu mới.';

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
              <h2>{title}</h2>
              <p>{description}</p>
            </header>

            {showToggle ? (
              <div className="auth-toggle" role="tablist" aria-label="Authentication mode">
                <button
                  className={`pressable auth-toggle__button${isLogin ? ' is-active' : ''}`}
                  type="button"
                  onClick={() => switchMode('login')}
                >
                  Đăng nhập
                </button>
                <button
                  className={`pressable auth-toggle__button${isRegister ? ' is-active' : ''}`}
                  type="button"
                  onClick={() => switchMode('register')}
                >
                  Tạo tài khoản
                </button>
              </div>
            ) : (
              <div className="auth-backlink">
                <button className="auth-link" type="button" onClick={() => switchMode('login')}>
                  Quay lại đăng nhập
                </button>
              </div>
            )}

            <form className="auth-form" onSubmit={handleSubmit}>
              {isRegister ? (
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
              ) : null}

              {isLogin ? (
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
              ) : null}

              {isForgot ? (
                <label className="auth-field">
                  <span className="auth-field__label">Email đã đăng ký</span>
                  <input
                    autoComplete="email"
                    className="auth-input"
                    placeholder="be@example.com"
                    type="email"
                    value={forgotIdentifier}
                    onChange={(event) => setForgotIdentifier(event.target.value)}
                  />
                </label>
              ) : null}

              {!isForgot && !isReset ? (
                <label className="auth-field">
                  <span className="auth-field__label">
                    {isReset ? 'Mật khẩu mới' : VI_MESSAGES.auth.labels.password}
                  </span>
                  <input
                    autoComplete={isLogin ? 'current-password' : 'new-password'}
                    className="auth-input"
                    placeholder="........"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                  />
                </label>
              ) : null}

              {isReset ? (
                <label className="auth-field">
                  <span className="auth-field__label">Email đã đăng ký</span>
                  <input
                    autoComplete="email"
                    className="auth-input"
                    placeholder="be@example.com"
                    type="email"
                    value={resetEmail}
                    onChange={(event) => setResetEmail(event.target.value)}
                  />
                </label>
              ) : null}

              {isReset ? (
                <label className="auth-field">
                  <span className="auth-field__label">Mã xác thực (6 chữ số)</span>
                  <input
                    autoComplete="one-time-code"
                    className="auth-input"
                    placeholder="000000"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={otp}
                    onChange={(event) => setOtp(event.target.value.replace(/\D/g, ''))}
                  />
                </label>
              ) : null}

              {isReset ? (
                <label className="auth-field">
                  <span className="auth-field__label">Mật khẩu mới</span>
                  <input
                    autoComplete="new-password"
                    className="auth-input"
                    placeholder="........"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                  />
                </label>
              ) : null}

              {isRegister || isReset ? (
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
              ) : null}

              {isLogin ? (
                <div className="auth-form__meta">
                  <span />
                  <button className="auth-link" type="button" onClick={() => switchMode('forgot')}>
                    {VI_MESSAGES.auth.labels.forgotPassword}
                  </button>
                </div>
              ) : null}

              {isReset ? (
                <p className="auth-helper">
                  Mật khẩu phải từ 8 ký tự trở lên, có chữ hoa, chữ thường và ký tự đặc biệt.
                </p>
              ) : null}

              {error ? <p className="auth-error">{error}</p> : null}
              {successMessage ? <p className="auth-success">{successMessage}</p> : null}
              {resetPreviewOtp ? (
                <p className="auth-helper">
                  Mã OTP test (dev): <strong style={{ fontFamily: 'monospace', fontSize: '1.2em' }}>{resetPreviewOtp}</strong>
                </p>
              ) : null}

              <button className="pressable auth-submit" disabled={isSubmitting} type="submit">
                <span>
                  {isSubmitting
                    ? 'Đang xử lý...'
                    : isLogin
                      ? 'Bắt đầu tham quan'
                      : isRegister
                        ? 'Tạo tài khoản'
                        : isForgot
                          ? 'Gửi mã xác thực'
                          : 'Đặt lại mật khẩu'}
                </span>
                <span aria-hidden="true" className="material-symbols-outlined">
                  {isLogin ? 'rocket_launch' : isRegister ? 'person_add' : isForgot ? 'mail' : 'lock_reset'}
                </span>
              </button>
            </form>

            {showToggle ? (
              <>
                <div className="auth-divider">
                  <span>Hoặc đăng nhập bằng</span>
                </div>

                <div className="auth-social">
                  <button
                    className="pressable auth-social__button"
                    type="button"
                    onClick={() => {
                      window.location.href = '/api/auth/google';
                    }}
                  >
                    <img
                      alt="Google"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuAkccZawS2sDX8JfJFSyk6R4xO-BaWZ05VmDV1CCLfmSdM9eUuZqX_nuzLdDvsAppWPH9b3BdejbJhlGrVN1qVUWAraR1ui5fdGSPusrnWNoIWYlUPwIr-xWPIa9PXHsuB9YbNOgcYihQv8_mfXWX1vJ0PfqYltgy-l0edBuVpUteBwWqrjYMXiN8D3hpsvcKyRZrri68vCVOCd1HDrAHUjHpBmbybtZgA13_9-5Ha4sT2SFrkqeFtFr2c-JyBy-JSHQBXpFi6OayI8"
                    />
                    <span>Tiếp tục với Google</span>
                  </button>
                </div>

                <footer className="auth-footer">
                  <p>
                    {isLogin ? 'Chưa có tài khoản?' : 'Đã có tài khoản?'}{' '}
                    <button
                      className="auth-link"
                      type="button"
                      onClick={() => switchMode(isLogin ? 'register' : 'login')}
                    >
                      {isLogin ? 'Tham gia ngay!' : 'Đăng nhập ngay!'}
                    </button>
                  </p>
                </footer>
              </>
            ) : null}
          </div>
        </section>
      </main>
    </div>
  );
}
