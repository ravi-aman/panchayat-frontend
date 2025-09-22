import React, { useEffect, useRef } from 'react';
import EmojiPickerReact, { EmojiClickData } from 'emoji-picker-react';

interface EmojiPickerProps {
  onSelect: (emoji: EmojiClickData) => void;
  onClose: () => void;
}

const EmojiPicker: React.FC<EmojiPickerProps> = ({ onSelect, onClose }) => {
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEsc);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  return (
    <div
      ref={pickerRef}
      className="absolute bottom-14 right-0 z-50 bg-white rounded-lg shadow-lg border border-gray-200"
    >
      <EmojiPickerReact
        onEmojiClick={onSelect}
        skinTonesDisabled
        previewConfig={{ showPreview: false }}
        width={300}
        height={400}
        className="hide-scrollbar"
      />
    </div>
  );
};

export default EmojiPicker;
