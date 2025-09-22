/**
 * Utility functions for heatmap data processing and calculations
 */

import { 
  HeatmapDataPoint, 
  HeatmapAnomaly,
  RegionBounds
} from '../types/heatmap';

// Additional utility types
export type ClusteringMethod = 'kmeans' | 'dbscan' | 'hierarchical';
export type InterpolationMethod = 'idw' | 'linear' | 'gaussian';
export type ColorScheme = 'viridis' | 'plasma' | 'inferno' | 'cool' | 'hot' | 'rainbow';

export interface HeatmapMetrics {
  renderTime: number;
  dataSize: number;
  fps: number;
  memory?: {
    used: number;
    total: number;
    limit: number;
  };
}

// ===== HELPER FUNCTIONS FOR COORDINATE ACCESS =====

/**
 * Get latitude from HeatmapDataPoint
 */
export const getLatitude = (point: HeatmapDataPoint): number => {
  return point.location.coordinates[1]; // lat is at index 1
};

/**
 * Get longitude from HeatmapDataPoint
 */
export const getLongitude = (point: HeatmapDataPoint): number => {
  return point.location.coordinates[0]; // lng is at index 0
};

/**
 * Get bounds values from RegionBounds
 */
export const getBoundsValues = (bounds: RegionBounds) => {
  return {
    north: bounds.northeast[1],
    south: bounds.southwest[1], 
    east: bounds.northeast[0],
    west: bounds.southwest[0]
  };
};

// ===== DATA PROCESSING UTILITIES =====

/**
 * Calculate intensity values for data points
 */
export const calculateIntensity = (
  value: number,
  min: number,
  max: number,
  method: 'linear' | 'logarithmic' | 'exponential' = 'linear'
): number => {
  if (max === min) return 0.5;
  
  const normalized = (value - min) / (max - min);
  
  switch (method) {
    case 'logarithmic':
      return Math.log(1 + normalized * 9) / Math.log(10);
    case 'exponential':
      return Math.pow(normalized, 2);
    case 'linear':
    default:
      return normalized;
  }
};

/**
 * Map intensity to discrete levels
 */
export const mapIntensityToLevel = (intensity: number): 'low' | 'medium' | 'high' | 'critical' => {
  if (intensity <= 0.25) return 'low';
  if (intensity <= 0.5) return 'medium';
  if (intensity <= 0.75) return 'high';
  return 'critical';
};

/**
 * Normalize data points for visualization
 */
export const normalizeDataPoints = (
  points: HeatmapDataPoint[]
): HeatmapDataPoint[] => {
  if (points.length === 0) return points;

  const values = points.map(p => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);

  return points.map(point => ({
    ...point,
    intensity: mapIntensityToLevel(calculateIntensity(point.value, min, max))
  }));
};

/**
 * Filter data points within bounds
 */
export const filterPointsInBounds = (
  points: HeatmapDataPoint[],
  bounds: RegionBounds
): HeatmapDataPoint[] => {
  const { north, south, east, west } = getBoundsValues(bounds);
  
  return points.filter(point => {
    const lat = getLatitude(point);
    const lng = getLongitude(point);
    return lat >= south && lat <= north && lng >= west && lng <= east;
  });
};

// ===== CLUSTERING UTILITIES =====

/**
 * Calculate distance between two points
 */
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Calculate cluster radius
 */
export const calculateClusterRadius = (points: HeatmapDataPoint[]): number => {
  if (points.length === 0) return 0;

  const centerLat = points.reduce((sum, p) => sum + getLatitude(p), 0) / points.length;
  const centerLng = points.reduce((sum, p) => sum + getLongitude(p), 0) / points.length;

  const distances = points.map(point => 
    calculateDistance(getLatitude(point), getLongitude(point), centerLat, centerLng)
  );

  return Math.max(...distances);
};

// ===== ANOMALY DETECTION UTILITIES =====

/**
 * Map numeric severity to severity level
 */
export const mapSeverityToLevel = (severity: number): 'low' | 'medium' | 'high' | 'critical' => {
  if (severity <= 1) return 'low';
  if (severity <= 2) return 'medium';
  if (severity <= 3) return 'high';
  return 'critical';
};

/**
 * Map severity level to numeric value for sorting
 */
export const mapSeverityToNumber = (severity: 'low' | 'medium' | 'high' | 'critical'): number => {
  const severityMap = { low: 1, medium: 2, high: 3, critical: 4 };
  return severityMap[severity];
};

/**
 * Detect anomalies using statistical methods
 */
export const detectAnomalies = (
  points: HeatmapDataPoint[],
  method: 'zscore' | 'iqr' | 'isolation' = 'zscore',
  threshold: number = 2.5
): HeatmapAnomaly[] => {
  if (points.length === 0) return [];

  const values = points.map(p => p.value);
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  const stdDev = Math.sqrt(
    values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length
  );

  const anomalies: HeatmapAnomaly[] = [];

  switch (method) {
    case 'zscore':
      points.forEach((point, index) => {
        const zScore = Math.abs((point.value - mean) / stdDev);
        if (zScore > threshold) {
          const numericSeverity = Math.min(zScore / threshold, 4);
          anomalies.push({
            _id: `anomaly-${index}`,
            h3Index: point.h3Index,
            location: point.location,
            anomalyType: point.value > mean ? 'spike' : 'drop',
            severity: mapSeverityToLevel(numericSeverity),
            detectionMethod: 'statistical',
            confidence: Math.min(zScore / 3, 1),
            deviationScore: zScore,
            timestamp: point.metadata.timestamp,
            description: `Statistical anomaly detected with z-score: ${zScore.toFixed(2)}`,
            affectedMetrics: [{
              metric: 'value',
              expectedValue: mean,
              actualValue: point.value,
              deviation: point.value - mean
            }],
            potentialCauses: [],
            metadata: {
              detectorVersion: 'v1.0',
              baselineWindow: 'all-data',
              contextualFactors: {
                zScore,
                deviation: point.value - mean,
                percentile: calculatePercentile(point.value, values)
              },
              relatedAnomalies: [],
              followUpActions: []
            }
          });
        }
      });
      break;

    case 'iqr':
      const sortedValues = [...values].sort((a, b) => a - b);
      const q1 = sortedValues[Math.floor(sortedValues.length * 0.25)];
      const q3 = sortedValues[Math.floor(sortedValues.length * 0.75)];
      const iqr = q3 - q1;
      const lowerBound = q1 - 1.5 * iqr;
      const upperBound = q3 + 1.5 * iqr;

      points.forEach((point, index) => {
        if (point.value < lowerBound || point.value > upperBound) {
          const deviation = point.value < lowerBound ? 
            (lowerBound - point.value) / iqr : 
            (point.value - upperBound) / iqr;

          const numericSeverity = Math.min(deviation, 4);
          anomalies.push({
            _id: `anomaly-${index}`,
            h3Index: point.h3Index,
            location: point.location,
            anomalyType: point.value < lowerBound ? 'drop' : 'spike',
            severity: mapSeverityToLevel(numericSeverity),
            detectionMethod: 'statistical',
            confidence: Math.min(deviation / 2, 1),
            deviationScore: deviation,
            timestamp: point.metadata.timestamp,
            description: `IQR-based anomaly detected with deviation: ${deviation.toFixed(2)}`,
            affectedMetrics: [{
              metric: 'value',
              expectedValue: point.value < lowerBound ? lowerBound : upperBound,
              actualValue: point.value,
              deviation: point.value < lowerBound ? lowerBound - point.value : point.value - upperBound
            }],
            potentialCauses: [],
            metadata: {
              detectorVersion: 'v1.0',
              baselineWindow: 'all-data',
              contextualFactors: {
                iqr,
                q1,
                q3,
                deviation: point.value < lowerBound ? lowerBound - point.value : point.value - upperBound
              },
              relatedAnomalies: [],
              followUpActions: []
            }
          });
        }
      });
      break;
  }

  return anomalies.sort((a, b) => mapSeverityToNumber(b.severity) - mapSeverityToNumber(a.severity));
};

/**
 * Calculate percentile of a value in a dataset
 */
export const calculatePercentile = (value: number, values: number[]): number => {
  const sorted = [...values].sort((a, b) => a - b);
  const index = sorted.findIndex(v => v >= value);
  return index === -1 ? 100 : (index / sorted.length) * 100;
};

// ===== INTERPOLATION UTILITIES =====

/**
 * Interpolate values for smooth heatmap visualization
 */
export const interpolateValue = (
  lat: number,
  lng: number,
  points: HeatmapDataPoint[],
  method: InterpolationMethod = 'idw',
  power: number = 2,
  radius: number = 0.1
): number => {
  if (points.length === 0) return 0;

  const nearbyPoints = points.filter(point => {
    const distance = calculateDistance(lat, lng, getLatitude(point), getLongitude(point));
    return distance <= radius;
  });

  if (nearbyPoints.length === 0) {
    // Use nearest point if no points within radius
    const nearest = points.reduce((closest, point) => {
      const distToCurrent = calculateDistance(lat, lng, getLatitude(point), getLongitude(point));
      const distToClosest = calculateDistance(lat, lng, getLatitude(closest), getLongitude(closest));
      return distToCurrent < distToClosest ? point : closest;
    });
    return nearest.value;
  }

  switch (method) {
    case 'idw': // Inverse Distance Weighting
      let weightedSum = 0;
      let totalWeight = 0;

      nearbyPoints.forEach(point => {
        const distance = calculateDistance(lat, lng, getLatitude(point), getLongitude(point));
        const weight = distance === 0 ? 1 : 1 / Math.pow(distance, power);
        weightedSum += point.value * weight;
        totalWeight += weight;
      });

      return totalWeight > 0 ? weightedSum / totalWeight : 0;

    case 'linear':
      // Simple average
      return nearbyPoints.reduce((sum, point) => sum + point.value, 0) / nearbyPoints.length;

    case 'gaussian':
      let gaussianSum = 0;
      let gaussianWeight = 0;

      nearbyPoints.forEach(point => {
        const distance = calculateDistance(lat, lng, getLatitude(point), getLongitude(point));
        const weight = Math.exp(-Math.pow(distance / (radius / 3), 2));
        gaussianSum += point.value * weight;
        gaussianWeight += weight;
      });

      return gaussianWeight > 0 ? gaussianSum / gaussianWeight : 0;

    default:
      return nearbyPoints[0].value;
  }
};

// ===== COLOR UTILITIES =====

/**
 * Generate color for intensity value
 */
export const getColorForIntensity = (
  intensity: number,
  scheme: ColorScheme = 'viridis',
  opacity: number = 1
): string => {
  // Clamp intensity between 0 and 1
  const clampedIntensity = Math.max(0, Math.min(1, intensity));

  let r: number, g: number, b: number;

  switch (scheme) {
    case 'viridis':
      r = Math.round(255 * (0.267 + 0.533 * clampedIntensity));
      g = Math.round(255 * (0.005 + 0.880 * clampedIntensity));
      b = Math.round(255 * (0.329 + 0.516 * clampedIntensity));
      break;

    case 'plasma':
      r = Math.round(255 * (0.951 - 0.311 * clampedIntensity));
      g = Math.round(255 * (0.082 + 0.718 * clampedIntensity));
      b = Math.round(255 * (0.584 - 0.584 * clampedIntensity));
      break;

    case 'inferno':
      r = Math.round(255 * (0.001 + 0.999 * clampedIntensity));
      g = Math.round(255 * (0.001 + 0.766 * clampedIntensity));
      b = Math.round(255 * (0.014 + 0.364 * clampedIntensity));
      break;

    case 'cool':
      r = Math.round(255 * clampedIntensity);
      g = Math.round(255 * (1 - clampedIntensity));
      b = 255;
      break;

    case 'hot':
      if (clampedIntensity < 0.33) {
        r = Math.round(255 * (clampedIntensity / 0.33));
        g = 0;
        b = 0;
      } else if (clampedIntensity < 0.66) {
        r = 255;
        g = Math.round(255 * ((clampedIntensity - 0.33) / 0.33));
        b = 0;
      } else {
        r = 255;
        g = 255;
        b = Math.round(255 * ((clampedIntensity - 0.66) / 0.34));
      }
      break;

    case 'rainbow':
      const hue = (1 - clampedIntensity) * 240; // Blue to red
      const [rNorm, gNorm, bNorm] = hslToRgb(hue / 360, 1, 0.5);
      r = Math.round(rNorm * 255);
      g = Math.round(gNorm * 255);
      b = Math.round(bNorm * 255);
      break;

    default:
      r = g = b = Math.round(255 * clampedIntensity);
  }

  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

/**
 * Convert HSL to RGB
 */
const hslToRgb = (h: number, s: number, l: number): [number, number, number] => {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs((h * 6) % 2 - 1));
  const m = l - c / 2;

  let r: number, g: number, b: number;

  if (h < 1/6) {
    [r, g, b] = [c, x, 0];
  } else if (h < 2/6) {
    [r, g, b] = [x, c, 0];
  } else if (h < 3/6) {
    [r, g, b] = [0, c, x];
  } else if (h < 4/6) {
    [r, g, b] = [0, x, c];
  } else if (h < 5/6) {
    [r, g, b] = [x, 0, c];
  } else {
    [r, g, b] = [c, 0, x];
  }

  return [r + m, g + m, b + m];
};

// ===== PERFORMANCE UTILITIES =====

/**
 * Calculate performance metrics
 */
export const calculatePerformanceMetrics = (
  startTime: number,
  endTime: number,
  dataSize: number
): HeatmapMetrics => {
  const duration = endTime - startTime;
  
  return {
    renderTime: duration,
    dataSize,
    fps: duration > 0 ? 1000 / duration : 0,
    memory: (performance as any).memory ? {
      used: (performance as any).memory.usedJSHeapSize,
      total: (performance as any).memory.totalJSHeapSize,
      limit: (performance as any).memory.jsHeapSizeLimit
    } : undefined
  };
};

// ===== BOUNDS UTILITIES =====

/**
 * Calculate bounds that contain all data points
 */
export const calculateDataBounds = (points: HeatmapDataPoint[]): RegionBounds => {
  if (points.length === 0) {
    return { 
      southwest: [0, 0], 
      northeast: [0, 0] 
    };
  }

  const lats = points.map(p => getLatitude(p));
  const lngs = points.map(p => getLongitude(p));

  const north = Math.max(...lats);
  const south = Math.min(...lats);
  const east = Math.max(...lngs);
  const west = Math.min(...lngs);

  return {
    southwest: [west, south],
    northeast: [east, north]
  };
};

/**
 * Expand bounds by a percentage
 */
export const expandBounds = (bounds: RegionBounds, percentage: number = 0.1): RegionBounds => {
  const { north, south, east, west } = getBoundsValues(bounds);
  
  const latRange = north - south;
  const lngRange = east - west;
  
  const latExpansion = latRange * percentage;
  const lngExpansion = lngRange * percentage;

  return {
    southwest: [west - lngExpansion, south - latExpansion],
    northeast: [east + lngExpansion, north + latExpansion]
  };
};

/**
 * Check if a point is within bounds
 */
export const isPointInBounds = (
  lat: number,
  lng: number,
  bounds: RegionBounds
): boolean => {
  const { north, south, east, west } = getBoundsValues(bounds);
  return lat >= south && lat <= north && lng >= west && lng <= east;
};

// ===== FORMAT UTILITIES =====

/**
 * Format numbers for display
 */
export const formatNumber = (
  value: number,
  precision: number = 2,
  unit?: string
): string => {
  const formatted = value.toFixed(precision);
  return unit ? `${formatted} ${unit}` : formatted;
};

/**
 * Format coordinates for display
 */
export const formatCoordinates = (
  lat: number,
  lng: number,
  precision: number = 4
): string => {
  return `${lat.toFixed(precision)}, ${lng.toFixed(precision)}`;
};

/**
 * Format date for display
 */
export const formatTimestamp = (timestamp: number | Date): string => {
  const date = typeof timestamp === 'number' ? new Date(timestamp) : timestamp;
  return date.toLocaleString();
};

// ===== EXPORT UTILITIES =====

/**
 * Export data as CSV
 */
export const exportToCSV = (points: HeatmapDataPoint[]): string => {
  const headers = ['latitude', 'longitude', 'value', 'intensity', 'timestamp', 'issueType', 'priority'];
  const rows = points.map(point => [
    getLatitude(point),
    getLongitude(point),
    point.value,
    point.intensity,
    formatTimestamp(point.metadata.timestamp),
    point.metadata.issueType,
    point.metadata.priority
  ]);

  return [headers, ...rows].map(row => row.join(',')).join('\n');
};

/**
 * Export data as JSON
 */
export const exportToJSON = (data: any): string => {
  return JSON.stringify(data, null, 2);
};