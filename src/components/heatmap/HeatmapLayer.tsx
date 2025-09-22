import React from 'react';

interface HeatmapLayerProps {
  points: Array<[number, number, number]>; // [lat, lng, intensity]
  radius?: number;
  blur?: number;
  maxZoom?: number;
  minOpacity?: number;
  max?: number;
  gradient?: Record<string, string>;
}

// Stub component - heatmap rendering is now handled by MapLibreMap
export const HeatmapLayer: React.FC<HeatmapLayerProps> = () => {
  return null; // Heatmap is rendered by MapLibre GL JS
};
