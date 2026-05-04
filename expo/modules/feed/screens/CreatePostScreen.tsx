import {extractSpotifyInfo, usePosts} from '@core/contexts/PostsContext';
import {usePreferences} from '@core/contexts/PreferencesContext';
import {useAuth} from '@core/contexts/AuthContext';
import {useTranslation} from '@shared/hooks/useTranslation';
import type {Block, PostStatus, SocialMediaLink} from '@shared/types/posts';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {useRouter} from 'expo-router';
import {useState} from 'react';
import {Plus, X} from 'lucide-react-native';

type BlockEditor =
  | { type: 'text'; html: string }
  | { type: 'image'; url: string; caption: string }
  | { type: 'video'; url: string }
  | { type: 'quote'; text: string; author: string }
  | { type: 'embed'; rawUrl: string }
  | { type: 'gallery'; urls: string }
  | { type: 'link'; url: string; title: string; description: string }
  | { type: 'spotify'; url: string };

function toBlock(editor: BlockEditor): Block | null {
  switch (editor.type) {
    case 'text':
      return { type: 'text', data: { html: editor.html } };
    case 'image':
      if (!editor.url) return null;
      return { type: 'image', data: { url: editor.url, caption: editor.caption || undefined } };
    case 'video':
      if (!editor.url) return null;
      return { type: 'video', data: { url: editor.url } };
    case 'quote':
      if (!editor.text) return null;
      return { type: 'quote', data: { text: editor.text, author: editor.author || undefined } };
    case 'embed': {
      const url = editor.rawUrl;
      if (url.includes('youtube.com') || url.includes('youtu.be')) {
        const id = url.split('v=')[1]?.split('&')[0] ?? url.split('/').pop()?.split('?')[0] ?? '';
        if (!id) return null;
        return { type: 'embed', data: { platform: 'youtube', id } };
      }
      if (url.includes('vimeo.com')) {
        const id = url.split('/').pop()?.split('?')[0] ?? '';
        if (!id) return null;
        return { type: 'embed', data: { platform: 'vimeo', id } };
      }
      return null;
    }
    case 'gallery': {
      const urls = editor.urls.split('\n').map((u) => u.trim()).filter(Boolean);
      if (urls.length === 0) return null;
      return { type: 'gallery', data: { urls } };
    }
    case 'link':
      if (!editor.url) return null;
      return {
        type: 'link',
        data: { url: editor.url, title: editor.title || undefined, description: editor.description || undefined },
      };
    case 'spotify': {
      const info = extractSpotifyInfo(editor.url);
      if (!info) return null;
      return { type: 'spotify', data: { url: editor.url, ...info } };
    }
    default:
      return null;
  }
}

type SocialLinkEditor = { url: string };

function isValidUrl(url: string): boolean {
  return /^https?:\/\/.+/.test(url.trim());
}

const BLOCK_TYPES: Array<{ type: BlockEditor['type']; label: string }> = [
  { type: 'text', label: 'Text' },
  { type: 'image', label: 'Image' },
  { type: 'quote', label: 'Quote' },
  { type: 'video', label: 'Video' },
  { type: 'embed', label: 'YouTube' },
  { type: 'gallery', label: 'Gallery' },
  { type: 'link', label: 'Link' },
  { type: 'spotify', label: 'Spotify' },
];

function defaultEditor(type: BlockEditor['type']): BlockEditor {
  switch (type) {
    case 'text': return { type: 'text', html: '' };
    case 'image': return { type: 'image', url: '', caption: '' };
    case 'video': return { type: 'video', url: '' };
    case 'quote': return { type: 'quote', text: '', author: '' };
    case 'embed': return { type: 'embed', rawUrl: '' };
    case 'gallery': return { type: 'gallery', urls: '' };
    case 'link': return { type: 'link', url: '', title: '', description: '' };
    case 'spotify': return { type: 'spotify', url: '' };
  }
}

function BlockEditorRow({
  editor,
  onChange,
  onRemove,
  colors,
}: {
  editor: BlockEditor;
  onChange: (e: BlockEditor) => void;
  onRemove: () => void;
  colors: any;
}) {
  const { t } = useTranslation();
  const inputStyle = [styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }];
  const labelStyle = [styles.fieldLabel, { color: colors.textSecondary }];

  return (
    <View style={[styles.blockRow, { borderColor: colors.border, backgroundColor: colors.surface }]}>
      <View style={styles.blockRowHeader}>
        <Text style={[styles.blockType, { color: colors.primary }]}>
          {editor.type.charAt(0).toUpperCase() + editor.type.slice(1)}
        </Text>
        <Pressable onPress={onRemove} hitSlop={8}>
          <X size={18} color={colors.error} />
        </Pressable>
      </View>

      {editor.type === 'text' && (
        <>
          <Text style={labelStyle}>{t('feed.textContent')}</Text>
          <TextInput
            style={[inputStyle, { height: 100, textAlignVertical: 'top' }]}
            value={editor.html}
            onChangeText={(v) => onChange({ ...editor, html: v })}
            multiline
            placeholder={t('feed.textContent')}
            placeholderTextColor={colors.textSecondary}
          />
        </>
      )}

      {editor.type === 'image' && (
        <>
          <Text style={labelStyle}>{t('feed.imageUrl')}</Text>
          <TextInput
            style={inputStyle}
            value={editor.url}
            onChangeText={(v) => onChange({ ...editor, url: v })}
            placeholder={t('feed.imageUrlPlaceholder')}
            placeholderTextColor={colors.textSecondary}
            autoCapitalize="none"
          />
          <Text style={labelStyle}>{t('feed.imageCaption')}</Text>
          <TextInput
            style={inputStyle}
            value={editor.caption}
            onChangeText={(v) => onChange({ ...editor, caption: v })}
            placeholder={t('feed.imageCaption')}
            placeholderTextColor={colors.textSecondary}
          />
        </>
      )}

      {editor.type === 'video' && (
        <>
          <Text style={labelStyle}>{t('feed.videoUrl')}</Text>
          <TextInput
            style={inputStyle}
            value={editor.url}
            onChangeText={(v) => onChange({ ...editor, url: v })}
            placeholder={t('feed.videoUrlPlaceholder')}
            placeholderTextColor={colors.textSecondary}
            autoCapitalize="none"
          />
        </>
      )}

      {editor.type === 'quote' && (
        <>
          <Text style={labelStyle}>{t('feed.quoteText')}</Text>
          <TextInput
            style={[inputStyle, { height: 80, textAlignVertical: 'top' }]}
            value={editor.text}
            onChangeText={(v) => onChange({ ...editor, text: v })}
            placeholder={t('feed.quoteTextPlaceholder')}
            placeholderTextColor={colors.textSecondary}
            multiline
          />
          <Text style={labelStyle}>{t('feed.quoteAuthor')}</Text>
          <TextInput
            style={inputStyle}
            value={editor.author}
            onChangeText={(v) => onChange({ ...editor, author: v })}
            placeholder={t('feed.quoteAuthorPlaceholder')}
            placeholderTextColor={colors.textSecondary}
          />
        </>
      )}

      {editor.type === 'embed' && (
        <>
          <Text style={labelStyle}>{t('feed.embedUrl')}</Text>
          <TextInput
            style={inputStyle}
            value={editor.rawUrl}
            onChangeText={(v) => onChange({ ...editor, rawUrl: v })}
            placeholder={t('feed.embedUrlPlaceholder')}
            placeholderTextColor={colors.textSecondary}
            autoCapitalize="none"
          />
        </>
      )}

      {editor.type === 'gallery' && (
        <>
          <Text style={labelStyle}>{t('feed.galleryImages')} (one URL per line)</Text>
          <TextInput
            style={[inputStyle, { height: 100, textAlignVertical: 'top' }]}
            value={editor.urls}
            onChangeText={(v) => onChange({ ...editor, urls: v })}
            placeholder="https://example.com/image1.jpg"
            placeholderTextColor={colors.textSecondary}
            multiline
            autoCapitalize="none"
          />
        </>
      )}

      {editor.type === 'link' && (
        <>
          <Text style={labelStyle}>{t('feed.linkUrl')}</Text>
          <TextInput
            style={inputStyle}
            value={editor.url}
            onChangeText={(v) => onChange({ ...editor, url: v })}
            placeholder={t('feed.linkUrlPlaceholder')}
            placeholderTextColor={colors.textSecondary}
            autoCapitalize="none"
          />
          <Text style={labelStyle}>{t('feed.linkTitle')}</Text>
          <TextInput
            style={inputStyle}
            value={editor.title}
            onChangeText={(v) => onChange({ ...editor, title: v })}
            placeholder={t('feed.linkTitlePlaceholder')}
            placeholderTextColor={colors.textSecondary}
          />
          <Text style={labelStyle}>{t('feed.linkDescription')}</Text>
          <TextInput
            style={inputStyle}
            value={editor.description}
            onChangeText={(v) => onChange({ ...editor, description: v })}
            placeholder={t('feed.linkDescriptionPlaceholder')}
            placeholderTextColor={colors.textSecondary}
            multiline
          />
        </>
      )}

      {editor.type === 'spotify' && (
        <>
          <Text style={labelStyle}>{t('feed.spotifyUrl')}</Text>
          <TextInput
            style={inputStyle}
            value={editor.url}
            onChangeText={(v) => onChange({ ...editor, url: v })}
            placeholder={t('feed.spotifyUrlPlaceholder')}
            placeholderTextColor={colors.textSecondary}
            autoCapitalize="none"
          />
        </>
      )}
    </View>
  );
}

export default function CreatePostScreen() {
  const { addPost } = usePosts();
  const { colors } = usePreferences();
  const { user } = useAuth();
  const { t } = useTranslation();
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [status, setStatus] = useState<PostStatus>('published');
  const [blockEditors, setBlockEditors] = useState<BlockEditor[]>([]);
  const [socialLinks, setSocialLinks] = useState<SocialLinkEditor[]>([]);
  const [saving, setSaving] = useState(false);

  const handleAddBlock = (type: BlockEditor['type']) => {
    setBlockEditors((prev) => [...prev, defaultEditor(type)]);
  };

  const handleBlockChange = (i: number, editor: BlockEditor) => {
    setBlockEditors((prev) => prev.map((e, idx) => (idx === i ? editor : e)));
  };

  const handleBlockRemove = (i: number) => {
    setBlockEditors((prev) => prev.filter((_, idx) => idx !== i));
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert(t('common.error'), t('feed.validationTitleRequired'));
      return;
    }
    if (!coverUrl.trim()) {
      Alert.alert(t('common.error'), t('feed.validationCoverRequired'));
      return;
    }
    const blocks: Block[] = blockEditors.map(toBlock).filter((b): b is Block => b !== null);
    if (blocks.length === 0) {
      Alert.alert(t('common.error'), t('feed.validationBlockRequired'));
      return;
    }

    for (const link of socialLinks) {
      if (!isValidUrl(link.url)) {
        Alert.alert(t('common.error'), t('feed.validationInvalidUrl'));
        return;
      }
    }

    const validSocialLinks: SocialMediaLink[] = socialLinks.map(l => ({
      url: l.url.trim(),
    }));

    setSaving(true);
    try {
      await addPost({
        title: title.trim(),
        coverUrl: coverUrl.trim(),
        status,
        publishAt: null,
        blocks,
        createdBy: user?.id ?? 'unknown',
        socialMediaLinks: validSocialLinks.length > 0 ? validSocialLinks : undefined,
      });
      router.back();
    } catch (error) {
      Alert.alert(t('common.error'), String(error));
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = [styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }];
  const labelStyle = [styles.fieldLabel, { color: colors.textSecondary }];

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={labelStyle}>{t('feed.postTitle')}</Text>
        <TextInput
          style={inputStyle}
          value={title}
          onChangeText={setTitle}
          placeholder={t('feed.postTitlePlaceholder')}
          placeholderTextColor={colors.textSecondary}
        />

        <Text style={labelStyle}>{t('feed.coverImageUrl')}</Text>
        <TextInput
          style={inputStyle}
          value={coverUrl}
          onChangeText={setCoverUrl}
          placeholder={t('feed.coverImageUrlPlaceholder')}
          placeholderTextColor={colors.textSecondary}
          autoCapitalize="none"
        />

        <Text style={labelStyle}>{t('feed.status')}</Text>
        <View style={styles.statusRow}>
          {(['published', 'draft'] as PostStatus[]).map((s) => (
            <Pressable
              key={s}
              style={[
                styles.statusChip,
                { borderColor: colors.border, backgroundColor: status === s ? colors.primary : colors.surface },
              ]}
              onPress={() => setStatus(s)}
            >
              <Text style={{ color: status === s ? '#fff' : colors.text, fontWeight: '600', fontSize: 14 }}>
                {t(`feed.${s}`)}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={[labelStyle, { marginTop: 16 }]}>{t('feed.socialMediaLinks')}</Text>
        {socialLinks.map((link, i) => (
          <View key={i} style={[styles.blockRow, { borderColor: colors.border, backgroundColor: colors.surface }]}>
            <View style={styles.blockRowHeader}>
              <Text style={[styles.blockType, { color: colors.primary }]}>{t('feed.socialUrl')}</Text>
              <Pressable onPress={() => setSocialLinks(prev => prev.filter((_, idx) => idx !== i))} hitSlop={8}>
                <X size={18} color={colors.error} />
              </Pressable>
            </View>
            <TextInput
              style={inputStyle}
              value={link.url}
              onChangeText={(v) => setSocialLinks(prev => prev.map((l, idx) => idx === i ? { ...l, url: v } : l))}
              placeholder={t('feed.socialUrlPlaceholder')}
              placeholderTextColor={colors.textSecondary}
              autoCapitalize="none"
              keyboardType="url"
            />
          </View>
        ))}
        <Pressable
          style={[styles.addBlockButton, { borderColor: colors.primary, marginTop: 12 }]}
          onPress={() => setSocialLinks(prev => [...prev, { url: '' }])}
        >
          <Plus size={14} color={colors.primary} />
          <Text style={[styles.addBlockText, { color: colors.primary }]}>{t('feed.addSocialLink')}</Text>
        </Pressable>

        <Text style={[labelStyle, { marginTop: 16 }]}>{t('feed.contentBlocks')}</Text>
        {blockEditors.map((editor, i) => (
          <BlockEditorRow
            key={i}
            editor={editor}
            onChange={(e) => handleBlockChange(i, e)}
            onRemove={() => handleBlockRemove(i)}
            colors={colors}
          />
        ))}

        <View style={styles.blockButtons}>
          {BLOCK_TYPES.map(({ type, label }) => (
            <Pressable
              key={type}
              style={[styles.addBlockButton, { borderColor: colors.primary }]}
              onPress={() => handleAddBlock(type)}
            >
              <Plus size={14} color={colors.primary} />
              <Text style={[styles.addBlockText, { color: colors.primary }]}>{label}</Text>
            </Pressable>
          ))}
        </View>

        <Pressable
          style={[styles.submitButton, { backgroundColor: saving ? colors.border : colors.primary }]}
          onPress={handleSubmit}
          disabled={saving}
        >
          <Text style={styles.submitText}>
            {saving ? t('common.loading') : t('feed.createPost')}
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 60 },
  fieldLabel: { fontSize: 13, fontWeight: '600', marginBottom: 6, marginTop: 14 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
  },
  statusRow: { flexDirection: 'row', gap: 10 },
  statusChip: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  blockRow: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginTop: 12,
  },
  blockRowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  blockType: { fontSize: 13, fontWeight: '700' },
  blockButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 16,
  },
  addBlockButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
  },
  addBlockText: { fontSize: 13, fontWeight: '600' },
  submitButton: {
    marginTop: 28,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
