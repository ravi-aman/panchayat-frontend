import { Company } from './company';
// import { IPost } from './postTypes';

export interface User {
  firstName: string;
  lastName: string;
  email: string;
  photo?: string;
  role?: 'user' | 'admin' | 'company';
  gender: 'male' | 'female';
  dob: string;
  age?: number;
  _id?: string;
  phone: string;
  googleId?: string;
  profileIds?: string[] | Profile[];
  refreshToken?: string;
  accessToken?: string;
  createdAt?: string;
  updatedAt?: string;
  isVerified?: boolean;
  authMethod?: 'password' | 'google' | 'both';
  image?: string;
  userData?: any;
}

export interface Profile {
  _id: string;
  user?: User | Company | string; // user or company
  type: 'user' | 'company';
  username: string;
  bio?: string;
  image: string;
  followers: User[] | string[];
  following: User[] | string[];
  posts: IPost[] | string[];
  createdAt?: string;
  updatedAt?: string;
}
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
  likes: { _id: string }[];
  comments: Comment[];
  author: any;
  image?: Array<{ key: string; url: string }>;
  postType?: string;
  poll?: {
    question: string;
    options: Array<{
      text: string;
      votes: string[];
    }>;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  user: User;
  text: string;
}
export interface SuggestionUser {
  _id: string;
  firstName: string;
  lastName: string;
  //   username: string;
  photo: string;
  isFollower: boolean;
}
export const getUserFullName = (user: User | SuggestionUser): string => {
  if (!user) return 'Unknown User';
  const firstName = user.firstName || 'Unknown';
  const lastName = user.lastName || 'User';
  return `${firstName} ${lastName}`.trim();
};
