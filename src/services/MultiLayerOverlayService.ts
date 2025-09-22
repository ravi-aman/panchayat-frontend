// ===== MULTI-LAYER OVERLAY SYSTEM =====
// Google Maps-style layer management with traffic, weather, satellite overlays
// Enterprise-grade layer orchestration for comprehensive mapping

export interface LayerConfig {
  id: string;
  name: string;
  type: 'vector' | 'raster' | 'heatmap' | 'geojson' | 'deck' | 'webgl';
  source: LayerSource;
  style: LayerStyle;
  visibility: boolean;
  opacity: number;
  zIndex: number;
  minZoom: number;
  maxZoom: number;
  interactive: boolean;
  updateFrequency: number; // milliseconds
  cacheStrategy: 'memory' | 'disk' | 'network' | 'hybrid';
  loadingStrategy: 'eager' | 'lazy' | 'progressive' | 'viewport';
}

export interface LayerSource {
  type: 'tiles' | 'api' | 'websocket' | 'geojson' | 'csv' | 'realtime';
  url?: string;
  tiles?: string[];
  data?: any;
  apiKey?: string;
  websocketUrl?: string;
  refreshInterval?: number;
  attribution?: string;
  bounds?: [number, number, number, number];
  tileSize?: number;
  scheme?: 'xyz' | 'tms';
}

export interface LayerStyle {
  paint?: any;
  layout?: any;
  filter?: any;
  sprite?: string;
  glyphs?: string;
  metadata?: any;
}

export interface LayerGroup {
  id: string;
  name: string;
  layers: string[];
  exclusive: boolean; // Only one layer in group can be active
  defaultLayer?: string;
  category: 'base' | 'overlay' | 'data' | 'analysis' | 'real-time';
}

export interface LayerEvent {
  type: 'load' | 'error' | 'update' | 'visibility-change' | 'opacity-change';
  layerId: string;
  data?: any;
  error?: Error;
  timestamp: number;
}

/**
 * Multi-Layer Overlay Manager
 * Orchestrates complex layer interactions like Google Maps
 * Handles base maps, overlays, real-time data, and analytics layers
 */
export class MultiLayerOverlayService {
  private layers: Map<string, LayerConfig> = new Map();
  private layerGroups: Map<string, LayerGroup> = new Map();
  private activeBasemap: string | null = null;
  private eventListeners: Map<string, ((event: LayerEvent) => void)[]> = new Map();
  private updateTimers: Map<string, NodeJS.Timeout> = new Map();
  private loadingQueue: string[] = [];
  private cache: Map<string, any> = new Map();

  constructor() {
    this.initializeDefaultLayers();
    this.initializeLayerGroups();
  }

  /**
   * Initialize default layer configurations
   * Production-ready layers for civic applications
   */
  private initializeDefaultLayers(): void {
    // ===== BASE MAPS =====
    this.layers.set('osm-streets', {
      id: 'osm-streets',
      name: 'OpenStreetMap Streets',
      type: 'vector',
      source: {
        type: 'tiles',
        tiles: [
          'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
          'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
          'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png'
        ],
        attribution: '© OpenStreetMap contributors',
        tileSize: 256,
        scheme: 'xyz'
      },
      style: {},
      visibility: true,
      opacity: 1.0,
      zIndex: 0,
      minZoom: 0,
      maxZoom: 19,
      interactive: false,
      updateFrequency: 0,
      cacheStrategy: 'hybrid',
      loadingStrategy: 'eager'
    });

    this.layers.set('satellite', {
      id: 'satellite',
      name: 'Satellite Imagery',
      type: 'raster',
      source: {
        type: 'tiles',
        tiles: [
          'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
          'https://mt2.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
          'https://mt3.google.com/vt/lyrs=s&x={x}&y={y}&z={z}'
        ],
        attribution: '© Google',
        tileSize: 256
      },
      style: {},
      visibility: false,
      opacity: 1.0,
      zIndex: 0,
      minZoom: 0,
      maxZoom: 20,
      interactive: false,
      updateFrequency: 0,
      cacheStrategy: 'disk',
      loadingStrategy: 'lazy'
    });

    this.layers.set('terrain', {
      id: 'terrain',
      name: 'Terrain Relief',
      type: 'raster',
      source: {
        type: 'tiles',
        tiles: [
          'https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}',
          'https://mt2.google.com/vt/lyrs=p&x={x}&y={y}&z={z}'
        ],
        attribution: '© Google',
        tileSize: 256
      },
      style: {},
      visibility: false,
      opacity: 1.0,
      zIndex: 0,
      minZoom: 0,
      maxZoom: 15,
      interactive: false,
      updateFrequency: 0,
      cacheStrategy: 'disk',
      loadingStrategy: 'lazy'
    });

    // ===== REAL-TIME OVERLAYS =====
    this.layers.set('traffic', {
      id: 'traffic',
      name: 'Live Traffic',
      type: 'vector',
      source: {
        type: 'api',
        url: '/api/traffic/live',
        refreshInterval: 30000, // 30 seconds
        attribution: 'Live Traffic Data'
      },
      style: {
        paint: {
          'line-color': [
            'case',
            ['==', ['get', 'congestion'], 'heavy'], '#d73027',
            ['==', ['get', 'congestion'], 'moderate'], '#fc8d59',
            ['==', ['get', 'congestion'], 'light'], '#fee08b',
            '#91bfdb'
          ],
          'line-width': ['interpolate', ['linear'], ['zoom'], 10, 2, 16, 8],
          'line-opacity': 0.8
        }
      },
      visibility: false,
      opacity: 0.8,
      zIndex: 50,
      minZoom: 8,
      maxZoom: 20,
      interactive: true,
      updateFrequency: 30000,
      cacheStrategy: 'memory',
      loadingStrategy: 'viewport'
    });

    this.layers.set('weather', {
      id: 'weather',
      name: 'Weather Radar',
      type: 'raster',
      source: {
        type: 'tiles',
        tiles: [
          'https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=YOUR_API_KEY'
        ],
        attribution: '© OpenWeatherMap',
        refreshInterval: 600000 // 10 minutes
      },
      style: {},
      visibility: false,
      opacity: 0.6,
      zIndex: 40,
      minZoom: 3,
      maxZoom: 15,
      interactive: false,
      updateFrequency: 600000,
      cacheStrategy: 'hybrid',
      loadingStrategy: 'lazy'
    });

    // ===== CIVIC DATA LAYERS =====
    this.layers.set('civic-heatmap', {
      id: 'civic-heatmap',
      name: 'Civic Activity Heatmap',
      type: 'heatmap',
      source: {
        type: 'api',
        url: '/api/civic/heatmap',
        refreshInterval: 300000 // 5 minutes
      },
      style: {
        paint: {
          'heatmap-weight': ['interpolate', ['linear'], ['get', 'value'], 0, 0, 100, 1],
          'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 0, 1, 15, 3],
          'heatmap-color': [
            'interpolate', ['linear'], ['heatmap-density'],
            0, 'rgba(33,102,172,0)',
            0.2, 'rgb(103,169,207)',
            0.4, 'rgb(209,229,240)',
            0.6, 'rgb(253,219,199)',
            0.8, 'rgb(239,138,98)',
            1, 'rgb(178,24,43)'
          ],
          'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 0, 2, 15, 20],
          'heatmap-opacity': 0.8
        }
      },
      visibility: true,
      opacity: 0.8,
      zIndex: 30,
      minZoom: 5,
      maxZoom: 18,
      interactive: true,
      updateFrequency: 300000,
      cacheStrategy: 'memory',
      loadingStrategy: 'progressive'
    });

    this.layers.set('administrative-boundaries', {
      id: 'administrative-boundaries',
      name: 'Administrative Boundaries',
      type: 'vector',
      source: {
        type: 'geojson',
        data: '/api/boundaries/administrative',
        attribution: 'Administrative Data'
      },
      style: {
        paint: {
          'fill-color': 'rgba(200,200,200,0.1)',
          'fill-outline-color': '#666666'
        },
        layout: {
          'visibility': 'visible'
        }
      },
      visibility: false,
      opacity: 0.7,
      zIndex: 20,
      minZoom: 6,
      maxZoom: 20,
      interactive: true,
      updateFrequency: 0,
      cacheStrategy: 'disk',
      loadingStrategy: 'lazy'
    });

    // ===== ANALYSIS LAYERS =====
    this.layers.set('population-density', {
      id: 'population-density',
      name: 'Population Density',
      type: 'vector',
      source: {
        type: 'api',
        url: '/api/demographics/population',
        refreshInterval: 86400000 // 24 hours
      },
      style: {
        paint: {
          'fill-color': [
            'interpolate', ['linear'], ['get', 'density'],
            0, '#ffffcc',
            100, '#d9f0a3',
            500, '#addd8e',
            1000, '#78c679',
            2000, '#41ab5d',
            5000, '#238443',
            10000, '#005a32'
          ],
          'fill-opacity': 0.7
        }
      },
      visibility: false,
      opacity: 0.7,
      zIndex: 25,
      minZoom: 8,
      maxZoom: 16,
      interactive: true,
      updateFrequency: 86400000,
      cacheStrategy: 'disk',
      loadingStrategy: 'lazy'
    });
  }

  /**
   * Initialize layer groups for organized management
   */
  private initializeLayerGroups(): void {
    this.layerGroups.set('basemaps', {
      id: 'basemaps',
      name: 'Base Maps',
      layers: ['osm-streets', 'satellite', 'terrain'],
      exclusive: true,
      defaultLayer: 'osm-streets',
      category: 'base'
    });

    this.layerGroups.set('real-time', {
      id: 'real-time',
      name: 'Real-time Data',
      layers: ['traffic', 'weather'],
      exclusive: false,
      category: 'real-time'
    });

    this.layerGroups.set('civic-data', {
      id: 'civic-data',
      name: 'Civic Data',
      layers: ['civic-heatmap', 'administrative-boundaries'],
      exclusive: false,
      category: 'data'
    });

    this.layerGroups.set('analysis', {
      id: 'analysis',
      name: 'Analysis Layers',
      layers: ['population-density'],
      exclusive: false,
      category: 'analysis'
    });
  }

  /**
   * Add new layer configuration
   */
  addLayer(config: LayerConfig): void {
    this.layers.set(config.id, config);
    this.setupLayerUpdates(config);
    this.emitEvent({
      type: 'load',
      layerId: config.id,
      timestamp: Date.now()
    });
  }

  /**
   * Remove layer
   */
  removeLayer(layerId: string): void {
    if (this.updateTimers.has(layerId)) {
      clearInterval(this.updateTimers.get(layerId)!);
      this.updateTimers.delete(layerId);
    }
    this.layers.delete(layerId);
    this.cache.delete(layerId);
  }

  /**
   * Toggle layer visibility
   */
  toggleLayer(layerId: string): boolean {
    const layer = this.layers.get(layerId);
    if (!layer) return false;

    layer.visibility = !layer.visibility;
    
    // Handle exclusive groups
    if (layer.visibility) {
      this.handleExclusiveGroups(layerId);
    }

    this.emitEvent({
      type: 'visibility-change',
      layerId,
      data: { visibility: layer.visibility },
      timestamp: Date.now()
    });

    return layer.visibility;
  }

  /**
   * Set layer opacity
   */
  setLayerOpacity(layerId: string, opacity: number): void {
    const layer = this.layers.get(layerId);
    if (!layer) return;

    layer.opacity = Math.max(0, Math.min(1, opacity));
    
    this.emitEvent({
      type: 'opacity-change',
      layerId,
      data: { opacity: layer.opacity },
      timestamp: Date.now()
    });
  }

  /**
   * Get visible layers in render order
   */
  getVisibleLayers(): LayerConfig[] {
    return Array.from(this.layers.values())
      .filter(layer => layer.visibility)
      .sort((a, b) => a.zIndex - b.zIndex);
  }

  /**
   * Get layer configuration
   */
  getLayer(layerId: string): LayerConfig | undefined {
    return this.layers.get(layerId);
  }

  /**
   * Get all layers in a group
   */
  getLayerGroup(groupId: string): LayerConfig[] {
    const group = this.layerGroups.get(groupId);
    if (!group) return [];

    return group.layers
      .map(layerId => this.layers.get(layerId))
      .filter((layer): layer is LayerConfig => layer !== undefined);
  }

  /**
   * Set active basemap
   */
  setBasemap(layerId: string): void {
    const basemapGroup = this.layerGroups.get('basemaps');
    if (!basemapGroup || !basemapGroup.layers.includes(layerId)) return;

    // Hide all basemaps
    basemapGroup.layers.forEach(id => {
      const layer = this.layers.get(id);
      if (layer) layer.visibility = false;
    });

    // Show selected basemap
    const selectedLayer = this.layers.get(layerId);
    if (selectedLayer) {
      selectedLayer.visibility = true;
      this.activeBasemap = layerId;
    }
  }

  /**
   * Handle exclusive group logic
   */
  private handleExclusiveGroups(layerId: string): void {
    for (const group of this.layerGroups.values()) {
      if (group.exclusive && group.layers.includes(layerId)) {
        // Hide other layers in exclusive group
        group.layers.forEach(id => {
          if (id !== layerId) {
            const layer = this.layers.get(id);
            if (layer) layer.visibility = false;
          }
        });
        break;
      }
    }
  }

  /**
   * Setup automatic layer updates
   */
  private setupLayerUpdates(config: LayerConfig): void {
    if (config.updateFrequency > 0) {
      const timer = setInterval(() => {
        this.updateLayer(config.id);
      }, config.updateFrequency);
      
      this.updateTimers.set(config.id, timer);
    }
  }

  /**
   * Update layer data
   */
  private async updateLayer(layerId: string): Promise<void> {
    const layer = this.layers.get(layerId);
    if (!layer || !layer.visibility) return;

    try {
      let data: any;
      
      switch (layer.source.type) {
        case 'api':
          data = await this.fetchAPIData(layer.source.url!);
          break;
        case 'websocket':
          // WebSocket data is updated via events
          return;
        default:
          return;
      }

      // Cache the data
      this.cache.set(layerId, data);

      this.emitEvent({
        type: 'update',
        layerId,
        data,
        timestamp: Date.now()
      });
    } catch (error) {
      this.emitEvent({
        type: 'error',
        layerId,
        error: error as Error,
        timestamp: Date.now()
      });
    }
  }

  /**
   * Fetch data from API
   */
  private async fetchAPIData(url: string): Promise<any> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }
    return response.json();
  }

  /**
   * Add event listener
   */
  addEventListener(eventType: string, listener: (event: LayerEvent) => void): void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, []);
    }
    this.eventListeners.get(eventType)!.push(listener);
  }

  /**
   * Remove event listener
   */
  removeEventListener(eventType: string, listener: (event: LayerEvent) => void): void {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Emit layer event
   */
  private emitEvent(event: LayerEvent): void {
    const listeners = this.eventListeners.get(event.type);
    if (listeners) {
      listeners.forEach(listener => listener(event));
    }
  }

  /**
   * Get layer statistics
   */
  getLayerStats(): {
    totalLayers: number;
    visibleLayers: number;
    loadingLayers: number;
    activeBasemap: string | null;
    groupCount: number;
    cacheSize: number;
  } {
    const visibleCount = Array.from(this.layers.values())
      .filter(layer => layer.visibility).length;

    return {
      totalLayers: this.layers.size,
      visibleLayers: visibleCount,
      loadingLayers: this.loadingQueue.length,
      activeBasemap: this.activeBasemap,
      groupCount: this.layerGroups.size,
      cacheSize: this.cache.size
    };
  }

  /**
   * Clear all caches
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Export layer configuration
   */
  exportConfig(): any {
    return {
      layers: Array.from(this.layers.entries()),
      groups: Array.from(this.layerGroups.entries()),
      activeBasemap: this.activeBasemap
    };
  }

  /**
   * Import layer configuration
   */
  importConfig(config: any): void {
    if (config.layers) {
      this.layers = new Map(config.layers);
    }
    if (config.groups) {
      this.layerGroups = new Map(config.groups);
    }
    if (config.activeBasemap) {
      this.activeBasemap = config.activeBasemap;
    }
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    // Clear all timers
    this.updateTimers.forEach(timer => clearInterval(timer));
    this.updateTimers.clear();
    
    // Clear caches
    this.cache.clear();
    
    // Clear listeners
    this.eventListeners.clear();
  }
}

// Singleton instance
export const multiLayerOverlayService = new MultiLayerOverlayService();