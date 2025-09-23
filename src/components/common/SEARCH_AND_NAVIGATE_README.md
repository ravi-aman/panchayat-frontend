# SearchAndNavigate Component

A reusable React component for searching locations and navigating to them on a MapLibre GL JS map.

## Features

- Real-time location search with Photon API
- Smooth map transitions with custom easing
- Single marker management (removes previous markers)
- Popup with location information
- Recent searches history with local storage
- Keyboard navigation support
- Mobile and dark mode responsive design
- TypeScript typings

## Installation

The component is already installed as part of your project. It requires:

- React
- MapLibre GL JS
- Lucide React (for icons)
- TailwindCSS (for styling)

## Usage

```tsx
import React, { useRef, useState } from 'react';
import { Map } from 'maplibre-gl';
import SearchAndNavigate from '../components/common/SearchAndNavigate';

const MyMapComponent = () => {
  const [mapInstance, setMapInstance] = useState<Map | null>(null);
  
  // Initialize your map and store it in state
  // ...

  return (
    <div className="relative">
      {/* Map container */}
      <div id="map" className="w-full h-screen" />
      
      {/* Search component */}
      <div className="absolute top-4 left-4 w-96 z-10">
        <SearchAndNavigate
          map={mapInstance}
          onLocationSelect={(location) => console.log('Selected:', location)}
          placeholder="Search for a place..."
          flyToDuration={1500}
          flyToZoom={14}
        />
      </div>
    </div>
  );
};
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `map` | `Map \| null` | `null` | MapLibre map instance (required) |
| `onLocationSelect` | `(location: PhotonFeature) => void` | - | Callback when a location is selected |
| `placeholder` | `string` | `'Search for a location...'` | Placeholder text for search input |
| `className` | `string` | `''` | Additional CSS classes for the container |
| `mobile` | `boolean` | `false` | Enable mobile-optimized UI |
| `darkMode` | `boolean` | `false` | Enable dark mode styling |
| `apiUrl` | `string` | `'https://photon.komoot.io/api'` | Photon API URL |
| `markerColor` | `string` | `'#3b82f6'` | Color for the map marker |
| `flyToDuration` | `number` | `1500` | Duration of the flyTo animation in ms |
| `flyToZoom` | `number` | `14` | Zoom level after navigation |
| `showRecentSearches` | `boolean` | `true` | Show recent searches in dropdown |
| `maxRecentSearches` | `number` | `5` | Maximum number of recent searches to store |
| `enablePopups` | `boolean` | `true` | Show popups on marker click |

## Implementation Details

- The component uses a debounced search to prevent excessive API calls
- Markers and popups are properly cleaned up when new locations are selected
- Recent searches are stored in localStorage with deduplication
- Smooth animations use custom easing functions for natural movement
- The component is fully keyboard accessible (up/down/enter/escape)

## Example

See `src/pages/MapPage.tsx` for a complete example of how to use this component with a MapLibre GL JS map.