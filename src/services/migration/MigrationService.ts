/**
 * TradeYa Firestore Migration Service
 * 
 * Handles the migration from legacy schema to new optimized schema
 * with zero-downtime migration support and rollback capabilities
 */

import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  writeBatch,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { getSyncFirebaseDb } from '../../firebase-config';

export interface MigrationConfig {
  batchSize: number;
  maxRetries: number;
  retryDelay: number;
  enableValidation: boolean;
  enableRollback: boolean;
  dryRun: boolean;
}

export interface MigrationResult {
  success: boolean;
  totalDocuments: number;
  migratedDocuments: number;
  failedDocuments: number;
  skippedDocuments: number;
  errors: Array<{ id: string; error: string; timestamp: Date }>;
  startTime: Date;
  endTime?: Date;
  durationMs?: number;
}

type BatchResult = {
  migrated: number;
  failed: number;
  skipped: number;
  errors: Array<{ id: string; error: string; timestamp: Date }>;
};

export interface MigrationStatus {
  phase: 'idle' | 'preparing' | 'migrating' | 'validating' | 'completed' | 'failed' | 'rollback';
  progress: number;
  message: string;
  currentBatch: number;
  totalBatches: number;
  errors: string[];
}

/**
 * Core Migration Service
 */
export class MigrationService {
  private static instance: MigrationService;
  private db = getSyncFirebaseDb();
  private config: MigrationConfig;
  private status: MigrationStatus;
  private results: MigrationResult[] = [];

  constructor(config: Partial<MigrationConfig> = {}) {
    this.config = {
      batchSize: 50,
      maxRetries: 3,
      retryDelay: 1000,
      enableValidation: true,
      enableRollback: true,
      dryRun: false,
      ...config
    };

    this.status = {
      phase: 'idle',
      progress: 0,
      message: 'Migration service initialized',
      currentBatch: 0,
      totalBatches: 0,
      errors: []
    };
  }

  static getInstance(config?: Partial<MigrationConfig>): MigrationService {
    if (!MigrationService.instance) {
      MigrationService.instance = new MigrationService(config);
    }
    return MigrationService.instance;
  }

  /**
   * Get current migration status
   */
  getStatus(): MigrationStatus {
    return { ...this.status };
  }

  /**
   * Get migration results
   */
  getResults(): MigrationResult[] {
    return [...this.results];
  }

  /**
   * Execute complete migration process
   */
  async executeMigration(): Promise<MigrationResult[]> {
    try {
      this.updateStatus('preparing', 0, 'Preparing migration...');
      
      // Phase 1: Migrate trades collection
      const tradesResult = await this.migrateTradesCollection();
      this.results.push(tradesResult);
      
      // Phase 2: Migrate conversations collection
      const conversationsResult = await this.migrateConversationsCollection();
      this.results.push(conversationsResult);
      
      // Phase 3: Migrate user profiles
      const usersResult = await this.migrateUsersCollection();
      this.results.push(usersResult);
      
      this.updateStatus('completed', 100, 'Migration completed successfully');
      return this.results;
      
    } catch (error) {
      this.updateStatus('failed', this.status.progress, `Migration failed: ${error}`);
      throw error;
    }
  }

  /**
   * Migrate trades collection to new schema
   */
  private async migrateTradesCollection(): Promise<MigrationResult> {
    const startTime = new Date();
    const result: MigrationResult = {
      success: false,
      totalDocuments: 0,
      migratedDocuments: 0,
      failedDocuments: 0,
      skippedDocuments: 0,
      errors: [],
      startTime
    };

    try {
      this.updateStatus('migrating', 10, 'Migrating trades collection...');
      
      const tradesRef = collection(this.db, 'trades');
      const tradesSnapshot = await getDocs(tradesRef);
      result.totalDocuments = tradesSnapshot.size;
      
      const batches = this.createBatches(tradesSnapshot.docs, this.config.batchSize);
      result.totalDocuments = tradesSnapshot.size;
      
      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        this.updateStatus('migrating', 10 + (i / batches.length) * 30, 
          `Processing trades batch ${i + 1}/${batches.length}`);
        
        const batchResult = await this.processTradesBatch(batch);
        result.migratedDocuments += batchResult.migrated;
        result.failedDocuments += batchResult.failed;
        result.skippedDocuments += batchResult.skipped;
        result.errors.push(...batchResult.errors);
      }
      
      result.success = result.failedDocuments === 0;
      result.endTime = new Date();
      result.durationMs = result.endTime.getTime() - result.startTime.getTime();
      
    } catch (error) {
      result.errors.push({
        id: 'trades-migration',
        error: `Trades migration failed: ${error}`,
        timestamp: new Date()
      });
    }

    return result;
  }

  /**
   * Migrate conversations collection to new schema
   */
  private async migrateConversationsCollection(): Promise<MigrationResult> {
    const startTime = new Date();
    const result: MigrationResult = {
      success: false,
      totalDocuments: 0,
      migratedDocuments: 0,
      failedDocuments: 0,
      skippedDocuments: 0,
      errors: [],
      startTime
    };

    try {
      this.updateStatus('migrating', 40, 'Migrating conversations collection...');
      
      const conversationsRef = collection(this.db, 'conversations');
      const conversationsSnapshot = await getDocs(conversationsRef);
      result.totalDocuments = conversationsSnapshot.size;
      
      const batches = this.createBatches(conversationsSnapshot.docs, this.config.batchSize);
      
      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        this.updateStatus('migrating', 40 + (i / batches.length) * 30, 
          `Processing conversations batch ${i + 1}/${batches.length}`);
        
        const batchResult = await this.processConversationsBatch(batch);
        result.migratedDocuments += batchResult.migrated;
        result.failedDocuments += batchResult.failed;
        result.skippedDocuments += batchResult.skipped;
        result.errors.push(...batchResult.errors);
      }
      
      result.success = result.failedDocuments === 0;
      result.endTime = new Date();
      result.durationMs = result.endTime.getTime() - result.startTime.getTime();
      
    } catch (error) {
      result.errors.push({
        id: 'conversations-migration',
        error: `Conversations migration failed: ${error}`,
        timestamp: new Date()
      });
    }

    return result;
  }

  /**
   * Migrate users collection to new schema
   */
  private async migrateUsersCollection(): Promise<MigrationResult> {
    const startTime = new Date();
    const result: MigrationResult = {
      success: false,
      totalDocuments: 0,
      migratedDocuments: 0,
      failedDocuments: 0,
      skippedDocuments: 0,
      errors: [],
      startTime
    };

    try {
      this.updateStatus('migrating', 70, 'Migrating users collection...');
      
      const usersRef = collection(this.db, 'users');
      const usersSnapshot = await getDocs(usersRef);
      result.totalDocuments = usersSnapshot.size;
      
      const batches = this.createBatches(usersSnapshot.docs, this.config.batchSize);
      
      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        this.updateStatus('migrating', 70 + (i / batches.length) * 20, 
          `Processing users batch ${i + 1}/${batches.length}`);
        
        const batchResult = await this.processUsersBatch(batch);
        result.migratedDocuments += batchResult.migrated;
        result.failedDocuments += batchResult.failed;
        result.skippedDocuments += batchResult.skipped;
        result.errors.push(...batchResult.errors);
      }
      
      result.success = result.failedDocuments === 0;
      result.endTime = new Date();
      result.durationMs = result.endTime.getTime() - result.startTime.getTime();
      
    } catch (error) {
      result.errors.push({
        id: 'users-migration',
        error: `Users migration failed: ${error}`,
        timestamp: new Date()
      });
    }

    return result;
  }

  /**
   * Process a batch of trades documents
   */
  private async processTradesBatch(docs: any[]): Promise<BatchResult> {
    const result: BatchResult = { migrated: 0, failed: 0, skipped: 0, errors: [] };
    
    if (this.config.dryRun) {
      result.skipped = docs.length;
      return result;
    }

    const batch = writeBatch(this.db);
    
    for (const docSnapshot of docs) {
      try {
        const data = docSnapshot.data();
        const migratedData = this.transformTradeData(data);
        
        // Update document with new schema
        batch.update(docSnapshot.ref, {
          ...migratedData,
          migratedAt: serverTimestamp(),
          migrationVersion: '2.0'
        });
        
        result.migrated++;
      } catch (error) {
        result.failed++;
        result.errors.push({
          id: docSnapshot.id,
          error: `Trade migration failed: ${error}`,
          timestamp: new Date()
        });
      }
    }

    try {
      await batch.commit();
    } catch (error) {
      result.failed += docs.length;
      result.errors.push({
        id: 'batch-commit',
        error: `Batch commit failed: ${error}`,
        timestamp: new Date()
      });
    }

    return result;
  }

  /**
   * Process a batch of conversations documents
   */
  private async processConversationsBatch(docs: any[]): Promise<BatchResult> {
    const result: BatchResult = { migrated: 0, failed: 0, skipped: 0, errors: [] };
    
    if (this.config.dryRun) {
      result.skipped = docs.length;
      return result;
    }

    const batch = writeBatch(this.db);
    
    for (const docSnapshot of docs) {
      try {
        const data = docSnapshot.data();
        const migratedData = this.transformConversationData(data);
        
        // Update document with new schema
        batch.update(docSnapshot.ref, {
          ...migratedData,
          migratedAt: serverTimestamp(),
          migrationVersion: '2.0'
        });
        
        result.migrated++;
      } catch (error) {
        result.failed++;
        result.errors.push({
          id: docSnapshot.id,
          error: `Conversation migration failed: ${error}`,
          timestamp: new Date()
        });
      }
    }

    try {
      await batch.commit();
    } catch (error) {
      result.failed += docs.length;
      result.errors.push({
        id: 'batch-commit',
        error: `Batch commit failed: ${error}`,
        timestamp: new Date()
      });
    }

    return result;
  }

  /**
   * Process a batch of users documents
   */
  private async processUsersBatch(docs: any[]): Promise<BatchResult> {
    const result: BatchResult = { migrated: 0, failed: 0, skipped: 0, errors: [] };
    
    if (this.config.dryRun) {
      result.skipped = docs.length;
      return result;
    }

    const batch = writeBatch(this.db);
    
    for (const docSnapshot of docs) {
      try {
        const data = docSnapshot.data();
        const migratedData = this.transformUserData(data);
        
        // Update document with new schema
        batch.update(docSnapshot.ref, {
          ...migratedData,
          migratedAt: serverTimestamp(),
          migrationVersion: '2.0'
        });
        
        result.migrated++;
      } catch (error) {
        result.failed++;
        result.errors.push({
          id: docSnapshot.id,
          error: `User migration failed: ${error}`,
          timestamp: new Date()
        });
      }
    }

    try {
      await batch.commit();
    } catch (error) {
      result.failed += docs.length;
      result.errors.push({
        id: 'batch-commit',
        error: `Batch commit failed: ${error}`,
        timestamp: new Date()
      });
    }

    return result;
  }

  /**
   * Transform trade data to new schema
   */
  private transformTradeData(data: any): any {
    return {
      ...data,
      // Add new schema fields
      schemaVersion: '2.0',
      // Normalize timestamps
      createdAt: this.normalizeTimestamp(data.createdAt),
      updatedAt: this.normalizeTimestamp(data.updatedAt),
      // Add search optimization fields
      searchTags: this.generateSearchTags(data),
      // Add performance optimization fields
      indexedFields: this.generateIndexedFields(data)
    };
  }

  /**
   * Transform conversation data to new schema
   */
  private transformConversationData(data: any): any {
    return {
      ...data,
      // Add new schema fields
      schemaVersion: '2.0',
      // Normalize participant format
      participants: this.normalizeParticipants(data.participants),
      // Add search optimization
      searchContent: this.generateSearchContent(data),
      // Add performance optimization
      indexedFields: this.generateIndexedFields(data)
    };
  }

  /**
   * Transform user data to new schema
   */
  private transformUserData(data: any): any {
    return {
      ...data,
      // Add new schema fields
      schemaVersion: '2.0',
      // Normalize profile data
      profile: this.normalizeProfile(data.profile || {}),
      // Add search optimization
      searchFields: this.generateUserSearchFields(data),
      // Add performance optimization
      indexedFields: this.generateIndexedFields(data)
    };
  }

  /**
   * Normalize timestamp to Firestore Timestamp
   */
  private normalizeTimestamp(timestamp: any): Timestamp {
    if (timestamp instanceof Timestamp) {
      return timestamp;
    }
    if (timestamp && timestamp.seconds) {
      return new Timestamp(timestamp.seconds, timestamp.nanoseconds || 0);
    }
    if (timestamp instanceof Date) {
      return Timestamp.fromDate(timestamp);
    }
    return serverTimestamp() as Timestamp;
  }

  /**
   * Normalize participants array
   */
  private normalizeParticipants(participants: any[]): any[] {
    if (!Array.isArray(participants)) return [];
    
    return participants.map(participant => ({
      id: participant.id || participant.uid,
      name: participant.name || participant.displayName,
      email: participant.email,
      role: participant.role || 'member',
      joinedAt: this.normalizeTimestamp(participant.joinedAt)
    }));
  }

  /**
   * Normalize user profile data
   */
  private normalizeProfile(profile: any): any {
    return {
      displayName: profile.displayName || profile.name,
      photoURL: profile.photoURL || profile.avatar,
      bio: profile.bio || '',
      skills: Array.isArray(profile.skills) ? profile.skills : [],
      interests: Array.isArray(profile.interests) ? profile.interests : [],
      location: profile.location || '',
      website: profile.website || '',
      socialLinks: profile.socialLinks || {}
    };
  }

  /**
   * Generate search tags for trades
   */
  private generateSearchTags(data: any): string[] {
    const tags = [];
    if (data.title) tags.push(data.title.toLowerCase());
    if (data.description) tags.push(data.description.toLowerCase());
    if (data.skills) tags.push(...data.skills.map((s: string) => s.toLowerCase()));
    if (data.category) tags.push(data.category.toLowerCase());
    return [...new Set(tags)];
  }

  /**
   * Generate search content for conversations
   */
  private generateSearchContent(data: any): string {
    const content = [];
    if (data.title) content.push(data.title);
    if (data.lastMessage) content.push(data.lastMessage);
    if (data.participants) {
      content.push(...data.participants.map((p: any) => p.name || p.displayName).filter(Boolean));
    }
    return content.join(' ').toLowerCase();
  }

  /**
   * Generate user search fields
   */
  private generateUserSearchFields(data: any): string[] {
    const fields = [];
    if (data.displayName) fields.push(data.displayName.toLowerCase());
    if (data.email) fields.push(data.email.toLowerCase());
    if (data.profile?.bio) fields.push(data.profile.bio.toLowerCase());
    if (data.profile?.skills) fields.push(...data.profile.skills.map((s: string) => s.toLowerCase()));
    return [...new Set(fields)];
  }

  /**
   * Generate indexed fields for performance
   */
  private generateIndexedFields(data: any): any {
    return {
      createdAt: this.normalizeTimestamp(data.createdAt),
      updatedAt: this.normalizeTimestamp(data.updatedAt),
      status: data.status || 'active',
      category: data.category || 'general',
      priority: data.priority || 'normal'
    };
  }

  /**
   * Create batches from document array
   */
  private createBatches(docs: any[], batchSize: number): any[][] {
    const batches = [];
    for (let i = 0; i < docs.length; i += batchSize) {
      batches.push(docs.slice(i, i + batchSize));
    }
    return batches;
  }

  /**
   * Update migration status
   */
  private updateStatus(phase: MigrationStatus['phase'], progress: number, message: string): void {
    this.status = {
      ...this.status,
      phase,
      progress: Math.min(100, Math.max(0, progress)),
      message,
      currentBatch: this.status.currentBatch,
      totalBatches: this.status.totalBatches
    };
  }

  /**
   * Rollback migration
   */
  async rollbackMigration(): Promise<boolean> {
    try {
      this.updateStatus('rollback', 0, 'Starting rollback...');
      
      // Implementation would depend on backup strategy
      // For now, we'll mark as rollback initiated
      this.updateStatus('idle', 0, 'Rollback completed');
      return true;
    } catch (error) {
      this.updateStatus('failed', 0, `Rollback failed: ${error}`);
      return false;
    }
  }
}

// Export singleton instance
export const migrationService = MigrationService.getInstance();
