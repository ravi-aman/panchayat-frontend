import React, { useEffect, useRef, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Trash2,
  Plus,
  Upload,
  X,
  Image as ImageIcon,
  Video,
} from 'lucide-react';

type MediaItem = {
  id: string;
  file: File;
  url: string;
  type: 'image' | 'video' | 'other';
};

type Props = {
  isOpen: boolean;
  initialFiles?: Array<File | string>;
  accept?: string; // e.g. "image/*,video/*"
  onClose: () => void;
  onNext: (orderedFiles: File[]) => void;
};

const getType = (file: File): MediaItem['type'] => {
  if (file.type.startsWith('image/')) return 'image';
  if (file.type.startsWith('video/')) return 'video';
  return 'other';
};

const MediaEditorModal: React.FC<Props> = ({
  isOpen,
  initialFiles = [],
  accept = 'image/*',
  onClose,
  onNext,
}) => {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const inputRef2 = useRef<HTMLInputElement | null>(null);
  const dragIndexRef = useRef<number | null>(null);
  const uniqueId = useRef(`media-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);

  useEffect(() => {
    // populate initial files
    if (initialFiles && initialFiles.length) {
      const mapped = initialFiles.map((f, i) => {
        if (typeof f === 'string') {
          // f is a URL
          const url = f;
          const inferredType: MediaItem['type'] = /\.(mp4|webm|ogg)$/i.test(url)
            ? 'video'
            : 'image';
          // create a placeholder File (name 'remote') to keep shape consistent
          return {
            id: `${Date.now()}-${i}`,
            file: new File([], 'remote'),
            url,
            type: inferredType,
          };
        }
        // f is File
        return { id: `${Date.now()}-${i}`, file: f, url: URL.createObjectURL(f), type: getType(f) };
      });
      setItems(mapped);
      setActiveIndex(0);
    }
  }, [initialFiles]);

  useEffect(() => {
    return () => {
      items.forEach((it) => URL.revokeObjectURL(it.url));
    };
  }, []);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const arr = Array.from(files).map((f, i) => ({
      id: `${Date.now()}-${i}`,
      file: f,
      url: URL.createObjectURL(f),
      type: getType(f),
    }));
    setItems((prev) => [...prev, ...arr]);
  };

  const onFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
    // clear so same file can be picked again
    if (inputRef.current) inputRef.current.value = '';
  };

  const onFileInput2 = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
    // clear so same file can be picked again
    if (inputRef2.current) inputRef2.current.value = '';
  };

  const moveLeft = (index: number) => {
    if (index <= 0) return;
    setItems((prev) => {
      const copy = [...prev];
      const tmp = copy[index - 1];
      copy[index - 1] = copy[index];
      copy[index] = tmp;
      return copy;
    });
    setActiveIndex((old) => {
      if (old === index) return index - 1;
      if (old === index - 1) return index;
      return old;
    });
  };

  const moveRight = (index: number) => {
    setItems((prev) => {
      if (index >= prev.length - 1) return prev;
      const copy = [...prev];
      const tmp = copy[index + 1];
      copy[index + 1] = copy[index];
      copy[index] = tmp;
      return copy;
    });
    setActiveIndex((old) => {
      if (old === index) return index + 1;
      if (old === index + 1) return index;
      return old;
    });
  };

  const removeAt = (index: number) => {
    setItems((prev) => {
      const copy = prev.filter((_, i) => i !== index);
      return copy;
    });
    setActiveIndex((old) => {
      if (old === index) return Math.max(0, old - 1);
      if (old > index) return old - 1;
      return old;
    });
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    dragIndexRef.current = index;
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    const from = dragIndexRef.current;
    if (from === null || from === undefined) return;
    setItems((prev) => {
      const copy = [...prev];
      const [moved] = copy.splice(from, 1);
      copy.splice(dropIndex, 0, moved);
      return copy;
    });
    setActiveIndex((old) => {
      if (old === from) return dropIndex;
      // if moving forward and old is between from+1..dropIndex, decrement
      if (from < dropIndex && old > from && old <= dropIndex) return old - 1;
      // if moving backward and old is between dropIndex..from-1, increment
      if (from > dropIndex && old >= dropIndex && old < from) return old + 1;
      return old;
    });
    dragIndexRef.current = null;
  };

  const handleNext = () => {
    onNext(items.map((i) => i.file));
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 z-50"
      onClick={onClose}
    >
      <div
        className="bg-white w-full h-[90vh] max-w-5xl rounded-2xl shadow-2xl border border-gray-100 overflow-auto scrollbar-hide"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-[#255df7]/5 to-purple-50">
          <div className="flex items-center space-x-3">
            {/* <div className="w-10 h-10 bg-gradient-to-br from-[#255df7] to-purple-600 rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div> */}
            <div>
              <h3 className="font-semibold text-gray-900">Media Editor</h3>
              <p className="text-sm text-gray-500">Organize and edit your media</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200 group"
          >
            <X className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
          </button>
        </div>
        <div className="p-6">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-8">
              <div className="w-24 h-24 bg-gradient-to-br from-[#255df7]/10 to-purple-100 rounded-2xl flex items-center justify-center mb-6">
                <Upload className="w-12 h-12 text-[#255df7]" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Upload Your Media</h3>
              <p className="text-gray-500 text-center mb-8 max-w-md">
                Share images or videos to make your post more engaging. Drag and drop or click to
                browse.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  ref={inputRef}
                  type="file"
                  accept={accept}
                  multiple
                  onChange={onFileInput}
                  className="hidden"
                  id={`${uniqueId.current}-input`}
                />
                <label
                  htmlFor={`${uniqueId.current}-input`}
                  className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-[#255df7] to-[#1e4fd6] text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-[#255df7]/25 transition-all duration-200 cursor-pointer transform hover:scale-105 active:scale-95"
                >
                  <ImageIcon className="w-5 h-5" />
                  <span>Choose Files</span>
                </label>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Main Preview */}
              <div className="bg-gray-50 rounded-2xl p-4">
                <div className="relative bg-white rounded-xl overflow-hidden shadow-sm">
                  {items[activeIndex] && items[activeIndex].type === 'image' ? (
                    <img
                      src={items[activeIndex].url}
                      alt="selected"
                      className="w-full h-80 object-contain"
                    />
                  ) : (
                    items[activeIndex] && (
                      <video
                        src={items[activeIndex].url}
                        controls
                        className="w-full h-80 object-contain"
                      />
                    )
                  )}
                  <div className="absolute top-3 left-3 px-3 py-1 bg-black/70 text-white text-sm rounded-full backdrop-blur-sm">
                    {activeIndex + 1} of {items.length}
                  </div>
                </div>
              </div>

              {/* Thumbnails */}
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-900 flex items-center space-x-2">
                  <div className="w-2 h-2 bg-[#255df7] rounded-full"></div>
                  <span>Media Gallery ({items.length})</span>
                </h4>
                <div className="flex gap-4 overflow-x-auto py-2 px-2 scrollbar-hide">
                  {items.map((it, idx) => (
                    <div key={it.id} className="flex-shrink-0">
                      <div
                        draggable
                        onDragStart={(e) => handleDragStart(e, idx)}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, idx)}
                        className={`relative group cursor-pointer transition-all duration-200 ${
                          activeIndex === idx
                            ? 'ring-3 ring-[#255df7] ring-offset-2 scale-105'
                            : 'hover:scale-105 hover:shadow-lg'
                        }`}
                      >
                        <div className="w-24 h-24 rounded-xl overflow-hidden bg-gray-100">
                          {it.type === 'image' ? (
                            <img
                              onClick={() => setActiveIndex(idx)}
                              src={it.url}
                              alt={`thumb-${idx}`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="relative w-full h-full">
                              <video
                                onClick={() => setActiveIndex(idx)}
                                src={it.url}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                <Video className="w-6 h-6 text-white" />
                              </div>
                            </div>
                          )}
                        </div>
                        {idx === 0 && (
                          <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs font-bold">1</span>
                          </div>
                        )}
                      </div>
                      <div className="flex justify-center mt-2 space-x-1">
                        <button
                          onClick={() => moveLeft(idx)}
                          disabled={idx === 0}
                          className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 group"
                          aria-label="Move left"
                        >
                          <ChevronLeft className="w-3 h-3 text-gray-600 group-hover:text-gray-800" />
                        </button>
                        <button
                          onClick={() => removeAt(idx)}
                          className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 transition-all duration-200 group"
                          aria-label="Remove"
                        >
                          <Trash2 className="w-3 h-3 text-red-500 group-hover:text-red-600" />
                        </button>
                        <button
                          onClick={() => moveRight(idx)}
                          disabled={idx === items.length - 1}
                          className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 group"
                          aria-label="Move right"
                        >
                          <ChevronRight className="w-3 h-3 text-gray-600 group-hover:text-gray-800" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Add More Button */}
                  <div className="flex-shrink-0">
                    <input
                      ref={inputRef2}
                      type="file"
                      accept={accept}
                      multiple
                      onChange={onFileInput2}
                      className="hidden"
                      id={`${uniqueId.current}-input-2`}
                    />
                    <label
                      htmlFor={`${uniqueId.current}-input-2`}
                      className="flex flex-col items-center justify-center w-24 h-24 rounded-xl border-2 border-dashed border-[#255df7]/30 text-[#255df7] cursor-pointer hover:bg-[#255df7]/5 transition-all duration-200 group"
                    >
                      <Plus className="w-6 h-6 group-hover:scale-110 transition-transform" />
                      <span className="text-xs font-medium mt-1">Add</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/50">
          <div className="text-sm text-gray-500">
            {items.length > 0 && `${items.length} file${items.length !== 1 ? 's' : ''} selected`}
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium rounded-lg hover:bg-gray-100 transition-all duration-200"
            >
              Cancel
            </button>
            <button
              onClick={handleNext}
              disabled={items.length === 0}
              className="px-6 py-2.5 bg-gradient-to-r from-[#255df7] to-[#1e4fd6] text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-[#255df7]/25 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none transform hover:scale-105 active:scale-95"
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MediaEditorModal;
