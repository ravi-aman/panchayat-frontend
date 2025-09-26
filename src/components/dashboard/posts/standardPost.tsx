// LinkedInPost.tsx

import React, { useState, useEffect } from 'react';
import { FaHeart } from 'react-icons/fa6';
import { FaCommentDots } from 'react-icons/fa6';
import { FaArrowsRotate } from 'react-icons/fa6';
import { FaLocationArrow } from 'react-icons/fa';
import { FaCheck } from 'react-icons/fa6';
import { FaPlus } from 'react-icons/fa6';
import { IPost } from '../../../types/postTypes';
import PostService from '../../../services/PostService';
import { useAuth } from '../../../contexts/AuthContext';
import { CommentSection } from '../comments';
import { useNavigate } from 'react-router-dom';
import { checkRelationship, followUser, unfollowUser } from '../../../utils/followUtils';

// --- TYPE DEFINITIONS ---
interface PostProps {
  post: IPost;
}

// --- THE COMPONENT ---
const StandardPost: React.FC<PostProps> = ({ post }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLiked, setIsLiked] = useState(post.isLiked);
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [isLiking, setIsLiking] = useState(false);
  const [commentsCount, setCommentsCount] = useState(post.commentsCount);
  const [showComments, setShowComments] = useState(false);
  const [likesArray, setLikesArray] = useState(post.likesArray || []);
  const [isSharing, setIsSharing] = useState(false);

  // Relationship states
  const [isFollowing, setIsFollowing] = useState(false);
  const [showFollowButton, setShowFollowButton] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);

  const navigate = useNavigate();

  const { activeProfile } = useAuth();

  // Check relationship on component mount
  useEffect(() => {
    const checkFollowRelationship = async () => {
      if (!activeProfile?._id || !post.author._id) return;

      // Don't show follow button for own posts
      if (activeProfile._id === post.author._id) {
        setShowFollowButton(false);
        return;
      }

      const relationship = await checkRelationship(activeProfile._id, post.author._id);
      if (relationship && relationship.status === 'success') {
        setIsFollowing(relationship.relationship.isFollowing);
        setShowFollowButton(relationship.actions.canFollow || relationship.actions.canUnfollow);
      }
    };

    checkFollowRelationship();
  }, [activeProfile?._id, post.author._id]);

  // Handle follow/unfollow action
  const handleFollowToggle = async () => {
    if (!activeProfile?._id || !post.author._id || isFollowLoading) return;

    try {
      setIsFollowLoading(true);

      if (isFollowing) {
        const success = await unfollowUser(activeProfile._id, post.author._id);
        if (success) {
          setIsFollowing(false);
        }
      } else {
        const success = await followUser(activeProfile._id, post.author._id);
        if (success) {
          setIsFollowing(true);
        }
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
    } finally {
      setIsFollowLoading(false);
    }
  };

  const maxLength = 80; // Character limit before showing "...more"

  // Responsive truncation based on screen size
  const getMaxLength = () => {
    if (typeof window !== 'undefined') {
      const width = window.innerWidth;
      if (width < 640) return 60; // Mobile: shorter content
      if (width < 768) return 80; // Tablet: medium content
      if (width < 1024) return 120; // Desktop small: longer content
      return 150; // Desktop large: longest content
    }
    return maxLength; // Fallback
  };

  const [currentMaxLength, setCurrentMaxLength] = useState(getMaxLength());

  // Update max length on window resize
  useEffect(() => {
    const handleResize = () => {
      setCurrentMaxLength(getMaxLength());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const shouldTruncate = post.content.length > currentMaxLength;
  const displayText =
    shouldTruncate && !isExpanded ? post.content.slice(0, currentMaxLength) : post.content;

  // Helper function to get author display name
  const getAuthorName = () => {
    if (post.author.type === 'user' && post.author.user) {
      return `${post.author.user.firstName} ${post.author.user.lastName}`;
    }
    if (post.author.type === 'company' && post.author.company) {
      return post.author.company.name;
    }
    return post.author.username;
  };

  // Helper function to get author image
  const getAuthorImage = () => {
    return post.author.image;
  };

  // Helper function to get profile link based on author type
  const getAuthorProfileLink = () => {
    if (post.author.type === 'user') {
      return `/user/${post.author.username}`;
    }
    if (post.author.type === 'company') {
      return `/company/${post.author.username}`;
    }
    return `/user/${post.author.username}`; // fallback
  };

  // Handle profile navigation
  const handleProfileClick = () => {
    navigate(getAuthorProfileLink());
  };

  // Format time ago (simple implementation)
  const getTimeAgo = () => {
    const now = new Date();
    const postDate = new Date(post.createdAt);
    const diffTime = Math.abs(now.getTime() - postDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return '1d';
    if (diffDays < 7) return `${diffDays}d`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)}w`;
    return `${Math.ceil(diffDays / 30)}m`;
  };

  // Get liked users display names
  const getLikedByUsers = () => {
    if (!likesArray || likesArray.length === 0) {
      // If current user liked but no likesArray, show "You"
      if (isLiked && activeProfile?._id) {
        return ['You'];
      }
      return [];
    }

    // Filter out current user from likesArray to show other users
    const otherUsers = likesArray.filter((like) => like._id !== activeProfile?._id);

    const otherUserNames = otherUsers.slice(0, 2).map((like) => {
      if (like.user) {
        return `${like.user.firstName} ${like.user.lastName}`;
      }
      if (like.company) {
        return like.company.name;
      }
      return 'Unknown';
    });

    // If current user liked, put "You" first
    if (isLiked && activeProfile?._id) {
      return ['You', ...otherUserNames];
    }

    return otherUserNames;
  };

  // Handle like/unlike toggle
  const handleLikeToggle = async () => {
    if (!activeProfile?._id) {
      console.error('No active profile found. User must be logged in to like posts.');
      return;
    }

    if (isLiking) return; // Prevent multiple clicks

    try {
      setIsLiking(true);
      const response = await PostService.toggleLike(post._id, activeProfile._id);

      if (response.status === 'success') {
        setIsLiked(response.data.isLiked);
        setLikesCount(response.data.likesCount);

        // Update likes array based on the like status
        if (response.data.isLiked) {
          // When user likes the post, we'll let the UI show "You" based on isLiked state
          // No need to modify likesArray as we'll handle display logic separately
        } else {
          // Remove current user from likes array if they just unliked the post
          setLikesArray((prev) => prev.filter((like) => like._id !== activeProfile._id));
        }
      }
    } catch (error) {
      console.error(
        'Error toggling like:',
        error instanceof Error ? error.message : 'Unknown error',
      );
    } finally {
      setIsLiking(false);
    }
  };
  // Handle share/send post
  const handleShare = async () => {
    if (!activeProfile?._id) {
      console.error('No active profile found. User must be logged in to share posts.');
      return;
    }

    if (isSharing) return; // Prevent multiple clicks
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Post by ${getAuthorName()}`,
          text: post.content.length > 100 ? `${post.content.substring(0, 100)}...` : post.content,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
    try {
      setIsSharing(true);
      const response = await PostService.sharePost(post._id, {
        shareType: 'direct',
        platform: 'internal',
      });

      if (response.status === 'success') {
        // You can add success feedback here, like a toast notification
        console.log('Post shared successfully');
      }
    } catch (error) {
      console.error(
        'Error sharing post:',
        error instanceof Error ? error.message : 'Unknown error',
      );
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm w-full max-w-full font-sans mb-4 overflow-hidden">
      <div className="p-2 sm:p-3 md:p-4">
        {/* Post Header */}
        <div className="flex items-center mb-2 sm:mb-3 md:mb-4 gap-2 sm:gap-3">
          <img
            src={getAuthorImage()}
            alt={getAuthorName()}
            className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full flex-shrink-0 cursor-pointer"
            onClick={handleProfileClick}
          />
          <div className="flex-1 min-w-0 overflow-hidden">
            <p
              className="font-bold text-gray-900 text-xs sm:text-sm md:text-base truncate cursor-pointer hover:text-blue-600 transition-colors"
              onClick={handleProfileClick}
            >
              {getAuthorName()}
            </p>
            <p className="text-xs sm:text-sm text-gray-500 truncate">{post.author.bio}</p>
            <p className="text-xs text-gray-500">{getTimeAgo()}</p>
          </div>
          {showFollowButton && (
            <button
              onClick={handleFollowToggle}
              disabled={isFollowLoading}
              className={`font-semibold text-xs sm:text-sm flex-shrink-0 transition-colors px-2 sm:px-3 py-1 text-center ${
                isFollowLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
              } ${
                isFollowing
                  ? 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                  : 'text-blue-600 hover:text-blue-800 hover:bg-blue-50'
              }`}
            >
              {isFollowLoading ? (
                '...'
              ) : isFollowing ? (
                <span className="flex items-center justify-center gap-1">
                  <FaCheck className="inline w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Following</span>
                </span>
              ) : (
                <span className="flex items-center justify-center gap-1">
                  <FaPlus className="inline w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Follow</span>
                </span>
              )}
            </button>
          )}
        </div>

        {/* Post Body */}
        <div className="mb-2 w-full overflow-hidden">
          <p className="text-gray-800 text-sm sm:text-base leading-relaxed whitespace-pre-wrap break-words w-full">
            {displayText}
            {shouldTruncate && !isExpanded && (
              <button
                onClick={() => setIsExpanded(true)}
                className="text-blue-600 hover:text-blue-800 ml-1 font-medium text-sm sm:text-base transition-colors"
              >
                ...more
              </button>
            )}
            {shouldTruncate && isExpanded && (
              <button
                onClick={() => setIsExpanded(false)}
                className="text-blue-600 hover:text-blue-800 ml-2 font-medium text-sm sm:text-base transition-colors"
              >
                Show less
              </button>
            )}
          </p>
        </div>
      </div>

      {/* Image Grid */}
      {post.image && post.image.length > 0 && (
        <div
          className={`grid gap-0.5 sm:gap-1 ${
            post.image.length > 1 ? 'grid-cols-2' : 'grid-cols-1'
          } ${post.image.length === 3 ? 'grid-rows-2' : ''}`}
        >
          {post.image.map((img, index) => (
            <div
              key={index}
              className={`${
                post.image!.length === 3 && index === 0 ? 'col-span-2' : ''
              } overflow-hidden bg-gray-100`}
            >
              <img
                src={img.url}
                alt={img.alt || `Post content ${index + 1}`}
                className="w-full h-32 sm:h-40 md:h-48 lg:h-52 object-cover transition-transform hover:scale-105"
              />
            </div>
          ))}
        </div>
      )}

      <div className="p-3 sm:p-4">
        {/* Engagement Stats */}
        <div className="flex justify-between items-center text-xs sm:text-sm text-gray-500 mb-2">
          <div className="flex items-center gap-1 min-w-0 flex-1">
            {(() => {
              const likedUsers = getLikedByUsers();
              if (likedUsers.length === 0) return <span></span>;

              let displayText = '';
              if (likedUsers.length === 1) {
                displayText = likedUsers[0];
              } else if (likedUsers.length === 2) {
                displayText = `${likedUsers[0]} and ${likedUsers[1]}`;
              } else {
                // Calculate remaining others (total likes minus displayed users)
                const remainingCount = Math.max(0, likesCount - 2);
                if (remainingCount > 0) {
                  displayText = `${likedUsers[0]} and ${remainingCount} others`;
                } else {
                  displayText = likedUsers[0];
                }
              }

              return (
                <span className="flex items-center gap-1 truncate">
                  <FaHeart className="text-red-500 w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span className="truncate">{displayText}</span>
                </span>
              );
            })()}
          </div>
          <span className="flex-shrink-0 ml-2">{likesCount} likes</span>
          <span className="flex-shrink-0 ml-2">•</span>
          <span className="flex-shrink-0 ml-2">{post.sharesCount} reposts</span>
          <span className="flex-shrink-0 ml-2">•</span>
          <span className="flex-shrink-0 ml-2">{commentsCount} comments</span>
        </div>

        {/* Action Buttons */}
        <div className="border-t border-gray-200 pt-2 flex justify-around">
          <button
            onClick={handleLikeToggle}
            disabled={isLiking}
            className={`flex items-center space-x-1 sm:space-x-2 p-1 sm:p-2 rounded-md w-full justify-center text-xs sm:text-sm transition-colors ${
              isLiked ? 'text-red-500 hover:bg-red-50' : 'text-gray-600 hover:bg-gray-100'
            } ${isLiking ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <FaHeart className={`w-3 h-3 sm:w-4 sm:h-4 ${isLiked ? 'text-red-500' : ''}`} />{' '}
            <span className="hidden sm:inline">{isLiked ? 'Liked' : 'Like'}</span>
          </button>
          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center space-x-1 sm:space-x-2 text-gray-600 hover:bg-gray-100 p-1 sm:p-2 rounded-md w-full justify-center text-xs sm:text-sm"
          >
            <FaCommentDots className="w-3 h-3 sm:w-4 sm:h-4" />{' '}
            <span className="hidden sm:inline">Comment</span>
          </button>
          <button className="flex items-center space-x-1 sm:space-x-2 text-gray-600 hover:bg-gray-100 p-1 sm:p-2 rounded-md w-full justify-center text-xs sm:text-sm">
            <FaArrowsRotate className="w-3 h-3 sm:w-4 sm:h-4" />{' '}
            <span className="hidden sm:inline">Repost</span>
          </button>
          <button
            onClick={handleShare}
            disabled={isSharing}
            className={`flex items-center space-x-1 sm:space-x-2 p-1 sm:p-2 rounded-md w-full justify-center text-xs sm:text-sm transition-colors ${
              isSharing ? 'text-gray-400 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <FaLocationArrow className="w-3 h-3 sm:w-4 sm:h-4" />{' '}
            <span className="hidden sm:inline">{isSharing ? 'Sending...' : 'Send'}</span>
          </button>
        </div>

        {/* Comments Section */}
        {showComments && (
          <CommentSection
            postId={post._id}
            commentsCount={commentsCount}
            onCommentsCountUpdate={setCommentsCount}
          />
        )}
      </div>
    </div>
  );
};

export default StandardPost;
