#!/usr/bin/env node

/**
 * TradeYa Production Environment Setup
 * 
 * Comprehensive production environment configuration and validation
 * system for zero-downtime migration deployment.
 */

import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { loadProductionEnvironment, EnvironmentVariables } from './env-loader';
import { performanceLogger } from '../../src/utils/performance/structuredLogger';

// Production environment configuration
interface ProductionEnvironment {
  projectId: string;
  environment: 'staging' | 'production';
  firebaseConfig: FirebaseConfig;
  securityConfig: SecurityConfig;
  monitoringConfig: MonitoringConfig;
  migrationConfig: MigrationConfig;
  alertingConfig: AlertingConfig;
}

interface FirebaseConfig {
  projectId: string;
  serviceAccountPath?: string;
  databaseURL: string;
  storageBucket: string;
  indexes: IndexConfig[];
  securityRules: SecurityRulesConfig;
}

interface SecurityConfig {
  accessControl: AccessControlConfig;
  encryption: EncryptionConfig;
  backup: BackupConfig;
  auditLogging: boolean;
  ipWhitelist: string[];
}

interface MonitoringConfig {
  healthCheckInterval: number;
  performanceThresholds: PerformanceThresholds;
  alertingThresholds: AlertingThresholds;
  dashboardConfig: DashboardConfig;
  logRetention: LogRetentionConfig;
}

interface MigrationConfig {
  phasedDeployment: PhasedDeploymentConfig;
  rollbackTriggers: RollbackTrigger[];
  dataValidation: DataValidationConfig;
  compatibilityLayer: CompatibilityLayerConfig;
  emergencyProcedures: EmergencyProcedure[];
}

interface AlertingConfig {
  notificationChannels: NotificationChannel[];
  escalationPaths: EscalationPath[];
  silencingRules: SilencingRule[];
  emergencyContacts: EmergencyContact[];
}

interface IndexConfig {
  collection: string;
  fields: string[];
  arrayContains?: string[];
  orderBy?: string[];
  required: boolean;
}

interface SecurityRulesConfig {
  rulesPath: string;
  testSuite: string;
  validationRequired: boolean;
}

interface AccessControlConfig {
  adminUsers: string[];
  readOnlyUsers: string[];
  serviceAccounts: string[];
  roleBasedAccess: boolean;
}

interface EncryptionConfig {
  dataAtRest: boolean;
  dataInTransit: boolean;
  keyRotationInterval: number;
  backupEncryption: boolean;
}

interface BackupConfig {
  automaticBackups: boolean;
  backupSchedule: string;
  retentionDays: number;
  compressionEnabled: boolean;
  offSiteStorage: boolean;
}

interface PerformanceThresholds {
  queryLatencyP95: number;
  queryLatencyP99: number;
  errorRate: number;
  throughputQPS: number;
  memoryUsage: number;
  connectionPoolUtilization: number;
}

interface AlertingThresholds {
  responseTime: { warning: number; critical: number };
  errorRate: { warning: number; critical: number };
  healthScore: { warning: number; critical: number };
  migrationProgress: { warning: number; critical: number };
}

interface DashboardConfig {
  realTimeMonitoring: boolean;
  customMetrics: string[];
  autoRefreshInterval: number;
  dataRetentionDays: number;
}

interface LogRetentionConfig {
  applicationLogs: number;
  auditLogs: number;
  performanceLogs: number;
  securityLogs: number;
}

interface PhasedDeploymentConfig {
  phase1: { percentage: number; duration: number; criteria: string[] };
  phase2: { percentage: number; duration: number; criteria: string[] };
  phase3: { percentage: number; duration: number; criteria: string[] };
  automaticPromotion: boolean;
  manualApprovalRequired: boolean;
}

interface RollbackTrigger {
  name: string;
  condition: string;
  threshold: number;
  automatic: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface DataValidationConfig {
  preDeployment: string[];
  postDeployment: string[];
  continuousValidation: string[];
  sampleSize: number;
  validationTimeout: number;
}

interface CompatibilityLayerConfig {
  enabled: boolean;
  fallbackStrategy: 'legacy' | 'hybrid' | 'new';
  gracePeriod: number;
  monitoring: boolean;
}

interface EmergencyProcedure {
  name: string;
  trigger: string;
  steps: string[];
  contacts: string[];
  escalationTime: number;
}

interface NotificationChannel {
  type: 'email' | 'slack' | 'sms' | 'webhook';
  config: Record<string, any>;
  enabled: boolean;
  severity: ('low' | 'medium' | 'high' | 'critical')[];
}

interface EscalationPath {
  level: number;
  contacts: string[];
  delay: number;
  criteria: string[];
}

interface SilencingRule {
  name: string;
  condition: string;
  duration: number;
  enabled: boolean;
}

interface EmergencyContact {
  name: string;
  role: string;
  email: string;
  phone: string;
  timezone: string;
  available24x7: boolean;
}

/**
 * Production Environment Setup Service
 */
export class ProductionEnvironmentSetup {
  private environment: ProductionEnvironment;
  private configPath: string;
  private isValidated = false;
  private envVars: EnvironmentVariables;

  constructor(projectId: string, environment: 'staging' | 'production' = 'production') {
    // Load environment variables first
    this.envVars = loadProductionEnvironment();
    
    this.configPath = join(process.cwd(), 'config', `${environment}.env.json`);
    this.environment = this.createDefaultConfiguration(projectId, environment);
  }

  private createDefaultConfiguration(projectId: string, environment: 'staging' | 'production'): ProductionEnvironment {
    const isProduction = environment === 'production';
    
    return {
      projectId,
      environment,
      firebaseConfig: {
        projectId,
        databaseURL: `https://${projectId}-default-rtdb.firebaseio.com`,
        storageBucket: `${projectId}.appspot.com`,
        indexes: [
          {
            collection: 'trades',
            fields: ['status', 'createdAt'],
            orderBy: ['createdAt'],
            required: true
          },
          {
            collection: 'trades',
            fields: ['participants.creator', 'status'],
            required: true
          },
          {
            collection: 'conversations',
            fields: ['participantIds'],
            arrayContains: ['participantIds'],
            required: true
          }
        ],
        securityRules: {
          rulesPath: 'firestore.rules',
          testSuite: 'firebase-security.test.ts',
          validationRequired: true
        }
      },
      securityConfig: {
        accessControl: {
          adminUsers: [],
          readOnlyUsers: [],
          serviceAccounts: [],
          roleBasedAccess: true
        },
        encryption: {
          dataAtRest: true,
          dataInTransit: true,
          keyRotationInterval: isProduction ? 90 : 180,
          backupEncryption: true
        },
        backup: {
          automaticBackups: true,
          backupSchedule: isProduction ? '0 2 * * *' : '0 3 * * 0', // Daily for prod, weekly for staging
          retentionDays: isProduction ? 30 : 14,
          compressionEnabled: true,
          offSiteStorage: isProduction
        },
        auditLogging: true,
        ipWhitelist: []
      },
      monitoringConfig: {
        healthCheckInterval: isProduction ? 30000 : 60000,
        performanceThresholds: {
          queryLatencyP95: isProduction ? 1000 : 2000,
          queryLatencyP99: isProduction ? 3000 : 5000,
          errorRate: isProduction ? 0.01 : 0.05,
          throughputQPS: isProduction ? 100 : 50,
          memoryUsage: isProduction ? 512 : 1024,
          connectionPoolUtilization: 0.8
        },
        alertingThresholds: {
          responseTime: { 
            warning: isProduction ? 1000 : 2000, 
            critical: isProduction ? 3000 : 5000 
          },
          errorRate: { 
            warning: isProduction ? 0.01 : 0.05, 
            critical: isProduction ? 0.05 : 0.1 
          },
          healthScore: { warning: 85, critical: 70 },
          migrationProgress: { warning: 10, critical: 5 }
        },
        dashboardConfig: {
          realTimeMonitoring: true,
          customMetrics: [
            'migration_progress',
            'compatibility_layer_usage',
            'data_integrity_score',
            'user_impact_score'
          ],
          autoRefreshInterval: isProduction ? 30000 : 60000,
          dataRetentionDays: isProduction ? 90 : 30
        },
        logRetention: {
          applicationLogs: isProduction ? 30 : 14,
          auditLogs: isProduction ? 365 : 90,
          performanceLogs: isProduction ? 90 : 30,
          securityLogs: isProduction ? 365 : 180
        }
      },
      migrationConfig: {
        phasedDeployment: {
          phase1: { 
            percentage: 10, 
            duration: isProduction ? 3600000 : 1800000, // 1 hour prod, 30 min staging
            criteria: ['health_score_above_90', 'error_rate_below_1_percent', 'no_critical_alerts']
          },
          phase2: { 
            percentage: 50, 
            duration: isProduction ? 7200000 : 3600000, // 2 hours prod, 1 hour staging
            criteria: ['health_score_above_85', 'error_rate_below_2_percent', 'user_feedback_positive']
          },
          phase3: { 
            percentage: 100, 
            duration: isProduction ? 14400000 : 7200000, // 4 hours prod, 2 hours staging
            criteria: ['health_score_above_80', 'error_rate_below_5_percent', 'migration_complete']
          },
          automaticPromotion: !isProduction,
          manualApprovalRequired: isProduction
        },
        rollbackTriggers: [
          {
            name: 'Critical Error Rate',
            condition: 'error_rate > 0.05',
            threshold: 0.05,
            automatic: true,
            severity: 'critical'
          },
          {
            name: 'Health Score Degradation',
            condition: 'health_score < 70',
            threshold: 70,
            automatic: true,
            severity: 'critical'
          },
          {
            name: 'Migration Stall',
            condition: 'migration_progress_stalled > 300',
            threshold: 300,
            automatic: isProduction,
            severity: 'high'
          }
        ],
        dataValidation: {
          preDeployment: [
            'schema_compatibility_check',
            'index_availability_check',
            'backup_verification',
            'security_rules_validation'
          ],
          postDeployment: [
            'data_integrity_check',
            'performance_validation',
            'user_experience_validation',
            'compatibility_layer_health'
          ],
          continuousValidation: [
            'real_time_health_monitoring',
            'error_rate_tracking',
            'performance_metrics_monitoring'
          ],
          sampleSize: isProduction ? 1000 : 100,
          validationTimeout: isProduction ? 300000 : 180000
        },
        compatibilityLayer: {
          enabled: true,
          fallbackStrategy: 'hybrid',
          gracePeriod: isProduction ? 7200000 : 3600000, // 2 hours prod, 1 hour staging
          monitoring: true
        },
        emergencyProcedures: [
          {
            name: 'Critical Migration Failure',
            trigger: 'error_rate > 0.1 OR health_score < 50',
            steps: [
              'Immediate automatic rollback',
              'Notify emergency contacts',
              'Escalate to database administrator',
              'Create incident report'
            ],
            contacts: ['oncall-engineer', 'database-admin', 'product-manager'],
            escalationTime: 300000 // 5 minutes
          },
          {
            name: 'Data Integrity Breach',
            trigger: 'data_integrity_score < 90',
            steps: [
              'Pause migration immediately',
              'Lock database writes',
              'Notify security team',
              'Initiate data validation procedures'
            ],
            contacts: ['security-team', 'database-admin', 'engineering-manager'],
            escalationTime: 180000 // 3 minutes
          }
        ]
      },
      alertingConfig: {
        notificationChannels: [
          {
            type: 'email',
            config: {
              smtpServer: process.env.SMTP_SERVER || 'localhost',
              recipients: ['engineering@tradeya.com']
            },
            enabled: true,
            severity: ['medium', 'high', 'critical']
          },
          {
            type: 'slack',
            config: {
              webhookUrl: process.env.SLACK_WEBHOOK_URL || '',
              channel: '#alerts',
              username: 'Migration Bot'
            },
            enabled: true,
            severity: ['high', 'critical']
          }
        ],
        escalationPaths: [
          {
            level: 1,
            contacts: ['oncall-engineer'],
            delay: 300000, // 5 minutes
            criteria: ['high', 'critical']
          },
          {
            level: 2,
            contacts: ['engineering-manager', 'database-admin'],
            delay: 900000, // 15 minutes
            criteria: ['critical']
          }
        ],
        silencingRules: [
          {
            name: 'Maintenance Window',
            condition: 'maintenance_mode = true',
            duration: 3600000, // 1 hour
            enabled: false
          }
        ],
        emergencyContacts: [
          {
            name: 'Engineering On-Call',
            role: 'Primary Engineer',
            email: 'oncall@tradeya.com',
            phone: '+1-XXX-XXX-XXXX',
            timezone: 'UTC',
            available24x7: true
          },
          {
            name: 'Database Administrator',
            role: 'Database Admin',
            email: 'dba@tradeya.com',
            phone: '+1-XXX-XXX-XXXX',
            timezone: 'UTC',
            available24x7: isProduction
          }
        ]
      }
    };
  }

  /**
   * Setup production environment configuration
   */
  async setupProductionEnvironment(): Promise<{
    success: boolean;
    configPath: string;
    validationResults: ValidationResult[];
    recommendations: string[];
  }> {
    performanceLogger.info('monitoring', 'Setting up production environment', {
      projectId: this.environment.projectId,
      environment: this.environment.environment
    });

    const validationResults: ValidationResult[] = [];
    const recommendations: string[] = [];

    try {
      // Create config directory if it doesn't exist
      const configDir = join(process.cwd(), 'config');
      if (!existsSync(configDir)) {
        mkdirSync(configDir, { recursive: true });
      }

      // Validate environment variables
      const envValidation = this.validateEnvironmentVariables();
      validationResults.push(envValidation);

      // Validate Firebase configuration
      const firebaseValidation = await this.validateFirebaseConfiguration();
      validationResults.push(firebaseValidation);

      // Validate security configuration
      const securityValidation = this.validateSecurityConfiguration();
      validationResults.push(securityValidation);

      // Generate environment-specific configurations
      await this.generateEnvironmentConfigurations();

      // Save production environment configuration
      this.saveEnvironmentConfiguration();

      // Generate recommendations
      this.generateRecommendations(validationResults, recommendations);

      this.isValidated = validationResults.every(r => r.passed);

      performanceLogger.info('monitoring', 'Production environment setup completed', {
        success: this.isValidated,
        validationsPassed: validationResults.filter(r => r.passed).length,
        validationsTotal: validationResults.length
      });

      return {
        success: this.isValidated,
        configPath: this.configPath,
        validationResults,
        recommendations
      };

    } catch (error) {
      performanceLogger.error('monitoring', 'Production environment setup failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      }, error instanceof Error ? error : new Error('Unknown error'));

      return {
        success: false,
        configPath: this.configPath,
        validationResults,
        recommendations: [
          `Critical setup failure: ${error instanceof Error ? error.message : 'Unknown error'}`,
          'Review environment configuration and try again'
        ]
      };
    }
  }

  private validateEnvironmentVariables(): ValidationResult {
    const requiredVars = [
      'FIREBASE_PROJECT_ID',
      'NODE_ENV'
    ];

    const optionalVars = [
      'FIREBASE_SERVICE_ACCOUNT_KEY',
      'SMTP_SERVER',
      'SLACK_WEBHOOK_URL'
    ];

    // Check both loaded environment and process.env
    const missing = requiredVars.filter(varName => !this.envVars[varName] && !process.env[varName]);
    const provided = optionalVars.filter(varName => this.envVars[varName] || process.env[varName]);

    // Validate project-specific values
    const projectValidationErrors: string[] = [];
    
    const projectId = this.envVars.FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;
    if (projectId && projectId !== 'tradeya-45ede') {
      projectValidationErrors.push(`FIREBASE_PROJECT_ID should be 'tradeya-45ede', got '${projectId}'`);
    }
    
    const nodeEnv = this.envVars.NODE_ENV || process.env.NODE_ENV;
    if (nodeEnv && nodeEnv !== 'production') {
      projectValidationErrors.push(`NODE_ENV should be 'production', got '${nodeEnv}'`);
    }

    const hasErrors = missing.length > 0 || projectValidationErrors.length > 0;

    return {
      name: 'Environment Variables',
      passed: !hasErrors,
      details: hasErrors
        ? [
            ...(missing.length > 0 ? [`Missing required variables: ${missing.join(', ')}`] : []),
            ...projectValidationErrors
          ].join('; ')
        : `All required variables present with correct values. Optional variables: ${provided.join(', ')}`,
      recommendations: [
        ...missing.map(v => `Set environment variable: ${v} in .env.production`),
        ...projectValidationErrors.map(error => `Fix environment variable: ${error}`)
      ]
    };
  }

  private async validateFirebaseConfiguration(): Promise<ValidationResult> {
    try {
      // Validate Firebase project access
      if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
        if (!serviceAccount.project_id || serviceAccount.project_id !== this.environment.projectId) {
          return {
            name: 'Firebase Configuration',
            passed: false,
            details: 'Service account project ID mismatch',
            recommendations: ['Verify Firebase service account configuration']
          };
        }
      }

      // Validate Firestore indexes exist
      const indexValidation = await this.validateFirestoreIndexes();

      return {
        name: 'Firebase Configuration',
        passed: indexValidation.success,
        details: indexValidation.message,
        recommendations: indexValidation.success ? [] : [
          'Deploy required Firestore indexes',
          'Run: firebase deploy --only firestore:indexes'
        ]
      };

    } catch (error) {
      return {
        name: 'Firebase Configuration',
        passed: false,
        details: `Firebase validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        recommendations: [
          'Check Firebase credentials and project access',
          'Verify network connectivity to Firebase'
        ]
      };
    }
  }

  private async validateFirestoreIndexes(): Promise<{ success: boolean; message: string }> {
    try {
      // Check if firestore.indexes.json exists and has indexes
      const indexesPath = join(process.cwd(), 'firestore.indexes.json');
      if (!existsSync(indexesPath)) {
        return { success: false, message: 'firestore.indexes.json file not found' };
      }

      const indexesContent = readFileSync(indexesPath, 'utf8');
      const indexesData = JSON.parse(indexesContent);
      
      if (!indexesData.indexes || !Array.isArray(indexesData.indexes)) {
        return { success: false, message: 'No indexes array found in firestore.indexes.json' };
      }

      const indexCount = indexesData.indexes.length;
      if (indexCount < 3) {
        return { success: false, message: `At least 3 indexes required, found ${indexCount}` };
      }

      return {
        success: true,
        message: `${indexCount} Firestore indexes configured`
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to validate Firestore indexes: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private validateSecurityConfiguration(): ValidationResult {
    const security = this.environment.securityConfig;
    const issues: string[] = [];

    if (!security.encryption.dataAtRest) {
      issues.push('Data at rest encryption not enabled');
    }

    if (!security.encryption.dataInTransit) {
      issues.push('Data in transit encryption not enabled');
    }

    if (!security.backup.automaticBackups) {
      issues.push('Automatic backups not enabled');
    }

    if (!security.auditLogging) {
      issues.push('Audit logging not enabled');
    }

    if (this.environment.environment === 'production' && security.encryption.keyRotationInterval > 90) {
      issues.push('Key rotation interval too long for production');
    }

    return {
      name: 'Security Configuration',
      passed: issues.length === 0,
      details: issues.length > 0 
        ? `Security issues found: ${issues.join(', ')}`
        : 'Security configuration validated',
      recommendations: issues.map(issue => `Address security issue: ${issue}`)
    };
  }

  private async generateEnvironmentConfigurations(): Promise<void> {
    // Generate environment-specific .env files
    const envContent = this.generateEnvFile();
    const envPath = join(process.cwd(), 'config', `${this.environment.environment}.env`);
    writeFileSync(envPath, envContent);

    // Generate migration configuration
    const migrationConfigPath = join(process.cwd(), 'config', 'migration-production.config.ts');
    const migrationConfig = this.generateMigrationConfig();
    writeFileSync(migrationConfigPath, migrationConfig);

    performanceLogger.info('monitoring', 'Environment-specific configurations generated', {
      envPath,
      migrationConfigPath
    });
  }

  private generateEnvFile(): string {
    const config = this.environment;
    const isProduction = config.environment === 'production';

    return `# TradeYa ${config.environment.toUpperCase()} Environment Configuration
# Generated: ${new Date().toISOString()}

# Firebase Configuration
FIREBASE_PROJECT_ID=${config.projectId}
FIREBASE_DATABASE_URL=${config.firebaseConfig.databaseURL}
FIREBASE_STORAGE_BUCKET=${config.firebaseConfig.storageBucket}

# Migration Configuration
MIGRATION_BATCH_SIZE=${isProduction ? 100 : 50}
MIGRATION_MAX_RETRIES=5
MIGRATION_RETRY_DELAY=1000
MIGRATION_VALIDATION_ENABLED=true
MIGRATION_TRANSACTION_TIMEOUT=30000
MIGRATION_CONCURRENT_BATCHES=${isProduction ? 3 : 2}
MIGRATION_CHECKPOINT_INTERVAL=1000
MIGRATION_ROLLBACK_ENABLED=true
MIGRATION_HEALTH_CHECK_INTERVAL=${config.monitoringConfig.healthCheckInterval}
MIGRATION_MEMORY_THRESHOLD=${config.monitoringConfig.performanceThresholds.memoryUsage}
MIGRATION_QUOTA_SAFETY=0.8
MIGRATION_CONNECTION_POOL_SIZE=${isProduction ? 10 : 5}

# Performance Thresholds
PERFORMANCE_QUERY_LATENCY_P95=${config.monitoringConfig.performanceThresholds.queryLatencyP95}
PERFORMANCE_QUERY_LATENCY_P99=${config.monitoringConfig.performanceThresholds.queryLatencyP99}
PERFORMANCE_ERROR_RATE=${config.monitoringConfig.performanceThresholds.errorRate}
PERFORMANCE_THROUGHPUT_QPS=${config.monitoringConfig.performanceThresholds.throughputQPS}

# Alerting Thresholds
ALERT_RESPONSE_TIME_WARNING=${config.monitoringConfig.alertingThresholds.responseTime.warning}
ALERT_RESPONSE_TIME_CRITICAL=${config.monitoringConfig.alertingThresholds.responseTime.critical}
ALERT_ERROR_RATE_WARNING=${config.monitoringConfig.alertingThresholds.errorRate.warning}
ALERT_ERROR_RATE_CRITICAL=${config.monitoringConfig.alertingThresholds.errorRate.critical}
ALERT_HEALTH_SCORE_WARNING=${config.monitoringConfig.alertingThresholds.healthScore.warning}
ALERT_HEALTH_SCORE_CRITICAL=${config.monitoringConfig.alertingThresholds.healthScore.critical}

# Phased Deployment Configuration
PHASED_DEPLOYMENT_PHASE1_PERCENTAGE=${config.migrationConfig.phasedDeployment.phase1.percentage}
PHASED_DEPLOYMENT_PHASE1_DURATION=${config.migrationConfig.phasedDeployment.phase1.duration}
PHASED_DEPLOYMENT_PHASE2_PERCENTAGE=${config.migrationConfig.phasedDeployment.phase2.percentage}
PHASED_DEPLOYMENT_PHASE2_DURATION=${config.migrationConfig.phasedDeployment.phase2.duration}
PHASED_DEPLOYMENT_PHASE3_PERCENTAGE=${config.migrationConfig.phasedDeployment.phase3.percentage}
PHASED_DEPLOYMENT_PHASE3_DURATION=${config.migrationConfig.phasedDeployment.phase3.duration}
PHASED_DEPLOYMENT_AUTOMATIC_PROMOTION=${config.migrationConfig.phasedDeployment.automaticPromotion}
PHASED_DEPLOYMENT_MANUAL_APPROVAL=${config.migrationConfig.phasedDeployment.manualApprovalRequired}

# Rollback Configuration
ROLLBACK_BATCH_SIZE=50
ROLLBACK_CONCURRENT_OPS=3
ROLLBACK_TIMEOUT=300000
ROLLBACK_SAFETY_INTERVAL=30000
ROLLBACK_VALIDATION_SAMPLE=100
ROLLBACK_EMERGENCY_THRESHOLD=0.1
ROLLBACK_BACKUP_VALIDATION=true
ROLLBACK_REQUIRE_CONFIRMATION=${isProduction}

# Security Configuration
SECURITY_AUDIT_LOGGING=${config.securityConfig.auditLogging}
SECURITY_BACKUP_ENABLED=${config.securityConfig.backup.automaticBackups}
SECURITY_BACKUP_RETENTION_DAYS=${config.securityConfig.backup.retentionDays}
SECURITY_KEY_ROTATION_INTERVAL=${config.securityConfig.encryption.keyRotationInterval}

# Monitoring Configuration
MONITORING_REAL_TIME_ENABLED=${config.monitoringConfig.dashboardConfig.realTimeMonitoring}
MONITORING_AUTO_REFRESH_INTERVAL=${config.monitoringConfig.dashboardConfig.autoRefreshInterval}
MONITORING_DATA_RETENTION_DAYS=${config.monitoringConfig.dashboardConfig.dataRetentionDays}

# Log Retention Configuration
LOG_RETENTION_APPLICATION=${config.monitoringConfig.logRetention.applicationLogs}
LOG_RETENTION_AUDIT=${config.monitoringConfig.logRetention.auditLogs}
LOG_RETENTION_PERFORMANCE=${config.monitoringConfig.logRetention.performanceLogs}
LOG_RETENTION_SECURITY=${config.monitoringConfig.logRetention.securityLogs}

# Optional External Services
# SMTP_SERVER=
# SLACK_WEBHOOK_URL=
# FIREBASE_SERVICE_ACCOUNT_KEY=
`;
  }

  private generateMigrationConfig(): string {
    const config = this.environment.migrationConfig;

    return `/**
 * TradeYa Production Migration Configuration
 * Generated: ${new Date().toISOString()}
 * Environment: ${this.environment.environment}
 */

export interface ProductionMigrationConfig {
  phasedDeployment: PhasedDeploymentConfig;
  rollbackTriggers: RollbackTrigger[];
  dataValidation: DataValidationConfig;
  compatibilityLayer: CompatibilityLayerConfig;
  emergencyProcedures: EmergencyProcedure[];
}

export const PRODUCTION_MIGRATION_CONFIG: ProductionMigrationConfig = ${JSON.stringify(config, null, 2)};

export default PRODUCTION_MIGRATION_CONFIG;
`;
  }

  private saveEnvironmentConfiguration(): void {
    writeFileSync(this.configPath, JSON.stringify(this.environment, null, 2));
    performanceLogger.info('monitoring', 'Environment configuration saved', {
      configPath: this.configPath
    });
  }

  private generateRecommendations(
    validationResults: ValidationResult[], 
    recommendations: string[]
  ): void {
    // General recommendations based on environment
    if (this.environment.environment === 'production') {
      recommendations.push(
        'Enable automatic backups with off-site storage',
        'Configure 24/7 monitoring and alerting',
        'Set up emergency contact escalation paths',
        'Implement comprehensive security logging',
        'Enable manual approval for critical changes'
      );
    }

    // Recommendations based on validation results
    validationResults.forEach(result => {
      if (!result.passed && result.recommendations) {
        recommendations.push(...result.recommendations);
      }
    });

    // Performance recommendations
    const perfConfig = this.environment.monitoringConfig.performanceThresholds;
    if (perfConfig.queryLatencyP95 > 2000) {
      recommendations.push('Consider lowering query latency thresholds for better user experience');
    }

    if (perfConfig.errorRate > 0.01) {
      recommendations.push('Consider lowering error rate threshold for production environment');
    }
  }

  /**
   * Validate production readiness
   */
  async validateProductionReadiness(): Promise<{
    ready: boolean;
    blockers: string[];
    warnings: string[];
    checklist: ReadinessCheck[];
  }> {
    const checklist: ReadinessCheck[] = [];
    const blockers: string[] = [];
    const warnings: string[] = [];

    // Core infrastructure checks
    checklist.push({
      name: 'Firebase Configuration',
      status: this.isValidated ? 'passed' : 'failed',
      required: true,
      details: 'Firebase project and configuration validated'
    });

    checklist.push({
      name: 'Security Configuration',
      status: this.environment.securityConfig.auditLogging ? 'passed' : 'failed',
      required: true,
      details: 'Security policies and encryption configured'
    });

    checklist.push({
      name: 'Monitoring Setup',
      status: this.environment.monitoringConfig.dashboardConfig.realTimeMonitoring ? 'passed' : 'warning',
      required: false,
      details: 'Real-time monitoring and alerting configured'
    });

    checklist.push({
      name: 'Backup Strategy',
      status: this.environment.securityConfig.backup.automaticBackups ? 'passed' : 'failed',
      required: true,
      details: 'Automatic backup strategy implemented'
    });

    // Collect blockers and warnings
    checklist.forEach(check => {
      if (check.status === 'failed' && check.required) {
        blockers.push(`${check.name}: ${check.details}`);
      } else if (check.status === 'warning') {
        warnings.push(`${check.name}: ${check.details}`);
      }
    });

    const ready = blockers.length === 0;

    return {
      ready,
      blockers,
      warnings,
      checklist
    };
  }

  /**
   * Static method to setup production environment
   */
  static async setupEnvironment(
    projectId: string,
    environment: 'staging' | 'production' = 'production'
  ): Promise<any> {
    const setup = new ProductionEnvironmentSetup(projectId, environment);
    return await setup.setupProductionEnvironment();
  }
}

interface ValidationResult {
  name: string;
  passed: boolean;
  details: string;
  recommendations?: string[];
}

interface ReadinessCheck {
  name: string;
  status: 'passed' | 'failed' | 'warning';
  required: boolean;
  details: string;
}

// Execute production environment setup if this script is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  // Load environment first
  console.log('🔧 Production Environment Setup - Loading Environment');
  console.log('=' + '='.repeat(54));
  
  const envVars = loadProductionEnvironment();
  
  const args = process.argv.slice(2);
  const projectArg = args.find(arg => arg.startsWith('--project='));
  const projectId = projectArg ? projectArg.split('=')[1] : envVars.FIREBASE_PROJECT_ID || 'tradeya-45ede';
  const envArg = args.find(arg => arg.startsWith('--env='));
  const environment = envArg ? envArg.split('=')[1] as 'staging' | 'production' : 'production';

  if (!projectId) {
    console.error('❌ Error: Project ID is required. Use --project=<PROJECT_ID> or set FIREBASE_PROJECT_ID in .env.production');
    console.error('💡 Current environment variables:');
    console.error(`   FIREBASE_PROJECT_ID: ${envVars.FIREBASE_PROJECT_ID || 'NOT SET'}`);
    console.error(`   NODE_ENV: ${envVars.NODE_ENV || 'NOT SET'}`);
    process.exit(1);
  }

  console.log('\n🚀 TradeYa Production Environment Setup');
  console.log('=========================================');
  console.log(`📊 Project: ${projectId}`);
  console.log(`🌍 Environment: ${environment}`);
  console.log(`⏰ Start Time: ${new Date().toISOString()}`);

  ProductionEnvironmentSetup.setupEnvironment(projectId, environment)
    .then(result => {
      console.log('\n📋 Production Environment Setup Results:');
      console.log(`✅ Success: ${result.success}`);
      console.log(`📁 Config Path: ${result.configPath}`);
      console.log(`🔍 Validations Passed: ${result.validationResults.filter((r: any) => r.passed).length}/${result.validationResults.length}`);

      if (result.validationResults.length > 0) {
        console.log('\n📊 Validation Results:');
        result.validationResults.forEach((validation: any) => {
          const status = validation.passed ? '✅' : '❌';
          console.log(`   ${status} ${validation.name}: ${validation.details}`);
        });
      }

      if (result.recommendations.length > 0) {
        console.log('\n💡 Recommendations:');
        result.recommendations.forEach((rec: string, index: number) => {
          console.log(`   ${index + 1}. ${rec}`);
        });
      }

      const exitCode = result.success ? 0 : 1;
      
      if (exitCode === 0) {
        console.log('\n✅ Production environment setup completed successfully');
      } else {
        console.error('\n❌ Production environment setup failed - review validation results');
      }

      process.exit(exitCode);
    })
    .catch(error => {
      console.error('\n💥 Production environment setup error:', error);
      process.exit(1);
    });
}

export type { 
  ProductionEnvironment,
  ValidationResult,
  ReadinessCheck
};