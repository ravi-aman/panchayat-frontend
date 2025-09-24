// ===== ADVANCED HEATMAP VISUALIZATION COMPONENT =====
// Production-level React component for interactive heatmap visualization

import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HeatmapDataPoint,
  HeatmapCluster,
  HeatmapAnomaly,
  RegionBounds
} from '../../types/heatmap';
import { useHeatmapData } from '../../hooks/useHeatmapData';
import MapLibreMap from './MapLibreMap';
import {
  MdElectricBolt,
  MdWater,
  MdTraffic,
  MdConstruction,
  MdWarning,
  MdDelete,
  MdLightbulb,
  MdSecurity,
  MdInfo,
  MdZoomIn,
  MdZoomOut,
  MdFullscreen,
  MdLayers,
  MdAnalytics,
  MdSettings,
  MdVisibility,
  MdVisibilityOff
} from 'react-icons/md';

// ===== COMPONENT INTERFACES =====

interface HeatmapVisualizationProps {
  initialBounds: RegionBounds;
  enableRealtime?: boolean;
  enableControls?: boolean;
  enableSidebar?: boolean;
  enableTooltips?: boolean;
  enableAnalytics?: boolean;
  className?: string;
  style?: React.CSSProperties;
  onPointClick?: (point: HeatmapDataPoint) => void;
  onClusterClick?: (cluster: HeatmapCluster) => void;
  onAnomalyClick?: (anomaly: HeatmapAnomaly) => void;
  onBoundsChange?: (bounds: RegionBounds) => void;
  onDataUpdate?: (data: any) => void;
}

interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
  data: HeatmapDataPoint | HeatmapCluster | HeatmapAnomaly | null;
  type: 'point' | 'cluster' | 'anomaly' | null;
}

// Category configuration for markers
const CATEGORY_ICONS = {
  'electricity': { icon: MdElectricBolt, color: '#FFC107' },
  'water': { icon: MdWater, color: '#2196F3' },
  'traffic': { icon: MdTraffic, color: '#FF5722' },
  'construction': { icon: MdConstruction, color: '#FF9800' },
  'waste': { icon: MdDelete, color: '#4CAF50' },
  'streetlight': { icon: MdLightbulb, color: '#FFEB3B' },
  'pothole': { icon: MdWarning, color: '#E91E63' },
  'safety': { icon: MdSecurity, color: '#9C27B0' },
  'flooding': { icon: MdWater, color: '#00BCD4' },
  'other': { icon: MdInfo, color: '#607D8B' }
};

// ===== MAIN COMPONENT =====

export const HeatmapVisualization: React.FC<HeatmapVisualizationProps> = ({
  initialBounds,
  enableRealtime = true,
  enableControls = true,
  enableSidebar = false,
  enableTooltips = true,
  enableAnalytics = false,
  className = '',
  style = {},
  onPointClick,
  onClusterClick,
  onAnomalyClick,
  onBoundsChange,
  onDataUpdate
}) => {
  // ===== STATE MANAGEMENT =====
  const [bounds, setBounds] = useState<RegionBounds>(initialBounds);
  const [selectedPoint, setSelectedPoint] = useState<HeatmapDataPoint | null>(null);
  const [selectedCluster, setSelectedCluster] = useState<HeatmapCluster | null>(null);
  const [selectedAnomaly, setSelectedAnomaly] = useState<HeatmapAnomaly | null>(null);
  const [layerVisibility, setLayerVisibility] = useState({
    heatmap: true,
    clusters: true,
    points: true,
    boundaries: false,
    predictions: false,
    anomalies: true
  });
  const [tooltipState, setTooltipState] = useState<TooltipState>({
    visible: false,
    x: 0,
    y: 0,
    data: null,
    type: null
  });
  const [zoomLevel, setZoomLevel] = useState(12);
  const [mapReady, setMapReady] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // ===== DATA HOOKS =====
  const { state: heatmapState, isLoading, error } = useHeatmapData({
    bounds,
    enableRealtime,
    config: {
      analytics: {
        enableClustering: true,
        enableAnomalyDetection: true,
        enableTrends: true,
        enablePredictions: enableAnalytics,
        historicalDepth: 30,
        refreshInterval: 300000
      },
      realtime: {
        enabled: enableRealtime,
        updateInterval: 5000,
        autoRefresh: true,
        pushNotifications: true,
        anomalyAlerts: true,
        predictionUpdates: enableAnalytics
      }
    },
    onUpdate: onDataUpdate
  });

  // ===== HANDLERS =====

  const handleBoundsChange = useCallback((newBounds: RegionBounds) => {
    setBounds(newBounds);
    onBoundsChange?.(newBounds);
  }, [onBoundsChange]);

  const handlePointClick = useCallback((point: HeatmapDataPoint, event: React.MouseEvent) => {
    setSelectedPoint(point);
    setSelectedCluster(null);
    setSelectedAnomaly(null);
    onPointClick?.(point);
    
    if (enableTooltips) {
      setTooltipState({
        visible: true,
        x: event.clientX,
        y: event.clientY,
        data: point,
        type: 'point'
      });
    }
  }, [onPointClick, enableTooltips]);

  const handleClusterClick = useCallback((cluster: HeatmapCluster, event: React.MouseEvent) => {
    setSelectedCluster(cluster);
    setSelectedPoint(null);
    setSelectedAnomaly(null);
    onClusterClick?.(cluster);
    
    if (enableTooltips) {
      setTooltipState({
        visible: true,
        x: event.clientX,
        y: event.clientY,
        data: cluster,
        type: 'cluster'
      });
    }
  }, [onClusterClick, enableTooltips]);

  const handleAnomalyClick = useCallback((anomaly: HeatmapAnomaly, event: React.MouseEvent) => {
    setSelectedAnomaly(anomaly);
    setSelectedPoint(null);
    setSelectedCluster(null);
    onAnomalyClick?.(anomaly);
    
    if (enableTooltips) {
      setTooltipState({
        visible: true,
        x: event.clientX,
        y: event.clientY,
        data: anomaly,
        type: 'anomaly'
      });
    }
  }, [onAnomalyClick, enableTooltips]);

  const hideTooltip = useCallback(() => {
    setTooltipState(prev => ({ ...prev, visible: false }));
  }, []);

  // ===== COMPUTED VALUES =====
  
  const mapData = useMemo(() => ({
    dataPoints: heatmapState?.data?.dataPoints || [],
    clusters: heatmapState?.data?.clusters || [],
    anomalies: heatmapState?.data?.anomalies || []
  }), [heatmapState]);

  // ===== TOOLTIP COMPONENT =====
  
  const AdvancedTooltip = () => {
    if (!tooltipState.visible || !tooltipState.data) return null;

    return (
      <AnimatePresence>
        <motion.div
          className="fixed z-50 pointer-events-none"
          style={{
            left: tooltipState.x + 10,
            top: tooltipState.y - 10
          }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.15 }}
        >
          <div className="bg-white/95 backdrop-blur-md rounded-lg shadow-xl border border-white/30 p-4 max-w-xs">
            {tooltipState.type === 'point' && tooltipState.data && (
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  {(() => {
                    const point = tooltipState.data as HeatmapDataPoint;
                    const categoryKey = point.metadata?.category || 'other';
                    const config = CATEGORY_ICONS[categoryKey] || CATEGORY_ICONS.other;
                    const IconComponent = config.icon;
                    return <IconComponent className="w-4 h-4" style={{ color: config.color }} />;
                  })()}
                  <span className="font-semibold text-gray-900 capitalize">
                    {(tooltipState.data as HeatmapDataPoint).metadata?.category || 'Issue'}
                  </span>
                </div>
                <div className="space-y-1 text-sm text-gray-700">
                  <div>Intensity: {((tooltipState.data as HeatmapDataPoint).value * 100).toFixed(1)}%</div>
                  <div>Priority: {(tooltipState.data as HeatmapDataPoint).metadata?.urgency || 'N/A'}</div>
                  <div>Reports: {(tooltipState.data as HeatmapDataPoint).metadata?.reportCount || 0}</div>
                </div>
              </div>
            )}
            
            {tooltipState.type === 'cluster' && tooltipState.data && (
              <div>
                <div className="font-semibold text-gray-900 mb-2">Issue Cluster</div>
                <div className="space-y-1 text-sm text-gray-700">
                  <div>Issues: {(tooltipState.data as HeatmapCluster).points?.length || 0}</div>
                  <div>Density: {((tooltipState.data as HeatmapCluster).density * 100).toFixed(1)}%</div>
                  <div>Risk Level: {(tooltipState.data as HeatmapCluster).riskLevel || 'N/A'}</div>
                </div>
              </div>
            )}
            
            {tooltipState.type === 'anomaly' && tooltipState.data && (
              <div>
                <div className="font-semibold text-red-900 mb-2">Anomaly Detected</div>
                <div className="space-y-1 text-sm text-gray-700">
                  <div>Type: {(tooltipState.data as HeatmapAnomaly).anomalyType || 'N/A'}</div>
                  <div>Severity: {(tooltipState.data as HeatmapAnomaly).severity || 'N/A'}</div>
                  <div>Confidence: {((tooltipState.data as HeatmapAnomaly).confidence * 100).toFixed(1)}%</div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    );
  };

  // ===== LAYER CONTROLS COMPONENT =====
  
  const LayerControls = () => {
    if (!enableControls) return null;

    return (
      <motion.div 
        className="absolute top-4 left-4 z-40 bg-white/90 backdrop-blur-md rounded-lg shadow-lg border border-white/20 p-3"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="space-y-2">
          <div className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
            <MdLayers className="w-4 h-4 mr-2" />
            Layers
          </div>
          {Object.entries(layerVisibility).map(([layer, visible]) => (
            <motion.button
              key={layer}
              onClick={() => setLayerVisibility(prev => ({ ...prev, [layer]: !visible }))}
              className={`flex items-center space-x-2 p-2 rounded text-xs font-medium transition-colors w-full ${
                visible 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {visible ? <MdVisibility className="w-3 h-3" /> : <MdVisibilityOff className="w-3 h-3" />}
              <span className="capitalize">{layer}</span>
            </motion.button>
          ))}
        </div>
      </motion.div>
    );
  };

  // ===== ZOOM CONTROLS COMPONENT =====
  
  const ZoomControls = () => {
    if (!enableControls) return null;

    return (
      <motion.div 
        className="absolute bottom-4 right-4 z-40 bg-white/90 backdrop-blur-md rounded-lg shadow-lg border border-white/20"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex flex-col">
          <motion.button
            className="p-3 hover:bg-gray-100 transition-colors border-b border-gray-200"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setZoomLevel(prev => Math.min(20, prev + 1))}
          >
            <MdZoomIn className="w-5 h-5 text-gray-700" />
          </motion.button>
          <motion.button
            className="p-3 hover:bg-gray-100 transition-colors border-b border-gray-200"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setZoomLevel(prev => Math.max(1, prev - 1))}
          >
            <MdZoomOut className="w-5 h-5 text-gray-700" />
          </motion.button>
          <motion.button
            className="p-3 hover:bg-gray-100 transition-colors rounded-b-lg"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <MdFullscreen className="w-5 h-5 text-gray-700" />
          </motion.button>
        </div>
      </motion.div>
    );
  };

  // ===== LOADING OVERLAY =====
  
  const LoadingOverlay = () => {
    if (!isLoading) return null;

    return (
      <motion.div
        className="absolute inset-0 bg-white/70 backdrop-blur-sm z-50 flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="bg-white rounded-lg p-6 shadow-lg">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="text-lg font-medium text-gray-900">Loading heatmap...</span>
          </div>
        </div>
      </motion.div>
    );
  };

  // ===== RENDER COMPONENT =====

  return (
    <div 
      ref={containerRef}
      className={`heatmap-visualization relative ${className}`} 
      style={style}
      onMouseMove={hideTooltip}
    >
      {/* Main Map Component */}
      <MapLibreMap
        data={mapData}
        bounds={bounds}
        layerVisibility={layerVisibility}
        onBoundsChange={handleBoundsChange}
        onPointClick={handlePointClick}
        onClusterClick={handleClusterClick}
        onAnomalyClick={handleAnomalyClick}
        isLoading={isLoading}
        onMapInstanceReady={() => setMapReady(true)}
      />

      {/* Layer Controls */}
      <LayerControls />

      {/* Zoom Controls */}
      <ZoomControls />

      {/* Advanced Tooltip */}
      <AdvancedTooltip />

      {/* Loading Overlay */}
      <AnimatePresence>
        <LoadingOverlay />
      </AnimatePresence>

      {/* Error Display */}
      {error && (
        <motion.div
          className="absolute top-4 right-4 z-50 bg-red-100 border border-red-300 rounded-lg p-4 max-w-md"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <div className="flex items-center space-x-2">
            <MdWarning className="w-5 h-5 text-red-600" />
            <span className="text-red-800 font-medium">Error loading data</span>
          </div>
          <p className="text-red-700 text-sm mt-1">{error}</p>
        </motion.div>
      )}
    </div>
  );
};

// ===== MAIN HEATMAP VISUALIZATION COMPONENT =====

export const HeatmapVisualization: React.FC<HeatmapVisualizationProps> = React.memo(({
  initialBounds,
  enableRealtime = true, // Disabled for performance
  enableControls = true,
  enableSidebar = true, // Disabled for performance
  enableTooltips = true,
  enableAnalytics = true, // Disabled for performance
  className = '',
  style = {},
  onPointClick,
  onClusterClick,
  onAnomalyClick,
  onBoundsChange,
  onDataUpdate
}) => {
  const { mapInstance, setMapInstance } = useMap();
  
  // ===== STATE MANAGEMENT =====
  
  const [bounds, setBounds] = useState<RegionBounds>(initialBounds);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedLayer, setSelectedLayer] = useState<'heatmap' | 'clusters' | 'points' | 'all'>('all');
  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    x: 0,
    y: 0,
    data: null,
    type: null
  });

  // ===== HOOKS =====

  // Main heatmap data hook
  const {
    state,
    actions,
    isLoading,
    error,
    refetch
  } = useHeatmapData({
    bounds,
    config: {
      analytics: {
        enableClustering: enableAnalytics,
        enableAnomalyDetection: enableAnalytics,
        enableTrends: enableAnalytics,
        enablePredictions: false,
        historicalDepth: 30,
        refreshInterval: 300000
      },
      realtime: {
        enabled: enableRealtime,
        updateInterval: 30000,
        autoRefresh: true,
        pushNotifications: true,
        anomalyAlerts: true,
        predictionUpdates: false
      }
    },
    enableRealtime,
    enablePerformanceTracking: true,
    onUpdate: onDataUpdate,
    onError: (err) => {
      // Check if it's a backend unavailable error (demo mode)
      if ((err as any).code === 'BACKEND_UNAVAILABLE') {
        console.warn('Using demo mode - backend server not available:', err.message);
        // You could show a toast notification here if needed
      } else {
        console.error('Heatmap data error:', err);
      }
    }
  });

  // WebSocket hook for real-time updates
  const {
    isConnected: wsConnected,
    subscribe: wsSubscribe,
    unsubscribe: wsUnsubscribe,
    status: wsStatus
  } = useHeatmapWebSocket({
    autoConnect: enableRealtime,
    enableNotifications: true,
    onUpdate: (updateEvent) => {
      // Handle real-time updates
      console.log('Real-time update received:', updateEvent);
      refetch();
    },
    onNotification: (notification) => {
      console.log('Real-time notification:', notification);
    }
  });

  // ===== MEMOIZED VALUES =====

  const layerVisibility = useMemo(() => {
    switch (selectedLayer) {
      case 'heatmap':
        return { heatmap: true, clusters: false, points: false, boundaries: false };
      case 'clusters':
        return { heatmap: false, clusters: true, points: false, boundaries: false };
      case 'points':
        return { heatmap: false, clusters: false, points: true, boundaries: false };
      case 'all':
      default:
        return { heatmap: true, clusters: true, points: true, boundaries: true };
    }
  }, [selectedLayer]);

  // ===== EVENT HANDLERS =====

  const handleBoundsChange = useCallback((newBounds: RegionBounds) => {
    // Validate bounds before setting
    const isValidBounds = 
      newBounds.southwest[0] >= -180 && newBounds.southwest[0] <= 180 &&
      newBounds.southwest[1] >= -90 && newBounds.southwest[1] <= 90 &&
      newBounds.northeast[0] >= -180 && newBounds.northeast[0] <= 180 &&
      newBounds.northeast[1] >= -90 && newBounds.northeast[1] <= 90 &&
      newBounds.southwest[0] < newBounds.northeast[0] &&
      newBounds.southwest[1] < newBounds.northeast[1];
    
    if (!isValidBounds) {
      console.warn('Invalid bounds detected, skipping update:', newBounds);
      return;
    }
    
    setBounds(newBounds);
    actions.setBounds(newBounds);
    
    if (onBoundsChange) {
      onBoundsChange(newBounds);
    }
  }, [actions, onBoundsChange]);

  const handlePointClick = useCallback((point: HeatmapDataPoint, event: React.MouseEvent) => {
    actions.selectPoint(point);
    
    if (onPointClick) {
      onPointClick(point);
    }

    if (enableTooltips) {
      setTooltip({
        visible: true,
        x: event.clientX,
        y: event.clientY,
        data: point,
        type: 'point'
      });
    }
  }, [actions, onPointClick, enableTooltips]);

  const handleClusterClick = useCallback((cluster: HeatmapCluster, event: React.MouseEvent) => {
    actions.selectCluster(cluster);
    
    if (onClusterClick) {
      onClusterClick(cluster);
    }

    if (enableTooltips) {
      setTooltip({
        visible: true,
        x: event.clientX,
        y: event.clientY,
        data: cluster,
        type: 'cluster'
      });
    }
  }, [actions, onClusterClick, enableTooltips]);

  const handleAnomalyClick = useCallback((anomaly: HeatmapAnomaly, event: React.MouseEvent) => {
    actions.selectAnomaly(anomaly);
    
    if (onAnomalyClick) {
      onAnomalyClick(anomaly);
    }

    if (enableTooltips) {
      setTooltip({
        visible: true,
        x: event.clientX,
        y: event.clientY,
        data: anomaly,
        type: 'anomaly'
      });
    }
  }, [actions, onAnomalyClick, enableTooltips]);

  const handleLayerToggle = useCallback((layer: string, visible: boolean) => {
    const layers = state.visualization.layers as any;
    actions.updateVisualization({
      layers: {
        ...layers,
        [layer]: { ...layers[layer], visible }
      }
    });
  }, [actions, state.visualization.layers]);

  const handleConfigChange = useCallback((newConfig: Partial<HeatmapVisualizationConfig>) => {
    actions.updateVisualization(newConfig);
  }, [actions]);

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleExport = useCallback(async (format: 'json' | 'csv' | 'geojson') => {
    try {
      await actions.exportData(format);
    } catch (error) {
      console.error('Export failed:', error);
    }
  }, [actions]);

  // ===== EFFECTS =====

  // WebSocket subscription management
  useEffect(() => {
    if (enableRealtime && wsConnected) {
      const subscriptionId = wsSubscribe('main-region', bounds);
      return () => {
        if (subscriptionId) {
          wsUnsubscribe(subscriptionId);
        }
      };
    }
  }, [enableRealtime, wsConnected, wsSubscribe, wsUnsubscribe, bounds]);

  // Handle click outside to close tooltip
  useEffect(() => {
    const handleClickOutside = (_event: MouseEvent) => {
      if (tooltip.visible) {
        setTooltip(prev => ({ ...prev, visible: false }));
      }
    };

    if (tooltip.visible) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [tooltip.visible]);

  // ===== RENDER =====

  return (
    <HeatmapErrorBoundary>
      <div 
        className={`heatmap-visualization relative w-full h-full bg-gray-50 ${className}`}
        style={style}
      >
        {/* Demo Mode Indicator */}
        {error && (error.includes('BACKEND_UNAVAILABLE') || error.includes('demo')) && (
          <div className="absolute top-4 left-4 right-4 z-50 bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded">
            <div className="flex justify-between items-center">
              <span>🔧 Demo Mode: Using sample data (backend unavailable)</span>
              <button 
                onClick={() => actions.clearError()}
                className="text-blue-700 hover:text-blue-900"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && !error.includes('BACKEND_UNAVAILABLE') && !error.includes('demo') && (
          <div className="absolute top-4 left-4 right-4 z-50 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <div className="flex justify-between items-center">
              <span>{error}</span>
              <button 
                onClick={() => actions.clearError()}
                className="text-red-700 hover:text-red-900"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Loading Overlay - only show when actually loading, with reduced opacity */}
        {isLoading && (
          <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center z-30">
            <div className="bg-white rounded-lg p-4 shadow-lg flex items-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="text-sm font-medium">Loading map data...</span>
            </div>
          </div>
        )}

        {/* Main Map Container */}
        <div className="relative w-full h-full">
          <MapLibreMap
            data={state.data || { dataPoints: [] }}
            bounds={bounds}
            layerVisibility={layerVisibility}
            onBoundsChange={handleBoundsChange}
            onPointClick={handlePointClick}
            onClusterClick={handleClusterClick}
            onAnomalyClick={handleAnomalyClick}
            isLoading={isLoading}
            onMapInstanceReady={(map) => setMapInstance(map)}
          />

          {/* SearchAndNavigate overlay - MOBILE ONLY */}
          <div className="absolute top-5 left-4 right-4 md:hidden z-50">
            <div className="bg-white rounded-full">
              {mapInstance ? (
                <SearchAndNavigate 
                  map={mapInstance}
                  className="w-full search-and-navigate-input"
                  placeholder="Search for locations..."
                  mobile={true}
                  darkMode={false}
                  onLocationSelect={(location) => {
                    console.log('Selected location from mobile:', location);
                    if (location.geometry?.coordinates) {
                      const [longitude, latitude] = location.geometry.coordinates;
                      const buffer = 0.01; // ~1km buffer
                      handleBoundsChange({
                        southwest: [longitude - buffer, latitude - buffer],
                        northeast: [longitude + buffer, latitude + buffer]
                      });
                    }
                  }}
                />
              ) : (
                <div className="flex items-center w-full p-2">
                  <div className="w-6 h-6 mr-2 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"></div>
                  <span className="text-sm text-gray-600">Map loading...</span>
                </div>
              )}
            </div>
          </div>

          {/* Controls Panel */}
          {enableControls && (
            <HeatmapControls
              config={state.config}
              visualization={state.visualization}
              selectedLayer={selectedLayer}
              isLoading={isLoading}
              isConnected={wsConnected}
              wsStatus={wsStatus}
              onLayerChange={(layer) => setSelectedLayer(layer as 'heatmap' | 'clusters' | 'points' | 'all')}
              onLayerToggle={handleLayerToggle}
              onConfigChange={handleConfigChange}
              onVisualizationChange={handleConfigChange}
              onRefresh={handleRefresh}
              onExport={handleExport}
              onSidebarToggle={() => setSidebarOpen(!sidebarOpen)}
            />
          )}

          {/* Sidebar */}
          {enableSidebar && sidebarOpen && (
            <HeatmapSidebar
              isOpen={sidebarOpen}
              data={state.data}
              config={state.config}
              onConfigChange={handleConfigChange}
              onClose={() => setSidebarOpen(false)}
              className="absolute left-0 top-0 h-full w-80 bg-white shadow-lg z-40"
            />
          )}

          {/* Legend */}
          <HeatmapLegend
            config={state.visualization}
            data={state.data}
            selectedLayer={selectedLayer}
            className="absolute bottom-4 left-4"
          />

          {/* Tooltip */}
          {enableTooltips && tooltip.visible && tooltip.data && (
            <HeatmapTooltip
              data={tooltip.data}
              position={tooltip.visible ? [tooltip.x, tooltip.y] : null}
            />
          )}
        </div>
      </div>
    </HeatmapErrorBoundary>
  );
});

export default HeatmapVisualization;