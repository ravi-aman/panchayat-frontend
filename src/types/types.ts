import { Company } from './company';

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
  posts: Post[] | string[];
  createdAt?: string;
  updatedAt?: string;
}
export interface Post {
  _id: string;
  content: string;
  likes: { _id: string }[];
  comments: Comment[];
  author: User;
  image?: { key: string; url: string };
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
  return `${user.firstName} ${user.lastName}`;
};
