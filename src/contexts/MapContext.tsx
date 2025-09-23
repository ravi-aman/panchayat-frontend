import React, { createContext, useContext, useState, ReactNode } from 'react';

interface MapContextType {
  mapInstance: any | null;
  setMapInstance: (map: any | null) => void;
}

const MapContext = createContext<MapContextType | undefined>(undefined);

export const MapProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [mapInstance, setMapInstance] = useState<any | null>(null);

  return (
    <MapContext.Provider value={{ mapInstance, setMapInstance }}>
      {children}
    </MapContext.Provider>
  );
};

export const useMap = (): MapContextType => {
  const context = useContext(MapContext);
  if (context === undefined) {
    throw new Error('useMap must be used within a MapProvider');
  }
  return context;
};