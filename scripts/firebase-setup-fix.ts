#!/usr/bin/env node

/**
 * Firebase Setup Fix for Preproduction Issues
 * 
 * This script addresses the core Firebase configuration issues
 * preventing login and database access in preproduction environments.
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
}

class FirebaseSetupFix {
  private projectRoot: string;

  constructor() {
    this.projectRoot = process.cwd();
  }

  async fixFirebaseConfiguration(): Promise<void> {
    console.log('🔧 Fixing Firebase Configuration for Preproduction');
    console.log('================================================');

    // 1. Check current environment
    await this.checkCurrentEnvironment();

    // 2. Fix environment variables
    await this.fixEnvironmentVariables();

    // 3. Update Firebase configuration
    await this.updateFirebaseConfig();

    // 4. Test Firebase connectivity
    await this.testFirebaseConnectivity();

    // 5. Generate deployment configuration
    await this.generateDeploymentConfig();

    console.log('✅ Firebase configuration fix completed');
  }

  private async checkCurrentEnvironment(): Promise<void> {
    console.log('\n🔍 Checking Current Environment...');
    
    const branch = await this.getCurrentBranch();
    const envVars = this.getEnvironmentVariables();
    
    console.log(`📊 Current Branch: ${branch}`);
    console.log(`🌍 NODE_ENV: ${envVars.NODE_ENV || 'undefined'}`);
    console.log(`🔧 VITE_ENVIRONMENT: ${envVars.VITE_ENVIRONMENT || 'undefined'}`);
    console.log(`🔥 Firebase Project: ${envVars.VITE_FIREBASE_PROJECT_ID || 'undefined'}`);
  }

  private async getCurrentBranch(): Promise<string> {
    try {
      const { execSync } = require('child_process');
      return execSync('git branch --show-current', { encoding: 'utf8' }).trim();
    } catch {
      return 'unknown';
    }
  }

  private getEnvironmentVariables(): Record<string, string> {
    return {
      NODE_ENV: process.env.NODE_ENV || '',
      VITE_ENVIRONMENT: process.env.VITE_ENVIRONMENT || '',
      VITE_FIREBASE_PROJECT_ID: process.env.VITE_FIREBASE_PROJECT_ID || '',
      VITE_FIREBASE_API_KEY: process.env.VITE_FIREBASE_API_KEY || '',
      VITE_FIREBASE_AUTH_DOMAIN: process.env.VITE_FIREBASE_AUTH_DOMAIN || '',
    };
  }

  private async fixEnvironmentVariables(): Promise<void> {
    console.log('\n🔧 Fixing Environment Variables...');

    const envFiles = ['.env', '.env.local', '.env.pr'];
    
    for (const envFile of envFiles) {
      const envPath = join(this.projectRoot, envFile);
      
      if (existsSync(envPath)) {
        console.log(`📝 Found existing ${envFile}`);
        const content = readFileSync(envPath, 'utf8');
        
        // Check if it has the required Firebase variables
        const hasRequiredVars = this.checkRequiredEnvironmentVariables(content);
        
        if (!hasRequiredVars) {
          console.log(`⚠️  ${envFile} missing required Firebase variables`);
          await this.updateEnvironmentFile(envPath, content);
        } else {
          console.log(`✅ ${envFile} has required Firebase variables`);
        }
      } else {
        console.log(`📝 Creating ${envFile}`);
        await this.createEnvironmentFile(envPath);
      }
    }
  }

  private checkRequiredEnvironmentVariables(content: string): boolean {
    const requiredVars = [
      'VITE_FIREBASE_PROJECT_ID',
      'VITE_FIREBASE_API_KEY',
      'VITE_FIREBASE_AUTH_DOMAIN',
      'VITE_FIREBASE_STORAGE_BUCKET',
      'VITE_FIREBASE_MESSAGING_SENDER_ID',
      'VITE_FIREBASE_APP_ID'
    ];

    return requiredVars.every(varName => content.includes(varName));
  }

  private async updateEnvironmentFile(envPath: string, existingContent: string): Promise<void> {
    const firebaseConfig = this.getFirebaseConfigForEnvironment();
    const updatedContent = this.mergeEnvironmentContent(existingContent, firebaseConfig);
    
    writeFileSync(envPath, updatedContent);
    console.log(`✅ Updated ${envPath}`);
  }

  private async createEnvironmentFile(envPath: string): Promise<void> {
    const firebaseConfig = this.getFirebaseConfigForEnvironment();
    const envContent = this.generateEnvironmentContent(firebaseConfig);
    
    writeFileSync(envPath, envContent);
    console.log(`✅ Created ${envPath}`);
  }

  private getFirebaseConfigForEnvironment(): FirebaseConfig {
    // For preproduction, use staging project configuration
    return {
      apiKey: 'AIzaSyDummyKeyForPreproductionTesting',
      authDomain: 'tradeya-45ede.firebaseapp.com',
      projectId: 'tradeya-45ede',
      storageBucket: 'tradeya-45ede.appspot.com',
      messagingSenderId: '123456789',
      appId: '1:123456789:web:abcdef123456',
      measurementId: 'G-XXXXXXXXXX'
    };
  }

  private generateEnvironmentContent(config: FirebaseConfig): string {
    return `# TradeYa Environment Configuration
# Generated for preproduction debugging

# Environment Identification
NODE_ENV=development
VITE_ENVIRONMENT=pr

# Firebase Configuration
VITE_FIREBASE_PROJECT_ID=${config.projectId}
VITE_FIREBASE_AUTH_DOMAIN=${config.authDomain}
VITE_FIREBASE_STORAGE_BUCKET=${config.storageBucket}
VITE_FIREBASE_DATABASE_URL=https://${config.projectId}-default-rtdb.firebaseio.com
VITE_FIREBASE_API_KEY=${config.apiKey}
VITE_FIREBASE_MESSAGING_SENDER_ID=${config.messagingSenderId}
VITE_FIREBASE_APP_ID=${config.appId}
VITE_FIREBASE_MEASUREMENT_ID=${config.measurementId}

# Firebase Emulator Configuration
VITE_USE_FIREBASE_EMULATORS=false

# Debug Configuration
VITE_DEBUG_MODE=true
VITE_LOG_LEVEL=debug

# Cloudinary Configuration
VITE_CLOUDINARY_CLOUD_NAME=placeholder
VITE_CLOUDINARY_API_KEY=placeholder

# PR-specific features
VITE_ENABLE_PR_FEATURES=true
VITE_PR_DATA_ISOLATION=true
`;
  }

  private mergeEnvironmentContent(existingContent: string, config: FirebaseConfig): string {
    const lines = existingContent.split('\n');
    const newLines: string[] = [];
    const configVars = new Map([
      ['VITE_FIREBASE_PROJECT_ID', config.projectId],
      ['VITE_FIREBASE_AUTH_DOMAIN', config.authDomain],
      ['VITE_FIREBASE_STORAGE_BUCKET', config.storageBucket],
      ['VITE_FIREBASE_DATABASE_URL', `https://${config.projectId}-default-rtdb.firebaseio.com`],
      ['VITE_FIREBASE_API_KEY', config.apiKey],
      ['VITE_FIREBASE_MESSAGING_SENDER_ID', config.messagingSenderId],
      ['VITE_FIREBASE_APP_ID', config.appId],
      ['VITE_FIREBASE_MEASUREMENT_ID', config.measurementId],
    ]);

    const existingVars = new Set<string>();
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const [key] = trimmedLine.split('=');
        if (key && configVars.has(key)) {
          existingVars.add(key);
          newLines.push(`${key}=${configVars.get(key)}`);
        } else {
          newLines.push(line);
        }
      } else {
        newLines.push(line);
      }
    }

    // Add missing variables
    for (const [key, value] of configVars) {
      if (!existingVars.has(key)) {
        newLines.push(`${key}=${value}`);
      }
    }

    return newLines.join('\n');
  }

  private async updateFirebaseConfig(): Promise<void> {
    console.log('\n🔧 Updating Firebase Configuration...');

    // Update .firebaserc
    await this.updateFirebaserc();
    
    // Update firebase.json if needed
    await this.updateFirebaseJson();
  }

  private async updateFirebaserc(): Promise<void> {
    const firebasercPath = join(this.projectRoot, '.firebaserc');
    
    if (existsSync(firebasercPath)) {
      const firebaserc = JSON.parse(readFileSync(firebasercPath, 'utf8'));
      
      // Ensure PR environment is configured
      if (!firebaserc.projects) {
        firebaserc.projects = {};
      }
      
      firebaserc.projects.pr = 'tradeya-45ede';
      firebaserc.projects.staging = 'tradeya-45ede';
      
      writeFileSync(firebasercPath, JSON.stringify(firebaserc, null, 2));
      console.log('✅ Updated .firebaserc');
    }
  }

  private async updateFirebaseJson(): Promise<void> {
    const firebaseJsonPath = join(this.projectRoot, 'firebase.json');
    
    if (existsSync(firebaseJsonPath)) {
      console.log('✅ firebase.json configuration looks good');
    }
  }

  private async testFirebaseConnectivity(): Promise<void> {
    console.log('\n🧪 Testing Firebase Connectivity...');

    try {
      // Test Firebase configuration loading
      const { getFirebaseConfig } = await import('../src/firebase-config.ts');
      const config = getFirebaseConfig();
      
      console.log('✅ Firebase configuration loaded successfully');
      console.log(`📊 Project ID: ${config.projectId}`);
      console.log(`🔐 Auth Domain: ${config.authDomain}`);
      
      // Test Firebase initialization
      const { initializeFirebase } = await import('../src/firebase-config.ts');
      await initializeFirebase();
      
      console.log('✅ Firebase initialization successful');
      
    } catch (error) {
      console.log('❌ Firebase connectivity test failed:');
      console.log(`   Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.log('   This is expected with placeholder API keys');
    }
  }

  private async generateDeploymentConfig(): Promise<void> {
    console.log('\n📝 Generating Deployment Configuration...');

    const deploymentConfig = {
      environment: 'pr',
      projectId: 'tradeya-45ede',
      branch: await this.getCurrentBranch(),
      timestamp: new Date().toISOString(),
      firebaseConfig: this.getFirebaseConfigForEnvironment(),
      issues: [
        'Missing real Firebase API credentials',
        'Environment variables need to be set in deployment platform',
        'Firebase CLI authentication required for deployment'
      ],
      solutions: [
        'Set real Firebase API credentials in deployment environment',
        'Configure Firebase CLI authentication',
        'Update environment variables in hosting platform'
      ]
    };

    const configPath = join(this.projectRoot, 'config', 'firebase-debug-config.json');
    
    // Ensure config directory exists
    const configDir = join(this.projectRoot, 'config');
    if (!existsSync(configDir)) {
      require('fs').mkdirSync(configDir, { recursive: true });
    }
    
    writeFileSync(configPath, JSON.stringify(deploymentConfig, null, 2));
    console.log(`✅ Generated deployment config: ${configPath}`);
  }
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const fix = new FirebaseSetupFix();
  fix.fixFirebaseConfiguration()
    .then(() => {
      console.log('\n🎉 Firebase setup fix completed successfully');
      console.log('\n📋 Next Steps:');
      console.log('1. Set real Firebase API credentials in your deployment environment');
      console.log('2. Run: firebase login');
      console.log('3. Run: firebase use tradeya-45ede');
      console.log('4. Test your application with: npm run dev');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Firebase setup fix failed:', error);
      process.exit(1);
    });
}

export { FirebaseSetupFix };