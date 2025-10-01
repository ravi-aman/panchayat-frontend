import React, { useState } from 'react';
import { createPortal } from 'react-dom';
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
const ImageModal: React.FC<ImageModalProps> = React.memo(({
  images,
  initialIndex,
  isOpen,
  onClose,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isLoading, setIsLoading] = useState(true);

  // Update current index when initialIndex changes
  React.useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      setIsLoading(true);
    }
  }, [initialIndex, isOpen]);

  // Prevent body scroll when modal is open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isOpen]);

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

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-95"
      onClick={onClose}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh'
      }}
    >
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-6 right-6 z-[10000] p-3 text-white hover:bg-white hover:bg-opacity-20 rounded-full transition-colors shadow-lg"
        style={{ fontSize: '24px' }}
      >
        <X className="w-8 h-8" />
      </button>

      {/* Navigation Buttons */}
      {images.length > 1 && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handlePrevious();
            }}
            className="absolute left-6 top-1/2 transform -translate-y-1/2 z-[10000] p-4 text-white hover:bg-white hover:bg-opacity-20 rounded-full transition-colors shadow-lg"
          >
            <ChevronLeft className="w-10 h-10" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            className="absolute right-6 top-1/2 transform -translate-y-1/2 z-[10000] p-4 text-white hover:bg-white hover:bg-opacity-20 rounded-full transition-colors shadow-lg"
          >
            <ChevronRight className="w-10 h-10" />
          </button>
        </>
      )}

      {/* Image Counter */}
      {images.length > 1 && (
        <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-[10000] px-4 py-2 bg-black bg-opacity-70 text-white text-lg font-medium rounded-full shadow-lg">
          {currentIndex + 1} of {images.length}
        </div>
      )}

      {/* Main Image Container */}
      <div
        className="relative flex items-center justify-center p-6 max-w-full max-h-full"
        onClick={(e) => e.stopPropagation()}
      >
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
        
        <img
          src={images[currentIndex].url}
          alt={images[currentIndex].alt || `Image ${currentIndex + 1}`}
          className="max-w-[90vw] max-h-[90vh] object-contain shadow-2xl"
          onLoad={() => setIsLoading(false)}
          onError={() => setIsLoading(false)}
        />
      </div>

      {/* Action Bar */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-[10000] flex items-center gap-3 px-6 py-3 bg-black bg-opacity-70 rounded-full shadow-lg">
        <button
          onClick={handleDownload}
          className="p-3 text-white hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
          title="Download"
        >
          <Download className="w-6 h-6" />
        </button>
        <button
          onClick={() => {
            navigator.share?.({
              url: images[currentIndex].url,
              title: 'Shared Image',
            });
          }}
          className="p-3 text-white hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
          title="Share"
        >
          <Share2 className="w-6 h-6" />
        </button>
      </div>

      {/* Thumbnail Strip for multiple images */}
      {images.length > 1 && (
        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 z-[10000] flex gap-3 px-6 py-3 bg-black bg-opacity-70 rounded-full max-w-[90vw] overflow-x-auto scrollbar-hide">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIndex(index);
                setIsLoading(true);
              }}
              className={`flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border-3 transition-all ${
                index === currentIndex
                  ? 'border-white scale-110'
                  : 'border-transparent hover:border-white hover:border-opacity-50'
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
    </div>,
    document.body
  );
});

// Main Dynamic Image Grid Component
const DynamicImageGrid: React.FC<DynamicImageGridProps> = React.memo(({
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
          <div
            key={index}
            className={`
              ${items[index]} 
              ${getImageHeight(index)}
              relative overflow-hidden bg-gray-100 cursor-pointer group
              ${showHoverEffects ? 'transition-all duration-300 hover:scale-[1.02]' : ''}
            `}
            onClick={() => handleImageClick(index)}
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
          </div>
        ))}
      </div>

      {/* Image Modal */}
      {selectedImageIndex !== null && (
        <ImageModal
          key="image-modal"
          images={uniqueImages}
          initialIndex={selectedImageIndex}
          isOpen={true}
          onClose={() => setSelectedImageIndex(null)}
        />
      )}
    </>
  );
});

export default DynamicImageGrid;
export type { ImageItem, DynamicImageGridProps };