import {usePreferences} from '@core/contexts/PreferencesContext';
import type {SplashPlatforms, SplashWriteInput} from '@core/services/splash';
import {createSplashScreen, listSplashScreens, suggestSplashPeriod, updateSplashScreen,} from '@core/services/splash';
import {MAX_CONTENT_WIDTH} from '@shared/constants/layout';
import {useTranslation} from '@shared/hooks/useTranslation';
import {showAlert} from '@shared/utils/alert';
import {Stack, useLocalSearchParams, useRouter} from 'expo-router';
import {Eye} from 'lucide-react-native';
import {useEffect, useState} from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    View,
} from 'react-native';
import SplashOverlay from '../components/SplashOverlay';
import {formatLocalDateTime, parseLocalDateTime} from '../splashForm';

const PLATFORM_OPTIONS: SplashPlatforms[] = ['ALL', 'WEB', 'MOBILE'];

export default function SplashEditScreen() {
  const {colors} = usePreferences();
  const {t} = useTranslation();
  const router = useRouter();
  const {id} = useLocalSearchParams<{id?: string}>();
  const isEdit = !!id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [backgroundColor, setBackgroundColor] = useState('');
  const [textColor, setTextColor] = useState('');
  const [buttonLabel, setButtonLabel] = useState('');
  const [externalUrl, setExternalUrl] = useState('');
  const [publishStart, setPublishStart] = useState('');
  const [publishEnd, setPublishEnd] = useState('');
  const [displayLimit, setDisplayLimit] = useState('1');
  const [alwaysShowForGuest, setAlwaysShowForGuest] = useState(true);
  const [platforms, setPlatforms] = useState<SplashPlatforms>('ALL');
  const [priority, setPriority] = useState('50');
  const [isDefault, setIsDefault] = useState(false);
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (id) {
          const {splashScreens} = await listSplashScreens();
          const existing = splashScreens.find((s) => s.id === id);
          if (existing && !cancelled) {
            setTitle(existing.title);
            setSubtitle(existing.subtitle ?? '');
            setImageUrl(existing.imageUrl ?? '');
            setBackgroundColor(existing.backgroundColor ?? '');
            setTextColor(existing.textColor ?? '');
            setButtonLabel(existing.buttonLabel ?? '');
            setExternalUrl(existing.externalUrl ?? '');
            setPublishStart(formatLocalDateTime(existing.publishStart));
            setPublishEnd(formatLocalDateTime(existing.publishEnd));
            setDisplayLimit(String(existing.displayLimitPerDay));
            setAlwaysShowForGuest(existing.alwaysShowForGuest);
            setPlatforms(existing.platforms);
            setPriority(String(existing.priority));
            setIsDefault(existing.isDefault);
            setEnabled(existing.enabled);
          }
        } else {
          // BR14/AC14: pre-fill the next available publish period
          const suggestion = await suggestSplashPeriod().catch(() => null);
          if (suggestion && !cancelled) {
            setPublishStart(formatLocalDateTime(suggestion.publishStart));
            setPublishEnd(formatLocalDateTime(suggestion.publishEnd));
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const buildInput = (): SplashWriteInput | null => {
    if (!title.trim()) {
      showAlert(t('common.error'), t('splash.validationTitleRequired'));
      return null;
    }
    const start = parseLocalDateTime(publishStart);
    const end = parseLocalDateTime(publishEnd);
    if (start === undefined || end === undefined) {
      showAlert(t('common.error'), t('splash.validationInvalidDate'));
      return null;
    }
    return {
      title: title.trim(),
      subtitle: subtitle.trim() || undefined,
      imageUrl: imageUrl.trim() || undefined,
      backgroundColor: backgroundColor.trim() || undefined,
      textColor: textColor.trim() || undefined,
      buttonLabel: buttonLabel.trim() || undefined,
      externalUrl: externalUrl.trim() || undefined,
      publishStart: start ?? undefined,
      publishEnd: end ?? undefined,
      displayLimitPerDay: Math.max(0, parseInt(displayLimit, 10) || 0),
      alwaysShowForGuest,
      platforms,
      priority: parseInt(priority, 10) || 50,
      isDefault,
      enabled,
    };
  };

  const handleSave = async () => {
    const input = buildInput();
    if (!input) return;
    setSaving(true);
    try {
      if (isEdit && id) {
        await updateSplashScreen(id, input);
      } else {
        await createSplashScreen(input);
      }
      showAlert(t('common.success'), t('splash.saved'));
      router.back();
    } catch (error) {
      showAlert(
        t('common.error'),
        error instanceof Error && error.message ? error.message : t('splash.saveFailed'),
      );
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = [
    styles.input,
    {color: colors.text, borderColor: colors.border, backgroundColor: colors.surface},
  ];
  const labelStyle = [styles.label, {color: colors.textSecondary}];

  if (loading) {
    return (
      <View style={[styles.container, styles.center, {backgroundColor: colors.background}]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, {backgroundColor: colors.background}]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Stack.Screen options={{title: isEdit ? t('splash.formTitleEdit') : t('splash.formTitleCreate')}} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.sectionTitle, {color: colors.textSecondary}]}>{t('splash.sectionContent')}</Text>

        <Text style={labelStyle}>{t('splash.fieldTitle')}</Text>
        <TextInput style={inputStyle} value={title} onChangeText={setTitle} />

        <Text style={labelStyle}>{t('splash.fieldSubtitle')}</Text>
        <TextInput style={inputStyle} value={subtitle} onChangeText={setSubtitle} />

        <Text style={labelStyle}>{t('splash.fieldImageUrl')}</Text>
        <TextInput style={inputStyle} value={imageUrl} onChangeText={setImageUrl} autoCapitalize="none" />

        <View style={styles.rowPair}>
          <View style={styles.rowPairItem}>
            <Text style={labelStyle}>{t('splash.fieldBackgroundColor')}</Text>
            <TextInput style={inputStyle} value={backgroundColor} onChangeText={setBackgroundColor} autoCapitalize="none" placeholder="#1A1A1C" placeholderTextColor={colors.textSecondary} />
          </View>
          <View style={styles.rowPairItem}>
            <Text style={labelStyle}>{t('splash.fieldTextColor')}</Text>
            <TextInput style={inputStyle} value={textColor} onChangeText={setTextColor} autoCapitalize="none" placeholder="#FFFFFF" placeholderTextColor={colors.textSecondary} />
          </View>
        </View>

        <Text style={labelStyle}>{t('splash.fieldButtonLabel')}</Text>
        <TextInput style={inputStyle} value={buttonLabel} onChangeText={setButtonLabel} />

        <Text style={labelStyle}>{t('splash.fieldExternalUrl')}</Text>
        <TextInput style={inputStyle} value={externalUrl} onChangeText={setExternalUrl} autoCapitalize="none" placeholder="https://" placeholderTextColor={colors.textSecondary} />

        <Text style={[styles.sectionTitle, {color: colors.textSecondary, marginTop: 16}]}>{t('splash.sectionSchedule')}</Text>

        <Text style={labelStyle}>{t('splash.fieldPublishStart')}</Text>
        <TextInput style={inputStyle} value={publishStart} onChangeText={setPublishStart} autoCapitalize="none" placeholder="2026-07-04 08:00" placeholderTextColor={colors.textSecondary} />
        <Text style={[styles.hint, {color: colors.textSecondary}]}>{t('splash.dateFormatHint')}</Text>

        <Text style={labelStyle}>{t('splash.fieldPublishEnd')}</Text>
        <TextInput style={inputStyle} value={publishEnd} onChangeText={setPublishEnd} autoCapitalize="none" placeholder="2026-07-04 23:59" placeholderTextColor={colors.textSecondary} />

        <Text style={[styles.sectionTitle, {color: colors.textSecondary, marginTop: 16}]}>{t('splash.sectionBehavior')}</Text>

        <Text style={labelStyle}>{t('splash.fieldPlatforms')}</Text>
        <View style={styles.segments}>
          {PLATFORM_OPTIONS.map((option) => {
            const selected = platforms === option;
            return (
              <Pressable
                key={option}
                style={[
                  styles.segment,
                  {
                    backgroundColor: selected ? colors.primary : colors.surface,
                    borderColor: selected ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => setPlatforms(option)}
              >
                <Text style={[styles.segmentText, {color: selected ? colors.onAccent : colors.text}]}>
                  {option}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.rowPair}>
          <View style={styles.rowPairItem}>
            <Text style={labelStyle}>{t('splash.fieldDisplayLimit')}</Text>
            <TextInput style={inputStyle} value={displayLimit} onChangeText={setDisplayLimit} keyboardType="number-pad" />
          </View>
          <View style={styles.rowPairItem}>
            <Text style={labelStyle}>{t('splash.fieldPriority')}</Text>
            <TextInput style={inputStyle} value={priority} onChangeText={setPriority} keyboardType="number-pad" />
          </View>
        </View>

        <View style={styles.switchRow}>
          <Text style={[styles.switchLabel, {color: colors.text}]}>{t('splash.fieldAlwaysShowForGuest')}</Text>
          <Switch value={alwaysShowForGuest} onValueChange={setAlwaysShowForGuest} />
        </View>
        <View style={styles.switchRow}>
          <Text style={[styles.switchLabel, {color: colors.text}]}>{t('splash.fieldIsDefault')}</Text>
          <Switch value={isDefault} onValueChange={setIsDefault} />
        </View>
        <View style={styles.switchRow}>
          <Text style={[styles.switchLabel, {color: colors.text}]}>{t('splash.fieldEnabled')}</Text>
          <Switch value={enabled} onValueChange={setEnabled} />
        </View>

        <Pressable
          style={[styles.previewButton, {borderColor: colors.border, backgroundColor: colors.surface}]}
          onPress={() => setShowPreview(true)}
        >
          <Eye size={18} color={colors.text} />
          <Text style={[styles.previewButtonText, {color: colors.text}]}>{t('splash.preview')}</Text>
        </Pressable>

        <Pressable
          style={[styles.saveButton, {backgroundColor: saving ? colors.border : colors.primary}]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={[styles.saveButtonText, {color: colors.onAccent}]}>
            {saving ? t('common.loading') : t('common.save')}
          </Text>
        </Pressable>
      </ScrollView>

      <Modal visible={showPreview} animationType="fade" onRequestClose={() => setShowPreview(false)}>
        <SplashOverlay
          splash={{
            title: title || 'Title',
            subtitle: subtitle || undefined,
            imageUrl: imageUrl || undefined,
            backgroundColor: backgroundColor || undefined,
            textColor: textColor || undefined,
            buttonLabel: buttonLabel || undefined,
            externalUrl: externalUrl || undefined,
          }}
          onDismiss={() => setShowPreview(false)}
        />
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1},
  center: {alignItems: 'center', justifyContent: 'center'},
  content: {padding: 20, paddingBottom: 60, width: '100%', maxWidth: MAX_CONTENT_WIDTH, alignSelf: 'center'},
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  label: {fontSize: 13, fontWeight: '600', marginBottom: 6, marginTop: 10},
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  hint: {fontSize: 11, marginTop: 4},
  rowPair: {flexDirection: 'row', gap: 12},
  rowPairItem: {flex: 1},
  segments: {flexDirection: 'row', gap: 8},
  segment: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  segmentText: {fontSize: 14, fontWeight: '600'},
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  switchLabel: {flex: 1, fontSize: 15, marginRight: 12},
  previewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 20,
    marginBottom: 12,
  },
  previewButtonText: {fontSize: 15, fontWeight: '600'},
  saveButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {fontSize: 16, fontWeight: '700'},
});
