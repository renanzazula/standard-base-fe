import {showAlert} from '@shared/utils/alert';
import {useAdminConfig} from '@core/contexts/AdminConfigContext';
import {usePreferences} from '@core/contexts/PreferencesContext';
import {useAuth} from '@core/contexts/AuthContext';
import {AVAILABLE_LANGUAGES, Language} from '@shared/constants/languages';
import {MAX_CONTENT_WIDTH} from '@shared/constants/layout';
import {Stack, useRouter} from 'expo-router';
import {
  Apple,
  ChevronRight,
  Chrome,
  Clock,
  Globe,
  Mail,
  Minus,
  Plus,
  Shield,
  ToggleLeft,
  ToggleRight,
  Trash2
} from 'lucide-react-native';
import {ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View} from 'react-native';

export default function AdminConfigScreen() {
  const { colors } = usePreferences();
  const { config, toggleAuthMethod, updateSessionConfig, toggleLanguageAvailability, setDefaultLanguage } = useAdminConfig();
  const router = useRouter();
  const { user } = useAuth();

  const MIN_SESSION_TIME = 5 * 60 * 1000;
  const MAX_SESSION_TIME = 24 * 60 * 60 * 1000;
  const MIN_IDLE_TIME = 5 * 60 * 1000;
  const MAX_IDLE_TIME = 24 * 60 * 60 * 1000;
  const TIME_STEP = 5 * 60 * 1000;

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
    sessionCard: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 20,
      borderWidth: 1,
      borderColor: colors.border,
    },
    sessionRow: {
      marginBottom: 16,
    },
    sessionLabel: {
      fontSize: 14,
      fontWeight: '600' as const,
      color: colors.text,
      marginBottom: 8,
    },
    sessionValue: {
      fontSize: 24,
      fontWeight: '700' as const,
      color: colors.primary,
    },
    sessionUnit: {
      fontSize: 14,
      color: colors.textSecondary,
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
    timeControl: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 8,
    },
    timeButtons: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    timeButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    timeButtonDisabled: {
      backgroundColor: colors.border,
      opacity: 0.5,
    },
    timeDisplay: {
      minWidth: 100,
      alignItems: 'center',
    },
    languageItemCard: {
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    languageItemCardLast: {
      borderBottomWidth: 0,
    },
    languageHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    languageMainInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      flex: 1,
    },
    languageControls: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    statusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 8,
    },
    statusBadgeEnabled: {
      backgroundColor: '#10B981',
    },
    statusBadgeDisabled: {
      backgroundColor: colors.border,
    },
    statusText: {
      fontSize: 10,
      fontWeight: '600' as const,
      color: colors.onAccent,
    },
    iconButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    languageDetails: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 4,
    },
    detailText: {
      fontSize: 12,
      color: colors.textSecondary,
    },
  });

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) return `${hours} hr`;
    return `${hours}h ${remainingMinutes}m`;
  };

  const adjustTime = (currentTime: number, increment: boolean, min: number, max: number) => {
    const newTime = increment ? currentTime + TIME_STEP : currentTime - TIME_STEP;
    return Math.max(min, Math.min(max, newTime));
  };

  const handleMaxTimeChange = (increment: boolean) => {
    const newMaxTime = adjustTime(config.sessionConfig.maxTime, increment, MIN_SESSION_TIME, MAX_SESSION_TIME);
    updateSessionConfig({ maxTime: newMaxTime });
  };

  const handleIdleTimeChange = (increment: boolean) => {
    const newIdleTime = adjustTime(config.sessionConfig.idleTime, increment, MIN_IDLE_TIME, MAX_IDLE_TIME);
    updateSessionConfig({ idleTime: newIdleTime });
  };

  const handleToggleLanguage = (langCode: Language) => {
    const isCurrentlyEnabled = config.languageConfig.availableLanguages.includes(langCode);

    if (isCurrentlyEnabled) {
      if (config.languageConfig.availableLanguages.length === 1) {
        showAlert(
          'Cannot Disable',
          'At least one language must remain enabled.',
          [{ text: 'OK' }]
        );
        return;
      }

      if (langCode === config.languageConfig.defaultLanguage) {
        showAlert(
          'Cannot Disable',
          'Cannot disable the default language. Please set a different language as default first.',
          [{ text: 'OK' }]
        );
        return;
      }

      showAlert(
        'Disable Language',
        `Are you sure you want to disable ${AVAILABLE_LANGUAGES[langCode].name}? Users will no longer be able to select this language.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Disable',
            style: 'destructive',
            onPress: () => toggleLanguageAvailability(langCode),
          },
        ]
      );
    } else {
      toggleLanguageAvailability(langCode);
    }
  };

  const handleDeleteLanguage = (langCode: Language) => {
    const isCurrentlyEnabled = config.languageConfig.availableLanguages.includes(langCode);

    if (!isCurrentlyEnabled) {
      showAlert(
        'Language Disabled',
        `${AVAILABLE_LANGUAGES[langCode].name} is already disabled. Enable it first if you want to use it again.`,
        [{ text: 'OK' }]
      );
      return;
    }

    if (config.languageConfig.availableLanguages.length === 1) {
      showAlert(
        'Cannot Remove',
        'At least one language must remain enabled.',
        [{ text: 'OK' }]
      );
      return;
    }

    if (langCode === config.languageConfig.defaultLanguage) {
      showAlert(
        'Cannot Remove',
        'Cannot remove the default language. Please set a different language as default first.',
        [{ text: 'OK' }]
      );
      return;
    }

    showAlert(
      'Remove Language',
      `Are you sure you want to remove ${AVAILABLE_LANGUAGES[langCode].name}? This will disable it for all users.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => toggleLanguageAvailability(langCode),
        },
      ]
    );
  };

  const handleSetDefaultLanguage = (langCode: Language) => {
    showAlert(
      'Set Default Language',
      `Set ${AVAILABLE_LANGUAGES[langCode].name} as the default language? This will be used for new users and as a fallback.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Set Default',
          onPress: () => setDefaultLanguage(langCode),
        },
      ]
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Admin Configuration',
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
                />
              </View>

            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Session Configuration</Text>

            <View style={styles.sessionCard}>
              <View style={styles.cardHeader}>
                <View style={styles.cardIcon}>
                  <Clock size={20} color={colors.text} />
                </View>
                <Text style={styles.cardTitle}>Session Timeout Settings</Text>
              </View>

              <View style={styles.sessionRow}>
                <Text style={styles.sessionLabel}>Maximum Session Time</Text>
                <Text style={styles.settingDescription}>
                  Total active session lifetime (5 min - 24 hours)
                </Text>
                <View style={styles.timeControl}>
                  <View style={styles.timeButtons}>
                    <TouchableOpacity
                      style={[
                        styles.timeButton,
                        config.sessionConfig.maxTime <= MIN_SESSION_TIME && styles.timeButtonDisabled,
                      ]}
                      onPress={() => handleMaxTimeChange(false)}
                      disabled={config.sessionConfig.maxTime <= MIN_SESSION_TIME}
                      testID="decrease-max-time"
                    >
                      <Minus size={20} color="#FFFFFF" />
                    </TouchableOpacity>
                    <View style={styles.timeDisplay}>
                      <Text style={styles.sessionValue}>{formatTime(config.sessionConfig.maxTime)}</Text>
                    </View>
                    <TouchableOpacity
                      style={[
                        styles.timeButton,
                        config.sessionConfig.maxTime >= MAX_SESSION_TIME && styles.timeButtonDisabled,
                      ]}
                      onPress={() => handleMaxTimeChange(true)}
                      disabled={config.sessionConfig.maxTime >= MAX_SESSION_TIME}
                      testID="increase-max-time"
                    >
                      <Plus size={20} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              <View style={styles.sessionRow}>
                <Text style={styles.sessionLabel}>Idle Timeout</Text>
                <Text style={styles.settingDescription}>
                  Time of inactivity before auto logout (5 min - 24 hours)
                </Text>
                <View style={styles.timeControl}>
                  <View style={styles.timeButtons}>
                    <TouchableOpacity
                      style={[
                        styles.timeButton,
                        config.sessionConfig.idleTime <= MIN_IDLE_TIME && styles.timeButtonDisabled,
                      ]}
                      onPress={() => handleIdleTimeChange(false)}
                      disabled={config.sessionConfig.idleTime <= MIN_IDLE_TIME}
                      testID="decrease-idle-time"
                    >
                      <Minus size={20} color="#FFFFFF" />
                    </TouchableOpacity>
                    <View style={styles.timeDisplay}>
                      <Text style={styles.sessionValue}>{formatTime(config.sessionConfig.idleTime)}</Text>
                    </View>
                    <TouchableOpacity
                      style={[
                        styles.timeButton,
                        config.sessionConfig.idleTime >= MAX_IDLE_TIME && styles.timeButtonDisabled,
                      ]}
                      onPress={() => handleIdleTimeChange(true)}
                      disabled={config.sessionConfig.idleTime >= MAX_IDLE_TIME}
                      testID="increase-idle-time"
                    >
                      <Plus size={20} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              <View style={[styles.settingRow, styles.settingRowLast]}>
                <View>
                  <Text style={styles.settingLabel}>Auto Refresh Session</Text>
                  <Text style={styles.settingDescription}>
                    Extend session while user is active
                  </Text>
                </View>
                <Switch
                  value={config.sessionConfig.autoRefresh}
                  onValueChange={(value) => updateSessionConfig({ autoRefresh: value })}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor="#FFFFFF"
                  testID="auto-refresh-toggle"
                />
              </View>

              <View style={styles.infoBox}>
                <Text style={styles.infoText}>
                  <Text style={{ fontWeight: '700' as const }}>Session Configuration:</Text>{' '}
                  Controls how long users can remain logged in. The idle timeout triggers when there is no user activity, while the maximum session time is an absolute limit. Use the +/- buttons to adjust in 5-minute increments.
                  {config.sessionConfig.autoRefresh && '\n\nAuto-refresh is enabled: Session will extend automatically while user is active.'}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Language Settings</Text>
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardIcon}>
                  <Globe size={20} color={colors.text} />
                </View>
                <Text style={styles.cardTitle}>Available Languages</Text>
              </View>

              <Text style={[styles.settingDescription, { marginBottom: 12 }]}>
                Select which languages are available to users
              </Text>

              {(Object.keys(AVAILABLE_LANGUAGES) as Language[]).map((langCode, index) => {
                const langInfo = AVAILABLE_LANGUAGES[langCode];
                const isEnabled = config.languageConfig.availableLanguages.includes(langCode);
                const isDefault = config.languageConfig.defaultLanguage === langCode;
                const isLast = index === Object.keys(AVAILABLE_LANGUAGES).length - 1;

                return (
                  <View
                    key={langCode}
                    style={[
                      styles.languageItemCard,
                      isLast && styles.languageItemCardLast,
                    ]}
                  >
                    <View style={styles.languageHeader}>
                      <View style={styles.languageMainInfo}>
                        <View
                          style={[
                            styles.statusBadge,
                            isEnabled ? styles.statusBadgeEnabled : styles.statusBadgeDisabled,
                          ]}
                        >
                          <Text style={styles.statusText}>
                            {isEnabled ? 'Enabled' : 'Disabled'}
                          </Text>
                        </View>
                        <Text style={styles.settingLabel}>
                          {langInfo.flag} {langInfo.name}
                        </Text>
                        {isDefault && (
                          <View
                            style={{
                              paddingHorizontal: 8,
                              paddingVertical: 2,
                              borderRadius: 8,
                              backgroundColor: colors.primary,
                            }}
                          >
                            <Text style={{ fontSize: 10, color: colors.onAccent, fontWeight: '600' as const }}>
                              DEFAULT
                            </Text>
                          </View>
                        )}
                      </View>
                      <View style={styles.languageControls}>
                        {isEnabled && !isDefault && (
                          <TouchableOpacity
                            onPress={() => handleSetDefaultLanguage(langCode)}
                            style={{
                              paddingHorizontal: 12,
                              paddingVertical: 6,
                              borderRadius: 8,
                              borderWidth: 1,
                              borderColor: colors.primary,
                            }}
                            testID={`set-default-${langCode}`}
                          >
                            <Text style={{ fontSize: 12, color: colors.primary, fontWeight: '600' as const }}>
                              Set Default
                            </Text>
                          </TouchableOpacity>
                        )}
                        <TouchableOpacity
                          style={styles.iconButton}
                          onPress={() => handleToggleLanguage(langCode)}
                          testID={`toggle-language-${langCode}`}
                        >
                          {isEnabled ? (
                            <ToggleRight size={20} color="#10B981" />
                          ) : (
                            <ToggleLeft size={20} color={colors.textSecondary} />
                          )}
                        </TouchableOpacity>
                        {!isDefault && (
                          <TouchableOpacity
                            style={styles.iconButton}
                            onPress={() => handleDeleteLanguage(langCode)}
                            testID={`delete-language-${langCode}`}
                          >
                            <Trash2 size={18} color="#EF4444" />
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                    <View style={styles.languageDetails}>
                      <Text style={styles.detailText}>Code: {langCode}</Text>
                      <Text style={styles.detailText}>•</Text>
                      <Text style={styles.detailText}>Native: {langInfo.nativeName}</Text>
                    </View>
                  </View>
                );
              })}

              <View style={styles.infoBox}>
                <Text style={styles.infoText}>
                  <Text style={{ fontWeight: '700' as const }}>Language Settings:</Text>{' '}
                  Enable or disable languages for your app. The default language is used for new users and as a fallback. You cannot disable the default language or the last remaining language.
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Profile Configuration</Text>
            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push('/profile-restrictions')}
              testID="profile-restrictions-link"
              activeOpacity={0.7}
            >
              <View style={[styles.cardHeader, { marginBottom: 0 }]}>
                <View style={styles.cardIcon}>
                  <Shield size={20} color={colors.text} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>Profile Restrictions</Text>
                  <Text style={styles.settingDescription}>Configure username and avatar policies</Text>
                </View>
                <ChevronRight size={20} color={colors.textSecondary} />
              </View>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </>
  );
}
