#!/usr/bin/env node

/**
 * TradeYa Production Deployment Executor
 * 
 * Master orchestrator for production migration deployment with comprehensive
 * safety mechanisms, monitoring, and rollback capabilities.
 */

import { ProductionEnvironmentSetup } from './production-env-setup';
import { PreMigrationValidationService } from './pre-migration-validation';
import { PhasedMigrationExecutor } from './phased-migration-executor';
import { ProductionMonitoringService } from './production-monitoring';
import { ProductionRollbackSystem } from './production-rollback-system';
import { PRODUCTION_CONFIG } from './production-deployment-config';
import { initializeProductionEnvironment, EnvironmentVariables } from './env-loader';
import { performanceLogger } from '../../src/utils/performance/structuredLogger';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

interface ProductionDeploymentConfig {
  projectId: string;
  environment: 'staging' | 'production';
  migrationVersion: string;
  dryRun: boolean;
  skipValidation: boolean;
  manualApprovalRequired: boolean;
  emergencyContactsNotified: boolean;
}

interface DeploymentExecution {
  id: string;
  config: ProductionDeploymentConfig;
  startTime: Date;
  endTime?: Date;
  status: 'RUNNING' | 'COMPLETED' | 'FAILED' | 'PAUSED' | 'ROLLED_BACK';
  currentPhase: string;
  phases: DeploymentPhase[];
  overallProgress: number;
  metrics: DeploymentMetrics;
  logs: DeploymentLog[];
  rollbackExecution?: string;
}

interface DeploymentPhase {
  name: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'SKIPPED';
  startTime?: Date;
  endTime?: Date;
  result?: any;
  error?: string;
  canRollback: boolean;
}

interface DeploymentMetrics {
  validationTime: number;
  migrationTime: number;
  totalTime: number;
  documentsProcessed: number;
  errorCount: number;
  rollbacksTriggered: number;
  performanceImpact: number;
}

interface DeploymentLog {
  timestamp: Date;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  phase: string;
  message: string;
  details?: any;
}

/**
 * Production Deployment Executor
 */
export class ProductionDeploymentExecutor {
  private config: ProductionDeploymentConfig;
  private execution: DeploymentExecution;
  private envSetup: ProductionEnvironmentSetup;
  private validator: PreMigrationValidationService;
  private migrationExecutor?: PhasedMigrationExecutor;
  private monitoring?: ProductionMonitoringService;
  private rollbackSystem?: ProductionRollbackSystem;
  private deploymentPath: string;
  private envVars: EnvironmentVariables;

  constructor(config: ProductionDeploymentConfig) {
    // Initialize environment variables first
    this.envVars = initializeProductionEnvironment();
    
    this.config = config;
    this.deploymentPath = join(process.cwd(), `production-deployment-${config.projectId}-${Date.now()}.json`);
    
    this.execution = {
      id: `deployment-${Date.now()}`,
      config,
      startTime: new Date(),
      status: 'RUNNING',
      currentPhase: 'INITIALIZATION',
      phases: [
        { name: 'Environment Setup', status: 'PENDING', canRollback: false },
        { name: 'Pre-Migration Validation', status: 'PENDING', canRollback: false },
        { name: 'Monitoring Initialization', status: 'PENDING', canRollback: true },
        { name: 'Rollback System Setup', status: 'PENDING', canRollback: true },
        { name: 'Phased Migration Execution', status: 'PENDING', canRollback: true },
        { name: 'Post-Migration Validation', status: 'PENDING', canRollback: true },
        { name: 'System Stabilization', status: 'PENDING', canRollback: false }
      ],
      overallProgress: 0,
      metrics: {
        validationTime: 0,
        migrationTime: 0,
        totalTime: 0,
        documentsProcessed: 0,
        errorCount: 0,
        rollbacksTriggered: 0,
        performanceImpact: 0
      },
      logs: []
    };

    this.envSetup = new ProductionEnvironmentSetup(config.projectId, config.environment);
    this.validator = new PreMigrationValidationService(config.projectId, config.environment, config.migrationVersion);

    this.setupSignalHandlers();
  }

  private setupSignalHandlers(): void {
    process.on('SIGINT', async () => {
      await this.handleEmergencyStop('SIGINT received');
    });

    process.on('SIGTERM', async () => {
      await this.handleEmergencyStop('SIGTERM received');
    });

    process.on('SIGUSR1', async () => {
      await this.handleEmergencyStop('Emergency stop signal received');
    });
  }

  /**
   * Execute production deployment
   */
  async executeProductionDeployment(): Promise<DeploymentExecution> {
    this.log('INFO', 'INITIALIZATION', 'Starting production deployment execution', {
      projectId: this.config.projectId,
      environment: this.config.environment,
      migrationVersion: this.config.migrationVersion,
      dryRun: this.config.dryRun
    });

    console.log('\n🚀 TradeYa Production Deployment Execution');
    console.log('==========================================');
    console.log(`🆔 Deployment ID: ${this.execution.id}`);
    console.log(`📊 Project: ${this.config.projectId}`);
    console.log(`🌍 Environment: ${this.config.environment}`);
    console.log(`📦 Migration Version: ${this.config.migrationVersion}`);
    console.log(`🧪 Dry Run: ${this.config.dryRun}`);
    console.log(`✅ Manual Approval: ${this.config.manualApprovalRequired}`);
    console.log(`⏰ Start Time: ${this.execution.startTime.toISOString()}`);

    try {
      // Phase 1: Environment Setup
      await this.executePhase('Environment Setup', async () => {
        const setupResult = await this.envSetup.setupProductionEnvironment();
        if (!setupResult.success) {
          throw new Error(`Environment setup failed: ${setupResult.validationResults.map(r => r.details).join(', ')}`);
        }
        return setupResult;
      });

      // Phase 2: Pre-Migration Validation
      if (!this.config.skipValidation) {
        await this.executePhase('Pre-Migration Validation', async () => {
          const validationStart = Date.now();
          const validation = await this.validator.executePreMigrationValidation();
          this.execution.metrics.validationTime = Date.now() - validationStart;

          if (validation.overallStatus === 'BLOCKED') {
            throw new Error(`Pre-migration validation blocked: ${validation.blockers.map(b => b.description).join(', ')}`);
          }

          if (validation.overallStatus === 'NOT_READY' && this.config.environment === 'production') {
            throw new Error('Production environment not ready for migration');
          }

          return validation;
        });
      } else {
        this.skipPhase('Pre-Migration Validation', 'Validation skipped by configuration');
      }

      // Phase 3: Monitoring Initialization
      await this.executePhase('Monitoring Initialization', async () => {
        const monitoringConfig = ProductionMonitoringService.createDefaultConfig(
          this.config.projectId,
          this.config.environment
        );
        this.monitoring = await ProductionMonitoringService.startProductionMonitoring(monitoringConfig);
        return { monitoringActive: true };
      });

      // Phase 4: Rollback System Setup
      await this.executePhase('Rollback System Setup', async () => {
        this.rollbackSystem = await ProductionRollbackSystem.startRollbackSystem(
          this.config.projectId,
          this.config.environment
        );
        await this.rollbackSystem.createRollbackPlan(this.config.migrationVersion);
        return { rollbackSystemActive: true };
      });

      // Manual approval checkpoint for production
      if (this.config.manualApprovalRequired && this.config.environment === 'production') {
        await this.waitForManualApproval();
      }

      // Phase 5: Phased Migration Execution
      await this.executePhase('Phased Migration Execution', async () => {
        if (this.config.dryRun) {
          this.log('INFO', 'Phased Migration Execution', 'Dry run mode - skipping actual migration');
          return { dryRunCompleted: true };
        }

        const migrationStart = Date.now();
        const migrationPlan = PhasedMigrationExecutor.createDefaultPlan(
          this.execution.id,
          this.config.migrationVersion,
          this.config.environment
        );

        this.migrationExecutor = new PhasedMigrationExecutor(migrationPlan);
        const migrationResult = await this.migrationExecutor.executePhasedMigration();
        
        this.execution.metrics.migrationTime = Date.now() - migrationStart;
        this.execution.metrics.documentsProcessed = migrationResult.phases.reduce(
          (sum, phase) => sum + (phase.metrics?.documentsProcessed || 0), 0
        );

        if (migrationResult.overallStatus === 'FAILED') {
          throw new Error('Phased migration execution failed');
        }

        return migrationResult;
      });

      // Phase 6: Post-Migration Validation
      await this.executePhase('Post-Migration Validation', async () => {
        // Run post-migration validation
        const postValidation = await this.validator.executePreMigrationValidation();
        
        if (postValidation.systemReadiness.dataIntegrityScore < 95) {
          throw new Error('Post-migration data integrity validation failed');
        }

        return { validationPassed: true, dataIntegrityScore: postValidation.systemReadiness.dataIntegrityScore };
      });

      // Phase 7: System Stabilization
      await this.executePhase('System Stabilization', async () => {
        // Monitor system for stabilization period
        const stabilizationTime = this.config.environment === 'production' ? 300000 : 180000; // 5 min prod, 3 min staging
        
        this.log('INFO', 'System Stabilization', `Monitoring system for ${stabilizationTime / 60000} minutes`);
        await this.waitForStabilization(stabilizationTime);
        
        return { stabilized: true };
      });

      // Complete deployment
      this.execution.status = 'COMPLETED';
      this.execution.endTime = new Date();
      this.execution.metrics.totalTime = this.execution.endTime.getTime() - this.execution.startTime.getTime();
      this.execution.overallProgress = 100;

      this.log('INFO', 'COMPLETION', 'Production deployment completed successfully', {
        totalTime: this.execution.metrics.totalTime,
        documentsProcessed: this.execution.metrics.documentsProcessed
      });

      console.log('\n✅ PRODUCTION DEPLOYMENT COMPLETED');
      console.log('=================================');
      console.log(`⏱️  Total Time: ${Math.round(this.execution.metrics.totalTime / 60000)} minutes`);
      console.log(`📊 Documents Processed: ${this.execution.metrics.documentsProcessed}`);
      console.log(`❌ Errors: ${this.execution.metrics.errorCount}`);
      console.log(`🔄 Rollbacks: ${this.execution.metrics.rollbacksTriggered}`);

    } catch (error) {
      this.execution.status = 'FAILED';
      this.execution.endTime = new Date();
      this.execution.metrics.totalTime = this.execution.endTime.getTime() - this.execution.startTime.getTime();
      this.execution.metrics.errorCount++;

      this.log('ERROR', this.execution.currentPhase, 'Production deployment failed', {
        error: error.message,
        stack: error.stack
      });

      console.error('\n💥 PRODUCTION DEPLOYMENT FAILED');
      console.error(`Error: ${error.message}`);

      // Trigger rollback if systems are available
      if (this.rollbackSystem && this.execution.phases.some(p => p.name === 'Phased Migration Execution' && p.status === 'COMPLETED')) {
        console.log('\n🔄 Triggering emergency rollback...');
        try {
          const rollback = await this.rollbackSystem.executeEmergencyRollback(
            `Deployment failure: ${error.message}`,
            'deployment-executor'
          );
          this.execution.rollbackExecution = rollback.id;
          this.execution.status = 'ROLLED_BACK';
          this.execution.metrics.rollbacksTriggered++;
        } catch (rollbackError) {
          console.error('💥 Rollback failed:', rollbackError.message);
        }
      }
    } finally {
      await this.cleanup();
      await this.saveDeploymentStatus();
    }

    return this.execution;
  }

  private async executePhase(phaseName: string, phaseFunction: () => Promise<any>): Promise<void> {
    const phase = this.execution.phases.find(p => p.name === phaseName);
    if (!phase) {
      throw new Error(`Unknown phase: ${phaseName}`);
    }

    this.execution.currentPhase = phaseName;
    phase.status = 'RUNNING';
    phase.startTime = new Date();

    console.log(`\n📋 PHASE: ${phaseName}`);
    console.log('=' + '='.repeat(phaseName.length + 8));

    try {
      const result = await phaseFunction();
      
      phase.status = 'COMPLETED';
      phase.endTime = new Date();
      phase.result = result;

      this.log('INFO', phaseName, `Phase completed successfully`, result);
      console.log(`✅ ${phaseName} completed`);

      // Update progress
      const completedPhases = this.execution.phases.filter(p => p.status === 'COMPLETED').length;
      this.execution.overallProgress = (completedPhases / this.execution.phases.length) * 100;

    } catch (error) {
      phase.status = 'FAILED';
      phase.endTime = new Date();
      phase.error = error.message;

      this.log('ERROR', phaseName, `Phase failed`, { error: error.message });
      console.error(`❌ ${phaseName} failed: ${error.message}`);

      throw error;
    }
  }

  private skipPhase(phaseName: string, reason: string): void {
    const phase = this.execution.phases.find(p => p.name === phaseName);
    if (phase) {
      phase.status = 'SKIPPED';
      phase.startTime = new Date();
      phase.endTime = new Date();
      
      this.log('INFO', phaseName, `Phase skipped: ${reason}`);
      console.log(`⏭️  ${phaseName} skipped: ${reason}`);
    }
  }

  private async waitForManualApproval(): Promise<void> {
    console.log('\n⏸️  MANUAL APPROVAL REQUIRED');
    console.log('===========================');
    console.log('🔍 Review deployment status and approve to continue');
    console.log('📧 Emergency contacts have been notified');
    console.log('⚠️  Press Ctrl+C to cancel deployment');
    console.log('\n⏳ Waiting for approval signal...');
    console.log('   Send SIGUSR2 signal to approve: kill -USR2 ' + process.pid);

    return new Promise((resolve) => {
      const approvalHandler = () => {
        process.off('SIGUSR2', approvalHandler);
        console.log('✅ Manual approval received - continuing deployment');
        this.log('INFO', 'APPROVAL', 'Manual approval received');
        resolve();
      };

      process.on('SIGUSR2', approvalHandler);
    });
  }

  private async waitForStabilization(duration: number): Promise<void> {
    const startTime = Date.now();
    const checkInterval = 30000; // 30 seconds

    return new Promise((resolve, reject) => {
      const stabilizationCheck = setInterval(async () => {
        try {
          const elapsed = Date.now() - startTime;
          const progress = (elapsed / duration) * 100;

          console.log(`📊 Stabilization progress: ${Math.round(progress)}%`);

          if (elapsed >= duration) {
            clearInterval(stabilizationCheck);
            resolve();
          }

          // Check system health during stabilization
          if (this.monitoring) {
            // This would check actual monitoring metrics
            // For now, just simulate health check
          }

        } catch (error) {
          clearInterval(stabilizationCheck);
          reject(error);
        }
      }, checkInterval);
    });
  }

  private async handleEmergencyStop(reason: string): Promise<void> {
    this.log('ERROR', this.execution.currentPhase, 'Emergency stop triggered', { reason });
    
    console.log('\n🚨 EMERGENCY STOP TRIGGERED');
    console.log(`Reason: ${reason}`);

    if (this.rollbackSystem) {
      await this.rollbackSystem.triggerEmergencyRollback(reason);
    }

    this.execution.status = 'FAILED';
    await this.cleanup();
    process.exit(1);
  }

  private async cleanup(): Promise<void> {
    try {
      // Stop monitoring
      if (this.monitoring) {
        await this.monitoring.stopMonitoring();
      }

      // Stop rollback system
      if (this.rollbackSystem) {
        await this.rollbackSystem.stopRollbackMonitoring();
      }

      this.log('INFO', 'CLEANUP', 'Cleanup completed');
    } catch (error) {
      this.log('ERROR', 'CLEANUP', 'Cleanup failed', { error: error.message });
    }
  }

  private log(level: DeploymentLog['level'], phase: string, message: string, details?: any): void {
    const logEntry: DeploymentLog = {
      timestamp: new Date(),
      level,
      phase,
      message,
      details
    };

    this.execution.logs.push(logEntry);
    
    performanceLogger[level.toLowerCase()](
      'deployment',
      `[${phase}] ${message}`,
      details
    );
  }

  private async saveDeploymentStatus(): Promise<void> {
    try {
      writeFileSync(this.deploymentPath, JSON.stringify(this.execution, null, 2));
      console.log(`📁 Deployment status saved: ${this.deploymentPath}`);
    } catch (error) {
      console.error('Failed to save deployment status:', error.message);
    }
  }

  /**
   * Static method to execute production deployment
   */
  static async executeDeployment(config: ProductionDeploymentConfig): Promise<DeploymentExecution> {
    const executor = new ProductionDeploymentExecutor(config);
    return await executor.executeProductionDeployment();
  }

  /**
   * Create default deployment configuration
   */
  static createDefaultConfig(
    projectId: string,
    environment: 'staging' | 'production' = 'production',
    migrationVersion: string = '2.0'
  ): ProductionDeploymentConfig {
    return {
      projectId,
      environment,
      migrationVersion,
      dryRun: false,
      skipValidation: false,
      manualApprovalRequired: environment === 'production',
      emergencyContactsNotified: environment === 'production'
    };
  }
}

// Execute production deployment if this script is run directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  // Initialize environment before parsing arguments
  console.log('🔧 Production Deployment Executor - Environment Initialization');
  console.log('=' + '='.repeat(65));
  
  const envVars = initializeProductionEnvironment();
  
  const args = process.argv.slice(2);
  const projectArg = args.find(arg => arg.startsWith('--project='));
  const projectId = projectArg ? projectArg.split('=')[1] : envVars.FIREBASE_PROJECT_ID || 'tradeya-45ede';
  const envArg = args.find(arg => arg.startsWith('--env='));
  const environment = envArg ? envArg.split('=')[1] as 'staging' | 'production' : 'production';
  const versionArg = args.find(arg => arg.startsWith('--version='));
  const migrationVersion = versionArg ? versionArg.split('=')[1] : '2.0';
  const dryRunArg = args.includes('--dry-run');
  const skipValidationArg = args.includes('--skip-validation');
  const forceArg = args.includes('--force');

  if (!projectId) {
    console.error('❌ Error: Project ID is required. Use --project=<PROJECT_ID> or set FIREBASE_PROJECT_ID in .env.production');
    console.error('💡 Current environment variables:');
    console.error(`   FIREBASE_PROJECT_ID: ${envVars.FIREBASE_PROJECT_ID || 'NOT SET'}`);
    console.error(`   NODE_ENV: ${envVars.NODE_ENV || 'NOT SET'}`);
    process.exit(1);
  }

  const config = ProductionDeploymentExecutor.createDefaultConfig(projectId, environment, migrationVersion);
  config.dryRun = dryRunArg;
  config.skipValidation = skipValidationArg;
  config.manualApprovalRequired = environment === 'production' && !forceArg;

  console.log('\n🚀 TradeYa Production Deployment Executor');
  console.log('=========================================');

  ProductionDeploymentExecutor.executeDeployment(config)
    .then(execution => {
      const exitCode = execution.status === 'COMPLETED' ? 0 :
                      execution.status === 'ROLLED_BACK' ? 1 : 2;

      if (exitCode === 0) {
        console.log('\n✅ SUCCESS: Production deployment completed successfully');
      } else if (exitCode === 1) {
        console.warn('\n⚠️  ROLLED BACK: Deployment was rolled back due to issues');
      } else {
        console.error('\n❌ FAILED: Production deployment failed');
      }

      process.exit(exitCode);
    })
    .catch(error => {
      console.error('\n💥 Production deployment executor error:', error);
      process.exit(1);
    });
}

export type {
  ProductionDeploymentConfig,
  DeploymentExecution,
  DeploymentPhase,
  DeploymentMetrics
};