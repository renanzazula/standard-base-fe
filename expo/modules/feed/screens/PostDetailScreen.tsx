import {usePosts} from '@core/contexts/PostsContext';
import {usePreferences} from '@core/contexts/PreferencesContext';
import {usePermissions} from '@shared/hooks/usePermissions';
import {PERMISSIONS} from '@shared/constants/permissions';
import {useTranslation} from '@shared/hooks/useTranslation';
import BlockRenderer from '../components/BlockRenderer';
import {ExternalLink, Facebook, Instagram, Linkedin, Pencil, Trash2, Twitter, Youtube} from 'lucide-react-native';
import {Alert, Image, Linking, Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import {useLocalSearchParams, useRouter} from 'expo-router';
import Svg, {Path} from 'react-native-svg';

type SocialPlatform = 'instagram' | 'facebook' | 'twitter' | 'youtube' | 'tiktok' | 'linkedin' | 'unknown';

function detectPlatform(url: string): SocialPlatform {
  try {
    const host = new URL(url).hostname.replace('www.', '');
    if (host.includes('instagram.com')) return 'instagram';
    if (host.includes('facebook.com') || host.includes('fb.com')) return 'facebook';
    if (host.includes('x.com') || host.includes('twitter.com')) return 'twitter';
    if (host.includes('youtube.com') || host.includes('youtu.be')) return 'youtube';
    if (host.includes('tiktok.com')) return 'tiktok';
    if (host.includes('linkedin.com')) return 'linkedin';
  } catch {}
  return 'unknown';
}

function TikTokIcon({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.2 8.2 0 0 0 4.83 1.56V6.81a4.85 4.85 0 0 1-1.06-.12z" />
    </Svg>
  );
}

function SocialPlatformIcon({ platform, size, color }: { platform: SocialPlatform; size: number; color: string }) {
  switch (platform) {
    case 'instagram': return <Instagram size={size} color={color} />;
    case 'facebook': return <Facebook size={size} color={color} />;
    case 'twitter': return <Twitter size={size} color={color} />;
    case 'youtube': return <Youtube size={size} color={color} />;
    case 'tiktok': return <TikTokIcon size={size} color={color} />;
    case 'linkedin': return <Linkedin size={size} color={color} />;
    default: return <ExternalLink size={size} color={color} />;
  }
}

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

  const canEdit = hasPermission(PERMISSIONS.FUNC_FEED_EDIT_POST) || hasPermission(PERMISSIONS.FUNC_PODCAST_EDIT_POST);
  const canDelete = hasPermission(PERMISSIONS.FUNC_FEED_DELETE_POST) || hasPermission(PERMISSIONS.FUNC_PODCAST_DELETE_POST);

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

        {post.socialMediaLinks && post.socialMediaLinks.length > 0 && (
          <View style={styles.socialLinks}>
            {post.socialMediaLinks.map((link, i) => (
              <Pressable
                key={i}
                style={[styles.socialIconButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => Linking.openURL(link.url)}
              >
                <SocialPlatformIcon platform={detectPlatform(link.url)} size={22} color={colors.primary} />
              </Pressable>
            ))}
          </View>
        )}

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
  socialLinks: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  socialIconButton: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 21,
    borderWidth: 1,
  },
});
