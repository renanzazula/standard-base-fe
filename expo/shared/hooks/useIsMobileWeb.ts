import {Platform, useWindowDimensions} from 'react-native';
import {MOBILE_WEB_MAX_WIDTH} from '@shared/constants/layout';

// True when running in a phone-sized web browser (mobile Safari/Chrome or a
// narrow desktop window). Always false on native so native layouts are
// untouched — native phones get the platform's own responsive behavior.
export function useIsMobileWeb(): boolean {
  const { width } = useWindowDimensions();
  return Platform.OS === 'web' && width <= MOBILE_WEB_MAX_WIDTH;
}
