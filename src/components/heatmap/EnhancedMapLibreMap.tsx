// ===== ENHANCED MAPLIBRE MAP INTEGRATION =====
// Advanced MapLibre GL JS integration with new components

import React, { useEffect, useRef, useCallback, useState } from 'react';
import { Map, NavigationControl, ScaleControl, AttributionControl } from 'maplibre-gl';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiLayers, 
  FiMaximize2, 
  FiMinimize2,
  FiSettings,
  FiZap,
  FiDroplet,
  FiNavigation,
  FiTrash2,
  FiAlertTriangle,
  FiShield,
  FiInfo
} from 'react-icons/fi';

import { useMap, useMapSelection, useMapLayers, useMapView } from '../../contexts/EnhancedMapContext';
import { HeatmapTooltip } from './HeatmapTooltip';
import { RegionBounds, HeatmapDataPoint, HeatmapCluster, HeatmapAnomaly } from '../../types/heatmap';
import 'maplibre-gl/dist/maplibre-gl.css';
import { BsFillLightbulbFill } from 'react-icons/bs';

// Category icons for enhanced visualization
export const CATEGORY_ICONS = {
  electricity: { 
    icon: FiZap, 
    color: '#FFC107', 
    label: 'Electricity' 
  },
  water: { 
    icon: FiDroplet, 
    color: '#2196F3', 
    label: 'Water' 
  },
  traffic: { 
    icon: FiNavigation, 
    color: '#FF5722', 
    label: 'Traffic' 
  },
  construction: { 
    icon: FiSettings, 
    color: '#FF9800', 
    label: 'Construction' 
  },
  waste: { 
    icon: FiTrash2, 
    color: '#4CAF50', 
    label: 'Waste Management' 
  },
  streetlight: { 
    icon: BsFillLightbulbFill, 
    color: '#FFEB3B', 
    label: 'Street Lighting' 
  },
  pothole: { 
    icon: FiAlertTriangle, 
    color: '#E91E63', 
    label: 'Road Damage' 
  },
  safety: { 
    icon: FiShield, 
    color: '#9C27B0', 
    label: 'Safety Concerns' 
  },
  flooding: { 
    icon: FiDroplet, 
    color: '#00BCD4', 
    label: 'Flooding' 
  },
  other: { 
    icon: FiInfo, 
    color: '#607D8B', 
    label: 'Other Issues' 
  }
} as const;



interface EnhancedMapLibreMapProps {
  bounds: RegionBounds;
  data: {
    dataPoints?: HeatmapDataPoint[];
    clusters?: HeatmapCluster[];
    anomalies?: HeatmapAnomaly[];
    hexagons?: any[];
  };
  layerVisibility: Record<string, boolean>;
  onPointClick?: (point: HeatmapDataPoint) => void;
  onClusterClick?: (cluster: HeatmapCluster) => void;
  onAnomalyClick?: (anomaly: HeatmapAnomaly) => void;
  onBoundsChange?: (bounds: RegionBounds) => void;
  className?: string;
  enableControls?: boolean;
  enableTooltips?: boolean;
}

export const EnhancedMapLibreMap: React.FC<EnhancedMapLibreMapProps> = ({
  bounds,
  data,
  layerVisibility,
  onPointClick,
  onClusterClick,
  onAnomalyClick,
  onBoundsChange,
  className = '',
  enableControls = true,
  enableTooltips = true
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<Map | null>(null);
  
  // Enhanced map context integration
  const { actions } = useMap();
  const { selectPoint, selectCluster, selectAnomaly, setHoveredFeature } = useMapSelection();
  const { toggleLayer } = useMapLayers();
  const { updateBounds, setZoomLevel } = useMapView();
  
  // Local state for map interactions
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showLayerControls, setShowLayerControls] = useState(false);
  const [tooltipData, setTooltipData] = useState<any>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current) return;

    const mapInstance = new Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          'osm': {
            type: 'raster',
            tiles: [
              'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
              'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
              'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png'
            ],
            tileSize: 256,
            attribution: '© OpenStreetMap contributors'
          }
        },
        layers: [
          {
            id: 'osm',
            type: 'raster',
            source: 'osm',
            minzoom: 0,
            maxzoom: 19
          }
        ]
      },
      center: [
        (bounds.southwest[0] + bounds.northeast[0]) / 2,
        (bounds.southwest[1] + bounds.northeast[1]) / 2
      ],
      zoom: 12,
      pitch: 0,
      bearing: 0
    });

    // Add controls
    if (enableControls) {
      mapInstance.addControl(new NavigationControl(), 'top-right');
      mapInstance.addControl(new ScaleControl(), 'bottom-left');
      mapInstance.addControl(new AttributionControl({ compact: true }), 'bottom-right');
    }

    // Store map instance
    map.current = mapInstance;
    actions.setMapInstance(mapInstance);

    // Map event handlers
    mapInstance.on('load', () => {
      actions.setMapReady(true);
      console.log('Enhanced MapLibre map loaded successfully');
    });

    mapInstance.on('moveend', () => {
      const bounds = mapInstance.getBounds();
      const newBounds: RegionBounds = {
        southwest: [bounds.getWest(), bounds.getSouth()],
        northeast: [bounds.getEast(), bounds.getNorth()]
      };
      
      updateBounds(newBounds);
      onBoundsChange?.(newBounds);
    });

    mapInstance.on('zoomend', () => {
      setZoomLevel(mapInstance.getZoom());
    });

    // Mouse events for tooltips
    if (enableTooltips) {
      mapInstance.on('mousemove', (e) => {
        const features = mapInstance.queryRenderedFeatures(e.point);
        if (features.length > 0) {
          const feature = features[0];
          setTooltipData(feature);
          setTooltipPosition({ x: e.point.x, y: e.point.y });
          setHoveredFeature(feature);
        } else {
          setTooltipData(null);
          setTooltipPosition(null);
          setHoveredFeature(null);
        }
      });

      mapInstance.on('mouseleave', () => {
        setTooltipData(null);
        setTooltipPosition(null);
        setHoveredFeature(null);
      });
    }

    // Cleanup
    return () => {
      mapInstance.remove();
    };
  }, []);

  // Update map data layers when data changes
  useEffect(() => {
    if (!map.current || !map.current.loaded()) return;

    // Add data points layer
    if (data.dataPoints && layerVisibility.points) {
      addDataPointsLayer(data.dataPoints);
    }

    // Add clusters layer
    if (data.clusters && layerVisibility.clusters) {
      addClustersLayer(data.clusters);
    }

    // Add heatmap layer
    if (data.hexagons && layerVisibility.heatmap) {
      addHeatmapLayer(data.hexagons);
    }

    // Add anomalies layer
    if (data.anomalies && layerVisibility.anomalies) {
      addAnomaliesLayer(data.anomalies);
    }

  }, [data, layerVisibility]);

  // Add data points as individual markers
  const addDataPointsLayer = useCallback((points: HeatmapDataPoint[]) => {
    if (!map.current) return;

    const geojsonData = {
      type: 'FeatureCollection' as const,
      features: points.map(point => ({
        type: 'Feature' as const,
        properties: {
          id: point._id,
          intensity: point.value,
          riskScore: point.riskScore,
          ...point.metadata,
          category: point.metadata?.category || 'other'
        },
        geometry: {
          type: 'Point' as const,
          coordinates: point.location.coordinates
        }
      }))
    };

    // Add source if it doesn't exist
    if (!map.current.getSource('data-points')) {
      map.current.addSource('data-points', {
        type: 'geojson',
        data: geojsonData
      });

      // Add circle layer for data points
      map.current.addLayer({
        id: 'data-points-circle',
        type: 'circle',
        source: 'data-points',
        paint: {
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['get', 'intensity'],
            0, 4,
            1, 12
          ],
          'circle-color': [
            'case',
            ['==', ['get', 'category'], 'electricity'], '#FFC107',
            ['==', ['get', 'category'], 'water'], '#2196F3',
            ['==', ['get', 'category'], 'traffic'], '#FF5722',
            ['==', ['get', 'category'], 'construction'], '#FF9800',
            ['==', ['get', 'category'], 'waste'], '#4CAF50',
            ['==', ['get', 'category'], 'streetlight'], '#FFEB3B',
            ['==', ['get', 'category'], 'pothole'], '#E91E63',
            ['==', ['get', 'category'], 'safety'], '#9C27B0',
            ['==', ['get', 'category'], 'flooding'], '#00BCD4',
            '#607D8B' // default color for 'other'
          ],
          'circle-opacity': 0.8,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff',
          'circle-stroke-opacity': 0.9
        }
      });

      // Add symbol layer for category icons (simplified as text for now)
      map.current.addLayer({
        id: 'data-points-labels',
        type: 'symbol',
        source: 'data-points',
        layout: {
          'text-field': [
            'case',
            ['==', ['get', 'category'], 'electricity'], '⚡',
            ['==', ['get', 'category'], 'water'], '💧',
            ['==', ['get', 'category'], 'traffic'], '🚦',
            ['==', ['get', 'category'], 'construction'], '🚧',
            ['==', ['get', 'category'], 'waste'], '🗑️',
            ['==', ['get', 'category'], 'streetlight'], '💡',
            ['==', ['get', 'category'], 'pothole'], '⚠️',
            ['==', ['get', 'category'], 'safety'], '🛡️',
            ['==', ['get', 'category'], 'flooding'], '🌊',
            'ℹ️' // default icon for 'other'
          ],
          'text-font': ['Open Sans Regular'],
          'text-size': 14,
          'text-anchor': 'center',
          'text-allow-overlap': true
        },
        paint: {
          'text-color': '#ffffff',
          'text-halo-color': '#000000',
          'text-halo-width': 1
        }
      });

      // Click handler for data points
      map.current.on('click', 'data-points-circle', (e) => {
        if (e.features && e.features[0]) {
          const feature = e.features[0];
          const point = points.find(p => p._id === feature.properties?.id);
          if (point && onPointClick) {
            onPointClick(point);
            selectPoint(point);
          }
        }
      });

    } else {
      // Update existing source
      (map.current.getSource('data-points') as any).setData(geojsonData);
    }
  }, [onPointClick, selectPoint]);

  // Add clusters layer
  const addClustersLayer = useCallback((clusters: HeatmapCluster[]) => {
    if (!map.current) return;

    const geojsonData = {
      type: 'FeatureCollection' as const,
      features: clusters.map(cluster => ({
        type: 'Feature' as const,
        properties: {
          id: cluster._id,
          density: cluster.density,
          count: cluster.points?.length || 0,
          intensity: cluster.averageIntensity || 0
        },
        geometry: {
          type: 'Point' as const,
          coordinates: cluster.center
        }
      }))
    };

    if (!map.current.getSource('clusters')) {
      map.current.addSource('clusters', {
        type: 'geojson',
        data: geojsonData
      });

      // Add cluster circles
      map.current.addLayer({
        id: 'clusters-circle',
        type: 'circle',
        source: 'clusters',
        paint: {
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['get', 'count'],
            0, 15,
            50, 30,
            100, 45
          ],
          'circle-color': [
            'interpolate',
            ['linear'],
            ['get', 'density'],
            0, '#51bbd3',
            0.5, '#f1f075',
            1, '#f28cb1'
          ],
          'circle-opacity': 0.6,
          'circle-stroke-width': 3,
          'circle-stroke-color': '#ffffff',
          'circle-stroke-opacity': 0.8
        }
      });

      // Add cluster count labels
      map.current.addLayer({
        id: 'clusters-count',
        type: 'symbol',
        source: 'clusters',
        layout: {
          'text-field': ['get', 'count'],
          'text-font': ['Open Sans Semibold'],
          'text-size': 12,
          'text-anchor': 'center'
        },
        paint: {
          'text-color': '#ffffff',
          'text-halo-color': '#000000',
          'text-halo-width': 1
        }
      });

      // Click handler for clusters
      map.current.on('click', 'clusters-circle', (e) => {
        if (e.features && e.features[0]) {
          const feature = e.features[0];
          const cluster = clusters.find(c => c._id === feature.properties?.id);
          if (cluster && onClusterClick) {
            onClusterClick(cluster);
            selectCluster(cluster);
          }
        }
      });
    } else {
      (map.current.getSource('clusters') as any).setData(geojsonData);
    }
  }, [onClusterClick, selectCluster]);

  // Add heatmap layer using hexagons
  const addHeatmapLayer = useCallback((hexagons: any[]) => {
    if (!map.current) return;

    const geojsonData = {
      type: 'FeatureCollection' as const,
      features: hexagons.map(hex => ({
        type: 'Feature' as const,
        properties: {
          intensity: hex.intensity || 0,
          count: hex.count || 0
        },
        geometry: hex.geometry
      }))
    };

    if (!map.current.getSource('heatmap-hexagons')) {
      map.current.addSource('heatmap-hexagons', {
        type: 'geojson',
        data: geojsonData
      });

      // Add heatmap fill layer
      map.current.addLayer({
        id: 'heatmap-fill',
        type: 'fill',
        source: 'heatmap-hexagons',
        paint: {
          'fill-opacity': [
            'interpolate',
            ['linear'],
            ['get', 'intensity'],
            0, 0,
            1, 0.8
          ],
          'fill-color': [
            'interpolate',
            ['linear'],
            ['get', 'intensity'],
            0, '#51bbd3',
            0.3, '#f1f075',
            0.6, '#fd8d3c',
            1, '#bd0026'
          ]
        }
      }, 'data-points-circle'); // Add below data points

      // Add heatmap outline
      map.current.addLayer({
        id: 'heatmap-outline',
        type: 'line',
        source: 'heatmap-hexagons',
        paint: {
          'line-color': '#ffffff',
          'line-width': 0.5,
          'line-opacity': 0.3
        }
      }, 'data-points-circle');
    } else {
      (map.current.getSource('heatmap-hexagons') as any).setData(geojsonData);
    }
  }, []);

  // Add anomalies layer
  const addAnomaliesLayer = useCallback((anomalies: HeatmapAnomaly[]) => {
    if (!map.current) return;

    const geojsonData = {
      type: 'FeatureCollection' as const,
      features: anomalies.map(anomaly => ({
        type: 'Feature' as const,
        properties: {
          id: anomaly._id,
          severity: anomaly.severity,
          type: anomaly.type,
          score: anomaly.score
        },
        geometry: {
          type: 'Point' as const,
          coordinates: Array.isArray(anomaly.location)
            ? anomaly.location
            : anomaly.location.coordinates
        }
      }))
    };

    if (!map.current.getSource('anomalies')) {
      map.current.addSource('anomalies', {
        type: 'geojson',
        data: geojsonData
      });

      // Add pulsing circles for anomalies
      map.current.addLayer({
        id: 'anomalies-circle',
        type: 'circle',
        source: 'anomalies',
        paint: {
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['get', 'score'],
            0, 8,
            1, 20
          ],
          'circle-color': [
            'case',
            ['==', ['get', 'severity'], 'critical'], '#dc2626',
            ['==', ['get', 'severity'], 'high'], '#ea580c',
            ['==', ['get', 'severity'], 'medium'], '#d97706',
            '#65a30d' // low severity
          ],
          'circle-opacity': 0.7,
          'circle-stroke-width': 3,
          'circle-stroke-color': '#ffffff',
          'circle-stroke-opacity': 1
        }
      });

      // Click handler for anomalies
      map.current.on('click', 'anomalies-circle', (e) => {
        if (e.features && e.features[0]) {
          const feature = e.features[0];
          const anomaly = anomalies.find(a => a._id === feature.properties?.id);
          if (anomaly && onAnomalyClick) {
            onAnomalyClick(anomaly);
            selectAnomaly(anomaly);
          }
        }
      });
    } else {
      (map.current.getSource('anomalies') as any).setData(geojsonData);
    }
  }, [onAnomalyClick, selectAnomaly]);

  // Toggle layer visibility
  const handleToggleLayer = useCallback((layerId: string) => {
    if (!map.current) return;

    const visibility = layerVisibility[layerId] ? 'visible' : 'none';
    
    // Toggle related layers based on the layer ID
    switch (layerId) {
      case 'points':
        if (map.current.getLayer('data-points-circle')) {
          map.current.setLayoutProperty('data-points-circle', 'visibility', visibility);
          map.current.setLayoutProperty('data-points-labels', 'visibility', visibility);
        }
        break;
      case 'clusters':
        if (map.current.getLayer('clusters-circle')) {
          map.current.setLayoutProperty('clusters-circle', 'visibility', visibility);
          map.current.setLayoutProperty('clusters-count', 'visibility', visibility);
        }
        break;
      case 'heatmap':
        if (map.current.getLayer('heatmap-fill')) {
          map.current.setLayoutProperty('heatmap-fill', 'visibility', visibility);
          map.current.setLayoutProperty('heatmap-outline', 'visibility', visibility);
        }
        break;
      case 'anomalies':
        if (map.current.getLayer('anomalies-circle')) {
          map.current.setLayoutProperty('anomalies-circle', 'visibility', visibility);
        }
        break;
    }
  }, [layerVisibility]);

  // Update layer visibility when props change
  useEffect(() => {
    Object.keys(layerVisibility).forEach(layerId => {
      handleToggleLayer(layerId);
    });
  }, [layerVisibility, handleToggleLayer]);

  // Fit map to bounds
  const fitToBounds = useCallback(() => {
    if (!map.current) return;
    
    map.current.fitBounds([
      [bounds.southwest[0], bounds.southwest[1]],
      [bounds.northeast[0], bounds.northeast[1]]
    ], {
      padding: 50,
      duration: 1000
    });
  }, [bounds]);

  return (
    <div className={`relative w-full h-full ${className}`}>
      {/* Map Container */}
      <div 
        ref={mapContainer} 
        className="w-full h-full rounded-lg overflow-hidden"
        style={{ minHeight: '400px' }}
      />

      {/* Map Controls Overlay */}
      {enableControls && (
        <div className="absolute top-4 left-4 z-10 flex flex-col space-y-2">
          {/* Layer Toggle Button */}
          <motion.button
            onClick={() => setShowLayerControls(!showLayerControls)}
            className="bg-white/90 backdrop-blur-md rounded-lg p-2 shadow-lg hover:bg-white/100 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FiLayers className="w-5 h-5 text-gray-700" />
          </motion.button>

          {/* Fit to Bounds Button */}
          <motion.button
            onClick={fitToBounds}
            className="bg-white/90 backdrop-blur-md rounded-lg p-2 shadow-lg hover:bg-white/100 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title="Fit to bounds"
          >
            <FiMaximize2 className="w-5 h-5 text-gray-700" />
          </motion.button>

          {/* Fullscreen Toggle */}
          <motion.button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="bg-white/90 backdrop-blur-md rounded-lg p-2 shadow-lg hover:bg-white/100 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          >
            {isFullscreen ? (
              <FiMinimize2 className="w-5 h-5 text-gray-700" />
            ) : (
              <FiMaximize2 className="w-5 h-5 text-gray-700" />
            )}
          </motion.button>
        </div>
      )}

      {/* Layer Controls Panel */}
      <AnimatePresence>
        {showLayerControls && (
          <motion.div
            className="absolute top-4 left-20 z-10 bg-white/95 backdrop-blur-md rounded-lg shadow-xl p-4 min-w-48"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Map Layers</h3>
            <div className="space-y-2">
              {Object.entries(layerVisibility).map(([layerId, isVisible]) => (
                <label key={layerId} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isVisible}
                    onChange={() => toggleLayer(layerId)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 capitalize">
                    {layerId.replace(/([A-Z])/g, ' $1').toLowerCase()}
                  </span>
                </label>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enhanced Tooltip */}
      {enableTooltips && tooltipData && tooltipPosition && (
        <HeatmapTooltip
          data={tooltipData}
          position={[tooltipPosition.x, tooltipPosition.y]}
          categoryIcons={CATEGORY_ICONS}
          type={tooltipData?.geometry?.type || 'Feature'}
          enableAdvancedFeatures={true}
          onClose={() => {
            setTooltipData(null);
            setTooltipPosition(null);
          }}
        />
      )}

      {/* Fullscreen Mode */}
      {isFullscreen && (
        <motion.div
          className="fixed inset-0 z-50 bg-black"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Fullscreen map would be rendered here */}
          <button
            onClick={() => setIsFullscreen(false)}
            className="absolute top-4 right-4 z-10 bg-white/90 backdrop-blur-md rounded-lg p-2 shadow-lg hover:bg-white/100 transition-colors"
          >
            <FiMinimize2 className="w-5 h-5 text-gray-700" />
          </button>
        </motion.div>
      )}
    </div>
  );
};

export default EnhancedMapLibreMap;