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
    console.log(`Migration mode enabled for version: ${version}`);
  }
  
  /**
   * Disable migration mode after completion
   */
  disableMigrationMode(): void {
    this.isInMigrationMode = false;
    this.currentMigrationVersion = undefined;
    console.log('Migration mode disabled');
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
    console.log('Initializing production migration services...');
    
    // Initialize migration registry
    try {
      const { migrationRegistry: registry } = await import('./migrationRegistry');
      if (!registry.isInitialized()) {
        const { db } = await import('../../firebase-config');
        registry.initialize(db);
      }
    } catch (error) {
      console.error('Failed to initialize migration registry:', error);
    }
    
    // Enable migration mode
    const coordinator = MigrationCoordinator.getInstance();
    coordinator.enableMigrationMode('2.0');
    
    console.log('Production migration services initialized');
  },
  
  /**
   * Cleanup after migration completion
   */
  cleanupMigration: async () => {
    console.log('Cleaning up migration services...');
    
    // Disable migration mode
    const coordinator = MigrationCoordinator.getInstance();
    coordinator.disableMigrationMode();
    
    console.log('Migration cleanup completed');
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
        console.error('Service validation failed:', error);
        return false;
      }
      
      // Additional readiness checks would go here
      return true;
      
    } catch (error) {
      console.error('Migration readiness validation failed:', error);
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