# 🗺️ Advanced Map Integration Guide

## Complete Backend Integration Documentation for Frontend Developers

This document provides comprehensive details about all mapping and geospatial features available in the Panchayat Backend API, including REST endpoints, WebSocket connections, data structures, and integration examples.

---

## 📚 Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Core Heatmap APIs](#core-heatmap-apis)
4. [WebSocket Real-time Updates](#websocket-real-time-updates)
5. [Data Structures](#data-structures)
6. [Advanced Features](#advanced-features)
7. [Integration Examples](#integration-examples)
8. [Performance Optimization](#performance-optimization)
9. [Error Handling](#error-handling)
10. [Best Practices](#best-practices)

---

## 🌟 Overview

The Advanced Map Integration System provides:

- **Real-time Heatmap Data** with H3 hexagonal clustering
- **Predictive Analytics** for future hotspots
- **Multi-layer Data Integration** (issues, weather, traffic, events)
- **Anomaly Detection** with real-time alerts
- **WebSocket Live Updates** for real-time map synchronization
- **Advanced Clustering Analysis** (DBSCAN, K-means, H3)
- **Performance-Optimized Data Delivery** for large areas

### 🏗️ Architecture

```
Frontend Map Component
    ↓
┌─────────────────────────────────────────────┐
│           REST API Endpoints               │
│  /api/heatmap/realtime                     │
│  /api/heatmap/predictive                   │
│  /api/heatmap/multilayer                   │
│  /api/heatmap/anomalies                    │
│  /api/heatmap/analytics                    │
│  /api/heatmap/clustering                   │
└─────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────┐
│         WebSocket Connection               │
│  ws://server/api/heatmap/ws                │
│  - Real-time data updates                  │
│  - Live clustering changes                 │
│  - Anomaly alerts                          │
└─────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────┐
│         H3 Hexagonal Data                  │
│  - Geographic boundaries                   │
│  - Issue clustering                        │
│  - Advanced analytics                      │
│  - Performance metrics                     │
└─────────────────────────────────────────────┘
```

---

## 🔐 Authentication

All map API endpoints require authentication. Include the JWT token in the Authorization header:

```javascript
const headers = {
  'Authorization': `Bearer ${userToken}`,
  'Content-Type': 'application/json'
};
```

---

## 🎯 Core Heatmap APIs

### 1. **Real-time Heatmap Data**

#### **Endpoint**: `GET /api/heatmap/realtime`

The primary endpoint for retrieving current heatmap data with H3 hexagonal clustering.

#### **Parameters**:
```typescript
interface RealtimeParams {
  bounds: string;           // Required: "[[sw_lng,sw_lat],[ne_lng,ne_lat]]"
  resolution?: number;      // Optional: 1-15 (default: 8)
  layers?: string[];        // Optional: ["issues","weather","traffic"] (default: ["issues"])
  cacheTimeout?: number;    // Optional: seconds (default: 30)
  maxHexagons?: number;     // Optional: max hexagons (default: 5000)
}
```

#### **Example Request**:
```javascript
const bounds = JSON.stringify([[75.052, 19.412], [84.068, 29.815]]);
const response = await fetch(`/api/heatmap/realtime?bounds=${encodeURIComponent(bounds)}&resolution=8&layers=issues,traffic`, {
  headers: { Authorization: `Bearer ${token}` }
});
const heatmapData = await response.json();
```

#### **Response Structure**:
```typescript
interface RealtimeHeatmapResponse {
  type: "realtime_heatmap";
  bounds: [number, number, number, number];  // [swLng, swLat, neLng, neLat]
  resolution: number;
  layers: string[];
  hexagons: HexagonData[];
  metrics: RealtimeMetrics;
  generatedAt: string;
  source: "fresh" | "cache" | "optimized_sample";
  totalHexagons: number;
  activeIssues: number;
  performance: {
    areaSize: string;
    processingTime: string;
    hexagonLimit: number;
    optimized: boolean;
  };
}

interface HexagonData {
  h3Index: string;                    // H3 hexagon identifier
  center: [number, number];           // [lat, lng] center point
  boundary: [number, number][];       // Hexagon boundary coordinates
  count: number;                      // Number of issues in hexagon
  weight: number;                     // Weighted importance score
  intensity: number;                  // Normalized intensity (0-1)
  velocity: number;                   // Issues per minute
  acceleration: number;               // Change in velocity
  categories: string[];               // Issue categories
  urgencyDistribution: {              // Urgency level breakdown
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  averagePriority: number;            // Average priority (0-100)
  lastActivity: number;               // Timestamp of last issue
  predictiveWeight: number;           // ML-predicted weight
  finalIntensity: number;             // Weather/traffic-adjusted intensity
  anomalyScore: number;               // Anomaly detection score (0-1)
  riskLevel: "low" | "medium" | "high" | "critical";
  recommendations: string[];          // AI-generated suggestions
  factors: {                          // Weighting factors applied
    timeOfDay: number;
    dayOfWeek: number;
    seasonal: number;
    weather: number;
    traffic: number;
  };
  isSample?: boolean;                 // Flag for demo/sample data
}
```

### 2. **Predictive Heatmap**

#### **Endpoint**: `GET /api/heatmap/predictive`

Generates ML-based predictions for future hotspots.

#### **Parameters**:
```typescript
interface PredictiveParams {
  bounds: string;           // Required: Geographic bounds
  timeframe?: string;       // Optional: "30min", "1h", "3h", "6h", "12h", "24h"
  confidence?: number;      // Optional: 0.0-1.0 (default: 0.7)
  modelType?: string;       // Optional: "lstm", "arima", "prophet"
}
```

#### **Example Request**:
```javascript
const response = await fetch(`/api/heatmap/predictive?bounds=${bounds}&timeframe=30min&confidence=0.8`, {
  headers: { Authorization: `Bearer ${token}` }
});
```

#### **Response Structure**:
```typescript
interface PredictiveHeatmapResponse {
  type: "predictive_heatmap";
  bounds: [number, number, number, number];
  timeframe: string;
  confidence: number;
  modelType: string;
  predictions: PredictionData[];
  accuracy: {
    accuracy: number;
    confidence: number;
  };
  generatedAt: string;
  validUntil: string;
}
```

### 3. **Multi-layer Heatmap**

#### **Endpoint**: `GET /api/heatmap/multilayer`

Combines multiple data layers for comprehensive analysis.

#### **Parameters**:
```typescript
interface MultilayerParams {
  bounds: string;                    // Required: Geographic bounds
  layers: string;                    // Required: "issues,weather,traffic,events,demographics"
  resolution?: number;               // Optional: H3 resolution (default: 8)
  includeCorrelations?: boolean;     // Optional: Calculate layer correlations
}
```

#### **Available Layers**:
- **`issues`**: Civic issues and complaints
- **`weather`**: Weather conditions and alerts
- **`traffic`**: Traffic density and incidents
- **`events`**: Public events and gatherings
- **`demographics`**: Population density data

#### **Example Request**:
```javascript
const response = await fetch(`/api/heatmap/multilayer?bounds=${bounds}&layers=issues,weather,traffic&includeCorrelations=true`, {
  headers: { Authorization: `Bearer ${token}` }
});
```

### 4. **Anomaly Detection**

#### **Endpoint**: `GET /api/heatmap/anomalies`

Detects unusual patterns and potential emergency situations.

#### **Parameters**:
```typescript
interface AnomalyParams {
  bounds: string;              // Required: Geographic bounds
  threshold?: number;          // Optional: Anomaly threshold 0.0-1.0 (default: 0.8)
  timeWindow?: number;         // Optional: Time window in minutes (default: 60)
  algorithm?: string;          // Optional: "isolation_forest", "one_class_svm"
}
```

#### **Response Structure**:
```typescript
interface AnomalyResponse {
  type: "anomaly_detection";
  bounds: [number, number, number, number];
  algorithm: string;
  threshold: number;
  timeWindow: number;
  anomalies: CategorizedAnomalies;
  summary: {
    total: number;
    critical: number;
    warning: number;
    info: number;
  };
  detectedAt: string;
}

interface CategorizedAnomalies {
  critical: AnomalyData[];
  warning: AnomalyData[];
  info: AnomalyData[];
}
```

### 5. **Real-time Analytics**

#### **Endpoint**: `GET /api/heatmap/analytics`

Provides comprehensive analytics and trend data.

#### **Parameters**:
```typescript
interface AnalyticsParams {
  bounds: string;           // Required: Geographic bounds
  timeRange?: string;       // Optional: "1h", "6h", "24h", "7d", "30d"
  metrics?: string;         // Optional: "all" or specific metrics
}
```

#### **Response Structure**:
```typescript
interface AnalyticsResponse {
  type: "realtime_analytics";
  bounds: [number, number, number, number];
  timeRange: string;
  metrics: {
    issueVelocity: number;              // Issues per hour
    hotspots: HotspotData[];            // Top issue hotspots
    trends: TrendData;                  // Trending patterns
    categoryDistribution: Record<string, number>;  // Issue categories
    urgencyDistribution: Record<string, number>;   // Urgency levels
    resolutionRate: number;             // Issues resolved %
    engagementMetrics: EngagementData;  // User engagement stats
  };
  generatedAt: string;
}
```

### 6. **Advanced Clustering**

#### **Endpoint**: `GET /api/heatmap/clustering`

Performs advanced clustering analysis using various algorithms.

#### **Parameters**:
```typescript
interface ClusteringParams {
  bounds: string;           // Required: Geographic bounds
  algorithm?: string;       // Optional: "dbscan", "h3", "kmeans"
  minPoints?: number;       // Optional: Minimum points per cluster
  radius?: number;          // Optional: Cluster radius in meters
  resolution?: number;      // Optional: H3 resolution for h3 algorithm
}
```

### 7. **Health Check**

#### **Endpoint**: `GET /api/heatmap/health`

Check the health status of all heatmap services.

#### **Response Structure**:
```typescript
interface HealthResponse {
  service: "Advanced Heatmap Service";
  status: "healthy" | "degraded" | "error";
  timestamp: string;
  version: string;
  uptime: number;
  components: {
    redis: { status: string; type: string; };
    websocket: { status: string; namespace: string; };
    database: { status: string; type: string; };
    h3: { status: string; version: string; };
  };
  endpoints: string[];
  websocket: {
    endpoint: string;
    events: string[];
    connectedClients?: number;
  };
}
```

---

## 🔌 WebSocket Real-time Updates

### **Connection URL**: `ws://your-server/api/heatmap/ws`

The WebSocket connection provides real-time updates for map data without polling.

### **Connection Setup**:

```javascript
import { io } from 'socket.io-client';

// Connect to heatmap WebSocket namespace
const socket = io('/api/heatmap/ws', {
  auth: {
    token: userToken
  },
  transports: ['websocket']
});

// Handle connection events
socket.on('connect', () => {
  console.log('Connected to heatmap WebSocket');
});

socket.on('disconnect', () => {
  console.log('Disconnected from heatmap WebSocket');
});

socket.on('error', (error) => {
  console.error('WebSocket error:', error);
});
```

### **Subscribing to Area Updates**:

```javascript
// Subscribe to a specific geographic area
socket.emit('subscribe', {
  bounds: JSON.stringify([[75.052, 19.412], [84.068, 29.815]]),
  resolution: 8,
  layers: ['issues', 'traffic']
});

// Handle initial data
socket.on('initial_data', (data) => {
  console.log('Initial heatmap data received:', data);
  updateMapWithHeatmapData(data.hexagons);
});

// Handle real-time updates (every 30 seconds)
socket.on('update', (data) => {
  console.log('Heatmap update received:', data);
  updateMapWithHeatmapData(data.hexagons);
});

// Unsubscribe from updates
socket.emit('unsubscribe');
```

### **Critical Anomaly Alerts**:

```javascript
// Listen for critical anomalies
socket.on('anomaly:critical', (anomaly) => {
  console.warn('Critical anomaly detected:', anomaly);
  showCriticalAlert(anomaly);
});
```

### **WebSocket Events**:

| Event | Direction | Description | Data Structure |
|-------|-----------|-------------|----------------|
| `subscribe` | Client → Server | Subscribe to area updates | `{ bounds: string, resolution?: number, layers?: string[] }` |
| `unsubscribe` | Client → Server | Unsubscribe from updates | `{}` |
| `initial_data` | Server → Client | Initial heatmap data | `RealtimeHeatmapResponse` |
| `update` | Server → Client | Periodic data updates | `RealtimeHeatmapResponse` |
| `anomaly:critical` | Server → Client | Critical anomaly alert | `AnomalyData` |
| `error` | Server → Client | Error message | `{ message: string }` |

---

## 📊 Data Structures

### **Geographic Bounds Format**:

```typescript
// Bounds are always in [longitude, latitude] format
type Bounds = [[number, number], [number, number]]; // [[sw_lng, sw_lat], [ne_lng, ne_lat]]

// Example for Delhi area
const delhiBounds: Bounds = [[77.0, 28.4], [77.3, 28.7]];
```

### **H3 Resolution Levels**:

| Resolution | Hexagon Area | Use Case | Recommended For |
|------------|--------------|----------|-----------------|
| 4 | ~1,770 km² | Country/State view | Very large areas |
| 5 | ~252 km² | State/Large City | State-level analysis |
| 6 | ~36 km² | City view | City-wide overview |
| 7 | ~5.1 km² | District view | District analysis |
| 8 | ~0.73 km² | Neighborhood | **Default - Most balanced** |
| 9 | ~0.10 km² | Block level | Detailed neighborhood |
| 10 | ~0.015 km² | Street level | Street-by-street analysis |
| 11 | ~0.002 km² | Building level | Very detailed analysis |

### **Issue Categories**:

```typescript
type IssueCategory = 
  | 'safety'           // Public safety concerns
  | 'infrastructure'   // Roads, bridges, buildings
  | 'environment'      // Pollution, noise, air quality
  | 'cleanliness'     // Waste, sanitation
  | 'traffic'         // Traffic congestion, parking
  | 'water'           // Water supply, quality
  | 'electricity'     // Power outages, line issues
  | 'flooding'        // Water logging, drainage
  | 'emergency'       // Emergency situations
  | 'other';          // Miscellaneous issues
```

### **Urgency Levels**:

```typescript
type UrgencyLevel = 
  | 'low'           // Minor issues, non-urgent
  | 'medium'        // Moderate importance
  | 'high'          // Important, needs attention
  | 'critical'      // Very important, urgent
  | 'emergency';    // Immediate action required
```

---

## 🚀 Advanced Features

### 1. **Area Size Optimization**

The backend automatically optimizes data delivery based on requested area size:

```typescript
// Area size thresholds and optimizations
const areaOptimization = {
  // Very large areas (300+ sq degrees)
  veryLarge: {
    threshold: 300,
    maxHexagons: 50,
    useSampleData: true,
    resolution: 'reduced by 3'
  },
  // Large areas (100-300 sq degrees)  
  large: {
    threshold: 100,
    maxHexagons: 100,
    useSampleData: true,
    resolution: 'reduced by 2'
  },
  // Medium-large areas (50-100 sq degrees)
  mediumLarge: {
    threshold: 50,
    maxHexagons: 500,
    useSampleData: false,
    resolution: 'normal'
  },
  // Normal areas (<50 sq degrees)
  normal: {
    threshold: 0,
    maxHexagons: 5000,
    useSampleData: false,
    resolution: 'full'
  }
};
```

### 2. **Caching Strategy**

```javascript
// Implement client-side caching for better performance
class HeatmapCache {
  private cache = new Map();
  private readonly TTL = 30000; // 30 seconds
  
  getCacheKey(bounds, resolution, layers) {
    return `${JSON.stringify(bounds)}-${resolution}-${layers.join(',')}`;
  }
  
  get(key) {
    const item = this.cache.get(key);
    if (item && Date.now() - item.timestamp < this.TTL) {
      return item.data;
    }
    this.cache.delete(key);
    return null;
  }
  
  set(key, data) {
    this.cache.set(key, { data, timestamp: Date.now() });
  }
}
```

### 3. **Progressive Data Loading**

```javascript
// Load data progressively based on zoom level
async function loadHeatmapData(map) {
  const zoom = map.getZoom();
  const bounds = map.getBounds();
  
  // Determine appropriate resolution based on zoom
  const resolution = Math.max(4, Math.min(12, Math.floor(zoom - 2)));
  
  // Request appropriate data density
  const maxHexagons = zoom > 10 ? 2000 : zoom > 8 ? 1000 : 500;
  
  const response = await fetch(`/api/heatmap/realtime?${new URLSearchParams({
    bounds: JSON.stringify([[bounds.getWest(), bounds.getSouth()], 
                           [bounds.getEast(), bounds.getNorth()]]),
    resolution: resolution.toString(),
    maxHexagons: maxHexagons.toString()
  })}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  
  return await response.json();
}
```

---

## 🎨 Integration Examples

### **React + MapLibre Integration**:

```javascript
import React, { useEffect, useState, useCallback } from 'react';
import { Map } from 'react-map-gl/maplibre';
import { io } from 'socket.io-client';

const AdvancedHeatmap = ({ userToken }) => {
  const [heatmapData, setHeatmapData] = useState(null);
  const [socket, setSocket] = useState(null);
  const [mapRef, setMapRef] = useState(null);

  // Initialize WebSocket connection
  useEffect(() => {
    const newSocket = io('/api/heatmap/ws', {
      auth: { token: userToken },
      transports: ['websocket']
    });

    newSocket.on('initial_data', (data) => {
      setHeatmapData(data);
      renderHexagons(data.hexagons);
    });

    newSocket.on('update', (data) => {
      setHeatmapData(data);
      updateHexagons(data.hexagons);
    });

    setSocket(newSocket);

    return () => newSocket.close();
  }, [userToken]);

  // Handle map move/zoom
  const handleMapChange = useCallback(async (evt) => {
    const bounds = evt.target.getBounds();
    const zoom = evt.target.getZoom();
    
    // Update WebSocket subscription
    if (socket) {
      socket.emit('subscribe', {
        bounds: JSON.stringify([
          [bounds.getWest(), bounds.getSouth()],
          [bounds.getEast(), bounds.getNorth()]
        ]),
        resolution: Math.max(4, Math.min(12, Math.floor(zoom - 2))),
        layers: ['issues', 'traffic']
      });
    }
  }, [socket]);

  // Render hexagons on map
  const renderHexagons = (hexagons) => {
    if (!mapRef) return;

    // Remove existing hexagon layer
    if (mapRef.getLayer('hexagons')) {
      mapRef.removeLayer('hexagons');
      mapRef.removeSource('hexagons');
    }

    // Create GeoJSON for hexagons
    const geojson = {
      type: 'FeatureCollection',
      features: hexagons.map(hex => ({
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [hex.boundary.map(([lng, lat]) => [lng, lat])]
        },
        properties: {
          intensity: hex.intensity,
          count: hex.count,
          riskLevel: hex.riskLevel,
          categories: hex.categories
        }
      }))
    };

    // Add source and layer
    mapRef.addSource('hexagons', {
      type: 'geojson',
      data: geojson
    });

    mapRef.addLayer({
      id: 'hexagons',
      type: 'fill',
      source: 'hexagons',
      paint: {
        'fill-color': [
          'case',
          ['==', ['get', 'riskLevel'], 'critical'], '#ff0000',
          ['==', ['get', 'riskLevel'], 'high'], '#ff6600',
          ['==', ['get', 'riskLevel'], 'medium'], '#ffff00',
          '#00ff00'
        ],
        'fill-opacity': ['*', ['get', 'intensity'], 0.6]
      }
    });
  };

  return (
    <Map
      ref={setMapRef}
      style={{ width: '100%', height: '100vh' }}
      mapStyle="https://demotiles.maplibre.org/style.json"
      onMoveEnd={handleMapChange}
      onZoomEnd={handleMapChange}
    >
      {/* Additional map components */}
    </Map>
  );
};
```

### **Vue + OpenLayers Integration**:

```javascript
<template>
  <div id="map" class="map-container"></div>
</template>

<script>
import 'ol/ol.css';
import { Map, View } from 'ol';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import OSM from 'ol/source/OSM';
import { Polygon } from 'ol/geom';
import { Feature } from 'ol';
import { io } from 'socket.io-client';

export default {
  name: 'HeatmapComponent',
  props: ['userToken'],
  data() {
    return {
      map: null,
      socket: null,
      hexagonLayer: null
    };
  },
  
  async mounted() {
    await this.initializeMap();
    await this.initializeWebSocket();
  },
  
  methods: {
    async initializeMap() {
      this.hexagonLayer = new VectorLayer({
        source: new VectorSource()
      });

      this.map = new Map({
        target: 'map',
        layers: [
          new TileLayer({ source: new OSM() }),
          this.hexagonLayer
        ],
        view: new View({
          center: [8553628, 3287851], // Delhi coordinates in Web Mercator
          zoom: 10
        })
      });

      // Handle map move events
      this.map.on('moveend', this.handleMapMove);
    },

    async initializeWebSocket() {
      this.socket = io('/api/heatmap/ws', {
        auth: { token: this.userToken }
      });

      this.socket.on('initial_data', this.updateHexagons);
      this.socket.on('update', this.updateHexagons);
    },

    handleMapMove() {
      const extent = this.map.getView().calculateExtent(this.map.getSize());
      const bounds = ol.proj.transformExtent(extent, 'EPSG:3857', 'EPSG:4326');
      
      this.socket.emit('subscribe', {
        bounds: JSON.stringify([[bounds[0], bounds[1]], [bounds[2], bounds[3]]]),
        resolution: Math.max(6, Math.min(10, this.map.getView().getZoom() - 2))
      });
    },

    updateHexagons(data) {
      const source = this.hexagonLayer.getSource();
      source.clear();

      data.hexagons.forEach(hex => {
        const coords = hex.boundary.map(([lng, lat]) => 
          ol.proj.fromLonLat([lng, lat])
        );
        
        const polygon = new Polygon([coords]);
        const feature = new Feature({
          geometry: polygon,
          intensity: hex.intensity,
          count: hex.count,
          riskLevel: hex.riskLevel
        });

        source.addFeature(feature);
      });
    }
  }
};
</script>
```

---

## ⚡ Performance Optimization

### **1. Request Optimization**

```javascript
// Debounce map updates to avoid excessive requests
const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

const debouncedMapUpdate = debounce(handleMapMove, 500);
map.on('move', debouncedMapUpdate);
```

### **2. Data Pagination for Large Areas**

```javascript
async function loadLargeAreaData(bounds) {
  const areaSize = calculateAreaSize(bounds);
  
  if (areaSize > 100) {
    // Split large area into smaller chunks
    const chunks = splitBounds(bounds, 4); // 2x2 grid
    const promises = chunks.map(chunk => 
      loadHeatmapData(chunk, { maxHexagons: 500 })
    );
    
    const results = await Promise.all(promises);
    return mergeHeatmapData(results);
  } else {
    return loadHeatmapData(bounds);
  }
}
```

### **3. Efficient Rendering**

```javascript
// Use canvas rendering for large datasets
class HexagonRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
  }
  
  renderHexagons(hexagons, viewport) {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    hexagons.forEach(hex => {
      if (this.isInViewport(hex, viewport)) {
        this.drawHexagon(hex);
      }
    });
  }
  
  drawHexagon(hex) {
    const color = this.getIntensityColor(hex.intensity);
    this.ctx.fillStyle = color;
    this.ctx.beginPath();
    
    hex.boundary.forEach(([x, y], index) => {
      const screenCoords = this.worldToScreen(x, y);
      if (index === 0) {
        this.ctx.moveTo(screenCoords.x, screenCoords.y);
      } else {
        this.ctx.lineTo(screenCoords.x, screenCoords.y);
      }
    });
    
    this.ctx.closePath();
    this.ctx.fill();
  }
}
```

---

## 🚨 Error Handling

### **Common Error Codes**:

| Status Code | Error | Description | Solution |
|-------------|--------|-------------|----------|
| 400 | Bad Request | Invalid bounds or parameters | Check parameter format |
| 401 | Unauthorized | Missing or invalid token | Refresh authentication token |
| 408 | Request Timeout | Area too large to process | Reduce area size or increase resolution |
| 429 | Rate Limited | Too many requests | Implement request throttling |
| 500 | Server Error | Internal processing error | Retry with exponential backoff |

### **Error Handling Example**:

```javascript
async function fetchHeatmapWithRetry(url, options, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      
      if (response.status === 408) {
        throw new Error('AREA_TOO_LARGE');
      }
      
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After') || 60;
        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
        continue;
      }
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
      
    } catch (error) {
      if (error.message === 'AREA_TOO_LARGE') {
        // Reduce area size and retry
        const smallerBounds = reduceAreaSize(bounds, 0.5);
        return fetchHeatmapWithRetry(updateUrlBounds(url, smallerBounds), options, maxRetries - 1);
      }
      
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }
}
```

---

## 🎯 Best Practices

### **1. Zoom-Based Resolution**

```javascript
function getOptimalResolution(zoomLevel) {
  if (zoomLevel <= 6) return 4;      // Country/state level
  if (zoomLevel <= 8) return 6;      // City level
  if (zoomLevel <= 10) return 8;     // Neighborhood level
  if (zoomLevel <= 12) return 9;     // Block level
  return 10;                         // Street level
}
```

### **2. Layer Management**

```javascript
class LayerManager {
  constructor() {
    this.activeLayers = new Set(['issues']);
    this.layerVisibility = {
      issues: true,
      weather: false,
      traffic: false,
      events: false
    };
  }
  
  toggleLayer(layer, visible) {
    this.layerVisibility[layer] = visible;
    
    if (visible) {
      this.activeLayers.add(layer);
    } else {
      this.activeLayers.delete(layer);
    }
    
    this.updateHeatmap();
  }
  
  getActiveLayers() {
    return Array.from(this.activeLayers);
  }
}
```

### **3. Memory Management**

```javascript
// Implement cleanup for WebSocket connections
class HeatmapConnection {
  constructor(token) {
    this.socket = null;
    this.token = token;
    this.subscriptions = new Map();
  }
  
  connect() {
    this.socket = io('/api/heatmap/ws', {
      auth: { token: this.token }
    });
    
    // Set up connection health monitoring
    this.socket.on('disconnect', () => {
      console.warn('WebSocket disconnected, attempting reconnect...');
      setTimeout(() => this.connect(), 5000);
    });
  }
  
  cleanup() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.subscriptions.clear();
  }
}
```

### **4. Responsive Design**

```javascript
// Adjust data density based on screen size
function getMaxHexagons() {
  const screenWidth = window.innerWidth;
  const screenHeight = window.innerHeight;
  const screenArea = screenWidth * screenHeight;
  
  // Reduce hexagon count for smaller screens
  if (screenArea < 500000) return 200;   // Mobile
  if (screenArea < 1000000) return 500;  // Tablet
  return 1000;                           // Desktop
}
```

---

## 🔧 Development Tools

### **API Testing Script**:

```javascript
// test-heatmap-api.js
const testHeatmapAPI = async () => {
  const baseURL = 'http://localhost:3000';
  const token = 'your-jwt-token';
  const bounds = JSON.stringify([[77.0, 28.4], [77.3, 28.7]]); // Delhi
  
  const tests = [
    {
      name: 'Health Check',
      url: `${baseURL}/api/heatmap/health`
    },
    {
      name: 'Realtime Heatmap',
      url: `${baseURL}/api/heatmap/realtime?bounds=${bounds}&resolution=8`
    },
    {
      name: 'Predictive Heatmap', 
      url: `${baseURL}/api/heatmap/predictive?bounds=${bounds}&timeframe=30min`
    },
    {
      name: 'Multi-layer Heatmap',
      url: `${baseURL}/api/heatmap/multilayer?bounds=${bounds}&layers=issues,traffic`
    }
  ];
  
  for (const test of tests) {
    try {
      console.log(`Testing ${test.name}...`);
      const response = await fetch(test.url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const data = await response.json();
      console.log(`✅ ${test.name}: Success`, data);
    } catch (error) {
      console.error(`❌ ${test.name}: Failed`, error);
    }
  }
};

testHeatmapAPI();
```

### **WebSocket Test Client**:

```html
<!DOCTYPE html>
<html>
<head>
  <title>Heatmap WebSocket Test</title>
  <script src="https://cdn.socket.io/4.0.0/socket.io.min.js"></script>
</head>
<body>
  <div id="status">Disconnected</div>
  <button onclick="connect()">Connect</button>
  <button onclick="subscribe()">Subscribe</button>
  <div id="data"></div>
  
  <script>
    let socket = null;
    
    function connect() {
      socket = io('/api/heatmap/ws', {
        auth: { token: 'your-jwt-token' }
      });
      
      socket.on('connect', () => {
        document.getElementById('status').textContent = 'Connected';
      });
      
      socket.on('initial_data', (data) => {
        document.getElementById('data').innerHTML = 
          `<h3>Initial Data</h3><pre>${JSON.stringify(data, null, 2)}</pre>`;
      });
      
      socket.on('update', (data) => {
        document.getElementById('data').innerHTML = 
          `<h3>Update Data</h3><pre>${JSON.stringify(data, null, 2)}</pre>`;
      });
    }
    
    function subscribe() {
      if (socket) {
        socket.emit('subscribe', {
          bounds: JSON.stringify([[77.0, 28.4], [77.3, 28.7]]),
          resolution: 8,
          layers: ['issues']
        });
      }
    }
  </script>
</body>
</html>
```

---

## 📋 Checklist for Frontend Implementation

### **Phase 1: Basic Integration**
- [ ] Set up authentication headers
- [ ] Implement health check endpoint
- [ ] Create basic heatmap data fetching
- [ ] Render hexagonal clusters on map
- [ ] Handle loading and error states

### **Phase 2: Real-time Features**
- [ ] Establish WebSocket connection
- [ ] Implement area subscription
- [ ] Handle real-time data updates
- [ ] Add connection health monitoring
- [ ] Implement automatic reconnection

### **Phase 3: Advanced Features**
- [ ] Add predictive heatmap overlay
- [ ] Implement multi-layer visualization
- [ ] Create anomaly alert system
- [ ] Add analytics dashboard
- [ ] Implement advanced clustering

### **Phase 4: Optimization**
- [ ] Add client-side caching
- [ ] Implement progressive data loading
- [ ] Optimize rendering performance
- [ ] Add request debouncing
- [ ] Handle large area optimization

### **Phase 5: Polish**
- [ ] Add smooth transitions
- [ ] Implement responsive design
- [ ] Add accessibility features
- [ ] Create user preferences
- [ ] Add export functionality

---

## 🆘 Support and Troubleshooting

### **Common Issues**:

1. **"QR code expires after 20 seconds"** - This is normal WhatsApp behavior
2. **"Area too large" errors** - Reduce the geographic bounds or increase resolution number
3. **Empty hexagon data** - Check authentication and ensure the area has data
4. **WebSocket disconnections** - Implement automatic reconnection logic
5. **Performance issues** - Reduce maxHexagons parameter and implement data pagination

### **Debug Mode**:

```javascript
// Enable debug logging
const DEBUG_HEATMAP = true;

function debugLog(message, data) {
  if (DEBUG_HEATMAP) {
    console.log(`[HEATMAP DEBUG] ${message}`, data);
  }
}

// Use in your implementation
debugLog('Fetching heatmap data', { bounds, resolution });
debugLog('WebSocket data received', data);
```

### **Performance Monitoring**:

```javascript
class HeatmapPerformanceMonitor {
  constructor() {
    this.metrics = {
      apiCallTime: [],
      renderTime: [],
      memoryUsage: []
    };
  }
  
  startTimer(operation) {
    return performance.now();
  }
  
  endTimer(operation, startTime) {
    const duration = performance.now() - startTime;
    this.metrics[`${operation}Time`].push(duration);
    console.log(`${operation} took ${duration.toFixed(2)}ms`);
    return duration;
  }
  
  getAverageTime(operation) {
    const times = this.metrics[`${operation}Time`];
    return times.reduce((a, b) => a + b, 0) / times.length;
  }
}
```

---

## 📞 Contact Information

For technical questions or issues with the Advanced Map Integration:

- **Backend API Documentation**: `/api/heatmap/health`
- **WebSocket Status**: Check connection at `/api/heatmap/ws`
- **Real-time Testing**: Use the provided test scripts
- **Performance Issues**: Monitor with the debug tools provided

---

*This documentation is generated for the Advanced Heatmap System v2.0.0. Last updated: September 2025*