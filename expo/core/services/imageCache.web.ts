import {CachedImageMeta, listMetaKeys, readMeta, removeMeta, writeMeta,} from './imageCacheMeta';

export type {CachedImageMeta};
export {tenantScope, userScope} from './imageCacheMeta';

const CACHE_NAME = 'image-cache';
// Synthetic request URLs used purely as Cache API keys — never fetched.
const CACHE_URL_BASE = 'https://img-cache.local/';

const inFlight = new Map<string, Promise<string>>();
// Object URLs are memoized for the session; revoked when replaced or pruned.
const objectUrls = new Map<string, string>();

function cacheApiAvailable(): boolean {
  return typeof caches !== 'undefined';
}

function cacheRequestUrl(scope: string, key: string): string {
  return `${CACHE_URL_BASE}${encodeURIComponent(scope)}/${encodeURIComponent(key)}`;
}

function releaseObjectUrl(requestUrl: string): void {
  const existing = objectUrls.get(requestUrl);
  if (existing) {
    URL.revokeObjectURL(existing);
    objectUrls.delete(requestUrl);
  }
}

async function blobToObjectUrl(requestUrl: string, blob: Blob): Promise<string> {
  releaseObjectUrl(requestUrl);
  const url = URL.createObjectURL(blob);
  objectUrls.set(requestUrl, url);
  return url;
}

export async function getCachedImage(scope: string, key: string): Promise<CachedImageMeta | null> {
  if (!cacheApiAvailable()) return null;
  const meta = await readMeta(scope, key);
  if (!meta) return null;

  const requestUrl = cacheRequestUrl(scope, key);
  const memoized = objectUrls.get(requestUrl);
  if (memoized) return {...meta, localUri: memoized};

  try {
    const cache = await caches.open(CACHE_NAME);
    const response = await cache.match(requestUrl);
    if (!response) {
      await removeMeta(scope, key);
      return null;
    }
    const localUri = await blobToObjectUrl(requestUrl, await response.blob());
    return {...meta, localUri};
  } catch {
    return null;
  }
}

/**
 * Returns a displayable URI for the image, downloading it only when the cached
 * version differs. Never throws — without the Cache API (insecure context) or
 * on CORS/network failure the remote URL is returned uncached.
 */
export async function ensureCachedImage(opts: {
  scope: string;
  key: string;
  version: string;
  remoteUrl: string;
}): Promise<string> {
  const {scope, key, version, remoteUrl} = opts;
  if (!cacheApiAvailable()) return remoteUrl;
  try {
    const cached = await getCachedImage(scope, key);
    if (cached && cached.version === version) {
      return cached.localUri;
    }

    const flightKey = `${scope}:${key}:${version}`;
    const existing = inFlight.get(flightKey);
    if (existing) return existing;

    const download = (async () => {
      const response = await fetch(remoteUrl);
      if (!response.ok) return remoteUrl;
      const blob = await response.blob();

      const requestUrl = cacheRequestUrl(scope, key);
      const cache = await caches.open(CACHE_NAME);
      await cache.put(requestUrl, new Response(blob, {
        headers: {'Content-Type': blob.type || 'application/octet-stream'},
      }));
      await writeMeta(scope, key, {version, localUri: requestUrl, cachedAt: Date.now()});
      return blobToObjectUrl(requestUrl, blob);
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
    if (cacheApiAvailable()) {
      const cache = await caches.open(CACHE_NAME);
      await Promise.all(
        keys.map(async (k) => {
          const requestUrl = cacheRequestUrl(scope, k);
          releaseObjectUrl(requestUrl);
          await cache.delete(requestUrl);
        }),
      );
    }
    await Promise.all(keys.map((k) => removeMeta(scope, k)));
  } catch {
    // best-effort
  }
}

/** Removes entries under keyPrefix that are not in keepKeys (obsolete splash images). */
export async function pruneImageCache(scope: string, keyPrefix: string, keepKeys: string[]): Promise<void> {
  try {
    const keys = await listMetaKeys(scope);
    const stale = keys.filter((k) => k.startsWith(keyPrefix) && !keepKeys.includes(k));
    const cache = cacheApiAvailable() ? await caches.open(CACHE_NAME) : null;
    await Promise.all(
      stale.map(async (k) => {
        const requestUrl = cacheRequestUrl(scope, k);
        releaseObjectUrl(requestUrl);
        if (cache) await cache.delete(requestUrl);
        await removeMeta(scope, k);
      }),
    );
  } catch {
    // best-effort
  }
}
