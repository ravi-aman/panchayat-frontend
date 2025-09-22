import React from 'react';
import DOMPurify from 'dompurify';

interface SafeMessageProps {
  content: string;
  className?: string;
}

// Component to safely render user messages and prevent XSS
export const SafeMessage: React.FC<SafeMessageProps> = ({ content, className = '' }) => {
  // Sanitize HTML content to prevent XSS attacks
  const sanitizedContent = DOMPurify.sanitize(content, {
    ALLOWED_TAGS: [], // No HTML tags allowed
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
  });

  return (
    <div
      className={`break-all hyphens-auto min-w-0 flex-1 ${className}`}
      dangerouslySetInnerHTML={{ __html: sanitizedContent }}
    />
  );
};

// Hook for message validation
export const useMessageValidation = () => {
  const validateMessage = (content: string): { isValid: boolean; error?: string } => {
    if (!content || content.trim().length === 0) {
      return { isValid: false, error: 'Message cannot be empty' };
    }

    if (content.length > 1000) {
      return { isValid: false, error: 'Message too long (max 1000 characters)' };
    }

    // Check for suspicious patterns
    const suspiciousPatterns = [/<script/i, /javascript:/i, /on\w+\s*=/i, /data:text\/html/i];

    if (suspiciousPatterns.some((pattern) => pattern.test(content))) {
      return { isValid: false, error: 'Message contains invalid content' };
    }

    return { isValid: true };
  };

  return { validateMessage };
};
