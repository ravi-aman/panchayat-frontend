// ===== MOBILE HEATMAP INTERFACE =====
// Optimized mobile experience for heatmap dashboard

import React, { useState, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { 
  FiMenu,
  FiX,
  FiLayers,
  FiMapPin,
  FiTrendingUp,
  FiAlertTriangle,
  FiRefreshCw,
  FiMaximize2,
  FiShare2,
  FiDownload,
  FiFilter,
  FiSearch,
  FiChevronUp,
  FiChevronDown
} from 'react-icons/fi';
import { 
  IoStatsChart,
  IoLocationSharp,
  IoTime,
  IoWarning,
  IoLayersSharp
} from 'react-icons/io5';

import MapLibreMap from './MapLibreMap';
import { HeatmapControls } from './HeatmapControls';
import { HeatmapLegend } from './HeatmapLegend';
import { RegionBounds, HeatmapDataPoint, HeatmapCluster, HeatmapAnomaly } from '../../types/heatmap';

// Category icons for mobile display
import {
  MdElectricBolt,
  MdWater,
  MdTraffic,
  MdConstruction,
  MdWarning,
  MdDelete,
  MdLightbulb,
  MdSecurity,
  MdInfo
} from 'react-icons/md';

const CATEGORY_CONFIG = {
  'electricity': { 
    icon: MdElectricBolt, 
    color: '#FFC107', 
    bgColor: '#FFF3C4',
    label: 'Electrical Issues',
    priority: 'high'
  },
  'water': { 
    icon: MdWater, 
    color: '#2196F3', 
    bgColor: '#E3F2FD',
    label: 'Water Issues',
    priority: 'high'
  },
  'traffic': { 
    icon: MdTraffic, 
    color: '#FF5722', 
    bgColor: '#FFEBEE',
    label: 'Traffic Issues',
    priority: 'medium'
  },
  'construction': { 
    icon: MdConstruction, 
    color: '#FF9800', 
    bgColor: '#FFF3E0',
    label: 'Construction',
    priority: 'medium'
  },
  'waste': { 
    icon: MdDelete, 
    color: '#4CAF50', 
    bgColor: '#E8F5E8',
    label: 'Waste Management',
    priority: 'medium'
  },
  'streetlight': { 
    icon: MdLightbulb, 
    color: '#FFEB3B', 
    bgColor: '#FFFDE7',
    label: 'Street Lighting',
    priority: 'low'
  },
  'pothole': { 
    icon: MdWarning, 
    color: '#E91E63', 
    bgColor: '#FCE4EC',
    label: 'Road Damage',
    priority: 'high'
  },
  'safety': { 
    icon: MdSecurity, 
    color: '#9C27B0', 
    bgColor: '#F3E5F5',
    label: 'Safety Concerns',
    priority: 'critical'
  },
  'flooding': { 
    icon: MdWater, 
    color: '#00BCD4', 
    bgColor: '#E0F7FA',
    label: 'Flooding',
    priority: 'critical'
  },
  'other': { 
    icon: MdInfo, 
    color: '#607D8B', 
    bgColor: '#ECEFF1',
    label: 'Other Issues',
    priority: 'low'
  }
};

interface MobileHeatmapInterfaceProps {
  bounds: RegionBounds;
  data: {
    dataPoints?: HeatmapDataPoint[];
    clusters?: HeatmapCluster[];
    anomalies?: HeatmapAnomaly[];
    hexagons?: any[];
  };
  analytics?: {
    totalIssues: number;
    criticalIssues: number;
    trendDirection: 'up' | 'down' | 'stable';
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
  };
  selectedPoint?: HeatmapDataPoint | null;
  selectedCluster?: HeatmapCluster | null;
  selectedAnomaly?: HeatmapAnomaly | null;
  layerVisibility?: {
    heatmap: boolean;
    clusters: boolean;
    points: boolean;
    boundaries: boolean;
  };
  onToggleLayer?: (layerId: string) => void;
  isLoading?: boolean;
  onRefresh?: () => void;
  onBoundsChange?: (bounds: RegionBounds) => void;
  onPointClick?: (point: HeatmapDataPoint) => void;
  onClusterClick?: (cluster: HeatmapCluster) => void;
  className?: string;
}

export const MobileHeatmapInterface: React.FC<MobileHeatmapInterfaceProps> = ({
  bounds,
  data,
  analytics,
  selectedPoint,
  selectedCluster,
  selectedAnomaly,
  layerVisibility = {
    heatmap: true,
    clusters: true,
    points: true,
    boundaries: true
  },
  onToggleLayer,
  isLoading = false,
  onRefresh,
  onBoundsChange,
  onPointClick,
  onClusterClick,
  className = ''
}) => {
  // Mobile-specific state
  const [bottomSheetOpen, setBottomSheetOpen] = useState(false);
  const [bottomSheetHeight, setBottomSheetHeight] = useState(120); // Initial collapsed height
  const [activeTab, setActiveTab] = useState<'stats' | 'layers' | 'details'>('stats');
  const [searchFocused, setSearchFocused] = useState(false);
  
  // Touch handling refs
  const bottomSheetRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const currentHeight = useRef(bottomSheetHeight);

  // Mobile viewport calculations
  const maxHeight = useMemo(() => {
    if (typeof window !== 'undefined') {
      return window.innerHeight * 0.8; // 80% of screen height
    }
    return 600;
  }, []);

  const minHeight = 120; // Collapsed state

  // Calculate category statistics for mobile display
  const categoryStats = useMemo(() => {
    if (!data.dataPoints) return {};
    
    const stats: Record<string, number> = {};
    data.dataPoints.forEach(point => {
      const category = point.metadata?.category || 'other';
      stats[category] = (stats[category] || 0) + 1;
    });
    
    return stats;
  }, [data.dataPoints]);

  // Get top categories for quick display
  const topCategories = useMemo(() => {
    return Object.entries(categoryStats)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([category, count]) => ({
        category,
        count,
        config: (CATEGORY_CONFIG as Record<string, typeof CATEGORY_CONFIG['other']>)[category] || CATEGORY_CONFIG.other
      }));
  }, [categoryStats]);

  // Handle bottom sheet drag
  const handleDragEnd = useCallback((event: MouseEvent | TouchEvent, info: PanInfo) => {
    const { offset, velocity } = info;
    
    let newHeight = currentHeight.current - offset.y;
    
    // Add velocity for momentum
    if (velocity.y < -100) {
      newHeight = maxHeight;
    } else if (velocity.y > 100) {
      newHeight = minHeight;
    }
    
    // Constrain to bounds
    newHeight = Math.max(minHeight, Math.min(maxHeight, newHeight));
    
    setBottomSheetHeight(newHeight);
    currentHeight.current = newHeight;
    
    // Update open state based on height
    setBottomSheetOpen(newHeight > minHeight + 50);
  }, [maxHeight, minHeight]);

  // Quick action handlers
  const handleQuickRefresh = useCallback(() => {
    onRefresh?.();
  }, [onRefresh]);

  const handleShareLocation = useCallback(() => {
    if (navigator.share && selectedPoint) {
      navigator.share({
        title: 'Civic Issue Location',
        text: `Issue: ${selectedPoint.metadata?.category || 'Unknown'} at ${selectedPoint.location.coordinates[1].toFixed(4)}, ${selectedPoint.location.coordinates[0].toFixed(4)}`,
        url: window.location.href
      });
    }
  }, [selectedPoint]);

  // Render quick stats bar
  const renderQuickStats = () => (
    <div className="flex items-center justify-between px-4 py-3 bg-white/95 backdrop-blur-sm border-b border-gray-200">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-1">
          <IoLocationSharp className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-semibold text-gray-900">
            {data.dataPoints?.length || 0}
          </span>
          <span className="text-xs text-gray-600">Issues</span>
        </div>
        
        <div className="flex items-center space-x-1">
          <IoWarning className={`w-4 h-4 ${
            analytics?.riskLevel === 'critical' ? 'text-red-600' :
            analytics?.riskLevel === 'high' ? 'text-orange-600' :
            analytics?.riskLevel === 'medium' ? 'text-yellow-600' :
            'text-green-600'
          }`} />
          <span className="text-xs text-gray-600 capitalize">
            {analytics?.riskLevel || 'Low'} Risk
          </span>
        </div>
        
        <div className="flex items-center space-x-1">
          <FiTrendingUp className={`w-4 h-4 ${
            analytics?.trendDirection === 'up' ? 'text-red-600' :
            analytics?.trendDirection === 'down' ? 'text-green-600' :
            'text-gray-600'
          }`} />
          <span className="text-xs text-gray-600">Trending</span>
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        <motion.button
          onClick={handleQuickRefresh}
          className="p-2 rounded-full bg-gray-100 hover:bg-gray-200"
          whileTap={{ scale: 0.9 }}
          disabled={isLoading}
        >
          <FiRefreshCw className={`w-4 h-4 text-gray-600 ${isLoading ? 'animate-spin' : ''}`} />
        </motion.button>
        
        <motion.button
          onClick={() => setBottomSheetOpen(!bottomSheetOpen)}
          className="p-2 rounded-full bg-blue-100 hover:bg-blue-200"
          whileTap={{ scale: 0.9 }}
        >
          {bottomSheetOpen ? (
            <FiChevronDown className="w-4 h-4 text-blue-600" />
          ) : (
            <FiChevronUp className="w-4 h-4 text-blue-600" />
          )}
        </motion.button>
      </div>
    </div>
  );

  // Render bottom sheet content
  const renderBottomSheetContent = () => (
    <div className="flex-1 overflow-hidden">
      {/* Tab Navigation */}
      <div className="flex items-center border-b border-gray-200 bg-white">
        {[
          { id: 'stats', label: 'Stats', icon: IoStatsChart },
          { id: 'layers', label: 'Layers', icon: IoLayersSharp },
          { id: 'details', label: 'Details', icon: IoLocationSharp }
        ].map(({ id, label, icon: Icon }) => (
          <motion.button
            key={id}
            onClick={() => setActiveTab(id as any)}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              activeTab === id 
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center justify-center space-x-2">
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </div>
          </motion.button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <AnimatePresence mode="wait">
          {activeTab === 'stats' && (
            <motion.div
              key="stats"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {/* Category Breakdown */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Issue Categories</h3>
                <div className="space-y-2">
                  {topCategories.map(({ category, count, config }) => {
                    const IconComponent = config.icon;
                    return (
                      <div key={category} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-lg ${config.bgColor}`}>
                            <IconComponent className="w-4 h-4" style={{ color: config.color }} />
                          </div>
                          <span className="text-sm font-medium text-gray-900">{config.label}</span>
                        </div>
                        <span className="text-lg font-bold text-gray-900">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Quick Metrics */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="text-xs text-blue-600 font-medium">Total Issues</div>
                  <div className="text-2xl font-bold text-blue-900">
                    {data.dataPoints?.length || 0}
                  </div>
                </div>
                <div className="bg-red-50 p-3 rounded-lg">
                  <div className="text-xs text-red-600 font-medium">Critical</div>
                  <div className="text-2xl font-bold text-red-900">
                    {analytics?.criticalIssues || 0}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'layers' && (
            <motion.div
              key="layers"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Map Layers</h3>
              <div className="space-y-3">
                {Object.entries(layerVisibility).map(([layerId, isVisible]) => (
                  <div key={layerId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-900 capitalize">
                      {layerId.replace(/([A-Z])/g, ' $1').toLowerCase()}
                    </span>
                    <motion.button
                      onClick={() => onToggleLayer?.(layerId)}
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        isVisible ? 'bg-blue-600' : 'bg-gray-300'
                      }`}
                      whileTap={{ scale: 0.95 }}
                    >
                      <motion.div
                        className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md"
                        animate={{ x: isVisible ? 24 : 0 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      />
                    </motion.button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'details' && (
            <motion.div
              key="details"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {selectedPoint || selectedCluster || selectedAnomaly ? (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    {selectedPoint ? 'Issue Details' : 
                     selectedCluster ? 'Cluster Details' : 
                     'Anomaly Details'}
                  </h3>
                  
                  {selectedPoint && (
                    <div className="space-y-3">
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="text-sm text-gray-600">Category</div>
                        <div className="text-lg font-semibold text-gray-900 capitalize">
                          {selectedPoint.metadata?.category || 'Unknown'}
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

                      <div className="flex space-x-2">
                        <motion.button
                          onClick={handleShareLocation}
                          className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-medium"
                          whileTap={{ scale: 0.98 }}
                        >
                          Share Location
                        </motion.button>
                        <motion.button
                          className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg font-medium"
                          whileTap={{ scale: 0.98 }}
                        >
                          View Details
                        </motion.button>
                      </div>
                    </div>
                  )}

                  {selectedCluster && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-purple-50 p-3 rounded-lg">
                          <div className="text-xs text-purple-600 font-medium">Issues</div>
                          <div className="text-lg font-bold text-purple-900">
                            {selectedCluster.points?.length || 0}
                          </div>
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
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <IoLocationSharp className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm">Select a point or cluster on the map to view details</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );

  return (
    <div className={`mobile-heatmap-interface relative w-full h-full overflow-hidden bg-gray-50 ${className}`}>
      {/* Main Map Container */}
      <div className="absolute inset-0">
        <MapLibreMap
          data={data}
          bounds={bounds}
          layerVisibility={layerVisibility}
          onPointClick={(point, _event) => onPointClick?.(point)}
          onClusterClick={(cluster, _event) => onClusterClick?.(cluster)}
          onAnomalyClick={(_anomaly, _event) => {}}
          onBoundsChange={onBoundsChange || (() => {})}
          isLoading={isLoading || false}
        />
      </div>

      {/* Mobile Bottom Sheet */}
      <motion.div
        ref={bottomSheetRef}
        className="absolute bottom-0 left-0 right-0 bg-white shadow-2xl rounded-t-2xl flex flex-col"
        style={{ height: bottomSheetHeight }}
        drag="y"
        dragConstraints={{ top: -maxHeight + minHeight, bottom: 0 }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
        initial={{ y: 0 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
      >
        {/* Drag Handle */}
        <div className="flex justify-center py-2 cursor-grab active:cursor-grabbing">
          <div className="w-12 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Quick Stats Bar */}
        {renderQuickStats()}

        {/* Bottom Sheet Content */}
        {bottomSheetOpen && renderBottomSheetContent()}
      </motion.div>

      {/* Loading Overlay */}
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
              <span className="text-lg font-medium text-gray-900">Loading...</span>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default MobileHeatmapInterface;