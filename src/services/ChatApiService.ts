import api from '../utils/api';
import { User, Chat, Message, Conversation } from '../types/ChatTypes';

// Backend API URL
const API_URL = `${import.meta.env.VITE_BACKEND_URL}/api/v1`;

class ChatApiService {
  // Search users for new conversations
  async searchUsers(query: string, currentUserId: string, profileType?: string): Promise<User[]> {
    try {
      // Always use the chat search endpoint
      const params = new URLSearchParams();
      if (query) {
        params.append('query', query);
      }
      if (currentUserId) {
        params.append('currentUserId', currentUserId);
      }
      if (profileType) {
        params.append('profileType', profileType);
      }

      const url = `${API_URL}/chats/search/users?${params.toString()}`;

      const response = await api.get(url);

      // Handle different response formats
      if (Array.isArray(response.data)) {
        return response.data;
      } else if (response.data.users && Array.isArray(response.data.users)) {
        return response.data.users;
      } else if (response.data.data && Array.isArray(response.data.data)) {
        return response.data.data;
      }
      return [];
    } catch (error) {
      console.error('Failed to search users:', error);
      return [];
    }
  }

  // Get user's conversations
  async getConversations(userId: string): Promise<Conversation[]> {
    try {
      // Use the correct endpoint based on your backend implementation
      const response = await api.get(`${API_URL}/chats/user/${userId}`);

      // Handle different response formats
      if (Array.isArray(response.data)) {
        return response.data;
      } else if (response.data.conversations && Array.isArray(response.data.conversations)) {
        return response.data.conversations;
      }
      return [];
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
      return [];
    }
  }

  // Get profile's conversations (user or company)
  async getProfileConversations(profileId: string, profileType: string): Promise<Conversation[]> {
    try {
      const response = await api.get(`${API_URL}/chats/profile/${profileId}?type=${profileType}`);

      let conversations: Conversation[] = [];
      if (Array.isArray(response.data)) {
        conversations = response.data;
      } else if (response.data.conversations && Array.isArray(response.data.conversations)) {
        conversations = response.data.conversations;
      }

      // Ensure unreadCount is properly set for each conversation
      return conversations.map((conv: Conversation) => ({
        ...conv,
        unreadCount: conv.unreadCount || 0,
      }));
    } catch (error) {
      console.error('Failed to fetch profile conversations:', error);
      return [];
    }
  }

  // Get unread message count for a specific conversation
  async getUnreadCount(chatId: string, userId: string): Promise<number> {
    try {
      console.log(`[API] Getting unread count - chatId: ${chatId}, userId: ${userId}`);
      const response = await api.get(`${API_URL}/chats/${chatId}/unread/${userId}`);
      console.log(`[API] Unread count response:`, response.data);
      return response.data.unreadCount || 0;
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
      return 0;
    }
  }

  // Mark messages as read
  async markMessagesAsRead(chatId: string, userId: string): Promise<void> {
    try {
      console.log(`[API] Marking messages as read - chatId: ${chatId}, userId: ${userId}`);
      const response = await api.post(`${API_URL}/chats/${chatId}/read`, { userId });
      console.log(`[API] Messages marked as read successfully:`, response.data);
    } catch (error) {
      console.error('Failed to mark messages as read:', error);
      throw error;
    }
  }

  // Pin or unpin a chat
  async togglePinChat(
    chatId: string,
    userId: string,
  ): Promise<{ isPinned: boolean; message: string }> {
    try {
      console.log(`[API] Toggling pin status - chatId: ${chatId}, userId: ${userId}`);
      const response = await api.post(`${API_URL}/chats/${chatId}/pin`, { userId });
      console.log(`[API] Pin status toggled successfully:`, response.data);
      return response.data;
    } catch (error) {
      console.error('Failed to toggle pin status:', error);
      throw error;
    }
  }

  // Clear chat for a user
  async clearChat(chatId: string, userId: string): Promise<{ message: string; clearedAt: Date }> {
    try {
      console.log(`[API] Clearing chat - chatId: ${chatId}, userId: ${userId}`);
      const response = await api.post(`${API_URL}/chats/${chatId}/clear`, { userId });
      console.log(`[API] Chat cleared successfully:`, response.data);
      return response.data;
    } catch (error) {
      console.error('Failed to clear chat:', error);
      throw error;
    }
  }

  // Start a new conversation
  async startNewConversation(
    userId: string,
    targetUserId: string,
    profileType?: string,
  ): Promise<Chat> {
    try {
      // Get user from localStorage as fallback
      if (!userId) {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          try {
            const user = JSON.parse(userStr);
            // Use either _id or id property
            userId = user._id || user.id;
          } catch (e) {
            console.error('Failed to parse user from localStorage');
          }
        }
      }

      console.log('Starting conversation with:', { userId, targetUserId, profileType });

      // Final validation
      if (!userId || !targetUserId) {
        throw new Error('Both userId and targetUserId are required');
      }

      // Try the conversations endpoint with profile type
      const response = await api.post(`${API_URL}/conversations`, {
        userId,
        targetUserId,
        profileType,
      });

      return response.data;
    } catch (error) {
      // Enhanced error logging
      if (error && typeof error === 'object' && 'response' in error && error.response) {
        // error is likely an AxiosError
        // @ts-ignore
        console.error('Server response:', error.response.data);
        // @ts-ignore
        console.error('Status code:', error.response.status);
      }
      console.error('Error starting conversation:', error);
      throw error;
    }
  }

  // Get messages for a conversation
  async getConversationMessages(
    chatId: string,
    currentUserId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<Message[]> {
    try {
      const response = await api.get(
        `${API_URL}/chats/${chatId}?page=${page}&limit=${limit}&userId=${currentUserId}`,
      );

      // Handle both UnifiedChat and regular Chat response formats
      const messages = response.data.messages || response.data.messages || [];

      // Format messages for display (sent vs received)
      return messages.map((msg: any) => {
        if (!msg.sender) {
          console.warn('Message received with no sender:', msg);
          return {
            id:
              msg._id ||
              msg.id ||
              `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            sender: 'unknown',
            content: msg.content || msg.text || '',
            text: msg.content || msg.text || '',
            type: 'received',
            timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date(),
          };
        }

        const senderId =
          typeof msg.sender === 'object' ? msg.sender._id || msg.sender.id : msg.sender;
        return {
          id:
            msg._id || msg.id || `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          sender: senderId || 'unknown',
          content: msg.content || msg.text || '',
          text: msg.content || msg.text || '',
          type: senderId === currentUserId ? 'sent' : 'received',
          timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date(),
          replyTo: msg.replyTo,
          attachments: msg.attachments || [], // Ensure attachments are included
          senderProfile:
            msg.senderProfile ||
            (msg.senderType
              ? {
                  _id: senderId,
                  type: msg.senderType,
                  username:
                    typeof msg.sender === 'object' ? msg.sender.firstName || 'Unknown' : 'Unknown',
                }
              : undefined),
        };
      });
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      return [];
    }
  }
  // Send message via API (for persistence)
  async persistMessage(
    chatId: string,
    senderId: string,
    content: string,
    senderType?: string,
    sentBy?: string,
    attachments?: any[],
  ): Promise<void> {
    try {
      const messageData = {
        sender: senderId,
        // Always provide a content string, even if empty
        content: content || (attachments && attachments.length > 0 ? '' : ' '),
        senderType: senderType || 'user',
        sentBy: sentBy || senderId,
        attachments: Array.isArray(attachments) ? attachments : [],
      };
      console.log('Persisting message with data:', messageData);
      await api.post(`${API_URL}/chats/${chatId}/message`, messageData);
    } catch (error) {
      console.error('Failed to persist message:', error);
      throw error;
    }
  }
}

// Create singleton instance
const chatApiService = new ChatApiService();
export default chatApiService;
