import React from 'react';
import DynamicImageGrid from '../common/DynamicImageGrid';

// Test component to verify image deduplication works
const ImageDuplicationTest: React.FC = () => {
  // Create test data with intentional duplicates
  const testImages = [
    { url: 'https://picsum.photos/400/300?random=1', alt: 'Test 1' },
    { url: 'https://picsum.photos/400/300?random=2', alt: 'Test 2' },
    { url: 'https://picsum.photos/400/300?random=1', alt: 'Test 1 Duplicate' }, // Duplicate
    { url: 'https://picsum.photos/400/300?random=3', alt: 'Test 3' },
    { url: 'https://picsum.photos/400/300?random=2', alt: 'Test 2 Duplicate' }, // Duplicate
  ];

  console.log('Original images count:', testImages.length);
  console.log('Should render only 3 unique images (1, 2, 3)');

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h2 className="text-xl font-bold mb-4">Image Deduplication Test</h2>
      <p className="mb-4 text-gray-600">
        Original array has {testImages.length} images (with duplicates). 
        Should display only 3 unique images.
      </p>
      
      <DynamicImageGrid
        images={testImages}
        className="mb-4"
        showHoverEffects={true}
        maxHeight="400px"
      />
      
      <div className="mt-4 p-3 bg-gray-100 rounded">
        <h3 className="font-semibold mb-2">Image URLs in test data:</h3>
        <ul className="text-sm space-y-1">
          {testImages.map((img, index) => (
            <li key={index} className={`${
              testImages.findIndex(i => i.url === img.url) !== index ? 'text-red-500' : 'text-green-600'
            }`}>
              {index + 1}. {img.url} {testImages.findIndex(i => i.url === img.url) !== index ? '(DUPLICATE)' : '(UNIQUE)'}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default ImageDuplicationTest;