import React, { useState } from 'react';

// Simple test modal to debug flickering issues
const SimpleImageModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="p-4">
      <button 
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Test Modal
      </button>

      {isOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center"
          onClick={() => setIsOpen(false)}
        >
          <div 
            className="bg-white p-8 rounded-lg max-w-md mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-4">Test Modal</h2>
            <p className="mb-4">This is a simple modal to test for flickering issues.</p>
            <img 
              src="https://picsum.photos/400/300" 
              alt="Test" 
              className="w-full h-48 object-cover rounded mb-4"
            />
            <button 
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SimpleImageModal;