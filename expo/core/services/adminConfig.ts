import {Platform} from 'react-native';
import {apiFetch} from './api';

export interface NavigationTabResponse {
  tabId: string;
  key: string;
  label: string;
  iconName: string;
  enabled: boolean;
  sortOrder: number;
  isSystem: boolean;
  permissionKey?: string;
  configs?: Record<string, Record<string, unknown>>;
}

/** Uppercased Keycloak user-type role name — dynamic, not a fixed union. */
export type BackendRole = string;

export type BackendProfileField =
  | 'PROFILE_PICTURE'
  | 'USERNAME'
  | 'EMAIL'
  | 'ROLE'
  | 'PROVIDER'
  | 'LANGUAGE';

/** Role -> profile field -> visible, as returned by /api/config. */
export type ProfileFieldVisibilityMap = Partial<
  Record<BackendRole, Partial<Record<BackendProfileField, boolean>>>
>;

export interface AppConfigResponse {
  tenantId: string;
  defaultLanguage: string;
  availableLanguages: string[];
  defaultTimezone: string;
  defaultDateFormat: string;
  usernameMinLength: number;
  usernameMaxLength: number;
  avatarMaxSizeMb: number;
  allowedAvatarFormats: string[];
  loginBackgroundUrl?: string | null;
  loginBackgroundVersion?: number;
  loginBackgroundUpdatedAt?: string;
  navigationTabs?: NavigationTabResponse[];
  profileFieldVisibility?: ProfileFieldVisibilityMap;
}

export function getAppConfig(): Promise<AppConfigResponse> {
  return apiFetch('/api/config');
}

export function getAdminConfig(): Promise<AppConfigResponse> {
  return apiFetch('/api/admin/config');
}

export function updateLanguagePolicy(body: {
  defaultLanguage?: string;
  availableLanguages?: string[];
}): Promise<AppConfigResponse> {
  return apiFetch('/api/admin/config/language-policy', { method: 'PATCH', body: JSON.stringify(body) });
}

export function updateRegionalPolicy(body: {
  defaultTimezone?: string;
  defaultDateFormat?: string;
}): Promise<AppConfigResponse> {
  return apiFetch('/api/admin/config/regional', { method: 'PATCH', body: JSON.stringify(body) });
}

export function updateProfilePolicy(body: {
  usernameMinLength?: number;
  usernameMaxLength?: number;
  avatarMaxSizeMb?: number;
  allowedAvatarFormats?: string[];
}): Promise<AppConfigResponse> {
  return apiFetch('/api/admin/config/profile-policy', { method: 'PATCH', body: JSON.stringify(body) });
}

export function updateProfileFieldVisibility(body: {
  visibility: ProfileFieldVisibilityMap;
}): Promise<AppConfigResponse> {
  return apiFetch('/api/admin/config/profile-field-visibility', { method: 'PATCH', body: JSON.stringify(body) });
}

export function updateNavigationTabs(body: {
  tabs: Array<{ tabId: string; enabled?: boolean; sortOrder?: number; label?: string }>;
}): Promise<AppConfigResponse> {
  return apiFetch('/api/admin/config/navigation-tabs', { method: 'PATCH', body: JSON.stringify(body) });
}

export function addNavigationTab(body: {
  key: string;
  label: string;
  iconName: string;
}): Promise<AppConfigResponse> {
  return apiFetch('/api/admin/config/navigation-tabs', { method: 'POST', body: JSON.stringify(body) });
}

export function removeNavigationTab(tabId: string): Promise<AppConfigResponse> {
  return apiFetch(`/api/admin/config/navigation-tabs/${tabId}`, { method: 'DELETE' });
}

export async function uploadLoginBackground(uri: string, mimeType?: string, webFile?: File): Promise<AppConfigResponse> {
  const resolvedType = mimeType ?? 'image/jpeg';
  const formData = new FormData();

  if (Platform.OS === 'web') {
    // Same mobile-Safari-safe pattern as avatar upload: prefer the original
    // File from expo-image-picker over re-fetching its blob: URI.
    const file = webFile ?? await (await fetch(uri)).blob();
    formData.append('file', file, `background.${resolvedType.split('/')[1] ?? 'jpg'}`);
  } else {
    formData.append('file', {
      uri,
      name: `background.${resolvedType.split('/')[1] ?? 'jpg'}`,
      type: resolvedType,
    } as unknown as Blob);
  }

  return apiFetch('/api/admin/config/login-background', { method: 'POST', body: formData });
}

export function removeLoginBackground(): Promise<AppConfigResponse> {
  return apiFetch('/api/admin/config/login-background', { method: 'DELETE' });
}
