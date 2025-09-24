import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapProvider } from '../../contexts/EnhancedMapContext';
import { RegionBounds, HeatmapDataPoint, HeatmapCluster } from '../../types/heatmap';
import { HeatmapVisualization } from './HeatmapVisualization';
import { HeatmapControls } from './HeatmapControls';
import { HeatmapSidebar } from './HeatmapSidebar';
import { HeatmapLegend } from './HeatmapLegend';
import { HeatmapTooltip } from './HeatmapTooltip';
import { HeatmapErrorBoundary } from './HeatmapErrorBoundary';
import { MobileHeatmapInterface } from './MobileHeatmapInterface';
import { useHeatmapData } from '../../hooks/useHeatmapData';
import { useHeatmapWebSocket } from '../../hooks/useHeatmapWebSocket';
import SearchAndNavigate from '../common/SearchAndNavigate';

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
  MdLocationOn,
  MdLayers,
  MdTrendingUp,
  MdAnalytics,
  MdRefresh,
  MdFilterList,
  MdVisibility,
  MdVisibilityOff,
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
  // Advanced map and region state with advanced settings
  const [bounds, setBounds] = useState<RegionBounds>({
    southwest: [77.0, 12.8],  // Bangalore bounds (more focused)
    northeast: [77.8, 13.2]   // Better for mobile performance
  });

  // Mobile detection state
  const [isMobile, setIsMobile] = useState(false);

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

  // Mobile detection effect
  useEffect(() => {
    const checkMobile = () => {
      const width = window.innerWidth;
      const isMobileDevice = width < 768; // md breakpoint in Tailwind
      setIsMobile(isMobileDevice);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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

  // Zone color configuration
  const zoneColors = {
    red: { bg: 'bg-red-50', text: 'text-red-900', border: 'border-red-200', accent: 'bg-red-500' },
    orange: { bg: 'bg-orange-50', text: 'text-orange-900', border: 'border-orange-200', accent: 'bg-orange-500' },
    yellow: { bg: 'bg-yellow-50', text: 'text-yellow-900', border: 'border-yellow-200', accent: 'bg-yellow-500' },
    green: { bg: 'bg-green-50', text: 'text-green-900', border: 'border-green-200', accent: 'bg-green-500' }
  };

  // Category statistics
  const categoryStats = useMemo(() => {
    if (!heatmapState?.data?.dataPoints) return {};
    
    const stats: Record<string, number> = {};
    heatmapState.data.dataPoints.forEach(point => {
      const category = point.metadata?.category || 'other';
      stats[category] = (stats[category] || 0) + 1;
    });
    
    return stats;
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
      <MapProvider>
        {/* Mobile Interface for smaller screens */}
        {isMobile ? (
          <MobileHeatmapInterface
            bounds={bounds}
            data={heatmapState?.data || {}}
            analytics={analytics}
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
                style={{ width: '100%', height: '100%' }}
              />
            </div>

            {/* ===== ADVANCED HEATMAP CONTROLS ===== */}
            <HeatmapControls
              visualization={{
                colorScheme: 'viridis',
                opacity: 0.7,
                radius: 20,
                blur: 15,
                maxZoom: 18,
                minZoom: 1,
                clusterRadius: 50,
                showLabels: true,
                showTooltips: true,
                animationDuration: 300,
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
              className="absolute top-4 right-4 z-40"
            />

            {/* ===== DESKTOP SEARCH BAR ===== */}
            <motion.div 
              className="absolute top-4 left-4 z-50"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="bg-white/90 backdrop-blur-md rounded-xl shadow-xl border border-white/20 p-2">
                <SearchAndNavigate 
                  map={null} // Will be connected when map is ready
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
            </motion.div>

            {/* ===== HEATMAP LEGEND ===== */}
            <HeatmapLegend
              config={{
                colorScheme: 'viridis',
                opacity: 0.7,
                radius: 20,
                blur: 15,
                maxZoom: 18,
                minZoom: 1,
                clusterRadius: 50,
                showLabels: true,
                showTooltips: true,
                animationDuration: 300,
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
            />

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

        {/* ===== ADVANCED STATS DASHBOARD ===== */}
        <motion.div 
          className="absolute top-4 right-4 z-50"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className={`${zoneColors[calculateRiskZone].bg} ${zoneColors[calculateRiskZone].border} backdrop-blur-md rounded-xl shadow-xl border p-4 min-w-80`}>
            
            {/* Header with live indicator */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <motion.div 
                  className={`w-3 h-3 ${zoneColors[calculateRiskZone].accent} rounded-full`}
                  animate={{ 
                    scale: [1, 1.2, 1],
                    opacity: [1, 0.7, 1]
                  }}
                  transition={{ 
                    duration: 2, 
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
                <span className={`text-sm font-semibold ${zoneColors[calculateRiskZone].text}`}>
                  Live Dashboard
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`text-xs ${zoneColors[calculateRiskZone].text} opacity-70`}>
                  {calculateRiskZone.charAt(0).toUpperCase() + calculateRiskZone.slice(1)} Zone
                </span>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => refetch()}
                  className={`p-1 rounded-lg hover:bg-white/20 ${zoneColors[calculateRiskZone].text}`}
                >
                  <MdRefresh className="w-4 h-4" />
                </motion.button>
              </div>
            </div>
            
            {/* Real-time Connection Status */}
            <div className="flex items-center justify-between mb-3 p-2 bg-white/30 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${
                  wsStatus === 'connected' ? 'bg-green-400' :
                  wsStatus === 'connecting' || wsStatus === 'reconnecting' ? 'bg-yellow-400' :
                  'bg-red-400'
                }`} />
                <span className="text-xs font-medium text-gray-700">
                  {wsStatus === 'connected' ? 'Connected' :
                   wsStatus === 'connecting' ? 'Connecting' :
                   wsStatus === 'reconnecting' ? 'Reconnecting' :
                   'Disconnected'}
                </span>
              </div>
              {isWsConnected && (
                <span className="text-xs text-gray-500">
                  Real-time updates active
                </span>
              )}
            </div>

            {/* Core Metrics Grid */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              
              {/* Total Issues */}
              <motion.div 
                className="bg-white/40 p-3 rounded-lg"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex items-center space-x-2 mb-1">
                  <MdLocationOn className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-medium text-gray-700">Total Issues</span>
                </div>
                <div className="text-xl font-bold text-blue-900">
                  {heatmapState?.data?.dataPoints?.length || 0}
                </div>
                <div className="text-xs text-gray-600">Active reports</div>
              </motion.div>

              {/* Active Clusters */}
              <motion.div 
                className="bg-white/40 p-3 rounded-lg"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex items-center space-x-2 mb-1">
                  <MdAnalytics className="w-4 h-4 text-orange-600" />
                  <span className="text-xs font-medium text-gray-700">Clusters</span>
                </div>
                <div className="text-xl font-bold text-orange-900">
                  {heatmapState?.data?.clusters?.length || 0}
                </div>
                <div className="text-xs text-gray-600">Hot spots</div>
              </motion.div>

              {/* Critical Issues */}
              <motion.div 
                className="bg-white/40 p-3 rounded-lg"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex items-center space-x-2 mb-1">
                  <MdWarning className="w-4 h-4 text-red-600" />
                  <span className="text-xs font-medium text-gray-700">Critical</span>
                </div>
                <div className="text-xl font-bold text-red-900">
                  {heatmapState?.data?.dataPoints?.filter(p => 
                    p.metadata?.urgency === 'critical' || p.metadata?.urgency === 'emergency'
                  ).length || 0}
                </div>
                <div className="text-xs text-gray-600">Urgent issues</div>
              </motion.div>

              {/* Anomalies */}
              <motion.div 
                className="bg-white/40 p-3 rounded-lg"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex items-center space-x-2 mb-1">
                  <MdTrendingUp className="w-4 h-4 text-purple-600" />
                  <span className="text-xs font-medium text-gray-700">Anomalies</span>
                </div>
                <div className="text-xl font-bold text-purple-900">
                  {heatmapState?.data?.anomalies?.length || 0}
                </div>
                <div className="text-xs text-gray-600">Unusual patterns</div>
              </motion.div>
            </div>

            {/* Category Breakdown */}
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
                <MdFilterList className="w-4 h-4 mr-2" />
                Issue Categories
              </h4>
              <div className="space-y-2">
                {Object.entries(categoryStats).map(([category, count]) => {
                  const config = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.other;
                  const IconComponent = config.icon;
                  
                  return (
                    <motion.div 
                      key={category}
                      className="flex items-center justify-between p-2 bg-white/30 rounded-lg hover:bg-white/40 cursor-pointer"
                      whileHover={{ scale: 1.02 }}
                      onClick={() => console.log('Selected category:', category)}
                    >
                      <div className="flex items-center space-x-2">
                        <div className={`p-1 rounded ${config.bgColor}`}>
                          <IconComponent className="w-3 h-3" style={{ color: config.color }} />
                        </div>
                        <span className="text-xs font-medium text-gray-700 capitalize">
                          {config.label}
                        </span>
                      </div>
                      <span className="text-sm font-bold text-gray-900">{count as number}</span>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Layer Controls */}
            <div className="border-t border-white/20 pt-3">
              <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
                <MdLayers className="w-4 h-4 mr-2" />
                Map Layers
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(layerVisibility).map(([layer, visible]) => (
                  <motion.button
                    key={layer}
                    onClick={() => setLayerVisibility(prev => ({ ...prev, [layer]: !visible }))}
                    className={`flex items-center space-x-2 p-2 rounded-lg text-xs font-medium transition-colors ${
                      visible 
                        ? 'bg-blue-100 text-blue-800 border border-blue-200' 
                        : 'bg-white/30 text-gray-700 hover:bg-white/40'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {visible ? <MdVisibility className="w-3 h-3" /> : <MdVisibilityOff className="w-3 h-3" />}
                    <span className="capitalize">{layer}</span>
                  </motion.button>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

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

    </MapProvider>
    // </HeatmapErrorBoundary>
  );
};

export default AdvancedHeatmapDashboard;