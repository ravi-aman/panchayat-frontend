import React from 'react';
import { Chat } from '.';
import { motion } from 'framer-motion';

const ChatInterface: React.FC = () => {
  return (
    <motion.div
      className="flex h-[75vh] lg:ml-[-2vw] scrollbar-hide"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <Chat />
    </motion.div>
  );
};

export default ChatInterface;
