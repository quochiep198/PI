import type { AuthUser } from './types';

type AuthResponse = {
  user: AuthUser;
  message?: string;
};

type PasswordResetRequestResponse = {
  message?: string;
  resetUrl?: string;
};

async function readJsonSafely<T>(response: Response): Promise<T | null> {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

export async function login(identifier: string, password: string) {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      identifier,
      password,
    }),
  });

  const data = await readJsonSafely<AuthResponse>(response);
  if (!response.ok) {
    throw new Error(data?.message || 'Không thể xác thực tài khoản.');
  }

  if (!data?.user) {
    throw new Error('Máy chủ không trả về dữ liệu người dùng hợp lệ.');
  }

  return data.user;
}

export async function register(username: string, email: string, password: string) {
  const response = await fetch('/api/auth/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      username,
      email,
      password,
    }),
  });

  const data = await readJsonSafely<AuthResponse>(response);
  if (!response.ok) {
    throw new Error(data?.message || 'Không thể xác thực tài khoản.');
  }

  if (!data?.user) {
    throw new Error('Máy chủ không trả về dữ liệu người dùng hợp lệ.');
  }

  return data.user;
}

export async function requestPasswordReset(identifier: string) {
  const response = await fetch('/api/auth/forgot-password', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      identifier,
    }),
  });

  const data = await readJsonSafely<PasswordResetRequestResponse>(response);
  if (!response.ok) {
    throw new Error(data?.message || 'Khong the gui yeu cau dat lai mat khau.');
  }

  return {
    message: data?.message || 'Neu tai khoan ton tai, chung toi da gui huong dan dat lai mat khau.',
    resetUrl: data?.resetUrl || null,
  };
}

export async function resetPassword(token: string, password: string, confirmPassword: string) {
  const response = await fetch('/api/auth/reset-password', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      token,
      password,
      confirmPassword,
    }),
  });

  const data = await readJsonSafely<PasswordResetRequestResponse>(response);
  if (!response.ok) {
    throw new Error(data?.message || 'Khong the dat lai mat khau.');
  }

  return {
    message: data?.message || 'Doi mat khau thanh cong.',
  };
}

export async function updateAvatar(avatarDataUrl: string) {
  const response = await fetch('/api/users/me/avatar', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      avatarDataUrl,
    }),
  });

  const data = await readJsonSafely<AuthResponse>(response);
  if (!response.ok) {
    throw new Error(data?.message || 'Khong the cap nhat avatar.');
  }

  if (!data?.user) {
    throw new Error('May chu khong tra ve du lieu avatar hop le.');
  }

  return data.user;
}

type SaveSettingsPayload = {
  username: string;
  email: string;
  avatarDataUrl?: string | null;
  currentPassword?: string;
  newPassword?: string;
  theme: 'light' | 'dark';
  profileVisible: boolean;
  emailNotifications: boolean;
  musicEnabled: boolean;
  soundVolume: number;
};

export async function saveSettings(payload: SaveSettingsPayload) {
  const response = await fetch('/api/users/me/settings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await readJsonSafely<AuthResponse>(response);
  if (!response.ok) {
    throw new Error(data?.message || 'Khong the luu cai dat.');
  }

  if (!data?.user) {
    throw new Error('May chu khong tra ve du lieu cai dat hop le.');
  }

  return data.user;
}
