import React from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {Camera, Edit3, Globe, User as UserIcon} from 'lucide-react-native';
import type {User} from '@core/contexts/AuthContext';
import {usePreferences} from '@core/contexts/PreferencesContext';
import {useTranslation} from '@shared/hooks/useTranslation';
import {AVAILABLE_LANGUAGES, Language} from '@shared/constants/languages';
import {CachedImage} from '@shared/components/CachedImage';
import {userScope} from '@core/services/imageCache';
import type {ProfileFieldKey} from '../utils/profileFieldVisibility';

interface ProfileInfoCardProps {
  user: User | null;
  visibleFields: Set<ProfileFieldKey>;
  isGuest: boolean;
  language: Language;
  onAvatarPress: () => void;
  onEditUsername: () => void;
  onLanguagePress: () => void;
}

export function ProfileInfoCard({
  user,
  visibleFields,
  isGuest,
  language,
  onAvatarPress,
  onEditUsername,
  onLanguagePress,
}: ProfileInfoCardProps) {
  const { colors } = usePreferences();
  const { t } = useTranslation();

  if (visibleFields.size === 0) {
    return null;
  }

  const showAvatar = visibleFields.has('profilePicture');
  const showUsername = visibleFields.has('username');
  const showInfoRows =
    visibleFields.has('email') || visibleFields.has('role') || visibleFields.has('provider');
  const showLanguage = visibleFields.has('language');

  const styles = StyleSheet.create({
    card: {
      backgroundColor: colors.card,
      borderRadius: 16,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: colors.border,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    cardHeaderAvatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      marginRight: 16,
      borderWidth: 2,
      borderColor: colors.primary,
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
    cardSubtitle: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 2,
    },
    cardContent: {
      padding: 16,
      gap: 12,
    },
    profileFieldRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 16,
      borderBottomWidth: 0,
      paddingBottom: 0,
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
    divider: {
      height: 1,
      backgroundColor: colors.border,
      marginVertical: 16,
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
    badgeText: {
      fontSize: 11,
      fontWeight: '700' as const,
      color: colors.onAccent,
      textTransform: 'uppercase' as const,
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
  });

  const hasContentBelowHeader = showUsername || showInfoRows || showLanguage;

  return (
    <View style={styles.card} testID="profile-info-card">
      <TouchableOpacity
        style={styles.cardHeader}
        onPress={onAvatarPress}
        activeOpacity={0.7}
        testID="profile-avatar-button"
        disabled={isGuest || !showAvatar}
      >
        {showAvatar && user?.avatar && user.avatar.trim() !== '' ? (
          <CachedImage
            scope={userScope(user.id)}
            cacheKey="avatar"
            version={String(user.avatarVersion ?? 0)}
            uri={user.avatar}
            style={styles.cardHeaderAvatar}
            fallbackSource={require('../../../assets/images/icon.png')}
          />
        ) : (
          <View style={styles.cardIconContainer}>
            <UserIcon size={24} color="#FFFFFF" />
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>{t('settings.profileInformation')}</Text>
          {showAvatar && !isGuest && (
            <Text style={styles.cardSubtitle}>{t('settings.tapToChangeAvatar')}</Text>
          )}
        </View>
        {showAvatar && !isGuest && <Camera size={20} color={colors.textSecondary} />}
      </TouchableOpacity>
      {hasContentBelowHeader && (
        <View style={styles.cardContent}>
          {showUsername && (
            <View style={styles.profileFieldRow} testID="profile-field-username">
              <View style={styles.profileFieldInfo}>
                <Text style={styles.profileFieldLabel}>{t('settings.username')}</Text>
                <Text style={styles.profileFieldDescription}>
                  {user?.username || user?.name}
                </Text>
              </View>
              {!isGuest && (
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={onEditUsername}
                  testID="edit-username-button"
                >
                  <Edit3 size={16} color={colors.primary} />
                </TouchableOpacity>
              )}
            </View>
          )}

          {showUsername && showInfoRows && <View style={styles.divider} />}

          {visibleFields.has('email') && (
            <View style={styles.infoRow} testID="profile-field-email">
              <Text style={styles.infoLabel}>{t('auth.email')}</Text>
              <Text style={styles.infoValue}>{user?.email}</Text>
            </View>
          )}
          {visibleFields.has('role') && (
            <View style={styles.infoRow} testID="profile-field-role">
              <Text style={styles.infoLabel}>{t('home.role')}</Text>
              <View style={styles.profileBadge}>
                <Text style={styles.badgeText}>{user?.role}</Text>
              </View>
            </View>
          )}
          {visibleFields.has('provider') && (
            <View style={styles.infoRow} testID="profile-field-provider">
              <Text style={styles.infoLabel}>{t('home.provider')}</Text>
              <Text style={styles.infoValue}>{user?.provider}</Text>
            </View>
          )}

          {showLanguage && (showUsername || showInfoRows) && <View style={styles.divider} />}

          {showLanguage && (
            <TouchableOpacity
              style={[styles.infoRow, { paddingVertical: 12 }]}
              onPress={onLanguagePress}
              testID="profile-field-language"
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
          )}
        </View>
      )}
    </View>
  );
}
