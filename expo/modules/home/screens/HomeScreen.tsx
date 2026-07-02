import {useAuth} from '@core/contexts/AuthContext';
import {usePreferences} from '@core/contexts/PreferencesContext';
import {Activity, Home, Shield, User} from 'lucide-react-native';
import {ScrollView, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {AVAILABLE_LANGUAGES} from '@shared/constants/languages';
import {FONTS} from '@shared/constants/typography';
import {MAX_CONTENT_WIDTH} from '@shared/constants/layout';
import {useTranslation} from '@shared/hooks/useTranslation';

export default function HomeScreen() {
  const { colors, language } = usePreferences();
  const { user, updateActivity } = useAuth();
  const { t } = useTranslation();

  const handleInteraction = () => {
    updateActivity();
  };

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
    header: {
      marginBottom: 32,
    },
    greeting: {
      fontSize: 28,
      fontFamily: FONTS.display,
      color: colors.text,
      marginBottom: 8,
    },
    subGreeting: {
      fontSize: 16,
      color: colors.textSecondary,
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
    badge: {
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 12,
      backgroundColor: colors.primary,
    },
    badgeText: {
      fontSize: 12,
      fontWeight: '700' as const,
      color: '#FFFFFF',
      textTransform: 'uppercase' as const,
    },
    sectionTitle: {
      fontSize: 22,
      fontWeight: '700' as const,
      color: colors.text,
      marginBottom: 16,
      marginTop: 8,
    },
    featureGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    featureCard: {
      flex: 1,
      minWidth: '47%',
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    featureIcon: {
      marginBottom: 12,
    },
    featureTitle: {
      fontSize: 14,
      fontWeight: '600' as const,
      color: colors.text,
      textAlign: 'center',
    },
    featureDescription: {
      fontSize: 12,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: 4,
    },
  });

  return (
    <View style={styles.container} onTouchStart={handleInteraction}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.greeting}>{t('home.welcomeBack')}, {user?.name}!</Text>
          <Text style={styles.subGreeting}>{t('home.happeningToday')}</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardIconContainer}>
              <User size={24} color="#FFFFFF" />
            </View>
            <Text style={styles.cardTitle}>{t('home.profileInformation')}</Text>
          </View>
          <View style={styles.cardContent}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t('auth.email')}</Text>
              <Text style={styles.infoValue}>{user?.email}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t('home.role')}</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{user?.role}</Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t('home.provider')}</Text>
              <Text style={styles.infoValue}>{user?.provider}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t('home.language')}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={{ fontSize: 18 }}>{AVAILABLE_LANGUAGES[language].flag}</Text>
                <Text style={styles.infoValue}>{AVAILABLE_LANGUAGES[language].nativeName}</Text>
              </View>
            </View>
          </View>
        </View>

        {user?.role === 'admin' && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardIconContainer}>
                <Shield size={24} color="#FFFFFF" />
              </View>
              <Text style={styles.cardTitle}>{t('home.adminAccess')}</Text>
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.infoLabel}>
                {t('home.adminPrivileges')}
              </Text>
            </View>
          </View>
        )}

        <Text style={styles.sectionTitle}>{t('home.quickActions')}</Text>
        <View style={styles.featureGrid}>
          <TouchableOpacity style={styles.featureCard} onPress={handleInteraction}>
            <View style={styles.featureIcon}>
              <Home size={32} color={colors.primary} />
            </View>
            <Text style={styles.featureTitle}>{t('home.dashboard')}</Text>
            <Text style={styles.featureDescription}>{t('home.viewOverview')}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.featureCard} onPress={handleInteraction}>
            <View style={styles.featureIcon}>
              <Activity size={32} color={colors.primary} />
            </View>
            <Text style={styles.featureTitle}>{t('home.activity')}</Text>
            <Text style={styles.featureDescription}>{t('home.trackProgress')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
