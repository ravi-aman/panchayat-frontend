// ===== ADVANCED HEATMAP CONTROLS COMPONENT =====
// Production-level control panel for heatmap visualization

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MdLayers,
  MdAnalytics,
  MdSettings,
  MdRefresh,
  MdDownload,
  MdFilterList,
  MdTimeline,
  MdTrendingUp,
  MdVisibility,
  MdVisibilityOff,
  MdTune,
  MdPalette,
  MdSpeed,
  MdMemory,
  MdSignalWifi4Bar,
  MdSignalWifiOff,
  MdWarning,
  MdExpandMore,
  MdExpandLess,
  MdPlayArrow,
  MdPause
} from 'react-icons/md';
import {
  HeatmapConfig,
  HeatmapVisualizationConfig,
  PerformanceMetrics,
  ConnectionStatus
} from '../../types/heatmap';

// ===== INTERFACES =====

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

interface HeatmapControlsProps {
  visualization: HeatmapVisualizationConfig;
  selectedLayer: 'heatmap' | 'clusters' | 'points' | 'all';
  layerVisibility: LayerVisibilityState;
  isLoading: boolean;
  isConnected: boolean;
  wsStatus?: ConnectionStatus;
  wsMetrics?: {
    latency: number;
    messagesPerSecond: number;
    reconnectCount: number;
  };
  performanceMetrics: PerformanceMetrics;
  filters: {
    timeRange: { start: Date | null; end: Date | null };
    categories: string[];
    intensityRange: [number, number];
    priorityLevels: string[];
  };
  fpsAverage?: number;
  enableAdvancedFeatures: boolean;
  onLayerChange: (layer: 'heatmap' | 'clusters' | 'points' | 'all') => void;
  onLayerToggle: (layer: string, visible: boolean) => void;
  onConfigChange: (config: Partial<HeatmapConfig>) => void;
  onVisualizationChange: (config: Partial<HeatmapVisualizationConfig>) => void;
  onRefresh: () => void;
  onExport: (format: 'json' | 'csv' | 'geojson' | 'kml') => void;
  onFilterChange: (filters: any) => void;
  onSidebarToggle: () => void;
  className?: string;
}

// ===== CONSTANTS =====

const LAYER_CONFIGS = {
  heatmap: {
    label: 'Heat Map',
    description: 'Intensity-based visualization',
    icon: MdTrendingUp,
    color: 'text-red-600',
    bgColor: 'bg-red-50'
  },
  clusters: {
    label: 'Clusters',
    description: 'Grouped issue hotspots',
    icon: MdAnalytics,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50'
  },
  points: {
    label: 'Individual Points',
    description: 'Each civic issue',
    icon: MdLayers,
    color: 'text-green-600',
    bgColor: 'bg-green-50'
  },
  boundaries: {
    label: 'Administrative Boundaries',
    description: 'Ward and district lines',
    icon: MdFilterList,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50'
  },
  predictions: {
    label: 'ML Predictions',
    description: 'AI-predicted hotspots',
    icon: MdTrendingUp,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50'
  },
  anomalies: {
    label: 'Anomalies',
    description: 'Unusual patterns detected',
    icon: MdWarning,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50'
  },
  realtime: {
    label: 'Real-time Updates',
    description: 'Live data streaming',
    icon: MdSignalWifi4Bar,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50'
  },
  heatmapIntensity: {
    label: 'Heat Intensity',
    description: 'Color-coded intensity',
    icon: MdPalette,
    color: 'text-pink-600',
    bgColor: 'bg-pink-50'
  },
  historicalData: {
    label: 'Historical Data',
    description: 'Past trends and patterns',
    icon: MdTimeline,
    color: 'text-teal-600',
    bgColor: 'bg-teal-50'
  }
};

const COLOR_SCHEMES = [
  { name: 'Viridis', value: 'viridis', colors: ['#440154', '#31688e', '#35b779', '#fde725'] },
  { name: 'Heat', value: 'heat', colors: ['#000080', '#ff0000', '#ffff00', '#ffffff'] },
  { name: 'Plasma', value: 'plasma', colors: ['#0d0887', '#7e03a8', '#cc4778', '#f89441'] },
  { name: 'Cool', value: 'cool', colors: ['#00ffff', '#ff00ff', '#0000ff', '#ffffff'] },
  { name: 'Spectral', value: 'spectral', colors: ['#d7191c', '#fdae61', '#ffffbf', '#2c7bb6'] }
];

// ===== MAIN COMPONENT =====

export const HeatmapControls: React.FC<HeatmapControlsProps> = ({
  visualization,
  selectedLayer,
  layerVisibility,
  isLoading,
  isConnected,
  wsStatus = 'disconnected',
  wsMetrics,
  performanceMetrics,
  filters,
  fpsAverage,
  enableAdvancedFeatures,
  onLayerChange,
  onLayerToggle,
  onConfigChange,
  onVisualizationChange,
  onRefresh,
  onExport,
  onFilterChange,
  onSidebarToggle,
  className = ''
}) => {
  // ===== STATE =====
  
  const [expandedSections, setExpandedSections] = useState({
    layers: true,
    visualization: false,
    performance: false,
    filters: false,
    export: false
  });
  
  const [isCompact, setIsCompact] = useState(false);
  const [realtimeEnabled, setRealtimeEnabled] = useState(true);
  
  const controlsRef = useRef<HTMLDivElement>(null);

  // ===== COMPUTED VALUES =====

  const connectionStatusInfo = useMemo(() => {
    switch (wsStatus) {
      case 'connected':
        return {
          icon: MdSignalWifi4Bar,
          color: 'text-green-500',
          bgColor: 'bg-green-100',
          label: 'Connected',
          description: 'Real-time updates active'
        };
      case 'connecting':
      case 'reconnecting':
        return {
          icon: MdSignalWifi4Bar,
          color: 'text-yellow-500',
          bgColor: 'bg-yellow-100',
          label: 'Connecting...',
          description: 'Establishing connection'
        };
      case 'disconnected':
      case 'error':
        return {
          icon: MdSignalWifiOff,
          color: 'text-red-500',
          bgColor: 'bg-red-100',
          label: 'Offline',
          description: 'Real-time updates unavailable'
        };
      default:
        return {
          icon: MdSignalWifiOff,
          color: 'text-gray-500',
          bgColor: 'bg-gray-100',
          label: 'Unknown',
          description: 'Status unknown'
        };
    }
  }, [wsStatus]);

  const performanceStatus = useMemo(() => {
    const { renderTime, memoryUsage } = performanceMetrics;
    const fps = fpsAverage ?? 60;

    if (renderTime > 100 || memoryUsage > 80 || fps < 30) {
      return { status: 'poor', color: 'text-red-500', bgColor: 'bg-red-100' };
    } else if (renderTime > 50 || memoryUsage > 60 || fps < 45) {
      return { status: 'fair', color: 'text-yellow-500', bgColor: 'bg-yellow-100' };
    } else {
      return { status: 'good', color: 'text-green-500', bgColor: 'bg-green-100' };
    }
  }, [performanceMetrics, fpsAverage]);

  // ===== EVENT HANDLERS =====

  const handleSectionToggle = useCallback((section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  }, []);

  const handleLayerToggle = useCallback((layerKey: string) => {
    onLayerToggle(layerKey, !layerVisibility[layerKey as keyof LayerVisibilityState]);
  }, [layerVisibility, onLayerToggle]);

  const handleVisualizationChange = useCallback((key: string, value: any) => {
    onVisualizationChange({ [key]: value });
  }, [onVisualizationChange]);

  const handleConfigChange = useCallback((key: string, value: any) => {
    onConfigChange({ [key]: value });
  }, [onConfigChange]);

  const handleExportClick = useCallback((format: 'json' | 'csv' | 'geojson' | 'kml') => {
    onExport(format);
  }, [onExport]);

  const handleRealtimeToggle = useCallback(() => {
    setRealtimeEnabled(prev => {
      const newValue = !prev;
      handleConfigChange('realtime.enabled', newValue);
      return newValue;
    });
  }, [handleConfigChange]);

  // Auto-collapse on mobile
  useEffect(() => {
    const handleResize = () => {
      setIsCompact(window.innerWidth < 768);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ===== RENDER COMPONENTS =====

  const ConnectionStatus = () => {
    const status = connectionStatusInfo;
    const StatusIcon = status.icon;

    return (
      <motion.div
        className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${status.bgColor} ${status.color}`}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <StatusIcon className={`w-4 h-4 ${wsStatus === 'connecting' || wsStatus === 'reconnecting' ? 'animate-pulse' : ''}`} />
        <div className="flex-1">
          <div className="text-xs font-semibold">{status.label}</div>
          <div className="text-xs opacity-70">{status.description}</div>
        </div>
        {wsMetrics && isConnected && (
          <div className="text-xs">
            <div>{wsMetrics.latency}ms</div>
          </div>
        )}
      </motion.div>
    );
  };

  const LayerControls = () => (
    <div className="space-y-3">
      {/* Layer Selection */}
      <div className="flex flex-wrap gap-1">
        {(['all', 'heatmap', 'clusters', 'points'] as const).map((layer) => (
          <motion.button
            key={layer}
            onClick={() => onLayerChange(layer)}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
              selectedLayer === layer
                ? 'bg-blue-500 text-white shadow-md' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {layer === 'all' ? 'All Layers' : layer.charAt(0).toUpperCase() + layer.slice(1)}
          </motion.button>
        ))}
      </div>

      {/* Individual Layer Toggles */}
      <div className="space-y-1">
        {Object.entries(LAYER_CONFIGS).map(([key, layerConfig]) => {
          const isVisible = layerVisibility[key as keyof LayerVisibilityState];
          const IconComponent = layerConfig.icon;

          return (
            <motion.button
              key={key}
              onClick={() => handleLayerToggle(key)}
              className={`w-full flex items-center justify-between p-2 rounded-lg text-sm transition-all ${
                isVisible 
                  ? `${layerConfig.bgColor} ${layerConfig.color} border border-current border-opacity-20` 
                  : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
              }`}
              whileHover={{ scale: 1.01, x: 2 }}
              whileTap={{ scale: 0.99 }}
            >
              <div className="flex items-center space-x-2">
                <IconComponent className="w-4 h-4" />
                <div className="text-left">
                  <div className="font-medium">{layerConfig.label}</div>
                  {!isCompact && (
                    <div className="text-xs opacity-70">{layerConfig.description}</div>
                  )}
                </div>
              </div>
              {isVisible ? <MdVisibility className="w-4 h-4" /> : <MdVisibilityOff className="w-4 h-4" />}
            </motion.button>
          );
        })}
      </div>
    </div>
  );

  const VisualizationControls = () => (
    <div className="space-y-4">
      {/* Color Scheme Selection */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-2">Color Scheme</label>
        <div className="grid grid-cols-2 gap-2">
          {COLOR_SCHEMES.map((scheme) => (
            <motion.button
              key={scheme.value}
              onClick={() => handleVisualizationChange('colorScheme', scheme.value)}
              className={`flex items-center space-x-2 p-2 rounded-lg border text-xs ${
                visualization.colorScheme === scheme.value
                  ? 'border-blue-500 bg-blue-50 text-blue-900'
                  : 'border-gray-200 bg-white hover:bg-gray-50'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex space-x-1">
                {scheme.colors.slice(0, 3).map((color, idx) => (
                  <div
                    key={idx}
                    className="w-3 h-3 rounded-sm"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <span className="font-medium">{scheme.name}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Opacity Controls */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-2">
          Heatmap Opacity: {Math.round((visualization.heatmapOpacity || 0.6) * 100)}%
        </label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={visualization.heatmapOpacity || 0.6}
          onChange={(e) => handleVisualizationChange('heatmapOpacity', parseFloat(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
        />
      </div>

      {/* Cluster Radius */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-2">
          Cluster Radius: {visualization.clusterRadius || 20}px
        </label>
        <input
          type="range"
          min="10"
          max="50"
          step="5"
          value={visualization.clusterRadius || 20}
          onChange={(e) => handleVisualizationChange('clusterRadius', parseInt(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
        />
      </div>

      {/* Animation Speed */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-2">
          Animation Speed: {visualization.animationDuration || 300}ms
        </label>
        <input
          type="range"
          min="100"
          max="1000"
          step="100"
          value={visualization.animationDuration || 300}
          onChange={(e) => handleVisualizationChange('animationDuration', parseInt(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
        />
      </div>

      {/* Advanced Options */}
      {enableAdvancedFeatures && (
        <div className="border-t border-gray-200 pt-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-700">Enable Smoothing</span>
            <motion.button
              onClick={() => handleVisualizationChange('enableSmoothing', !visualization.enableSmoothing)}
              className={`relative w-10 h-5 rounded-full transition-colors ${
                visualization.enableSmoothing ? 'bg-blue-500' : 'bg-gray-300'
              }`}
              whileTap={{ scale: 0.95 }}
            >
              <div className={`absolute w-4 h-4 bg-white rounded-full top-0.5 transition-transform ${
                visualization.enableSmoothing ? 'translate-x-5' : 'translate-x-0.5'
              }`} />
            </motion.button>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-700">Enable Interpolation</span>
            <motion.button
              onClick={() => handleVisualizationChange('enableInterpolation', !visualization.enableInterpolation)}
              className={`relative w-10 h-5 rounded-full transition-colors ${
                visualization.enableInterpolation ? 'bg-blue-500' : 'bg-gray-300'
              }`}
              whileTap={{ scale: 0.95 }}
            >
              <div className={`absolute w-4 h-4 bg-white rounded-full top-0.5 transition-transform ${
                visualization.enableInterpolation ? 'translate-x-5' : 'translate-x-0.5'
              }`} />
            </motion.button>
          </div>
        </div>
      )}
    </div>
  );

  const PerformanceMetrics = () => {
    const status = performanceStatus;

    return (
      <div className="space-y-3">
        <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${status.bgColor}`}>
          <MdSpeed className={`w-4 h-4 ${status.color}`} />
          <div>
            <div className={`text-xs font-semibold ${status.color}`}>
              Performance: {status.status.toUpperCase()}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-gray-50 p-2 rounded">
            <div className="text-gray-500">Render Time</div>
            <div className="font-semibold">{performanceMetrics.renderTime.toFixed(1)}ms</div>
          </div>
          <div className="bg-gray-50 p-2 rounded">
            <div className="text-gray-500">Memory</div>
            <div className="font-semibold">{performanceMetrics.memoryUsage.toFixed(1)}%</div>
          </div>
          <div className="bg-gray-50 p-2 rounded">
            <div className="text-gray-500">FPS</div>
            <div className="font-semibold">{performanceMetrics?.fpsAverage?.toFixed(0) || '0'}</div>
          </div>
          <div className="bg-gray-50 p-2 rounded">
            <div className="text-gray-500">Data Points</div>
            <div className="font-semibold">{performanceMetrics?.dataPointCount?.toLocaleString() || '0'}</div>
          </div>
        </div>

        {wsMetrics && (
          <div className="border-t border-gray-200 pt-2">
            <div className="text-xs font-medium text-gray-700 mb-2">WebSocket Metrics</div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-gray-50 p-2 rounded">
                <div className="text-gray-500">Latency</div>
                <div className="font-semibold">{wsMetrics.latency}ms</div>
              </div>
              <div className="bg-gray-50 p-2 rounded">
                <div className="text-gray-500">Messages/sec</div>
                <div className="font-semibold">{wsMetrics.messagesPerSecond}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const FilterControls = () => (
    <div className="space-y-4">
      {/* Time Range Filter */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-2">Time Range</label>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="datetime-local"
            value={filters.timeRange.start?.toISOString().slice(0, 16) || ''}
            onChange={(e) => onFilterChange({
              ...filters,
              timeRange: { ...filters.timeRange, start: e.target.value ? new Date(e.target.value) : null }
            })}
            className="px-2 py-1 text-xs border border-gray-300 rounded focus:border-blue-500 focus:outline-none"
          />
          <input
            type="datetime-local"
            value={filters.timeRange.end?.toISOString().slice(0, 16) || ''}
            onChange={(e) => onFilterChange({
              ...filters,
              timeRange: { ...filters.timeRange, end: e.target.value ? new Date(e.target.value) : null }
            })}
            className="px-2 py-1 text-xs border border-gray-300 rounded focus:border-blue-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Intensity Range */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-2">
          Intensity Range: {filters.intensityRange[0].toFixed(2)} - {filters.intensityRange[1].toFixed(2)}
        </label>
        <div className="flex space-x-2">
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={filters.intensityRange[0]}
            onChange={(e) => onFilterChange({
              ...filters,
              intensityRange: [parseFloat(e.target.value), filters.intensityRange[1]]
            })}
            className="flex-1"
          />
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={filters.intensityRange[1]}
            onChange={(e) => onFilterChange({
              ...filters,
              intensityRange: [filters.intensityRange[0], parseFloat(e.target.value)]
            })}
            className="flex-1"
          />
        </div>
      </div>

      {/* Category Filter */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-2">Categories</label>
        <div className="flex flex-wrap gap-1">
          {['electricity', 'water', 'traffic', 'waste', 'safety', 'other'].map((category) => (
            <motion.button
              key={category}
              onClick={() => {
                const newCategories = filters.categories.includes(category)
                  ? filters.categories.filter(c => c !== category)
                  : [...filters.categories, category];
                onFilterChange({ ...filters, categories: newCategories });
              }}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                filters.categories.includes(category)
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Clear Filters Button */}
      <motion.button
        onClick={() => onFilterChange({
          timeRange: { start: null, end: null },
          categories: ['electricity', 'water', 'traffic', 'waste', 'safety', 'other'],
          intensityRange: [0, 1] as [number, number],
          priorityLevels: ['low', 'medium', 'high', 'critical']
        })}
        className="w-full py-2 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium hover:bg-gray-200 transition-colors"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        Clear All Filters
      </motion.button>
    </div>
  );

  const ExportControls = () => (
    <div className="space-y-3">
      <div className="text-xs font-medium text-gray-700 mb-2">Export Data</div>
      <div className="grid grid-cols-2 gap-2">
        {(['json', 'csv', 'geojson', 'kml'] as const).map((format) => (
          <motion.button
            key={format}
            onClick={() => handleExportClick(format)}
            className="flex items-center justify-center space-x-1 py-2 px-3 bg-blue-50 text-blue-600 rounded-lg text-xs font-medium hover:bg-blue-100 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <MdDownload className="w-3 h-3" />
            <span>{format.toUpperCase()}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );

  const ActionButtons = () => (
    <div className="flex flex-col space-y-2">
      <motion.button
        onClick={onRefresh}
        disabled={isLoading}
        className={`flex items-center justify-center space-x-2 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
          isLoading
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-blue-500 text-white hover:bg-blue-600 shadow-md hover:shadow-lg'
        }`}
        whileHover={!isLoading ? { scale: 1.02 } : {}}
        whileTap={!isLoading ? { scale: 0.98 } : {}}
      >
        <MdRefresh className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        <span>{isLoading ? 'Loading...' : 'Refresh Data'}</span>
      </motion.button>

      <motion.button
        onClick={onSidebarToggle}
        className="flex items-center justify-center space-x-2 py-2 px-4 bg-purple-500 text-white rounded-lg text-sm font-medium hover:bg-purple-600 transition-colors shadow-md hover:shadow-lg"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <MdAnalytics className="w-4 h-4" />
        <span>Analytics Panel</span>
      </motion.button>

      {/* Real-time Toggle */}
      <motion.button
        onClick={handleRealtimeToggle}
        className={`flex items-center justify-center space-x-2 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
          realtimeEnabled
            ? 'bg-green-500 text-white hover:bg-green-600'
            : 'bg-gray-500 text-white hover:bg-gray-600'
        }`}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {realtimeEnabled ? <MdPlayArrow className="w-4 h-4" /> : <MdPause className="w-4 h-4" />}
        <span>{realtimeEnabled ? 'Real-time ON' : 'Real-time OFF'}</span>
      </motion.button>
    </div>
  );

  // ===== MAIN RENDER =====

  return (
    <motion.div
      ref={controlsRef}
      className={`heatmap-controls bg-white/95 backdrop-blur-md shadow-2xl border border-white/30 rounded-2xl ${className}`}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      style={{
        position: 'absolute',
        top: '1rem',
        right: '1rem',
        width: isCompact ? '280px' : '320px',
        maxHeight: '90vh',
        zIndex: 40
      }}
    >
      <div className="p-4 overflow-y-auto max-h-full">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <MdTune className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-gray-900">Map Controls</h3>
          </div>
          <motion.button
            onClick={() => setIsCompact(!isCompact)}
            className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <MdSettings className="w-4 h-4 text-gray-600" />
          </motion.button>
        </div>

        {/* Connection Status */}
        <div className="mb-4">
          <ConnectionStatus />
        </div>

        {/* Action Buttons */}
        <div className="mb-6">
          <ActionButtons />
        </div>

        {/* Control Sections */}
        <div className="space-y-4">
          
          {/* Layer Controls */}
          <motion.div
            className="border border-gray-200 rounded-lg overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <motion.button
              onClick={() => handleSectionToggle('layers')}
              className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition-colors"
              whileHover={{ backgroundColor: '#f3f4f6' }}
            >
              <div className="flex items-center space-x-2">
                <MdLayers className="w-4 h-4 text-gray-600" />
                <span className="font-medium text-gray-900">Map Layers</span>
              </div>
              {expandedSections.layers ? <MdExpandLess /> : <MdExpandMore />}
            </motion.button>
            <AnimatePresence>
              {expandedSections.layers && (
                <motion.div
                  className="p-3 bg-white border-t border-gray-200"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <LayerControls />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Visualization Controls */}
          <motion.div
            className="border border-gray-200 rounded-lg overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <motion.button
              onClick={() => handleSectionToggle('visualization')}
              className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center space-x-2">
                <MdPalette className="w-4 h-4 text-gray-600" />
                <span className="font-medium text-gray-900">Visualization</span>
              </div>
              {expandedSections.visualization ? <MdExpandLess /> : <MdExpandMore />}
            </motion.button>
            <AnimatePresence>
              {expandedSections.visualization && (
                <motion.div
                  className="p-3 bg-white border-t border-gray-200"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <VisualizationControls />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Performance Metrics */}
          {enableAdvancedFeatures && (
            <motion.div
              className="border border-gray-200 rounded-lg overflow-hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <motion.button
                onClick={() => handleSectionToggle('performance')}
                className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <MdMemory className="w-4 h-4 text-gray-600" />
                  <span className="font-medium text-gray-900">Performance</span>
                </div>
                {expandedSections.performance ? <MdExpandLess /> : <MdExpandMore />}
              </motion.button>
              <AnimatePresence>
                {expandedSections.performance && (
                  <motion.div
                    className="p-3 bg-white border-t border-gray-200"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <PerformanceMetrics />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* Filter Controls */}
          <motion.div
            className="border border-gray-200 rounded-lg overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <motion.button
              onClick={() => handleSectionToggle('filters')}
              className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center space-x-2">
                <MdFilterList className="w-4 h-4 text-gray-600" />
                <span className="font-medium text-gray-900">Filters</span>
              </div>
              {expandedSections.filters ? <MdExpandLess /> : <MdExpandMore />}
            </motion.button>
            <AnimatePresence>
              {expandedSections.filters && (
                <motion.div
                  className="p-3 bg-white border-t border-gray-200"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <FilterControls />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Export Controls */}
          <motion.div
            className="border border-gray-200 rounded-lg overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <motion.button
              onClick={() => handleSectionToggle('export')}
              className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center space-x-2">
                <MdDownload className="w-4 h-4 text-gray-600" />
                <span className="font-medium text-gray-900">Export</span>
              </div>
              {expandedSections.export ? <MdExpandLess /> : <MdExpandMore />}
            </motion.button>
            <AnimatePresence>
              {expandedSections.export && (
                <motion.div
                  className="p-3 bg-white border-t border-gray-200"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ExportControls />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

        </div>
      </div>
    </motion.div>
  );
};

export default HeatmapControls;