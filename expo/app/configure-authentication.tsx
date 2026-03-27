import { useAdminConfig } from '@/contexts/AdminConfigContext';
import { usePreferences } from '@/contexts/PreferencesContext';
import { Stack } from 'expo-router';
import { Chrome, Apple, Mail } from 'lucide-react-native';
import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity } from 'react-native';

export default function ConfigureAuthenticationScreen() {
  const { colors } = usePreferences();
  const { config, toggleAuthMethod, setServiceMode } = useAdminConfig();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      padding: 20,
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
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    settingRowLast: {
      borderBottomWidth: 0,
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
    modeButtons: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 12,
    },
    modeButton: {
      flex: 1,
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      alignItems: 'center',
    },
    modeButtonActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    modeButtonText: {
      fontSize: 14,
      fontWeight: '600' as const,
      color: colors.text,
    },
    modeButtonTextActive: {
      color: '#FFFFFF',
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

              {config.enabledAuthMethods.google && (
                <View style={[styles.settingRow, styles.settingRowLast]}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.settingLabel}>Service Mode</Text>
                    <View style={styles.modeButtons}>
                      <TouchableOpacity
                        style={[
                          styles.modeButton,
                          config.serviceModes.google === 'mock' && styles.modeButtonActive,
                        ]}
                        onPress={() => setServiceMode('google', 'mock')}
                        testID="google-mode-mock"
                      >
                        <Text
                          style={[
                            styles.modeButtonText,
                            config.serviceModes.google === 'mock' && styles.modeButtonTextActive,
                          ]}
                        >
                          Mock
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.modeButton,
                          config.serviceModes.google === 'real' && styles.modeButtonActive,
                        ]}
                        onPress={() => setServiceMode('google', 'real')}
                        testID="google-mode-real"
                      >
                        <Text
                          style={[
                            styles.modeButtonText,
                            config.serviceModes.google === 'real' && styles.modeButtonTextActive,
                          ]}
                        >
                          Real
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              )}
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

              {config.enabledAuthMethods.apple && (
                <View style={[styles.settingRow, styles.settingRowLast]}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.settingLabel}>Service Mode</Text>
                    <View style={styles.modeButtons}>
                      <TouchableOpacity
                        style={[
                          styles.modeButton,
                          config.serviceModes.apple === 'mock' && styles.modeButtonActive,
                        ]}
                        onPress={() => setServiceMode('apple', 'mock')}
                        testID="apple-mode-mock"
                      >
                        <Text
                          style={[
                            styles.modeButtonText,
                            config.serviceModes.apple === 'mock' && styles.modeButtonTextActive,
                          ]}
                        >
                          Mock
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.modeButton,
                          config.serviceModes.apple === 'real' && styles.modeButtonActive,
                        ]}
                        onPress={() => setServiceMode('apple', 'real')}
                        testID="apple-mode-real"
                      >
                        <Text
                          style={[
                            styles.modeButtonText,
                            config.serviceModes.apple === 'real' && styles.modeButtonTextActive,
                          ]}
                        >
                          Real
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              )}
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

              {config.enabledAuthMethods.manual && (
                <View style={[styles.settingRow, styles.settingRowLast]}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.settingLabel}>Service Mode</Text>
                    <View style={styles.modeButtons}>
                      <TouchableOpacity
                        style={[
                          styles.modeButton,
                          config.serviceModes.manual === 'mock' && styles.modeButtonActive,
                        ]}
                        onPress={() => setServiceMode('manual', 'mock')}
                        testID="manual-mode-mock"
                      >
                        <Text
                          style={[
                            styles.modeButtonText,
                            config.serviceModes.manual === 'mock' && styles.modeButtonTextActive,
                          ]}
                        >
                          Mock
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.modeButton,
                          config.serviceModes.manual === 'real' && styles.modeButtonActive,
                        ]}
                        onPress={() => setServiceMode('manual', 'real')}
                        testID="manual-mode-real"
                      >
                        <Text
                          style={[
                            styles.modeButtonText,
                            config.serviceModes.manual === 'real' && styles.modeButtonTextActive,
                          ]}
                        >
                          Real
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              )}
            </View>

            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                <Text style={{ fontWeight: '700' as const }}>Authentication Methods:</Text>{' '}
                Enable or disable different authentication methods for your app. Each method can be configured to use mock data for testing or real services for production. At least one authentication method must remain enabled.
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </>
  );
}
