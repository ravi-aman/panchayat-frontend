// ===== ADVANCED HEATMAP VISUALIZATION COMPONENT =====
// Production-level React component for interactive heatmap visualization

import React, { useCallback, useEffect, useMemo, useState, useRef, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HeatmapDataPoint,
  HeatmapCluster,
  HeatmapAnomaly,
  RegionBounds,
  HeatmapVisualizationConfig,
  HeatmapConfig,
  PerformanceMetrics
} from '../../types/heatmap';
import { useHeatmapData } from '../../hooks/useHeatmapData';
import { useHeatmapWebSocket } from '../../hooks/useHeatmapWebSocket';
import { useMap } from '../../contexts/MapContext';
import MapLibreMap from './MapLibreMap';
import HeatmapControls from './HeatmapControls';
import HeatmapSidebar from './HeatmapSidebar';
import HeatmapLegend from './HeatmapLegend';
import HeatmapTooltip from './HeatmapTooltip';
import HeatmapErrorBoundary from './HeatmapErrorBoundary';
// import SearchAndNavigate from './SearchAndNavigate';
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
  MdVisibility,
  MdVisibilityOff,
  MdRefresh,
  MdDownload,
  MdFilterList,
  MdTimeline,
  MdPlace
} from 'react-icons/md';
import SearchAndNavigate from '../common/SearchAndNavigate';

// ===== TYPE DEFINITIONS =====

interface HeatmapVisualizationProps {
  initialBounds: RegionBounds;
  enableRealtime?: boolean;
  enableControls?: boolean;
  enableSidebar?: boolean;
  enableTooltips?: boolean;
  enableAnalytics?: boolean;
  enablePerformanceMode?: boolean;
  enableAdvancedFeatures?: boolean;
  className?: string;
  style?: React.CSSProperties;
  onPointClick?: (point: HeatmapDataPoint) => void;
  onClusterClick?: (cluster: HeatmapCluster) => void;
  onAnomalyClick?: (anomaly: HeatmapAnomaly) => void;
  onBoundsChange?: (bounds: RegionBounds) => void;
  onDataUpdate?: (data: any) => void;
  onConfigChange?: (config: Partial<HeatmapVisualizationConfig>) => void;
}

interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
  data: HeatmapDataPoint | HeatmapCluster | HeatmapAnomaly | null;
  type: 'point' | 'cluster' | 'anomaly' | null;
}

interface LayerVisibilityState {
  heatmap: boolean;
  clusters: boolean;
  points: boolean;
  boundaries: boolean;
  predictions: boolean;
  anomalies: boolean;
  realtime: boolean;
  heatmapIntensity: boolean;
  historicalData: boolean;
}

// ===== CONSTANTS =====

// Category configuration for markers with enhanced styling
const CATEGORY_ICONS = {
  'electricity': { icon: MdElectricBolt, color: '#FFC107', bgColor: '#FFF9C4', priority: 'high', label: 'Electricity Issues' },
  'water': { icon: MdWater, color: '#2196F3', bgColor: '#E3F2FD', priority: 'high', label: 'Water Issues' },
  'traffic': { icon: MdTraffic, color: '#FF5722', bgColor: '#FFEBE9', priority: 'medium', label: 'Traffic Issues' },
  'construction': { icon: MdConstruction, color: '#FF9800', bgColor: '#FFF3E0', priority: 'medium', label: 'Construction' },
  'waste': { icon: MdDelete, color: '#4CAF50', bgColor: '#E8F5E8', priority: 'low', label: 'Waste Management' },
  'streetlight': { icon: MdLightbulb, color: '#FFEB3B', bgColor: '#FFFDE7', priority: 'low', label: 'Street Lighting' },
  'pothole': { icon: MdWarning, color: '#E91E63', bgColor: '#FCE4EC', priority: 'high', label: 'Road Damage' },
  'safety': { icon: MdSecurity, color: '#9C27B0', bgColor: '#F3E5F5', priority: 'high', label: 'Safety Concerns' },
  'flooding': { icon: MdWater, color: '#00BCD4', bgColor: '#E0F2F1', priority: 'critical', label: 'Flooding' },
  'emergency': { icon: MdWarning, color: '#F44336', bgColor: '#FFEBEE', priority: 'critical', label: 'Emergency' },
  'other': { icon: MdInfo, color: '#607D8B', bgColor: '#ECEFF1', priority: 'low', label: 'Other Issues' }
};

// Performance optimization constants
const RENDER_THROTTLE_MS = 16; // 60fps
const DATA_BATCH_SIZE = 1000;
const CLUSTER_THRESHOLD = 50;

// ===== MAIN COMPONENT =====

export const HeatmapVisualization: React.FC<HeatmapVisualizationProps> = React.memo(({
  initialBounds,
  enableRealtime = true,
  enableControls = true,
  enableSidebar = false,
  enableTooltips = true,
  enableAnalytics = true,
  enablePerformanceMode = false,
  enableAdvancedFeatures = true,
  className = '',
  style = {},
  onPointClick,
  onClusterClick,
  onAnomalyClick,
  onBoundsChange,
  onDataUpdate,
  onConfigChange
}) => {
  // ===== HOOKS =====
  
  const { mapInstance, setMapInstance } = useMap();
  const containerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const renderTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // ===== STATE MANAGEMENT =====
  
  const [bounds, setBounds] = useState<RegionBounds>(initialBounds);
  const [sidebarOpen, setSidebarOpen] = useState(enableSidebar);
  const [selectedLayer, setSelectedLayer] = useState<'heatmap' | 'clusters' | 'points' | 'all'>('all');
  const [mapReady, setMapReady] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date>(new Date());
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics>({
    renderTime: 0,
    dataProcessingTime: 0,
    networkLatency: 0,
    memoryUsage: 0,
    frameRate: 60,
    cacheHitRate: 0,
    updateFrequency: 0,
    errorRate: 0,
    fpsAverage: 60,
    dataPointCount: 0,
    totalIssues: 0,
    criticalIssues: 0,
    clusters: 0,
    anomalies: 0
  });
  
  const [layerVisibility, setLayerVisibility] = useState<LayerVisibilityState>({
    heatmap: true,
    clusters: true,
    points: true,
    boundaries: false,
    predictions: enableAnalytics,
    anomalies: true,
    realtime: enableRealtime,
    heatmapIntensity: true,
    historicalData: false
  });

  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    x: 0,
    y: 0,
    data: null,
    type: null
  });

  const [advancedFilters, setAdvancedFilters] = useState({
    timeRange: { start: null as Date | null, end: null as Date | null },
    categories: Object.keys(CATEGORY_ICONS),
    intensityRange: [0, 1] as [number, number],
    priorityLevels: ['low', 'medium', 'high', 'critical']
  });

  // ===== DATA HOOKS =====

  // Main heatmap data hook with enhanced configuration
  const {
    state: heatmapState,
    actions: heatmapActions,
    isLoading,
    error,
    refetch,
    exportData,
    getMetrics
  } = useHeatmapData({
    bounds,
    config: {
      analytics: {
        enableClustering: enableAnalytics,
        enableAnomalyDetection: enableAnalytics,
        enableTrends: enableAdvancedFeatures,
        enablePredictions: enableAnalytics && enableAdvancedFeatures,
        enableHeatmapGeneration: true,
        enableSpatialAnalysis: enableAdvancedFeatures,
        historicalDepth: enableAdvancedFeatures ? 90 : 30,
        refreshInterval: enablePerformanceMode ? 60000 : 30000,
        clusterThreshold: CLUSTER_THRESHOLD,
        anomalyThreshold: 0.8,
        predictionHorizon: 24 // hours
      },
      realtime: {
        enabled: enableRealtime,
        updateInterval: enablePerformanceMode ? 30000 : 5000,
        autoRefresh: true,
        pushNotifications: enableAdvancedFeatures,
        anomalyAlerts: enableAnalytics,
        predictionUpdates: enableAnalytics && enableAdvancedFeatures,
        batchUpdates: enablePerformanceMode,
        throttleUpdates: enablePerformanceMode
      },
      visualization: {
        heatmapOpacity: 0.6,
        clusterRadius: enablePerformanceMode ? 30 : 20,
        colorScheme: 'viridis',
        opacity: 0.8,
        radius: enablePerformanceMode ? 8 : 5,
        blur: 15,
        maxZoom: 18,
        minZoom: 5,
        showLabels: true,
        showTooltips: enableTooltips,
        animationDuration: enablePerformanceMode ? 150 : 300
      }
    },
    enableRealtime,
    enablePerformanceTracking: enableAdvancedFeatures,
    onUpdate: (data) => {
      setLastUpdateTime(new Date());
      setPerformanceMetrics({
        renderTime: performance.now(),
        dataProcessingTime: 0,
        networkLatency: 0,
        memoryUsage: 0,
        frameRate: 60,
        cacheHitRate: 0,
        updateFrequency: 0,
        errorRate: 0,
        dataPointCount: data?.dataPoints?.length || 0,
        clusters: data?.clusters?.length || 0,
        anomalies: data?.anomalies?.length || 0
      });
      onDataUpdate?.(data);
    },
    onError: (err) => {
      // Enhanced error handling with fallback modes
      if ((err as any).code === 'BACKEND_UNAVAILABLE') {
        console.warn('Backend unavailable, switching to demo mode:', err.message);
        // Could trigger demo data loading here
      } else if ((err as any).code === 'RATE_LIMITED') {
        console.warn('Rate limited, reducing update frequency');
        // Could automatically switch to performance mode
      } else {
        console.error('Heatmap data error:', err);
      }
    }
  });

  // WebSocket hook for real-time updates with advanced features
  const {
    isConnected: wsConnected,
    subscribe: wsSubscribe,
    unsubscribe: wsUnsubscribe,
    status: wsStatus,
    metrics: wsMetrics
  } = useHeatmapWebSocket({
    autoConnect: enableRealtime,
    enableNotifications: enableAdvancedFeatures,
    enableMetrics: enableAdvancedFeatures,
    reconnectAttempts: 5,
    reconnectDelay: 2000,
    onUpdate: (updateEvent) => {
      console.log('Real-time update received:', updateEvent);
      if (renderTimeoutRef.current) {
        clearTimeout(renderTimeoutRef.current);
      }
      
      // Throttle updates for performance
      renderTimeoutRef.current = setTimeout(() => {
        refetch();
      }, RENDER_THROTTLE_MS);
    },
    onNotification: (notification) => {
      console.log('Real-time notification:', notification);
      // Could trigger toast notifications here
    }
  });

  // ===== MEMOIZED VALUES =====

  // Enhanced layer visibility based on selection and performance mode
  const computedLayerVisibility = useMemo(() => {
    const base = { ...layerVisibility };
    
    // Override based on selected layer
    switch (selectedLayer) {
      case 'heatmap':
        return { ...base, heatmap: true, clusters: false, points: false };
      case 'clusters':
        return { ...base, heatmap: false, clusters: true, points: false };
      case 'points':
        return { ...base, heatmap: false, clusters: false, points: true };
      case 'all':
      default:
        return base;
    }
  }, [selectedLayer, layerVisibility]);

  // Processed data with advanced filtering
  const processedData = useMemo(() => {
    if (!heatmapState.data) return { dataPoints: [], clusters: [], anomalies: [] };

    const startTime = performance.now();
    
    let { dataPoints = [], clusters = [], anomalies = [] } = heatmapState.data;

    // Apply advanced filters
    if (advancedFilters.timeRange.start || advancedFilters.timeRange.end) {
      dataPoints = dataPoints.filter(point => {
        const pointTime = point.timestamp ? new Date(point.timestamp) : new Date(point.metadata?.timestamp || Date.now());
        return (!advancedFilters.timeRange.start || pointTime >= advancedFilters.timeRange.start) &&
               (!advancedFilters.timeRange.end || pointTime <= advancedFilters.timeRange.end);
      });
    }

    if (advancedFilters.categories.length < Object.keys(CATEGORY_ICONS).length) {
      dataPoints = dataPoints.filter(point => 
        advancedFilters.categories.includes(point.metadata?.category || 'other')
      );
    }

    if (advancedFilters.intensityRange[0] > 0 || advancedFilters.intensityRange[1] < 1) {
      dataPoints = dataPoints.filter(point => 
        point.value >= advancedFilters.intensityRange[0] && 
        point.value <= advancedFilters.intensityRange[1]
      );
    }

    // Performance optimization: limit data points if in performance mode
    if (enablePerformanceMode && dataPoints.length > DATA_BATCH_SIZE) {
      dataPoints = dataPoints.slice(0, DATA_BATCH_SIZE);
    }

    const processingTime = performance.now() - startTime;
    console.log(`Data processing took ${processingTime.toFixed(2)}ms`);

    return { dataPoints, clusters, anomalies };
  }, [heatmapState.data, advancedFilters, enablePerformanceMode]);

  // ===== EVENT HANDLERS =====

  const handleBoundsChange = useCallback((newBounds: RegionBounds) => {
    // Enhanced bounds validation
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
    
    // Calculate bounds area for performance optimization
    const boundsArea = Math.abs(
      (newBounds.northeast[0] - newBounds.southwest[0]) *
      (newBounds.northeast[1] - newBounds.southwest[1])
    );
    
    // Adjust clustering threshold based on zoom level
    const clusterThreshold = boundsArea > 1 ? CLUSTER_THRESHOLD * 2 : CLUSTER_THRESHOLD;
    
    setBounds(newBounds);
    heatmapActions.setBounds(newBounds);
    heatmapActions.updateConfig({ 
      analytics: { 
        ...heatmapState.config.analytics, 
        clusterThreshold 
      } 
    });
    
    // Types for callback
    interface OnBoundsChangeCallback {
      (bounds: RegionBounds): void;
    }

    (onBoundsChange as OnBoundsChangeCallback | undefined)?.(newBounds);
  }, [heatmapActions, heatmapState.config.analytics, onBoundsChange]);

  const handlePointClick = useCallback((point: HeatmapDataPoint, event: React.MouseEvent) => {
    heatmapActions.selectPoint(point);
    onPointClick?.(point);

    if (enableTooltips) {
      setTooltip({
        visible: true,
        x: event.clientX,
        y: event.clientY,
        data: point,
        type: 'point'
      });
    }
  }, [heatmapActions, onPointClick, enableTooltips]);

  const handleClusterClick = useCallback((cluster: HeatmapCluster, event: React.MouseEvent) => {
    heatmapActions.selectCluster(cluster);
    onClusterClick?.(cluster);

    if (enableTooltips) {
      setTooltip({
        visible: true,
        x: event.clientX,
        y: event.clientY,
        data: cluster,
        type: 'cluster'
      });
    }
  }, [heatmapActions, onClusterClick, enableTooltips]);

  const handleAnomalyClick = useCallback((anomaly: HeatmapAnomaly, event: React.MouseEvent) => {
    heatmapActions.selectAnomaly(anomaly);
    onAnomalyClick?.(anomaly);

    if (enableTooltips) {
      setTooltip({
        visible: true,
        x: event.clientX,
        y: event.clientY,
        data: anomaly,
        type: 'anomaly'
      });
    }
  }, [heatmapActions, onAnomalyClick, enableTooltips]);

  const handleLayerToggle = useCallback((layer: string, visible: boolean) => {
    setLayerVisibility(prev => ({
      ...prev,
      [layer]: visible
    }));
  }, []);

  const handleConfigChange = useCallback((newConfig: Partial<HeatmapVisualizationConfig>) => {
    heatmapActions.updateVisualization(newConfig);
    onConfigChange?.(newConfig);
  }, [heatmapActions, onConfigChange]);

  const handleHeatmapConfigChange = useCallback((newConfig: Partial<HeatmapConfig>) => {
    heatmapActions.updateConfig(newConfig);
  }, [heatmapActions]);

  const handleRefresh = useCallback(() => {
    const startTime = performance.now();
    refetch();
    const refreshTime = performance.now() - startTime;
    console.log(`Data refresh took ${refreshTime.toFixed(2)}ms`);
  }, [refetch]);

  const handleExport = useCallback(async (format: 'json' | 'csv' | 'geojson' | 'kml') => {
    try {
      const startTime = performance.now();
      console.log(`Exporting data in ${format} format...`);
      await exportData();
      const exportTime = performance.now() - startTime;
      console.log(`Data export took ${exportTime.toFixed(2)}ms`);
    } catch (error) {
      console.error('Export failed:', error);
    }
  }, [exportData]);

  const handleFilterChange = useCallback((newFilters: Partial<typeof advancedFilters>) => {
    setAdvancedFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  // ===== EFFECTS =====

  // WebSocket subscription management with bounds updates
  useEffect(() => {
    if (enableRealtime && wsConnected) {
      const subscriptionId = wsSubscribe('main-region', bounds, {
        includeAnalytics: enableAnalytics,
        includePredictions: enableAdvancedFeatures,
        filters: advancedFilters
      });
      
      return () => {
        if (subscriptionId) {
          wsUnsubscribe(subscriptionId);
        }
      };
    }
  }, [enableRealtime, wsConnected, wsSubscribe, wsUnsubscribe, bounds, enableAnalytics, enableAdvancedFeatures, advancedFilters]);

  // Handle click outside to close tooltip
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tooltip.visible && tooltipRef.current && !tooltipRef.current.contains(event.target as Node)) {
        setTooltip(prev => ({ ...prev, visible: false }));
      }
    };

    if (tooltip.visible) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [tooltip.visible]);

  // Performance monitoring
  useEffect(() => {
    if (enableAdvancedFeatures) {
      const interval = setInterval(() => {
        const metrics = getMetrics();
        setPerformanceMetrics(prev => ({ ...prev, ...metrics }));
      }, 5000);
      
      return () => clearInterval(interval);
    }
  }, [enableAdvancedFeatures, getMetrics]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (renderTimeoutRef.current) {
        clearTimeout(renderTimeoutRef.current);
      }
    };
  }, []);

  // ===== RENDER COMPONENTS =====

  const StatusIndicator = () => (
    <motion.div 
      className="absolute top-4 right-30 z-50 flex items-center space-x-2"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Real-time connection status */}
      {enableRealtime && (
        <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
          wsConnected 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          <div className={`w-2 h-2 rounded-full ${
            wsConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
          }`} />
          <span>{wsConnected ? 'Live' : 'Offline'}</span>
        </div>
      )}

      {/* Performance metrics */}
      {enableAdvancedFeatures && (
        <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
          {performanceMetrics.dataPointCount || 0} points
        </div>
      )}

      {/* Last update time */}
      <div className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">
        {lastUpdateTime.toLocaleTimeString()}
      </div>
    </motion.div>
  );

  const ErrorDisplay = () => {
    if (!error) return null;

    const isDemoMode = error.includes('BACKEND_UNAVAILABLE') || error.includes('demo');
    
    return (
      <motion.div
        className={`absolute top-4 left-4 right-4 z-50 px-4 py-3 rounded-lg border ${
          isDemoMode 
            ? 'bg-blue-100 border-blue-400 text-blue-700' 
            : 'bg-red-100 border-red-400 text-red-700'
        }`}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
      >
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            {isDemoMode ? (
              <>
                <MdInfo className="w-5 h-5" />
                <span>🔧 Demo Mode: Using sample data (backend unavailable)</span>
              </>
            ) : (
              <>
                <MdWarning className="w-5 h-5" />
                <span>{error}</span>
              </>
            )}
          </div>
          <button 
            onClick={() => heatmapActions.clearError()}
            className="hover:opacity-70 transition-opacity"
          >
            ×
          </button>
        </div>
      </motion.div>
    );
  };

  const LoadingOverlay = () => {
    if (!isLoading) return null;

    return (
      <motion.div
        className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center z-30"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="bg-white rounded-lg p-4 shadow-lg flex items-center space-x-3">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="text-sm font-medium">Loading map data...</span>
        </div>
      </motion.div>
    );
  };

  // ===== MAIN RENDER =====

  return (
    <HeatmapErrorBoundary>
      <div 
        ref={containerRef}
        className={`heatmap-visualization relative w-full h-full bg-gray-50 overflow-hidden ${className}`}
        style={style}
      >
        {/* Status Indicators */}
        <StatusIndicator />

        {/* Error Display */}
        <AnimatePresence>
          <ErrorDisplay />
        </AnimatePresence>

        {/* Loading Overlay */}
        <AnimatePresence>
          <LoadingOverlay />
        </AnimatePresence>

        {/* Main Map Container */}
        <div className="relative w-full h-full">
          <Suspense fallback={<div className="w-full h-full bg-gray-200 animate-pulse" />}>
            <MapLibreMap
              data={processedData}
              bounds={bounds}
              layerVisibility={computedLayerVisibility}
              onBoundsChange={handleBoundsChange}
              onPointClick={handlePointClick}
              onClusterClick={handleClusterClick}
              onAnomalyClick={handleAnomalyClick}
              isLoading={isLoading}
              onMapInstanceReady={(map) => {
                setMapInstance(map);
                setMapReady(true);
              }}
            />
          </Suspense>

          {/* Mobile Search Overlay */}
          <div className="absolute top-5 left-4 right-4 md:hidden z-50">
            <div className="bg-white rounded-full shadow-lg">
              {mapInstance && mapReady ? (
                <SearchAndNavigate
                  map={mapInstance}
                  className="w-full"
                  placeholder="Search for locations..."
                  mobile={true}
                  darkMode={false}
                  onLocationSelect={(location) => {
                    if (location.geometry?.coordinates) {
                      const [longitude, latitude] = location.geometry.coordinates;
                      const buffer = 0.01;
                      handleBoundsChange({
                        southwest: [longitude - buffer, latitude - buffer],
                        northeast: [longitude + buffer, latitude + buffer]
                      });
                    }
                  }}
                />
              ) : (
                <div className="flex items-center w-full p-3">
                  <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"></div>
                  <span className="text-sm text-gray-600">Map loading...</span>
                </div>
              )}
            </div>
          </div>

          {/* Advanced Controls */}
          {enableControls && mapReady && (
            <HeatmapControls
              visualization={heatmapState.visualization}
              selectedLayer={selectedLayer}
              layerVisibility={layerVisibility}
              isLoading={isLoading}
              isConnected={wsConnected}
              wsStatus={wsStatus}
              wsMetrics={wsMetrics}
              performanceMetrics={performanceMetrics}
              filters={advancedFilters}
              enableAdvancedFeatures={enableAdvancedFeatures}
              onLayerChange={(layer) => setSelectedLayer(layer as typeof selectedLayer)}
              onLayerToggle={handleLayerToggle}
              onConfigChange={handleHeatmapConfigChange}
              onVisualizationChange={handleConfigChange}
              onRefresh={handleRefresh}
              onExport={handleExport}
              onFilterChange={handleFilterChange}
              onSidebarToggle={() => setSidebarOpen(!sidebarOpen)}
            />
          )}

          {/* Enhanced Sidebar */}
          <AnimatePresence>
            {enableSidebar && sidebarOpen && (
              <HeatmapSidebar
                isOpen={sidebarOpen}
                data={heatmapState.data}
                selectedPoint={heatmapState.selectedPoint}
                selectedCluster={heatmapState.selectedCluster}
                selectedAnomaly={heatmapState.selectedAnomaly}
                performanceMetrics={performanceMetrics}
                enableAdvancedFeatures={enableAdvancedFeatures}
                onAction={(action, pointId) => console.log('Sidebar action:', action, pointId)}
                onClose={() => setSidebarOpen(false)}
                className="absolute left-0 top-0 h-full w-80 bg-white shadow-lg z-40"
              />
            )}
          </AnimatePresence>

          {/* Enhanced Legend */}
          <HeatmapLegend
            config={heatmapState.visualization}
            data={processedData}
            selectedLayer={selectedLayer}
            layerVisibility={computedLayerVisibility}
            categoryIcons={CATEGORY_ICONS}
            className="absolute bottom-4 left-4"
          />

          {/* Advanced Tooltip */}
          {enableTooltips && tooltip.visible && tooltip.data && (
            <div ref={tooltipRef}>
              <HeatmapTooltip
                data={tooltip.data}
                type={tooltip.type}
                position={[tooltip.x, tooltip.y]}
                categoryIcons={CATEGORY_ICONS}
                enableAdvancedFeatures={enableAdvancedFeatures}
                onClose={() => setTooltip(prev => ({ ...prev, visible: false }))}
              />
            </div>
          )}

          {/* Performance Monitor (Advanced Features) */}
          {enableAdvancedFeatures && enableControls && (
            <motion.div 
              className="absolute top-20 right-4 z-40 bg-white/90 backdrop-blur-md rounded-lg shadow-lg border border-white/20 p-3 max-w-xs"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.5 }}
            >
              <div className="text-xs font-semibold text-gray-700 mb-2 flex items-center">
                <MdAnalytics className="w-3 h-3 mr-1" />
                Performance
              </div>
              <div className="space-y-1 text-xs text-gray-600">
                <div className="flex justify-between">
                  <span>Render:</span>
                  <span>{performanceMetrics.renderTime.toFixed(1)}ms</span>
                </div>
                <div className="flex justify-between">
                  <span>Points:</span>
                  <span>{performanceMetrics.dataPointCount?.toLocaleString() || '0'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Clusters:</span>
                  <span>{performanceMetrics.clusters}</span>
                </div>
                {wsMetrics && (
                  <div className="flex justify-between">
                    <span>Latency:</span>
                    <span>{wsMetrics.latency}ms</span>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Quick Action Buttons (Advanced Features) */}
          {enableAdvancedFeatures && enableControls && (
            <motion.div 
              className="absolute bottom-20 right-4 z-40 bg-white/90 backdrop-blur-md rounded-lg shadow-lg border border-white/20"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
            >
              <div className="flex flex-col">
                <motion.button
                  onClick={() => handleRefresh()}
                  className="p-3 hover:bg-gray-100 transition-colors border-b border-gray-200 group"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  title="Refresh Data"
                >
                  <MdRefresh className={`w-4 h-4 text-gray-700 ${isLoading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-300'}`} />
                </motion.button>
                
                <motion.button
                  onClick={() => handleExport('geojson')}
                  className="p-3 hover:bg-gray-100 transition-colors border-b border-gray-200 group"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  title="Export Data"
                >
                  <MdDownload className="w-4 h-4 text-gray-700 group-hover:translate-y-0.5 transition-transform" />
                </motion.button>

                <motion.button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="p-3 hover:bg-gray-100 transition-colors border-b border-gray-200"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  title="Toggle Analytics Panel"
                >
                  <MdTimeline className="w-4 h-4 text-gray-700" />
                </motion.button>

                <motion.button
                  className="p-3 hover:bg-gray-100 transition-colors rounded-b-lg"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  title="Filter Options"
                  onClick={() => {
                    // Toggle advanced filter panel
                    console.log('Toggle advanced filters');
                  }}
                >
                  <MdFilterList className="w-4 h-4 text-gray-700" />
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* Notification Center (Advanced Features) */}
          {enableAdvancedFeatures && heatmapState.notifications && heatmapState.notifications.length > 0 && (
            <motion.div 
              className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-md"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              {heatmapState.notifications.slice(0, 3).map((notification, index) => (
                <motion.div
                  key={notification.id}
                  className={`mb-2 p-3 rounded-lg shadow-lg border-l-4 ${
                    notification.type === 'warning' 
                      ? 'bg-yellow-50 border-yellow-400 text-yellow-800'
                      : notification.type === 'error'
                      ? 'bg-red-50 border-red-400 text-red-800'
                      : 'bg-blue-50 border-blue-400 text-blue-800'
                  }`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-2">
                      {notification.type === 'warning' && <MdWarning className="w-4 h-4" />}
                      {notification.type === 'error' && <MdWarning className="w-4 h-4" />}
                      {notification.type === 'info' && <MdInfo className="w-4 h-4" />}
                      <span className="text-sm font-medium">{notification.title}</span>
                    </div>
                    <button 
                      onClick={() => heatmapActions.dismissNotification(notification.id)}
                      className="text-current hover:opacity-70 transition-opacity ml-2"
                    >
                      ×
                    </button>
                  </div>
                  {notification.message && (
                    <p className="text-xs mt-1 ml-6">{notification.message}</p>
                  )}
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* Zoom and Navigation Controls */}
          {enableControls && (
            <motion.div 
              className="absolute bottom-4 right-4 z-40 bg-white/90 backdrop-blur-md rounded-lg shadow-lg border border-white/20"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex flex-col">
                <motion.button
                  className="p-3 hover:bg-gray-100 transition-colors border-b border-gray-200 group"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    if (mapInstance) {
                      mapInstance.zoomIn();
                    }
                  }}
                  title="Zoom In"
                >
                  <MdZoomIn className="w-5 h-5 text-gray-700 group-hover:scale-110 transition-transform" />
                </motion.button>
                
                <motion.button
                  className="p-3 hover:bg-gray-100 transition-colors border-b border-gray-200 group"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    if (mapInstance) {
                      mapInstance.zoomOut();
                    }
                  }}
                  title="Zoom Out"
                >
                  <MdZoomOut className="w-5 h-5 text-gray-700 group-hover:scale-110 transition-transform" />
                </motion.button>
                
                <motion.button
                  className="p-3 hover:bg-gray-100 transition-colors border-b border-gray-200 group"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    if (mapInstance) {
                      mapInstance.fitBounds([
                        [bounds.southwest[0], bounds.southwest[1]],
                        [bounds.northeast[0], bounds.northeast[1]]
                      ]);
                    }
                  }}
                  title="Fit to Bounds"
                >
                  <MdPlace className="w-5 h-5 text-gray-700 group-hover:scale-110 transition-transform" />
                </motion.button>
                
                <motion.button
                  className="p-3 hover:bg-gray-100 transition-colors rounded-b-lg group"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    if (document.fullscreenElement) {
                      document.exitFullscreen();
                    } else {
                      containerRef.current?.requestFullscreen();
                    }
                  }}
                  title="Toggle Fullscreen"
                >
                  <MdFullscreen className="w-5 h-5 text-gray-700 group-hover:scale-110 transition-transform" />
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* Layer Toggle Controls */}
          {enableControls && (
            <motion.div 
              className="absolute top-4 left-4 z-40 bg-white/90 backdrop-blur-md rounded-lg shadow-lg border border-white/20 p-3 max-w-xs"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="space-y-2">
                <div className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                  <MdLayers className="w-4 h-4 mr-2" />
                  Map Layers
                </div>
                
                {/* Layer Selection Tabs */}
                <div className="flex space-x-1 mb-3">
                  {(['all', 'heatmap', 'clusters', 'points'] as const).map((layer) => (
                    <motion.button
                      key={layer}
                      onClick={() => setSelectedLayer(layer)}
                      className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                        selectedLayer === layer
                          ? 'bg-blue-500 text-white' 
                          : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {layer === 'all' ? 'All' : layer.charAt(0).toUpperCase() + layer.slice(1)}
                    </motion.button>
                  ))}
                </div>

                {/* Individual Layer Toggles */}
                <div className="space-y-1">
                  {Object.entries(layerVisibility).map(([layer, visible]) => (
                    <motion.button
                      key={layer}
                      onClick={() => handleLayerToggle(layer, !visible)}
                      className={`flex items-center justify-between w-full p-2 rounded text-xs font-medium transition-colors ${
                        visible 
                          ? 'bg-blue-50 text-blue-800 border border-blue-200' 
                          : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
                      }`}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                    >
                      <div className="flex items-center space-x-2">
                        {visible ? <MdVisibility className="w-3 h-3" /> : <MdVisibilityOff className="w-3 h-3" />}
                        <span className="capitalize">{layer.replace(/([A-Z])/g, ' $1').toLowerCase()}</span>
                      </div>
                      
                      {/* Data count indicators */}
                      {layer === 'points' && (
                        <span className="text-xs opacity-60">{processedData.dataPoints.length}</span>
                      )}
                      {layer === 'clusters' && (
                        <span className="text-xs opacity-60">{processedData.clusters.length}</span>
                      )}
                      {layer === 'anomalies' && (
                        <span className="text-xs opacity-60">{processedData.anomalies.length}</span>
                      )}
                    </motion.button>
                  ))}
                </div>

                {/* Advanced Layer Options */}
                {enableAdvancedFeatures && (
                  <div className="mt-4 pt-3 border-t border-gray-200">
                    <div className="text-xs font-semibold text-gray-600 mb-2">Advanced Options</div>
                    <div className="space-y-1">
                      <motion.button
                        className="flex items-center justify-between w-full p-2 rounded text-xs hover:bg-gray-100 transition-colors"
                        whileHover={{ scale: 1.01 }}
                        onClick={() => {
                          // Toggle performance mode
                          console.log('Toggle performance mode');
                        }}
                      >
                        <span>Performance Mode</span>
                        <div className={`w-8 h-4 rounded-full ${enablePerformanceMode ? 'bg-blue-500' : 'bg-gray-300'} relative transition-colors`}>
                          <div className={`w-3 h-3 bg-white rounded-full absolute top-0.5 transition-transform ${enablePerformanceMode ? 'translate-x-4' : 'translate-x-0.5'}`} />
                        </div>
                      </motion.button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </HeatmapErrorBoundary>
  );
});

// ===== COMPONENT DISPLAY NAME =====
HeatmapVisualization.displayName = 'HeatmapVisualization';

// ===== EXPORT =====
export default HeatmapVisualization;