import React, { useState } from 'react';
import { FaHeart, FaReply } from 'react-icons/fa6';
import { IComment, commentService } from '../../../services/CommentService';
import { useAuth } from '../../../contexts/AuthContext';
import WriteComment from './WriteComment';

interface CommentProps {
  comment: IComment;
  postId: string;
  onCommentUpdate: (updatedComment: IComment) => void;
  onReplyAdded: (parentId: string) => void;
  level?: number; // For nested indentation
}

const Comment: React.FC<CommentProps> = ({
  comment,
  postId,
  onCommentUpdate,
  onReplyAdded,
  level = 0,
}) => {
  const [isLiked, setIsLiked] = useState<boolean>(comment.isLiked);
  const [likesCount, setLikesCount] = useState<number>(comment.likesCount);
  const [isLiking, setIsLiking] = useState<boolean>(false);
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const [replies, setReplies] = useState<IComment[]>([]);
  const [isLoadingReplies, setIsLoadingReplies] = useState(false);
  const [isLoadingMoreReplies, setIsLoadingMoreReplies] = useState(false);
  const [hasMoreReplies, setHasMoreReplies] = useState(true);
  const [currentRepliesPage, setCurrentRepliesPage] = useState(1);

  const { activeProfile } = useAuth();

  // Helper function to get author display name
  const getAuthorName = () => {
    if (comment.author.type === 'user' && comment.author.user) {
      return `${comment.author.user.firstName} ${comment.author.user.lastName}`;
    }
    if (comment.author.type === 'company' && comment.author.company) {
      return comment.author.company.name;
    }
    return comment.author.username;
  };

  // Helper function to get author image
  const getAuthorImage = () => {
    return comment.author.image;
  };

  // Format time ago
  const getTimeAgo = () => {
    const now = new Date();
    const commentDate = new Date(comment.createdAt);
    const diffTime = Math.abs(now.getTime() - commentDate.getTime());
    const diffMinutes = Math.ceil(diffTime / (1000 * 60));
    const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffMinutes < 60) return `${diffMinutes}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return commentDate.toLocaleDateString();
  };

  // Handle like toggle for comment
  const handleLikeToggle = async () => {
    if (!activeProfile?._id) {
      console.error('No active profile found. User must be logged in to like comments.');
      return;
    }

    if (isLiking) return; // Prevent multiple clicks

    try {
      setIsLiking(true);
      const response = await commentService.toggleCommentLike(comment._id, activeProfile._id);

      if (response.status === 'success') {
        setIsLiked(response.data.isLiked ?? false);
        setLikesCount(response.data.likesCount || 0);
      }
    } catch (error) {
      console.error('Error toggling comment like:', error);
    } finally {
      setIsLiking(false);
    }
  };

  // Handle reply submission
  const handleReplySubmit = async (content: string) => {
    if (!activeProfile?._id) {
      throw new Error('User must be logged in to reply');
    }

    try {
      const response = await commentService.createComment({
        content,
        author: activeProfile._id,
        post: postId,
        mentions: [], // TODO: Extract mentions from content
        parentCommentId: comment._id,
      });

      if (response.status === 'success' && response.data.comment) {
        const newReply = response.data.comment;
        console.log(newReply);
        setReplies((prev) => [newReply, ...prev]);
        setShowReplyInput(false);
        setShowReplies(true);
        onReplyAdded(comment._id);
      }
    } catch (error) {
      console.error('Error creating reply:', error);
      throw error;
    }
  };

  // Load replies for this comment
  const handleLoadReplies = async (page: number = 1, isInitial: boolean = false) => {
    if (replies.length > 0 && isInitial) {
      setShowReplies(!showReplies);
      return;
    }

    try {
      if (isInitial) {
        setIsLoadingReplies(true);
      } else {
        setIsLoadingMoreReplies(true);
      }

      const response = await commentService.getReplies(comment._id, activeProfile?._id, page, 2);

      const newReplies = response?.comments || [];

      if (isInitial) {
        setReplies(newReplies);
      } else {
        setReplies((prev) => [...prev, ...newReplies]);
      }

      setCurrentRepliesPage(page);
      setHasMoreReplies(response?.pagination?.hasNext || false);
      setShowReplies(true);
    } catch (error) {
      console.error('Error loading replies:', error);
    } finally {
      setIsLoadingReplies(false);
      setIsLoadingMoreReplies(false);
    }
  };

  // Handle initial load/toggle of replies
  const handleToggleReplies = () => {
    handleLoadReplies(1, true);
  };

  // Handle loading more replies
  const handleLoadMoreReplies = () => {
    if (!isLoadingMoreReplies && hasMoreReplies) {
      handleLoadReplies(currentRepliesPage + 1, false);
    }
  };

  const maxNestingLevel = 3; // Limit reply nesting
  const shouldShowReplyButton = level < maxNestingLevel;

  return (
    <div className={`${level > 0 ? 'ml-8 border-l border-gray-200 pl-4' : ''}`}>
      <div className="flex items-start space-x-3 mb-3">
        <img
          src={getAuthorImage()}
          alt={getAuthorName()}
          className="w-8 h-8 rounded-full flex-shrink-0"
        />
        <div className="flex-grow min-w-0">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-start justify-between">
              <div className="flex-grow min-w-0">
                <p className="font-semibold text-sm text-gray-900">{getAuthorName()}</p>
                <p className="text-xs text-gray-500 mb-2 truncate">{comment.author.bio}</p>
                <p className="text-sm text-gray-800 whitespace-pre-wrap break-words">
                  {comment.content}
                </p>
              </div>
              <span className="text-xs text-gray-500 flex-shrink-0 ml-2">{getTimeAgo()}</span>
            </div>
          </div>

          {/* Comment Actions */}
          <div className="flex items-center space-x-4 mt-2 text-xs">
            <button
              onClick={handleLikeToggle}
              disabled={isLiking}
              className={`flex items-center space-x-1 hover:bg-gray-100 px-2 py-1 rounded transition-colors ${
                isLiked ? 'text-red-500' : 'text-gray-600'
              } ${isLiking ? 'opacity-50' : ''}`}
            >
              <FaHeart
                className={`w-3 h-3 ${isLiked ? 'text-red-500' : 'text-gray-600'} ${isLiked ? 'fill-current' : ''}`}
              />
              <span>{likesCount > 0 ? likesCount : 'Like'}</span>
            </button>

            {shouldShowReplyButton && (
              <button
                onClick={() => setShowReplyInput(!showReplyInput)}
                className="flex items-center space-x-1 text-gray-600 hover:bg-gray-100 px-2 py-1 rounded transition-colors"
              >
                <FaReply className="w-3 h-3" />
                <span>Reply</span>
              </button>
            )}

            {comment.replyCount > 0 && (
              <button
                onClick={handleToggleReplies}
                disabled={isLoadingReplies}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                {isLoadingReplies
                  ? 'Loading...'
                  : showReplies
                    ? `Hide ${comment.replyCount} replies`
                    : `View ${comment.replyCount} replies`}
              </button>
            )}
          </div>

          {/* Reply Input */}
          {showReplyInput && (
            <div className="mt-3">
              <WriteComment
                postId={postId}
                parentId={comment._id}
                placeholder={`Reply to ${getAuthorName()}...`}
                onCommentSubmit={handleReplySubmit}
                onCancel={() => setShowReplyInput(false)}
                autoFocus={true}
                showCancel={true}
              />
            </div>
          )}

          {/* Nested Replies */}
          {showReplies && replies && replies.length > 0 && (
            <div className="mt-4 space-y-3">
              {replies.map((reply) => (
                <Comment
                  key={reply._id}
                  comment={reply}
                  postId={postId}
                  onCommentUpdate={onCommentUpdate}
                  onReplyAdded={onReplyAdded}
                  level={level + 1}
                />
              ))}

              {/* Load more replies button */}
              {hasMoreReplies && (
                <div className="mt-3">
                  <button
                    onClick={handleLoadMoreReplies}
                    disabled={isLoadingMoreReplies}
                    className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                  >
                    {isLoadingMoreReplies ? 'Loading...' : 'Show more replies'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Comment;
