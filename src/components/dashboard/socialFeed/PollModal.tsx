import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Plus, BarChart } from 'lucide-react';

interface PollData {
  question: string;
  options: string[];
}

interface PollModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreatePoll: (pollData: PollData) => void;
}

const PollModal: React.FC<PollModalProps> = ({ isOpen, onClose, onCreatePoll }) => {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose, isOpen]);

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const addOption = () => {
    if (options.length < 10) {
      setOptions([...options, '']);
    }
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      const newOptions = options.filter((_, i) => i !== index);
      setOptions(newOptions);
    }
  };

  const handleCreatePoll = () => {
    if (!question.trim()) return;

    const validOptions = options.filter((opt) => opt.trim());
    if (validOptions.length < 2) return;

    onCreatePoll({
      question: question.trim(),
      options: validOptions,
    });

    // Reset form
    setQuestion('');
    setOptions(['', '']);
  };

  const isValid = question.trim() && options.filter((opt) => opt.trim()).length >= 2;

  if (!isOpen) return null;

  return (
    <motion.div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-60"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        ref={modalRef}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden border border-gray-100"
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <BarChart className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Create Poll</h3>
              <p className="text-sm text-gray-500">Ask a question and get opinions</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-50 rounded-lg transition-colors duration-200"
          >
            <X className="w-5 h-5 text-gray-400 hover:text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 space-y-6 overflow-y-auto">
          {/* Question */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Poll Question</label>
            <textarea
              placeholder="Ask a question..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="w-full p-4 border border-gray-200 bg-white rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-gray-900 placeholder-gray-500 min-h-[80px]"
              maxLength={500}
            />
            <div className="text-xs text-gray-400 mt-1">{question.length}/500 characters</div>
          </div>

          {/* Options */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Poll Options</label>
            <div className="space-y-3">
              {options.map((option, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-medium text-gray-600">{index + 1}</span>
                  </div>
                  <input
                    type="text"
                    placeholder={`Option ${index + 1}`}
                    value={option}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    className="flex-1 p-3 border border-gray-200 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                    maxLength={200}
                  />
                  {options.length > 2 && (
                    <button
                      onClick={() => removeOption(index)}
                      className="p-2 hover:bg-red-50 rounded-lg transition-colors duration-200"
                    >
                      <X className="h-4 w-4 text-gray-400 hover:text-red-500" />
                    </button>
                  )}
                </div>
              ))}

              {options.length < 10 && (
                <button
                  onClick={addOption}
                  className="flex items-center space-x-2 p-3 border border-dashed border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200 w-full"
                >
                  <Plus className="h-4 w-4 text-gray-600" />
                  <span className="text-gray-600 font-medium">Add Option</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-500">
            {options.filter((opt) => opt.trim()).length} of {options.length} options filled
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium rounded-lg hover:bg-gray-100 transition-all duration-200"
            >
              Cancel
            </button>
            <button
              onClick={handleCreatePoll}
              disabled={!isValid}
              className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Create Poll
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default PollModal;
