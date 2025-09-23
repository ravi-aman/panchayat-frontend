import React, { useRef, useEffect, useState } from 'react';
import { Map } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import SearchAndNavigate, { PhotonFeature } from '../components/common/SearchAndNavigate';

interface MapPageProps {
  apiKey?: string;
  mapStyle?: string;
  initialCenter?: [number, number];
  initialZoom?: number;
  darkMode?: boolean;
}

/**
 * Example map page showing how to use the SearchAndNavigate component
 */
const MapPage: React.FC<MapPageProps> = ({
  apiKey = '', // You'll need to provide an actual API key when using this component
  mapStyle = 'https://api.maptiler.com/maps/streets/style.json',
  initialCenter = [0, 0],
  initialZoom = 2,
  darkMode = false,
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<Map | null>(null);
  const [mapInstance, setMapInstance] = useState<Map | null>(null);

  // Handle location selection from search component
  const handleLocationSelect = (location: PhotonFeature) => {
    console.log('Selected location:', location);
    // You could do additional things here like storing in state,
    // updating a form, sending to an API, etc.
  };

  // Initialize map on component mount
  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    console.log('Initializing map...');

    // Set up the map
    let mapStyleUrl = mapStyle;
    
    // If using MapTiler or similar service that requires API key
    if (apiKey) {
      const mapUrl = new URL(mapStyle);
      mapUrl.searchParams.append('key', apiKey);
      mapStyleUrl = mapUrl.toString();
    } 
    // Fallback to OSM style if no API key provided
    else if (mapStyle.includes('maptiler.com') || mapStyle.includes('mapbox.com')) {
      console.log('No API key provided, using OSM style');
      mapStyleUrl = 'https://demotiles.maplibre.org/style.json';
    }

    const newMap = new Map({
      container: mapContainer.current,
      style: mapStyleUrl,
      center: initialCenter,
      zoom: initialZoom,
      attributionControl: false,
    });

    // Store map reference
    map.current = newMap;

    // Make map instance available to children once loaded
    newMap.on('load', () => {
      console.log('Map loaded successfully, setting map instance...');
      setMapInstance(newMap);
    });

    // Clean up on unmount
    return () => {
      if (map.current) {
        console.log('Cleaning up map instance');
        map.current.remove();
        map.current = null;
      }
    };
  }, [mapStyle, apiKey, initialCenter, initialZoom]);

  return (
    <div className="relative w-full h-screen">
      {/* Map container */}
      <div 
        ref={mapContainer} 
        className="absolute inset-0" 
        data-testid="map-container"
      />
      
      {/* Search component (mobile version for small screens) */}
      <div className="absolute top-4 left-4 right-4 md:hidden">
        <SearchAndNavigate
          map={mapInstance}
          onLocationSelect={handleLocationSelect}
          placeholder="Search for a place..."
          mobile={true}
          darkMode={darkMode}
          markerColor="#F59E0B" // Amber
          flyToDuration={2000}
          flyToZoom={15}
        />
      </div>
      
      {/* Search component (desktop version) */}
      <div className="absolute top-4 left-4 hidden md:block w-96 z-10">
        <SearchAndNavigate
          map={mapInstance}
          onLocationSelect={handleLocationSelect}
          placeholder="Search for a place..."
          darkMode={darkMode}
          className="w-full"
          markerColor="#3B82F6" // Blue
          flyToDuration={1500}
          flyToZoom={14}
        />
      </div>
    </div>
  );
};

export default MapPage;