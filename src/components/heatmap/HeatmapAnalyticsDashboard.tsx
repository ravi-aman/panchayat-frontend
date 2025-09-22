// ===== ADVANCED HEATMAP DASHBOARD WITH SEARCH =====
// Google Maps-style advanced dashboard with real-time search and full-page layout

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import {
  RegionBounds
} from '../../types/heatmap';
import { useHeatmapData } from '../../hooks/useHeatmapData';
import { HeatmapVisualization } from './HeatmapVisualization';
import { Search, MapPin, Clock, TrendingUp, AlertTriangle, Layers, Maximize2, Minimize2 } from 'lucide-react';

// ===== SEARCH INTERFACES =====

interface SearchSuggestion {
  id: string;
  type: 'location' | 'area' | 'landmark' | 'region';
  name: string;
  description: string;
  coordinates: [number, number]; // [lng, lat]
  bounds?: RegionBounds;
  category?: string;
  priority: number; // For sorting suggestions
}

interface SearchResult {
  query: string;
  suggestions: SearchSuggestion[];
  selectedSuggestion?: SearchSuggestion;
  timestamp: Date;
}

// ===== LOCATION DATA =====
// Predefined locations for search suggestions
const LOCATION_DATA: SearchSuggestion[] = [
  // Major Indian Cities
  {
    id: 'delhi',
    type: 'location',
    name: 'Delhi',
    description: 'National Capital Territory',
    coordinates: [77.2090, 28.6139],
    bounds: {
      southwest: [76.8381, 28.4042],
      northeast: [77.3430, 28.8839]
    },
    category: 'city',
    priority: 10
  },
  {
    id: 'mumbai',
    type: 'location',
    name: 'Mumbai',
    description: 'Financial Capital of India',
    coordinates: [72.8777, 19.0760],
    bounds: {
      southwest: [72.7767, 18.8930],
      northeast: [72.9787, 19.2710]
    },
    category: 'city',
    priority: 10
  },
  {
    id: 'bangalore',
    type: 'location',
    name: 'Bangalore',
    description: 'Silicon Valley of India',
    coordinates: [77.5946, 12.9716],
    bounds: {
      southwest: [77.3792, 12.8340],
      northeast: [77.7800, 13.1428]
    },
    category: 'city',
    priority: 10
  },
  {
    id: 'chennai',
    type: 'location',
    name: 'Chennai',
    description: 'Detroit of India',
    coordinates: [80.2707, 13.0827],
    bounds: {
      southwest: [80.1707, 12.9827],
      northeast: [80.3707, 13.1827]
    },
    category: 'city',
    priority: 10
  },
  {
    id: 'kolkata',
    type: 'location',
    name: 'Kolkata',
    description: 'Cultural Capital of India',
    coordinates: [88.3639, 22.5726],
    bounds: {
      southwest: [88.2639, 22.4726],
      northeast: [88.4639, 22.6726]
    },
    category: 'city',
    priority: 10
  },
  // Regions and States
  {
    id: 'karnataka',
    type: 'region',
    name: 'Karnataka',
    description: 'State in South India',
    coordinates: [75.7139, 15.3173],
    bounds: {
      southwest: [74.0844, 11.5940],
      northeast: [78.5880, 18.4760]
    },
    category: 'state',
    priority: 8
  },
  {
    id: 'maharashtra',
    type: 'region',
    name: 'Maharashtra',
    description: 'Western Indian State',
    coordinates: [75.7139, 19.7515],
    bounds: {
      southwest: [72.6369, 15.5988],
      northeast: [80.9030, 22.0280]
    },
    category: 'state',
    priority: 8
  },
  // Landmarks and Areas
  {
    id: 'india-gate',
    type: 'landmark',
    name: 'India Gate',
    description: 'War Memorial in Delhi',
    coordinates: [77.2295, 28.6129],
    bounds: {
      southwest: [77.2195, 28.6029],
      northeast: [77.2395, 28.6229]
    },
    category: 'landmark',
    priority: 9
  },
  {
    id: 'gateway-of-india',
    type: 'landmark',
    name: 'Gateway of India',
    description: 'Monument in Mumbai',
    coordinates: [72.8347, 18.9220],
    bounds: {
      southwest: [72.8247, 18.9120],
      northeast: [72.8447, 18.9320]
    },
    category: 'landmark',
    priority: 9
  },
  {
    id: 'vidhana-soudha',
    type: 'landmark',
    name: 'Vidhana Soudha',
    description: 'Government Building in Bangalore',
    coordinates: [77.5919, 12.9791],
    bounds: {
      southwest: [77.5819, 12.9691],
      northeast: [77.6019, 12.9891]
    },
    category: 'landmark',
    priority: 9
  }
];

// ===== SEARCH COMPONENT =====

interface AdvancedSearchBarProps {
  onSearch: (query: string) => void;
  onSuggestionSelect: (suggestion: SearchSuggestion) => void;
  onBoundsChange: (bounds: RegionBounds) => void;
  placeholder?: string;
  className?: string;
}

const AdvancedSearchBar: React.FC<AdvancedSearchBarProps> = ({
  onSearch,
  onSuggestionSelect,
  onBoundsChange,
  placeholder = "Search for cities, landmarks, or regions...",
  className = ""
}) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Real-time search with debouncing
  useEffect(() => {
    if (query.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsLoading(true);
    const debounceTimer = setTimeout(() => {
      performSearch(query);
    }, 150); // 150ms debounce for smooth UX

    return () => clearTimeout(debounceTimer);
  }, [query]);

  const performSearch = useCallback((searchQuery: string) => {
    const filtered = LOCATION_DATA.filter(item => {
      const searchLower = searchQuery.toLowerCase();
      const nameMatch = item.name.toLowerCase().includes(searchLower);
      const descMatch = item.description.toLowerCase().includes(searchLower);
      const categoryMatch = item.category?.toLowerCase().includes(searchLower);
      const typeMatch = item.type.toLowerCase().includes(searchLower);

      return nameMatch || descMatch || categoryMatch || typeMatch;
    }).sort((a, b) => {
      // Sort by relevance and priority
      const aStartsWith = a.name.toLowerCase().startsWith(searchQuery.toLowerCase());
      const bStartsWith = b.name.toLowerCase().startsWith(searchQuery.toLowerCase());

      if (aStartsWith && !bStartsWith) return -1;
      if (!aStartsWith && bStartsWith) return 1;

      return b.priority - a.priority;
    }).slice(0, 8); // Limit to 8 suggestions

    setSuggestions(filtered);
    setShowSuggestions(filtered.length > 0);
    setIsLoading(false);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!showSuggestions) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, suggestions.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          handleSuggestionSelect(suggestions[selectedIndex]);
        } else if (query.trim()) {
          handleSearch();
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  }, [showSuggestions, selectedIndex, suggestions, query]);

  const handleSuggestionSelect = useCallback((suggestion: SearchSuggestion) => {
    setQuery(suggestion.name);
    setShowSuggestions(false);
    setSelectedIndex(-1);
    onSuggestionSelect(suggestion);

    // Zoom to the selected location
    if (suggestion.bounds) {
      onBoundsChange(suggestion.bounds);
    } else {
      // Create bounds around the point
      const buffer = 0.01; // ~1km buffer
      onBoundsChange({
        southwest: [suggestion.coordinates[0] - buffer, suggestion.coordinates[1] - buffer],
        northeast: [suggestion.coordinates[0] + buffer, suggestion.coordinates[1] + buffer]
      });
    }
  }, [onSuggestionSelect, onBoundsChange]);

  const handleSearch = useCallback(() => {
    if (query.trim()) {
      onSearch(query.trim());
      setShowSuggestions(false);
    }
  }, [query, onSearch]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setSelectedIndex(-1);
  }, []);

  const handleInputFocus = useCallback(() => {
    if (suggestions.length > 0) {
      setShowSuggestions(true);
    }
  }, [suggestions.length]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'location':
      case 'landmark':
        return <MapPin className="w-4 h-4 text-blue-500" />;
      case 'region':
        return <Layers className="w-4 h-4 text-green-500" />;
      case 'area':
        return <TrendingUp className="w-4 h-4 text-purple-500" />;
      default:
        return <Search className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleInputFocus}
          placeholder={placeholder}
          className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg bg-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
        />
        {isLoading && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
          </div>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <div
              key={suggestion.id}
              className={`flex items-center px-4 py-3 cursor-pointer hover:bg-gray-50 ${
                index === selectedIndex ? 'bg-blue-50' : ''
              }`}
              onClick={() => handleSuggestionSelect(suggestion)}
            >
              <div className="flex-shrink-0 mr-3">
                {getSuggestionIcon(suggestion.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {suggestion.name}
                  </p>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                    suggestion.type === 'location' ? 'bg-blue-100 text-blue-800' :
                    suggestion.type === 'landmark' ? 'bg-purple-100 text-purple-800' :
                    suggestion.type === 'region' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {suggestion.category || suggestion.type}
                  </span>
                </div>
                <p className="text-sm text-gray-500 truncate">
                  {suggestion.description}
                </p>
                <p className="text-xs text-gray-400">
                  {suggestion.coordinates[1].toFixed(4)}, {suggestion.coordinates[0].toFixed(4)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No results */}
      {showSuggestions && suggestions.length === 0 && query.length >= 2 && !isLoading && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg p-4">
          <div className="flex items-center">
            <Search className="h-5 w-5 text-gray-400 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-900">No results found</p>
              <p className="text-sm text-gray-500">Try searching for cities, landmarks, or regions</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ===== ADVANCED DASHBOARD COMPONENT =====

interface AdvancedHeatmapDashboardProps {
  className?: string;
}

export const AdvancedHeatmapDashboard: React.FC<AdvancedHeatmapDashboardProps> = ({
  className = ''
}) => {
  // ===== STATE =====
  const [currentBounds, setCurrentBounds] = useState<RegionBounds>({
    southwest: [77.3792, 12.8340], // Bangalore area
    northeast: [77.7800, 13.1428]
  });
  const [selectedTimeframe, setSelectedTimeframe] = useState<'1h' | '24h' | '7d' | '30d'>('24h');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(true);
  const [searchHistory, setSearchHistory] = useState<SearchResult[]>([]);

  // ===== HOOKS =====
  const { state } = useHeatmapData({
    bounds: currentBounds,
    config: {
      analytics: {
        enableTrends: true,
        enableAnomalyDetection: true,
        enableClustering: true,
        enablePredictions: false,
        historicalDepth: 30,
        refreshInterval: 300000
      },
      realtime: {
        enabled: true,
        updateInterval: 30000,
        autoRefresh: true,
        pushNotifications: true,
        anomalyAlerts: true,
        predictionUpdates: false
      }
    },
    enableRealtime: true,
    enablePerformanceTracking: true
  });

  // ===== COMPUTED VALUES =====
  const metrics = useMemo(() => {
    if (!state.data) return null;
    return {
      totalDataPoints: state.data.dataPoints?.length || 0,
      totalClusters: state.data.clusters?.length || 0,
      totalAnomalies: state.data.anomalies?.length || 0,
      averageIntensity: 0,
      maxIntensity: 0,
      trendDirection: 'stable' as const,
      changePercentage: 0
    };
  }, [state.data]);

  // ===== HANDLERS =====
  const handleSearch = useCallback((query: string) => {
    // Add to search history
    const searchResult: SearchResult = {
      query,
      suggestions: [],
      timestamp: new Date()
    };
    setSearchHistory(prev => [searchResult, ...prev.slice(0, 9)]); // Keep last 10 searches

    // Try to find a matching location
    const matchingLocation = LOCATION_DATA.find(loc =>
      loc.name.toLowerCase().includes(query.toLowerCase()) ||
      loc.description.toLowerCase().includes(query.toLowerCase())
    );

    if (matchingLocation) {
      setCurrentBounds(matchingLocation.bounds || {
        southwest: [matchingLocation.coordinates[0] - 0.01, matchingLocation.coordinates[1] - 0.01],
        northeast: [matchingLocation.coordinates[0] + 0.01, matchingLocation.coordinates[1] + 0.01]
      });
    }
  }, []);

  const handleSuggestionSelect = useCallback((suggestion: SearchSuggestion) => {
    // Add to search history
    const searchResult: SearchResult = {
      query: suggestion.name,
      suggestions: [suggestion],
      selectedSuggestion: suggestion,
      timestamp: new Date()
    };
    setSearchHistory(prev => [searchResult, ...prev.slice(0, 9)]);

    // Update bounds
    setCurrentBounds(suggestion.bounds || {
      southwest: [suggestion.coordinates[0] - 0.01, suggestion.coordinates[1] - 0.01],
      northeast: [suggestion.coordinates[0] + 0.01, suggestion.coordinates[1] + 0.01]
    });
  }, []);

  const handleBoundsChange = useCallback((bounds: RegionBounds) => {
    setCurrentBounds(bounds);
  }, []);

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(!isFullscreen);
  }, [isFullscreen]);

  // ===== RENDER =====
  return (
    <div className={`advanced-heatmap-dashboard ${isFullscreen ? 'fixed inset-0 z-50 bg-white' : 'w-full h-full'} ${className}`}>
      {/* Header with Search */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex-1 max-w-2xl">
            <AdvancedSearchBar
              onSearch={handleSearch}
              onSuggestionSelect={handleSuggestionSelect}
              onBoundsChange={handleBoundsChange}
              placeholder="Search cities, landmarks, regions, or addresses..."
            />
          </div>

          <div className="flex items-center space-x-3 ml-4">
            <button
              onClick={() => setShowAnalytics(!showAnalytics)}
              className={`p-2 rounded-lg transition-colors ${
                showAnalytics ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'
              }`}
              title={showAnalytics ? 'Hide Analytics' : 'Show Analytics'}
            >
              <TrendingUp className="w-5 h-5" />
            </button>

            <button
              onClick={toggleFullscreen}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
              title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>

            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span>Live</span>
              </div>
              <span>•</span>
              <span>Last updated: {state.lastUpdated?.toLocaleTimeString() || 'Never'}</span>
            </div>
          </div>
        </div>

        {/* Quick Stats Bar */}
        {metrics && (
          <div className="flex items-center space-x-6 mt-4 text-sm">
            <div className="flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-blue-500" />
              <span className="font-medium">{metrics.totalDataPoints.toLocaleString()}</span>
              <span className="text-gray-500">Data Points</span>
            </div>
            <div className="flex items-center space-x-2">
              <Layers className="w-4 h-4 text-green-500" />
              <span className="font-medium">{metrics.totalClusters}</span>
              <span className="text-gray-500">Clusters</span>
            </div>
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <span className="font-medium">{metrics.totalAnomalies}</span>
              <span className="text-gray-500">Anomalies</span>
            </div>
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-purple-500" />
              <span className="font-medium">{metrics.averageIntensity.toFixed(1)}</span>
              <span className="text-gray-500">Avg Intensity</span>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex h-[calc(100%-120px)]">
        {/* Map Section */}
        <div className={`${showAnalytics ? 'flex-1' : 'w-full'} relative`}>
          <HeatmapVisualization
            initialBounds={currentBounds}
            enableRealtime={true}
            enableControls={true}
            enableSidebar={false} // Disable sidebar for cleaner look
            enableTooltips={true}
            enableAnalytics={true}
            onBoundsChange={handleBoundsChange}
            className="h-full"
            style={{ height: '100%' }}
          />

          {/* Map Overlay Info */}
          <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
            <div className="text-sm font-medium text-gray-900">Regional Heatmap</div>
            <div className="text-xs text-gray-600 mt-1">
              {currentBounds.southwest[1].toFixed(4)}°N, {currentBounds.southwest[0].toFixed(4)}°E to{' '}
              {currentBounds.northeast[1].toFixed(4)}°N, {currentBounds.northeast[0].toFixed(4)}°E
            </div>
          </div>
        </div>

        {/* Analytics Sidebar */}
        {showAnalytics && (
          <div className="w-96 bg-white border-l border-gray-200 overflow-y-auto">
            <div className="p-6 space-y-6">
              {/* Time Range Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Time Range
                </label>
                <select
                  value={selectedTimeframe}
                  onChange={(e) => setSelectedTimeframe(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="1h">Last Hour</option>
                  <option value="24h">Last 24 Hours</option>
                  <option value="7d">Last 7 Days</option>
                  <option value="30d">Last 30 Days</option>
                </select>
              </div>

              {/* Placeholder for future analytics */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Analytics</h3>
                <div className="text-center py-8 text-gray-500">
                  <TrendingUp className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>Advanced analytics coming soon</p>
                </div>
              </div>

              {/* Search History */}
              {searchHistory.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Searches</h3>
                  <div className="space-y-2">
                    {searchHistory.slice(0, 5).map((search, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-700">{search.query}</span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {search.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdvancedHeatmapDashboard;
