import React from 'react';
import AdvancedHeatmapDashboard from '../../../components/heatmap/HeatmapAnalyticsDashboard';

const HeatmapPage: React.FC = () => {
  return (
    <div className="w-full h-screen overflow-hidden bg-gray-100">
      <AdvancedHeatmapDashboard className="w-full h-full" />
    </div>
  );
};

export default HeatmapPage;