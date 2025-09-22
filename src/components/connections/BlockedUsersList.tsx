import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BlockedUser } from './types';
import api from '../../utils/api';

interface BlockedUsersListProps {
  blockedUsers: BlockedUser[];
  onRefresh: () => Promise<void>;
  isLoading?: boolean;
}

export const BlockedUsersList: React.FC<BlockedUsersListProps> = ({
  blockedUsers,
  onRefresh,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-gray-500 mt-2">Loading blocked users...</p>
      </div>
    );
  }

  if (blockedUsers.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-400 mb-2">
          <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-1">No blocked users</h3>
        <p className="text-gray-500">You haven't blocked any users.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {blockedUsers.map((blockedUser) => (
        <BlockedUserItem key={blockedUser._id} blockedUser={blockedUser} onRefresh={onRefresh} />
      ))}
    </div>
  );
};

interface BlockedUserItemProps {
  blockedUser: BlockedUser;
  onRefresh: () => Promise<void>;
}

const BlockedUserItem: React.FC<BlockedUserItemProps> = ({ blockedUser, onRefresh }) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleUnblock = async () => {
    setIsLoading(true);
    try {
      const response = await api.put(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/connections/unblock-user/${
          blockedUser.recipient._id
        }`,
      );

      if (response.status === 200) {
        await onRefresh();
      } else {
        console.error('Failed to unblock user');
      }
    } catch (error) {
      console.error('Error unblocking user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors space-y-3 sm:space-y-0">
      <div className="flex items-center space-x-3 sm:space-x-4">
        <img
          src={blockedUser.recipient.photo}
          alt={blockedUser.recipient.firstName}
          className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover border-2 border-gray-200 flex-shrink-0 grayscale"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = `https://placehold.co/800/white/black?text=${blockedUser.recipient.firstName[0]}${blockedUser.recipient.lastName[0]}&font=roboto`;
          }}
        />
        <div className="flex-1 min-w-0">
          <h4
            className="font-medium text-sm sm:text-base text-gray-500 hover:text-gray-700 cursor-pointer truncate"
            onClick={() => navigate(`/user/${blockedUser.recipient.profileIds[0].username}`)}
          >
            {blockedUser.recipient.firstName} {blockedUser.recipient.lastName}
          </h4>
          <p className="text-xs text-gray-400 mt-1">
            Blocked on {new Date(blockedUser.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-end space-x-2 sm:space-x-2 flex-shrink-0">
        <button
          onClick={handleUnblock}
          disabled={isLoading}
          className={`px-3 sm:px-4 py-1.5 sm:py-2 border border-red-300 text-red-600 text-xs sm:text-sm font-medium rounded-md transition-colors ${
            isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-red-50'
          }`}
        >
          {isLoading ? '...' : 'Unblock'}
        </button>
      </div>
    </div>
  );
};
