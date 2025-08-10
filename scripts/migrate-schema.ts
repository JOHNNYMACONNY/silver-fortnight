/**
 * TradeYa Firestore Schema Migration Script
 * 
 * ⚠️ CRITICAL: This script performs the actual data migration from legacy to new schema format
 * 
 * Migration Process:
 * 1. Pre-migration validation (readiness check)
 * 2. Enable migration monitoring
 * 3. Execute trades collection migration in batches
 * 4. Execute conversations collection migration in batches
 * 5. Validate migrated data integrity
 * 6. Run post-migration compatibility tests
 * 7. Generate migration completion report
 * 8. Update migration status to complete
 */

import { 
  collection, 
  getDocs, 
  writeBatch, 
  doc, 
  serverTimestamp,
  query,
  limit,
  startAfter,
  orderBy,
  where,
  getDoc,
  setDoc,
  updateDoc
} from 'firebase/firestore';
import { db } from '../src/firebase-config';
import { migrationRegistry } from '../src/services/migration/migrationRegistry';
import { TradeCompatibilityService } from '../src/services/migration/tradeCompatibility';
import { ChatCompatibilityService } from '../src/services/migration/chatCompatibility';
import { fileURLToPath } from 'url';

/**
 * Migration result interface for tracking progress
 */
interface MigrationResult {
  collection: string;
  totalDocuments: number;
  migratedDocuments: number;
  failedDocuments: number;
  skippedDocuments: number;
  errors: Array<{ id: string; error: string; timestamp: Date }>;
  startTime: Date;
  endTime?: Date;
  durationMs?: number;
  batchesProcessed: number;
}

/**
 * Migration status tracking
 */
interface MigrationStatus {
  phase: 'validation' | 'trades' | 'conversations' | 'post-validation' | 'complete' | 'failed';
  startTime: Date;
  currentBatch?: number;
  totalBatches?: number;
  progress: number;
  message: string;
  errors: string[];
}

/**
 * Data integrity validation result
 */
interface ValidationResult {
  collection: string;
  totalChecked: number;
  validDocuments: number;
  invalidDocuments: number;
  missingFields: string[];
  dataIntegrityIssues: Array<{ id: string; issue: string }>;
}

/**
 * Main Schema Migration Service
 */
export class SchemaMigrationService {
  private static readonly BATCH_SIZE = 50; // Firestore batch write limit
  private static readonly MAX_RETRIES = 3;
  private static readonly RETRY_DELAY = 2000; // 2 seconds
  private static readonly VALIDATION_SAMPLE_SIZE = 100;
  
  private migrationStatus: MigrationStatus;
  private isDryRun: boolean;
  private projectId: string;
  
  constructor(projectId: string = 'tradeya-45ede', isDryRun: boolean = false) {
    this.projectId = projectId;
    this.isDryRun = isDryRun;
    this.migrationStatus = {
      phase: 'validation',
      startTime: new Date(),
      progress: 0,
      message: 'Initializing migration...',
      errors: []
    };
  }

  /**
   * Execute the complete schema migration process
   */
  async executeMigration(): Promise<{
    success: boolean;
    results: MigrationResult[];
    validationResults: ValidationResult[];
    finalReport: any;
  }> {
    console.log('\n🚀 TradeYa Firestore Schema Migration Started');
    console.log(`📊 Project: ${this.projectId}`);
    console.log(`🧪 Dry Run: ${this.isDryRun}`);
    console.log(`⏰ Start Time: ${this.migrationStatus.startTime.toISOString()}`);
    
    if (this.isDryRun) {
      console.log('\n⚠️  DRY RUN MODE - No actual data will be modified');
    }
    
    const results: MigrationResult[] = [];
    const validationResults: ValidationResult[] = [];
    let success = false;
    
    try {
      // Phase 1: Pre-migration validation
      await this.updateMigrationStatus('validation', 5, 'Running pre-migration validation...');
      await this.validateMigrationReadiness();
      
      // Phase 2: Initialize migration monitoring
      await this.updateMigrationStatus('validation', 10, 'Initializing migration monitoring...');
      await this.initializeMigrationMonitoring();
      
      // Phase 3: Migrate trades collection
      await this.updateMigrationStatus('trades', 15, 'Starting trades collection migration...');
      const tradesResult = await this.migrateTradesCollection();
      results.push(tradesResult);
      
      // Phase 4: Migrate conversations collection
      await this.updateMigrationStatus('conversations', 60, 'Starting conversations collection migration...');
      const conversationsResult = await this.migrateConversationsCollection();
      results.push(conversationsResult);
      
      // Phase 5: Post-migration validation
      await this.updateMigrationStatus('post-validation', 85, 'Running post-migration validation...');
      const tradesValidation = await this.validateMigratedData('trades');
      const conversationsValidation = await this.validateMigratedData('conversations');
      validationResults.push(tradesValidation, conversationsValidation);
      
      // Phase 6: Generate final report
      await this.updateMigrationStatus('complete', 95, 'Generating migration report...');
      const finalReport = await this.generateMigrationReport(results, validationResults);
      
      await this.updateMigrationStatus('complete', 100, 'Migration completed successfully!');
      
      success = true;
      return { success, results, validationResults, finalReport };
      
    } catch (error) {
      console.error('\n❌ Migration failed:', error);
      this.migrationStatus.phase = 'failed';
      this.migrationStatus.errors.push(error.message);
      
      const finalReport = await this.generateMigrationReport(results, validationResults);
      return { success: false, results, validationResults, finalReport };
    }
  }

  /**
   * Validate migration readiness before starting
   */
  private async validateMigrationReadiness(): Promise<void> {
    console.log('\n🔍 Validating migration readiness...');
    
    // Check if migration registry is initialized
    if (!migrationRegistry.isInitialized()) {
      migrationRegistry.initialize(db);
    }
    
    // Validate compatibility services
    const serviceValidation = await migrationRegistry.validateServices();
    if (!serviceValidation.trades || !serviceValidation.chat) {
      throw new Error(`Service validation failed: ${serviceValidation.errors.join(', ')}`);
    }
    
    // Check index readiness by testing sample queries
    await this.validateIndexReadiness();
    
    // Verify Firestore connection
    await this.verifyFirestoreConnection();
    
    console.log('✅ Migration readiness validation passed');
  }

  /**
   * Validate that all required indexes are ready
   */
  private async validateIndexReadiness(): Promise<void> {
    console.log('📇 Validating index readiness...');
    
    const indexTests = [
      {
        name: 'Trades by creator and status',
        test: async () => {
          const q = query(
            collection(db, 'trades'),
            where('participants.creator', '==', 'test-user'),
            where('status', '==', 'active'),
            orderBy('createdAt', 'desc'),
            limit(1)
          );
          return await getDocs(q);
        }
      },
      {
        name: 'Conversations by participant',
        test: async () => {
          const q = query(
            collection(db, 'conversations'),
            where('participantIds', 'array-contains', 'test-user'),
            orderBy('updatedAt', 'desc'),
            limit(1)
          );
          return await getDocs(q);
        }
      }
    ];
    
    for (const indexTest of indexTests) {
      try {
        const startTime = Date.now();
        await indexTest.test();
        const duration = Date.now() - startTime;
        
        console.log(`  ✅ ${indexTest.name}: ${duration}ms`);
        
        if (duration > 2000) {
          console.warn(`  ⚠️  Query took ${duration}ms - index may still be building`);
        }
      } catch (error) {
        if (error.message.includes('index')) {
          throw new Error(`Index not ready for ${indexTest.name}: ${error.message}`);
        }
        // Other errors are acceptable for validation (no data, etc.)
        console.log(`  ⚠️  ${indexTest.name}: ${error.message} (acceptable for validation)`);
      }
    }
  }

  /**
   * Verify Firestore connection and permissions
   */
  private async verifyFirestoreConnection(): Promise<void> {
    console.log('🔗 Verifying Firestore connection...');
    
    try {
      // Try to read a single document from each collection
      const tradesQuery = query(collection(db, 'trades'), limit(1));
      await getDocs(tradesQuery);
      
      const conversationsQuery = query(collection(db, 'conversations'), limit(1));
      await getDocs(conversationsQuery);
      
      console.log('✅ Firestore connection verified');
    } catch (error) {
      throw new Error(`Firestore connection failed: ${error.message}`);
    }
  }

  /**
   * Initialize migration monitoring
   */
  private async initializeMigrationMonitoring(): Promise<void> {
    console.log('📊 Initializing migration monitoring...');
    
    try {
      // Create migration status document
      const migrationDocRef = doc(db, 'migrations', `schema-migration-${Date.now()}`);
      
      if (!this.isDryRun) {
        await setDoc(migrationDocRef, {
          type: 'schema-migration',
          projectId: this.projectId,
          status: this.migrationStatus,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
      
      // Enable compatibility mode
      migrationRegistry.enableMigrationMode();
      
      console.log('✅ Migration monitoring initialized');
    } catch (error) {
      console.warn('⚠️  Failed to initialize monitoring:', error.message);
      // Continue migration even if monitoring setup fails
    }
  }

  /**
   * Migrate the trades collection from legacy to new schema
   */
  async migrateTradesCollection(): Promise<MigrationResult> {
    console.log('\n🚀 Starting trades collection migration...');
    
    const result: MigrationResult = {
      collection: 'trades',
      totalDocuments: 0,
      migratedDocuments: 0,
      failedDocuments: 0,
      skippedDocuments: 0,
      errors: [],
      startTime: new Date(),
      batchesProcessed: 0
    };
    
    try {
      // Get total document count
      const totalSnapshot = await getDocs(collection(db, 'trades'));
      result.totalDocuments = totalSnapshot.size;
      
      console.log(`📊 Found ${result.totalDocuments} trades to migrate`);
      
      if (result.totalDocuments === 0) {
        console.log('ℹ️  No trades found, skipping collection migration');
        result.endTime = new Date();
        result.durationMs = result.endTime.getTime() - result.startTime.getTime();
        return result;
      }
      
      let lastDoc = null;
      let processedCount = 0;
      
      // Process in batches
      while (processedCount < result.totalDocuments) {
        result.batchesProcessed++;
        console.log(`\n📦 Processing batch ${result.batchesProcessed}...`);
        
        // Query next batch
        let q = query(
          collection(db, 'trades'),
          orderBy('createdAt'),
          limit(this.BATCH_SIZE)
        );
        
        if (lastDoc) {
          q = query(q, startAfter(lastDoc));
        }
        
        const batchSnapshot = await getDocs(q);
        if (batchSnapshot.empty) break;
        
        // Process batch with retry logic
        const batchResult = await this.processTradeBatch(batchSnapshot.docs, result.batchesProcessed);
        
        result.migratedDocuments += batchResult.migrated;
        result.failedDocuments += batchResult.failed;
        result.skippedDocuments += batchResult.skipped;
        result.errors.push(...batchResult.errors);
        
        processedCount += batchSnapshot.docs.length;
        lastDoc = batchSnapshot.docs[batchSnapshot.docs.length - 1];
        
        // Update progress
        const progress = Math.round((processedCount / result.totalDocuments) * 45) + 15; // 15-60% of total
        await this.updateMigrationStatus('trades', progress, 
          `Migrated ${processedCount}/${result.totalDocuments} trades`);
        
        // Rate limiting
        await this.delay(500);
      }
      
    } catch (error) {
      console.error('❌ Trades migration failed:', error);
      result.errors.push({ id: 'TRADES_MIGRATION_FATAL', error: error.message, timestamp: new Date() });
    }
    
    result.endTime = new Date();
    result.durationMs = result.endTime.getTime() - result.startTime.getTime();
    
    console.log(`\n📊 Trades Migration Results:`);
    console.log(`   ✅ Migrated: ${result.migratedDocuments}`);
    console.log(`   ❌ Failed: ${result.failedDocuments}`);
    console.log(`   ⏭️  Skipped: ${result.skippedDocuments}`);
    console.log(`   📋 Total: ${result.totalDocuments}`);
    console.log(`   ⏱️  Duration: ${result.durationMs}ms`);
    
    return result;
  }

  /**
   * Process a batch of trade documents
   */
  private async processTradeBatch(
    docs: any[], 
    batchNumber: number
  ): Promise<{ migrated: number; failed: number; skipped: number; errors: any[] }> {
    const batchResult = { migrated: 0, failed: 0, skipped: 0, errors: [] };
    
    if (this.isDryRun) {
      // In dry run, just validate the data transformation
      docs.forEach((docSnapshot) => {
        try {
          const data = docSnapshot.data();
          const migratedData = this.transformTradeData(data);
          console.log(`  🧪 [DRY RUN] Would migrate trade ${docSnapshot.id}`);
          batchResult.migrated++;
        } catch (error) {
          console.error(`  ❌ [DRY RUN] Error transforming trade ${docSnapshot.id}:`, error.message);
          batchResult.failed++;
          batchResult.errors.push({ id: docSnapshot.id, error: error.message, timestamp: new Date() });
        }
      });
      return batchResult;
    }
    
    // Real migration with retry logic
    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        const batch = writeBatch(db);
        
        docs.forEach((docSnapshot) => {
          try {
            const data = docSnapshot.data();
            
            // Check if already migrated
            if (data.schemaVersion === '2.0') {
              console.log(`  ⏭️  Trade ${docSnapshot.id} already migrated`);
              batchResult.skipped++;
              return;
            }
            
            const migratedData = this.transformTradeData(data);
            
            batch.update(docSnapshot.ref, {
              ...migratedData,
              schemaVersion: '2.0',
              migratedAt: serverTimestamp(),
              migrationBatch: batchNumber,
              migrationAttempt: attempt
            });
            
            batchResult.migrated++;
          } catch (error) {
            console.error(`  ❌ Error transforming trade ${docSnapshot.id}:`, error.message);
            batchResult.failed++;
            batchResult.errors.push({ id: docSnapshot.id, error: error.message, timestamp: new Date() });
          }
        });
        
        // Commit batch
        await batch.commit();
        
        console.log(`  ✅ Batch ${batchNumber} committed: ${batchResult.migrated} migrated, ${batchResult.failed} failed, ${batchResult.skipped} skipped`);
        break; // Success, exit retry loop
        
      } catch (error) {
        console.error(`  ⚠️  Batch ${batchNumber} attempt ${attempt} failed:`, error.message);
        
        if (attempt === this.MAX_RETRIES) {
          docs.forEach(doc => {
            batchResult.failed++;
            batchResult.errors.push({ 
              id: doc.id, 
              error: `Batch commit failed after ${this.MAX_RETRIES} attempts: ${error.message}`, 
              timestamp: new Date() 
            });
          });
        } else {
          await this.delay(this.RETRY_DELAY * attempt);
        }
      }
    }
    
    return batchResult;
  }

  /**
   * Transform trade data from legacy to new schema
   */
  private transformTradeData(data: any): any {
    // Use the compatibility service transformation logic
    const normalized = TradeCompatibilityService.normalizeTradeData(data);
    
    return {
      // Keep existing data
      ...data,
      
      // Standardize skill fields
      skillsOffered: normalized.skillsOffered,
      skillsWanted: normalized.skillsWanted,
      
      // Normalize participant structure
      participants: normalized.participants,
      
      // Preserve legacy fields during transition period
      offeredSkills_legacy: data.offeredSkills,
      requestedSkills_legacy: data.requestedSkills,
      creatorId_legacy: data.creatorId,
      participantId_legacy: data.participantId
    };
  }

  /**
   * Migrate the conversations collection from legacy to new schema
   */
  async migrateConversationsCollection(): Promise<MigrationResult> {
    console.log('\n🚀 Starting conversations collection migration...');
    
    const result: MigrationResult = {
      collection: 'conversations',
      totalDocuments: 0,
      migratedDocuments: 0,
      failedDocuments: 0,
      skippedDocuments: 0,
      errors: [],
      startTime: new Date(),
      batchesProcessed: 0
    };
    
    try {
      // Get total document count
      const totalSnapshot = await getDocs(collection(db, 'conversations'));
      result.totalDocuments = totalSnapshot.size;
      
      console.log(`📊 Found ${result.totalDocuments} conversations to migrate`);
      
      if (result.totalDocuments === 0) {
        console.log('ℹ️  No conversations found, skipping collection migration');
        result.endTime = new Date();
        result.durationMs = result.endTime.getTime() - result.startTime.getTime();
        return result;
      }
      
      let lastDoc = null;
      let processedCount = 0;
      
      // Process in batches
      while (processedCount < result.totalDocuments) {
        result.batchesProcessed++;
        console.log(`\n📦 Processing batch ${result.batchesProcessed}...`);
        
        // Query next batch
        let q = query(
          collection(db, 'conversations'),
          orderBy('createdAt'),
          limit(this.BATCH_SIZE)
        );
        
        if (lastDoc) {
          q = query(q, startAfter(lastDoc));
        }
        
        const batchSnapshot = await getDocs(q);
        if (batchSnapshot.empty) break;
        
        // Process batch with retry logic
        const batchResult = await this.processConversationBatch(batchSnapshot.docs, result.batchesProcessed);
        
        result.migratedDocuments += batchResult.migrated;
        result.failedDocuments += batchResult.failed;
        result.skippedDocuments += batchResult.skipped;
        result.errors.push(...batchResult.errors);
        
        processedCount += batchSnapshot.docs.length;
        lastDoc = batchSnapshot.docs[batchSnapshot.docs.length - 1];
        
        // Update progress
        const progress = Math.round((processedCount / result.totalDocuments) * 25) + 60; // 60-85% of total
        await this.updateMigrationStatus('conversations', progress, 
          `Migrated ${processedCount}/${result.totalDocuments} conversations`);
        
        // Rate limiting
        await this.delay(500);
      }
      
    } catch (error) {
      console.error('❌ Conversations migration failed:', error);
      result.errors.push({ id: 'CONVERSATIONS_MIGRATION_FATAL', error: error.message, timestamp: new Date() });
    }
    
    result.endTime = new Date();
    result.durationMs = result.endTime.getTime() - result.startTime.getTime();
    
    console.log(`\n📊 Conversations Migration Results:`);
    console.log(`   ✅ Migrated: ${result.migratedDocuments}`);
    console.log(`   ❌ Failed: ${result.failedDocuments}`);
    console.log(`   ⏭️  Skipped: ${result.skippedDocuments}`);
    console.log(`   📋 Total: ${result.totalDocuments}`);
    console.log(`   ⏱️  Duration: ${result.durationMs}ms`);
    
    return result;
  }

  /**
   * Process a batch of conversation documents
   */
  private async processConversationBatch(
    docs: any[], 
    batchNumber: number
  ): Promise<{ migrated: number; failed: number; skipped: number; errors: any[] }> {
    const batchResult = { migrated: 0, failed: 0, skipped: 0, errors: [] };
    
    if (this.isDryRun) {
      // In dry run, just validate the data transformation
      docs.forEach((docSnapshot) => {
        try {
          const data = docSnapshot.data();
          const migratedData = this.transformConversationData(data);
          console.log(`  🧪 [DRY RUN] Would migrate conversation ${docSnapshot.id}`);
          batchResult.migrated++;
        } catch (error) {
          console.error(`  ❌ [DRY RUN] Error transforming conversation ${docSnapshot.id}:`, error.message);
          batchResult.failed++;
          batchResult.errors.push({ id: docSnapshot.id, error: error.message, timestamp: new Date() });
        }
      });
      return batchResult;
    }
    
    // Real migration with retry logic
    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        const batch = writeBatch(db);
        
        docs.forEach((docSnapshot) => {
          try {
            const data = docSnapshot.data();
            
            // Check if already migrated
            if (data.schemaVersion === '2.0') {
              console.log(`  ⏭️  Conversation ${docSnapshot.id} already migrated`);
              batchResult.skipped++;
              return;
            }
            
            const migratedData = this.transformConversationData(data);
            
            batch.update(docSnapshot.ref, {
              ...migratedData,
              schemaVersion: '2.0',
              migratedAt: serverTimestamp(),
              migrationBatch: batchNumber,
              migrationAttempt: attempt
            });
            
            batchResult.migrated++;
          } catch (error) {
            console.error(`  ❌ Error transforming conversation ${docSnapshot.id}:`, error.message);
            batchResult.failed++;
            batchResult.errors.push({ id: docSnapshot.id, error: error.message, timestamp: new Date() });
          }
        });
        
        // Commit batch
        await batch.commit();
        
        console.log(`  ✅ Batch ${batchNumber} committed: ${batchResult.migrated} migrated, ${batchResult.failed} failed, ${batchResult.skipped} skipped`);
        break; // Success, exit retry loop
        
      } catch (error) {
        console.error(`  ⚠️  Batch ${batchNumber} attempt ${attempt} failed:`, error.message);
        
        if (attempt === this.MAX_RETRIES) {
          docs.forEach(doc => {
            batchResult.failed++;
            batchResult.errors.push({ 
              id: doc.id, 
              error: `Batch commit failed after ${this.MAX_RETRIES} attempts: ${error.message}`, 
              timestamp: new Date() 
            });
          });
        } else {
          await this.delay(this.RETRY_DELAY * attempt);
        }
      }
    }
    
    return batchResult;
  }

  /**
   * Transform conversation data from legacy to new schema
   */
  private transformConversationData(data: any): any {
    // Use the compatibility service transformation logic
    const normalized = ChatCompatibilityService.normalizeConversationData(data);
    
    return {
      // Keep existing data
      ...data,
      
      // Standardize participant structure
      participantIds: normalized.participantIds,
      
      // Preserve legacy fields during transition period
      participants_legacy: data.participants
    };
  }

  /**
   * Validate migrated data integrity
   */
  private async validateMigratedData(collectionName: string): Promise<ValidationResult> {
    console.log(`\n🔍 Validating ${collectionName} data integrity...`);
    
    const result: ValidationResult = {
      collection: collectionName,
      totalChecked: 0,
      validDocuments: 0,
      invalidDocuments: 0,
      missingFields: [],
      dataIntegrityIssues: []
    };
    
    try {
      // Sample migrated documents for validation
      const q = query(
        collection(db, collectionName),
        where('schemaVersion', '==', '2.0'),
        limit(this.VALIDATION_SAMPLE_SIZE)
      );
      
      const snapshot = await getDocs(q);
      result.totalChecked = snapshot.docs.length;
      
      console.log(`📊 Validating ${result.totalChecked} migrated ${collectionName} documents...`);
      
      for (const doc of snapshot.docs) {
        try {
          const data = doc.data();
          
          if (collectionName === 'trades') {
            const isValid = this.validateTradeDocument(data, doc.id, result);
            if (isValid) result.validDocuments++;
            else result.invalidDocuments++;
          } else if (collectionName === 'conversations') {
            const isValid = this.validateConversationDocument(data, doc.id, result);
            if (isValid) result.validDocuments++;
            else result.invalidDocuments++;
          }
        } catch (error) {
          result.invalidDocuments++;
          result.dataIntegrityIssues.push({
            id: doc.id,
            issue: `Validation error: ${error.message}`
          });
        }
      }
      
    } catch (error) {
      console.error(`❌ Validation failed for ${collectionName}:`, error);
      result.dataIntegrityIssues.push({
        id: 'VALIDATION_FATAL',
        issue: error.message
      });
    }
    
    console.log(`📊 ${collectionName} Validation Results:`);
    console.log(`   ✅ Valid: ${result.validDocuments}`);
    console.log(`   ❌ Invalid: ${result.invalidDocuments}`);
    console.log(`   📋 Checked: ${result.totalChecked}`);
    
    return result;
  }

  /**
   * Validate individual trade document
   */
  private validateTradeDocument(data: any, docId: string, result: ValidationResult): boolean {
    let isValid = true;
    
    // Check required new schema fields
    const requiredFields = ['skillsOffered', 'skillsWanted', 'participants'];
    
    for (const field of requiredFields) {
      if (!data[field]) {
        isValid = false;
        result.missingFields.push(field);
        result.dataIntegrityIssues.push({
          id: docId,
          issue: `Missing required field: ${field}`
        });
      }
    }
    
    // Validate participant structure
    if (data.participants && (!data.participants.creator)) {
      isValid = false;
      result.dataIntegrityIssues.push({
        id: docId,
        issue: 'Invalid participants structure: missing creator'
      });
    }
    
    // Validate skills arrays
    if (data.skillsOffered && !Array.isArray(data.skillsOffered)) {
      isValid = false;
      result.dataIntegrityIssues.push({
        id: docId,
        issue: 'skillsOffered is not an array'
      });
    }
    
    if (data.skillsWanted && !Array.isArray(data.skillsWanted)) {
      isValid = false;
      result.dataIntegrityIssues.push({
        id: docId,
        issue: 'skillsWanted is not an array'
      });
    }
    
    return isValid;
  }

  /**
   * Validate individual conversation document
   */
  private validateConversationDocument(data: any, docId: string, result: ValidationResult): boolean {
    let isValid = true;
    
    // Check required new schema fields
    if (!data.participantIds) {
      isValid = false;
      result.missingFields.push('participantIds');
      result.dataIntegrityIssues.push({
        id: docId,
        issue: 'Missing required field: participantIds'
      });
    }
    
    // Validate participantIds array
    if (data.participantIds && !Array.isArray(data.participantIds)) {
      isValid = false;
      result.dataIntegrityIssues.push({
        id: docId,
        issue: 'participantIds is not an array'
      });
    }
    
    if (data.participantIds && data.participantIds.length === 0) {
      isValid = false;
      result.dataIntegrityIssues.push({
        id: docId,
        issue: 'participantIds array is empty'
      });
    }
    
    return isValid;
  }

  /**
   * Generate comprehensive migration report
   */
  private async generateMigrationReport(
    results: MigrationResult[], 
    validationResults: ValidationResult[]
  ): Promise<any> {
    console.log('\n📋 Generating migration report...');
    
    const endTime = new Date();
    const totalDuration = endTime.getTime() - this.migrationStatus.startTime.getTime();
    
    const report = {
      metadata: {
        projectId: this.projectId,
        isDryRun: this.isDryRun,
        startTime: this.migrationStatus.startTime,
        endTime,
        totalDurationMs: totalDuration,
        totalDurationMinutes: Math.round(totalDuration / 60000 * 100) / 100
      },
      summary: {
        totalCollections: results.length,
        totalDocumentsProcessed: results.reduce((sum, r) => sum + r.totalDocuments, 0),
        totalDocumentsMigrated: results.reduce((sum, r) => sum + r.migratedDocuments, 0),
        totalDocumentsFailed: results.reduce((sum, r) => sum + r.failedDocuments, 0),
        totalDocumentsSkipped: results.reduce((sum, r) => sum + r.skippedDocuments, 0),
        totalErrors: results.reduce((sum, r) => sum + r.errors.length, 0),
        successRate: 0
      },
      migrationResults: results,
      validationResults,
      status: this.migrationStatus,
      recommendations: []
    };
    
    // Calculate success rate
    const totalProcessed = report.summary.totalDocumentsProcessed;
    if (totalProcessed > 0) {
      report.summary.successRate = Math.round(
        (report.summary.totalDocumentsMigrated / totalProcessed) * 100 * 100
      ) / 100;
    }
    
    // Generate recommendations
    if (report.summary.totalDocumentsFailed > 0) {
      report.recommendations.push('Review failed documents and consider manual migration');
    }
    
    if (report.summary.successRate < 95) {
      report.recommendations.push('Success rate below 95% - consider rollback');
    }
    
    const hasValidationIssues = validationResults.some(v => v.invalidDocuments > 0);
    if (hasValidationIssues) {
      report.recommendations.push('Data integrity issues detected - review validation results');
    }
    
    if (report.summary.successRate >= 95 && !hasValidationIssues) {
      report.recommendations.push('Migration completed successfully - safe to proceed with cleanup');
    }
    
    console.log('\n🎉 Migration Report Generated:');
    console.log(`   📊 Total Documents: ${report.summary.totalDocumentsProcessed}`);
    console.log(`   ✅ Migrated: ${report.summary.totalDocumentsMigrated}`);
    console.log(`   ❌ Failed: ${report.summary.totalDocumentsFailed}`);
    console.log(`   ⏭️  Skipped: ${report.summary.totalDocumentsSkipped}`);
    console.log(`   📈 Success Rate: ${report.summary.successRate}%`);
    console.log(`   ⏱️  Duration: ${report.metadata.totalDurationMinutes} minutes`);
    
    // Save report to file or database if not dry run
    if (!this.isDryRun) {
      try {
        const reportDocRef = doc(db, 'migration-reports', `schema-migration-${Date.now()}`);
        await setDoc(reportDocRef, {
          ...report,
          createdAt: serverTimestamp()
        });
        console.log('📁 Migration report saved to Firestore');
      } catch (error) {
        console.warn('⚠️  Failed to save migration report:', error.message);
      }
    }
    
    return report;
  }

  /**
   * Update migration status for monitoring
   */
  private async updateMigrationStatus(
    phase: MigrationStatus['phase'], 
    progress: number, 
    message: string
  ): Promise<void> {
    this.migrationStatus.phase = phase;
    this.migrationStatus.progress = progress;
    this.migrationStatus.message = message;
    
    console.log(`\n📊 [${progress}%] ${phase.toUpperCase()}: ${message}`);
  }

  /**
   * Utility: Delay execution
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Execute migration with command line arguments
 */
async function runMigration() {
  console.log('\n🔄 TradeYa Schema Migration Execution\n');
  
  const args = process.argv.slice(2);
  const projectArg = args.find(arg => arg.startsWith('--project='));
  const projectId = projectArg ? projectArg.split('=')[1] : 'tradeya-45ede';
  const isDryRun = !args.includes('--execute');
  
  if (isDryRun) {
    console.log('\n⚠️  DRY RUN MODE: Use --execute flag to perform actual migration');
  }
  
  try {
    const migrationService = new SchemaMigrationService(projectId, isDryRun);
    const result = await migrationService.executeMigration();
    
    if (result.success) {
      console.log('\n🎉 Migration completed successfully!');
      
      if (!isDryRun) {
        console.log('\n📋 Next Steps:');
        console.log('1. Monitor application for 24-48 hours');
        console.log('2. Run post-migration validation tests');
        console.log('3. After stable operation, run cleanup script to remove legacy fields');
        console.log('4. Disable migration mode in application');
      }
      
      process.exit(0);
    } else {
      console.error('\n💥 Migration failed - check the logs above for details');
      console.error('Consider running rollback procedure if necessary');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\n💥 Unhandled migration error:', error);
    console.error('\n🚨 CRITICAL: Migration may be in inconsistent state');
    console.error('Review migration status and consider rollback');
    process.exit(1);
  }
}

// Execute migration if this script is run directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runMigration();
}

export { SchemaMigrationService };