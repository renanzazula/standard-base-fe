import { useAuth } from '@/contexts/AuthContext';
import { usePreferences } from '@/contexts/PreferencesContext';
import { useAdminConfig } from '@/contexts/AdminConfigContext';
import { useFeed } from '@/contexts/FeedContext';
import { Plus, Lock, Settings as SettingsIcon } from 'lucide-react-native';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, RefreshControl, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from '@/hooks/useTranslation';
import { useRouter } from 'expo-router';
import { Post } from '@/types/post';

export default function HomeScreen() {
  const { colors } = usePreferences();
  const { user } = useAuth();
  const { config } = useAdminConfig();
  const { posts, isLoading, isRefreshing, hasMore, refresh, loadMore } = useFeed();
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const feedEnabled = config.moduleConfig.feedEnabled;

  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: insets.top + 16,
      paddingBottom: 16,
      backgroundColor: colors.card,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerTitle: {
      fontSize: 28,
      fontWeight: '700' as const,
      color: colors.text,
    },
    createFloatingButton: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    listContent: {
      padding: 16,
      paddingBottom: 32,
    },
    postCard: {
      backgroundColor: colors.card,
      borderRadius: 16,
      marginBottom: 16,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: colors.border,
    },
    postImage: {
      width: '100%',
      height: 200,
      backgroundColor: colors.surface,
    },
    postContent: {
      padding: 16,
    },
    postTitle: {
      fontSize: 20,
      fontWeight: '700' as const,
      color: colors.text,
      marginBottom: 8,
    },
    postExcerpt: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
      marginBottom: 12,
    },
    postMeta: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    postAuthor: {
      fontSize: 12,
      color: colors.textSecondary,
      fontWeight: '600' as const,
    },
    postDate: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    tagsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    tag: {
      backgroundColor: colors.surface,
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 12,
    },
    tagText: {
      fontSize: 12,
      color: colors.primary,
      fontWeight: '600' as const,
    },
    emptyContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 80,
      paddingHorizontal: 40,
    },
    emptyTitle: {
      fontSize: 24,
      fontWeight: '700' as const,
      color: colors.text,
      marginBottom: 8,
      textAlign: 'center',
    },
    emptyDescription: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: 24,
    },
    createButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.primary,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 24,
      gap: 8,
    },
    createButtonText: {
      fontSize: 16,
      fontWeight: '600' as const,
      color: '#FFFFFF',
    },
    loadingContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 80,
    },
    loadingText: {
      fontSize: 16,
      color: colors.textSecondary,
      marginTop: 16,
    },
    footer: {
      paddingVertical: 20,
      alignItems: 'center',
    },
    disabledContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 40,
    },
    disabledIconContainer: {
      width: 96,
      height: 96,
      borderRadius: 48,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 24,
    },
    disabledTitle: {
      fontSize: 24,
      fontWeight: '700' as const,
      color: colors.text,
      marginBottom: 12,
      textAlign: 'center',
    },
    disabledDescription: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: 32,
      lineHeight: 24,
    },
    settingsButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.primary,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 24,
      gap: 8,
    },
    settingsButtonText: {
      fontSize: 16,
      fontWeight: '600' as const,
      color: '#FFFFFF',
    },
  });

  const renderPostItem = ({ item }: { item: Post }) => (
    <TouchableOpacity
      style={styles.postCard}
      onPress={() => router.push(`/post/${item.id}` as any)}
      activeOpacity={0.7}
      testID={`post-${item.id}`}
    >
      {item.featuredImage && (
        <Image
          source={{ uri: item.featuredImage }}
          style={styles.postImage}
          resizeMode="cover"
        />
      )}
      <View style={styles.postContent}>
        <Text style={styles.postTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.postExcerpt} numberOfLines={3}>
          {item.excerpt}
        </Text>
        <View style={styles.postMeta}>
          <Text style={styles.postAuthor}>
            {t('feed.by')} {item.authorName}
          </Text>
          <Text style={styles.postDate}>
            {formatDate(item.publishedAt || item.createdAt)}
          </Text>
        </View>
        {item.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {item.tags.slice(0, 3).map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>#{tag}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>{t('feed.noPostsYet')}</Text>
      <Text style={styles.emptyDescription}>{t('feed.noPostsDescription')}</Text>
      {user?.role === 'admin' && (
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => router.push('/post/create' as any)}
          testID="create-first-post-button"
        >
          <Plus size={20} color="#FFFFFF" />
          <Text style={styles.createButtonText}>{t('feed.createPost')}</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderDisabledState = () => (
    <View style={styles.disabledContainer}>
      <View style={styles.disabledIconContainer}>
        <Lock size={48} color={colors.textSecondary} />
      </View>
      <Text style={styles.disabledTitle}>{t('feed.moduleDisabled')}</Text>
      <Text style={styles.disabledDescription}>{t('feed.moduleDisabledDescription')}</Text>
      {user?.role === 'admin' && (
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => router.push('/admin-config')}
          testID="enable-feed-button"
        >
          <SettingsIcon size={20} color="#FFFFFF" />
          <Text style={styles.settingsButtonText}>{t('feed.enableFeedModule')}</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderFooter = () => {
    if (!hasMore) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  };

  if (!feedEnabled) {
    return (
      <View style={styles.container}>
        {renderDisabledState()}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('feed.feed')}</Text>
        {user?.role === 'admin' && (
          <TouchableOpacity
            style={styles.createFloatingButton}
            onPress={() => router.push('/post/create' as any)}
            testID="create-post-button"
          >
            <Plus size={24} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </View>
      <FlatList
        data={posts}
        renderItem={renderPostItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refresh}
            tintColor={colors.primary}
          />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>{t('feed.loadingPosts')}</Text>
          </View>
        ) : renderEmptyState()}
        ListFooterComponent={renderFooter}
        testID="feed-list"
      />
    </View>
  );
}
