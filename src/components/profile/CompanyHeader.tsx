import React, { useState } from 'react';
import api from '../../utils/api';
import { Users, HandHeart } from 'lucide-react';
// import { SquareArrowDown, SquareArrowUp } from "lucide-react";
import { ProfileResponse } from './types';

interface ProfileHeaderProps {
  profileData: ProfileResponse['profile'] | null;
  activeProfileId?: string;
}

export const CompanyHeader: React.FC<ProfileHeaderProps> = ({ profileData, activeProfileId }) => {
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  if (!profileData) return null;

  // Check if viewing own profile
  const isOwnProfile = activeProfileId === profileData.id;

  // Check if current user is already following this profile
  React.useEffect(() => {
    if (profileData && activeProfileId) {
      const isCurrentlyFollowing = profileData.followers.some(
        (follower: any) => follower._id === activeProfileId || follower === activeProfileId,
      );
      setIsFollowing(isCurrentlyFollowing);
      // Initialize follower count
      setFollowerCount(Array.isArray(profileData.followers) ? profileData.followers.length : 0);
    }
  }, [profileData, activeProfileId]);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle follow/unfollow action
  const handleFollowToggle = async () => {
    if (!activeProfileId || !profileData.id) {
      console.error('Missing profile IDs for follow action');
      return;
    }

    setIsLoading(true);

    // Optimistic update
    const wasFollowing = isFollowing;
    const previousCount = followerCount;
    setIsFollowing(!isFollowing);
    setFollowerCount((prev) => (wasFollowing ? prev - 1 : prev + 1));

    try {
      const endpoint = wasFollowing ? 'unfollow' : 'follow';
      const response = await api.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/social/profile/${endpoint}`,
        {
          followerId: activeProfileId,
          targetId: profileData.id,
        },
      );

      if (response.data.status === 'success') {
      } else {
        // Revert optimistic update on failure
        setIsFollowing(wasFollowing);
        setFollowerCount(previousCount);
      }
    } catch (error) {
      console.error(`Error ${wasFollowing ? 'unfollowing' : 'following'}:`, error);
      // Revert optimistic update on error
      setIsFollowing(wasFollowing);
      setFollowerCount(previousCount);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMessage = async (): Promise<void> => {
    // Navigate to chat or open message interface
    console.log('Opening message interface for user:', profileData?.user._id);
    // You can implement navigation to chat here
  };

  // Render connection buttons based on status
  const renderConnectionButtons = () => {
    if (isOwnProfile) {
      return (
        <button className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-blue-700 transition-colors border border-blue-600 rounded-md cursor-pointer hover:bg-gray-100">
          Edit Profile
        </button>
      );
    }

    return (
      <>
        {/* Message Button */}
        <button
          onClick={handleMessage}
          className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-white transition-colors bg-blue-600 rounded-md cursor-pointer hover:bg-blue-700"
        >
          Message
        </button>

        {/* Follow/Unfollow Button */}
        <button
          onClick={handleFollowToggle}
          disabled={isLoading}
          className={`px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm transition-colors border border-blue-600 rounded-md cursor-pointer hover:bg-gray-100 ${
            isLoading ? 'opacity-50 cursor-not-allowed' : ''
          } ${isFollowing ? 'bg-blue-600 text-white hover:text-blue-700' : 'text-blue-700'}`}
        >
          {isLoading ? 'Loading...' : isFollowing ? 'Unfollow' : 'Follow'}
        </button>
      </>
    );
  };

  return (
    <div className="overflow-hidden bg-white rounded-lg shadow-sm">
      {/* Blue header */}
      <div className="h-[120px] sm:h-[160px] bg-[#4F81FF] relative px-3 sm:px-6 pt-3 sm:pt-6">
        {/* Avatar and Text on top of blue */}
        <div className="absolute mt-[10px] sm:mt-[15px] left-3 sm:left-6 flex items-center space-x-2 sm:space-x-4">
          <div className="flex items-center justify-center text-xl sm:text-2xl font-bold text-gray-600 bg-gray-300 border-2 sm:border-4 border-white rounded-full w-20 h-20 sm:w-36 sm:h-36 flex-shrink-0">
            <img
              src={
                profileData.image ||
                profileData.user.photo ||
                profileData.user.logo ||
                `${import.meta.env.VITE_DEFAULT_PICTURE}`
              }
              alt=""
              className="object-cover w-full h-full rounded-full"
            />
          </div>
          <div className="min-w-0 flex-1 pr-2">
            <h1 className="text-lg sm:text-2xl font-bold text-white truncate">
              {`${profileData.user.name}`.trim() || 'User Name'}
            </h1>
            <div className="bg-white px-2 py-0.5 rounded-md mt-1 inline-block max-w-full">
              <p className="text-xs sm:text-sm font-medium text-blue-600 truncate">
                {profileData.user.email || 'sample@email.com'}
              </p>
            </div>
          </div>
        </div>
      </div>
      {/* Stats & Actions */}
      <div className="px-3 sm:px-6 pt-8 sm:pt-16 pb-6 sm:pb-10">
        {/* Stats */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-xs sm:text-sm text-gray-500">
          {/* <div className="flex items-center space-x-1">
            <SquareArrowDown className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />
            <span>
              {Array.isArray(profileData.posts) ? profileData.posts.length : 0}{" "}
              <span className="hidden sm:inline">Posts</span>
            </span>
          </div>
          <div className="flex items-center space-x-1">
            <SquareArrowUp className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />
            <span>
              0 <span className="hidden sm:inline">Repost</span>
            </span>
          </div> */}
          <div className="flex items-center space-x-1">
            <Users className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />
            <span>
              {followerCount} <span className="hidden sm:inline">Followers</span>
            </span>
          </div>
          <div className="flex items-center space-x-1">
            <HandHeart className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />
            <span>
              {Array.isArray(profileData.following) ? profileData.following.length : 0}{' '}
              <span className="hidden sm:inline">Following</span>
            </span>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-col mt-4 sm:mt-6 space-y-2 sm:flex-row sm:space-x-2 sm:space-y-0">
          {renderConnectionButtons()}
          {!isOwnProfile && (
            <div className="flex items-center space-x-2">
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => {
                    setShowDropdown(!showDropdown);
                  }}
                  className="p-1.5 sm:p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg
                    className="w-4 h-4 sm:w-5 sm:h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zM12 13a1 1 0 110-2 1 1 0 010 2zM12 20a1 1 0 110-2 1 1 0 010 2z"
                    />
                  </svg>
                </button>

                {showDropdown && (
                  <div className="absolute left-0 mt-2 w-40 sm:w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10 flex flex-col">
                    <div className="px-3 sm:px-4 py-2 text-xs sm:text-sm text-gray-500 text-center">
                      No actions available
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
