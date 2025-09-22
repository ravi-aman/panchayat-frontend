// Utility functions for managing unread message counts

export const calculateUnreadCount = (messages: any[], currentUserId: string): number => {
  if (!messages || !currentUserId) return 0;

  return messages.filter(
    (msg) =>
      msg.sender !== currentUserId &&
      msg.type === 'received' &&
      (!msg.status || msg.status !== 'read'),
  ).length;
};

export const shouldShowUnreadBadge = (unreadCount: number): boolean => {
  return unreadCount > 0;
};

export const formatUnreadCount = (count: number): string => {
  if (count > 99) return '99+';
  return count.toString();
};
