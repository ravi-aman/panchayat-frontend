import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';

interface UnreadMessageContextType {
  totalUnreadCount: number;
  setTotalUnreadCount: (count: number) => void;
  incrementUnreadCount: () => void;
  decrementUnreadCount: (amount?: number) => void;
  resetUnreadCount: () => void;
}

const UnreadMessageContext = createContext<UnreadMessageContextType | undefined>(undefined);

export const UnreadMessageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);

  const incrementUnreadCount = useCallback(() => {
    setTotalUnreadCount((prev) => prev + 1);
  }, []);

  const decrementUnreadCount = useCallback((amount: number = 1) => {
    setTotalUnreadCount((prev) => Math.max(0, prev - amount));
  }, []);

  const resetUnreadCount = useCallback(() => {
    setTotalUnreadCount(0);
  }, []);

  return (
    <UnreadMessageContext.Provider
      value={{
        totalUnreadCount,
        setTotalUnreadCount,
        incrementUnreadCount,
        decrementUnreadCount,
        resetUnreadCount,
      }}
    >
      {children}
    </UnreadMessageContext.Provider>
  );
};

export const useUnreadMessage = () => {
  const context = useContext(UnreadMessageContext);
  if (context === undefined) {
    throw new Error('useUnreadMessage must be used within an UnreadMessageProvider');
  }
  return context;
};
