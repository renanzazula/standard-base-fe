import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useEffect, useState} from 'react';
import type {Block, Post, PostStatus, SocialMediaLink} from '@shared/types/posts';
import {getModuleConfig, getUserModuleConfig, updateModuleConfig} from '@core/services/moduleConfig';

const POSTS_STORAGE_KEY = '@posts_data';

export const DEFAULT_POSTS_PER_PAGE = 10;

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function extractSpotifyInfo(url: string): { spotifyType: 'track' | 'album' | 'playlist' | 'episode' | 'show'; spotifyId: string } | null {
  const patterns: Array<{ type: 'track' | 'album' | 'playlist' | 'episode' | 'show'; pattern: string }> = [
    { type: 'track', pattern: 'open.spotify.com/track/' },
    { type: 'album', pattern: 'open.spotify.com/album/' },
    { type: 'playlist', pattern: 'open.spotify.com/playlist/' },
    { type: 'episode', pattern: 'open.spotify.com/episode/' },
    { type: 'show', pattern: 'open.spotify.com/show/' },
  ];
  for (const { type, pattern } of patterns) {
    if (url.includes(pattern)) {
      const id = url.split(pattern)[1]?.split('?')[0] ?? '';
      if (id) return { spotifyType: type, spotifyId: id };
    }
  }
  return null;
}

export { extractSpotifyInfo };

export type NewPostInput = {
  title: string;
  status: PostStatus;
  publishAt: string | null;
  coverUrl: string;
  blocks: Block[];
  createdBy: string;
  socialMediaLinks?: SocialMediaLink[];
};

export const [PostsProvider, usePosts] = createContextHook(() => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [postsPerPage, setPostsPerPage] = useState(DEFAULT_POSTS_PER_PAGE);

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      const postsJson = await AsyncStorage.getItem(POSTS_STORAGE_KEY);
      if (postsJson) setPosts(JSON.parse(postsJson));
    } catch (error) {
      console.error('[Posts] Failed to load posts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadFeedConfig = async () => {
    try {
      const [tenantConfig, userConfig] = await Promise.all([
        getModuleConfig('FEED').catch(() => null),
        getUserModuleConfig('FEED'),
      ]);
      const settings = userConfig?.settings ?? tenantConfig?.settings ?? {};
      const perPage = typeof settings.postsPerPage === 'number' ? settings.postsPerPage : DEFAULT_POSTS_PER_PAGE;
      setPostsPerPage(Math.min(50, Math.max(5, perPage)));
    } catch {
      // keep default on any error
    }
  };

  const savePosts = async (updated: Post[]) => {
    await AsyncStorage.setItem(POSTS_STORAGE_KEY, JSON.stringify(updated));
    setPosts(updated);
  };

  const addPost = async (input: NewPostInput): Promise<void> => {
    const slug = generateSlug(input.title);
    const now = new Date().toISOString();
    const newPost: Post = {
      id: Date.now().toString(),
      slug,
      createdAt: now,
      updatedAt: now,
      ...input,
    };
    await savePosts([newPost, ...posts]);
  };

  const updatePost = async (id: string, updates: Partial<Post>): Promise<void> => {
    const updated = posts.map((p) =>
      p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
    );
    await savePosts(updated);
  };

  const deletePost = async (id: string): Promise<void> => {
    await savePosts(posts.filter((p) => p.id !== id));
  };

  const getPostBySlug = (slug: string): Post | undefined => {
    return posts.find((p) => p.slug === slug);
  };

  const getPublishedPosts = (): Post[] => {
    return posts.filter((p) => p.status === 'published');
  };

  const resetPosts = async (): Promise<void> => {
    await AsyncStorage.removeItem(POSTS_STORAGE_KEY);
    setPosts([]);
  };

  const importPosts = async (newPosts: Array<{
    title: string;
    coverUrl: string;
    status: PostStatus;
    publishAt: string | null;
    blocks: Block[];
  }>): Promise<{ imported: number }> => {
    const now = new Date().toISOString();
    const existingSlugs = new Set(posts.map((p) => p.slug));
    const postsToAdd: Post[] = newPosts.map((input, idx) => {
      const base = generateSlug(input.title);
      let slug = base;
      let counter = 1;
      while (existingSlugs.has(slug)) {
        slug = `${base}-${counter++}`;
      }
      existingSlugs.add(slug);
      return {
        id: (Date.now() + idx).toString(),
        slug,
        createdAt: now,
        updatedAt: now,
        createdBy: 'import',
        ...input,
      };
    });
    await savePosts([...postsToAdd, ...posts]);
    return {imported: postsToAdd.length};
  };

  const updatePostsPerPage = async (n: number): Promise<void> => {
    const clamped = Math.min(50, Math.max(5, n));
    await updateModuleConfig('FEED', { postsPerPage: clamped });
    setPostsPerPage(clamped);
  };

  const reloadFeedConfig = async (): Promise<void> => {
    await loadFeedConfig();
  };

  const applyFeedConfig = (settings?: Record<string, unknown>): void => {
    if (!settings) return;
    const perPage = typeof settings.postsPerPage === 'number' ? settings.postsPerPage : DEFAULT_POSTS_PER_PAGE;
    setPostsPerPage(Math.min(50, Math.max(5, perPage)));
  };

  return {
    posts,
    isLoading,
    postsPerPage,
    addPost,
    updatePost,
    deletePost,
    getPostBySlug,
    getPublishedPosts,
    resetPosts,
    importPosts,
    updatePostsPerPage,
    reloadFeedConfig,
    applyFeedConfig,
  };
});
