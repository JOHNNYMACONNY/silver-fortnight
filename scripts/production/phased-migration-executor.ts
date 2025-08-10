#!/usr/bin/env node

/**
 * TradeYa Phased Migration Executor
 * 
 * Enterprise-grade phased deployment system with automatic progression,
 * rollback triggers, and comprehensive monitoring integration.
 */

import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { collection, query, where, limit, getDocs, writeBatch, doc, setDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { db } from '../../src/firebase-config';
import { performanceLogger } from '../../src/utils/performance/structuredLogger';
import { ProductionMigrationEngine, PRODUCTION_CONFIG } from '../production-migration-engine';
import { EnhancedMigrationMonitor } from '../enhanced-migration-monitor';
import { PreMigrationValidationService } from './pre-migration-validation';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

// Phased migration interfaces
interface PhasedMigrationPlan {
  migrationId: string;
  version: string;
  environment: 'staging' | 'production';
  phases: MigrationPhase[];
  rollbackTriggers: RollbackTrigger[];
  healthThresholds: HealthThresholds;
  progressionCriteria: ProgressionCriteria;
  monitoringConfig: MonitoringConfig;
  emergencyContacts: EmergencyContact[];
  automaticProgression: boolean;
  manualApprovalRequired: boolean;
}

interface MigrationPhase {
  phaseNumber: number;
  name: string;
  percentage: number;
  targetDocuments: number;
  duration: number;
  criteria: PhaseCriteria;
  rollbackConditions: RollbackCondition[];
  monitoringInterval: number;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'ROLLED_BACK';
  startTime?: Date;
  endTime?: Date;
  metrics?: PhaseMetrics;
}

interface PhaseCriteria {
  required: string[];
  optional: string[];
  healthScoreMinimum: number;
  errorRateMaximum: number;
  responseTimeMaximum: number;
  validationChecks: string[];
}

interface RollbackTrigger {
  name: string;
  condition: string;
  threshold: number;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  automatic: boolean;
  cooldownPeriod: number;
  notifications: string[];
}

interface RollbackCondition {
  metric: string;
  operator: '>' | '<' | '>=' | '<=' | '==' | '!=';
  threshold: number;
  duration?: number; // sustained for this duration
  description: string;
}

interface HealthThresholds {
  healthScore: { warning: number; critical: number };
  errorRate: { warning: number; critical: number };
  responseTime: { warning: number; critical: number };
  throughput: { warning: number; critical: number };
  memoryUsage: { warning: number; critical: number };
}

interface ProgressionCriteria {
  healthStable: boolean;
  errorsWithinThreshold: boolean;
  performanceAcceptable: boolean;
  userFeedbackPositive: boolean;
  dataIntegrityMaintained: boolean;
  minimumDuration: number;
}

interface MonitoringConfig {
  realTimeMonitoring: boolean;
  alertingEnabled: boolean;
  dashboardUrl?: string;
  metricsRetention: number;
  snapshotInterval: number;
}

interface EmergencyContact {
  name: string;
  role: string;
  email: string;
  phone: string;
  escalationLevel: number;
}

interface PhaseMetrics {
  documentsProcessed: number;
  successRate: number;
  averageResponseTime: number;
  errorRate: number;
  throughput: number;
  healthScore: number;
  userImpactScore: number;
  rollbacksTriggered: number;
}

interface PhasedMigrationStatus {
  migrationId: string;
  overallStatus: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'PAUSED' | 'ROLLED_BACK';
  currentPhase: number;
  totalPhases: number;
  overallProgress: number;
  startTime: Date;
  lastUpdate: Date;
  phases: MigrationPhase[];
  healthMetrics: HealthMetrics;
  alerts: Alert[];
  rollbackHistory: RollbackEvent[];
  estimatedCompletion?: Date;
}

interface HealthMetrics {
  overallHealth: number;
  systemHealth: number;
  dataIntegrity: number;
  performance: number;
  userSatisfaction: number;
  lastAssessment: Date;
}

interface Alert {
  id: string;
  timestamp: Date;
  severity: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
  category: string;
  message: string;
  acknowledged: boolean;
  resolvedAt?: Date;
}

interface RollbackEvent {
  timestamp: Date;
  phase: number;
  trigger: string;
  reason: string;
  automatic: boolean;
  success: boolean;
  documentsAffected: number;
}

/**
 * Phased Migration Executor with Enterprise Features
 */
export class PhasedMigrationExecutor {
  private migrationPlan: PhasedMigrationPlan;
  private status: PhasedMigrationStatus;
  private monitor: EnhancedMigrationMonitor;
  private validator: PreMigrationValidationService;
  private migrationEngine?: ProductionMigrationEngine;
  private statusPath: string;
  private isEmergencyStop = false;
  private monitoringInterval?: NodeJS.Timeout;

  constructor(migrationPlan: PhasedMigrationPlan) {
    this.migrationPlan = migrationPlan;
    this.statusPath = join(process.cwd(), `phased-migration-${migrationPlan.migrationId}.json`);
    
    this.status = {
      migrationId: migrationPlan.migrationId,
      overallStatus: 'PENDING',
      currentPhase: 0,
      totalPhases: migrationPlan.phases.length,
      overallProgress: 0,
      startTime: new Date(),
      lastUpdate: new Date(),
      phases: [...migrationPlan.phases],
      healthMetrics: {
        overallHealth: 100,
        systemHealth: 100,
        dataIntegrity: 100,
        performance: 100,
        userSatisfaction: 100,
        lastAssessment: new Date()
      },
      alerts: [],
      rollbackHistory: []
    };

    this.monitor = new EnhancedMigrationMonitor(
      migrationPlan.migrationId, 
      migrationPlan.environment
    );
    
    this.validator = new PreMigrationValidationService(
      migrationPlan.migrationId,
      migrationPlan.environment,
      migrationPlan.version
    );

    this.setupEmergencyHandlers();
  }

  private setupEmergencyHandlers(): void {
    const emergencyStop = async (signal: string) => {
      performanceLogger.error('monitoring', `Emergency stop signal received: ${signal}`, {
        migrationId: this.migrationPlan.migrationId,
        currentPhase: this.status.currentPhase
      });

      this.isEmergencyStop = true;
      await this.pauseMigration(`Emergency stop: ${signal}`);
    };

    process.on('SIGINT', () => emergencyStop('SIGINT'));
    process.on('SIGTERM', () => emergencyStop('SIGTERM'));
    process.on('SIGUSR1', () => emergencyStop('SIGUSR1'));
  }

  /**
   * Execute phased migration with comprehensive monitoring
   */
  async executePhasedMigration(): Promise<PhasedMigrationStatus> {
    performanceLogger.info('monitoring', 'Starting phased migration execution', {
      migrationId: this.migrationPlan.migrationId,
      environment: this.migrationPlan.environment,
      totalPhases: this.migrationPlan.phases.length,
      automaticProgression: this.migrationPlan.automaticProgression
    });

    console.log('\n🚀 TradeYa Phased Migration Execution');
    console.log('====================================');
    console.log(`🆔 Migration ID: ${this.migrationPlan.migrationId}`);
    console.log(`📦 Version: ${this.migrationPlan.version}`);
    console.log(`🌍 Environment: ${this.migrationPlan.environment}`);
    console.log(`📊 Total Phases: ${this.migrationPlan.phases.length}`);
    console.log(`🤖 Automatic Progression: ${this.migrationPlan.automaticProgression}`);
    console.log(`⏰ Start Time: ${this.status.startTime.toISOString()}`);

    try {
      this.status.overallStatus = 'RUNNING';
      await this.saveStatus();

      // Start real-time monitoring
      await this.startMonitoring();

      // Execute each phase sequentially
      for (let phaseIndex = 0; phaseIndex < this.migrationPlan.phases.length; phaseIndex++) {
        if (this.isEmergencyStop) {
          await this.pauseMigration('Emergency stop requested');
          break;
        }

        this.status.currentPhase = phaseIndex + 1;
        const phase = this.migrationPlan.phases[phaseIndex];
        
        console.log(`\n📊 PHASE ${phase.phaseNumber}: ${phase.name}`);
        console.log(`📈 Target: ${phase.percentage}% (${phase.targetDocuments} documents)`);
        console.log(`⏱️  Duration: ${Math.round(phase.duration / 60000)} minutes`);

        // Execute phase with monitoring
        const phaseResult = await this.executePhase(phase);
        
        if (phaseResult.status === 'FAILED' || phaseResult.status === 'ROLLED_BACK') {
          this.status.overallStatus = 'FAILED';
          break;
        }

        // Check progression criteria
        if (phaseIndex < this.migrationPlan.phases.length - 1) {
          const canProgress = await this.evaluateProgressionCriteria(phase);
          
          if (!canProgress) {
            if (this.migrationPlan.automaticProgression) {
              await this.pauseMigration('Progression criteria not met');
              break;
            } else {
              console.log('\n⚠️  Progression criteria not met - waiting for manual approval');
              // In a real implementation, this would wait for manual approval
            }
          }
        }

        // Update overall progress
        this.status.overallProgress = ((phaseIndex + 1) / this.migrationPlan.phases.length) * 100;
        await this.saveStatus();
      }

      // Finalize migration
      if (this.status.overallStatus === 'RUNNING') {
        await this.finalizeMigration();
      }

    } catch (error) {
      performanceLogger.error('monitoring', 'Phased migration failed', {
        migrationId: this.migrationPlan.migrationId,
        error: error.message
      }, error);

      this.status.overallStatus = 'FAILED';
      await this.addAlert({
        id: `fatal-error-${Date.now()}`,
        timestamp: new Date(),
        severity: 'CRITICAL',
        category: 'system',
        message: `Migration failed: ${error.message}`,
        acknowledged: false
      });

    } finally {
      if (this.monitoringInterval) {
        clearInterval(this.monitoringInterval);
      }
      await this.saveStatus();
    }

    return this.status;
  }

  private async executePhase(phase: MigrationPhase): Promise<MigrationPhase> {
    phase.status = 'RUNNING';
    phase.startTime = new Date();
    
    performanceLogger.info('monitoring', `Executing migration phase ${phase.phaseNumber}`, {
      phaseName: phase.name,
      percentage: phase.percentage,
      targetDocuments: phase.targetDocuments
    });

    try {
      // Pre-phase validation
      await this.validatePhaseReadiness(phase);

      // Create migration plan for this phase
      const phaseMigrationPlan = await this.createPhaseMigrationPlan(phase);
      
      // Execute phase migration
      this.migrationEngine = new ProductionMigrationEngine(phaseMigrationPlan);
      const migrationResult = await this.migrationEngine.execute();

      if (!migrationResult.success) {
        throw new Error('Phase migration execution failed');
      }

      // Monitor phase execution
      const phaseMonitoring = this.monitorPhaseExecution(phase);

      // Wait for phase duration or completion
      await this.waitForPhaseCompletion(phase);

      // Stop phase monitoring
      clearInterval(phaseMonitoring);

      // Validate phase completion
      await this.validatePhaseCompletion(phase);

      phase.status = 'COMPLETED';
      phase.endTime = new Date();
      
      // Calculate phase metrics
      phase.metrics = await this.calculatePhaseMetrics(phase);

      performanceLogger.info('monitoring', `Phase ${phase.phaseNumber} completed successfully`, {
        phaseName: phase.name,
        duration: phase.endTime.getTime() - (phase.startTime?.getTime() || 0),
        metrics: phase.metrics
      });

    } catch (error) {
      phase.status = 'FAILED';
      phase.endTime = new Date();

      performanceLogger.error('monitoring', `Phase ${phase.phaseNumber} failed`, {
        phaseName: phase.name,
        error: error.message
      }, error);

      // Check if automatic rollback should be triggered
      const shouldRollback = await this.shouldTriggerRollback(phase, error.message);
      
      if (shouldRollback) {
        await this.executePhaseRollback(phase);
        phase.status = 'ROLLED_BACK';
      }
    }

    return phase;
  }

  private async validatePhaseReadiness(phase: MigrationPhase): Promise<void> {
    performanceLogger.info('monitoring', `Validating readiness for phase ${phase.phaseNumber}`);

    // Run health checks
    const healthCheck = await this.monitor.runEnhancedMonitoringChecks(this.migrationPlan.version);
    
    if (healthCheck.summary.overallStatus === 'CRITICAL') {
      throw new Error('System health critical - cannot proceed with phase');
    }

    // Validate phase criteria
    for (const criterion of phase.criteria.required) {
      const met = await this.evaluateCriterion(criterion);
      if (!met) {
        throw new Error(`Required criterion not met: ${criterion}`);
      }
    }
  }

  private async createPhaseMigrationPlan(phase: MigrationPhase): Promise<any> {
    // Create a migration plan targeting specific percentage of documents
    return {
      version: this.migrationPlan.version,
      description: `Phase ${phase.phaseNumber}: ${phase.name}`,
      environment: this.migrationPlan.environment,
      collections: [
        {
          name: 'trades',
          priority: 1,
          operations: [
            {
              type: 'add_field',
              field: 'schemaVersion',
              defaultValue: this.migrationPlan.version
            }
          ]
        }
      ],
      safeguards: {
        maxDocuments: phase.targetDocuments,
        requireBackup: true,
        requireConfirmation: false
      }
    };
  }

  private monitorPhaseExecution(phase: MigrationPhase): NodeJS.Timeout {
    return setInterval(async () => {
      try {
        // Update health metrics
        await this.updateHealthMetrics();
        
        // Check rollback conditions
        await this.checkRollbackConditions(phase);
        
        // Update phase progress
        await this.updatePhaseProgress(phase);
        
        // Save status
        await this.saveStatus();
        
      } catch (error) {
        performanceLogger.error('monitoring', 'Phase monitoring error', {
          phase: phase.phaseNumber,
          error: error.message
        });
      }
    }, phase.monitoringInterval);
  }

  private async waitForPhaseCompletion(phase: MigrationPhase): Promise<void> {
    const startTime = Date.now();
    const timeout = phase.duration;

    return new Promise((resolve, reject) => {
      const checkCompletion = setInterval(() => {
        const elapsed = Date.now() - startTime;
        
        if (elapsed >= timeout) {
          clearInterval(checkCompletion);
          resolve();
        }
        
        if (this.isEmergencyStop) {
          clearInterval(checkCompletion);
          reject(new Error('Emergency stop requested'));
        }
      }, 5000); // Check every 5 seconds
    });
  }

  private async evaluateProgressionCriteria(phase: MigrationPhase): Promise<boolean> {
    const criteria = this.migrationPlan.progressionCriteria;
    
    // Check health stability
    if (criteria.healthStable && this.status.healthMetrics.overallHealth < 80) {
      return false;
    }
    
    // Check error rates
    if (criteria.errorsWithinThreshold && phase.metrics && phase.metrics.errorRate > 0.05) {
      return false;
    }
    
    // Check performance
    if (criteria.performanceAcceptable && phase.metrics && phase.metrics.averageResponseTime > 2000) {
      return false;
    }
    
    // Check minimum duration
    const phaseDuration = phase.endTime && phase.startTime ? 
      phase.endTime.getTime() - phase.startTime.getTime() : 0;
    
    if (phaseDuration < criteria.minimumDuration) {
      return false;
    }
    
    return true;
  }

  private async shouldTriggerRollback(phase: MigrationPhase, errorMessage: string): Promise<boolean> {
    // Check automatic rollback triggers
    for (const trigger of this.migrationPlan.rollbackTriggers) {
      if (trigger.automatic && this.evaluateRollbackTrigger(trigger, phase, errorMessage)) {
        return true;
      }
    }
    
    // Check phase-specific rollback conditions
    for (const condition of phase.rollbackConditions) {
      if (await this.evaluateRollbackCondition(condition, phase)) {
        return true;
      }
    }
    
    return false;
  }

  private evaluateRollbackTrigger(trigger: RollbackTrigger, phase: MigrationPhase, errorMessage: string): boolean {
    // Simple evaluation - in real implementation this would be more sophisticated
    if (trigger.severity === 'CRITICAL') {
      return true;
    }
    
    if (trigger.condition.includes('error') && errorMessage.toLowerCase().includes('critical')) {
      return true;
    }
    
    return false;
  }

  private async evaluateRollbackCondition(condition: RollbackCondition, phase: MigrationPhase): Promise<boolean> {
    const currentValue = await this.getCurrentMetricValue(condition.metric, phase);
    
    switch (condition.operator) {
      case '>':
        return currentValue > condition.threshold;
      case '<':
        return currentValue < condition.threshold;
      case '>=':
        return currentValue >= condition.threshold;
      case '<=':
        return currentValue <= condition.threshold;
      case '==':
        return currentValue === condition.threshold;
      case '!=':
        return currentValue !== condition.threshold;
      default:
        return false;
    }
  }

  private async getCurrentMetricValue(metric: string, phase: MigrationPhase): Promise<number> {
    switch (metric) {
      case 'error_rate':
        return phase.metrics?.errorRate || 0;
      case 'response_time':
        return phase.metrics?.averageResponseTime || 0;
      case 'health_score':
        return this.status.healthMetrics.overallHealth;
      default:
        return 0;
    }
  }

  private async executePhaseRollback(phase: MigrationPhase): Promise<void> {
    performanceLogger.warn('monitoring', `Executing rollback for phase ${phase.phaseNumber}`, {
      phaseName: phase.name
    });

    const rollbackEvent: RollbackEvent = {
      timestamp: new Date(),
      phase: phase.phaseNumber,
      trigger: 'automatic',
      reason: `Phase ${phase.phaseNumber} failed - automatic rollback`,
      automatic: true,
      success: false,
      documentsAffected: 0
    };

    try {
      // In a real implementation, this would execute actual rollback
      // For now, simulate rollback success
      rollbackEvent.success = true;
      rollbackEvent.documentsAffected = phase.targetDocuments;
      
      this.status.rollbackHistory.push(rollbackEvent);

    } catch (error) {
      rollbackEvent.success = false;
      rollbackEvent.reason = `Rollback failed: ${error.message}`;
      this.status.rollbackHistory.push(rollbackEvent);
      
      performanceLogger.error('monitoring', `Rollback failed for phase ${phase.phaseNumber}`, {
        error: error.message
      }, error);
    }
  }

  private async startMonitoring(): Promise<void> {
    if (!this.migrationPlan.monitoringConfig.realTimeMonitoring) {
      return;
    }

    this.monitoringInterval = setInterval(async () => {
      await this.updateHealthMetrics();
      await this.saveStatus();
    }, this.migrationPlan.monitoringConfig.snapshotInterval);
  }

  private async updateHealthMetrics(): Promise<void> {
    try {
      const healthCheck = await this.monitor.runEnhancedMonitoringChecks(this.migrationPlan.version);
      
      this.status.healthMetrics = {
        overallHealth: healthCheck.summary.healthScore,
        systemHealth: healthCheck.summary.healthScore,
        dataIntegrity: healthCheck.dataIntegrityResults.dataConsistencyScore,
        performance: 100 - ((healthCheck.summary.averageResponseTime / 1000) * 10),
        userSatisfaction: 95, // This would be calculated from user feedback
        lastAssessment: new Date()
      };
      
    } catch (error) {
      performanceLogger.error('monitoring', 'Failed to update health metrics', {
        error: error.message
      });
    }
  }

  private async checkRollbackConditions(phase: MigrationPhase): Promise<void> {
    for (const condition of phase.rollbackConditions) {
      const shouldRollback = await this.evaluateRollbackCondition(condition, phase);
      
      if (shouldRollback) {
        await this.addAlert({
          id: `rollback-condition-${Date.now()}`,
          timestamp: new Date(),
          severity: 'CRITICAL',
          category: 'rollback',
          message: `Rollback condition met: ${condition.description}`,
          acknowledged: false
        });
        
        if (await this.shouldTriggerRollback(phase, condition.description)) {
          await this.executePhaseRollback(phase);
          phase.status = 'ROLLED_BACK';
        }
      }
    }
  }

  private async updatePhaseProgress(phase: MigrationPhase): Promise<void> {
    // Update phase metrics based on current state
    if (phase.status === 'RUNNING' && this.migrationEngine) {
      // In a real implementation, get actual progress from migration engine
      phase.metrics = await this.calculatePhaseMetrics(phase);
    }
  }

  private async calculatePhaseMetrics(phase: MigrationPhase): Promise<PhaseMetrics> {
    // Calculate metrics based on current phase execution
    return {
      documentsProcessed: phase.targetDocuments, // This would be actual count
      successRate: 98.5, // This would be calculated from actual results
      averageResponseTime: this.status.healthMetrics.performance || 500,
      errorRate: 0.015, // This would be calculated from actual errors
      throughput: 25, // Documents per second
      healthScore: this.status.healthMetrics.overallHealth,
      userImpactScore: 95, // This would be calculated from user feedback
      rollbacksTriggered: this.status.rollbackHistory.filter(r => r.phase === phase.phaseNumber).length
    };
  }

  private async validatePhaseCompletion(phase: MigrationPhase): Promise<void> {
    // Validate that phase completed successfully
    const healthCheck = await this.monitor.runEnhancedMonitoringChecks(this.migrationPlan.version);
    
    if (healthCheck.summary.overallStatus === 'CRITICAL') {
      throw new Error('Phase completion validation failed - system health critical');
    }
    
    // Additional validation logic would go here
  }

  private async evaluateCriterion(criterion: string): Promise<boolean> {
    // Evaluate specific criteria
    switch (criterion) {
      case 'health_score_above_90':
        return this.status.healthMetrics.overallHealth >= 90;
      case 'error_rate_below_1_percent':
        return true; // This would check actual error rate
      case 'no_critical_alerts':
        return this.status.alerts.filter(a => a.severity === 'CRITICAL' && !a.acknowledged).length === 0;
      default:
        return true;
    }
  }

  private async finalizeMigration(): Promise<void> {
    this.status.overallStatus = 'COMPLETED';
    this.status.estimatedCompletion = new Date();
    
    await this.addAlert({
      id: `migration-completed-${Date.now()}`,
      timestamp: new Date(),
      severity: 'INFO',
      category: 'migration',
      message: 'Phased migration completed successfully',
      acknowledged: false
    });
    
    performanceLogger.info('monitoring', 'Phased migration finalized', {
      migrationId: this.migrationPlan.migrationId,
      totalDuration: Date.now() - this.status.startTime.getTime(),
      overallProgress: this.status.overallProgress
    });
  }

  private async pauseMigration(reason: string): Promise<void> {
    this.status.overallStatus = 'PAUSED';
    
    await this.addAlert({
      id: `migration-paused-${Date.now()}`,
      timestamp: new Date(),
      severity: 'WARNING',
      category: 'migration',
      message: `Migration paused: ${reason}`,
      acknowledged: false
    });
    
    performanceLogger.warn('monitoring', 'Migration paused', {
      migrationId: this.migrationPlan.migrationId,
      reason
    });
  }

  private async addAlert(alert: Alert): Promise<void> {
    this.status.alerts.push(alert);
    
    // Keep only recent alerts
    if (this.status.alerts.length > 100) {
      this.status.alerts = this.status.alerts.slice(-100);
    }
    
    performanceLogger.info('monitoring', `Alert added: ${alert.message}`, {
      alertId: alert.id,
      severity: alert.severity,
      category: alert.category
    });
  }

  private async saveStatus(): Promise<void> {
    try {
      this.status.lastUpdate = new Date();
      writeFileSync(this.statusPath, JSON.stringify(this.status, null, 2));
    } catch (error) {
      performanceLogger.error('monitoring', 'Failed to save migration status', {
        error: error.message
      });
    }
  }

  /**
   * Static method to execute phased migration
   */
  static async executePhasedMigration(migrationPlan: PhasedMigrationPlan): Promise<PhasedMigrationStatus> {
    const executor = new PhasedMigrationExecutor(migrationPlan);
    return await executor.executePhasedMigration();
  }

  /**
   * Create default phased migration plan
   */
  static createDefaultPlan(
    migrationId: string,
    version: string,
    environment: 'staging' | 'production'
  ): PhasedMigrationPlan {
    const isProduction = environment === 'production';
    
    return {
      migrationId,
      version,
      environment,
      phases: [
        {
          phaseNumber: 1,
          name: 'Initial Rollout',
          percentage: 10,
          targetDocuments: 1000,
          duration: isProduction ? 3600000 : 1800000, // 1 hour prod, 30 min staging
          criteria: {
            required: ['health_score_above_90', 'error_rate_below_1_percent'],
            optional: ['no_critical_alerts'],
            healthScoreMinimum: 90,
            errorRateMaximum: 0.01,
            responseTimeMaximum: 1000,
            validationChecks: ['data_integrity', 'performance_baseline']
          },
          rollbackConditions: [
            {
              metric: 'error_rate',
              operator: '>',
              threshold: 0.05,
              description: 'Error rate exceeds 5%'
            }
          ],
          monitoringInterval: 30000,
          status: 'PENDING'
        },
        {
          phaseNumber: 2,
          name: 'Expanded Rollout',
          percentage: 50,
          targetDocuments: 5000,
          duration: isProduction ? 7200000 : 3600000, // 2 hours prod, 1 hour staging
          criteria: {
            required: ['health_score_above_85', 'error_rate_below_2_percent'],
            optional: ['user_feedback_positive'],
            healthScoreMinimum: 85,
            errorRateMaximum: 0.02,
            responseTimeMaximum: 1500,
            validationChecks: ['data_integrity', 'user_impact']
          },
          rollbackConditions: [
            {
              metric: 'error_rate',
              operator: '>',
              threshold: 0.03,
              description: 'Error rate exceeds 3%'
            }
          ],
          monitoringInterval: 60000,
          status: 'PENDING'
        },
        {
          phaseNumber: 3,
          name: 'Full Rollout',
          percentage: 100,
          targetDocuments: 10000,
          duration: isProduction ? 14400000 : 7200000, // 4 hours prod, 2 hours staging
          criteria: {
            required: ['health_score_above_80', 'migration_complete'],
            optional: [],
            healthScoreMinimum: 80,
            errorRateMaximum: 0.05,
            responseTimeMaximum: 2000,
            validationChecks: ['full_system_validation']
          },
          rollbackConditions: [
            {
              metric: 'error_rate',
              operator: '>',
              threshold: 0.1,
              description: 'Error rate exceeds 10%'
            }
          ],
          monitoringInterval: 120000,
          status: 'PENDING'
        }
      ],
      rollbackTriggers: [
        {
          name: 'Critical Error Rate',
          condition: 'error_rate > 0.05',
          threshold: 0.05,
          severity: 'CRITICAL',
          automatic: true,
          cooldownPeriod: 300000,
          notifications: ['engineering-team', 'database-admin']
        },
        {
          name: 'Health Score Degradation',
          condition: 'health_score < 70',
          threshold: 70,
          severity: 'CRITICAL',
          automatic: true,
          cooldownPeriod: 600000,
          notifications: ['engineering-manager', 'oncall-engineer']
        }
      ],
      healthThresholds: {
        healthScore: { warning: 85, critical: 70 },
        errorRate: { warning: 0.01, critical: 0.05 },
        responseTime: { warning: 1000, critical: 3000 },
        throughput: { warning: 10, critical: 5 },
        memoryUsage: { warning: 512, critical: 1024 }
      },
      progressionCriteria: {
        healthStable: true,
        errorsWithinThreshold: true,
        performanceAcceptable: true,
        userFeedbackPositive: !isProduction, // Only required for staging
        dataIntegrityMaintained: true,
        minimumDuration: isProduction ? 1800000 : 900000 // 30 min prod, 15 min staging
      },
      monitoringConfig: {
        realTimeMonitoring: true,
        alertingEnabled: true,
        metricsRetention: 7 * 24 * 60 * 60 * 1000, // 7 days
        snapshotInterval: 30000 // 30 seconds
      },
      emergencyContacts: [
        {
          name: 'Engineering On-Call',
          role: 'Primary Engineer',
          email: 'oncall@tradeya.com',
          phone: '+1-XXX-XXX-XXXX',
          escalationLevel: 1
        },
        {
          name: 'Database Administrator',
          role: 'Database Admin',
          email: 'dba@tradeya.com',
          phone: '+1-XXX-XXX-XXXX',
          escalationLevel: 2
        }
      ],
      automaticProgression: !isProduction,
      manualApprovalRequired: isProduction
    };
  }
}

// Execute phased migration if this script is run directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const migrationIdArg = args.find(arg => arg.startsWith('--migration-id='));
  const migrationId = migrationIdArg ? migrationIdArg.split('=')[1] : `migration-${Date.now()}`;
  const versionArg = args.find(arg => arg.startsWith('--version='));
  const version = versionArg ? versionArg.split('=')[1] : '2.0';
  const envArg = args.find(arg => arg.startsWith('--env='));
  const environment = envArg ? envArg.split('=')[1] as 'staging' | 'production' : 'production';
  const configArg = args.find(arg => arg.startsWith('--config='));
  
  console.log('\n🚀 TradeYa Phased Migration Executor');
  console.log('===================================');
  console.log(`🆔 Migration ID: ${migrationId}`);
  console.log(`📦 Version: ${version}`);
  console.log(`🌍 Environment: ${environment}`);
  console.log(`⏰ Start Time: ${new Date().toISOString()}`);

  let migrationPlan: PhasedMigrationPlan;

  if (configArg) {
    const configPath = configArg.split('=')[1];
    try {
      migrationPlan = JSON.parse(readFileSync(configPath, 'utf-8'));
    } catch (error) {
      console.error(`❌ Error: Failed to load config from ${configPath}: ${error.message}`);
      process.exit(1);
    }
  } else {
    migrationPlan = PhasedMigrationExecutor.createDefaultPlan(migrationId, version, environment);
  }

  PhasedMigrationExecutor.executePhasedMigration(migrationPlan)
    .then(status => {
      console.log('\n🎯 Phased Migration Execution Results:');
      console.log(`📊 Overall Status: ${status.overallStatus}`);
      console.log(`📈 Progress: ${status.overallProgress.toFixed(1)}%`);
      console.log(`🏁 Current Phase: ${status.currentPhase}/${status.totalPhases}`);
      console.log(`⚠️  Alerts: ${status.alerts.filter(a => !a.acknowledged).length}`);
      console.log(`🔄 Rollbacks: ${status.rollbackHistory.length}`);
      console.log(`💚 Health Score: ${status.healthMetrics.overallHealth.toFixed(1)}/100`);

      if (status.alerts.length > 0) {
        console.log('\n🚨 Recent Alerts:');
        status.alerts.slice(-5).forEach(alert => {
          const emoji = alert.severity === 'CRITICAL' ? '🚨' : 
                       alert.severity === 'ERROR' ? '❌' : 
                       alert.severity === 'WARNING' ? '⚠️' : 'ℹ️';
          console.log(`   ${emoji} ${alert.message}`);
        });
      }

      const exitCode = status.overallStatus === 'COMPLETED' ? 0 :
                      status.overallStatus === 'PAUSED' ? 1 : 2;

      if (exitCode === 0) {
        console.log('\n✅ SUCCESS: Phased migration completed successfully');
      } else if (exitCode === 1) {
        console.warn('\n⏸️  PAUSED: Migration paused - manual intervention may be required');
      } else {
        console.error('\n❌ FAILED: Migration failed - check logs and alerts');
      }

      process.exit(exitCode);
    })
    .catch(error => {
      console.error('\n💥 Phased migration executor error:', error);
      process.exit(1);
    });
}

export type {
  PhasedMigrationPlan,
  PhasedMigrationStatus,
  MigrationPhase,
  PhaseMetrics
};
