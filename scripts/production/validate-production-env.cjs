#!/usr/bin/env node

const { configDotenv } = require('dotenv');
const { resolve } = require('path');
const { existsSync, readFileSync } = require('fs');

// Load production environment
configDotenv({ path: resolve(process.cwd(), '.env.production') });

function validateEnvironment() {
  const result = {
    passed: true,
    errors: [],
    warnings: []
  };

  console.log('🔍 Validating production environment configuration...\n');

  // Check FIREBASE_PROJECT_ID
  const projectId = process.env.FIREBASE_PROJECT_ID;
  if (!projectId) {
    result.errors.push('FIREBASE_PROJECT_ID is not set');
    result.passed = false;
  } else if (projectId !== 'tradeya-45ede') {
    result.errors.push(`FIREBASE_PROJECT_ID should be 'tradeya-45ede', got '${projectId}'`);
    result.passed = false;
  } else {
    console.log('✅ FIREBASE_PROJECT_ID is correctly set to tradeya-45ede');
  }

  // Check NODE_ENV
  const nodeEnv = process.env.NODE_ENV;
  if (!nodeEnv) {
    result.errors.push('NODE_ENV is not set');
    result.passed = false;
  } else if (nodeEnv !== 'production') {
    result.errors.push(`NODE_ENV should be 'production', got '${nodeEnv}'`);
    result.passed = false;
  } else {
    console.log('✅ NODE_ENV is correctly set to production');
  }

  // Check Firestore indexes
  const indexesPath = resolve(process.cwd(), 'firestore.indexes.json');
  if (!existsSync(indexesPath)) {
    result.errors.push('firestore.indexes.json not found');
    result.passed = false;
  } else {
    try {
      const indexesContent = readFileSync(indexesPath, 'utf8');
      const indexes = JSON.parse(indexesContent);
      
      if (!indexes.indexes || indexes.indexes.length < 3) {
        result.errors.push(`At least 3 Firestore indexes required, found ${indexes.indexes?.length || 0}`);
        result.passed = false;
      } else {
        console.log(`✅ ${indexes.indexes.length} Firestore indexes configured`);
      }
    } catch (error) {
      result.errors.push(`Failed to parse firestore.indexes.json: ${error.message}`);
      result.passed = false;
    }
  }

  // Check security configuration
  const securityConfigPath = resolve(process.cwd(), 'config/security.config.json');
  if (!existsSync(securityConfigPath)) {
    result.errors.push('config/security.config.json not found');
    result.passed = false;
  } else {
    try {
      const securityConfig = JSON.parse(readFileSync(securityConfigPath, 'utf8'));
      
      const requiredSecuritySettings = ['enableSecurityRules', 'enableCORS', 'rateLimitEnabled'];
      const missingSettings = requiredSecuritySettings.filter(setting => !securityConfig[setting]);
      
      if (missingSettings.length > 0) {
        result.errors.push(`Missing security settings: ${missingSettings.join(', ')}`);
        result.passed = false;
      } else {
        console.log('✅ Security configuration validated');
      }
    } catch (error) {
      result.errors.push(`Failed to parse security.config.json: ${error.message}`);
      result.passed = false;
    }
  }

  // Check .firebaserc
  const firebaseRcPath = resolve(process.cwd(), '.firebaserc');
  if (!existsSync(firebaseRcPath)) {
    result.warnings.push('.firebaserc not found');
  } else {
    try {
      const firebaseRc = JSON.parse(readFileSync(firebaseRcPath, 'utf8'));
      if (firebaseRc.projects?.default !== 'tradeya-45ede') {
        result.warnings.push(`.firebaserc default project should be 'tradeya-45ede'`);
      } else {
        console.log('✅ .firebaserc configured correctly');
      }
    } catch (error) {
      result.warnings.push(`Failed to parse .firebaserc: ${error.message}`);
    }
  }

  return result;
}

function main() {
  const result = validateEnvironment();

  console.log('\n📊 Validation Summary:');
  console.log('='.repeat(50));

  if (result.passed) {
    console.log('🎉 All validations passed! Production environment is ready.');
  } else {
    console.log('❌ Validation failed. Please fix the following errors:');
    result.errors.forEach(error => console.log(`  • ${error}`));
  }

  if (result.warnings.length > 0) {
    console.log('\n⚠️ Warnings:');
    result.warnings.forEach(warning => console.log(`  • ${warning}`));
  }

  console.log('\n');
  process.exit(result.passed ? 0 : 1);
}

if (require.main === module) {
  main();
}

module.exports = { validateEnvironment };