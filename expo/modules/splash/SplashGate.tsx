import {ENV} from '@core/config/env';
import {useAuth} from '@core/contexts/AuthContext';
import type {SplashScreenConfig} from '@core/services/splash';
import {getActiveSplash} from '@core/services/splash';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useEffect, useRef, useState} from 'react';
import SplashOverlay from './components/SplashOverlay';

function dayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Resolves the active splash once per app open and decides visibility:
 * guests follow alwaysShowForGuest (BR03/BR13); authenticated users are
 * capped by displayLimitPerDay, tracked locally per user+splash+day
 * (BR01/BR02/BR12). Any failure skips the splash silently (UC01).
 */
export default function SplashGate() {
  const {user, isLoading: authLoading} = useAuth();
  const [splash, setSplash] = useState<SplashScreenConfig | null>(null);
  const decidedRef = useRef(false);

  useEffect(() => {
    if (!ENV.HAS_BACKEND || authLoading || decidedRef.current) return;
    decidedRef.current = true;
    let cancelled = false;

    (async () => {
      try {
        const active = await getActiveSplash();
        if (!active || cancelled) return;

        if (user) {
          const key = `@splash_views:${active.id}:${user.id}:${dayKey()}`;
          const seen = parseInt((await AsyncStorage.getItem(key)) ?? '0', 10) || 0;
          const limit = active.displayLimitPerDay ?? 1;
          if (limit <= 0 || seen >= limit) return;
          await AsyncStorage.setItem(key, String(seen + 1));
        } else if (!active.alwaysShowForGuest) {
          return;
        }

        if (!cancelled) setSplash(active);
      } catch {
        // Splash must never block the app — skip on any error
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authLoading, user]);

  if (!splash) return null;

  return <SplashOverlay splash={splash} onDismiss={() => setSplash(null)} />;
}
