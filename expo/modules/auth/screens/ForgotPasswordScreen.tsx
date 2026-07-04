import {useAuth} from '@core/contexts/AuthContext';
import {usePreferences} from '@core/contexts/PreferencesContext';
import {useRouter} from 'expo-router';
import {ArrowLeft, KeyRound, Mail} from 'lucide-react-native';
import {useState} from 'react';
import {FONTS} from '@shared/constants/typography';
import {MAX_FORM_WIDTH} from '@shared/constants/layout';
import {
    ActivityIndicator,
    Alert,
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

export default function ForgotPasswordScreen() {
  const { colors } = usePreferences();
  const { resetPassword } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleResetPassword = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    setIsLoading(true);
    try {
      const success = await resetPassword(email);
      if (success) {
        setEmailSent(true);
        Alert.alert(
          'Success',
          'Password reset instructions have been sent to your email',
          [
            {
              text: 'OK',
              onPress: () => router.back(),
            },
          ]
        );
      } else {
        Alert.alert('Error', 'Failed to send reset email');
      }
    } catch (error) {
      Alert.alert('Error', 'An error occurred while resetting password');
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
      padding: 24,
      width: '100%',
      maxWidth: MAX_FORM_WIDTH,
      alignSelf: 'center',
    },
    backButton: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 32,
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
      fontFamily: FONTS.display,
      color: colors.text,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
      paddingHorizontal: 20,
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
    resetButton: {
      backgroundColor: colors.primary,
      height: 52,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      marginTop: 24,
    },
    resetButtonDisabled: {
      opacity: 0.6,
    },
    resetButtonText: {
      fontSize: 16,
      fontWeight: '700' as const,
      color: colors.onAccent,
      marginLeft: 8,
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
            style={styles.backButton}
            onPress={() => router.back()}
            disabled={isLoading}
          >
            <ArrowLeft size={20} color={colors.primary} />
            <Text style={styles.backButtonText}>Back to Login</Text>
          </TouchableOpacity>

          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <KeyRound size={40} color="#FFFFFF" />
            </View>
            <Text style={styles.title}>Forgot Password?</Text>
            <Text style={styles.subtitle}>
              Enter your email address and we'll send you instructions to reset your password
            </Text>
          </View>

          <View style={styles.form}>
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
                  editable={!isLoading && !emailSent}
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.resetButton, (isLoading || emailSent) && styles.resetButtonDisabled]}
              onPress={handleResetPassword}
              disabled={isLoading || emailSent}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <KeyRound size={20} color="#FFFFFF" />
                  <Text style={styles.resetButtonText}>Send Reset Link</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
