import { ENV } from '@/config/env';
import * as tokenStorage from './tokenStorage';

export class ApiError extends Error {
  status: number;
  error: string;

  constructor(status: number, error: string, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.error = error;
  }
}

export class AuthExpiredError extends Error {
  constructor() {
    super('Authentication expired');
    this.name = 'AuthExpiredError';
  }
}

let onAuthExpiredCallback: (() => void) | null = null;

export function setOnAuthExpired(callback: () => void) {
  onAuthExpiredCallback = callback;
}

export async function apiFetch<T = unknown>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${ENV.API_BASE_URL}${path}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  const accessToken = await tokenStorage.getAccessToken();
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  let response = await fetch(url, { ...options, headers });

  if (response.status === 401 && accessToken) {
    const refreshed = await tryRefreshToken();
    if (refreshed) {
      const newToken = await tokenStorage.getAccessToken();
      headers['Authorization'] = `Bearer ${newToken}`;
      response = await fetch(url, { ...options, headers });
    } else {
      await tokenStorage.clearTokens();
      onAuthExpiredCallback?.();
      throw new AuthExpiredError();
    }
  }

  if (!response.ok) {
    let errorBody: { status?: number; error?: string; message?: string } = {};
    try {
      errorBody = await response.json();
    } catch {
      // response body is not JSON
    }
    throw new ApiError(
      errorBody.status ?? response.status,
      errorBody.error ?? response.statusText,
      errorBody.message ?? 'Request failed',
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }
  return response.json() as Promise<T>;
}

async function tryRefreshToken(): Promise<boolean> {
  const refreshToken = await tokenStorage.getRefreshToken();
  if (!refreshToken) return false;

  try {
    const url = `${ENV.API_BASE_URL}/api/auth/refresh`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) return false;

    const data = await response.json();
    await tokenStorage.saveTokens(data.accessToken, data.refreshToken);
    return true;
  } catch {
    return false;
  }
}
