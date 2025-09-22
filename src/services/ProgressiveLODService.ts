// ===== PROGRESSIVE LEVEL-OF-DETAIL (LOD) SYSTEM =====
// Uber/Google Maps-style adaptive rendering for smooth zoom experience
// Automatically switches between heatmaps, clusters, and individual points

export interface LODLevel {
  name: string;
  minZoom: number;
  maxZoom: number;
  renderType: 'heatmap' | 'hexgrid' | 'clusters' | 'points' | 'dense-points';
  maxFeatures: number;
  aggregationRadius: number;
  opacity: (zoom: number) => number;
  size: (zoom: number) => number;
  clustering: {
    enabled: boolean;
    radius: number;
    minPoints: number;
  };
}

export interface LODTransition {
  from: string;
  to: string;
  duration: number;
  easing: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';
  blendMode: 'fade' | 'morph' | 'scale';
}

export interface ViewportState {
  zoom: number;
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  center: [number, number];
  dataCount: number;
  density: number;
}

/**
 * Progressive Level-of-Detail Service
 * Provides smooth transitions between different visualization modes
 * Based on Uber's rendering pipeline for driver distribution
 */
export class ProgressiveLODService {
  private lodLevels: LODLevel[] = [];
  private transitions: LODTransition[] = [];
  private currentLevel: LODLevel | null = null;
  private isTransitioning: boolean = false;

  constructor() {
    this.initializeLODLevels();
    this.initializeTransitions();
  }

  /**
   * Initialize Level-of-Detail hierarchy
   * Optimized for civic heatmap data
   */
  private initializeLODLevels(): void {
    this.lodLevels = [
      // Global/Continental View (0-4)
      {
        name: 'global-heatmap',
        minZoom: 0,
        maxZoom: 4,
        renderType: 'heatmap',
        maxFeatures: 1000,
        aggregationRadius: 50000, // 50km
        opacity: (zoom) => Math.min(0.8, 0.4 + zoom * 0.1),
        size: (zoom) => 20 + zoom * 5,
        clustering: {
          enabled: false,
          radius: 0,
          minPoints: 0
        }
      },

      // Country/State View (5-7)
      {
        name: 'regional-hexgrid',
        minZoom: 5,
        maxZoom: 7,
        renderType: 'hexgrid',
        maxFeatures: 5000,
        aggregationRadius: 10000, // 10km
        opacity: (zoom) => 0.7 + (zoom - 5) * 0.1,
        size: (zoom) => 15 + (zoom - 5) * 3,
        clustering: {
          enabled: true,
          radius: 5000,
          minPoints: 10
        }
      },

      // City View (8-11)
      {
        name: 'city-clusters',
        minZoom: 8,
        maxZoom: 11,
        renderType: 'clusters',
        maxFeatures: 10000,
        aggregationRadius: 1000, // 1km
        opacity: (zoom) => 0.8 + (zoom - 8) * 0.05,
        size: (zoom) => 12 + (zoom - 8) * 2,
        clustering: {
          enabled: true,
          radius: 500,
          minPoints: 5
        }
      },

      // District View (12-14)
      {
        name: 'district-mixed',
        minZoom: 12,
        maxZoom: 14,
        renderType: 'clusters',
        maxFeatures: 25000,
        aggregationRadius: 200, // 200m
        opacity: (zoom) => 0.85 + (zoom - 12) * 0.05,
        size: (zoom) => 8 + (zoom - 12) * 1.5,
        clustering: {
          enabled: true,
          radius: 100,
          minPoints: 3
        }
      },

      // Neighborhood View (15-17)
      {
        name: 'neighborhood-points',
        minZoom: 15,
        maxZoom: 17,
        renderType: 'points',
        maxFeatures: 50000,
        aggregationRadius: 50, // 50m
        opacity: (zoom) => 0.9 + (zoom - 15) * 0.03,
        size: (zoom) => 6 + (zoom - 15) * 1,
        clustering: {
          enabled: true,
          radius: 25,
          minPoints: 2
        }
      },

      // Building Level (18+)
      {
        name: 'building-dense',
        minZoom: 18,
        maxZoom: 22,
        renderType: 'dense-points',
        maxFeatures: 100000,
        aggregationRadius: 10, // 10m
        opacity: (zoom) => Math.min(1.0, 0.95 + (zoom - 18) * 0.01),
        size: (zoom) => 4 + (zoom - 18) * 0.5,
        clustering: {
          enabled: false,
          radius: 5,
          minPoints: 1
        }
      }
    ];
  }

  /**
   * Initialize smooth transitions between LOD levels
   */
  private initializeTransitions(): void {
    this.transitions = [
      {
        from: 'global-heatmap',
        to: 'regional-hexgrid',
        duration: 800,
        easing: 'ease-in-out',
        blendMode: 'morph'
      },
      {
        from: 'regional-hexgrid',
        to: 'city-clusters',
        duration: 600,
        easing: 'ease-in-out',
        blendMode: 'morph'
      },
      {
        from: 'city-clusters',
        to: 'district-mixed',
        duration: 400,
        easing: 'ease-out',
        blendMode: 'fade'
      },
      {
        from: 'district-mixed',
        to: 'neighborhood-points',
        duration: 400,
        easing: 'ease-out',
        blendMode: 'scale'
      },
      {
        from: 'neighborhood-points',
        to: 'building-dense',
        duration: 300,
        easing: 'ease-out',
        blendMode: 'fade'
      }
    ];
  }

  /**
   * Determine optimal LOD level based on viewport state
   * Core algorithm that drives the adaptive rendering
   */
  getOptimalLODLevel(viewport: ViewportState): LODLevel {
    // Find base level by zoom
    let optimalLevel = this.lodLevels.find(level => 
      viewport.zoom >= level.minZoom && viewport.zoom <= level.maxZoom
    );

    if (!optimalLevel) {
      // Fallback to closest level
      optimalLevel = viewport.zoom < 5 
        ? this.lodLevels[0] 
        : this.lodLevels[this.lodLevels.length - 1];
    }

    // Adjust based on data density
    const adjustedLevel = this.adjustForDataDensity(optimalLevel, viewport);
    
    return adjustedLevel;
  }

  /**
   * Adjust LOD level based on data density
   * High density areas need more aggressive clustering
   */
  private adjustForDataDensity(level: LODLevel, viewport: ViewportState): LODLevel {
    const area = this.calculateViewportArea(viewport.bounds);
    const density = viewport.dataCount / area;

    // If density is very high, use more aggressive clustering
    if (density > 1000 && level.renderType === 'points') {
      return this.lodLevels.find(l => l.name === 'city-clusters') || level;
    }

    // If density is very low, can show individual points earlier
    if (density < 10 && level.renderType === 'clusters' && viewport.zoom > 10) {
      return this.lodLevels.find(l => l.name === 'neighborhood-points') || level;
    }

    return level;
  }

  /**
   * Get rendering configuration for current viewport
   */
  getRenderingConfig(viewport: ViewportState): {
    level: LODLevel;
    style: any;
    filters: any;
    clustering: any;
  } {
    const level = this.getOptimalLODLevel(viewport);
    
    return {
      level,
      style: this.getStyleConfig(level, viewport.zoom),
      filters: this.getFilterConfig(level, viewport),
      clustering: this.getClusteringConfig(level, viewport)
    };
  }

  /**
   * Get style configuration for MapLibre/deck.gl
   */
  private getStyleConfig(level: LODLevel, zoom: number): any {
    const opacity = level.opacity(zoom);
    const size = level.size(zoom);

    switch (level.renderType) {
      case 'heatmap':
        return {
          type: 'heatmap',
          paint: {
            'heatmap-weight': ['interpolate', ['linear'], ['get', 'value'], 0, 0, 100, 1],
            'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 0, 1, level.maxZoom, 3],
            'heatmap-color': [
              'interpolate', ['linear'], ['heatmap-density'],
              0, 'rgba(33,102,172,0)',
              0.2, 'rgb(103,169,207)',
              0.4, 'rgb(209,229,240)',
              0.6, 'rgb(253,219,199)',
              0.8, 'rgb(239,138,98)',
              1, 'rgb(178,24,43)'
            ],
            'heatmap-radius': ['interpolate', ['linear'], ['zoom'], level.minZoom, size * 0.5, level.maxZoom, size],
            'heatmap-opacity': opacity
          }
        };

      case 'hexgrid':
        return {
          type: 'fill',
          paint: {
            'fill-color': [
              'interpolate', ['linear'], ['get', 'density'],
              0, '#f7fbff',
              10, '#deebf7',
              50, '#c6dbef',
              100, '#9ecae1',
              200, '#6baed6',
              500, '#4292c6',
              1000, '#2171b5',
              2000, '#084594'
            ],
            'fill-opacity': opacity * 0.8,
            'fill-outline-color': 'rgba(255,255,255,0.5)'
          }
        };

      case 'clusters':
        return {
          type: 'circle',
          paint: {
            'circle-color': [
              'step', ['get', 'point_count'],
              '#51bbd6', 50,
              '#f1f075', 100,
              '#f28cb1'
            ],
            'circle-radius': [
              'step', ['get', 'point_count'],
              size, 50,
              size * 1.5, 100,
              size * 2
            ],
            'circle-opacity': opacity,
            'circle-stroke-width': 2,
            'circle-stroke-color': '#fff'
          }
        };

      case 'points':
      case 'dense-points':
        return {
          type: 'circle',
          paint: {
            'circle-color': [
              'interpolate', ['linear'], ['get', 'value'],
              0, '#1a9641',
              50, '#ffffbf',
              100, '#d7191c'
            ],
            'circle-radius': size,
            'circle-opacity': opacity,
            'circle-stroke-width': 1,
            'circle-stroke-color': '#fff'
          }
        };

      default:
        return {};
    }
  }

  /**
   * Get filter configuration to limit features
   */
  private getFilterConfig(level: LODLevel, viewport: ViewportState): any {
    const filters: any[] = [];

    // Zoom-based filtering
    if (level.renderType === 'points' && viewport.zoom < 12) {
      filters.push(['>=', ['get', 'value'], 10]); // Only show high-value points at low zoom
    }

    // Density-based filtering
    if (viewport.dataCount > level.maxFeatures) {
      const samplingRate = level.maxFeatures / viewport.dataCount;
      filters.push(['<', ['random'], samplingRate]);
    }

    return filters.length > 0 ? ['all', ...filters] : null;
  }

  /**
   * Get clustering configuration
   */
  private getClusteringConfig(level: LODLevel, viewport: ViewportState): any {
    if (!level.clustering.enabled) {
      return { cluster: false };
    }

    // Adjust cluster radius based on viewport zoom for better performance
    const zoomAdjustedRadius = Math.max(
      level.clustering.radius * (15 / Math.max(viewport.zoom, 1)),
      10
    );

    return {
      cluster: true,
      clusterRadius: zoomAdjustedRadius,
      clusterMaxZoom: level.maxZoom,
      clusterMinPoints: level.clustering.minPoints,
      clusterProperties: {
        'sum': ['+', ['get', 'value']],
        'max': ['max', ['get', 'value']],
        'count': ['+', 1]
      }
    };
  }

  /**
   * Handle LOD transitions with smooth animations
   */
  async transitionToLevel(
    fromLevel: LODLevel,
    toLevel: LODLevel,
    onProgress?: (progress: number) => void
  ): Promise<void> {
    if (this.isTransitioning) return;

    this.isTransitioning = true;
    
    const transition = this.transitions.find(t => 
      t.from === fromLevel.name && t.to === toLevel.name
    ) || this.getDefaultTransition();

    // Animate transition
    await this.animateTransition(transition, onProgress);
    
    this.currentLevel = toLevel;
    this.isTransitioning = false;
  }

  /**
   * Animate smooth transition between LOD levels
   */
  private async animateTransition(
    transition: LODTransition,
    onProgress?: (progress: number) => void
  ): Promise<void> {
    return new Promise((resolve) => {
      const startTime = Date.now();
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / transition.duration, 1);
        
        const easedProgress = this.applyEasing(progress, transition.easing);
        
        if (onProgress) {
          onProgress(easedProgress);
        }

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          resolve();
        }
      };
      
      requestAnimationFrame(animate);
    });
  }

  /**
   * Apply easing function
   */
  private applyEasing(t: number, easing: string): number {
    switch (easing) {
      case 'ease-in':
        return t * t;
      case 'ease-out':
        return 1 - (1 - t) * (1 - t);
      case 'ease-in-out':
        return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      default:
        return t; // linear
    }
  }

  /**
   * Calculate viewport area in square degrees
   */
  private calculateViewportArea(bounds: ViewportState['bounds']): number {
    return (bounds.north - bounds.south) * (bounds.east - bounds.west);
  }

  /**
   * Get default transition
   */
  private getDefaultTransition(): LODTransition {
    return {
      from: '',
      to: '',
      duration: 400,
      easing: 'ease-out',
      blendMode: 'fade'
    };
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): {
    currentLevel: string | null;
    isTransitioning: boolean;
    levelCount: number;
    transitionCount: number;
  } {
    return {
      currentLevel: this.currentLevel?.name || null,
      isTransitioning: this.isTransitioning,
      levelCount: this.lodLevels.length,
      transitionCount: this.transitions.length
    };
  }

  /**
   * Update configuration
   */
  updateConfig(newLevels?: LODLevel[], newTransitions?: LODTransition[]): void {
    if (newLevels) {
      this.lodLevels = newLevels;
    }
    if (newTransitions) {
      this.transitions = newTransitions;
    }
  }
}

// Singleton instance
export const progressiveLODService = new ProgressiveLODService();