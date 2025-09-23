import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, MapPin, X, Loader2, ChevronRight, Building, Mountain, Home } from 'lucide-react';
import { LngLatLike } from 'maplibre-gl';

// Photon API response types
export interface PhotonFeature {
  type: string;
  geometry: {
    type: string;
    coordinates: [number, number]; // [lon, lat]
  };
  properties: {
    name?: string;
    street?: string;
    housenumber?: string;
    city?: string;
    state?: string;
    country?: string;
    osm_key?: string;
    osm_value?: string;
    postcode?: string;
  };
}

export interface PhotonResponse {
  features: PhotonFeature[];
}

export interface SearchLocationProps {
  map?: any; // MapLibre map instance
  onLocationSelect?: (location: PhotonFeature) => void;
  placeholder?: string;
  className?: string;
  mobile?: boolean;
  darkMode?: boolean;
  apiUrl?: string;
}

const SearchLocation: React.FC<SearchLocationProps> = ({
  map,
  onLocationSelect,
  placeholder = 'Search for a location...',
  className = '',
  mobile = false,
  darkMode = false,
  apiUrl = 'https://photon.komoot.io/api'
}) => {
  const [query, setQuery] = useState<string>('');
  const [results, setResults] = useState<PhotonFeature[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [error, setError] = useState<string | null>(null);
  const [activeMarker, setActiveMarker] = useState<any | null>(null);
  const [recentSearches, setRecentSearches] = useState<PhotonFeature[]>([]);
  
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchCache = useRef<Map<string, PhotonFeature[]>>(new Map());
  
  // Load recent searches from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('recentLocationSearches');
      if (saved) {
        const parsed = JSON.parse(saved);
        setRecentSearches(parsed.slice(0, 3)); // Only show top 3
      }
    } catch (e) {
      console.warn('Failed to load recent searches from localStorage');
    }
  }, []);

  // Save to localStorage when recent searches change
  useEffect(() => {
    if (recentSearches.length > 0) {
      try {
        localStorage.setItem('recentLocationSearches', JSON.stringify(recentSearches.slice(0, 5)));
      } catch (e) {
        console.warn('Failed to save recent searches to localStorage');
      }
    }
  }, [recentSearches]);

  // Debounced search function
  const searchLocations = useCallback(
    async (searchQuery: string) => {
      if (!searchQuery || searchQuery.length < 2) {
        setResults([]);
        setIsLoading(false);
        return;
      }

      // Check cache first
      const cacheKey = searchQuery.toLowerCase().trim();
      if (searchCache.current.has(cacheKey)) {
        setResults(searchCache.current.get(cacheKey) || []);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `${apiUrl}/?q=${encodeURIComponent(searchQuery)}&limit=5&lang=en`
        );

        if (!response.ok) {
          throw new Error(`Search failed with status: ${response.status}`);
        }

        const data: PhotonResponse = await response.json();
        
        // Filter out results with no name or city
        const validResults = data.features.filter(
          feature => feature.properties.name || feature.properties.city
        );

        // Cache results
        searchCache.current.set(cacheKey, validResults);
        
        setResults(validResults);
      } catch (err) {
        console.error('Search error:', err);
        setError('Search failed. Please try again.');
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    },
    [apiUrl]
  );

  // Debounce effect
  useEffect(() => {
    const handler = setTimeout(() => {
      searchLocations(query);
    }, 300); // 300ms debounce

    return () => {
      clearTimeout(handler);
    };
  }, [query, searchLocations]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && results[selectedIndex]) {
        handleLocationSelect(results[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  // Handle location selection
  const handleLocationSelect = (location: PhotonFeature) => {
    if (map) {
      const [longitude, latitude] = location.geometry.coordinates;
      
      // Fly to the selected location
      map.flyTo({
        center: [longitude, latitude] as LngLatLike,
        zoom: 14,
        essential: true, // For smooth animation
        duration: 1500
      });

      // Remove previous marker if exists
      if (activeMarker) {
        activeMarker.remove();
      }

      // Create a popup with location details
      const popup = new window.maplibregl.Popup({
        closeButton: true,
        closeOnClick: true,
        className: 'location-popup'
      });

      // Format location name
      const locationName = formatLocationName(location);
      
      popup.setHTML(`
        <div class="location-popup-content">
          <h3 class="text-base font-semibold">${locationName.primary}</h3>
          ${locationName.secondary ? `<p class="text-sm text-gray-600">${locationName.secondary}</p>` : ''}
        </div>
      `);

      // Create and set new marker
      const marker = new window.maplibregl.Marker({
        color: '#3b82f6',
        draggable: false,
      })
        .setLngLat([longitude, latitude])
        .setPopup(popup)
        .addTo(map);
      
      // Show popup immediately
      marker.togglePopup();
      
      // Store marker reference for cleanup
      setActiveMarker(marker);
    }

    // Call the onLocationSelect callback if provided
    if (onLocationSelect) {
      onLocationSelect(location);
    }

    // Add to recent searches (avoid duplicates)
    setRecentSearches(prev => {
      const exists = prev.some(item => 
        item.geometry.coordinates[0] === location.geometry.coordinates[0] &&
        item.geometry.coordinates[1] === location.geometry.coordinates[1]
      );
      
      if (!exists) {
        return [location, ...prev].slice(0, 5); // Keep only last 5
      }
      return prev;
    });

    // Clear input and close dropdown
    setQuery('');
    setIsOpen(false);
    setSelectedIndex(-1);
  };

  // Format location name from properties
  const formatLocationName = (location: PhotonFeature) => {
    const props = location.properties;
    
    let primary = props.name || props.city || 'Unknown location';
    
    let secondaryParts = [];
    if (props.street) {
      secondaryParts.push(props.housenumber ? `${props.street} ${props.housenumber}` : props.street);
    }
    if (props.city && props.name !== props.city) {
      secondaryParts.push(props.city);
    }
    if (props.state) {
      secondaryParts.push(props.state);
    }
    if (props.country) {
      secondaryParts.push(props.country);
    }
    
    const secondary = secondaryParts.join(', ');
    
    return {
      primary,
      secondary
    };
  };

  // Get appropriate icon for location type
  const getLocationIcon = (location: PhotonFeature) => {
    const type = location.properties.osm_value;
    
    switch(type) {
      case 'city':
      case 'town':
      case 'village':
        return <Building className={`w-4 h-4 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />;
      case 'mountain':
      case 'peak':
      case 'hill':
      case 'forest':
      case 'park':
        return <Mountain className={`w-4 h-4 ${darkMode ? 'text-green-400' : 'text-green-600'}`} />;
      case 'motorway':
      case 'trunk':
      case 'primary':
      case 'secondary':
      case 'road':
      case 'street':
        return <MapPin className={`w-4 h-4 ${darkMode ? 'text-amber-400' : 'text-amber-600'}`} />;
      case 'house':
      case 'residential':
      case 'apartment':
        return <Home className={`w-4 h-4 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`} />;
      default:
        return <MapPin className={`w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />;
    }
  };

  // Render location item with appropriate styling
  const renderLocationItem = (location: PhotonFeature, index: number, recent: boolean = false) => {
    const { primary, secondary } = formatLocationName(location);
    const isSelected = index === selectedIndex;
    
    return (
      <li
        key={`${location.geometry.coordinates[0]}-${location.geometry.coordinates[1]}-${index}`}
        onClick={() => handleLocationSelect(location)}
        onMouseEnter={() => setSelectedIndex(index)}
        className={`
          px-3 py-2.5 flex items-start gap-3 cursor-pointer transition-colors
          ${isSelected ? 
            (darkMode ? 'bg-gray-800 text-white' : 'bg-blue-50 text-blue-800') : 
            (darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-50')}
          ${mobile ? 'rounded-lg' : 'border-b last:border-b-0'}
          ${darkMode ? 'border-gray-700' : 'border-gray-100'}
        `}
      >
        <div className="flex-shrink-0 mt-0.5">
          {recent ? 
            <div className="w-5 h-5 rounded-full flex items-center justify-center bg-gray-100 dark:bg-gray-700">
              <Search className="w-3 h-3 text-gray-500 dark:text-gray-300" />
            </div> :
            getLocationIcon(location)
          }
        </div>
        <div className="flex-grow min-w-0">
          <div className={`font-medium truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>{primary}</div>
          {secondary && <div className={`text-xs truncate mt-0.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{secondary}</div>}
        </div>
        <div className="flex-shrink-0 mt-0.5">
          <ChevronRight className={`w-4 h-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
        </div>
      </li>
    );
  };

  // Main component render
  return (
    <div 
      ref={searchRef} 
      className={`relative ${className} ${mobile ? 'w-full' : ''}`}
      data-testid="search-location-component"
    >
      {/* Search Input */}
      <div className={`
        flex items-center relative 
        ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} 
        ${mobile ? 'rounded-full shadow-lg' : 'rounded-md border'} 
        ${darkMode ? 'border-gray-700' : 'border-gray-300'} 
        transition-all
        ${isOpen ? (darkMode ? 'ring-2 ring-blue-500' : 'ring-2 ring-blue-500') : ''}
      `}>
        <Search 
          className={`ml-3 w-5 h-5 flex-shrink-0 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} 
          aria-hidden="true" 
        />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`
            py-2.5 px-3 flex-grow bg-transparent outline-none text-sm
            ${darkMode ? 'placeholder-gray-500' : 'placeholder-gray-400'}
            ${mobile ? 'pr-12' : ''}
          `}
          aria-label="Search locations"
        />
        {query && (
          <button 
            onClick={() => {
              setQuery('');
              inputRef.current?.focus();
            }}
            className={`
              p-1.5 rounded-full mr-2
              ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}
            `}
            aria-label="Clear search"
          >
            <X className="w-4 h-4 text-gray-400" aria-hidden="true" />
          </button>
        )}
        {isLoading && (
          <div className="absolute right-3 pointer-events-none">
            <Loader2 className="w-4 h-4 animate-spin text-gray-400" aria-hidden="true" />
          </div>
        )}
      </div>

      {/* Results Dropdown */}
      {isOpen && (
        <div className={`
          absolute z-50 mt-1 w-full
          ${mobile ? 'rounded-xl shadow-xl left-0 right-0' : 'rounded-md shadow-lg'}
          ${darkMode ? 'bg-gray-900 border border-gray-700' : 'bg-white border border-gray-200'}
          overflow-hidden
        `}>
          {error ? (
            <div className={`p-4 text-center ${darkMode ? 'text-red-400' : 'text-red-500'}`}>
              {error}
            </div>
          ) : results.length > 0 ? (
            <ul className="max-h-96 overflow-y-auto py-1">
              {results.map((result, index) => renderLocationItem(result, index))}
            </ul>
          ) : query.length > 1 && !isLoading ? (
            <div className={`p-4 text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              No locations found
            </div>
          ) : recentSearches.length > 0 && !query ? (
            <div>
              <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-700">
                <p className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>RECENT SEARCHES</p>
              </div>
              <ul className="max-h-72 overflow-y-auto">
                {recentSearches.map((result, index) => renderLocationItem(result, index, true))}
              </ul>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default SearchLocation;