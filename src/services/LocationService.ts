interface LocationCoordinates {
  latitude: number;
  longitude: number;
}

interface LocationInfo {
  name: string;
  coordinates: [number, number]; // [longitude, latitude] for consistency with your format
  address?: string;
  city?: string;
  state?: string;
  country?: string;
}

class LocationService {
  private static readonly DEFAULT_TIMEOUT = 10000; // 10 seconds

  /**
   * Get current location using browser's geolocation API
   */
  static async getCurrentLocation(): Promise<LocationCoordinates> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      const options: PositionOptions = {
        enableHighAccuracy: true,
        timeout: this.DEFAULT_TIMEOUT,
        maximumAge: 300000, // 5 minutes cache
      };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          let message = 'Failed to get location';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              message = 'Location access denied by user';
              break;
            case error.POSITION_UNAVAILABLE:
              message = 'Location information unavailable';
              break;
            case error.TIMEOUT:
              message = 'Location request timed out';
              break;
          }
          reject(new Error(message));
        },
        options,
      );
    });
  }

  /**
   * Reverse geocode coordinates to get location name using Google Maps Geocoding API
   * Note: This requires a Google Maps API key to be configured
   */
  static async reverseGeocode(
    latitude: number,
    longitude: number,
  ): Promise<LocationInfo> {
    try {
      // Using a free geocoding service as fallback
      // You can replace this with Google Maps API if you have an API key
      const response = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`,
      );

      if (!response.ok) {
        throw new Error('Failed to reverse geocode location');
      }

      const data = await response.json();

      return {
        name: data.city || data.locality || data.principalSubdivision || 'Unknown Location',
        coordinates: [longitude, latitude],
        address: data.localityInfo?.administrative?.[0]?.name || '',
        city: data.city || data.locality || '',
        state: data.principalSubdivision || '',
        country: data.countryName || '',
      };
    } catch (error) {
      // Fallback to basic coordinates if geocoding fails
      return {
        name: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
        coordinates: [longitude, latitude],
      };
    }
  }

  /**
   * Get current location with reverse geocoding
   */
  static async getCurrentLocationWithDetails(): Promise<LocationInfo> {
    try {
      const coords = await this.getCurrentLocation();
      const locationInfo = await this.reverseGeocode(coords.latitude, coords.longitude);
      return locationInfo;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Search for locations by name (basic implementation)
   * For production, consider using Google Places API or similar service
   */
  static async searchLocations(query: string): Promise<LocationInfo[]> {
    try {
      // This is a basic implementation using a free geocoding service
      // Replace with Google Places API for better results
      const response = await fetch(
        `https://api.bigdatacloud.net/data/forward-geocode?query=${encodeURIComponent(query)}&key=bdc_pk_your_api_key`,
      );

      if (!response.ok) {
        throw new Error('Failed to search locations');
      }

      const data = await response.json();

      if (data.results && Array.isArray(data.results)) {
        return data.results.slice(0, 5).map((result: any) => ({
          name: result.name || result.display_name || 'Unknown Location',
          coordinates: [result.longitude || 0, result.latitude || 0],
          address: result.display_name || '',
          city: result.city || '',
          state: result.state || '',
          country: result.country || '',
        }));
      }

      return [];
    } catch (error) {
      console.error('Location search failed:', error);
      return [];
    }
  }

  /**
   * Format location for display
   */
  static formatLocationDisplay(location: LocationInfo): string {
    if (location.city && location.state) {
      return `${location.city}, ${location.state}`;
    }
    if (location.city) {
      return location.city;
    }
    if (location.name) {
      return location.name;
    }
    return `${location.coordinates[1].toFixed(4)}, ${location.coordinates[0].toFixed(4)}`;
  }

  /**
   * Check if geolocation is available
   */
  static isGeolocationAvailable(): boolean {
    return 'geolocation' in navigator;
  }

  /**
   * Request location permission
   */
  static async requestLocationPermission(): Promise<PermissionState> {
    if ('permissions' in navigator) {
      const permission = await navigator.permissions.query({ name: 'geolocation' });
      return permission.state;
    }
    return 'prompt';
  }
}

export default LocationService;
export type { LocationInfo, LocationCoordinates };