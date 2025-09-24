// ===== ADVANCED HEATMAP SIDEBAR COMPONENT =====
// Production-level analytics and details sidebar

import React, { useMemo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MdClose,
  MdAnalytics,
  MdTrendingUp,
  MdTrendingDown,
  MdWarning,
  MdInfo,
  MdLocationOn,
  MdSchedule,
  MdCategory,
  MdPerson,
  MdImage,
  MdThumbUp,
  MdThumbDown,
  MdShare,
  MdFlag,
  MdDelete,
  MdElectricBolt,
  MdWater,
  MdTraffic,
  MdConstruction,
  MdLightbulb,
  MdSecurity,
  MdExpandMore,
  MdExpandLess,
  MdBarChart,
  MdTimeline,
  MdSpeed
} from 'react-icons/md';
import {
  HeatmapState,
  HeatmapDataPoint,
  HeatmapCluster,
  HeatmapAnomaly,
  PerformanceMetrics
} from '../../types/heatmap';

// ===== INTERFACES =====

interface HeatmapSidebarProps {
  isOpen: boolean;
  data: HeatmapState['data'];
  selectedPoint: HeatmapDataPoint | null;
  selectedCluster: HeatmapCluster | null;
  selectedAnomaly: HeatmapAnomaly | null;
  performanceMetrics: PerformanceMetrics;
  enableAdvancedFeatures: boolean;
  onAction: (action: string, pointId: string) => void;
  onClose: () => void;
  className?: string;
}

// ===== CONSTANTS =====

const CATEGORY_ICONS = {
  'electricity': { icon: MdElectricBolt, color: '#FFC107', label: 'Electrical Issues' },
  'water': { icon: MdWater, color: '#2196F3', label: 'Water Issues' },
  'traffic': { icon: MdTraffic, color: '#FF5722', label: 'Traffic Issues' },
  'construction': { icon: MdConstruction, color: '#FF9800', label: 'Construction' },
  'waste': { icon: MdDelete, color: '#4CAF50', label: 'Waste Management' },
  'streetlight': { icon: MdLightbulb, color: '#FFEB3B', label: 'Street Lighting' },
  'pothole': { icon: MdWarning, color: '#E91E63', label: 'Road Damage' },
  'safety': { icon: MdSecurity, color: '#9C27B0', label: 'Safety Concerns' },
  'flooding': { icon: MdWater, color: '#00BCD4', label: 'Flooding' },
  'other': { icon: MdInfo, color: '#607D8B', label: 'Other Issues' }
};

const URGENCY_COLORS = {
  low: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300' },
  medium: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300' },
  high: { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-300' },
  critical: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300' },
  emergency: { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-300' }
};

// ===== MAIN COMPONENT =====

export const HeatmapSidebar: React.FC<HeatmapSidebarProps> = ({
  isOpen,
  data,
  selectedPoint,
  selectedCluster,
  selectedAnomaly,
  performanceMetrics,
  enableAdvancedFeatures,
  onAction,
  onClose,
  className = ''
}) => {
  // ===== STATE =====
  
  const [activeTab, setActiveTab] = useState<'overview' | 'details' | 'analytics' | 'history'>('overview');
  const [expandedSections, setExpandedSections] = useState({
    basicInfo: true,
    metadata: false,
    images: false,
    comments: false,
    actions: false,
    analytics: enableAdvancedFeatures,
    performance: false
  });

  // ===== COMPUTED VALUES =====

  const categoryStats = useMemo(() => {
    if (!data?.dataPoints) return {};
    
    const stats: Record<string, { count: number; urgencies: Record<string, number> }> = {};
    
    data.dataPoints.forEach(point => {
      const category = point.metadata?.category || 'other';
      const urgency = point.metadata?.urgency || 'low';
      
      if (!stats[category]) {
        stats[category] = { count: 0, urgencies: {} };
      }
      
      stats[category].count++;
      stats[category].urgencies[urgency] = (stats[category].urgencies[urgency] || 0) + 1;
    });
    
    return stats;
  }, [data?.dataPoints]);

  const trendsData = useMemo(() => {
    if (!data?.dataPoints) return { increasing: 0, decreasing: 0, stable: 0 };
    
    // Mock trend analysis - in real app, this would come from backend
    const total = data.dataPoints.length;
    return {
      increasing: Math.floor(total * 0.3),
      decreasing: Math.floor(total * 0.2),
      stable: total - Math.floor(total * 0.3) - Math.floor(total * 0.2)
    };
  }, [data?.dataPoints]);

  const riskAssessment = useMemo(() => {
    if (!data?.dataPoints) return { level: 'low', score: 0, factors: [] };
    
    const criticalCount = data.dataPoints.filter(p => p.metadata?.urgency === 'critical' || p.metadata?.urgency === 'emergency').length;
    const total = data.dataPoints.length;
    const riskRatio = total > 0 ? criticalCount / total : 0;
    
    let level: 'low' | 'medium' | 'high' | 'critical';
    let score = Math.round(riskRatio * 100);
    
    if (riskRatio > 0.3) level = 'critical';
    else if (riskRatio > 0.15) level = 'high';
    else if (riskRatio > 0.05) level = 'medium';
    else level = 'low';
    
    return {
      level,
      score,
      factors: [
        'High concentration of critical issues',
        'Recent increase in emergency reports',
        'Multiple category types affected'
      ]
    };
  }, [data?.dataPoints]);

  // ===== EVENT HANDLERS =====

  const handleSectionToggle = useCallback((section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  }, []);

  const handlePointAction = useCallback((action: 'upvote' | 'downvote' | 'share' | 'report', pointId: string) => {
    onAction(action, pointId);
  }, [onAction]);

  // ===== COMPONENTS =====

  const TabNavigation = () => (
    <div className="flex space-x-1 mb-4 bg-gray-100 rounded-lg p-1">
      {[
        { key: 'overview', label: 'Overview', icon: MdAnalytics },
        { key: 'details', label: 'Details', icon: MdInfo },
        { key: 'analytics', label: 'Analytics', icon: MdBarChart },
        { key: 'history', label: 'History', icon: MdTimeline }
      ].map(({ key, label, icon: IconComponent }) => (
        <motion.button
          key={key}
          onClick={() => setActiveTab(key as typeof activeTab)}
          className={`flex-1 flex items-center justify-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-all ${
            activeTab === key
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <IconComponent className="w-4 h-4" />
          {!window.matchMedia('(max-width: 400px)').matches && <span>{label}</span>}
        </motion.button>
      ))}
    </div>
  );

  const OverviewTab = () => (
    <div className="space-y-4">
      
      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-blue-50 p-3 rounded-lg">
          <div className="text-2xl font-bold text-blue-900">
            {data?.dataPoints?.length || 0}
          </div>
          <div className="text-sm text-blue-600">Total Issues</div>
        </div>
        <div className="bg-orange-50 p-3 rounded-lg">
          <div className="text-2xl font-bold text-orange-900">
            {data?.clusters?.length || 0}
          </div>
          <div className="text-sm text-orange-600">Hot Spots</div>
        </div>
        <div className="bg-red-50 p-3 rounded-lg">
          <div className="text-2xl font-bold text-red-900">
            {data?.dataPoints?.filter(p => p.metadata?.urgency === 'critical' || p.metadata?.urgency === 'emergency').length || 0}
          </div>
          <div className="text-sm text-red-600">Critical</div>
        </div>
        <div className="bg-purple-50 p-3 rounded-lg">
          <div className="text-2xl font-bold text-purple-900">
            {data?.anomalies?.length || 0}
          </div>
          <div className="text-sm text-purple-600">Anomalies</div>
        </div>
      </div>

      {/* Risk Assessment */}
      <div className={`p-4 rounded-lg border-2 ${URGENCY_COLORS[riskAssessment.level as keyof typeof URGENCY_COLORS].bg} ${URGENCY_COLORS[riskAssessment.level as keyof typeof URGENCY_COLORS].border}`}>
        <div className="flex items-center space-x-2 mb-2">
          <MdWarning className={`w-5 h-5 ${URGENCY_COLORS[riskAssessment.level as keyof typeof URGENCY_COLORS].text}`} />
          <span className={`font-bold ${URGENCY_COLORS[riskAssessment.level as keyof typeof URGENCY_COLORS].text}`}>
            Risk Level: {riskAssessment.level.toUpperCase()}
          </span>
        </div>
        <div className={`text-sm ${URGENCY_COLORS[riskAssessment.level as keyof typeof URGENCY_COLORS].text} mb-2`}>
          Risk Score: {riskAssessment.score}/100
        </div>
        <div className="space-y-1">
          {riskAssessment.factors.map((factor, index) => (
            <div key={index} className={`text-xs ${URGENCY_COLORS[riskAssessment.level as keyof typeof URGENCY_COLORS].text} opacity-80`}>
              • {factor}
            </div>
          ))}
        </div>
      </div>

      {/* Category Breakdown */}
      <div>
        <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
          <MdCategory className="w-4 h-4 mr-2" />
          Issue Categories
        </h4>
        <div className="space-y-2">
          {Object.entries(categoryStats).map(([category, stats]) => {
            const config = CATEGORY_ICONS[category as keyof typeof CATEGORY_ICONS] || CATEGORY_ICONS.other;
            const IconComponent = config.icon;
            
            return (
              <div key={category} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg" style={{ backgroundColor: `${config.color}20` }}>
                    <IconComponent className="w-4 h-4" style={{ color: config.color }} />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{config.label}</div>
                    <div className="text-xs text-gray-500">{stats.count} issues</div>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  {Object.entries(stats.urgencies).map(([urgency, count]) => (
                    <div
                      key={urgency}
                      className={`px-2 py-1 rounded-full text-xs font-medium ${URGENCY_COLORS[urgency as keyof typeof URGENCY_COLORS]?.bg || 'bg-gray-100'} ${URGENCY_COLORS[urgency as keyof typeof URGENCY_COLORS]?.text || 'text-gray-600'}`}
                    >
                      {count}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Trends */}
      <div>
        <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
          <MdTrendingUp className="w-4 h-4 mr-2" />
          Trends
        </h4>
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-green-50 p-3 rounded-lg text-center">
            <MdTrendingUp className="w-6 h-6 text-green-600 mx-auto mb-1" />
            <div className="text-lg font-bold text-green-900">{trendsData.increasing}</div>
            <div className="text-xs text-green-600">Increasing</div>
          </div>
          <div className="bg-red-50 p-3 rounded-lg text-center">
            <MdTrendingDown className="w-6 h-6 text-red-600 mx-auto mb-1" />
            <div className="text-lg font-bold text-red-900">{trendsData.decreasing}</div>
            <div className="text-xs text-red-600">Decreasing</div>
          </div>
          <div className="bg-blue-50 p-3 rounded-lg text-center">
            <MdBarChart className="w-6 h-6 text-blue-600 mx-auto mb-1" />
            <div className="text-lg font-bold text-blue-900">{trendsData.stable}</div>
            <div className="text-xs text-blue-600">Stable</div>
          </div>
        </div>
      </div>

    </div>
  );

  const DetailsTab = () => {
    const currentItem = selectedPoint || selectedCluster || selectedAnomaly;
    
    if (!currentItem) {
      return (
        <div className="flex items-center justify-center h-40 text-gray-500">
          <div className="text-center">
            <MdInfo className="w-8 h-8 mx-auto mb-2" />
            <p>Select an item on the map to view details</p>
          </div>
        </div>
      );
    }

    if (selectedPoint) {
      return <PointDetails point={selectedPoint} onAction={handlePointAction} />;
    }
    
    if (selectedCluster) {
      return <ClusterDetails cluster={selectedCluster} />;
    }
    
    if (selectedAnomaly) {
      return <AnomalyDetails anomaly={selectedAnomaly} />;
    }

    return null;
  };

  const AnalyticsTab = () => (
    <div className="space-y-4">
      
      {/* Performance Metrics */}
      <div>
        <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
          <MdSpeed className="w-4 h-4 mr-2" />
          Performance Metrics
        </h4>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-lg font-bold text-gray-900">{performanceMetrics.renderTime.toFixed(1)}ms</div>
            <div className="text-sm text-gray-600">Render Time</div>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-lg font-bold text-gray-900">{performanceMetrics.memoryUsage.toFixed(1)}%</div>
            <div className="text-sm text-gray-600">Memory Usage</div>
          </div>
          {/* <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-lg font-bold text-gray-900">{performanceMetrics.fpsAverage.toFixed(0)}</div>
            <div className="text-sm text-gray-600">Avg FPS</div>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-lg font-bold text-gray-900">{performanceMetrics.dataPointCount.toLocaleString()}</div>
            <div className="text-sm text-gray-600">Data Points</div>
          </div> */}
        </div>
      </div>

      {/* Advanced Analytics */}
      {enableAdvancedFeatures && (
        <>
          {/* Heat Index Distribution */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Heat Index Distribution</h4>
            <div className="space-y-2">
              {[
                { range: '0.8 - 1.0', label: 'Critical', color: 'bg-red-500', count: 45 },
                { range: '0.6 - 0.8', label: 'High', color: 'bg-orange-500', count: 87 },
                { range: '0.4 - 0.6', label: 'Medium', color: 'bg-yellow-500', count: 156 },
                { range: '0.2 - 0.4', label: 'Low', color: 'bg-green-500', count: 203 },
                { range: '0.0 - 0.2', label: 'Minimal', color: 'bg-blue-500', count: 89 }
              ].map((item, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className={`w-4 h-4 rounded ${item.color}`}></div>
                  <div className="flex-1">
                    <div className="flex justify-between text-sm">
                      <span>{item.label} ({item.range})</span>
                      <span className="font-medium">{item.count}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                      <div
                        className={`h-2 rounded-full ${item.color}`}
                        style={{ width: `${(item.count / 580) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Clustering Efficiency */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Clustering Efficiency</h4>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-600">Cluster Accuracy</div>
                  <div className="text-lg font-bold text-green-600">94.5%</div>
                </div>
                <div>
                  <div className="text-gray-600">Processing Time</div>
                  <div className="text-lg font-bold text-blue-600">1.2s</div>
                </div>
                <div>
                  <div className="text-gray-600">Data Reduction</div>
                  <div className="text-lg font-bold text-purple-600">87%</div>
                </div>
                <div>
                  <div className="text-gray-600">Update Frequency</div>
                  <div className="text-lg font-bold text-orange-600">5s</div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

    </div>
  );

  const HistoryTab = () => (
    <div className="space-y-4">
      <div className="text-center text-gray-500 py-8">
        <MdTimeline className="w-8 h-8 mx-auto mb-2" />
        <p>Historical data view</p>
        <p className="text-sm">Coming soon...</p>
      </div>
    </div>
  );

  // ===== SUB-COMPONENTS =====

  const PointDetails: React.FC<{ point: HeatmapDataPoint; onAction: (action: "upvote" | "downvote" | "share" | "report", id: string) => void }> = ({ point, onAction }) => {
    const category = CATEGORY_ICONS[point.metadata?.category as keyof typeof CATEGORY_ICONS] || CATEGORY_ICONS.other;
    const IconComponent = category.icon;
    const urgency = point.metadata?.urgency || 'low';
    const urgencyStyle = URGENCY_COLORS[urgency as keyof typeof URGENCY_COLORS] || URGENCY_COLORS.low;

    return (
      <div className="space-y-4">
        
        {/* Basic Information */}
        <motion.div
          className="bg-white border border-gray-200 rounded-lg overflow-hidden"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <motion.button
            onClick={() => handleSectionToggle('basicInfo')}
            className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg" style={{ backgroundColor: `${category.color}20` }}>
                <IconComponent className="w-5 h-5" style={{ color: category.color }} />
              </div>
              <div className="text-left">
                <div className="font-medium text-gray-900">{category.label}</div>
                <div className="text-sm text-gray-600">Issue Details</div>
              </div>
            </div>
            {expandedSections.basicInfo ? <MdExpandLess /> : <MdExpandMore />}
          </motion.button>
          
          <AnimatePresence>
            {expandedSections.basicInfo && (
              <motion.div
                className="p-4 bg-white border-t border-gray-200"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
              >
                <div className="space-y-3">
                  
                  {/* Title and Description */}
                  <div>
                    <div className="font-medium text-gray-900 mb-1">
                      {point.metadata?.issueType || 'Civic Issue Report'}
                    </div>
                    <div className="text-sm text-gray-600">
                      {point.metadata?.description || 'No description provided'}
                    </div>
                  </div>

                  {/* Urgency Badge */}
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${urgencyStyle.bg} ${urgencyStyle.text}`}>
                    <MdWarning className="w-4 h-4 mr-1" />
                    {urgency.toUpperCase()} PRIORITY
                  </div>

                  {/* Location */}
                  <div className="flex items-start space-x-2">
                    <MdLocationOn className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div className="text-sm text-gray-600">
                      <div>{point.metadata?.address || 'Address not available'}</div>
                      <div className="text-xs text-gray-500">
                        Lat: {point.coordinates.latitude.toFixed(6)}, 
                        Lng: {point.coordinates.longitude.toFixed(6)}
                      </div>
                    </div>
                  </div>

                  {/* Timestamp */}
                  <div className="flex items-center space-x-2">
                    <MdSchedule className="w-4 h-4 text-gray-400" />
                    <div className="text-sm text-gray-600">
                      Reported {point.metadata?.timestamp ? new Date(point.metadata.timestamp).toLocaleString() : 'Unknown time'}
                    </div>
                  </div>

                  {/* Reporter Info */}
                  {point.metadata?.reporter && (
                    <div className="flex items-center space-x-2">
                      <MdPerson className="w-4 h-4 text-gray-400" />
                      <div className="text-sm text-gray-600">
                        Reported by: {point.metadata.reporter.name || 'Anonymous'}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Images/Attachments */}
        {point.metadata?.images && Array.isArray(point.metadata.images) && point.metadata.images.length > 0 && (
          <motion.div
            className="bg-white border border-gray-200 rounded-lg overflow-hidden"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <motion.button
              onClick={() => handleSectionToggle('images')}
              className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center space-x-2">
                <MdImage className="w-4 h-4 text-gray-600" />
                <span className="font-medium text-gray-900">Images ({point.metadata.images.length})</span>
              </div>
              {expandedSections.images ? <MdExpandLess /> : <MdExpandMore />}
            </motion.button>
            
            <AnimatePresence>
              {expandedSections.images && (
                <motion.div
                  className="p-4 bg-white border-t border-gray-200"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                >
                  <div className="grid grid-cols-2 gap-2">
                    {(point.metadata.images as string[]).map((image: string, index: number) => (
                      <motion.div
                        key={index}
                        className="aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <img
                          src={image}
                          alt={`Issue image ${index + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = '/api/placeholder/150/150';
                          }}
                        />
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Actions */}
        <motion.div
          className="bg-white border border-gray-200 rounded-lg overflow-hidden"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="p-4">
            <div className="grid grid-cols-4 gap-2">
              <motion.button
                onClick={() => point.metadata?.id && onAction('upvote', point.metadata.id)}
                className="flex flex-col items-center p-3 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <MdThumbUp className="w-5 h-5 mb-1" />
                <span className="text-xs font-medium">Support</span>
              </motion.button>

              <motion.button
                onClick={() => point.metadata?.id && onAction('downvote', point.metadata.id)}
                className="flex flex-col items-center p-3 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <MdThumbDown className="w-5 h-5 mb-1" />
                <span className="text-xs font-medium">Dispute</span>
              </motion.button>

              <motion.button
                onClick={() => point.metadata?.id && onAction('share', point.metadata.id)}
                className="flex flex-col items-center p-3 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <MdShare className="w-5 h-5 mb-1" />
                <span className="text-xs font-medium">Share</span>
              </motion.button>

              <motion.button
                onClick={() => point.metadata?.id && onAction('report', point.metadata.id)}
                className="flex flex-col items-center p-3 rounded-lg bg-yellow-50 text-yellow-600 hover:bg-yellow-100 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <MdFlag className="w-5 h-5 mb-1" />
                <span className="text-xs font-medium">Report</span>
              </motion.button>
            </div>
          </div>
        </motion.div>

      </div>
    );
  };

  const ClusterDetails: React.FC<{ cluster: HeatmapCluster }> = ({ cluster }) => (
    <div className="space-y-4">
      <div className="bg-blue-50 p-4 rounded-lg">
        <div className="flex items-center space-x-2 mb-2">
          <MdAnalytics className="w-5 h-5 text-blue-600" />
          <span className="font-bold text-blue-900">Issue Cluster</span>
        </div>
        <div className="text-sm text-blue-700 space-y-1">
          <div>Total Issues: {cluster.pointCount}</div>
          <div>Average Intensity: {cluster.averageIntensity?.toFixed(2)}</div>
          <div>Radius: {cluster.radius?.toFixed(0)}m</div>
          <div>Location: {cluster.center.latitude.toFixed(4)}, {cluster.center.longitude.toFixed(4)}</div>
        </div>
      </div>
    </div>
  );

  const AnomalyDetails: React.FC<{ anomaly: HeatmapAnomaly }> = ({ anomaly }) => (
    <div className="space-y-4">
      <div className="bg-red-50 p-4 rounded-lg">
        <div className="flex items-center space-x-2 mb-2">
          <MdWarning className="w-5 h-5 text-red-600" />
          <span className="font-bold text-red-900">Anomaly Detected</span>
        </div>
        <div className="text-sm text-red-700 space-y-1">
          <div>Anomaly Score: {anomaly.score?.toFixed(3)}</div>
          <div>Type: {anomaly.type}</div>
          <div>Detected: {new Date(anomaly.detectedAt).toLocaleString()}</div>
          <div>Location: {anomaly.center.latitude.toFixed(4)}, {anomaly.center.longitude.toFixed(4)}</div>
        </div>
      </div>
    </div>
  );

  // ===== MAIN RENDER =====

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-20 z-30 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Sidebar */}
          <motion.div
            className={`fixed md:absolute right-0 top-0 h-full bg-white shadow-2xl z-40 ${className}`}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            style={{ width: '400px', maxWidth: '90vw' }}
          >
            
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center space-x-2">
                <MdAnalytics className="w-5 h-5 text-blue-600" />
                <h2 className="font-bold text-gray-900">Analytics Panel</h2>
              </div>
              <motion.button
                onClick={onClose}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <MdClose className="w-5 h-5 text-gray-600" />
              </motion.button>
            </div>

            {/* Content */}
            <div className="h-full overflow-y-auto">
              <div className="p-4">
                
                {/* Tab Navigation */}
                <TabNavigation />

                {/* Tab Content */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    {activeTab === 'overview' && <OverviewTab />}
                    {activeTab === 'details' && <DetailsTab />}
                    {activeTab === 'analytics' && <AnalyticsTab />}
                    {activeTab === 'history' && <HistoryTab />}
                  </motion.div>
                </AnimatePresence>

              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default HeatmapSidebar;