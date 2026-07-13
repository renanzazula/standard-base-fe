import {ENV} from '@core/config/env';
import * as tokenStorage from './tokenStorage';
import * as keycloakAuth from './keycloakAuth';

const TENANT_HEADER = 'X-Tenant-ID';

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

  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;

  const headers: Record<string, string> = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(options.headers as Record<string, string>),
  };
  headers[TENANT_HEADER] = ENV.TENANT_ID;

  // Keycloak access tokens are short-lived (~15 min). When the stored expiry
  // says the token is already stale, refresh proactively instead of paying a
  // guaranteed 401 round-trip. Guests have no expiry stored, so they skip this.
  const expiry = await tokenStorage.getTokenExpiry();
  if (expiry && Date.now() > expiry - 10_000) {
    await tryRefreshToken();
  }

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
  const text = await response.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}

// One refresh at a time: concurrent 401s all await the same Keycloak call, so
// the refresh token is never presented twice in parallel.
let refreshInFlight: Promise<boolean> | null = null;

function tryRefreshToken(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = keycloakAuth.refresh().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}
