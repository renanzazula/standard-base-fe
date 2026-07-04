import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import type {Block, Post, PostStatus, SocialMediaLink} from '@shared/types/posts';
import {ENV} from '@core/config/env';
import {useAuth} from '@core/contexts/AuthContext';
import {getModuleConfig, getUserModuleConfig, updateModuleConfig} from '@core/services/moduleConfig';
import * as postsApi from '@core/services/posts';

export type PagedPosts = {
  posts: Post[];
  total: number;
  isLoading: boolean;
  hasMore: boolean;
  loadMore: () => void;
  refresh: () => Promise<void>;
};

export type PostsContextValue = {
  posts: Post[];
  isLoading: boolean;
  feed: PagedPosts;
  podcast: PagedPosts;
  fetchPostBySlug: (slug: string) => Promise<{ post: Post; resource: postsApi.PostResource } | null>;
  postsPerPage: number;
  podcastPostsPerPage: number;
  addPost: (input: NewPostInput, resource?: postsApi.PostResource) => Promise<void>;
  updatePost: (id: string, updates: Partial<Post>, resource?: postsApi.PostResource) => Promise<void>;
  deletePost: (id: string, resource?: postsApi.PostResource) => Promise<void>;
  getPostBySlug: (slug: string) => Post | undefined;
  getPublishedPosts: () => Post[];
  resetPosts: () => Promise<void>;
  importPosts: (newPosts: Array<{ title: string; coverUrl: string; status: PostStatus; publishAt: string | null; blocks: Block[]; socialMediaLinks?: SocialMediaLink[] }>, resource?: postsApi.PostResource) => Promise<{ imported: number }>;
  updatePostsPerPage: (n: number) => Promise<void>;
  updatePodcastPostsPerPage: (n: number) => Promise<void>;
  reloadFeedConfig: () => Promise<void>;
  applyFeedConfig: (settings?: Record<string, unknown>) => void;
  applyPodcastConfig: (settings?: Record<string, unknown>) => void;
};

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

function usePagedResource(
  resource: postsApi.PostResource,
  perPage: number,
  localPublished: Post[],
  localLoading: boolean,
  userId: string | null,
): PagedPosts {
  const [remotePosts, setRemotePosts] = useState<Post[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(ENV.HAS_BACKEND);
  const [localPage, setLocalPage] = useState(1);
  const pageRef = useRef(0);
  const loadingRef = useRef(false);

  const loadPage = useCallback(async (page: number) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setIsLoading(true);
    try {
      const result = await postsApi.getFeed(resource, page, perPage);
      setRemotePosts((prev) => (page === 0 ? result.posts : [...prev, ...result.posts]));
      setTotal(result.total);
      pageRef.current = page;
    } catch (error) {
      console.error(`[Posts] Failed to load ${resource} feed:`, error);
      if (page === 0) {
        setRemotePosts([]);
        setTotal(0);
      }
    } finally {
      loadingRef.current = false;
      setIsLoading(false);
    }
  }, [resource, perPage]);

  useEffect(() => {
    if (!ENV.HAS_BACKEND) return;
    if (!userId) {
      setRemotePosts([]);
      setTotal(0);
      setIsLoading(false);
      return;
    }
    loadPage(0);
  }, [userId, loadPage]);

  if (!ENV.HAS_BACKEND) {
    const visible = localPublished.slice(0, localPage * perPage);
    return {
      posts: visible,
      total: localPublished.length,
      isLoading: localLoading,
      hasMore: visible.length < localPublished.length,
      loadMore: () => setLocalPage((p) => p + 1),
      refresh: async () => setLocalPage(1),
    };
  }

  return {
    posts: remotePosts,
    total,
    isLoading,
    hasMore: remotePosts.length < total,
    loadMore: () => {
      if (!loadingRef.current && remotePosts.length < total) loadPage(pageRef.current + 1);
    },
    refresh: () => loadPage(0),
  };
}

export const [PostsProvider, usePosts] = createContextHook((): PostsContextValue => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [postsPerPage, setPostsPerPage] = useState(DEFAULT_POSTS_PER_PAGE);
  const [podcastPostsPerPage, setPodcastPostsPerPage] = useState(DEFAULT_POSTS_PER_PAGE);

  const localPublished = useMemo(() => posts.filter((p) => p.status === 'published'), [posts]);
  const userId = user?.id ?? null;

  const feed = usePagedResource('posts', postsPerPage, localPublished, isLoading, userId);
  const podcast = usePagedResource('podcast', podcastPostsPerPage, localPublished, isLoading, userId);

  const fetchPostBySlug = useCallback(async (slug: string): Promise<{ post: Post; resource: postsApi.PostResource } | null> => {
    if (!ENV.HAS_BACKEND || !slug) return null;
    try {
      return { post: await postsApi.getPostBySlug('posts', slug), resource: 'posts' };
    } catch {
      // not in the feed resource — try podcast
    }
    try {
      return { post: await postsApi.getPostBySlug('podcast', slug), resource: 'podcast' };
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    // The AsyncStorage store is the offline fallback only. In backend mode,
    // stale local copies (with legacy timestamp ids) must not shadow the
    // remote posts in getPostBySlug/findLoadedPost — edits would PUT to
    // /api/admin/.../<timestamp> and fail UUID parsing.
    if (ENV.HAS_BACKEND) {
      setIsLoading(false);
      return;
    }
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

  const refreshResource = (resource: postsApi.PostResource): Promise<void> =>
    resource === 'podcast' ? podcast.refresh() : feed.refresh();

  const findLoadedPost = (id: string): Post | undefined =>
    posts.find((p) => p.id === id) ??
    feed.posts.find((p) => p.id === id) ??
    podcast.posts.find((p) => p.id === id);

  const addPost = async (input: NewPostInput, resource: postsApi.PostResource = 'posts'): Promise<void> => {
    if (ENV.HAS_BACKEND) {
      await postsApi.createPost(resource, {
        title: input.title,
        coverUrl: input.coverUrl,
        status: input.status,
        publishAt: input.publishAt,
        blocks: input.blocks,
        socialMediaLinks: input.socialMediaLinks,
      });
      await refreshResource(resource);
      return;
    }
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

  const updatePost = async (id: string, updates: Partial<Post>, resource: postsApi.PostResource = 'posts'): Promise<void> => {
    if (ENV.HAS_BACKEND) {
      const merged = { ...findLoadedPost(id), ...updates };
      await postsApi.updatePost(resource, id, {
        title: merged.title ?? '',
        coverUrl: merged.coverUrl ?? '',
        status: merged.status ?? 'published',
        publishAt: merged.publishAt,
        blocks: merged.blocks ?? [],
        socialMediaLinks: merged.socialMediaLinks,
      });
      await refreshResource(resource);
      return;
    }
    const updated = posts.map((p) =>
      p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
    );
    await savePosts(updated);
  };

  const deletePost = async (id: string, resource: postsApi.PostResource = 'posts'): Promise<void> => {
    if (ENV.HAS_BACKEND) {
      await postsApi.deletePost(resource, id);
      await refreshResource(resource);
      return;
    }
    await savePosts(posts.filter((p) => p.id !== id));
  };

  const getPostBySlug = (slug: string): Post | undefined => {
    return (
      posts.find((p) => p.slug === slug) ??
      feed.posts.find((p) => p.slug === slug) ??
      podcast.posts.find((p) => p.slug === slug)
    );
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
    socialMediaLinks?: SocialMediaLink[];
  }>, resource: postsApi.PostResource = 'posts'): Promise<{ imported: number }> => {
    if (ENV.HAS_BACKEND) {
      const result = await postsApi.importPosts(resource, newPosts);
      await refreshResource(resource);
      return { imported: result.imported };
    }
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

  const updatePodcastPostsPerPage = async (n: number): Promise<void> => {
    const clamped = Math.min(50, Math.max(5, n));
    await updateModuleConfig('PODCAST', { postsPerPage: clamped });
    setPodcastPostsPerPage(clamped);
  };

  const reloadFeedConfig = async (): Promise<void> => {
    await loadFeedConfig();
  };

  const applyFeedConfig = (settings?: Record<string, unknown>): void => {
    if (!settings) return;
    const perPage = typeof settings.postsPerPage === 'number' ? settings.postsPerPage : DEFAULT_POSTS_PER_PAGE;
    setPostsPerPage(Math.min(50, Math.max(5, perPage)));
  };

  const applyPodcastConfig = (settings?: Record<string, unknown>): void => {
    if (!settings) return;
    const perPage = typeof settings.postsPerPage === 'number' ? settings.postsPerPage : DEFAULT_POSTS_PER_PAGE;
    setPodcastPostsPerPage(Math.min(50, Math.max(5, perPage)));
  };

  return {
    posts,
    isLoading,
    feed,
    podcast,
    fetchPostBySlug,
    postsPerPage,
    podcastPostsPerPage,
    addPost,
    updatePost,
    deletePost,
    getPostBySlug,
    getPublishedPosts,
    resetPosts,
    importPosts,
    updatePostsPerPage,
    updatePodcastPostsPerPage,
    reloadFeedConfig,
    applyFeedConfig,
    applyPodcastConfig,
  };
});
