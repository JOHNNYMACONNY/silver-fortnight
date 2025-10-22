#!/usr/bin/env node

/**
 * Environment Variable Loader for Production Scripts
 * 
 * Provides consistent environment loading across all production deployment scripts
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

export interface EnvironmentVariables {
  FIREBASE_PROJECT_ID?: string;
  NODE_ENV?: string;
  FIREBASE_PRIVATE_KEY?: string;
  FIREBASE_CLIENT_EMAIL?: string;
  [key: string]: string | undefined;
}

/**
 * Simple environment file loader (without external dependencies)
 */
export function loadEnvFile(filePath: string): EnvironmentVariables {
  if (!existsSync(filePath)) {
    return {};
  }
  
  const content = readFileSync(filePath, 'utf8');
  const env: EnvironmentVariables = {};
  
  content.split('\n').forEach(line => {
    line = line.trim();
    if (line && !line.startsWith('#')) {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        let value = valueParts.join('=');
        // Remove quotes if present
        if ((value.startsWith('"') && value.endsWith('"')) || 
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        env[key] = value;
      }
    }
  });
  
  return env;
}

/**
 * Load production environment variables and merge with process.env
 */
export function loadProductionEnvironment(): EnvironmentVariables {
  const envPath = join(process.cwd(), '.env.production');
  const envVars = loadEnvFile(envPath);
  
  // Merge with process.env, giving priority to already set environment variables
  const merged: EnvironmentVariables = { ...envVars, ...process.env };
  
  // Set environment variables in process.env for compatibility
  Object.entries(envVars).forEach(([key, value]) => {
    if (value !== undefined && !process.env[key]) {
      process.env[key] = value;
    }
  });
  
  return merged;
}

/**
 * Validate required environment variables for production deployment
 */
export function validateRequiredEnvironmentVariables(envVars: EnvironmentVariables): {
  isValid: boolean;
  missing: string[];
  present: string[];
} {
  const required = ['FIREBASE_PROJECT_ID', 'NODE_ENV'];
  const missing = required.filter(varName => !envVars[varName]);
  const present = required.filter(varName => envVars[varName]);
  
  return {
    isValid: missing.length === 0,
    missing,
    present
  };
}

/**
 * Validate project-specific environment variable values
 */
export function validateProjectEnvironmentValues(envVars: EnvironmentVariables): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  // Validate FIREBASE_PROJECT_ID
  if (envVars.FIREBASE_PROJECT_ID && envVars.FIREBASE_PROJECT_ID !== 'tradeya-45ede') {
    errors.push(`FIREBASE_PROJECT_ID should be 'tradeya-45ede', got '${envVars.FIREBASE_PROJECT_ID}'`);
  }
  
  // Validate NODE_ENV for production
  if (envVars.NODE_ENV && envVars.NODE_ENV !== 'production') {
    errors.push(`NODE_ENV should be 'production' for production deployment, got '${envVars.NODE_ENV}'`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Get environment variable with fallback and validation
 */
export function getEnvironmentVariable(
  envVars: EnvironmentVariables, 
  key: string, 
  fallback?: string
): string {
  const value = envVars[key] || fallback;
  if (!value) {
    throw new Error(`Required environment variable ${key} is not set`);
  }
  return value;
}

/**
 * Log environment validation results
 */
export function logEnvironmentValidation(
  envVars: EnvironmentVariables,
  source: string = 'production-deployment'
): void {
  console.log(`\n🔍 Environment Validation (${source}):`);
  console.log('=' + '='.repeat(40 + source.length));
  
  const validation = validateRequiredEnvironmentVariables(envVars);
  const projectValidation = validateProjectEnvironmentValues(envVars);
  
  // Log present variables
  if (validation.present.length > 0) {
    console.log('✅ Required variables present:');
    validation.present.forEach(varName => {
      const value = envVars[varName];
      const maskedValue = varName.includes('KEY') || varName.includes('SECRET') 
        ? '[REDACTED]' 
        : value;
      console.log(`   • ${varName}=${maskedValue}`);
    });
  }
  
  // Log missing variables
  if (validation.missing.length > 0) {
    console.log('❌ Missing required variables:');
    validation.missing.forEach(varName => {
      console.log(`   • ${varName}`);
    });
  }
  
  // Log validation errors
  if (projectValidation.errors.length > 0) {
    console.log('❌ Environment value errors:');
    projectValidation.errors.forEach(error => {
      console.log(`   • ${error}`);
    });
  }
  
  const overallValid = validation.isValid && projectValidation.isValid;
  console.log(`\n${overallValid ? '✅' : '❌'} Environment validation: ${overallValid ? 'PASSED' : 'FAILED'}`);
}

/**
 * Initialize production environment for deployment scripts
 */
export function initializeProductionEnvironment(): EnvironmentVariables {
  console.log('🚀 Loading production environment configuration...');
  
  const envVars = loadProductionEnvironment();
  logEnvironmentValidation(envVars, 'initialization');
  
  const validation = validateRequiredEnvironmentVariables(envVars);
  const projectValidation = validateProjectEnvironmentValues(envVars);
  
  if (!validation.isValid || !projectValidation.isValid) {
    console.error('\n💥 Environment validation failed. Please fix the issues above before proceeding.');
    process.exit(1);
  }
  
  console.log('✅ Production environment initialized successfully\n');
  return envVars;
}