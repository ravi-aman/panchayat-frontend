import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Message,
  User,
  Conversation,
  ChatMenuAction,
  FileAttachment,
} from '../../../types/ChatTypes';
import ChatMessage from './ChatMessage';
import TypingIndicator from '../../../components/common/TypingIndicator';
import chatSocketService from '../../../services/ChatSocketService';
import chatApiService from '../../../services/ChatApiService';
import ChatMenu from './ChatMenu';
import FileAttachmentMenu from './FileAttachmentMenu';
import * as fileUploadUtils from '../../../utils/fileUpload.utils';
import { useAuth } from '../../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Pin, PinOff, Trash2, Paperclip, Smile } from 'lucide-react';
import EmojiPicker from './EmojiPicker';

interface ChatWindowProps {
  selectedChat: string | null;
  messages: Record<string, Message[]>;
  setMessages: React.Dispatch<React.SetStateAction<Record<string, Message[]>>>;
  isTyping: boolean;
  currentUser: User | null;
  conversations: Conversation[];
  onlineUsers: string[];
  setConversations: React.Dispatch<React.SetStateAction<Conversation[]>>;
  onBack?: () => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({
  selectedChat,
  messages,
  setMessages,
  isTyping,
  currentUser,
  conversations,
  onlineUsers,
  setConversations,
  onBack,
}) => {
  const [messageInput, setMessageInput] = useState('');
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [showChatMenu, setShowChatMenu] = useState(false);
  const [showFileMenu, setShowFileMenu] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<File[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isPinned, setIsPinned] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { activeProfile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedChat) {
        if (onBack) {
          onBack();
        } else {
          navigate('/dashboard/chat');
        }
      }
    };

    document.addEventListener('keydown', handleEscapeKey);
    return () => document.removeEventListener('keydown', handleEscapeKey);
  }, [selectedChat, onBack, navigate]);

  const currentConversation = Array.isArray(conversations)
    ? conversations.find((c) => c._id === selectedChat)
    : undefined;
  const otherParticipant = currentConversation?.participants.find((p) => {
    // For user profiles, exclude the user ID; for company profiles, exclude the profile ID
    const currentId =
      activeProfile?.type === 'user' ? activeProfile.user || currentUser?._id : activeProfile?._id;
    return p._id !== currentId;
  }) || {
    _id: 'unknown',
    firstName: 'Unknown User',
    lastName: '',
    email: '',
    photo: '',
  };

  // Update pinned status when conversation changes
  useEffect(() => {
    if (currentConversation) {
      setIsPinned(currentConversation.isPinned || false);
    }
  }, [currentConversation]);

  const isUserOnline = (userId: string) => onlineUsers.includes(userId);
  const isOtherUserOnline = isUserOnline(otherParticipant._id);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, selectedChat]);

  // Handle scroll to load more messages
  const handleScroll = useCallback(async () => {
    const container = messagesContainerRef.current;
    if (!container || !selectedChat || !activeProfile || loadingMore || !hasMore) return;

    if (container.scrollTop === 0) {
      setLoadingMore(true);
      try {
        const olderMessages = await chatApiService.getConversationMessages(
          selectedChat,
          activeProfile._id,
          page + 1,
          20,
        );

        if (olderMessages.length < 20) {
          setHasMore(false);
        }

        if (olderMessages.length > 0) {
          setMessages((prev) => ({
            ...prev,
            [selectedChat]: [...olderMessages, ...(prev[selectedChat] || [])],
          }));
          setPage((prev) => prev + 1);
        }
      } catch (error) {
        console.error('Failed to load more messages:', error);
      } finally {
        setLoadingMore(false);
      }
    }
  }, [selectedChat, activeProfile, loadingMore, hasMore, page]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  // Reset pagination when chat changes
  useEffect(() => {
    setPage(1);
    setHasMore(true);
    setLoadingMore(false);
  }, [selectedChat]);

  // Set up socket listeners for message status updates and mark messages as read
  useEffect(() => {
    const socket = chatSocketService.getSocket();
    if (!socket || !selectedChat || !activeProfile) return;

    const handleMessageDelivered = (data: {
      chatId: string;
      messageId: string;
      status: string;
    }) => {
      if (data.chatId === selectedChat) {
        setMessages((prev) => ({
          ...prev,
          [selectedChat]:
            prev[selectedChat]?.map((msg) =>
              msg.id === data.messageId ? { ...msg, status: 'delivered' as const } : msg,
            ) || [],
        }));
      }
    };

    const handleMessageRead = (data: {
      chatId: string;
      messageId?: string;
      messageIds?: string[];
      status: string;
    }) => {
      if (data.chatId === selectedChat) {
        setMessages((prev) => ({
          ...prev,
          [selectedChat]:
            prev[selectedChat]?.map((msg) => {
              const shouldUpdate =
                data.messageId === msg.id ||
                (data.messageIds && data.messageIds.includes(msg.id || ''));
              return shouldUpdate ? { ...msg, status: 'read' as const } : msg;
            }) || [],
        }));
      }
    };

    socket.on('message_delivered', handleMessageDelivered);
    socket.on('message_read', handleMessageRead);

    return () => {
      socket.off('message_delivered', handleMessageDelivered);
      socket.off('message_read', handleMessageRead);
    };
  }, [selectedChat, setMessages, activeProfile]);

  // Separate effect to mark messages as delivered and read when chat becomes active
  useEffect(() => {
    if (!selectedChat || !activeProfile) return;

    const markMessagesAsReadAndDelivered = async () => {
      try {
        // Mark messages as read in backend
        await chatApiService.markMessagesAsRead(selectedChat, activeProfile._id);

        // Mark via socket for real-time status updates
        if (messages[selectedChat]) {
          messages[selectedChat].forEach((msg) => {
            if (msg.type === 'received') {
              // Mark as delivered first (if not already)
              if (msg.status === 'sent') {
                chatSocketService.markMessageDelivered(
                  selectedChat,
                  msg.id || '',
                  activeProfile._id,
                );
              }
              // Then mark as read
              chatSocketService.markMessageRead(selectedChat, msg.id || '', activeProfile._id);
            }
          });
        }
      } catch (error) {
        console.error('Failed to mark messages as read:', error);
      }
    };

    // Small delay to ensure messages are loaded
    const timer = setTimeout(markMessagesAsReadAndDelivered, 500);
    return () => clearTimeout(timer);
  }, [selectedChat, activeProfile, selectedChat ? messages[selectedChat] : null]);

  const handleSendMessage = useCallback(
    async (attachments?: FileAttachment[]) => {
      // Check if we have either a non-empty message or attachments, and required data
      if (
        (!messageInput.trim() && !attachments?.length) ||
        !selectedChat ||
        !currentUser ||
        !otherParticipant
      )
        return;

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        chatSocketService.sendStopTypingIndicator(
          selectedChat,
          activeProfile?._id || currentUser._id,
        );
      }

      const messageText = messageInput;
      const messageContent = messageText.trim() || (attachments?.length ? '' : ' '); // Consistent content handling
      const replyMessage = replyTo ? replyTo : undefined;
      const senderId = activeProfile?._id || currentUser._id;
      const senderIdString =
        typeof senderId === 'string' ? senderId : String(senderId || currentUser._id);

      setMessageInput('');

      const tempId = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const newMessage: Message = {
        id: tempId,
        sender: senderIdString,
        content: messageContent,
        text: messageContent,
        type: 'sent',
        status: 'sending',
        timestamp: new Date(),
        replyTo: replyMessage,
        attachments: attachments || [],
        senderProfile: activeProfile || undefined,
      };

      // Add message to current chat immediately
      setMessages((prev) => ({
        ...prev,
        [selectedChat]: [...(prev[selectedChat] || []), newMessage],
      }));

      // --- Optimistically update conversation preview ---
      setConversations((prevConversations) => {
        const idx = prevConversations.findIndex((c) => c._id === selectedChat);
        if (idx === -1) return prevConversations;
        const updated = [...prevConversations];
        let preview = '';
        if (attachments && attachments.length > 0) {
          const first = attachments[0];
          if (first.type.startsWith('image/')) preview = '🖼️ Photo';
          else if (first.type.startsWith('video/')) preview = '🎥 Video';
          else preview = '📎 Attachment';
        } else {
          preview = messageContent;
        }
        updated[idx] = {
          ...updated[idx],
          lastMessage: preview + ' • sending...',
          lastMessageTime: new Date(),
        };
        return updated;
      });

      try {
        // Send via socket only (socket handler will persist to database)
        chatSocketService.sendMessage(
          selectedChat,
          senderIdString,
          otherParticipant._id,
          messageContent,
          replyMessage,
          {
            _id: senderIdString,
            type: activeProfile?.type || 'user',
            username: activeProfile?.username || `${currentUser.firstName} ${currentUser.lastName}`,
            image: activeProfile?.image || currentUser.photo,
          },
          activeProfile?.type || 'user',
          attachments || [],
        );

        // Update status to sent after socket send
        setMessages((prev) => ({
          ...prev,
          [selectedChat]:
            prev[selectedChat]?.map((msg) =>
              msg.id === tempId ? { ...msg, status: 'sent' } : msg,
            ) || [],
        }));
      } catch (error) {
        console.error('Failed to send message:', error);
        // Update message status to indicate error
        setMessages((prev) => ({
          ...prev,
          [selectedChat]:
            prev[selectedChat]?.map((msg) =>
              msg.id === tempId ? { ...msg, status: 'error' as const } : msg,
            ) || [],
        }));
      }

      setReplyTo(null);

      // Note: No separate API call to persistMessage - socket handler saves to DB
    },
    [messageInput, selectedChat, currentUser, otherParticipant, replyTo, activeProfile],
  );

  const handleFileSelect = useCallback(
    async (files: FileList) => {
      const fileArray = Array.from(files);
      setUploadingFiles(fileArray);
      try {
        // Use the new fileUpload.utils for uploading
        const uploadResults = await fileUploadUtils.uploadFiles(fileArray, 'chat-attachments');
        const attachments: FileAttachment[] = uploadResults.map((result, index) => ({
          id: `${Date.now()}-${index}`,
          name: result.filename,
          url: result.url,
          type: result.mimeType,
          size: result.size,
          uploadedAt: new Date(),
        }));
        await handleSendMessage(attachments);
      } catch (error) {
        console.error('File upload failed:', error);
        alert('File upload failed. Please try again.');
      } finally {
        setUploadingFiles([]);
      }
    },
    [handleSendMessage],
  );

  const handleReply = useCallback((message: Message) => {
    setReplyTo(message);
  }, []);

  const handleTyping = useCallback(() => {
    if (!selectedChat || !activeProfile) return;

    chatSocketService.sendTypingIndicator(selectedChat, activeProfile._id);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      chatSocketService.sendStopTypingIndicator(selectedChat, activeProfile._id);
    }, 3000);
  }, [selectedChat, activeProfile]);

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
      }
    },
    [handleSendMessage],
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setMessageInput(e.target.value);
      handleTyping();

      // Auto-resize textarea
      e.target.style.height = 'auto';
      e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
    },
    [handleTyping],
  );

  // Insert emoji at cursor position (for emoji-picker-react)
  const handleEmojiSelect = (emoji: { emoji: string }) => {
    if (!textareaRef.current) return;
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const emojiChar = emoji.emoji;
    const newValue = messageInput.substring(0, start) + emojiChar + messageInput.substring(end);
    setMessageInput(newValue);
    setShowEmojiPicker(false);
    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = start + emojiChar.length;
    }, 0);
  };

  const [windowWidth, setWindowWidth] = useState<number>(window.innerWidth);
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const isMobileOrTablet = windowWidth < 1024;

  const [imageError, setImageError] = useState(false);

  const handleImageError = () => {
    setImageError(true);
  };

  // Handle pin/unpin chat
  const handleTogglePin = useCallback(async () => {
    if (!selectedChat || !activeProfile) return;

    try {
      const result = await chatApiService.togglePinChat(selectedChat, activeProfile._id);
      setIsPinned(result.isPinned);

      // Update the conversation in the parent component
      setConversations((prev) =>
        prev.map((c) => (c._id === selectedChat ? { ...c, isPinned: result.isPinned } : c)),
      );
    } catch (error) {
      console.error('Failed to toggle pin status:', error);
    }
  }, [selectedChat, activeProfile, setConversations]);

  // Handle clear chat
  const handleClearChat = useCallback(async () => {
    if (!selectedChat || !activeProfile) return;

    const confirmClear = window.confirm(
      'Are you sure you want to clear this chat? This action cannot be undone.',
    );
    if (!confirmClear) return;

    try {
      await chatApiService.clearChat(selectedChat, activeProfile._id);

      // Clear messages from local state
      setMessages((prev) => ({
        ...prev,
        [selectedChat]: [],
      }));

      // Show success message
      alert('Chat cleared successfully');
    } catch (error) {
      console.error('Failed to clear chat:', error);
      alert('Failed to clear chat. Please try again.');
    }
  }, [selectedChat, activeProfile, setMessages]);

  // Chat menu actions
  const chatMenuActions: ChatMenuAction[] = [
    {
      id: 'pin',
      label: isPinned ? 'Unpin Chat' : 'Pin Chat',
      icon: isPinned ? <PinOff size={16} /> : <Pin size={16} />,
      action: handleTogglePin,
    },
    {
      id: 'clear',
      label: 'Clear Chat',
      icon: <Trash2 size={16} />,
      action: handleClearChat,
    },
  ];

  if (!selectedChat) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 w-[56vw] h-full scrollbar-hide">
        <p className="text-gray-500">Select a conversation or start a new one</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-screen lg:h-[42vw] overflow-x-hidden rounded-lg scrollbar-hide">
      <div className="p-4 border-b border-gray-100 bg-white fixed w-full lg:w-[56vw] flex items-center z-10 shadow-sm rounded-lg">
        {isMobileOrTablet && (
          <button
            className="mr-4 p-2 rounded-full bg-blue-50 hover:bg-blue-100 focus:outline-none transition-colors duration-200"
            onClick={onBack ? onBack : undefined}
            aria-label="Back to conversation list"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-blue-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
        )}
        <div className="relative">
          {imageError ? (
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center text-lg font-bold shadow-md">
              {otherParticipant?.firstName?.charAt(0)?.toUpperCase() || '?'}
            </div>
          ) : (
            <img
              src={otherParticipant?.photo || 'https://via.placeholder.com/48'}
              alt={
                otherParticipant
                  ? `${otherParticipant.firstName} ${otherParticipant.lastName}`
                  : 'User'
              }
              className="w-12 h-12 rounded-full object-cover border-2 border-gray-100 shadow-sm"
              onError={handleImageError}
            />
          )}
          {isOtherUserOnline && (
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white shadow-sm"></span>
          )}
        </div>
        <div className="ml-4 flex-1">
          <h3 className="font-semibold text-gray-900 text-lg">
            {otherParticipant
              ? `${otherParticipant.firstName} ${otherParticipant.lastName}`
              : 'User'}
          </h3>
          <p
            className={`text-sm font-medium ${
              isOtherUserOnline ? 'text-green-600' : 'text-gray-500'
            }`}
          >
            {isOtherUserOnline ? 'Online' : 'Offline'}
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button className="p-2 rounded-full hover:bg-gray-100 transition-colors duration-200">
            <svg
              className="w-5 h-5 text-gray-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
              />
            </svg>
          </button>
          <div className="relative">
            <button
              className="p-2 rounded-full hover:bg-gray-100 transition-colors duration-200"
              onClick={() => setShowChatMenu(!showChatMenu)}
            >
              <svg
                className="w-5 h-5 text-gray-600"
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
              isOpen={showChatMenu}
              onClose={() => setShowChatMenu(false)}
              actions={chatMenuActions}
              position="bottom-right"
            />
          </div>
        </div>
      </div>

      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 bg-white w-screen lg:w-[56vw] scrollbar-hide lg:pb-20 mt-43 lg:mt-22 rounded-lg"
      >
        {loadingMore && (
          <div className="flex justify-center py-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>
        )}
        {selectedChat &&
          messages[selectedChat]?.map((message) => {
            const messageSenderId =
              typeof message.sender === 'object' && message.sender
                ? (message.sender as any)._id
                : message.sender;
            const currentProfileId = activeProfile?._id || currentUser?._id;
            const isCurrentUser = messageSenderId === currentProfileId || message.type === 'sent';

            return (
              <ChatMessage
                key={message.id || `msg-${Date.now()}-${Math.random()}`}
                message={message}
                isCurrentUser={isCurrentUser}
                onReply={handleReply}
              />
            );
          })}
        {isTyping && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-gray-100 bg-white fixed bottom-16 lg:bottom-2 w-full lg:w-[56vw] shadow-lg">
        {replyTo && (
          <div className="flex items-center bg-white border-l-4 border-blue-500 rounded-md shadow p-2 mb-2 w-full">
            <div className="flex-1">
              <div className="text-xs text-blue-600 font-semibold mb-1">
                {replyTo.sender === currentUser?._id ? 'You' : 'Other'}
              </div>
              <div className="text-sm text-gray-800 truncate">
                {(() => {
                  const replyText = replyTo?.content ?? replyTo?.text ?? '';
                  return replyText.length > 120 ? replyText.slice(0, 120) + '...' : replyText;
                })()}
              </div>
            </div>
            <button
              className="ml-2 text-gray-400 hover:text-blue-600 focus:outline-none"
              onClick={() => setReplyTo(null)}
              aria-label="Cancel reply"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
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
        )}
        <div className="flex items-center space-x-3">
          <div className="flex-1 relative">
            <div className="relative">
              <textarea
                ref={textareaRef}
                value={messageInput}
                onChange={handleInputChange}
                onKeyDown={handleKeyPress}
                placeholder={
                  replyTo ? `Replying to: ${replyTo.content || replyTo.text}` : 'Type a message...'
                }
                className="w-full border border-gray-200 rounded-2xl px-4 py-3 pr-20 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none scrollbar-hide h-[48px] max-h-[120px] bg-gray-50 hover:bg-white transition-colors duration-200"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                rows={1}
              />
              {showEmojiPicker && (
                <EmojiPicker
                  onSelect={handleEmojiSelect}
                  onClose={() => setShowEmojiPicker(false)}
                />
              )}
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
                <div className="relative">
                  <button
                    className="p-2 rounded-full hover:bg-gray-100 transition-colors duration-200"
                    onClick={() => setShowFileMenu(!showFileMenu)}
                  >
                    <Paperclip className="w-5 h-5 text-gray-500" />
                  </button>
                  <FileAttachmentMenu
                    isOpen={showFileMenu}
                    onClose={() => setShowFileMenu(false)}
                    onFileSelect={handleFileSelect}
                  />
                </div>
                <button
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors duration-200"
                  type="button"
                  onClick={() => setShowEmojiPicker((v) => !v)}
                  aria-label="Add emoji"
                >
                  <Smile className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>
          </div>

          <button
            onClick={() => handleSendMessage()}
            disabled={!messageInput.trim() && uploadingFiles.length === 0}
            className={`p-3 rounded-full transition-all duration-200 ${
              messageInput.trim() || uploadingFiles.length > 0
                ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-md hover:shadow-lg scale-100'
                : 'bg-gray-200 text-gray-400 scale-95'
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
            </svg>
          </button>
        </div>

        {/* File upload progress */}
        {uploadingFiles.length > 0 && (
          <div className="px-4 py-2 bg-blue-50 border-t border-blue-100">
            <div className="text-sm text-blue-600">
              Uploading {uploadingFiles.length} file{uploadingFiles.length > 1 ? 's' : ''}...
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatWindow;
