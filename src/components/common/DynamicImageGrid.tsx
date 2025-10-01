import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Download, Share2 } from 'lucide-react';

interface ImageItem {
  url: string;
  alt?: string;
  filename?: string;
  width?: number;
  height?: number;
}

interface DynamicImageGridProps {
  images: ImageItem[];
  className?: string;
  onImageClick?: (index: number) => void;
  maxHeight?: string;
  borderRadius?: string;
  showHoverEffects?: boolean;
  showOverlay?: boolean;
  overlayContent?: React.ReactNode;
}

interface ImageModalProps {
  images: ImageItem[];
  initialIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
}

// Image Modal/Lightbox Component
const ImageModal: React.FC<ImageModalProps> = ({
  images,
  initialIndex,
  isOpen,
  onClose,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isLoading, setIsLoading] = useState(true);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
    setIsLoading(true);
  };

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    setIsLoading(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') handleNext();
    if (e.key === 'ArrowLeft') handlePrevious();
    if (e.key === 'Escape') onClose();
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = images[currentIndex].url;
    link.download = images[currentIndex].filename || `image-${currentIndex + 1}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
        onClick={onClose}
        onKeyDown={handleKeyDown}
        tabIndex={0}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-60 p-2 text-white hover:bg-white/20 rounded-full transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Navigation Buttons */}
        {images.length > 1 && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePrevious();
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-60 p-3 text-white hover:bg-white/20 rounded-full transition-colors"
            >
              <ChevronLeft className="w-8 h-8" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-60 p-3 text-white hover:bg-white/20 rounded-full transition-colors"
            >
              <ChevronRight className="w-8 h-8" />
            </button>
          </>
        )}

        {/* Image Counter */}
        {images.length > 1 && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-60 px-3 py-1 bg-black/50 text-white text-sm rounded-full">
            {currentIndex + 1} of {images.length}
          </div>
        )}

        {/* Main Image */}
        <motion.div
          key={currentIndex}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="relative max-w-full max-h-full p-4"
          onClick={(e) => e.stopPropagation()}
        >
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
          
          <img
            src={images[currentIndex].url}
            alt={images[currentIndex].alt || `Image ${currentIndex + 1}`}
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
            onLoad={() => setIsLoading(false)}
            onError={() => setIsLoading(false)}
          />
        </motion.div>

        {/* Action Bar */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-60 flex items-center gap-2 px-4 py-2 bg-black/50 rounded-full">
          <button
            onClick={handleDownload}
            className="p-2 text-white hover:bg-white/20 rounded-full transition-colors"
            title="Download"
          >
            <Download className="w-5 h-5" />
          </button>
          <button
            onClick={() => {
              navigator.share?.({
                url: images[currentIndex].url,
                title: 'Shared Image',
              });
            }}
            className="p-2 text-white hover:bg-white/20 rounded-full transition-colors"
            title="Share"
          >
            <Share2 className="w-5 h-5" />
          </button>
        </div>

        {/* Thumbnail Strip for multiple images */}
        {images.length > 1 && (
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-60 flex gap-2 px-4 py-2 bg-black/50 rounded-full max-w-md overflow-x-auto">
            {images.map((image, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex(index);
                  setIsLoading(true);
                }}
                className={`flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                  index === currentIndex
                    ? 'border-white scale-110'
                    : 'border-transparent hover:border-white/50'
                }`}
              >
                <img
                  src={image.url}
                  alt={`Thumbnail ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

// Main Dynamic Image Grid Component
const DynamicImageGrid: React.FC<DynamicImageGridProps> = ({
  images,
  className = '',
  onImageClick,
  maxHeight = '480px',
  borderRadius = '12px',
  showHoverEffects = true,
  showOverlay = false,
  overlayContent,
}) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);

  // Remove duplicate images based on URL
  const uniqueImages = images.filter((image, index, self) => 
    index === self.findIndex(img => img.url === image.url)
  );

  const handleImageClick = (index: number) => {
    setSelectedImageIndex(index);
    onImageClick?.(index);
  };

  const getGridLayout = () => {
    const count = uniqueImages.length;
    
    switch (count) {
      case 1:
        return {
          container: `grid grid-cols-1`,
          items: ['col-span-1 row-span-1']
        };
      case 2:
        return {
          container: `grid grid-cols-2 gap-1`,
          items: ['col-span-1', 'col-span-1']
        };
      case 3:
        return {
          container: `grid grid-cols-2 grid-rows-2 gap-1`,
          items: ['col-span-1 row-span-2', 'col-span-1', 'col-span-1']
        };
      case 4:
        return {
          container: `grid grid-cols-2 grid-rows-2 gap-1`,
          items: ['col-span-1', 'col-span-1', 'col-span-1', 'col-span-1']
        };
      case 5:
        return {
          container: `grid grid-cols-3 grid-rows-2 gap-1`,
          items: ['col-span-2 row-span-1', 'col-span-1 row-span-2', 'col-span-1', 'col-span-1']
        };
      default: // 6 or more
        return {
          container: `grid grid-cols-3 grid-rows-2 gap-1`,
          items: ['col-span-1', 'col-span-1', 'col-span-1', 'col-span-1', 'col-span-1', 'col-span-1']
        };
    }
  };

  const { container, items } = getGridLayout();
  const displayImages = uniqueImages.slice(0, 6); // Show max 6 images in grid
  const remainingCount = uniqueImages.length - 6;

  const getImageHeight = (index: number) => {
    const count = uniqueImages.length;
    
    if (count === 1) return 'h-80 md:h-96';
    if (count === 2) return 'h-60 md:h-80';
    if (count === 3 && index === 0) return 'h-full'; // Full height for first image in 3-image layout
    if (count === 3) return 'h-[calc(50%-2px)]'; // Half height for other images in 3-image layout
    if (count === 5 && index === 0) return 'h-40 md:h-48'; // First image in 5-image layout
    if (count === 5 && index === 1) return 'h-full'; // Second image spans full height
    
    return 'h-32 md:h-40'; // Default height for grid items
  };

  return (
    <>
      <div 
        className={`${container} ${className} overflow-hidden`}
        style={{ 
          borderRadius,
          maxHeight: uniqueImages.length === 1 ? maxHeight : 'auto'
        }}
      >
        {displayImages.map((image, index) => (
          <motion.div
            key={index}
            className={`
              ${items[index]} 
              ${getImageHeight(index)}
              relative overflow-hidden bg-gray-100 cursor-pointer group
              ${showHoverEffects ? 'transition-all duration-300 hover:scale-[1.02]' : ''}
            `}
            onClick={() => handleImageClick(index)}
            whileHover={showHoverEffects ? { scale: 1.02 } : {}}
            whileTap={{ scale: 0.98 }}
          >
            <img
              src={image.url}
              alt={image.alt || `Image ${index + 1}`}
              className={`
                w-full h-full object-cover transition-all duration-300
                ${showHoverEffects ? 'group-hover:scale-110' : ''}
              `}
              loading={index < 2 ? 'eager' : 'lazy'}
            />
            
            {/* Hover Overlay */}
            {showHoverEffects && (
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="bg-white/90 backdrop-blur-sm rounded-full p-3">
                    <svg className="w-6 h-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                    </svg>
                  </div>
                </div>
              </div>
            )}

            {/* Show +N overlay for last image if there are more */}
            {index === 5 && remainingCount > 0 && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <span className="text-white text-2xl font-bold">+{remainingCount}</span>
              </div>
            )}

            {/* Custom overlay content */}
            {showOverlay && overlayContent && (
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end">
                <div className="p-4 text-white w-full">
                  {overlayContent}
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Image Modal */}
      <ImageModal
        images={uniqueImages}
        initialIndex={selectedImageIndex || 0}
        isOpen={selectedImageIndex !== null}
        onClose={() => setSelectedImageIndex(null)}
      />
    </>
  );
};

export default DynamicImageGrid;
export type { ImageItem, DynamicImageGridProps };