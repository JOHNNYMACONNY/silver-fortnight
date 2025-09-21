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
    | "authentication"
    | "authorization"
    | "validation"
    | "edge-cases"
    | "negative-cases"
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
    frequency: "hourly" | "daily" | "weekly" | "monthly";
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
    "security-impact" | "testing-evidence" | "rollback-plan" | "monitoring-plan"
  >;
}

export interface MaintenanceConfig {
  schedule: {
    ruleReview: "weekly" | "monthly" | "quarterly";
    securityAudit: "monthly" | "quarterly" | "annually";
    penetrationTesting: "quarterly" | "annually";
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
  encryption: {
    algorithm: string;
    keyLength: number;
    ivLength: number;
  };
  authentication: {
    tokenExpiry: number;
    refreshTokenExpiry: number;
    maxLoginAttempts: number;
  };
  authorization: {
    defaultRole: string;
    adminRoles: string[];
  };
  rateLimiting: {
    windowMs: number;
    maxRequests: number;
  };
  securityHeaders: {
    contentSecurityPolicy: string;
    strictTransportSecurity: string;
  };
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
    "rules",
    "validation",
    "testing",
    "security",
    "storage",
    "monitoring",
    "deployment",
    "ci",
    "documentation",
    "maintenance",
  ];

  return requiredKeys.every((key) => key in config);
}

/**
 * Helper function to get configuration with defaults
 */
export function getSecurityConfig(): SecurityConfiguration {
  // Note: In a real implementation, this would be loaded dynamically
  // For now, we'll return a default configuration
  const defaultConfig: SecurityConfiguration = {
    rules: {
      maxRuleLength: 1000,
      minRequiredChecks: 3,
      requiredPatterns: ["allow", "deny", "request.auth"],
      forbiddenPatterns: ["true", "false"],
    },
    validation: {
      coverage: {
        statements: 80,
        branches: 70,
        functions: 80,
        lines: 80,
      },
      complexity: {
        maxNestedRules: 3,
        maxFunctionLength: 50,
        maxConditions: 5,
      },
    },
    testing: {
      requiredTestTypes: ["authentication", "authorization", "validation"],
      minTestsPerRule: 2,
      timeout: 30000,
    },
    security: {
      maxDocumentSize: 1048576,
      maxBatchSize: 500,
      rateLimits: {
        reads: 1000,
        writes: 500,
        deletes: 100,
      },
      authentication: {
        requireEmailVerification: true,
        minPasswordLength: 8,
        requireMFA: false,
      },
    },
    storage: {
      maxFileSize: {
        profile: 5242880,
        evidence: 10485760,
        general: 2097152,
      },
      allowedContentTypes: {
        images: ["image/jpeg", "image/png", "image/gif"],
        documents: ["application/pdf", "text/plain"],
      },
    },
    monitoring: {
      alerts: {
        ruleChanges: true,
        permissionDenials: true,
        highLatencyRules: true,
        suspiciousActivity: true,
      },
      thresholds: {
        permissionDenials: 10,
        ruleLatency: 1000,
        batchOperations: 100,
      },
      reporting: {
        enabled: true,
        frequency: "daily",
        retentionDays: 30,
      },
    },
    deployment: {
      requireApproval: true,
      requireTests: true,
      stagingRequired: true,
      backupBeforeUpdate: true,
      rollbackEnabled: true,
      environments: {
        development: {
          emulatorPorts: { firestore: 8080, storage: 9199 },
          projectId: "dev-project",
        },
        staging: {
          projectId: "staging-project",
        },
        production: {
          projectId: "prod-project",
          requireMFA: true,
        },
      },
    },
    ci: {
      requireCodeReview: true,
      requiredApprovals: 2,
      securityScanners: ["npm-audit", "eslint-security"],
      notifications: {
        slack: true,
        email: true,
        pullRequests: true,
      },
    },
    documentation: {
      required: true,
      templates: {
        ruleChanges: true,
        securityImpact: true,
        testCoverage: true,
        rollback: true,
      },
      requiredSections: [
        "security-impact",
        "testing-evidence",
        "rollback-plan",
        "monitoring-plan",
      ],
    },
    maintenance: {
      schedule: {
        ruleReview: "monthly",
        securityAudit: "quarterly",
        penetrationTesting: "annually",
      },
      automation: {
        backups: true,
        monitoring: true,
        reporting: true,
        cleanup: true,
      },
    },
    encryption: {
      algorithm: "AES-256-GCM",
      keyLength: 32,
      ivLength: 16,
    },
    authentication: {
      tokenExpiry: 3600,
      refreshTokenExpiry: 86400,
      maxLoginAttempts: 5,
    },
    authorization: {
      defaultRole: "user",
      adminRoles: ["admin", "super_admin"],
    },
    rateLimiting: {
      windowMs: 900000, // 15 minutes
      maxRequests: 100,
    },
    securityHeaders: {
      contentSecurityPolicy: "default-src 'self'",
      strictTransportSecurity: "max-age=31536000; includeSubDomains",
    },
  };

  return defaultConfig;
}

export default SecurityConfiguration;
