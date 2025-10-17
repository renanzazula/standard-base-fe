import { usePreferences } from '@/contexts/PreferencesContext';
import { useAdminConfig } from '@/contexts/AdminConfigContext';
import { AVAILABLE_LANGUAGES } from '@/constants/languages';
import type { Language } from '@/constants/languages';
import { Stack } from 'expo-router';
import { Trash2, Edit2 } from 'lucide-react-native';
import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';

interface LanguageItem {
  code: Language;
  name: string;
  nativeName: string;
  enabled: boolean;
}

export default function LanguageManagementScreen() {
  const { colors } = usePreferences();
  const { config } = useAdminConfig();

  const [languages, setLanguages] = useState<LanguageItem[]>([]);

  useEffect(() => {
    const availableLanguages = config.languageConfig.availableLanguages;
    const languageItems = availableLanguages.map((langCode) => {
      const langInfo = AVAILABLE_LANGUAGES[langCode];
      return {
        code: langCode,
        name: langInfo.name,
        nativeName: langInfo.nativeName,
        enabled: true,
      };
    });
    setLanguages(languageItems);
  }, [config.languageConfig.availableLanguages]);

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
    languageItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    languageItemLast: {
      borderBottomWidth: 0,
    },
    languageInfo: {
      flex: 1,
    },
    languageName: {
      fontSize: 16,
      fontWeight: '600' as const,
      color: colors.text,
      marginBottom: 4,
    },
    languageCode: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    languageNative: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 2,
    },
    actionButtons: {
      flexDirection: 'row',
      gap: 8,
    },
    iconButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    statusBadge: {
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 12,
      marginRight: 8,
    },
    statusBadgeEnabled: {
      backgroundColor: '#10B981',
    },
    statusBadgeDisabled: {
      backgroundColor: colors.border,
    },
    statusText: {
      fontSize: 12,
      fontWeight: '600' as const,
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

  const toggleLanguageStatus = (code: Language) => {
    Alert.alert(
      'Cannot Toggle',
      'Languages shown here are already enabled in Admin Configuration. To disable a language, go to Admin Configuration > Language Settings.',
      [{ text: 'OK' }]
    );
  };

  const deleteLanguage = (code: Language) => {
    Alert.alert(
      'Cannot Delete',
      'Languages shown here are managed in Admin Configuration. To remove a language, go to Admin Configuration > Language Settings.',
      [{ text: 'OK' }]
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Language Management',
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.text,
        }}
      />
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Available Languages</Text>

            <View style={styles.card}>
              {languages.map((language, index) => (
                <View
                  key={language.code}
                  style={[
                    styles.languageItem,
                    index === languages.length - 1 && styles.languageItemLast,
                  ]}
                >
                  <View style={styles.languageInfo}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                      <View
                        style={[
                          styles.statusBadge,
                          language.enabled ? styles.statusBadgeEnabled : styles.statusBadgeDisabled,
                        ]}
                      >
                        <Text style={styles.statusText}>
                          {language.enabled ? 'Enabled' : 'Disabled'}
                        </Text>
                      </View>
                      <Text style={styles.languageName}>{language.name}</Text>
                    </View>
                    <Text style={styles.languageCode}>Code: {language.code}</Text>
                    <Text style={styles.languageNative}>Native: {language.nativeName}</Text>
                  </View>

                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      style={styles.iconButton}
                      onPress={() => toggleLanguageStatus(language.code)}
                      testID={`toggle-language-${language.code}`}
                    >
                      <Edit2 size={18} color={colors.text} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.iconButton}
                      onPress={() => deleteLanguage(language.code)}
                      testID={`delete-language-${language.code}`}
                    >
                      <Trash2 size={18} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>

            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                <Text style={{ fontWeight: '700' as const }}>Language Management:</Text>{' '}
                This page displays languages that are currently enabled in Admin Configuration. These are the languages available to users throughout the application. To modify which languages are available, go to Admin Configuration → Language Settings.
              </Text>
            </View>
          </View>


        </ScrollView>
      </View>
    </>
  );
}
