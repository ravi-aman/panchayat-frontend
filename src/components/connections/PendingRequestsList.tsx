import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PendingRequest } from './types';
import { connectionService } from './connectionService';
import { ProfileResponse } from '../../components/profile';
import { useAuth } from '../../contexts/AuthContext';
import { handleMutualFollow } from '../../utils/followUtils';
import api from '../../utils/api';

interface PendingRequestsListProps {
  pendingRequests: PendingRequest[];
  isLoading?: boolean;
  onRefresh?: () => void; // Optional callback to refresh data after accept/reject
}

export const PendingRequestsList: React.FC<PendingRequestsListProps> = ({
  pendingRequests,
  isLoading = false,
  onRefresh,
}) => {
  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-gray-500 mt-2">Loading pending requests...</p>
      </div>
    );
  }

  if (pendingRequests.length === 0) {
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
        <h3 className="text-lg font-medium text-gray-900 mb-1">No pending requests</h3>
        <p className="text-gray-500">You don't have any pending connection requests.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {pendingRequests.map((request) => (
        <PendingRequestItem key={request._id} request={request} onRefresh={onRefresh} />
      ))}
    </div>
  );
};

interface PendingRequestItemProps {
  request: PendingRequest;
  onRefresh?: () => void;
}

const PendingRequestItem: React.FC<PendingRequestItemProps> = ({ request, onRefresh }) => {
  const navigate = useNavigate();
  const { activeProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleAccept = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      await connectionService.acceptConnection(request.requester._id);
      setSuccessMessage('Connection accepted successfully!');
      setTimeout(() => setSuccessMessage(null), 2000);

      // Fetch the profile data to get followers/following info
      const response = await api.get<ProfileResponse>(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/profile/${
          request.requester.profileIds[0].username
        }`,
      );

      if (response.data.status === 'success' && activeProfile?._id) {
        // Check if already following based on profile data
        const isCurrentlyFollowing = response.data.profile.followers.some(
          (follower: any) => follower._id === activeProfile._id || follower === activeProfile._id,
        );

        // Use the mutual follow utility with dummy state setters since we don't need state management
        await handleMutualFollow(
          activeProfile._id,
          response.data.profile,
          isCurrentlyFollowing,
          () => {}, // dummy setter - we don't need to update UI state
          () => {}, // dummy setter - we don't need to update follower count
        );
      } else {
        throw new Error('Failed to fetch profile data');
      }

      // Call refresh callback if provided
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error('Failed to accept connection:', error);
      setErrorMessage('Failed to accept connection');
      setTimeout(() => setErrorMessage(null), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      await connectionService.rejectConnection(request.requester._id);
      setSuccessMessage('Connection rejected successfully!');
      setTimeout(() => setSuccessMessage(null), 2000);

      // Call refresh callback if provided
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error('Failed to reject connection:', error);
      setErrorMessage('Failed to reject connection');
      setTimeout(() => setErrorMessage(null), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors space-y-3 sm:space-y-0">
      {/* Success Message */}
      {successMessage && (
        <div className="absolute -top-1 left-0 right-0 p-2 bg-green-50 border border-green-200 rounded-t-lg z-10">
          <p className="text-sm text-green-800 text-center">{successMessage}</p>
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div className="absolute -top-1 left-0 right-0 p-2 bg-red-50 border border-red-200 rounded-t-lg z-10">
          <p className="text-sm text-red-800 text-center">{errorMessage}</p>
        </div>
      )}

      <div className="flex items-center space-x-3 sm:space-x-4">
        <img
          src={request.requester.photo}
          alt={request.requester.firstName}
          className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover border-2 border-gray-200 flex-shrink-0"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = `https://placehold.co/800/white/black?text=${request.requester.firstName[0]}${request.requester.lastName[0]}&font=roboto`;
          }}
        />
        <div className="flex-1 min-w-0">
          <h4
            className="font-medium text-sm sm:text-base text-gray-900 hover:text-blue-600 cursor-pointer truncate"
            onClick={() => navigate(`/user/${request.requester.profileIds[0].username}`)}
          >
            {request.requester.firstName} {request.requester.lastName}
          </h4>
          {request.message && (
            <p className="text-xs sm:text-sm text-gray-500 italic mt-1 line-clamp-2">
              "{request.message.substring(0, 50)}
              {request.message.length > 50 ? '...' : ''}"
            </p>
          )}
          <p className="text-xs text-gray-400 mt-1">
            Sent on{' '}
            {new Date(request.createdAt).toLocaleDateString('en-GB', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
            })}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-end space-x-2 sm:space-x-2 flex-shrink-0">
        <button
          onClick={handleAccept}
          disabled={isLoading}
          className={`px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-600 text-white text-xs sm:text-sm font-medium rounded-md transition-colors ${
            isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'
          }`}
        >
          {isLoading ? '...' : 'Accept'}
        </button>
        <button
          onClick={handleReject}
          disabled={isLoading}
          className={`px-3 sm:px-4 py-1.5 sm:py-2 border border-gray-300 text-gray-700 text-xs sm:text-sm font-medium rounded-md transition-colors ${
            isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'
          }`}
        >
          {isLoading ? '...' : 'Decline'}
        </button>
      </div>
    </div>
  );
};
