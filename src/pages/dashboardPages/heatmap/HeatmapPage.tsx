import React from 'react';
import { HeatmapVisualization } from '../../../components/heatmap';

const HeatmapPage: React.FC = () => {
  return (
    <div className="w-full h-full p-6 bg-gray-50">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Regional Heatmap</h1>
        <p className="mt-2 text-gray-600">
          Visualize and analyze regional data with real-time insights and predictive analytics
        </p>
      </div>
      
      <div className="h-[calc(100vh-200px)] rounded-lg shadow-lg bg-white">
        <HeatmapVisualization 
          initialBounds={{
            southwest: [-122.4594, 37.7349], // [lng, lat]
            northeast: [-122.4194, 37.7749]  // [lng, lat]
          }}
          enableRealtime={true}
          enableControls={true}
          enableSidebar={true}
          enableTooltips={true}
          enableAnalytics={true}
        />
      </div>
    </div>
  );
};

export default HeatmapPage;