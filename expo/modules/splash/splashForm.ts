import type {SplashScreenConfig, SplashWriteInput} from '@core/services/splash';

export function toWriteInput(splash: SplashScreenConfig): SplashWriteInput {
  return {
    title: splash.title,
    subtitle: splash.subtitle ?? undefined,
    imageUrl: splash.imageUrl ?? undefined,
    backgroundColor: splash.backgroundColor ?? undefined,
    textColor: splash.textColor ?? undefined,
    buttonLabel: splash.buttonLabel ?? undefined,
    externalUrl: splash.externalUrl ?? undefined,
    publishStart: splash.publishStart ?? undefined,
    publishEnd: splash.publishEnd ?? undefined,
    displayLimitPerDay: splash.displayLimitPerDay,
    alwaysShowForGuest: splash.alwaysShowForGuest,
    platforms: splash.platforms,
    priority: splash.priority,
    isDefault: splash.isDefault,
    enabled: splash.enabled,
  };
}

/** "YYYY-MM-DD HH:mm" (local) → ISO string; empty → null; invalid → undefined. */
export function parseLocalDateTime(text: string): string | null | undefined {
  const trimmed = text.trim();
  if (!trimmed) return null;
  const match = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})$/);
  if (!match) return undefined;
  const date = new Date(+match[1], +match[2] - 1, +match[3], +match[4], +match[5]);
  return isNaN(date.getTime()) ? undefined : date.toISOString();
}

/** ISO string → "YYYY-MM-DD HH:mm" in local time for form display. */
export function formatLocalDateTime(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
