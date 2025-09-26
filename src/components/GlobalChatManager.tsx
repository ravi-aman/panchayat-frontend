import { useEffect } from 'react';
import { globalSocketManager } from '../services/GlobalSocketManager';
import { useUnreadMessage } from '../contexts/UnreadMessageContext';
import { useAuth } from '../contexts/AuthContext';

export function GlobalChatManager() {
  const { setTotalUnreadCount } = useUnreadMessage();
  const { activeProfile } = useAuth();

  useEffect(() => {
    console.log('🌍 GlobalChatManager mounted');

    if (!activeProfile) {
      console.log('❌ No active profile, resetting count');
      setTotalUnreadCount(0);
      globalSocketManager.cleanup();
      return;
    }

    console.log('✅ Active profile found:', activeProfile._id, activeProfile.type);
    globalSocketManager.initialize(activeProfile._id, activeProfile.type, setTotalUnreadCount);

    return () => {
      console.log('🧹 GlobalChatManager cleanup');
    };
  }, [activeProfile?._id, activeProfile?.type, setTotalUnreadCount]);

  return null;
}
