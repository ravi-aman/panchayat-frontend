// ===== ENHANCED MAP CONTEXT PROVIDER =====
// Production-level map state management with advanced features

import React, { createContext, useContext, useReducer, useCallback, useEffect, useMemo } from 'react';
import { HeatmapState, HeatmapConfig, RegionBounds, HeatmapDataPoint, HeatmapCluster, HeatmapAnomaly } from '../types/heatmap';

// ===== INTERFACES =====

interface MapState {
  // Map Instance
  mapInstance: any | null;
  isMapReady: boolean;
  
  // View State
  currentBounds: RegionBounds;
  zoomLevel: number;
  center: [number, number];
  
  // Layer Management
  activeLayers: Set<string>;
  layerVisibility: Record<string, boolean>;
  
  // Selection State
  selectedFeatures: {
    point: HeatmapDataPoint | null;
    cluster: HeatmapCluster | null;
    anomaly: HeatmapAnomaly | null;
  };
  
  // Interaction State
  isInteracting: boolean;
  hoveredFeature: any | null;
  
  // Performance Tracking
  renderCount: number;
  lastRenderTime: number;
  
  // User Preferences
  userPreferences: {
    colorScheme: string;
    animationSpeed: number;
    showTooltips: boolean;
    enableClustering: boolean;
  };
}

interface MapContextValue {
  state: MapState;
  actions: {
    // Map Instance Management
    setMapInstance: (map: any) => void;
    setMapReady: (ready: boolean) => void;
    
    // View Management
    updateBounds: (bounds: RegionBounds) => void;
    setZoomLevel: (zoom: number) => void;
    setCenter: (center: [number, number]) => void;
    
    // Layer Management
    toggleLayer: (layerId: string) => void;
    setLayerVisibility: (layerId: string, visible: boolean) => void;
    
    // Selection Management
    selectPoint: (point: HeatmapDataPoint | null) => void;
    selectCluster: (cluster: HeatmapCluster | null) => void;
    selectAnomaly: (anomaly: HeatmapAnomaly | null) => void;
    clearSelection: () => void;
    
    // Interaction Management
    setHoveredFeature: (feature: any | null) => void;
    setInteracting: (interacting: boolean) => void;
    
    // Performance Tracking
    incrementRenderCount: () => void;
    updateRenderTime: (time: number) => void;
    
    // User Preferences
    updatePreferences: (preferences: Partial<MapState['userPreferences']>) => void;
    
    // Utility Actions
    resetMap: () => void;
    fitBounds: (bounds: RegionBounds) => void;
  };
}

// ===== ACTION TYPES =====

type MapAction =
  | { type: 'SET_MAP_INSTANCE'; payload: any }
  | { type: 'SET_MAP_READY'; payload: boolean }
  | { type: 'UPDATE_BOUNDS'; payload: RegionBounds }
  | { type: 'SET_ZOOM_LEVEL'; payload: number }
  | { type: 'SET_CENTER'; payload: [number, number] }
  | { type: 'TOGGLE_LAYER'; payload: string }
  | { type: 'SET_LAYER_VISIBILITY'; payload: { layerId: string; visible: boolean } }
  | { type: 'SELECT_POINT'; payload: HeatmapDataPoint | null }
  | { type: 'SELECT_CLUSTER'; payload: HeatmapCluster | null }
  | { type: 'SELECT_ANOMALY'; payload: HeatmapAnomaly | null }
  | { type: 'CLEAR_SELECTION' }
  | { type: 'SET_HOVERED_FEATURE'; payload: any | null }
  | { type: 'SET_INTERACTING'; payload: boolean }
  | { type: 'INCREMENT_RENDER_COUNT' }
  | { type: 'UPDATE_RENDER_TIME'; payload: number }
  | { type: 'UPDATE_PREFERENCES'; payload: Partial<MapState['userPreferences']> }
  | { type: 'RESET_MAP' }
  | { type: 'FIT_BOUNDS'; payload: RegionBounds };

// ===== INITIAL STATE =====

const createInitialState = (): MapState => ({
  mapInstance: null,
  isMapReady: false,
  
  currentBounds: {
    southwest: [77.0, 12.8],  // Default to Bangalore area
    northeast: [77.8, 13.2]
  },
  zoomLevel: 12,
  center: [77.4, 13.0],
  
  activeLayers: new Set(['heatmap', 'points', 'clusters']),
  layerVisibility: {
    heatmap: true,
    points: true,
    clusters: true,
    boundaries: false,
    predictions: false,
    anomalies: true,
    realtime: true,
    heatmapIntensity: true,
    historicalData: false
  },
  
  selectedFeatures: {
    point: null,
    cluster: null,
    anomaly: null
  },
  
  isInteracting: false,
  hoveredFeature: null,
  
  renderCount: 0,
  lastRenderTime: performance.now(),
  
  userPreferences: {
    colorScheme: 'viridis',
    animationSpeed: 300,
    showTooltips: true,
    enableClustering: true
  }
});

// ===== REDUCER =====

const mapReducer = (state: MapState, action: MapAction): MapState => {
  switch (action.type) {
    case 'SET_MAP_INSTANCE':
      return {
        ...state,
        mapInstance: action.payload
      };
      
    case 'SET_MAP_READY':
      return {
        ...state,
        isMapReady: action.payload
      };
      
    case 'UPDATE_BOUNDS':
      return {
        ...state,
        currentBounds: action.payload,
        center: [
          (action.payload.southwest[0] + action.payload.northeast[0]) / 2,
          (action.payload.southwest[1] + action.payload.northeast[1]) / 2
        ]
      };
      
    case 'SET_ZOOM_LEVEL':
      return {
        ...state,
        zoomLevel: action.payload
      };
      
    case 'SET_CENTER':
      return {
        ...state,
        center: action.payload
      };
      
    case 'TOGGLE_LAYER':
      const newActiveLayers = new Set(state.activeLayers);
      if (newActiveLayers.has(action.payload)) {
        newActiveLayers.delete(action.payload);
      } else {
        newActiveLayers.add(action.payload);
      }
      return {
        ...state,
        activeLayers: newActiveLayers,
        layerVisibility: {
          ...state.layerVisibility,
          [action.payload]: !state.layerVisibility[action.payload]
        }
      };
      
    case 'SET_LAYER_VISIBILITY':
      const { layerId, visible } = action.payload;
      const updatedActiveLayers = new Set(state.activeLayers);
      if (visible) {
        updatedActiveLayers.add(layerId);
      } else {
        updatedActiveLayers.delete(layerId);
      }
      return {
        ...state,
        activeLayers: updatedActiveLayers,
        layerVisibility: {
          ...state.layerVisibility,
          [layerId]: visible
        }
      };
      
    case 'SELECT_POINT':
      return {
        ...state,
        selectedFeatures: {
          ...state.selectedFeatures,
          point: action.payload,
          // Clear other selections when selecting a point
          cluster: action.payload ? null : state.selectedFeatures.cluster,
          anomaly: action.payload ? null : state.selectedFeatures.anomaly
        }
      };
      
    case 'SELECT_CLUSTER':
      return {
        ...state,
        selectedFeatures: {
          ...state.selectedFeatures,
          cluster: action.payload,
          // Clear other selections when selecting a cluster
          point: action.payload ? null : state.selectedFeatures.point,
          anomaly: action.payload ? null : state.selectedFeatures.anomaly
        }
      };
      
    case 'SELECT_ANOMALY':
      return {
        ...state,
        selectedFeatures: {
          ...state.selectedFeatures,
          anomaly: action.payload,
          // Clear other selections when selecting an anomaly
          point: action.payload ? null : state.selectedFeatures.point,
          cluster: action.payload ? null : state.selectedFeatures.cluster
        }
      };
      
    case 'CLEAR_SELECTION':
      return {
        ...state,
        selectedFeatures: {
          point: null,
          cluster: null,
          anomaly: null
        }
      };
      
    case 'SET_HOVERED_FEATURE':
      return {
        ...state,
        hoveredFeature: action.payload
      };
      
    case 'SET_INTERACTING':
      return {
        ...state,
        isInteracting: action.payload
      };
      
    case 'INCREMENT_RENDER_COUNT':
      return {
        ...state,
        renderCount: state.renderCount + 1
      };
      
    case 'UPDATE_RENDER_TIME':
      return {
        ...state,
        lastRenderTime: action.payload
      };
      
    case 'UPDATE_PREFERENCES':
      return {
        ...state,
        userPreferences: {
          ...state.userPreferences,
          ...action.payload
        }
      };
      
    case 'RESET_MAP':
      return createInitialState();
      
    case 'FIT_BOUNDS':
      // This would trigger map instance to fit bounds
      // The actual bounds update would come through UPDATE_BOUNDS action
      return state;
      
    default:
      return state;
  }
};

// ===== CONTEXT CREATION =====

const MapContext = createContext<MapContextValue | null>(null);

// ===== HOOK FOR USING CONTEXT =====

export const useMap = () => {
  const context = useContext(MapContext);
  if (!context) {
    throw new Error('useMap must be used within a MapProvider');
  }
  return context;
};

// ===== PROVIDER COMPONENT =====

interface MapProviderProps {
  children: React.ReactNode;
  initialBounds?: RegionBounds;
  initialZoom?: number;
}

export const MapProvider: React.FC<MapProviderProps> = ({ 
  children, 
  initialBounds,
  initialZoom = 12 
}) => {
  const [state, dispatch] = useReducer(mapReducer, undefined, () => {
    const initial = createInitialState();
    if (initialBounds) {
      initial.currentBounds = initialBounds;
      initial.center = [
        (initialBounds.southwest[0] + initialBounds.northeast[0]) / 2,
        (initialBounds.southwest[1] + initialBounds.northeast[1]) / 2
      ];
    }
    initial.zoomLevel = initialZoom;
    return initial;
  });

  // ===== ACTION CREATORS =====

  const actions = useMemo(() => ({
    // Map Instance Management
    setMapInstance: useCallback((map: any) => {
      dispatch({ type: 'SET_MAP_INSTANCE', payload: map });
    }, []),

    setMapReady: useCallback((ready: boolean) => {
      dispatch({ type: 'SET_MAP_READY', payload: ready });
    }, []),

    // View Management
    updateBounds: useCallback((bounds: RegionBounds) => {
      dispatch({ type: 'UPDATE_BOUNDS', payload: bounds });
    }, []),

    setZoomLevel: useCallback((zoom: number) => {
      dispatch({ type: 'SET_ZOOM_LEVEL', payload: zoom });
    }, []),

    setCenter: useCallback((center: [number, number]) => {
      dispatch({ type: 'SET_CENTER', payload: center });
    }, []),

    // Layer Management
    toggleLayer: useCallback((layerId: string) => {
      dispatch({ type: 'TOGGLE_LAYER', payload: layerId });
    }, []),

    setLayerVisibility: useCallback((layerId: string, visible: boolean) => {
      dispatch({ type: 'SET_LAYER_VISIBILITY', payload: { layerId, visible } });
    }, []),

    // Selection Management
    selectPoint: useCallback((point: HeatmapDataPoint | null) => {
      dispatch({ type: 'SELECT_POINT', payload: point });
    }, []),

    selectCluster: useCallback((cluster: HeatmapCluster | null) => {
      dispatch({ type: 'SELECT_CLUSTER', payload: cluster });
    }, []),

    selectAnomaly: useCallback((anomaly: HeatmapAnomaly | null) => {
      dispatch({ type: 'SELECT_ANOMALY', payload: anomaly });
    }, []),

    clearSelection: useCallback(() => {
      dispatch({ type: 'CLEAR_SELECTION' });
    }, []),

    // Interaction Management
    setHoveredFeature: useCallback((feature: any | null) => {
      dispatch({ type: 'SET_HOVERED_FEATURE', payload: feature });
    }, []),

    setInteracting: useCallback((interacting: boolean) => {
      dispatch({ type: 'SET_INTERACTING', payload: interacting });
    }, []),

    // Performance Tracking
    incrementRenderCount: useCallback(() => {
      dispatch({ type: 'INCREMENT_RENDER_COUNT' });
    }, []),

    updateRenderTime: useCallback((time: number) => {
      dispatch({ type: 'UPDATE_RENDER_TIME', payload: time });
    }, []),

    // User Preferences
    updatePreferences: useCallback((preferences: Partial<MapState['userPreferences']>) => {
      dispatch({ type: 'UPDATE_PREFERENCES', payload: preferences });
    }, []),

    // Utility Actions
    resetMap: useCallback(() => {
      dispatch({ type: 'RESET_MAP' });
    }, []),

    fitBounds: useCallback((bounds: RegionBounds) => {
      // This would be handled by the map instance
      if (state.mapInstance && state.mapInstance.fitBounds) {
        state.mapInstance.fitBounds([
          [bounds.southwest[0], bounds.southwest[1]],
          [bounds.northeast[0], bounds.northeast[1]]
        ]);
      }
      dispatch({ type: 'FIT_BOUNDS', payload: bounds });
    }, [state.mapInstance])
  }), [state.mapInstance]);

  // ===== CONTEXT VALUE =====

  const contextValue = useMemo(() => ({
    state,
    actions
  }), [state, actions]);

  // ===== EFFECTS =====

  // Save user preferences to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('mapUserPreferences', JSON.stringify(state.userPreferences));
    } catch (error) {
      console.warn('Failed to save user preferences to localStorage:', error);
    }
  }, [state.userPreferences]);

  // Load user preferences from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('mapUserPreferences');
      if (saved) {
        const preferences = JSON.parse(saved);
        actions.updatePreferences(preferences);
      }
    } catch (error) {
      console.warn('Failed to load user preferences from localStorage:', error);
    }
  }, [actions]);

  // Performance monitoring (in development)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const interval = setInterval(() => {
        console.log('Map Performance Stats:', {
          renderCount: state.renderCount,
          lastRenderTime: state.lastRenderTime,
          activeLayers: Array.from(state.activeLayers),
          selectedFeatures: Object.entries(state.selectedFeatures).filter(([_, value]) => value !== null).map(([key]) => key)
        });
      }, 10000); // Log every 10 seconds

      return () => clearInterval(interval);
    }
  }, [state.renderCount, state.lastRenderTime, state.activeLayers, state.selectedFeatures]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Cleanup any map instance resources
      if (state.mapInstance && state.mapInstance.remove) {
        try {
          state.mapInstance.remove();
        } catch (error) {
          console.warn('Error cleaning up map instance:', error);
        }
      }
    };
  }, [state.mapInstance]);

  return (
    <MapContext.Provider value={contextValue}>
      {children}
    </MapContext.Provider>
  );
};

// ===== ADDITIONAL HOOKS =====

// Hook for accessing map instance directly
export const useMapInstance = () => {
  const { state } = useMap();
  return {
    map: state.mapInstance,
    isReady: state.isMapReady
  };
};

// Hook for accessing selection state
export const useMapSelection = () => {
  const { state, actions } = useMap();
  return {
    selectedFeatures: state.selectedFeatures,
    hoveredFeature: state.hoveredFeature,
    selectPoint: actions.selectPoint,
    selectCluster: actions.selectCluster,
    selectAnomaly: actions.selectAnomaly,
    clearSelection: actions.clearSelection,
    setHoveredFeature: actions.setHoveredFeature
  };
};

// Hook for accessing layer management
export const useMapLayers = () => {
  const { state, actions } = useMap();
  return {
    activeLayers: state.activeLayers,
    layerVisibility: state.layerVisibility,
    toggleLayer: actions.toggleLayer,
    setLayerVisibility: actions.setLayerVisibility
  };
};

// Hook for accessing view state
export const useMapView = () => {
  const { state, actions } = useMap();
  return {
    bounds: state.currentBounds,
    zoom: state.zoomLevel,
    center: state.center,
    updateBounds: actions.updateBounds,
    setZoomLevel: actions.setZoomLevel,
    setCenter: actions.setCenter,
    fitBounds: actions.fitBounds
  };
};

// Hook for accessing performance metrics
export const useMapPerformance = () => {
  const { state, actions } = useMap();
  return {
    renderCount: state.renderCount,
    lastRenderTime: state.lastRenderTime,
    incrementRenderCount: actions.incrementRenderCount,
    updateRenderTime: actions.updateRenderTime
  };
};

export default MapProvider;