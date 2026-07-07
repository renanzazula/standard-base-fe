import {ENV} from '@core/config/env';
import {useAuth} from '@core/contexts/AuthContext';
import {ensureCachedImage, pruneImageCache, tenantScope} from '@core/services/imageCache';
import type {SplashScreenConfig} from '@core/services/splash';
import {getActiveSplash} from '@core/services/splash';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useEffect, useRef, useState} from 'react';
import {StyleSheet, View} from 'react-native';
import SplashOverlay from './components/SplashOverlay';

function dayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

// A startup prefetch older than this is discarded so a user who lingers on
// the login screen still gets a splash that reflects current scheduling.
const PREFETCH_TTL_MS = 60_000;

// Cap on how long the cover may hide the app while a decision is pending.
// When it fires the splash is skipped — it must never block the app (UC01).
const DECISION_TIMEOUT_MS = 2_500;

// Matches SplashOverlay's fallback background so cover→splash is seamless.
const COVER_BG = '#1A1A1C';

type PendingFetch = {promise: Promise<SplashScreenConfig | null>; startedAt: number};

// One decision per signed-in session: which splash (if any) userId gets.
type Decision = {userId: string; splash: SplashScreenConfig | null};

/**
 * Evaluates the active splash only after authentication resolves to a
 * session (BR15/BR18): once per signed-in user, re-triggered by every
 * login event — session restore, manual login, or guest login (BR19).
 * While the decision is pending the gate renders an opaque cover in the
 * same commit the session appears, so the landing screen (whatever route
 * navigation targets) is never visible before the splash.
 *
 * Guests are never capped by the daily limit and follow alwaysShowForGuest
 * (BR17/BR03/BR13); authenticated users are capped by displayLimitPerDay,
 * tracked locally per user+splash+day (BR16/BR01/BR02/BR12) and counted
 * only when a splash is actually shown. Any failure or timeout skips the
 * splash silently (UC01).
 */
export default function SplashGate() {
  const {user, isLoading: authLoading} = useAuth();
  const [decision, setDecision] = useState<Decision | null>(null);
  const prefetchRef = useRef<PendingFetch | null>(null);

  // The gate is mounted while the session is still being restored, so this
  // runs the splash fetch concurrently with authentication instead of after
  // it. Consumed (at most once) by the first decision below.
  useEffect(() => {
    if (ENV.HAS_BACKEND) {
      prefetchRef.current = {
        promise: getActiveSplash().catch(() => null),
        startedAt: Date.now(),
      };
    }
  }, []);

  const userId = user?.id ?? null;
  const isGuest = user?.role === 'guest';

  // Derived during render so the cover paints in the same commit the
  // session appears — no frame of the underlying screen in between.
  const deciding = ENV.HAS_BACKEND && !authLoading && !!userId && decision?.userId !== userId;

  // Logout drops the stale decision so the next login — including a guest
  // re-entry with a reused id — evaluates again (BR15/BR18).
  useEffect(() => {
    if (!userId) setDecision(null);
  }, [userId]);

  useEffect(() => {
    if (!deciding || !userId) return;

    let finished = false;
    const timer = setTimeout(() => {
      finished = true;
      setDecision({userId, splash: null});
    }, DECISION_TIMEOUT_MS);

    (async () => {
      let splash: SplashScreenConfig | null = null;
      let counterUpdate: {key: string; next: number} | null = null;

      try {
        const prefetch = prefetchRef.current;
        prefetchRef.current = null;
        const active = await (prefetch && Date.now() - prefetch.startedAt < PREFETCH_TTL_MS
          ? prefetch.promise
          : getActiveSplash());

        if (active) {
          if (isGuest) {
            // Guest sessions are transient, so per-user view counting is
            // meaningless for them — they follow the guest rule instead.
            splash = active.alwaysShowForGuest ? active : null;
          } else {
            const key = `@splash_views:${active.id}:${userId}:${dayKey()}`;
            const seen = parseInt((await AsyncStorage.getItem(key)) ?? '0', 10) || 0;
            const limit = active.displayLimitPerDay ?? 1;
            if (limit > 0 && seen < limit) {
              splash = active;
              counterUpdate = {key, next: seen + 1};
            }
          }
        }

        if (splash?.imageUrl) {
          // Serve the splash image from the local cache, re-downloading only
          // when the splash changed. Bounded by the decision timeout above;
          // on failure the remote URL is used (previous behavior).
          const imageUri = await ensureCachedImage({
            scope: tenantScope(),
            key: `splash:${splash.id}`,
            version: splash.updatedAt ?? String(splash.id),
            remoteUrl: splash.imageUrl,
          });
          splash = {...splash, imageUrl: imageUri};
        }

        // Drop cached images for splashes that are no longer active.
        pruneImageCache(tenantScope(), 'splash:', active ? [`splash:${active.id}`] : []).catch(() => {});
      } catch {
        splash = null; // splash must never block the app — skip on any error
      }

      // A timeout (or a newer login) already resolved this decision; a late
      // result must not pop a splash over the app.
      if (finished) return;
      finished = true;
      clearTimeout(timer);

      if (splash && counterUpdate) {
        // Count only splashes actually shown; don't delay display on it.
        AsyncStorage.setItem(counterUpdate.key, String(counterUpdate.next)).catch(() => {});
      }
      setDecision({userId, splash});
    })();

    return () => {
      finished = true;
      clearTimeout(timer);
    };
  }, [deciding, userId, isGuest]);

  if (deciding) {
    return <View style={[StyleSheet.absoluteFillObject, styles.cover]} />;
  }

  const splash = userId && decision?.userId === userId ? decision.splash : null;
  if (!splash) return null;

  return (
    <SplashOverlay
      splash={splash}
      onDismiss={() => setDecision((d) => (d ? {...d, splash: null} : null))}
    />
  );
}

const styles = StyleSheet.create({
  cover: {
    backgroundColor: COVER_BG,
    zIndex: 1000,
    elevation: 1000,
  },
});
