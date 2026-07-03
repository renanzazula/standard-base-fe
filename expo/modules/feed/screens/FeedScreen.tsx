import {usePosts} from '@core/contexts/PostsContext';
import {usePreferences} from '@core/contexts/PreferencesContext';
import {usePermissions} from '@shared/hooks/usePermissions';
import {PERMISSIONS} from '@shared/constants/permissions';
import {useTranslation} from '@shared/hooks/useTranslation';
import type {Post} from '@shared/types/posts';
import {Plus, Rss} from 'lucide-react-native';
import {useCallback, useState} from 'react';
import {FONTS} from '@shared/constants/typography';
import {MAX_CONTENT_WIDTH} from '@shared/constants/layout';
import {ActivityIndicator, FlatList, Image, Pressable, RefreshControl, StyleSheet, Text, View,} from 'react-native';
import {useRouter} from 'expo-router';

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

function PostCard({ post, onPress }: { post: Post; onPress: () => void }) {
  const { colors } = usePreferences();
  return (
    <Pressable
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={onPress}
    >
      {post.coverUrl ? (
        <Image source={{ uri: post.coverUrl }} style={styles.cardCover} resizeMode="cover" />
      ) : (
        <View style={[styles.cardCoverPlaceholder, { backgroundColor: colors.accentFeed + '1a' }]}>
          <Rss size={28} color={colors.accentFeed} />
        </View>
      )}
      <View style={styles.cardBody}>
        <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={2}>
          {post.title}
        </Text>
        <Text style={[styles.cardDate, { color: colors.textSecondary }]}>
          {formatDate(post.createdAt)}
        </Text>
      </View>
    </Pressable>
  );
}

export default function FeedScreen() {
  const { colors } = usePreferences();
  const { t } = useTranslation();
  const { feed } = usePosts();
  const { hasPermission } = usePermissions();
  const router = useRouter();

  const canCreate = hasPermission(PERMISSIONS.FUNC_FEED_CREATE_POST);

  const [refreshing, setRefreshing] = useState(false);

  const { posts: visible, total, isLoading, hasMore, loadMore, refresh } = feed;

  const handleEndReached = useCallback(() => {
    if (hasMore) loadMore();
  }, [hasMore, loadMore]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  const handlePostPress = (post: Post) => {
    router.push(`/post/${post.slug}` as any);
  };

  const handleCreatePress = () => {
    router.push('/create-post' as any);
  };

  const ListEmpty = () => (
    <View style={styles.emptyContainer}>
      <View style={[styles.emptyIcon, { backgroundColor: colors.accentFeed + '1a' }]}>
        <Rss size={40} color={colors.accentFeed} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>{t('feed.noPostsYet')}</Text>
      {canCreate ? (
        <Pressable
          style={[styles.emptyButton, { backgroundColor: colors.accentFeed }]}
          onPress={handleCreatePress}
        >
          <Text style={styles.emptyButtonText}>{t('feed.writeFirstPost')}</Text>
        </Pressable>
      ) : null}
    </View>
  );

  const ListFooter = () => {
    if (isLoading) return <ActivityIndicator style={styles.footer} color={colors.primary} />;
    if (total === 0) return null;
    return (
      <Text style={[styles.footerText, { color: colors.textSecondary }]}>
        {hasMore
          ? t('feed.showingPosts')
              .replace('{current}', String(visible.length))
              .replace('{total}', String(total))
          : t('feed.allPostsLoaded').replace('{total}', String(total))}
      </Text>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={visible}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <PostCard post={item} onPress={() => handlePostPress(item)} />}
        contentContainerStyle={styles.listContent}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={isLoading ? null : <ListEmpty />}
        ListFooterComponent={<ListFooter />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      />

      {canCreate ? (
        <Pressable
          style={[styles.fab, { backgroundColor: colors.accentFeed }]}
          onPress={handleCreatePress}
        >
          <Plus size={28} color="#fff" />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
    flexGrow: 1,
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: 'center',
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
    overflow: 'hidden',
  },
  cardCover: {
    width: '100%',
    height: 200,
  },
  cardCoverPlaceholder: {
    width: '100%',
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: {
    padding: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  cardDate: {
    fontSize: 13,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: FONTS.display,
    textAlign: 'center',
    marginBottom: 20,
  },
  emptyButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    paddingVertical: 20,
  },
  footerText: {
    textAlign: 'center',
    fontSize: 13,
    paddingVertical: 16,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 6,
  },
});
