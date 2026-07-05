import type {ImageSourcePropType} from 'react-native';
import {PixelRatio, useWindowDimensions} from 'react-native';

export type BackgroundVariant = 'skyline' | 'brick';

// Native only bundles the portrait mobile/tablet assets; the desktop
// variants live in getLoginBackground.web.ts so Metro keeps them out of
// the app binary.
const SKYLINE_MOBILE_720 = require('@/assets/backgrounds/login-mobile-720.png');
const SKYLINE_MOBILE_1080 = require('@/assets/backgrounds/login-mobile-1080.png');
const SKYLINE_MOBILE_1440 = require('@/assets/backgrounds/login-mobile-1440.png');
const SKYLINE_TABLET_1536 = require('@/assets/backgrounds/login-tablet-1536.png');
const BRICK_MOBILE_1080 = require('@/assets/backgrounds/login-brick-mobile-1080.png');

export function useLoginBackground(variant: BackgroundVariant = 'skyline'): ImageSourcePropType {
  const { width } = useWindowDimensions();

  if (variant === 'brick') return BRICK_MOBILE_1080;

  const physicalWidth = width * PixelRatio.get();
  if (physicalWidth < 800) return SKYLINE_MOBILE_720;
  if (physicalWidth < 1200) return SKYLINE_MOBILE_1080;
  if (physicalWidth < 1500) return SKYLINE_MOBILE_1440;
  return SKYLINE_TABLET_1536;
}
