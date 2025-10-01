import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  Bookmark, 
  MoreHorizontal,
  MapPin,
  Clock,
  Verified,
  Eye
} from 'lucide-react';

interface PostCardProps {
  className?: string;
  children: React.ReactNode;
  isSelected?: boolean;
  onSelect?: () => void;
  showShadow?: boolean;
  animateOnHover?: boolean;
}

interface PostHeaderProps {
  author: {
    name: string;
    username: string;
    avatar: string;
    verified?: boolean;
    bio?: string;
  };
  timestamp: Date | string;
  location?: {
    name: string;
    coordinates?: [number, number];
  };
  isFollowing?: boolean;
  onFollow?: () => void;
  onProfileClick?: () => void;
  showFollowButton?: boolean;
}

interface PostEngagementProps {
  likes: number;
  comments: number;
  shares: number;
  views?: number;
  isLiked: boolean;
  isBookmarked: boolean;
  onLike: () => void;
  onComment: () => void;
  onShare: () => void;
  onBookmark: () => void;
  likedBy?: string[]; // Array of user names who liked
  className?: string;
}

interface PostActionsProps {
  isLiked: boolean;
  isBookmarked: boolean;
  onLike: () => void;
  onComment: () => void;
  onShare: () => void;
  onBookmark: () => void;
  onMore?: () => void;
  disabled?: boolean;
  className?: string;
}

// Main Post Card Container
export const PostCard: React.FC<PostCardProps> = ({
  className = '',
  children,
  isSelected = false,
  onSelect,
  showShadow = true,
  animateOnHover = true,
}) => {
  return (
    <motion.article
      className={`
        bg-white rounded-xl border border-gray-200 overflow-hidden
        ${showShadow ? 'shadow-sm hover:shadow-md' : ''}
        ${isSelected ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}
        ${animateOnHover ? 'transition-all duration-300' : ''}
        ${className}
      `}
      onClick={onSelect}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      whileHover={animateOnHover ? { y: -2 } : {}}
      layout
    >
      {children}
    </motion.article>
  );
};

// Post Header Component
export const PostHeader: React.FC<PostHeaderProps> = ({
  author,
  timestamp,
  location,
  isFollowing,
  onFollow,
  onProfileClick,
  showFollowButton = true,
}) => {
  const formatTimeAgo = (time: Date | string) => {
    const date = typeof time === 'string' ? new Date(time) : time;
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return '1d';
    if (diffDays < 7) return `${diffDays}d`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)}w`;
    return `${Math.ceil(diffDays / 30)}m`;
  };

  return (
    <div className="p-4 pb-3">
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <motion.div
          className="flex-shrink-0 cursor-pointer"
          onClick={onProfileClick}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <div className="relative">
            <img
              src={author.avatar}
              alt={author.name}
              className="w-12 h-12 rounded-full object-cover border-2 border-gray-100"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = '/logo.png';
              }}
            />
            {author.verified && (
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                <Verified className="w-3 h-3 text-white fill-current" />
              </div>
            )}
          </div>
        </motion.div>

        {/* Author Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <button
              onClick={onProfileClick}
              className="font-semibold text-gray-900 hover:text-blue-600 transition-colors truncate"
            >
              {author.name}
            </button>
            <span className="text-gray-500 text-sm">@{author.username}</span>
            <span className="text-gray-400">•</span>
            <div className="flex items-center gap-1 text-gray-500 text-sm">
              <Clock className="w-3 h-3" />
              <span>{formatTimeAgo(timestamp)}</span>
            </div>
          </div>
          
          {author.bio && (
            <p className="text-sm text-gray-600 mt-1 truncate">{author.bio}</p>
          )}

          {location && (
            <div className="flex items-center gap-1 mt-2 text-gray-500 text-sm">
              <MapPin className="w-3 h-3" />
              <span className="truncate">{location.name}</span>
            </div>
          )}
        </div>

        {/* Follow Button */}
        {showFollowButton && (
          <motion.button
            onClick={onFollow}
            className={`
              px-4 py-1.5 text-sm font-medium rounded-full transition-all duration-200
              ${isFollowing 
                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' 
                : 'bg-blue-500 text-white hover:bg-blue-600'
              }
            `}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {isFollowing ? 'Following' : 'Follow'}
          </motion.button>
        )}
      </div>
    </div>
  );
};

// Post Engagement Stats
export const PostEngagement: React.FC<PostEngagementProps> = ({
  likes,
  comments,
  shares,
  views,
  isLiked,
  onLike,
  likedBy = [],
  className = '',
}) => {
  const getLikeText = () => {
    if (likes === 0) return '';
    if (likes === 1) return isLiked ? 'You liked this' : '1 like';
    if (isLiked && likedBy.length > 0) {
      const others = likedBy.slice(0, 2).join(', ');
      const remaining = likes - likedBy.length - 1;
      return remaining > 0 
        ? `You, ${others} and ${remaining} others` 
        : `You and ${others}`;
    }
    return `${likes.toLocaleString()} likes`;
  };

  return (
    <div className={`px-4 py-2 border-t border-gray-100 ${className}`}>
      <div className="flex items-center justify-between text-sm text-gray-600">
        <div className="flex items-center gap-4">
          {likes > 0 && (
            <button onClick={onLike} className="hover:text-blue-600 transition-colors">
              <span>{getLikeText()}</span>
            </button>
          )}
          {comments > 0 && (
            <span>{comments.toLocaleString()} comment{comments !== 1 ? 's' : ''}</span>
          )}
          {shares > 0 && (
            <span>{shares.toLocaleString()} share{shares !== 1 ? 's' : ''}</span>
          )}
        </div>
        
        {views && views > 0 && (
          <div className="flex items-center gap-1">
            <Eye className="w-4 h-4" />
            <span>{views.toLocaleString()}</span>
          </div>
        )}
      </div>
    </div>
  );
};

// Post Actions
export const PostActions: React.FC<PostActionsProps> = ({
  isLiked,
  isBookmarked,
  onLike,
  onComment,
  onShare,
  onBookmark,
  onMore,
  disabled = false,
  className = '',
}) => {
  const [isSharing, setIsSharing] = useState(false);

  const handleShare = async () => {
    setIsSharing(true);
    try {
      await onShare();
    } finally {
      setIsSharing(false);
    }
  };

  const actionButtonClass = `
    flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-gray-600 
    hover:bg-gray-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
    flex-1 sm:flex-none sm:px-6
  `;

  return (
    <div className={`p-4 pt-2 border-t border-gray-100 ${className}`}>
      <div className="flex items-center justify-between gap-1">
        <motion.button
          onClick={onLike}
          disabled={disabled}
          className={`${actionButtonClass} ${isLiked ? 'text-red-500 hover:bg-red-50' : ''}`}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
          <span className="text-sm font-medium hidden sm:inline">Like</span>
        </motion.button>

        <motion.button
          onClick={onComment}
          disabled={disabled}
          className={actionButtonClass}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <MessageCircle className="w-5 h-5" />
          <span className="text-sm font-medium hidden sm:inline">Comment</span>
        </motion.button>

        <motion.button
          onClick={handleShare}
          disabled={disabled || isSharing}
          className={actionButtonClass}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Share2 className="w-5 h-5" />
          <span className="text-sm font-medium hidden sm:inline">
            {isSharing ? 'Sharing...' : 'Share'}
          </span>
        </motion.button>

        <div className="flex items-center gap-1">
          <motion.button
            onClick={onBookmark}
            disabled={disabled}
            className={`
              p-3 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
              ${isBookmarked ? 'text-blue-500 hover:bg-blue-50' : 'text-gray-600 hover:bg-gray-50'}
            `}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Bookmark className={`w-5 h-5 ${isBookmarked ? 'fill-current' : ''}`} />
          </motion.button>

          {onMore && (
            <motion.button
              onClick={onMore}
              disabled={disabled}
              className="p-3 rounded-lg text-gray-600 hover:bg-gray-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <MoreHorizontal className="w-5 h-5" />
            </motion.button>
          )}
        </div>
      </div>
    </div>
  );
};

// Post Content Container
export const PostContent: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => {
  return (
    <div className={`px-4 pb-3 ${className}`}>
      {children}
    </div>
  );
};

// Export compound component
const PostCardCompound = Object.assign(PostCard, {
  Header: PostHeader,
  Content: PostContent,
  Engagement: PostEngagement,
  Actions: PostActions,
});

export default PostCardCompound;