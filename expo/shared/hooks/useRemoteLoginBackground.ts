import {useEffect, useState} from 'react';
import {useAdminConfig} from '@core/contexts/AdminConfigContext';
import {getCachedImage, pruneImageCache, tenantScope} from '@core/services/imageCache';
import {useCachedImageUri} from '@shared/hooks/useCachedImage';

const CACHE_KEY = 'login-background';

/**
 * Resolves the admin-configured login background to a locally cached URI.
 * Returns null when no background is configured (caller falls back to the
 * bundled asset). On cold start / offline, serves the last cached copy so the
 * screen doesn't regress to the bundled asset while config is unavailable.
 */
export function useRemoteLoginBackground(): string | null {
  const {config, configLoaded} = useAdminConfig();
  const {loginBackgroundUrl, loginBackgroundVersion} = config.brandingConfig;

  const resolved = useCachedImageUri(
    loginBackgroundUrl
      ? {
          scope: tenantScope(),
          cacheKey: CACHE_KEY,
          version: String(loginBackgroundVersion ?? 0),
          remoteUrl: loginBackgroundUrl,
        }
      : null,
  );

  const [cachedFallback, setCachedFallback] = useState<string | null>(null);
  useEffect(() => {
    if (loginBackgroundUrl) return;
    if (configLoaded) {
      // Backend answered and there is no background — drop any stale copy.
      setCachedFallback(null);
      pruneImageCache(tenantScope(), CACHE_KEY, []).catch(() => {});
      return;
    }
    let cancelled = false;
    getCachedImage(tenantScope(), CACHE_KEY)
      .then((meta) => {
        if (!cancelled && meta) setCachedFallback(meta.localUri);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [loginBackgroundUrl, configLoaded]);

  return resolved ?? cachedFallback;
}
