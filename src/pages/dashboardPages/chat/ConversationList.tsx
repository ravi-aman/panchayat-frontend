import React, { useCallback } from 'react';
import { Conversation, User, Message } from '../../../types/ChatTypes';
import ConversationListItem from './ConversationListItem';
import { Profile } from '../../../types/types';

interface ConversationListProps {
  conversations: Conversation[];
  selectedChat: string | null;
  onSelectChat: (chatId: string) => void;
  onlineUsers: string[];
  currentUser: User | null;
  onNewChat: () => void;
  loading: boolean;
  activeProfile?: Profile | null;
  onConversationUpdate?: () => void;
  messages?: Record<string, Message[]>;
}

const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  selectedChat,
  onSelectChat,
  onlineUsers,
  currentUser,
  onNewChat,
  loading,
  activeProfile,
  onConversationUpdate,
  messages,
}) => {
  const getOtherParticipant = useCallback(
    (conversation: Conversation) => {
      if (!activeProfile || !conversation.participants) return null;

      // For user profiles, exclude the user ID; for company profiles, exclude the profile ID
      const currentId =
        activeProfile.type === 'user' ? activeProfile.user || currentUser?._id : activeProfile._id;
      const otherParticipant = conversation.participants.find((p) => p._id !== currentId);

      // Ensure participant has required fields
      if (otherParticipant && !otherParticipant.firstName) {
        return {
          ...otherParticipant,
          firstName: otherParticipant.firstName || 'Unknown User',
          lastName: otherParticipant.lastName || '',
        };
      }

      return otherParticipant;
    },
    [activeProfile, currentUser],
  );

  const isUserOnline = useCallback(
    (userId: string) => {
      return onlineUsers.includes(userId);
    },
    [onlineUsers],
  );

  // Sort conversations: pinned first, then by last message time
  const sortedConversations = useCallback(() => {
    if (!Array.isArray(conversations)) return [];
    return [...conversations].sort((a, b) => {
      // First, sort by pinned status
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;

      // Then by last message time (most recent first)
      const aTime = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;
      const bTime = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;
      return bTime - aTime;
    });
  }, [conversations]);

  return (
    <div className="lg:w-[25vw] w-screen overflow-y-auto scrollbar-hide rounded-lg pt-14">
      <div className="p-4 rounded-lg border-b border-gray-200 bg-white w-screen lg:w-[25vw] h-18 fixed top-14 lg:top-22">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Messages</h2>
          <button
            onClick={onNewChat}
            className="bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 transition"
          >
            New Chat
          </button>
        </div>
      </div>
      {loading ? (
        <div className="flex justify-center items-center h-25">
          <div className="animate-spin rounded-full h-8 w-8 border-blue-600"></div>
        </div>
      ) : !Array.isArray(conversations) || conversations.length === 0 ? (
        <div className="p-4 flex items-center justify-center text-center h-[40vh] text-gray-500 ">
          No conversations yet. Start a new chat!
        </div>
      ) : (
        <div className="space-y-2 fixed mt-5 overflow-auto scrollbar-hide group h-screen">
          {sortedConversations().map((conversation) => {
            const otherUser = getOtherParticipant(conversation);
            if (!otherUser) return null;

            return (
              <ConversationListItem
                key={conversation._id}
                conversation={conversation}
                selectedChat={selectedChat}
                onSelectChat={onSelectChat}
                isUserOnline={isUserOnline}
                otherUser={otherUser}
                onConversationUpdate={onConversationUpdate}
                messages={messages}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ConversationList;
