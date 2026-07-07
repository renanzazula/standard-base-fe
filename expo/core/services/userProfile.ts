import {Platform} from 'react-native';
import {apiFetch} from './api';

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

export async function uploadAvatar(uri: string, mimeType?: string): Promise<UserProfileResponse> {
  const resolvedType = mimeType ?? 'image/jpeg';
  const formData = new FormData();

  if (Platform.OS === 'web') {
    const blob = await (await fetch(uri)).blob();
    formData.append('file', blob, `avatar.${resolvedType.split('/')[1] ?? 'jpg'}`);
  } else {
    formData.append('file', {
      uri,
      name: `avatar.${resolvedType.split('/')[1] ?? 'jpg'}`,
      type: resolvedType,
    } as unknown as Blob);
  }

  return apiFetch('/api/users/me/avatar', { method: 'POST', body: formData });
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
