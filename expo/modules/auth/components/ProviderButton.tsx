import {usePreferences} from '@core/contexts/PreferencesContext';
import type {LucideIcon} from 'lucide-react-native';
import {StyleSheet, Text, TouchableOpacity} from 'react-native';

interface ProviderButtonProps {
  testID?: string;
  icon: LucideIcon;
  label: string;
  onPress: () => void;
  disabled?: boolean;
}

/**
 * Uniform secondary button for the login page's alternative sign-in methods
 * (brokered identity providers, guest access, hosted-login fallback). New
 * providers only need an icon + label + handler — no layout changes.
 */
export default function ProviderButton({ testID, icon: Icon, label, onPress, disabled }: ProviderButtonProps) {
  const { colors } = usePreferences();

  const styles = StyleSheet.create({
    button: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      height: 52,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    label: {
      fontSize: 16,
      fontWeight: '600' as const,
      color: colors.text,
      marginLeft: 12,
    },
  });

  return (
    <TouchableOpacity testID={testID} style={styles.button} onPress={onPress} disabled={disabled}>
      <Icon size={20} color={colors.text} />
      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
  );
}
