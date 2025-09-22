import React from 'react';
import { Message } from '../../../types/ChatTypes';
import { motion, useAnimation } from 'framer-motion';
import { getRelativeTime, getFullTime } from '../../../utils/timeUtils';
import FileAttachment from './FileAttachment';

interface ChatMessageProps {
  message: Message;
  isCurrentUser: boolean;
  onReply?: (message: Message) => void;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, isCurrentUser, onReply }) => {
  const messageText = message.content || message.text || '';
  const controls = useAnimation();
  const senderName = 'You';

  const handleDragEnd = (_event: any, info: any) => {
    if (info.offset.x > 100) {
      if (onReply) {
        onReply(message);
      }
    }
    controls.start({ x: 0 });
  };

  const handleReplyClick = () => {
    if (onReply) {
      onReply(message);
    }
  };

  return (
    <motion.div
      className={`flex flex-col mb-4 group ${isCurrentUser ? 'items-end' : 'items-start'}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className={`flex items-center gap-2 ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'}`}>
        <motion.div
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          onDragEnd={handleDragEnd}
          animate={controls}
          className={`max-w-[85%] min-w-0 px-4 py-3 rounded-2xl shadow-sm relative ${
            isCurrentUser
              ? 'bg-blue-500 text-white rounded-br-md shadow-blue-100'
              : 'bg-white text-gray-800 border border-gray-100 rounded-bl-md shadow-gray-100'
          }`}
        >
          {message.replyTo && (
            <div
              className={`mb-2 p-2 rounded-lg border-l-4 flex flex-col ${
                isCurrentUser
                  ? 'bg-blue-100 bg-opacity-40 border-blue-400'
                  : 'bg-gray-100 border-blue-300'
              }`}
            >
              <span
                className={`text-xs font-semibold mb-1 ${
                  isCurrentUser ? 'text-blue-700' : 'text-blue-600'
                }`}
              >
                {message.replyTo.sender === message.sender ? senderName : 'Other'}
              </span>
              <span
                className={`text-xs truncate ${isCurrentUser ? 'text-blue-900' : 'text-gray-700'}`}
              >
                {message.replyTo.content || message.replyTo.text}
              </span>
            </div>
          )}
          <div className="flex items-end flex-wrap">
            {messageText && (
              <div className="max-w-70 break-words hyphens-auto min-w-0 flex-1 leading-relaxed">
                {messageText}
              </div>
            )}
            {message.timestamp && (
              <span
                className={`text-xs cursor-help font-medium align-bottom ${
                  isCurrentUser ? 'text-blue-200' : 'text-gray-400'
                }`}
                title={getFullTime(new Date(message.timestamp))}
                style={{
                  background: 'inherit',
                  padding: '0 2px',
                  minWidth: '40px',
                  textAlign: 'right',
                }}
              >
                {getRelativeTime(new Date(message.timestamp))}
              </span>
            )}
          </div>
          {message.attachments && message.attachments.length > 0 && (
            <div className="space-y-2 mt-1">
              {message.attachments.map((attachment) => (
                <FileAttachment
                  key={attachment.id}
                  attachment={attachment}
                  isCurrentUser={isCurrentUser}
                />
              ))}
            </div>
          )}
          {/* Message status for current user removed as per user request */}
        </motion.div>
        <button
          onClick={handleReplyClick}
          className={`text-gray-400 hover:text-blue-600 focus:outline-none opacity-0 group-hover:opacity-100 transition-opacity ${
            isCurrentUser ? 'order-first' : 'order-last'
          }`}
          aria-label="Reply to message"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M7.707 3.293a1 1 0 010 1.414L5.414 7H11a7 7 0 017 7v2a1 1 0 11-2 0v-2a5 5 0 00-5-5H5.414l2.293 2.293a1 1 0 11-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
    </motion.div>
  );
};

export default React.memo(ChatMessage);
