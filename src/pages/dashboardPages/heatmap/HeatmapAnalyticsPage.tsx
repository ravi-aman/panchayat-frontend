import React from 'react';
import { HeatmapAnalyticsDashboard } from '../../../components/heatmap';

const HeatmapAnalyticsPage: React.FC = () => {
  return (
    <div className="w-full h-full p-6 bg-gray-50">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Heatmap Analytics</h1>
        <p className="mt-2 text-gray-600">
          Advanced analytics and insights for regional heatmap data
        </p>
      </div>
      
      <div className="h-[calc(100vh-200px)]">
        <HeatmapAnalyticsDashboard 
          bounds={{
            southwest: [-122.4594, 37.7349], // [lng, lat]
            northeast: [-122.4194, 37.7749]  // [lng, lat]
          }}
          timeRange={{
            start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
            end: new Date()
          }}
        />
      </div>
    </div>
  );
};

export default HeatmapAnalyticsPage;