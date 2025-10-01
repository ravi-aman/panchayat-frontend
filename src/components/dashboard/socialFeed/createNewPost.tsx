import { BarChart, FileText, X, Camera, Calendar, MapPin } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { getUserFullName, User } from '../../../types/types';
import { useToast } from '../../../contexts/toast/toastContext';
import { useAuth } from '../../../contexts/AuthContext';
import { uploadFilesWithQueue, FileUploadResult } from '../../../utils/fileUpload.utils';
import PostService, { CreateEventData } from '../../../services/PostService';
import MediaEditorModal from './MediaEditorModal';
import CreateEventPostModal from './CreateEventPostModal'; // Import the new modal
import LocationPicker from '../../common/LocationPicker';
import { LocationInfo } from '../../../services/LocationService';

interface PollData {
  question: string;
  options: string[];
}

interface EventDataFromModal {
  title: string;
  description?: string;
  eventType: 'online' | 'in-person' | '';
  startTime: string;
  endTime?: string;
  location?: string;
  link?: { name: string };
  placeholderImageUrl?: string;
}

//@ts-ignore
const CreatePostModal: React.FC<{
  currentUser: User;
  setPosts: Function;
  onClose: () => void;
  pollData?: PollData;
  onPollClick?: () => void;
  // allow initial media to be File objects or pre-uploaded URL strings
  initialMediaFiles?: Array<File | string>;
  // New props for event posts
  eventData?: EventDataFromModal;
  onEventClick?: () => void;
}> = ({
  currentUser,
  setPosts,
  onClose,
  pollData,
  onPollClick,
  initialMediaFiles = [] as Array<File | string>,
  eventData: initialEventData, // Renamed to avoid conflict with state
  // onEventClick,
}) => {
  const [content, setContent] = useState<string>('');
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<LocationInfo | null>(null);

  const isPollPost = !!pollData;
  const [isEventPost, setIsEventPost] = useState(!!initialEventData);
  const [eventPostData, setEventPostData] = useState<EventDataFromModal | undefined>(
    initialEventData,
  );

  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editorAccept, setEditorAccept] = useState<string>('image/*');
  const [isEventModalOpen, setIsEventModalOpen] = useState(false); // State for event modal

  const [uploadedFilesInfo, setUploadedFilesInfo] = useState<FileUploadResult[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const toast = useToast();
  const { activeProfile } = useAuth();
  const modalRef = useRef<HTMLDivElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    const handleClickOutside = (event: MouseEvent) => {
      if (isEditorOpen || isEventModalOpen) return; // Don't close if editor or event modal is open
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
  }, [onClose, isEditorOpen, isEventModalOpen]);

  useEffect(() => {
    // Handle initial media files (from editor or event modal)
    const allInitialMedia: Array<File | string> = [];
    if (initialMediaFiles && initialMediaFiles.length > 0) {
      allInitialMedia.push(...initialMediaFiles);
    }
    if (eventPostData?.placeholderImageUrl) {
      allInitialMedia.push(eventPostData.placeholderImageUrl);
    }

    if (allInitialMedia.length > 0) {
      setMediaPreviews([]);
      setMediaFiles([]);
      setUploadedFilesInfo([]);

      allInitialMedia.forEach((f) => {
        if (f instanceof File) {
          handleFileUpload(f);
        } else if (typeof f === 'string' && f.length) {
          setMediaPreviews((p) => [...p, f]);
          setUploadedFilesInfo((u) => [
            ...u,
            {
              url: f,
              filename: 'placeholder-image', // Use a generic filename for placeholders
              size: 0,
              mimeType: 'image/jpeg', // Assume jpeg for now, can be improved
              key: '',
              order: 1,
              publicUrl: f,
              metadata: {},
            },
          ]);
        }
      });
    }

    return () => {
      mediaPreviews.forEach((p) => {
        try {
          if (p.startsWith('blob:')) URL.revokeObjectURL(p);
        } catch (e) {}
      });
    };
  }, [initialMediaFiles?.length, eventPostData?.placeholderImageUrl]);

  const handleFileUpload = async (file: File) => {
    const isDuplicate = mediaFiles.some((f) => f.name === file.name && f.size === file.size);
    if (isDuplicate) return;

    const preview = file.type.startsWith('image/')
      ? await new Promise<string>((res) => {
          const r = new FileReader();
          r.onloadend = () => res(r.result as string);
          r.readAsDataURL(file);
        })
      : URL.createObjectURL(file);

    setMediaPreviews((p) => [...p, preview]);
    setMediaFiles((m) => [...m, file]);

    try {
      setIsUploading(true);
      const results = await uploadFilesWithQueue([file], {
        folder: 'posts',
        userMetadata: {
          'alt-text': `Post media by ${getUserFullName(currentUser)}`,
          context: 'post',
        },
      });

      if (results && results.length > 0) {
        setUploadedFilesInfo((prev) => [...prev, results[0]]);
      }
    } catch (err) {
      console.error('Upload failed:', err);
      toast.open({
        message: {
          heading: 'Upload Failed',
          content: 'Failed to upload file. Please try again.',
        },
        duration: 5000,
        position: 'top-center',
        color: 'error',
      });
    } finally {
      setIsUploading(false);
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

  const handleEditorNext = async (orderedFiles: File[]) => {
    if (orderedFiles.length === 0) {
      setIsEditorOpen(false);
      return;
    }

    try {
      setIsUploading(true);

      const previews = await Promise.all(
        orderedFiles.map(async (file) => {
          if (file.type.startsWith('image/')) {
            return new Promise<string>((res) => {
              const r = new FileReader();
              r.onloadend = () => res(r.result as string);
              r.readAsDataURL(file);
            });
          }
          return URL.createObjectURL(file);
        }),
      );

      setMediaPreviews((prev) => [...prev, ...previews]);
      setMediaFiles((prev) => [...prev, ...orderedFiles]);

      const results = await uploadFilesWithQueue(orderedFiles, {
        folder: 'posts',
        userMetadata: {
          'alt-text': `Post media by ${getUserFullName(currentUser)}`,
          context: 'post',
        },
      });

      if (results && results.length > 0) {
        setUploadedFilesInfo((prev) => [...prev, ...results]);
      }
    } catch (err) {
      console.error('Upload failed:', err);
      toast.open({
        message: {
          heading: 'Upload Failed',
          content: 'Failed to upload files. Please try again.',
        },
        duration: 5000,
        position: 'top-center',
        color: 'error',
      });
    } finally {
      setIsUploading(false);
      setIsEditorOpen(false);
    }
  };

  const handleCreateEventClick = () => {
    setIsEventModalOpen(true);
  };

  const handleCreateEvent = (eventData: EventDataFromModal) => {
    setEventPostData(eventData);
    setIsEventPost(true);
    // If content is empty, pre-fill with event title
    if (!content.trim() && eventData.title) {
      setContent(eventData.title);
    }
    setIsEventModalOpen(false);
    // The initialMediaFiles useEffect will handle the placeholderImageUrl
  };

  const handleCreatePost = async () => {
    if (!content.trim() && !isPollPost && !isEventPost) {
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

    // Require images for standard posts
    if (!isPollPost && !isEventPost && uploadedFilesInfo.length === 0) {
      toast.open({
        message: {
          heading: 'Image Required',
          content: 'Please add at least one image to describe your issue.',
        },
        duration: 5000,
        position: 'top-center',
        color: 'warning',
      });
      return;
    }

    if (isPollPost && !content.trim()) {
      setContent(pollData?.question || 'Poll');
    }

    if (isEventPost && !content.trim()) {
      setContent(eventPostData?.title || 'Event Post');
    }

    if (!activeProfile) {
      toast.open({
        message: {
          heading: 'Profile Required',
          content: 'Please select an active profile to post.',
        },
        duration: 5000,
        position: 'top-center',
        color: 'error',
      });
      return;
    }

    try {
      setIsUploading(true);

      let postData: any = {
        content: content.trim(),
        author: activeProfile._id, // Use active profile ID
        privacy: 'public',
      };

      // Add location if selected
      if (selectedLocation) {
        postData.location = {
          name: selectedLocation.name,
          coordinates: selectedLocation.coordinates,
          address: selectedLocation.address,
          city: selectedLocation.city,
          state: selectedLocation.state,
          country: selectedLocation.country,
        };
      }

      if (uploadedFilesInfo.length > 0) {
        postData.image = PostService.convertFilesToPostImages(uploadedFilesInfo);
      }

      let response;

      if (isPollPost && pollData) {
        const pollPostData = {
          ...postData,
          postType: 'poll',
          poll: {
            question: pollData.question,
            options: pollData.options.map((opt) => ({ text: opt })),
          },
        };
        response = await PostService.createPollPost(pollPostData);
      } else if (isEventPost && eventPostData) {
        const eventPostPayload: CreateEventData = {
          ...postData,
          postType: 'event',
          event: {
            title: eventPostData.title,
            description: eventPostData.description,
            eventType: eventPostData.eventType as 'online' | 'in-person',
            startTime: eventPostData.startTime,
            endTime: eventPostData.endTime,
            location: eventPostData.location,
            link: eventPostData.link,
          },
        };
        response = await PostService.createEventPost(eventPostPayload);
      } else {
        response = await PostService.createStandardPost(postData);
      }

      if (response.status === 'success') {
        const newPostWithAuthor = {
          ...response.data,
          author: {
            _id: activeProfile._id,
            username: activeProfile.username,
            type: activeProfile.type,
            image: activeProfile.image,
            bio: activeProfile.bio,
            userData: {
              firstName: currentUser.firstName,
              lastName: currentUser.lastName,
              photo: currentUser.photo,
              email: currentUser.email,
            },
          },
        };
        setPosts((prev: any) => [newPostWithAuthor, ...prev]);
        resetForm();
        onClose();
        toast.open({
          message: {
            heading: isPollPost ? 'Poll Created' : isEventPost ? 'Event Created' : 'Post Created',
            content: `Your ${isPollPost ? 'poll' : isEventPost ? 'event' : 'post'} has been created successfully!`,
          },
          duration: 3000,
          position: 'top-center',
          color: 'success',
        });
      }
    } catch (error: any) {
      console.error('Error creating post:', error);

      const errorMessage =
        error.response?.data?.message || 'Failed to create post. Please try again.';

      toast.open({
        message: {
          heading: 'Failed to Create Post',
          content: errorMessage,
        },
        duration: 5000,
        position: 'top-center',
        color: 'error',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    setContent('');
    setMediaFiles([]);
    setMediaPreviews([]);
    setUploadedFilesInfo([]);
    setIsEventPost(false);
    setEventPostData(undefined);
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
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white">
          <div className="flex items-center space-x-3">
            <img
              src={currentUser.photo || '/logo.png'}
              alt={getUserFullName(currentUser)}
              className="w-12 h-12 rounded-full border border-gray-200"
            />
            <div>
              <h3 className="font-semibold text-gray-900">{getUserFullName(currentUser)}</h3>
              <p className="text-sm text-gray-500">
                {isPollPost
                  ? 'Create a new poll'
                  : isEventPost
                    ? 'Create a new event'
                    : 'Create a new post'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-50 rounded-lg transition-colors duration-200"
          >
            <X className="w-5 h-5 text-gray-400 hover:text-gray-600" />
          </button>
        </div>
        {/* Content Area */}
        <div className="flex flex-col flex-grow p-6 space-y-4 overflow-y-auto">
          <div className="relative">
            <textarea
              placeholder={
                isPollPost
                  ? 'Add a description for your poll...'
                  : isEventPost
                    ? 'Add details for your event...'
                    : "Post your issue (image required)"
              }
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full p-4 border border-gray-200 bg-white rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-gray-900 placeholder-gray-500 min-h-[120px]"
            />
            {content.length > 0 && (
              <div className="absolute bottom-3 right-3 text-xs text-gray-400">
                {content.length} characters
              </div>
            )}
          </div>

          {/* Location Picker */}
          <div className="space-y-2" data-location-picker>
            <LocationPicker
              selectedLocation={selectedLocation}
              onLocationSelect={setSelectedLocation}
              placeholder="Add location to your post..."
              className="w-full"
              showCurrentLocationButton={true}
            />
            {selectedLocation && (
              <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                <MapPin className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-blue-800 font-medium">
                  Post will include location: {selectedLocation.name}
                </span>
                <button
                  onClick={() => setSelectedLocation(null)}
                  className="ml-auto p-1 hover:bg-blue-200 rounded-full transition-colors"
                >
                  <X className="w-3 h-3 text-blue-600" />
                </button>
              </div>
            )}
          </div>

          {isPollPost && pollData && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
              <div className="flex items-center space-x-2">
                <BarChart className="w-5 h-5 text-blue-600" />
                <p className="font-semibold text-gray-900">Poll Preview</p>
              </div>
              <div className="bg-white rounded-lg p-3 border border-blue-200">
                <h4 className="font-medium text-gray-900 mb-3">{pollData.question}</h4>
                <div className="space-y-2">
                  {pollData.options.map((option, index) => (
                    <div
                      key={index}
                      className="flex items-center space-x-3 p-2 bg-gray-50 rounded-lg"
                    >
                      <div className="w-5 h-5 rounded-full border-2 border-gray-300"></div>
                      <span className="text-gray-700">{option}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {isEventPost && eventPostData && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
              <div className="flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                <p className="font-semibold text-gray-900">Event Preview</p>
              </div>
              <div className="bg-white rounded-lg p-3 border border-green-200">
                <h4 className="font-medium text-gray-900 mb-3">{eventPostData.title}</h4>
                {eventPostData.description && (
                  <p className="text-sm text-gray-700 mb-2">{eventPostData.description}</p>
                )}
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Type:</span> {eventPostData.eventType}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Starts:</span>{' '}
                  {new Date(eventPostData.startTime).toLocaleString()}
                </p>
                {eventPostData.endTime && (
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Ends:</span>{' '}
                    {new Date(eventPostData.endTime).toLocaleString()}
                  </p>
                )}
                {eventPostData.location && (
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Location:</span> {eventPostData.location}
                  </p>
                )}
                {eventPostData.link && (
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Link:</span>
                    <a
                      href={eventPostData.link.name}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline ml-1"
                    >
                      {eventPostData.link.name}
                    </a>
                  </p>
                )}
              </div>
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
        {!isPollPost && !isEventPost && uploadedFilesInfo.length === 0 && (
          <div className="px-6 py-2 bg-yellow-50 border-t border-yellow-200">
            <p className="text-xs text-yellow-700 text-center">
              📷 Please add at least one image to describe your issue
            </p>
          </div>
        )}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-1">
            <button
              onClick={() => openEditor('image/*,video/*')}
              className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-all duration-200"
            >
              <Camera className="h-5 w-5 text-gray-500 hover:text-gray-700" />
              <span className="text-sm font-medium text-gray-600 hover:text-gray-700">Media</span>
            </button>

            <label className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-all duration-200 cursor-pointer">
              <FileText className="h-5 w-5 text-gray-500 hover:text-gray-700" />
              <span className="text-sm font-medium text-gray-600 hover:text-gray-700">
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

            {/* Location button - Always show for all post types */}
            <button
              onClick={() => {
                // This button can be used to scroll to the location picker or highlight it
                const locationPicker = document.querySelector('[data-location-picker]');
                if (locationPicker) {
                  locationPicker.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-all duration-200 ${
                selectedLocation ? 'text-blue-600' : 'text-gray-600'
              }`}
            >
              <MapPin className={`h-5 w-5 ${selectedLocation ? 'text-blue-500' : 'text-gray-500'} hover:text-gray-700`} />
              <span className={`text-sm font-medium ${selectedLocation ? 'text-blue-600' : 'text-gray-600'} hover:text-gray-700`}>
                {selectedLocation ? 'Location added' : 'Location'}
              </span>
            </button>

            {!isPollPost && !isEventPost && (
              <button
                onClick={onPollClick}
                className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-all duration-200 text-gray-600"
              >
                <BarChart className="h-5 w-5 text-gray-500 hover:text-gray-700" />
                <span className="text-sm font-medium text-gray-600 hover:text-gray-700">Poll</span>
              </button>
            )}

            {!isPollPost && !isEventPost && (
              <button
                onClick={handleCreateEventClick}
                className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-all duration-200 text-gray-600"
              >
                <Calendar className="h-5 w-5 text-gray-500 hover:text-gray-700" />
                <span className="text-sm font-medium text-gray-600 hover:text-gray-700">Event</span>
              </button>
            )}
          </div>

          <button
            onClick={handleCreatePost}
            disabled={(!content.trim() && !isPollPost && !isEventPost) || (!isPollPost && !isEventPost && uploadedFilesInfo.length === 0) || isUploading}
            className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading
              ? 'Creating...'
              : isPollPost
                ? 'Share Poll'
                : isEventPost
                  ? 'Share Event'
                  : 'Share Post'}
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
      {isEventModalOpen && (
        <CreateEventPostModal
          isOpen={isEventModalOpen}
          onClose={() => setIsEventModalOpen(false)}
          onCreateEvent={handleCreateEvent}
        />
      )}
    </motion.div>
  );
};

export default CreatePostModal;
