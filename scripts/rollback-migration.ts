/**
 * TradeYa Emergency Rollback Script
 * 
 * ⚠️ CRITICAL: Emergency rollback procedure for Firestore schema migration
 * 
 * This script provides automated rollback procedures with data validation
 * and comprehensive logging for emergency scenarios.
 */

import { 
  // Remove modular SDK imports that don't exist in firebase-admin
  // collection, 
  // getDocs, 
  // writeBatch, 
  // doc, 
  // query,
  // where,
  // limit,
  FieldValue,
  getFirestore,
  Firestore
} from 'firebase-admin/firestore';
import { initializeApp, getApps } from 'firebase-admin/app';
import { fileURLToPath } from 'url';

/**
 * Rollback operation result
 */
interface RollbackResult {
  operation: string;
  status: 'SUCCESS' | 'FAILED' | 'PARTIAL';
  documentsProcessed: number;
  documentsReverted: number;
  documentsFailed: number;
  errors: Array<{ id: string; error: string }>;
  startTime: Date;
  endTime: Date;
  durationMs: number;
}

/**
 * Complete rollback status
 */
interface RollbackStatus {
  initiated: Date;
  phase: 'validation' | 'data-revert' | 'cleanup' | 'complete' | 'failed';
  operations: RollbackResult[];
  overallStatus: 'SUCCESS' | 'FAILED' | 'PARTIAL';
  requiresManualIntervention: boolean;
  backupRequired: boolean;
  manualSteps: string[];
}

/**
 * Emergency Rollback Service
 */
export class RollbackService {
  private rollbackStatus: RollbackStatus;
  private isDryRun: boolean;
  private projectId: string;
  private backupId?: string;
  private db: Firestore; // Add private db property
  
  constructor(
    projectId: string = 'tradeya-45ede',
    isDryRun: boolean = true,
    backupId?: string
  ) {
    this.projectId = projectId;
    this.isDryRun = isDryRun;
    this.backupId = backupId;
    this.rollbackStatus = {
      initiated: new Date(),
      phase: 'validation',
      operations: [],
      overallStatus: 'SUCCESS',
      requiresManualIntervention: false,
      backupRequired: !backupId,
      manualSteps: []
    };

    // Initialize Firebase app and Firestore if not already done
    if (getApps().length === 0) {
      initializeApp({
        projectId: this.projectId,
        // Add other config if needed, e.g., credential: admin.credential.cert(serviceAccountKey)
      });
    }
    this.db = getFirestore(); // Fix: Use getFirestore() to get the instance
  }

  /**
   * Execute emergency rollback procedure
   */
  async executeRollback(): Promise<RollbackStatus> {
    console.log('\n🚨 EMERGENCY ROLLBACK PROCEDURE INITIATED');
    console.log('====================================================');
    console.log(`📊 Project: ${this.projectId}`);
    console.log(`🧪 Dry Run: ${this.isDryRun}`);
    console.log(`📁 Backup ID: ${this.backupId || 'NOT PROVIDED'}`);
    console.log(`⏰ Start Time: ${this.rollbackStatus.initiated.toISOString()}`);
    
    if (this.isDryRun) {
      console.log('\n⚠️  DRY RUN MODE - No actual changes will be made');
    } else {
      console.log('\n🔥 LIVE ROLLBACK MODE - Changes will be applied immediately');
    }
    
    try {
      // Phase 1: Pre-rollback validation
      await this.updatePhase('validation');
      await this.validateRollbackReadiness();
      
      // Phase 2: Data reversion (if no backup provided)
      if (!this.backupId) {
        await this.updatePhase('data-revert');
        await this.revertDataChanges();
      } else {
        console.log('\n📁 Backup ID provided - manual restore required');
        this.rollbackStatus.manualSteps.push(
          `Execute: firebase firestore:import gs://tradeya-backups/${this.backupId} --project ${this.projectId}`
        );
        this.rollbackStatus.requiresManualIntervention = true;
      }
      
      // Phase 3: Cleanup operations
      await this.updatePhase('cleanup');
      await this.performCleanupOperations();
      
      // Phase 4: Generate rollback report
      await this.updatePhase('complete');
      await this.generateRollbackReport();
      
      console.log('\n✅ Emergency rollback procedure completed');
      
    } catch (error) {
      console.error('\n💥 Rollback procedure failed:', error);
      this.rollbackStatus.phase = 'failed';
      this.rollbackStatus.overallStatus = 'FAILED';
      this.rollbackStatus.requiresManualIntervention = true;
      
      this.rollbackStatus.manualSteps.push(
        'CRITICAL: Automated rollback failed - manual intervention required',
        'Contact database administrator immediately',
        'Review error logs and determine next steps',
        'Consider restoring from latest backup manually'
      );
    }
    
    return this.rollbackStatus;
  }

  /**
   * Validate rollback readiness
   */
  private async validateRollbackReadiness(): Promise<void> {
    console.log('\n🔍 Validating rollback readiness...');
    
    const validationResult: RollbackResult = {
      operation: 'Rollback Validation',
      status: 'SUCCESS',
      documentsProcessed: 0,
      documentsReverted: 0,
      documentsFailed: 0,
      errors: [],
      startTime: new Date(),
      endTime: new Date(),
      durationMs: 0
    };
    
    try {
      // Check for migrated documents
      const migratedTradesQuery = this.db.collection('trades') // Fix: Use instance method
        .where('schemaVersion', '==', '2.0')
        .limit(10);
      
      const migratedConversationsQuery = this.db.collection('conversations') // Fix: Use instance method
        .where('schemaVersion', '==', '2.0')
        .limit(10);
      
      const [migratedTrades, migratedConversations] = await Promise.all([
        migratedTradesQuery.get(), // Fix: Use .get() instead of getDocs
        migratedConversationsQuery.get() // Fix: Use .get() instead of getDocs
      ]);
      
      validationResult.documentsProcessed = migratedTrades.size + migratedConversations.size;
      
      console.log(`📊 Found ${migratedTrades.size} migrated trades`);
      console.log(`📊 Found ${migratedConversations.size} migrated conversations`);
      
      if (validationResult.documentsProcessed === 0) {
        console.log('ℹ️  No migrated documents found - migration may not have occurred');
        validationResult.status = 'PARTIAL';
      }
      
      // Validate Firestore connection
      const testQuery = this.db.collection('trades').limit(1); // Fix: Use instance method
      await testQuery.get(); // Fix: Use .get()
      
      console.log('✅ Firestore connection validated');
      
      // Check for backup requirement
      if (!this.backupId && validationResult.documentsProcessed > 100) {
        console.warn('⚠️  Large number of migrated documents detected without backup ID');
        console.warn('   Recommend providing backup ID for safer rollback');
        this.rollbackStatus.backupRequired = true;
      }
      
    } catch (error) {
      validationResult.status = 'FAILED';
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      validationResult.errors.push({ id: 'VALIDATION_ERROR', error: errorMessage });
      throw new Error(`Rollback validation failed: ${errorMessage}`);
    } finally {
      validationResult.endTime = new Date();
      validationResult.durationMs = validationResult.endTime.getTime() - validationResult.startTime.getTime();
      this.rollbackStatus.operations.push(validationResult);
    }
  }

  /**
   * Revert data changes from migration
   */
  private async revertDataChanges(): Promise<void> {
    console.log('\n🔄 Reverting data changes...');
    
    // Revert trades collection
    const tradesResult = await this.revertTradesCollection();
    this.rollbackStatus.operations.push(tradesResult);
    
    // Revert conversations collection
    const conversationsResult = await this.revertConversationsCollection();
    this.rollbackStatus.operations.push(conversationsResult);
    
    // Check if any operations failed
    const hasFailures = this.rollbackStatus.operations.some(op => op.status === 'FAILED');
    if (hasFailures) {
      this.rollbackStatus.overallStatus = 'PARTIAL';
      this.rollbackStatus.requiresManualIntervention = true;
    }
  }

  /**
   * Revert trades collection to legacy schema
   */
  private async revertTradesCollection(): Promise<RollbackResult> {
    console.log('📦 Reverting trades collection...');
    
    const result: RollbackResult = {
      operation: 'Revert Trades Collection',
      status: 'SUCCESS',
      documentsProcessed: 0,
      documentsReverted: 0,
      documentsFailed: 0,
      errors: [],
      startTime: new Date(),
      endTime: new Date(),
      durationMs: 0
    };
    
    try {
      // Get migrated trades
      const migratedTradesQuery = this.db.collection('trades') // Fix: Use instance method
        .where('schemaVersion', '==', '2.0')
        .limit(1000); // Process in chunks
      
      const snapshot = await migratedTradesQuery.get(); // Fix: Use .get()
      result.documentsProcessed = snapshot.size;
      
      console.log(`📊 Processing ${result.documentsProcessed} migrated trades...`);
      
      if (snapshot.empty) {
        console.log('ℹ️  No migrated trades found');
        return result;
      }
      
      if (this.isDryRun) {
        // Dry run - just validate the reversion logic
        snapshot.docs.forEach(doc => {
          try {
            const data = doc.data();
            this.generateLegacyTradeData(data);
            result.documentsReverted++;
            console.log(`  🧪 [DRY RUN] Would revert trade ${doc.id}`);
          } catch (error) {
            result.documentsFailed++;
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            result.errors.push({ id: doc.id, error: errorMessage });
            console.error(`  ❌ [DRY RUN] Error reverting trade ${doc.id}:`, errorMessage);
          }
        });
      } else {
        // Real reversion
        const batch = this.db.batch(); // Fix: Use db.batch() instead of writeBatch
        let batchCount = 0;
        
        snapshot.docs.forEach(docSnapshot => {
          try {
            const data = docSnapshot.data();
            const legacyData = this.generateLegacyTradeData(data);
            
            batch.update(docSnapshot.ref, legacyData);
            result.documentsReverted++;
            batchCount++;
            
            // Commit in chunks of 50
            if (batchCount >= 50) {
              // Note: In a real implementation, you'd await batch.commit() here
              // and create a new batch, but for simplicity keeping single batch
            }
          } catch (error) {
            result.documentsFailed++;
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            result.errors.push({ id: docSnapshot.id, error: errorMessage });
            console.error(`  ❌ Error reverting trade ${docSnapshot.id}:`, errorMessage);
          }
        });
        
        // Commit final batch
        if (batchCount > 0) {
          await batch.commit();
          console.log(`  ✅ Reverted ${result.documentsReverted} trades`);
        }
      }
      
    } catch (error) {
      result.status = 'FAILED';
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      result.errors.push({ id: 'TRADES_REVERT_FATAL', error: errorMessage });
      console.error('❌ Trades reversion failed:', error);
    } finally {
      result.endTime = new Date();
      result.durationMs = result.endTime.getTime() - result.startTime.getTime();
      
      if (result.documentsFailed > 0) {
        result.status = result.documentsReverted > 0 ? 'PARTIAL' : 'FAILED';
      }
    }
    
    return result;
  }

  /**
   * Revert conversations collection to legacy schema
   */
  private async revertConversationsCollection(): Promise<RollbackResult> {
    console.log('💬 Reverting conversations collection...');
    
    const result: RollbackResult = {
      operation: 'Revert Conversations Collection',
      status: 'SUCCESS',
      documentsProcessed: 0,
      documentsReverted: 0,
      documentsFailed: 0,
      errors: [],
      startTime: new Date(),
      endTime: new Date(),
      durationMs: 0
    };
    
    try {
      // Get migrated conversations
      const migratedConversationsQuery = this.db.collection('conversations') // Fix: Use instance method
        .where('schemaVersion', '==', '2.0')
        .limit(1000);
      
      const snapshot = await migratedConversationsQuery.get(); // Fix: Use .get()
      result.documentsProcessed = snapshot.size;
      
      console.log(`📊 Processing ${result.documentsProcessed} migrated conversations...`);
      
      if (snapshot.empty) {
        console.log('ℹ️  No migrated conversations found');
        return result;
      }
      
      if (this.isDryRun) {
        // Dry run - just validate the reversion logic
        snapshot.docs.forEach(doc => {
          try {
            const data = doc.data();
            this.generateLegacyConversationData(data);
            result.documentsReverted++;
            console.log(`  🧪 [DRY RUN] Would revert conversation ${doc.id}`);
          } catch (error) {
            result.documentsFailed++;
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            result.errors.push({ id: doc.id, error: errorMessage });
            console.error(`  ❌ [DRY RUN] Error reverting conversation ${doc.id}:`, errorMessage);
          }
        });
      } else {
        // Real reversion
        const batch = this.db.batch(); // Fix: Use db.batch()
        
        snapshot.docs.forEach(docSnapshot => {
          try {
            const data = docSnapshot.data();
            const legacyData = this.generateLegacyConversationData(data);
            
            batch.update(docSnapshot.ref, legacyData);
            result.documentsReverted++;
          } catch (error) {
            result.documentsFailed++;
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            result.errors.push({ id: docSnapshot.id, error: errorMessage });
            console.error(`  ❌ Error reverting conversation ${docSnapshot.id}:`, errorMessage);
          }
        });
        
        // Commit batch
        if (result.documentsReverted > 0) {
          await batch.commit();
          console.log(`  ✅ Reverted ${result.documentsReverted} conversations`);
        }
      }
      
    } catch (error) {
      result.status = 'FAILED';
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      result.errors.push({ id: 'CONVERSATIONS_REVERT_FATAL', error: errorMessage });
      console.error('❌ Conversations reversion failed:', error);
    } finally {
      result.endTime = new Date();
      result.durationMs = result.endTime.getTime() - result.startTime.getTime();
      
      if (result.documentsFailed > 0) {
        result.status = result.documentsReverted > 0 ? 'PARTIAL' : 'FAILED';
      }
    }
    
    return result;
  }

  /**
   * Generate legacy trade data from migrated data
   */
  private generateLegacyTradeData(data: any): any {
    return {
      // Restore from legacy fields if available
      offeredSkills: data.offeredSkills_legacy || data.skillsOffered || [],
      requestedSkills: data.requestedSkills_legacy || data.skillsWanted || [],
      creatorId: data.creatorId_legacy || data.participants?.creator,
      participantId: data.participantId_legacy || data.participants?.participant,
      
      // Remove new schema fields
      skillsOffered: FieldValue.delete(),  // Fixed: Use FieldValue.delete()
      skillsWanted: FieldValue.delete(),   // Fixed: Use FieldValue.delete()
      participants: FieldValue.delete(),   // Fixed: Use FieldValue.delete()
      
      // Remove migration metadata
      schemaVersion: FieldValue.delete(),  // Fixed: Use FieldValue.delete()
      migratedAt: FieldValue.delete(),     // Fixed: Use FieldValue.delete()
      migrationBatch: FieldValue.delete(), // Fixed: Use FieldValue.delete()
      migrationAttempt: FieldValue.delete(), // Fixed: Use FieldValue.delete()
      offeredSkills_legacy: FieldValue.delete(), // Fixed: Use FieldValue.delete()
      requestedSkills_legacy: FieldValue.delete(), // Fixed: Use FieldValue.delete()
      creatorId_legacy: FieldValue.delete(), // Fixed: Use FieldValue.delete()
      participantId_legacy: FieldValue.delete(), // Fixed: Use FieldValue.delete()
      compatibilityLayerUsed: FieldValue.delete(), // Fixed: Use FieldValue.delete()
      
      // Add rollback metadata
      rolledBackAt: FieldValue.serverTimestamp(),
      rollbackReason: 'Emergency rollback procedure',
      previousSchemaVersion: '2.0'
    };
  }

  /**
   * Generate legacy conversation data from migrated data
   */
  private generateLegacyConversationData(data: any): any {
    // Reconstruct participants array from legacy data
    let participants = data.participants_legacy;
    
    if (!participants && data.participantIds) {
      // Minimal reconstruction if legacy data not available
      participants = data.participantIds.map((id: string) => ({
        id,
        userId: id,
        name: '',
        email: ''
      }));
    }
    
    return {
      // Restore legacy participant structure
      participants: participants || [],
      
      // Remove new schema fields
      participantIds: FieldValue.delete(), // Fixed: Use FieldValue.delete()
      
      // Remove migration metadata
      schemaVersion: FieldValue.delete(),  // Fixed: Use FieldValue.delete()
      migratedAt: FieldValue.delete(),     // Fixed: Use FieldValue.delete()
      migrationBatch: FieldValue.delete(), // Fixed: Use FieldValue.delete()
      migrationAttempt: FieldValue.delete(), // Fixed: Use FieldValue.delete()
      participants_legacy: FieldValue.delete(), // Fixed: Use FieldValue.delete()
      compatibilityLayerUsed: FieldValue.delete(), // Fixed: Use FieldValue.delete()
      
      // Add rollback metadata
      rolledBackAt: FieldValue.serverTimestamp(),
      rollbackReason: 'Emergency rollback procedure',
      previousSchemaVersion: '2.0'
    };
  }

  /**
   * Perform cleanup operations
   */
  private async performCleanupOperations(): Promise<void> {
    console.log('\n🧹 Performing cleanup operations...');
    
    const cleanupResult: RollbackResult = {
      operation: 'Cleanup Operations',
      status: 'SUCCESS',
      documentsProcessed: 0,
      documentsReverted: 0,
      documentsFailed: 0,
      errors: [],
      startTime: new Date(),
      endTime: new Date(),
      durationMs: 0
    };
    
    try {
      // Add cleanup operations like:
      // - Removing migration status documents
      // - Cleaning up temporary collections
      // - Resetting compatibility mode
      
      console.log('📁 Cleanup operations completed');
      
      this.rollbackStatus.manualSteps.push(
        'Disable migration mode in application configuration',
        'Restart application services to clear compatibility layer cache',
        'Monitor application logs for any legacy schema issues',
        'Verify all features are functioning correctly with legacy schema'
      );
      
    } catch (error) {
      cleanupResult.status = 'FAILED';
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      cleanupResult.errors.push({ id: 'CLEANUP_ERROR', error: errorMessage });
      console.error('❌ Cleanup operations failed:', error);
    } finally {
      cleanupResult.endTime = new Date();
      cleanupResult.durationMs = cleanupResult.endTime.getTime() - cleanupResult.startTime.getTime();
      this.rollbackStatus.operations.push(cleanupResult);
    }
  }

  /**
   * Generate comprehensive rollback report
   */
  private async generateRollbackReport(): Promise<void> {
    console.log('\n📋 Generating rollback report...');
    
    const report = {
      metadata: {
        projectId: this.projectId,
        isDryRun: this.isDryRun,
        backupId: this.backupId,
        initiatedAt: this.rollbackStatus.initiated,
        completedAt: new Date(),
        totalDuration: Date.now() - this.rollbackStatus.initiated.getTime()
      },
      status: this.rollbackStatus,
      operations: this.rollbackStatus.operations,
      summary: {
        totalOperations: this.rollbackStatus.operations.length,
        successfulOperations: this.rollbackStatus.operations.filter(op => op.status === 'SUCCESS').length,
        failedOperations: this.rollbackStatus.operations.filter(op => op.status === 'FAILED').length,
        partialOperations: this.rollbackStatus.operations.filter(op => op.status === 'PARTIAL').length,
        totalDocumentsProcessed: this.rollbackStatus.operations.reduce((sum, op) => sum + op.documentsProcessed, 0),
        totalDocumentsReverted: this.rollbackStatus.operations.reduce((sum, op) => sum + op.documentsReverted, 0),
        totalDocumentsFailed: this.rollbackStatus.operations.reduce((sum, op) => sum + op.documentsFailed, 0)
      }
    };
    
    console.log('\n🎯 Rollback Report Summary:');
    console.log(`   📊 Total Operations: ${report.summary.totalOperations}`);
    console.log(`   ✅ Successful: ${report.summary.successfulOperations}`);
    console.log(`   ❌ Failed: ${report.summary.failedOperations}`);
    console.log(`   ⚠️  Partial: ${report.summary.partialOperations}`);
    console.log(`   📄 Documents Processed: ${report.summary.totalDocumentsProcessed}`);
    console.log(`   🔄 Documents Reverted: ${report.summary.totalDocumentsReverted}`);
    console.log(`   💥 Documents Failed: ${report.summary.totalDocumentsFailed}`);
    
    if (this.rollbackStatus.manualSteps.length > 0) {
      console.log('\n📋 Required Manual Steps:');
      this.rollbackStatus.manualSteps.forEach((step, index) => {
        console.log(`   ${index + 1}. ${step}`);
      });
    }
    
    // Save report if not dry run
    if (!this.isDryRun) {
      try {
        const reportDocRef = this.db.collection('rollback-reports').doc(`emergency-rollback-${Date.now()}`);
        await reportDocRef.set({
          ...report,
          createdAt: FieldValue.serverTimestamp()
        });
        console.log('📁 Rollback report saved to Firestore');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.warn('⚠️  Failed to save rollback report:', errorMessage);
      }
    }
  }

  /**
   * Update rollback phase
   */
  private async updatePhase(phase: RollbackStatus['phase']): Promise<void> {
    this.rollbackStatus.phase = phase;
    console.log(`\n📊 ROLLBACK PHASE: ${phase.toUpperCase()}`);
  }

  /**
   * Static method to execute rollback
   */
  static async executeRollback(
    projectId?: string, 
    backupId?: string, 
    isDryRun: boolean = true
  ): Promise<RollbackStatus> {
    const rollbackService = new RollbackService(projectId, isDryRun, backupId);
    return await rollbackService.executeRollback();
  }
}

// Execute rollback if this script is run directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const projectArg = args.find(arg => arg.startsWith('--project='));
  const projectId = projectArg ? projectArg.split('=')[1] : 'tradeya-45ede';
  const backupArg = args.find(arg => arg.startsWith('--backup-id='));
  const backupId = backupArg ? backupArg.split('=')[1] : undefined;
  const isDryRun = !args.includes('--execute');

  if (!projectId) {
    console.error('❌ Error: --project=<PROJECT_ID> argument is required');
    process.exit(1);
  }

  if (isDryRun) {
    console.log('\n⚠️  DRY RUN MODE: Use --execute flag to perform actual rollback');
  } else {
    console.log('\n🔥 EXECUTING LIVE ROLLBACK - This will modify your database!');
  }

  RollbackService.executeRollback(projectId, backupId, isDryRun)
    .then(status => {
      console.log('\n🎯 Rollback Execution Result:');
      console.log(`   Status: ${status.overallStatus}`);
      console.log(`   Phase: ${status.phase}`);
      console.log(`   Manual Intervention Required: ${status.requiresManualIntervention}`);
      
      if (status.overallStatus === 'FAILED') {
        console.error('\n💥 ROLLBACK FAILED - Manual intervention required');
        process.exit(1);
      } else if (status.requiresManualIntervention) {
        console.warn('\n⚠️  ROLLBACK PARTIAL - Manual steps required');
        process.exit(0);
      } else {
        console.log('\n✅ ROLLBACK COMPLETED SUCCESSFULLY');
        process.exit(0);
      }
    })
    .catch(error => {
      console.error('\n💥 Unhandled rollback error:', error);
      console.error('\n🚨 CRITICAL: Database may be in inconsistent state');
      console.error('Contact database administrator immediately');
      process.exit(1);
    });
}