import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Calendar, Link, Clock } from 'lucide-react';
import LocationSelector from '../../common/LocationSelector';
import { useToast } from '../../../contexts/toast/toastContext';

interface EventData {
  title: string;
  description?: string;
  eventType: 'online' | 'in-person' | '';
  startTime: string;
  endTime?: string;
  location?: string;
  link?: { name: string };
  placeholderImageUrl?: string; // For the initial image selection
}

interface CreateEventPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateEvent: (eventData: EventData) => void;
}

const CreateEventPostModal: React.FC<CreateEventPostModalProps> = ({
  isOpen,
  onClose,
  onCreateEvent,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventType, setEventType] = useState<'online' | 'in-person' | ''>('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [location, setLocation] = useState('');
  const [link, setLink] = useState('');
  const [placeholderImageUrl, setPlaceholderImageUrl] = useState('');
  const modalRef = useRef<HTMLDivElement>(null);
  const toast = useToast();

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

  const handleCreateEvent = () => {
    // Normalize link (auto-prefix https:// if user omitted protocol) for validation and payload
    const rawLink = link.trim();
    const normalizedLink =
      rawLink && !/^https?:\/\//i.test(rawLink) ? `https://${rawLink}` : rawLink;

    // Basic validation (clear and in logical order)
    if (!title.trim()) {
      toast.open({
        message: { heading: 'Validation Error', content: 'Event title is required.' },
        duration: 3000,
        position: 'top-center',
        color: 'error',
      });
      return;
    }

    if (!eventType) {
      toast.open({
        message: { heading: 'Validation Error', content: 'Event type is required.' },
        duration: 3000,
        position: 'top-center',
        color: 'error',
      });
      return;
    }

    if (!startTime) {
      toast.open({
        message: { heading: 'Validation Error', content: 'Event start time is required.' },
        duration: 3000,
        position: 'top-center',
        color: 'error',
      });
      return;
    }

    // Ensure startTime is in the future (small tolerance of 30 seconds)
    if (new Date(startTime).getTime() - Date.now() <= -30 * 1000) {
      toast.open({
        message: {
          heading: 'Validation Error',
          content: 'Event start time must be in the future.',
        },
        duration: 3000,
        position: 'top-center',
        color: 'error',
      });
      return;
    }

    if (endTime && new Date(endTime) <= new Date(startTime)) {
      toast.open({
        message: {
          heading: 'Validation Error',
          content: 'Event end time must be after start time.',
        },
        duration: 3000,
        position: 'top-center',
        color: 'error',
      });
      return;
    }

    if (eventType === 'in-person' && !location.trim()) {
      toast.open({
        message: {
          heading: 'Validation Error',
          content: 'Location is required for in-person events.',
        },
        duration: 3000,
        position: 'top-center',
        color: 'error',
      });
      return;
    }

    if (eventType === 'online' && !rawLink) {
      toast.open({
        message: { heading: 'Validation Error', content: 'Link is required for online events.' },
        duration: 3000,
        position: 'top-center',
        color: 'error',
      });
      return;
    }

    if (normalizedLink && !/^https?:\/\/\S+$/.test(normalizedLink)) {
      toast.open({
        message: {
          heading: 'Validation Error',
          content: 'Please enter a valid URL for the event link.',
        },
        duration: 3000,
        position: 'top-center',
        color: 'error',
      });
      return;
    }

    // Convert start/end times from datetime-local (local string) to full ISO strings
    const isoStart = startTime ? new Date(startTime).toISOString() : startTime;
    const isoEnd = endTime ? new Date(endTime).toISOString() : undefined;

    const eventData: EventData = {
      title: title.trim(),
      description: description.trim() || undefined,
      eventType,
      startTime: isoStart,
      endTime: isoEnd || undefined,
      location: location.trim() || undefined,
      link: normalizedLink ? { name: normalizedLink } : undefined,
      placeholderImageUrl: placeholderImageUrl.trim() || undefined,
    };

    onCreateEvent(eventData);

    // Reset form after successful creation
    setTitle('');
    setDescription('');
    setEventType('');
    setStartTime('');
    setEndTime('');
    setLocation('');
    setLink('');
    setPlaceholderImageUrl('');
  };

  const isValid =
    Boolean(title.trim()) &&
    Boolean(eventType) &&
    Boolean(startTime) &&
    (eventType === 'in-person' ? Boolean(location.trim()) : true) &&
    // allow user to omit protocol in the input; we normalize before sending
    (eventType === 'online' ? Boolean(link.trim()) : true) &&
    // require start time to be roughly in the future (allow small tolerance)
    new Date(startTime).getTime() - Date.now() > -30 * 1000 &&
    (!endTime || new Date(endTime) > new Date(startTime));

  if (!isOpen) return null;

  return (
    <motion.div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-60"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        ref={modalRef}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-gray-100"
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Create Event Post</h3>
              <p className="text-sm text-gray-500">Organize and share your event</p>
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
        <div className="flex-1 p-6 space-y-4 overflow-y-auto scrollbar-hide">
          {/* Event Title */}
          <div>
            <label htmlFor="event-title" className="block text-sm font-medium text-gray-700 mb-2">
              Event Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="event-title"
              placeholder="e.g., Startup Pitch Competition"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-3 border border-gray-200 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
              maxLength={200}
            />
          </div>

          {/* Event Description */}
          <div>
            <label
              htmlFor="event-description"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Description (Optional)
            </label>
            <textarea
              id="event-description"
              placeholder="Tell us more about your event..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-3 border border-gray-200 bg-white rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 min-h-[80px]"
              maxLength={2000}
            />
          </div>

          {/* Event Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Event Type <span className="text-red-500">*</span>
            </label>
            <div className="flex space-x-4">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  className="form-radio text-blue-600"
                  name="eventType"
                  value="online"
                  checked={eventType === 'online'}
                  onChange={() => setEventType('online')}
                />
                <span className="ml-2 text-gray-700">Online</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  className="form-radio text-blue-600"
                  name="eventType"
                  value="in-person"
                  checked={eventType === 'in-person'}
                  onChange={() => setEventType('in-person')}
                />
                <span className="ml-2 text-gray-700">In-person</span>
              </label>
            </div>
          </div>

          {/* Location / Link based on Event Type */}
          {eventType === 'in-person' && (
            <div>
              <LocationSelector
                label="Location"
                value={location}
                onChange={(val: string) => setLocation(val)}
                placeholder="e.g., Conference Hall A, New York"
                required={true}
                type="both"
              />
            </div>
          )}

          {eventType === 'online' && (
            <div>
              <label htmlFor="event-link" className="block text-sm font-medium text-gray-700 mb-2">
                Event Link <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="url"
                  id="event-link"
                  placeholder="e.g., https://zoom.us/my-event"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  className="w-full pl-10 p-3 border border-gray-200 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                />
              </div>
            </div>
          )}

          {/* Start Time */}
          <div>
            <label
              htmlFor="event-start-time"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Start Time <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="datetime-local"
                id="event-start-time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full pl-10 p-3 border border-gray-200 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
              />
            </div>
          </div>

          {/* End Time (Optional) */}
          <div>
            <label
              htmlFor="event-end-time"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              End Time (Optional)
            </label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="datetime-local"
                id="event-end-time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full pl-10 p-3 border border-gray-200 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
              />
            </div>
          </div>

          {/* Placeholder Image URL */}
          {/* <div>
            <label htmlFor="placeholder-image" className="block text-sm font-medium text-gray-700 mb-2">
              Placeholder Image URL (Optional)
            </label>
            <div className="relative">
              <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="url"
                id="placeholder-image"
                placeholder="e.g., https://example.com/event-banner.jpg"
                value={placeholderImageUrl}
                onChange={(e) => setPlaceholderImageUrl(e.target.value)}
                className="w-full pl-10 p-3 border border-gray-200 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
              />
            </div>
            {placeholderImageUrl && (
              <div className="mt-3 rounded-lg overflow-hidden border border-gray-200">
                <img src={placeholderImageUrl} alt="Placeholder Preview" className="w-full h-32 object-cover" />
              </div>
            )}
          </div> */}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end p-6 border-t border-gray-200 bg-gray-50 space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium rounded-lg hover:bg-gray-100 transition-all duration-200"
          >
            Cancel
          </button>
          <button
            onClick={handleCreateEvent}
            disabled={!isValid}
            className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default CreateEventPostModal;
