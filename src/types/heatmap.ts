import type { ReactNode } from 'react';

// ===== WebSocket and Real-time Types =====

export interface WebSocketConfig {
  url: string;
  reconnectAttempts: number;
  reconnectDelay: number;
  heartbeatInterval: number;
  maxConnectionTime: number;
  enableLogging: boolean;
  authToken?: string;
}

export interface HeatmapFilters {
  categories?: string[];
  severityLevels?: string[];
  timeRange?: {
    start: Date;
    end: Date;
  };
  valueRange?: {
    min: number;
    max: number;
  };
  status?: string[];
  tags?: string[];
}

export interface RealtimeSubscription {
  id: string;
  regionId: string;
  bounds: RegionBounds;
  filters?: HeatmapFilters;
  createdAt: Date;
  lastUpdate?: Date;
  isActive: boolean;
}

export interface HeatmapNotification {
  id: string;
  type: 'info' | 'warning' | 'error' | 'anomaly_detected' | 'trend_alert' | 'system_update';
  regionId: string;
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  data?: any;
  actions?: Array<{
    label: string;
    action: string;
    primary?: boolean;
  }>;
}

export interface HeatmapUpdateEvent {
  type: 'data_update' | 'cluster_update' | 'anomaly_update' | 'prediction_update';
  subscriptionId: string;
  regionId: string;
  timestamp: Date;
  data: {
    dataPoints?: HeatmapDataPoint[];
    clusters?: HeatmapCluster[];
    anomalies?: HeatmapAnomaly[];
    predictions?: HeatmapPrediction[];
    metadata?: {
      totalCount: number;
      updateType: 'full' | 'incremental';
      affectedArea?: RegionBounds;
    };
  };
}

export type ConnectionStatus = 
  | 'disconnected' 
  | 'connecting' 
  | 'connected' 
  | 'disconnecting' 
  | 'reconnecting' 
  | 'error';

// ===== Export all types =====
// Production-level TypeScript definitions for real-time heatmap system

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface RegionBounds {
  southwest: [number, number]; // [lng, lat]
  northeast: [number, number]; // [lng, lat]
}

export interface H3IndexHierarchy {
  resolution3: string;
  resolution6: string;
  resolution8: string;
  resolution10: string;
  resolution12: string;
}

// ===== CORE HEATMAP DATA STRUCTURES =====

export interface HeatmapDataPoint {
  coordinates: any;
  _id: string;
  h3Index: string;
  timestamp?: string; // Added top-level timestamp for compatibility
  location: {
    coordinates: [number, number]; // [lng, lat]
    type: 'Point';
    address?: string;
    landmark?: string;
    hierarchy: H3IndexHierarchy;
  };
  value: number;
  intensity: 'low' | 'medium' | 'high' | 'critical';
  weight: number;
  velocity: number;
  acceleration: number;
  momentum: number;
  riskScore: number;
  freshnessScore: number;
  metadata: {
    id?: string; // Added id field for sidebar actions
    views: number;
    votes: number;
    reporter: any;
    images: boolean | string[]; // Updated to allow both boolean and image array
    upvotes: number;
    comments: number;
    address: string;
    description: any;
    issueType: string;
    priority: number;
    timestamp: Date;
    status: 'reported' | 'verified' | 'acknowledged' | 'in_progress' | 'resolved' | 'closed';
    reportCount: number;
    severity: number;
    category: 'traffic' | 'flooding' | 'electricity' | 'water' | 'waste' | 'pothole' | 'streetlight' | 'other';
    urgency: 'low' | 'medium' | 'high' | 'critical' | 'emergency';
    tags: string[];
    verificationCount: number;
    engagementScore: number;
    qualityScore: number;
    actionabilityScore: number;
    contextData?: {
      weather?: {
        condition: string;
        temperature: number;
        humidity: number;
        windSpeed: number;
        precipitation: number;
      };
      traffic?: {
        congestionLevel: number;
        avgSpeed: number;
        incidents: number;
      };
      events?: Array<{
        name: string;
        type: string;
        impact: number;
        distance: number;
      }>;
      demographics?: {
        populationDensity: number;
        avgIncome: number;
        educationLevel: string;
        ageDistribution: Record<string, number>;
      };
      infrastructure?: {
        roadQuality: number;
        publicTransport: boolean;
        utilities: Record<string, number>;
        emergencyServices: number;
      };
    };
  };
}

export interface HeatmapCluster {
  pointCount: ReactNode;
  averageIntensity: any;
  center: any;
  _id: string;
  clusterId: string;
  centroid: {
    coordinates: [number, number];
    type: 'Point';
  };
  radius: number;
  density: number;
  points: HeatmapDataPoint[];
  significance: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  clusterType: 'density' | 'temporal' | 'categorical' | 'hybrid';
  strength: number;
  stability: number;
  trends: {
    growing: boolean;
    stable: boolean;
    declining: boolean;
    changeRate: number;
    velocityTrend: number;
    accelerationTrend: number;
  };
  metadata: {
    categories: any;
    dominantIssueType: string;
    avgSeverity: number;
    totalReports: number;
    uniqueReporters: number;
    verificationRate: number;
    resolutionRate: number;
    avgResolutionTime: number;
    timeRange: {
      start: Date;
      end: Date;
    };
    spatialCoverage: number;
    temporalSpan: number;
    predictions: {
      nextDayRisk: number;
      nextWeekRisk: number;
      nextMonthRisk: number;
      seasonalPattern: Record<string, number>;
      weeklyPattern: Record<string, number>;
      dailyPattern: Record<string, number>;
    };
    recommendations: Array<{
      type: 'immediate' | 'short_term' | 'long_term';
      priority: number;
      action: string;
      estimatedCost: number;
      estimatedImpact: number;
      department: string;
    }>;
  };
}

export interface HeatmapPrediction {
  _id: string;
  h3Index: string;
  location: {
    coordinates: [number, number];
    type: 'Point';
  };
  predictedRisk: number;
  confidence: number;
  timeHorizon: '1hour' | '6hour' | '1day' | '3day' | '1week' | '1month' | '3month';
  predictionType: 'hotspot' | 'spike' | 'trend' | 'anomaly' | 'seasonal';
  factors: Array<{
    name: string;
    impact: number;
    confidence: number;
    description: string;
    category: 'temporal' | 'spatial' | 'contextual' | 'historical';
  }>;
  recommendations: Array<{
    action: string;
    priority: number;
    timeframe: string;
    resources: string[];
  }>;
  metadata: {
    modelVersion: string;
    modelType: 'lstm' | 'arima' | 'prophet' | 'ensemble';
    accuracy: number;
    lastTrainedAt: Date;
    features: Record<string, number>;
    historicalPatterns: Record<string, number>;
    externalFactors: Record<string, any>;
    validationMetrics: {
      mse: number;
      mae: number;
      r2: number;
      accuracy: number;
    };
  };
}

export interface HeatmapAnomaly {
  score: any;
  type: string;
  detectedAt: Date | string; // Fixed to be a Date or string instead of function
  center: any;
  _id: string;
  h3Index: string;
  location: {
    coordinates: [number, number];
    type: 'Point';
  };
  anomalyType: 'spike' | 'drop' | 'pattern_break' | 'seasonal_deviation' | 'geographic_outlier';
  severity: 'low' | 'medium' | 'high' | 'critical';
  detectionMethod: 'statistical' | 'ml' | 'rule_based' | 'hybrid';
  confidence: number;
  deviationScore: number;
  timestamp: Date;
  description: string;
  affectedMetrics: Array<{
    metric: string;
    expectedValue: number;
    actualValue: number;
    deviation: number;
  }>;
  potentialCauses: Array<{
    cause: string;
    likelihood: number;
    evidence: string[];
  }>;
  metadata: {
    detectorVersion: string;
    baselineWindow: string;
    contextualFactors: Record<string, any>;
    relatedAnomalies: string[];
    followUpActions: string[];
  };
}

// ===== REAL-TIME WEBSOCKET TYPES =====

export interface WebSocketMessage {
  type: 'heatmap_update' | 'cluster_update' | 'anomaly_alert' | 'prediction_update' | 'system_status';
  timestamp: Date;
  data: any;
  regionId?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface HeatmapUpdate extends WebSocketMessage {
  type: 'heatmap_update';
  data: {
    updatedPoints: HeatmapDataPoint[];
    removedPoints: string[];
    affectedRegions: string[];
    updateType: 'incremental' | 'full_refresh' | 'bulk_update';
    metrics: {
      totalPoints: number;
      activeIssues: number;
      avgIntensity: number;
      changeRate: number;
    };
  };
}

export interface ClusterUpdate extends WebSocketMessage {
  type: 'cluster_update';
  data: {
    updatedClusters: HeatmapCluster[];
    removedClusters: string[];
    newClusters: HeatmapCluster[];
    significantChanges: Array<{
      clusterId: string;
      changeType: 'risk_increase' | 'risk_decrease' | 'size_change' | 'new_formation' | 'dissolution';
      magnitude: number;
    }>;
  };
}

export interface AnomalyAlert extends WebSocketMessage {
  type: 'anomaly_alert';
  data: {
    anomaly: HeatmapAnomaly;
    urgency: 'immediate' | 'urgent' | 'standard' | 'informational';
    requiredActions: string[];
    estimatedImpact: 'low' | 'medium' | 'high' | 'critical';
    affectedPopulation: number;
  };
}

export interface PredictionUpdate extends WebSocketMessage {
  type: 'prediction_update';
  data: {
    predictions: HeatmapPrediction[];
    confidence: number;
    timeHorizon: string;
    keyInsights: string[];
    riskAreas: Array<{
      region: string;
      riskLevel: number;
      timeframe: string;
    }>;
  };
}

// ===== CONFIGURATION INTERFACES =====

export interface HeatmapConfig {
  regionId: string;
  bounds: RegionBounds;
  resolution: number;
  layers: Array<'points' | 'clusters' | 'predictions' | 'anomalies' | 'trends'>;
  filters: {
    categories?: string[];
    urgencyLevels?: string[];
    timeRange?: {
      start: Date;
      end: Date;
    };
    minConfidence?: number;
    minSeverity?: number;
  };
  visualization: {
    colorScheme: 'viridis' | 'plasma' | 'magma' | 'inferno' | 'turbo' | 'custom';
    opacity: number;
    radius: number;
    blur: number;
    maxZoom: number;
    minZoom: number;
    clusterRadius: number;
    showLabels: boolean;
    showTooltips: boolean;
    animationDuration: number;
    heatmapOpacity?: number;
  };
  realtime: {
    enabled: boolean;
    updateInterval: number;
    autoRefresh: boolean;
    pushNotifications: boolean;
    anomalyAlerts: boolean;
    predictionUpdates: boolean;
    batchUpdates?: boolean;
    throttleUpdates?: boolean; // Added throttleUpdates property
  };
  analytics: {
    enableTrends: boolean;
    enablePredictions: boolean;
    enableAnomalyDetection: boolean;
    enableClustering: boolean;
    enableHeatmapGeneration?: boolean;
    enableSpatialAnalysis?: boolean;
    clusterThreshold?: number;
    anomalyThreshold?: number; // Added anomalyThreshold property
    predictionHorizon?: number; // Added predictionHorizon property
    historicalDepth: number;
    refreshInterval: number;
  };
}

export interface HeatmapVisualizationConfig {
  mapStyle: 'streets' | 'satellite' | 'dark' | 'light' | 'outdoors';
  center: [number, number];
  zoom: number;
  pitch: number;
  bearing: number;
  interactive: boolean;
  opacity?: number;
  // Extended properties for advanced controls
  colorScheme?: 'viridis' | 'plasma' | 'magma' | 'inferno' | 'turbo' | 'custom';
  heatmapOpacity?: number;
  radius?: number; // Added radius property
  blur?: number; // Added blur property
  maxZoom?: number; // Added maxZoom property
  minZoom?: number; // Added minZoom property
  clusterRadius?: number;
  animationDuration?: number;
  enableSmoothing?: boolean;
  enableInterpolation?: boolean;
  pointRadius?: number; // Added pointRadius property
  controls: {
    navigation: boolean;
    fullscreen: boolean;
    scale: boolean;
    geolocate: boolean;
  };
  layers: {
    heatmap: {
      visible: boolean;
      opacity: number;
      radius: number;
      blur: number;
      weight: string;
      colorStops: Array<[number, string]>;
    };
    clusters: {
      visible: boolean;
      opacity: number;
      radius: number;
      strokeWidth: number;
      strokeColor: string;
    };
    points: {
      visible: boolean;
      radius: number;
      opacity: number;
      strokeWidth: number;
    };
    boundaries: {
      visible: boolean;
      opacity: number;
      strokeWidth: number;
      strokeColor: string;
      fillOpacity: number;
    };
  };
}

// ===== API RESPONSE TYPES =====

export interface HeatmapApiResponse {
  success: boolean;
  data: {
    dataPoints: HeatmapDataPoint[];
    clusters?: HeatmapCluster[];
    predictions?: HeatmapPrediction[];
    anomalies?: HeatmapAnomaly[];
    metadata: {
      totalCount: number;
      bounds: RegionBounds;
      resolution: number;
      timestamp: Date;
      cacheInfo: {
        cached: boolean;
        ttl: number;
        lastUpdated: Date;
      };
      performance: {
        queryTime: number;
        renderTime: number;
        dataSize: number;
      };
    };
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface HeatmapAnalyticsResponse {
  success: boolean;
  data: {
    summary: {
      totalIssues: number;
      activeIssues: number;
      resolvedIssues: number;
      avgResolutionTime: number;
      riskLevel: 'low' | 'medium' | 'high' | 'critical';
      trendDirection: 'improving' | 'stable' | 'deteriorating';
    };
    trends: {
      daily: Array<{ date: string; count: number; avg_severity: number }>;
      weekly: Array<{ week: string; count: number; avg_severity: number }>;
      monthly: Array<{ month: string; count: number; avg_severity: number }>;
    };
    categories: Record<string, {
      count: number;
      percentage: number;
      avgSeverity: number;
      trend: number;
    }>;
    geospatial: {
      hotspots: Array<{
        location: [number, number];
        intensity: number;
        category: string;
      }>;
      coldspots: Array<{
        location: [number, number];
        reason: string;
      }>;
    };
    predictions: {
      nextDay: number;
      nextWeek: number;
      nextMonth: number;
      confidence: number;
      factors: Array<{
        factor: string;
        impact: number;
      }>;
    };
  };
  timestamp: Date;
}

// ===== UTILITY TYPES =====

export interface ColorStop {
  offset: number;
  color: string;
  label?: string;
}

export interface HeatmapLegendConfig {
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  title: string;
  colorStops: ColorStop[];
  showLabels: boolean;
  orientation: 'horizontal' | 'vertical';
  size: 'small' | 'medium' | 'large';
}

export interface HeatmapTooltipData {
  point?: HeatmapDataPoint;
  cluster?: HeatmapCluster;
  prediction?: HeatmapPrediction;
  anomaly?: HeatmapAnomaly;
  coordinates: [number, number];
  additionalInfo?: Record<string, any>;
}

export interface HeatmapEventHandlers {
  onPointClick?: (point: HeatmapDataPoint, event: MouseEvent) => void;
  onClusterClick?: (cluster: HeatmapCluster, event: MouseEvent) => void;
  onAnomalyClick?: (anomaly: HeatmapAnomaly, event: MouseEvent) => void;
  onPredictionClick?: (prediction: HeatmapPrediction, event: MouseEvent) => void;
  onBoundsChange?: (bounds: RegionBounds) => void;
  onZoomChange?: (zoom: number) => void;
  onHover?: (data: HeatmapTooltipData | null, event: MouseEvent) => void;
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

// ===== STATE MANAGEMENT TYPES =====

export interface HeatmapState {
  data: HeatmapApiResponse['data'] | null;
  config: HeatmapConfig;
  visualization: HeatmapVisualizationConfig;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  selectedPoint: HeatmapDataPoint | null;
  selectedCluster: HeatmapCluster | null;
  selectedAnomaly: HeatmapAnomaly | null;
  notifications?: any[]; // Added notifications property
  viewport: {
    bounds: RegionBounds;
    center: [number, number];
    zoom: number;
  };
  realtime: {
    connected: boolean;
    subscriptions: string[];
    lastUpdate: Date | null;
    updateCount: number;
  };
  performance: {
    renderTime: number;
    dataSize: number;
    frameRate: number;
    memoryUsage: number;
  };
}

export interface HeatmapActions {
  // Data management
  fetchData: (bounds?: RegionBounds) => Promise<void>;
  refreshData: () => Promise<void>;
  updateConfig: (config: Partial<HeatmapConfig>) => void;
  updateVisualization: (config: Partial<HeatmapVisualizationConfig>) => void;
  
  // Selection management
  selectPoint: (point: HeatmapDataPoint | null) => void;
  selectCluster: (cluster: HeatmapCluster | null) => void;
  selectAnomaly: (anomaly: HeatmapAnomaly | null) => void;
  clearSelection: () => void;
  
  // Real-time management
  subscribeToRegion: (regionId: string, bounds: RegionBounds) => Promise<void>;
  unsubscribeFromRegion: (regionId: string) => void;
  toggleRealtime: (enabled: boolean) => void;
  
  // Viewport management
  setBounds: (bounds: RegionBounds) => void;
  setCenter: (center: [number, number]) => void;
  setZoom: (zoom: number) => void;
  fitToBounds: (bounds: RegionBounds) => void;
  
  // Utility actions
  exportData: (format: 'json' | 'csv' | 'geojson') => void;
  resetState: () => void;
  clearError: () => void;
  dismissNotification: (id: string) => void; // Added notification dismiss method
}

export type HeatmapStore = HeatmapState & { actions: HeatmapActions };

// ===== PERFORMANCE MONITORING =====

export interface PerformanceMetrics {
  renderTime: number;
  dataProcessingTime: number;
  networkLatency: number;
  memoryUsage: number;
  frameRate: number;
  cacheHitRate: number;
  updateFrequency: number;
  errorRate: number;
  // Extended properties for advanced controls
  fpsAverage?: number;
  dataPointCount?: number;
  totalIssues?: number;
  criticalIssues?: number;
  clusters?: number;
  anomalies?: number;
}

export interface PerformanceThresholds {
  maxRenderTime: number;
  maxMemoryUsage: number;
  minFrameRate: number;
  maxNetworkLatency: number;
  maxErrorRate: number;
}

// ===== ERROR HANDLING =====

export interface HeatmapError {
  code: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  context?: Record<string, any>;
  recoverable: boolean;
  retryAfter?: number;
}

// ===== ADDITIONAL REQUIRED TYPES =====

export type IssueCategory = 'traffic' | 'flooding' | 'electricity' | 'water' | 'waste' | 'pothole' | 'streetlight' | 'other';

export interface HeatmapLayer {
  id: string;
  type: 'heatmap' | 'cluster' | 'point' | 'boundary';
  visible: boolean;
  opacity: number;
  zIndex: number;
}

export interface HeatmapAnalytics {
  trends: {
    daily: number[];
    weekly: number[];
    monthly: number[];
  };
  predictions: HeatmapPrediction[];
  anomalies: HeatmapAnomaly[];
  clusters: HeatmapCluster[];
  performance: PerformanceMetrics;
}

export interface HeatmapRealTimeConfig {
  enabled: boolean;
  updateInterval: number;
  autoReconnect: boolean;
  maxRetries: number;
}

export interface HeatmapWebSocketHook {
  isConnected: boolean;
  status: ConnectionStatus;
  subscribe: (regionId: string) => void;
  unsubscribe: (regionId: string) => void;
  sendMessage: (message: any) => void;
}