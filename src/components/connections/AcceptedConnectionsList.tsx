import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import { AcceptedConnection } from './types';
import api from '../../utils/api';
import { useAuth } from '../../contexts/AuthContext';
import { handleMutualUnfollow } from '../../utils/followUtils';
import { ProfileResponse } from '../profile';
import { useToast } from '../../contexts/toast/toastContext';

interface AcceptedConnectionsListProps {
  connections: AcceptedConnection[];
  isLoading?: boolean;
  onRefresh?: () => void; // Optional callback to refresh data after removal
}

export const AcceptedConnectionsList: React.FC<AcceptedConnectionsListProps> = ({
  connections,
  isLoading = false,
  onRefresh,
}) => {
  if (isLoading) {
    return (
      <div className="py-8 text-center">
        <div className="w-8 h-8 mx-auto border-b-2 border-blue-600 rounded-full animate-spin"></div>
        <p className="mt-2 text-gray-500">Loading connections...</p>
      </div>
    );
  }

  if (connections.length === 0) {
    return (
      <div className="py-8 text-center">
        <div className="mb-2 text-gray-400">
          <svg className="w-12 h-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
        </div>
        <h3 className="mb-1 text-lg font-medium text-gray-900">No connections</h3>
        <p className="text-gray-500">You haven't connected with anyone yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {connections.map((connection) => (
        <AcceptedConnectionItem
          key={connection._id}
          connection={connection}
          onRefresh={onRefresh}
        />
      ))}
    </div>
  );
};

interface AcceptedConnectionItemProps {
  connection: AcceptedConnection;
  onRefresh?: () => void;
}

const AcceptedConnectionItem: React.FC<AcceptedConnectionItemProps> = ({
  connection,
  onRefresh,
}) => {
  const navigate = useNavigate();
  const { activeProfile } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const toast = useToast();
  // Close dropdown when clicking outside
  useEffect(() => {
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

  const handleMessage = () => {
    navigate('/dashboard/chat', {
      state: {
        startConversationWith: connection.connectedUser.profileIds[0]._id,
      },
    });
  };

  const handleRemoveConnection = async () => {
    setIsRemoving(true);
    try {
      // Fetch the profile data to get followers/following info before removing connection
      const response = await api.get<ProfileResponse>(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/profile/${
          connection.connectedUser.profileIds[0].username
        }`,
      );

      if (response.data.status === 'success' && activeProfile?._id) {
        // Check if currently following based on profile data
        const isCurrentlyFollowing = response.data.profile.followers.some(
          (follower: any) => follower._id === activeProfile._id || follower === activeProfile._id,
        );

        // Use the mutual unfollow utility with dummy state setters since we don't need state management
        await handleMutualUnfollow(
          activeProfile._id,
          response.data.profile,
          isCurrentlyFollowing,
          () => {}, // dummy setter - we don't need to update UI state
          () => {}, // dummy setter - we don't need to update follower count
        );
      }

      // Remove the connection
      await api.put(`/api/v1/connections/remove-connection/${connection.connectedUser._id}`);

      // Call refresh callback if provided
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error('Error removing connection:', error);
      toast.open({
        message: {
          heading: 'Failed to remove connection',
          content: 'Please try again.',
        },
        duration: 5000,
        position: 'top-center',
        color: 'error',
      });
    } finally {
      setIsRemoving(false);
      setShowDropdown(false);
    }
  };

  return (
    <div className="flex flex-col justify-between p-3 space-y-3 transition-colors border border-gray-200 rounded-lg sm:flex-row sm:items-center sm:p-4 hover:bg-gray-50 sm:space-y-0">
      <div className="flex items-center space-x-3 sm:space-x-4">
        <img
          src={connection.connectedUser.photo}
          alt={connection.connectedUser.firstName}
          className="flex-shrink-0 object-cover w-10 h-10 border-2 border-gray-200 rounded-full sm:w-12 sm:h-12"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = `/logo.png`;
          }}
        />
        <div className="flex-1 min-w-0">
          <h4
            className="text-sm font-medium text-gray-900 truncate cursor-pointer sm:text-base hover:text-blue-600"
            onClick={() => navigate(`/user/${connection.connectedUser.profileIds[0].username}`)}
          >
            {connection.connectedUser.firstName} {connection.connectedUser.lastName}
          </h4>
          <p className="mt-1 text-xs text-gray-400">
            Connected on{' '}
            {new Date(connection.createdAt).toLocaleDateString('en-GB', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
            })}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-end flex-shrink-0 space-x-2 sm:space-x-2">
        <button
          onClick={handleMessage}
          className="px-3 sm:px-4 py-1.5 sm:py-2 border border-blue-500 text-blue-600 text-xs sm:text-sm font-medium rounded-md hover:bg-blue-50 transition-colors"
        >
          Message
        </button>
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
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
            <div className="absolute right-0 z-10 w-48 mt-2 bg-white border border-gray-200 rounded-md shadow-lg">
              <button
                onClick={handleRemoveConnection}
                disabled={isRemoving}
                className="flex items-center w-full px-4 py-2 space-x-2 text-sm text-left text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isRemoving ? 'Removing...' : 'Remove Connection'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
