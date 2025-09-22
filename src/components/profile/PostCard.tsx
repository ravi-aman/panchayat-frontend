import React from 'react';
import { MessageSquare, ThumbsUp, Share2, Send, Bookmark, MoreHorizontal } from 'lucide-react';
import heart from '../../../public/heart.jpg';
import { ExtendedPost, ProfileResponse } from './types';

interface PostCardProps {
  post: ExtendedPost;
  profileData: ProfileResponse['profile'] | null;
}

export const PostCard: React.FC<PostCardProps> = ({ post, profileData }) => {
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return '1 day ago';
    if (diffDays < 30) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm">
      <div className="flex items-start space-x-3">
        <div className="w-12 h-12 overflow-hidden bg-gray-300 rounded-full">
          <img
            src={
              post.author.photo ||
              post.author.logo ||
              profileData?.image ||
              profileData?.user.photo ||
              profileData?.user.logo ||
              `${import.meta.env.VITE_DEFAULT_PICTURE}`
            }
            alt="user"
            className="object-cover w-full h-full"
          />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900">
                {post.author.firstName && post.author.lastName
                  ? `${post.author.firstName} ${post.author.lastName}`.trim()
                  : post.author.name || 'User Name'}
              </h3>
              <p className="text-sm text-gray-500">{formatTimeAgo(post.createdAt)}</p>
            </div>
            <button className="text-black cursor-pointer hover:text-gray-600">
              <MoreHorizontal className="w-8 h-8" />
            </button>
          </div>
          <div className="mt-3">
            {post.hasIcon && (
              <div className="flex flex-col w-20 h-20 mb-4 ml-16 bg-gray-100 rounded-full">
                <img src={heart} alt="Heart" className="h-[80px]" />
              </div>
            )}
            <p className="text-gray-700 whitespace-pre-line">{post.content}</p>
            {post.image && (
              <div className="mt-3">
                <img src={post.image.url} alt="Post" className="w-full rounded-lg" />
              </div>
            )}
          </div>
          <div className="flex items-center justify-between pt-4 mt-4 border-t">
            <div className="flex items-center space-x-6">
              <button className="flex items-center space-x-2 text-blue-600 transition-colors cursor-pointer">
                <ThumbsUp className="w-5 h-5" />
                <span className="text-sm">{post.likes.length}</span>
              </button>
              <button className="flex items-center space-x-2 text-blue-600 transition-colors cursor-pointer">
                <Bookmark className="w-5 h-5" />
              </button>
              <button className="flex items-center space-x-2 text-blue-600 transition-colors cursor-pointer">
                <MessageSquare className="w-5 h-5" />
                <span className="text-sm">{post.comments.length}</span>
              </button>
              <button className="flex items-center space-x-2 text-blue-600 transition-colors cursor-pointer">
                <Share2 className="w-5 h-5" />
                <span className="text-sm">0</span>
              </button>
            </div>
            <button className="text-gray-400 cursor-pointer hover:text-gray-600">
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
