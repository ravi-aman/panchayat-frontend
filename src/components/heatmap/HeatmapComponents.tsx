import React from 'react';
import { HeatmapVisualizationConfig } from '../../types/heatmap';

// ===== CONTROLS COMPONENT =====
export const HeatmapControls: React.FC<{
  config: any;
  visualization: HeatmapVisualizationConfig;
  selectedLayer: string;
  isLoading: boolean;
  isConnected: boolean;
  wsStatus: string;
  onConfigChange: (config: any) => void;
  onVisualizationChange: (config: Partial<HeatmapVisualizationConfig>) => void;
  onLayerChange: (layer: string) => void;
  onLayerToggle: (layer: string, visible: boolean) => void;
  onRefresh: () => void;
  onExport: (format: 'json' | 'csv' | 'geojson') => void;
  onSidebarToggle: () => void;
  className?: string;
}> = ({ 
  selectedLayer, 
  isLoading, 
  isConnected, 
  onLayerChange, 
  onRefresh, 
  onSidebarToggle,
  className = ''
}) => {
  return (
    <div className={`bg-white p-4 rounded shadow-lg ${className}`}>
      <div className='space-y-2'>
        <div className='text-sm font-semibold'>Controls</div>
        
        <select 
          value={selectedLayer} 
          onChange={(e) => onLayerChange(e.target.value)}
          className='w-full p-1 border rounded text-xs'
        >
          <option value='all'>All Layers</option>
          <option value='heatmap'>Heatmap</option>
          <option value='clusters'>Clusters</option>
          <option value='points'>Points</option>
        </select>

        <div className='flex space-x-1'>
          <button 
            onClick={onRefresh}
            disabled={isLoading}
            className='px-2 py-1 bg-blue-500 text-white rounded text-xs disabled:opacity-50'
          >
            {isLoading ? '...' : 'Refresh'}
          </button>
          
          <button 
            onClick={onSidebarToggle}
            className='px-2 py-1 bg-gray-500 text-white rounded text-xs'
          >
            Menu
          </button>
        </div>

        <div className={`text-xs ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
          {isConnected ? 'Connected' : 'Disconnected'}
        </div>
      </div>
    </div>
  );
};

// ===== LEGEND COMPONENT =====
export const HeatmapLegend: React.FC<{
  config: HeatmapVisualizationConfig;
  data: any;
  selectedLayer: string;
  className?: string;
}> = ({ className = '' }) => {
  return (
    <div className={`bg-white p-3 rounded shadow-lg ${className}`}>
      <div className='text-sm font-semibold mb-2'>Legend</div>
      <div className='space-y-1 text-xs'>
        <div className='flex items-center space-x-2'>
          <div className='w-4 h-4 bg-red-500 rounded'></div>
          <span>High Density</span>
        </div>
        <div className='flex items-center space-x-2'>
          <div className='w-4 h-4 bg-yellow-500 rounded'></div>
          <span>Medium Density</span>
        </div>
        <div className='flex items-center space-x-2'>
          <div className='w-4 h-4 bg-green-500 rounded'></div>
          <span>Low Density</span>
        </div>
      </div>
    </div>
  );
};

// ===== TOOLTIP COMPONENT =====
export const HeatmapTooltip: React.FC<{
  data: any;
  position: [number, number] | null;
  className?: string;
}> = ({ data, position, className = '' }) => {
  if (!data || !position) return null;
  
  return (
    <div className={`absolute bg-white p-2 rounded shadow-lg pointer-events-none z-50 ${className}`}
         style={{ left: position[0], top: position[1] }}>
      <div className='text-sm'>
        <div className='font-semibold'>{data.title || 'Data Point'}</div>
        <div>Value: {data.value?.toFixed(2) || 'N/A'}</div>
        {data.metadata && Object.entries(data.metadata).map(([key, value]) => (
          <div key={key}>{key}: {String(value)}</div>
        ))}
      </div>
    </div>
  );
};

// ===== SIDEBAR COMPONENT =====
export const HeatmapSidebar: React.FC<{
  isOpen: boolean;
  data: any;
  config: any;
  onConfigChange: (config: any) => void;
  onClose: () => void;
  className?: string;
}> = ({ isOpen, data, onClose, className = '' }) => {
  if (!isOpen) return null;
  
  return (
    <div className={`fixed right-0 top-0 h-full w-80 bg-white shadow-lg z-40 transform transition-transform ${isOpen ? 'translate-x-0' : 'translate-x-full'} ${className}`}>
      <div className='p-4'>
        <div className='flex justify-between items-center mb-4'>
          <h2 className='text-lg font-semibold'>Settings</h2>
          <button onClick={onClose} className='text-gray-500 hover:text-gray-700'></button>
        </div>
        
        <div className='space-y-4'>
          <div>
            <label className='block text-sm font-medium mb-1'>Data Points</label>
            <div className='text-sm text-gray-600'>{data?.dataPoints?.length || 0} points loaded</div>
          </div>
          
          <div>
            <label className='block text-sm font-medium mb-1'>Clusters</label>
            <div className='text-sm text-gray-600'>{data?.clusters?.length || 0} clusters found</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ===== LOADING OVERLAY COMPONENT =====
export const HeatmapLoadingOverlay: React.FC<{
  isLoading: boolean;
  message?: string;
  className?: string;
}> = ({ isLoading, message = 'Loading...', className = '' }) => {
  if (!isLoading) return null;
  
  return (
    <div className={`absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${className}`}>
      <div className='bg-white p-4 rounded shadow-lg'>
        <div className='flex items-center space-x-2'>
          <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500'></div>
          <span className='text-sm'>{message}</span>
        </div>
      </div>
    </div>
  );
};

// ===== ERROR BOUNDARY COMPONENT =====
export class HeatmapErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ComponentType<{ error: Error }> },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ComponentType<{ error: Error }> }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Heatmap component error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return <FallbackComponent error={this.state.error!} />;
    }

    return this.props.children;
  }
}

const DefaultErrorFallback: React.FC<{ error: Error }> = ({ error }) => (
  <div className='p-4 bg-red-50 border border-red-200 rounded'>
    <h3 className='text-red-800 font-semibold'>Something went wrong</h3>
    <p className='text-red-600 text-sm mt-1'>{error.message}</p>
  </div>
);
