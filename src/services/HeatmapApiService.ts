// ===== ADVANCED HEATMAP API SERVICE =====
// Production-level API service for real-time heatmap system

import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import {
  HeatmapApiResponse,
  HeatmapAnalyticsResponse,
  HeatmapCluster,
  HeatmapAnomaly,
  RegionBounds,
  HeatmapConfig,
  PerformanceMetrics
} from '../types/heatmap';

// ===== API CONFIGURATION =====

interface ApiConfig {
  baseUrl: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
  enableCache: boolean;
  cacheTTL: number;
}

interface RequestOptions {
  useCache?: boolean;
  timeout?: number;
  retryOnFailure?: boolean;
  priority?: 'low' | 'normal' | 'high';
}

// ===== ERROR HANDLING =====

export class HeatmapApiError extends Error {
  constructor(
    message: string,
    public code: string,
    public status?: number,
    public details?: any
  ) {
    super(message);
    this.name = 'HeatmapApiError';
  }
}

// ===== CACHING SYSTEM =====

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  key: string;
}

class ApiCache {
  private cache = new Map<string, CacheEntry<any>>();
  private maxSize = 100;

  set<T>(key: string, data: T, ttl: number): void {
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
      key
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const isExpired = Date.now() - entry.timestamp > entry.ttl;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  clear(): void {
    this.cache.clear();
  }

  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: 0 // Calculate based on hits/misses
    };
  }
}

// ===== MAIN API SERVICE =====

export class AdvancedHeatmapApiService {
  private client!: AxiosInstance;
  private cache: ApiCache;
  private config: ApiConfig;
  private performanceTracker: PerformanceTracker;

  constructor(config?: Partial<ApiConfig>) {
    this.config = {
      baseUrl: import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000/api',
      timeout: 5000, // Reduced to 5 seconds for faster fallback to demo mode
      retryAttempts: 1, // Reduced retry attempts for faster demo mode activation
      retryDelay: 1000,
      enableCache: true,
      cacheTTL: 60000, // 1 minute
      ...config
    };

    this.cache = new ApiCache();
    this.performanceTracker = new PerformanceTracker();
    this.setupAxiosClient();
  }

  private setupAxiosClient(): void {
    this.client = axios.create({
      baseURL: this.config.baseUrl,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Request interceptor
    this.client.interceptors.request.use(
      (config: any) => {
        const token = localStorage.getItem('authToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        
        // Add request timestamp for performance tracking
        config.metadata = { startTime: Date.now() };
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        // Track performance
        const requestTime = Date.now() - (response.config as any).metadata?.startTime || 0;
        this.performanceTracker.recordRequest(requestTime, true);
        return response;
      },
      async (error: AxiosError) => {
        const requestTime = Date.now() - (error.config as any)?.metadata?.startTime || 0;
        this.performanceTracker.recordRequest(requestTime, false);

        // Auto-retry logic
        if (this.shouldRetry(error)) {
          return this.retryRequest(error);
        }

        return Promise.reject(this.handleApiError(error));
      }
    );
  }

  private shouldRetry(error: AxiosError): boolean {
    // Don't retry on network errors, connection issues, or timeouts
    if (
      error.code === 'ERR_NETWORK' || 
      error.code === 'ECONNREFUSED' || 
      error.code === 'ETIMEDOUT' ||
      error.message?.includes('timeout') ||
      error.message?.includes('exceeded')
    ) {
      return false;
    }

    const retryableStatuses = [408, 429, 500, 502, 503, 504];
    const status = error.response?.status;
    return !!(status && retryableStatuses.includes(status));
  }

  private async retryRequest(error: AxiosError): Promise<AxiosResponse> {
    const config = error.config as any;
    const retryCount = config.__retryCount || 0;

    if (retryCount >= this.config.retryAttempts) {
      throw this.handleApiError(error);
    }

    config.__retryCount = retryCount + 1;
    
    // Exponential backoff
    const delay = this.config.retryDelay * Math.pow(2, retryCount);
    await new Promise(resolve => setTimeout(resolve, delay));

    return this.client.request(config);
  }

  // Get cache instance for external access
  getCache(): ApiCache {
    return this.cache;
  }

  private handleApiError(error: AxiosError): HeatmapApiError {
    const responseData = error.response?.data as any;
    let message = responseData?.message || error.message || 'Unknown API error';
    let code = responseData?.code || 'API_ERROR';
    const status = error.response?.status;
    const details = responseData;

    // Handle specific network errors and timeouts
    if (
      error.code === 'ERR_NETWORK' || 
      error.code === 'ECONNREFUSED' || 
      error.code === 'ETIMEDOUT' ||
      error.message === 'Network Error' ||
      error.message?.includes('timeout') ||
      error.message?.includes('exceeded')
    ) {
      message = 'Backend server unavailable - using demo mode';
      code = 'BACKEND_UNAVAILABLE';
    }

    return new HeatmapApiError(message, code, status, details);
  }

  private generateCacheKey(endpoint: string, params?: any): string {
    const paramString = params ? JSON.stringify(params) : '';
    return `${endpoint}:${paramString}`;
  }

  private generateMockHeatmapData(bounds: RegionBounds): HeatmapApiResponse {
    // Generate demo data - reduced for performance
    const mockPoints = Array.from({ length: 100 }, (_, i) => {
      const coords: [number, number] = [
        -122.4594 + (Math.random() * 0.04), // lng
        37.7349 + (Math.random() * 0.04)    // lat
      ];
      return {
        coordinates: coords,
        _id: `demo-point-${i}`,
        h3Index: `8c2a1072b5fffff${i.toString().padStart(2, '0')}`,
        location: {
          coordinates: coords,
          type: 'Point' as const,
          address: `Demo Address ${i + 1}, San Francisco, CA`,
          landmark: i % 5 === 0 ? `Demo Landmark ${Math.floor(i/5) + 1}` : undefined,
          hierarchy: {
            resolution3: `83754e57fffffff`,
            resolution6: `862a1072fffffff`,
            resolution8: `882a1072b5fffff`,
            resolution10: `8a2a1072b52ffff`,
            resolution12: `8c2a1072b5245ff`
          }
        },
        value: Math.random() * 100,
        intensity: ['low', 'medium', 'high', 'critical'][Math.floor(Math.random() * 4)] as any,
        weight: Math.random() * 10,
        velocity: Math.random() * 5,
        acceleration: Math.random() * 2,
        momentum: Math.random() * 8,
        riskScore: Math.random() * 100,
        freshnessScore: Math.random() * 100,
        metadata: {
          id: `demo-point-${i}`,
          views: Math.floor(Math.random() * 100),
          votes: Math.floor(Math.random() * 50),
          reporter: { name: `User ${i + 1}`, id: `user-${i + 1}` },
          images: false,
          upvotes: Math.floor(Math.random() * 20),
          comments: Math.floor(Math.random() * 10),
          address: `Demo Address ${i + 1}, San Francisco, CA`,
          description: `Demo issue description ${i + 1}`,
          issueType: ['traffic', 'flooding', 'electricity', 'water', 'waste'][Math.floor(Math.random() * 5)],
          priority: Math.floor(Math.random() * 5) + 1,
          timestamp: new Date(Date.now() - Math.random() * 86400000),
          status: ['reported', 'verified', 'in_progress', 'resolved'][Math.floor(Math.random() * 4)] as any,
          reportCount: Math.floor(Math.random() * 20) + 1,
          severity: Math.floor(Math.random() * 5) + 1,
          category: ['traffic', 'flooding', 'electricity', 'water', 'waste'][Math.floor(Math.random() * 5)] as any,
          urgency: ['low', 'medium', 'high', 'critical'][Math.floor(Math.random() * 4)] as any,
          tags: [`tag${Math.floor(Math.random() * 10)}`, `category${Math.floor(Math.random() * 5)}`],
          verificationCount: Math.floor(Math.random() * 10),
          engagementScore: Math.random() * 100,
          qualityScore: Math.random() * 100,
          actionabilityScore: Math.random() * 100
        }
      };
    });

    return {
      success: true,
      data: {
        dataPoints: mockPoints,
        clusters: [],
        anomalies: [],
        metadata: {
          totalCount: mockPoints.length,
          bounds,
          resolution: 8,
          timestamp: new Date(),
          cacheInfo: {
            cached: false,
            ttl: 300000,
            lastUpdated: new Date()
          },
          performance: {
            queryTime: Math.random() * 50 + 20,
            renderTime: Math.random() * 30 + 10,
            dataSize: mockPoints.length * 1024
          }
        }
      }
    };
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestOptions = {},
    axiosOptions: any = {}
  ): Promise<T> {
    const cacheKey = this.generateCacheKey(endpoint, axiosOptions.params);
    
    // Check cache first
    if (options.useCache !== false && this.config.enableCache) {
      const cached = this.cache.get<T>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    try {
      const response = await this.client.get<T>(endpoint, {
        timeout: options.timeout || this.config.timeout,
        ...axiosOptions
      });

      const data = response.data;

      // Cache successful responses
      if (options.useCache !== false && this.config.enableCache) {
        this.cache.set(cacheKey, data, this.config.cacheTTL);
      }

      return data;
    } catch (error) {
      const apiError = error instanceof HeatmapApiError ? error : this.handleApiError(error as AxiosError);
      
      // If backend is unavailable, return mock data for demo purposes
      if (apiError.code === 'BACKEND_UNAVAILABLE') {
        console.warn('Backend unavailable, using demo data for heatmap');
        
        // Generate mock data based on endpoint
        if (endpoint.includes('/api/heatmap/realtime') || endpoint.includes('/heatmap/data')) {
          const bounds = axiosOptions.params?.bounds ? JSON.parse(axiosOptions.params.bounds) : {
            southwest: [-122.4594, 37.7349],
            northeast: [-122.4194, 37.7749]
          };
          return this.generateMockHeatmapData(bounds) as T;
        }
        
        // For other endpoints, return empty but valid responses
        return {
          success: true,
          data: {
            dataPoints: [],
            metadata: {
              totalCount: 0,
              bounds: { southwest: [0, 0], northeast: [0, 0] },
              resolution: 8,
              timestamp: new Date(),
              cacheInfo: {
                cached: false,
                ttl: 300000,
                lastUpdated: new Date()
              },
              performance: {
                queryTime: 50,
                renderTime: 20,
                dataSize: 0
              }
            }
          }
        } as T;
      }
      
      throw apiError;
    }
  }

  // ===== HEATMAP DATA ENDPOINTS =====

  /**
   * Fetch real-time heatmap data for a specific region
   */
  async getRealtimeHeatmap(
    bounds: RegionBounds,
    config: Partial<HeatmapConfig> = {},
    options: RequestOptions = {}
  ): Promise<HeatmapApiResponse> {
    const params = {
      bounds: JSON.stringify([bounds.southwest, bounds.northeast]),
      resolution: config.resolution || 8,
      layers: config.layers?.join(',') || 'points',
      categories: config.filters?.categories?.join(','),
      urgency: config.filters?.urgencyLevels?.join(','),
      minConfidence: config.filters?.minConfidence || 0,
      timeRange: config.filters?.timeRange ? JSON.stringify(config.filters.timeRange) : undefined
    };

    return this.makeRequest<HeatmapApiResponse>(
      '/api/heatmap/realtime',
      options,
      { params }
    );
  }

  /**
   * Fetch predictive heatmap data
   */
  async getPredictiveHeatmap(
    bounds: RegionBounds,
    timeHorizon: string = '1day',
    confidence: number = 0.7,
    options: RequestOptions = {}
  ): Promise<HeatmapApiResponse> {
    const params = {
      bounds: JSON.stringify([bounds.southwest, bounds.northeast]),
      timeframe: timeHorizon,
      confidence,
      includeFactors: true
    };

    return this.makeRequest<HeatmapApiResponse>(
      '/heatmap/predictive',
      { ...options, useCache: false }, // Predictions should be fresh
      { params }
    );
  }

  /**
   * Fetch multi-layer heatmap data
   */
  async getMultiLayerHeatmap(
    bounds: RegionBounds,
    layers: string[],
    options: RequestOptions = {}
  ): Promise<HeatmapApiResponse> {
    const params = {
      bounds: JSON.stringify([bounds.southwest, bounds.northeast]),
      layers: layers.join(','),
      includeCorrelations: true
    };

    return this.makeRequest<HeatmapApiResponse>(
      '/heatmap/multilayer',
      options,
      { params }
    );
  }

  /**
   * Detect anomalies in real-time
   */
  async detectAnomalies(
    bounds: RegionBounds,
    threshold: number = 0.8,
    timeWindow: number = 60,
    options: RequestOptions = {}
  ): Promise<{ anomalies: HeatmapAnomaly[]; summary: any }> {
    const params = {
      bounds: JSON.stringify([bounds.southwest, bounds.northeast]),
      threshold,
      timeWindow
    };

    return this.makeRequest(
      '/api/heatmap/anomalies',
      { ...options, useCache: false },
      { params }
    );
  }

  /**
   * Fetch clustering analysis
   */
  async getClusters(
    bounds: RegionBounds,
    algorithm: 'dbscan' | 'kmeans' | 'h3' = 'dbscan',
    options: RequestOptions = {}
  ): Promise<{ clusters: HeatmapCluster[]; metadata: any }> {
    const params = {
      bounds: JSON.stringify([bounds.southwest, bounds.northeast]),
      algorithm,
      includeMetadata: true
    };

    return this.makeRequest('/api/heatmap/clustering', options, { params });
  }

  /**
   * Fetch trend analysis
   */
  async getTrends(
    bounds: RegionBounds,
    timeRange: { start: Date; end: Date },
    granularity: 'hour' | 'day' | 'week' = 'day',
    options: RequestOptions = {}
  ): Promise<any> {
    const params = {
      bounds: JSON.stringify([bounds.southwest, bounds.northeast]),
      startDate: timeRange.start.toISOString(),
      endDate: timeRange.end.toISOString(),
      granularity
    };

    return this.makeRequest('/heatmap/trends', options, { params });
  }

  /**
   * Fetch comprehensive analytics
   */
  async getAnalytics(
    bounds: RegionBounds,
    timeRange: { start: Date; end: Date },
    options: RequestOptions = {}
  ): Promise<HeatmapAnalyticsResponse> {
    const params = {
      bounds: JSON.stringify([bounds.southwest, bounds.northeast]),
      startDate: timeRange.start.toISOString(),
      endDate: timeRange.end.toISOString(),
      includeAll: true
    };

    return this.makeRequest<HeatmapAnalyticsResponse>(
      '/heatmap/analytics',
      options,
      { params }
    );
  }

  // ===== CIVIC ISSUE MANAGEMENT =====

  /**
   * Create a new civic issue
   */
  async createCivicIssue(issueData: any): Promise<any> {
    try {
      const response = await this.client.post('/civic-issues', issueData);
      this.cache.clear(); // Clear cache when data changes
      return response.data;
    } catch (error) {
      throw this.handleApiError(error as AxiosError);
    }
  }

  /**
   * Update civic issue status
   */
  async updateIssueStatus(issueId: string, status: string, comment?: string): Promise<any> {
    try {
      const response = await this.client.put(`/civic-issues/${issueId}/status`, {
        status,
        comment
      });
      this.cache.clear(); // Clear cache when data changes
      return response.data;
    } catch (error) {
      throw this.handleApiError(error as AxiosError);
    }
  }

  /**
   * Verify a civic issue
   */
  async verifyIssue(issueId: string, verificationData: any): Promise<any> {
    try {
      const response = await this.client.post(`/civic-issues/${issueId}/verify`, verificationData);
      this.cache.clear();
      return response.data;
    } catch (error) {
      throw this.handleApiError(error as AxiosError);
    }
  }

  // ===== DATA EXPORT =====

  /**
   * Export heatmap data in various formats
   */
  async exportData(
    bounds: RegionBounds,
    format: 'json' | 'csv' | 'geojson',
    filters?: any
  ): Promise<Blob> {
    const params = {
      bounds: JSON.stringify([bounds.southwest, bounds.northeast]),
      format,
      ...filters
    };

    try {
      const response = await this.client.get('/heatmap/export', {
        params,
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      throw this.handleApiError(error as AxiosError);
    }
  }

  // ===== SYSTEM STATUS =====

  /**
   * Get system health and performance metrics
   */
  async getSystemStatus(): Promise<{
    status: 'healthy' | 'degraded' | 'down';
    metrics: PerformanceMetrics;
    services: Record<string, string>;
  }> {
    return this.makeRequest('/heatmap/health', { useCache: false });
  }

  /**
   * Get API performance metrics
   */
  async getPerformanceMetrics(): Promise<PerformanceMetrics> {
    return this.makeRequest('/heatmap/performance', { useCache: false });
  }

  // ===== UTILITY METHODS =====

  /**
   * Clear all cached data
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return this.cache.getStats();
  }

  /**
   * Get performance statistics
   */
  getPerformanceStats() {
    return this.performanceTracker.getStats();
  }

  /**
   * Update API configuration
   */
  updateConfig(newConfig: Partial<ApiConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Recreate axios client if base URL or timeout changed
    if (newConfig.baseUrl || newConfig.timeout) {
      this.setupAxiosClient();
    }
  }

  /**
   * Test API connectivity
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.getSystemStatus();
      return true;
    } catch (error) {
      console.error('API connection test failed:', error);
      return false;
    }
  }
}

// ===== PERFORMANCE TRACKER =====

class PerformanceTracker {
  private requests: Array<{ time: number; success: boolean; timestamp: number }> = [];
  private maxRecords = 1000;

  recordRequest(time: number, success: boolean): void {
    this.requests.push({
      time,
      success,
      timestamp: Date.now()
    });

    // Keep only recent records
    if (this.requests.length > this.maxRecords) {
      this.requests = this.requests.slice(-this.maxRecords);
    }
  }

  getStats(): PerformanceMetrics {
    const recentRequests = this.requests.filter(
      req => Date.now() - req.timestamp < 300000 // Last 5 minutes
    );

    const totalRequests = recentRequests.length;
    const successfulRequests = recentRequests.filter(req => req.success).length;
    const avgResponseTime = totalRequests > 0 
      ? recentRequests.reduce((sum, req) => sum + req.time, 0) / totalRequests
      : 0;

    return {
      renderTime: 0, // To be tracked by UI components
      dataProcessingTime: avgResponseTime,
      networkLatency: avgResponseTime,
      memoryUsage: 0, // To be tracked separately
      frameRate: 60, // To be tracked by UI
      cacheHitRate: 0, // To be calculated from cache stats
      updateFrequency: totalRequests / 5, // Requests per minute
      errorRate: totalRequests > 0 ? (totalRequests - successfulRequests) / totalRequests : 0
    };
  }

  clear(): void {
    this.requests = [];
  }
}

// ===== SINGLETON INSTANCE =====

let apiServiceInstance: AdvancedHeatmapApiService | null = null;

export const getHeatmapApiService = (config?: Partial<ApiConfig>): AdvancedHeatmapApiService => {
  if (!apiServiceInstance) {
    apiServiceInstance = new AdvancedHeatmapApiService(config);
  }
  return apiServiceInstance;
};

// ===== REACT QUERY INTEGRATION =====

export const heatmapQueryKeys = {
  all: ['heatmap'] as const,
  realtime: (bounds: RegionBounds, config?: any) => 
    [...heatmapQueryKeys.all, 'realtime', bounds, config] as const,
  predictive: (bounds: RegionBounds, timeHorizon: string) => 
    [...heatmapQueryKeys.all, 'predictive', bounds, timeHorizon] as const,
  clusters: (bounds: RegionBounds, algorithm: string) => 
    [...heatmapQueryKeys.all, 'clustering', bounds, algorithm] as const,
  analytics: (bounds: RegionBounds, timeRange: any) => 
    [...heatmapQueryKeys.all, 'analytics', bounds, timeRange] as const,
  anomalies: (bounds: RegionBounds, threshold: number) => 
    [...heatmapQueryKeys.all, 'anomalies', bounds, threshold] as const
};

export default AdvancedHeatmapApiService;