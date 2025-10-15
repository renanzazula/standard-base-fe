import { useAuth } from '@/contexts/AuthContext';
import { usePreferences } from '@/contexts/PreferencesContext';
import { useAdminConfig } from '@/contexts/AdminConfigContext';
import { useRouter } from 'expo-router';
import {
  Moon,
  Sun,
  LogOut,
  User,
  Clock,
  Plus,
  Minus,
  Shield,
  Chrome,
  Apple as AppleIcon,
  Mail,
  AlertCircle,
  Languages,
  Globe,
  Check,
} from 'lucide-react-native';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert, Modal, Pressable } from 'react-native';
import React from 'react';
import { AVAILABLE_LANGUAGES, Language } from '@/constants/languages';
import { useTranslation } from '@/hooks/useTranslation';

export default function SettingsScreen() {
  const { colors, theme, toggleTheme, language, setLanguage } = usePreferences();
  const { user, logout } = useAuth();
  const { config, updateSessionConfig, toggleAuthMethod, setServiceMode, toggleLanguageAvailability, setDefaultLanguage } = useAdminConfig();
  const router = useRouter();
  const [languageModalVisible, setLanguageModalVisible] = React.useState(false);
  const { t } = useTranslation();

  if (!config || !config.languageConfig || !config.languageConfig.availableLanguages) {
    return null;
  }

  const updateAuthMethod = (method: 'google' | 'apple' | 'manual') => {
    console.log(`[Settings] Updating auth method: ${method}`);
    toggleAuthMethod(method);
  };

  const updateServiceMode = (method: 'google' | 'apple' | 'manual', mode: 'mock' | 'real') => {
    console.log(`[Settings] Updating service mode for ${method}: ${mode}`);
    setServiceMode(method, mode);
  };

  const MIN_SESSION_TIME = 5 * 60 * 1000;
  const MAX_SESSION_TIME = 24 * 60 * 60 * 1000;
  const MIN_IDLE_TIME = 5 * 60 * 1000;
  const MAX_IDLE_TIME = 24 * 60 * 60 * 1000;
  const TIME_STEP = 5 * 60 * 1000;

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

  const handleLogout = () => {
    Alert.alert(t('auth.logout'), t('auth.logoutConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('auth.logout'),
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/login');
        },
      },
    ]);
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      padding: 20,
    },
    header: {
      marginBottom: 32,
    },
    title: {
      fontSize: 32,
      fontWeight: '700' as const,
      color: colors.text,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      color: colors.textSecondary,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: '700' as const,
      color: colors.textSecondary,
      textTransform: 'uppercase' as const,
      marginBottom: 12,
      letterSpacing: 0.5,
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: 16,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: colors.border,
    },
    settingItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    settingItemLast: {
      borderBottomWidth: 0,
    },
    settingIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 16,
    },
    settingContent: {
      flex: 1,
    },
    settingTitle: {
      fontSize: 16,
      fontWeight: '600' as const,
      color: colors.text,
      marginBottom: 2,
    },
    settingDescription: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    settingAction: {
      marginLeft: 12,
    },
    logoutButton: {
      backgroundColor: colors.error,
      borderRadius: 12,
      padding: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 8,
    },
    logoutButtonText: {
      fontSize: 16,
      fontWeight: '700' as const,
      color: '#FFFFFF',
      marginLeft: 8,
    },
    profileCard: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 20,
      marginBottom: 24,
      borderWidth: 1,
      borderColor: colors.border,
      flexDirection: 'row',
      alignItems: 'center',
    },
    profileIcon: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 16,
    },
    profileInfo: {
      flex: 1,
    },
    profileName: {
      fontSize: 20,
      fontWeight: '700' as const,
      color: colors.text,
      marginBottom: 4,
    },
    profileEmail: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    badge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
      backgroundColor: colors.primary,
      marginTop: 4,
      alignSelf: 'flex-start',
    },
    badgeText: {
      fontSize: 11,
      fontWeight: '700' as const,
      color: '#FFFFFF',
      textTransform: 'uppercase' as const,
    },
    sessionRow: {
      marginBottom: 20,
      paddingBottom: 20,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    sessionRowLast: {
      borderBottomWidth: 0,
      paddingBottom: 0,
    },
    sessionLabel: {
      fontSize: 14,
      fontWeight: '600' as const,
      color: colors.text,
      marginBottom: 8,
    },
    settingLabel: {
      fontSize: 14,
      fontWeight: '600' as const,
      color: colors.text,
    },
    settingRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
    },
    settingRowLast: {
      paddingBottom: 0,
    },
    sessionValue: {
      fontSize: 24,
      fontWeight: '700' as const,
      color: colors.primary,
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
    infoBox: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginTop: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    infoText: {
      fontSize: 13,
      color: colors.textSecondary,
      lineHeight: 20,
    },
    authMethodRow: {
      marginBottom: 20,
      paddingBottom: 20,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    authMethodRowLast: {
      borderBottomWidth: 0,
      paddingBottom: 0,
      marginBottom: 0,
    },
    authMethodHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    authMethodInfo: {
      flex: 1,
      marginLeft: 12,
    },
    authMethodTitle: {
      fontSize: 16,
      fontWeight: '600' as const,
      color: colors.text,
      marginBottom: 2,
    },
    authMethodDescription: {
      fontSize: 13,
      color: colors.textSecondary,
    },
    authMethodControls: {
      gap: 12,
    },
    authMethodControl: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 8,
    },
    controlLabel: {
      fontSize: 14,
      fontWeight: '600' as const,
      color: colors.text,
    },
    modeToggle: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
      borderRadius: 8,
      padding: 2,
      borderWidth: 1,
      borderColor: colors.border,
    },
    modeButton: {
      paddingHorizontal: 20,
      paddingVertical: 8,
      borderRadius: 6,
    },
    modeButtonActive: {
      backgroundColor: colors.primary,
    },
    modeButtonText: {
      fontSize: 14,
      fontWeight: '600' as const,
      color: colors.textSecondary,
    },
    modeButtonTextActive: {
      color: '#FFFFFF',
    },
    validationStatus: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 12,
      padding: 12,
      backgroundColor: colors.surface,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    validationText: {
      fontSize: 12,
      color: colors.textSecondary,
      marginLeft: 8,
      flex: 1,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    modalContent: {
      backgroundColor: colors.card,
      borderRadius: 16,
      width: '100%',
      maxWidth: 400,
      maxHeight: '80%',
      borderWidth: 1,
      borderColor: colors.border,
    },
    modalHeader: {
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: '700' as const,
      color: colors.text,
    },
    modalBody: {
      maxHeight: 400,
    },
    languageItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    languageItemLast: {
      borderBottomWidth: 0,
    },
    languageFlag: {
      fontSize: 24,
      marginRight: 12,
    },
    languageInfo: {
      flex: 1,
    },
    languageName: {
      fontSize: 16,
      fontWeight: '600' as const,
      color: colors.text,
      marginBottom: 2,
    },
    languageNative: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    languageCheck: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    modalFooter: {
      padding: 16,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    modalCloseButton: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      alignItems: 'center',
    },
    modalCloseButtonText: {
      fontSize: 16,
      fontWeight: '600' as const,
      color: colors.text,
    },
    adminLanguageItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    adminLanguageItemLast: {
      borderBottomWidth: 0,
    },
    defaultBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      backgroundColor: colors.primary,
      marginLeft: 8,
    },
    defaultBadgeText: {
      fontSize: 10,
      fontWeight: '700' as const,
      color: '#FFFFFF',
      textTransform: 'uppercase' as const,
    },
    setDefaultButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      marginLeft: 8,
    },
    setDefaultButtonText: {
      fontSize: 12,
      fontWeight: '600' as const,
      color: colors.text,
    },
  });

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('settings.settings')}</Text>
          <Text style={styles.subtitle}>{t('settings.managePreferences')}</Text>
        </View>

        <View style={styles.profileCard}>
          <View style={styles.profileIcon}>
            <User size={30} color="#FFFFFF" />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.name}</Text>
            <Text style={styles.profileEmail}>{user?.email}</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{user?.role}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.appearance')}</Text>
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.settingItem}
              onPress={toggleTheme}
            >
              <View style={styles.settingIcon}>
                {theme === 'dark' ? (
                  <Moon size={20} color={colors.text} />
                ) : (
                  <Sun size={20} color={colors.text} />
                )}
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>{t('settings.darkMode')}</Text>
                <Text style={styles.settingDescription}>
                  {theme === 'dark' ? t('settings.enabled') : t('settings.disabled')}
                </Text>
              </View>
              <View style={styles.settingAction}>
                <Switch
                  value={theme === 'dark'}
                  onValueChange={toggleTheme}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor="#FFFFFF"
                  testID="toggle-theme"
                />
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.settingItem, styles.settingItemLast]}
              onPress={() => setLanguageModalVisible(true)}
              testID="language-selector"
            >
              <View style={styles.settingIcon}>
                <Globe size={20} color={colors.text} />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>{t('home.language')}</Text>
                <Text style={styles.settingDescription}>
                  {AVAILABLE_LANGUAGES[language].nativeName}
                </Text>
              </View>
              <View style={styles.settingAction}>
                <Text style={styles.languageFlag}>{AVAILABLE_LANGUAGES[language].flag}</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {user?.role === 'admin' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('settings.authConfiguration')}</Text>
            <View style={styles.card}>
              <View style={styles.settingItem}>
                <View style={styles.settingIcon}>
                  <Shield size={20} color={colors.text} />
                </View>
                <View style={styles.settingContent}>
                  <Text style={styles.settingTitle}>{t('settings.loginMethods')}</Text>
                  <Text style={styles.settingDescription}>
                    {t('settings.controlAuthMethods')}
                  </Text>
                </View>
              </View>

              <View style={{ padding: 16, paddingTop: 0 }}>
                <View style={styles.authMethodRow}>
                  <View style={styles.authMethodHeader}>
                    <Chrome size={20} color={colors.text} />
                    <View style={styles.authMethodInfo}>
                      <Text style={styles.authMethodTitle}>{t('settings.googleLogin')}</Text>
                      <Text style={styles.authMethodDescription}>
                        {t('settings.googleOAuth')}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.authMethodControls}>
                    <View style={styles.authMethodControl}>
                      <Text style={styles.controlLabel}>{t('settings.enabled')}</Text>
                      <Switch
                        value={config.enabledAuthMethods.google}
                        onValueChange={() => {
                          console.log('[Settings] Toggling Google auth method');
                          updateAuthMethod('google');
                        }}
                        trackColor={{ false: colors.border, true: colors.primary }}
                        thumbColor="#FFFFFF"
                        testID="toggle-google-auth"
                      />
                    </View>
                    <View style={styles.authMethodControl}>
                      <Text style={styles.controlLabel}>{t('settings.mode')}</Text>
                      <View style={styles.modeToggle}>
                        <TouchableOpacity
                          style={[
                            styles.modeButton,
                            config.serviceModes.google === 'mock' && styles.modeButtonActive,
                          ]}
                          onPress={() => {
                            console.log('[Settings] Setting Google to mock mode');
                            updateServiceMode('google', 'mock');
                          }}
                          testID="google-mode-mock"
                        >
                          <Text
                            style={[
                              styles.modeButtonText,
                              config.serviceModes.google === 'mock' && styles.modeButtonTextActive,
                            ]}
                          >
                            {t('settings.mock')}
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.modeButton,
                            config.serviceModes.google === 'real' && styles.modeButtonActive,
                          ]}
                          onPress={() => {
                            console.log('[Settings] Setting Google to real mode');
                            updateServiceMode('google', 'real');
                          }}
                          testID="google-mode-real"
                        >
                          <Text
                            style={[
                              styles.modeButtonText,
                              config.serviceModes.google === 'real' && styles.modeButtonTextActive,
                            ]}
                          >
                            {t('settings.real')}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                  {config.serviceModes.google === 'real' && (
                    <View style={styles.validationStatus}>
                      <AlertCircle size={16} color="#FFD60A" />
                      <Text style={styles.validationText}>
                        {t('settings.oauthRequired')}
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.authMethodRow}>
                  <View style={styles.authMethodHeader}>
                    <AppleIcon size={20} color={colors.text} />
                    <View style={styles.authMethodInfo}>
                      <Text style={styles.authMethodTitle}>{t('settings.appleLogin')}</Text>
                      <Text style={styles.authMethodDescription}>
                        {t('settings.appleSignIn')}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.authMethodControls}>
                    <View style={styles.authMethodControl}>
                      <Text style={styles.controlLabel}>{t('settings.enabled')}</Text>
                      <Switch
                        value={config.enabledAuthMethods.apple}
                        onValueChange={() => {
                          console.log('[Settings] Toggling Apple auth method');
                          updateAuthMethod('apple');
                        }}
                        trackColor={{ false: colors.border, true: colors.primary }}
                        thumbColor="#FFFFFF"
                        testID="toggle-apple-auth"
                      />
                    </View>
                    <View style={styles.authMethodControl}>
                      <Text style={styles.controlLabel}>{t('settings.mode')}</Text>
                      <View style={styles.modeToggle}>
                        <TouchableOpacity
                          style={[
                            styles.modeButton,
                            config.serviceModes.apple === 'mock' && styles.modeButtonActive,
                          ]}
                          onPress={() => {
                            console.log('[Settings] Setting Apple to mock mode');
                            updateServiceMode('apple', 'mock');
                          }}
                          testID="apple-mode-mock"
                        >
                          <Text
                            style={[
                              styles.modeButtonText,
                              config.serviceModes.apple === 'mock' && styles.modeButtonTextActive,
                            ]}
                          >
                            {t('settings.mock')}
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.modeButton,
                            config.serviceModes.apple === 'real' && styles.modeButtonActive,
                          ]}
                          onPress={() => {
                            console.log('[Settings] Setting Apple to real mode');
                            updateServiceMode('apple', 'real');
                          }}
                          testID="apple-mode-real"
                        >
                          <Text
                            style={[
                              styles.modeButtonText,
                              config.serviceModes.apple === 'real' && styles.modeButtonTextActive,
                            ]}
                          >
                            {t('settings.real')}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                  {config.serviceModes.apple === 'real' && (
                    <View style={styles.validationStatus}>
                      <AlertCircle size={16} color="#FFD60A" />
                      <Text style={styles.validationText}>
                        {t('settings.appleCredentialsRequired')}
                      </Text>
                    </View>
                  )}
                </View>

                <View style={[styles.authMethodRow, styles.authMethodRowLast]}>
                  <View style={styles.authMethodHeader}>
                    <Mail size={20} color={colors.text} />
                    <View style={styles.authMethodInfo}>
                      <Text style={styles.authMethodTitle}>{t('settings.emailPasswordLogin')}</Text>
                      <Text style={styles.authMethodDescription}>
                        {t('settings.manualRegistration')}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.authMethodControls}>
                    <View style={styles.authMethodControl}>
                      <Text style={styles.controlLabel}>{t('settings.enabled')}</Text>
                      <Switch
                        value={config.enabledAuthMethods.manual}
                        onValueChange={() => {
                          console.log('[Settings] Toggling Manual auth method');
                          updateAuthMethod('manual');
                        }}
                        trackColor={{ false: colors.border, true: colors.primary }}
                        thumbColor="#FFFFFF"
                        testID="toggle-manual-auth"
                      />
                    </View>
                    <View style={styles.authMethodControl}>
                      <Text style={styles.controlLabel}>{t('settings.mode')}</Text>
                      <View style={styles.modeToggle}>
                        <TouchableOpacity
                          style={[
                            styles.modeButton,
                            config.serviceModes.manual === 'mock' && styles.modeButtonActive,
                          ]}
                          onPress={() => {
                            console.log('[Settings] Setting Manual to mock mode');
                            updateServiceMode('manual', 'mock');
                          }}
                          testID="manual-mode-mock"
                        >
                          <Text
                            style={[
                              styles.modeButtonText,
                              config.serviceModes.manual === 'mock' && styles.modeButtonTextActive,
                            ]}
                          >
                            {t('settings.mock')}
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.modeButton,
                            config.serviceModes.manual === 'real' && styles.modeButtonActive,
                          ]}
                          onPress={() => {
                            console.log('[Settings] Setting Manual to real mode');
                            updateServiceMode('manual', 'real');
                          }}
                          testID="manual-mode-real"
                        >
                          <Text
                            style={[
                              styles.modeButtonText,
                              config.serviceModes.manual === 'real' && styles.modeButtonTextActive,
                            ]}
                          >
                            {t('settings.real')}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                  {config.serviceModes.manual === 'real' && (
                    <View style={styles.validationStatus}>
                      <AlertCircle size={16} color="#FFD60A" />
                      <Text style={styles.validationText}>
                        {t('settings.smsEmailRequired')}
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.infoBox}>
                  <Text style={styles.infoText}>
                    <Text style={{ fontWeight: '700' as const }}>{t('settings.br08')}</Text> {t('settings.br08Description')}{' '}
                    <Text style={{ fontWeight: '700' as const }}>{t('settings.br09')}</Text> {t('settings.br09Description')}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {user?.role === 'admin' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('settings.sessionConfiguration')}</Text>
            <View style={styles.card}>
              <View style={styles.settingItem}>
                <View style={styles.settingIcon}>
                  <Clock size={20} color={colors.text} />
                </View>
                <View style={styles.settingContent}>
                  <Text style={styles.settingTitle}>{t('settings.sessionTimeoutSettings')}</Text>
                  <Text style={styles.settingDescription}>
                    {t('settings.configureSession')}
                  </Text>
                </View>
              </View>

              <View style={{ padding: 16, paddingTop: 0 }}>
                <View style={styles.sessionRow}>
                  <Text style={styles.sessionLabel}>{t('settings.maxSessionTime')}</Text>
                  <Text style={styles.settingDescription}>
                    {t('settings.maxSessionDescription')}
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
                  <Text style={styles.sessionLabel}>{t('settings.idleTimeout')}</Text>
                  <Text style={styles.settingDescription}>
                    {t('settings.idleTimeoutDescription')}
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

                <View style={[styles.sessionRow, styles.sessionRowLast, styles.settingRow]}>
                  <View>
                    <Text style={styles.settingLabel}>{t('settings.autoRefreshSession')}</Text>
                    <Text style={styles.settingDescription}>
                      {t('settings.extendSession')}
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
                    <Text style={{ fontWeight: '700' as const }}>{t('settings.sessionConfigInfo')}</Text>{' '}
                    {t('settings.sessionConfigDescription')}
                    {config.sessionConfig.autoRefresh && `\n\n${t('settings.autoRefreshEnabled')}`}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {user?.role === 'admin' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('settings.languageConfiguration')}</Text>
            <View style={styles.card}>
              <View style={styles.settingItem}>
                <View style={styles.settingIcon}>
                  <Languages size={20} color={colors.text} />
                </View>
                <View style={styles.settingContent}>
                  <Text style={styles.settingTitle}>{t('settings.availableLanguages')}</Text>
                  <Text style={styles.settingDescription}>
                    {t('settings.manageLanguages')}
                  </Text>
                </View>
              </View>

              <View style={{ padding: 16, paddingTop: 0 }}>
                {(Object.keys(AVAILABLE_LANGUAGES) as Language[]).map((lang, index) => {
                  const langInfo = AVAILABLE_LANGUAGES[lang];
                  const isAvailable = config.languageConfig.availableLanguages.includes(lang);
                  const isDefault = config.languageConfig.defaultLanguage === lang;
                  const isLast = index === Object.keys(AVAILABLE_LANGUAGES).length - 1;

                  return (
                    <View
                      key={lang}
                      style={[
                        styles.adminLanguageItem,
                        isLast && styles.adminLanguageItemLast,
                      ]}
                    >
                      <Text style={styles.languageFlag}>{langInfo.flag}</Text>
                      <View style={styles.languageInfo}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Text style={styles.languageName}>{langInfo.name}</Text>
                          {isDefault && (
                            <View style={styles.defaultBadge}>
                              <Text style={styles.defaultBadgeText}>{t('settings.default')}</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.languageNative}>{langInfo.nativeName}</Text>
                      </View>
                      {isAvailable && !isDefault && (
                        <TouchableOpacity
                          style={styles.setDefaultButton}
                          onPress={() => {
                            console.log('[Settings] Setting default language:', lang);
                            setDefaultLanguage(lang);
                          }}
                          testID={`set-default-${lang}`}
                        >
                          <Text style={styles.setDefaultButtonText}>{t('settings.setDefault')}</Text>
                        </TouchableOpacity>
                      )}
                      <Switch
                        value={isAvailable}
                        onValueChange={() => {
                          console.log('[Settings] Toggling language availability:', lang);
                          toggleLanguageAvailability(lang);
                        }}
                        trackColor={{ false: colors.border, true: colors.primary }}
                        thumbColor="#FFFFFF"
                        testID={`toggle-language-${lang}`}
                      />
                    </View>
                  );
                })}

                <View style={styles.infoBox}>
                  <Text style={styles.infoText}>
                    <Text style={{ fontWeight: '700' as const }}>{t('settings.br28')}</Text> {t('settings.br28Description')}{' '}
                    <Text style={{ fontWeight: '700' as const }}>{t('settings.br29')}</Text> {t('settings.br29Description')}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.account')}</Text>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} testID="logout-button">
            <LogOut size={20} color="#FFFFFF" />
            <Text style={styles.logoutButtonText}>{t('auth.logout')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal
        visible={languageModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setLanguageModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setLanguageModalVisible(false)}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('settings.selectLanguage')}</Text>
            </View>
            <ScrollView style={styles.modalBody}>
              {config?.languageConfig?.availableLanguages?.map((lang, index) => {
                const langInfo = AVAILABLE_LANGUAGES[lang];
                const isSelected = language === lang;
                const isLast = index === (config.languageConfig.availableLanguages.length - 1);

                return (
                  <TouchableOpacity
                    key={lang}
                    style={[
                      styles.languageItem,
                      isLast && styles.languageItemLast,
                    ]}
                    onPress={() => {
                      console.log('[Settings] User selected language:', lang);
                      setLanguage(lang);
                      setLanguageModalVisible(false);
                    }}
                    testID={`select-language-${lang}`}
                  >
                    <Text style={styles.languageFlag}>{langInfo.flag}</Text>
                    <View style={styles.languageInfo}>
                      <Text style={styles.languageName}>{langInfo.name}</Text>
                      <Text style={styles.languageNative}>{langInfo.nativeName}</Text>
                    </View>
                    {isSelected && (
                      <View style={styles.languageCheck}>
                        <Check size={16} color="#FFFFFF" />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setLanguageModalVisible(false)}
                testID="close-language-modal"
              >
                <Text style={styles.modalCloseButtonText}>{t('common.close')}</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
