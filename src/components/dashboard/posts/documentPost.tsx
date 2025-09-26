import React, { useState } from 'react';
import { FaHeart, FaCommentDots, FaArrowsRotate, FaLocationArrow, FaFile } from 'react-icons/fa6';
// react-pdf renderer
import {
  PDFViewer,
  Document as PDFDocument,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer';

// Styles for the generated PDF
const pdfStyles = StyleSheet.create({
  body: { padding: 20, fontSize: 12 },
  header: { marginBottom: 10 },
  title: { fontSize: 16, fontWeight: 'bold' },
  subtitle: { fontSize: 10, color: '#666' },
  section: { marginTop: 8 },
  label: { fontSize: 10, fontWeight: 'bold', marginBottom: 4 },
  text: { fontSize: 12, lineHeight: 1.4 },
});

// --- TYPE DEFINITIONS ---
interface User {
  name: string;
  headline: string;
  profilePicUrl: string;
}

interface Comment {
  id: string;
  user: User;
  text: string;
  timeAgo: string;
}

// --- NEW TYPE ---
// Defines the structure for a document attachment
interface Document {
  name: string;
  type: string; // e.g., 'PDF', 'DOCX'
  size: string; // e.g., '1.2 MB'
  url: string; // Link to the document
}

interface PostProps {
  author: User;
  timeAgo: string;
  postText: string;
  document?: Document; // Replaced 'images' with 'document' (optional)
  commentsCount: number;
  repostsCount: number;
  likedByUsers?: string[];
  comments: Comment[];
}

// --- THE COMPONENT ---
const DocumentPost: React.FC<PostProps> = ({
  author,
  timeAgo,
  postText,
  document, // Use the document prop
  commentsCount,
  repostsCount,
  likedByUsers,
  comments,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const maxLength = 80; // Character limit before showing "...more"

  const shouldTruncate = postText.length > maxLength;
  const displayText = shouldTruncate && !isExpanded ? postText.slice(0, maxLength) : postText;
  const [previewOpen, setPreviewOpen] = useState(false);

  // Simple example PDF document built from the post's text and author
  const MyPdfDocument: React.FC = () => (
    <PDFDocument>
      <Page style={pdfStyles.body} size="A4">
        <View style={pdfStyles.header}>
          <Text style={pdfStyles.title}>{author.name}</Text>
          <Text style={pdfStyles.subtitle}>
            {author.headline} • {timeAgo}
          </Text>
        </View>
        <View style={pdfStyles.section}>
          <Text style={pdfStyles.text}>{postText}</Text>
        </View>
        {document && (
          <View style={pdfStyles.section}>
            <Text style={pdfStyles.label}>Attached document:</Text>
            <Text style={pdfStyles.text}>
              {document.name} ({document.type}, {document.size})
            </Text>
          </View>
        )}
      </Page>
    </PDFDocument>
  );

  const handleTogglePreview = () => setPreviewOpen((s) => !s);

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm w-full font-sans mb-4">
      <div className="p-3 sm:p-4">
        {/* Post Header */}
        <div className="flex items-center mb-3 sm:mb-4">
          <img
            src={author.profilePicUrl}
            alt={author.name}
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-full mr-3 sm:mr-4 flex-shrink-0"
          />
          <div className="flex-grow min-w-0">
            <p className="font-bold text-gray-900 text-sm sm:text-base truncate">{author.name}</p>
            <p className="text-xs sm:text-sm text-gray-500 truncate">{author.headline}</p>
            <p className="text-xs text-gray-500">{timeAgo}</p>
          </div>
          <button className="text-blue-600 font-semibold hover:text-blue-800 text-xs sm:text-sm flex-shrink-0 ml-4">
            + Follow
          </button>
        </div>

        {/* Post Body */}
        <div className="mb-2 w-full overflow-hidden">
          <p className="text-gray-800 text-sm whitespace-pre-wrap break-words w-full">
            {displayText}
            {shouldTruncate && !isExpanded && (
              <button
                onClick={() => setIsExpanded(true)}
                className="text-blue-600 hover:text-blue-800 ml-1 font-medium"
              >
                ...more
              </button>
            )}
            {shouldTruncate && isExpanded && (
              <button
                onClick={() => setIsExpanded(false)}
                className="text-blue-600 hover:text-blue-800 ml-2 font-medium"
              >
                Show less
              </button>
            )}
          </p>
        </div>

        {/* Document Preview (Replaces Image Grid) */}
        {document && (
          <div className="my-2">
            <div className="flex items-center justify-between p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200">
              <div className="flex items-center">
                <FaFile className="w-8 h-8 sm:w-10 sm:h-10 text-gray-500 mr-4 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="font-semibold text-sm text-gray-800 truncate">{document.name}</p>
                  <p className="text-xs text-gray-500">
                    {document.type} • {document.size}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleTogglePreview}
                  className="text-sm text-blue-600 hover:text-blue-800 px-3 py-1 border rounded"
                >
                  {previewOpen ? 'Close Preview' : 'Preview'}
                </button>
                <a
                  href={document.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-gray-600 hover:text-gray-800 px-3 py-1 border rounded"
                >
                  Open
                </a>
              </div>
            </div>

            {previewOpen && (
              <div className="mt-3">
                {/* If the document url ends with .pdf, use iframe. Otherwise render a generated PDF using PDFViewer. */}
                {document.url && document.url.toLowerCase().endsWith('.pdf') ? (
                  <div className="w-full" style={{ height: 500 }}>
                    <iframe
                      title="pdf-preview"
                      src={document.url}
                      className="w-full h-full border"
                    />
                  </div>
                ) : (
                  <div style={{ height: 600 }}>
                    <PDFViewer style={{ width: '100%', height: '100%' }}>
                      <MyPdfDocument />
                    </PDFViewer>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="px-3 sm:px-4 pb-3 sm:pb-4">
        {/* Engagement Stats */}
        <div className="flex justify-between items-center text-xs sm:text-sm text-gray-500 mb-2">
          <div className="flex items-center gap-1 min-w-0 flex-1">
            {likedByUsers && likedByUsers.length > 0 ? (
              <span className="flex items-center gap-1 truncate">
                <FaHeart className="text-red-500 w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                <span className="truncate">
                  {likedByUsers[0]}
                  {likedByUsers.length > 1 && ` and ${likedByUsers.length - 1} others`}
                </span>
              </span>
            ) : (
              <span></span>
            )}
          </div>
          <span className="flex-shrink-0 ml-2">{repostsCount} reposts</span>
          <span className="flex-shrink-0 ml-2">•</span>
          <span className="flex-shrink-0 ml-2">{commentsCount} comments</span>
        </div>

        {/* Action Buttons */}
        <div className="border-t border-gray-200 pt-2 flex justify-around">
          <button className="flex items-center space-x-1 sm:space-x-2 text-gray-600 hover:bg-gray-100 p-1 sm:p-2 rounded-md w-full justify-center text-xs sm:text-sm">
            <FaHeart className="w-3 h-3 sm:w-4 sm:h-4" />{' '}
            <span className="hidden sm:inline">Like</span>
          </button>
          <button className="flex items-center space-x-1 sm:space-x-2 text-gray-600 hover:bg-gray-100 p-1 sm:p-2 rounded-md w-full justify-center text-xs sm:text-sm">
            <FaCommentDots className="w-3 h-3 sm:w-4 sm:h-4" />{' '}
            <span className="hidden sm:inline">Comment</span>
          </button>
          <button className="flex items-center space-x-1 sm:space-x-2 text-gray-600 hover:bg-gray-100 p-1 sm:p-2 rounded-md w-full justify-center text-xs sm:text-sm">
            <FaArrowsRotate className="w-3 h-3 sm:w-4 sm:h-4" />{' '}
            <span className="hidden sm:inline">Repost</span>
          </button>
          <button className="flex items-center space-x-1 sm:space-x-2 text-gray-600 hover:bg-gray-100 p-1 sm:p-2 rounded-md w-full justify-center text-xs sm:text-sm">
            <FaLocationArrow className="w-3 h-3 sm:w-4 sm:h-4" />{' '}
            <span className="hidden sm:inline">Send</span>
          </button>
        </div>

        {/* Comments Section */}
        <div className="mt-3 sm:mt-4 space-y-2 sm:space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="flex items-start space-x-2">
              <img
                src={comment.user.profilePicUrl}
                alt={comment.user.name}
                className="w-6 h-6 sm:w-8 sm:h-8 rounded-full flex-shrink-0"
              />
              <div className="bg-gray-100 p-2 rounded-lg flex-grow min-w-0">
                <div className="flex justify-between items-start gap-2">
                  <p className="font-semibold text-xs sm:text-sm truncate flex-1">
                    {comment.user.name}
                  </p>
                  <p className="text-xs text-gray-500 flex-shrink-0">{comment.timeAgo}</p>
                </div>
                <p className="text-xs text-gray-500 mb-1 truncate max-w-[200px] sm:max-w-[300px]">
                  {comment.user.headline}
                </p>
                <p className="text-xs sm:text-sm text-gray-800 break-words">{comment.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DocumentPost;
