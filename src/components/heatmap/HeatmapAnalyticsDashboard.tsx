import React, { useState, useCallback } from 'react';
import { MapProvider } from '../../contexts/MapContext';
import { RegionBounds } from '../../types/heatmap';
import { HeatmapVisualization } from './HeatmapVisualization';
import { useHeatmapData } from '../../hooks/useHeatmapData';

interface AdvancedHeatmapDashboardProps {
  className?: string;
}

export const AdvancedHeatmapDashboard: React.FC<AdvancedHeatmapDashboardProps> = ({
  className = ''
}) => {
  // Map and region state
  const [bounds, setBounds] = useState<RegionBounds>({
    southwest: [70.0, 8.0],  // Southwest corner of India
    northeast: [97.0, 37.0]  // Northeast corner of India
  });

  // Use the heatmap data hook for data access
  const { state: heatmapState } = useHeatmapData({
    bounds,
    config: {
      analytics: {
        enableClustering: true,
        enableAnomalyDetection: true,
        enableTrends: true,
        enablePredictions: false,
        historicalDepth: 30,
        refreshInterval: 300000
      },
      realtime: {
        enabled: true,
        updateInterval: 5000,
        autoRefresh: true,
        pushNotifications: true,
        anomalyAlerts: true,
        predictionUpdates: false
      }
    },
    enableRealtime: true
  });

  // Handle viewport bounds change
  const handleBoundsChange = useCallback((newBounds: RegionBounds) => {
    setBounds(newBounds);
  }, []);

  // Render the dashboard
  return (
    <MapProvider>
      <div className={`advanced-heatmap-dashboard w-full h-full ${className} relative overflow-hidden bg-gray-50`}>
        {/* Full-Page Map Background */}
        <div className="absolute inset-0 w-full h-full">
          <HeatmapVisualization
            initialBounds={bounds}
            enableRealtime={true}
            enableControls={true}
            enableSidebar={false}
            enableTooltips={true}
            enableAnalytics={true}
            onBoundsChange={handleBoundsChange}
            className="w-full h-full"
            style={{ width: '100%', height: '100%' }}
          />
        </div>

        {/* Mobile Search Overlay - Only visible on mobile */}
        <div className="absolute top-4 left-4 right-4 z-50 md:hidden">
          {/* <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-white/30"> */}
            {/* <div className="p-3">
              <SearchLocation 
                placeholder="Search for locations..." 
                className="w-full"
                mobile={true}
                onLocationSelect={(location) => {
                  // Handle location selection
                  if (location.geometry?.coordinates) {
                    const [longitude, latitude] = location.geometry.coordinates;
                    const buffer = 0.01; // ~1km buffer
                    handleBoundsChange({
                      southwest: [longitude - buffer, latitude - buffer],
                      northeast: [longitude + buffer, latitude + buffer]
                    });
                  }
                }}
              />
            </div> */}
          {/* </div> */}
        </div>

        {/* Compact Stats Card - Top Right Corner */}
        <div className="absolute top-4 right-4 z-50 hidden md:block">
          <div className="bg-white/90 backdrop-blur-md rounded-xl shadow-xl border border-white/20 p-3 md:p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-xs text-gray-600 font-medium">Live</span>
              </div>
              <span className="text-xs text-gray-500">India</span>
            </div>
            
            {/* Compact Analytics Cards */}
            <div className="grid grid-cols-2 gap-2 mb-2">
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="flex items-center space-x-2">
                  <div>
                    <div className="text-lg font-bold text-blue-900">{heatmapState?.data?.dataPoints?.length || 0}</div>
                    <div className="text-xs text-blue-600">Data Points</div>
                  </div>
                </div>
              </div>
              <div className="bg-amber-50 p-3 rounded-lg">
                <div className="flex items-center space-x-2">
                  <div>
                    <div className="text-lg font-bold text-amber-900">{heatmapState?.data?.clusters?.length || 0}</div>
                    <div className="text-xs text-amber-600">Clusters</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MapProvider>
  );
};

export default AdvancedHeatmapDashboard;