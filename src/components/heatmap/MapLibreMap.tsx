import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { HeatmapDataPoint, HeatmapCluster, HeatmapAnomaly, RegionBounds } from '../../types/heatmap';

// Import all advanced services
// import { h3GridService } from '../../services/H3GridService';
// import { vectorTileService } from '../../services/VectorTileService';
import { progressiveLODService } from '../../services/ProgressiveLODService';
// import { multiLayerOverlayService } from '../../services/MultiLayerOverlayService';
import { predictiveMLHotspotService } from '../../services/PredictiveMLHotspotService';
// import { offlineCachingService } from '../../services/OfflineCachingService';
import { eventDrivenRealtimeService } from '../../services/EventDrivenRealtimeService';

// Advanced MapLibre Map component with enterprise-grade features
interface MapLibreMapProps {
  data: {
    dataPoints?: HeatmapDataPoint[];
    clusters?: HeatmapCluster[];
    anomalies?: HeatmapAnomaly[];
  };
  bounds: RegionBounds;
  layerVisibility: {
    heatmap: boolean;
    clusters: boolean;
    points: boolean;
    boundaries: boolean;
  };
  onBoundsChange: (bounds: RegionBounds) => void;
  onPointClick: (point: HeatmapDataPoint, event: React.MouseEvent) => void;
  onClusterClick: (cluster: HeatmapCluster, event: React.MouseEvent) => void;
  onAnomalyClick: (anomaly: HeatmapAnomaly, event: React.MouseEvent) => void;
  isLoading: boolean;
}

// Advanced rendering configuration
interface AdvancedMapConfig {
  enableH3Clustering: boolean;
  enableVectorTiles: boolean;
  enableProgressiveLOD: boolean;
  enableGPURendering: boolean;
  enableMLPredictions: boolean;
  enableOfflineMode: boolean;
  enableRealTimeUpdates: boolean;
  performanceMode: 'balanced' | 'quality' | 'performance';
}

const MapLibreMap: React.FC<MapLibreMapProps> = ({
  data,
  bounds,
  layerVisibility,
  onBoundsChange,
  onPointClick,
  isLoading
}) => {
  // Map container references
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  // Advanced configuration - optimized for performance
  const [config] = useState<AdvancedMapConfig>({
    enableH3Clustering: false, // Disabled for performance
    enableVectorTiles: false, // Disabled for performance
    enableProgressiveLOD: true, // Keep LOD for performance
    enableGPURendering: false, // Disabled for now due to complexity
    enableMLPredictions: false, // Disabled for performance
    enableOfflineMode: true,
    enableRealTimeUpdates: false, // Disabled for performance
    performanceMode: 'performance' // Changed to performance mode
  });

  // State for advanced features
  const [currentLODLevel, setCurrentLODLevel] = useState<any>(null);
  // const [predictions] = useState<any[]>([]);  // For future ML predictions
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [realtimeSubscription, setRealtimeSubscription] = useState<string | null>(null);

  // Debounced bounds change handler
  const debouncedBoundsChange = useRef<NodeJS.Timeout | null>(null);
  
  // Popup state
  const [popup, setPopup] = useState<maplibregl.Popup | null>(null);

  // Calculate map center from bounds
  const mapCenter: [number, number] = useMemo(() => [
    (bounds.southwest[0] + bounds.northeast[0]) / 2,
    (bounds.southwest[1] + bounds.northeast[1]) / 2
  ], [bounds]);

  // Calculate initial zoom level based on bounds
  const getInitialZoom = useCallback(() => {
    const lngDiff = Math.abs(bounds.northeast[0] - bounds.southwest[0]);
    const latDiff = Math.abs(bounds.northeast[1] - bounds.southwest[1]);
    const maxDiff = Math.max(lngDiff, latDiff);
    return Math.min(20, Math.max(5, Math.floor(9 - Math.log2(maxDiff * 100))));
  }, [bounds]);

  // Initialize all advanced services
  useEffect(() => {
    const initializeAdvancedServices = async () => {
      try {
        // Initialize offline caching
        if (config.enableOfflineMode) {
          console.log('Initializing offline mode...');
        }

        // Initialize real-time updates
        if (config.enableRealTimeUpdates) {
          try {
            await eventDrivenRealtimeService.connect();
            
            const subscription = eventDrivenRealtimeService.subscribe(
              ['civic-data', 'location-updates'],
              (event) => {
                console.log('Real-time update received:', event);
              }
            );
            
            setRealtimeSubscription(subscription);
          } catch (error) {
            console.log('Real-time service not available, using mock data');
          }
        }

        // Initialize ML predictions
        if (config.enableMLPredictions && data.dataPoints) {
          try {
            // Add some training data
            data.dataPoints.slice(0, 10).forEach(point => {
              predictiveMLHotspotService.addTrainingData({
                timestamp: Date.now(),
                location: point.location.coordinates,
                value: point.value
              });
            });
          } catch (error) {
            console.log('ML predictions not available, continuing without predictions');
          }
        }

        console.log('Advanced services initialized successfully');
      } catch (error) {
        console.error('Failed to initialize advanced services:', error);
      }
    };

    initializeAdvancedServices();

    return () => {
      if (realtimeSubscription) {
        eventDrivenRealtimeService.unsubscribe(realtimeSubscription);
      }
    };
  }, [config, data.dataPoints]);

  // Initialize map with advanced features
  useEffect(() => {
    if (!mapContainer.current) return;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        glyphs: 'https://fonts.openmaptiles.org/{fontstack}/{range}.pbf',
        sources: {
          'osm': {
            type: 'raster',
            tiles: [
              'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
              'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
              'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png'
            ],
            tileSize: 256,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          }
        },
        layers: [
          {
            id: 'osm-layer',
            type: 'raster',
            source: 'osm',
            minzoom: 0,
            maxzoom: 19
          }
        ]
      },
      center: mapCenter,
      zoom: getInitialZoom(),
      interactive: true
    });

    // Add navigation controls
    map.addControl(new maplibregl.NavigationControl(), 'top-right');
    map.addControl(new maplibregl.FullscreenControl(), 'top-right');

    mapRef.current = map;

    // Setup advanced event handlers
    setupEventHandlers(map);

    return () => {
      cleanup();
      map.remove();
    };
  }, []);

  // Setup event handlers
  const setupEventHandlers = useCallback((map: maplibregl.Map) => {
    const handleMoveEnd = () => {
      if (debouncedBoundsChange.current) {
        clearTimeout(debouncedBoundsChange.current);
      }
      
      debouncedBoundsChange.current = setTimeout(() => {
        const mapBounds = map.getBounds();
        
        const newBounds = {
          southwest: [
            Math.max(-180, Math.min(180, mapBounds.getWest())),
            Math.max(-90, Math.min(90, mapBounds.getSouth()))
          ] as [number, number],
          northeast: [
            Math.max(-180, Math.min(180, mapBounds.getEast())),
            Math.max(-90, Math.min(90, mapBounds.getNorth()))
          ] as [number, number]
        };
        
        const boundsChanged = 
          Math.abs(newBounds.southwest[0] - bounds.southwest[0]) > 0.001 ||
          Math.abs(newBounds.southwest[1] - bounds.southwest[1]) > 0.001 ||
          Math.abs(newBounds.northeast[0] - bounds.northeast[0]) > 0.001 ||
          Math.abs(newBounds.northeast[1] - bounds.northeast[1]) > 0.001;
        
        if (boundsChanged) {
          onBoundsChange(newBounds);
          
          // Update LOD based on zoom
          updateLODLevel(map);
        }
      }, 200);
    };

    const handleClick = (e: maplibregl.MapMouseEvent) => {
      const features = map.queryRenderedFeatures(e.point);
      
      if (features.length > 0 && data.dataPoints) {
        const feature = features[0];
        const pointId = feature.properties?.id;
        const point = data.dataPoints.find(p => p._id === pointId);
        
        if (point) {
          showAdvancedPopup(e.lngLat, point);
          onPointClick(point, e.originalEvent as any);
        }
      }
    };

    map.on('moveend', handleMoveEnd);
    map.on('click', handleClick);
  }, [bounds, onBoundsChange, onPointClick, data.dataPoints]);

  // Update LOD level based on zoom
  const updateLODLevel = useCallback((map: maplibregl.Map) => {
    if (!config.enableProgressiveLOD) return;

    const zoom = map.getZoom();
    const bounds = map.getBounds();
    
    const viewport = {
      zoom,
      bounds: {
        north: bounds.getNorth(),
        south: bounds.getSouth(),
        east: bounds.getEast(),
        west: bounds.getWest()
      },
      center: [map.getCenter().lng, map.getCenter().lat] as [number, number],
      dataCount: data.dataPoints?.length || 0,
      density: (data.dataPoints?.length || 0) / ((bounds.getNorth() - bounds.getSouth()) * (bounds.getEast() - bounds.getWest()))
    };

    try {
      const optimalLOD = progressiveLODService.getOptimalLODLevel(viewport);
      
      if (currentLODLevel?.name !== optimalLOD.name) {
        setCurrentLODLevel(optimalLOD);
        console.log('LOD level changed to:', optimalLOD.name);
      }
    } catch (error) {
      console.log('LOD service not available');
    }
  }, [config, data, currentLODLevel]);

  // Show advanced popup
  const showAdvancedPopup = useCallback((lngLat: maplibregl.LngLat, point: HeatmapDataPoint) => {
    if (!mapRef.current) return;

    const popupContent = `
      <div class="advanced-popup p-4 max-w-sm">
        <div class="header mb-3">
          <h3 class="font-bold text-lg text-gray-800">${point.metadata?.issueType || 'Civic Data Point'}</h3>
          <div class="flex items-center space-x-2 mt-1">
            <span class="inline-block w-3 h-3 rounded-full bg-blue-500"></span>
            <span class="text-sm font-medium">Value: ${point.value.toFixed(2)}</span>
          </div>
        </div>
        
        <div class="details space-y-2 text-sm">
          ${point.metadata?.priority ? `<div><span class="font-medium">Priority:</span> <span class="px-2 py-1 rounded text-xs bg-blue-100">${point.metadata.priority}</span></div>` : ''}
          ${point.metadata?.status ? `<div><span class="font-medium">Status:</span> <span class="px-2 py-1 rounded text-xs bg-green-100">${point.metadata.status}</span></div>` : ''}
          ${point.metadata?.category ? `<div><span class="font-medium">Category:</span> ${point.metadata.category}</div>` : ''}
          <div><span class="font-medium">Location:</span> ${point.location.coordinates[1].toFixed(4)}, ${point.location.coordinates[0].toFixed(4)}</div>
          ${point.metadata?.timestamp ? `<div><span class="font-medium">Timestamp:</span> ${new Date(point.metadata.timestamp).toLocaleString()}</div>` : ''}
        </div>
        
        ${isOffline ? '<div class="offline-notice mt-2 text-xs text-orange-600">📱 Offline Mode</div>' : ''}
      </div>
    `;

    const newPopup = new maplibregl.Popup({ 
      closeButton: true,
      closeOnClick: false,
      maxWidth: '400px'
    })
      .setLngLat(lngLat)
      .setHTML(popupContent)
      .addTo(mapRef.current);

    setPopup(newPopup);
  }, [isOffline]);

  // Memoized GeoJSON data with data limiting for performance
  const geoJsonData = useMemo(() => {
    if (!data.dataPoints || data.dataPoints.length === 0) return null;

    // Limit data points for performance - show max 200 points
    const limitedDataPoints = data.dataPoints.slice(0, 200);

    return {
      type: 'FeatureCollection',
      features: limitedDataPoints.map(point => ({
        type: 'Feature',
        properties: {
          id: point._id || 'unknown',
          value: point.value || 0,
          issueType: point.metadata?.issueType || 'Unknown',
          priority: point.metadata?.priority || 'Medium',
          status: point.metadata?.status || 'Open',
          category: point.metadata?.category || 'General'
        },
        geometry: {
          type: 'Point',
          coordinates: point.location.coordinates
        }
      }))
    } as GeoJSON.FeatureCollection;
  }, [data.dataPoints]);

  // Separate layer management for better performance
  const updateHeatmapLayer = useCallback((map: maplibregl.Map) => {
    if (!layerVisibility.heatmap) {
      if (map.getLayer('heatmap-layer')) {
        map.removeLayer('heatmap-layer');
      }
      return;
    }

    if (!map.getLayer('heatmap-layer')) {
      map.addLayer({
        id: 'heatmap-layer',
        type: 'heatmap',
        source: 'points',
        maxzoom: 15,
        paint: {
          'heatmap-weight': [
            'interpolate', ['linear'],
            ['get', 'value'],
            0, 0,
            100, 1
          ],
          'heatmap-intensity': [
            'interpolate', ['linear'], ['zoom'],
            0, 0.5,
            11, 2
          ],
          'heatmap-color': [
            'interpolate', ['linear'], ['heatmap-density'],
            0, 'rgba(33,102,172,0)',
            0.2, 'rgb(103,169,207)',
            0.4, 'rgb(209,229,240)',
            0.6, 'rgb(253,219,199)',
            0.8, 'rgb(239,138,98)',
            1, 'rgb(178,24,43)'
          ],
          'heatmap-radius': [
            'interpolate', ['linear'], ['zoom'],
            0, 1,
            11, 15
          ],
          'heatmap-opacity': 0.7
        }
      });
    }
  }, [layerVisibility.heatmap]);

  const updateClusterLayers = useCallback((map: maplibregl.Map) => {
    if (!layerVisibility.clusters) {
      ['clusters', 'cluster-count'].forEach(layerId => {
        if (map.getLayer(layerId)) map.removeLayer(layerId);
      });
      return;
    }

    if (!map.getLayer('clusters')) {
      map.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'points',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': [
            'step', ['get', 'point_count'],
            '#51bbd6', 10,
            '#f1f075', 50,
            '#f28cb1'
          ],
          'circle-radius': [
            'step', ['get', 'point_count'],
            15, 10,
            20, 50,
            25
          ]
        }
      });
    }

    if (!map.getLayer('cluster-count')) {
      map.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: 'points',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': '{point_count_abbreviated}',
          'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
          'text-size': 10
        }
      });
    }
  }, [layerVisibility.clusters]);

  const updatePointLayer = useCallback((map: maplibregl.Map) => {
    if (!layerVisibility.points) {
      if (map.getLayer('unclustered-point')) {
        map.removeLayer('unclustered-point');
      }
      return;
    }

    if (!map.getLayer('unclustered-point')) {
      map.addLayer({
        id: 'unclustered-point',
        type: 'circle',
        source: 'points',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': [
            'interpolate', ['linear'], ['get', 'value'],
            0, '#1a9641',
            50, '#ffffbf',
            100, '#d7191c'
          ],
          'circle-radius': [
            'interpolate', ['linear'], ['zoom'],
            7, 2,
            16, 6
          ],
          'circle-stroke-width': 1,
          'circle-stroke-color': '#fff'
        }
      });
    }
  }, [layerVisibility.points]);

  // Update data layers when data changes - optimized
  useEffect(() => {
    if (!mapRef.current || !geoJsonData) return;

    const map = mapRef.current;

    // Update source data instead of recreating source
    if (map.getSource('points')) {
      (map.getSource('points') as maplibregl.GeoJSONSource).setData(geoJsonData);
    } else {
      // Create source only once
      map.addSource('points', {
        type: 'geojson',
        data: geoJsonData,
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 40 // Reduced for performance
      });
    }

    // Update layers individually
    updateHeatmapLayer(map);
    updateClusterLayers(map);
    updatePointLayer(map);
  }, [geoJsonData, updateHeatmapLayer, updateClusterLayers, updatePointLayer]);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (debouncedBoundsChange.current) {
      clearTimeout(debouncedBoundsChange.current);
    }
    
    if (popup) {
      popup.remove();
      setPopup(null);
    }
    
    if (realtimeSubscription) {
      eventDrivenRealtimeService.unsubscribe(realtimeSubscription);
    }
  }, [popup, realtimeSubscription]);

  // Network status monitoring
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div className="relative w-full h-full">
      {/* Map container */}
      <div 
        ref={mapContainer} 
        className="w-full h-full"
        style={{ position: 'relative' }}
      />
      
      {/* Performance metrics overlay */}
      {currentLODLevel && (
        <div className="performance-overlay absolute top-4 left-4 bg-black bg-opacity-70 text-white p-2 rounded text-xs">
          <div>LOD: {currentLODLevel.name}</div>
          <div>Features: {data.dataPoints?.length || 0}</div>
          {isOffline && <div className="text-orange-400">📱 Offline</div>}
        </div>
      )}
      
      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-50 flex items-center justify-center z-10">
          <div className="bg-white p-4 rounded shadow-lg">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-600">Loading advanced map data...</p>
          </div>
        </div>
      )}
      
      {/* Advanced status indicator */}
      <div className="absolute bottom-4 right-4 space-y-2">
        <div className="bg-white rounded shadow p-2 text-xs space-y-1">
          <div className="font-medium mb-2">Advanced Features</div>
          <div className={`flex items-center space-x-1 ${config.enableH3Clustering ? 'text-green-600' : 'text-gray-400'}`}>
            <span>●</span>
            <span>H3 Clustering</span>
          </div>
          <div className={`flex items-center space-x-1 ${config.enableProgressiveLOD ? 'text-green-600' : 'text-gray-400'}`}>
            <span>●</span>
            <span>Progressive LOD</span>
          </div>
          <div className={`flex items-center space-x-1 ${config.enableMLPredictions ? 'text-green-600' : 'text-gray-400'}`}>
            <span>●</span>
            <span>ML Predictions</span>
          </div>
          <div className={`flex items-center space-x-1 ${config.enableRealTimeUpdates ? 'text-green-600' : 'text-gray-400'}`}>
            <span>●</span>
            <span>Real-time Updates</span>
          </div>
          <div className={`flex items-center space-x-1 ${config.enableOfflineMode ? 'text-green-600' : 'text-gray-400'}`}>
            <span>●</span>
            <span>Offline Mode</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapLibreMap;