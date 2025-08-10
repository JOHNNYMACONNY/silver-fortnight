import { SecurityConfiguration, validateSecurityConfig } from '../types/SecurityConfig';
import fs from 'fs';
import path from 'path';

/**
 * Valid environment types
 */
export type Environment = 'development' | 'staging' | 'production';

/**
 * Custom error class for security configuration issues
 */
export class SecurityConfigError extends Error {
  constructor(message: string, public details?: unknown) {
    super(message);
    this.name = 'SecurityConfigError';
  }
}

/**
 * Load and validate the security configuration
 */
export function loadSecurityConfig(configPath?: string): SecurityConfiguration {
  const defaultPath = path.resolve(process.cwd(), 'config/security.config.json');
  const configFilePath = configPath || defaultPath;

  try {
    // Check if config file exists
    if (!fs.existsSync(configFilePath)) {
      throw new SecurityConfigError(
        `Security configuration file not found at: ${configFilePath}`
      );
    }

    // Read and parse config file
    const rawConfig = fs.readFileSync(configFilePath, 'utf8');
    const config = JSON.parse(rawConfig);

    // Validate the configuration
    if (!validateSecurityConfig(config)) {
      throw new SecurityConfigError('Invalid security configuration format');
    }

    return config;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new SecurityConfigError('Invalid JSON in security configuration', error);
    }
    if (error instanceof SecurityConfigError) {
      throw error;
    }
    throw new SecurityConfigError('Failed to load security configuration', error);
  }
}

/**
 * Verify specific configuration values
 */
export function verifyConfigValues(config: SecurityConfiguration): void {
  // Verify coverage thresholds are valid percentages
  const { coverage } = config.validation;
  Object.entries(coverage).forEach(([key, value]) => {
    if (value < 0 || value > 100) {
      throw new SecurityConfigError(
        `Invalid coverage threshold for ${key}: ${value}. Must be between 0 and 100.`
      );
    }
  });

  // Verify minimum requirements
  if (config.security.authentication.minPasswordLength < 8) {
    throw new SecurityConfigError(
      'Minimum password length must be at least 8 characters'
    );
  }

  // Verify file size limits
  const maxAllowedFileSize = 100 * 1024 * 1024; // 100MB
  Object.entries(config.storage.maxFileSize).forEach(([key, value]) => {
    if (value <= 0 || value > maxAllowedFileSize) {
      throw new SecurityConfigError(
        `Invalid file size limit for ${key}: ${value}. Must be between 1 and ${maxAllowedFileSize} bytes.`
      );
    }
  });

  // Verify rate limits
  Object.entries(config.security.rateLimits).forEach(([key, value]) => {
    if (value <= 0) {
      throw new SecurityConfigError(
        `Invalid rate limit for ${key}: ${value}. Must be greater than 0.`
      );
    }
  });

  // Verify monitoring thresholds
  Object.entries(config.monitoring.thresholds).forEach(([key, value]) => {
    if (value < 0) {
      throw new SecurityConfigError(
        `Invalid monitoring threshold for ${key}: ${value}. Must be non-negative.`
      );
    }
  });

  // Verify content type restrictions
  Object.entries(config.storage.allowedContentTypes).forEach(([key, value]) => {
    if (!Array.isArray(value) || value.length === 0) {
      throw new SecurityConfigError(
        `Invalid content type restrictions for ${key}: Must be a non-empty array.`
      );
    }
  });
}

/**
 * Get environment-specific configuration
 */
export function getEnvironmentConfig(
  config: SecurityConfiguration,
  env: Environment
) {
  const envConfig = config.deployment.environments[env];
  if (!envConfig) {
    throw new SecurityConfigError(`Configuration not found for environment: ${env}`);
  }
  return envConfig;
}

/**
 * Deep merge helper function that properly handles undefined values
 */
function deepMerge(target: any, source: any): any {
  const result = { ...target };
  
  for (const key in source) {
    const sourceValue = source[key];
    const targetValue = target[key];
    
    // Skip undefined values in source - preserve target value
    if (sourceValue === undefined) {
      continue;
    }
    
    // If both values are objects (and not arrays or null), merge recursively
    if (
      sourceValue !== null &&
      targetValue !== null &&
      typeof sourceValue === 'object' &&
      typeof targetValue === 'object' &&
      !Array.isArray(sourceValue) &&
      !Array.isArray(targetValue)
    ) {
      result[key] = deepMerge(targetValue, sourceValue);
    } else {
      // Otherwise, use the source value
      result[key] = sourceValue;
    }
  }
  
  return result;
}

/**
 * Merge default configuration with environment-specific overrides
 */
export function mergeConfigurations(
  baseConfig: SecurityConfiguration,
  envConfig: Partial<SecurityConfiguration>
): SecurityConfiguration {
  return deepMerge(baseConfig, envConfig);
}

/**
 * Load environment-specific configuration
 */
export function loadEnvironmentSecurityConfig(env: Environment): SecurityConfiguration {
  const baseConfig = loadSecurityConfig();
  const envConfig = getEnvironmentConfig(baseConfig, env);
  
  // Load environment-specific overrides if they exist
  const envConfigPath = path.resolve(
    process.cwd(),
    `config/security.${env}.json`
  );
  
  let envOverrides = {};
  if (fs.existsSync(envConfigPath)) {
    try {
      const rawEnvConfig = fs.readFileSync(envConfigPath, 'utf8');
      envOverrides = JSON.parse(rawEnvConfig);
    } catch (error) {
      throw new SecurityConfigError(
        `Failed to load environment-specific configuration for ${env}`,
        error
      );
    }
  }

  // Merge configurations
  const mergedConfig = mergeConfigurations(baseConfig, {
    ...envOverrides,
    deployment: {
      ...baseConfig.deployment,
      environments: {
        ...baseConfig.deployment.environments,
        [env]: envConfig
      }
    }
  });

  // Verify the merged configuration
  verifyConfigValues(mergedConfig);

  return mergedConfig;
}

/**
 * Determine the current environment
 */
export function getCurrentEnvironment(): Environment {
  const env = process.env['NODE_ENV'];
  
  if (!env || !['development', 'staging', 'production'].includes(env)) {
    throw new SecurityConfigError(
      'Invalid or missing NODE_ENV. Must be one of: development, staging, production'
    );
  }
  
  return env as Environment;
}

/**
 * Export a helper to get the current environment's configuration
 */
export function getCurrentEnvironmentConfig(): SecurityConfiguration {
  const env = getCurrentEnvironment();
  return loadEnvironmentSecurityConfig(env);
}

export default {
  loadSecurityConfig,
  loadEnvironmentSecurityConfig,
  getCurrentEnvironmentConfig,
  getCurrentEnvironment,
  verifyConfigValues,
  SecurityConfigError
};
