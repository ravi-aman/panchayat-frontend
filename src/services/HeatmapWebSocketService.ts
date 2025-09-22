// ===== ADVANCED WEBSOCKET SERVICE FOR REAL-TIME HEATMAP UPDATES =====
// Production-level WebSocket service for real-time heatmap data, notifications, and subscriptions

import {
  RegionBounds,
  HeatmapNotification,
  HeatmapUpdateEvent,
  ConnectionStatus
} from '../types/heatmap';

// ===== WEBSOCKET CONFIGURATION =====

interface WebSocketOptions {
  url?: string;
  reconnectAttempts?: number;
  reconnectDelay?: number;
  heartbeatInterval?: number;
  maxConnectionTime?: number;
  enableLogging?: boolean;
  authToken?: string;
}

interface SubscriptionCallback {
  onUpdate?: (data: HeatmapUpdateEvent) => void;
  onNotification?: (notification: HeatmapNotification) => void;
  onError?: (error: Error) => void;
  onStatusChange?: (status: ConnectionStatus) => void;
}

interface ActiveSubscription {
  id: string;
  regionId: string;
  bounds: RegionBounds;
  callback: SubscriptionCallback;
  filters?: any;
  createdAt: Date;
  lastUpdate?: Date;
}

// ===== WEBSOCKET SERVICE CLASS =====

class HeatmapWebSocketService {
  private socket: WebSocket | null = null;
  private config: Required<WebSocketOptions>;
  private subscriptions = new Map<string, ActiveSubscription>();
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private connectionAttempts = 0;
  private isConnecting = false;
  private connectionId: string | null = null;
  
  // Connection status and metrics
  private status: ConnectionStatus = 'disconnected';
  private lastConnected: Date | null = null;
  private totalReconnects = 0;
  private totalMessages = 0;
  private totalErrors = 0;

  // Event listeners
  private statusListeners = new Set<(status: ConnectionStatus) => void>();
  private errorListeners = new Set<(error: Error) => void>();

  constructor(options: WebSocketOptions = {}) {
    this.config = {
      url: options.url || this.getDefaultWebSocketUrl(),
      reconnectAttempts: options.reconnectAttempts || 5,
      reconnectDelay: options.reconnectDelay || 2000,
      heartbeatInterval: options.heartbeatInterval || 30000,
      maxConnectionTime: options.maxConnectionTime || 300000, // 5 minutes
      enableLogging: options.enableLogging || false,
      authToken: options.authToken || this.getAuthToken() || ''
    };

    // Check if backend is available before auto-connecting
    this.checkBackendAvailability().then(isAvailable => {
      if (isAvailable && this.config.authToken) {
        this.connect();
      } else {
        this.log('Backend not available, starting in demo mode');
        this.startMockHeartbeat();
      }
    });
  }

  // ===== CONNECTION MANAGEMENT =====

  public async connect(): Promise<void> {
    // First check if backend is available
    const isAvailable = await this.checkBackendAvailability();

    if (!isAvailable) {
      this.log('Backend not available, using demo mode');
      this.startMockHeartbeat();
      return;
    }

    if (this.isConnecting || this.socket?.readyState === WebSocket.OPEN) {
      return;
    }

    this.isConnecting = true;
    this.setStatus('connecting');

    try {
      await this.establishConnection();
    } catch (error) {
      this.log(`WebSocket connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      this.setStatus('disconnected');

      // Don't throw error - just log and continue in demo mode
      this.log('Falling back to demo mode');
      this.startMockHeartbeat();
    } finally {
      this.isConnecting = false;
    }
  }

  private establishConnection(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const wsUrl = new URL(this.config.url);
        if (this.config.authToken) {
          wsUrl.searchParams.set('token', this.config.authToken);
        }

        this.socket = new WebSocket(wsUrl.toString());
        
        const connectionTimeout = setTimeout(() => {
          this.socket?.close();
          reject(new Error('WebSocket connection timeout'));
        }, 10000);

        this.socket.onopen = () => {
          clearTimeout(connectionTimeout);
          this.handleConnectionOpen();
          resolve();
        };

        this.socket.onmessage = (event) => {
          this.handleMessage(event);
        };

        this.socket.onclose = (event) => {
          this.handleConnectionClose(event);
        };

        this.socket.onerror = (event) => {
          clearTimeout(connectionTimeout);
          this.handleSocketError(event);
          reject(new Error('WebSocket connection failed'));
        };

      } catch (error) {
        reject(error);
      }
    });
  }

  private handleConnectionOpen(): void {
    this.connectionAttempts = 0;
    this.lastConnected = new Date();
    this.connectionId = this.generateConnectionId();
    this.setStatus('connected');
    
    this.log('WebSocket connected');
    
    // Start heartbeat
    this.startHeartbeat();
    
    // Resubscribe to all active subscriptions
    this.resubscribeAll();
  }

  private handleConnectionClose(event: CloseEvent): void {
    this.setStatus('disconnected');
    this.stopHeartbeat();
    
    this.log(`WebSocket closed: ${event.code} - ${event.reason}`);

    // Attempt reconnection if not intentionally closed
    if (event.code !== 1000 && this.connectionAttempts < this.config.reconnectAttempts) {
      this.scheduleReconnect();
    }
  }

  private handleSocketError(event: Event): void {
    this.totalErrors++;
    const error = new Error(`WebSocket error: ${event}`);
    this.log(`WebSocket error: ${error.message}`);
    
    this.errorListeners.forEach(listener => {
      try {
        listener(error);
      } catch (err) {
        console.error('Error in error listener:', err);
      }
    });
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    const delay = Math.min(
      this.config.reconnectDelay * Math.pow(2, this.connectionAttempts),
      30000 // Max 30 seconds
    );

    this.log(`Scheduling reconnection in ${delay}ms (attempt ${this.connectionAttempts + 1})`);

    this.reconnectTimer = setTimeout(() => {
      this.connectionAttempts++;
      this.totalReconnects++;
      this.connect().catch(error => {
        this.log(`Reconnection failed: ${error.message}`);
      });
    }, delay);
  }

  public disconnect(): void {
    this.setStatus('disconnecting');
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.stopHeartbeat();
    
    if (this.socket) {
      this.socket.close(1000, 'Client disconnect');
      this.socket = null;
    }

    this.setStatus('disconnected');
    this.connectionId = null;
    this.log('WebSocket disconnected');
  }

  // ===== HEARTBEAT MANAGEMENT =====

  private startHeartbeat(): void {
    this.stopHeartbeat();
    
    this.heartbeatTimer = setInterval(() => {
      if (this.socket?.readyState === WebSocket.OPEN) {
        this.send({
          type: 'ping',
          timestamp: Date.now(),
          connectionId: this.connectionId
        });
      }
    }, this.config.heartbeatInterval);
  }

  private startMockHeartbeat(): void {
    this.stopHeartbeat(); // Clear existing heartbeat
    
    // Simulate periodic demo data updates
    this.heartbeatTimer = setInterval(() => {
      // Notify all active subscriptions with mock data
      this.subscriptions.forEach(subscription => {
        // Simulate a mock update event for demo purposes
        const mockUpdate: HeatmapUpdateEvent = {
          type: 'data_update',
          subscriptionId: subscription.id,
          regionId: 'demo-region',
          timestamp: new Date(),
          data: {
            metadata: {
              totalCount: Math.floor(Math.random() * 5),
              updateType: 'incremental',
              affectedArea: {
                southwest: [-122.4594, 37.7349],
                northeast: [-122.4194, 37.7749]
              }
            }
          }
        };

        if (subscription.callback.onUpdate) {
          subscription.callback.onUpdate(mockUpdate);
        }
      });
    }, this.config.heartbeatInterval * 2); // Less frequent than real heartbeat
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  // ===== MESSAGE HANDLING =====

  private handleMessage(event: MessageEvent): void {
    try {
      const message = JSON.parse(event.data);
      this.totalMessages++;
      
      this.log(`Received message: ${message.type}`);

      switch (message.type) {
        case 'pong':
          this.handlePong(message);
          break;
        case 'heatmap_update':
          this.handleHeatmapUpdate(message);
          break;
        case 'notification':
          this.handleNotification(message);
          break;
        case 'subscription_confirmed':
          this.handleSubscriptionConfirmed(message);
          break;
        case 'subscription_error':
          this.handleSubscriptionError(message);
          break;
        case 'anomaly_alert':
          this.handleAnomalyAlert(message);
          break;
        default:
          this.log(`Unknown message type: ${message.type}`);
      }
    } catch (error) {
      this.log(`Failed to parse message: ${(error as Error).message}`);
    }
  }

  private handlePong(message: any): void {
    // Update connection health metrics
    const latency = Date.now() - message.timestamp;
    this.log(`Heartbeat latency: ${latency}ms`);
  }

  private handleHeatmapUpdate(message: HeatmapUpdateEvent): void {
    const subscription = this.subscriptions.get(message.subscriptionId);
    if (subscription) {
      subscription.lastUpdate = new Date();
      subscription.callback.onUpdate?.(message);
    }
  }

  private handleNotification(message: HeatmapNotification): void {
    // Broadcast to all subscriptions that match the region
    this.subscriptions.forEach(subscription => {
      if (subscription.regionId === message.regionId) {
        subscription.callback.onNotification?.(message);
      }
    });
  }

  private handleSubscriptionConfirmed(message: any): void {
    this.log(`Subscription confirmed: ${message.subscriptionId}`);
  }

  private handleSubscriptionError(message: any): void {
    const subscription = this.subscriptions.get(message.subscriptionId);
    if (subscription) {
      const error = new Error(message.error || 'Subscription error');
      subscription.callback.onError?.(error);
    }
  }

  private handleAnomalyAlert(message: any): void {
    // Handle anomaly alerts
    this.subscriptions.forEach(subscription => {
      subscription.callback.onNotification?.({
        id: message.id,
        type: 'anomaly_detected',
        regionId: subscription.regionId,
        title: 'Anomaly Detected',
        message: message.message,
        severity: message.severity,
        timestamp: new Date(message.timestamp),
        data: message.anomaly
      });
    });
  }

  // ===== SUBSCRIPTION MANAGEMENT =====

  public subscribe(
    regionId: string,
    bounds: RegionBounds,
    callback: SubscriptionCallback,
    filters?: any
  ): string {
    const subscriptionId = this.generateSubscriptionId();
    
    const subscription: ActiveSubscription = {
      id: subscriptionId,
      regionId,
      bounds,
      callback,
      filters,
      createdAt: new Date()
    };

    this.subscriptions.set(subscriptionId, subscription);

    // Send subscription request if connected
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.sendSubscriptionRequest(subscription);
    }

    this.log(`Created subscription: ${subscriptionId} for region: ${regionId}`);
    return subscriptionId;
  }

  public unsubscribe(subscriptionId: string): void {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) return;

    // Send unsubscription request
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.send({
        type: 'unsubscribe',
        subscriptionId,
        connectionId: this.connectionId
      });
    }

    this.subscriptions.delete(subscriptionId);
    this.log(`Removed subscription: ${subscriptionId}`);
  }

  public unsubscribeAll(): void {
    const subscriptionIds = Array.from(this.subscriptions.keys());
    subscriptionIds.forEach(id => this.unsubscribe(id));
  }

  private sendSubscriptionRequest(subscription: ActiveSubscription): void {
    this.send({
      type: 'subscribe',
      subscriptionId: subscription.id,
      regionId: subscription.regionId,
      bounds: subscription.bounds,
      filters: subscription.filters,
      connectionId: this.connectionId
    });
  }

  private resubscribeAll(): void {
    this.subscriptions.forEach(subscription => {
      this.sendSubscriptionRequest(subscription);
    });
  }

  // ===== UTILITY METHODS =====

  private send(data: any): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(data));
    } else {
      this.log('Cannot send message: WebSocket not connected');
    }
  }

  private setStatus(status: ConnectionStatus): void {
    if (this.status !== status) {
      this.status = status;
      this.statusListeners.forEach(listener => {
        try {
          listener(status);
        } catch (error) {
          console.error('Error in status listener:', error);
        }
      });
    }
  }

  private generateConnectionId(): string {
    return `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateSubscriptionId(): string {
    return `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getDefaultWebSocketUrl(): string {
    // Use backend URL instead of frontend URL for WebSocket connections
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
    const url = new URL(backendUrl);
    const protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${url.host}/api/heatmap/ws`;
  }

  private async checkBackendAvailability(): Promise<boolean> {
    try {
      // Try to connect to a simple HTTP endpoint first
      const httpUrl = this.config.url.replace(/^ws/, 'http').replace(/\/ws$/, '/health');
      const response = await fetch(httpUrl, {
        method: 'GET',
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });
      return response.ok;
    } catch (error) {
      this.log(`Backend availability check failed: ${error}`);
      return false;
    }
  }

  private getAuthToken(): string | undefined {
    return localStorage.getItem('authToken') || undefined;
  }

  private log(message: string): void {
    if (this.config.enableLogging) {
      console.log(`[HeatmapWebSocket] ${message}`);
    }
  }

  // ===== PUBLIC API =====

  public getStatus(): ConnectionStatus {
    return this.status;
  }

  public isConnected(): boolean {
    return this.status === 'connected';
  }

  public getSubscriptions(): string[] {
    return Array.from(this.subscriptions.keys());
  }

  public getSubscriptionInfo(subscriptionId: string): ActiveSubscription | undefined {
    return this.subscriptions.get(subscriptionId);
  }

  public getConnectionMetrics() {
    return {
      status: this.status,
      connectionId: this.connectionId,
      lastConnected: this.lastConnected,
      totalReconnects: this.totalReconnects,
      totalMessages: this.totalMessages,
      totalErrors: this.totalErrors,
      activeSubscriptions: this.subscriptions.size,
      connectionAttempts: this.connectionAttempts
    };
  }

  public onStatusChange(listener: (status: ConnectionStatus) => void): () => void {
    this.statusListeners.add(listener);
    return () => this.statusListeners.delete(listener);
  }

  public onError(listener: (error: Error) => void): () => void {
    this.errorListeners.add(listener);
    return () => this.errorListeners.delete(listener);
  }

  public updateAuthToken(token: string): void {
    this.config.authToken = token;
    
    // Reconnect with new token if currently connected
    if (this.isConnected()) {
      this.disconnect();
      setTimeout(() => this.connect(), 1000);
    }
  }

  // ===== CLEANUP =====

  public destroy(): void {
    this.disconnect();
    this.unsubscribeAll();
    this.statusListeners.clear();
    this.errorListeners.clear();
  }
}

// ===== SERVICE INSTANCE AND EXPORTS =====

let heatmapWebSocketService: HeatmapWebSocketService | null = null;

export const getHeatmapWebSocketService = (options?: WebSocketOptions): HeatmapWebSocketService => {
  if (!heatmapWebSocketService) {
    heatmapWebSocketService = new HeatmapWebSocketService(options);
  }
  return heatmapWebSocketService;
};

export const createHeatmapWebSocketService = (options?: WebSocketOptions): HeatmapWebSocketService => {
  return new HeatmapWebSocketService(options);
};

export default HeatmapWebSocketService;