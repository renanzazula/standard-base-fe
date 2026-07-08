import type {ReactNode} from 'react';
import {ImageBackground, StyleSheet, View} from 'react-native';
import {type BackgroundVariant, useLoginBackground} from '@shared/utils/getLoginBackground';
import {useRemoteLoginBackground} from '@shared/hooks/useRemoteLoginBackground';

type Props = {
  children: ReactNode;
  variant?: BackgroundVariant;
  overlayOpacity?: number;
};

export default function BrandedBackground({
  children,
  variant = 'skyline',
  overlayOpacity = 0.45,
}: Props) {
  const bundled = useLoginBackground(variant);
  // Admin-configured background wins; the bundled asset is the synchronous
  // fallback so the screen never renders blank.
  const remote = useRemoteLoginBackground();
  const source = remote ? {uri: remote} : bundled;

  return (
    <ImageBackground source={source} style={styles.background} resizeMode="cover">
      <View style={[styles.overlay, { backgroundColor: `rgba(0, 0, 0, ${overlayOpacity})` }]}>
        {children}
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: '#000000',
  },
  overlay: {
    flex: 1,
  },
});
