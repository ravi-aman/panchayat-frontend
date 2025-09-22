// ===== OFFLINE/CACHING SERVICE =====
// Progressive Web App features with service worker and IndexedDB
// Google Maps-style offline functionality for reliable map access

export interface CacheConfig {
  tileCacheSize: number; // MB
  dataCacheSize: number; // MB
  maxAge: number; // milliseconds
  strategies: CacheStrategy[];
  syncInterval: number; // milliseconds
  compressionEnabled: boolean;
}

export interface CacheStrategy {
  type: 'cache-first' | 'network-first' | 'stale-while-revalidate' | 'network-only' | 'cache-only';
  pattern: RegExp;
  maxAge?: number;
  maxEntries?: number;
}

export interface OfflineData {
  id: string;
  type: 'tiles' | 'vector-data' | 'api-response' | 'user-data';
  url: string;
  data: any;
  timestamp: number;
  version: number;
  compressed: boolean;
  metadata: any;
}

export interface SyncTask {
  id: string;
  type: 'upload' | 'download' | 'update' | 'delete';
  url: string;
  data?: any;
  priority: 'high' | 'medium' | 'low';
  attempts: number;
  maxAttempts: number;
  lastAttempt: number;
  scheduled: number;
}

export interface OfflineMetrics {
  cacheSize: number;
  hitRate: number;
  missRate: number;
  syncPending: number;
  storageUsed: number;
  storageAvailable: number;
  lastSync: number;
}

/**
 * Offline/Caching Service
 * Provides reliable offline access to map data and user interactions
 * Uses service workers, IndexedDB, and background sync
 */
export class OfflineCachingService {
  private db: IDBDatabase | null = null;
  private serviceWorker: ServiceWorkerRegistration | null = null;
  private config: CacheConfig;
  private syncQueue: SyncTask[] = [];
  private metrics: OfflineMetrics = this.getDefaultMetrics();
  private networkStatus: boolean = navigator.onLine;
  private syncTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.config = this.getDefaultConfig();
    this.initialize();
    this.setupNetworkListeners();
  }

  /**
   * Get default cache configuration
   */
  private getDefaultConfig(): CacheConfig {
    return {
      tileCacheSize: 500, // 500MB for map tiles
      dataCacheSize: 100, // 100MB for API data
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      compressionEnabled: true,
      syncInterval: 30000, // 30 seconds
      strategies: [
        {
          type: 'cache-first',
          pattern: /\.(png|jpg|jpeg|svg|webp)$/i,
          maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days for images
          maxEntries: 1000
        },
        {
          type: 'stale-while-revalidate',
          pattern: /\/api\/tiles/,
          maxAge: 24 * 60 * 60 * 1000, // 1 day for tiles
          maxEntries: 5000
        },
        {
          type: 'network-first',
          pattern: /\/api\/live/,
          maxAge: 5 * 60 * 1000, // 5 minutes for live data
          maxEntries: 100
        },
        {
          type: 'cache-first',
          pattern: /\/api\/static/,
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days for static data
          maxEntries: 500
        }
      ]
    };
  }

  /**
   * Initialize offline capabilities
   */
  private async initialize(): Promise<void> {
    try {
      await this.initializeIndexedDB();
      await this.registerServiceWorker();
      await this.setupBackgroundSync();
      this.startSyncTimer();
      
      console.log('Offline caching service initialized');
    } catch (error) {
      console.error('Failed to initialize offline service:', error);
    }
  }

  /**
   * Initialize IndexedDB for data storage
   */
  private async initializeIndexedDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('MapCacheDB', 2);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create object stores
        if (!db.objectStoreNames.contains('tiles')) {
          const tileStore = db.createObjectStore('tiles', { keyPath: 'id' });
          tileStore.createIndex('url', 'url', { unique: false });
          tileStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
        
        if (!db.objectStoreNames.contains('apiData')) {
          const dataStore = db.createObjectStore('apiData', { keyPath: 'id' });
          dataStore.createIndex('url', 'url', { unique: false });
          dataStore.createIndex('type', 'type', { unique: false });
          dataStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
        
        if (!db.objectStoreNames.contains('syncQueue')) {
          const syncStore = db.createObjectStore('syncQueue', { keyPath: 'id' });
          syncStore.createIndex('priority', 'priority', { unique: false });
          syncStore.createIndex('scheduled', 'scheduled', { unique: false });
        }
        
        if (!db.objectStoreNames.contains('userData')) {
          const userStore = db.createObjectStore('userData', { keyPath: 'id' });
          userStore.createIndex('type', 'type', { unique: false });
          userStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  /**
   * Register service worker for offline functionality
   */
  private async registerServiceWorker(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        this.serviceWorker = await navigator.serviceWorker.register('/sw.js');
        
        this.serviceWorker.addEventListener('updatefound', () => {
          console.log('New service worker version available');
        });
        
        // Listen for messages from service worker
        navigator.serviceWorker.addEventListener('message', this.handleServiceWorkerMessage.bind(this));
        
        console.log('Service worker registered successfully');
      } catch (error) {
        console.error('Service worker registration failed:', error);
      }
    }
  }

  /**
   * Setup background sync for offline actions
   */
  private async setupBackgroundSync(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;
        
        // Register sync event (if supported)
        if ('sync' in (registration as any)) {
          await (registration as any).sync.register('background-sync');
          console.log('Background sync registered');
        } else {
          console.log('Background sync not supported, using fallback');
        }
      } catch (error) {
        console.error('Background sync registration failed:', error);
      }
    }
  }

  /**
   * Setup network status listeners
   */
  private setupNetworkListeners(): void {
    window.addEventListener('online', () => {
      this.networkStatus = true;
      this.handleNetworkStatusChange(true);
    });
    
    window.addEventListener('offline', () => {
      this.networkStatus = false;
      this.handleNetworkStatusChange(false);
    });
  }

  /**
   * Handle network status changes
   */
  private handleNetworkStatusChange(isOnline: boolean): void {
    console.log(`Network status changed: ${isOnline ? 'online' : 'offline'}`);
    
    if (isOnline) {
      this.processSyncQueue();
    }
  }

  /**
   * Cache map tiles for offline access
   */
  async cacheTiles(bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  }, zoomLevels: number[]): Promise<void> {
    if (!this.db) return;
    
    const tileUrls = this.generateTileUrls(bounds, zoomLevels);
    const batchSize = 50;
    
    for (let i = 0; i < tileUrls.length; i += batchSize) {
      const batch = tileUrls.slice(i, i + batchSize);
      await this.cacheTileBatch(batch);
      
      // Progress callback could be added here
      const progress = (i + batch.length) / tileUrls.length;
      console.log(`Tile caching progress: ${(progress * 100).toFixed(1)}%`);
    }
  }

  /**
   * Generate tile URLs for given bounds and zoom levels
   */
  private generateTileUrls(bounds: any, zoomLevels: number[]): string[] {
    const urls: string[] = [];
    
    zoomLevels.forEach(zoom => {
      const tiles = this.getBoundingTiles(bounds, zoom);
      
      for (let x = tiles.minX; x <= tiles.maxX; x++) {
        for (let y = tiles.minY; y <= tiles.maxY; y++) {
          urls.push(`https://a.tile.openstreetmap.org/${zoom}/${x}/${y}.png`);
          urls.push(`https://b.tile.openstreetmap.org/${zoom}/${x}/${y}.png`);
          urls.push(`https://c.tile.openstreetmap.org/${zoom}/${x}/${y}.png`);
        }
      }
    });
    
    return [...new Set(urls)]; // Remove duplicates
  }

  /**
   * Get bounding tile coordinates for given bounds and zoom
   */
  private getBoundingTiles(bounds: any, zoom: number): {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  } {
    const toTileCoord = (lat: number, lon: number, zoom: number) => {
      const x = Math.floor((lon + 180) / 360 * Math.pow(2, zoom));
      const y = Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom));
      return { x, y };
    };
    
    const topLeft = toTileCoord(bounds.north, bounds.west, zoom);
    const bottomRight = toTileCoord(bounds.south, bounds.east, zoom);
    
    return {
      minX: topLeft.x,
      maxX: bottomRight.x,
      minY: topLeft.y,
      maxY: bottomRight.y
    };
  }

  /**
   * Cache batch of tiles
   */
  private async cacheTileBatch(urls: string[]): Promise<void> {
    const promises = urls.map(url => this.cacheSingleTile(url));
    await Promise.allSettled(promises);
  }

  /**
   * Cache single tile
   */
  private async cacheSingleTile(url: string): Promise<void> {
    try {
      const response = await fetch(url);
      if (!response.ok) return;
      
      const data = await response.arrayBuffer();
      const compressed = this.config.compressionEnabled ? await this.compressData(data) : data;
      
      await this.storeData('tiles', {
        id: this.generateCacheKey(url),
        url,
        type: 'tiles',
        data: compressed,
        timestamp: Date.now(),
        version: 1,
        compressed: this.config.compressionEnabled,
        metadata: {
          size: data.byteLength,
          contentType: response.headers.get('content-type')
        }
      });
      
      this.metrics.hitRate++;
    } catch (error) {
      console.error(`Failed to cache tile ${url}:`, error);
      this.metrics.missRate++;
    }
  }

  /**
   * Store data in IndexedDB
   */
  private async storeData(storeName: string, data: OfflineData): Promise<void> {
    if (!this.db) return;
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      
      const request = store.put(data);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Retrieve data from IndexedDB
   */
  private async retrieveData(storeName: string, key: string): Promise<OfflineData | null> {
    if (!this.db) return null;
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Cache API response
   */
  async cacheAPIResponse(url: string, data: any, type: OfflineData['type'] = 'api-response'): Promise<void> {
    const compressed = this.config.compressionEnabled ? await this.compressData(JSON.stringify(data)) : data;
    
    await this.storeData('apiData', {
      id: this.generateCacheKey(url),
      url,
      type,
      data: compressed,
      timestamp: Date.now(),
      version: 1,
      compressed: this.config.compressionEnabled,
      metadata: {
        originalSize: JSON.stringify(data).length
      }
    });
  }

  /**
   * Get cached API response
   */
  async getCachedAPIResponse(url: string): Promise<any | null> {
    const cached = await this.retrieveData('apiData', this.generateCacheKey(url));
    
    if (!cached) {
      this.metrics.missRate++;
      return null;
    }
    
    // Check if cache is still valid
    if (Date.now() - cached.timestamp > this.config.maxAge) {
      this.deleteData('apiData', cached.id);
      this.metrics.missRate++;
      return null;
    }
    
    this.metrics.hitRate++;
    
    if (cached.compressed) {
      const decompressed = await this.decompressData(cached.data);
      return JSON.parse(decompressed);
    }
    
    return cached.data;
  }

  /**
   * Add task to sync queue
   */
  addSyncTask(task: Omit<SyncTask, 'id' | 'attempts' | 'lastAttempt'>): void {
    const syncTask: SyncTask = {
      ...task,
      id: this.generateId(),
      attempts: 0,
      lastAttempt: 0
    };
    
    this.syncQueue.push(syncTask);
    this.storeData('syncQueue', syncTask as any);
    
    if (this.networkStatus) {
      this.processSyncQueue();
    }
  }

  /**
   * Process sync queue
   */
  private async processSyncQueue(): Promise<void> {
    if (!this.networkStatus) return;
    
    const pendingTasks = this.syncQueue
      .filter(task => task.attempts < task.maxAttempts)
      .sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });
    
    for (const task of pendingTasks) {
      try {
        await this.executeSyncTask(task);
        this.removeSyncTask(task.id);
      } catch (error) {
        task.attempts++;
        task.lastAttempt = Date.now();
        console.error(`Sync task ${task.id} failed (attempt ${task.attempts}):`, error);
        
        if (task.attempts >= task.maxAttempts) {
          this.removeSyncTask(task.id);
        }
      }
    }
  }

  /**
   * Execute individual sync task
   */
  private async executeSyncTask(task: SyncTask): Promise<void> {
    const options: RequestInit = {
      method: task.type === 'upload' ? 'POST' : 
              task.type === 'update' ? 'PUT' :
              task.type === 'delete' ? 'DELETE' : 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    if (task.data) {
      options.body = JSON.stringify(task.data);
    }
    
    const response = await fetch(task.url, options);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  }

  /**
   * Remove task from sync queue
   */
  private removeSyncTask(taskId: string): void {
    this.syncQueue = this.syncQueue.filter(task => task.id !== taskId);
    this.deleteData('syncQueue', taskId);
  }

  /**
   * Delete data from IndexedDB
   */
  private async deleteData(storeName: string, key: string): Promise<void> {
    if (!this.db) return;
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      
      const request = store.delete(key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Start sync timer
   */
  private startSyncTimer(): void {
    this.syncTimer = setInterval(() => {
      if (this.networkStatus) {
        this.processSyncQueue();
      }
      this.updateMetrics();
    }, this.config.syncInterval);
  }

  /**
   * Update performance metrics
   */
  private async updateMetrics(): Promise<void> {
    if (!this.db) return;
    
    try {
      // Estimate storage usage
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        this.metrics.storageUsed = estimate.usage || 0;
        this.metrics.storageAvailable = estimate.quota || 0;
      }
      
      // Count pending sync tasks
      this.metrics.syncPending = this.syncQueue.length;
      
      // Calculate cache hit/miss rates
      const total = this.metrics.hitRate + this.metrics.missRate;
      if (total > 0) {
        this.metrics.hitRate = this.metrics.hitRate / total;
        this.metrics.missRate = this.metrics.missRate / total;
      }
    } catch (error) {
      console.error('Failed to update metrics:', error);
    }
  }

  /**
   * Handle service worker messages
   */
  private handleServiceWorkerMessage(event: MessageEvent): void {
    const { type, data } = event.data;
    
    switch (type) {
      case 'cache-updated':
        console.log('Cache updated by service worker:', data);
        break;
      case 'sync-completed':
        console.log('Background sync completed:', data);
        break;
      default:
        console.log('Unknown service worker message:', event.data);
    }
  }

  /**
   * Compress data for storage
   */
  private async compressData(data: any): Promise<ArrayBuffer> {
    // Simple implementation - in production, use a compression library
    if (typeof data === 'string') {
      return new TextEncoder().encode(data).buffer;
    }
    return data;
  }

  /**
   * Decompress data from storage
   */
  private async decompressData(data: ArrayBuffer): Promise<string> {
    // Simple implementation - in production, use a compression library
    return new TextDecoder().decode(data);
  }

  /**
   * Generate cache key for URL
   */
  private generateCacheKey(url: string): string {
    return btoa(url).replace(/[/+=]/g, '');
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * Get default metrics
   */
  private getDefaultMetrics(): OfflineMetrics {
    return {
      cacheSize: 0,
      hitRate: 0,
      missRate: 0,
      syncPending: 0,
      storageUsed: 0,
      storageAvailable: 0,
      lastSync: 0
    };
  }

  /**
   * Clear all caches
   */
  async clearCache(): Promise<void> {
    if (!this.db) return;
    
    const stores = ['tiles', 'apiData', 'syncQueue', 'userData'];
    
    for (const storeName of stores) {
      await this.clearStore(storeName);
    }
    
    this.metrics = this.getDefaultMetrics();
  }

  /**
   * Clear specific store
   */
  private async clearStore(storeName: string): Promise<void> {
    if (!this.db) return;
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get current metrics
   */
  getMetrics(): OfflineMetrics {
    return { ...this.metrics };
  }

  /**
   * Check if device is online
   */
  isOnline(): boolean {
    return this.networkStatus;
  }

  /**
   * Force sync now
   */
  async forceSync(): Promise<void> {
    if (this.networkStatus) {
      await this.processSyncQueue();
    }
  }

  /**
   * Export offline data for backup
   */
  async exportOfflineData(): Promise<any> {
    if (!this.db) return null;
    
    const data: any = {};
    const stores = ['tiles', 'apiData', 'userData'];
    
    for (const storeName of stores) {
      data[storeName] = await this.getAllFromStore(storeName);
    }
    
    return data;
  }

  /**
   * Get all data from store
   */
  private async getAllFromStore(storeName: string): Promise<any[]> {
    if (!this.db) return [];
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
    
    if (this.db) {
      this.db.close();
      this.db = null;
    }
    
    this.syncQueue = [];
  }
}

// Singleton instance
export const offlineCachingService = new OfflineCachingService();