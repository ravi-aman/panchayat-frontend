import { useEffect } from 'react';
import { globalSocketManager } from '../services/GlobalSocketManager';
import { useUnreadMessage } from '../contexts/UnreadMessageContext';
import { useAuth } from '../contexts/AuthContext';

export function useGlobalChatListener() {
  const { setTotalUnreadCount } = useUnreadMessage();
  const { activeProfile } = useAuth();

  useEffect(() => {
    if (!activeProfile) {
      setTotalUnreadCount(0);
      globalSocketManager.cleanup();
      return;
    }

    console.log('🔄 Initializing socket for profile:', activeProfile._id);
    globalSocketManager.initialize(activeProfile._id, activeProfile.type, setTotalUnreadCount);
  }, [activeProfile?._id, activeProfile?.type, setTotalUnreadCount]);

  useEffect(() => {
    return () => {
      if (!activeProfile) {
        globalSocketManager.cleanup();
      }
    };
  }, [activeProfile]);

  return {
    updateUnreadCount: () => {
      if (activeProfile) {
        globalSocketManager.initialize(activeProfile._id, activeProfile.type, setTotalUnreadCount);
      }
    },
  };
}
