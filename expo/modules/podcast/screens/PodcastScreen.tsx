import {usePosts} from '@core/contexts/PostsContext';
import {usePreferences} from '@core/contexts/PreferencesContext';
import {usePermissions} from '@shared/hooks/usePermissions';
import {PERMISSIONS} from '@shared/constants/permissions';
import {useTranslation} from '@shared/hooks/useTranslation';
import {RADII} from '@shared/constants/themes';
import type {Post} from '@shared/types/posts';
import {getDuration, getEpisodeNumber, getYoutubeId, youtubeThumbnail} from '../services/episodeMeta';
import {LinearGradient} from 'expo-linear-gradient';
import {Clock, Mic, Play, Plus} from 'lucide-react-native';
import {useCallback, useState} from 'react';
import {FONTS} from '@shared/constants/typography';
import {MAX_CONTENT_WIDTH} from '@shared/constants/layout';
import {ActivityIndicator, FlatList, Image, Pressable, RefreshControl, StyleSheet, Text, View} from 'react-native';
import {useRouter} from 'expo-router';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

// Overlay colors sit on top of episode imagery, so they stay dark in both
// themes (see docs/README-ui-migration.md §4)
const OVERLAY = {
  scrim: ['transparent', 'rgba(0,0,0,0.85)'] as const,
  gold: '#F2A900',
  onGold: '#1A1A1C',
  title: '#FFFFFF',
  meta: 'rgba(255,255,255,0.78)',
  playBg: 'rgba(255,255,255,0.18)',
  playBorder: 'rgba(255,255,255,0.35)',
};

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

function EpisodeCard({post, episodeNumber, onPress}: {post: Post; episodeNumber: number; onPress: () => void}) {
  const {colors} = usePreferences();
  const youtubeId = getYoutubeId(post);
  const [thumbFailed, setThumbFailed] = useState(false);
  const duration = getDuration(post);

  const imageUri =
    post.coverUrl ||
    (youtubeId ? youtubeThumbnail(youtubeId, thumbFailed ? 'hqdefault' : 'maxresdefault') : null);

  return (
    <Pressable
      style={[styles.card, {borderColor: colors.border, backgroundColor: colors.surface}]}
      onPress={onPress}
    >
      {imageUri ? (
        <Image
          source={{uri: imageUri}}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
          onError={() => {
            if (!post.coverUrl && !thumbFailed) setThumbFailed(true);
          }}
        />
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.coverPlaceholder, {backgroundColor: colors.surfaceHigh}]}>
          <Mic size={40} color={colors.textFaint} />
        </View>
      )}

      <LinearGradient colors={OVERLAY.scrim} style={styles.scrim} />

      <View style={styles.cardContent}>
        <View style={styles.cardInfo}>
          <View style={styles.epBadge}>
            <Text style={styles.epBadgeText}>EP #{episodeNumber}</Text>
          </View>
          <Text style={styles.cardTitle} numberOfLines={2}>
            {post.title}
          </Text>
          <View style={styles.metaRow}>
            <Text style={styles.metaText}>{formatDate(post.publishAt ?? post.createdAt)}</Text>
            {duration ? (
              <>
                <Clock size={13} color={OVERLAY.meta} />
                <Text style={styles.metaText}>{duration}</Text>
              </>
            ) : null}
          </View>
        </View>
        <View style={styles.playButton}>
          <Play size={20} color={OVERLAY.title} fill={OVERLAY.title} />
        </View>
      </View>
    </Pressable>
  );
}

export default function PodcastScreen() {
  const {colors} = usePreferences();
  const {t} = useTranslation();
  const {podcast} = usePosts();
  const {hasPermission} = usePermissions();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const canCreate = hasPermission(PERMISSIONS.FUNC_PODCAST_CREATE_POST);

  const [refreshing, setRefreshing] = useState(false);

  const {posts: visible, total, isLoading, hasMore, loadMore, refresh} = podcast;

  const handleEndReached = useCallback(() => {
    if (hasMore) loadMore();
  }, [hasMore, loadMore]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  const handlePostPress = (post: Post, episodeNumber: number) => {
    router.push(`/post/${post.slug}?ep=${episodeNumber}` as any);
  };

  const handleCreatePress = () => {
    router.push('/create-post?resource=podcast' as any);
  };

  const ListHeader = () => (
    <View style={styles.screenHeader}>
      <Text style={[styles.screenTitle, {color: colors.text}]}>Podcast</Text>
      <Text style={[styles.screenSubtitle, {color: colors.textDim}]}>
        {t('podcast.episodeCount').replace('{count}', String(total))}
      </Text>
    </View>
  );

  const ListEmpty = () => (
    <View style={styles.emptyContainer}>
      <View style={[styles.emptyIcon, {backgroundColor: colors.accentSoft}]}>
        <Mic size={40} color={colors.accent} />
      </View>
      <Text style={[styles.emptyTitle, {color: colors.text}]}>{t('podcast.noPostsYet')}</Text>
      {canCreate ? (
        <Pressable
          style={[styles.emptyButton, {backgroundColor: colors.accent}]}
          onPress={handleCreatePress}
        >
          <Text style={[styles.emptyButtonText, {color: colors.onAccent}]}>
            {t('podcast.writeFirstPost')}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );

  const ListFooter = () => {
    if (isLoading) return <ActivityIndicator style={styles.footer} color={colors.accent} />;
    if (total === 0) return null;
    return (
      <View>
        <Text style={[styles.footerText, {color: colors.textDim}]}>
          {hasMore
            ? t('podcast.showingPosts')
                .replace('{current}', String(visible.length))
                .replace('{total}', String(total))
            : t('podcast.allPostsLoaded').replace('{total}', String(total))}
        </Text>
        {hasMore ? (
          <Pressable
            style={[styles.loadMoreButton, {borderColor: colors.border, backgroundColor: colors.surface}]}
            onPress={loadMore}
          >
            <Text style={[styles.loadMoreText, {color: colors.text}]}>{t('podcast.loadMore')}</Text>
          </Pressable>
        ) : null}
      </View>
    );
  };

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      <FlatList
        data={visible}
        keyExtractor={(item) => item.id}
        renderItem={({item, index}) => {
          const episodeNumber = getEpisodeNumber(item) ?? total - index;
          return (
            <EpisodeCard
              post={item}
              episodeNumber={episodeNumber}
              onPress={() => handlePostPress(item, episodeNumber)}
            />
          );
        }}
        contentContainerStyle={[styles.listContent, {paddingTop: insets.top + 16}]}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        ListHeaderComponent={<ListHeader />}
        ListEmptyComponent={isLoading ? null : <ListEmpty />}
        ListFooterComponent={<ListFooter />}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.accent} />
        }
      />

      {canCreate ? (
        <Pressable
          style={[styles.fab, {backgroundColor: colors.accent, shadowColor: colors.accent}]}
          onPress={handleCreatePress}
        >
          <Plus size={28} color={colors.onAccent} />
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
    paddingHorizontal: 16,
    paddingBottom: 100,
    flexGrow: 1,
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: 'center',
  },
  screenHeader: {
    marginBottom: 18,
  },
  screenTitle: {
    fontSize: 26,
    fontFamily: FONTS.display,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  screenSubtitle: {
    fontSize: 13,
    marginTop: 4,
  },
  card: {
    height: 240,
    borderRadius: RADII.card,
    borderWidth: 1,
    marginBottom: 14,
    overflow: 'hidden',
  },
  coverPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrim: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 150,
  },
  cardContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    padding: 16,
  },
  cardInfo: {
    flex: 1,
    marginRight: 12,
  },
  epBadge: {
    alignSelf: 'flex-start',
    backgroundColor: OVERLAY.gold,
    borderRadius: RADII.pill,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginBottom: 8,
  },
  epBadgeText: {
    color: OVERLAY.onGold,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  cardTitle: {
    color: OVERLAY.title,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    color: OVERLAY.meta,
    fontSize: 13,
  },
  playButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: OVERLAY.playBg,
    borderWidth: 1,
    borderColor: OVERLAY.playBorder,
    alignItems: 'center',
    justifyContent: 'center',
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
    borderRadius: RADII.control,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    paddingVertical: 20,
  },
  loadMoreButton: {
    alignSelf: 'center',
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 10,
    borderWidth: 1,
  },
  loadMoreText: {
    fontSize: 14,
    fontWeight: '600',
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
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
});
