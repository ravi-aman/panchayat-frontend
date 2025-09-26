import axios from 'axios';
import api from '../utils/api';

// Comment interfaces
export interface CommentAuthor {
  _id: string;
  type: 'user' | 'company';
  username: string;
  image: string;
  bio: string;
  user?: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  company?: {
    _id: string;
    name: string;
    verified: boolean;
  };
}

export interface IComment {
  _id: string;
  content: string;
  author: CommentAuthor;
  postId: string;
  parentId?: string; // For nested replies
  likesCount: number;
  replyCount: number;
  isLiked: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// API Response types
interface CommentsResponse {
  comments: IComment[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

interface CommentActionResponse {
  status: string;
  message: string;
  data: {
    action?: 'liked' | 'unliked';
    likesCount?: number;
    isLiked?: boolean;
    comment?: IComment;
  };
}

interface CreateCommentRequest {
  content: string;
  author: string;
  post: string;
  mentions: string[];
  parentCommentId?: string;
}

class CommentService {
  private baseURL: string;

  constructor() {
    this.baseURL = import.meta.env.VITE_BACKEND_URL;
  }

  /**
   * Get comments for a post
   */
  async getComments(
    postId: string,
    profileId?: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<CommentsResponse> {
    try {
      const response = await api.get<CommentsResponse>(
        `${this.baseURL}/api/v2/comments/post/${postId}?profileId=${profileId}`,
        {
          params: { page, limit },
        },
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Failed to fetch comments');
      }
      throw new Error('An unexpected error occurred');
    }
  }

  /**
   * Create a new comment or reply
   */
  async createComment(data: CreateCommentRequest): Promise<CommentActionResponse> {
    try {
      const response = await api.post<CommentActionResponse>(
        `${this.baseURL}/api/v2/comments`,
        data,
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Failed to create comment');
      }
      throw new Error('An unexpected error occurred');
    }
  }

  /**
   * Toggle like on a comment
   */
  async toggleCommentLike(commentId: string, profileId: string): Promise<CommentActionResponse> {
    try {
      const response = await api.post<CommentActionResponse>(
        `${this.baseURL}/api/v2/comments/${commentId}/like`,
        { profileId: profileId },
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Failed to toggle comment like');
      }
      throw new Error('An unexpected error occurred');
    }
  }

  /**
   * Get replies for a specific comment
   */
  async getReplies(
    commentId: string,
    profileId?: string,
    page: number = 1,
    limit: number = 2,
  ): Promise<CommentsResponse> {
    try {
      const response = await api.get<CommentsResponse>(
        `${this.baseURL}/api/v2/comments/${commentId}/replies`,
        {
          params: { page, limit, profileId },
        },
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Failed to fetch replies');
      }
      throw new Error('An unexpected error occurred');
    }
  }
}

// Export singleton instance
export const commentService = new CommentService();
export default CommentService;
