import type {ReactNode} from 'react';
import {ImageBackground, StyleSheet, View} from 'react-native';
import {type BackgroundVariant, useLoginBackground} from '@shared/utils/getLoginBackground';

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
  const source = useLoginBackground(variant);

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
