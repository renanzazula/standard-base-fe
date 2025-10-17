import { usePreferences } from '@/contexts/PreferencesContext';
import { Stack, useRouter } from 'expo-router';
import { Languages, Plus, Trash2, Edit2 } from 'lucide-react-native';
import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';

interface Language {
  code: string;
  name: string;
  nativeName: string;
  enabled: boolean;
}

export default function LanguageManagementScreen() {
  const { colors } = usePreferences();
  const router = useRouter();

  const [languages, setLanguages] = useState<Language[]>([
    { code: 'en', name: 'English', nativeName: 'English', enabled: true },
    { code: 'es', name: 'Spanish', nativeName: 'Español', enabled: true },
    { code: 'fr', name: 'French', nativeName: 'Français', enabled: false },
    { code: 'de', name: 'German', nativeName: 'Deutsch', enabled: false },
    { code: 'pt', name: 'Portuguese', nativeName: 'Português', enabled: false },
    { code: 'it', name: 'Italian', nativeName: 'Italiano', enabled: false },
    { code: 'ja', name: 'Japanese', nativeName: '日本語', enabled: false },
    { code: 'zh', name: 'Chinese', nativeName: '中文', enabled: false },
  ]);

  const [isAddingLanguage, setIsAddingLanguage] = useState(false);
  const [newLanguage, setNewLanguage] = useState({
    code: '',
    name: '',
    nativeName: '',
  });

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
    addButton: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      padding: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    addButtonText: {
      fontSize: 16,
      fontWeight: '600' as const,
      color: '#FFFFFF',
    },
    inputGroup: {
      marginBottom: 16,
    },
    inputLabel: {
      fontSize: 14,
      fontWeight: '600' as const,
      color: colors.text,
      marginBottom: 8,
    },
    input: {
      backgroundColor: colors.surface,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      color: colors.text,
      borderWidth: 1,
      borderColor: colors.border,
    },
    buttonRow: {
      flexDirection: 'row',
      gap: 12,
    },
    button: {
      flex: 1,
      padding: 16,
      borderRadius: 12,
      alignItems: 'center',
    },
    buttonPrimary: {
      backgroundColor: colors.primary,
    },
    buttonSecondary: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    buttonText: {
      fontSize: 16,
      fontWeight: '600' as const,
      color: '#FFFFFF',
    },
    buttonTextSecondary: {
      color: colors.text,
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

  const toggleLanguageStatus = (code: string) => {
    const enabledCount = languages.filter(lang => lang.enabled).length;
    const language = languages.find(lang => lang.code === code);
    
    if (language?.enabled && enabledCount === 1) {
      Alert.alert('Error', 'At least one language must be enabled');
      return;
    }

    setLanguages(languages.map(lang => 
      lang.code === code ? { ...lang, enabled: !lang.enabled } : lang
    ));
  };

  const deleteLanguage = (code: string) => {
    const language = languages.find(lang => lang.code === code);
    
    if (language?.enabled) {
      const enabledCount = languages.filter(lang => lang.enabled).length;
      if (enabledCount === 1) {
        Alert.alert('Error', 'Cannot delete the only enabled language');
        return;
      }
    }

    Alert.alert(
      'Delete Language',
      `Are you sure you want to delete ${language?.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setLanguages(languages.filter(lang => lang.code !== code));
          },
        },
      ]
    );
  };

  const addLanguage = () => {
    if (!newLanguage.code || !newLanguage.name || !newLanguage.nativeName) {
      Alert.alert('Error', 'All fields are required');
      return;
    }

    if (languages.some(lang => lang.code === newLanguage.code)) {
      Alert.alert('Error', 'Language code already exists');
      return;
    }

    setLanguages([...languages, { ...newLanguage, enabled: false }]);
    setNewLanguage({ code: '', name: '', nativeName: '' });
    setIsAddingLanguage(false);
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
                Enable or disable languages available in the application. Users will only be able to select from enabled languages. At least one language must remain enabled.
              </Text>
            </View>
          </View>

          {!isAddingLanguage ? (
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setIsAddingLanguage(true)}
              testID="add-language-button"
            >
              <Plus size={20} color="#FFFFFF" />
              <Text style={styles.addButtonText}>Add New Language</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Add New Language</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Language Code</Text>
                <TextInput
                  style={styles.input}
                  value={newLanguage.code}
                  onChangeText={(text) => setNewLanguage({ ...newLanguage, code: text })}
                  placeholder="e.g., en, es, fr"
                  placeholderTextColor={colors.textSecondary}
                  testID="language-code-input"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Language Name (English)</Text>
                <TextInput
                  style={styles.input}
                  value={newLanguage.name}
                  onChangeText={(text) => setNewLanguage({ ...newLanguage, name: text })}
                  placeholder="e.g., English, Spanish, French"
                  placeholderTextColor={colors.textSecondary}
                  testID="language-name-input"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Native Name</Text>
                <TextInput
                  style={styles.input}
                  value={newLanguage.nativeName}
                  onChangeText={(text) => setNewLanguage({ ...newLanguage, nativeName: text })}
                  placeholder="e.g., English, Español, Français"
                  placeholderTextColor={colors.textSecondary}
                  testID="language-native-name-input"
                />
              </View>

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.button, styles.buttonSecondary]}
                  onPress={() => {
                    setIsAddingLanguage(false);
                    setNewLanguage({ code: '', name: '', nativeName: '' });
                  }}
                  testID="cancel-add-language"
                >
                  <Text style={[styles.buttonText, styles.buttonTextSecondary]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.buttonPrimary]}
                  onPress={addLanguage}
                  testID="save-language"
                >
                  <Text style={styles.buttonText}>Add Language</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    </>
  );
}
