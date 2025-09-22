// Types for connections
export interface ConnectionSuggestion {
  _id: string;
  firstName: string;
  lastName: string;
  photo: string;
  profileIds: [
    {
      _id: string;
      username: string;
      bio: string;
    },
  ];
  mutualConnectionCount: number;
}

export interface MutualConnectionsResponse {
  message: string;
  data: ConnectionSuggestion[];
  pagination: {
    total: number;
    page: number;
    limit: number;
  };
}

export interface PendingRequest {
  _id: string;
  requester: {
    _id: string;
    photo: string;
    firstName: string;
    lastName: string;
    profileIds: [
      {
        _id: string;
        username: string;
      },
    ];
  };
  recipient: string;
  status: 'pending';
  message?: string;
  createdAt: string;
}

export interface AcceptedConnection {
  _id: string;
  connectedUser: {
    _id: string;
    photo: string;
    firstName?: string;
    lastName?: string;
    profileIds: [
      {
        _id: string;
        username: string;
      },
    ];
  };
  status: 'accepted';
  createdAt: string;
}

export interface BlockedUser {
  _id: string;
  requester: string;
  recipient: {
    _id: string;
    photo: string;
    firstName: string;
    lastName: string;
    profileIds: [
      {
        _id: string;
        username: string;
      },
    ];
  };
  status: 'blocked';
  createdAt: string;
}

export interface SentRequest {
  _id: string;
  requester: string;
  recipient: {
    _id: string;
    photo: string;
    firstName: string;
    lastName: string;
    profileIds: [
      {
        _id: string;
        username: string;
      },
    ];
  };
  status: 'pending';
  message?: string;
  createdAt: string;
}

export type TabType = 'pending' | 'sent' | 'connections' | 'blocked';
