import { useAuth } from '@/contexts/AuthContext';
import { usePreferences } from '@/contexts/PreferencesContext';
import { useFeed } from '@/contexts/FeedContext';
import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useTranslation } from '@/hooks/useTranslation';
import { useRouter } from 'expo-router';
import { CreatePostInput } from '@/types/post';

export default function CreatePostScreen() {
  const { colors } = usePreferences();
  const { user } = useAuth();
  const { createPost } = useFeed();
  const { t } = useTranslation();
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [featuredImage, setFeaturedImage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (status: 'draft' | 'published') => {
    if (!title.trim()) {
      Alert.alert(t('common.error'), 'Please enter a title');
      return;
    }

    if (!excerpt.trim()) {
      Alert.alert(t('common.error'), 'Please enter an excerpt');
      return;
    }

    if (!content.trim()) {
      Alert.alert(t('common.error'), 'Please enter content');
      return;
    }

    setIsSubmitting(true);

    const postInput: CreatePostInput = {
      title: title.trim(),
      excerpt: excerpt.trim(),
      content: [
        {
          id: Date.now().toString(),
          type: 'text',
          content: content.trim(),
          order: 0,
        },
      ],
      featuredImage: featuredImage.trim() || undefined,
      tags: tags.split(',').map((t) => t.trim()).filter((t) => t),
      status,
    };

    const newPost = await createPost(postInput);
    setIsSubmitting(false);

    if (newPost) {
      Alert.alert(
        t('common.success'),
        status === 'published' ? t('feed.postCreated') : t('feed.saveDraft'),
        [{ text: t('common.confirm'), onPress: () => router.back() }]
      );
    } else {
      Alert.alert(t('common.error'), t('feed.errorLoadingPosts'));
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      padding: 20,
    },
    label: {
      fontSize: 14,
      fontWeight: '600' as const,
      color: colors.text,
      marginBottom: 8,
      marginTop: 16,
    },
    input: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      fontSize: 16,
      color: colors.text,
      borderWidth: 1,
      borderColor: colors.border,
    },
    textArea: {
      minHeight: 150,
      textAlignVertical: 'top',
    },
    actionsContainer: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 32,
      paddingBottom: 32,
    },
    button: {
      flex: 1,
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
    },
    draftButton: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    publishButton: {
      backgroundColor: colors.primary,
    },
    buttonText: {
      fontSize: 16,
      fontWeight: '600' as const,
    },
    draftButtonText: {
      color: colors.text,
    },
    publishButtonText: {
      color: '#FFFFFF',
    },
    hint: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 4,
    },
  });

  if (!user || user.role !== 'admin') {
    return (
      <View style={styles.container}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: colors.text }}>Access Denied</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.label}>{t('feed.postTitle')} *</Text>
        <TextInput
          style={styles.input}
          placeholder={t('feed.enterTitle')}
          placeholderTextColor={colors.textSecondary}
          value={title}
          onChangeText={setTitle}
          testID="post-title-input"
        />

        <Text style={styles.label}>{t('feed.postExcerpt')} *</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder={t('feed.enterExcerpt')}
          placeholderTextColor={colors.textSecondary}
          value={excerpt}
          onChangeText={setExcerpt}
          multiline
          numberOfLines={3}
          testID="post-excerpt-input"
        />

        <Text style={styles.label}>{t('feed.postContent')} *</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder={t('feed.enterContent')}
          placeholderTextColor={colors.textSecondary}
          value={content}
          onChangeText={setContent}
          multiline
          numberOfLines={8}
          testID="post-content-input"
        />

        <Text style={styles.label}>{t('feed.featuredImage')}</Text>
        <TextInput
          style={styles.input}
          placeholder="https://example.com/image.jpg"
          placeholderTextColor={colors.textSecondary}
          value={featuredImage}
          onChangeText={setFeaturedImage}
          testID="post-image-input"
        />
        <Text style={styles.hint}>Enter image URL</Text>

        <Text style={styles.label}>{t('feed.postTags')}</Text>
        <TextInput
          style={styles.input}
          placeholder={t('feed.addTags')}
          placeholderTextColor={colors.textSecondary}
          value={tags}
          onChangeText={setTags}
          testID="post-tags-input"
        />
        <Text style={styles.hint}>Separate tags with commas</Text>

        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.button, styles.draftButton]}
            onPress={() => handleSubmit('draft')}
            disabled={isSubmitting}
            testID="save-draft-button"
          >
            <Text style={[styles.buttonText, styles.draftButtonText]}>{t('feed.saveDraft')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.publishButton]}
            onPress={() => handleSubmit('published')}
            disabled={isSubmitting}
            testID="publish-button"
          >
            <Text style={[styles.buttonText, styles.publishButtonText]}>{t('feed.publish')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
