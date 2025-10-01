// LinkedInPost.tsx

import React, { useState, useEffect, useMemo } from 'react';

import { IPost } from '../../../types/postTypes';
import PostService from '../../../services/PostService';
import { useAuth } from '../../../contexts/AuthContext';
import { CommentSection } from '../comments';
import { useNavigate } from 'react-router-dom';
import { checkRelationship, followUser, unfollowUser } from '../../../utils/followUtils';
import DynamicImageGrid from '../../common/DynamicImageGrid';
import PostCard from '../../common/PostCard';

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
      if (!activeProfile?._id || !post.author?._id) return;

      // Don't show follow button for own posts
      if (activeProfile._id === post.author?._id) {
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
  }, [activeProfile?._id, post.author?._id]);

  // Handle follow/unfollow action
  const handleFollowToggle = async () => {
    if (!activeProfile?._id || !post.author?._id || isFollowLoading) return;

    try {
      setIsFollowLoading(true);

      if (isFollowing) {
        const success = await unfollowUser(activeProfile._id, post.author!._id);
        if (success) {
          setIsFollowing(false);
        }
      } else {
        const success = await followUser(activeProfile._id, post.author!._id);
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
    if (!post.author) return 'Anonymous';
    if (post.author.type === 'user' && post.author.user) {
      return `${post.author.user.firstName} ${post.author.user.lastName}`;
    }
    if (post.author.type === 'company' && post.author.company) {
      return post.author.company.name;
    }
    return post.author.username || 'Unknown User';
  };

  // Helper function to get author image
  const getAuthorImage = () => {
    return post.author?.image || '/logo.png';
  };

  // Helper function to get profile link based on author type
  const getAuthorProfileLink = () => {
    if (!post.author) return '#';
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

  // Memoize images array to prevent unnecessary re-renders
  const memoizedImages = useMemo(() => {
    if (!post.image || post.image.length === 0) return [];
    
    return post.image.map(img => ({
      url: img.url,
      alt: img.alt || `Post image`,
      filename: img.filename,
      width: 1200,
      height: 800
    }));
  }, [post.image]);

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
    <PostCard className="mb-6" showShadow={true} animateOnHover={true}>
      {/* Post Header */}
      <PostCard.Header
        author={{
          name: getAuthorName(),
          username: post.author?.username || 'unknown',
          avatar: getAuthorImage(),
          verified: post.author?.type === 'company',
          bio: post.author?.bio || '',
        }}
        timestamp={post.createdAt}
        location={post.location ? {
          name: ('name' in post.location && post.location.name) || 
               post.location.address || 
               post.location.country || 
               'Unknown Location',
          coordinates: post.location.coordinates
        } : undefined}
        isFollowing={isFollowing}
        onFollow={handleFollowToggle}
        onProfileClick={handleProfileClick}
        showFollowButton={showFollowButton && !!post.author}
      />

      {/* Post Content */}
      <PostCard.Content>
        <p className="text-gray-800 text-sm sm:text-base leading-relaxed whitespace-pre-wrap break-words">
          {displayText}
          {shouldTruncate && !isExpanded && (
            <button
              onClick={() => setIsExpanded(true)}
              className="text-blue-600 hover:text-blue-800 ml-1 font-medium transition-colors"
            >
              ...more
            </button>
          )}
          {shouldTruncate && isExpanded && (
            <button
              onClick={() => setIsExpanded(false)}
              className="text-blue-600 hover:text-blue-800 ml-2 font-medium transition-colors"
            >
              Show less
            </button>
          )}
        </p>
      </PostCard.Content>

      {/* Dynamic Image Grid */}
      {memoizedImages.length > 0 && (
        <DynamicImageGrid
          images={memoizedImages}
          className=""
          showHoverEffects={true}
          maxHeight="500px"
          borderRadius="0px"
        />
      )}

      {/* Engagement Stats */}
      <PostCard.Engagement
        likes={likesCount}
        comments={commentsCount}
        shares={post.sharesCount || 0}
        views={post.viewsCount}
        isLiked={isLiked}
        isBookmarked={false}
        onLike={handleLikeToggle}
        onComment={() => setShowComments(!showComments)}
        onShare={() => {}}
        onBookmark={() => {}}
        likedBy={getLikedByUsers()}
      />

      {/* Post Actions */}
      <PostCard.Actions
        isLiked={isLiked}
        isBookmarked={false}
        onLike={handleLikeToggle}
        onComment={() => setShowComments(!showComments)}
        onShare={handleShare}
        onBookmark={() => {}}
        disabled={isLiking || isSharing}
      />

      {/* Comments Section */}
      {showComments && (
        <div className="border-t border-gray-100">
          <CommentSection
            postId={post._id}
            commentsCount={commentsCount}
            onCommentsCountUpdate={setCommentsCount}
          />
        </div>
      )}
    </PostCard>
  );
};

export default StandardPost;
