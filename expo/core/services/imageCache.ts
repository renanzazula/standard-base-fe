import * as FileSystem from 'expo-file-system/legacy';
import {CachedImageMeta, hashKey, listMetaKeys, readMeta, removeMeta, writeMeta,} from './imageCacheMeta';

export type {CachedImageMeta};
export {tenantScope, userScope} from './imageCacheMeta';

const CACHE_ROOT = `${FileSystem.cacheDirectory}image-cache/`;

const inFlight = new Map<string, Promise<string>>();

function scopeDir(scope: string): string {
  return `${CACHE_ROOT}${encodeURIComponent(scope)}/`;
}

function fileUri(scope: string, key: string): string {
  return `${scopeDir(scope)}${hashKey(key)}.img`;
}

export async function getCachedImage(scope: string, key: string): Promise<CachedImageMeta | null> {
  const meta = await readMeta(scope, key);
  if (!meta) return null;
  try {
    const info = await FileSystem.getInfoAsync(meta.localUri);
    if (!info.exists) {
      await removeMeta(scope, key);
      return null;
    }
  } catch {
    return null;
  }
  return meta;
}

/**
 * Returns a local URI for the image, downloading it only when the cached
 * version differs. Never throws — on any failure the remote URL is returned
 * so display still works.
 */
export async function ensureCachedImage(opts: {
  scope: string;
  key: string;
  version: string;
  remoteUrl: string;
}): Promise<string> {
  const {scope, key, version, remoteUrl} = opts;
  try {
    const cached = await getCachedImage(scope, key);
    if (cached && cached.version === version) {
      return cached.localUri;
    }

    const flightKey = `${scope}:${key}:${version}`;
    const existing = inFlight.get(flightKey);
    if (existing) return existing;

    const download = (async () => {
      await FileSystem.makeDirectoryAsync(scopeDir(scope), {intermediates: true}).catch(() => {});
      const target = fileUri(scope, key);
      const result = await FileSystem.downloadAsync(remoteUrl, target);
      if (result.status !== 200) {
        await FileSystem.deleteAsync(target, {idempotent: true}).catch(() => {});
        return remoteUrl;
      }
      await writeMeta(scope, key, {version, localUri: result.uri, cachedAt: Date.now()});
      return result.uri;
    })();

    inFlight.set(flightKey, download);
    try {
      return await download;
    } finally {
      inFlight.delete(flightKey);
    }
  } catch {
    return remoteUrl;
  }
}

/** Removes every cached image and metadata entry in a scope (e.g. on logout). */
export async function clearImageCacheScope(scope: string): Promise<void> {
  try {
    const keys = await listMetaKeys(scope);
    await Promise.all(keys.map((k) => removeMeta(scope, k)));
    await FileSystem.deleteAsync(scopeDir(scope), {idempotent: true});
  } catch {
    // best-effort
  }
}

/** Removes entries under keyPrefix that are not in keepKeys (obsolete splash images). */
export async function pruneImageCache(scope: string, keyPrefix: string, keepKeys: string[]): Promise<void> {
  try {
    const keys = await listMetaKeys(scope);
    const stale = keys.filter((k) => k.startsWith(keyPrefix) && !keepKeys.includes(k));
    await Promise.all(
      stale.map(async (k) => {
        await FileSystem.deleteAsync(fileUri(scope, k), {idempotent: true}).catch(() => {});
        await removeMeta(scope, k);
      }),
    );
  } catch {
    // best-effort
  }
}
