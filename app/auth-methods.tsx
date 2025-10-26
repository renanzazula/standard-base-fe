import { useAuth } from '@/contexts/AuthContext';
import { useAdminConfig } from '@/contexts/AdminConfigContext';
import { usePreferences } from '@/contexts/PreferencesContext';
import { useRouter } from 'expo-router';
import { useTranslation } from '@/hooks/useTranslation';
import { LogIn, Mail, Chrome, Apple as AppleIcon, Shield } from 'lucide-react-native';
import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AuthMethodsScreen() {
  const { colors } = usePreferences();
  const { config } = useAdminConfig();
  const { loginWithGoogle, loginWithApple } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      const success = await loginWithGoogle();
      if (success) {
        router.replace('/(tabs)/home');
      } else {
        Alert.alert(t('auth.loginFailed'), 'Google login failed');
      }
    } catch (error) {
      if (error instanceof Error && error.message === 'User account is disabled') {
        Alert.alert(t('common.error'), 'Your account has been disabled. Please contact support.');
      } else {
        Alert.alert(t('common.error'), 'An error occurred during Google login');
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
        Alert.alert(t('auth.loginFailed'), 'Apple login failed');
      }
    } catch (error) {
      if (error instanceof Error && error.message === 'User account is disabled') {
        Alert.alert(t('common.error'), 'Your account has been disabled. Please contact support.');
      } else {
        Alert.alert(t('common.error'), 'An error occurred during Apple login');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailAuth = () => {
    router.push('/login');
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      flexGrow: 1,
      justifyContent: 'center',
      padding: 24,
    },
    header: {
      alignItems: 'center',
      marginBottom: 48,
    },
    iconContainer: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },
    title: {
      fontSize: 32,
      fontWeight: '700' as const,
      color: colors.text,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
      paddingHorizontal: 20,
    },
    methodsContainer: {
      gap: 16,
      marginBottom: 32,
    },
    methodButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      height: 60,
      borderRadius: 16,
      borderWidth: 2,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      paddingHorizontal: 20,
    },
    methodButtonPrimary: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    methodButtonContent: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      justifyContent: 'center',
    },
    methodIcon: {
      marginRight: 12,
    },
    methodButtonText: {
      fontSize: 17,
      fontWeight: '600' as const,
      color: colors.text,
    },
    methodButtonTextPrimary: {
      color: '#FFFFFF',
    },
    divider: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: 24,
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: colors.border,
    },
    dividerText: {
      marginHorizontal: 16,
      fontSize: 14,
      color: colors.textSecondary,
      fontWeight: '500' as const,
    },
    footer: {
      alignItems: 'center',
    },
    footerText: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
    },
    securityBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface,
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: 8,
      marginTop: 24,
      borderWidth: 1,
      borderColor: colors.border,
    },
    securityText: {
      fontSize: 13,
      color: colors.textSecondary,
      marginLeft: 6,
      fontWeight: '500' as const,
    },
  });

  const hasManualAuth = config.enabledAuthMethods.manual;
  const hasGoogleAuth = config.enabledAuthMethods.google;
  const hasAppleAuth = config.enabledAuthMethods.apple;
  const hasSocialAuth = hasGoogleAuth || hasAppleAuth;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <LogIn size={40} color="#FFFFFF" />
          </View>
          <Text style={styles.title}>{t('auth.welcomeBack')}</Text>
          <Text style={styles.subtitle}>Choose your preferred sign-in method</Text>
        </View>

        <View style={styles.methodsContainer}>
          {hasManualAuth && (
            <TouchableOpacity
              testID="auth-method-email"
              style={[styles.methodButton, styles.methodButtonPrimary]}
              onPress={handleEmailAuth}
              disabled={isLoading}
            >
              <View style={styles.methodButtonContent}>
                <Mail size={24} color="#FFFFFF" style={styles.methodIcon} />
                <Text style={[styles.methodButtonText, styles.methodButtonTextPrimary]}>
                  Continue with Email
                </Text>
              </View>
            </TouchableOpacity>
          )}

          {hasSocialAuth && hasManualAuth && (
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>{t('common.or')}</Text>
              <View style={styles.dividerLine} />
            </View>
          )}

          {hasGoogleAuth && (
            <TouchableOpacity
              testID="auth-method-google"
              style={styles.methodButton}
              onPress={handleGoogleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={colors.primary} />
              ) : (
                <View style={styles.methodButtonContent}>
                  <Chrome size={24} color={colors.text} style={styles.methodIcon} />
                  <Text style={styles.methodButtonText}>{t('auth.continueWithGoogle')}</Text>
                </View>
              )}
            </TouchableOpacity>
          )}

          {hasAppleAuth && (
            <TouchableOpacity
              testID="auth-method-apple"
              style={styles.methodButton}
              onPress={handleAppleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={colors.primary} />
              ) : (
                <View style={styles.methodButtonContent}>
                  <AppleIcon size={24} color={colors.text} style={styles.methodIcon} />
                  <Text style={styles.methodButtonText}>{t('auth.continueWithApple')}</Text>
                </View>
              )}
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.footer}>
          <View style={styles.securityBadge}>
            <Shield size={16} color={colors.primary} />
            <Text style={styles.securityText}>Secure authentication</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
