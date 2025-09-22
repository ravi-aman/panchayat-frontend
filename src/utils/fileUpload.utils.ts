// import axios from "axios";
import api from './api';

/**
 *  File Upload Utility with retries, queuing, concurrency and abort support.

 * Features:
 * - Upload multiple files using presigned URLs (S3)
 * - Retry failed uploads with exponential backoff
 * - Limit concurrent uploads (queue)
 * - Track per-file and batch progress
 * - Abort uploads with AbortController
 * - Fallback to direct upload if presigned upload fails
 */

export type FileMetaUser = Record<string, string>;

export type FileUploadResult = {
  url: string;
  filename: string;
  size: number;
  mimeType: string;
  key: string;
  order?: number;
  publicUrl: string;
  metadata: Record<string, any>;
};

export type UploadProgress =
  | {
      type: 'batch';
      progress: number; // 0-100 overall
      file?: File;
      index?: number;
      total?: number;
      stage?: 'requesting-url' | 'uploading' | 'verifying';
    }
  | {
      type: 'single';
      file?: File;
      progress: number; // 0-100 per file
      stage?: 'requesting-url' | 'uploading' | 'verifying';
    };

const API = {
  PRESIGNED_BATCH: `${import.meta.env.VITE_BACKEND_URL}/api/v2/uploads/generate-batch-urls`,
  PRESIGNED_VERIFY: (key: string) =>
    `${import.meta.env.VITE_BACKEND_URL}/api/v2/uploads/verify/${encodeURIComponent(key)}`,
  DIRECT_UPLOAD: `${import.meta.env.VITE_BACKEND_URL}/api/v2/posts`,
};

function getToken(): string | null {
  return localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
}

function getAuthHeader(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * Exponential backoff helper
 */
function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Upload a single file with retries via presigned URL.
 *
 * @param uploadUrl - presigned S3 URL
 * @param file - File to upload
 * @param maxRetries - number of retries
 * @param onProgress - callback for upload progress
 * @param abortController - optional for cancellation
 */
async function uploadWithRetry(
  uploadUrl: string,
  file: File,
  maxRetries = 3,
  onProgress?: (progress: number) => void,
  abortController?: AbortController,
): Promise<void> {
  const RETRY_DELAY_BASE = 1000; // 1 second

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await uploadToPresignedURL(uploadUrl, file, {
        onProgress: (e) => onProgress?.(e.progress),
        abortController,
      });
      return;
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      await wait(RETRY_DELAY_BASE * 2 ** (attempt - 1)); // exponential backoff
    }
  }
}

/**
 * Upload file to S3 via presigned URL with progress events and abort support
 */
function uploadToPresignedURL(
  presignedUrl: string,
  file: File,
  options?: {
    onProgress?: (e: { progress: number }) => void;
    abortController?: AbortController;
  },
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', presignedUrl);
    xhr.setRequestHeader('Content-Type', file.type);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && options?.onProgress) {
        options.onProgress({ progress: Math.round((event.loaded / event.total) * 100) });
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`Upload failed with status ${xhr.status}: ${xhr.statusText}`));
    };

    xhr.onerror = () => reject(new Error('Network error during file upload'));

    xhr.onabort = () => reject(new Error('Upload aborted'));

    if (options?.abortController) {
      options.abortController.signal.addEventListener('abort', () => {
        xhr.abort();
      });
    }

    xhr.send(file);
  });
}

/**
 * Upload multiple files with concurrency limit and retries.
 *
 * @param files - files to upload
 * @param options - upload options
 * @returns list of uploaded file metadata
 */
export async function uploadFilesWithQueue(
  files: File[],
  {
    folder = 'uploads',
    userMetadata,
    concurrency = 3,
    onProgress,
    abortController,
    fallbackToDirect = false,
    maxRetries = 3,
  }: {
    folder?: string;
    userMetadata?: FileMetaUser;
    concurrency?: number;
    onProgress?: (progress: UploadProgress) => void;
    abortController?: AbortController;
    fallbackToDirect?: boolean;
    maxRetries?: number;
  } = {},
): Promise<FileUploadResult[]> {
  if (!files || files.length === 0) throw new Error('No files provided');

  // Step 1: Request presigned URLs for all files
  onProgress?.({
    type: 'batch',
    progress: 0,
    stage: 'requesting-url',
    total: files.length,
  });

  let presignedResponse;
  try {
    const response = await api.post(
      API.PRESIGNED_BATCH,
      {
        files: files.map((file) => ({
          fileName: file.name,
          contentType: file.type,
          fileSize: file.size,
          metadata: {
            ...userMetadata,
            'alt-text': userMetadata?.['alt-text'] ?? `File: ${file.name}`,
          },
        })),
        folder,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        signal: abortController?.signal,
      },
    );

    presignedResponse = response.data;
  } catch (err) {
    if (!fallbackToDirect) {
      throw err;
    }
    // fallback to direct upload if presigned fails
    return uploadFilesDirect(files, { folder, userMetadata, onProgress, abortController });
  }

  const uploadData: Array<{
    uploadUrl: string;
    publicUrl: string;
    key: string;
    metadata: any;
    originalFileName?: string;
  }> = presignedResponse.data;

  const results: FileUploadResult[] = [];

  // Helper queue index
  let inProgressCount = 0;
  let currentIndex = 0;
  let completedCount = 0;

  return new Promise<FileUploadResult[]>((resolve, reject) => {
    const uploadNext = () => {
      if (abortController?.signal.aborted) {
        reject(new Error('Upload aborted'));
        return;
      }
      if (completedCount === files.length) {
        onProgress?.({ type: 'batch', progress: 100, stage: 'verifying' });
        resolve(results);
        return;
      }

      while (inProgressCount < concurrency && currentIndex < files.length) {
        const index = currentIndex++;
        const file = files[index];
        const { uploadUrl, publicUrl, key, metadata } = uploadData[index];
        inProgressCount++;

        onProgress?.({
          type: 'batch',
          progress: Math.round((completedCount / files.length) * 100),
          file,
          index: index + 1,
          total: files.length,
          stage: 'uploading',
        });

        uploadWithRetry(
          uploadUrl,
          file,
          maxRetries,
          (progress) => {
            // per-file progress reported
            onProgress?.({
              type: 'single',
              file,
              progress,
              stage: 'uploading',
            });
          },
          abortController,
        )
          .then(async () => {
            // Verify upload with backend
            try {
              onProgress?.({
                type: 'single',
                file,
                progress: 100,
                stage: 'verifying',
              });

              const verifyRes = await api.post(
                API.PRESIGNED_VERIFY(key),
                {},
                {
                  headers: {
                    ...getAuthHeader(),
                  },
                  signal: abortController?.signal,
                },
              );

              const verifyData = verifyRes.data.data;

              results[index] = {
                url: verifyData.publicUrl ?? publicUrl,
                filename: file.name,
                size: file.size,
                mimeType: file.type,
                key,
                order: index + 1,
                publicUrl: verifyData.publicUrl,
                metadata: { ...metadata, ...verifyData.metadata },
              };
            } catch (verifyErr) {
              reject(verifyErr instanceof Error ? verifyErr : new Error(String(verifyErr)));
              return;
            }
          })
          .catch((uploadErr) => {
            reject(uploadErr instanceof Error ? uploadErr : new Error(String(uploadErr)));
          })
          .finally(() => {
            inProgressCount--;
            completedCount++;
            uploadNext();
          });
      }
    };

    uploadNext();
  });
}

/**
 * Fallback traditional direct upload (multipart/form-data)
 */
export async function uploadFilesDirect(
  files: File[],
  {
    folder = 'uploads',
    userMetadata,
    onProgress,
    abortController,
  }: {
    folder?: string;
    userMetadata?: FileMetaUser;
    onProgress?: (progress: UploadProgress) => void;
    abortController?: AbortController;
  } = {},
): Promise<FileUploadResult[]> {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append('images', file, file.name);
  });

  if (userMetadata && Object.keys(userMetadata).length > 0) {
    formData.append('metadata', JSON.stringify(userMetadata));
  }

  formData.append('folder', folder);

  onProgress?.({ type: 'batch', progress: 0, stage: 'uploading' });

  const response = await api.post(API.DIRECT_UPLOAD, formData, {
    headers: {
      ...getAuthHeader(),
      // Don't set Content-Type, axios sets multipart boundary automatically
    },
    signal: abortController?.signal,
  });

  onProgress?.({ type: 'batch', progress: 90, stage: 'verifying' });

  const data = response.data;

  const images: any[] = data.images || data.data?.images || [];

  onProgress?.({ type: 'batch', progress: 100 });

  return images.map((img, idx) => ({
    url: img.url,
    filename: img.filename,
    size: img.size,
    mimeType: img.mimeType,
    key: img.key || '',
    order: idx + 1,
    publicUrl: img.url,
    metadata: img.metadata || {},
  }));
}

/**
 * Validate file type and size before upload
 */
export function validateFile(
  file: File,
  {
    allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'video/mp4',
      'video/webm',
      'video/quicktime',
    ],
    maxSize = 10485760, // 10MB
  } = {},
): true | string {
  if (!allowedTypes.includes(file.type)) return `File type ${file.type} not allowed`;
  if (file.size > maxSize)
    return `File size ${(file.size / (1024 * 1024)).toFixed(2)} MB exceeds limit`;
  return true;
}

/**
 * Simple upload function for single files
 */
export async function uploadFile(
  file: File,
  folder: string = 'uploads',
  userMetadata?: FileMetaUser,
): Promise<FileUploadResult> {
  const results = await uploadFilesWithQueue([file], { folder, userMetadata });
  if (results.length === 0) {
    throw new Error('Failed to upload file');
  }
  return results[0];
}

/**
 * Simple upload function for multiple files
 */
export async function uploadFiles(
  files: File[],
  folder: string = 'uploads',
  userMetadata?: FileMetaUser,
): Promise<FileUploadResult[]> {
  return uploadFilesWithQueue(files, { folder, userMetadata });
}
