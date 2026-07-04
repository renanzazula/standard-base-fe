import {showAlert} from '@shared/utils/alert';
import {useAuth} from '@core/contexts/AuthContext';
import {useAdminConfig} from '@core/contexts/AdminConfigContext';
import {usePreferences} from '@core/contexts/PreferencesContext';
import {useRouter} from 'expo-router';
import {Apple as AppleIcon, Chrome, Lock, Mail, User, UserPlus} from 'lucide-react-native';
import {useState} from 'react';
import {FONTS} from '@shared/constants/typography';
import {MAX_FORM_WIDTH} from '@shared/constants/layout';
import {ApiError} from '@core/services/api';
import {
  ActivityIndicator,
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

export default function SignUpScreen() {
  const { colors } = usePreferences();
  const { config } = useAdminConfig();
  const { signUp, loginWithGoogle, loginWithApple } = useAuth();
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSignUp = async () => {
    if (!name || !email || !password || !confirmPassword) {
      showAlert('Error', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      showAlert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 8) {
      showAlert('Error', 'Password must be at least 8 characters');
      return;
    }

    setIsLoading(true);
    try {
      const success = await signUp(email, password, name, 'manual');
      if (success) {
        router.replace('/(tabs)/home');
      } else {
        showAlert('Sign Up Failed', 'Unable to create account');
      }
    } catch (error) {
      if (error instanceof ApiError) {
        showAlert('Sign Up Failed', error.message);
      } else {
        showAlert('Error', 'An error occurred during sign up');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setIsLoading(true);
    try {
      const success = await loginWithGoogle();
      if (success) {
        router.replace('/(tabs)/home');
      } else {
        showAlert('Sign Up Failed', 'Google sign up failed');
      }
    } catch (error) {
      if (error instanceof ApiError) {
        showAlert('Sign Up Failed', error.message);
      } else {
        showAlert('Error', error instanceof Error ? error.message : 'An error occurred during Google sign up');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAppleSignUp = async () => {
    setIsLoading(true);
    try {
      const success = await loginWithApple();
      if (success) {
        router.replace('/(tabs)/home');
      } else {
        showAlert('Sign Up Failed', 'Apple sign up failed');
      }
    } catch (error) {
      if (error instanceof ApiError) {
        showAlert('Sign Up Failed', error.message);
      } else {
        showAlert('Error', error instanceof Error ? error.message : 'An error occurred during Apple sign up');
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
      width: '100%',
      maxWidth: MAX_FORM_WIDTH,
      alignSelf: 'center',
    },
    header: {
      alignItems: 'center',
      marginBottom: 40,
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
      fontFamily: FONTS.display,
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
    signUpButton: {
      backgroundColor: colors.primary,
      height: 52,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      marginTop: 24,
    },
    signUpButtonDisabled: {
      opacity: 0.6,
    },
    signUpButtonText: {
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
      backgroundColor: colors.border,
    },
    dividerText: {
      marginHorizontal: 16,
      fontSize: 14,
      color: colors.textSecondary,
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
      color: colors.textSecondary,
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
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <UserPlus size={40} color="#FFFFFF" />
            </View>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Sign up to get started</Text>
          </View>

          {config.enabledAuthMethods.manual && (
            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Full Name</Text>
                <View style={styles.inputWrapper}>
                  <User size={20} color={colors.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your full name"
                    placeholderTextColor={colors.textSecondary}
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                    editable={!isLoading}
                  />
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Email</Text>
                <View style={styles.inputWrapper}>
                  <Mail size={20} color={colors.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your email"
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
                <Text style={styles.label}>Password</Text>
                <View style={styles.inputWrapper}>
                  <Lock size={20} color={colors.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Create a password"
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

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Confirm Password</Text>
                <View style={styles.inputWrapper}>
                  <Lock size={20} color={colors.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Confirm your password"
                    placeholderTextColor={colors.textSecondary}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!isLoading}
                  />
                </View>
              </View>

              <TouchableOpacity
                style={[styles.signUpButton, isLoading && styles.signUpButtonDisabled]}
                onPress={handleSignUp}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <UserPlus size={20} color="#FFFFFF" />
                    <Text style={styles.signUpButtonText}>Create Account</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}

          {showSocialButtons && config.enabledAuthMethods.manual && (
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>
          )}

          {showSocialButtons && (
            <View style={styles.socialButtons}>
              {config.enabledAuthMethods.google && (
                <TouchableOpacity
                  style={styles.socialButton}
                  onPress={handleGoogleSignUp}
                  disabled={isLoading}
                >
                  <Chrome size={20} color={colors.text} />
                  <Text style={styles.socialButtonText}>Continue with Google</Text>
                </TouchableOpacity>
              )}

              {config.enabledAuthMethods.apple && (
                <TouchableOpacity
                  style={styles.socialButton}
                  onPress={handleAppleSignUp}
                  disabled={isLoading}
                >
                  <AppleIcon size={20} color={colors.text} />
                  <Text style={styles.socialButtonText}>Continue with Apple</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account?</Text>
            <TouchableOpacity onPress={() => router.back()} disabled={isLoading}>
              <Text style={styles.footerLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
