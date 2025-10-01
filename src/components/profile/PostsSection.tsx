import React from 'react';
import { MessageSquare } from 'lucide-react';
import { ExtendedPost, ProfileResponse } from './types';

interface PostsSectionProps {
  posts: ExtendedPost[];
  profileData: ProfileResponse['profile'] | null;
}

export const PostsSection: React.FC<PostsSectionProps> = ({ posts }) => {
  if (posts.length === 0) {
    return (
      <div className="p-12 text-center bg-white rounded-lg shadow-sm">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
            <MessageSquare className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900">No posts yet</h3>
          <p className="text-gray-500 max-w-sm">
            Start sharing your thoughts and connect with the community!
          </p>
          <button className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
            Create your first post
          </button>
        </div>
      </div>
    );
  }
};
