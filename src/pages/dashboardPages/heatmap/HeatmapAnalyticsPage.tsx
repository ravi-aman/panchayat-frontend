import React from 'react';
import { HeatmapAnalyticsDashboard } from '../../../components/heatmap';

const HeatmapAnalyticsPage: React.FC = () => {
  return (
    <div className="w-full h-screen overflow-hidden bg-gray-100 heatmap-page">
      <HeatmapAnalyticsDashboard className="w-full h-full" />
    </div>
  );
};

export default HeatmapAnalyticsPage;