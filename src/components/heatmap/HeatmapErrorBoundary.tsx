// ===== HEATMAP ERROR BOUNDARY COMPONENT =====
// Production-level error handling with fallback UI

import React, { Component, ReactNode } from 'react';
import { motion } from 'framer-motion';
import {
  MdError,
  MdRefresh,
  MdBugReport,
  MdInfo,
  MdHome,
  MdSettings,
  MdHelp
} from 'react-icons/md';

// ===== INTERFACES =====

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  errorId: string;
  retryCount: number;
  isDemoMode: boolean;
}

interface HeatmapErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  enableRetry?: boolean;
  maxRetries?: number;
  enableDemoMode?: boolean;
  className?: string;
}

// ===== MOCK DATA FOR DEMO MODE =====

const DEMO_HEATMAP_DATA = {
  dataPoints: [
    {
      id: 'demo-1',
      coordinates: { latitude: 28.6139, longitude: 77.2090 },
      value: 0.8,
      timestamp: new Date().toISOString(),
      metadata: {
        category: 'traffic',
        urgency: 'high',
        title: 'Heavy Traffic Congestion',
        description: 'Major traffic jam reported on main road',
        status: 'open'
      }
    },
    {
      id: 'demo-2',
      coordinates: { latitude: 28.6150, longitude: 77.2100 },
      value: 0.6,
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      metadata: {
        category: 'electricity',
        urgency: 'medium',
        title: 'Street Light Not Working',
        description: 'Street light has been out for 2 days',
        status: 'in_progress'
      }
    },
    {
      id: 'demo-3',
      coordinates: { latitude: 28.6160, longitude: 77.2110 },
      value: 0.9,
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      metadata: {
        category: 'water',
        urgency: 'critical',
        title: 'Water Pipe Burst',
        description: 'Major water leak causing flooding',
        status: 'open'
      }
    }
  ],
  clusters: [
    {
      id: 'demo-cluster-1',
      center: { latitude: 28.6145, longitude: 77.2095 },
      pointCount: 5,
      averageIntensity: 0.7,
      radius: 200,
      metadata: {
        categories: ['traffic', 'electricity', 'water']
      }
    }
  ],
  anomalies: []
};

// ===== UTILITY FUNCTIONS =====

const generateErrorId = () => {
  return `ERR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

const getErrorCategory = (error: Error): 'network' | 'render' | 'data' | 'permission' | 'unknown' => {
  const message = error.message.toLowerCase();
  
  if (message.includes('network') || message.includes('fetch') || message.includes('cors')) {
    return 'network';
  }
  if (message.includes('render') || message.includes('canvas') || message.includes('webgl')) {
    return 'render';
  }
  if (message.includes('data') || message.includes('parse') || message.includes('json')) {
    return 'data';
  }
  if (message.includes('permission') || message.includes('geolocation') || message.includes('access')) {
    return 'permission';
  }
  
  return 'unknown';
};

const getErrorSolutions = (category: string): string[] => {
  switch (category) {
    case 'network':
      return [
        'Check your internet connection',
        'Verify the backend service is running',
        'Check for CORS issues',
        'Try refreshing the page'
      ];
    case 'render':
      return [
        'Update your browser to the latest version',
        'Enable hardware acceleration',
        'Clear browser cache and cookies',
        'Try a different browser'
      ];
    case 'data':
      return [
        'Verify data format and structure',
        'Check API endpoint responses',
        'Clear local storage and cache',
        'Contact system administrator'
      ];
    case 'permission':
      return [
        'Grant required permissions in browser',
        'Check location services settings',
        'Verify user authentication',
        'Contact support for access'
      ];
    default:
      return [
        'Try refreshing the page',
        'Clear browser cache',
        'Check browser console for details',
        'Contact technical support'
      ];
  }
};

// ===== MAIN COMPONENT =====

export class HeatmapErrorBoundary extends Component<HeatmapErrorBoundaryProps, ErrorBoundaryState> {
  
  constructor(props: HeatmapErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
      retryCount: 0,
      isDemoMode: false
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
      errorId: generateErrorId()
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Heatmap Error Boundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // Call onError callback if provided
    this.props.onError?.(error, errorInfo);

    // Log to error reporting service (in production)
    if (process.env.NODE_ENV === 'production') {
      // Example: Sentry.captureException(error, { extra: errorInfo });
    }
  }

  handleRetry = () => {
    const { maxRetries = 3 } = this.props;
    
    if (this.state.retryCount < maxRetries) {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: prevState.retryCount + 1,
        isDemoMode: false
      }));
    }
  };

  handleDemoMode = () => {
    this.setState({
      isDemoMode: true,
      hasError: false
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    const { children, fallback, enableRetry = true, maxRetries = 3, enableDemoMode = true, className = '' } = this.props;
    const { hasError, error, errorInfo, errorId, retryCount, isDemoMode } = this.state;

    // If in demo mode, render children with mock context
    if (isDemoMode) {
      return (
        <div className={`heatmap-demo-mode ${className}`}>
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50">
            <motion.div
              className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 rounded-r-lg shadow-lg"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="flex items-center">
                <MdInfo className="w-5 h-5 mr-2" />
                <div>
                  <div className="font-semibold">Demo Mode Active</div>
                  <div className="text-sm">Using sample data - backend unavailable</div>
                </div>
              </div>
            </motion.div>
          </div>
          {children}
        </div>
      );
    }

    if (hasError) {
      // Use custom fallback if provided
      if (fallback) {
        return <>{fallback}</>;
      }

      const errorCategory = error ? getErrorCategory(error) : 'unknown';
      const solutions = getErrorSolutions(errorCategory);
      const canRetry = enableRetry && retryCount < maxRetries;

      return (
        <div className={`heatmap-error-boundary min-h-screen bg-gray-50 flex items-center justify-center p-4 ${className}`}>
          <motion.div
            className="max-w-2xl w-full bg-white rounded-lg shadow-xl overflow-hidden"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            
            {/* Header */}
            <div className="bg-red-50 border-b border-red-200 p-6">
              <div className="flex items-center">
                <div className="p-3 bg-red-100 rounded-full">
                  <MdError className="w-8 h-8 text-red-600" />
                </div>
                <div className="ml-4">
                  <h1 className="text-2xl font-bold text-red-900">Oops! Something went wrong</h1>
                  <p className="text-red-700 mt-1">
                    The heatmap visualization encountered an unexpected error
                  </p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              
              {/* Error Summary */}
              <div className="mb-6">
                <div className="flex items-center space-x-2 mb-3">
                  <MdBugReport className="w-5 h-5 text-gray-600" />
                  <h2 className="text-lg font-semibold text-gray-900">Error Details</h2>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-gray-700">Error ID:</span>
                    <code className="text-gray-600 bg-white px-2 py-1 rounded">{errorId}</code>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-gray-700">Category:</span>
                    <span className="text-gray-600 capitalize">{errorCategory}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-gray-700">Retry Count:</span>
                    <span className="text-gray-600">{retryCount} / {maxRetries}</span>
                  </div>
                  {error && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <span className="font-medium text-gray-700 text-sm">Message:</span>
                      <div className="text-sm text-gray-600 mt-1 font-mono bg-white p-2 rounded">
                        {error.message}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Solutions */}
              <div className="mb-6">
                <div className="flex items-center space-x-2 mb-3">
                  <MdHelp className="w-5 h-5 text-gray-600" />
                  <h2 className="text-lg font-semibold text-gray-900">Suggested Solutions</h2>
                </div>
                <ul className="space-y-2">
                  {solutions.map((solution, index) => (
                    <motion.li
                      key={index}
                      className="flex items-start space-x-3 text-sm text-gray-700"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                      <span>{solution}</span>
                    </motion.li>
                  ))}
                </ul>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
                
                {/* Retry Button */}
                {canRetry && (
                  <motion.button
                    onClick={this.handleRetry}
                    className="flex items-center justify-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <MdRefresh className="w-4 h-4" />
                    <span>Try Again ({maxRetries - retryCount} left)</span>
                  </motion.button>
                )}

                {/* Demo Mode Button */}
                {enableDemoMode && (
                  <motion.button
                    onClick={this.handleDemoMode}
                    className="flex items-center justify-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <MdSettings className="w-4 h-4" />
                    <span>Continue in Demo Mode</span>
                  </motion.button>
                )}

                {/* Reload Button */}
                <motion.button
                  onClick={this.handleReload}
                  className="flex items-center justify-center space-x-2 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <MdRefresh className="w-4 h-4" />
                  <span>Reload Page</span>
                </motion.button>

                {/* Home Button */}
                <motion.button
                  onClick={this.handleGoHome}
                  className="flex items-center justify-center space-x-2 px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors font-medium"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <MdHome className="w-4 h-4" />
                  <span>Go Home</span>
                </motion.button>
              </div>

              {/* Technical Details (Development Mode) */}
              {process.env.NODE_ENV === 'development' && error && errorInfo && (
                <motion.div
                  className="mt-6 pt-6 border-t border-gray-200"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  transition={{ delay: 0.5, duration: 0.3 }}
                >
                  <details className="space-y-3">
                    <summary className="cursor-pointer font-medium text-gray-700 hover:text-gray-900 transition-colors">
                      Technical Details (Development)
                    </summary>
                    
                    <div className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-auto text-sm font-mono">
                      <div className="mb-4">
                        <div className="text-yellow-400 font-bold">Error Stack:</div>
                        <pre className="whitespace-pre-wrap mt-2">{error.stack}</pre>
                      </div>
                      
                      <div>
                        <div className="text-yellow-400 font-bold">Component Stack:</div>
                        <pre className="whitespace-pre-wrap mt-2">{errorInfo.componentStack}</pre>
                      </div>
                    </div>
                  </details>
                </motion.div>
              )}

            </div>
          </motion.div>
        </div>
      );
    }

    return children;
  }
}

export default HeatmapErrorBoundary;