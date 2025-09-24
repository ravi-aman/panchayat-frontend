// ===== ADVANCED HEATMAP LEGEND COMPONENT =====
// Production-level legend with interactive features

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MdInfo,
  MdVisibility,
  MdVisibilityOff,
  MdExpandMore,
  MdExpandLess,
  MdPalette,
  MdTune,
  MdWarning,
  MdHelp
} from 'react-icons/md';
import {
  HeatmapVisualizationConfig,
  HeatmapDataPoint,
  HeatmapCluster,
  HeatmapAnomaly
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

interface HeatmapLegendProps {
  config: HeatmapVisualizationConfig;
  data: {
    dataPoints?: HeatmapDataPoint[];
    clusters?: HeatmapCluster[];
    anomalies?: HeatmapAnomaly[];
  };
  selectedLayer: 'heatmap' | 'clusters' | 'points' | 'all';
  layerVisibility: LayerVisibilityState;
  categoryIcons: Record<string, { icon: React.ComponentType<any>; color: string; label: string }>;
  className?: string;
  onLayerToggle?: (layer: string, visible: boolean) => void;
  onConfigChange?: (config: any) => void;
}

// ===== CONSTANTS =====

const INTENSITY_LEVELS = [
  { value: 1.0, label: 'Critical', color: '#ff0000', description: 'Immediate attention required' },
  { value: 0.8, label: 'High', color: '#ff6600', description: 'High priority issues' },
  { value: 0.6, label: 'Medium', color: '#ffaa00', description: 'Moderate concern' },
  { value: 0.4, label: 'Low', color: '#ffff00', description: 'Minor issues' },
  { value: 0.2, label: 'Minimal', color: '#88ff00', description: 'Low impact' },
  { value: 0.0, label: 'Normal', color: '#00ff00', description: 'Normal conditions' }
];

const CLUSTER_SIZES = [
  { size: 'small', radius: 20, color: '#3b82f6', label: 'Small Cluster (1-10)', description: 'Few localized issues' },
  { size: 'medium', radius: 30, color: '#f59e0b', label: 'Medium Cluster (11-25)', description: 'Notable issue concentration' },
  { size: 'large', radius: 40, color: '#ef4444', label: 'Large Cluster (26+)', description: 'Major hotspot area' }
];

const LEGEND_SECTIONS = {
  heatmap: {
    title: 'Heat Intensity',
    icon: MdPalette,
    description: 'Color-coded issue intensity levels'
  },
  clusters: {
    title: 'Issue Clusters',
    icon: MdInfo,
    description: 'Grouped issues by proximity'
  },
  points: {
    title: 'Individual Issues',
    icon: MdWarning,
    description: 'Single civic issue reports'
  },
  categories: {
    title: 'Issue Categories',
    icon: MdTune,
    description: 'Types of civic issues'
  },
  anomalies: {
    title: 'Anomalies',
    icon: MdWarning,
    description: 'Unusual patterns detected'
  }
};

// ===== MAIN COMPONENT =====

export const HeatmapLegend: React.FC<HeatmapLegendProps> = ({
  data,
  selectedLayer,
  layerVisibility,
  categoryIcons,
  className = '',
  onLayerToggle,
}) => {
  // ===== STATE =====
  
  const [isExpanded, setIsExpanded] = useState(true);
  const [isCompact, setIsCompact] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [showTooltip, setShowTooltip] = useState<{ id: string; x: number; y: number } | null>(null);

  // ===== COMPUTED VALUES =====

  const visibleSections = useMemo(() => {
    const sections = [];
    
    // Always show categories for context
    sections.push('categories');
    
    // Add sections based on selected layer and visibility
    if (selectedLayer === 'all' || selectedLayer === 'heatmap') {
      if (layerVisibility.heatmap || layerVisibility.heatmapIntensity) {
        sections.push('heatmap');
      }
    }
    
    if (selectedLayer === 'all' || selectedLayer === 'clusters') {
      if (layerVisibility.clusters) {
        sections.push('clusters');
      }
    }
    
    if (selectedLayer === 'all' || selectedLayer === 'points') {
      if (layerVisibility.points) {
        sections.push('points');
      }
    }
    
    if (layerVisibility.anomalies && data.anomalies && data.anomalies.length > 0) {
      sections.push('anomalies');
    }
    
    return sections;
  }, [selectedLayer, layerVisibility, data]);

  const categoryStats = useMemo(() => {
    if (!data.dataPoints) return {};
    
    const stats: Record<string, { count: number; percentage: number }> = {};
    const total = data.dataPoints.length;
    
    data.dataPoints.forEach(point => {
      const category = point.metadata?.category || 'other';
      stats[category] = stats[category] || { count: 0, percentage: 0 };
      stats[category].count++;
    });
    
    Object.keys(stats).forEach(category => {
      stats[category].percentage = (stats[category].count / total) * 100;
    });
    
    return stats;
  }, [data.dataPoints]);

  // ===== EVENT HANDLERS =====

  const handleSectionToggle = useCallback((section: string) => {
    setActiveSection(current => current === section ? null : section);
  }, []);

  const handleTooltip = useCallback((event: React.MouseEvent, id: string) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setShowTooltip({
      id,
      x: rect.right + 10,
      y: rect.top + rect.height / 2
    });
  }, []);

  const handleTooltipHide = useCallback(() => {
    setShowTooltip(null);
  }, []);

  const handleLayerToggle = useCallback((layer: string) => {
    const isVisible = layerVisibility[layer as keyof LayerVisibilityState];
    onLayerToggle?.(layer, !isVisible);
  }, [layerVisibility, onLayerToggle]);

  // Auto-adjust compact mode based on screen size
  useEffect(() => {
    const handleResize = () => {
      setIsCompact(window.innerWidth < 768);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ===== RENDER COMPONENTS =====

  const HeatIntensityLegend = () => (
    <div className="space-y-2">
      <div className="text-xs font-semibold text-gray-700 mb-2 flex items-center">
        <MdPalette className="w-3 h-3 mr-1" />
        Heat Intensity Scale
      </div>
      <div className="space-y-1">
        {INTENSITY_LEVELS.map((level, index) => (
          <motion.div
            key={index}
            className="flex items-center space-x-2 text-xs"
            whileHover={{ scale: 1.02, x: 2 }}
            onMouseEnter={(e) => handleTooltip(e, `intensity-${index}`)}
            onMouseLeave={handleTooltipHide}
          >
            <div
              className="w-4 h-4 rounded-sm shadow-sm border border-white/50"
              style={{ backgroundColor: level.color }}
            />
            <div className="flex-1 flex justify-between">
              <span className="text-gray-700">{level.label}</span>
              {!isCompact && <span className="text-gray-500">{level.value.toFixed(1)}</span>}
            </div>
          </motion.div>
        ))}
      </div>
      
      {/* Gradient Bar */}
      <div className="mt-3">
        <div
          className="h-3 rounded-full border border-gray-200"
          style={{
            background: `linear-gradient(to right, ${INTENSITY_LEVELS.slice().reverse().map(l => l.color).join(', ')})`
          }}
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Low</span>
          <span>High</span>
        </div>
      </div>
    </div>
  );

  const ClusterLegend = () => (
    <div className="space-y-2">
      <div className="text-xs font-semibold text-gray-700 mb-2 flex items-center">
        <MdInfo className="w-3 h-3 mr-1" />
        Cluster Sizes
      </div>
      <div className="space-y-1">
        {CLUSTER_SIZES.map((cluster, index) => (
          <motion.div
            key={index}
            className="flex items-center space-x-2 text-xs"
            whileHover={{ scale: 1.02, x: 2 }}
            onMouseEnter={(e) => handleTooltip(e, `cluster-${index}`)}
            onMouseLeave={handleTooltipHide}
          >
            <div
              className="rounded-full shadow-sm border-2 border-white"
              style={{
                width: `${cluster.radius / 2}px`,
                height: `${cluster.radius / 2}px`,
                backgroundColor: cluster.color,
                minWidth: '16px',
                minHeight: '16px'
              }}
            />
            <span className="text-gray-700">{cluster.label}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );

  const CategoryLegend = () => (
    <div className="space-y-2">
      <div className="text-xs font-semibold text-gray-700 mb-2 flex items-center">
        <MdTune className="w-3 h-3 mr-1" />
        Issue Categories
      </div>
      <div className="space-y-1">
        {Object.entries(categoryIcons).map(([category, config]) => {
          const IconComponent = config.icon;
          const stats = categoryStats[category];
          const isVisible = layerVisibility.points; // Assuming categories are tied to points
          
          return (
            <motion.button
              key={category}
              onClick={() => handleLayerToggle('points')}
              className={`w-full flex items-center space-x-2 text-xs p-1 rounded hover:bg-gray-50 transition-colors ${
                !isVisible ? 'opacity-50' : ''
              }`}
              whileHover={{ scale: 1.01, x: 2 }}
              onMouseEnter={(e) => handleTooltip(e, `category-${category}`)}
              onMouseLeave={handleTooltipHide}
            >
              <div
                className="p-1 rounded"
                style={{ backgroundColor: `${config.color}20` }}
              >
                <IconComponent
                  className="w-3 h-3"
                  style={{ color: config.color }}
                />
              </div>
              <div className="flex-1 text-left">
                <div className="text-gray-700">{config.label}</div>
                {stats && !isCompact && (
                  <div className="text-gray-500 text-xs">
                    {stats.count} ({stats.percentage.toFixed(1)}%)
                  </div>
                )}
              </div>
              {onLayerToggle && (
                <div>
                  {isVisible ? (
                    <MdVisibility className="w-3 h-3 text-gray-400" />
                  ) : (
                    <MdVisibilityOff className="w-3 h-3 text-gray-400" />
                  )}
                </div>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );

  const PointLegend = () => (
    <div className="space-y-2">
      <div className="text-xs font-semibold text-gray-700 mb-2 flex items-center">
        <MdWarning className="w-3 h-3 mr-1" />
        Individual Issues
      </div>
      <div className="space-y-1">
        {[
          { urgency: 'critical', color: '#ef4444', label: 'Critical Priority', size: 8 },
          { urgency: 'high', color: '#f97316', label: 'High Priority', size: 6 },
          { urgency: 'medium', color: '#eab308', label: 'Medium Priority', size: 5 },
          { urgency: 'low', color: '#22c55e', label: 'Low Priority', size: 4 }
        ].map((item, index) => (
          <motion.div
            key={index}
            className="flex items-center space-x-2 text-xs"
            whileHover={{ scale: 1.02, x: 2 }}
            onMouseEnter={(e) => handleTooltip(e, `point-${index}`)}
            onMouseLeave={handleTooltipHide}
          >
            <div
              className="rounded-full shadow-sm border border-white"
              style={{
                width: `${item.size}px`,
                height: `${item.size}px`,
                backgroundColor: item.color,
                minWidth: '12px',
                minHeight: '12px'
              }}
            />
            <span className="text-gray-700">{item.label}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );

  const AnomalyLegend = () => (
    <div className="space-y-2">
      <div className="text-xs font-semibold text-gray-700 mb-2 flex items-center">
        <MdWarning className="w-3 h-3 mr-1" />
        Anomalies
      </div>
      <div className="space-y-1">
        <motion.div
          className="flex items-center space-x-2 text-xs"
          whileHover={{ scale: 1.02, x: 2 }}
        >
          <div
            className="w-4 h-4 rounded-sm shadow-sm border-2 border-red-500 bg-red-100"
            style={{ 
              background: 'repeating-linear-gradient(45deg, #fee2e2, #fee2e2 2px, #fecaca 2px, #fecaca 4px)'
            }}
          />
          <span className="text-gray-700">Unusual Pattern</span>
        </motion.div>
      </div>
    </div>
  );

  const LegendSection: React.FC<{ 
    sectionKey: string; 
    title: string; 
    icon: React.ComponentType<any>; 
    children: React.ReactNode;
    description?: string;
  }> = ({ sectionKey, title, icon: IconComponent, children, description }) => (
    <motion.div
      className="border border-gray-200 rounded-lg overflow-hidden"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <motion.button
        onClick={() => handleSectionToggle(sectionKey)}
        className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition-colors"
        whileHover={{ backgroundColor: '#f9fafb' }}
      >
        <div className="flex items-center space-x-2">
          <IconComponent className="w-4 h-4 text-gray-600" />
          <span className="text-xs font-medium text-gray-900">{title}</span>
        </div>
        <div className="flex items-center space-x-1">
          {description && (
            <motion.div
              onMouseEnter={(e) => handleTooltip(e, `section-${sectionKey}`)}
              onMouseLeave={handleTooltipHide}
              whileHover={{ scale: 1.1 }}
            >
              <MdHelp className="w-3 h-3 text-gray-400" />
            </motion.div>
          )}
          {activeSection === sectionKey ? (
            <MdExpandLess className="w-4 h-4" />
          ) : (
            <MdExpandMore className="w-4 h-4" />
          )}
        </div>
      </motion.button>
      
      <AnimatePresence>
        {activeSection === sectionKey && (
          <motion.div
            className="p-3 bg-white border-t border-gray-200"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );

  const Tooltip: React.FC<{ id: string; x: number; y: number }> = ({ id, x, y }) => {
    const tooltipContent = useMemo(() => {
      const [type, index] = id.split('-');
      
      switch (type) {
        case 'intensity':
          return INTENSITY_LEVELS[parseInt(index)]?.description || '';
        case 'cluster':
          return CLUSTER_SIZES[parseInt(index)]?.description || '';
        case 'category':
          const categoryKey = index;
          const stats = categoryStats[categoryKey];
          return stats ? `${stats.count} issues (${stats.percentage.toFixed(1)}% of total)` : '';
        case 'section':
          return LEGEND_SECTIONS[index as keyof typeof LEGEND_SECTIONS]?.description || '';
        default:
          return '';
      }
    }, [id]);

    if (!tooltipContent) return null;

    return (
      <motion.div
        className="fixed z-50 bg-gray-900 text-white text-xs py-2 px-3 rounded-lg shadow-lg pointer-events-none max-w-xs"
        style={{ left: x, top: y, transform: 'translateY(-50%)' }}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{ duration: 0.15 }}
      >
        {tooltipContent}
        <div
          className="absolute left-0 top-1/2 transform -translate-x-1 -translate-y-1/2 w-0 h-0 border-t-4 border-b-4 border-r-4 border-transparent border-r-gray-900"
        />
      </motion.div>
    );
  };

  // ===== MAIN RENDER =====

  return (
    <>
      <motion.div
        className={`heatmap-legend bg-white/95 backdrop-blur-md shadow-lg border border-white/30 rounded-lg overflow-hidden ${className}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        style={{
          minWidth: isCompact ? '200px' : '280px',
          maxWidth: '320px',
          maxHeight: '60vh'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <MdInfo className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-gray-900">Map Legend</h3>
          </div>
          <div className="flex items-center space-x-1">
            <motion.button
              onClick={() => setIsCompact(!isCompact)}
              className="p-1 rounded hover:bg-gray-200 transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              title="Toggle compact mode"
            >
              <MdTune className="w-3 h-3 text-gray-600" />
            </motion.button>
            <motion.button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 rounded hover:bg-gray-200 transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              title={isExpanded ? 'Collapse legend' : 'Expand legend'}
            >
              {isExpanded ? (
                <MdExpandLess className="w-4 h-4 text-gray-600" />
              ) : (
                <MdExpandMore className="w-4 h-4 text-gray-600" />
              )}
            </motion.button>
          </div>
        </div>

        {/* Content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              className="overflow-y-auto"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{ maxHeight: '50vh' }}
            >
              <div className="p-3 space-y-3">
                
                {/* Active Layer Indicator */}
                <div className="bg-blue-50 p-2 rounded text-xs">
                  <div className="font-medium text-blue-900 mb-1">Active View</div>
                  <div className="text-blue-700">
                    {selectedLayer === 'all' ? 'All Layers' : 
                     selectedLayer.charAt(0).toUpperCase() + selectedLayer.slice(1)}
                  </div>
                </div>

                {/* Legend Sections */}
                {visibleSections.map(section => {
                  const sectionConfig = LEGEND_SECTIONS[section as keyof typeof LEGEND_SECTIONS];
                  if (!sectionConfig) return null;

                  return (
                    <LegendSection
                      key={section}
                      sectionKey={section}
                      title={sectionConfig.title}
                      icon={sectionConfig.icon}
                      description={sectionConfig.description}
                    >
                      {section === 'heatmap' && <HeatIntensityLegend />}
                      {section === 'clusters' && <ClusterLegend />}
                      {section === 'categories' && <CategoryLegend />}
                      {section === 'points' && <PointLegend />}
                      {section === 'anomalies' && <AnomalyLegend />}
                    </LegendSection>
                  );
                })}

                {/* Data Summary */}
                {!isCompact && (
                  <div className="border-t border-gray-200 pt-3 mt-4">
                    <div className="text-xs text-gray-500 space-y-1">
                      <div>Total Issues: {data.dataPoints?.length || 0}</div>
                      <div>Active Clusters: {data.clusters?.length || 0}</div>
                      {data.anomalies && data.anomalies.length > 0 && (
                        <div>Anomalies: {data.anomalies.length}</div>
                      )}
                      <div className="text-xs text-gray-400 pt-2">
                        Last updated: {new Date().toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Tooltip */}
      <AnimatePresence>
        {showTooltip && (
          <Tooltip
            id={showTooltip.id}
            x={showTooltip.x}
            y={showTooltip.y}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default HeatmapLegend;