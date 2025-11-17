import React from 'react';
import { AppError, ErrorCode, ErrorSeverity } from '../types/errors';
import { errorService } from './errorService';
import { logger } from '@utils/logging/logger';

interface NetworkConfig {
  maxRetries: number;
  retryDelay: number;
  timeout: number;
  enableOfflineMode: boolean;
  enableBackgroundSync: boolean;
}

interface QueuedRequest {
  id: string;
  url: string;
  options: RequestInit;
  timestamp: number;
  retryCount: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

interface NetworkMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  offlineTime: number;
  queuedRequests: number;
}

class NetworkResilienceService {
  private config: NetworkConfig;
  private isOnline: boolean = navigator.onLine;
  private requestQueue: QueuedRequest[] = [];
  private metrics: NetworkMetrics;
  private offlineStartTime: number | null = null;
  private retryTimeouts: Map<string, NodeJS.Timeout> = new Map();

  constructor(config: Partial<NetworkConfig> = {}) {
    this.config = {
      maxRetries: 3,
      retryDelay: 1000,
      timeout: 10000,
      enableOfflineMode: true,
      enableBackgroundSync: true,
      ...config
    };

    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      offlineTime: 0,
      queuedRequests: 0
    };

    this.setupNetworkListeners();
    this.setupServiceWorkerSync();
  }

  private setupNetworkListeners(): void {
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));
    
    // Monitor connection quality
    if ('connection' in navigator) {
      (navigator as any).connection.addEventListener('change', this.handleConnectionChange.bind(this));
    }
  }

  private setupServiceWorkerSync(): void {
    if ('serviceWorker' in navigator && this.config.enableBackgroundSync) {
      navigator.serviceWorker.ready.then(registration => {
        if ('sync' in registration) {
          // Register for background sync
          (registration as any).sync.register('network-resilience-sync');
        }
      });
    }
  }

  private handleOnline(): void {
    logger.debug('🌐 Network: Back online', 'SERVICE');
    this.isOnline = true;
    
    if (this.offlineStartTime) {
      this.metrics.offlineTime += Date.now() - this.offlineStartTime;
      this.offlineStartTime = null;
    }

    // Process queued requests
    this.processRequestQueue();
  }

  private handleOffline(): void {
    logger.debug('🌐 Network: Gone offline', 'SERVICE');
    this.isOnline = false;
    this.offlineStartTime = Date.now();
  }

  private handleConnectionChange(): void {
    const connection = (navigator as any).connection;
    if (connection) {
      logger.debug(`🌐 Network: Connection changed - ${connection.effectiveType}, ${connection.downlink}Mbps`, 'SERVICE');
      
      // Adjust retry strategy based on connection quality
      if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
        this.config.retryDelay = 3000;
        this.config.timeout = 20000;
      } else if (connection.effectiveType === '3g') {
        this.config.retryDelay = 2000;
        this.config.timeout = 15000;
      } else {
        this.config.retryDelay = 1000;
        this.config.timeout = 10000;
      }
    }
  }

  public async resilientFetch(
    url: string, 
    options: RequestInit = {},
    priority: QueuedRequest['priority'] = 'medium'
  ): Promise<Response> {
    const startTime = Date.now();
    this.metrics.totalRequests++;

    // If offline and offline mode is enabled, queue the request
    if (!this.isOnline && this.config.enableOfflineMode) {
      return this.queueRequest(url, options, priority);
    }

    try {
      const response = await this.executeRequest(url, options);
      
      // Update metrics
      const responseTime = Date.now() - startTime;
      this.updateResponseTimeMetrics(responseTime);
      this.metrics.successfulRequests++;
      
      return response;
    } catch (error) {
      this.metrics.failedRequests++;
      
      // If it's a network error and we have retries left, queue for retry
      if (this.isNetworkError(error) && this.config.enableOfflineMode) {
        return this.queueRequest(url, options, priority);
      }
      
      throw error;
    }
  }

  private async executeRequest(url: string, options: RequestInit): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new AppError(
          `HTTP ${response.status}: ${response.statusText}`,
          this.getErrorCodeFromStatus(response.status),
          this.getSeverityFromStatus(response.status),
          { url, status: response.status }
        );
      }

      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new AppError(
          'Request timeout',
          ErrorCode.TIMEOUT_ERROR,
          ErrorSeverity.MEDIUM,
          { url, timeout: this.config.timeout }
        );
      }
      
      throw error;
    }
  }

  private async queueRequest(
    url: string, 
    options: RequestInit, 
    priority: QueuedRequest['priority']
  ): Promise<Response> {
    const requestId = this.generateRequestId();
    
    const queuedRequest: QueuedRequest = {
      id: requestId,
      url,
      options,
      timestamp: Date.now(),
      retryCount: 0,
      priority
    };

    this.requestQueue.push(queuedRequest);
    this.metrics.queuedRequests++;
    
    // Sort queue by priority
    this.requestQueue.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });

    // Return a promise that resolves when the request is processed
    return new Promise((resolve, reject) => {
      const checkQueue = () => {
        const request = this.requestQueue.find(req => req.id === requestId);
        if (!request) {
          // Request was processed
          resolve(new Response('Request queued and will be processed when online', { status: 202 }));
        } else {
          setTimeout(checkQueue, 1000);
        }
      };
      
      setTimeout(checkQueue, 100);
    });
  }

  private async processRequestQueue(): Promise<void> {
    if (!this.isOnline || this.requestQueue.length === 0) {
      return;
    }

    logger.debug(`🌐 Network: Processing ${this.requestQueue.length} queued requests`, 'SERVICE');

    const requests = [...this.requestQueue];
    this.requestQueue = [];

    for (const request of requests) {
      try {
        await this.retryRequest(request);
        this.metrics.queuedRequests--;
      } catch (error) {
        logger.error('Failed to process queued request:', 'SERVICE', {}, error as Error);
        
        // Re-queue if retries remaining
        if (request.retryCount < this.config.maxRetries) {
          request.retryCount++;
          this.requestQueue.push(request);
        } else {
          this.metrics.queuedRequests--;
          await errorService.handleError(
            new AppError(
              `Failed to process queued request after ${this.config.maxRetries} retries`,
              ErrorCode.NETWORK_ERROR,
              ErrorSeverity.HIGH,
              { url: request.url, retryCount: request.retryCount }
            )
          );
        }
      }
    }
  }

  private async retryRequest(request: QueuedRequest): Promise<Response> {
    const delay = this.config.retryDelay * Math.pow(2, request.retryCount); // Exponential backoff
    
    if (request.retryCount > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    return this.executeRequest(request.url, request.options);
  }

  private isNetworkError(error: any): boolean {
    return (
      error instanceof TypeError ||
      error.message.includes('Failed to fetch') ||
      error.message.includes('Network request failed') ||
      error.message.includes('ERR_NETWORK') ||
      error.message.includes('ERR_INTERNET_DISCONNECTED')
    );
  }

  private getErrorCodeFromStatus(status: number): ErrorCode {
    if (status >= 500) return ErrorCode.SERVER_ERROR;
    if (status === 404) return ErrorCode.NETWORK_ERROR;
    if (status === 401) return ErrorCode.UNAUTHORIZED;
    if (status === 403) return ErrorCode.FORBIDDEN;
    if (status === 408) return ErrorCode.TIMEOUT_ERROR;
    if (status === 503) return ErrorCode.SERVICE_UNAVAILABLE;
    return ErrorCode.NETWORK_ERROR;
  }

  private getSeverityFromStatus(status: number): ErrorSeverity {
    if (status >= 500) return ErrorSeverity.HIGH;
    if (status === 401 || status === 403) return ErrorSeverity.MEDIUM;
    if (status === 404) return ErrorSeverity.LOW;
    return ErrorSeverity.MEDIUM;
  }

  private updateResponseTimeMetrics(responseTime: number): void {
    const totalTime = this.metrics.averageResponseTime * (this.metrics.successfulRequests - 1);
    this.metrics.averageResponseTime = (totalTime + responseTime) / this.metrics.successfulRequests;
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  public getMetrics(): NetworkMetrics {
    return { ...this.metrics };
  }

  public getQueueStatus(): { count: number; requests: QueuedRequest[] } {
    return {
      count: this.requestQueue.length,
      requests: [...this.requestQueue]
    };
  }

  public clearQueue(): void {
    this.requestQueue = [];
    this.metrics.queuedRequests = 0;
  }

  public isNetworkOnline(): boolean {
    return this.isOnline;
  }

  public async testConnectivity(): Promise<boolean> {
    try {
      const response = await fetch('https://www.google.com/favicon.ico', {
        method: 'HEAD',
        mode: 'no-cors',
        cache: 'no-cache'
      });
      return true;
    } catch {
      return false;
    }
  }

  public enableOfflineMode(): void {
    this.config.enableOfflineMode = true;
  }

  public disableOfflineMode(): void {
    this.config.enableOfflineMode = false;
    this.clearQueue();
  }

  public updateConfig(newConfig: Partial<NetworkConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

// Create singleton instance
export const networkResilience = new NetworkResilienceService();

// Utility functions for common network operations
export const resilientGet = (url: string, priority?: QueuedRequest['priority']) => 
  networkResilience.resilientFetch(url, { method: 'GET' }, priority);

export const resilientPost = (url: string, data: any, priority?: QueuedRequest['priority']) =>
  networkResilience.resilientFetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }, priority);

export const resilientPut = (url: string, data: any, priority?: QueuedRequest['priority']) =>
  networkResilience.resilientFetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }, priority);

export const resilientDelete = (url: string, priority?: QueuedRequest['priority']) =>
  networkResilience.resilientFetch(url, { method: 'DELETE' }, priority);

// React hook for network status
export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = React.useState(networkResilience.isNetworkOnline());
  const [metrics, setMetrics] = React.useState(networkResilience.getMetrics());

  React.useEffect(() => {
    const updateStatus = () => {
      setIsOnline(networkResilience.isNetworkOnline());
      setMetrics(networkResilience.getMetrics());
    };

    const interval = setInterval(updateStatus, 1000);
    
    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', updateStatus);
      window.removeEventListener('offline', updateStatus);
    };
  }, []);

  return {
    isOnline,
    metrics,
    queueStatus: networkResilience.getQueueStatus(),
    testConnectivity: networkResilience.testConnectivity.bind(networkResilience),
    clearQueue: networkResilience.clearQueue.bind(networkResilience)
  };
};
