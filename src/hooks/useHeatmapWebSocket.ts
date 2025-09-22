// ===== WEBSOCKET HOOK FOR REAL-TIME HEATMAP UPDATES =====
// React hook for managing WebSocket connections and real-time heatmap data

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  RegionBounds,
  HeatmapUpdateEvent,
  HeatmapNotification,
  ConnectionStatus
} from '../types/heatmap';
import { getHeatmapWebSocketService } from '../services/HeatmapWebSocketService';
import { useToast } from '../contexts/toast/toastContext';

// ===== HOOK INTERFACES =====

interface UseWebSocketOptions {
  autoConnect?: boolean;
  reconnectOnError?: boolean;
  enableNotifications?: boolean;
  onUpdate?: (event: HeatmapUpdateEvent) => void;
  onNotification?: (notification: HeatmapNotification) => void;
  onError?: (error: Error) => void;
  onStatusChange?: (status: ConnectionStatus) => void;
}

interface WebSocketHookReturn {
  status: ConnectionStatus;
  isConnected: boolean;
  subscribe: (regionId: string, bounds: RegionBounds, filters?: any) => string;
  unsubscribe: (subscriptionId: string) => void;
  unsubscribeAll: () => void;
  connect: () => Promise<void>;
  disconnect: () => void;
  subscriptions: string[];
  metrics: any;
  error: string | null;
}

// ===== MAIN WEBSOCKET HOOK =====

export const useHeatmapWebSocket = (options: UseWebSocketOptions = {}): WebSocketHookReturn => {
  const {
    autoConnect = true,
    reconnectOnError = true,
    enableNotifications = true,
    onUpdate,
    onNotification,
    onError,
    onStatusChange
  } = options;

  const toast = useToast();
  const wsService = useRef(getHeatmapWebSocketService({
    enableLogging: true // Enable logging to debug connection issues
  }));
  
  // State
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [subscriptions, setSubscriptions] = useState<string[]>([]);
  const [metrics, setMetrics] = useState<any>({});
  const [error, setError] = useState<string | null>(null);

  // Update subscriptions list
  const updateSubscriptions = useCallback(() => {
    setSubscriptions(wsService.current.getSubscriptions());
  }, []);

  // Update metrics
  const updateMetrics = useCallback(() => {
    setMetrics(wsService.current.getConnectionMetrics());
  }, []);

  // Status change handler
  const handleStatusChange = useCallback((newStatus: ConnectionStatus) => {
    setStatus(newStatus);
    updateMetrics();
    
    if (onStatusChange) {
      onStatusChange(newStatus);
    }

    // Show connection status notifications
    if (enableNotifications) {
      switch (newStatus) {
        case 'connected':
          toast.open({
            message: { heading: 'Connected', content: 'Real-time updates enabled' },
            color: 'success',
            duration: 3000
          });
          setError(null);
          break;
        case 'disconnected':
          if (status === 'connected') {
            toast.open({
              message: { heading: 'Disconnected', content: 'Real-time updates disabled' },
              color: 'warning',
              duration: 3000
            });
          }
          break;
        case 'error':
          toast.open({
            message: { heading: 'Connection Error', content: 'Failed to connect to real-time service' },
            color: 'error',
            duration: 5000
          });
          break;
      }
    }
  }, [onStatusChange, enableNotifications, toast, status]);

  // Error handler
  const handleError = useCallback((wsError: Error) => {
    setError(wsError.message);
    
    if (onError) {
      onError(wsError);
    }

    if (enableNotifications) {
      toast.open({
        message: { heading: 'WebSocket Error', content: wsError.message },
        color: 'error',
        duration: 5000
      });
    }

    // Auto-reconnect on error if enabled
    if (reconnectOnError && status === 'connected') {
      setTimeout(() => {
        wsService.current.connect().catch(console.error);
      }, 2000);
    }
  }, [onError, enableNotifications, toast, reconnectOnError, status]);

  // Subscribe function
  const subscribe = useCallback((
    regionId: string, 
    bounds: RegionBounds, 
    filters?: any
  ): string => {
    const subscriptionId = wsService.current.subscribe(
      regionId,
      bounds,
      {
        onUpdate: (event: HeatmapUpdateEvent) => {
          if (onUpdate) {
            onUpdate(event);
          }
        },
        onNotification: (notification: HeatmapNotification) => {
          if (onNotification) {
            onNotification(notification);
          }
          
          // Show notification toast
          if (enableNotifications) {
            toast.open({
              message: { 
                heading: notification.title, 
                content: notification.message 
              },
              color: notification.severity === 'critical' || notification.severity === 'high' 
                ? 'error' 
                : notification.severity === 'medium' 
                  ? 'warning' 
                  : 'info',
              duration: notification.severity === 'critical' ? 10000 : 5000
            });
          }
        },
        onError: handleError,
        onStatusChange: handleStatusChange
      },
      filters
    );

    updateSubscriptions();
    return subscriptionId;
  }, [onUpdate, onNotification, enableNotifications, toast, handleError, handleStatusChange, updateSubscriptions]);

  // Unsubscribe function
  const unsubscribe = useCallback((subscriptionId: string) => {
    wsService.current.unsubscribe(subscriptionId);
    updateSubscriptions();
  }, [updateSubscriptions]);

  // Unsubscribe all function
  const unsubscribeAll = useCallback(() => {
    wsService.current.unsubscribeAll();
    updateSubscriptions();
  }, [updateSubscriptions]);

  // Connect function
  const connect = useCallback(async () => {
    setError(null);
    try {
      await wsService.current.connect();
    } catch (wsError) {
      setError((wsError as Error).message);
      throw wsError;
    }
  }, []);

  // Disconnect function
  const disconnect = useCallback(() => {
    wsService.current.disconnect();
    updateSubscriptions();
  }, [updateSubscriptions]);

  // Setup event listeners and auto-connect
  useEffect(() => {
    const service = wsService.current;
    
    // Setup status listener
    const unsubscribeStatus = service.onStatusChange(handleStatusChange);
    const unsubscribeError = service.onError(handleError);

    // Auto-connect if enabled
    if (autoConnect && service.getStatus() === 'disconnected') {
      connect().catch(console.error);
    }

    // Update initial state
    setStatus(service.getStatus());
    updateSubscriptions();
    updateMetrics();

    // Cleanup function
    return () => {
      unsubscribeStatus();
      unsubscribeError();
    };
  }, [autoConnect, connect, handleStatusChange, handleError, updateSubscriptions, updateMetrics]);

  // Periodic metrics update
  useEffect(() => {
    const interval = setInterval(updateMetrics, 5000);
    return () => clearInterval(interval);
  }, [updateMetrics]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (wsService.current) {
        wsService.current.disconnect();
      }
    };
  }, []);

  return {
    status,
    isConnected: status === 'connected',
    subscribe,
    unsubscribe,
    unsubscribeAll,
    connect,
    disconnect,
    subscriptions,
    metrics,
    error
  };
};

// ===== SPECIALIZED WEBSOCKET HOOKS =====

/**
 * Hook for subscribing to a specific region with automatic cleanup
 */
export const useHeatmapRegionSubscription = (
  regionId: string,
  bounds: RegionBounds,
  filters?: any,
  options: UseWebSocketOptions = {}
) => {
  const [subscriptionId, setSubscriptionId] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<HeatmapUpdateEvent | null>(null);
  const [notifications, setNotifications] = useState<HeatmapNotification[]>([]);

  const wsHook = useHeatmapWebSocket({
    ...options,
    onUpdate: (event) => {
      setLastUpdate(event);
      if (options.onUpdate) {
        options.onUpdate(event);
      }
    },
    onNotification: (notification) => {
      setNotifications(prev => [notification, ...prev.slice(0, 9)]); // Keep last 10
      if (options.onNotification) {
        options.onNotification(notification);
      }
    }
  });

  // Auto-subscribe when connected and region/bounds change
  useEffect(() => {
    if (wsHook.isConnected && regionId && bounds) {
      const subId = wsHook.subscribe(regionId, bounds, filters);
      setSubscriptionId(subId);

      return () => {
        if (subId) {
          wsHook.unsubscribe(subId);
        }
      };
    }
  }, [wsHook.isConnected, regionId, bounds, filters, wsHook]);

  // Clear notifications when region changes
  useEffect(() => {
    setNotifications([]);
  }, [regionId]);

  return {
    ...wsHook,
    subscriptionId,
    lastUpdate,
    notifications,
    clearNotifications: () => setNotifications([])
  };
};

/**
 * Hook for managing multiple region subscriptions
 */
export const useMultipleRegionSubscriptions = (
  regions: Array<{ regionId: string; bounds: RegionBounds; filters?: any }>,
  options: UseWebSocketOptions = {}
) => {
  const [subscriptions, setSubscriptions] = useState<Map<string, string>>(new Map());
  const [updates, setUpdates] = useState<Map<string, HeatmapUpdateEvent>>(new Map());

  const wsHook = useHeatmapWebSocket({
    ...options,
    onUpdate: (event) => {
      setUpdates(prev => new Map(prev.set(event.regionId, event)));
      if (options.onUpdate) {
        options.onUpdate(event);
      }
    }
  });

  // Manage subscriptions when regions change
  useEffect(() => {
    if (!wsHook.isConnected) return;

    const newSubscriptions = new Map<string, string>();

    // Subscribe to new regions
    regions.forEach(({ regionId, bounds, filters }) => {
      const subId = wsHook.subscribe(regionId, bounds, filters);
      newSubscriptions.set(regionId, subId);
    });

    // Unsubscribe from old regions
    subscriptions.forEach((subId, regionId) => {
      if (!newSubscriptions.has(regionId)) {
        wsHook.unsubscribe(subId);
      }
    });

    setSubscriptions(newSubscriptions);

    return () => {
      newSubscriptions.forEach(subId => wsHook.unsubscribe(subId));
    };
  }, [wsHook.isConnected, regions, wsHook]);

  return {
    ...wsHook,
    regionSubscriptions: subscriptions,
    regionUpdates: updates,
    clearUpdates: () => setUpdates(new Map())
  };
};

export default useHeatmapWebSocket;