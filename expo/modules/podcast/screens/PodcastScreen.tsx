import {StyleSheet, Text, View} from 'react-native';
import {usePreferences} from '@core/contexts/PreferencesContext';
import {Stack} from 'expo-router';

export default function PodcastScreen() {
  const { colors } = usePreferences();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    title: {
      fontSize: 24,
      fontWeight: '700' as const,
      color: colors.text,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
    },
  });

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Podcast',
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.text,
        }}
      />
      <View style={styles.container} testID="podcast-screen">
        <Text style={styles.title}>Podcast</Text>
        <Text style={styles.subtitle}>Your podcast content goes here</Text>
      </View>
    </>
  );
}
