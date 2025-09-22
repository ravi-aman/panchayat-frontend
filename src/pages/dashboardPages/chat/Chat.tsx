import React, { useState, useEffect, useRef, useCallback } from 'react';
import { User, Conversation, Message } from '../../../types/ChatTypes';
import ConversationList from './ConversationList';
import ChatWindow from './ChatWindow';
import NewConversationDialog from './NewConversationDialog';
import chatSocketService from '../../../services/ChatSocketService';
import chatApiService from '../../../services/ChatApiService';
import { Socket } from 'socket.io-client';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useUnreadMessage } from '../../../contexts/UnreadMessageContext';
import { useAuth } from '../../../contexts/AuthContext';

const Chat: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const { activeProfile } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [isTyping, setIsTyping] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewChat, setShowNewChat] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const socketRef = useRef<Socket | null>(null);
  const { setTotalUnreadCount } = useUnreadMessage();
  const navigate = useNavigate();
  const params = useParams();
  const location = useLocation();
  const chatIdFromRoute = params.chatId || null;

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        const userId = user._id || user.id;
        if (!userId) {
          console.error('User object is missing ID property');
          return;
        }
        const normalizedUser = { ...user, _id: userId };
        setCurrentUser(normalizedUser);
      } catch (e) {
        console.error('Failed to parse user from localStorage');
      }
    }
  }, []);

  const chatIdRef = useRef<string | null>(null);

  useEffect(() => {
    chatIdRef.current = chatIdFromRoute;
  }, [chatIdFromRoute]);

  useEffect(() => {
    if (!currentUser || !activeProfile) return;

    // Disconnect existing socket when profile changes
    if (socketRef.current) {
      chatSocketService.disconnect();
      socketRef.current = null;
    }

    const token = localStorage.getItem('accessToken');
    console.log('Token retrieved:', !!token);
    if (!token) {
      console.error('Access token not found');
      return;
    }

    const socket = chatSocketService.connect();
    if (!socket) {
      console.error('Failed to connect to socket');
      return;
    }
    socketRef.current = socket;

    // Connect with the profile ID for socket rooms
    console.log(
      `[Frontend] Connecting with profile: ${activeProfile._id}, type: ${activeProfile.type}`,
    );
    socket.emit('user_connected', activeProfile._id, activeProfile.type);

    // Also connect with user ID for fallback
    socket.emit('user_connected', currentUser._id, 'user');

    socket.on('online_users', setOnlineUsers);

    socket.on('user_status', ({ userId, status }) => {
      setOnlineUsers((prev) =>
        status === 'online' ? [...prev, userId] : prev.filter((id) => id !== userId),
      );
    });

    socket.on('private_message', (payload) => {
      console.log('[Frontend Socket] Received private_message event:', payload);
      const {
        chatId,
        senderId,
        message,
        replyTo,
        timestamp,
        senderProfile,
        messageId,
        attachments,
      } = payload;
      const currentSenderId = activeProfile?._id || currentUser?._id;

      // Skip messages from current user (already added locally when sending)
      if (senderId === currentSenderId) {
        console.log('[Frontend] Skipping own message from socket');
        return;
      }

      const newMessage: Message = {
        id: messageId || `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        sender: senderId,
        content: message,
        text: message,
        type: 'received',
        timestamp: new Date(timestamp ?? Date.now()),
        replyTo: replyTo || undefined,
        attachments: attachments || [],
        senderProfile: senderProfile,
      };

      setMessages((prev) => {
        const chatMessages = prev[chatId] || [];

        // Simple duplicate check by message ID only
        const isDuplicate = chatMessages.some((msg) => msg.id === newMessage.id);

        if (isDuplicate) {
          console.log('[Frontend] Duplicate message detected, skipping');
          return prev;
        }

        return {
          ...prev,
          [chatId]: [...chatMessages, newMessage],
        };
      });
      // Update conversations for all participants
      setConversations((prevConversations) => {
        if (!Array.isArray(prevConversations)) return [];
        const existingConvIndex = prevConversations.findIndex((conv) => conv._id === chatId);

        if (existingConvIndex !== -1) {
          // Update existing conversation and move to top
          const updatedConversations = [...prevConversations];
          const currentUnreadCount = updatedConversations[existingConvIndex].unreadCount || 0;

          const updatedConv = {
            ...updatedConversations[existingConvIndex],
            lastMessage: message,
            lastMessageTime: new Date(timestamp ?? Date.now()),
            unreadCount:
              senderId === currentSenderId
                ? 0 // Don't increment for own messages
                : chatIdRef.current === chatId
                  ? 0 // Don't increment if chat is currently open
                  : currentUnreadCount + 1, // Increment for new messages when chat is not open
          };

          // Remove from current position and add to top
          updatedConversations.splice(existingConvIndex, 1);
          return [updatedConv, ...updatedConversations];
        } else {
          // Create new conversation for both sender and receiver
          const newConversation: Conversation = {
            _id: chatId,
            participants: senderProfile
              ? [
                  {
                    _id: senderId,
                    firstName: senderProfile.username || 'Unknown User',
                    lastName: '',
                    email: '',
                    photo: senderProfile.image,
                  },
                ]
              : [],
            lastMessage: message,
            unreadCount: senderId === currentSenderId || chatIdRef.current === chatId ? 0 : 1,
          };
          return [newConversation, ...prevConversations];
        }
      });
    });

    socket.on('typing', ({ chatId, userId }) => {
      if (chatId === chatIdRef.current && userId !== activeProfile._id) {
        setIsTyping(true);
      }
    });

    socket.on('stop_typing', ({ chatId, userId }) => {
      if (chatId === chatIdRef.current && userId !== activeProfile._id) {
        setIsTyping(false);
      }
    });

    return () => {
      socket.off('online_users');
      socket.off('user_status');
      socket.off('private_message');
      socket.off('typing');
      socket.off('stop_typing');
      chatSocketService.disconnect();
    };
  }, [currentUser, activeProfile]);

  // Update unread count when conversations change
  useEffect(() => {
    const totalUnread = Array.isArray(conversations)
      ? conversations.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0)
      : 0;
    setTotalUnreadCount(totalUnread);
  }, [conversations, setTotalUnreadCount]);

  // Periodic refresh of unread counts (every 30 seconds)
  useEffect(() => {
    if (!activeProfile) return;

    const refreshUnreadCounts = async () => {
      try {
        setConversations((prevConversations) => {
          if (!Array.isArray(prevConversations)) return prevConversations;

          // Update each conversation's unread count asynchronously
          Promise.all(
            prevConversations.map(async (conv) => {
              try {
                const unreadCount = await chatApiService.getUnreadCount(
                  conv._id,
                  activeProfile._id,
                );
                return { ...conv, unreadCount };
              } catch (error) {
                return conv;
              }
            }),
          ).then((updated) => {
            setConversations(updated);
          });

          // Return current conversations immediately to prevent vanishing
          return prevConversations;
        });
      } catch (error) {
        console.error('Failed to refresh unread counts:', error);
      }
    };

    const interval = setInterval(refreshUnreadCounts, 30000); // 30 seconds
    return () => clearInterval(interval);
  }, [activeProfile]);

  // Handle conversation updates
  const handleConversationUpdate = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  useEffect(() => {
    const fetchConversations = async () => {
      if (!currentUser || !activeProfile) return;
      setLoading(true);

      try {
        const conversations = await chatApiService.getProfileConversations(
          activeProfile._id,
          activeProfile.type,
        );

        // Fetch last message and unread count for each conversation
        const updatedConversations = await Promise.all(
          conversations.map(async (conv) => {
            let updatedConv = { ...conv };

            // Fetch last message object if not present or is placeholder
            if (
              !conv.lastMessage ||
              conv.lastMessage === 'No messages yet' ||
              typeof conv.lastMessage === 'string'
            ) {
              try {
                const messages = await chatApiService.getConversationMessages(
                  conv._id,
                  activeProfile._id,
                  1,
                  1,
                );
                const lastMsg = messages[messages.length - 1];
                // Store the full lastMsg object for richer preview
                updatedConv.lastMessage = lastMsg || 'No messages yet';
              } catch (error) {
                console.error('Error fetching messages for conversation:', error);
              }
            }

            // Fetch unread count from backend if not present or ensure it's a number
            if (typeof conv.unreadCount !== 'number') {
              try {
                const unreadCount = await chatApiService.getUnreadCount(
                  conv._id,
                  activeProfile._id,
                );
                updatedConv.unreadCount = unreadCount;
              } catch (error) {
                console.error('Error fetching unread count for conversation:', error);
                updatedConv.unreadCount = 0;
              }
            }

            return updatedConv;
          }),
        );

        setConversations(updatedConversations);
      } catch (error) {
        console.error('Error fetching conversations:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchConversations();
  }, [currentUser, activeProfile, refreshTrigger]);

  useEffect(() => {
    const currentChatId = chatIdRef.current;
    if (chatIdFromRoute && currentChatId !== chatIdFromRoute) {
      if (currentChatId) {
        chatSocketService.leaveChat(currentChatId);
      }
      chatSocketService.joinChat(chatIdFromRoute);
      chatIdRef.current = chatIdFromRoute;
    }

    // Cleanup: leave chat room when component unmounts or chat changes
    return () => {
      if (chatIdRef.current) {
        chatSocketService.leaveChat(chatIdRef.current);
      }
    };
  }, [chatIdFromRoute]);

  useEffect(() => {
    const fetchMessages = async () => {
      if (!chatIdFromRoute || !activeProfile) return;

      // Always mark messages as read when chat is opened
      const markAsRead = async () => {
        try {
          await chatApiService.markMessagesAsRead(chatIdFromRoute, activeProfile._id);
          // Update conversation unread count in state
          setConversations((prevConversations) =>
            prevConversations.map((conv) =>
              conv._id === chatIdFromRoute ? { ...conv, unreadCount: 0 } : conv,
            ),
          );
        } catch (error) {
          console.error('Failed to mark messages as read:', error);
        }
      };

      try {
        const chatMessages = await chatApiService.getConversationMessages(
          chatIdFromRoute,
          activeProfile._id,
          1,
          20,
        );

        // Always replace messages when fetching (don't merge)
        setMessages((prev) => ({ ...prev, [chatIdFromRoute]: chatMessages }));

        // Mark messages as read after loading
        await markAsRead();
      } catch (error) {
        console.error('Failed to fetch messages:', error);
        setMessages((prev) => ({ ...prev, [chatIdFromRoute]: [] }));
      }
    };
    fetchMessages();
  }, [chatIdFromRoute, activeProfile]); // Removed messages dependency to avoid infinite loop

  const handleStartConversation = useCallback(
    async (targetUserId: string) => {
      if (!activeProfile || !targetUserId) return;
      try {
        const newChat = await chatApiService.startNewConversation(
          activeProfile._id,
          targetUserId,
          activeProfile.type,
        );

        // Ensure participants are properly formatted
        const participants = (newChat.participants || []).map((p) => ({
          _id: p._id,
          firstName: p.firstName || 'Unknown User',
          lastName: p.lastName || '',
          email: p.email || '',
          photo: p.photo || '',
        }));

        const newConversation: Conversation = {
          _id: newChat._id,
          participants: participants,
          lastMessage: newChat.lastMessage || 'No messages yet',
          unreadCount: 0,
        };

        // Check if conversation already exists in state
        setConversations((prev) => {
          const existingIndex = prev.findIndex((conv) => conv._id === newChat._id);
          if (existingIndex !== -1) {
            // Update existing conversation
            const updated = [...prev];
            updated[existingIndex] = newConversation;
            return updated;
          } else {
            // Add new conversation
            return [newConversation, ...prev];
          }
        });

        // Initialize empty messages for this chat
        setMessages((prev) => ({
          ...prev,
          [newChat._id]: [],
        }));

        navigate(`/dashboard/chat/${newChat._id}`);
      } catch (error) {
        console.error('Failed to start conversation:', error);
      }
    },
    [activeProfile, navigate],
  );

  const handleSelectChat = useCallback(
    async (id: string) => {
      // Update frontend state immediately for better UX
      setConversations((prevConversations) =>
        prevConversations.map((conv) => (conv._id === id ? { ...conv, unreadCount: 0 } : conv)),
      );

      navigate(`/dashboard/chat/${id}`);

      // Mark messages as read in backend after navigation
      if (activeProfile) {
        try {
          await chatApiService.markMessagesAsRead(id, activeProfile._id);
        } catch (error) {
          console.error('Failed to mark messages as read:', error);
          // Revert frontend state if backend fails
          const unreadCount = await chatApiService.getUnreadCount(id, activeProfile._id);
          setConversations((prevConversations) =>
            prevConversations.map((conv) => (conv._id === id ? { ...conv, unreadCount } : conv)),
          );
        }
      }
    },
    [navigate, activeProfile],
  );

  const handleNewChat = useCallback(() => {
    setShowNewChat(true);
  }, []);

  const [windowWidth, setWindowWidth] = useState<number>(window.innerWidth);
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobileOrTablet = windowWidth < 1024;

  // Handle automatic conversation starting from connections page
  useEffect(() => {
    const startConversationWith = location.state?.startConversationWith;
    if (startConversationWith && activeProfile && !chatIdFromRoute) {
      handleStartConversation(startConversationWith);
      // Clear the state to prevent re-triggering
      navigate('/dashboard/chat', { replace: true });
    }
  }, [location.state, activeProfile, chatIdFromRoute, handleStartConversation, navigate]);

  return (
    <div className="flex-1 w-full">
      <div className="flex h-[85vh] mt-0 lg:mt-2 overflow-hidden">
        {isMobileOrTablet ? (
          !chatIdFromRoute ? (
            <div
              key="conversation-list"
              className="w-full h-full min-h-screen max-h-screen min-w-full max-w-full overflow-y-auto"
            >
              <ConversationList
                conversations={conversations}
                selectedChat={null}
                onSelectChat={handleSelectChat}
                onlineUsers={onlineUsers}
                currentUser={currentUser}
                onNewChat={handleNewChat}
                loading={loading}
                activeProfile={activeProfile}
                onConversationUpdate={handleConversationUpdate}
                messages={messages}
              />
            </div>
          ) : (
            <div
              key="chat-window"
              className="w-full h-full min-h-screen max-h-screen min-w-full max-w-full overflow-y-auto"
            >
              <ChatWindow
                selectedChat={chatIdFromRoute}
                messages={messages}
                setMessages={setMessages}
                isTyping={isTyping}
                currentUser={currentUser}
                conversations={conversations}
                onlineUsers={onlineUsers}
                setConversations={setConversations}
                onBack={() => {
                  navigate('/dashboard/chat');
                }}
              />
            </div>
          )
        ) : (
          <>
            <div className="h-full overflow-y-auto">
              <ConversationList
                conversations={conversations}
                selectedChat={chatIdFromRoute}
                onSelectChat={handleSelectChat}
                onlineUsers={onlineUsers}
                currentUser={currentUser}
                onNewChat={handleNewChat}
                loading={loading}
                activeProfile={activeProfile}
                onConversationUpdate={handleConversationUpdate}
                messages={messages}
              />
            </div>
            <div className="flex-1 ml-0 lg:ml-2 overflow-y-auto scrollbar-hide">
              <ChatWindow
                selectedChat={chatIdFromRoute}
                messages={messages}
                setMessages={setMessages}
                isTyping={isTyping}
                currentUser={currentUser}
                conversations={conversations}
                onlineUsers={onlineUsers}
                setConversations={setConversations}
              />
            </div>
          </>
        )}

        <NewConversationDialog
          isOpen={showNewChat}
          onClose={() => setShowNewChat(false)}
          onSelectUser={handleStartConversation}
          currentUser={currentUser}
          activeProfile={activeProfile}
        />
      </div>
    </div>
  );
};

export default Chat;
