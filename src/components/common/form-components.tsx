import {
  AlertCircle,
  Check,
  FileText,
  ImageIcon,
  Link,
  Loader2,
  Plus,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { uploadFile, uploadFilesWithQueue, validateFile } from '../../utils/fileUpload.utils';
import { FundDocument } from '../../pages/dashboardPages/funds/FundCreateForm';
const InputField: React.FC<{
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  type?: string;
  placeholder?: string;
  icon?: React.ReactNode;
  error?: string;
  min?: string;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  className?: string;
}> = ({
  label,
  name,
  value,
  onChange,
  required,
  type = 'text',
  placeholder,
  icon,
  error,
  min,
  onKeyDown,
  className = '',
}) => (
  <div className={`space-y-1 ${className}`}>
    <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
      {icon}
      {label}
      {required && <span className="text-red-500">*</span>}
    </label>
    <input
      name={name}
      type={type}
      value={value}
      onChange={onChange}
      required={required}
      placeholder={placeholder}
      min={min}
      onKeyDown={onKeyDown}
      className={`w-full px-3 py-2.5 text-sm border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
        error ? 'border-red-300 bg-red-50' : 'border-slate-300 hover:border-slate-400'
      }`}
    />
    {error && (
      <div className="flex items-center gap-1 text-xs text-red-600">
        <AlertCircle className="w-3 h-3" />
        {error}
      </div>
    )}
  </div>
);

const TextAreaField: React.FC<{
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  required?: boolean;
  placeholder?: string;
  rows?: number;
  error?: string;
}> = ({ label, name, value, onChange, required, placeholder, rows = 3, error }) => (
  <div className="space-y-1">
    <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
      <FileText className="w-4 h-4" />
      {label}
      {required && <span className="text-red-500">*</span>}
    </label>
    <textarea
      name={name}
      value={value}
      onChange={onChange}
      required={required}
      placeholder={placeholder}
      rows={rows}
      className={`w-full px-3 py-2.5 text-sm border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
        error ? 'border-red-300 bg-red-50' : 'border-slate-300 hover:border-slate-400'
      }`}
    />
    {error && (
      <div className="flex items-center gap-1 text-xs text-red-600">
        <AlertCircle className="w-3 h-3" />
        {error}
      </div>
    )}
  </div>
);

const SelectField: React.FC<{
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  required?: boolean;
  options: { value: string; label: string; description?: string }[];
  icon?: React.ReactNode;
}> = ({ label, name, value, onChange, required, options, icon }) => (
  <div className="space-y-1">
    <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
      {icon}
      {label}
      {required && <span className="text-red-500">*</span>}
    </label>
    <select
      name={name}
      value={value}
      onChange={onChange}
      required={required}
      title={`Select ${label}`}
      aria-label={label}
      className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
    >
      <option value="">Select {label}</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  </div>
);
const cropImageToSquare = (file: File, img: HTMLImageElement): Promise<File> => {
  return new Promise((resolve, reject) => {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      const size = Math.min(img.width, img.height);
      canvas.width = size;
      canvas.height = size;

      const cropX = (img.width - size) / 2;
      const cropY = (img.height - size) / 2;

      ctx.drawImage(img, cropX, cropY, size, size, 0, 0, size, size);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const croppedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now(),
            });
            resolve(croppedFile);
          } else {
            reject(new Error('Failed to create cropped image blob'));
          }
        },
        file.type,
        0.9,
      );
    } catch (error) {
      reject(error);
    }
  });
};
const TagInput: React.FC<{
  label: string;
  tags: string[];
  onAdd: (tag: string) => void;
  onRemove: (index: number) => void;
  suggestions?: string[];
  icon?: React.ReactNode;
  placeholder?: string;
}> = ({ label, tags, onAdd, onRemove, suggestions = [], icon, placeholder }) => {
  const [input, setInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionRef = useRef<HTMLDivElement>(null);

  const filteredSuggestions = suggestions.filter(
    (s) => s.toLowerCase().includes(input.toLowerCase()) && !tags.includes(s),
  );

  const handleAdd = (tag: string) => {
    if (tag.trim() && !tags.includes(tag.trim())) {
      onAdd(tag.trim());
      setInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd(input);
    } else if (e.key === ',' || e.key === ';') {
      e.preventDefault();
      handleAdd(input);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionRef.current && !suggestionRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="space-y-1">
      <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
        {icon}
        {label}
      </label>
      <div className="relative">
        <input
          type="text"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setShowSuggestions(true);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowSuggestions(true)}
          placeholder={placeholder || `Add ${label.toLowerCase()}...`}
          aria-label={`Add ${label}`}
          className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {showSuggestions && filteredSuggestions.length > 0 && (
          <div
            ref={suggestionRef}
            className="absolute z-10 w-full mt-1 overflow-y-auto bg-white border rounded-lg shadow-lg border-slate-200 max-h-60"
          >
            {filteredSuggestions.map((suggestion, index) => (
              <button
                key={index}
                type="button"
                onClick={() => {
                  handleAdd(suggestion);
                  setShowSuggestions(false);
                }}
                className="w-full px-3 py-2 text-sm text-left transition-colors hover:bg-slate-50 focus:bg-slate-50 focus:outline-none"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Manual add button */}
      {input.trim() && !tags.includes(input.trim()) && (
        <button
          type="button"
          onClick={() => handleAdd(input)}
          className="mt-1 text-sm text-blue-600 hover:text-blue-800"
        >
          Add "{input}"
        </button>
      )}

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {tags.map((tag, index) => (
            <span
              key={index}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-full"
            >
              {tag}
              <button
                type="button"
                onClick={() => onRemove(index)}
                className="ml-1 text-blue-500 hover:text-blue-700"
                title={`Remove ${tag}`}
                aria-label={`Remove ${tag}`}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      <p className="text-xs text-slate-500">
        Press Enter or comma to add items, or click on suggestions
      </p>
    </div>
  );
};

const LogoUpload: React.FC<{
  value: string;
  onChange: (logo: string) => void;
  provider: string;
}> = ({ value, onChange, provider }) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(
    async (file: File) => {
      const validation = validateFile(file, {
        allowedTypes: ['image/jpeg', 'image/png', 'image/jpg'],
        maxSize: 5 * 1024 * 1024,
      });

      if (validation !== true) {
        setError(validation);
        return;
      }

      const img = new window.Image();
      img.src = URL.createObjectURL(file);
      img.onload = async () => {
        setError('');
        setUploading(true);

        try {
          const croppedFile = await cropImageToSquare(file, img);
          const result = await uploadFile(croppedFile, 'fund-logos', {
            name: `${provider || 'fund'}-logo-${Date.now()}`,
            context: 'Fund',
            provider: provider || 'unknown',
          });

          if (result?.publicUrl) {
            onChange(result.publicUrl);
          } else {
            setError('Upload failed - no key returned');
          }
        } catch (err) {
          setError('Upload failed');
          console.error(err);
        } finally {
          setUploading(false);
        }
      };
    },
    [provider, onChange],
  );

  return (
    <div className="space-y-1">
      <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
        <ImageIcon className="w-4 h-4" />
        Logo
        <span className="text-red-500">*</span>
      </label>

      <div className="flex items-center gap-4">
        <div
          onClick={() => fileInputRef.current?.click()}
          className={`flex items-center justify-center w-20 h-20 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
            uploading
              ? 'border-blue-300 bg-blue-50'
              : value
                ? 'border-green-300 bg-green-50'
                : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50'
          }`}
        >
          {uploading ? (
            <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
          ) : value ? (
            <Check className="w-6 h-6 text-green-500" />
          ) : (
            <Upload className="w-6 h-6 text-slate-400" />
          )}
        </div>

        <div className="flex-1">
          <div className="text-sm font-medium text-slate-700">
            {uploading
              ? 'Processing image...'
              : value
                ? 'Logo uploaded successfully'
                : 'Click to upload logo'}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            {uploading
              ? 'Cropping to square format and uploading'
              : value
                ? '✓ Automatically cropped to square format'
                : 'JPG, PNG up to 5MB. Will be auto-cropped to square.'}
          </div>
          {value && !uploading && (
            <div className="mt-1 font-mono text-xs break-all text-slate-600">Key: {value}</div>
          )}
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/jpg"
        className="hidden"
        title="Upload logo file"
        aria-label="Upload logo file"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileSelect(file);
        }}
      />

      {error && (
        <div className="flex items-center gap-1 text-xs text-red-600">
          <AlertCircle className="w-3 h-3" />
          {error}
        </div>
      )}
    </div>
  );
};

const URLsInput: React.FC<{
  urls: string[];
  onChange: (urls: string[]) => void;
  error?: string;
}> = ({ urls, onChange, error }) => {
  const addURL = () => {
    onChange([...urls, '']);
  };

  const updateURL = (index: number, value: string) => {
    const newUrls = [...urls];
    newUrls[index] = value;
    onChange(newUrls);
  };

  const removeURL = (index: number) => {
    if (index === 0) return; // Don't remove the first URL (apply link)
    const newUrls = urls.filter((_, i) => i !== index);
    onChange(newUrls);
  };

  return (
    <div className="space-y-1">
      <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
        <Link className="w-4 h-4" />
        Links & URLs
        <span className="text-red-500">*</span>
      </label>

      <div className="space-y-3">
        {urls.map((url, index) => (
          <div key={index} className="flex items-center gap-2">
            <div className="flex-1">
              <input
                type="url"
                value={url}
                onChange={(e) => updateURL(index, e.target.value)}
                placeholder={
                  index === 0 ? 'Application link (required)' : 'Additional link (optional)'
                }
                required={index === 0}
                className={`w-full px-3 py-2.5 text-sm border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  error && index === 0
                    ? 'border-red-300 bg-red-50'
                    : 'border-slate-300 hover:border-slate-400'
                }`}
              />
              {index === 0 && (
                <p className="mt-1 text-xs text-slate-500">
                  Primary application link where users can apply
                </p>
              )}
            </div>
            {index > 0 && (
              <button
                type="button"
                onClick={() => removeURL(index)}
                className="flex items-center justify-center text-red-500 transition-colors border border-red-200 rounded-lg w-9 h-9 hover:bg-red-50 hover:border-red-300"
                title="Remove URL"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}

        <button
          type="button"
          onClick={addURL}
          className="flex items-center gap-2 px-3 py-2 text-sm text-blue-600 transition-colors border border-blue-200 rounded-lg hover:bg-blue-50 hover:border-blue-300"
        >
          <Plus className="w-4 h-4" />
          Add Another Link
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-1 text-xs text-red-600">
          <AlertCircle className="w-3 h-3" />
          {error}
        </div>
      )}
    </div>
  );
};

const DocumentsUpload: React.FC<{
  documents: FundDocument[];
  onChange: (documents: FundDocument[]) => void;
  provider: string;
}> = ({ documents, onChange, provider }) => {
  const [uploading, setUploading] = useState<number[]>([]);
  const [errors, setErrors] = useState<Record<number, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(
    async (files: FileList) => {
      const fileArray = Array.from(files);
      const newDocuments: FundDocument[] = [];
      const uploadingIndices: number[] = [];

      fileArray.forEach((_, index) => {
        uploadingIndices.push(documents.length + index);
      });

      setUploading((prev) => [...prev, ...uploadingIndices]);
      setErrors({});

      try {
        const results = await uploadFilesWithQueue(fileArray, {
          folder: 'fund-documents',
          userMetadata: {
            context: 'Fund Documents',
            provider: provider || 'unknown',
          },
        });

        results.forEach((result, index) => {
          newDocuments.push({
            name: fileArray[index].name,
            url: result.url,
            type: result.mimeType,
            size: result.size,
            key: result.key,
          });
        });

        onChange([...documents, ...newDocuments]);
      } catch (err) {
        const error = err instanceof Error ? err.message : 'Upload failed';
        uploadingIndices.forEach((index) => {
          setErrors((prev) => ({ ...prev, [index]: error }));
        });
      } finally {
        setUploading((prev) => prev.filter((index) => !uploadingIndices.includes(index)));
      }
    },
    [documents, provider, onChange],
  );

  const removeDocument = (index: number) => {
    const newDocuments = documents.filter((_, i) => i !== index);
    onChange(newDocuments);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-1">
      <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
        <FileText className="w-4 h-4" />
        Supporting Documents
      </label>

      <div className="space-y-3">
        {documents.map((doc, index) => (
          <div
            key={index}
            className="flex items-center gap-3 p-3 border rounded-lg border-slate-200 bg-slate-50"
          >
            <FileText className="flex-shrink-0 w-5 h-5 text-slate-600" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate text-slate-700">{doc.name}</div>
              <div className="text-xs text-slate-500">
                {doc.type} {doc.size && `• ${formatFileSize(doc.size)}`}
              </div>
            </div>
            {uploading.includes(index) ? (
              <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
            ) : (
              <button
                type="button"
                onClick={() => removeDocument(index)}
                className="flex items-center justify-center w-8 h-8 text-red-500 transition-colors rounded-lg hover:bg-red-100"
                title="Remove document"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            {errors[index] && <div className="text-xs text-red-600">{errors[index]}</div>}
          </div>
        ))}

        <div
          onClick={() => fileInputRef.current?.click()}
          className="flex flex-col items-center justify-center w-full p-6 transition-colors border-2 border-dashed rounded-lg cursor-pointer border-slate-300 hover:border-slate-400 hover:bg-slate-50"
        >
          <Upload className="w-8 h-8 mb-2 text-slate-400" />
          <div className="text-sm font-medium text-slate-700">Click to upload documents</div>
          <div className="text-xs text-slate-500">PDF, DOC, DOCX up to 10MB each</div>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.doc,.docx,.txt,.rtf"
        className="hidden"
        title="Upload document files"
        aria-label="Upload document files"
        onChange={(e) => {
          const files = e.target.files;
          if (files && files.length > 0) handleFileSelect(files);
        }}
      />

      <p className="text-xs text-slate-500">
        Upload terms & conditions, application guidelines, or other relevant documents
      </p>
    </div>
  );
};

export { InputField, TextAreaField, SelectField, TagInput, LogoUpload, URLsInput, DocumentsUpload };
