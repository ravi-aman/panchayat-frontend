import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Video, FileText, Image } from 'lucide-react';

interface FileAttachmentMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onFileSelect: (files: FileList) => void;
}

const FileAttachmentMenu: React.FC<FileAttachmentMenuProps> = ({
  isOpen,
  onClose,
  onFileSelect,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);
  const documentInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEsc);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose]);

  const handleFileSelection = (inputRef: React.RefObject<HTMLInputElement | null>) => {
    inputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      onFileSelect(files);
      onClose();
    }
    // Reset input value to allow selecting the same file again
    event.target.value = '';
  };

  const menuItems: Array<{
    id: string;
    label: string;
    icon: React.ReactNode;
    color: string;
    accept: string;
    ref: React.RefObject<HTMLInputElement | null>;
  }> = [
    {
      id: 'photos',
      label: 'Photos',
      icon: <Image size={20} />,
      color: 'bg-blue-500',
      accept: 'image/*',
      ref: photoInputRef,
    },
    {
      id: 'videos',
      label: 'Videos',
      icon: <Video size={20} />,
      color: 'bg-red-500',
      accept: 'video/*',
      ref: videoInputRef,
    },
    {
      id: 'documents',
      label: 'Documents',
      icon: <FileText size={20} />,
      color: 'bg-green-500',
      accept: '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt',
      ref: documentInputRef,
    },
  ];

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={menuRef}
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-full right-0 mb-2 bg-white rounded-lg shadow-xl border border-gray-200 p-2 min-w-[200px]"
          >
            <div className="space-y-1">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleFileSelection(item.ref)}
                  className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-150"
                >
                  <div className={`p-2 rounded-full ${item.color} text-white`}>{item.icon}</div>
                  <span className="text-gray-700 font-medium">{item.label}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden file inputs */}
      {menuItems.map((item) => (
        <input
          key={item.id}
          ref={item.ref}
          type="file"
          accept={item.accept}
          multiple
          onChange={handleFileChange}
          className="hidden"
        />
      ))}
    </>
  );
};

export default FileAttachmentMenu;
