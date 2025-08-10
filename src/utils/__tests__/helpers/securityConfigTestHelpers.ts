import { SecurityConfiguration } from '../../../types/SecurityConfig';

/**
 * Creates a deep clone of the configuration object
 */
export function cloneConfig(config: SecurityConfiguration): SecurityConfiguration {
  return JSON.parse(JSON.stringify(config));
}

/**
 * Creates a partial configuration preserving the required structure
 */
export function createPartialConfig<T extends Partial<SecurityConfiguration>>(
  partialConfig: T
): T {
  return partialConfig;
}

/**
 * Helper type for nested object access
 */
type DeepNestedObject = {
  [key: string]: DeepNestedObject | any;
};

/**
 * Type guard for checking string array elements
 */
function isValidPathArray(path: unknown): path is string[] {
  return Array.isArray(path) && path.every(item => typeof item === 'string');
}

/**
 * Modifies a specific nested value in the configuration
 */
export function modifyConfigValue<T>(
  config: SecurityConfiguration,
  path: string[],
  value: T
): SecurityConfiguration {
  if (!isValidPathArray(path) || path.length === 0) {
    throw new Error('Invalid path array. Must be non-empty array of strings.');
  }

  const newConfig = cloneConfig(config);
  let current: DeepNestedObject = newConfig;
  
  // Traverse the path except for the last element
  for (let i = 0; i < path.length - 1; i++) {
    const key = path[i];
    if (typeof key !== 'string') {
      throw new Error(`Invalid path element at index ${i}: ${key}`);
    }
    if (!(key in current)) {
      current[key] = {};
    }
    current = current[key] as DeepNestedObject;
  }
  
  // Set the value at the final path location
  const lastKey = path[path.length - 1];
  if (typeof lastKey !== 'string') {
    throw new Error('Last path element must be a string');
  }
  current[lastKey] = value;
  
  return newConfig;
}

/**
 * Environment configuration type
 */
type EnvironmentType = 'development' | 'staging' | 'production';

/**
 * Base environment configurations
 */
const environmentConfigs: Record<EnvironmentType, SecurityConfiguration['deployment']['environments'][EnvironmentType]> = {
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
} as const;

/**
 * Creates a test environment configuration
 */
export function createEnvironmentConfig(
  env: EnvironmentType,
  overrides: Partial<SecurityConfiguration['deployment']['environments'][EnvironmentType]> = {}
): SecurityConfiguration['deployment']['environments'][typeof env] {
  const baseConfig = environmentConfigs[env];
  return {
    ...baseConfig,
    ...overrides
  };
}

/**
 * Creates invalid config variations for testing
 */
export function createInvalidConfigVariations(
  baseConfig: SecurityConfiguration
): Array<[string, SecurityConfiguration]> {
  return [
    [
      'invalid coverage threshold',
      modifyConfigValue(baseConfig, ['validation', 'coverage', 'statements'], 101)
    ],
    [
      'invalid password length',
      modifyConfigValue(baseConfig, ['security', 'authentication', 'minPasswordLength'], 6)
    ],
    [
      'negative file size',
      modifyConfigValue(baseConfig, ['storage', 'maxFileSize', 'profile'], -1)
    ],
    [
      'invalid rate limit',
      modifyConfigValue(baseConfig, ['security', 'rateLimits', 'reads'], 0)
    ],
    [
      'empty content types',
      modifyConfigValue(baseConfig, ['storage', 'allowedContentTypes', 'images'], [])
    ]
  ];
}

/**
 * Helper to create configuration overrides for testing
 */
export function createTestOverrides(): Required<Pick<SecurityConfiguration, 'security' | 'monitoring'>> {
  return {
    security: {
      maxDocumentSize: 2 * 1024 * 1024, // 2MB
      maxBatchSize: 1000,
      rateLimits: {
        reads: 2000,
        writes: 1000,
        deletes: 200
      },
      authentication: {
        requireEmailVerification: true,
        minPasswordLength: 16,
        requireMFA: true
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
        permissionDenials: 200,
        ruleLatency: 250,
        batchOperations: 100
      },
      reporting: {
        enabled: true,
        frequency: 'hourly',
        retentionDays: 90
      }
    }
  };
}

/**
 * Validation error type
 */
interface ValidationError {
  path: string[];
  message: string;
  value: any;
}

/**
 * Helper to validate a configuration object
 */
export function validateTestConfig(config: SecurityConfiguration): ValidationError[] {
  const errors: ValidationError[] = [];

  // Check coverage thresholds
  Object.entries(config.validation.coverage).forEach(([key, value]) => {
    if (value < 0 || value > 100) {
      errors.push({
        path: ['validation', 'coverage', key],
        message: `Invalid coverage threshold: ${value}`,
        value
      });
    }
  });

  // Check password length
  if (config.security.authentication.minPasswordLength < 8) {
    errors.push({
      path: ['security', 'authentication', 'minPasswordLength'],
      message: `Invalid password length: ${config.security.authentication.minPasswordLength}`,
      value: config.security.authentication.minPasswordLength
    });
  }

  // Check file size limits
  Object.entries(config.storage.maxFileSize).forEach(([key, value]) => {
    if (value <= 0) {
      errors.push({
        path: ['storage', 'maxFileSize', key],
        message: `Invalid file size: ${value}`,
        value
      });
    }
  });

  // Check rate limits
  Object.entries(config.security.rateLimits).forEach(([key, value]) => {
    if (value <= 0) {
      errors.push({
        path: ['security', 'rateLimits', key],
        message: `Invalid rate limit: ${value}`,
        value
      });
    }
  });

  // Check content types arrays
  Object.entries(config.storage.allowedContentTypes).forEach(([key, value]) => {
    if (!Array.isArray(value) || value.length === 0) {
      errors.push({
        path: ['storage', 'allowedContentTypes', key],
        message: `Invalid content types: must be non-empty array`,
        value
      });
    }
  });

  return errors;
}

export default {
  cloneConfig,
  createPartialConfig,
  modifyConfigValue,
  createEnvironmentConfig,
  createInvalidConfigVariations,
  createTestOverrides,
  validateTestConfig
};
