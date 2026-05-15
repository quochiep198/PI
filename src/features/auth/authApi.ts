import type { AuthUser } from './types';

type AuthResponse = {
  user: AuthUser;
  message?: string;
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
