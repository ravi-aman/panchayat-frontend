// ===== UBER-STYLE H3 HEXAGONAL GRID SERVICE =====
// World-class hexagonal indexing for scalable geospatial data
// Used by Uber, Ola, Lyft for efficient clustering and heatmaps

import { latLngToCell, cellToLatLng, cellToBoundary, gridDistance, gridDisk } from 'h3-js';


export interface H3Cell {
  h3Index: string;
  resolution: number;
  center: [number, number];
  boundary: [number, number][];
  count: number;
  value: number;
  weight: number;
  density: number;
  metadata: {
    averageValue: number;
    maxValue: number;
    minValue: number;
    categories: Record<string, number>;
    urgencyLevels: Record<string, number>;
    lastUpdated: Date;
  };
}

export interface H3GridConfig {
  resolution: number; // 0-15 (0=global, 15=building level)
  aggregationMethod: 'sum' | 'average' | 'max' | 'count' | 'density';
  smoothingRadius: number;
  minCellCount: number;
  maxCells: number;
}

export interface H3HeatmapData {
  cells: H3Cell[];
  resolution: number;
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  metadata: {
    totalPoints: number;
    cellCount: number;
    maxDensity: number;
    averageDensity: number;
    generatedAt: Date;
  };
}

/**
 * Advanced H3 Hexagonal Grid Service
 * Provides Uber-like hexagonal clustering for massive datasets
 */
export class H3GridService {
  private config: H3GridConfig;
  private cache: Map<string, H3HeatmapData> = new Map();
  private cacheExpiry: Map<string, number> = new Map();

  constructor(config: Partial<H3GridConfig> = {}) {
    this.config = {
      resolution: 8, // City-level resolution (good for civic issues)
      aggregationMethod: 'density',
      smoothingRadius: 1,
      minCellCount: 1,
      maxCells: 10000,
      ...config
    };
  }

  /**
   * Convert raw data points to H3 hexagonal grid
   * This is the core algorithm used by Uber for driver distribution
   */
  generateH3Heatmap(
    dataPoints: Array<{
      lat: number;
      lng: number;
      value: number;
      weight?: number;
      category?: string;
      urgency?: string;
      timestamp?: Date;
    }>,
    bounds: { north: number; south: number; east: number; west: number },
    resolution?: number
  ): H3HeatmapData {
    const res = resolution || this.getOptimalResolution(bounds);
    const cacheKey = this.getCacheKey(bounds, res, dataPoints.length);

    // Check cache first (for performance)
    if (this.cache.has(cacheKey) && this.isCacheValid(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    // Create hexagonal grid
    const h3Cells: Map<string, H3Cell> = new Map();

    // Process each data point
    dataPoints.forEach(point => {
      // Convert geographic coordinate to H3 index
      const h3Index = latLngToCell(point.lat, point.lng, res);
      
      if (!h3Cells.has(h3Index)) {
        // Initialize new H3 cell
        const center = cellToLatLng(h3Index);
        const boundary = cellToBoundary(h3Index);
        
        h3Cells.set(h3Index, {
          h3Index,
          resolution: res,
          center: [center[1], center[0]], // [lng, lat]
          boundary: boundary.map((coord: [number, number]) => [coord[1], coord[0]]), // [lng, lat]
          count: 0,
          value: 0,
          weight: 0,
          density: 0,
          metadata: {
            averageValue: 0,
            maxValue: 0,
            minValue: Infinity,
            categories: {},
            urgencyLevels: {},
            lastUpdated: new Date()
          }
        });
      }

      const cell = h3Cells.get(h3Index)!;
      
      // Aggregate data into hexagonal cell
      cell.count++;
      cell.value += point.value;
      cell.weight += point.weight || 1;
      
      // Update metadata
      cell.metadata.maxValue = Math.max(cell.metadata.maxValue, point.value);
      cell.metadata.minValue = Math.min(cell.metadata.minValue, point.value);
      
      if (point.category) {
        cell.metadata.categories[point.category] = (cell.metadata.categories[point.category] || 0) + 1;
      }
      
      if (point.urgency) {
        cell.metadata.urgencyLevels[point.urgency] = (cell.metadata.urgencyLevels[point.urgency] || 0) + 1;
      }
    });

    // Calculate final aggregations
    h3Cells.forEach(cell => {
      cell.metadata.averageValue = cell.value / cell.count;
      cell.density = this.calculateDensity(cell, res);
    });

    // Apply smoothing (optional - for visual appeal)
    if (this.config.smoothingRadius > 0) {
      this.applySpatialSmoothing(h3Cells, this.config.smoothingRadius);
    }

    // Filter cells based on config
    const filteredCells = Array.from(h3Cells.values())
      .filter(cell => cell.count >= this.config.minCellCount)
      .slice(0, this.config.maxCells);

    const heatmapData: H3HeatmapData = {
      cells: filteredCells,
      resolution: res,
      bounds,
      metadata: {
        totalPoints: dataPoints.length,
        cellCount: filteredCells.length,
        maxDensity: Math.max(...filteredCells.map(c => c.density)),
        averageDensity: filteredCells.reduce((sum, c) => sum + c.density, 0) / filteredCells.length,
        generatedAt: new Date()
      }
    };

    // Cache the result
    this.cache.set(cacheKey, heatmapData);
    this.cacheExpiry.set(cacheKey, Date.now() + 300000); // 5 minutes cache

    return heatmapData;
  }

  /**
   * Get optimal H3 resolution based on zoom level and data density
   * This mimics Google Maps' adaptive tile system
   */
  getOptimalResolution(
    bounds: { north: number; south: number; east: number; west: number }
  ): number {
    const area = (bounds.north - bounds.south) * (bounds.east - bounds.west);

    // Adaptive resolution based on data density and viewport size
    if (area > 100) return 4;      // Continental view
    if (area > 10) return 6;       // Country/state view
    if (area > 1) return 8;        // City view
    if (area > 0.1) return 10;     // District view
    if (area > 0.01) return 12;    // Neighborhood view
    return 14;                     // Building level
  }

  /**
   * Calculate density using hexagon area
   */
  private calculateDensity(cell: H3Cell, resolution: number): number {
    // H3 cell area in km² (approximate)
    const cellAreas = [
      4250546.848, 607220.9782, 86745.85403, 12392.26486,
      1770.323552, 252.9033645, 36.1290521, 5.1612932,
      0.7373276, 0.1053325, 0.0150475, 0.0021496,
      0.0003071, 0.0000439, 0.0000063, 0.0000009
    ];
    
    const areaKm2 = cellAreas[resolution] || 1;
    return cell.count / areaKm2; // Points per km²
  }

  /**
   * Apply spatial smoothing to reduce noise (like Gaussian blur)
   * Used by mapping companies for better visual appeal
   */
  private applySpatialSmoothing(cells: Map<string, H3Cell>, radius: number): void {
    const cellsArray = Array.from(cells.values());
    
    cellsArray.forEach(cell => {
      const neighbors = gridDisk(cell.h3Index, radius).filter(index => index !== cell.h3Index);
      let totalWeight = cell.weight;
      let totalValue = cell.value;
      
      neighbors.forEach(neighborIndex => {
        const neighbor = cells.get(neighborIndex);
        if (neighbor) {
          const distance = gridDistance(cell.h3Index, neighborIndex);
          const weight = Math.exp(-distance / radius); // Gaussian-like falloff
          totalWeight += neighbor.weight * weight;
          totalValue += neighbor.value * weight;
        }
      });
      
      // Apply smoothed values
      cell.value = totalValue;
      cell.weight = totalWeight;
      cell.density = this.calculateDensity(cell, cell.resolution);
    });
  }

  /**
   * Generate cache key for performance optimization
   */
  private getCacheKey(
    bounds: { north: number; south: number; east: number; west: number },
    resolution: number,
    dataCount: number
  ): string {
    return `${bounds.north}_${bounds.south}_${bounds.east}_${bounds.west}_${resolution}_${dataCount}`;
  }

  /**
   * Check if cached data is still valid
   */
  private isCacheValid(cacheKey: string): boolean {
    const expiry = this.cacheExpiry.get(cacheKey);
    return expiry ? Date.now() < expiry : false;
  }

  /**
   * Convert H3 cells to GeoJSON for rendering
   */
  toGeoJSON(heatmapData: H3HeatmapData): GeoJSON.FeatureCollection {
    return {
      type: 'FeatureCollection',
      features: heatmapData.cells.map(cell => ({
        type: 'Feature',
        properties: {
          h3Index: cell.h3Index,
          count: cell.count,
          value: cell.value,
          density: cell.density,
          weight: cell.weight,
          ...cell.metadata
        },
        geometry: {
          type: 'Polygon',
          coordinates: [cell.boundary.concat([cell.boundary[0]])] // Close the polygon
        }
      }))
    };
  }

  /**
   * Clear cache for memory management
   */
  clearCache(): void {
    this.cache.clear();
    this.cacheExpiry.clear();
  }
}

// Singleton instance for global use
export const h3GridService = new H3GridService();