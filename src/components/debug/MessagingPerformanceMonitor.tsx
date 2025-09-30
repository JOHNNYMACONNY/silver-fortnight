/**
 * Performance monitoring dashboard for messaging system
 * Displays real-time metrics for listeners, rate limits, and memory usage
 */

import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardContent, CardTitle } from "../ui/Card";
import { Button } from "../ui/Button";
import { getGlobalListenerMetrics } from "../../hooks/useListenerPerformance";
import { emergencyCleanupListeners } from "../../hooks/useListenerPerformance";

interface PerformanceMetrics {
  listeners: {
    active: number;
    total: number;
    memoryUsage: number;
    averageResponseTime: number;
    errorCount: number;
  };
  rateLimits: {
    sendRemaining: number;
    readRemaining: number;
    sendBlocked: boolean;
    readBlocked: boolean;
  };
  system: {
    memoryUsage: number;
    timestamp: number;
  };
}

export const MessagingPerformanceMonitor: React.FC = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    listeners: {
      active: 0,
      total: 0,
      memoryUsage: 0,
      averageResponseTime: 0,
      errorCount: 0,
    },
    rateLimits: {
      sendRemaining: 10,
      readRemaining: 30,
      sendBlocked: false,
      readBlocked: false,
    },
    system: {
      memoryUsage: 0,
      timestamp: Date.now(),
    },
  });

  const [isVisible, setIsVisible] = useState(false);

  // Update metrics every 2 seconds
  useEffect(() => {
    const updateMetrics = () => {
      const listenerMetrics = getGlobalListenerMetrics();

      setMetrics((prev) => ({
        ...prev,
        listeners: {
          active: listenerMetrics.activeListeners,
          total: listenerMetrics.totalListeners,
          memoryUsage: listenerMetrics.memoryUsage,
          averageResponseTime: listenerMetrics.averageResponseTime,
          errorCount: listenerMetrics.errorCount,
        },
        system: {
          memoryUsage: listenerMetrics.memoryUsage,
          timestamp: Date.now(),
        },
      }));
    };

    updateMetrics();
    const interval = setInterval(updateMetrics, 2000);

    return () => clearInterval(interval);
  }, []);

  // Emergency cleanup function
  const handleEmergencyCleanup = () => {
    emergencyCleanupListeners();
    if (
      window.confirm(
        "Emergency cleanup performed. Refresh the page to restart messaging?"
      )
    ) {
      window.location.reload();
    }
  };

  // Only show in development mode
  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Button
        onClick={() => setIsVisible(!isVisible)}
        variant="outline"
        size="sm"
        className="mb-2"
      >
        {isVisible ? "Hide" : "Show"} Performance
      </Button>

      {isVisible && (
        <Card className="w-80 max-h-96 overflow-y-auto">
          <CardHeader>
            <CardTitle className="text-sm">Messaging Performance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Listener Metrics */}
            <div>
              <h4 className="text-xs font-semibold mb-2">
                Real-time Listeners
              </h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-muted-foreground">Active:</span>
                  <span
                    className={`ml-1 ${
                      metrics.listeners.active > 5
                        ? "text-orange-500"
                        : "text-green-500"
                    }`}
                  >
                    {metrics.listeners.active}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Errors:</span>
                  <span
                    className={`ml-1 ${
                      metrics.listeners.errorCount > 0
                        ? "text-red-500"
                        : "text-green-500"
                    }`}
                  >
                    {metrics.listeners.errorCount}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Avg Response:</span>
                  <span
                    className={`ml-1 ${
                      metrics.listeners.averageResponseTime > 1000
                        ? "text-orange-500"
                        : "text-green-500"
                    }`}
                  >
                    {metrics.listeners.averageResponseTime}ms
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Memory:</span>
                  <span
                    className={`ml-1 ${
                      metrics.listeners.memoryUsage > 100
                        ? "text-red-500"
                        : "text-green-500"
                    }`}
                  >
                    {metrics.listeners.memoryUsage}MB
                  </span>
                </div>
              </div>
            </div>

            {/* Rate Limit Status */}
            <div>
              <h4 className="text-xs font-semibold mb-2">Rate Limits</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-muted-foreground">Send:</span>
                  <span
                    className={`ml-1 ${
                      metrics.rateLimits.sendBlocked
                        ? "text-red-500"
                        : "text-green-500"
                    }`}
                  >
                    {metrics.rateLimits.sendBlocked
                      ? "BLOCKED"
                      : `${metrics.rateLimits.sendRemaining}/10`}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Read:</span>
                  <span
                    className={`ml-1 ${
                      metrics.rateLimits.readBlocked
                        ? "text-red-500"
                        : "text-green-500"
                    }`}
                  >
                    {metrics.rateLimits.readBlocked
                      ? "BLOCKED"
                      : `${metrics.rateLimits.readRemaining}/30`}
                  </span>
                </div>
              </div>
            </div>

            {/* System Metrics */}
            <div>
              <h4 className="text-xs font-semibold mb-2">System</h4>
              <div className="text-xs">
                <div>
                  <span className="text-muted-foreground">Total Memory:</span>
                  <span
                    className={`ml-1 ${
                      metrics.system.memoryUsage > 200
                        ? "text-red-500"
                        : "text-green-500"
                    }`}
                  >
                    {metrics.system.memoryUsage}MB
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Last Update:</span>
                  <span className="ml-1">
                    {new Date(metrics.system.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Emergency Controls */}
            <div className="pt-2 border-t">
              <h4 className="text-xs font-semibold mb-2 text-red-600">
                Emergency Controls
              </h4>
              <Button
                onClick={handleEmergencyCleanup}
                variant="destructive"
                size="sm"
                className="w-full text-xs"
              >
                Emergency Cleanup
              </Button>
              <p className="text-xs text-muted-foreground mt-1">
                Use only if messaging becomes unresponsive
              </p>
            </div>

            {/* Performance Tips */}
            <div className="pt-2 border-t">
              <h4 className="text-xs font-semibold mb-2">Performance Tips</h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Keep active listeners &lt; 5</li>
                <li>• Memory usage &lt; 100MB</li>
                <li>• Response time &lt; 1000ms</li>
                <li>• Zero errors is ideal</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Hook to integrate performance monitoring into components
export const useMessagingPerformanceMonitoring = () => {
  const [isMonitoring, setIsMonitoring] = useState(false);

  const startMonitoring = () => setIsMonitoring(true);
  const stopMonitoring = () => setIsMonitoring(false);

  return {
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    PerformanceMonitor: MessagingPerformanceMonitor,
  };
};
