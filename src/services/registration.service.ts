import axios from 'axios';

interface RegistrationData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
  gender: string;
  dob: string;
  profilePicture?: string;
}

interface AvatarUploadResponse {
  profilePicture: string;
  key: string;
}

interface RegisteredUser {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  photo?: string;
  role: string;
  isVerified: boolean;
  profileIds: string[];
  dob: string;
  gender: string;
  phone: string;
}

export class RegistrationService {
  private baseURL: string;
  private registrationToken: string | null = null;
  private tokenExpiry: number = 0;
  private uploadedAvatar: string | null = null;

  constructor(baseURL = `${import.meta.env.VITE_BACKEND_URL}/api/V1/auth`) {
    this.baseURL = baseURL;
  }

  /**
   * Step 1: Get registration token
   */
  async getRegistrationToken(): Promise<boolean> {
    try {
      const response = await axios.get<{
        success: boolean;
        registrationToken: string;
        expiresIn: number;
        message: string;
      }>(`${this.baseURL}/registration-token`);

      const data = response.data;

      if (data.success) {
        this.registrationToken = data.registrationToken;
        this.tokenExpiry = Date.now() + data.expiresIn;

        console.log('📝 Registration token obtained:', {
          expiresIn: data.expiresIn / 1000 / 60 + ' minutes',
        });

        return true;
      } else {
        throw new Error(data.message || 'Failed to get registration token');
      }
    } catch (error) {
      console.warn(
        '⚠️ Registration token endpoint not available, falling back to direct upload:',
        error,
      );
      return true;
    }
  }
  /**
   * Step 2: Upload avatar with registration token
   */
  async uploadAvatar(file: File): Promise<string> {
    try {
      // Validate file
      if (!file) {
        throw new Error('No file selected');
      }

      if (file.size > 5 * 1024 * 1024) {
        throw new Error('File size must be less than 5MB');
      }

      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Only JPEG, PNG, GIF, and WebP images are allowed');
      }

      if (!this.registrationToken || Date.now() > this.tokenExpiry) {
        const tokenObtained = await this.getRegistrationToken();
        if (!tokenObtained) {
          throw new Error('Failed to obtain registration token');
        }
      }

      // Create form data
      const formData = new FormData();
      formData.append('avatar', file);

      // Upload avatar
      const response = await axios.post<{
        success: boolean;
        data: AvatarUploadResponse;
        message: string;
      }>(`${this.baseURL}/upload-registration-avatar`, formData, {
        headers: {
          'X-Registration-Token': this.registrationToken,
          'Content-Type': 'multipart/form-data',
        },
      });

      const data = response.data;

      if (data.success) {
        this.uploadedAvatar = data.data.profilePicture;

        console.log('📸 Avatar uploaded successfully:', this.uploadedAvatar);
        return this.uploadedAvatar;
      } else {
        throw new Error(data.message || 'Avatar upload failed');
      }
    } catch (error) {
      console.error('❌ Avatar upload error:', error);

      // If the new endpoint doesn't exist, fallback to storing the file locally for now
      if (
        axios.isAxiosError(error) &&
        (error.response?.status === 404 || error.response?.status === 500)
      ) {
        console.warn(
          '⚠️ New avatar upload endpoint not available, using file object URL as fallback',
        );
        this.uploadedAvatar = URL.createObjectURL(file);
        return this.uploadedAvatar;
      }

      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Avatar upload failed');
      }
      throw error;
    }
  }

  /**
   * Step 3: Complete registration with or without avatar
   */
  async register(userData: RegistrationData): Promise<RegisteredUser> {
    try {
      // Validate required fields
      const requiredFields = [
        'firstName',
        'lastName',
        'email',
        'password',
        'phone',
        'gender',
        'dob',
      ];
      for (const field of requiredFields) {
        if (!userData[field as keyof RegistrationData]) {
          throw new Error(`${field} is required`);
        }
      }

      // Choose endpoint based on whether avatar was uploaded
      const endpoint = this.uploadedAvatar
        ? `${this.baseURL}/register-with-avatar`
        : `${this.baseURL}/register`;

      // Prepare payload
      const payload = this.uploadedAvatar
        ? {
            ...userData,
            profilePicture: this.uploadedAvatar,
            registrationToken: this.registrationToken,
          }
        : userData;

      let response;

      try {
        // Try the new registration endpoint first
        response = await axios.post<{
          success: boolean;
          status?: string;
          message: string;
          accessToken: string;
          user: RegisteredUser;
        }>(endpoint, payload);
      } catch (error) {
        // Fallback to the original registration endpoint if new ones don't exist
        if (axios.isAxiosError(error) && error.response?.status === 404) {
          console.warn(
            '⚠️ New registration endpoints not available, falling back to original endpoint',
          );
          response = await axios.post<{
            success: boolean;
            status?: string;
            message: string;
            accessToken: string;
            user: RegisteredUser;
          }>(`${this.baseURL}/register`, {
            ...userData,
            photo: this.uploadedAvatar || undefined,
          });
        } else {
          throw error;
        }
      }

      const data = response.data;

      if (data.success || data.status === 'success') {
        // Store tokens
        localStorage.setItem('accessToken', data.accessToken);

        console.log('✅ Registration completed successfully:', {
          userId: data.user._id,
          email: data.user.email,
          hasAvatar: !!data.user.photo,
        });

        return data.user;
      } else {
        throw new Error(data.message || 'Registration failed');
      }
    } catch (error) {
      console.error('❌ Registration error:', error);
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Registration failed');
      }
      throw error;
    }
  }

  /**
   * Complete registration flow - upload avatar if provided, then register
   */
  async completeRegistration(
    userData: RegistrationData,
    avatarFile?: File,
  ): Promise<RegisteredUser> {
    try {
      console.log('🚀 Starting registration flow...');

      // Upload avatar if provided
      if (avatarFile) {
        console.log('📸 Uploading avatar...');
        await this.uploadAvatar(avatarFile);
      }

      // Complete registration
      console.log('📝 Completing registration...');
      const user = await this.register(userData);

      return user;
    } catch (error) {
      console.error('Registration flow failed:', error);
      throw error;
    }
  }

  /**
   * Reset the registration state
   */
  reset(): void {
    this.registrationToken = null;
    this.uploadedAvatar = null;
    this.tokenExpiry = 0;
  }

  /**
   * Get current avatar URL
   */
  getUploadedAvatar(): string | null {
    return this.uploadedAvatar;
  }

  /**
   * Check if registration token is valid
   */
  isTokenValid(): boolean {
    return !!(this.registrationToken && Date.now() < this.tokenExpiry);
  }
}

// Export singleton instance
export const registrationService = new RegistrationService();
