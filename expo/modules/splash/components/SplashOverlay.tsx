import type {SplashScreenConfig} from '@core/services/splash';
import {useTranslation} from '@shared/hooks/useTranslation';
import {Image, Linking, Pressable, StyleSheet, Text, View} from 'react-native';

const FALLBACK_BG = '#1A1A1C';
const FALLBACK_TEXT = '#FFFFFF';

type Props = {
  splash: Pick<
    SplashScreenConfig,
    'title' | 'subtitle' | 'imageUrl' | 'backgroundColor' | 'textColor' | 'buttonLabel' | 'externalUrl'
  >;
  onDismiss: () => void;
};

/**
 * Presentational full-screen splash. Also reused by the admin preview.
 * The action button is hidden unless the external URL is HTTPS (UC01).
 */
export default function SplashOverlay({splash, onDismiss}: Props) {
  const {t} = useTranslation();

  const backgroundColor = splash.backgroundColor || FALLBACK_BG;
  const textColor = splash.textColor || FALLBACK_TEXT;
  const externalUrl = splash.externalUrl?.trim() ?? '';
  const showButton = !!splash.buttonLabel && externalUrl.startsWith('https://');

  const handleAction = () => {
    Linking.openURL(externalUrl).catch(() => {});
  };

  return (
    <View style={[StyleSheet.absoluteFillObject, styles.container, {backgroundColor}]}>
      {splash.imageUrl ? (
        // Full-bleed background: fills every screen size without distortion
        // (cover keeps the aspect ratio, centered by default). The background
        // color remains visible while the image loads and when none is set.
        <Image
          source={{uri: splash.imageUrl}}
          style={StyleSheet.absoluteFillObject}
          resizeMode="cover"
        />
      ) : null}
      <View style={styles.content}>
        <Text style={[styles.title, {color: textColor}]}>{splash.title}</Text>
        {splash.subtitle ? (
          <Text style={[styles.subtitle, {color: textColor}]}>{splash.subtitle}</Text>
        ) : null}
        {showButton ? (
          <Pressable
            style={[styles.actionButton, {borderColor: textColor}]}
            onPress={handleAction}
          >
            <Text style={[styles.actionButtonText, {color: textColor}]}>{splash.buttonLabel}</Text>
          </Pressable>
        ) : null}
      </View>

      <Pressable style={styles.dismissButton} onPress={onDismiss} hitSlop={12}>
        <Text style={[styles.dismissText, {color: textColor}]}>{t('splash.continue')}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    zIndex: 1000,
    elevation: 1000,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 16,
    width: '100%',
    maxWidth: 560,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.85,
  },
  actionButton: {
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 24,
    borderWidth: 1.5,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  dismissButton: {
    position: 'absolute',
    bottom: 48,
    alignSelf: 'center',
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  dismissText: {
    fontSize: 15,
    fontWeight: '600',
    opacity: 0.9,
    textDecorationLine: 'underline',
  },
});
