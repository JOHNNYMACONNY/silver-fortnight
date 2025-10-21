import {
  loadSecurityConfig,
  getCurrentEnvironment,
  SecurityConfigError,
  verifyConfigValues,
  mergeConfigurations,
  Environment,
  loadEnvironmentSecurityConfig,
  getEnvironmentConfig
} from '../securityConfigLoader';
import { SecurityConfiguration } from '../../types/SecurityConfig';
import path from 'path';
import fs from 'fs';

// Mock environment variables
const mockEnv = (env: string | undefined) => {
  const original = process.env['NODE_ENV'];
  process.env['NODE_ENV'] = env;
  return () => {
    process.env['NODE_ENV'] = original;
  };
};

// Mock filesystem
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  readFileSync: jest.fn(),
  writeFileSync: jest.fn()
}));

// Import mock base configuration
const validConfig: SecurityConfiguration = {
  rules: {
    maxRuleLength: 500,
    minRequiredChecks: 3,
    requiredPatterns: ['request.auth != null'],
    forbiddenPatterns: ['allow .* if true']
  },
  validation: {
    coverage: {
      statements: 90,
      branches: 85,
      functions: 90,
      lines: 90
    },
    complexity: {
      maxNestedRules: 3,
      maxFunctionLength: 15,
      maxConditions: 5
    }
  },
  testing: {
    requiredTestTypes: [
      'authentication',
      'authorization',
      'validation',
      'edge-cases',
      'negative-cases'
    ],
    minTestsPerRule: 2,
    timeout: 10000
  },
  security: {
    maxDocumentSize: 1048576,
    maxBatchSize: 500,
    rateLimits: {
      reads: 1000,
      writes: 500,
      deletes: 100
    },
    authentication: {
      requireEmailVerification: true,
      minPasswordLength: 12,
      requireMFA: false
    }
  },
  storage: {
    maxFileSize: {
      profile: 5242880,
      evidence: 20971520,
      general: 10485760
    },
    allowedContentTypes: {
      images: ['image/jpeg', 'image/png'],
      documents: ['application/pdf']
    }
  },
  monitoring: {
    alerts: {
      ruleChanges: true,
      permissionDenials: true,
      highLatencyRules: true,
      suspiciousActivity: true
    },
    thresholds: {
      permissionDenials: 100,
      ruleLatency: 500,
      batchOperations: 50
    },
    reporting: {
      enabled: true,
      frequency: 'daily',
      retentionDays: 30
    }
  },
  deployment: {
    requireApproval: true,
    requireTests: true,
    stagingRequired: true,
    backupBeforeUpdate: true,
    rollbackEnabled: true,
    environments: {
      development: {
        emulatorPorts: {
          firestore: 8080,
          storage: 9199
        }
      },
      staging: {
        projectId: 'staging-project-id',
        region: 'us-central1'
      },
      production: {
        projectId: 'prod-project-id',
        region: 'us-central1',
        requireMFA: true
      }
    }
  },
  ci: {
    requireCodeReview: true,
    requiredApprovals: 2,
    securityScanners: ['gitleaks'],
    notifications: {
      slack: true,
      email: true,
      pullRequests: true
    }
  },
  documentation: {
    required: true,
    templates: {
      ruleChanges: true,
      securityImpact: true,
      testCoverage: true,
      rollback: true
    },
    requiredSections: [
      'security-impact',
      'testing-evidence',
      'rollback-plan',
      'monitoring-plan'
    ]
  },
  maintenance: {
    schedule: {
      ruleReview: 'monthly',
      securityAudit: 'quarterly',
      penetrationTesting: 'annually'
    },
    automation: {
      backups: true,
      monitoring: true,
      reporting: true,
      cleanup: true
    }
  }
};

describe('Security Config Loader', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(validConfig));
  });

  describe('loadEnvironmentSecurityConfig', () => {
    it('loads environment-specific configuration', () => {
      const envOverrides: Partial<SecurityConfiguration> = {
        security: {
          ...validConfig.security,
          authentication: {
            ...validConfig.security.authentication,
            requireMFA: true
          }
        }
      };

      (fs.readFileSync as jest.Mock)
        .mockReturnValueOnce(JSON.stringify(validConfig))
        .mockReturnValueOnce(JSON.stringify(envOverrides));

      const config = loadEnvironmentSecurityConfig('production');
      expect(config.security.authentication.requireMFA).toBe(true);
    });

    it('handles missing environment-specific config file', () => {
      (fs.existsSync as jest.Mock)
        .mockReturnValueOnce(true)  // Base config exists
        .mockReturnValueOnce(false); // Env config doesn't exist

      const config = loadEnvironmentSecurityConfig('development');
      expect(config).toBeTruthy();
      expect(config.deployment.environments.development).toBeDefined();
    });

    it('throws error for invalid environment', () => {
      expect(() => loadEnvironmentSecurityConfig('invalid' as Environment))
        .toThrow(SecurityConfigError);
    });

    it('throws error for invalid environment-specific config', () => {
      (fs.readFileSync as jest.Mock)
        .mockReturnValueOnce(JSON.stringify(validConfig))
        .mockReturnValueOnce('invalid json');

      expect(() => loadEnvironmentSecurityConfig('production'))
        .toThrow(SecurityConfigError);
    });
  });

  describe('getEnvironmentConfig', () => {
    it('returns configuration for valid environment', () => {
      const envConfig = getEnvironmentConfig(validConfig, 'development');
      expect(envConfig.emulatorPorts).toBeDefined();
      expect(envConfig.emulatorPorts?.firestore).toBe(8080);
    });

    it('throws error for non-existent environment', () => {
      const invalidConfig: SecurityConfiguration = {
        ...validConfig,
        deployment: {
          ...validConfig.deployment,
          environments: {
            development: validConfig.deployment.environments.development,
            staging: validConfig.deployment.environments.staging,
            production: validConfig.deployment.environments.production
          }
        }
      };

      // Override one environment to trigger the error
      delete (invalidConfig.deployment.environments as any).production;

      expect(() => getEnvironmentConfig(invalidConfig, 'production'))
        .toThrow(SecurityConfigError);
    });
  });

  describe('verifyConfigValues edge cases', () => {
    it('validates nested thresholds', () => {
      const invalidConfig: SecurityConfiguration = {
        ...validConfig,
        monitoring: {
          ...validConfig.monitoring,
          thresholds: {
            ...validConfig.monitoring.thresholds,
            ruleLatency: -1 // Invalid negative latency
          }
        }
      };
      expect(() => verifyConfigValues(invalidConfig)).toThrow(SecurityConfigError);
    });

    it('validates content type restrictions', () => {
      const invalidConfig: SecurityConfiguration = {
        ...validConfig,
        storage: {
          ...validConfig.storage,
          allowedContentTypes: {
            images: [],  // Empty array is invalid
            documents: validConfig.storage.allowedContentTypes.documents
          }
        }
      };
      expect(() => verifyConfigValues(invalidConfig)).toThrow(SecurityConfigError);
    });
  });

  describe('mergeConfigurations deep merging', () => {
    it('correctly merges nested arrays', () => {
      const override: Partial<SecurityConfiguration> = {
        rules: {
          ...validConfig.rules,
          requiredPatterns: [...validConfig.rules.requiredPatterns, 'new.pattern']
        }
      };

      const merged = mergeConfigurations(validConfig, override);
      expect(merged.rules.requiredPatterns).toContain('new.pattern');
      expect(merged.rules.requiredPatterns.length).toBe(
        validConfig.rules.requiredPatterns.length + 1
      );
    });

    it('preserves unspecified nested objects', () => {
      const override: Partial<SecurityConfiguration> = {
        monitoring: {
          ...validConfig.monitoring,
          alerts: {
            ...validConfig.monitoring.alerts,
            ruleChanges: false
          }
        }
      };

      const merged = mergeConfigurations(validConfig, override);
      expect(merged.monitoring.alerts.permissionDenials).toBe(
        validConfig.monitoring.alerts.permissionDenials
      );
      expect(merged.monitoring.alerts.ruleChanges).toBe(false);
    });

    it('handles null or undefined values correctly', () => {
      const override: Partial<SecurityConfiguration> = {
        security: {
          ...validConfig.security,
          authentication: {
            ...validConfig.security.authentication,
            requireMFA: undefined as unknown as boolean
          }
        }
      };

      const merged = mergeConfigurations(validConfig, override);
      expect(merged.security.authentication.requireMFA).toBe(
        validConfig.security.authentication.requireMFA
      );
    });
  });
});
