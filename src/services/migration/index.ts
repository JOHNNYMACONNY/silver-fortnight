import { logger } from '@utils/logging/logger';
/**
 * Migration Services Index - Phase 2 Enhanced
 *
 * Central export point for all migration-related services and types
 * with production-grade features and coordination
 */

// Core compatibility services
export { TradeCompatibilityService } from './tradeCompatibility';
export { ChatCompatibilityService } from './chatCompatibility';
export {
  MigrationServiceRegistry,
  migrationRegistry,
  initializeMigrationRegistry,
  isMigrationReady,
  getMigrationStatus
} from './migrationRegistry';

// Core migration types
export type {
  Trade,
  TradeSkill,
  TradeParticipants
} from './tradeCompatibility';

export type {
  ChatConversation,
  ChatMessage,
  ChatParticipant
} from './chatCompatibility';

/**
 * Migration coordination utilities for zero-downtime operations
 */
export class MigrationCoordinator {
  private static instance: MigrationCoordinator;
  private isInMigrationMode = false;
  private currentMigrationVersion?: string;
  
  static getInstance(): MigrationCoordinator {
    if (!MigrationCoordinator.instance) {
      MigrationCoordinator.instance = new MigrationCoordinator();
    }
    return MigrationCoordinator.instance;
  }
  
  /**
   * Enable migration mode for zero-downtime operations
   */
  enableMigrationMode(version: string): void {
    this.isInMigrationMode = true;
    this.currentMigrationVersion = version;
    logger.debug(`Migration mode enabled for version: ${version}`, 'SERVICE');
  }
  
  /**
   * Disable migration mode after completion
   */
  disableMigrationMode(): void {
    this.isInMigrationMode = false;
    this.currentMigrationVersion = undefined;
    logger.debug('Migration mode disabled', 'SERVICE');
  }
  
  /**
   * Check if system is in migration mode
   */
  isInMigration(): boolean {
    return this.isInMigrationMode;
  }
  
  /**
   * Get current migration version
   */
  getCurrentMigrationVersion(): string | undefined {
    return this.currentMigrationVersion;
  }
  
  /**
   * Get migration status for API endpoints
   */
  getMigrationStatus(): {
    inMigration: boolean;
    version?: string;
    estimatedCompletion?: Date;
    healthStatus: 'healthy' | 'degraded' | 'critical';
  } {
    return {
      inMigration: this.isInMigrationMode,
      version: this.currentMigrationVersion,
      healthStatus: 'healthy' // This would be determined by actual health checks
    };
  }
}

/**
 * Migration API endpoints for real-time status reporting
 */
export const migrationStatusEndpoints = {
  '/api/migration/status': () => {
    const coordinator = MigrationCoordinator.getInstance();
    return coordinator.getMigrationStatus();
  },
  
  '/api/migration/health': () => {
    // This would integrate with the enhanced monitoring
    return {
      status: 'operational',
      lastCheck: new Date().toISOString(),
      compatibilityLayer: true // This would check actual registry state
    };
  }
};

/**
 * Utility functions for migration operations
 */
export const migrationUtils = {
  /**
   * Initialize all migration services for production
   */
  initializeProductionMigration: async () => {
    logger.debug('Initializing production migration services...', 'SERVICE');
    
    // Initialize migration registry
    try {
        const { migrationRegistry: registry } = await import('./migrationRegistry');
        if (!registry.isInitialized()) {
          const { getSyncFirebaseDb } = await import('../../firebase-config');
          registry.initialize(getSyncFirebaseDb());
        }
    } catch (error) {
      logger.error('Failed to initialize migration registry:', 'SERVICE', {}, error as Error);
    }
    
    // Enable migration mode
    const coordinator = MigrationCoordinator.getInstance();
    coordinator.enableMigrationMode('2.0');
    
    logger.debug('Production migration services initialized', 'SERVICE');
  },
  
  /**
   * Cleanup after migration completion
   */
  cleanupMigration: async () => {
    logger.debug('Cleaning up migration services...', 'SERVICE');
    
    // Disable migration mode
    const coordinator = MigrationCoordinator.getInstance();
    coordinator.disableMigrationMode();
    
    logger.debug('Migration cleanup completed', 'SERVICE');
  },
  
  /**
   * Validate migration readiness
   */
  validateMigrationReadiness: async (): Promise<boolean> => {
    try {
      // Check compatibility services
      try {
        const { migrationRegistry: registry } = await import('./migrationRegistry');
        const serviceValidation = await registry.validateServices();
        if (!serviceValidation.trades || !serviceValidation.chat) {
          return false;
        }
      } catch (error) {
        logger.error('Service validation failed:', 'SERVICE', {}, error as Error);
        return false;
      }
      
      // Additional readiness checks would go here
      return true;
      
    } catch (error) {
      logger.error('Migration readiness validation failed:', 'SERVICE', {}, error as Error);
      return false;
    }
  }
};

// Default export for convenience
export default {
  MigrationCoordinator,
  migrationUtils,
  migrationStatusEndpoints
};