import React, { useState, useEffect } from 'react';
import type { User } from '../../../types/ChatTypes';
import { motion, AnimatePresence } from 'framer-motion';
import chatApiService from '../../../services/ChatApiService';
import { Profile } from '../../../types/types';

interface NewConversationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectUser: (userId: string) => void;
  currentUser: User | null;
  activeProfile?: Profile | null;
}

const NewConversationDialog: React.FC<NewConversationDialogProps> = ({
  isOpen,
  onClose,
  onSelectUser,
  activeProfile,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  // Search users when dialog opens or search query changes
  useEffect(() => {
    if (!isOpen || !activeProfile) return;

    const searchUsers = async () => {
      setLoading(true);
      try {
        const results = await chatApiService.searchUsers(
          searchQuery,
          activeProfile._id,
          activeProfile.type,
        );
        setUsers(results);
      } finally {
        setLoading(false);
      }
    };

    searchUsers();
  }, [isOpen, searchQuery, activeProfile]);

  // Handle user selection
  const handleSelectUser = (userId: string) => {
    if (!userId) {
      console.error('No user ID selected');
      return;
    }

    console.log('Selected user ID for conversation:', userId);
    onSelectUser(userId);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black/30 bg-opacity-50 backdrop-blur-lg flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white rounded-lg shadow-xl w-full max-w-md"
          >
            <div className="p-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">New Conversation</h2>
                <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-4">
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <div className="max-h-80 overflow-y-auto scrollbar-hide">
                {loading ? (
                  <div className="flex justify-center items-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : users.length === 0 ? (
                  <div className="text-center text-gray-500 py-4">No users found</div>
                ) : (
                  users.map((user) => (
                    <div
                      key={user._id}
                      className="p-3 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition flex items-center"
                      onClick={() => handleSelectUser(user._id)}
                    >
                      <img
                        src={user.photo || 'https://via.placeholder.com/40'}
                        alt={`${user.firstName} ${user.lastName}`}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div className="ml-3">
                        <h3 className="font-medium">
                          {user.firstName} {user.lastName}
                        </h3>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default NewConversationDialog;
