import AsyncStorage from '@react-native-async-storage/async-storage';
import {ENV} from '@core/config/env';

export interface CachedImageMeta {
  version: string;
  localUri: string;
  cachedAt: number;
}

const META_PREFIX = '@image_cache:';

// Tenant-scoped entries (login background, splash) survive logout — they are
// shown to logged-out users. User-scoped entries (avatar) are cleared on logout.
export function tenantScope(): string {
  return `t:${ENV.TENANT_ID}`;
}

export function userScope(userId: string): string {
  return `u:${ENV.TENANT_ID}:${userId}`;
}

export function metaStorageKey(scope: string, key: string): string {
  return `${META_PREFIX}${scope}:${key}`;
}

export async function readMeta(scope: string, key: string): Promise<CachedImageMeta | null> {
  try {
    const raw = await AsyncStorage.getItem(metaStorageKey(scope, key));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedImageMeta;
    if (typeof parsed?.version !== 'string' || typeof parsed?.localUri !== 'string') return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function writeMeta(scope: string, key: string, meta: CachedImageMeta): Promise<void> {
  await AsyncStorage.setItem(metaStorageKey(scope, key), JSON.stringify(meta));
}

export async function removeMeta(scope: string, key: string): Promise<void> {
  await AsyncStorage.removeItem(metaStorageKey(scope, key));
}

/** Returns cache keys (without prefix/scope) of all entries in a scope. */
export async function listMetaKeys(scope: string): Promise<string[]> {
  const prefix = `${META_PREFIX}${scope}:`;
  const all = await AsyncStorage.getAllKeys();
  return all.filter((k) => k.startsWith(prefix)).map((k) => k.slice(prefix.length));
}

/** Stable filename-safe hash for cache keys (djb2, hex). */
export function hashKey(key: string): string {
  let hash = 5381;
  for (let i = 0; i < key.length; i++) {
    hash = ((hash << 5) + hash + key.charCodeAt(i)) >>> 0;
  }
  return hash.toString(16);
}
