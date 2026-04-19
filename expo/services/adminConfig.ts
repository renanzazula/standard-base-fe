import { apiFetch } from './api';

export interface NavigationTabResponse {
  tabId: string;
  key: string;
  label: string;
  iconName: string;
  enabled: boolean;
  sortOrder: number;
  isSystem: boolean;
  permissionKey?: string;
}

export interface AppConfigResponse {
  tenantId: string;
  emailAuthEnabled: boolean;
  googleAuthEnabled: boolean;
  appleAuthEnabled: boolean;
  sessionDurationSeconds: number;
  refreshTokenDurationSeconds: number;
  sessionAutoRefresh: boolean;
  defaultLanguage: string;
  availableLanguages: string[];
  defaultTimezone: string;
  defaultDateFormat: string;
  usernameMinLength: number;
  usernameMaxLength: number;
  avatarMaxSizeMb: number;
  allowedAvatarFormats: string[];
  navigationTabs?: NavigationTabResponse[];
}

export function getAppConfig(): Promise<AppConfigResponse> {
  return apiFetch('/api/config');
}

export function getAdminConfig(): Promise<AppConfigResponse> {
  return apiFetch('/api/admin/config');
}

export function updateAuthMethods(body: {
  emailAuthEnabled?: boolean;
  googleAuthEnabled?: boolean;
  appleAuthEnabled?: boolean;
}): Promise<AppConfigResponse> {
  return apiFetch('/api/admin/config/auth-methods', { method: 'PATCH', body: JSON.stringify(body) });
}

export function updateSessionPolicy(body: {
  sessionDurationSeconds?: number;
  refreshTokenDurationSeconds?: number;
  autoRefresh?: boolean;
}): Promise<AppConfigResponse> {
  return apiFetch('/api/admin/config/session-policy', { method: 'PATCH', body: JSON.stringify(body) });
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
