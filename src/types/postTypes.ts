export interface IPollOption {
  text: string;
  votes: string[];
}

export interface IPoll {
  question: string;
  options: IPollOption[];
  closingDate?: Date;
}

export interface IEvent {
  title: string;
  description?: string;
  eventType: 'online' | 'in-person';
  startTime: Date;
  endTime?: Date;
  location?: string;
  link?: string;
}

export interface IDocument {
  url: string;
  publicId?: string;
  filename: string;
  size: number;
  mimeType: string;
}

// --- MAIN POST INTERFACE ---

export interface IPost {
  _id: string;
  content: string;
  author: {
    _id: string;
    type: 'user' | 'company' | string;
    username: string;
    image: string;
    bio: string;
    user?: {
      _id: string;
      firstName: string;
      lastName: string;
    };
    company?: {
      _id: string;
      name: string;
      verified: boolean;
    };
  }; // Ref to 'Profile' - Profile ID of the author

  // Post Type Discriminator
  postType: 'standard' | 'poll' | 'event' | 'document' | 'civic_issue';

  // Type-Specific Data Fields
  poll?: IPoll;
  event?: IEvent;
  document?: IDocument;

  // Standard Fields from Original Model
  image?: {
    _id: string;
    url: string;
    publicId?: string;
    alt?: string;
    filename?: string;
    size?: number;
    mimeType?: string;
    order?: number;
  }[];

  isDeleted: boolean;
  deletedAt?: Date;
  status: 'draft' | 'published' | 'archived' | 'flagged' | 'pending_review';
  privacy: 'public' | 'private' | 'friends';
  tags: string[];
  mentions: string[]; // Refs to 'Profile'
  location?: {
    name?: string;
    coordinates: [number, number];
    address?: string;
    country?: string;
    type?: string;
    accuracyMeters?: number;
    altitude?: number;
    terrain?: string;
    landUse?: string;
    populationDensity?: number;
    nearbyLandmarks?: string[];
    roadType?: string;
    publicTransportNearby?: boolean;
    h3Resolution?: number;
    h3Index?: string;
  } | {
    type: string;
    coordinates: [number, number];
    address?: string;
    country?: string;
    accuracyMeters?: number;
    altitude?: number;
    terrain?: string;
    landUse?: string;
    populationDensity?: number;
    nearbyLandmarks?: string[];
    roadType?: string;
    publicTransportNearby?: boolean;
    h3Resolution?: number;
    h3Index?: string;
  };
  linkPreview?: {
    url: string;
    title: string;
    description: string;
    image: string;
    domain: string;
  };
  isLiked: boolean;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  viewsCount: number;

  likesArray: {
    _id: string;
    type: 'user' | 'company' | string;
    image: string;
    username: string;
    user?: {
      _id: string;
      firstName: string;
      lastName: string;
    };
    company?: {
      _id: string;
      name: string;
      verified: boolean;
    };
  }[];

  createdAt: Date;
  updatedAt: Date;
}
