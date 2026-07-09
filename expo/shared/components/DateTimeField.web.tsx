import {usePreferences} from '@core/contexts/PreferencesContext';
import {StyleSheet, Text, View} from 'react-native';
import type {DateTimeFieldProps} from './DateTimeField';

/** ISO → the local "YYYY-MM-DDTHH:mm" value <input type="datetime-local"> expects. */
function toInputValue(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * Web build: the browser's native datetime-local control gives us the visual
 * picker, 24-hour handling, and locale formatting for free.
 */
export default function DateTimeField({label, value, onChange, error, testID}: DateTimeFieldProps) {
  const {colors, theme} = usePreferences();

  return (
    <View>
      <Text style={[styles.label, {color: colors.textSecondary}]}>{label}</Text>
      <input
        data-testid={testID}
        type="datetime-local"
        value={toInputValue(value)}
        onChange={(event) => {
          const raw = event.target.value;
          if (!raw) {
            onChange(null);
            return;
          }
          const parsed = new Date(raw);
          if (!isNaN(parsed.getTime())) onChange(parsed.toISOString());
        }}
        style={{
          backgroundColor: colors.surface,
          color: colors.text,
          border: `1px solid ${error ? colors.error : colors.border}`,
          borderRadius: 10,
          padding: '11px 12px',
          fontSize: 15,
          fontFamily: 'inherit',
          width: '100%',
          boxSizing: 'border-box',
          colorScheme: theme === 'dark' ? 'dark' : 'light',
        }}
      />
      {error ? <Text style={[styles.error, {color: colors.error}]}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {fontSize: 13, fontWeight: '600', marginBottom: 6, marginTop: 10},
  error: {fontSize: 11, marginTop: 4},
});
