import { apiFetch } from './api';

export interface UserProfileResponse {
  userId: string;
  email: string;
  displayName: string;
  username?: string;
  avatarUrl?: string;
  role: string;
  status: string;
  providers: string[];
}

export interface UserPreferencesResponse {
  userId: string;
  language: string;
  theme: string;
  timezone: string;
  dateFormat: string;
  notificationsEnabled: boolean;
}

export function updateProfile(body: {
  username?: string;
  avatarUrl?: string;
}): Promise<UserProfileResponse> {
  return apiFetch('/api/users/me/profile', { method: 'PATCH', body: JSON.stringify(body) });
}

export function getPreferences(): Promise<UserPreferencesResponse> {
  return apiFetch('/api/users/me/preferences');
}

export function updatePreferences(body: {
  language?: string;
  theme?: string;
  timezone?: string;
  dateFormat?: string;
  notificationsEnabled?: boolean;
}): Promise<UserPreferencesResponse> {
  return apiFetch('/api/users/me/preferences', { method: 'PATCH', body: JSON.stringify(body) });
}
