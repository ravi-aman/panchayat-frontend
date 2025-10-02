import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Search, X, Loader2, Navigation } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import LocationService, { LocationInfo } from '../../services/LocationService';
import { useToast } from '../../contexts/toast/toastContext';

interface LocationPickerProps {
  selectedLocation?: LocationInfo | null;
  onLocationSelect: (location: LocationInfo | null) => void;
  placeholder?: string;
  className?: string;
  showCurrentLocationButton?: boolean;
}

const LocationPicker: React.FC<LocationPickerProps> = ({
  selectedLocation,
  onLocationSelect,
  placeholder = "Add location...",
  className = "",
  showCurrentLocationButton = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<LocationInfo[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isGettingCurrentLocation, setIsGettingCurrentLocation] = useState(false);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    // Check location permission on mount
    LocationService.requestLocationPermission();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() && searchQuery.length > 2) {
      const timeoutId = setTimeout(async () => {
        setIsSearching(true);
        try {
          const results = await LocationService.searchLocations(searchQuery);
          setSearchResults(results);
        } catch (error) {
          console.error('Location search failed:', error);
          setSearchResults([]);
        } finally {
          setIsSearching(false);
        }
      }, 300);

      return () => clearTimeout(timeoutId);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const handleCurrentLocation = async () => {
    if (!LocationService.isGeolocationAvailable()) {
      toast.open({
        message: {
          heading: 'Geolocation Not Available',
          content: 'Your browser does not support geolocation.',
        },
        duration: 5000,
        position: 'top-center',
        color: 'error',
      });
      return;
    }

    setIsGettingCurrentLocation(true);
    try {
      const location = await LocationService.getCurrentLocationWithDetails();
      onLocationSelect(location);
      setIsOpen(false);
      setSearchQuery('');
      
      toast.open({
        message: {
          heading: 'Location Found',
          content: `Using ${LocationService.formatLocationDisplay(location)}`,
        },
        duration: 3000,
        position: 'top-center',
        color: 'success',
      });
    } catch (error) {
      console.error('Failed to get current location:', error);
      toast.open({
        message: {
          heading: 'Location Error',
          content: error instanceof Error ? error.message : 'Failed to get current location',
        },
        duration: 5000,
        position: 'top-center',
        color: 'error',
      });
    } finally {
      setIsGettingCurrentLocation(false);
    }
  };

  const handleLocationSelect = (location: LocationInfo) => {
    onLocationSelect(location);
    setIsOpen(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleRemoveLocation = () => {
    onLocationSelect(null);
    setSearchQuery('');
  };

  const handleInputClick = () => {
    setIsOpen(true);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Selected Location Display */}
      {selectedLocation && !isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors"
          onClick={handleInputClick}
        >
          <MapPin className="w-4 h-4 text-blue-600" />
          <span className="text-sm text-blue-800 font-medium flex-1">
            {LocationService.formatLocationDisplay(selectedLocation)}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleRemoveLocation();
            }}
            className="p-1 hover:bg-blue-200 rounded-full transition-colors"
            aria-label="Remove location"
          >
            <X className="w-3 h-3 text-blue-600" />
          </button>
        </motion.div>
      )}

      {/* Input Field */}
      {(!selectedLocation || isOpen) && (
        <div className="relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onClick={handleInputClick}
              placeholder={placeholder}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            />
          </div>

          {/* Dropdown */}
          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto"
              >
                {/* Current Location Button */}
                {showCurrentLocationButton && LocationService.isGeolocationAvailable() && (
                  <button
                    onClick={handleCurrentLocation}
                    disabled={isGettingCurrentLocation}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 disabled:opacity-50"
                  >
                    {isGettingCurrentLocation ? (
                      <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                    ) : (
                      <Navigation className="w-4 h-4 text-blue-600" />
                    )}
                    <div className="text-left">
                      <div className="text-sm font-medium text-gray-900">
                        {isGettingCurrentLocation ? 'Getting location...' : 'Use current location'}
                      </div>
                      <div className="text-xs text-gray-500">
                        Get your current position
                      </div>
                    </div>
                  </button>
                )}

                {/* Search Results */}
                {isSearching && (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                    <span className="ml-2 text-sm text-gray-500">Searching...</span>
                  </div>
                )}

                {!isSearching && searchResults.length > 0 && (
                  <div className="py-1">
                    {searchResults.map((location, index) => (
                      <button
                        key={index}
                        onClick={() => handleLocationSelect(location)}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                      >
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {location.name}
                          </div>
                          {location.address && (
                            <div className="text-xs text-gray-500">
                              {location.address}
                            </div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {!isSearching && searchQuery.trim().length > 2 && searchResults.length === 0 && (
                  <div className="px-4 py-3 text-sm text-gray-500 text-center">
                    No locations found for "{searchQuery}"
                  </div>
                )}

                {!isSearching && searchQuery.trim().length === 0 && (
                  <div className="px-4 py-3 text-sm text-gray-500 text-center">
                    Type to search for locations
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default LocationPicker;