import {Platform} from 'react-native';
import {apiFetch} from './api';

export type SplashPlatforms = 'ALL' | 'WEB' | 'MOBILE';
export type SplashStatus = 'draft' | 'scheduled' | 'active' | 'expired' | 'default';

export type SplashScreenConfig = {
  id: string;
  title: string;
  subtitle?: string | null;
  imageUrl?: string | null;
  imageKey?: string | null;
  backgroundColor?: string | null;
  textColor?: string | null;
  buttonLabel?: string | null;
  externalUrl?: string | null;
  publishStart?: string | null;
  publishEnd?: string | null;
  displayLimitPerDay: number;
  alwaysShowForGuest: boolean;
  platforms: SplashPlatforms;
  priority: number;
  isDefault: boolean;
  enabled: boolean;
  status?: SplashStatus;
  createdAt?: string;
  updatedAt?: string;
};

export function currentPlatform(): 'WEB' | 'MOBILE' {
  return Platform.OS === 'web' ? 'WEB' : 'MOBILE';
}

/** Public endpoint — returns null when no splash is active (204). */
export async function getActiveSplash(): Promise<SplashScreenConfig | null> {
  const data = await apiFetch<SplashScreenConfig | undefined>(
    `/api/splash/active?platform=${currentPlatform()}`,
  );
  return data ?? null;
}

export type SplashWriteInput = Omit<SplashScreenConfig, 'id' | 'status' | 'createdAt' | 'updatedAt'>;

export async function listSplashScreens(filters?: {status?: SplashStatus; platform?: SplashPlatforms}): Promise<{
  splashScreens: SplashScreenConfig[];
  total: number;
}> {
  const params = new URLSearchParams();
  if (filters?.status) params.set('status', filters.status);
  if (filters?.platform) params.set('platform', filters.platform);
  const qs = params.toString();
  const data = await apiFetch<{splashScreens?: SplashScreenConfig[]; total?: number}>(
    `/api/admin/splash${qs ? `?${qs}` : ''}`,
  );
  return {splashScreens: data.splashScreens ?? [], total: data.total ?? 0};
}

export async function createSplashScreen(input: SplashWriteInput): Promise<SplashScreenConfig> {
  return apiFetch<SplashScreenConfig>('/api/admin/splash', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function updateSplashScreen(id: string, input: SplashWriteInput): Promise<SplashScreenConfig> {
  return apiFetch<SplashScreenConfig>(`/api/admin/splash/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}

export async function deleteSplashScreen(id: string): Promise<void> {
  await apiFetch<void>(`/api/admin/splash/${encodeURIComponent(id)}`, {method: 'DELETE'});
}

export async function duplicateSplashScreen(id: string): Promise<SplashScreenConfig> {
  return apiFetch<SplashScreenConfig>(`/api/admin/splash/${encodeURIComponent(id)}/duplicate`, {
    method: 'POST',
  });
}

export async function suggestSplashPeriod(): Promise<{publishStart?: string; publishEnd?: string}> {
  return apiFetch<{publishStart?: string; publishEnd?: string}>('/api/admin/splash/suggest-period');
}

export type SplashImageUpload = {imageKey: string; imageUrl: string};

export async function uploadSplashImage(
  uri: string,
  mimeType?: string,
  webFile?: File,
): Promise<SplashImageUpload> {
  const resolvedType = mimeType ?? 'image/jpeg';
  const formData = new FormData();

  if (Platform.OS === 'web') {
    // Same mobile-Safari-safe pattern as avatar/login-background uploads:
    // prefer the original File from expo-image-picker over re-fetching its
    // blob: URI.
    const file = webFile ?? (await (await fetch(uri)).blob());
    formData.append('file', file, `splash.${resolvedType.split('/')[1] ?? 'jpg'}`);
  } else {
    formData.append('file', {
      uri,
      name: `splash.${resolvedType.split('/')[1] ?? 'jpg'}`,
      type: resolvedType,
    } as unknown as Blob);
  }

  return apiFetch<SplashImageUpload>('/api/admin/splash/images', {method: 'POST', body: formData});
}

/** `imageId` is the file-name segment of the storage key (`{uuid}.{ext}`). */
export async function deleteSplashImage(imageId: string): Promise<void> {
  await apiFetch<void>(`/api/admin/splash/images/${encodeURIComponent(imageId)}`, {method: 'DELETE'});
}

/** Storage key → the imageId accepted by deleteSplashImage, or null if not an uploaded key. */
export function splashImageIdFromKey(imageKey?: string | null): string | null {
  if (!imageKey?.startsWith('splash/')) return null;
  return imageKey.slice('splash/'.length) || null;
}
