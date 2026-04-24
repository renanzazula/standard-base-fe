import {useAdminConfig} from '@core/contexts/AdminConfigContext';
import {usePreferences} from '@core/contexts/PreferencesContext';
import {Stack} from 'expo-router';
import {Clock, Minus, Plus} from 'lucide-react-native';
import {ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View} from 'react-native';

export default function SessionConfigScreen() {
  const { colors } = usePreferences();
  const { config, updateSessionConfig } = useAdminConfig();

  const MIN_SESSION_TIME = 5 * 60 * 1000;
  const MAX_SESSION_TIME = 24 * 60 * 60 * 1000;
  const MIN_IDLE_TIME = 5 * 60 * 1000;
  const MAX_IDLE_TIME = 24 * 60 * 60 * 1000;
  const TIME_STEP = 5 * 60 * 1000;

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
    sessionRow: {
      marginBottom: 16,
    },
    sessionLabel: {
      fontSize: 14,
      fontWeight: '600' as const,
      color: colors.text,
      marginBottom: 8,
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
    settingRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    settingRowLast: {
      borderBottomWidth: 0,
    },
    settingLabel: {
      fontSize: 14,
      fontWeight: '600' as const,
      color: colors.text,
    },
    settingDescription: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 2,
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

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Session Configuration',
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.text,
        }}
      />
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Session Timeout Settings</Text>

            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardIcon}>
                  <Clock size={20} color={colors.text} />
                </View>
                <Text style={styles.cardTitle}>Session Timeout Settings</Text>
              </View>

              <View style={styles.sessionRow}>
                <Text style={styles.sessionLabel}>Maximum Session Time</Text>
                <Text style={styles.settingDescription}>
                  Total active session lifetime (5 min - 24 hours)
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
                <Text style={styles.sessionLabel}>Idle Timeout</Text>
                <Text style={styles.settingDescription}>
                  Time of inactivity before auto logout (5 min - 24 hours)
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

              <View style={[styles.settingRow, styles.settingRowLast]}>
                <View>
                  <Text style={styles.settingLabel}>Auto Refresh Session</Text>
                  <Text style={styles.settingDescription}>
                    Extend session while user is active
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
                  <Text style={{ fontWeight: '700' as const }}>Session Configuration:</Text>{' '}
                  Controls how long users can remain logged in. The idle timeout triggers when there is no user activity, while the maximum session time is an absolute limit. Use the +/- buttons to adjust in 5-minute increments.
                  {config.sessionConfig.autoRefresh && '\n\nAuto-refresh is enabled: Session will extend automatically while user is active.'}
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </>
  );
}
