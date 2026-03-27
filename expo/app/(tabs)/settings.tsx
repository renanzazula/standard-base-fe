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
  Shield,
  Check,
  Edit3,
  Camera,
  Menu,
  ChevronRight,
  Users,
  Lock,
  Globe,
} from 'lucide-react-native';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert, Modal, Pressable, TextInput, Image } from 'react-native';
import React from 'react';
import { AVAILABLE_LANGUAGES, Language } from '@/constants/languages';
import { useTranslation } from '@/hooks/useTranslation';

import * as ImagePicker from 'expo-image-picker';

export default function SettingsScreen() {
  const { colors, theme, toggleTheme, language, setLanguage } = usePreferences();
  const { user, logout, updateProfile } = useAuth();
  const { config } = useAdminConfig();
  const router = useRouter();
  const [languageModalVisible, setLanguageModalVisible] = React.useState(false);

  const [usernameModalVisible, setUsernameModalVisible] = React.useState(false);
  const [usernameInput, setUsernameInput] = React.useState('');
  const { t } = useTranslation();

  if (!config || !config.languageConfig) {
    return null;
  }



  const handleTakePhoto = async () => {
    console.log('[Settings] Requesting camera access');
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please grant camera access to take a photo.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      console.log('[Settings] Photo taken:', asset.uri);
      await updateProfile({ avatar: asset.uri });
      Alert.alert(t('common.success'), t('settings.avatarUpdated'));
    }
  };

  const handleSelectAvatar = async () => {
    console.log('[Settings] Requesting avatar selection');
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please grant photo library access to upload an avatar.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      console.log('[Settings] Avatar selected:', asset.uri);
      await updateProfile({ avatar: asset.uri });
      Alert.alert(t('common.success'), t('settings.avatarUpdated'));
    }
  };

  const handleAvatarPress = () => {
    Alert.alert(
      t('settings.changeAvatar'),
      t('settings.chooseAvatarSource'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('settings.takePhoto'),
          onPress: handleTakePhoto,
        },
        {
          text: t('settings.chooseFromGallery'),
          onPress: handleSelectAvatar,
        },
      ]
    );
  };



  const handleUpdateUsername = () => {
    const trimmed = usernameInput.trim();
    
    if (trimmed.length < config.profileConfig.usernameMinLength) {
      Alert.alert(
        t('common.error'),
        t('settings.usernameTooShort').replace('{min}', config.profileConfig.usernameMinLength.toString())
      );
      return;
    }

    if (trimmed.length > config.profileConfig.usernameMaxLength) {
      Alert.alert(
        t('common.error'),
        t('settings.usernameTooLong').replace('{max}', config.profileConfig.usernameMaxLength.toString())
      );
      return;
    }

    console.log('[Settings] Updating username to:', trimmed);
    updateProfile({ username: trimmed });
    setUsernameModalVisible(false);
    Alert.alert(t('common.success'), t('settings.usernameUpdated'));
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
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    cardIconContainer: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 16,
    },
    cardTitle: {
      fontSize: 20,
      fontWeight: '700' as const,
      color: colors.text,
    },
    cardContent: {
      padding: 16,
      gap: 12,
    },
    infoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 8,
    },
    infoLabel: {
      fontSize: 14,
      color: colors.textSecondary,
      fontWeight: '500' as const,
    },
    infoValue: {
      fontSize: 14,
      color: colors.text,
      fontWeight: '600' as const,
    },
    profileBadge: {
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 12,
      backgroundColor: colors.primary,
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
    profileFieldRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    profileFieldRowLast: {
      borderBottomWidth: 0,
    },
    profileFieldInfo: {
      flex: 1,
    },
    profileFieldLabel: {
      fontSize: 14,
      fontWeight: '600' as const,
      color: colors.text,
      marginBottom: 4,
    },
    profileFieldValue: {
      fontSize: 16,
      color: colors.text,
    },
    profileFieldDescription: {
      fontSize: 13,
      color: colors.textSecondary,
    },
    editButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    avatarActionButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    avatarImageContainer: {
      position: 'relative',
      width: 120,
      height: 120,
    },
    avatarImage: {
      width: 120,
      height: 120,
      borderRadius: 60,
      borderWidth: 2,
      borderColor: colors.border,
    },
    avatarOverlay: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: colors.card,
    },
    avatarPlaceholder: {
      width: 120,
      height: 120,
      borderRadius: 60,
      borderWidth: 2,
      borderStyle: 'dashed' as const,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface,
      gap: 8,
    },
    avatarPlaceholderText: {
      fontSize: 12,
      color: colors.textSecondary,
      fontWeight: '600' as const,
    },
    adminFieldRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    adminFieldRowLast: {
      borderBottomWidth: 0,
    },
    adminFieldLabel: {
      fontSize: 14,
      fontWeight: '600' as const,
      color: colors.text,
    },
    adminFieldControl: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    adminFieldButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    adminFieldValue: {
      fontSize: 16,
      fontWeight: '600' as const,
      color: colors.text,
      minWidth: 60,
      textAlign: 'center',
    },
    usernameModalBody: {
      padding: 20,
    },
    usernameInput: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      padding: 16,
      fontSize: 16,
      color: colors.text,
      backgroundColor: colors.surface,
    },
    usernameHint: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 8,
    },
    modalActionButtons: {
      flexDirection: 'row',
      gap: 12,
    },
    modalActionButton: {
      flex: 1,
      backgroundColor: colors.primary,
      borderRadius: 12,
      padding: 16,
      alignItems: 'center',
    },
    modalActionButtonText: {
      fontSize: 16,
      fontWeight: '600' as const,
      color: '#FFFFFF',
    },
    divider: {
      height: 1,
      backgroundColor: colors.border,
      marginVertical: 16,
    },
    languageCode: {
      fontSize: 12,
      fontWeight: '700' as const,
      color: colors.textSecondary,
    },
    cardHeaderAvatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      marginRight: 16,
      borderWidth: 2,
      borderColor: colors.primary,
    },
    cardSubtitle: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 2,
    },
  });

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} testID="settings-scroll">
        <View style={styles.header}>
          <Text style={styles.title}>{t('settings.settings')}</Text>
          <Text style={styles.subtitle}>{t('settings.managePreferences')}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.profileSettings')}</Text>
          <View style={styles.card}>
            <TouchableOpacity 
              style={styles.cardHeader} 
              onPress={handleAvatarPress}
              activeOpacity={0.7}
              testID="profile-avatar-button"
            >
              {user?.avatar && user.avatar.trim() !== '' && user.avatar.startsWith('file://') ? (
                <Image
                  source={{ uri: user.avatar }}
                  style={styles.cardHeaderAvatar}
                  defaultSource={require('@/assets/images/icon.png')}
                />
              ) : (
                <View style={styles.cardIconContainer}>
                  <User size={24} color="#FFFFFF" />
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{t('settings.profileInformation')}</Text>
                <Text style={styles.cardSubtitle}>{t('settings.tapToChangeAvatar')}</Text>
              </View>
              <Camera size={20} color={colors.textSecondary} />
            </TouchableOpacity>
            <View style={styles.cardContent}>
              <View style={[styles.profileFieldRow, { borderBottomWidth: 0, paddingBottom: 0 }]}>
                <View style={styles.profileFieldInfo}>
                  <Text style={styles.profileFieldLabel}>{t('settings.username')}</Text>
                  <Text style={styles.profileFieldDescription}>
                    {user?.username || user?.name}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => {
                    setUsernameInput(user?.username || user?.name || '');
                    setUsernameModalVisible(true);
                  }}
                  testID="edit-username-button"
                >
                  <Edit3 size={16} color={colors.primary} />
                </TouchableOpacity>
              </View>

              <View style={styles.divider} />

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>{t('auth.email')}</Text>
                <Text style={styles.infoValue}>{user?.email}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>{t('home.role')}</Text>
                <View style={styles.profileBadge}>
                  <Text style={styles.badgeText}>{user?.role}</Text>
                </View>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>{t('home.provider')}</Text>
                <Text style={styles.infoValue}>{user?.provider}</Text>
              </View>

              <View style={styles.divider} />

              <TouchableOpacity
                style={[styles.infoRow, { paddingVertical: 12 }]}
                onPress={() => setLanguageModalVisible(true)}
                testID="language-selector-profile"
                activeOpacity={0.7}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={styles.settingIcon}>
                    <Globe size={20} color={colors.text} />
                  </View>
                  <View>
                    <Text style={styles.settingTitle}>{t('home.language')}</Text>
                    <Text style={styles.settingDescription}>{AVAILABLE_LANGUAGES[language].nativeName}</Text>
                  </View>
                </View>
                <Text style={{ fontSize: 20 }}>{AVAILABLE_LANGUAGES[language].flag}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.appearance')}</Text>
          <View style={styles.card}>
            <TouchableOpacity
              style={[styles.settingItem, styles.settingItemLast]}
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
          </View>
        </View>

        {user?.role === 'admin' && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('settings.adminConfiguration')}</Text>
              <View style={styles.card}>
                <TouchableOpacity
                  style={styles.settingItem}
                  onPress={() => router.push('/user-management')}
                  testID="user-management-link"
                  activeOpacity={0.7}
                >
                  <View style={styles.settingIcon}>
                    <Users size={20} color={colors.text} />
                  </View>
                  <View style={styles.settingContent}>
                    <Text style={styles.settingTitle}>{t('userManagement.manageUsers')}</Text>
                    <Text style={styles.settingDescription}>
                      {t('userManagement.viewAllUsers')}
                    </Text>
                  </View>
                  <View style={styles.settingAction}>
                    <ChevronRight size={20} color={colors.textSecondary} />
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.settingItem}
                  onPress={() => router.push('/configure-authentication')}
                  testID="configure-auth-link"
                  activeOpacity={0.7}
                >
                  <View style={styles.settingIcon}>
                    <Lock size={20} color={colors.text} />
                  </View>
                  <View style={styles.settingContent}>
                    <Text style={styles.settingTitle}>Configure Authentication</Text>
                    <Text style={styles.settingDescription}>
                      Manage authentication methods and service modes
                    </Text>
                  </View>
                  <View style={styles.settingAction}>
                    <ChevronRight size={20} color={colors.textSecondary} />
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.settingItem}
                  onPress={() => router.push('/session-configuration')}
                  testID="session-config-link"
                  activeOpacity={0.7}
                >
                  <View style={styles.settingIcon}>
                    <Clock size={20} color={colors.text} />
                  </View>
                  <View style={styles.settingContent}>
                    <Text style={styles.settingTitle}>Session Configuration</Text>
                    <Text style={styles.settingDescription}>
                      Configure session timeout and auto-refresh settings
                    </Text>
                  </View>
                  <View style={styles.settingAction}>
                    <ChevronRight size={20} color={colors.textSecondary} />
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.settingItem}
                  onPress={() => router.push('/language-settings')}
                  testID="language-settings-link"
                  activeOpacity={0.7}
                >
                  <View style={styles.settingIcon}>
                    <Globe size={20} color={colors.text} />
                  </View>
                  <View style={styles.settingContent}>
                    <Text style={styles.settingTitle}>Language Settings</Text>
                    <Text style={styles.settingDescription}>
                      Manage available languages and default language
                    </Text>
                  </View>
                  <View style={styles.settingAction}>
                    <ChevronRight size={20} color={colors.textSecondary} />
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.settingItem}
                  onPress={() => router.push('/profile-restrictions')}
                  testID="profile-restrictions-link"
                  activeOpacity={0.7}
                >
                  <View style={styles.settingIcon}>
                    <Shield size={20} color={colors.text} />
                  </View>
                  <View style={styles.settingContent}>
                    <Text style={styles.settingTitle}>Profile Restrictions</Text>
                    <Text style={styles.settingDescription}>
                      Configure username and avatar policies
                    </Text>
                  </View>
                  <View style={styles.settingAction}>
                    <ChevronRight size={20} color={colors.textSecondary} />
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.settingItem, styles.settingItemLast]}
                  onPress={() => router.push('/navigation-management')}
                  testID="navigation-management-link"
                  activeOpacity={0.7}
                >
                  <View style={styles.settingIcon}>
                    <Menu size={20} color={colors.text} />
                  </View>
                  <View style={styles.settingContent}>
                    <Text style={styles.settingTitle}>{t('settings.navigationManagement')}</Text>
                    <Text style={styles.settingDescription}>
                      {t('settings.manageNavigationTabs')}
                    </Text>
                  </View>
                  <View style={styles.settingAction}>
                    <ChevronRight size={20} color={colors.textSecondary} />
                  </View>
                </TouchableOpacity>
              </View>
            </View>


          </>
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
              {Object.entries(AVAILABLE_LANGUAGES)
                .filter(([code]) => config.languageConfig.availableLanguages.includes(code as Language))
                .map(([code, lang], index, filteredArray) => {
                  const isSelected = language === code;
                  const isLast = index === filteredArray.length - 1;
                  
                  return (
                    <TouchableOpacity
                      key={code}
                      style={[styles.languageItem, isLast && styles.languageItemLast]}
                      onPress={() => {
                        setLanguage(code as keyof typeof AVAILABLE_LANGUAGES);
                        setLanguageModalVisible(false);
                      }}
                      testID={`language-option-${code}`}
                    >
                      <Text style={styles.languageFlag}>{lang.flag}</Text>
                      <View style={styles.languageInfo}>
                        <Text style={styles.languageName}>{lang.name}</Text>
                        <Text style={styles.languageNative}>{lang.nativeName}</Text>
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

      <Modal
        visible={usernameModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setUsernameModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setUsernameModalVisible(false)}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('settings.updateUsername')}</Text>
            </View>
            <View style={styles.usernameModalBody}>
              <TextInput
                style={styles.usernameInput}
                value={usernameInput}
                onChangeText={setUsernameInput}
                placeholder={t('settings.enterUsername')}
                placeholderTextColor={colors.textSecondary}
                autoFocus
                testID="username-input"
              />
              <Text style={styles.usernameHint}>
                {t('settings.minLength')}: {config.profileConfig.usernameMinLength}, {t('settings.maxLength')}: {config.profileConfig.usernameMaxLength}
              </Text>
            </View>
            <View style={styles.modalFooter}>
              <View style={styles.modalActionButtons}>
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => setUsernameModalVisible(false)}
                  testID="cancel-username"
                >
                  <Text style={styles.modalCloseButtonText}>{t('common.cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalActionButton}
                  onPress={handleUpdateUsername}
                  testID="save-username"
                >
                  <Text style={styles.modalActionButtonText}>{t('common.save')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
