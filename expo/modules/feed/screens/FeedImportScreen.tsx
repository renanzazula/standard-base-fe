import {usePosts} from '@core/contexts/PostsContext';
import {usePreferences} from '@core/contexts/PreferencesContext';
import type {PodcastEpisodeJson} from '@core/services/feedImport';
import {convertEpisodesToPosts, parsePodcastJson} from '@core/services/feedImport';
import {useTranslation} from '@shared/hooks/useTranslation';
import {FileJson, Upload} from 'lucide-react-native';
import {useRef, useState} from 'react';
import {Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';

export default function FeedImportScreen() {
  const {colors} = usePreferences();
  const {t} = useTranslation();
  const {importPosts} = usePosts();

  const [episodes, setEpisodes] = useState<PodcastEpisodeJson[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleSelectFile = () => {
    if (Platform.OS !== 'web') {
      Alert.alert(t('common.error'), t('feed.importWebOnly'));
      return;
    }
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const raw = ev.target?.result as string;
        const parsed = parsePodcastJson(raw);
        setEpisodes(parsed);
        setFileName(file.name);
      } catch {
        Alert.alert(t('common.error'), t('feed.importInvalidJson'));
        setEpisodes([]);
        setFileName(null);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleImport = async () => {
    if (episodes.length === 0) return;
    setImporting(true);
    try {
      const posts = convertEpisodesToPosts(episodes);
      const result = await importPosts(posts);
      if (result.imported === episodes.length) {
        Alert.alert(
          t('common.success'),
          t('feed.importSuccess').replace('{imported}', String(result.imported)),
        );
      } else {
        Alert.alert(
          t('common.success'),
          t('feed.importPartial')
            .replace('{imported}', String(result.imported))
            .replace('{failed}', String(episodes.length - result.imported)),
        );
      }
      setEpisodes([]);
      setFileName(null);
    } catch {
      Alert.alert(t('common.error'), t('feed.importFailed'));
    } finally {
      setImporting(false);
    }
  };

  const preview = episodes.slice(0, 3);
  const hasFile = episodes.length > 0;

  return (
    <ScrollView
      style={[styles.container, {backgroundColor: colors.background}]}
      contentContainerStyle={styles.content}
    >
      {Platform.OS === 'web' && (
        <input
          ref={fileInputRef as any}
          type="file"
          accept=".json,application/json"
          style={{display: 'none'}}
          onChange={handleFileChange as any}
        />
      )}

      <Text style={[styles.sectionTitle, {color: colors.textSecondary}]}>
        {t('feed.importJsonSection')}
      </Text>

      <View style={[styles.card, {backgroundColor: colors.card, borderColor: colors.border}]}>
        <View style={[styles.row, {borderBottomColor: colors.border, borderBottomWidth: hasFile ? 1 : 0}]}>
          <View style={styles.rowIcon}>
            <FileJson size={22} color={colors.primary} />
          </View>
          <View style={styles.rowInfo}>
            <Text style={[styles.rowLabel, {color: colors.text}]}>{t('feed.importJson')}</Text>
            <Text style={[styles.rowDescription, {color: colors.textSecondary}]}>
              {fileName
                ? t('feed.fileSelected')
                    .replace('{count}', String(episodes.length))
                    .replace('{name}', fileName)
                : t('feed.importJsonDescription')}
            </Text>
          </View>
        </View>

        {hasFile && (
          <View style={styles.previewContainer}>
            <Text style={[styles.previewTitle, {color: colors.textSecondary}]}>
              Preview
            </Text>
            {preview.map((ep, i) => (
              <View
                key={i}
                style={[
                  styles.previewItem,
                  {borderBottomColor: colors.border, borderBottomWidth: i < preview.length - 1 ? 1 : 0},
                ]}
              >
                <Text style={[styles.previewItemText, {color: colors.text}]} numberOfLines={1}>
                  {ep.title}
                </Text>
                {ep.date || ep.duration ? (
                  <Text style={[styles.previewItemMeta, {color: colors.textSecondary}]}>
                    {[ep.date, ep.duration].filter(Boolean).join(' · ')}
                  </Text>
                ) : null}
              </View>
            ))}
            {episodes.length > 3 && (
              <Text style={[styles.previewMore, {color: colors.textSecondary}]}>
                +{episodes.length - 3} more
              </Text>
            )}
          </View>
        )}
      </View>

      <Pressable
        style={[styles.selectButton, {backgroundColor: colors.surface, borderColor: colors.border}]}
        onPress={handleSelectFile}
      >
        <Upload size={18} color={colors.text} />
        <Text style={[styles.selectButtonText, {color: colors.text}]}>
          {t('feed.selectJsonFile')}
        </Text>
      </Pressable>

      <Pressable
        style={[
          styles.importButton,
          {backgroundColor: !hasFile || importing ? colors.border : colors.primary},
        ]}
        onPress={handleImport}
        disabled={!hasFile || importing}
      >
        <Text style={styles.importButtonText}>
          {importing
            ? t('feed.importing')
            : t('feed.importPosts').replace('{count}', String(episodes.length))}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1},
  content: {padding: 20, paddingBottom: 60},
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
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  rowIcon: {
    width: 40,
    alignItems: 'center',
    marginRight: 12,
  },
  rowInfo: {flex: 1},
  rowLabel: {fontSize: 15, fontWeight: '600', marginBottom: 2},
  rowDescription: {fontSize: 13},
  previewContainer: {padding: 16, paddingTop: 8},
  previewTitle: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  previewItem: {paddingVertical: 8},
  previewItemText: {fontSize: 13, fontWeight: '600'},
  previewItemMeta: {fontSize: 12, marginTop: 2},
  previewMore: {fontSize: 12, marginTop: 8, fontStyle: 'italic'},
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  selectButtonText: {fontSize: 16, fontWeight: '600'},
  importButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  importButtonText: {color: '#fff', fontSize: 16, fontWeight: '700'},
});
