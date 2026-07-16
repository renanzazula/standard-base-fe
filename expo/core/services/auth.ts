import {apiFetch} from './api';
import * as tokenStorage from './tokenStorage';
import type {NavigationTabResponse} from './adminConfig';

export type { NavigationTabResponse };

// Login, registration, token refresh and password reset are hosted by
// Keycloak — see core/services/keycloakAuth.ts. The backend keeps only guest
// login (self-issued tokens) and the profile endpoint below.

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
  username?: string;
  avatarUrl?: string;
  avatarVersion?: number;
  avatarUpdatedAt?: string;
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
  username?: string;
  avatarUrl?: string;
  avatarVersion?: number;
  avatarUpdatedAt?: string;
  role: string;
  status: string;
  providers: string[];
  permissions?: string[];
  navigationTabs?: NavigationTabResponse[];
  preferences?: UserPreferencesDto;
  /** Profile field (e.g. EMAIL) -> visible, resolved for this user's role. */
  profileFieldVisibility?: Record<string, boolean>;
}

export async function guestLogin(): Promise<AuthResponse> {
  const response = await apiFetch<AuthResponse>('/api/auth/guest', { method: 'POST' });
  // Guest sessions have no refresh token — the session ends when the access token expires.
  await tokenStorage.saveAccessToken(response.accessToken);
  return response;
}

export async function getCurrentUser(): Promise<UserProfileResponse> {
  return apiFetch<UserProfileResponse>('/api/auth/me');
}
