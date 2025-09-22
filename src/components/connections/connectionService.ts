import api from '../../utils/api';
import {
  PendingRequest,
  AcceptedConnection,
  BlockedUser,
  ConnectionSuggestion,
  MutualConnectionsResponse,
  SentRequest,
} from './types';

const BASE_URL = import.meta.env.VITE_BACKEND_URL;

export const connectionService = {
  // Fetch mutual connections (suggestions)
  async fetchMutualConnections(
    page: number = 1,
    limit: number = 10,
  ): Promise<ConnectionSuggestion[]> {
    try {
      const response = await api.get<MutualConnectionsResponse>(
        `${BASE_URL}/api/v1/connections/mutual?page=${page}&limit=${limit}`,
      );
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching mutual connections:', error);
      throw new Error('Failed to fetch mutual connections');
    }
  },

  // Fetch pending connection requests
  async fetchPendingRequests(): Promise<PendingRequest[]> {
    try {
      const response = await api.get(`${BASE_URL}/api/v1/connections/pending-requests`);
      return response.data.pendingRequests || [];
    } catch (error) {
      console.error('Error fetching pending requests:', error);
      throw new Error('Failed to fetch pending requests');
    }
  },

  // Fetch accepted connections
  async fetchAcceptedConnections(): Promise<AcceptedConnection[]> {
    try {
      const response = await api.get(`${BASE_URL}/api/v1/connections/my-connections`);
      return response.data.connections || [];
    } catch (error) {
      console.error('Error fetching accepted connections:', error);
      throw new Error('Failed to fetch accepted connections');
    }
  },

  // Fetch blocked users
  async fetchBlockedUsers(): Promise<BlockedUser[]> {
    try {
      const response = await api.get(`${BASE_URL}/api/v1/connections/blocked-users`);
      return response.data.blockedUsers || [];
    } catch (error) {
      console.error('Error fetching blocked users:', error);
      throw new Error('Failed to fetch blocked users');
    }
  },

  // // Fetch sent connection requests
  // async fetchSentRequests(): Promise<SentRequest[]> {
  //   try {
  //     const response = await api.get(
  //       `${BASE_URL}/api/v1/connections/blocked-users`
  //     );
  //     return response.data.blockedUsers || [];
  //   } catch (error) {
  //     console.error("Error fetching blocked users:", error);
  //     throw new Error("Failed to fetch blocked users");
  //   }
  // },

  // Fetch sent connection requests
  async fetchSentRequests(): Promise<SentRequest[]> {
    try {
      const response = await api.get(`${BASE_URL}/api/v1/connections/sent-requests`);
      return response.data.sentRequests || [];
    } catch (error) {
      console.error('Error fetching sent requests:', error);
      throw new Error('Failed to fetch sent requests');
    }
  },

  // Withdraw a connection request
  async withdrawConnection(connectionId: string): Promise<void> {
    try {
      await api.put(`${BASE_URL}/api/v1/connections/withdraw-request/${connectionId}`);
    } catch (error) {
      console.error('Error withdrawing connection:', error);
      throw new Error('Failed to withdraw connection');
    }
  },

  // Accept a connection request
  async acceptConnection(connectionId: string): Promise<void> {
    try {
      await api.put(`${BASE_URL}/api/v1/connections/accept-request/${connectionId}`);
    } catch (error) {
      console.error('Error accepting connection:', error);
      throw new Error('Failed to accept connection');
    }
  },

  // Reject a connection request
  async rejectConnection(connectionId: string): Promise<void> {
    try {
      await api.put(`${BASE_URL}/api/v1/connections/reject-request/${connectionId}`);
    } catch (error) {
      console.error('Error rejecting connection:', error);
      throw new Error('Failed to reject connection');
    }
  },

  // Fetch all connections at once (for initial load)
  async fetchAllConnections(): Promise<{
    pendingRequests: PendingRequest[];
    sentRequests: SentRequest[];
    acceptedConnections: AcceptedConnection[];
    blockedUsers: BlockedUser[];
  }> {
    try {
      const [pendingResponse, sentResponse, acceptedResponse, blockedResponse] = await Promise.all([
        api.get(`${BASE_URL}/api/v1/connections/pending-requests`),
        api.get(`${BASE_URL}/api/v1/connections/sent-requests`),
        api.get(`${BASE_URL}/api/v1/connections/my-connections`),
        api.get(`${BASE_URL}/api/v1/connections/blocked-users`),
      ]);

      return {
        pendingRequests: pendingResponse.data.pendingRequests || [],
        sentRequests: sentResponse.data.sentRequests || [],
        acceptedConnections: acceptedResponse.data.connections || [],
        blockedUsers: blockedResponse.data.blockedUsers || [],
      };
    } catch (error) {
      console.error('Error fetching all connections:', error);
      throw new Error('Failed to fetch connections');
    }
  },
};
