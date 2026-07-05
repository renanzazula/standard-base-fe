import {apiFetch} from './api';
import * as tokenStorage from './tokenStorage';
import type {NavigationTabResponse} from './adminConfig';

export type { NavigationTabResponse };

export interface UserPreferencesDto {
  language?: string;
  theme?: string;
  timezone?: string;
  dateFormat?: string;
  notificationsEnabled?: boolean;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string | null;
  expiresIn: number;
  email: string;
  displayName: string;
  userId: string;
  role: string;
  permissions?: string[];
  navigationTabs?: NavigationTabResponse[];
  preferences?: UserPreferencesDto;
}

export interface UserProfileResponse {
  userId: string;
  email: string;
  displayName: string;
  role: string;
  status: string;
  providers: string[];
  permissions?: string[];
  navigationTabs?: NavigationTabResponse[];
  preferences?: UserPreferencesDto;
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const response = await apiFetch<AuthResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  await tokenStorage.saveTokens(response.accessToken, response.refreshToken);
  return response;
}

export async function register(email: string, password: string, displayName: string): Promise<AuthResponse> {
  const response = await apiFetch<AuthResponse>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, displayName }),
  });
  await tokenStorage.saveTokens(response.accessToken, response.refreshToken);
  return response;
}

export async function guestLogin(): Promise<AuthResponse> {
  const response = await apiFetch<AuthResponse>('/api/auth/guest', { method: 'POST' });
  // Guest sessions have no refresh token — the session ends when the access token expires.
  await tokenStorage.saveAccessToken(response.accessToken);
  return response;
}

export async function oauthLogin(provider: 'GOOGLE' | 'APPLE', authorizationCode: string): Promise<AuthResponse> {
  const response = await apiFetch<AuthResponse>('/api/auth/oauth', {
    method: 'POST',
    body: JSON.stringify({ provider, authorizationCode }),
  });
  await tokenStorage.saveTokens(response.accessToken, response.refreshToken);
  return response;
}

export async function getCurrentUser(): Promise<UserProfileResponse> {
  return apiFetch<UserProfileResponse>('/api/auth/me');
}

export async function forgotPassword(email: string): Promise<void> {
  return apiFetch('/api/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) });
}

export async function confirmPasswordReset(token: string, newPassword: string): Promise<void> {
  return apiFetch('/api/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token, newPassword }),
  });
}

export async function refreshToken(token: string): Promise<AuthResponse> {
  const response = await apiFetch<AuthResponse>('/api/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refreshToken: token }),
  });
  await tokenStorage.saveTokens(response.accessToken, response.refreshToken);
  return response;
}
