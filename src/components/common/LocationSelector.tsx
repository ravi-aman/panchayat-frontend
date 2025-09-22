import React, { useState, useEffect } from 'react';
import { MapPin, Search, X } from 'lucide-react';
import {
  getIndianStates,
  getIndianCities,
  getMajorIndianCities,
  searchIndianCities,
  getStateCodeByName,
  type CityOption,
} from '../../utils/locationData';

interface LocationSelectorProps {
  label: string;
  value: string;
  onChange: (location: string) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
  type?: 'region' | 'city' | 'both';
}

const LocationSelector: React.FC<LocationSelectorProps> = ({
  label,
  value,
  onChange,
  placeholder = 'Select location',
  required = false,
  error,
  type = 'both',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedState, setSelectedState] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'regions' | 'states' | 'cities'>('regions');

  const states = getIndianStates();
  const majorCities = getMajorIndianCities();

  const regions = [
    'All India',
    'North India',
    'South India',
    'East India',
    'West India',
    'Central India',
    'Northeast India',
    'Mumbai Metropolitan',
    'Delhi NCR',
    'Bangalore Urban',
    'Chennai Metropolitan',
    'Hyderabad Metropolitan',
    'Pune Metropolitan',
    'Kolkata Metropolitan',
    'Ahmedabad Metropolitan',
  ];

  const [stateCities, setStateCities] = useState<CityOption[]>([]);
  const [searchResults, setSearchResults] = useState<CityOption[]>([]);

  useEffect(() => {
    if (selectedState) {
      const stateCode = getStateCodeByName(selectedState);
      if (stateCode) {
        setStateCities(getIndianCities(stateCode));
      }
    }
  }, [selectedState]);

  useEffect(() => {
    if (searchTerm.length > 2) {
      setSearchResults(searchIndianCities(searchTerm, 15));
    } else {
      setSearchResults([]);
    }
  }, [searchTerm]);

  const handleSelect = (location: string) => {
    onChange(location);
    setIsOpen(false);
    setSearchTerm('');
    setSelectedState('');
  };

  const filteredRegions = regions.filter((region) =>
    region.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const filteredStates = states.filter((state) =>
    state.label.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const filteredMajorCities = majorCities.filter((city) =>
    city.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const filteredStateCities = stateCities.filter((city) =>
    city.label.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="space-y-1">
      <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
        <MapPin className="w-4 h-4" />
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>

      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full px-3 py-2.5 text-sm border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-left flex items-center justify-between ${
            error ? 'border-red-300 bg-red-50' : 'border-slate-300 hover:border-slate-400'
          }`}
        >
          <span className={value ? 'text-slate-900' : 'text-slate-500'}>
            {value || placeholder}
          </span>
          <MapPin className="w-4 h-4 text-slate-400" />
        </button>

        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg border-slate-200 max-h-80 overflow-hidden">
            {/* Search Input */}
            <div className="p-3 border-b border-slate-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search locations..."
                  className="w-full pl-10 pr-8 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    title="Clear search"
                    aria-label="Clear search"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Search Results */}
            {searchTerm.length > 2 && searchResults.length > 0 && (
              <div className="max-h-48 overflow-y-auto">
                <div className="p-2 text-xs font-medium text-slate-500 bg-slate-50">
                  Search Results
                </div>
                {searchResults.map((city, index) => (
                  <button
                    key={`search-${index}`}
                    onClick={() => handleSelect(city.label)}
                    className="w-full px-3 py-2 text-sm text-left hover:bg-slate-50 focus:bg-slate-50 focus:outline-none"
                  >
                    <div className="font-medium">{city.label}</div>
                    <div className="text-xs text-slate-500">
                      {states.find((s) => s.code === city.stateCode)?.label}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Tabs */}
            {searchTerm.length <= 2 && (
              <>
                <div className="flex border-b border-slate-200">
                  {type !== 'city' && (
                    <button
                      onClick={() => setActiveTab('regions')}
                      className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
                        activeTab === 'regions'
                          ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      Regions
                    </button>
                  )}
                  <button
                    onClick={() => setActiveTab('states')}
                    className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
                      activeTab === 'states'
                        ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    States
                  </button>
                  <button
                    onClick={() => setActiveTab('cities')}
                    className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
                      activeTab === 'cities'
                        ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    Cities
                  </button>
                </div>

                {/* Content */}
                <div className="max-h-48 overflow-y-auto">
                  {/* Regions Tab */}
                  {activeTab === 'regions' && type !== 'city' && (
                    <div>
                      {filteredRegions.map((region, index) => (
                        <button
                          key={`region-${index}`}
                          onClick={() => handleSelect(region)}
                          className="w-full px-3 py-2 text-sm text-left hover:bg-slate-50 focus:bg-slate-50 focus:outline-none"
                        >
                          {region}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* States Tab */}
                  {activeTab === 'states' && (
                    <div>
                      {filteredStates.map((state, index) => (
                        <button
                          key={`state-${index}`}
                          onClick={() => {
                            if (type === 'city') {
                              setSelectedState(state.label);
                              setActiveTab('cities');
                            } else {
                              handleSelect(state.label);
                            }
                          }}
                          className="w-full px-3 py-2 text-sm text-left hover:bg-slate-50 focus:bg-slate-50 focus:outline-none flex items-center justify-between"
                        >
                          {state.label}
                          {type === 'city' && <span className="text-xs text-slate-400">→</span>}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Cities Tab */}
                  {activeTab === 'cities' && (
                    <div>
                      {!selectedState && (
                        <>
                          <div className="p-2 text-xs font-medium text-slate-500 bg-slate-50">
                            Major Cities
                          </div>
                          {filteredMajorCities.map((city, index) => (
                            <button
                              key={`major-city-${index}`}
                              onClick={() => handleSelect(city)}
                              className="w-full px-3 py-2 text-sm text-left hover:bg-slate-50 focus:bg-slate-50 focus:outline-none"
                            >
                              {city}
                            </button>
                          ))}
                        </>
                      )}

                      {selectedState && (
                        <>
                          <div className="p-2 text-xs font-medium text-slate-500 bg-slate-50 flex items-center justify-between">
                            Cities in {selectedState}
                            <button
                              onClick={() => {
                                setSelectedState('');
                                setActiveTab('states');
                              }}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              ← Back to States
                            </button>
                          </div>
                          {filteredStateCities.map((city, index) => (
                            <button
                              key={`state-city-${index}`}
                              onClick={() => handleSelect(city.label)}
                              className="w-full px-3 py-2 text-sm text-left hover:bg-slate-50 focus:bg-slate-50 focus:outline-none"
                            >
                              {city.label}
                            </button>
                          ))}
                        </>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* No Results */}
            {searchTerm.length > 2 && searchResults.length === 0 && (
              <div className="p-4 text-sm text-center text-slate-500">
                No locations found for "{searchTerm}"
              </div>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-1 text-xs text-red-600">
          <MapPin className="w-3 h-3" />
          {error}
        </div>
      )}
    </div>
  );
};

export default LocationSelector;
