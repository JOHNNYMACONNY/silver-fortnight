import { UserService, userService } from '../entities/UserService';
import { TradeService, tradeService } from '../entities/TradeService';
import { CollaborationService, collaborationService } from '../entities/CollaborationService';
import { errorService } from '../errorService';
import { networkResilience } from '../networkResilience';
import { gracefulDegradation } from '../gracefulDegradation';
import { analyticsService } from '../analytics/AnalyticsService';

/**
 * Service Registry - Central registry for all application services
 * Provides dependency injection and service lifecycle management
 */
export class ServiceRegistry {
  private static instance: ServiceRegistry;
  private services: Map<string, any> = new Map();
  private initialized: boolean = false;

  private constructor() {
    this.registerCoreServices();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): ServiceRegistry {
    if (!ServiceRegistry.instance) {
      ServiceRegistry.instance = new ServiceRegistry();
    }
    return ServiceRegistry.instance;
  }

  /**
   * Register core services
   */
  private registerCoreServices(): void {
    // Entity services
    this.services.set('userService', userService);
    this.services.set('tradeService', tradeService);
    this.services.set('collaborationService', collaborationService);

    // Infrastructure services
    this.services.set('errorService', errorService);
    this.services.set('networkResilience', networkResilience);
    this.services.set('gracefulDegradation', gracefulDegradation);
    this.services.set('analyticsService', analyticsService);
  }

  /**
   * Register a service
   */
  public register<T>(name: string, service: T): void {
    this.services.set(name, service);
  }

  /**
   * Get a service by name
   */
  public get<T>(name: string): T {
    const service = this.services.get(name);
    if (!service) {
      throw new Error(`Service '${name}' not found in registry`);
    }
    return service as T;
  }

  /**
   * Check if a service is registered
   */
  public has(name: string): boolean {
    return this.services.has(name);
  }

  /**
   * Get all registered service names
   */
  public getServiceNames(): string[] {
    return Array.from(this.services.keys());
  }

  /**
   * Initialize all services
   */
  public async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      // Initialize services that need async setup
      const initPromises: Promise<void>[] = [];

      // Add any service initialization logic here
      for (const [name, service] of this.services) {
        if (service && typeof service.initialize === 'function') {
          initPromises.push(service.initialize());
        }
      }

      await Promise.all(initPromises);
      this.initialized = true;
      
      console.log('Service registry initialized successfully');
    } catch (error) {
      console.error('Failed to initialize service registry:', error);
      throw error;
    }
  }

  /**
   * Shutdown all services
   */
  public async shutdown(): Promise<void> {
    try {
      const shutdownPromises: Promise<void>[] = [];

      for (const [name, service] of this.services) {
        if (service && typeof service.shutdown === 'function') {
          shutdownPromises.push(service.shutdown());
        }
      }

      await Promise.all(shutdownPromises);
      this.initialized = false;
      
      console.log('Service registry shutdown successfully');
    } catch (error) {
      console.error('Failed to shutdown service registry:', error);
      throw error;
    }
  }

  /**
   * Get service health status
   */
  public getHealthStatus(): { [serviceName: string]: 'healthy' | 'degraded' | 'unhealthy' } {
    const healthStatus: { [serviceName: string]: 'healthy' | 'degraded' | 'unhealthy' } = {};

    for (const [name, service] of this.services) {
      if (service && typeof service.getHealthStatus === 'function') {
        healthStatus[name] = service.getHealthStatus();
      } else {
        healthStatus[name] = 'healthy'; // Assume healthy if no health check method
      }
    }

    return healthStatus;
  }

  /**
   * Get service metrics
   */
  public getMetrics(): { [serviceName: string]: any } {
    const metrics: { [serviceName: string]: any } = {};

    for (const [name, service] of this.services) {
      if (service && typeof service.getMetrics === 'function') {
        metrics[name] = service.getMetrics();
      }
    }

    return metrics;
  }
}

// Service accessor functions for easy access
export const getService = <T>(name: string): T => {
  return ServiceRegistry.getInstance().get<T>(name);
};

export const getUserService = (): UserService => {
  return getService<UserService>('userService');
};

export const getTradeService = (): TradeService => {
  return getService<TradeService>('tradeService');
};

export const getCollaborationService = (): CollaborationService => {
  return getService<CollaborationService>('collaborationService');
};

// Initialize service registry
export const initializeServices = async (): Promise<void> => {
  await ServiceRegistry.getInstance().initialize();
};

// Shutdown service registry
export const shutdownServices = async (): Promise<void> => {
  await ServiceRegistry.getInstance().shutdown();
};

// Export singleton instance
export const serviceRegistry = ServiceRegistry.getInstance();

// Service health monitoring
export const getServiceHealth = () => {
  return serviceRegistry.getHealthStatus();
};

export const getServiceMetrics = () => {
  return serviceRegistry.getMetrics();
};

/**
 * Service decorator for dependency injection
 */
export function Injectable(serviceName: string) {
  return function <T extends { new (...args: any[]): {} }>(constructor: T) {
    return class extends constructor {
      constructor(...args: any[]) {
        super(...args);
        serviceRegistry.register(serviceName, this);
      }
    };
  };
}

/**
 * Inject service decorator for automatic dependency injection
 */
export function InjectService(serviceName: string) {
  return function (target: any, propertyKey: string) {
    Object.defineProperty(target, propertyKey, {
      get: () => getService(serviceName),
      enumerable: true,
      configurable: true
    });
  };
}

/**
 * Service lifecycle hooks
 */
export interface ServiceLifecycle {
  initialize?(): Promise<void>;
  shutdown?(): Promise<void>;
  getHealthStatus?(): 'healthy' | 'degraded' | 'unhealthy';
  getMetrics?(): any;
}

/**
 * Service configuration interface
 */
export interface ServiceConfig {
  name: string;
  dependencies?: string[];
  singleton?: boolean;
  lazy?: boolean;
}

/**
 * Advanced service registration with configuration
 */
export const registerService = <T>(config: ServiceConfig, serviceFactory: () => T): void => {
  const registry = ServiceRegistry.getInstance();
  
  if (config.lazy) {
    // Lazy loading - create service only when first accessed
    let serviceInstance: T | null = null;
    const lazyService = {
      get instance(): T {
        if (!serviceInstance) {
          serviceInstance = serviceFactory();
        }
        return serviceInstance;
      }
    };
    registry.register(config.name, lazyService);
  } else {
    // Eager loading - create service immediately
    const service = serviceFactory();
    registry.register(config.name, service);
  }
};

/**
 * Service dependency resolver
 */
export const resolveDependencies = (serviceName: string): any[] => {
  const registry = ServiceRegistry.getInstance();
  // This would implement dependency resolution logic
  // For now, return empty array
  return [];
};

/**
 * Service factory interface
 */
export interface ServiceFactory<T> {
  create(): T;
  destroy(instance: T): void;
}

/**
 * Register service factory
 */
export const registerServiceFactory = <T>(name: string, factory: ServiceFactory<T>): void => {
  const registry = ServiceRegistry.getInstance();
  registry.register(name, factory);
};


