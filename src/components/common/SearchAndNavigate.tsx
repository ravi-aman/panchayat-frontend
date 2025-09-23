import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, MapPin, X, Loader2, Building, Mountain, Home, Navigation } from 'lucide-react';
import maplibregl, { LngLatLike, Map, Marker, Popup } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

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

interface PhotonResponse {
  features: PhotonFeature[];
}

interface LocationName {
  primary: string;
  secondary: string;
}

export interface SearchAndNavigateProps {
  map: Map | null; // MapLibre map instance (required)
  onLocationSelect?: (location: PhotonFeature) => void;
  placeholder?: string;
  className?: string;
  mobile?: boolean;
  darkMode?: boolean;
  apiUrl?: string;
  markerColor?: string;
  flyToDuration?: number;
  flyToZoom?: number;
  showRecentSearches?: boolean;
  maxRecentSearches?: number;
  enablePopups?: boolean;
}

/**
 * SearchAndNavigate - A component for searching locations and navigating to them on a MapLibre map
 * 
 * Features:
 * - Real-time location search using Photon API
 * - Smooth animations to selected locations
 * - Marker placement with popups
 * - Recent searches history
 * - Keyboard navigation
 * - Mobile & dark mode support
 * - TypeScript typings
 */
const SearchAndNavigate: React.FC<SearchAndNavigateProps> = ({
  map,
  onLocationSelect,
  placeholder = 'Search for a location...',
  className = '',
  mobile = false,
  darkMode = false,
  apiUrl = 'https://photon.komoot.io/api',
  markerColor = '#3b82f6', // Default blue color
  flyToDuration = 2000,
  flyToZoom = 14,
  showRecentSearches = true,
  maxRecentSearches = 5,
  enablePopups = true
}): React.ReactElement => {
  // State
  const [query, setQuery] = useState<string>('');
  const [results, setResults] = useState<PhotonFeature[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [error, setError] = useState<string | null>(null);
  const [activeMarker, setActiveMarker] = useState<Marker | null>(null);
  const [activePopup, setActivePopup] = useState<Popup | null>(null);
  const [recentSearches, setRecentSearches] = useState<PhotonFeature[]>([]);
  
  // Refs
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchCache = useRef<Record<string, PhotonFeature[]>>({});
  const initialLoadDone = useRef<boolean>(false);
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);
  
  // Load recent searches from localStorage on mount
  useEffect(() => {
    if (!showRecentSearches || initialLoadDone.current) return;
    
    try {
      const saved = localStorage.getItem('recentLocationSearches');
      if (saved) {
        const parsed = JSON.parse(saved);
        setRecentSearches(parsed.slice(0, maxRecentSearches)); 
      }
      initialLoadDone.current = true;
    } catch (e) {
      console.warn('Failed to load recent searches from localStorage');
    }
  }, [showRecentSearches, maxRecentSearches]);

  // Log when map instance changes
  useEffect(() => {
    // Add a handler to automatically close the popup when the map is panned/zoomed
    if (map && activePopup) {
      const handleMapMove = () => {
        if (activePopup && !activePopup.isOpen()) {
          // If the popup was closed by the user, remove the reference
          setActivePopup(null);
        }
      };
      
      map.on('move', handleMapMove);
      
      return () => {
        if (map) {
          map.off('move', handleMapMove);
        }
      };
    }
  }, [map, activePopup]);

  // Save to localStorage when recent searches change
  useEffect(() => {
    if (!showRecentSearches || recentSearches.length === 0) return;
    
    try {
      localStorage.setItem('recentLocationSearches', 
        JSON.stringify(recentSearches.slice(0, maxRecentSearches))
      );
    } catch (e) {
      console.warn('Failed to save recent searches to localStorage');
    }
  }, [recentSearches, showRecentSearches, maxRecentSearches]);

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
      if (cacheKey in searchCache.current) {
        setResults(searchCache.current[cacheKey] || []);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
        
        const response = await fetch(
          `${apiUrl}/?q=${encodeURIComponent(searchQuery)}&limit=5&lang=en`,
          { signal: controller.signal }
        );
        
        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`Search failed with status: ${response.status}`);
        }

        const data: PhotonResponse = await response.json();
        
        // Filter out results with no name or city
        const validResults = data.features.filter(
          feature => feature.properties.name || feature.properties.city
        );

        // Cache results
        searchCache.current[cacheKey] = validResults;
        
        setResults(validResults);
      } catch (err) {
        // Handle AbortController timeout
        if (err instanceof DOMException && err.name === 'AbortError') {
          console.error('Search request timed out');
          setError('Search timed out. Please try again.');
        } else {
          console.error('Search error:', err);
          setError('Search failed. Please try again.');
        }
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    },
    [apiUrl]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clean up any markers or popups when component unmounts
      if (activeMarker) {
        activeMarker.remove();
      }
      
      if (activePopup) {
        activePopup.remove();
      }
      
      // Clear any pending timeouts
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, [activeMarker, activePopup]);

  // Debounce effect
  useEffect(() => {
    // Clear any existing timeout
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
    
    // Create a new timeout
    debounceTimeout.current = setTimeout(() => {
      searchLocations(query);
      debounceTimeout.current = null;
    }, 300); // 300ms debounce

    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
        debounceTimeout.current = null;
      }
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

  // Format location name from properties
  const formatLocationName = (location: PhotonFeature): LocationName => {
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

  // Clean up any existing markers and popups
  const cleanupMapObjects = useCallback(() => {
    if (activeMarker) {
      activeMarker.remove();
      setActiveMarker(null);
    }
    
    if (activePopup) {
      activePopup.remove();
      setActivePopup(null);
    }
  }, [activeMarker, activePopup]);

  // Handle location selection
  const handleLocationSelect = useCallback((location: PhotonFeature) => {
    if (!map) {
      console.error('Map instance is not available. Navigation cannot proceed.');
      return;
    }
    
    try {
      const [longitude, latitude] = location.geometry.coordinates;
      
      // Cleanup previous markers and popups
      cleanupMapObjects();
      
      // Fly to the selected location with smooth animation
      map.flyTo({
        center: [longitude, latitude] as LngLatLike,
        zoom: flyToZoom,
        essential: true,
        duration: flyToDuration,
        easing: (t) => {
          // Custom easing function for a more Google Maps-like feel
          // This provides a smooth start and end to the animation
          return t < 0.5 
            ? 4 * t * t * t 
            : 1 - Math.pow(-2 * t + 2, 3) / 2;
        }
      });

      // Create a new marker
      const marker = new maplibregl.Marker({
        color: markerColor,
        draggable: false,
      }).setLngLat([longitude, latitude]);
      
      // Create and configure popup if enabled
      if (enablePopups) {
        const locationName = formatLocationName(location);
        
        const popup = new maplibregl.Popup({
          closeButton: true,
          closeOnClick: true,
          className: 'location-popup',
          offset: [0, -35], // Offset so popup appears above the marker
          maxWidth: '300px'
        });
        
        popup.setHTML(`
          <div class="location-popup-content p-2">
            <h3 class="text-base font-semibold">${locationName.primary}</h3>
            ${locationName.secondary ? `<p class="text-sm text-gray-600">${locationName.secondary}</p>` : ''}
          </div>
        `);
        
        marker.setPopup(popup);
        marker.togglePopup(); // Show popup immediately
        
        setActivePopup(popup);
      }
      
      // Add marker to map
      marker.addTo(map);
      setActiveMarker(marker);
      
      // Add to recent searches (avoid duplicates)
      if (showRecentSearches) {
        setRecentSearches(prev => {
          const exists = prev.some(item => 
            item.geometry.coordinates[0] === location.geometry.coordinates[0] &&
            item.geometry.coordinates[1] === location.geometry.coordinates[1]
          );
          
          if (!exists) {
            return [location, ...prev].slice(0, maxRecentSearches);
          }
          return prev;
        });
      }
    } catch (error) {
      console.error('Error navigating to location:', error);
    }
    
    // Call the onLocationSelect callback if provided
    if (onLocationSelect) {
      onLocationSelect(location);
    }
    
    // Clear input and close dropdown
    setQuery('');
    setIsOpen(false);
    setSelectedIndex(-1);
  }, [
    map, 
    cleanupMapObjects, 
    flyToZoom, 
    flyToDuration, 
    markerColor, 
    enablePopups,
    showRecentSearches,
    maxRecentSearches,
    onLocationSelect
  ]);

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
          <Navigation className={`w-4 h-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
        </div>
      </li>
    );
  };

  // Main component render
  return (
    <div 
      ref={searchRef} 
      className={`relative ${className} ${mobile ? 'w-full' : ''}`}
      data-testid="search-and-navigate-component"
    >
      {!map && (
        <div className={`text-center p-2 mb-2 rounded ${darkMode ? 'bg-red-900 text-white' : 'bg-red-100 text-red-800'}`}>
          Map instance not provided. Search and navigation will not work.
        </div>
      )}
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
          ) : showRecentSearches && recentSearches.length > 0 && !query ? (
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

export default SearchAndNavigate;