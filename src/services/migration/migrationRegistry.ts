import { TradeCompatibilityService } from './tradeCompatibility';
import { ChatCompatibilityService } from './chatCompatibility';
import { Firestore } from 'firebase/firestore';
import { logger } from '@utils/logging/logger';

/**
 * Migration Service Registry
 *
 * ⚠️ CRITICAL: Central registry for all migration compatibility services
 * 
 * Purpose: Acts as a central point to access various compatibility services
 * during the migration. This helps in managing dependencies and providing
 * a consistent way for components to get the correct service instance.
 *
 * Implementation Notes:
 * - Implemented as a Singleton pattern
 * - Manages migration mode state
 * - Initializes and holds instances of all compatibility services
 * - Components import `migrationRegistry` and use it to get specific services
 */

export class MigrationServiceRegistry {
  private static instance: MigrationServiceRegistry;
  private migrationMode: boolean = false;
  private tradeService: TradeCompatibilityService | null = null;
  private chatService: ChatCompatibilityService | null = null;
  private firestoreInstance: Firestore | null = null;
  
  private constructor() {
    logger.debug('🔄 MigrationServiceRegistry initialized', 'SERVICE');
  }

  /**
   * Get singleton instance of the migration registry
   */
  public static getInstance(): MigrationServiceRegistry {
    if (!MigrationServiceRegistry.instance) {
      MigrationServiceRegistry.instance = new MigrationServiceRegistry();
    }
    return MigrationServiceRegistry.instance;
  }

  /**
   * Initialize the registry with a Firestore instance
   * 
   * @param db - Firestore database instance
   */
  public initialize(db: Firestore): void {
    if (this.firestoreInstance) {
      logger.debug(' Migration registry already initialized, skipping...', 'SERVICE');
      return;
    }

    this.firestoreInstance = db;
    this.tradeService = new TradeCompatibilityService(db);
    this.chatService = new ChatCompatibilityService(db);
    
    logger.debug('✅ Migration registry initialized with Firestore instance', 'SERVICE');
  }

  /**
   * Enable migration mode - compatibility layers will be used
   */
  public enableMigrationMode(): void {
    this.migrationMode = true;
    logger.debug('🔄 Migration mode enabled - using compatibility layers', 'SERVICE');
  }

  /**
   * Disable migration mode - direct access to new schema
   */
  public disableMigrationMode(): void {
    this.migrationMode = false;
    logger.debug('✅ Migration mode disabled - using direct schema access', 'SERVICE');
  }

  /**
   * Check if migration mode is currently active
   */
  public isMigrationMode(): boolean {
    return this.migrationMode;
  }

  /**
   * Get the trade compatibility service
   * 
   * @throws Error if registry not initialized
   */
  public get trades(): TradeCompatibilityService {
    if (!this.tradeService) {
      throw new Error('Migration registry not initialized. Call initialize(db) first.');
    }
    return this.tradeService;
  }

  /**
   * Get the chat compatibility service
   * 
   * @throws Error if registry not initialized
   */
  public get chat(): ChatCompatibilityService {
    if (!this.chatService) {
      throw new Error('Migration registry not initialized. Call initialize(db) first.');
    }
    return this.chatService;
  }

  /**
   * Check if the registry is properly initialized
   */
  public isInitialized(): boolean {
    return this.firestoreInstance !== null && 
           this.tradeService !== null && 
           this.chatService !== null;
  }

  /**
   * Get migration status information
   */
  public getStatus(): {
    initialized: boolean;
    migrationMode: boolean;
    services: {
      trades: boolean;
      chat: boolean;
    };
  } {
    return {
      initialized: this.isInitialized(),
      migrationMode: this.migrationMode,
      services: {
        trades: this.tradeService !== null,
        chat: this.chatService !== null
      }
    };
  }

  /**
   * Reset the registry (useful for testing)
   */
  public reset(): void {
    this.migrationMode = false;
    this.tradeService = null;
    this.chatService = null;
    this.firestoreInstance = null;
    logger.debug('🔄 Migration registry reset', 'SERVICE');
  }

  /**
   * Enable migration mode with environment-based configuration
   * 
   * This method can be called during app initialization to automatically
   * determine migration mode based on environment variables or config
   */
  public enableMigrationModeFromConfig(): void {
    // Check environment variables or configuration
    const migrationEnabled = process.env.REACT_APP_MIGRATION_MODE === 'true' ||
                           process.env.NODE_ENV === 'development';
    
    if (migrationEnabled) {
      this.enableMigrationMode();
    } else {
      this.disableMigrationMode();
    }
  }

  /**
   * Validate all services are working correctly
   * 
   * @returns Promise resolving to validation results
   */
  public async validateServices(): Promise<{
    trades: boolean;
    chat: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];
    let tradesValid = false;
    let chatValid = false;

    try {
      if (!this.isInitialized()) {
        throw new Error('Registry not initialized');
      }

      // Validate trade service
      try {
        // Test normalization with sample data
        const sampleTrade = {
          id: 'test',
          title: 'Test Trade',
          status: 'active',
          skillsOffered: ['React'],
          skillsWanted: ['Node.js'],
          participants: { creator: 'user1', participant: null },
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        TradeCompatibilityService.normalizeTradeData(sampleTrade);
        tradesValid = true;
      } catch (tradeError) {
        const message = tradeError instanceof Error ? tradeError.message : String(tradeError);
        errors.push(`Trade service validation failed: ${message}`);
      }

      // Validate chat service
      try {
        // Test normalization with sample data
        const sampleConversation = {
          id: 'test',
          participantIds: ['user1', 'user2'],
          type: 'direct',
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        ChatCompatibilityService.normalizeConversationData(sampleConversation);
        chatValid = true;
      } catch (chatError) {
        const message = chatError instanceof Error ? chatError.message : String(chatError);
        errors.push(`Chat service validation failed: ${message}`);
      }

    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      errors.push(`Registry validation failed: ${message}`);
    }

    return {
      trades: tradesValid,
      chat: chatValid,
      errors
    };
  }
}

// Global instance
export const migrationRegistry = MigrationServiceRegistry.getInstance();

// Export types for external use
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
 * Utility function to initialize migration registry with database
 * 
 * @param db - Firestore instance
 * @param enableMigration - Whether to enable migration mode
 */
export function initializeMigrationRegistry(
  db: Firestore, 
  enableMigration: boolean = true
): void {
  migrationRegistry.initialize(db);
  
  if (enableMigration) {
    migrationRegistry.enableMigrationMode();
  } else {
    migrationRegistry.disableMigrationMode();
  }
  
  logger.debug('🚀 Migration registry setup complete', 'SERVICE');
}

/**
 * Utility function to check if migration services are ready
 */
export function isMigrationReady(): boolean {
  return migrationRegistry.isInitialized();
}

/**
 * Utility function to get migration status
 */
export function getMigrationStatus() {
  return migrationRegistry.getStatus();
}
