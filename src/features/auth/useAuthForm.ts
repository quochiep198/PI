import { useState, type FormEvent } from 'react';
import { login, register } from './authApi';
import type { AuthMode, AuthUser } from './types';

type UseAuthFormOptions = {
  onAuthenticated: (user: AuthUser) => void;
};

export function useAuthForm({ onAuthenticated }: UseAuthFormOptions) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [identifier, setIdentifier] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function switchMode(nextMode: AuthMode) {
    setMode(nextMode);
    setError(null);
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

    if (!identifier.trim() || !password) {
      return 'Vui lòng nhập thông tin đăng nhập và mật khẩu.';
    }

    return null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);

    try {
      const user =
        mode === 'login'
          ? await login(identifier, password)
          : await register(username, email, password);

      onAuthenticated(user);
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
    isSubmitting,
    error,
    setIdentifier,
    setUsername,
    setEmail,
    setPassword,
    setConfirmPassword,
    switchMode,
    handleSubmit,
  };
}
