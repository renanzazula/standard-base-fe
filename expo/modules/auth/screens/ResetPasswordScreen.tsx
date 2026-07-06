import {showAlert} from '@shared/utils/alert';
import {usePreferences} from '@core/contexts/PreferencesContext';
import * as authApi from '@core/services/auth';
import {useLocalSearchParams, useRouter} from 'expo-router';
import {ArrowLeft, Eye, EyeOff, KeyRound} from 'lucide-react-native';
import {useState} from 'react';
import {FONTS} from '@shared/constants/typography';
import {MAX_FORM_WIDTH} from '@shared/constants/layout';
import {useIsMobileWeb} from '@shared/hooks/useIsMobileWeb';
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

export default function ResetPasswordScreen() {
  const { colors } = usePreferences();
  const router = useRouter();
  const { token } = useLocalSearchParams<{ token: string }>();
  const isMobileWeb = useIsMobileWeb();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!token) {
      showAlert('Error', 'Reset token is missing. Please use the link from your email.');
      return;
    }
    if (!newPassword || newPassword.length < 8) {
      showAlert('Error', 'Password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      showAlert('Error', 'Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      await authApi.confirmPasswordReset(token, newPassword);
      showAlert('Success', 'Your password has been reset. You can now sign in with your new password.', [
        { text: 'Sign In', onPress: () => router.replace('/login') },
      ]);
    } catch {
      showAlert('Error', 'The reset link is invalid or has expired. Please request a new one.');
    } finally {
      setIsLoading(false);
    }
  };

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scrollContent: { flexGrow: 1, padding: 24, width: '100%', maxWidth: MAX_FORM_WIDTH, alignSelf: 'center' },
    // Phone-sized browsers: full-width card with tighter padding.
    scrollContentMobileWeb: { maxWidth: '100%', paddingHorizontal: 16 },
    backButton: { flexDirection: 'row', alignItems: 'center', marginBottom: 32 },
    backButtonText: { fontSize: 16, color: colors.primary, fontWeight: '600' as const, marginLeft: 8 },
    header: { alignItems: 'center', marginBottom: 48 },
    iconContainer: {
      width: 80, height: 80, borderRadius: 40,
      backgroundColor: colors.primary,
      alignItems: 'center', justifyContent: 'center', marginBottom: 16,
    },
    title: { fontSize: 32, fontFamily: FONTS.display, color: colors.text, marginBottom: 8 },
    subtitle: { fontSize: 16, color: colors.textSecondary, textAlign: 'center', paddingHorizontal: 20 },
    inputContainer: { marginBottom: 16 },
    label: { fontSize: 14, fontWeight: '600' as const, color: colors.text, marginBottom: 8 },
    inputWrapper: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: colors.surface, borderRadius: 12,
      borderWidth: 1, borderColor: colors.border, paddingHorizontal: 16,
    },
    input: { flex: 1, height: 52, fontSize: 16, color: colors.text },
    eyeButton: { padding: 4 },
    submitButton: {
      backgroundColor: colors.primary, height: 52, borderRadius: 12,
      alignItems: 'center', justifyContent: 'center',
      flexDirection: 'row', marginTop: 24,
    },
    submitButtonDisabled: { opacity: 0.6 },
    submitButtonText: { fontSize: 16, fontWeight: '700' as const, color: colors.onAccent, marginLeft: 8 },
  });

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={[styles.scrollContent, isMobileWeb && styles.scrollContentMobileWeb]} keyboardShouldPersistTaps="handled">
          <TouchableOpacity style={styles.backButton} onPress={() => router.replace('/login')} disabled={isLoading}>
            <ArrowLeft size={20} color={colors.primary} />
            <Text style={styles.backButtonText}>Back to Login</Text>
          </TouchableOpacity>

          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <KeyRound size={40} color="#FFFFFF" />
            </View>
            <Text style={styles.title}>Set New Password</Text>
            <Text style={styles.subtitle}>
              Enter your new password below. It must be at least 8 characters.
            </Text>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>New Password</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Enter new password"
                placeholderTextColor={colors.textSecondary}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
              />
              <TouchableOpacity style={styles.eyeButton} onPress={() => setShowPassword((v) => !v)}>
                {showPassword
                  ? <EyeOff size={20} color={colors.textSecondary} />
                  : <Eye size={20} color={colors.textSecondary} />}
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Confirm Password</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Confirm new password"
                placeholderTextColor={colors.textSecondary}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirm}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
              />
              <TouchableOpacity style={styles.eyeButton} onPress={() => setShowConfirm((v) => !v)}>
                {showConfirm
                  ? <EyeOff size={20} color={colors.textSecondary} />
                  : <Eye size={20} color={colors.textSecondary} />}
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <KeyRound size={20} color="#FFFFFF" />
                <Text style={styles.submitButtonText}>Reset Password</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
