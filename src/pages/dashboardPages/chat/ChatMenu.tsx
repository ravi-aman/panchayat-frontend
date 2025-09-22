import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatMenuAction } from '../../../types/ChatTypes';

interface ChatMenuProps {
  isOpen: boolean;
  onClose: () => void;
  actions: ChatMenuAction[];
  position?: 'top-right' | 'bottom-right' | 'top-left' | 'bottom-left';
}

const ChatMenu: React.FC<ChatMenuProps> = ({
  isOpen,
  onClose,
  actions,
  position = 'bottom-right',
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const getPositionClasses = () => {
    switch (position) {
      case 'top-right':
        return 'bottom-full right-0 mb-2';
      case 'top-left':
        return 'bottom-full left-0 mb-2';
      case 'bottom-left':
        return 'top-full left-0 mt-2';
      default:
        return 'top-full right-0 mt-2';
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.15 }}
            className={`absolute z-[9999] ${getPositionClasses()} bg-white rounded-lg shadow-xl border border-gray-200 py-2 min-w-[160px]`}
          >
            {actions.map((action) => (
              <button
                key={action.id}
                onClick={(e) => {
                  e.stopPropagation();
                  action.action();
                  onClose();
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-3 transition-colors duration-150"
              >
                <span className="text-gray-500">{action.icon}</span>
                <span>{action.label}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChatMenu;
