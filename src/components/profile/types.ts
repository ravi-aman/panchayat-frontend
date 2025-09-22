import { Post, User } from '../../types/types';

export interface NetworkSuggestion {
  email: string;
  firstName: string;
  lastName: string;
  photo: string;
  _id: string;
  profileIds: [
    {
      _id: string;
      username: string;
    },
  ];
}

export interface ExtendedPost extends Post {
  hasIcon?: boolean;
  author: User & {
    name?: string; // For company posts
    logo?: string; // For company logos
  };
}

export interface ProfileResponse {
  status: string;
  profile: {
    id: string;
    username: string;
    bio: string;
    image: string;
    type: string;
    user: {
      _id: string;
      firstName?: string;
      lastName?: string;
      email: string;
      photo?: string;
      role?: string;
      createdAt: string;
      // Company-specific fields
      name?: string;
      city?: string;
      companySize?: string;
      industry?: string;
      logo?: string;
      phone?: string;
      type?: string;
      verified?: boolean;
      website?: string;
      socialLinks?: string[];
    };
    followers: any[];
    following: any[];
    posts: Post[];
    stats: {
      followersCount: number;
      followingCount: number;
      postsCount: number;
    };
    createdAt: string;
    updatedAt: string;
  };
}
