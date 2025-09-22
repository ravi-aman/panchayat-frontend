import { motion } from 'framer-motion';

const TypingIndicator = () => (
  <motion.div
    className="flex items-center gap-1 px-4 py-2 bg-gray-200 rounded-full w-fit shadow"
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: 10 }}
    transition={{ duration: 0.3 }}
  >
    <span
      className="block w-2 h-2 bg-gray-500 rounded-full animate-bounce"
      style={{ animationDelay: '0ms' }}
    ></span>
    <span
      className="block w-2 h-2 bg-gray-500 rounded-full animate-bounce"
      style={{ animationDelay: '100ms' }}
    ></span>
    <span
      className="block w-2 h-2 bg-gray-500 rounded-full animate-bounce"
      style={{ animationDelay: '200ms' }}
    ></span>
    <span className="ml-2 text-xs text-gray-500">Typing...</span>
  </motion.div>
);

export default TypingIndicator;
