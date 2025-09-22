import React, { useState } from 'react';
import api from '../../utils/api';
import { Users, HandHeart, Trash2, Lock } from 'lucide-react';
// import { SquareArrowDown, SquareArrowUp } from "lucide-react";
import { ProfileResponse } from './types';
import { useAuth } from '../../contexts/AuthContext';
import { handleMutualFollow, handleMutualUnfollow } from '../../utils/followUtils';

interface ConnectionStatus {
  status: string;
  message: string;
  _id?: string;
  cooldownUntil?: string;
  requester?: string;
  recipient?: string;
}

interface ProfileHeaderProps {
  profileData: ProfileResponse['profile'] | null;
  activeProfileId?: string;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({ profileData, activeProfileId }) => {
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus | null>(null);
  const [connectionLoading, setConnectionLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [showConnectionModal, setShowConnectionModal] = useState(false);
  const [connectionMessage, setConnectionMessage] = useState('');
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const { user } = useAuth();

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

  // Fetch connection status
  React.useEffect(() => {
    const fetchConnectionStatus = async () => {
      if (!profileData?.user._id || !activeProfileId || isOwnProfile) {
        return;
      }

      try {
        const response = await api.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/v1/connections/status/${profileData.user._id}`,
        );
        setConnectionStatus(response.data);
      } catch (error) {
        console.error('Error fetching connection status:', error);
        // Set default status for no connection
        setConnectionStatus({
          status: 'not_connected',
          message: 'No connection exists.',
        });
      }
    };

    fetchConnectionStatus();
  }, [profileData?.user._id, activeProfileId, isOwnProfile]);

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

  const handleConnect = async (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>,
  ): Promise<void> => {
    event.preventDefault();
    if (!activeProfileId || !profileData?.id) {
      console.error('Missing profile IDs for connect action');
      return;
    }

    // Open the connection modal instead of directly sending request
    setShowConnectionModal(true);
  };

  const sendConnectionRequest = async (message?: string): Promise<void> => {
    if (!activeProfileId || !profileData?.id) {
      console.error('Missing profile IDs for connect action');
      return;
    }

    setConnectionLoading(true);
    try {
      const requestMessage = message || "I'd like to connect with you!";
      const response = await api.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/connections/send-request/${
          profileData.user._id
        }`,
        {
          message: requestMessage,
        },
      );

      if ((response.status === 201 || response.status === 200) && response.data.message) {
        // Refresh connection status after sending request
        setConnectionStatus({
          status: 'pending',
          message: 'You have sent a pending request.',
        });
        setShowConnectionModal(false);
        setConnectionMessage('');
      } else {
        console.error('Failed to send connection request.');
      }
    } catch (error) {
      console.error('Error sending connection request:', error);
    } finally {
      setConnectionLoading(false);
    }
  };

  const handleAccept = async (): Promise<void> => {
    if (!connectionStatus?._id) return;

    setConnectionLoading(true);
    try {
      const response = await api.put(
        `${
          import.meta.env.VITE_BACKEND_URL
        }/api/v1/connections/accept-request/${connectionStatus.requester}`,
      );

      if (response.status === 200) {
        setConnectionStatus({
          status: 'accepted',
          message: 'You are connected.',
        });

        // Handle mutual following after accepting connection
        if (activeProfileId) {
          await handleMutualFollow(
            activeProfileId,
            profileData,
            isFollowing,
            setIsFollowing,
            setFollowerCount,
          );
        }
      }
    } catch (error) {
      console.error('Error accepting connection:', error);
    } finally {
      setConnectionLoading(false);
    }
  };

  const handleDecline = async (): Promise<void> => {
    if (!connectionStatus?._id) return;

    setConnectionLoading(true);
    try {
      const response = await api.put(
        `${
          import.meta.env.VITE_BACKEND_URL
        }/api/v1/connections/reject-request/${connectionStatus.requester}`,
      );

      if (response.status === 200) {
        setConnectionStatus({
          status: 'rejected_cooldown',
          message: 'You recently rejected/withdrew',
          requester: response.data.connection.requester,
          recipient: response.data.connection.recipient,
        });
      }
    } catch (error) {
      console.error('Error declining connection:', error);
    } finally {
      setConnectionLoading(false);
    }
  };

  const handleUnblock = async (): Promise<void> => {
    if (!profileData?.user._id) return;

    setConnectionLoading(true);
    try {
      const response = await api.put(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/connections/unblock-user/${
          connectionStatus?.recipient
        }`,
      );

      if (response.status === 200) {
        setConnectionStatus({
          status: 'not_connected',
          message: 'No connection exists.',
        });
      }
    } catch (error) {
      console.error('Error unblocking user:', error);
    } finally {
      setConnectionLoading(false);
    }
  };

  const handleMessage = async (): Promise<void> => {
    // Navigate to chat or open message interface
    console.log('Opening message interface for user:', profileData?.user._id);
    // You can implement navigation to chat here
  };

  const handleRemoveConnection = async (): Promise<void> => {
    if (!profileData?.user._id) return;

    setIsRemoving(true);
    try {
      // Handle mutual unfollowing before removing connection
      if (activeProfileId) {
        await handleMutualUnfollow(
          activeProfileId,
          profileData,
          isFollowing,
          setIsFollowing,
          setFollowerCount,
        );
      }

      await api.put(
        `${
          import.meta.env.VITE_BACKEND_URL
        }/api/v1/connections/remove-connection/${profileData.user._id}`,
      );

      setConnectionStatus({
        status: 'not_connected',
        message: 'No connection exists.',
      });
    } catch (error) {
      console.error('Error removing connection:', error);
    } finally {
      setIsRemoving(false);
      setShowDropdown(false);
    }
  };

  const handleBlockUser = async (): Promise<void> => {
    if (!profileData?.user._id) return;

    setConnectionLoading(true);
    try {
      // Handle mutual unfollowing before blocking
      if (activeProfileId) {
        await handleMutualUnfollow(
          activeProfileId,
          profileData,
          isFollowing,
          setIsFollowing,
          setFollowerCount,
        );
      }

      // Now proceed with blocking
      const response = await api.put(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/connections/block-user/${profileData.user._id}`,
      );

      if (response.status === 200 || response.status === 201) {
        setConnectionStatus({
          status: 'unblock',
          _id: response.data.connection._id,
          requester: response.data.connection.requester,
          recipient: response.data.connection.recipient,
          message: 'User has been blocked.',
        });
      }
    } catch (error) {
      console.error('Error blocking user:', error);
    } finally {
      setConnectionLoading(false);
      setShowDropdown(false);
    }
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

    const status = connectionStatus?.status || 'not_connected';

    switch (status) {
      case 'pending':
        return (
          <>
            <button
              disabled={connectionLoading}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-gray-500 border border-gray-300 rounded-md cursor-not-allowed ${
                connectionLoading ? 'opacity-50' : ''
              }`}
            >
              {connectionLoading ? 'Loading...' : 'Pending'}
            </button>
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

      case 'accept':
        return (
          <>
            <button
              onClick={handleAccept}
              disabled={connectionLoading}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-blue-600 border border-blue-600 rounded-md cursor-pointer hover:bg-blue-50${
                connectionLoading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {connectionLoading ? 'Loading...' : 'Accept'}
            </button>
            <button
              onClick={handleDecline}
              disabled={connectionLoading}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-red-700 border border-red-600 rounded-md cursor-pointer hover:bg-red-50 ${
                connectionLoading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {connectionLoading ? 'Loading...' : 'Decline'}
            </button>
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

      case 'accepted':
        return (
          <>
            <button
              onClick={handleMessage}
              className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-white transition-colors bg-blue-600 rounded-md cursor-pointer hover:bg-blue-700"
            >
              Message
            </button>
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

      case 'rejected_cooldown':
        return (
          <>
            <button
              disabled={connectionLoading}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-gray-500 border border-gray-300 rounded-md cursor-not-allowed ${
                connectionLoading ? 'opacity-50' : ''
              }`}
            >
              {connectionLoading
                ? 'Loading...'
                : connectionStatus?.requester === user?._id
                  ? connectionStatus?.message
                  : `${connectionStatus?.requester}||${user?._id}Pending`}
            </button>
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
      case 'rejected_other':
        return (
          <>
            <button
              disabled={connectionLoading}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-gray-500 border border-gray-300 rounded-md cursor-not-allowed ${
                connectionLoading ? 'opacity-50' : ''
              }`}
            >
              {connectionLoading
                ? 'Loading...'
                : connectionStatus?.requester === user?._id
                  ? connectionStatus?.message
                  : `Pending`}
            </button>
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

      case 'rejected':
        return (
          <>
            <button
              onClick={handleConnect}
              disabled={connectionLoading}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-blue-700 transition-colors border border-blue-600 rounded-md cursor-pointer hover:bg-gray-100 ${
                connectionLoading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {connectionLoading ? 'Loading...' : 'Connect'}
            </button>
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

      case 'unblock':
        return (
          <button
            onClick={handleUnblock}
            disabled={connectionLoading}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-white bg-red-600 rounded-md cursor-pointer hover:bg-red-700 ${
              connectionLoading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {connectionLoading ? 'Loading...' : 'Unblock'}
          </button>
        );

      case 'blocked':
        return null; // No buttons shown when blocked

      case 'not_connected':
      default:
        return (
          <>
            <button
              onClick={handleConnect}
              disabled={connectionLoading}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-blue-700 transition-colors border border-blue-600 rounded-md cursor-pointer hover:bg-gray-100 ${
                connectionLoading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {connectionLoading ? 'Loading...' : 'Connect'}
            </button>
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
    }
  };

  return (
    <div className="overflow-hidden bg-white rounded-lg shadow-sm">
      {/* Blue header */}
      <div className="h-[120px] sm:h-[160px] bg-[#4F81FF] relative px-3 sm:px-6 pt-3 sm:pt-6">
        {/* Avatar and Text on top of blue */}
        <div className="absolute mt-[10px] sm:mt-[15px] left-3 sm:left-6 flex items-center space-x-2 sm:space-x-4">
          <div className="flex items-center justify-center flex-shrink-0 w-20 h-20 text-xl font-bold text-gray-600 bg-gray-300 border-2 border-white rounded-full sm:text-2xl sm:border-4 sm:w-36 sm:h-36">
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
              {`${profileData.user.firstName} ${profileData.user.lastName}`.trim() || 'User Name'}
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
      <div className="px-3 pt-8 pb-6 sm:px-6 sm:pt-16 sm:pb-10">
        {/* Stats */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 sm:gap-6 sm:text-sm">
          {/* <div className="flex items-center space-x-1">
            <SquareArrowDown className="w-3 h-3 text-blue-600 sm:w-4 sm:h-4" />
            <span>
              {Array.isArray(profileData.posts) ? profileData.posts.length : 0}{" "}
              <span className="hidden sm:inline">Posts</span>
            </span>
          </div>
          <div className="flex items-center space-x-1">
            <SquareArrowUp className="w-3 h-3 text-blue-600 sm:w-4 sm:h-4" />
            <span>
              0 <span className="hidden sm:inline">Repost</span>
            </span>
          </div> */}
          <div className="flex items-center space-x-1">
            <Users className="w-3 h-3 text-blue-600 sm:w-4 sm:h-4" />
            <span>
              {followerCount} <span className="hidden sm:inline">Followers</span>
            </span>
          </div>
          <div className="flex items-center space-x-1">
            <HandHeart className="w-3 h-3 text-blue-600 sm:w-4 sm:h-4" />
            <span>
              {Array.isArray(profileData.following) ? profileData.following.length : 0}{' '}
              <span className="hidden sm:inline">Following</span>
            </span>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-col mt-4 space-y-2 sm:mt-6 sm:flex-row sm:space-x-2 sm:space-y-0">
          {renderConnectionButtons()}
          {!isOwnProfile &&
            connectionStatus?.status !== 'blocked' &&
            connectionStatus?.status !== 'unblock' && (
              <div className="flex items-center space-x-2">
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => {
                      setShowDropdown(!showDropdown);
                    }}
                    className="p-1.5 sm:p-2 text-gray-400 hover:text-gray-600 transition-colors"
                    title="More actions"
                    aria-label="More actions"
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
                      {connectionStatus?.status === 'accepted' && (
                        <button
                          onClick={handleRemoveConnection}
                          disabled={isRemoving}
                          className="flex items-center w-full px-3 py-2 space-x-2 text-xs text-left text-red-600 transition-colors rounded-md sm:px-4 sm:text-sm hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span>{isRemoving ? 'Removing...' : 'Remove Connection'}</span>
                        </button>
                      )}
                      {connectionStatus?.status !== 'unblock' && (
                        <button
                          onClick={handleBlockUser}
                          className="flex items-center w-full px-3 py-2 space-x-2 text-xs text-left text-red-600 transition-colors rounded-md sm:px-4 sm:text-sm hover:bg-red-600 hover:text-white"
                        >
                          <Lock className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span>Block User</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
        </div>
      </div>

      {/* Connection Request Modal */}
      {showConnectionModal && (
        <div
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}
          className="fixed inset-0 backdrop-blur-xs flex items-center justify-center z-50"
        >
          <div className="relative z-10 w-full max-w-md p-6 mx-4 bg-white rounded-lg shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Connect with{' '}
                {`${profileData.user.firstName || ''} ${profileData.user.lastName || ''}`.trim() ||
                  'User'}
              </h3>
              <button
                onClick={() => {
                  setShowConnectionModal(false);
                  setConnectionMessage('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="mb-4">
              <label
                htmlFor="connectionMessage"
                className="block mb-2 text-sm font-medium text-gray-700"
              >
                Add a personal message (optional)
              </label>
              <textarea
                id="connectionMessage"
                value={connectionMessage}
                onChange={(e) => setConnectionMessage(e.target.value)}
                placeholder="Hi, I'd like to connect with you..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={4}
                maxLength={300}
              />
              <div className="mt-1 text-xs text-right text-gray-500">
                {connectionMessage.length}/300
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => sendConnectionRequest()}
                disabled={connectionLoading}
                className={`flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors ${
                  connectionLoading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {connectionLoading ? 'Sending...' : 'Send without message'}
              </button>
              <button
                onClick={() => sendConnectionRequest(connectionMessage.trim() || undefined)}
                disabled={connectionLoading || !connectionMessage.trim()}
                className={`flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors ${
                  connectionLoading || !connectionMessage.trim()
                    ? 'opacity-50 cursor-not-allowed'
                    : ''
                }`}
              >
                {connectionLoading ? 'Sending...' : 'Send invitation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
