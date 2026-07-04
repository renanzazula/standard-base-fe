import {usePosts} from '@core/contexts/PostsContext';
import {usePreferences} from '@core/contexts/PreferencesContext';
import {usePermissions} from '@shared/hooks/usePermissions';
import {PERMISSIONS} from '@shared/constants/permissions';
import {useTranslation} from '@shared/hooks/useTranslation';
import {useRouter} from 'expo-router';
import {ChevronRight, FileJson, Minus, Plus} from 'lucide-react-native';
import {useState} from 'react';
import {Alert, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {MAX_CONTENT_WIDTH} from '@shared/constants/layout';

export default function PodcastConfigScreen() {
  const {colors} = usePreferences();
  const {t} = useTranslation();
  const {hasPermission} = usePermissions();
  const router = useRouter();
  const {podcastPostsPerPage, updatePodcastPostsPerPage} = usePosts();

  const [localPerPage, setLocalPerPage] = useState(podcastPostsPerPage);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updatePodcastPostsPerPage(localPerPage);
      Alert.alert(t('common.success'), t('podcast.configSaved'));
    } catch {
      Alert.alert(t('common.error'), t('podcast.configSaveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const adjust = (delta: number) => {
    setLocalPerPage((prev) => Math.min(50, Math.max(5, prev + delta)));
  };

  return (
    <ScrollView
      style={[styles.container, {backgroundColor: colors.background}]}
      contentContainerStyle={styles.content}
    >
      <Text style={[styles.sectionTitle, {color: colors.textSecondary}]}>
        {t('podcast.podcastSettings')}
      </Text>

      <View style={[styles.card, {backgroundColor: colors.card, borderColor: colors.border}]}>
        <View style={[styles.row, {borderBottomColor: colors.border}]}>
          <View style={styles.rowInfo}>
            <Text style={[styles.rowLabel, {color: colors.text}]}>{t('podcast.postsPerPage')}</Text>
            <Text style={[styles.rowDescription, {color: colors.textSecondary}]}>
              {t('podcast.postsPerPageDescription')}
            </Text>
          </View>
          <View style={styles.counter}>
            <Pressable
              style={[styles.counterButton, {backgroundColor: colors.surface, borderColor: colors.border}]}
              onPress={() => adjust(-5)}
              disabled={localPerPage <= 5}
            >
              <Minus size={16} color={localPerPage <= 5 ? colors.textSecondary : colors.text} />
            </Pressable>
            <Text style={[styles.counterValue, {color: colors.text}]}>{localPerPage}</Text>
            <Pressable
              style={[styles.counterButton, {backgroundColor: colors.surface, borderColor: colors.border}]}
              onPress={() => adjust(5)}
              disabled={localPerPage >= 50}
            >
              <Plus size={16} color={localPerPage >= 50 ? colors.textSecondary : colors.text} />
            </Pressable>
          </View>
        </View>
      </View>

      <Pressable
        style={[styles.saveButton, {backgroundColor: saving ? colors.border : colors.primary}]}
        onPress={handleSave}
        disabled={saving}
      >
        <Text style={[styles.saveButtonText, {color: colors.onAccent}]}>
          {saving ? t('common.loading') : t('common.save')}
        </Text>
      </Pressable>

      {hasPermission(PERMISSIONS.FUNC_PODCAST_IMPORT_JSON) && (
        <>
          <Text style={[styles.sectionTitle, {color: colors.textSecondary, marginTop: 8}]}>
            {t('podcast.importJsonSection')}
          </Text>
          <View style={[styles.card, {backgroundColor: colors.card, borderColor: colors.border}]}>
            <TouchableOpacity
              style={styles.importRow}
              onPress={() => router.push('/podcast-import-json' as any)}
              activeOpacity={0.7}
            >
              <View style={styles.importIcon}>
                <FileJson size={20} color={colors.text} />
              </View>
              <View style={styles.importInfo}>
                <Text style={[styles.rowLabel, {color: colors.text}]}>{t('podcast.importJson')}</Text>
                <Text style={[styles.rowDescription, {color: colors.textSecondary}]}>
                  {t('podcast.importJsonDescription')}
                </Text>
              </View>
              <ChevronRight size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1},
  content: {padding: 20, paddingBottom: 60, width: '100%', maxWidth: MAX_CONTENT_WIDTH, alignSelf: 'center'},
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 24,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  rowInfo: {flex: 1, marginRight: 12},
  rowLabel: {fontSize: 15, fontWeight: '600', marginBottom: 2},
  rowDescription: {fontSize: 13},
  counter: {flexDirection: 'row', alignItems: 'center', gap: 12},
  counterButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterValue: {
    fontSize: 18,
    fontWeight: '700',
    minWidth: 32,
    textAlign: 'center',
  },
  saveButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  saveButtonText: {color: '#fff', fontSize: 16, fontWeight: '700'},
  importRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  importIcon: {
    width: 36,
    alignItems: 'center',
    marginRight: 12,
  },
  importInfo: {flex: 1, marginRight: 8},
});
