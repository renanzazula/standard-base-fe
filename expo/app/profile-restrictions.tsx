import { useAdminConfig } from '@/contexts/AdminConfigContext';
import { usePreferences } from '@/contexts/PreferencesContext';
import { Stack } from 'expo-router';
import { Shield, Plus, Minus } from 'lucide-react-native';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useTranslation } from '@/hooks/useTranslation';

export default function ProfileRestrictionsScreen() {
  const { colors } = usePreferences();
  const { config, updateProfileConfig } = useAdminConfig();
  const { t } = useTranslation();

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
    fieldRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    fieldRowLast: {
      borderBottomWidth: 0,
    },
    fieldLabel: {
      fontSize: 14,
      fontWeight: '600' as const,
      color: colors.text,
    },
    fieldControl: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    fieldButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    fieldValue: {
      fontSize: 16,
      fontWeight: '600' as const,
      color: colors.text,
      minWidth: 60,
      textAlign: 'center' as const,
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
          title: 'Profile Restrictions',
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.text,
        }}
      />
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('settings.adminProfileConfig')}</Text>
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardIcon}>
                  <Shield size={20} color={colors.text} />
                </View>
                <Text style={styles.cardTitle}>{t('settings.usernamePolicy')}</Text>
              </View>

              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>{t('settings.minLength')}</Text>
                <View style={styles.fieldControl}>
                  <TouchableOpacity
                    style={styles.fieldButton}
                    onPress={() => updateProfileConfig({ usernameMinLength: Math.max(1, config.profileConfig.usernameMinLength - 1) })}
                    testID="decrease-username-min"
                  >
                    <Minus size={16} color={colors.text} />
                  </TouchableOpacity>
                  <Text style={styles.fieldValue}>{config.profileConfig.usernameMinLength}</Text>
                  <TouchableOpacity
                    style={styles.fieldButton}
                    onPress={() => updateProfileConfig({ usernameMinLength: Math.min(config.profileConfig.usernameMaxLength - 1, config.profileConfig.usernameMinLength + 1) })}
                    testID="increase-username-min"
                  >
                    <Plus size={16} color={colors.text} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>{t('settings.maxLength')}</Text>
                <View style={styles.fieldControl}>
                  <TouchableOpacity
                    style={styles.fieldButton}
                    onPress={() => updateProfileConfig({ usernameMaxLength: Math.max(config.profileConfig.usernameMinLength + 1, config.profileConfig.usernameMaxLength - 1) })}
                    testID="decrease-username-max"
                  >
                    <Minus size={16} color={colors.text} />
                  </TouchableOpacity>
                  <Text style={styles.fieldValue}>{config.profileConfig.usernameMaxLength}</Text>
                  <TouchableOpacity
                    style={styles.fieldButton}
                    onPress={() => updateProfileConfig({ usernameMaxLength: config.profileConfig.usernameMaxLength + 1 })}
                    testID="increase-username-max"
                  >
                    <Plus size={16} color={colors.text} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={[styles.fieldRow, styles.fieldRowLast]}>
                <Text style={styles.fieldLabel}>{t('settings.maxFileSize')}</Text>
                <View style={styles.fieldControl}>
                  <TouchableOpacity
                    style={styles.fieldButton}
                    onPress={() => updateProfileConfig({ avatarMaxSizeMB: Math.max(1, config.profileConfig.avatarMaxSizeMB - 1) })}
                    testID="decrease-avatar-size"
                  >
                    <Minus size={16} color={colors.text} />
                  </TouchableOpacity>
                  <Text style={styles.fieldValue}>{config.profileConfig.avatarMaxSizeMB}MB</Text>
                  <TouchableOpacity
                    style={styles.fieldButton}
                    onPress={() => updateProfileConfig({ avatarMaxSizeMB: config.profileConfig.avatarMaxSizeMB + 1 })}
                    testID="increase-avatar-size"
                  >
                    <Plus size={16} color={colors.text} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.infoBox}>
                <Text style={styles.infoText}>
                  <Text style={{ fontWeight: '700' as const }}>{t('settings.br30')}</Text> {t('settings.br30Description')}{'\n\n'}
                  <Text style={{ fontWeight: '700' as const }}>{t('settings.br31')}</Text> {t('settings.br31Description')}{'\n\n'}
                  <Text style={{ fontWeight: '700' as const }}>{t('settings.br32')}</Text> {t('settings.br32Description')}{'\n\n'}
                  <Text style={{ fontWeight: '700' as const }}>{t('settings.br33')}</Text> {t('settings.br33Description')}
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </>
  );
}
