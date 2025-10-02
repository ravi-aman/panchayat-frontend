import api from '../utils/api';

interface VerificationStatus {
  phoneVerified: boolean;
  phone?: string;
}

interface LocationData {
  coordinates: [number, number]; // [longitude, latitude]
  address: string;
  city: string;
  state: string;
  country: string;
  pincode?: string;
}

interface ProfileUpdateData {
  firstName?: string;
  lastName?: string;
  phone?: string;
  userLocation?: LocationData;
}

class MobileVerificationService {
  /**
   * Check if a phone number is available for registration
   */
  static async checkPhoneAvailability(phoneNumber: string): Promise<boolean> {
    try {
      const response = await api.post('/api/v2/mobile-verification/check-availability', {
        phoneNumber
      });
      return response.data.available;
    } catch (error) {
      console.error('Error checking phone availability:', error);
      throw error;
    }
  }

  /**
   * Send OTP to phone number via WhatsApp
   */
  static async sendOTP(phoneNumber: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await api.post('/api/v2/mobile-verification/send-otp', {
        phoneNumber
      });
      return {
        success: response.data.success,
        message: response.data.message
      };
    } catch (error) {
      console.error('Error sending OTP:', error);
      throw error;
    }
  }

  /**
   * Verify OTP code
   */
  static async verifyOTP(otp: string, phoneNumber: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await api.post('/api/v2/mobile-verification/verify-otp', {
        phone: phoneNumber, // Required by backend
        otp
      });
      return {
        success: response.data.success,
        message: response.data.message
      };
    } catch (error) {
      console.error('Error verifying OTP:', error);
      throw error;
    }
  }

  /**
   * Get current verification status
   */
  static async getVerificationStatus(): Promise<VerificationStatus> {
    try {
      console.log('🔍 MobileVerificationService.getVerificationStatus: Making API call...');
      const response = await api.get('/api/v2/mobile-verification/status');
      console.log('🔍 MobileVerificationService.getVerificationStatus: API response:', response.data);
      
      // Fix: Access the nested data object
      const data = response.data.data || response.data;
      console.log('🔍 MobileVerificationService.getVerificationStatus: Parsed data:', data);
      
      return {
        phoneVerified: data.phoneVerified,
        phone: data.phone
      };
    } catch (error) {
      console.error('Error getting verification status:', error);
      throw error;
    }
  }

  /**
   * Update user profile with phone and location
   */
  static async updateProfile(userId: string, profileData: ProfileUpdateData): Promise<boolean> {
    try {
      const response = await api.post(`/api/v1/user/edit/${userId}`, profileData);
      return response.data.status === 'success';
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  }

  /**
   * Get current location from browser
   */
  static async getCurrentLocation(): Promise<LocationData> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser.'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          try {
            // Reverse geocoding to get address details
            const response = await fetch(
              `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${import.meta.env.VITE_MAPBOX_ACCESS_TOKEN}&types=place,locality,neighborhood,address`
            );
            
            if (response.ok) {
              const data = await response.json();
              const feature = data.features[0];
              
              if (feature) {
                const context = feature.context || [];
                const place = context.find((c: any) => c.id.includes('place'));
                const region = context.find((c: any) => c.id.includes('region'));
                const country = context.find((c: any) => c.id.includes('country'));
                const postcode = context.find((c: any) => c.id.includes('postcode'));

                resolve({
                  coordinates: [longitude, latitude],
                  address: feature.place_name || `${latitude}, ${longitude}`,
                  city: place?.text || 'Unknown City',
                  state: region?.text || 'Unknown State',
                  country: country?.text || 'Unknown Country',
                  pincode: postcode?.text
                });
              } else {
                resolve({
                  coordinates: [longitude, latitude],
                  address: `${latitude}, ${longitude}`,
                  city: 'Unknown City',
                  state: 'Unknown State',
                  country: 'Unknown Country'
                });
              }
            } else {
              resolve({
                coordinates: [longitude, latitude],
                address: `${latitude}, ${longitude}`,
                city: 'Unknown City',
                state: 'Unknown State',
                country: 'Unknown Country'
              });
            }
          } catch (error) {
            console.error('Error with reverse geocoding:', error);
            resolve({
              coordinates: [longitude, latitude],
              address: `${latitude}, ${longitude}`,
              city: 'Unknown City',
              state: 'Unknown State',
              country: 'Unknown Country'
            });
          }
        },
        (error) => {
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    });
  }
}

export default MobileVerificationService;
export type { VerificationStatus, LocationData, ProfileUpdateData };