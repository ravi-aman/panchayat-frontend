import api from '../utils/api';
import { FileUploadResult } from '../utils/fileUpload.utils';
import { IPost } from '../types/postTypes';

export interface CreatePostData {
  content: string;
  author: string; // Profile ID
  privacy?: 'public' | 'private' | 'friends';
  image?: Array<{
    url: string;
    alt?: string;
    publicId?: string;
    filename?: string;
    size?: number;
    mimeType?: string;
    order?: number;
  }>;
  tags?: string[];
  mentions?: string[];
  location?: {
    name: string;
    coordinates: [number, number];
  };
}

export interface CreatePollData extends CreatePostData {
  postType: 'poll';
  poll: {
    question: string;
    options: Array<{
      text: string;
    }>;
    closingDate?: string;
  };
}

export interface CreateEventData extends CreatePostData {
  postType: 'event';
  event: {
    title: string;
    description?: string;
    eventType: 'online' | 'in-person';
    startTime: string;
    endTime?: string;
    location?: string;
    link?: { name: string };
  };
}

export interface PostResponse {
  status: string;
  data: Record<string, unknown>;
  message: string;
}

export interface PostsResponse {
  status: string;
  data: {
    posts: IPost[];
    pagination?: {
      currentPage: number;
      totalPages: number;
      totalPosts: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  };
  message: string;
}

export interface SinglePostResponse {
  status: string;
  data: {
    post: IPost;
  };
  message: string;
}

export interface LikeResponse {
  status: 'success';
  message: string;
  data: {
    action: 'liked' | 'unliked';
    reactionType: string;
    likesCount: number;
    isLiked: boolean;
  };
}

export interface CommentData {
  content: string;
  author: string; // Profile ID
  post: string; // Post ID
  parentCommentId?: string;
  mentions?: string[];
}

class PostService {
  /**
   * Create a standard post
   */
  async createStandardPost(postData: CreatePostData): Promise<SinglePostResponse> {
    const response = await api.post('/api/v2/posts/standard', postData);
    return response.data;
  }

  /**
   * Create a poll post
   */
  async createPollPost(pollData: CreatePollData): Promise<SinglePostResponse> {
    const response = await api.post('/api/v2/posts/poll', pollData);
    return response.data;
  }

  /**
   * Create an event post
   */
  async createEventPost(eventData: CreateEventData): Promise<SinglePostResponse> {
    const response = await api.post('/api/v2/posts/event', eventData);
    return response.data;
  }

  /**
   * Get posts feed
   */
  async getFeed(params?: {
    page?: number;
    limit?: number;
    author?: string;
    tags?: string;
    search?: string;
    privacy?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    profileId?: string;
  }): Promise<PostsResponse> {
    try {
      const response = await api.get('/api/v2/posts', { params });
      return response.data;
    } catch (error: unknown) {
      console.error(
        'PostService.getFeed error:',
        error instanceof Error ? error.message : 'Unknown error',
      );
      throw error;
    }
  }

  /**
   * Like/unlike a post
   */
  async toggleLike(postId: string, profileId: string): Promise<LikeResponse> {
    try {
      const response = await api.post(`/api/v2/posts/${postId}/like`, {
        profileId: profileId,
      });
      return response.data;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(error.message || 'Failed to toggle like');
      }
      throw new Error('An unexpected error occurred');
    }
  }

  /**
   * Share a post
   */
  async sharePost(
    postId: string,
    shareData?: {
      platform?: string;
      message?: string;
      shareType?: 'direct' | 'repost' | 'quote';
    },
  ): Promise<PostResponse> {
    const response = await api.post(`/api/v2/posts/${postId}/share`, shareData || {});
    return response.data;
  }

  /**
   * Add a comment to a post
   */
  async addComment(commentData: CommentData): Promise<PostResponse> {
    const response = await api.post('/api/v2/comments', commentData);
    return response.data;
  }

  /**
   * Get comments for a post
   */
  async getPostComments(
    postId: string,
    params?: {
      page?: number;
      limit?: number;
    },
  ): Promise<PostResponse> {
    const response = await api.get(`/api/v2/comments/post/${postId}`, { params });
    return response.data;
  }

  /**
   * Delete a post (soft delete)
   */
  async deletePost(postId: string, reason?: string): Promise<PostResponse> {
    const response = await api.delete(`/api/v2/posts/${postId}`, {
      data: { reason },
    });
    return response.data;
  }

  /**
   * Get post analytics
   */
  async getPostAnalytics(postId: string): Promise<PostResponse> {
    const response = await api.get(`/api/v2/posts/${postId}/analytics`);
    return response.data;
  }

  /**
   * Convert uploaded files to post image format
   */
  convertFilesToPostImages(files: FileUploadResult[]): CreatePostData['image'] {
    return files.map((file, index) => ({
      url: file.url,
      alt: file.metadata?.['alt-text'] || `Image ${index + 1}`,
      publicId: file.key,
      filename: file.filename,
      size: file.size,
      mimeType: file.mimeType,
      order: index + 1,
    }));
  }
}

export default new PostService();
