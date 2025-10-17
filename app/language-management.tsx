import { usePreferences } from '@/contexts/PreferencesContext';
import { useAdminConfig } from '@/contexts/AdminConfigContext';
import { useAuth } from '@/contexts/AuthContext';
import { AVAILABLE_LANGUAGES } from '@/constants/languages';
import type { Language } from '@/constants/languages';
import { Stack, router } from 'expo-router';
import { Trash2, ToggleLeft, ToggleRight } from 'lucide-react-native';
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
  const { config, toggleLanguageAvailability } = useAdminConfig();
  const { user } = useAuth();

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
    if (user?.role !== 'admin') {
      Alert.alert(
        'Access Denied',
        'Only administrators can modify language settings.',
        [{ text: 'OK' }]
      );
      return;
    }

    const isCurrentlyEnabled = config.languageConfig.availableLanguages.includes(code);
    
    if (isCurrentlyEnabled) {
      if (config.languageConfig.availableLanguages.length === 1) {
        Alert.alert(
          'Cannot Disable',
          'At least one language must remain enabled.',
          [{ text: 'OK' }]
        );
        return;
      }
      
      if (code === config.languageConfig.defaultLanguage) {
        Alert.alert(
          'Cannot Disable',
          'Cannot disable the default language. Please change the default language in Admin Configuration first.',
          [{ text: 'OK' }]
        );
        return;
      }
      
      Alert.alert(
        'Disable Language',
        `Are you sure you want to disable ${AVAILABLE_LANGUAGES[code].name}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Disable',
            style: 'destructive',
            onPress: () => toggleLanguageAvailability(code),
          },
        ]
      );
    } else {
      toggleLanguageAvailability(code);
    }
  };

  const deleteLanguage = (code: Language) => {
    if (user?.role !== 'admin') {
      Alert.alert(
        'Access Denied',
        'Only administrators can remove languages.',
        [{ text: 'OK' }]
      );
      return;
    }

    if (config.languageConfig.availableLanguages.length === 1) {
      Alert.alert(
        'Cannot Remove',
        'At least one language must remain enabled.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    if (code === config.languageConfig.defaultLanguage) {
      Alert.alert(
        'Cannot Remove',
        'Cannot remove the default language. Please change the default language in Admin Configuration first.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    Alert.alert(
      'Remove Language',
      `Are you sure you want to remove ${AVAILABLE_LANGUAGES[code].name}? This will disable it for all users.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => toggleLanguageAvailability(code),
        },
      ]
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
                      {language.enabled ? (
                        <ToggleRight size={20} color="#10B981" />
                      ) : (
                        <ToggleLeft size={20} color={colors.textSecondary} />
                      )}
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
                {user?.role === 'admin' 
                  ? 'This page displays languages that are currently enabled in the application. You can toggle or remove languages here. To change the default language or add new languages, go to Admin Configuration → Language Settings.'
                  : 'This page displays languages that are currently enabled in Admin Configuration. These are the languages available to users throughout the application.'}
              </Text>
            </View>
            
            {user?.role === 'admin' && (
              <TouchableOpacity
                style={{
                  backgroundColor: colors.primary,
                  padding: 16,
                  borderRadius: 12,
                  marginTop: 16,
                  alignItems: 'center',
                }}
                onPress={() => router.push('/admin-config')}
                testID="go-to-admin-config"
              >
                <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '600' as const }}>
                  Go to Admin Configuration
                </Text>
              </TouchableOpacity>
            )}
          </View>


        </ScrollView>
      </View>
    </>
  );
}
