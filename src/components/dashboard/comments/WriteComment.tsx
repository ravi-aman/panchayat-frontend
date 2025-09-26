import React, { useState } from 'react';
import { FaPaperPlane } from 'react-icons/fa6';
import { useAuth } from '../../../contexts/AuthContext';
import { User } from '../../../types/types';
import { Company } from '../../../types/company';

interface WriteCommentProps {
  postId: string;
  parentId?: string;
  placeholder?: string;
  onCommentSubmit: (content: string, parentId?: string) => Promise<void>;
  onCancel?: () => void;
  autoFocus?: boolean;
  showCancel?: boolean;
}

const WriteComment: React.FC<WriteCommentProps> = ({
  parentId,
  placeholder = 'Write a comment...',
  onCommentSubmit,
  onCancel,
  autoFocus = false,
  showCancel = false,
}) => {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { activeProfile } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) return;

    if (!activeProfile?._id) {
      // Handle unauthenticated user
      return;
    }

    try {
      setIsSubmitting(true);
      await onCommentSubmit(content.trim(), parentId);
      setContent(''); // Clear input after successful submission
    } catch (error) {
      console.error('Error submitting comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Helper function to get author display name
  const getAuthorName = (): string => {
    if (!activeProfile) return '';
    if (
      activeProfile.type === 'user' &&
      typeof activeProfile.user === 'object' &&
      activeProfile.user &&
      'firstName' in activeProfile.user
    ) {
      const user = activeProfile.user as User;
      return `${user.firstName} ${user.lastName}`;
    }
    if (
      activeProfile.type === 'company' &&
      typeof activeProfile.user === 'object' &&
      activeProfile.user &&
      'name' in activeProfile.user
    ) {
      const company = activeProfile.user as Company;
      return company.name;
    }
    return activeProfile.username;
  };

  // Helper function to get author image
  const getAuthorImage = () => {
    if (!activeProfile) return '';
    return activeProfile.image || '';
  };

  if (!activeProfile) {
    return (
      <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-600">Please log in to comment</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-start space-x-3">
      <img
        src={getAuthorImage()}
        alt={getAuthorName() || 'User avatar'}
        className="w-8 h-8 rounded-full flex-shrink-0"
      />
      <div className="flex-grow">
        <div className="relative">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            autoFocus={autoFocus}
            disabled={isSubmitting}
            className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            rows={parentId ? 2 : 3}
          />
          <div className="flex justify-between items-center mt-2">
            <div className="flex space-x-2">
              {showCancel && onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  disabled={isSubmitting}
                  className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 disabled:opacity-50"
                >
                  Cancel
                </button>
              )}
            </div>
            <button
              type="submit"
              disabled={!content.trim() || isSubmitting}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm transition-colors"
            >
              {isSubmitting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              ) : (
                <FaPaperPlane className="w-3 h-3" />
              )}
              <span>{isSubmitting ? 'Commenting...' : 'Comment'}</span>
            </button>
          </div>
        </div>
      </div>
    </form>
  );
};

export default WriteComment;
