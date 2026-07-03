import {apiFetch} from './api';
import type {Block, Post, PostStatus, SocialMediaLink} from '@shared/types/posts';

export type PostResource = 'posts' | 'podcast';

type ApiPostResponse = {
  id: string;
  slug: string;
  title: string;
  status?: PostStatus;
  publishAt?: string | null;
  coverUrl?: string;
  blocks?: Block[];
  socialMediaLinks?: SocialMediaLink[];
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
};

type ApiFeedPageResponse = {
  posts?: ApiPostResponse[];
  total?: number;
  page?: number;
  size?: number;
};

export type FeedPage = {
  posts: Post[];
  total: number;
  page: number;
  size: number;
};

function mapPost(api: ApiPostResponse): Post {
  const createdAt = api.createdAt ?? new Date().toISOString();
  return {
    id: api.id,
    slug: api.slug,
    title: api.title,
    status: api.status ?? 'published',
    publishAt: api.publishAt ?? null,
    coverUrl: api.coverUrl ?? '',
    blocks: api.blocks ?? [],
    socialMediaLinks: api.socialMediaLinks,
    createdAt,
    updatedAt: api.updatedAt ?? createdAt,
    createdBy: api.createdBy ?? '',
  };
}

export async function getFeed(resource: PostResource, page: number, size: number): Promise<FeedPage> {
  const data = await apiFetch<ApiFeedPageResponse>(`/api/${resource}?page=${page}&size=${size}`);
  return {
    posts: (data.posts ?? []).map(mapPost),
    total: data.total ?? 0,
    page: data.page ?? page,
    size: data.size ?? size,
  };
}

export async function getPostBySlug(resource: PostResource, slug: string): Promise<Post> {
  const data = await apiFetch<ApiPostResponse>(`/api/${resource}/${encodeURIComponent(slug)}`);
  return mapPost(data);
}

export type PostWriteInput = {
  title: string;
  coverUrl: string;
  status: PostStatus;
  publishAt?: string | null;
  blocks: Block[];
  socialMediaLinks?: SocialMediaLink[];
};

export type ImportPostItem = {
  title: string;
  coverUrl: string;
  status: PostStatus;
  publishAt?: string | null;
  blocks: Block[];
};

export type ImportResult = {
  imported: number;
  failed: number;
  errors: string[];
};

function toWriteBody(input: PostWriteInput) {
  return {
    title: input.title,
    coverUrl: input.coverUrl,
    status: input.status,
    publishAt: input.publishAt ?? undefined,
    blocks: input.blocks,
    socialMediaLinks: input.socialMediaLinks,
  };
}

export async function createPost(resource: PostResource, input: PostWriteInput): Promise<Post> {
  const data = await apiFetch<ApiPostResponse>(`/api/admin/${resource}`, {
    method: 'POST',
    body: JSON.stringify(toWriteBody(input)),
  });
  return mapPost(data);
}

export async function updatePost(resource: PostResource, id: string, input: PostWriteInput): Promise<Post> {
  const data = await apiFetch<ApiPostResponse>(`/api/admin/${resource}/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(toWriteBody(input)),
  });
  return mapPost(data);
}

export async function deletePost(resource: PostResource, id: string): Promise<void> {
  await apiFetch<void>(`/api/admin/${resource}/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

export async function importPosts(resource: PostResource, items: ImportPostItem[]): Promise<ImportResult> {
  const data = await apiFetch<Partial<ImportResult>>(`/api/admin/${resource}/import`, {
    method: 'POST',
    body: JSON.stringify({
      posts: items.map((item) => ({
        title: item.title,
        coverUrl: item.coverUrl,
        status: item.status,
        publishAt: item.publishAt ?? undefined,
        blocks: item.blocks,
      })),
    }),
  });
  return {
    imported: data.imported ?? 0,
    failed: data.failed ?? 0,
    errors: data.errors ?? [],
  };
}
