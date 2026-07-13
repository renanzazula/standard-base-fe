import {showAlert} from '@shared/utils/alert';
import {useAuth} from '@core/contexts/AuthContext';
import {useAdminConfig} from '@core/contexts/AdminConfigContext';
import {usePreferences} from '@core/contexts/PreferencesContext';
import {useRouter} from 'expo-router';
import {LogIn, UserRound} from 'lucide-react-native';
import {useState} from 'react';
import {useTranslation} from '@shared/hooks/useTranslation';
import {FONTS} from '@shared/constants/typography';
import {MAX_FORM_WIDTH} from '@shared/constants/layout';
import {useIsMobileWeb} from '@shared/hooks/useIsMobileWeb';
import {ApiError} from '@core/services/api';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import BrandedBackground from '@shared/components/BrandedBackground';

/**
 * Entry point into the Keycloak hosted login: the button opens a browser
 * sheet where Keycloak handles credentials, registration, password reset and
 * any enabled social providers. Only guest access remains app-rendered.
 */
export default function LoginScreen() {
  const { colors } = usePreferences();
  const { config } = useAdminConfig();
  const { signIn, loginAsGuest } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();
  const isMobileWeb = useIsMobileWeb();

  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async () => {
    setIsLoading(true);
    try {
      // Dismissing the Keycloak browser sheet returns false — stay on this screen.
      const success = await signIn();
      if (success) {
        router.replace('/(tabs)/home');
      }
    } catch (error) {
      if (error instanceof ApiError) {
        showAlert(t('auth.loginFailed'), error.message);
      } else {
        showAlert(t('common.error'), t('auth.loginError'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setIsLoading(true);
    try {
      const success = await loginAsGuest();
      if (success) {
        router.replace('/(tabs)/home');
      } else {
        showAlert(t('auth.loginFailed'), t('auth.guestLoginError'));
      }
    } catch (error) {
      if (error instanceof ApiError) {
        showAlert(t('auth.loginFailed'), error.message);
      } else {
        showAlert(t('common.error'), t('auth.guestLoginError'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
      justifyContent: 'center',
      padding: 24,
      width: '100%',
      maxWidth: MAX_FORM_WIDTH,
      alignSelf: 'center',
    },
    // Phone-sized browsers: full-width card, top-aligned.
    scrollContentMobileWeb: {
      justifyContent: 'flex-start',
      maxWidth: '100%',
      paddingHorizontal: 16,
      paddingTop: 48,
    },
    header: {
      alignItems: 'center',
      marginBottom: 24,
    },
    logo: {
      width: 260,
      maxWidth: '100%',
      height: 164,
      marginBottom: 0,
    },
    logoMobileWeb: {
      width: 184,
      height: 116,
    },
    title: {
      fontSize: 32,
      fontFamily: FONTS.display,
      color: '#FFFFFF',
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      color: 'rgba(255, 255, 255, 0.75)',
      textAlign: 'center',
    },
    loginButton: {
      backgroundColor: colors.primary,
      height: 52,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      marginTop: 24,
    },
    loginButtonDisabled: {
      opacity: 0.6,
    },
    loginButtonText: {
      fontSize: 16,
      fontWeight: '700' as const,
      color: colors.onAccent,
      marginLeft: 8,
    },
    divider: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: 16,
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: 'rgba(255, 255, 255, 0.3)',
    },
    dividerText: {
      marginHorizontal: 16,
      fontSize: 14,
      color: 'rgba(255, 255, 255, 0.75)',
      fontWeight: '500' as const,
    },
    guestButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      height: 52,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    guestButtonText: {
      fontSize: 16,
      fontWeight: '600' as const,
      color: colors.text,
      marginLeft: 12,
    },
  });

  return (
    <BrandedBackground>
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <ScrollView
          contentContainerStyle={[styles.scrollContent, isMobileWeb && styles.scrollContentMobileWeb]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Image
              source={require('@/assets/images/logo.png')}
              style={[styles.logo, isMobileWeb && styles.logoMobileWeb]}
              resizeMode="contain"
            />
            <Text style={styles.title}>{t('auth.welcomeBack')}</Text>
            <Text style={styles.subtitle}>{t('auth.signInToContinue')}</Text>
          </View>

          <TouchableOpacity
            testID="login-submit-button"
            style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
            onPress={handleSignIn}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <LogIn size={20} color="#FFFFFF" />
                <Text style={styles.loginButtonText}>{t('auth.login')}</Text>
              </>
            )}
          </TouchableOpacity>

          {config.enabledAuthMethods.guest && (
            <>
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>{t('common.or')}</Text>
                <View style={styles.dividerLine} />
              </View>

              <TouchableOpacity
                testID="login-guest-button"
                style={styles.guestButton}
                onPress={handleGuestLogin}
                disabled={isLoading}
              >
                <UserRound size={20} color={colors.text} />
                <Text style={styles.guestButtonText}>{t('auth.enterAsGuest')}</Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </BrandedBackground>
  );
}
