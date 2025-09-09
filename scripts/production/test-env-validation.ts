#!/usr/bin/env node

/**
 * Test script to validate environment variable loading and validation
 */

import { ProductionEnvironmentSetup } from './production-env-setup';
import { initializeProductionEnvironment, logEnvironmentValidation } from './env-loader';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

async function testEnvironmentValidation() {
  console.log('🧪 Testing Environment Validation');
  console.log('=' + '='.repeat(35));

  try {
    // Test 1: Environment Loading
    console.log('\n1️⃣ Testing Environment Variable Loading:');
    const envVars = initializeProductionEnvironment();
    
    // Test 2: Environment Validation in ProductionEnvironmentSetup
    console.log('\n2️⃣ Testing ProductionEnvironmentSetup:');
    const setup = new ProductionEnvironmentSetup('tradeya-45ede', 'production');
    const result = await setup.setupProductionEnvironment();
    
    console.log('\n📊 Environment Setup Results:');
    console.log(`✅ Success: ${result.success}`);
    console.log(`🔍 Validations: ${result.validationResults.length}`);
    
    result.validationResults.forEach(validation => {
      const status = validation.passed ? '✅' : '❌';
      console.log(`   ${status} ${validation.name}: ${validation.details}`);
    });

    // Test 3: File Existence Validation
    console.log('\n3️⃣ Testing File Existence:');
    
    const files = [
      { path: '.env.production', name: 'Production Environment File' },
      { path: 'firestore.indexes.json', name: 'Firestore Indexes' },
      { path: 'config/security.config.json', name: 'Security Configuration' }
    ];
    
    files.forEach(file => {
      const fullPath = join(process.cwd(), file.path);
      const exists = existsSync(fullPath);
      console.log(`   ${exists ? '✅' : '❌'} ${file.name}: ${exists ? 'EXISTS' : 'MISSING'}`);
      
      if (exists && file.path.endsWith('.json')) {
        try {
          const content = readFileSync(fullPath, 'utf8');
          const parsed = JSON.parse(content);
          
          if (file.path === 'firestore.indexes.json') {
            const indexCount = parsed.indexes?.length || 0;
            console.log(`      📋 Indexes found: ${indexCount}`);
          } else if (file.path === 'config/security.config.json') {
            const securityFeatures = Object.keys(parsed).length;
            console.log(`      🔒 Security features: ${securityFeatures}`);
          }
        } catch (error) {
          console.log(`      ❌ JSON parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    });

    // Test 4: Critical Environment Variables
    console.log('\n4️⃣ Testing Critical Environment Variables:');
    const criticalVars = ['FIREBASE_PROJECT_ID', 'NODE_ENV'];
    criticalVars.forEach(varName => {
      const value = envVars[varName] || process.env[varName];
      const status = value ? '✅' : '❌';
      const displayValue = varName.includes('KEY') || varName.includes('SECRET') 
        ? '[REDACTED]' 
        : value || 'NOT SET';
      console.log(`   ${status} ${varName}: ${displayValue}`);
    });

    // Test 5: Specific Value Validation
    console.log('\n5️⃣ Testing Specific Value Validation:');
    const projectId = envVars.FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;
    const nodeEnv = envVars.NODE_ENV || process.env.NODE_ENV;
    
    console.log(`   ${projectId === 'tradeya-45ede' ? '✅' : '❌'} Project ID: ${projectId === 'tradeya-45ede' ? 'CORRECT' : `WRONG (${projectId})`}`);
    console.log(`   ${nodeEnv === 'production' ? '✅' : '❌'} Node Environment: ${nodeEnv === 'production' ? 'CORRECT' : `WRONG (${nodeEnv})`}`);

    console.log('\n🎯 Overall Test Result:');
    const overallSuccess = result.success && 
                          projectId === 'tradeya-45ede' && 
                          nodeEnv === 'production';
    
    console.log(`${overallSuccess ? '🎉' : '💥'} Environment validation: ${overallSuccess ? 'PASSED' : 'FAILED'}`);
    
    if (!overallSuccess) {
      console.log('\n💡 Recommendations:');
      result.recommendations.forEach(rec => console.log(`   • ${rec}`));
    }

    process.exit(overallSuccess ? 0 : 1);

  } catch (error) {
    console.error('\n💥 Test failed with error:', error instanceof Error ? error.message : 'Unknown error');
    console.error('Stack:', error instanceof Error ? error.stack : 'No stack trace available');
    process.exit(1);
  }
}

// Run the test
testEnvironmentValidation();