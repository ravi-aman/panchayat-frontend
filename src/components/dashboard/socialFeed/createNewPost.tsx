import { BarChart, FileText, Plus, X, Camera } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { getUserFullName, User } from '../../../types/types';
import { useToast } from '../../../contexts/toast/toastContext';
import MediaEditorModal from './MediaEditorModal';

//@ts-ignore
const CreatePostModal: React.FC<{
  currentUser: User;
  setPosts: Function;
  onClose: () => void;
  startWithPoll?: boolean;
  // allow initial media to be File objects or pre-uploaded URL strings
  initialMediaFiles?: Array<File | string>;
}> = ({
  currentUser,
  setPosts,
  onClose,
  startWithPoll = false,
  initialMediaFiles = [] as Array<File | string>,
}) => {
  const [content, setContent] = useState<string>('');
  // previews for ordered media (from editor or local selection)
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);

  const [isCreatingPoll, setIsCreatingPoll] = useState(startWithPoll);
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editorAccept, setEditorAccept] = useState<string>('image/*');

  const photoUrl: { key: string | null; url: string | null } = { key: null, url: null };

  const [uploadedFilesInfo, setUploadedFilesInfo] = useState<
    { key: string | null; url: string | null }[]
  >([]);
  const toast = useToast();
  const modalRef = useRef<HTMLDivElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    const handleClickOutside = (event: MouseEvent) => {
      if (isEditorOpen) return; // Don't close if editor is open
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEsc);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose, isEditorOpen]);

  useEffect(() => {
    // when editor provides initial media, ensure we show previews and upload files
    if (initialMediaFiles && initialMediaFiles.length) {
      // reset previous
      setMediaPreviews([]);
      setMediaFiles([]);
      setUploadedFilesInfo([]);

      initialMediaFiles.forEach((f) => {
        if (f instanceof File) {
          // avoid double-processing same file by name+size
          const already = mediaFiles.find((mf) => mf.name === f.name && mf.size === f.size);
          if (!already) handleFileUpload(f);
        } else if (typeof f === 'string' && f.length) {
          // existing URL (already uploaded) - prevent duplicates
          setMediaPreviews((p) => (p.includes(f) ? p : [...p, f]));
          setUploadedFilesInfo((u) =>
            u.find((x) => x.url === f) ? u : [...u, { key: null, url: f }],
          );
        }
      });
    }

    return () => {
      // revoke any object URLs we created
      mediaPreviews.forEach((p) => {
        try {
          if (p.startsWith('blob:')) URL.revokeObjectURL(p);
        } catch (e) {}
      });
    };
  }, [initialMediaFiles]);

  // ensure previews are unique and keep order
  useEffect(() => {
    if (mediaPreviews.length <= 1) return;
    setMediaPreviews((prev) => prev.filter((v, i) => prev.indexOf(v) === i));
  }, [mediaPreviews]);

  const handleFileUpload = async (file: File) => {
    // create preview immediately
    const preview = file.type.startsWith('image/')
      ? await new Promise<string>((res) => {
          const r = new FileReader();
          r.onloadend = () => res(r.result as string);
          r.readAsDataURL(file);
        })
      : URL.createObjectURL(file);

    setMediaPreviews((p) => [...p, preview]);
    setMediaFiles((m) => [...m, file]);

    // upload to backend
    try {
      const uploadData = new FormData();
      uploadData.append('file', file);
      uploadData.append('name', getUserFullName(currentUser) || 'sample');
      uploadData.append('context', 'Post');

      const res = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/file/upload`,
        uploadData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        },
      );

      if (res.data.status === 'success') {
        const innerRes = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/file/geturl`, {
          params: { key: res.data.key },
        });
        if (innerRes.data.status === 'success') {
          setUploadedFilesInfo((prev) => [...prev, { key: res.data.key, url: innerRes.data.url }]);
        } else {
          setUploadedFilesInfo((prev) => [...prev, { key: res.data.key, url: null }]);
        }
      }
    } catch (err) {
      console.error('upload failed', err);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      files.forEach((f) => handleFileUpload(f));
    }
  };

  const openEditor = (accept: string = 'image/*') => {
    setEditorAccept(accept);
    setIsEditorOpen(true);
  };

  const closeEditor = () => {
    setIsEditorOpen(false);
  };

  const handleEditorNext = (orderedFiles: File[]) => {
    orderedFiles.forEach((f) => handleFileUpload(f));
    setIsEditorOpen(false);
  };

  const handlePollOptionChange = (index: number, value: string) => {
    const newOptions = [...pollOptions];
    newOptions[index] = value;
    setPollOptions(newOptions);
  };

  const addPollOption = () => {
    setPollOptions([...pollOptions, '']);
  };

  const removePollOption = (index: number) => {
    if (pollOptions.length > 2) {
      const newOptions = pollOptions.filter((_, i) => i !== index);
      setPollOptions(newOptions);
    }
  };

  const handleCreatePost = async () => {
    if (!content.trim()) {
      toast.open({
        message: {
          heading: 'Post Content Required',
          content: 'Post content cannot be empty.',
        },
        duration: 5000,
        position: 'top-center',
        color: 'warning',
      });
      return;
    }

    if (mediaFiles.length === 0 && !isCreatingPoll) {
      toast.open({
        message: {
          heading: 'Media Required',
          content: 'Please upload at least one image or video.',
        },
        duration: 5000,
        position: 'top-center',
        color: 'error',
      });
      return;
    }

    const newPost: any = {
      content,
      likes: [],
      comments: [],
      author: {
        _id: currentUser._id,
        name: getUserFullName(currentUser),
        photo: currentUser.photo,
      },
      // keep backward-compatible single image (first uploaded), and include images array
      image: uploadedFilesInfo[0] || photoUrl,
      images: uploadedFilesInfo,
      poll: isCreatingPoll ? { question: content, options: pollOptions } : undefined,
    };

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/post/new`,
        newPost,
      );
      if (response.status === 201) {
        const { data } = response.data;
        setPosts((prev: any) => [data.post, ...prev]);
        setContent('');
        setMediaFiles([]);
        setMediaPreviews([]);
        setUploadedFilesInfo([]);
        onClose();
      }
    } catch (error) {
      console.error('Error creating post:', error);
      toast.open({
        message: {
          heading: 'Failed to Create Post',
          content: 'Failed to create post. Please try again.',
        },
        duration: 5000,
        position: 'top-center',
        color: 'error',
      });
    }
  };

  return (
    <motion.div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        ref={modalRef}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden border border-gray-100"
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gradient-to-r from-[#255df7]/5 to-purple-50">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <img
                src={currentUser.photo || '/logo.png'}
                alt={getUserFullName(currentUser)}
                className="w-12 h-12 rounded-full border-2 border-white shadow-sm"
              />
              {/* <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-[#255df7] rounded-full flex items-center justify-center">
                <Sparkles className="w-2.5 h-2.5 text-white" />
              </div> */}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{getUserFullName(currentUser)}</h3>
              <p className="text-sm text-gray-500">Share your thoughts</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200 group"
          >
            <X className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
          </button>
        </div>
        {/* Content Area */}
        <div className="flex flex-col flex-grow p-6 space-y-4 overflow-y-auto">
          <div className="relative">
            <textarea
              placeholder={isCreatingPoll ? 'Ask a question...' : "What's on your mind?"}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full p-4 border-0 bg-gray-50 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-[#255df7]/20 focus:bg-white transition-all duration-200 text-gray-900 placeholder-gray-500 min-h-[120px]"
            />
            {content.length > 0 && (
              <div className="absolute bottom-3 right-3 text-xs text-gray-400">
                {content.length} characters
              </div>
            )}
          </div>

          {isCreatingPoll && (
            <div className="bg-gradient-to-br from-[#255df7]/5 to-purple-50 rounded-xl p-4 space-y-3">
              <div className="flex items-center space-x-2">
                <BarChart className="w-5 h-5 text-[#255df7]" />
                <p className="font-semibold text-gray-900">Poll Options</p>
              </div>
              {pollOptions.map((option, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className="w-6 h-6 rounded-full bg-[#255df7]/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-medium text-[#255df7]">{index + 1}</span>
                  </div>
                  <input
                    type="text"
                    placeholder={`Option ${index + 1}`}
                    value={option}
                    onChange={(e) => handlePollOptionChange(index, e.target.value)}
                    className="flex-1 p-3 border-0 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#255df7]/20 transition-all duration-200"
                  />
                  {pollOptions.length > 2 && (
                    <button
                      onClick={() => removePollOption(index)}
                      className="p-2 hover:bg-red-50 rounded-lg transition-colors duration-200 group"
                    >
                      <X className="h-4 w-4 text-gray-400 group-hover:text-red-500" />
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={addPollOption}
                className="flex items-center space-x-2 p-3 border border-dashed border-[#255df7]/30 rounded-lg hover:bg-[#255df7]/5 transition-all duration-200 w-full group"
              >
                <Plus className="h-4 w-4 text-[#255df7] group-hover:scale-110 transition-transform" />
                <span className="text-[#255df7] font-medium">Add Option</span>
              </button>
            </div>
          )}

          {mediaPreviews.length > 0 && (
            <div className="bg-gray-50 rounded-xl p-4">
              {mediaPreviews.length === 1 ? (
                <div className="rounded-xl overflow-hidden shadow-sm">
                  {mediaPreviews[0].startsWith('data:image') ||
                  mediaPreviews[0].startsWith('blob:') ? (
                    <img
                      src={mediaPreviews[0]}
                      alt="preview"
                      className="w-full max-h-[300px] object-cover"
                    />
                  ) : (
                    <video
                      src={mediaPreviews[0]}
                      controls
                      className="w-full max-h-[300px] object-cover"
                    />
                  )}
                </div>
              ) : (
                <div className="grid gap-2 rounded-xl overflow-hidden">
                  <div className="w-full">
                    {mediaPreviews[0].startsWith('data:image') ||
                    mediaPreviews[0].startsWith('blob:') ? (
                      <img
                        src={mediaPreviews[0]}
                        alt="preview-0"
                        className="w-full h-40 object-cover rounded-lg shadow-sm"
                      />
                    ) : (
                      <video
                        src={mediaPreviews[0]}
                        controls
                        className="w-full h-40 object-cover rounded-lg shadow-sm"
                      />
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {mediaPreviews.slice(1, 3).map((preview, idx) => (
                      <div key={idx + 1} className="relative">
                        {preview.startsWith('data:image') || preview.startsWith('blob:') ? (
                          <img
                            src={preview}
                            alt={`preview-${idx + 1}`}
                            className="w-full h-20 object-cover rounded-lg shadow-sm"
                          />
                        ) : (
                          <video
                            src={preview}
                            controls
                            className="w-full h-20 object-cover rounded-lg shadow-sm"
                          />
                        )}
                        {idx === 1 && mediaPreviews.length > 3 && (
                          <div className="absolute inset-0 bg-black/60 rounded-lg flex items-center justify-center">
                            <span className="text-white text-lg font-semibold">
                              +{mediaPreviews.length - 3}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-100 bg-gray-50/50">
          <div className="flex items-center space-x-1">
            <button
              onClick={() => openEditor('image/*,video/*')}
              className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-[#255df7]/10 transition-all duration-200 group"
            >
              <Camera className="h-5 w-5 text-gray-500 group-hover:text-[#255df7] transition-colors" />
              <span className="text-sm font-medium text-gray-600 group-hover:text-[#255df7] transition-colors">
                Media
              </span>
            </button>

            <label className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-green-50 transition-all duration-200 group cursor-pointer">
              <FileText className="h-5 w-5 text-gray-500 group-hover:text-green-600 transition-colors" />
              <span className="text-sm font-medium text-gray-600 group-hover:text-green-600 transition-colors">
                Document
              </span>
              <input
                ref={documentInputRef}
                type="file"
                accept=".pdf,.doc,.docx"
                className="hidden"
                onChange={handleFileChange}
              />
            </label>

            <button
              onClick={() => setIsCreatingPoll(!isCreatingPoll)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 group ${
                isCreatingPoll
                  ? 'bg-[#255df7]/10 text-[#255df7]'
                  : 'hover:bg-purple-50 text-gray-600'
              }`}
            >
              <BarChart
                className={`h-5 w-5 transition-colors ${
                  isCreatingPoll ? 'text-[#255df7]' : 'text-gray-500 group-hover:text-purple-600'
                }`}
              />
              <span
                className={`text-sm font-medium transition-colors ${
                  isCreatingPoll ? 'text-[#255df7]' : 'text-gray-600 group-hover:text-purple-600'
                }`}
              >
                Poll
              </span>
            </button>
          </div>

          <button
            onClick={handleCreatePost}
            disabled={!content.trim()}
            className="px-6 py-2.5 bg-gradient-to-r from-[#255df7] to-[#1e4fd6] text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-[#255df7]/25 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none transform hover:scale-105 active:scale-95"
          >
            Share Post
          </button>
        </div>
      </motion.div>
      {isEditorOpen && (
        <MediaEditorModal
          isOpen={isEditorOpen}
          accept={editorAccept}
          onClose={closeEditor}
          onNext={handleEditorNext}
        />
      )}
    </motion.div>
  );
};

export default CreatePostModal;
