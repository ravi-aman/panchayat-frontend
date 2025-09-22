import React, { useState } from 'react';
import { Users } from 'lucide-react';
import { ConnectionSuggestion } from '../connections/types';
import api from '../../utils/api';

interface ConnectSidebarProps {
  networkSuggestions: ConnectionSuggestion[];
  navigate: (path: string) => void;
}

export const ConnectSidebar: React.FC<ConnectSidebarProps> = ({ networkSuggestions, navigate }) => {
  const [connectingStates, setConnectingStates] = useState<{
    [key: string]: boolean;
  }>({});
  const [connectedStates, setConnectedStates] = useState<{
    [key: string]: boolean;
  }>({});

  const handleConnect = async (suggestion: ConnectionSuggestion) => {
    if (connectingStates[suggestion._id] || connectedStates[suggestion._id]) return;

    setConnectingStates((prev) => ({ ...prev, [suggestion._id]: true }));

    try {
      const response = await api.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/connections/send-request/${suggestion._id}`,
        {
          message: "I'd like to connect with you!",
        },
      );

      if (response.status === 201) {
        setConnectedStates((prev) => ({ ...prev, [suggestion._id]: true }));
      }
    } catch (error) {
      console.error('Failed to send connection request:', error);
    } finally {
      setConnectingStates((prev) => ({ ...prev, [suggestion._id]: false }));
    }
  };

  // Limit to 5 suggestions
  const limitedSuggestions = networkSuggestions;
  return (
    <div className="w-full lg:w-[320px]">
      <div className="p-3 bg-white rounded-lg shadow-sm sm:p-4">
        <h3 className="mb-3 text-sm font-semibold text-gray-900 sm:mb-4 sm:text-base">
          Expand your network
        </h3>
        <div className="space-y-2 sm:space-y-3">
          {limitedSuggestions.length > 0 ? (
            limitedSuggestions.map((suggestion, index) => (
              <div key={index} className="flex items-center justify-between gap-2 sm:gap-3">
                <div
                  className="flex items-center flex-1 min-w-0 space-x-2 cursor-pointer sm:space-x-3"
                  onClick={() => {
                    navigate(`/user/${suggestion.profileIds[0].username}`);
                  }}
                >
                  <div className="flex items-center justify-center flex-shrink-0 w-8 h-8 text-sm font-bold text-gray-600 bg-gray-300 rounded-full sm:w-10 sm:h-10">
                    {suggestion.photo ? (
                      <img
                        src={suggestion.photo}
                        className="object-cover w-full h-full rounded-full"
                        alt={suggestion.firstName + ' ' + suggestion.lastName}
                      />
                    ) : (
                      <span>{(suggestion.firstName?.[0] || '').toUpperCase()}</span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-medium text-gray-900 truncate sm:text-sm">
                      {suggestion.firstName + ' ' + suggestion.lastName}
                    </h4>
                    <p className="text-xs text-gray-500 truncate">
                      @{suggestion.profileIds[0].username}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleConnect(suggestion)}
                  disabled={connectingStates[suggestion._id] || connectedStates[suggestion._id]}
                  className={`px-2 sm:px-3 py-1 text-xs sm:text-sm rounded-md transition-colors flex-shrink-0 ${
                    connectedStates[suggestion._id]
                      ? 'bg-blue-100 text-blue-600 border border-blue-300'
                      : connectingStates[suggestion._id]
                        ? 'bg-gray-100 text-gray-500 border border-gray-300'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {connectedStates[suggestion._id]
                    ? 'Sent'
                    : connectingStates[suggestion._id]
                      ? '...'
                      : 'Connect'}
                </button>
              </div>
            ))
          ) : (
            <div className="py-4 text-center sm:py-6">
              <div className="mb-2 sm:mb-3">
                <Users className="w-8 h-8 mx-auto text-gray-400 sm:h-12 sm:w-12" />
              </div>
              <p className="text-xs text-gray-500 sm:text-sm">No suggestions available</p>
              <p className="mt-1 text-xs text-gray-400">Check back later for new connections</p>
            </div>
          )}
        </div>
        <button
          onClick={() => navigate('/dashboard/connections')}
          className="mt-3 text-xs font-semibold text-blue-600 cursor-pointer sm:mt-4 sm:text-sm hover:underline"
        >
          Discover more →
        </button>
      </div>
    </div>
  );
};
