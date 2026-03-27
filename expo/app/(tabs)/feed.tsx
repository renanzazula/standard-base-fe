import { usePreferences } from '@/contexts/PreferencesContext';
import { Rss, TrendingUp, Users, Star } from 'lucide-react-native';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTranslation } from '@/hooks/useTranslation';

export default function FeedScreen() {
  const { colors } = usePreferences();
  const { t } = useTranslation();

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
    greeting: {
      fontSize: 28,
      fontWeight: '700' as const,
      color: colors.text,
      marginBottom: 8,
    },
    subGreeting: {
      fontSize: 16,
      color: colors.textSecondary,
    },
    placeholderCard: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 32,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
    },
    iconContainer: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 20,
    },
    placeholderTitle: {
      fontSize: 20,
      fontWeight: '700' as const,
      color: colors.text,
      marginBottom: 8,
      textAlign: 'center',
    },
    placeholderText: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
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
      padding: 20,
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
    sectionTitle: {
      fontSize: 22,
      fontWeight: '700' as const,
      color: colors.text,
      marginBottom: 16,
      marginTop: 8,
    },
  });

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.greeting}>{t('feed.feedTitle')}</Text>
          <Text style={styles.subGreeting}>{t('feed.feedSubtitle')}</Text>
        </View>

        <View style={styles.placeholderCard}>
          <View style={styles.iconContainer}>
            <Rss size={40} color={colors.primary} />
          </View>
          <Text style={styles.placeholderTitle}>{t('feed.comingSoon')}</Text>
          <Text style={styles.placeholderText}>
            {t('feed.feedDescription')}
          </Text>
        </View>

        <Text style={styles.sectionTitle}>{t('feed.plannedFeatures')}</Text>
        <View style={styles.featureGrid}>
          <View style={styles.featureCard}>
            <View style={styles.featureIcon}>
              <TrendingUp size={32} color={colors.primary} />
            </View>
            <Text style={styles.featureTitle}>{t('feed.trending')}</Text>
            <Text style={styles.featureDescription}>{t('feed.trendingDescription')}</Text>
          </View>

          <View style={styles.featureCard}>
            <View style={styles.featureIcon}>
              <Users size={32} color={colors.primary} />
            </View>
            <Text style={styles.featureTitle}>{t('feed.social')}</Text>
            <Text style={styles.featureDescription}>{t('feed.socialDescription')}</Text>
          </View>

          <View style={styles.featureCard}>
            <View style={styles.featureIcon}>
              <Star size={32} color={colors.primary} />
            </View>
            <Text style={styles.featureTitle}>{t('feed.favorites')}</Text>
            <Text style={styles.featureDescription}>{t('feed.favoritesDescription')}</Text>
          </View>

          <View style={styles.featureCard}>
            <View style={styles.featureIcon}>
              <Rss size={32} color={colors.primary} />
            </View>
            <Text style={styles.featureTitle}>{t('feed.updates')}</Text>
            <Text style={styles.featureDescription}>{t('feed.updatesDescription')}</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
