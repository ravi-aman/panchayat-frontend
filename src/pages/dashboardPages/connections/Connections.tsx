import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  PendingRequestsList,
  SentRequestsList,
  AcceptedConnectionsList,
  BlockedUsersList,
  ConnectionCard,
  connectionService,
  PendingRequest,
  SentRequest,
  AcceptedConnection,
  BlockedUser,
  ConnectionSuggestion,
  TabType,
} from '../../../components/connections';
import { useAuth } from '../../../contexts/AuthContext';

const Connections: React.FC = () => {
  const { user, accessToken } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('pending');

  // Separate states for each connection type
  const [pendingConnections, setPendingConnections] = useState<PendingRequest[]>([]);
  const [sentConnections, setSentConnections] = useState<SentRequest[]>([]);
  const [acceptedConnections, setAcceptedConnections] = useState<AcceptedConnection[]>([]);
  const [blockedConnections, setBlockedConnections] = useState<BlockedUser[]>([]);
  const [connectionSuggestions, setConnectionSuggestions] = useState<ConnectionSuggestion[]>([]);

  const [loading, setLoading] = useState(false);
  const [tabLoading, setTabLoading] = useState(false);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch connection suggestions
  const fetchConnectionSuggestions = async () => {
    setSuggestionsLoading(true);
    setError(null);
    try {
      const suggestions = await connectionService.fetchMutualConnections(1, 12);
      setConnectionSuggestions(suggestions);
    } catch (error) {
      console.error('Error fetching connection suggestions:', error);
      setConnectionSuggestions([]);
    } finally {
      setSuggestionsLoading(false);
    }
  };

  // API Functions using the new service
  const fetchAllConnections = async () => {
    setLoading(true);
    setError(null);
    try {
      const { pendingRequests, sentRequests, acceptedConnections, blockedUsers } =
        await connectionService.fetchAllConnections();

      setPendingConnections(pendingRequests);
      setSentConnections(sentRequests);
      setAcceptedConnections(acceptedConnections);
      setBlockedConnections(blockedUsers);
    } catch (error) {
      console.error('Error fetching connections:', error);
      setError('Failed to fetch connections');
      setPendingConnections([]);
      setSentConnections([]);
      setAcceptedConnections([]);
      setBlockedConnections([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchConnectionsByType = async (type: TabType) => {
    setTabLoading(true);
    setError(null);
    try {
      switch (type) {
        case 'pending': {
          const pendingRequests = await connectionService.fetchPendingRequests();
          setPendingConnections(pendingRequests);
          break;
        }
        case 'sent': {
          const sentRequests = await connectionService.fetchSentRequests();
          setSentConnections(sentRequests);
          break;
        }
        case 'connections': {
          const acceptedConnections = await connectionService.fetchAcceptedConnections();
          setAcceptedConnections(acceptedConnections);
          break;
        }
        case 'blocked': {
          const blockedUsers = await connectionService.fetchBlockedUsers();
          setBlockedConnections(blockedUsers);
          break;
        }
      }
    } catch (error) {
      console.error(`Error fetching ${type} connections:`, error);
      setError(`Failed to fetch ${type} connections`);
    } finally {
      setTabLoading(false);
    }
  };

  // Clear messages when tab changes
  useEffect(() => {
    setError(null);
    setSuccessMessage(null);
  }, [activeTab]);

  // Load all connections on component mount, but only when authenticated
  useEffect(() => {
    if (user && accessToken) {
      fetchAllConnections();
      fetchConnectionSuggestions();
    }
  }, [user, accessToken]);

  const getTabCounts = () => {
    return {
      pending: pendingConnections.length,
      sent: sentConnections.length,
      connections: acceptedConnections.length,
      blocked: blockedConnections.length,
    };
  };

  const tabCounts = getTabCounts();

  const renderTabContent = () => {
    // Show loading if not authenticated yet
    if (!user || !accessToken) {
      return (
        <div className="py-8 text-center">
          <div className="w-8 h-8 mx-auto border-b-2 border-blue-600 rounded-full animate-spin"></div>
          <p className="mt-2 text-gray-500">Authenticating...</p>
        </div>
      );
    }

    if (loading || tabLoading) {
      return (
        <div className="py-8 text-center">
          <div className="w-8 h-8 mx-auto border-b-2 border-blue-600 rounded-full animate-spin"></div>
          <p className="mt-2 text-gray-500">
            {loading ? 'Loading connections...' : `Loading ${activeTab} connections...`}
          </p>
        </div>
      );
    }

    switch (activeTab) {
      case 'pending':
        return (
          <PendingRequestsList
            pendingRequests={pendingConnections}
            onRefresh={async () => {
              // Refresh both pending and accepted connections after accept/reject
              await Promise.all([
                fetchConnectionsByType('pending'),
                fetchConnectionsByType('connections'),
              ]);
            }}
          />
        );
      case 'sent':
        return (
          <SentRequestsList
            sentRequests={sentConnections}
            onRefresh={async () => {
              await Promise.all([fetchConnectionsByType('sent')]);
            }}
          />
        );
      case 'connections':
        return (
          <AcceptedConnectionsList
            connections={acceptedConnections}
            onRefresh={async () => {
              await Promise.all([
                fetchConnectionsByType('connections'),
                fetchConnectionSuggestions(),
              ]);
            }}
          />
        );
      case 'blocked':
        return (
          <BlockedUsersList
            blockedUsers={blockedConnections}
            onRefresh={async () => {
              await Promise.all([fetchConnectionsByType('blocked'), fetchConnectionSuggestions()]);
            }}
          />
        );
      default:
        return null;
    }
  };

  return (
    <motion.div
      className="w-full max-w-6xl p-3 mx-auto sm:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      {/* Connections Management Section */}
      <motion.div
        className="mb-6 sm:mb-8"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="px-4 py-4 border-b border-gray-200 sm:px-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 sm:text-xl">My Network</h2>
                <p className="mt-1 text-sm text-gray-600 sm:text-base">
                  Manage your connections and invitations
                </p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => fetchConnectionsByType(activeTab)}
                  disabled={loading || tabLoading || !user || !accessToken}
                  className="p-2 text-gray-400 transition-colors hover:text-gray-600 disabled:opacity-50"
                  title={`Refresh ${activeTab} connections`}
                >
                  <svg
                    className={`w-5 h-5 ${tabLoading ? 'animate-spin' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                </button>
                <button
                  onClick={fetchAllConnections}
                  disabled={loading || tabLoading || !user || !accessToken}
                  className="px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
                  title="Refresh all connections"
                >
                  {loading ? '...' : 'Refresh All'}
                </button>
              </div>
            </div>

            {/* Success Message */}
            {successMessage && (
              <div className="p-3 mt-3 border border-green-200 rounded-md bg-green-50">
                <div className="flex">
                  <svg
                    className="flex-shrink-0 w-5 h-5 text-green-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-green-800">{successMessage}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="p-3 mt-3 border border-red-200 rounded-md bg-red-50">
                <div className="flex">
                  <svg
                    className="flex-shrink-0 w-5 h-5 text-red-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-red-800">{error}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav
              className="flex px-4 space-x-4 overflow-x-auto sm:space-x-8 sm:px-6"
              aria-label="Tabs"
            >
              {[
                { key: 'pending', label: 'Pending', count: tabCounts.pending },
                { key: 'sent', label: 'Sent', count: tabCounts.sent },
                {
                  key: 'connections',
                  label: 'Connections',
                  count: tabCounts.connections,
                },
                { key: 'blocked', label: 'Blocked', count: tabCounts.blocked },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as TabType)}
                  className={`py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap ${
                    activeTab === tab.key
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                  {tab.count > 0 && (
                    <span
                      className={`ml-1 sm:ml-2 inline-flex items-center px-1.5 sm:px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        activeTab === tab.key
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-4 sm:p-6">{renderTabContent()}</div>
        </div>
      </motion.div>

      <div className="px-2 mb-4 sm:px-0">
        <motion.h1
          className="text-2xl font-bold text-gray-900 sm:text-3xl"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          Make Connections
        </motion.h1>
        <motion.p
          className="mt-1 text-base text-gray-600 sm:text-lg"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          More Suggestions for you
        </motion.p>
      </div>

      <motion.div
        className="grid grid-cols-1 gap-4 mt-6 sm:grid-cols-2 lg:grid-cols-3 sm:gap-5 sm:mt-10"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 },
          },
        }}
      >
        {suggestionsLoading ? (
          <div className="py-8 text-center col-span-full">
            <div className="w-8 h-8 mx-auto border-b-2 border-blue-600 rounded-full animate-spin"></div>
            <p className="mt-2 text-gray-500">Loading suggestions...</p>
          </div>
        ) : connectionSuggestions.length > 0 ? (
          connectionSuggestions.map((suggestion) => (
            <ConnectionCard
              key={suggestion._id}
              suggestion={suggestion}
              onConnect={async () => {
                await fetchConnectionsByType('sent');
              }}
            />
          ))
        ) : (
          <div className="py-8 text-center col-span-full">
            <p className="text-gray-500">No connection suggestions available.</p>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default Connections;
