import type {ImageSourcePropType} from 'react-native';
import {useWindowDimensions} from 'react-native';
import {MOBILE_WEB_MAX_WIDTH} from '@shared/constants/layout';

export type BackgroundVariant = 'skyline' | 'brick';

const SKYLINE_MOBILE_1080 = require('@/assets/backgrounds/login-mobile-1080.png');
const SKYLINE_TABLET_1536 = require('@/assets/backgrounds/login-tablet-1536.png');
const SKYLINE_DESKTOP_1920 = require('@/assets/backgrounds/login-desktop-1920.png');
const SKYLINE_DESKTOP_2560 = require('@/assets/backgrounds/login-desktop-2560.png');
const BRICK_MOBILE_1080 = require('@/assets/backgrounds/login-brick-mobile-1080.png');
const BRICK_DESKTOP_1920 = require('@/assets/backgrounds/login-brick-desktop-1920.png');

export function useLoginBackground(variant: BackgroundVariant = 'skyline'): ImageSourcePropType {
  const { width } = useWindowDimensions();

  if (variant === 'brick') {
    return width <= MOBILE_WEB_MAX_WIDTH ? BRICK_MOBILE_1080 : BRICK_DESKTOP_1920;
  }

  if (width <= MOBILE_WEB_MAX_WIDTH) return SKYLINE_MOBILE_1080;
  if (width <= 1280) return SKYLINE_TABLET_1536;
  if (width <= 1800) return SKYLINE_DESKTOP_1920;
  return SKYLINE_DESKTOP_2560;
}
