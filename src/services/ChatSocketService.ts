import { io, Socket } from 'socket.io-client';

const SOCKET_URL = `${import.meta.env.VITE_BACKEND_URL}`;

class ChatSocketService {
  private socket: Socket | null = null;

  connect() {
    if (this.socket && this.socket.connected) {
      console.log('[ChatSocketService] Socket already connected:', this.socket.id);
      return this.socket;
    }

    const token = localStorage.getItem('accessToken');
    if (!token) {
      console.error('[ChatSocketService] No auth token found');
      return null;
    }

    console.log('[ChatSocketService] Connecting socket...');

    if (this.socket && !this.socket.connected) {
      this.socket.disconnect();
      console.log('[ChatSocketService] Disconnected previous socket.');
    }

    this.socket = io(SOCKET_URL, {
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      transports: ['websocket', 'polling'],
      auth: { token },
    });

    this.socket.on('connect', () => {
      console.log('[ChatSocketService] Socket connected:', this.socket?.id);
    });

    this.socket.on('connect_error', (error) => {
      console.error('[ChatSocketService] Socket connection error:', error);
    });

    this.socket.on('error', (error) => {
      console.error('[ChatSocketService] Socket error:', error);
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log(`✅ [ChatSocketService] Socket reconnected after ${attemptNumber} attempts`);
    });

    // Keep socket alive
    this.socket.on('connect', () => {
      console.log('✅ [ChatSocketService] Socket connected:', this.socket?.id);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ [ChatSocketService] Socket disconnected:', reason);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      console.log('[ChatSocketService] Disconnecting socket');
      this.socket.disconnect();
      this.socket = null;
    }
  }

  isConnected() {
    return this.socket && this.socket.connected;
  }

  sendMessage(
    chatId: string,
    senderId: string,
    receiverId: string,
    message: string,
    replyTo?: any,
    senderProfile?: any,
    profileType?: string,
    attachments?: any[],
  ) {
    if (!this.socket) {
      console.warn('[ChatSocketService] sendMessage called but socket is not connected.');
      return;
    }
    // Ensure we always have a message content, use empty string if sending only attachments
    const messageContent = message.trim() || (attachments?.length ? '' : ' ');
    console.log('[ChatSocketService] Emitting private_message:', {
      chatId,
      senderId,
      receiverId,
      message: messageContent,
      replyTo,
      senderProfile,
      profileType,
      attachments,
    });
    this.socket.emit('private_message', {
      chatId,
      senderId,
      receiverId,
      message: messageContent,
      replyTo,
      senderProfile,
      profileType,
      attachments,
    });
  }

  markMessageDelivered(chatId: string, messageId: string, userId: string) {
    if (!this.socket) return;
    this.socket.emit('message_delivered', { chatId, messageId, userId });
  }

  markMessageRead(chatId: string, messageId: string, userId: string) {
    if (!this.socket) return;
    this.socket.emit('message_read', { chatId, messageId, userId });
  }

  sendTypingIndicator(chatId: string, userId: string) {
    if (!this.socket) return;
    this.socket.emit('typing', { chatId, userId });
  }

  sendStopTypingIndicator(chatId: string, userId: string) {
    if (!this.socket) return;
    this.socket.emit('stop_typing', { chatId, userId });
  }

  joinChat(chatId: string) {
    if (!this.socket) {
      console.warn('[ChatSocketService] joinChat called but socket is not connected.');
      return;
    }
    console.log('[ChatSocketService] Emitting join_chat:', { chatId });
    this.socket.emit('join_chat', { chatId });
  }

  leaveChat(chatId: string) {
    if (!this.socket) {
      console.warn('[ChatSocketService] leaveChat called but socket is not connected.');
      return;
    }
    console.log('[ChatSocketService] Emitting leave_chat:', { chatId });
    this.socket.emit('leave_chat', { chatId });
  }

  getSocket() {
    return this.socket;
  }
}

const chatSocketService = new ChatSocketService();
export default chatSocketService;
