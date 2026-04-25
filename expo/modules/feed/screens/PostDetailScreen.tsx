import {usePosts} from '@core/contexts/PostsContext';
import {usePreferences} from '@core/contexts/PreferencesContext';
import {usePermissions} from '@shared/hooks/usePermissions';
import {PERMISSIONS} from '@shared/constants/permissions';
import {useTranslation} from '@shared/hooks/useTranslation';
import BlockRenderer from '../components/BlockRenderer';
import {Pencil, Trash2} from 'lucide-react-native';
import {Alert, Image, Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import {useLocalSearchParams, useRouter} from 'expo-router';

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return iso;
  }
}

export default function PostDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { getPostBySlug, deletePost } = usePosts();
  const { colors } = usePreferences();
  const { t } = useTranslation();
  const { hasPermission } = usePermissions();
  const router = useRouter();

  const post = getPostBySlug(slug ?? '');

  const canEdit = hasPermission(PERMISSIONS.FUNC_FEED_EDIT_POST);
  const canDelete = hasPermission(PERMISSIONS.FUNC_FEED_DELETE_POST);

  if (!post) {
    return (
      <View style={[styles.notFound, { backgroundColor: colors.background }]}>
        <Text style={[styles.notFoundText, { color: colors.textSecondary }]}>
          {t('feed.postNotFound')}
        </Text>
      </View>
    );
  }

  const handleEdit = () => {
    router.push(`/edit-post/${post.id}` as any);
  };

  const handleDelete = () => {
    Alert.alert(t('feed.deletePost'), t('feed.deletePostConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          await deletePost(post.id);
          router.back();
        },
      },
    ]);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      {post.coverUrl ? (
        <Image source={{ uri: post.coverUrl }} style={styles.cover} resizeMode="cover" />
      ) : null}

      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>{post.title}</Text>
        <Text style={[styles.date, { color: colors.textSecondary }]}>
          {t('feed.publishedOn')} {formatDate(post.createdAt)}
        </Text>

        {(canEdit || canDelete) ? (
          <View style={styles.actions}>
            {canEdit ? (
              <Pressable
                style={[styles.actionButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={handleEdit}
              >
                <Pencil size={18} color={colors.primary} />
                <Text style={[styles.actionText, { color: colors.primary }]}>{t('common.edit')}</Text>
              </Pressable>
            ) : null}
            {canDelete ? (
              <Pressable
                style={[styles.actionButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={handleDelete}
              >
                <Trash2 size={18} color={colors.error} />
                <Text style={[styles.actionText, { color: colors.error }]}>{t('common.delete')}</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        <View style={[styles.divider, { backgroundColor: colors.border }]} />
      </View>

      <View style={styles.blocks}>
        {post.blocks.map((block, i) => (
          <BlockRenderer key={i} block={block} />
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: 48,
  },
  cover: {
    width: '100%',
    height: 300,
  },
  header: {
    padding: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    lineHeight: 34,
    marginBottom: 8,
  },
  date: {
    fontSize: 14,
    marginBottom: 16,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    marginTop: 4,
  },
  blocks: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notFoundText: {
    fontSize: 16,
  },
});
