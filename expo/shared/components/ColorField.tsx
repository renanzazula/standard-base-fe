import {usePreferences} from '@core/contexts/PreferencesContext';
import {StyleSheet, Text, TextInput, TouchableOpacity, View} from 'react-native';
import {isValidHexColor} from '@shared/utils/color';

export type ColorFieldProps = {
  label: string;
  /** Raw HEX text ('' when unset). */
  value: string;
  onChange: (hex: string) => void;
  placeholder?: string;
  testID?: string;
};

export const COLOR_PRESETS = [
  '#1A1A1C', '#FFFFFF', '#000000', '#E63946',
  '#F4A261', '#2A9D8F', '#264653', '#7C3AED',
];

/**
 * Native color picker: live preview swatch + editable HEX field + preset
 * swatches. The web build (ColorField.web.tsx) adds the browser's native
 * color picker on top of the same HEX field.
 */
export default function ColorField({label, value, onChange, placeholder, testID}: ColorFieldProps) {
  const {colors} = usePreferences();
  const valid = isValidHexColor(value);
  const previewColor = valid && value.trim() ? value.trim() : 'transparent';

  return (
    <View>
      <Text style={[styles.label, {color: colors.textSecondary}]}>{label}</Text>
      <View style={styles.row}>
        <View
          testID={testID ? `${testID}-preview` : undefined}
          style={[styles.preview, {backgroundColor: previewColor, borderColor: colors.border}]}
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
      <View style={styles.presets}>
        {COLOR_PRESETS.map((preset) => (
          <TouchableOpacity
            key={preset}
            onPress={() => onChange(preset)}
            style={[
              styles.presetSwatch,
              {
                backgroundColor: preset,
                borderColor: value.trim().toUpperCase() === preset ? colors.primary : colors.border,
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {fontSize: 13, fontWeight: '600', marginBottom: 6, marginTop: 10},
  row: {flexDirection: 'row', alignItems: 'center', gap: 8},
  preview: {width: 40, height: 40, borderRadius: 10, borderWidth: 1},
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  presets: {flexDirection: 'row', gap: 6, marginTop: 8, flexWrap: 'wrap'},
  presetSwatch: {width: 26, height: 26, borderRadius: 8, borderWidth: 2},
});
