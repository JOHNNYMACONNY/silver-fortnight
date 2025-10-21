import {
  cloneConfig,
  createPartialConfig,
  modifyConfigValue,
  createEnvironmentConfig,
  createInvalidConfigVariations,
  createTestOverrides,
  validateTestConfig
} from './securityConfigTestHelpers';
import { SecurityConfiguration } from '../../../types/SecurityConfig';

const mockConfig: SecurityConfiguration = {
  rules: {
    maxRuleLength: 500,
    minRequiredChecks: 3,
    requiredPatterns: ['test.pattern'],
    forbiddenPatterns: ['forbidden.pattern']
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
    requiredTestTypes: ['authentication'],
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
      images: ['image/jpeg'],
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

describe('Security Config Test Helpers', () => {
  describe('cloneConfig', () => {
    it('creates a deep clone of configuration', () => {
      const clone = cloneConfig(mockConfig);
      expect(clone).toEqual(mockConfig);
      expect(clone).not.toBe(mockConfig);
      expect(clone.security).not.toBe(mockConfig.security);
    });
  });

  describe('createPartialConfig', () => {
    it('creates partial configuration', () => {
      const partial = createPartialConfig({
        security: {
          maxDocumentSize: 2048,
          maxBatchSize: 100,
          rateLimits: mockConfig.security.rateLimits,
          authentication: mockConfig.security.authentication
        }
      });
      expect(partial.security.maxDocumentSize).toBe(2048);
    });
  });

  describe('modifyConfigValue', () => {
    it('modifies nested value correctly', () => {
      const modified = modifyConfigValue(
        mockConfig,
        ['security', 'authentication', 'requireMFA'],
        true
      );
      expect(modified.security.authentication.requireMFA).toBe(true);
      expect(mockConfig.security.authentication.requireMFA).toBe(false);
    });

    it('throws error for empty path', () => {
      expect(() => modifyConfigValue(mockConfig, [], true)).toThrow();
    });

    it('throws error for invalid path type', () => {
      expect(() => 
        modifyConfigValue(mockConfig, ['security', null as any, 'test'], true)
      ).toThrow();
    });
  });

  describe('createEnvironmentConfig', () => {
    it('creates development environment config', () => {
      const config = createEnvironmentConfig('development');
      expect(config.emulatorPorts).toBeDefined();
      if (!config.emulatorPorts) fail('Expected emulatorPorts to be defined');
      expect(config.emulatorPorts.firestore).toBe(8080);
    });

    it('creates production environment config with overrides', () => {
      type EnvConfig = SecurityConfiguration['deployment']['environments']['production'];
      interface ExtendedEnvConfig extends EnvConfig {
        customSetting?: string;
      }

      const overrides: Partial<ExtendedEnvConfig> = {
        requireMFA: false,
        customSetting: 'test'
      };

      const config = createEnvironmentConfig('production', overrides) as ExtendedEnvConfig;
      expect(config.requireMFA).toBe(false);
      expect(config.projectId).toBe('prod-project-id');
      expect(config.customSetting).toBe('test');
    });
  });

  describe('createInvalidConfigVariations', () => {
    it('creates the expected number of invalid variations', () => {
      const variations = createInvalidConfigVariations(mockConfig);
      expect(variations).toHaveLength(5);
    });

    it('each variation is invalid according to validateTestConfig', () => {
      const variations = createInvalidConfigVariations(mockConfig);
      variations.forEach(([description, config]) => {
        const errors = validateTestConfig(config);
        expect(errors.length).toBeGreaterThan(0);
      });
    });
  });

  describe('createTestOverrides', () => {
    it('creates valid overrides with required fields', () => {
      const overrides = createTestOverrides();
      expect(overrides.security).toBeDefined();
      expect(overrides.monitoring).toBeDefined();
      
      const { security } = overrides;
      if (!security || !security.authentication) {
        fail('Expected security.authentication to be defined');
      }
      expect(security.authentication.minPasswordLength).toBe(16);
    });
  });

  describe('validateTestConfig', () => {
    it('returns no errors for valid config', () => {
      const errors = validateTestConfig(mockConfig);
      expect(errors).toHaveLength(0);
    });

    it('detects coverage threshold errors', () => {
      const invalidConfig = modifyConfigValue(
        mockConfig,
        ['validation', 'coverage', 'statements'],
        101
      );
      const errors = validateTestConfig(invalidConfig);
      expect(errors.length).toBeGreaterThan(0);
      
      const [firstError] = errors;
      expect(firstError).toBeDefined();
      if (!firstError) fail('Expected at least one validation error');
      expect(firstError.path).toEqual(['validation', 'coverage', 'statements']);
    });

    it('detects multiple errors', () => {
      const invalidConfig = modifyConfigValue(
        mockConfig,
        ['security', 'rateLimits', 'reads'],
        -1
      );
      const errors = validateTestConfig(invalidConfig);
      expect(errors.length).toBeGreaterThan(0);
      
      const [firstError] = errors;
      expect(firstError).toBeDefined();
      if (!firstError) fail('Expected at least one validation error');
      expect(firstError.path).toEqual(['security', 'rateLimits', 'reads']);
    });
  });
});
