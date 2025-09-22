import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ConnectionSuggestion } from './types';
import api from '../../utils/api';

interface ConnectionCardProps {
  suggestion: ConnectionSuggestion;
  onConnect?: () => void;
}

export const ConnectionCard: React.FC<ConnectionCardProps> = ({ suggestion, onConnect }) => {
  const navigate = useNavigate();
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionSent, setConnectionSent] = useState(false);

  // safe access to first profile (may be undefined)
  const profile =
    suggestion.profileIds && suggestion.profileIds.length > 0 ? suggestion.profileIds[0] : null;
  const username = profile?.username || suggestion?.firstName || '';
  const bio = profile?.bio || '';
  const fullName = `${suggestion.firstName || ''} ${suggestion.lastName || ''}`.trim();
  const initials = (
    (suggestion.firstName?.[0] || profile?.username?.[0] || 'U') + (suggestion.lastName?.[0] || '')
  ).toUpperCase();
  const imgPlaceholder = `https://placehold.co/800/white/black?text=${encodeURIComponent(initials)}&font=roboto`;

  const handleConnect = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (isConnecting || connectionSent) return;

    setIsConnecting(true);
    try {
      const response = await api.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/connections/send-request/${suggestion._id}`,
        {
          message: "I'd like to connect with you!",
        },
      );

      if (response.status === 201 || response.status === 200) {
        setConnectionSent(true);
        // Call the onConnect callback to refresh sent requests
        onConnect?.();
      }
    } catch (error) {
      console.error('Failed to send connection request:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleCardClick = () => {
    if (username) {
      navigate(`/user/${username}`);
    } else {
      // no username available — fallback to profile page or do nothing
      console.warn('No username available for suggestion', suggestion._id);
    }
  };

  const backgroundColors = [
    'bg-blue-400',
    'bg-red-400',
    'bg-gray-200',
    'bg-green-400',
    'bg-purple-400',
    'bg-yellow-400',
  ];

  const colorIndex = suggestion._id.length % backgroundColors.length;
  const backgroundColor = backgroundColors[colorIndex];

  return (
    <motion.div
      onClick={handleCardClick}
      className="overflow-hidden border border-gray-400 rounded-lg cursor-pointer"
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
      }}
      transition={{ duration: 0.3 }}
    >
      <div className={`relative h-16 ${backgroundColor}`}>
        <img
          src={suggestion.photo || imgPlaceholder}
          alt={fullName || username || 'User'}
          className="absolute bottom-0 object-cover w-12 h-12 p-1 transform -translate-x-1/2 translate-y-1/2 bg-white border-4 border-white rounded-full left-1/2 sm:w-16 sm:h-16"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            if (target.src !== imgPlaceholder) target.src = imgPlaceholder;
          }}
        />
        <button
          onClick={(e) => e.stopPropagation()}
          className="absolute p-1 bg-white rounded-full shadow-sm top-2 right-2"
          title="Close"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-3 h-3 text-gray-400 sm:h-4 sm:w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
      <div className="px-3 pt-8 pb-3 text-center sm:pt-10 sm:pb-4 sm:px-4">
        <h3 className="mb-1 text-sm font-medium text-gray-900 truncate sm:text-base">
          {fullName || username}
        </h3>
        <p className="mb-3 text-xs text-gray-600 sm:text-sm sm:mb-4 line-clamp-2">
          {bio.length > 70 ? `${bio.substring(0, 70)}...` : bio}
        </p>
        <div className="flex items-center justify-center mb-3 text-xs text-blue-600 sm:text-sm">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="flex-shrink-0 w-4 h-4 mr-1 sm:h-5 sm:w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
          </svg>
          <span className="truncate">
            {suggestion.mutualConnectionCount ?? 0} Mutual connections
          </span>
        </div>
        <button
          onClick={handleConnect}
          disabled={isConnecting || connectionSent}
          className={`w-full py-1.5 sm:py-2 border rounded-md text-sm font-medium transition-colors ${
            connectionSent
              ? 'border-blue-500 text-blue-500 bg-blue-50'
              : isConnecting
                ? 'border-gray-400 text-gray-400 bg-gray-50'
                : 'border-blue-500 text-blue-500 hover:bg-blue-50'
          }`}
        >
          {connectionSent ? 'Request Sent' : isConnecting ? 'Pending...' : 'Connect'}
        </button>
      </div>
    </motion.div>
  );
};
