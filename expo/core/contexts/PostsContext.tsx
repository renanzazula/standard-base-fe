import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useEffect, useState} from 'react';
import type {Block, Post, PostStatus} from '@shared/types/posts';

const POSTS_STORAGE_KEY = '@posts_data';
const POSTS_PER_PAGE_KEY = '@posts_per_page';

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
      const [postsJson, perPageJson] = await Promise.all([
        AsyncStorage.getItem(POSTS_STORAGE_KEY),
        AsyncStorage.getItem(POSTS_PER_PAGE_KEY),
      ]);
      if (postsJson) setPosts(JSON.parse(postsJson));
      if (perPageJson) setPostsPerPage(Number(perPageJson));
    } catch (error) {
      console.error('[Posts] Failed to load posts:', error);
    } finally {
      setIsLoading(false);
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

  const updatePostsPerPage = async (n: number): Promise<void> => {
    const clamped = Math.min(50, Math.max(5, n));
    await AsyncStorage.setItem(POSTS_PER_PAGE_KEY, String(clamped));
    setPostsPerPage(clamped);
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
    updatePostsPerPage,
  };
});
