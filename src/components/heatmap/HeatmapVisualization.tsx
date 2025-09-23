// ===== ADVANCED HEATMAP VISUALIZATION COMPONENT =====
// Production-level React component for interactive heatmap visualization with MapLibre GL

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  HeatmapDataPoint,
  HeatmapCluster,
  HeatmapAnomaly,
  RegionBounds,
  HeatmapVisualizationConfig
} from '../../types/heatmap';
import { useHeatmapData } from '../../hooks/useHeatmapData';
import { useHeatmapWebSocket } from '../../hooks/useHeatmapWebSocket';
import MapLibreMap from './MapLibreMap';
import { useMap } from '../../contexts/MapContext';
import { 
  HeatmapControls, 
  HeatmapLegend, 
  HeatmapTooltip, 
  HeatmapSidebar, 
  HeatmapErrorBoundary 
} from './HeatmapComponents';

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
  const { setMapInstance } = useMap();
  
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