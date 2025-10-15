export type PostContentBlockType = 'text' | 'image' | 'heading' | 'quote';

export interface PostContentBlock {
  id: string;
  type: PostContentBlockType;
  content: string;
  order: number;
}

export interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: PostContentBlock[];
  featuredImage?: string;
  tags: string[];
  authorId: string;
  authorName: string;
  createdAt: number;
  updatedAt: number;
  publishedAt?: number;
  status: 'draft' | 'published';
}

export interface CreatePostInput {
  title: string;
  excerpt: string;
  content: PostContentBlock[];
  featuredImage?: string;
  tags: string[];
  status: 'draft' | 'published';
}

export interface UpdatePostInput extends Partial<CreatePostInput> {
  id: string;
}
