import { LocationInfo } from '../services/LocationService';

/**
 * Utility functions for handling and formatting location data
 */

export const formatLocationDisplay = (location: LocationInfo): string => {
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
};

export const formatCoordinates = (coordinates: [number, number]): string => {
  const [longitude, latitude] = coordinates;
  return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
};

export const getLocationDisplayName = (location: LocationInfo): string => {
  return location.name || formatCoordinates(location.coordinates);
};

export const isValidCoordinates = (coordinates: [number, number]): boolean => {
  const [longitude, latitude] = coordinates;
  return (
    longitude >= -180 &&
    longitude <= 180 &&
    latitude >= -90 &&
    latitude <= 90 &&
    !isNaN(longitude) &&
    !isNaN(latitude)
  );
};

export const calculateDistance = (
  coord1: [number, number],
  coord2: [number, number]
): number => {
  const [lon1, lat1] = coord1;
  const [lon2, lat2] = coord2;

  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in kilometers

  return distance;
};

export const formatDistance = (distance: number): string => {
  if (distance < 1) {
    return `${Math.round(distance * 1000)}m`;
  }
  if (distance < 10) {
    return `${distance.toFixed(1)}km`;
  }
  return `${Math.round(distance)}km`;
};

export const getLocationPreview = (location: LocationInfo): string => {
  const parts = [];
  
  if (location.city) parts.push(location.city);
  if (location.state && location.state !== location.city) parts.push(location.state);
  if (location.country && parts.length < 2) parts.push(location.country);
  
  return parts.join(', ') || location.name || formatCoordinates(location.coordinates);
};

// Example locations for testing (you can remove this in production)
export const SAMPLE_LOCATIONS: LocationInfo[] = [
  {
    name: "New York City",
    coordinates: [-74.006, 40.7128],
    address: "New York, NY, USA",
    city: "New York",
    state: "New York", 
    country: "United States"
  },
  {
    name: "London",
    coordinates: [-0.1276, 51.5074],
    address: "London, UK",
    city: "London",
    state: "England",
    country: "United Kingdom"
  },
  {
    name: "Mumbai",
    coordinates: [72.8777, 19.0760],
    address: "Mumbai, Maharashtra, India",
    city: "Mumbai",
    state: "Maharashtra",
    country: "India"
  }
];