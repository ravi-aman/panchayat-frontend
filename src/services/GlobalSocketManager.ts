import chatSocketService from './ChatSocketService';
import chatApiService from './ChatApiService';

class GlobalSocketManager {
  private isInitialized = false;
  private currentProfileId: string | null = null;
  private currentProfileType: string | null = null;
  private updateUnreadCountCallback: ((count: number) => void) | null = null;
  private pollingInterval: NodeJS.Timeout | null = null;

  initialize(profileId: string, profileType: string, updateCallback: (count: number) => void) {
    if (this.isInitialized && this.currentProfileId === profileId) {
      this.updateUnreadCountCallback = updateCallback;
      return;
    }

    console.log('🚀 Initializing global socket for profile:', profileId);

    this.currentProfileId = profileId;
    this.currentProfileType = profileType;
    this.updateUnreadCountCallback = updateCallback;
    this.isInitialized = true;

    // Connect socket
    const socket = chatSocketService.connect();
    if (!socket) return;

    socket.emit('user_connected', profileId, profileType);
    socket.on('private_message', this.handleNewMessage.bind(this));

    // Start polling every 3 seconds
    this.startPolling();

    // Initial fetch
    this.fetchUnreadCount(profileId, profileType);
  }

  private startPolling() {
    if (this.pollingInterval) clearInterval(this.pollingInterval);

    this.pollingInterval = setInterval(() => {
      if (this.currentProfileId && this.currentProfileType) {
        this.fetchUnreadCount(this.currentProfileId, this.currentProfileType);
      }
    }, 3000); // Poll every 3 seconds

    console.log('📡 Started polling for unread messages');
  }

  private async handleNewMessage(data: any) {
    console.log('🔔 New message received globally:', data);
    if (this.currentProfileId && this.currentProfileType && this.updateUnreadCountCallback) {
      await this.fetchUnreadCount(this.currentProfileId, this.currentProfileType);
    }
  }

  private async fetchUnreadCount(profileId: string, profileType: string) {
    try {
      const conversations = await chatApiService.getProfileConversations(profileId, profileType);
      const totalUnread = conversations.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0);
      console.log('📊 Total unread count:', totalUnread);
      this.updateUnreadCountCallback?.(totalUnread);
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  }

  cleanup() {
    console.log('🧹 Cleaning up global socket');
    this.isInitialized = false;
    this.currentProfileId = null;
    this.currentProfileType = null;
    this.updateUnreadCountCallback = null;

    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }

    chatSocketService.disconnect();
  }
}

export const globalSocketManager = new GlobalSocketManager();
