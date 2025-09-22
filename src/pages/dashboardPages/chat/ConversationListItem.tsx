import React, { memo, useState, useCallback } from 'react';
import type { Conversation, User, ChatMenuAction, Message } from '../../../types/ChatTypes';
import ChatMenu from './ChatMenu';
import chatApiService from '../../../services/ChatApiService';
import { shouldShowUnreadBadge, formatUnreadCount } from '../../../utils/unreadUtils';
import { useAuth } from '../../../contexts/AuthContext';
import {
  Pin,
  PinOff,
  Trash2,
  Image as ImageIcon,
  Video as VideoIcon,
  Paperclip,
} from 'lucide-react';

interface ConversationListItemProps {
  conversation: Conversation;
  selectedChat: string | null;
  onSelectChat: (chatId: string) => void;
  isUserOnline: (userId: string) => boolean;
  otherUser: User | null | undefined;
  onConversationUpdate?: () => void;
  messages?: Record<string, Message[]>;
}

const ConversationListItem: React.FC<ConversationListItemProps> = ({
  conversation,
  selectedChat,
  onSelectChat,
  isUserOnline,
  otherUser,
  onConversationUpdate,
  messages,
}) => {
  const [imageError, setImageError] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const { activeProfile } = useAuth();

  const handleImageError = () => {
    setImageError(true);
  };

  // Handle pin/unpin chat
  const handleTogglePin = useCallback(async () => {
    if (!activeProfile) return;

    try {
      await chatApiService.togglePinChat(conversation._id, activeProfile._id);
      onConversationUpdate?.();
    } catch (error) {
      console.error('Failed to toggle pin status:', error);
    }
  }, [conversation._id, activeProfile, onConversationUpdate]);

  // Handle clear chat
  const handleClearChat = useCallback(async () => {
    if (!activeProfile) return;

    const confirmClear = window.confirm(
      'Are you sure you want to clear this chat? This action cannot be undone.',
    );
    if (!confirmClear) return;

    try {
      await chatApiService.clearChat(conversation._id, activeProfile._id);
      onConversationUpdate?.();
    } catch (error) {
      console.error('Failed to clear chat:', error);
      alert('Failed to clear chat. Please try again.');
    }
  }, [conversation._id, activeProfile, onConversationUpdate]);

  // Chat menu actions
  const chatMenuActions: ChatMenuAction[] = [
    {
      id: 'pin',
      label: conversation.isPinned ? 'Unpin Chat' : 'Pin Chat',
      icon: conversation.isPinned ? <PinOff size={16} /> : <Pin size={16} />,
      action: handleTogglePin,
    },
    {
      id: 'clear',
      label: 'Clear Chat',
      icon: <Trash2 size={16} />,
      action: handleClearChat,
    },
  ];

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(!showMenu);
  };

  if (!otherUser) return null;

  return (
    <div
      key={conversation._id}
      className={`w-screen lg:w-[25vw] p-4 mb-2 cursor-pointer rounded-xl transition-all duration-200 relative ${
        selectedChat === conversation._id
          ? 'bg-blue-50 border-2 border-blue-200 shadow-md'
          : 'bg-white hover:bg-gray-50 hover:shadow-lg border border-gray-100 shadow-sm'
      }`}
      onClick={() => onSelectChat(conversation._id)}
    >
      <div className="flex items-center space-x-3">
        <div className="relative">
          {imageError ? (
            <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center text-xl font-bold">
              {otherUser.firstName?.charAt(0)?.toUpperCase() || '?'}
            </div>
          ) : (
            <img
              src={otherUser.photo || 'https://via.placeholder.com/40'}
              alt={`${otherUser.firstName} ${otherUser.lastName}`}
              className="w-10 h-10 rounded-full object-cover"
              onError={handleImageError}
            />
          )}
          {isUserOnline(otherUser._id) && (
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start mb-1">
            <div className="flex items-center space-x-2">
              {conversation.isPinned && <Pin size={12} className="text-blue-500" />}
              <h3
                className={`font-semibold text-sm truncate ${
                  shouldShowUnreadBadge(conversation.unreadCount || 0)
                    ? 'text-gray-900'
                    : 'text-gray-700'
                }`}
              >
                {otherUser.firstName || 'Unknown'} {otherUser.lastName || ''}
              </h3>
            </div>
            <div className="flex items-center space-x-2">
              {shouldShowUnreadBadge(conversation.unreadCount || 0) && (
                <span className="px-2 py-1 text-xs font-bold text-white bg-red-500 rounded-full min-w-[20px] text-center">
                  {formatUnreadCount(conversation.unreadCount || 0)}
                </span>
              )}
              <div className="relative">
                <button
                  onClick={handleMenuClick}
                  className="p-1 rounded-full hover:bg-gray-200 transition-colors duration-150 opacity-0 group-hover:opacity-100"
                >
                  <svg
                    className="w-4 h-4 text-gray-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zM12 13a1 1 0 110-2 1 1 0 010 2zM12 20a1 1 0 110-2 1 1 0 010 2z"
                    />
                  </svg>
                </button>
                <ChatMenu
                  isOpen={showMenu}
                  onClose={() => setShowMenu(false)}
                  actions={chatMenuActions}
                  position="bottom-right"
                />
              </div>
            </div>
          </div>
          <p
            className={`text-sm truncate leading-tight flex items-center gap-1 ${
              shouldShowUnreadBadge(conversation.unreadCount || 0)
                ? 'text-gray-600 font-medium'
                : 'text-gray-500'
            }`}
          >
            {(() => {
              // Show a friendly preview for attachments or text for last message (object or string)
              const renderIconLabel = (icon: React.ReactNode, label: string) => (
                <>
                  <span className="inline-flex items-center mr-1 align-middle">{icon}</span>
                  {label}
                </>
              );
              // Use only the latest pending message if any (status: 'sending'), otherwise show last confirmed
              if (
                typeof conversation._id === 'string' &&
                typeof messages === 'object' &&
                messages
              ) {
                const chatMsgs = messages[conversation._id];
                if (chatMsgs && chatMsgs.length > 0) {
                  // Find the latest pending message (status: 'sending')
                  const pendingMsg = [...chatMsgs].reverse().find((m) => m.status === 'sending');
                  const lastMsg = chatMsgs[chatMsgs.length - 1];
                  const showMsg = pendingMsg || lastMsg;
                  if (showMsg.attachments && showMsg.attachments.length > 0) {
                    const first = showMsg.attachments[0];
                    if (first.type.startsWith('image/'))
                      return renderIconLabel(
                        <ImageIcon size={18} className="text-blue-500" />,
                        'Photo' + (showMsg.status === 'sending' ? ' • sending...' : ''),
                      );
                    if (first.type.startsWith('video/'))
                      return renderIconLabel(
                        <VideoIcon size={18} className="text-purple-500" />,
                        'Video' + (showMsg.status === 'sending' ? ' • sending...' : ''),
                      );
                    return renderIconLabel(
                      <Paperclip size={18} className="text-gray-500" />,
                      'Attachment' + (showMsg.status === 'sending' ? ' • sending...' : ''),
                    );
                  }
                  if (showMsg.content && showMsg.content.trim()) {
                    return showMsg.content + (showMsg.status === 'sending' ? ' • sending...' : '');
                  }
                }
              }
              // Support lastMessage as object (Message) or string
              const msg = conversation.lastMessage;
              if (!msg || (typeof msg === 'string' && msg === 'No messages yet')) {
                return 'No messages yet';
              }
              if (typeof msg === 'object' && msg !== null) {
                const messageObj = msg as Message;
                if (Array.isArray(messageObj.attachments) && messageObj.attachments.length > 0) {
                  const first = messageObj.attachments[0];
                  if (first.type.startsWith('image/'))
                    return renderIconLabel(
                      <ImageIcon size={18} className="text-blue-500" />,
                      'Photo',
                    );
                  if (first.type.startsWith('video/'))
                    return renderIconLabel(
                      <VideoIcon size={18} className="text-purple-500" />,
                      'Video',
                    );
                  return renderIconLabel(
                    <Paperclip size={18} className="text-gray-500" />,
                    'Attachment',
                  );
                }
                if (typeof messageObj.content === 'string' && messageObj.content.trim()) {
                  return messageObj.content;
                }
                return 'No messages yet';
              }
              // If lastMessage is a known attachment preview, show a friendly label
              if (typeof msg === 'string') {
                if (msg.startsWith('🖼️'))
                  return renderIconLabel(
                    <ImageIcon size={18} className="text-blue-500" />,
                    'Photo',
                  );
                if (msg.startsWith('🎥'))
                  return renderIconLabel(
                    <VideoIcon size={18} className="text-purple-500" />,
                    'Video',
                  );
                if (msg.startsWith('📎'))
                  return renderIconLabel(
                    <Paperclip size={18} className="text-gray-500" />,
                    'Attachment',
                  );
                return msg;
              }
            })()}
          </p>
        </div>
      </div>
    </div>
  );
};

export default memo(ConversationListItem);
