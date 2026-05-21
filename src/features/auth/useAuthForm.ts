import { useState, type FormEvent } from 'react';
import { login, register, requestPasswordReset, resetPassword } from './authApi';
import type { AuthMode, AuthUser } from './types';

type UseAuthFormOptions = {
  onAuthenticated: (user: AuthUser) => void;
};

function readResetTokenFromLocation() {
  if (typeof window === 'undefined') {
    return '';
  }

  return new URLSearchParams(window.location.search).get('token')?.trim() || '';
}

function clearResetTokenFromLocation() {
  if (typeof window === 'undefined') {
    return;
  }

  const url = new URL(window.location.href);
  url.searchParams.delete('token');
  window.history.replaceState({}, '', url.toString());
}

function getPasswordStrengthError(password: string) {
  if (password.length < 8) {
    return 'Mật khẩu phải từ 8 ký tự trở lên.';
  }

  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
    return 'Mật khẩu phải có chữ hoa, chữ thường và ký tự đặc biệt.';
  }

  return null;
}

export function useAuthForm({ onAuthenticated }: UseAuthFormOptions) {
  const initialResetToken = readResetTokenFromLocation();
  const [mode, setMode] = useState<AuthMode>(initialResetToken ? 'reset' : 'login');
  const [identifier, setIdentifier] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [resetToken, setResetToken] = useState(initialResetToken);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [resetPreviewUrl, setResetPreviewUrl] = useState<string | null>(null);

  function switchMode(nextMode: AuthMode) {
    setMode(nextMode);
    setError(null);
    setSuccessMessage(null);
    setResetPreviewUrl(null);

    if (nextMode !== 'reset') {
      setResetToken('');
      clearResetTokenFromLocation();
    }
  }

  function validate() {
    if (mode === 'register') {
      if (!username.trim() || !email.trim()) {
        return 'Vui lòng nhập tên đăng nhập và email.';
      }

      if (password.length < 8) {
        return 'Mật khẩu phải có ít nhất 8 ký tự.';
      }

      if (password !== confirmPassword) {
        return 'Mật khẩu xác nhận chưa khớp.';
      }

      return null;
    }

    if (mode === 'forgot') {
      if (!forgotIdentifier.trim()) {
        return 'Vui lòng nhập email, tên đăng nhập hoặc số điện thoại.';
      }

      return null;
    }

    if (mode === 'reset') {
      if (!resetToken) {
        return 'Thiếu token đặt lại mật khẩu.';
      }

      const passwordStrengthError = getPasswordStrengthError(password);
      if (passwordStrengthError) {
        return passwordStrengthError;
      }

      if (password !== confirmPassword) {
        return 'Mật khẩu xác nhận chưa khớp.';
      }

      return null;
    }

    if (!identifier.trim() || !password) {
      return 'Vui lòng nhập thông tin đăng nhập và mật khẩu.';
    }

    return null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setResetPreviewUrl(null);

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);

    try {
      if (mode === 'login') {
        const user = await login(identifier, password);
        onAuthenticated(user);
        return;
      }

      if (mode === 'register') {
        const user = await register(username, email, password);
        onAuthenticated(user);
        return;
      }

      if (mode === 'forgot') {
        const result = await requestPasswordReset(forgotIdentifier);
        setSuccessMessage(result.message);
        setResetPreviewUrl(result.resetUrl);
        return;
      }

      const result = await resetPassword(resetToken, password, confirmPassword);
      setSuccessMessage(result.message);
      setPassword('');
      setConfirmPassword('');
      setResetToken('');
      clearResetTokenFromLocation();
      setMode('login');
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : 'Không thể xác thực tài khoản.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return {
    mode,
    identifier,
    username,
    email,
    password,
    confirmPassword,
    forgotIdentifier,
    resetToken,
    isSubmitting,
    error,
    successMessage,
    resetPreviewUrl,
    setIdentifier,
    setUsername,
    setEmail,
    setPassword,
    setConfirmPassword,
    setForgotIdentifier,
    setResetToken,
    switchMode,
    handleSubmit,
  };
}
