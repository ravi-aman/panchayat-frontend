import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useUnreadMessage } from '../contexts/UnreadMessageContext';
import { useAuth } from '../contexts/AuthContext';
import chatApiService from '../services/ChatApiService';

/**
 * Hook to sync unread count when navigating between routes
 * This ensures counters are always up-to-date regardless of which route the user is on
 */
export function useUnreadCountSync() {
  const location = useLocation();
  const { setTotalUnreadCount } = useUnreadMessage();
  const { activeProfile } = useAuth();

  useEffect(() => {
    const syncUnreadCount = async () => {
      if (!activeProfile) {
        setTotalUnreadCount(0);
        return;
      }

      try {
        const conversations = await chatApiService.getProfileConversations(
          activeProfile._id,
          activeProfile.type,
        );
        const totalUnread = conversations.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0);
        setTotalUnreadCount(totalUnread);
      } catch (error) {
        console.error('Failed to sync unread count on route change:', error);
      }
    };

    // Sync unread count on route change
    syncUnreadCount();
  }, [location.pathname, activeProfile, setTotalUnreadCount]);
}
