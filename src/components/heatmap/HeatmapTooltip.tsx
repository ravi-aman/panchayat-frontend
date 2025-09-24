// ===== ADVANCED HEATMAP TOOLTIP COMPONENT =====
// Production-level interactive tooltip with rich information display

import React, { useMemo, useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MdClose,
  MdLocationOn,
  MdSchedule,
  MdPerson,
  MdImage,
  MdThumbUp,
  MdShare,
  MdFlag,
  MdWarning,
  MdInfo,
  MdAnalytics,
  MdComment,
  MdExpandMore,
  MdExpandLess,
  MdOpenInNew
} from 'react-icons/md';
import {
  HeatmapDataPoint,
  HeatmapCluster,
  HeatmapAnomaly
} from '../../types/heatmap';

// ===== INTERFACES =====

interface HeatmapTooltipProps {
  data: HeatmapDataPoint | HeatmapCluster | HeatmapAnomaly;
  type: 'point' | 'cluster' | 'anomaly' | null;
  position: [number, number]; // [x, y] screen coordinates
  categoryIcons: Record<string, { icon: React.ComponentType<any>; color: string; label: string }>;
  enableAdvancedFeatures?: boolean; // Made optional
  visible?: boolean; // Added visible property
  onClose: () => void;
  onAction?: (action: string, data: any) => void;
  className?: string;
}

// ===== CONSTANTS =====

const URGENCY_COLORS = {
  low: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300', dot: 'bg-green-500' },
  medium: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300', dot: 'bg-yellow-500' },
  high: { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-300', dot: 'bg-orange-500' },
  critical: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300', dot: 'bg-red-500' },
  emergency: { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-300', dot: 'bg-purple-500' }
};

const STATUS_COLORS = {
  open: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Open' },
  in_progress: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'In Progress' },
  resolved: { bg: 'bg-green-100', text: 'text-green-800', label: 'Resolved' },
  closed: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Closed' },
  rejected: { bg: 'bg-red-100', text: 'text-red-800', label: 'Rejected' }
};

// ===== UTILITY FUNCTIONS =====

const formatDate = (date: string | Date) => {
  const d = new Date(date);
  return {
    date: d.toLocaleDateString(),
    time: d.toLocaleTimeString(),
    relative: getRelativeTime(d)
  };
};

const getRelativeTime = (date: Date) => {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return date.toLocaleDateString();
};

const getPositionStyle = (position: [number, number]) => {
  const [x, y] = position;
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const tooltipWidth = 320; // Approximate tooltip width
  const tooltipHeight = 400; // Approximate tooltip height

  let left = x + 10;
  let top = y;
  let transformOrigin = 'top left';

  // Adjust horizontal position
  if (left + tooltipWidth > viewportWidth - 20) {
    left = x - tooltipWidth - 10;
    transformOrigin = 'top right';
  }

  // Adjust vertical position
  if (top + tooltipHeight > viewportHeight - 20) {
    top = y - tooltipHeight;
    transformOrigin = transformOrigin.replace('top', 'bottom');
  }

  // Ensure tooltip stays within bounds
  left = Math.max(10, Math.min(left, viewportWidth - tooltipWidth - 10));
  top = Math.max(10, Math.min(top, viewportHeight - tooltipHeight - 10));

  return {
    left: `${left}px`,
    top: `${top}px`,
    transformOrigin
  };
};

// ===== MAIN COMPONENT =====

export const HeatmapTooltip: React.FC<HeatmapTooltipProps> = ({
  data,
  type,
  position,
  categoryIcons,
  onClose,
  onAction,
  className = ''
}) => {
  // ===== STATE =====
  
  const [expandedSections, setExpandedSections] = useState({
    details: true,
    images: false,
    comments: false,
    history: false,
    analytics: false
  });
  
  const [imageIndex, setImageIndex] = useState(0);
  const tooltipRef = React.useRef<HTMLDivElement>(null) as React.RefObject<HTMLDivElement>;

  // ===== COMPUTED VALUES =====

  const positionStyle = useMemo(() => getPositionStyle(position), [position]);

  // ===== EVENT HANDLERS =====

  const handleSectionToggle = useCallback((section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  }, []);

  const handleAction = useCallback((action: string) => {
    onAction?.(action, data);
  }, [onAction, data]);

  const handleImageNavigation = useCallback((direction: 'prev' | 'next', totalImages: number) => {
    setImageIndex(prev => {
      if (direction === 'next') {
        return (prev + 1) % totalImages;
      } else {
        return prev === 0 ? totalImages - 1 : prev - 1;
      }
    });
  }, []);

  // Close on escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // ===== RENDER COMPONENTS =====

  const PointTooltip: React.FC<{ point: HeatmapDataPoint }> = ({ point }) => {
    const category = categoryIcons[point.metadata?.category || 'other'] || categoryIcons.other;
    const IconComponent = category.icon;
    const urgency = point.metadata?.urgency || 'low';
    const urgencyStyle = URGENCY_COLORS[urgency as keyof typeof URGENCY_COLORS] || URGENCY_COLORS.low;
    const status = point.metadata?.status || 'open';
    const statusStyle = STATUS_COLORS[status as keyof typeof STATUS_COLORS] || STATUS_COLORS.open;
    const dateInfo = formatDate(point.metadata?.timestamp);

    return (
      <div className="space-y-4">
        
        {/* Header */}
        <div className="flex items-start space-x-3">
          <div
            className="p-2 rounded-lg flex-shrink-0"
            style={{ backgroundColor: `${category.color}20` }}
          >
            <IconComponent
              className="w-5 h-5"
              style={{ color: category.color }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 truncate">
              {point.metadata?.issueType || category.label}
            </h3>
            <div className="flex items-center space-x-2 mt-1">
              <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${urgencyStyle.bg} ${urgencyStyle.text}`}>
                <div className={`w-2 h-2 ${urgencyStyle.dot} rounded-full mr-1`}></div>
                {urgency.toUpperCase()}
              </div>
              <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}>
                {statusStyle.label}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="bg-gray-50 p-2 rounded text-center">
            <div className="font-semibold text-gray-900">{point.value.toFixed(2)}</div>
            <div className="text-gray-600">Intensity</div>
          </div>
          <div className="bg-gray-50 p-2 rounded text-center">
            <div className="font-semibold text-gray-900">{point.metadata?.views || 0}</div>
            <div className="text-gray-600">Views</div>
          </div>
          <div className="bg-gray-50 p-2 rounded text-center">
            <div className="font-semibold text-gray-900">{point.metadata?.votes || 0}</div>
            <div className="text-gray-600">Votes</div>
          </div>
        </div>

        {/* Details Section */}
        <motion.div className="border border-gray-200 rounded-lg overflow-hidden">
          <motion.button
            onClick={() => handleSectionToggle('details')}
            className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center space-x-2">
              <MdInfo className="w-4 h-4 text-gray-600" />
              <span className="font-medium text-gray-900">Details</span>
            </div>
            {expandedSections.details ? <MdExpandLess /> : <MdExpandMore />}
          </motion.button>
          
          <AnimatePresence>
            {expandedSections.details && (
              <motion.div
                className="p-3 bg-white border-t border-gray-200"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div className="space-y-3">
                  
                  {/* Description */}
                  {point.metadata?.description && (
                    <div>
                      <div className="text-xs font-medium text-gray-700 mb-1">Description</div>
                      <div className="text-sm text-gray-600">
                        {point.metadata.description}
                      </div>
                    </div>
                  )}

                  {/* Location */}
                  <div className="flex items-start space-x-2">
                    <MdLocationOn className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div className="text-sm">
                      <div className="text-gray-900">
                        {point.metadata?.address || 'Address not available'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {point.coordinates.latitude.toFixed(6)}, {point.coordinates.longitude.toFixed(6)}
                      </div>
                    </div>
                  </div>

                  {/* Timestamp */}
                  <div className="flex items-center space-x-2">
                    <MdSchedule className="w-4 h-4 text-gray-400" />
                    <div className="text-sm">
                      <div className="text-gray-900">{dateInfo.relative}</div>
                      <div className="text-xs text-gray-500">
                        {dateInfo.date} at {dateInfo.time}
                      </div>
                    </div>
                  </div>

                  {/* Reporter Info */}
                  {point.metadata?.reporter && (
                    <div className="flex items-center space-x-2">
                      <MdPerson className="w-4 h-4 text-gray-400" />
                      <div className="text-sm">
                        <div className="text-gray-900">
                          {point.metadata.reporter.name || 'Anonymous User'}
                        </div>
                        {point.metadata.reporter.verified && (
                          <div className="text-xs text-green-600">✓ Verified</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Images Section */}
        {point.metadata?.images && Array.isArray(point.metadata.images) && point.metadata.images.length > 0 && (
          <motion.div className="border border-gray-200 rounded-lg overflow-hidden">
            <motion.button
              onClick={() => handleSectionToggle('images')}
              className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center space-x-2">
                <MdImage className="w-4 h-4 text-gray-600" />
                <span className="font-medium text-gray-900">
                  Images ({(point.metadata.images as string[]).length})
                </span>
              </div>
              {expandedSections.images ? <MdExpandLess /> : <MdExpandMore />}
            </motion.button>
            
            <AnimatePresence>
              {expandedSections.images && (
                <motion.div
                  className="p-3 bg-white border-t border-gray-200"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="relative">
                    <img
                      src={(point.metadata.images as string[])[imageIndex]}
                      alt={`Issue image ${imageIndex + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                      onError={(e) => {
                        e.currentTarget.src = '/api/placeholder/300/150';
                      }}
                    />
                    
                    {point.metadata.images.length > 1 && (
                      <div className="absolute inset-0 flex items-center justify-between px-2">
                        <button
                          onClick={() => handleImageNavigation('prev', (point.metadata.images as string[]).length)}
                          className="p-1 rounded-full bg-black bg-opacity-50 text-white hover:bg-opacity-70 transition-all"
                        >
                          ←
                        </button>
                        <button
                          onClick={() => handleImageNavigation('next', (point.metadata.images as string[]).length)}
                          className="p-1 rounded-full bg-black bg-opacity-50 text-white hover:bg-opacity-70 transition-all"
                        >
                          →
                        </button>
                      </div>
                    )}
                    
                    <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                      {imageIndex + 1} / {point.metadata.images.length}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Actions */}
        <div className="flex justify-between items-center pt-2 border-t border-gray-200">
          <div className="flex space-x-1">
            <motion.button
              onClick={() => handleAction('upvote')}
              className="flex items-center space-x-1 px-2 py-1 text-xs rounded bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <MdThumbUp className="w-3 h-3" />
              <span>{point.metadata?.upvotes || 0}</span>
            </motion.button>
            
            <motion.button
              onClick={() => handleAction('comment')}
              className="flex items-center space-x-1 px-2 py-1 text-xs rounded bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <MdComment className="w-3 h-3" />
              <span>{point.metadata?.comments || 0}</span>
            </motion.button>
          </div>
          
          <div className="flex space-x-1">
            <motion.button
              onClick={() => handleAction('share')}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <MdShare className="w-4 h-4" />
            </motion.button>
            
            <motion.button
              onClick={() => handleAction('flag')}
              className="p-1 text-gray-400 hover:text-red-500 transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <MdFlag className="w-4 h-4" />
            </motion.button>
            
            <motion.button
              onClick={() => handleAction('fullscreen')}
              className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <MdOpenInNew className="w-4 h-4" />
            </motion.button>
          </div>
        </div>
      </div>
    );
  };

  // Helper component for cluster category display
  const ClusterTooltipCategory: React.FC<{
    categoryKey: string;
    categoryIcons: Record<string, { icon: React.ComponentType<any>; color: string; label: string }>;
  }> = ({ categoryKey, categoryIcons }) => {
    const category = categoryIcons[categoryKey] || categoryIcons.other;
    const IconComponent = category.icon;
    return (
      <span className="inline-flex items-center px-2 py-1 rounded bg-gray-100 text-xs font-medium" style={{ color: category.color }}>
        <IconComponent className="w-3 h-3 mr-1" />
        {category.label}
      </span>
    );
  };

  const ClusterTooltip: React.FC<{ cluster: HeatmapCluster }> = ({ cluster }) => (
    <div className="space-y-4">
      
      {/* Header */}
      <div className="flex items-start space-x-3">
        <div className="p-2 rounded-lg bg-blue-50">
          <MdAnalytics className="w-5 h-5 text-blue-600" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">Issue Cluster</h3>
          <div className="text-sm text-gray-600">Multiple related issues</div>
        </div>
      </div>

      {/* Cluster Stats */}
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="bg-gray-50 p-2 rounded text-center">
          <div className="font-semibold text-gray-900">{cluster.pointCount}</div>
          <div className="text-gray-600">Issues</div>
        </div>
        <div className="bg-gray-50 p-2 rounded text-center">
          <div className="font-semibold text-gray-900">{cluster.averageIntensity?.toFixed(2) || '0.00'}</div>
          <div className="text-gray-600">Avg Intensity</div>
        </div>
        <div className="bg-gray-50 p-2 rounded text-center">
          <div className="font-semibold text-gray-900">{cluster.radius?.toFixed(0) || '0'}m</div>
          <div className="text-gray-600">Radius</div>
        </div>
      </div>

      {/* Location */}
      <div className="flex items-start space-x-2">
        <MdLocationOn className="w-4 h-4 text-gray-400 mt-0.5" />
        <div className="text-sm">
          <div className="text-gray-900">Cluster Center</div>
          <div className="text-xs text-gray-500">
            {cluster.center.latitude.toFixed(6)}, {cluster.center.longitude.toFixed(6)}
          </div>
        </div>
      </div>

      {/* Categories */}
      {cluster.metadata?.categories && (
        <div>
          <div className="text-xs font-medium text-gray-700 mb-2">Issue Types</div>
          <div className="flex flex-wrap gap-1">
            {(cluster.metadata.categories as string[]).map((categoryKey: string, index: number) => (
              <ClusterTooltipCategory
                key={index}
                categoryKey={categoryKey}
                categoryIcons={categoryIcons}
              />
            ))}
          </div>
        </div>
      )}

      {/* Action */}
      <div className="pt-2 border-t border-gray-200">
        <motion.button
          onClick={() => handleAction('explore')}
          className="w-full flex items-center justify-center space-x-2 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <MdAnalytics className="w-4 h-4" />
          <span>Explore Cluster</span>
        </motion.button>
      </div>
    </div>
  );

  const AnomalyTooltip: React.FC<{ anomaly: HeatmapAnomaly }> = ({ anomaly }) => (
    <div className="space-y-4">
      
      {/* Header */}
      <div className="flex items-start space-x-3">
        <div className="p-2 rounded-lg bg-red-50">
          <MdWarning className="w-5 h-5 text-red-600" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">Anomaly Detected</h3>
          <div className="text-sm text-gray-600">Unusual pattern identified</div>
        </div>
      </div>

      {/* Anomaly Stats */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-red-50 p-2 rounded text-center">
          <div className="font-semibold text-red-900">{anomaly.score?.toFixed(3) || '0.000'}</div>
          <div className="text-red-700">Anomaly Score</div>
        </div>
        <div className="bg-orange-50 p-2 rounded text-center">
          <div className="font-semibold text-orange-900">{anomaly.type || 'Unknown'}</div>
          <div className="text-orange-700">Type</div>
        </div>
      </div>

      {/* Detection Info */}
      <div className="space-y-2 text-sm">
        <div className="flex items-center space-x-2">
          <MdSchedule className="w-4 h-4 text-gray-400" />
          <div>
            <div className="text-gray-900">Detected</div>
            <div className="text-xs text-gray-500">
              {formatDate(anomaly.detectedAt).relative}
            </div>
          </div>
        </div>
        
        <div className="flex items-start space-x-2">
          <MdLocationOn className="w-4 h-4 text-gray-400 mt-0.5" />
          <div>
            <div className="text-gray-900">Location</div>
            <div className="text-xs text-gray-500">
              {anomaly.center.latitude.toFixed(6)}, {anomaly.center.longitude.toFixed(6)}
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      {anomaly.description && (
        <div className="p-2 bg-yellow-50 border-l-4 border-yellow-400 text-sm">
          <div className="font-medium text-yellow-900 mb-1">Analysis</div>
          <div className="text-yellow-800">{anomaly.description}</div>
        </div>
      )}

      {/* Action */}
      <div className="pt-2 border-t border-gray-200">
        <motion.button
          onClick={() => handleAction('investigate')}
          className="w-full flex items-center justify-center space-x-2 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <MdWarning className="w-4 h-4" />
          <span>Investigate Anomaly</span>
        </motion.button>
      </div>
    </div>
  );

  // ===== MAIN RENDER =====

  return (
    <AnimatePresence>
      <motion.div
        ref={tooltipRef}
        className={`fixed z-50 bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden ${className}`}
        style={{
          ...positionStyle,
          maxWidth: '320px',
          maxHeight: '80vh'
        }}
        initial={{ opacity: 0, scale: 0.8, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: 10 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            {type === 'point' && <MdLocationOn className="w-4 h-4 text-blue-600" />}
            {type === 'cluster' && <MdAnalytics className="w-4 h-4 text-blue-600" />}
            {type === 'anomaly' && <MdWarning className="w-4 h-4 text-red-600" />}
            <span className="font-medium text-gray-900 capitalize">
              {type} Details
            </span>
          </div>
          <motion.button
            onClick={onClose}
            className="p-1 hover:bg-gray-200 rounded-full transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <MdClose className="w-4 h-4 text-gray-600" />
          </motion.button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto" style={{ maxHeight: 'calc(80vh - 60px)' }}>
          <div className="p-4">
            {type === 'point' && data && 'coordinates' in data && (
              <PointTooltip point={data as HeatmapDataPoint} />
            )}
            {type === 'cluster' && data && 'pointCount' in data && (
              <ClusterTooltip cluster={data as HeatmapCluster} />
            )}
            {type === 'anomaly' && data && 'score' in data && (
              <AnomalyTooltip anomaly={data as HeatmapAnomaly} />
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default HeatmapTooltip;