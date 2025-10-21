#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Simple environment variable loader (without dotenv dependency)
function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  const env = {};
  
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

function validateEnvironment() {
  const result = {
    passed: true,
    errors: [],
    warnings: []
  };

  console.log('🔍 Validating production environment configuration...\n');

  // Load environment variables from .env.production
  const envPath = path.resolve(process.cwd(), '.env.production');
  const envVars = loadEnvFile(envPath);
  
  // Also check process.env (set by system or loaded elsewhere)
  const allEnvVars = { ...envVars, ...process.env };

  // Check FIREBASE_PROJECT_ID
  const projectId = allEnvVars.FIREBASE_PROJECT_ID;
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
  const nodeEnv = allEnvVars.NODE_ENV;
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
  const indexesPath = path.resolve(process.cwd(), 'firestore.indexes.json');
  if (!fs.existsSync(indexesPath)) {
    result.errors.push('firestore.indexes.json not found');
    result.passed = false;
  } else {
    try {
      const indexesContent = fs.readFileSync(indexesPath, 'utf8');
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
  const securityConfigPath = path.resolve(process.cwd(), 'config/security.config.json');
  if (!fs.existsSync(securityConfigPath)) {
    result.errors.push('config/security.config.json not found');
    result.passed = false;
  } else {
    try {
      const securityConfig = JSON.parse(fs.readFileSync(securityConfigPath, 'utf8'));
      
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
  const firebaseRcPath = path.resolve(process.cwd(), '.firebaserc');
  if (!fs.existsSync(firebaseRcPath)) {
    result.warnings.push('.firebaserc not found');
  } else {
    try {
      const firebaseRc = JSON.parse(fs.readFileSync(firebaseRcPath, 'utf8'));
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