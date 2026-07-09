import {usePreferences} from '@core/contexts/PreferencesContext';
import DateTimePicker, {DateTimePickerEvent} from '@react-native-community/datetimepicker';
import {Calendar} from 'lucide-react-native';
import {useState} from 'react';
import {Platform, Pressable, StyleSheet, Text, View} from 'react-native';

export type DateTimeFieldProps = {
  label: string;
  /** ISO string, or null when unset. */
  value: string | null;
  onChange: (iso: string | null) => void;
  error?: string | null;
  testID?: string;
};

/**
 * Native date+time picker (24h). Android uses the platform's two-step
 * date-then-time dialogs; iOS shows an inline datetime spinner. The web build
 * resolves DateTimeField.web.tsx instead.
 */
export default function DateTimeField({label, value, onChange, error, testID}: DateTimeFieldProps) {
  const {colors, language} = usePreferences();
  const [step, setStep] = useState<'idle' | 'date' | 'time' | 'datetime'>('idle');
  const [draftDate, setDraftDate] = useState<Date | null>(null);

  const current = value ? new Date(value) : new Date();
  const display = value
    ? current.toLocaleString(language, {dateStyle: 'medium', timeStyle: 'short', hour12: false})
    : '';

  const openPicker = () => {
    setStep((prev) => (prev === 'idle' ? (Platform.OS === 'ios' ? 'datetime' : 'date') : 'idle'));
  };

  const handleDate = (event: DateTimePickerEvent, date?: Date) => {
    if (event.type === 'dismissed' || !date) {
      setStep('idle');
      return;
    }
    setDraftDate(date);
    setStep('time');
  };

  const handleTime = (event: DateTimePickerEvent, time?: Date) => {
    setStep('idle');
    if (event.type === 'dismissed' || !time) return;
    const merged = new Date(draftDate ?? current);
    merged.setHours(time.getHours(), time.getMinutes(), 0, 0);
    onChange(merged.toISOString());
  };

  const handleDateTime = (event: DateTimePickerEvent, date?: Date) => {
    if (event.type === 'dismissed') {
      setStep('idle');
      return;
    }
    if (date) onChange(date.toISOString());
  };

  return (
    <View>
      <Text style={[styles.label, {color: colors.textSecondary}]}>{label}</Text>
      <Pressable
        testID={testID}
        onPress={openPicker}
        style={[
          styles.field,
          {backgroundColor: colors.surface, borderColor: error ? colors.error : colors.border},
        ]}
      >
        <Text style={[styles.value, {color: display ? colors.text : colors.textSecondary}]}>
          {display || label}
        </Text>
        <Calendar size={16} color={colors.textSecondary} />
      </Pressable>
      {error ? <Text style={[styles.error, {color: colors.error}]}>{error}</Text> : null}

      {step === 'date' && (
        <DateTimePicker value={current} mode="date" onChange={handleDate} />
      )}
      {step === 'time' && (
        <DateTimePicker value={draftDate ?? current} mode="time" is24Hour onChange={handleTime} />
      )}
      {step === 'datetime' && (
        <DateTimePicker
          value={current}
          mode="datetime"
          display="spinner"
          locale={language}
          onChange={handleDateTime}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {fontSize: 13, fontWeight: '600', marginBottom: 6, marginTop: 10},
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  value: {fontSize: 15, flex: 1, marginRight: 8},
  error: {fontSize: 11, marginTop: 4},
});
