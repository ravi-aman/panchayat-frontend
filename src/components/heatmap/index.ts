// ===== ADVANCED HEATMAP SYSTEM - PRODUCTION EXPORTS =====
// Complete production-ready heatmap system with all components

// Main Dashboard Components
export { AdvancedHeatmapDashboard as default } from './HeatmapAnalyticsDashboard';
export { AdvancedHeatmapDashboard, AdvancedHeatmapDashboard as HeatmapAnalyticsDashboard } from './HeatmapAnalyticsDashboard';

// Core Map Components
export { HeatmapVisualization } from './HeatmapVisualization';
export { default as MapLibreMap } from './MapLibreMap';
export { EnhancedMapLibreMap } from './EnhancedMapLibreMap';

// Advanced UI Components
export { HeatmapControls } from './HeatmapControls';
export { HeatmapSidebar } from './HeatmapSidebar';
export { HeatmapLegend } from './HeatmapLegend';
export { HeatmapTooltip } from './HeatmapTooltip';
export { HeatmapErrorBoundary } from './HeatmapErrorBoundary';

// Mobile-Optimized Components
export { MobileHeatmapInterface } from './MobileHeatmapInterface';

// Context Providers
export { MapProvider, useMap, useMapInstance, useMapSelection, useMapLayers, useMapView, useMapPerformance } from '../../contexts/EnhancedMapContext';

// Hooks
export { useHeatmapData } from '../../hooks/useHeatmapData';
export { useHeatmapWebSocket } from '../../hooks/useHeatmapWebSocket';

// Types
export type { 
  HeatmapDataPoint,
  HeatmapCluster,
  HeatmapAnomaly,
  HeatmapState,
  HeatmapConfig,
  RegionBounds,
  IssueCategory,
  HeatmapLayer,
  HeatmapAnalytics,
  WebSocketMessage,
  HeatmapRealTimeConfig,
  HeatmapWebSocketHook
} from '../../types/heatmap';

// Default Configuration for Quick Setup
export const DEFAULT_HEATMAP_CONFIG = {
  analytics: {
    enableClustering: true,
    enableAnomalyDetection: true,
    enableTrends: true,
    enablePredictions: true,
    historicalDepth: 30,
    refreshInterval: 300000 // 5 minutes
  },
  realtime: {
    enabled: true,
    updateInterval: 5000, // 5 seconds
    autoRefresh: true,
    pushNotifications: true,
    anomalyAlerts: true,
    predictionUpdates: true
  }
};

// Performance Constants
export const PERFORMANCE_LIMITS = {
  maxDataPoints: 10000,
  maxClusters: 500,
  maxZoomLevel: 18,
  minZoomLevel: 8,
  renderThrottleMs: 100,
  updateDebounceMs: 300
} as const;