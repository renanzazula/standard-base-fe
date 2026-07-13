import {Platform} from 'react-native';
import {apiFetch} from './api';

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

export async function uploadAvatar(uri: string, mimeType?: string, webFile?: File): Promise<UserProfileResponse> {
  const resolvedType = mimeType ?? 'image/jpeg';
  const formData = new FormData();

  if (Platform.OS === 'web') {
    // expo-image-picker hands us the original File directly on web (asset.file) —
    // use it as-is rather than re-fetching the blob: URI it was created from.
    // Re-fetching that URI (fetch(uri).then(r => r.blob())) is unreliable on
    // mobile Safari, which has long-standing bugs fetching blob: URLs, and was
    // causing avatar uploads to silently fail on mobile web.
    const file = webFile ?? await (await fetch(uri)).blob();
    formData.append('file', file, `avatar.${resolvedType.split('/')[1] ?? 'jpg'}`);
  } else {
    formData.append('file', {
      uri,
      name: `avatar.${resolvedType.split('/')[1] ?? 'jpg'}`,
      type: resolvedType,
    } as unknown as Blob);
  }

  return apiFetch('/api/users/me/avatar', { method: 'POST', body: formData });
}

// No password re-check: credentials live in Keycloak, so the client-side
// confirmation dialog plus the short-lived access token are the guard.
export function deactivateAccount(): Promise<{success: boolean; message: string}> {
  return apiFetch('/api/users/deactivate', { method: 'POST' });
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
