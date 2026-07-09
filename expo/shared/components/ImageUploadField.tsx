import {usePreferences} from '@core/contexts/PreferencesContext';
import {useTranslation} from '@shared/hooks/useTranslation';
import {showAlert} from '@shared/utils/alert';
import * as ImagePicker from 'expo-image-picker';
import {ImagePlus, RefreshCw, Trash2} from 'lucide-react-native';
import {ActivityIndicator, Image, Platform, StyleSheet, Text, TouchableOpacity, View} from 'react-native';

export type ImageUploadFieldProps = {
  label: string;
  /** Preview URL of the current image, if any. */
  imageUrl?: string | null;
  busy?: boolean;
  onPick: (asset: ImagePicker.ImagePickerAsset) => void;
  onRemove: () => void;
  testID?: string;
};

/**
 * Reusable pick/preview/replace/remove image control. The caller owns the
 * actual upload (onPick receives the picked asset) so the same component
 * works against any endpoint.
 */
export default function ImageUploadField({
  label,
  imageUrl,
  busy = false,
  onPick,
  onRemove,
  testID,
}: ImageUploadFieldProps) {
  const {colors} = usePreferences();
  const {t} = useTranslation();

  const handleSelect = async () => {
    if (busy) return;
    // Same web constraint as the avatar/branding pickers: browsers only open
    // the file dialog if it's triggered synchronously in the tap's call
    // stack, so the permission await must be skipped on web.
    if (Platform.OS !== 'web') {
      const {status} = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        showAlert(t('imageUpload.permissionTitle'), t('imageUpload.permissionMessage'));
        return;
      }
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.9,
    });

    if (!result.canceled && result.assets[0]) {
      onPick(result.assets[0]);
    }
  };

  const handleRemove = () => {
    if (busy) return;
    showAlert(t('imageUpload.removeConfirmTitle'), t('imageUpload.removeConfirmMessage'), [
      {text: t('common.cancel'), style: 'cancel'},
      {text: t('imageUpload.remove'), style: 'destructive', onPress: onRemove},
    ]);
  };

  return (
    <View testID={testID}>
      <Text style={[styles.label, {color: colors.textSecondary}]}>{label}</Text>

      {imageUrl ? (
        <View>
          <View style={[styles.previewWrap, {borderColor: colors.border, backgroundColor: colors.surface}]}>
            <Image source={{uri: imageUrl}} style={styles.preview} resizeMode="cover" />
            {busy && (
              <View style={styles.busyOverlay}>
                <ActivityIndicator color="#FFFFFF" />
              </View>
            )}
          </View>
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.actionButton, {borderColor: colors.border, backgroundColor: colors.surface}]}
              onPress={handleSelect}
              disabled={busy}
            >
              <RefreshCw size={16} color={colors.text} />
              <Text style={[styles.actionText, {color: colors.text}]}>{t('imageUpload.replace')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, {borderColor: colors.error + '40', backgroundColor: colors.error + '10'}]}
              onPress={handleRemove}
              disabled={busy}
            >
              <Trash2 size={16} color={colors.error} />
              <Text style={[styles.actionText, {color: colors.error}]}>{t('imageUpload.remove')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity
          style={[styles.dropZone, {borderColor: colors.border, backgroundColor: colors.surface}]}
          onPress={handleSelect}
          disabled={busy}
        >
          {busy ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <>
              <ImagePlus size={28} color={colors.textSecondary} />
              <Text style={[styles.dropZoneText, {color: colors.textSecondary}]}>
                {t('imageUpload.upload')}
              </Text>
            </>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {fontSize: 13, fontWeight: '600', marginBottom: 6, marginTop: 10},
  previewWrap: {borderWidth: 1, borderRadius: 12, overflow: 'hidden'},
  preview: {width: '100%', height: 180},
  busyOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: {flexDirection: 'row', gap: 8, marginTop: 8},
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
  },
  actionText: {fontSize: 13, fontWeight: '600'},
  dropZone: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 32,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  dropZoneText: {fontSize: 13, fontWeight: '600'},
});
