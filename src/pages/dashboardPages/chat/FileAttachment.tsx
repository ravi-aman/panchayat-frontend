import React from 'react';
import { FileAttachment as FileAttachmentType } from '../../../types/ChatTypes';
import { Download, ExternalLink } from 'lucide-react';
// import { getRelativeTime, getFullTime } from '../../../utils/timeUtils';

interface FileAttachmentProps {
  attachment: FileAttachmentType;
  isCurrentUser: boolean;
}

const FileAttachment: React.FC<FileAttachmentProps> = ({ attachment, isCurrentUser }) => {
  const isImage = attachment.type.startsWith('image/');
  const isVideo = attachment.type.startsWith('video/');
  // Use emoji or fallback for file icon
  function getFileIcon(mimeType: string): string {
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType.startsWith('video/')) return '🎥';
    if (mimeType === 'application/pdf') return '📄';
    if (mimeType.includes('word') || mimeType.includes('document')) return '📝';
    if (mimeType.includes('sheet') || mimeType.includes('excel')) return '📊';
    if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return '📋';
    return '📎';
  }
  function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
  const fileIcon = getFileIcon(attachment.type);
  const fileSize = formatFileSize(attachment.size);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = attachment.url;
    link.download = attachment.name;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleView = () => {
    window.open(attachment.url, '_blank');
  };

  if (isImage) {
    return (
      <div className="max-w-xs rounded-lg overflow-hidden cursor-pointer" onClick={handleView}>
        <img
          src={attachment.url}
          alt={attachment.name}
          className="w-full h-auto max-h-64 object-cover"
          loading="lazy"
        />
        <div
          className={`p-2 text-xs ${isCurrentUser ? 'bg-blue-400 text-white' : 'bg-gray-100 text-gray-600'}`}
        >
          <div className="flex flex-row justify-between items-center gap-2 whitespace-nowrap">
            <span className="truncate max-w-[180px]">{attachment.name}</span>
            <span className="ml-2 flex-shrink-0">{fileSize}</span>
          </div>
        </div>
      </div>
    );
  }

  if (isVideo) {
    return (
      <div className="max-w-xs rounded-lg overflow-hidden">
        <video src={attachment.url} controls className="w-full h-auto max-h-64" preload="metadata">
          Your browser does not support the video tag.
        </video>
        <div
          className={`p-2 text-xs ${isCurrentUser ? 'bg-blue-400 text-white' : 'bg-gray-100 text-gray-600'}`}
        >
          <div className="flex flex-row justify-between items-center gap-2 whitespace-nowrap">
            <span className="truncate max-w-[180px]">{attachment.name}</span>
            <span className="ml-2 flex-shrink-0">{fileSize}</span>
          </div>
        </div>
      </div>
    );
  }

  // Document/File attachment
  return (
    <div
      className={`max-w-xs rounded-lg border ${isCurrentUser ? 'border-blue-300 bg-blue-50' : 'border-gray-200 bg-white'} p-3`}
    >
      <div className="flex items-center space-x-3">
        <div className="text-2xl">{fileIcon}</div>
        <div className="flex-1 min-w-0 flex flex-row justify-between items-center gap-2 whitespace-nowrap">
          <span
            className={`font-medium text-sm truncate max-w-[140px] ${isCurrentUser ? 'text-blue-900' : 'text-gray-900'}`}
          >
            {attachment.name}
          </span>
          <span
            className={`text-xs ml-2 flex-shrink-0 ${isCurrentUser ? 'text-blue-700' : 'text-gray-500'}`}
          >
            {fileSize}
          </span>
        </div>
        <div className="flex space-x-1">
          <button
            onClick={handleView}
            className={`p-1 rounded transition-colors duration-150 ${
              isCurrentUser
                ? 'text-blue-700 hover:bg-blue-100 hover:text-blue-900'
                : 'text-gray-500 hover:bg-gray-200 hover:text-gray-700'
            }`}
            title="View"
          >
            <ExternalLink size={16} />
          </button>
          <button
            onClick={handleDownload}
            className={`p-1 rounded transition-colors duration-150 ${
              isCurrentUser
                ? 'text-blue-700 hover:bg-blue-100 hover:text-blue-900'
                : 'text-gray-500 hover:bg-gray-200 hover:text-gray-700'
            }`}
            title="Download"
          >
            <Download size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default FileAttachment;
