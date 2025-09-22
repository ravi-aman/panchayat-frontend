// ===== EVENT-DRIVEN REAL-TIME UPDATES SERVICE =====
// WebSocket-based real-time data streaming and event management
// Uber-style live data synchronization across multiple clients

export interface RealtimeEvent {
  id: string;
  type: EventType;
  source: string;
  timestamp: number;
  data: any;
  priority: 'low' | 'medium' | 'high' | 'critical';
  channel: string;
  userId?: string;
  sessionId?: string;
  version: number;
}

export type EventType = 
  | 'data-update'
  | 'layer-change'
  | 'user-action'
  | 'system-alert'
  | 'location-update'
  | 'heatmap-update'
  | 'traffic-update'
  | 'weather-update'
  | 'emergency-alert'
  | 'custom';

export interface EventChannel {
  name: string;
  pattern: RegExp;
  subscribers: Set<EventSubscriber>;
  qos: 'at-most-once' | 'at-least-once' | 'exactly-once';
  persistent: boolean;
  maxHistory: number;
  history: RealtimeEvent[];
}

export interface EventSubscriber {
  id: string;
  callback: (event: RealtimeEvent) => void;
  channels: string[];
  filters?: EventFilter[];
  active: boolean;
  lastSeen: number;
}

export interface EventFilter {
  field: string;
  operator: 'equals' | 'contains' | 'gt' | 'lt' | 'regex';
  value: any;
}

export interface ConnectionConfig {
  url: string;
  reconnectInterval: number;
  maxReconnectAttempts: number;
  heartbeatInterval: number;
  compression: boolean;
  authentication?: {
    token: string;
    type: 'bearer' | 'basic' | 'custom';
  };
}

export interface RealtimeMetrics {
  connected: boolean;
  connectionUptime: number;
  messagesReceived: number;
  messagesSent: number;
  reconnectCount: number;
  averageLatency: number;
  subscriberCount: number;
  channelCount: number;
  queuedEvents: number;
}

/**
 * Event-Driven Real-Time Updates Service
 * Manages WebSocket connections, event channels, and live data synchronization
 * Provides reliable real-time updates for civic mapping data
 */
export class EventDrivenRealtimeService {
  private websocket: WebSocket | null = null;
  private channels: Map<string, EventChannel> = new Map();
  private subscribers: Map<string, EventSubscriber> = new Map();
  private eventQueue: RealtimeEvent[] = [];
  private config: ConnectionConfig;
  private metrics: RealtimeMetrics = this.getDefaultMetrics();
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private connectionStartTime: number = 0;
  private latencyMeasurements: number[] = [];

  constructor() {
    this.config = this.getDefaultConfig();
    this.initializeDefaultChannels();
  }

  /**
   * Get default connection configuration
   */
  private getDefaultConfig(): ConnectionConfig {
    // Use wss:// for production, ws:// for development
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = import.meta.env.VITE_WEBSOCKET_HOST || window.location.host;
    
    return {
      url: `${protocol}//${host}/ws/events`,
      reconnectInterval: 5000, // 5 seconds
      maxReconnectAttempts: 10,
      heartbeatInterval: 30000, // 30 seconds
      compression: true,
      authentication: {
        token: localStorage.getItem('auth_token') || '',
        type: 'bearer'
      }
    };
  }

  /**
   * Initialize default event channels
   */
  private initializeDefaultChannels(): void {
    // Civic data updates
    this.createChannel('civic-data', {
      pattern: /^civic\./,
      qos: 'at-least-once',
      persistent: true,
      maxHistory: 100
    });

    // Real-time location updates
    this.createChannel('location-updates', {
      pattern: /^location\./,
      qos: 'at-most-once',
      persistent: false,
      maxHistory: 50
    });

    // System alerts and notifications
    this.createChannel('system-alerts', {
      pattern: /^system\./,
      qos: 'exactly-once',
      persistent: true,
      maxHistory: 200
    });

    // Traffic and transportation
    this.createChannel('traffic-data', {
      pattern: /^traffic\./,
      qos: 'at-most-once',
      persistent: false,
      maxHistory: 25
    });

    // Weather updates
    this.createChannel('weather-updates', {
      pattern: /^weather\./,
      qos: 'at-most-once',
      persistent: false,
      maxHistory: 10
    });

    // Emergency alerts
    this.createChannel('emergency-alerts', {
      pattern: /^emergency\./,
      qos: 'exactly-once',
      persistent: true,
      maxHistory: 500
    });

    // User interactions
    this.createChannel('user-events', {
      pattern: /^user\./,
      qos: 'at-most-once',
      persistent: false,
      maxHistory: 20
    });
  }

  /**
   * Connect to WebSocket server
   */
  async connect(): Promise<void> {
    if (this.websocket?.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected');
      return;
    }

    try {
      this.connectionStartTime = Date.now();
      this.websocket = new WebSocket(this.config.url);

      // Setup event listeners
      this.websocket.onopen = this.handleWebSocketOpen.bind(this);
      this.websocket.onmessage = this.handleWebSocketMessage.bind(this);
      this.websocket.onclose = this.handleWebSocketClose.bind(this);
      this.websocket.onerror = this.handleWebSocketError.bind(this);

      // Wait for connection
      await this.waitForConnection();
      
      // Start heartbeat
      this.startHeartbeat();
      
      console.log('WebSocket connected successfully');
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
      this.scheduleReconnect();
    }
  }

  /**
   * Wait for WebSocket connection
   */
  private waitForConnection(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.websocket) {
        reject(new Error('WebSocket not initialized'));
        return;
      }

      const timeout = setTimeout(() => {
        reject(new Error('Connection timeout'));
      }, 10000);

      this.websocket.addEventListener('open', () => {
        clearTimeout(timeout);
        resolve();
      }, { once: true });

      this.websocket.addEventListener('error', () => {
        clearTimeout(timeout);
        reject(new Error('Connection failed'));
      }, { once: true });
    });
  }

  /**
   * Handle WebSocket open event
   */
  private handleWebSocketOpen(): void {
    this.metrics.connected = true;
    this.metrics.reconnectCount = 0;

    // Send authentication if configured
    if (this.config.authentication?.token) {
      this.sendMessage({
        type: 'auth',
        token: this.config.authentication.token,
        tokenType: this.config.authentication.type
      });
    }

    // Resubscribe to channels
    this.resubscribeChannels();

    // Process queued events
    this.processEventQueue();
  }

  /**
   * Handle WebSocket message
   */
  private handleWebSocketMessage(event: MessageEvent): void {
    try {
      const message = JSON.parse(event.data);
      this.processIncomingMessage(message);
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
    }
  }

  /**
   * Handle WebSocket close event
   */
  private handleWebSocketClose(event: CloseEvent): void {
    this.metrics.connected = false;
    
    console.log(`WebSocket closed: ${event.code} - ${event.reason}`);
    
    if (!event.wasClean) {
      this.scheduleReconnect();
    }
  }

  /**
   * Handle WebSocket error
   */
  private handleWebSocketError(error: Event): void {
    console.error('WebSocket error:', error);
    this.metrics.connected = false;
  }

  /**
   * Process incoming message
   */
  private processIncomingMessage(message: any): void {
    const startTime = performance.now();
    
    switch (message.type) {
      case 'event':
        this.handleRealtimeEvent(message.data);
        break;
      case 'pong':
        this.handlePong(message.timestamp);
        break;
      case 'auth-success':
        console.log('Authentication successful');
        break;
      case 'auth-failed':
        console.error('Authentication failed:', message.reason);
        break;
      case 'error':
        console.error('Server error:', message.message);
        break;
      default:
        console.warn('Unknown message type:', message.type);
    }

    // Update metrics
    this.metrics.messagesReceived++;
    const processingTime = performance.now() - startTime;
    this.updateLatencyMetrics(processingTime);
  }

  /**
   * Handle real-time event
   */
  private handleRealtimeEvent(eventData: RealtimeEvent): void {
    // Find matching channels
    const matchingChannels = Array.from(this.channels.values())
      .filter(channel => channel.pattern.test(eventData.channel));

    matchingChannels.forEach(channel => {
      // Add to channel history
      if (channel.persistent) {
        channel.history.push(eventData);
        
        // Maintain history size
        if (channel.history.length > channel.maxHistory) {
          channel.history.shift();
        }
      }

      // Notify subscribers
      channel.subscribers.forEach(subscriber => {
        if (this.shouldNotifySubscriber(subscriber, eventData)) {
          try {
            subscriber.callback(eventData);
            subscriber.lastSeen = Date.now();
          } catch (error) {
            console.error(`Error in subscriber callback for ${subscriber.id}:`, error);
          }
        }
      });
    });
  }

  /**
   * Check if subscriber should be notified
   */
  private shouldNotifySubscriber(subscriber: EventSubscriber, event: RealtimeEvent): boolean {
    if (!subscriber.active) return false;

    // Check channel subscription
    if (!subscriber.channels.includes(event.channel) && 
        !subscriber.channels.some(pattern => new RegExp(pattern).test(event.channel))) {
      return false;
    }

    // Apply filters
    if (subscriber.filters) {
      return subscriber.filters.every(filter => this.applyFilter(filter, event));
    }

    return true;
  }

  /**
   * Apply event filter
   */
  private applyFilter(filter: EventFilter, event: RealtimeEvent): boolean {
    const fieldValue = this.getNestedValue(event, filter.field);
    
    switch (filter.operator) {
      case 'equals':
        return fieldValue === filter.value;
      case 'contains':
        return String(fieldValue).includes(String(filter.value));
      case 'gt':
        return Number(fieldValue) > Number(filter.value);
      case 'lt':
        return Number(fieldValue) < Number(filter.value);
      case 'regex':
        return new RegExp(filter.value).test(String(fieldValue));
      default:
        return true;
    }
  }

  /**
   * Get nested object value by path
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * Handle pong message for latency measurement
   */
  private handlePong(serverTimestamp: number): void {
    const latency = Date.now() - serverTimestamp;
    this.latencyMeasurements.push(latency);
    
    // Keep only recent measurements
    if (this.latencyMeasurements.length > 10) {
      this.latencyMeasurements.shift();
    }
    
    // Update average latency
    this.metrics.averageLatency = this.latencyMeasurements.reduce((a, b) => a + b, 0) / this.latencyMeasurements.length;
  }

  /**
   * Schedule reconnection attempt
   */
  private scheduleReconnect(): void {
    if (this.metrics.reconnectCount >= this.config.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectTimer = setTimeout(() => {
      this.metrics.reconnectCount++;
      console.log(`Attempting to reconnect (${this.metrics.reconnectCount}/${this.config.maxReconnectAttempts})`);
      this.connect();
    }, this.config.reconnectInterval * Math.pow(2, this.metrics.reconnectCount)); // Exponential backoff
  }

  /**
   * Start heartbeat to maintain connection
   */
  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      if (this.websocket?.readyState === WebSocket.OPEN) {
        this.sendMessage({
          type: 'ping',
          timestamp: Date.now()
        });
      }
    }, this.config.heartbeatInterval);
  }

  /**
   * Send message to server
   */
  private sendMessage(message: any): void {
    if (this.websocket?.readyState === WebSocket.OPEN) {
      try {
        this.websocket.send(JSON.stringify(message));
        this.metrics.messagesSent++;
      } catch (error) {
        console.error('Failed to send message:', error);
      }
    } else {
      // Queue message for later
      this.eventQueue.push(message);
      this.metrics.queuedEvents = this.eventQueue.length;
    }
  }

  /**
   * Process queued events
   */
  private processEventQueue(): void {
    while (this.eventQueue.length > 0) {
      const event = this.eventQueue.shift();
      if (event) {
        this.sendMessage(event);
      }
    }
    this.metrics.queuedEvents = 0;
  }

  /**
   * Resubscribe to all channels after reconnection
   */
  private resubscribeChannels(): void {
    this.channels.forEach(channel => {
      this.sendMessage({
        type: 'subscribe',
        channel: channel.name,
        qos: channel.qos
      });
    });
  }

  /**
   * Create event channel
   */
  createChannel(name: string, options: {
    pattern: RegExp;
    qos: EventChannel['qos'];
    persistent: boolean;
    maxHistory: number;
  }): void {
    const channel: EventChannel = {
      name,
      pattern: options.pattern,
      subscribers: new Set(),
      qos: options.qos,
      persistent: options.persistent,
      maxHistory: options.maxHistory,
      history: []
    };

    this.channels.set(name, channel);
    this.metrics.channelCount = this.channels.size;

    // Subscribe to channel if connected
    if (this.websocket?.readyState === WebSocket.OPEN) {
      this.sendMessage({
        type: 'subscribe',
        channel: name,
        qos: channel.qos
      });
    }
  }

  /**
   * Subscribe to events
   */
  subscribe(
    channels: string[],
    callback: (event: RealtimeEvent) => void,
    filters?: EventFilter[]
  ): string {
    const subscriberId = this.generateId();
    
    const subscriber: EventSubscriber = {
      id: subscriberId,
      callback,
      channels,
      filters,
      active: true,
      lastSeen: Date.now()
    };

    this.subscribers.set(subscriberId, subscriber);

    // Add subscriber to matching channels
    channels.forEach(channelName => {
      const channel = this.channels.get(channelName);
      if (channel) {
        channel.subscribers.add(subscriber);
        
        // Send recent history if channel is persistent
        if (channel.persistent && channel.history.length > 0) {
          channel.history.forEach(event => {
            if (this.shouldNotifySubscriber(subscriber, event)) {
              callback(event);
            }
          });
        }
      }
    });

    this.metrics.subscriberCount = this.subscribers.size;
    return subscriberId;
  }

  /**
   * Unsubscribe from events
   */
  unsubscribe(subscriberId: string): void {
    const subscriber = this.subscribers.get(subscriberId);
    if (!subscriber) return;

    // Remove from all channels
    this.channels.forEach(channel => {
      channel.subscribers.delete(subscriber);
    });

    this.subscribers.delete(subscriberId);
    this.metrics.subscriberCount = this.subscribers.size;
  }

  /**
   * Publish event to channel
   */
  publish(channelName: string, data: any, type: EventType = 'custom', priority: RealtimeEvent['priority'] = 'medium'): void {
    const event: RealtimeEvent = {
      id: this.generateId(),
      type,
      source: 'client',
      timestamp: Date.now(),
      data,
      priority,
      channel: channelName,
      userId: this.getCurrentUserId(),
      sessionId: this.getSessionId(),
      version: 1
    };

    // Send to server
    this.sendMessage({
      type: 'publish',
      event
    });
  }

  /**
   * Get current user ID
   */
  private getCurrentUserId(): string | undefined {
    // Get from authentication context or localStorage
    return localStorage.getItem('user_id') || undefined;
  }

  /**
   * Get session ID
   */
  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('session_id');
    if (!sessionId) {
      sessionId = this.generateId();
      sessionStorage.setItem('session_id', sessionId);
    }
    return sessionId;
  }

  /**
   * Update connection configuration
   */
  updateConfig(newConfig: Partial<ConnectionConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Update latency metrics
   */
  private updateLatencyMetrics(latency: number): void {
    this.latencyMeasurements.push(latency);
    if (this.latencyMeasurements.length > 100) {
      this.latencyMeasurements.shift();
    }
    
    this.metrics.averageLatency = this.latencyMeasurements.reduce((a, b) => a + b, 0) / this.latencyMeasurements.length;
  }

  /**
   * Get default metrics
   */
  private getDefaultMetrics(): RealtimeMetrics {
    return {
      connected: false,
      connectionUptime: 0,
      messagesReceived: 0,
      messagesSent: 0,
      reconnectCount: 0,
      averageLatency: 0,
      subscriberCount: 0,
      channelCount: 0,
      queuedEvents: 0
    };
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * Get connection metrics
   */
  getMetrics(): RealtimeMetrics {
    // Update uptime
    if (this.metrics.connected && this.connectionStartTime) {
      this.metrics.connectionUptime = Date.now() - this.connectionStartTime;
    }
    
    return { ...this.metrics };
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.websocket?.readyState === WebSocket.OPEN;
  }

  /**
   * Disconnect WebSocket
   */
  disconnect(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.websocket) {
      this.websocket.close(1000, 'Client disconnect');
      this.websocket = null;
    }

    this.metrics.connected = false;
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.disconnect();
    this.channels.clear();
    this.subscribers.clear();
    this.eventQueue = [];
    this.latencyMeasurements = [];
  }
}

// Singleton instance
export const eventDrivenRealtimeService = new EventDrivenRealtimeService();