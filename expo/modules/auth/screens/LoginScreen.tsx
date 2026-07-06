import {showAlert} from '@shared/utils/alert';
import {useAuth} from '@core/contexts/AuthContext';
import {useAdminConfig} from '@core/contexts/AdminConfigContext';
import {usePreferences} from '@core/contexts/PreferencesContext';
import {useRouter} from 'expo-router';
import {Apple as AppleIcon, Chrome, Lock, LogIn, Mail, UserRound} from 'lucide-react-native';
import {useState} from 'react';
import {useTranslation} from '@shared/hooks/useTranslation';
import {FONTS} from '@shared/constants/typography';
import {MAX_FORM_WIDTH} from '@shared/constants/layout';
import {useIsMobileWeb} from '@shared/hooks/useIsMobileWeb';
import {ApiError} from '@core/services/api';
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

export default function LoginScreen() {
  const { colors } = usePreferences();
  const { config } = useAdminConfig();
  const { loginWithCredentials, loginAsGuest, loginWithGoogle, loginWithApple } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();
  const isMobileWeb = useIsMobileWeb();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      showAlert(t('common.error'), t('auth.enterEmailAndPassword'));
      return;
    }

    setIsLoading(true);
    try {
      const success = await loginWithCredentials(email, password);
      if (success) {
        router.replace('/(tabs)/home');
      } else {
        showAlert(t('auth.loginFailed'), t('auth.invalidCredentials'));
      }
    } catch (error) {
      if (error instanceof ApiError) {
        showAlert(t('auth.loginFailed'), error.message);
      } else if (error instanceof Error && error.message === 'User account is disabled') {
        showAlert(t('common.error'), 'Your account has been disabled. Please contact support.');
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

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      const success = await loginWithGoogle();
      if (success) {
        router.replace('/(tabs)/home');
      } else {
        showAlert(t('auth.loginFailed'), 'Google login failed');
      }
    } catch (error) {
      if (error instanceof ApiError) {
        showAlert(t('auth.loginFailed'), error.message);
      } else if (error instanceof Error && error.message === 'User account is disabled') {
        showAlert(t('common.error'), 'Your account has been disabled. Please contact support.');
      } else {
        showAlert(t('common.error'), error instanceof Error ? error.message : 'An error occurred during Google login');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAppleLogin = async () => {
    setIsLoading(true);
    try {
      const success = await loginWithApple();
      if (success) {
        router.replace('/(tabs)/home');
      } else {
        showAlert(t('auth.loginFailed'), 'Apple login failed');
      }
    } catch (error) {
      if (error instanceof ApiError) {
        showAlert(t('auth.loginFailed'), error.message);
      } else if (error instanceof Error && error.message === 'User account is disabled') {
        showAlert(t('common.error'), 'Your account has been disabled. Please contact support.');
      } else {
        showAlert(t('common.error'), error instanceof Error ? error.message : 'An error occurred during Apple login');
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
      marginBottom: 48,
    },
    headerMobileWeb: {
      marginBottom: 32,
    },
    logo: {
      width: 340,
      maxWidth: '100%',
      height: 227,
      marginBottom: 8,
    },
    logoMobileWeb: {
      width: 240,
      height: 160,
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
    form: {
      marginBottom: 24,
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
      marginVertical: 32,
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
    socialButtons: {
      gap: 12,
    },
    socialButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      height: 52,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    socialButtonText: {
      fontSize: 16,
      fontWeight: '600' as const,
      color: colors.text,
      marginLeft: 12,
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginTop: 32,
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

  const showSocialButtons =
    config.enabledAuthMethods.google || config.enabledAuthMethods.apple;

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
          <View style={[styles.header, isMobileWeb && styles.headerMobileWeb]}>
            <Image
              source={require('@/assets/images/logo.png')}
              style={[styles.logo, isMobileWeb && styles.logoMobileWeb]}
              resizeMode="contain"
            />
            <Text style={styles.title}>{t('auth.welcomeBack')}</Text>
            <Text style={styles.subtitle}>{t('auth.signInToContinue')}</Text>
          </View>

          {config.enabledAuthMethods.manual && (
            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>{t('auth.email')}</Text>
                <View style={styles.inputWrapper}>
                  <Mail size={20} color={colors.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    testID="login-email-input"
                    style={styles.input}
                    placeholder={t('auth.enterEmail')}
                    placeholderTextColor={colors.textSecondary}
                    value={email}
                    onChangeText={setEmail}
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
                  />
                </View>
              </View>

              <TouchableOpacity
                testID="login-forgot-password-link"
                style={styles.forgotPassword}
                onPress={() => router.push('/forgot-password')}
                disabled={isLoading}
              >
                <Text style={styles.forgotPasswordText}>{t('auth.forgotPassword')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                testID="login-submit-button"
                style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
                onPress={handleLogin}
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
          )}

          {config.enabledAuthMethods.manual && (
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>{t('common.or')}</Text>
              <View style={styles.dividerLine} />
            </View>
          )}

          {showSocialButtons && (
            <View style={styles.socialButtons}>
              {config.enabledAuthMethods.google && (
                <TouchableOpacity
                  testID="login-google-button"
                  style={styles.socialButton}
                  onPress={handleGoogleLogin}
                  disabled={isLoading}
                >
                  <Chrome size={20} color={colors.text} />
                  <Text style={styles.socialButtonText}>{t('auth.continueWithGoogle')}</Text>
                </TouchableOpacity>
              )}

              {config.enabledAuthMethods.apple && (
                <TouchableOpacity
                  testID="login-apple-button"
                  style={styles.socialButton}
                  onPress={handleAppleLogin}
                  disabled={isLoading}
                >
                  <AppleIcon size={20} color={colors.text} />
                  <Text style={styles.socialButtonText}>{t('auth.continueWithApple')}</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {config.enabledAuthMethods.guest && (
            <View style={[styles.socialButtons, showSocialButtons && { marginTop: 12 }]}>
              <TouchableOpacity
                testID="login-guest-button"
                style={styles.socialButton}
                onPress={handleGuestLogin}
                disabled={isLoading}
              >
                <UserRound size={20} color={colors.text} />
                <Text style={styles.socialButtonText}>{t('auth.enterAsGuest')}</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.footer}>
            <Text style={styles.footerText}>{t('auth.dontHaveAccount')}</Text>
            <TouchableOpacity testID="login-signup-link" onPress={() => router.push('/signup')} disabled={isLoading}>
              <Text style={styles.footerLink}>{t('auth.signup')}</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </BrandedBackground>
  );
}
