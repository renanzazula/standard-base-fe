import {showAlert} from '@shared/utils/alert';
import {useAdminConfig} from '@core/contexts/AdminConfigContext';
import {usePreferences} from '@core/contexts/PreferencesContext';
import {Stack} from 'expo-router';
import {Globe, ToggleLeft, ToggleRight, Trash2} from 'lucide-react-native';
import {ScrollView, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {AVAILABLE_LANGUAGES, Language} from '@shared/constants/languages';
import {MAX_CONTENT_WIDTH} from '@shared/constants/layout';

export default function LanguageSettingsScreen() {
  const { colors } = usePreferences();
  const { config, toggleLanguageAvailability, setDefaultLanguage } = useAdminConfig();

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
      borderWidth: 1,
      borderColor: colors.border,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 20,
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
    settingDescription: {
      fontSize: 12,
      color: colors.textSecondary,
      marginBottom: 12,
    },
    settingLabel: {
      fontSize: 14,
      fontWeight: '600' as const,
      color: colors.text,
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

  const handleToggleLanguage = (langCode: Language) => {
    const isCurrentlyEnabled = config.languageConfig.availableLanguages.includes(langCode);

    if (isCurrentlyEnabled) {
      if (config.languageConfig.availableLanguages.length === 1) {
        showAlert('Cannot Disable', 'At least one language must remain enabled.', [{ text: 'OK' }]);
        return;
      }

      if (langCode === config.languageConfig.defaultLanguage) {
        showAlert(
          'Cannot Disable',
          'Cannot disable the default language. Please set a different language as default first.',
          [{ text: 'OK' }],
        );
        return;
      }

      showAlert(
        'Disable Language',
        `Are you sure you want to disable ${AVAILABLE_LANGUAGES[langCode].name}? Users will no longer be able to select this language.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Disable', style: 'destructive', onPress: () => toggleLanguageAvailability(langCode) },
        ],
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
        [{ text: 'OK' }],
      );
      return;
    }

    if (config.languageConfig.availableLanguages.length === 1) {
      showAlert('Cannot Remove', 'At least one language must remain enabled.', [{ text: 'OK' }]);
      return;
    }

    if (langCode === config.languageConfig.defaultLanguage) {
      showAlert(
        'Cannot Remove',
        'Cannot remove the default language. Please set a different language as default first.',
        [{ text: 'OK' }],
      );
      return;
    }

    showAlert(
      'Remove Language',
      `Are you sure you want to remove ${AVAILABLE_LANGUAGES[langCode].name}? This will disable it for all users.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => toggleLanguageAvailability(langCode) },
      ],
    );
  };

  const handleSetDefaultLanguage = (langCode: Language) => {
    showAlert(
      'Set Default Language',
      `Set ${AVAILABLE_LANGUAGES[langCode].name} as the default language? This will be used for new users and as a fallback.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Set Default', onPress: () => setDefaultLanguage(langCode) },
      ],
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Language Settings',
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.text,
        }}
      />
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Available Languages</Text>
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardIcon}>
                  <Globe size={20} color={colors.text} />
                </View>
                <Text style={styles.cardTitle}>Available Languages</Text>
              </View>

              <Text style={styles.settingDescription}>
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
                    style={[styles.languageItemCard, isLast && styles.languageItemCardLast]}
                  >
                    <View style={styles.languageHeader}>
                      <View style={styles.languageMainInfo}>
                        <View
                          style={[
                            styles.statusBadge,
                            isEnabled ? styles.statusBadgeEnabled : styles.statusBadgeDisabled,
                          ]}
                        >
                          <Text style={styles.statusText}>{isEnabled ? 'Enabled' : 'Disabled'}</Text>
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
        </ScrollView>
      </View>
    </>
  );
}
