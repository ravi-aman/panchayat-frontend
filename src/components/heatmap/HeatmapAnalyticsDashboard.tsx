import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RegionBounds, HeatmapDataPoint, HeatmapCluster } from '../../types/heatmap';
import { HeatmapVisualization } from './HeatmapVisualization';
import { HeatmapControls } from './HeatmapControls';
import { HeatmapSidebar } from './HeatmapSidebar';
import { HeatmapTooltip } from './HeatmapTooltip';
import { MobileHeatmapInterface } from './MobileHeatmapInterface';
import { useHeatmapData } from '../../hooks/useHeatmapData';
import { useHeatmapWebSocket } from '../../hooks/useHeatmapWebSocket';
import SearchAndNavigate from '../common/SearchAndNavigate';
import { useMap } from '../../contexts/MapContext';

// React Icons for category-specific markers
import {
  MdElectricBolt,
  MdWater,
  MdTraffic,
  MdConstruction,
  MdWarning,
  MdDelete,
  MdLightbulb,
  MdSecurity,
  MdAnalytics,
  MdInfo,
  MdClose
} from 'react-icons/md';

// Enhanced category configuration with advanced visualization
const CATEGORY_CONFIG: Record<string, {
  icon: React.ComponentType<any>;
  color: string;
  bgColor: string;
  label: string;
  priority: string;
  actionColor: string;
}> = {
  'electricity': { 
    icon: MdElectricBolt, 
    color: '#FFC107', 
    bgColor: '#FFF3C4',
    label: 'Electrical Issues',
    priority: 'high',
    actionColor: '#FF6B35'
  },
  'water': { 
    icon: MdWater, 
    color: '#2196F3', 
    bgColor: '#E3F2FD',
    label: 'Water Issues',
    priority: 'high',
    actionColor: '#1976D2'
  },
  'traffic': { 
    icon: MdTraffic, 
    color: '#FF5722', 
    bgColor: '#FFEBEE',
    label: 'Traffic Issues',
    priority: 'medium',
    actionColor: '#D32F2F'
  },
  'construction': { 
    icon: MdConstruction, 
    color: '#FF9800', 
    bgColor: '#FFF3E0',
    label: 'Construction',
    priority: 'medium',
    actionColor: '#F57C00'
  },
  'waste': { 
    icon: MdDelete, 
    color: '#4CAF50', 
    bgColor: '#E8F5E8',
    label: 'Waste Management',
    priority: 'medium',
    actionColor: '#388E3C'
  },
  'streetlight': { 
    icon: MdLightbulb, 
    color: '#FFEB3B', 
    bgColor: '#FFFDE7',
    label: 'Street Lighting',
    priority: 'low',
    actionColor: '#F57F17'
  },
  'pothole': { 
    icon: MdWarning, 
    color: '#E91E63', 
    bgColor: '#FCE4EC',
    label: 'Road Damage',
    priority: 'high',
    actionColor: '#C2185B'
  },
  'safety': { 
    icon: MdSecurity, 
    color: '#9C27B0', 
    bgColor: '#F3E5F5',
    label: 'Safety Concerns',
    priority: 'critical',
    actionColor: '#7B1FA2'
  },
  'flooding': { 
    icon: MdWater, 
    color: '#00BCD4', 
    bgColor: '#E0F7FA',
    label: 'Flooding',
    priority: 'critical',
    actionColor: '#0097A7'
  },
  'other': { 
    icon: MdInfo, 
    color: '#607D8B', 
    bgColor: '#ECEFF1',
    label: 'Other Issues',
    priority: 'low',
    actionColor: '#455A64'
  }
};

interface AdvancedHeatmapDashboardProps {
  className?: string;
}

export const AdvancedHeatmapDashboard: React.FC<AdvancedHeatmapDashboardProps> = ({
  className = ''
}) => {
  // Get map instance from context
  const { mapInstance } = useMap();

  // Advanced map and region state with advanced settings
  const [bounds, setBounds] = useState<RegionBounds>({
    southwest: [77.0, 12.8],  // Bangalore bounds (more focused)
    northeast: [77.8, 13.2]   // Better for mobile performance
  });

  // Mobile detection state
  const [isMobile] = useState(false);

  // Advanced UI state management
  const [selectedPoint, setSelectedPoint] = useState<HeatmapDataPoint | null>(null);
  const [selectedCluster, setSelectedCluster] = useState<HeatmapCluster | null>(null);
  const [selectedLayer, setSelectedLayer] = useState<'heatmap' | 'clusters' | 'points' | 'all'>('all');
  const [layerVisibility, setLayerVisibility] = useState({
    heatmap: true,
    clusters: true,
    points: true,
    boundaries: false,
    predictions: false,
    anomalies: true,
    realtime: true,
    heatmapIntensity: true,
    historicalData: false
  });
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [analyticsPanelOpen, setAnalyticsPanelOpen] = useState<boolean>(false);

  // Debug analytics panel state
  useEffect(() => {
    console.log('Analytics panel state changed:', analyticsPanelOpen);
  }, [analyticsPanelOpen]);

  // Use the advanced heatmap data hook with real-time capabilities
  const { state: heatmapState, isLoading, error, refetch } = useHeatmapData({
    bounds,
    config: {
      analytics: {
        enableClustering: true,
        enableAnomalyDetection: true,
        enableTrends: true,
        enablePredictions: true,
        historicalDepth: 30,
        refreshInterval: 300000
      },
      realtime: {
        enabled: true,
        updateInterval: 5000,
        autoRefresh: true,
        pushNotifications: true,
        anomalyAlerts: true,
        predictionUpdates: true
      }
    },
    enableRealtime: true
  });

  // WebSocket integration for real-time updates
  const { status: wsStatus, isConnected: isWsConnected } = useHeatmapWebSocket({
    onUpdate: (data) => {
      console.log('Real-time update received:', data);
      // Trigger a refetch of data to get latest updates
      refetch();
    },
    onError: (error) => {
      console.error('WebSocket error:', error);
    }
  });

  // Handle viewport bounds change with debouncing
  const handleBoundsChange = useCallback((newBounds: RegionBounds) => {
    setBounds(newBounds);
  }, []);

  // Advanced category-based icon rendering
  const getCategoryIcon = useCallback((category: string) => {
    const config = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.other;
    const IconComponent = config.icon;
    return <IconComponent className="w-5 h-5" style={{ color: config.color }} />;
  }, []);

  // Calculate risk zone colors based on data
  const calculateRiskZone = useMemo(() => {
    if (!heatmapState?.data?.dataPoints) return 'green';
    
    const totalIssues = heatmapState.data.dataPoints.length;
    const criticalIssues = heatmapState.data.dataPoints.filter(
      point => point.metadata?.urgency === 'critical' || point.metadata?.urgency === 'emergency'
    ).length;
    
    const riskRatio = criticalIssues / totalIssues;
    
    if (riskRatio > 0.3) return 'red';
    if (riskRatio > 0.15) return 'orange';
    if (riskRatio > 0.05) return 'yellow';
    return 'green';
  }, [heatmapState?.data]);

  // Handle point selection with detailed information
  const handlePointClick = useCallback((point: HeatmapDataPoint) => {
    setSelectedPoint(point);
    setSidebarOpen(true);
  }, []);

  // Handle cluster selection
  const handleClusterClick = useCallback((cluster: HeatmapCluster) => {
    setSelectedCluster(cluster);
    setSidebarOpen(true);
  }, []);

  // Handle layer toggle
  const handleToggleLayer = useCallback((layerId: string) => {
    setLayerVisibility(prev => ({ ...prev, [layerId]: !prev[layerId as keyof typeof prev] }));
  }, []);

  // Handle analytics panel toggle
  const handleAnalyticsToggle = useCallback(() => {
    setAnalyticsPanelOpen(prev => !prev);
  }, []);

  // Handle analytics panel close
  const handleAnalyticsClose = useCallback(() => {
    setAnalyticsPanelOpen(false);
  }, []);

  // Calculate analytics for mobile interface
  const analytics = useMemo(() => ({
    totalIssues: heatmapState?.data?.dataPoints?.length || 0,
    criticalIssues: heatmapState?.data?.dataPoints?.filter(p => 
      p.metadata?.urgency === 'critical' || p.metadata?.urgency === 'emergency'
    ).length || 0,
    trendDirection: 'stable' as const, // This would come from real analytics
    riskLevel: calculateRiskZone as 'low' | 'medium' | 'high' | 'critical'
  }), [heatmapState?.data, calculateRiskZone]);

  // Render the advanced dashboard with comprehensive UI
  return (
    // <HeatmapErrorBoundary>
    <>
      {/* Mobile Interface for smaller screens */}
      {isMobile ? (
        <MobileHeatmapInterface
          bounds={bounds}
          data={heatmapState?.data || {}}
          analytics={analytics}
          selectedPoint={selectedPoint}
          selectedCluster={selectedCluster}
          selectedAnomaly={null}
          layerVisibility={layerVisibility}
          onToggleLayer={handleToggleLayer}
          isLoading={isLoading}
          onRefresh={refetch}
          onBoundsChange={handleBoundsChange}
          onPointClick={handlePointClick}
          onClusterClick={handleClusterClick}
          className={className}
        />
      ) : (
        /* Desktop Interface for larger screens */
        <div className={`advanced-heatmap-dashboard w-full h-full ${className} relative overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100`}>
            
            {/* ===== MAIN MAP CONTAINER ===== */}
            <div className="absolute inset-0 w-full h-full">
              <HeatmapVisualization
                initialBounds={bounds}
                enableRealtime={true}
                enableControls={false} // We'll use our own controls
                enableSidebar={false}  // We'll use our own sidebar
                enableTooltips={true}
                enableAnalytics={true}
                onBoundsChange={handleBoundsChange}
                onPointClick={handlePointClick}
                onClusterClick={handleClusterClick}
                className="w-full h-full"
                style={{ width: '100%', height: '90%' }}
              />
            </div>

            {/* ===== ADVANCED HEATMAP CONTROLS ===== */}
            <HeatmapControls
              visualization={{
                mapStyle: 'streets' as const,
                center: [77.5946, 12.9716] as [number, number],
                zoom: 10,
                pitch: 0,
                bearing: 0,
                interactive: true,
                colorScheme: 'viridis',
                opacity: 0.7,
                radius: 20,
                blur: 15,
                maxZoom: 18,
                minZoom: 1,
                clusterRadius: 50,
                animationDuration: 300,
                controls: {
                  navigation: true,
                  fullscreen: true,
                  scale: true,
                  geolocate: true
                },
                layers: {
                  heatmap: { visible: layerVisibility.heatmap, opacity: 0.7, radius: 20, blur: 15, weight: 'intensity', colorStops: [[0, 'rgba(0,255,0,0)'], [0.5, 'rgba(255,255,0,0.5)'], [1, 'rgba(255,0,0,1)']] },
                  clusters: { visible: layerVisibility.clusters, opacity: 0.8, radius: 30, strokeWidth: 2, strokeColor: '#333' },
                  points: { visible: layerVisibility.points, opacity: 1, radius: 8, strokeWidth: 1 },
                  boundaries: { visible: layerVisibility.boundaries, opacity: 0.3, strokeWidth: 2, strokeColor: '#666', fillOpacity: 0.1 }
                }
              }}
              selectedLayer={selectedLayer}
              layerVisibility={{
                ...layerVisibility,
                realtime: isWsConnected,
                heatmapIntensity: true,
                historicalData: false
              }}
              isLoading={false}
              isConnected={isWsConnected}
              wsStatus={wsStatus}
              performanceMetrics={{
                renderTime: 0,
                dataProcessingTime: 0,
                networkLatency: 0,
                memoryUsage: 0,
                frameRate: 60,
                fpsAverage: 60,
                dataPointCount: heatmapState?.data?.dataPoints?.length || 0,
                cacheHitRate: 0.95,
                updateFrequency: 1,
                errorRate: 0.01
              }}
              filters={{
                timeRange: { start: null, end: null },
                categories: Object.keys(CATEGORY_CONFIG),
                intensityRange: [0, 1],
                priorityLevels: ['low', 'medium', 'high', 'critical']
              }}
              enableAdvancedFeatures={true}
              onLayerChange={(layer) => setSelectedLayer(layer)}
              onLayerToggle={(layer, visible) => {
                setLayerVisibility(prev => ({ ...prev, [layer]: visible }));
              }}
              onConfigChange={(config) => console.log('Config changed:', config)}
              onVisualizationChange={(config) => console.log('Visualization changed:', config)}
              onRefresh={refetch}
              onExport={(format) => console.log('Export format:', format)}
              onFilterChange={(filters) => console.log('Filters changed:', filters)}
              onSidebarToggle={() => setSidebarOpen(!sidebarOpen)}
              analyticsPanelOpen={analyticsPanelOpen}
              onAnalyticsToggle={handleAnalyticsToggle}
              onAnalyticsClose={handleAnalyticsClose}
              className="absolute top-4 right-4 z-40"
            />

            {/* ===== DESKTOP SEARCH BAR ===== */}
            {/* <motion.div 
              className="absolute top-4 left-4 z-50"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="bg-white/90 backdrop-blur-md rounded-xl shadow-xl border border-white/20 p-2">
                <SearchAndNavigate 
                  map={mapInstance}
                  placeholder="Search locations, civic issues..." 
                  className="w-80"
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
              </div>
            </motion.div> */}

            {/* ===== HEATMAP LEGEND ===== */}
            {/* <HeatmapLegend
              config={{
                mapStyle: 'streets' as const,
                center: [77.5946, 12.9716] as [number, number],
                zoom: 10,
                pitch: 0,
                bearing: 0,
                interactive: true,
                colorScheme: 'viridis',
                opacity: 0.7,
                radius: 20,
                blur: 15,
                maxZoom: 18,
                minZoom: 1,
                clusterRadius: 50,
                animationDuration: 300,
                controls: {
                  navigation: true,
                  fullscreen: true,
                  scale: true,
                  geolocate: true
                },
                layers: {
                  heatmap: { visible: layerVisibility.heatmap, opacity: 0.7, radius: 20, blur: 15, weight: 'intensity', colorStops: [[0, 'rgba(0,255,0,0)'], [0.5, 'rgba(255,255,0,0.5)'], [1, 'rgba(255,0,0,1)']] },
                  clusters: { visible: layerVisibility.clusters, opacity: 0.8, radius: 30, strokeWidth: 2, strokeColor: '#333' },
                  points: { visible: layerVisibility.points, opacity: 1, radius: 8, strokeWidth: 1 },
                  boundaries: { visible: layerVisibility.boundaries, opacity: 0.3, strokeWidth: 2, strokeColor: '#666', fillOpacity: 0.1 }
                }
              }}
              data={heatmapState?.data || { dataPoints: [], clusters: [], anomalies: [] }}
              selectedLayer={selectedLayer}
              layerVisibility={layerVisibility}
              categoryIcons={Object.fromEntries(
                Object.entries(CATEGORY_CONFIG).map(([key, value]) => [
                  key, { icon: value.icon, color: value.color, label: value.label }
                ])
              )}
              onLayerToggle={(layer: string, visible: boolean) => {
                setLayerVisibility(prev => ({ ...prev, [layer]: visible }));
              }}
              className="absolute bottom-4 left-4 z-40"
            /> */}

            {/* ===== ADVANCED SIDEBAR ===== */}
            <HeatmapSidebar
              isOpen={sidebarOpen}
              data={heatmapState?.data}
              selectedPoint={selectedPoint}
              selectedCluster={selectedCluster}
              selectedAnomaly={null}
              performanceMetrics={{
                renderTime: 0,
                dataProcessingTime: 0,
                networkLatency: 0,
                memoryUsage: 0,
                frameRate: 60,
                fpsAverage: 60,
                dataPointCount: heatmapState?.data?.dataPoints?.length || 0,
                cacheHitRate: 0.95,
                updateFrequency: 1,
                errorRate: 0.01
              }}
              enableAdvancedFeatures={true}
              onAction={(action, pointId) => console.log('Action:', action, pointId)}
              onClose={() => {
                setSidebarOpen(false);
                setSelectedPoint(null);
                setSelectedCluster(null);
              }}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 z-40"
            />

            {/* ===== HEATMAP TOOLTIP (for hover interactions) ===== */}
            {(selectedPoint || selectedCluster) && (
              <HeatmapTooltip
                data={selectedPoint || selectedCluster!}
                type={selectedPoint ? 'point' : selectedCluster ? 'cluster' : null}
                position={
                  selectedPoint
                    ? [selectedPoint.location.coordinates[0], selectedPoint.location.coordinates[1]]
                    : selectedCluster
                    ? [selectedCluster.center[0], selectedCluster.center[1]]
                    : [0, 0]
                }
                categoryIcons={CATEGORY_CONFIG}
                visible={!!(selectedPoint || selectedCluster)}
                onClose={() => {
                  setSelectedPoint(null);
                  setSelectedCluster(null);
                }}
              />
            )}

            {/* ===== LOADING OVERLAY ===== */}
            <AnimatePresence>
              {isLoading && (
                <motion.div
                  className="absolute inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <div className="bg-white rounded-xl p-6 shadow-2xl">
                    <div className="flex items-center space-x-3">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      <span className="text-lg font-medium text-gray-900">Loading heatmap data...</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ===== ERROR NOTIFICATION ===== */}
            <AnimatePresence>
              {error && (
                <motion.div
                  className="absolute top-20 left-4 right-4 z-50 bg-red-100 border border-red-300 rounded-lg p-4"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <div className="flex items-center space-x-2">
                    <MdWarning className="w-5 h-5 text-red-600" />
                    <span className="text-red-800 font-medium">Error loading heatmap data</span>
                  </div>
                  <p className="text-red-700 text-sm mt-1">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

          </div>
        )}

        {/* ===== ANALYTICS DASHBOARD PANEL ===== */}
        <AnimatePresence>
          {analyticsPanelOpen && (
            <motion.div
              className="absolute top-0 left-0 h-full w-96 bg-white/95 backdrop-blur-md shadow-2xl border-r border-white/30 z-50 overflow-y-auto"
              initial={{ x: -400, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -400, opacity: 0 }}
              transition={{
                type: "spring",
                damping: 30,
                stiffness: 300,
                opacity: { duration: 0.2 }
              }}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <MdAnalytics className="w-6 h-6 text-purple-600" />
                    <h2 className="text-xl font-bold text-gray-900">Analytics Dashboard</h2>
                  </div>
                  <motion.button
                    onClick={handleAnalyticsClose}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <MdClose className="w-5 h-5 text-gray-600" />
                  </motion.button>
                </div>

                {/* Analytics Content */}
                <div className="space-y-6">
                  {/* Key Metrics */}
                  <div className="grid grid-cols-2 gap-4">
                    <motion.div
                      className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                    >
                      <div className="text-sm text-blue-600 font-medium">Total Issues</div>
                      <div className="text-2xl font-bold text-blue-900">
                        {heatmapState?.data?.dataPoints?.length || 0}
                      </div>
                    </motion.div>

                    <motion.div
                      className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-xl border border-red-200"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <div className="text-sm text-red-600 font-medium">Critical Issues</div>
                      <div className="text-2xl font-bold text-red-900">
                        {heatmapState?.data?.dataPoints?.filter(p =>
                          p.metadata?.urgency === 'critical' || p.metadata?.urgency === 'emergency'
                        ).length || 0}
                      </div>
                    </motion.div>
                  </div>

                  {/* Performance Metrics */}
                  <motion.div
                    className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <div className="text-sm text-green-600 font-medium mb-2">Performance Status</div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-green-800 font-medium">Real-time Active</span>
                    </div>
                  </motion.div>

                  {/* Category Breakdown */}
                  <motion.div
                    className="bg-white p-4 rounded-xl border border-gray-200"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <div className="text-sm text-gray-600 font-medium mb-3">Issue Categories</div>
                    <div className="space-y-2">
                      {Object.entries(CATEGORY_CONFIG).slice(0, 5).map(([category, config], index) => {
                        const count = heatmapState?.data?.dataPoints?.filter(p =>
                          p.metadata?.category === category
                        ).length || 0;

                        return (
                          <motion.div
                            key={category}
                            className="flex items-center justify-between py-2"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.5 + index * 0.1 }}
                          >
                            <div className="flex items-center space-x-2">
                              {React.createElement(config.icon, { className: "w-4 h-4", style: { color: config.color } })}
                              <span className="text-sm text-gray-700 capitalize">{config.label}</span>
                            </div>
                            <span className="text-sm font-semibold text-gray-900">{count}</span>
                          </motion.div>
                        );
                      })}
                    </div>
                  </motion.div>

                  {/* Action Buttons */}
                  <motion.div
                    className="space-y-3"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                  >
                    <motion.button
                      onClick={refetch}
                      className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-600 transition-colors"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Refresh Data
                    </motion.button>

                    <motion.button
                      onClick={() => console.log('Export analytics')}
                      className="w-full bg-gray-500 text-white py-2 px-4 rounded-lg font-medium hover:bg-gray-600 transition-colors"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Export Report
                    </motion.button>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ===== ADVANCED SIDEBAR ===== */}
        <AnimatePresence>
          {sidebarOpen && (selectedPoint || selectedCluster) && (
            <motion.div
              className="absolute right-4 top-1/2 transform -translate-y-1/2 z-40 bg-white/95 backdrop-blur-md rounded-xl shadow-2xl border border-white/30 p-6 max-w-md w-full max-h-96 overflow-y-auto"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">
                  {selectedPoint ? 'Issue Details' : 'Cluster Information'}
                </h3>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <MdClose className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              {selectedPoint && (
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    {getCategoryIcon(selectedPoint.metadata?.category || 'other')}
                    <div>
                      <div className="font-semibold text-gray-900 capitalize">
                        {selectedPoint.metadata?.category || 'Unknown'}
                      </div>
                      <div className="text-sm text-gray-600">
                        Priority: {selectedPoint.metadata?.urgency || 'N/A'}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <div className="text-xs text-blue-600 font-medium">Intensity</div>
                      <div className="text-lg font-bold text-blue-900">
                        {(selectedPoint.value * 100).toFixed(1)}%
                      </div>
                    </div>
                    <div className="bg-red-50 p-3 rounded-lg">
                      <div className="text-xs text-red-600 font-medium">Risk Score</div>
                      <div className="text-lg font-bold text-red-900">
                        {(selectedPoint.riskScore * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Reports:</span>
                      <span className="text-sm font-medium">{selectedPoint.metadata?.reportCount || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Status:</span>
                      <span className="text-sm font-medium capitalize">{selectedPoint.metadata?.status || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Location:</span>
                      <span className="text-sm font-medium">
                        {selectedPoint.location.coordinates[1].toFixed(4)}, {selectedPoint.location.coordinates[0].toFixed(4)}
                      </span>
                    </div>
                  </div>

                  {selectedPoint.metadata?.tags && selectedPoint.metadata.tags.length > 0 && (
                    <div>
                      <div className="text-sm text-gray-600 mb-2">Tags:</div>
                      <div className="flex flex-wrap gap-1">
                        {selectedPoint.metadata.tags.map(tag => (
                          <span key={tag} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {selectedCluster && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-purple-50 p-3 rounded-lg">
                      <div className="text-xs text-purple-600 font-medium">Issues</div>
                      <div className="text-lg font-bold text-purple-900">{selectedCluster.points?.length || 0}</div>
                    </div>
                    <div className="bg-orange-50 p-3 rounded-lg">
                      <div className="text-xs text-orange-600 font-medium">Density</div>
                      <div className="text-lg font-bold text-orange-900">
                        {(selectedCluster.density * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ===== LOADING OVERLAY ===== */}
        <AnimatePresence>
          {isLoading && (
            <motion.div
              className="absolute inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="bg-white rounded-xl p-6 shadow-2xl">
                <div className="flex items-center space-x-3">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  <span className="text-lg font-medium text-gray-900">Loading heatmap data...</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ===== ERROR NOTIFICATION ===== */}
        <AnimatePresence>
          {error && (
            <motion.div
              className="absolute top-20 left-4 right-4 z-50 bg-red-100 border border-red-300 rounded-lg p-4"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="flex items-center space-x-2">
                <MdWarning className="w-5 h-5 text-red-600" />
                <span className="text-red-800 font-medium">Error loading heatmap data</span>
              </div>
              <p className="text-red-700 text-sm mt-1">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

    </>
    // </HeatmapErrorBoundary>
  );
};

export default AdvancedHeatmapDashboard;