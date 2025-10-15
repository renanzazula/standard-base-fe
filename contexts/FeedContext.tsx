import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { Post, CreatePostInput, UpdatePostInput } from '@/types/post';
import { useAuth } from './AuthContext';

const POSTS_STORAGE_KEY = '@feed_posts';
const PAGE_SIZE = 10;

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function generateUniqueSlug(title: string, existingPosts: Post[]): string {
  let slug = generateSlug(title);
  const existingSlugs = existingPosts.map(p => p.slug);
  
  let counter = 1;
  let uniqueSlug = slug;
  while (existingSlugs.includes(uniqueSlug)) {
    uniqueSlug = `${slug}-${counter}`;
    counter++;
  }
  
  return uniqueSlug;
}

const mockPosts: Post[] = [
  {
    id: '1',
    title: 'Welcome to the Feed',
    slug: 'welcome-to-the-feed',
    excerpt: 'This is your new Feed module where you can browse, create, and manage posts.',
    content: [
      {
        id: 'b1',
        type: 'heading',
        content: 'Getting Started',
        order: 0,
      },
      {
        id: 'b2',
        type: 'text',
        content: 'Welcome to the Feed module! This is a powerful content management system that allows you to create, edit, and share posts with rich content.',
        order: 1,
      },
      {
        id: 'b3',
        type: 'heading',
        content: 'Features',
        order: 2,
      },
      {
        id: 'b4',
        type: 'text',
        content: 'Browse posts with infinite scroll, create rich content with multiple block types, and manage everything from your mobile device.',
        order: 3,
      },
    ],
    featuredImage: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800',
    tags: ['welcome', 'tutorial'],
    authorId: '2',
    authorName: 'Admin User',
    createdAt: Date.now() - 86400000,
    updatedAt: Date.now() - 86400000,
    publishedAt: Date.now() - 86400000,
    status: 'published',
  },
  {
    id: '2',
    title: 'Creating Your First Post',
    slug: 'creating-your-first-post',
    excerpt: 'Learn how to create and publish your first post with the Feed module.',
    content: [
      {
        id: 'b1',
        type: 'text',
        content: 'Creating a post is simple and intuitive. Just tap the "+" button to get started.',
        order: 0,
      },
      {
        id: 'b2',
        type: 'quote',
        content: 'Great content starts with a great idea.',
        order: 1,
      },
    ],
    featuredImage: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=800',
    tags: ['tutorial', 'getting-started'],
    authorId: '2',
    authorName: 'Admin User',
    createdAt: Date.now() - 172800000,
    updatedAt: Date.now() - 172800000,
    publishedAt: Date.now() - 172800000,
    status: 'published',
  },
];

export const [FeedProvider, useFeed] = createContextHook(() => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async (refresh = false) => {
    try {
      if (refresh) {
        setIsRefreshing(true);
      }
      
      const stored = await AsyncStorage.getItem(POSTS_STORAGE_KEY);
      let allPosts: Post[] = stored ? JSON.parse(stored) : mockPosts;
      
      if (!stored) {
        await AsyncStorage.setItem(POSTS_STORAGE_KEY, JSON.stringify(mockPosts));
      }

      allPosts = allPosts
        .filter(p => p.status === 'published')
        .sort((a, b) => (b.publishedAt || 0) - (a.publishedAt || 0));

      setPosts(allPosts);
      setPage(1);
      setHasMore(allPosts.length > PAGE_SIZE);
    } catch (error) {
      console.error('[Feed] Failed to load posts:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const getVisiblePosts = (): Post[] => {
    return posts.slice(0, page * PAGE_SIZE);
  };

  const refresh = useCallback(() => loadPosts(true), []);

  const loadMore = useCallback(async () => {
    if (!hasMore || isLoading) return;
    const nextPage = page + 1;
    const totalLoaded = nextPage * PAGE_SIZE;
    setPage(nextPage);
    setHasMore(posts.length > totalLoaded);
  }, [hasMore, isLoading, page, posts.length]);

  const getPostByIdMemo = useCallback((id: string): Post | undefined => {
    return posts.find(p => p.id === id);
  }, [posts]);

  const getPostBySlugMemo = useCallback((slug: string): Post | undefined => {
    return posts.find(p => p.slug === slug);
  }, [posts]);

  const createPostMemo = useCallback(async (input: CreatePostInput): Promise<Post | null> => {
    if (!user) return null;

    try {
      const stored = await AsyncStorage.getItem(POSTS_STORAGE_KEY);
      const allPosts: Post[] = stored ? JSON.parse(stored) : [];

      const newPost: Post = {
        id: Date.now().toString(),
        ...input,
        slug: generateUniqueSlug(input.title, allPosts),
        authorId: user.id,
        authorName: user.name,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        publishedAt: input.status === 'published' ? Date.now() : undefined,
      };

      allPosts.unshift(newPost);
      await AsyncStorage.setItem(POSTS_STORAGE_KEY, JSON.stringify(allPosts));
      
      await loadPosts();
      console.log('[Feed] Post created:', newPost.id);
      return newPost;
    } catch (error) {
      console.error('[Feed] Failed to create post:', error);
      return null;
    }
  }, [user]);

  const updatePostMemo = useCallback(async (input: UpdatePostInput): Promise<boolean> => {
    if (!user) return false;

    try {
      const stored = await AsyncStorage.getItem(POSTS_STORAGE_KEY);
      const allPosts: Post[] = stored ? JSON.parse(stored) : [];

      const postIndex = allPosts.findIndex(p => p.id === input.id);
      if (postIndex === -1) return false;

      const existingPost = allPosts[postIndex];
      if (existingPost.authorId !== user.id && user.role !== 'admin') {
        console.error('[Feed] Permission denied');
        return false;
      }

      const updatedPost: Post = {
        ...existingPost,
        ...input,
        updatedAt: Date.now(),
        publishedAt: input.status === 'published' && !existingPost.publishedAt 
          ? Date.now() 
          : existingPost.publishedAt,
      };

      if (input.title && input.title !== existingPost.title) {
        updatedPost.slug = generateUniqueSlug(input.title, allPosts.filter(p => p.id !== input.id));
      }

      allPosts[postIndex] = updatedPost;
      await AsyncStorage.setItem(POSTS_STORAGE_KEY, JSON.stringify(allPosts));
      
      await loadPosts();
      console.log('[Feed] Post updated:', input.id);
      return true;
    } catch (error) {
      console.error('[Feed] Failed to update post:', error);
      return false;
    }
  }, [user]);

  const deletePostMemo = useCallback(async (postId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const stored = await AsyncStorage.getItem(POSTS_STORAGE_KEY);
      const allPosts: Post[] = stored ? JSON.parse(stored) : [];

      const post = allPosts.find(p => p.id === postId);
      if (!post) return false;

      if (post.authorId !== user.id && user.role !== 'admin') {
        console.error('[Feed] Permission denied');
        return false;
      }

      const filteredPosts = allPosts.filter(p => p.id !== postId);
      await AsyncStorage.setItem(POSTS_STORAGE_KEY, JSON.stringify(filteredPosts));
      
      await loadPosts();
      console.log('[Feed] Post deleted:', postId);
      return true;
    } catch (error) {
      console.error('[Feed] Failed to delete post:', error);
      return false;
    }
  }, [user]);

  const importPostsMemo = useCallback(async (importedPosts: Omit<Post, 'id' | 'authorId' | 'authorName' | 'createdAt' | 'updatedAt'>[]): Promise<{ success: number; failed: number }> => {
    if (!user || user.role !== 'admin') {
      return { success: 0, failed: importedPosts.length };
    }

    let success = 0;
    let failed = 0;

    try {
      const stored = await AsyncStorage.getItem(POSTS_STORAGE_KEY);
      const allPosts: Post[] = stored ? JSON.parse(stored) : [];

      for (const imported of importedPosts) {
        try {
          const newPost: Post = {
            ...imported,
            id: Date.now().toString() + Math.random(),
            slug: generateUniqueSlug(imported.title, allPosts),
            authorId: user.id,
            authorName: user.name,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
          allPosts.push(newPost);
          success++;
        } catch (error) {
          console.error('[Feed] Failed to import post:', error);
          failed++;
        }
      }

      await AsyncStorage.setItem(POSTS_STORAGE_KEY, JSON.stringify(allPosts));
      await loadPosts();
      console.log('[Feed] Import complete:', { success, failed });
    } catch (error) {
      console.error('[Feed] Import failed:', error);
      return { success: 0, failed: importedPosts.length };
    }

    return { success, failed };
  }, [user]);

  const visiblePosts = useMemo(() => getVisiblePosts(), [posts, page]);

  return useMemo(() => ({
    posts: visiblePosts,
    allPosts: posts,
    isLoading,
    isRefreshing,
    hasMore,
    refresh,
    loadMore,
    getPostById: getPostByIdMemo,
    getPostBySlug: getPostBySlugMemo,
    createPost: createPostMemo,
    updatePost: updatePostMemo,
    deletePost: deletePostMemo,
    importPosts: importPostsMemo,
  }), [visiblePosts, posts, isLoading, isRefreshing, hasMore, refresh, loadMore, getPostByIdMemo, getPostBySlugMemo, createPostMemo, updatePostMemo, deletePostMemo, importPostsMemo]);
});
