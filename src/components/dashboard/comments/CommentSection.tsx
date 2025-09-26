import React, { useState, useEffect } from 'react';
import { IComment, commentService } from '../../../services/CommentService';
import { useAuth } from '../../../contexts/AuthContext';
import Comment from './Comment';
import WriteComment from './WriteComment';

interface CommentSectionProps {
  postId: string;
  commentsCount: number;
  onCommentsCountUpdate: (newCount: number) => void;
}

const CommentSection: React.FC<CommentSectionProps> = ({
  postId,
  commentsCount,
  onCommentsCountUpdate,
}) => {
  const [comments, setComments] = useState<IComment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreComments, setHasMoreComments] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalComments, setTotalComments] = useState(commentsCount);

  const { activeProfile } = useAuth();
  const commentsPerPage = 2;

  // Load initial comments
  useEffect(() => {
    const loadInitialComments = async () => {
      loadComments(1, true);
    };
    loadInitialComments();
  }, [postId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load comments from API
  const loadComments = async (page: number = 1, isInitial: boolean = false) => {
    try {
      if (isInitial) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }

      const response = await commentService.getComments(
        postId,
        activeProfile?._id,
        page,
        commentsPerPage,
      );

      const newComments = response?.comments || [];

      if (isInitial) {
        setComments(newComments);
      } else {
        setComments((prev) => [...prev, ...newComments]);
      }

      setCurrentPage(page);
      setHasMoreComments(response?.pagination?.hasNext || false);
      setTotalComments(response?.pagination?.total || 0);
      onCommentsCountUpdate(response?.pagination?.total || 0);
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  // Handle new comment submission
  const handleCommentSubmit = async (content: string) => {
    if (!activeProfile?._id) {
      throw new Error('User must be logged in to comment');
    }

    try {
      const response = await commentService.createComment({
        content,
        author: activeProfile._id,
        post: postId,
        mentions: [], // TODO: Extract mentions from content
      });

      if (response.status === 'success' && response.data.comment) {
        const newComment = response.data.comment;
        setComments((prev) => [newComment, ...prev]);
        setTotalComments((prev) => prev + 1);
        onCommentsCountUpdate(totalComments + 1);
      }
    } catch (error) {
      console.error('Error creating comment:', error);
      throw error;
    }
  };

  // Handle comment updates (likes, etc.)
  const handleCommentUpdate = (updatedComment: IComment) => {
    setComments((prev) =>
      prev.map((comment) => (comment._id === updatedComment._id ? updatedComment : comment)),
    );
  };

  // Handle new reply added to a comment
  const handleReplyAdded = (parentId: string) => {
    setComments((prev) =>
      prev.map((comment) => {
        if (comment._id === parentId) {
          return {
            ...comment,
            replyCount: (comment.replyCount || 0) + 1,
          };
        }
        return comment;
      }),
    );
    setTotalComments((prev) => prev + 1);
    onCommentsCountUpdate(totalComments + 1);
  };

  // Handle load more comments
  const handleLoadMore = () => {
    if (!isLoadingMore && hasMoreComments) {
      loadComments(currentPage + 1, false);
    }
  };

  if (isLoading) {
    return (
      <div className="mt-4 flex justify-center">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-4">
      {/* Write Comment Input */}
      <WriteComment
        postId={postId}
        placeholder="Write a comment..."
        onCommentSubmit={handleCommentSubmit}
      />

      {/* Comments List */}
      {comments && comments.length > 0 && (
        <div className="space-y-4">
          {/* Comments */}
          {comments.map((comment) => (
            <Comment
              key={comment._id}
              comment={comment}
              postId={postId}
              onCommentUpdate={handleCommentUpdate}
              onReplyAdded={handleReplyAdded}
            />
          ))}

          {/* See More Comments Button - shown if there are more comments to load */}
          {hasMoreComments && comments.length > 0 && (
            <div className="text-center">
              <button
                onClick={handleLoadMore}
                disabled={isLoadingMore}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium disabled:opacity-50"
              >
                {isLoadingMore ? (
                  <span className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
                    <span>Loading more comments...</span>
                  </span>
                ) : (
                  `View more comments (${totalComments - comments.length} remaining)`
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* No Comments State */}
      {!isLoading && (!comments || comments.length === 0) && totalComments === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p className="text-sm">No comments yet. Be the first to comment!</p>
        </div>
      )}
    </div>
  );
};

export default CommentSection;
