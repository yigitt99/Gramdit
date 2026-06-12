import apiClient from '../api/client';

export interface PostMediaResponse {
  id: string;
  mediaUrl: string;
  mediaType: 'IMAGE' | 'VIDEO';
  createdAt: string;
}

export interface PostReactionResponse {
  id: string;
  userId: string;
  reactionType: 'LIKE' | 'UPVOTE' | 'DOWNVOTE';
}

export interface PostResponse {
  id: string;
  content: string;
  communityId: string | null;
  commentCount: number;
  reactionCount: number;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    username: string;
    fullName: string | null;
    avatarUrl: string | null;
  };
  community: {
    id: string;
    name: string;
    slug: string;
  } | null;
  media: PostMediaResponse[];
  reactions?: PostReactionResponse[];
}

export interface CreatePostDto {
  content: string;
  communityId?: string | null;
}

export interface CreatePostMediaDto {
  mediaUrl: string;
  mediaType: 'IMAGE' | 'VIDEO';
}

export interface CommentResponse {
  id: string;
  content: string;
  postId: string;
  authorId: string;
  parentCommentId: string | null;
  mediaUrl: string | null;
  mediaType: 'IMAGE' | 'VIDEO' | null;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    username: string;
    fullName: string | null;
    avatarUrl: string | null;
  };
  replies?: CommentResponse[];
}

const PostService = {
  async getAll(): Promise<PostResponse[]> {
    return apiClient.get<PostResponse[]>('/posts');
  },

  async getById(id: string): Promise<PostResponse> {
    return apiClient.get<PostResponse>(`/posts/${id}`);
  },

  async getCommunityPosts(slug: string): Promise<PostResponse[]> {
    return apiClient.get<PostResponse[]>(`/communities/${slug}/posts`);
  },

  async create(dto: CreatePostDto): Promise<PostResponse> {
    return apiClient.post<PostResponse>('/posts', dto);
  },

  async addMedia(postId: string, dto: CreatePostMediaDto): Promise<PostMediaResponse> {
    return apiClient.post<PostMediaResponse>(`/posts/${postId}/media`, dto);
  },

  async getMedia(postId: string): Promise<PostMediaResponse[]> {
    return apiClient.get<PostMediaResponse[]>(`/posts/${postId}/media`);
  },

  async getComments(postId: string): Promise<CommentResponse[]> {
    return apiClient.get<CommentResponse[]>(`/posts/${postId}/comments`);
  },

  async createComment(
    postId: string,
    content: string,
    parentCommentId?: string,
    mediaUrl?: string,
    mediaType?: 'IMAGE' | 'VIDEO'
  ): Promise<CommentResponse> {
    return apiClient.post<CommentResponse>(`/posts/${postId}/comments`, {
      content,
      parentCommentId,
      mediaUrl,
      mediaType,
    });
  },

  async toggleReaction(postId: string, reactionType: 'LIKE' | 'UPVOTE' | 'DOWNVOTE'): Promise<any> {
    return apiClient.post(`/posts/${postId}/reactions`, { reactionType });
  },
};

export default PostService;
