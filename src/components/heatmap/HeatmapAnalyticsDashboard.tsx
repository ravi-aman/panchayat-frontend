// ===== HEATMAP ANALYTICS DASHBOARD =====
// Advanced analytics dashboard for heatmap data visualization and insights

import React, { useState, useMemo } from 'react';
import {
  RegionBounds,
  HeatmapDataPoint,
  HeatmapCluster,
  HeatmapAnomaly
} from '../../types/heatmap';
import { useHeatmapData } from '../../hooks/useHeatmapData';
import { useHeatmapAnalytics, usePredictiveHeatmap } from '../../hooks/useHeatmapData';

// ===== ANALYTICS INTERFACES =====

interface AnalyticsDashboardProps {
  bounds: RegionBounds;
  timeRange: { start: Date; end: Date };
  enablePredictions?: boolean;
  enableTrends?: boolean;
  enableAnomalyDetection?: boolean;
  onInsightClick?: (insight: any) => void;
  className?: string;
}

interface AnalyticsMetrics {
  totalDataPoints: number;
  totalClusters: number;
  totalAnomalies: number;
  averageIntensity: number;
  maxIntensity: number;
  trendDirection: 'up' | 'down' | 'stable';
  changePercentage: number;
}

interface TrendData {
  timestamp: Date;
  value: number;
  category?: string;
}

// ===== UTILITY FUNCTIONS =====

const calculateMetrics = (
  dataPoints: HeatmapDataPoint[],
  clusters: HeatmapCluster[],
  anomalies: HeatmapAnomaly[]
): AnalyticsMetrics => {
  const totalDataPoints = dataPoints?.length || 0;
  const totalClusters = clusters?.length || 0;
  const totalAnomalies = anomalies?.length || 0;
  
  const intensities = dataPoints?.map(point => {
    const value = point.value;
    return typeof value === 'number' ? value : 
           typeof value === 'string' && !isNaN(Number(value)) ? Number(value) : 0;
  }) || [];
  const averageIntensity = intensities.length > 0 
    ? intensities.reduce((sum, val) => sum + val, 0) / intensities.length 
    : 0;
  const maxIntensity = intensities.length > 0 ? Math.max(...intensities) : 0;

  return {
    totalDataPoints,
    totalClusters,
    totalAnomalies,
    averageIntensity: Math.round(averageIntensity * 100) / 100,
    maxIntensity,
    trendDirection: 'stable', // Would be calculated from historical data
    changePercentage: 0 // Would be calculated from historical data
  };
};

const generateTrendData = (dataPoints: HeatmapDataPoint[]): TrendData[] => {
  if (!dataPoints || dataPoints.length === 0) return [];
  
  // Group data by hour for trend analysis
  const hourlyData = new Map<string, number[]>();
  
  dataPoints.forEach(point => {
    const timestamp = point.metadata?.timestamp || new Date().toISOString();
    const hour = new Date(timestamp).toISOString().slice(0, 13); // YYYY-MM-DDTHH
    if (!hourlyData.has(hour)) {
      hourlyData.set(hour, []);
    }
    const value = point.value;
    const numValue = typeof value === 'number' ? value : 
                     typeof value === 'string' && !isNaN(Number(value)) ? Number(value) : 0;
    hourlyData.get(hour)!.push(numValue);
  });

  return Array.from(hourlyData.entries())
    .map(([hour, values]) => ({
      timestamp: new Date(hour + ':00:00Z'),
      value: values.reduce((sum, val) => sum + val, 0) / values.length
    }))
    .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
    .slice(-24); // Last 24 hours
};

// ===== CHART COMPONENTS =====

const MetricCard: React.FC<{
  title: string;
  value: string | number;
  change?: number;
  icon?: string;
  color?: string;
}> = ({ title, value, change, color = 'blue' }) => (
  <div className={`bg-white p-4 rounded-lg shadow border-l-4 border-${color}-500`}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
      {change !== undefined && (
        <div className={`flex items-center ${
          change >= 0 ? 'text-green-600' : 'text-red-600'
        }`}>
          <span className="text-sm font-medium">
            {change >= 0 ? '+' : ''}{change}%
          </span>
        </div>
      )}
    </div>
  </div>
);

const TrendChart: React.FC<{
  data: TrendData[];
  title: string;
  color?: string;
}> = ({ data, title, color = 'blue' }) => {
  const maxValue = Math.max(...data.map(d => d.value));
  const minValue = Math.min(...data.map(d => d.value));
  const range = maxValue - minValue || 1;

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <div className="h-48 relative">
        <svg className="w-full h-full">
          <polyline
            fill="none"
            stroke={`var(--color-${color}-500)`}
            strokeWidth="2"
            points={data.map((point, index) => {
              const x = (index / (data.length - 1)) * 100;
              const y = 100 - ((point.value - minValue) / range) * 100;
              return `${x},${y}`;
            }).join(' ')}
          />
          {data.map((point, index) => {
            const x = (index / (data.length - 1)) * 100;
            const y = 100 - ((point.value - minValue) / range) * 100;
            return (
              <circle
                key={index}
                cx={`${x}%`}
                cy={`${y}%`}
                r="3"
                fill={`var(--color-${color}-500)`}
              />
            );
          })}
        </svg>
        <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-gray-500">
          <span>{data[0]?.timestamp.toLocaleDateString()}</span>
          <span>{data[data.length - 1]?.timestamp.toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
};

const AnomalyList: React.FC<{
  anomalies: HeatmapAnomaly[];
  onAnomalyClick?: (anomaly: HeatmapAnomaly) => void;
}> = ({ anomalies, onAnomalyClick }) => (
  <div className="bg-white p-4 rounded-lg shadow">
    <h3 className="text-lg font-semibold mb-4">Recent Anomalies</h3>
    <div className="space-y-2 max-h-48 overflow-y-auto">
      {anomalies.length === 0 ? (
        <p className="text-gray-500 text-sm">No anomalies detected</p>
      ) : (
        anomalies.slice(0, 5).map((anomaly, index) => (
          <div
            key={anomaly.location?.coordinates?.join(',') || index}
            className="p-3 border rounded cursor-pointer hover:bg-gray-50"
            onClick={() => onAnomalyClick?.(anomaly)}
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium text-sm">Anomaly Detection</p>
                <p className="text-xs text-gray-600">
                  Severity: {anomaly.severity} | Confidence: {Math.round((anomaly.confidence || 0) * 100)}%
                </p>
              </div>
              <span className={`px-2 py-1 text-xs rounded ${
                (typeof anomaly.severity === 'string' ? 
                  anomaly.severity === 'high' || anomaly.severity === 'critical' : 
                  Number(anomaly.severity) >= 0.8) ? 'bg-red-100 text-red-800' :
                (typeof anomaly.severity === 'string' ? 
                  anomaly.severity === 'medium' : 
                  Number(anomaly.severity) >= 0.6) ? 'bg-yellow-100 text-yellow-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                {new Date().toLocaleDateString()}
              </span>
            </div>
          </div>
        ))
      )}
    </div>
  </div>
);

const ClusterAnalysis: React.FC<{
  clusters: HeatmapCluster[];
  onClusterClick?: (cluster: HeatmapCluster) => void;
}> = ({ clusters, onClusterClick }) => (
  <div className="bg-white p-4 rounded-lg shadow">
    <h3 className="text-lg font-semibold mb-4">Cluster Analysis</h3>
    <div className="space-y-3">
      {clusters.length === 0 ? (
        <p className="text-gray-500 text-sm">No clusters detected</p>
      ) : (
        clusters.slice(0, 3).map((cluster, index) => (
          <div
            key={cluster.centroid?.coordinates?.join(',') || index}
            className="p-3 border rounded cursor-pointer hover:bg-gray-50"
            onClick={() => onClusterClick?.(cluster)}
          >
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium text-sm">
                  Cluster {index + 1}
                </p>
                <p className="text-xs text-gray-600">
                  {cluster.points?.length || 0} points | Density: {Math.round((cluster.density || 0) * 100)}%
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">
                  Strength: {Math.round((cluster.strength || 0) * 100) / 100}
                </p>
                <p className="text-xs text-gray-500">
                  Radius: {cluster.radius?.toFixed(2) || 'N/A'} km
                </p>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  </div>
);

// ===== MAIN DASHBOARD COMPONENT =====

export const HeatmapAnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  bounds,
  timeRange,
  enablePredictions = false,
  enableTrends = true,
  enableAnomalyDetection = true,
  onInsightClick,
  className = ''
}) => {
  // ===== STATE =====
  const [selectedTimeframe, setSelectedTimeframe] = useState<'1h' | '24h' | '7d' | '30d'>('24h');
  const [selectedMetric, setSelectedMetric] = useState<'intensity' | 'count' | 'density'>('intensity');

  // ===== HOOKS =====
  const { state } = useHeatmapData({
    bounds,
    config: {
      analytics: {
        enableTrends,
        enableAnomalyDetection,
        enableClustering: true,
        enablePredictions,
        historicalDepth: 30,
        refreshInterval: 300000
      }
    }
  });

  const { data: _analyticsData } = useHeatmapAnalytics(bounds, timeRange);
  const { data: predictiveData } = usePredictiveHeatmap(bounds, '1day', 0.7);

  // ===== COMPUTED VALUES =====
  const metrics = useMemo(() => {
    if (!state.data) return null;
    return calculateMetrics(
      state.data.dataPoints || [],
      state.data.clusters || [],
      state.data.anomalies || []
    );
  }, [state.data]);

  const trendData = useMemo(() => {
    if (!state.data?.dataPoints) return [];
    return generateTrendData(state.data.dataPoints);
  }, [state.data?.dataPoints]);

  // ===== RENDER =====
  return (
    <div className={`analytics-dashboard space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Heatmap Analytics</h2>
        <div className="flex space-x-2">
          <select
            value={selectedTimeframe}
            onChange={(e) => setSelectedTimeframe(e.target.value as any)}
            className="px-3 py-1 border rounded text-sm"
          >
            <option value="1h">Last Hour</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
          <select
            value={selectedMetric}
            onChange={(e) => setSelectedMetric(e.target.value as any)}
            className="px-3 py-1 border rounded text-sm"
          >
            <option value="intensity">Intensity</option>
            <option value="count">Count</option>
            <option value="density">Density</option>
          </select>
        </div>
      </div>

      {/* Metrics Grid */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Total Data Points"
            value={metrics.totalDataPoints.toLocaleString()}
            change={metrics.changePercentage}
            color="blue"
          />
          <MetricCard
            title="Active Clusters"
            value={metrics.totalClusters}
            color="green"
          />
          <MetricCard
            title="Anomalies Detected"
            value={metrics.totalAnomalies}
            color="red"
          />
          <MetricCard
            title="Average Intensity"
            value={metrics.averageIntensity}
            color="purple"
          />
        </div>
      )}

      {/* Charts and Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trend Chart */}
        {enableTrends && trendData.length > 0 && (
          <TrendChart
            data={trendData}
            title={`${selectedMetric.charAt(0).toUpperCase() + selectedMetric.slice(1)} Trends`}
            color="blue"
          />
        )}

        {/* Predictive Analysis */}
        {enablePredictions && predictiveData && (
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Predictive Analysis</h3>
            <div className="text-center py-8">
              <p className="text-gray-600">
                Predictive model results coming soon...
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Data points: {predictiveData.predictions?.length || 0}
              </p>
            </div>
          </div>
        )}

        {/* Anomaly Analysis */}
        {enableAnomalyDetection && (
          <AnomalyList
            anomalies={state.data?.anomalies || []}
            onAnomalyClick={onInsightClick}
          />
        )}

        {/* Cluster Analysis */}
        <ClusterAnalysis
          clusters={state.data?.clusters || []}
          onClusterClick={onInsightClick}
        />
      </div>

      {/* Real-time Status */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">System Status</h3>
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span>Data Processing: Active</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              <span>Analytics: Running</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
              <span>Last Update: {state.lastUpdated?.toLocaleTimeString() || 'Never'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeatmapAnalyticsDashboard;