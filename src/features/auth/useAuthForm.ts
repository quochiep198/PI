import { useState, type FormEvent } from 'react';
import { login, register, requestPasswordReset, verifyOtp } from './authApi';
import type { AuthMode, AuthUser } from './types';

type UseAuthFormOptions = {
  onAuthenticated: (user: AuthUser) => void;
};

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
  const [mode, setMode] = useState<AuthMode>('login');
  const [identifier, setIdentifier] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [resetPreviewOtp, setResetPreviewOtp] = useState<string | null>(null);

  function switchMode(nextMode: AuthMode) {
    setMode(nextMode);
    setError(null);
    setSuccessMessage(null);
    setResetPreviewOtp(null);
    setOtp('');

    if (nextMode === 'forgot' || nextMode === 'login') {
      setResetEmail('');
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
        return 'Vui lòng nhập địa chỉ email đã đăng ký.';
      }

      return null;
    }

    if (mode === 'reset') {
      if (!resetEmail.trim()) {
        return 'Vui lòng nhập địa chỉ email.';
      }

      if (!otp.trim() || otp.length !== 6) {
        return 'Mã xác thực phải gồm 6 chữ số.';
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
    setResetPreviewOtp(null);
    setOtp('');

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
        setResetPreviewOtp(result.previewOtp || null);
        setResetEmail(forgotIdentifier);
        setMode('reset');
        setForgotIdentifier('');
        return;
      }

      const result = await verifyOtp(resetEmail, otp, password, confirmPassword);
      setSuccessMessage(result.message);
      setPassword('');
      setConfirmPassword('');
      setOtp('');
      setResetEmail('');
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
  };
}
