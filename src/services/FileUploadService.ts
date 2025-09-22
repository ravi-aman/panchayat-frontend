import axios from 'axios';

const API_URL = `${import.meta.env.VITE_BACKEND_URL}/api/v1`;

export interface UploadResponse {
  success: boolean;
  data: {
    url: string;
    key: string;
    originalName: string;
    size: number;
    mimetype: string;
  };
}

class FileUploadService {
  async uploadFile(file: File): Promise<UploadResponse> {
    const token = localStorage.getItem('accessToken');
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', 'chat-attachments');

    const response = await axios.post(`${API_URL}/files/upload`, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
      withCredentials: true,
    });

    return response.data;
  }

  async uploadMultipleFiles(files: File[]): Promise<UploadResponse[]> {
    const uploadPromises = files.map((file) => this.uploadFile(file));
    return Promise.all(uploadPromises);
  }

  getFileIcon(mimeType: string): string {
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType.startsWith('video/')) return '🎥';
    if (mimeType === 'application/pdf') return '📄';
    if (mimeType.includes('word') || mimeType.includes('document')) return '📝';
    if (mimeType.includes('sheet') || mimeType.includes('excel')) return '📊';
    if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return '📋';
    return '📎';
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

export default new FileUploadService();
