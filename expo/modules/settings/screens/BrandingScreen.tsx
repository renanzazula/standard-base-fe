import {useAdminConfig} from '@core/contexts/AdminConfigContext';
import {usePreferences} from '@core/contexts/PreferencesContext';
import {ApiError} from '@core/services/api';
import {Stack} from 'expo-router';
import {ImagePlus, Palette, Trash2} from 'lucide-react-native';
import React from 'react';
import {ActivityIndicator, Image, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import {showAlert} from '@shared/utils/alert';
import {MAX_CONTENT_WIDTH} from '@shared/constants/layout';

export default function BrandingScreen() {
  const { colors } = usePreferences();
  const { config, uploadLoginBackground, removeLoginBackground } = useAdminConfig();
  const [busy, setBusy] = React.useState(false);

  const backgroundUrl = config.brandingConfig.loginBackgroundUrl;

  const handleSelectBackground = async () => {
    // Same web constraint as the avatar picker: browsers only open the file
    // picker if it's triggered synchronously in the tap's call stack, so the
    // permission await must be skipped on web.
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        showAlert('Permission Required', 'Please grant photo library access to upload a background.');
        return;
      }
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.9,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setBusy(true);
      try {
        await uploadLoginBackground(asset.uri, asset.mimeType, asset.file);
        showAlert('Success', 'Login background updated.');
      } catch (error) {
        console.error('[Branding] Failed to upload login background:', error);
        const message = error instanceof ApiError ? error.message : 'Failed to upload the login background.';
        showAlert('Error', message);
      } finally {
        setBusy(false);
      }
    }
  };

  const handleRemoveBackground = () => {
    showAlert('Remove Background', 'Restore the default login background?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          setBusy(true);
          try {
            await removeLoginBackground();
            showAlert('Success', 'Login background removed.');
          } catch (error) {
            console.error('[Branding] Failed to remove login background:', error);
            const message = error instanceof ApiError ? error.message : 'Failed to remove the login background.';
            showAlert('Error', message);
          } finally {
            setBusy(false);
          }
        },
      },
    ]);
  };

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
    preview: {
      width: '100%',
      aspectRatio: 9 / 14,
      maxHeight: 320,
      borderRadius: 12,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
      marginBottom: 16,
    },
    previewImage: {
      width: '100%',
      height: '100%',
    },
    previewEmpty: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    previewEmptyText: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center' as const,
      paddingHorizontal: 24,
    },
    button: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      borderRadius: 12,
      paddingVertical: 14,
      marginBottom: 12,
      backgroundColor: colors.primary,
    },
    buttonText: {
      fontSize: 15,
      fontWeight: '600' as const,
      color: '#FFFFFF',
    },
    removeButton: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 0,
    },
    removeButtonText: {
      color: colors.text,
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

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Branding',
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.text,
        }}
      />
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Login Background</Text>
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardIcon}>
                  <Palette size={20} color={colors.text} />
                </View>
                <Text style={styles.cardTitle}>Background Image</Text>
              </View>

              <View style={styles.preview}>
                {backgroundUrl ? (
                  <Image source={{ uri: backgroundUrl }} style={styles.previewImage} resizeMode="cover" />
                ) : (
                  <View style={styles.previewEmpty}>
                    <Text style={styles.previewEmptyText}>
                      No custom background configured. The bundled default is shown on the login screen.
                    </Text>
                  </View>
                )}
              </View>

              <TouchableOpacity
                style={styles.button}
                onPress={handleSelectBackground}
                disabled={busy}
                activeOpacity={0.7}
                testID="upload-login-background"
              >
                {busy ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <ImagePlus size={18} color="#FFFFFF" />
                )}
                <Text style={styles.buttonText}>
                  {backgroundUrl ? 'Replace Background' : 'Upload Background'}
                </Text>
              </TouchableOpacity>

              {backgroundUrl ? (
                <TouchableOpacity
                  style={[styles.button, styles.removeButton]}
                  onPress={handleRemoveBackground}
                  disabled={busy}
                  activeOpacity={0.7}
                  testID="remove-login-background"
                >
                  <Trash2 size={18} color={colors.text} />
                  <Text style={[styles.buttonText, styles.removeButtonText]}>Remove Background</Text>
                </TouchableOpacity>
              ) : null}

              <View style={styles.infoBox}>
                <Text style={styles.infoText}>
                  JPEG, PNG or WebP up to 5MB. The image is shown behind the login and other
                  pre-authentication screens. Clients cache it locally and only re-download it
                  when a new version is uploaded.
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </>
  );
}
