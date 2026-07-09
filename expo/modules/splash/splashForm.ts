import type {SplashScreenConfig, SplashWriteInput} from '@core/services/splash';

export function toWriteInput(splash: SplashScreenConfig): SplashWriteInput {
  return {
    title: splash.title,
    subtitle: splash.subtitle ?? undefined,
    // When an uploaded image exists, responses carry a short-lived presigned
    // imageUrl — never write that back; the key is the source of truth.
    imageUrl: splash.imageKey ? undefined : splash.imageUrl ?? undefined,
    imageKey: splash.imageKey ?? undefined,
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

export {isValidHexColor} from '@shared/utils/color';

export type PublishWindowError = 'required' | 'endBeforeStart' | null;

/**
 * Mirrors the backend SplashValidator rules: a non-default splash needs both
 * dates, and start must be strictly before end.
 */
export function validatePublishWindow(
  start: string | null,
  end: string | null,
  isDefault: boolean,
): PublishWindowError {
  if (isDefault) {
    if (start && end && !(new Date(start) < new Date(end))) return 'endBeforeStart';
    return null;
  }
  if (!start || !end) return 'required';
  if (!(new Date(start) < new Date(end))) return 'endBeforeStart';
  return null;
}
