import { useAuth } from '@/contexts/AuthContext';
import { usePreferences } from '@/contexts/PreferencesContext';
import { useRouter } from 'expo-router';
import { LogIn, Mail, Lock, ArrowLeft } from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LoginScreen() {
  const { colors } = usePreferences();
  const { loginWithCredentials } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert(t('common.error'), t('auth.enterEmailAndPassword'));
      return;
    }

    setIsLoading(true);
    try {
      const success = await loginWithCredentials(email, password);
      if (success) {
        router.replace('/(tabs)/home');
      } else {
        Alert.alert(t('auth.loginFailed'), t('auth.invalidCredentials'));
      }
    } catch (error) {
      if (error instanceof Error && error.message === 'User account is disabled') {
        Alert.alert(t('common.error'), 'Your account has been disabled. Please contact support.');
      } else {
        Alert.alert(t('common.error'), t('auth.loginError'));
      }
    } finally {
      setIsLoading(false);
    }
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
    backButton: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 32,
      alignSelf: 'flex-start',
    },
    backButtonText: {
      fontSize: 16,
      color: colors.primary,
      fontWeight: '600' as const,
      marginLeft: 8,
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
      color: colors.text,
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
      color: '#FFFFFF',
      marginLeft: 8,
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginTop: 32,
    },
    footerText: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    footerLink: {
      fontSize: 14,
      color: colors.primary,
      fontWeight: '600' as const,
      marginLeft: 4,
    },
    debugInfo: {
      marginTop: 24,
      padding: 16,
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    debugTitle: {
      fontSize: 14,
      fontWeight: '700' as const,
      color: colors.text,
      marginBottom: 8,
    },
    debugText: {
      fontSize: 12,
      color: colors.textSecondary,
      lineHeight: 18,
    },
  });

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableOpacity
            testID="login-back-button"
            style={styles.backButton}
            onPress={() => router.back()}
            disabled={isLoading}
          >
            <ArrowLeft size={20} color={colors.primary} />
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>

          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <LogIn size={40} color="#FFFFFF" />
            </View>
            <Text style={styles.title}>{t('auth.welcomeBack')}</Text>
            <Text style={styles.subtitle}>Sign in with your email</Text>
          </View>

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

          <View style={styles.footer}>
            <Text style={styles.footerText}>{t('auth.dontHaveAccount')}</Text>
            <TouchableOpacity testID="login-signup-link" onPress={() => router.push('/signup')} disabled={isLoading}>
              <Text style={styles.footerLink}>{t('auth.signup')}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.debugInfo}>
            <Text style={styles.debugTitle}>{t('auth.testCredentials')}</Text>
            <Text style={styles.debugText}>
              {t('auth.standardUser')}:{'\n'}
              {t('auth.email')}: user@example.com{'\n'}
              {t('auth.password')}: password123{'\n\n'}
              {t('auth.adminUser')}:{'\n'}
              {t('auth.email')}: admin@example.com{'\n'}
              {t('auth.password')}: admin123
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
