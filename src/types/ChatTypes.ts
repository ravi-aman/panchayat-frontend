import React from 'react';

export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  photo?: string;
}

export interface Profile {
  _id: string;
  type: 'user' | 'company';
  username: string;
  image?: string;
  userId?: string;
  companyId?: string;
}

export interface FileAttachment {
  id: string;
  name: string;
  url: string;
  type: string; // MIME type
  size: number;
  uploadedAt: Date;
}

export interface Message {
  id?: string;
  sender: string;
  content: string;
  text?: string; // For compatibility with existing code
  timestamp?: Date;
  type?: 'sent' | 'received'; // For UI rendering
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'error'; // Message status
  replyTo?: Message;
  attachments?: FileAttachment[]; // File attachments
  senderProfile?: {
    _id: string;
    type: string;
    username: string;
    image?: string;
  };
}

export interface Chat {
  _id: string;
  participants: User[];
  messages: Message[];
  lastMessage?: string;
  isPinned?: boolean;
  clearedAt?: Date;
}

export interface Conversation {
  _id: string;
  participants: User[];
  lastMessage: string | Message;
  lastMessageTime?: Date;
  unreadCount?: number;
  isPinned?: boolean;
  clearedAt?: Date;
}

export interface ChatMenuAction {
  id: 'pin' | 'clear' | 'profile';
  label: string;
  icon: string | React.ReactElement;
  action: () => void;
}

export interface ChatState {
  conversations: Conversation[];
  selectedChat: string | null;
  messages: Record<string, Message[]>;
  isTyping: boolean;
  onlineUsers: string[];
}
