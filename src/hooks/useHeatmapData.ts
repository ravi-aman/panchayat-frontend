// ===== ADVANCED HEATMAP DATA HOOK =====
// Production-level React hook for heatmap data management

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  HeatmapState,
  HeatmapActions,
  HeatmapConfig,
  HeatmapVisualizationConfig,
  RegionBounds,
  HeatmapDataPoint,
  HeatmapCluster,
  HeatmapAnomaly,
  HeatmapApiResponse,
  PerformanceMetrics
} from '../types/heatmap';
import { getHeatmapApiService } from '../services/HeatmapApiService';
import { useToast } from '../contexts/toast/toastContext';

// ===== HOOK CONFIGURATION =====

interface UseHeatmapDataOptions {
  bounds: RegionBounds;
  config?: Partial<HeatmapConfig>;
  visualization?: Partial<HeatmapVisualizationConfig>;
  enableRealtime?: boolean;
  enablePerformanceTracking?: boolean;
  onError?: (error: Error) => void;
  onUpdate?: (data: HeatmapApiResponse['data']) => void;
}

interface HeatmapHookReturn {
  state: HeatmapState;
  actions: HeatmapActions;
  performance: PerformanceMetrics;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
  exportData: () => Promise<any>;
  getMetrics: () => PerformanceMetrics;
}

// ===== DEFAULT CONFIGURATIONS =====

const defaultHeatmapConfig: HeatmapConfig = {
  regionId: 'default',
  bounds: { southwest: [0, 0], northeast: [0, 0] },
  resolution: 8,
  layers: ['points', 'clusters'],
  filters: {
    categories: undefined,
    urgencyLevels: undefined,
    timeRange: undefined,
    minConfidence: 0.5,
    minSeverity: 0
  },
  visualization: {
    colorScheme: 'viridis',
    opacity: 0.8,
    radius: 20,
    blur: 15,
    maxZoom: 18,
    minZoom: 3,
    clusterRadius: 50,
    showLabels: true,
    showTooltips: true,
    animationDuration: 300
  },
  realtime: {
    enabled: true,
    updateInterval: 30000,
    autoRefresh: true,
    pushNotifications: false,
    anomalyAlerts: true,
    predictionUpdates: false
  },
  analytics: {
    enableTrends: true,
    enablePredictions: false,
    enableAnomalyDetection: true,
    enableClustering: true,
    historicalDepth: 30,
    refreshInterval: 300000
  }
};

const defaultVisualizationConfig: HeatmapVisualizationConfig = {
  mapStyle: 'streets',
  center: [77.5946, 12.9716], // Bangalore coordinates
  zoom: 12,
  pitch: 0,
  bearing: 0,
  interactive: true,
  controls: {
    navigation: true,
    fullscreen: true,
    scale: true,
    geolocate: true
  },
  layers: {
    heatmap: {
      visible: true,
      opacity: 0.8,
      radius: 20,
      blur: 15,
      weight: 'value',
      colorStops: [
        [0, '#3182ce'],
        [0.25, '#63b3ed'],
        [0.5, '#fbb040'],
        [0.75, '#f56565'],
        [1, '#e53e3e']
      ]
    },
    clusters: {
      visible: true,
      opacity: 0.7,
      radius: 30,
      strokeWidth: 2,
      strokeColor: '#ffffff'
    },
    points: {
      visible: true,
      radius: 8,
      opacity: 0.9,
      strokeWidth: 1
    },
    boundaries: {
      visible: false,
      opacity: 0.3,
      strokeWidth: 1,
      strokeColor: '#718096',
      fillOpacity: 0.1
    }
  }
};

// ===== MAIN HOOK IMPLEMENTATION =====

export const useHeatmapData = (options: UseHeatmapDataOptions): HeatmapHookReturn => {
  const {
    bounds,
    config: userConfig = {},
    visualization: userVisualization = {},
    enablePerformanceTracking = true,
    onError,
    onUpdate
  } = options;

  const toast = useToast();
  const apiService = getHeatmapApiService();
  
  // Performance tracking
  const performanceRef = useRef<PerformanceMetrics>({
    renderTime: 0,
    dataProcessingTime: 0,
    networkLatency: 0,
    memoryUsage: 0,
    frameRate: 60,
    cacheHitRate: 0,
    updateFrequency: 0,
    errorRate: 0
  });

  // State management
  const [state, setState] = useState<HeatmapState>(() => ({
    data: null,
    config: { ...defaultHeatmapConfig, bounds, ...userConfig },
    visualization: { ...defaultVisualizationConfig, ...userVisualization },
    loading: false,
    error: null,
    lastUpdated: null,
    selectedPoint: null,
    selectedCluster: null,
    selectedAnomaly: null,
    viewport: {
      bounds,
      center: userVisualization.center || defaultVisualizationConfig.center,
      zoom: userVisualization.zoom || defaultVisualizationConfig.zoom
    },
    realtime: {
      connected: false,
      subscriptions: [],
      lastUpdate: null,
      updateCount: 0
    },
    performance: {
      renderTime: 0,
      dataSize: 0,
      frameRate: 60,
      memoryUsage: 0
    }
  }));

  // Loading and error state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper function to show toast messages
  const showToast = useCallback((type: 'success' | 'error', message: string) => {
    toast.open({
      message: { heading: type === 'success' ? 'Success' : 'Error', content: message },
      color: type,
      duration: 5000
    });
  }, [toast]);

  // Debounced bounds for reduced API calls
  const [debouncedBounds, setDebouncedBounds] = useState<RegionBounds>(bounds);
  
  // Debounce bounds changes to reduce API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedBounds(bounds);
    }, 500); // Increased debounce time

    return () => clearTimeout(timer);
  }, [bounds]);

  // Data fetching function with better error handling
  const fetchData = useCallback(async (newBounds?: RegionBounds) => {
    const boundsToUse = newBounds || debouncedBounds;
    setIsLoading(true);
    setError(null);

    const startTime = performance.now();
    
    try {
      // Check cache first
      const cacheKey = `heatmap-${boundsToUse.southwest.join(',')}-${boundsToUse.northeast.join(',')}`;
      const cachedData = apiService.getCache()?.get(cacheKey);
      
      if (cachedData && enablePerformanceTracking && typeof cachedData === 'object' && 'data' in cachedData) {
        setState(prev => ({
          ...prev,
          data: (cachedData as { data: any }).data,
          lastUpdated: new Date(),
          error: null,
          loading: false
        }));
        setIsLoading(false);
        return;
      }

      const result = await apiService.getRealtimeHeatmap(boundsToUse, state.config);
      
      // Cache the result
      if (enablePerformanceTracking) {
        apiService.getCache()?.set(cacheKey, result, 30000); // 30 second cache
      }

      // Track performance
      if (enablePerformanceTracking) {
        const endTime = performance.now();
        performanceRef.current.dataProcessingTime = endTime - startTime;
        performanceRef.current.networkLatency = endTime - startTime;
      }

      setState(prev => ({
        ...prev,
        data: result.data,
        lastUpdated: new Date(),
        error: null,
        loading: false
      }));

      if (onUpdate) {
        onUpdate(result.data);
      }

      setIsLoading(false);
    } catch (error) {
      const errorMessage = (error as Error).message;
      setError(errorMessage);
      setIsLoading(false);
      
      setState(prev => ({
        ...prev,
        error: errorMessage,
        loading: false
      }));

      if (onError) {
        onError(error as Error);
      }

      showToast('error', `Failed to load heatmap data: ${errorMessage}`);
    }
  }, [debouncedBounds, state.config, apiService, enablePerformanceTracking, onUpdate, onError, showToast]);

  // Fetch clusters
  const fetchClusters = useCallback(async () => {
    if (!state.config.analytics.enableClustering) return;

    try {
      const result = await apiService.getClusters(bounds, 'dbscan');
      setState(prev => ({
        ...prev,
        data: prev.data ? {
          ...prev.data,
          clusters: result.clusters
        } : null
      }));
    } catch (error) {
      console.error('Failed to fetch clusters:', error);
    }
  }, [bounds, state.config.analytics.enableClustering, apiService]);

  // Fetch anomalies
  const fetchAnomalies = useCallback(async () => {
    if (!state.config.analytics.enableAnomalyDetection) return;

    try {
      const result = await apiService.detectAnomalies(bounds, 0.8, 60);
      setState(prev => ({
        ...prev,
        data: prev.data ? {
          ...prev.data,
          anomalies: result.anomalies
        } : null
      }));
    } catch (error) {
      console.error('Failed to fetch anomalies:', error);
    }
  }, [bounds, state.config.analytics.enableAnomalyDetection, apiService]);

  // Refetch function
  const refetch = useCallback(async () => {
    await fetchData();
    await fetchClusters();
    await fetchAnomalies();
  }, [fetchData, fetchClusters, fetchAnomalies]);

  // ===== ACTIONS IMPLEMENTATION =====

  // Define all callback functions at the top level
  const handleFetchData = useCallback(async (newBounds?: RegionBounds) => {
    if (newBounds) {
      setState(prev => ({
        ...prev,
        config: { ...prev.config, bounds: newBounds },
        viewport: { ...prev.viewport, bounds: newBounds }
      }));
    }
    await fetchData(newBounds);
  }, [fetchData]);

  const handleRefreshData = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const handleUpdateConfig = useCallback((newConfig: Partial<HeatmapConfig>) => {
    setState(prev => ({
      ...prev,
      config: { ...prev.config, ...newConfig }
    }));
  }, []);

  const handleUpdateVisualization = useCallback((newVisualization: Partial<HeatmapVisualizationConfig>) => {
    setState(prev => ({
      ...prev,
      visualization: { ...prev.visualization, ...newVisualization }
    }));
  }, []);

  // Selection management
  const handleSelectPoint = useCallback((point: HeatmapDataPoint | null) => {
    setState(prev => ({
      ...prev,
      selectedPoint: point,
      selectedCluster: null,
      selectedAnomaly: null
    }));
  }, []);

  const handleSelectCluster = useCallback((cluster: HeatmapCluster | null) => {
    setState(prev => ({
      ...prev,
      selectedCluster: cluster,
      selectedPoint: null,
      selectedAnomaly: null
    }));
  }, []);

  const handleSelectAnomaly = useCallback((anomaly: HeatmapAnomaly | null) => {
    setState(prev => ({
      ...prev,
      selectedAnomaly: anomaly,
      selectedPoint: null,
      selectedCluster: null
    }));
  }, []);

  const handleClearSelection = useCallback(() => {
    setState(prev => ({
      ...prev,
      selectedPoint: null,
      selectedCluster: null,
      selectedAnomaly: null
    }));
  }, []);

  // Real-time management
  const handleSubscribeToRegion = useCallback(async (regionId: string, _regionBounds: RegionBounds) => {
    // Implementation will be added with WebSocket hook
    setState(prev => ({
      ...prev,
      realtime: {
        ...prev.realtime,
        subscriptions: [...prev.realtime.subscriptions, regionId]
      }
    }));
  }, []);

  const handleUnsubscribeFromRegion = useCallback((regionId: string) => {
    setState(prev => ({
      ...prev,
      realtime: {
        ...prev.realtime,
        subscriptions: prev.realtime.subscriptions.filter(id => id !== regionId)
      }
    }));
  }, []);

  const handleToggleRealtime = useCallback((enabled: boolean) => {
    setState(prev => ({
      ...prev,
      config: {
        ...prev.config,
        realtime: { ...prev.config.realtime, enabled }
      }
    }));
  }, []);

  // Viewport management
  const handleSetBounds = useCallback((newBounds: RegionBounds) => {
    setState(prev => ({
      ...prev,
      viewport: { ...prev.viewport, bounds: newBounds }
    }));
  }, []);

  const handleSetCenter = useCallback((center: [number, number]) => {
    setState(prev => ({
      ...prev,
      viewport: { ...prev.viewport, center }
    }));
  }, []);

  const handleSetZoom = useCallback((zoom: number) => {
    setState(prev => ({
      ...prev,
      viewport: { ...prev.viewport, zoom }
    }));
  }, []);

  const handleFitToBounds = useCallback((fitBounds: RegionBounds) => {
    // Calculate center and zoom from bounds
    const centerLng = (fitBounds.southwest[0] + fitBounds.northeast[0]) / 2;
    const centerLat = (fitBounds.southwest[1] + fitBounds.northeast[1]) / 2;
    
    setState(prev => ({
      ...prev,
      viewport: {
        ...prev.viewport,
        bounds: fitBounds,
        center: [centerLng, centerLat],
        zoom: 12 // Calculate appropriate zoom level
      }
    }));
  }, []);

  // Utility actions
  const handleExportData = useCallback(async (format: 'json' | 'csv' | 'geojson') => {
    try {
      const blob = await apiService.exportData(bounds, format, state.config.filters);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `heatmap-data-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      showToast('success', `Data exported as ${format.toUpperCase()}`);
    } catch (error) {
      showToast('error', `Export failed: ${(error as Error).message}`);
    }
  }, [bounds, state.config.filters, apiService, showToast]);

  const handleResetState = useCallback(() => {
    setState(prev => ({
      ...prev,
      data: null,
      selectedPoint: null,
      selectedCluster: null,
      selectedAnomaly: null,
      error: null,
      realtime: {
        connected: false,
        subscriptions: [],
        lastUpdate: null,
        updateCount: 0
      }
    }));
  }, []);

  const handleClearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
    setError(null);
  }, []);

  // Create actions object using useMemo
  const actions: HeatmapActions = useMemo(() => ({
    // Data management
    fetchData: handleFetchData,
    refreshData: handleRefreshData,
    updateConfig: handleUpdateConfig,
    updateVisualization: handleUpdateVisualization,

    // Selection management
    selectPoint: handleSelectPoint,
    selectCluster: handleSelectCluster,
    selectAnomaly: handleSelectAnomaly,
    clearSelection: handleClearSelection,

    // Real-time management
    subscribeToRegion: handleSubscribeToRegion,
    unsubscribeFromRegion: handleUnsubscribeFromRegion,
    toggleRealtime: handleToggleRealtime,

    // Viewport management
    setBounds: handleSetBounds,
    setCenter: handleSetCenter,
    setZoom: handleSetZoom,
    fitToBounds: handleFitToBounds,

    // Utility actions
    exportData: handleExportData,
    resetState: handleResetState,
    clearError: handleClearError
  }), [
    handleFetchData,
    handleRefreshData,
    handleUpdateConfig,
    handleUpdateVisualization,
    handleSelectPoint,
    handleSelectCluster,
    handleSelectAnomaly,
    handleClearSelection,
    handleSubscribeToRegion,
    handleUnsubscribeFromRegion,
    handleToggleRealtime,
    handleSetBounds,
    handleSetCenter,
    handleSetZoom,
    handleFitToBounds,
    handleExportData,
    handleResetState,
    handleClearError
  ]);

  // Performance monitoring effect - less frequent updates
  useEffect(() => {
    if (!enablePerformanceTracking) return;

    const interval = setInterval(() => {
      performanceRef.current = {
        ...performanceRef.current,
        ...apiService.getPerformanceStats(),
        memoryUsage: (performance as any).memory?.usedJSHeapSize || 0,
        frameRate: 60 // Would be calculated by animation frame tracking
      };

      setState(prev => ({
        ...prev,
        performance: {
          renderTime: performanceRef.current.renderTime,
          dataSize: prev.data?.dataPoints?.length || 0,
          frameRate: performanceRef.current.frameRate,
          memoryUsage: performanceRef.current.memoryUsage
        }
      }));
    }, 10000); // Reduced frequency from 5000ms to 10000ms

    return () => clearInterval(interval);
  }, [enablePerformanceTracking, apiService]);

  // Initial data fetch - only on mount, not on every bounds change
  useEffect(() => {
    fetchData();
  }, []); // Remove bounds dependency to avoid infinite loop

  // Separate effect for bounds changes with reduced debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (bounds && (
        bounds.southwest[0] !== state.config.bounds.southwest[0] ||
        bounds.southwest[1] !== state.config.bounds.southwest[1] ||
        bounds.northeast[0] !== state.config.bounds.northeast[0] ||
        bounds.northeast[1] !== state.config.bounds.northeast[1]
      )) {
        fetchData(bounds);
      }
    }, 300); // Reduced from 1000ms to 300ms for smoother response

    return () => clearTimeout(timeoutId);
  }, [bounds, fetchData, state.config.bounds]);

  // Real-time updates
  useEffect(() => {
    if (!state.config.realtime.enabled || !state.config.realtime.autoRefresh) return;

    const interval = setInterval(() => {
      refetch();
    }, state.config.realtime.updateInterval);

    return () => clearInterval(interval);
  }, [state.config.realtime.enabled, state.config.realtime.autoRefresh, state.config.realtime.updateInterval, refetch]);

  // Export data function
  const exportData = useCallback(async () => {
    try {
      // Return the current data for export
      return {
        data: state.data,
        config: state.config,
        performance: performanceRef.current,
        timestamp: new Date().toISOString()
      };
    } catch (err) {
      console.error('Failed to export data:', err);
      throw err;
    }
  }, [state.data, state.config]);

  // Get metrics function
  const getMetrics = useCallback(() => {
    return performanceRef.current;
  }, []);

  return {
    state,
    actions,
    performance: performanceRef.current,
    isLoading,
    error,
    refetch,
    exportData,
    getMetrics
  };
};

// ===== SPECIALIZED HOOKS =====

/**
 * Hook for predictive heatmap data
 */
export const usePredictiveHeatmap = (
  bounds: RegionBounds,
  timeHorizon: string = '1day',
  confidence: number = 0.7
) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const apiService = getHeatmapApiService();
  
  const fetchData = useCallback(async () => {
    if (!bounds) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await apiService.getPredictiveHeatmap(bounds, timeHorizon, confidence);
      setData(result);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [bounds, timeHorizon, confidence, apiService]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
};

/**
 * Hook for heatmap analytics
 */
export const useHeatmapAnalytics = (
  bounds: RegionBounds,
  timeRange: { start: Date; end: Date }
) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const apiService = getHeatmapApiService();
  
  const fetchData = useCallback(async () => {
    if (!bounds || !timeRange.start || !timeRange.end) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await apiService.getAnalytics(bounds, timeRange);
      setData(result);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [bounds, timeRange, apiService]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
};

/**
 * Hook for system performance monitoring
 */
export const useHeatmapPerformance = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const apiService = getHeatmapApiService();
  
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await apiService.getPerformanceMetrics();
      setData(result);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [apiService]);

  useEffect(() => {
    fetchData();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
};

/**
 * Hook for creating civic issues
 */
export const useCreateCivicIssue = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const apiService = getHeatmapApiService();
  const toast = useToast();

  const createIssue = useCallback(async (issueData: any) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await apiService.createCivicIssue(issueData);
      toast.open({
        message: { heading: 'Success', content: 'Civic issue created successfully' },
        color: 'success',
        duration: 5000
      });
      return result;
    } catch (err) {
      const errorMessage = (err as Error).message;
      setError(errorMessage);
      toast.open({
        message: { heading: 'Error', content: `Failed to create issue: ${errorMessage}` },
        color: 'error',
        duration: 5000
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiService, toast]);

  return { createIssue, loading, error };
};

export default useHeatmapData;