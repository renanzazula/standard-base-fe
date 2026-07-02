import {ScrollView, StyleSheet, Text, View} from 'react-native';
import {usePreferences} from '@core/contexts/PreferencesContext';
import {FONTS} from '@shared/constants/typography';
import {MAX_CONTENT_WIDTH} from '@shared/constants/layout';
import {Flame} from 'lucide-react-native';

export default function SkateSquareScreen() {
  const { colors } = usePreferences();

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
      alignItems: 'center',
      marginBottom: 32,
      paddingTop: 20,
    },
    iconContainer: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colors.primary + '20',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },
    title: {
      fontSize: 28,
      fontFamily: FONTS.display,
      color: colors.text,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 24,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    cardTitle: {
      fontSize: 18,
      fontWeight: '700' as const,
      color: colors.text,
      marginBottom: 12,
    },
    cardText: {
      fontSize: 15,
      color: colors.textSecondary,
      lineHeight: 22,
    },
  });

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} testID="skate-square-scroll">
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Flame size={40} color={colors.primary} />
          </View>
          <Text style={styles.title}>Skate Square</Text>
          <Text style={styles.subtitle}>Welcome to Skate Square</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>About Skate Square</Text>
          <Text style={styles.cardText}>
            This is a placeholder page for the Skate Square tab. Content and features will be implemented here.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Coming Soon</Text>
          <Text style={styles.cardText}>
            More features and functionality will be added to this section in future updates.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
