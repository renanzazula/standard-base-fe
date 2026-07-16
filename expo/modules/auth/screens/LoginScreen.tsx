import {showAlert} from '@shared/utils/alert';
import {useAuth} from '@core/contexts/AuthContext';
import {usePreferences} from '@core/contexts/PreferencesContext';
import {useRouter} from 'expo-router';
import {Lock, LogIn, Mail, UserRound} from 'lucide-react-native';
import {useState} from 'react';
import {useTranslation} from '@shared/hooks/useTranslation';
import {FONTS} from '@shared/constants/typography';
import {MAX_FORM_WIDTH} from '@shared/constants/layout';
import {useIsMobileWeb} from '@shared/hooks/useIsMobileWeb';
import {ApiError} from '@core/services/api';
import {
    isAccountNotSetUp,
    isInvalidCredentials,
    KeycloakAuthError,
    openPasswordReset
} from '@core/services/keycloakAuth';
import {
    ActivityIndicator,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import BrandedBackground from '@shared/components/BrandedBackground';
import ProviderButton from '../components/ProviderButton';

/**
 * Integrated login page: credentials are entered directly in the app and
 * exchanged with Keycloak's token endpoint (Direct Access Grant) — no browser
 * popup. Sign-in method enablement lives in Keycloak (realm settings and
 * identity providers); when a brokered provider (Google, Apple, …) is added
 * there, render its button here via signIn({ idpHint }) — no config flag.
 * Registration and password reset stay on Keycloak's hosted pages.
 */
export default function LoginScreen() {
  const { colors } = usePreferences();
  const { signInWithCredentials, register, loginAsGuest } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();
  const isMobileWeb = useIsMobileWeb();

  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const credentialErrorMessage = (error: unknown): { title: string; message: string } => {
    if (error instanceof KeycloakAuthError) {
      if (/disabled/i.test(error.description ?? '')) {
        return { title: t('common.error'), message: t('auth.accountDisabled') };
      }
      if (isAccountNotSetUp(error)) {
        return { title: t('auth.loginFailed'), message: t('auth.accountNotSetUp') };
      }
      if (isInvalidCredentials(error)) {
        return { title: t('auth.loginFailed'), message: t('auth.invalidCredentials') };
      }
      return { title: t('auth.loginFailed'), message: error.message };
    }
    if (error instanceof ApiError) {
      return { title: t('auth.loginFailed'), message: error.message };
    }
    return { title: t('common.error'), message: t('auth.loginError') };
  };

  const handleCredentialLogin = async () => {
    if (!usernameOrEmail || !password) {
      showAlert(t('common.error'), t('auth.enterEmailAndPassword'));
      return;
    }
    setIsLoading(true);
    try {
      await signInWithCredentials(usernameOrEmail.trim(), password);
      router.replace('/(tabs)/home');
    } catch (error) {
      const { title, message } = credentialErrorMessage(error);
      showAlert(title, message);
    } finally {
      setIsLoading(false);
    }
  };

  /** Browser-sheet flows (providers, hosted-login fallback, registration): dismissing the sheet returns false — stay on this screen. */
  const runBrowserFlow = async (flow: () => Promise<boolean>) => {
    setIsLoading(true);
    try {
      const success = await flow();
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

  const handleForgotPassword = () => {
    // Fire-and-forget: the reset happens on Keycloak's hosted page + email.
    openPasswordReset().catch(() => {});
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
    // Phone-sized browsers: full-width card, top-aligned so the form stays
    // visible when the on-screen keyboard shrinks the viewport.
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
    inputContainer: {
      marginBottom: 16,
    },
    label: {
      fontSize: 14,
      fontWeight: '600' as const,
      color: '#FFFFFF',
      marginBottom: 8,
    },
    inputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 16,
    },
    inputIcon: {
      marginRight: 12,
    },
    input: {
      flex: 1,
      height: 52,
      fontSize: 16,
      color: colors.text,
    },
    forgotPassword: {
      alignSelf: 'flex-end',
      marginTop: 8,
    },
    forgotPasswordText: {
      fontSize: 14,
      color: colors.primary,
      fontWeight: '600' as const,
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
    secondaryButtons: {
      gap: 12,
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginTop: 24,
    },
    footerText: {
      fontSize: 14,
      color: 'rgba(255, 255, 255, 0.75)',
    },
    footerLink: {
      fontSize: 14,
      color: colors.primary,
      fontWeight: '600' as const,
      marginLeft: 4,
    },
  });

  return (
    <BrandedBackground>
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
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

            <View>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>{t('auth.emailOrUsername')}</Text>
                <View style={styles.inputWrapper}>
                  <Mail size={20} color={colors.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    testID="login-email-input"
                    style={styles.input}
                    placeholder={t('auth.enterEmailOrUsername')}
                    placeholderTextColor={colors.textSecondary}
                    value={usernameOrEmail}
                    onChangeText={setUsernameOrEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!isLoading}
                  />
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>{t('auth.password')}</Text>
                <View style={styles.inputWrapper}>
                  <Lock size={20} color={colors.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    testID="login-password-input"
                    style={styles.input}
                    placeholder={t('auth.enterPassword')}
                    placeholderTextColor={colors.textSecondary}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!isLoading}
                    onSubmitEditing={handleCredentialLogin}
                  />
                </View>
              </View>

              <TouchableOpacity
                testID="login-forgot-password-link"
                style={styles.forgotPassword}
                onPress={handleForgotPassword}
                disabled={isLoading}
              >
                <Text style={styles.forgotPasswordText}>{t('auth.forgotPassword')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                testID="login-submit-button"
                style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
                onPress={handleCredentialLogin}
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
            </View>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>{t('common.or')}</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.secondaryButtons}>
              <ProviderButton
                testID="login-guest-button"
                icon={UserRound}
                label={t('auth.enterAsGuest')}
                onPress={handleGuestLogin}
                disabled={isLoading}
              />
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>{t('auth.dontHaveAccount')}</Text>
              <TouchableOpacity
                testID="login-signup-link"
                onPress={() => runBrowserFlow(register)}
                disabled={isLoading}
              >
                <Text style={styles.footerLink}>{t('auth.signup')}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </BrandedBackground>
  );
}
