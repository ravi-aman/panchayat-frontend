import axios from 'axios';

// Utility function to handle unfollowing a user
export const unfollowUser = async (followerId: string, targetId: string): Promise<boolean> => {
  try {
    await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/social/profile/unfollow`, {
      followerId,
      targetId,
    });
    return true;
  } catch (error) {
    console.error('Error unfollowing user:', error);
    return false;
  }
};

// Utility function to handle following a user
export const followUser = async (followerId: string, targetId: string): Promise<boolean> => {
  try {
    await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/social/profile/follow`, {
      followerId,
      targetId,
    });
    return true;
  } catch (error) {
    console.error('Error following user:', error);
    return false;
  }
};

// Utility function to handle mutual following during connection acceptance
export const handleMutualFollow = async (
  activeProfileId: string,
  profileData: any,
  isFollowing: boolean,
  setIsFollowing: (value: boolean) => void,
  setFollowerCount: (updater: (prev: number) => number) => void,
): Promise<void> => {
  if (!activeProfileId || !profileData.id) return;

  // Make us follow the other user if we're not already following
  if (!isFollowing) {
    const success = await followUser(activeProfileId, profileData.id);
    if (success) {
      setIsFollowing(true);
      setFollowerCount((prev) => prev + 1);
    }
  }

  // Make the other user follow us if they're not already following
  if (profileData.following && Array.isArray(profileData.following)) {
    const isTargetFollowingUs = profileData.following.some(
      (following: any) => following._id === activeProfileId,
    );

    if (!isTargetFollowingUs) {
      await followUser(profileData.id, activeProfileId);
    }
  }
};

// Utility function to handle mutual unfollowing during connection removal/blocking
export const handleMutualUnfollow = async (
  activeProfileId: string,
  profileData: any,
  isFollowing: boolean,
  setIsFollowing: (value: boolean) => void,
  setFollowerCount: (updater: (prev: number) => number) => void,
): Promise<void> => {
  if (!activeProfileId || !profileData.id) return;

  // Check if we're following this user and unfollow if we are
  if (isFollowing) {
    const success = await unfollowUser(activeProfileId, profileData.id);
    if (success) {
      setIsFollowing(false);
      setFollowerCount((prev) => prev - 1);
    }
  }

  // Check if the target user is following us and make them unfollow
  if (profileData.following && Array.isArray(profileData.following)) {
    const isTargetFollowingUs = profileData.following.some(
      (following: any) => following._id === activeProfileId,
    );

    if (isTargetFollowingUs) {
      await unfollowUser(profileData.id, activeProfileId);
    }
  }
};

// Simplified mutual follow function for connection acceptance (without UI state management)
export const handleMutualFollowForConnection = async (
  currentUserId: string,
  targetUserId: string,
): Promise<void> => {
  if (!currentUserId || !targetUserId) return;

  try {
    // Make both users follow each other
    await Promise.all([
      followUser(currentUserId, targetUserId),
      followUser(targetUserId, currentUserId),
    ]);
  } catch (error) {
    console.error('Error in mutual follow for connection:', error);
  }
};
