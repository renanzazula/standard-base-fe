import {useAdminConfig} from '@core/contexts/AdminConfigContext';
import {usePreferences} from '@core/contexts/PreferencesContext';
import {MAX_CONTENT_WIDTH} from '@shared/constants/layout';
import {Stack} from 'expo-router';
import {Apple, Chrome, Mail} from 'lucide-react-native';
import {ScrollView, StyleSheet, Switch, Text, View} from 'react-native';

export default function ConfigureAuthScreen() {
  const { colors } = usePreferences();
  const { config, toggleAuthMethod } = useAdminConfig();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      padding: 20,
      width: '100%',
      maxWidth: MAX_CONTENT_WIDTH,
      alignSelf: 'center',
    },
    section: {
      marginBottom: 32,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: '700' as const,
      color: colors.text,
      marginBottom: 16,
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 20,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    cardIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: '700' as const,
      color: colors.text,
    },
    settingRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
    },
    settingLabel: {
      fontSize: 14,
      fontWeight: '600' as const,
      color: colors.text,
    },
    settingDescription: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 2,
    },
    infoBox: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginTop: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    infoText: {
      fontSize: 13,
      color: colors.textSecondary,
      lineHeight: 20,
    },
  });

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Configure Authentication',
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.text,
        }}
      />
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Authentication Methods</Text>

            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardIcon}>
                  <Chrome size={20} color={colors.text} />
                </View>
                <Text style={styles.cardTitle}>Google Authentication</Text>
              </View>

              <View style={styles.settingRow}>
                <View>
                  <Text style={styles.settingLabel}>Enable Google Login</Text>
                  <Text style={styles.settingDescription}>
                    Allow users to sign in with Google
                  </Text>
                </View>
                <Switch
                  value={config.enabledAuthMethods.google}
                  onValueChange={() => toggleAuthMethod('google')}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor="#FFFFFF"
                  testID="google-auth-toggle"
                />
              </View>
            </View>

            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardIcon}>
                  <Apple size={20} color={colors.text} />
                </View>
                <Text style={styles.cardTitle}>Apple Authentication</Text>
              </View>

              <View style={styles.settingRow}>
                <View>
                  <Text style={styles.settingLabel}>Enable Apple Login</Text>
                  <Text style={styles.settingDescription}>Allow users to sign in with Apple</Text>
                </View>
                <Switch
                  value={config.enabledAuthMethods.apple}
                  onValueChange={() => toggleAuthMethod('apple')}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor="#FFFFFF"
                  testID="apple-auth-toggle"
                />
              </View>
            </View>

            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardIcon}>
                  <Mail size={20} color={colors.text} />
                </View>
                <Text style={styles.cardTitle}>Manual Registration</Text>
              </View>

              <View style={styles.settingRow}>
                <View>
                  <Text style={styles.settingLabel}>Enable Email/Password</Text>
                  <Text style={styles.settingDescription}>
                    Allow manual registration with email
                  </Text>
                </View>
                <Switch
                  value={config.enabledAuthMethods.manual}
                  onValueChange={() => toggleAuthMethod('manual')}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor="#FFFFFF"
                  testID="manual-auth-toggle"
                />
              </View>
            </View>

            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                <Text style={{ fontWeight: '700' as const }}>Authentication Methods:</Text>{' '}
                Enable or disable different authentication methods for your app. At least one authentication method must remain enabled.
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </>
  );
}
