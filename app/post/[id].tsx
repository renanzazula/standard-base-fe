import { useAuth } from '@/contexts/AuthContext';
import { usePreferences } from '@/contexts/PreferencesContext';
import { useFeed } from '@/contexts/FeedContext';
import { Edit, Trash2 } from 'lucide-react-native';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, ActivityIndicator } from 'react-native';
import { useTranslation } from '@/hooks/useTranslation';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { PostContentBlock } from '@/types/post';

export default function PostDetailScreen() {
  const { colors } = usePreferences();
  const { user } = useAuth();
  const { getPostById, deletePost } = useFeed();
  const { t } = useTranslation();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const post = getPostById(id || '');

  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  const handleDelete = () => {
    Alert.alert(
      t('feed.deletePostTitle'),
      t('feed.confirmDelete'),
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            const success = await deletePost(id || '');
            if (success) {
              router.back();
            } else {
              Alert.alert(t('common.error'), t('feed.errorLoadingPosts'));
            }
          },
        },
      ]
    );
  };

  const renderContentBlock = (block: PostContentBlock) => {
    switch (block.type) {
      case 'heading':
        return (
          <Text key={block.id} style={styles.contentHeading}>
            {block.content}
          </Text>
        );
      case 'text':
        return (
          <Text key={block.id} style={styles.contentText}>
            {block.content}
          </Text>
        );
      case 'quote':
        return (
          <View key={block.id} style={styles.quoteContainer}>
            <View style={styles.quoteBorder} />
            <Text style={styles.quoteText}>{block.content}</Text>
          </View>
        );
      case 'image':
        return (
          <Image
            key={block.id}
            source={{ uri: block.content }}
            style={styles.contentImage}
            resizeMode="cover"
          />
        );
      default:
        return null;
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      paddingBottom: 32,
    },
    loadingContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    notFoundContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 40,
    },
    notFoundTitle: {
      fontSize: 24,
      fontWeight: '700' as const,
      color: colors.text,
      marginBottom: 8,
      textAlign: 'center',
    },
    notFoundDescription: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    featuredImage: {
      width: '100%',
      height: 300,
      backgroundColor: colors.surface,
    },
    contentContainer: {
      padding: 20,
    },
    title: {
      fontSize: 28,
      fontWeight: '700' as const,
      color: colors.text,
      marginBottom: 16,
      lineHeight: 36,
    },
    meta: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    metaText: {
      fontSize: 14,
      color: colors.textSecondary,
      marginRight: 16,
    },
    tagsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 24,
    },
    tag: {
      backgroundColor: colors.surface,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12,
    },
    tagText: {
      fontSize: 14,
      color: colors.primary,
      fontWeight: '600' as const,
    },
    contentHeading: {
      fontSize: 22,
      fontWeight: '700' as const,
      color: colors.text,
      marginTop: 24,
      marginBottom: 12,
    },
    contentText: {
      fontSize: 16,
      color: colors.text,
      lineHeight: 24,
      marginBottom: 16,
    },
    contentImage: {
      width: '100%',
      height: 200,
      borderRadius: 12,
      marginVertical: 16,
      backgroundColor: colors.surface,
    },
    quoteContainer: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
      borderRadius: 8,
      padding: 16,
      marginVertical: 16,
    },
    quoteBorder: {
      width: 4,
      backgroundColor: colors.primary,
      borderRadius: 2,
      marginRight: 12,
    },
    quoteText: {
      flex: 1,
      fontSize: 16,
      fontStyle: 'italic' as const,
      color: colors.text,
      lineHeight: 24,
    },
    actionsContainer: {
      flexDirection: 'row',
      gap: 12,
      padding: 20,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    actionButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      borderRadius: 12,
      gap: 8,
    },
    editButton: {
      backgroundColor: colors.primary,
    },
    deleteButton: {
      backgroundColor: '#EF4444',
    },
    actionButtonText: {
      fontSize: 16,
      fontWeight: '600' as const,
      color: '#FFFFFF',
    },
  });

  if (!post) {
    return (
      <View style={styles.container}>
        <View style={styles.notFoundContainer}>
          <Text style={styles.notFoundTitle}>Post Not Found</Text>
          <Text style={styles.notFoundDescription}>
            The post you're looking for doesn't exist or has been removed.
          </Text>
        </View>
      </View>
    );
  }

  const canEdit = user && (user.id === post.authorId || user.role === 'admin');

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {post.featuredImage && (
          <Image
            source={{ uri: post.featuredImage }}
            style={styles.featuredImage}
            resizeMode="cover"
          />
        )}
        <View style={styles.contentContainer}>
          <Text style={styles.title}>{post.title}</Text>
          <View style={styles.meta}>
            <Text style={styles.metaText}>
              {t('feed.by')} {post.authorName}
            </Text>
            <Text style={styles.metaText}>{formatDate(post.publishedAt || post.createdAt)}</Text>
          </View>
          {post.tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {post.tags.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>#{tag}</Text>
                </View>
              ))}
            </View>
          )}
          {post.content
            .sort((a, b) => a.order - b.order)
            .map((block) => renderContentBlock(block))}
        </View>
      </ScrollView>
      {canEdit && (
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, styles.editButton]}
            onPress={() => router.push(`/post/edit/${post.id}` as any)}
            testID="edit-post-button"
          >
            <Edit size={20} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>{t('feed.editPost')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={handleDelete}
            testID="delete-post-button"
          >
            <Trash2 size={20} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>{t('feed.deletePost')}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
