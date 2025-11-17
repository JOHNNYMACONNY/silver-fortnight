import React from 'react';
import { AppError, ErrorCode, ErrorSeverity } from '../types/errors';
import { errorService } from './errorService';
import { logger } from '@utils/logging/logger';

interface ServiceStatus {
  name: string;
  isAvailable: boolean;
  lastChecked: number;
  responseTime: number;
  errorCount: number;
  fallbackMode: boolean;
}

interface DegradationConfig {
  checkInterval: number;
  maxErrorThreshold: number;
  responseTimeThreshold: number;
  enableFallbacks: boolean;
  enableCaching: boolean;
}

interface FallbackStrategy {
  serviceName: string;
  fallbackComponent?: React.ComponentType<any>;
  fallbackData?: any;
  fallbackFunction?: (...args: any[]) => any;
  cacheKey?: string;
  cacheDuration?: number;
}

class GracefulDegradationService {
  private services: Map<string, ServiceStatus> = new Map();
  private fallbackStrategies: Map<string, FallbackStrategy> = new Map();
  private config: DegradationConfig;
  private cache: Map<string, { data: any; timestamp: number; ttl: number }> = new Map();
  private healthCheckInterval: NodeJS.Timeout | null = null;

  constructor(config: Partial<DegradationConfig> = {}) {
    this.config = {
      checkInterval: 30000, // 30 seconds
      maxErrorThreshold: 3,
      responseTimeThreshold: 5000, // 5 seconds
      enableFallbacks: true,
      enableCaching: true,
      ...config
    };

    this.startHealthChecks();
  }

  public registerService(
    name: string, 
    healthCheckUrl?: string,
    fallbackStrategy?: FallbackStrategy
  ): void {
    this.services.set(name, {
      name,
      isAvailable: true,
      lastChecked: Date.now(),
      responseTime: 0,
      errorCount: 0,
      fallbackMode: false
    });

    if (fallbackStrategy) {
      this.fallbackStrategies.set(name, fallbackStrategy);
    }

    logger.debug(`🔧 Service registered: ${name}`, 'SERVICE');
  }

  public async checkServiceHealth(serviceName: string, healthCheckUrl?: string): Promise<boolean> {
    const service = this.services.get(serviceName);
    if (!service) {
      logger.warn(`Service ${serviceName} not registered`, 'SERVICE');
      return false;
    }

    const startTime = Date.now();

    try {
      if (healthCheckUrl) {
        const response = await fetch(healthCheckUrl, {
          method: 'HEAD',
          timeout: this.config.responseTimeThreshold
        } as RequestInit);

        const responseTime = Date.now() - startTime;
        
        if (response.ok && responseTime < this.config.responseTimeThreshold) {
          this.markServiceHealthy(serviceName, responseTime);
          return true;
        } else {
          this.markServiceUnhealthy(serviceName, responseTime);
          return false;
        }
      } else {
        // If no health check URL, assume service is healthy
        this.markServiceHealthy(serviceName, 0);
        return true;
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.markServiceUnhealthy(serviceName, responseTime);
      
      const message = error instanceof Error ? error.message : String(error);
      await errorService.handleError(
        new AppError(
          `Health check failed for service: ${serviceName}`,
          ErrorCode.SERVICE_UNAVAILABLE,
          ErrorSeverity.MEDIUM,
          { serviceName, error: message }
        )
      );
      
      return false;
    }
  }

  private markServiceHealthy(serviceName: string, responseTime: number): void {
    const service = this.services.get(serviceName);
    if (service) {
      service.isAvailable = true;
      service.lastChecked = Date.now();
      service.responseTime = responseTime;
      service.errorCount = 0;
      
      if (service.fallbackMode) {
        service.fallbackMode = false;
        logger.debug(`✅ Service ${serviceName} recovered from fallback mode`, 'SERVICE');
      }
    }
  }

  private markServiceUnhealthy(serviceName: string, responseTime: number): void {
    const service = this.services.get(serviceName);
    if (service) {
      service.lastChecked = Date.now();
      service.responseTime = responseTime;
      service.errorCount++;
      
      if (service.errorCount >= this.config.maxErrorThreshold) {
        service.isAvailable = false;
        service.fallbackMode = true;
        logger.warn(`⚠️ Service ${serviceName} entered fallback mode`, 'SERVICE');
      }
    }
  }

  public isServiceAvailable(serviceName: string): boolean {
    const service = this.services.get(serviceName);
    return service ? service.isAvailable : false;
  }

  public isServiceInFallbackMode(serviceName: string): boolean {
    const service = this.services.get(serviceName);
    return service ? service.fallbackMode : false;
  }

  public async executeWithFallback<T>(
    serviceName: string,
    primaryOperation: () => Promise<T>,
    fallbackOperation?: () => Promise<T> | T
  ): Promise<T> {
    const service = this.services.get(serviceName);
    
    // If service is known to be unavailable, use fallback immediately
    if (service && !service.isAvailable && this.config.enableFallbacks) {
      logger.debug(`🔄 Using fallback for ${serviceName} (service unavailable)`, 'SERVICE');
      return this.executeFallback(serviceName, fallbackOperation);
    }

    try {
      const result = await primaryOperation();
      
      // Mark service as healthy if operation succeeded
      if (service) {
        this.markServiceHealthy(serviceName, 0);
      }
      
      return result;
    } catch (error) {
      // Mark service as unhealthy
      if (service) {
        this.markServiceUnhealthy(serviceName, 0);
      }

      // Log the error
      const message = error instanceof Error ? error.message : String(error);
      await errorService.handleError(
        new AppError(
          `Primary operation failed for service: ${serviceName}`,
          ErrorCode.SERVICE_UNAVAILABLE,
          ErrorSeverity.MEDIUM,
          { serviceName, error: message }
        )
      );

      // Try fallback if enabled
      if (this.config.enableFallbacks) {
        logger.debug(`🔄 Using fallback for ${serviceName} (primary operation failed)`, 'SERVICE');
        return this.executeFallback(serviceName, fallbackOperation);
      }

      throw error;
    }
  }

  private async executeFallback<T>(
    serviceName: string,
    fallbackOperation?: () => Promise<T> | T
  ): Promise<T> {
    const strategy = this.fallbackStrategies.get(serviceName);
    
    // Try custom fallback operation first
    if (fallbackOperation) {
      try {
        return await fallbackOperation();
      } catch (error) {
        logger.error('Fallback operation failed for ${serviceName}:', 'SERVICE', {}, error as Error);
      }
    }

    // Try registered fallback strategy
    if (strategy) {
      // Check cache first
      if (strategy.cacheKey && this.config.enableCaching) {
        const cached = this.getFromCache(strategy.cacheKey);
        if (cached) {
          logger.debug(`📦 Using cached data for ${serviceName}`, 'SERVICE');
          return cached;
        }
      }

      // Use fallback function
      if (strategy.fallbackFunction) {
        try {
          return strategy.fallbackFunction();
        } catch (error) {
          logger.error('Fallback function failed for ${serviceName}:', 'SERVICE', {}, error as Error);
        }
      }

      // Use fallback data
      if (strategy.fallbackData) {
        return strategy.fallbackData;
      }
    }

    // If all fallbacks fail, throw an error
    throw new AppError(
      `All fallback strategies failed for service: ${serviceName}`,
      ErrorCode.SERVICE_UNAVAILABLE,
      ErrorSeverity.HIGH,
      { serviceName }
    );
  }

  public cacheData(key: string, data: any, ttl: number = 300000): void { // 5 minutes default
    if (this.config.enableCaching) {
      this.cache.set(key, {
        data,
        timestamp: Date.now(),
        ttl
      });
    }
  }

  public getFromCache(key: string): any | null {
    if (!this.config.enableCaching) {
      return null;
    }

    const cached = this.cache.get(key);
    if (!cached) {
      return null;
    }

    const now = Date.now();
    if (now - cached.timestamp > cached.ttl) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  public clearCache(key?: string): void {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }

  private startHealthChecks(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    this.healthCheckInterval = setInterval(() => {
      this.runHealthChecks();
    }, this.config.checkInterval);
  }

  private async runHealthChecks(): Promise<void> {
    const promises = Array.from(this.services.keys()).map(serviceName => 
      this.checkServiceHealth(serviceName)
    );

    await Promise.allSettled(promises);
  }

  public getServiceStatus(serviceName?: string): ServiceStatus | ServiceStatus[] {
    if (serviceName) {
      const service = this.services.get(serviceName);
      return service ? { ...service } : ({} as any);
    }

    return Array.from(this.services.values()).map(service => ({ ...service }));
  }

  public getSystemHealth(): {
    totalServices: number;
    availableServices: number;
    degradedServices: number;
    unavailableServices: number;
    overallHealth: 'healthy' | 'degraded' | 'critical';
  } {
    const services = Array.from(this.services.values());
    const totalServices = services.length;
    const availableServices = services.filter(s => s.isAvailable).length;
    const degradedServices = services.filter(s => s.fallbackMode).length;
    const unavailableServices = totalServices - availableServices;

    let overallHealth: 'healthy' | 'degraded' | 'critical';
    
    if (unavailableServices === 0) {
      overallHealth = 'healthy';
    } else if (unavailableServices < totalServices / 2) {
      overallHealth = 'degraded';
    } else {
      overallHealth = 'critical';
    }

    return {
      totalServices,
      availableServices,
      degradedServices,
      unavailableServices,
      overallHealth
    };
  }

  public updateConfig(newConfig: Partial<DegradationConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Restart health checks if interval changed
    if (newConfig.checkInterval) {
      this.startHealthChecks();
    }
  }

  public destroy(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
    
    this.services.clear();
    this.fallbackStrategies.clear();
    this.cache.clear();
  }
}

// Create singleton instance
export const gracefulDegradation = new GracefulDegradationService();

// React hook for service status monitoring
export const useServiceStatus = (serviceName?: string) => {
  const [status, setStatus] = React.useState(() => 
    gracefulDegradation.getServiceStatus(serviceName)
  );
  const [systemHealth, setSystemHealth] = React.useState(() => 
    gracefulDegradation.getSystemHealth()
  );

  React.useEffect(() => {
    const updateStatus = () => {
      setStatus(gracefulDegradation.getServiceStatus(serviceName));
      setSystemHealth(gracefulDegradation.getSystemHealth());
    };

    const interval = setInterval(updateStatus, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [serviceName]);

  return {
    status,
    systemHealth,
    isAvailable: (service: string) => gracefulDegradation.isServiceAvailable(service),
    isInFallbackMode: (service: string) => gracefulDegradation.isServiceInFallbackMode(service),
    executeWithFallback: gracefulDegradation.executeWithFallback.bind(gracefulDegradation)
  };
};

// Utility functions for common patterns
export const withFallback = <T>(
  serviceName: string,
  primaryOperation: () => Promise<T>,
  fallbackOperation?: () => Promise<T> | T
) => gracefulDegradation.executeWithFallback(serviceName, primaryOperation, fallbackOperation);

export const registerServiceWithFallback = (
  name: string,
  healthCheckUrl?: string,
  fallbackStrategy?: FallbackStrategy
) => gracefulDegradation.registerService(name, healthCheckUrl, fallbackStrategy);
