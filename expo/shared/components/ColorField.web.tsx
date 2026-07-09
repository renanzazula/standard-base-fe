import {usePreferences} from '@core/contexts/PreferencesContext';
import {StyleSheet, Text, TextInput, View} from 'react-native';
import {isValidHexColor} from '@shared/utils/color';
import type {ColorFieldProps} from './ColorField';

/** Expand #RGB and guard invalid values — <input type="color"> only accepts #RRGGBB. */
function toPickerValue(value: string): string {
  const trimmed = value.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(trimmed)) return trimmed;
  if (/^#[0-9a-fA-F]{3}$/.test(trimmed)) {
    return `#${trimmed[1]}${trimmed[1]}${trimmed[2]}${trimmed[2]}${trimmed[3]}${trimmed[3]}`;
  }
  return '#000000';
}

/**
 * Web build: the browser's native color picker paired with an editable HEX
 * field. Values are always persisted as HEX strings.
 */
export default function ColorField({label, value, onChange, placeholder, testID}: ColorFieldProps) {
  const {colors} = usePreferences();
  const valid = isValidHexColor(value);

  return (
    <View>
      <Text style={[styles.label, {color: colors.textSecondary}]}>{label}</Text>
      <View style={styles.row}>
        <input
          data-testid={testID ? `${testID}-picker` : undefined}
          type="color"
          value={toPickerValue(value)}
          onChange={(event) => onChange(event.target.value.toUpperCase())}
          style={{
            width: 42,
            height: 42,
            padding: 2,
            border: `1px solid ${colors.border}`,
            borderRadius: 10,
            backgroundColor: colors.surface,
            cursor: 'pointer',
          }}
        />
        <TextInput
          testID={testID}
          style={[
            styles.input,
            {
              color: colors.text,
              backgroundColor: colors.surface,
              borderColor: valid ? colors.border : colors.error,
            },
          ]}
          value={value}
          onChangeText={onChange}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder={placeholder ?? '#RRGGBB'}
          placeholderTextColor={colors.textSecondary}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {fontSize: 13, fontWeight: '600', marginBottom: 6, marginTop: 10},
  row: {flexDirection: 'row', alignItems: 'center', gap: 8},
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
});
