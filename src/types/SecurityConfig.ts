/**
 * Type definitions for Firebase security configuration
 */

export interface RulesConfig {
  maxRuleLength: number;
  minRequiredChecks: number;
  requiredPatterns: string[];
  forbiddenPatterns: string[];
}

export interface ValidationConfig {
  coverage: {
    statements: number;
    branches: number;
    functions: number;
    lines: number;
  };
  complexity: {
    maxNestedRules: number;
    maxFunctionLength: number;
    maxConditions: number;
  };
}

export interface TestingConfig {
  requiredTestTypes: Array<
    | 'authentication'
    | 'authorization'
    | 'validation'
    | 'edge-cases'
    | 'negative-cases'
  >;
  minTestsPerRule: number;
  timeout: number;
}

export interface SecurityConfig {
  maxDocumentSize: number;
  maxBatchSize: number;
  rateLimits: {
    reads: number;
    writes: number;
    deletes: number;
  };
  authentication: {
    requireEmailVerification: boolean;
    minPasswordLength: number;
    requireMFA: boolean;
  };
}

export interface StorageConfig {
  maxFileSize: {
    profile: number;
    evidence: number;
    general: number;
  };
  allowedContentTypes: {
    images: string[];
    documents: string[];
  };
}

export interface MonitoringConfig {
  alerts: {
    ruleChanges: boolean;
    permissionDenials: boolean;
    highLatencyRules: boolean;
    suspiciousActivity: boolean;
  };
  thresholds: {
    permissionDenials: number;
    ruleLatency: number;
    batchOperations: number;
  };
  reporting: {
    enabled: boolean;
    frequency: 'hourly' | 'daily' | 'weekly' | 'monthly';
    retentionDays: number;
  };
}

export interface EnvironmentConfig {
  emulatorPorts?: {
    firestore: number;
    storage: number;
  };
  projectId?: string;
  region?: string;
  requireMFA?: boolean;
}

export interface DeploymentConfig {
  requireApproval: boolean;
  requireTests: boolean;
  stagingRequired: boolean;
  backupBeforeUpdate: boolean;
  rollbackEnabled: boolean;
  environments: {
    development: EnvironmentConfig;
    staging: EnvironmentConfig;
    production: EnvironmentConfig;
  };
}

export interface CIConfig {
  requireCodeReview: boolean;
  requiredApprovals: number;
  securityScanners: string[];
  notifications: {
    slack: boolean;
    email: boolean;
    pullRequests: boolean;
  };
}

export interface DocumentationConfig {
  required: boolean;
  templates: {
    ruleChanges: boolean;
    securityImpact: boolean;
    testCoverage: boolean;
    rollback: boolean;
  };
  requiredSections: Array<
    'security-impact' | 'testing-evidence' | 'rollback-plan' | 'monitoring-plan'
  >;
}

export interface MaintenanceConfig {
  schedule: {
    ruleReview: 'weekly' | 'monthly' | 'quarterly';
    securityAudit: 'monthly' | 'quarterly' | 'annually';
    penetrationTesting: 'quarterly' | 'annually';
  };
  automation: {
    backups: boolean;
    monitoring: boolean;
    reporting: boolean;
    cleanup: boolean;
  };
}

export interface SecurityConfiguration {
  rules: RulesConfig;
  validation: ValidationConfig;
  testing: TestingConfig;
  security: SecurityConfig;
  storage: StorageConfig;
  monitoring: MonitoringConfig;
  deployment: DeploymentConfig;
  ci: CIConfig;
  documentation: DocumentationConfig;
  maintenance: MaintenanceConfig;
}

/**
 * Utility type to enforce complete configuration
 */
export type RequiredSecurityConfig = Required<SecurityConfiguration>;

/**
 * Helper function to validate security configuration
 */
export function validateSecurityConfig(
  config: Partial<SecurityConfiguration>
): config is SecurityConfiguration {
  const requiredKeys: Array<keyof SecurityConfiguration> = [
    'rules',
    'validation',
    'testing',
    'security',
    'storage',
    'monitoring',
    'deployment',
    'ci',
    'documentation',
    'maintenance'
  ];

  return requiredKeys.every(key => key in config);
}

/**
 * Helper function to get configuration with defaults
 */
export function getSecurityConfig(): SecurityConfiguration {
   
  const config = require('../../config/security.config.json');
  if (!validateSecurityConfig(config)) {
    throw new Error('Invalid security configuration');
  }
  return config;
}

export default SecurityConfiguration;
