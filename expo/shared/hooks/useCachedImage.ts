import {useEffect, useState} from 'react';
import {ensureCachedImage, getCachedImage} from '@core/services/imageCache';

export interface CachedImageParams {
  scope: string;
  cacheKey: string;
  version: string;
  remoteUrl: string;
}

/**
 * Resolves a versioned remote image to a locally cached URI.
 * Shows the cached copy immediately (even while a newer version downloads),
 * and falls back to the remote URL when caching is unavailable.
 * Returns null while nothing is resolvable yet, or when params is null.
 */
export function useCachedImageUri(params: CachedImageParams | null): string | null {
  const [uri, setUri] = useState<string | null>(null);
  const scope = params?.scope;
  const cacheKey = params?.cacheKey;
  const version = params?.version;
  const remoteUrl = params?.remoteUrl;

  useEffect(() => {
    if (!scope || !cacheKey || version === undefined || !remoteUrl) {
      setUri(null);
      return;
    }
    let cancelled = false;
    (async () => {
      const cached = await getCachedImage(scope, cacheKey);
      if (cancelled) return;
      if (cached) {
        // Serve what we have immediately; a version change swaps it below.
        setUri(cached.localUri);
        if (cached.version === version) return;
      }
      const resolved = await ensureCachedImage({scope, key: cacheKey, version, remoteUrl});
      if (!cancelled) setUri(resolved);
    })().catch(() => {
      if (!cancelled) setUri(remoteUrl);
    });
    return () => {
      cancelled = true;
    };
  }, [scope, cacheKey, version, remoteUrl]);

  return uri;
}
