#!/usr/bin/env node

/**
 * TradeYa PR Environment Setup
 * 
 * Configures Firebase for pre-production PR environments
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

interface PRConfig {
  prNumber: string;
  branchName: string;
  author: string;
  projectId: string;
  environment: 'pr';
  firebaseConfig: {
    projectId: string;
    authDomain: string;
    storageBucket: string;
    databaseURL: string;
  };
}

class PREnvironmentSetup {
  private prNumber: string;
  private branchName: string;
  private author: string;

  constructor() {
    this.prNumber = process.env.PR_NUMBER || process.env.GITHUB_PR_NUMBER || '';
    this.branchName = process.env.BRANCH_NAME || process.env.GITHUB_HEAD_REF || '';
    this.author = process.env.AUTHOR || process.env.GITHUB_ACTOR || '';
  }

  /**
   * Setup PR environment configuration
   */
  async setupPREnvironment(): Promise<void> {
    console.log('🔧 Setting up PR Environment for TradeYa');
    console.log(`📊 PR Number: ${this.prNumber}`);
    console.log(`🌿 Branch: ${this.branchName}`);
    console.log(`👤 Author: ${this.author}`);

    // Generate PR-specific environment variables
    await this.generatePREnvFile();
    
    // Update Firebase configuration
    await this.updateFirebaseConfig();
    
    // Generate PR-specific deployment config
    await this.generatePRDeploymentConfig();

    console.log('✅ PR environment setup completed');
  }

  private async generatePREnvFile(): Promise<void> {
    const envContent = this.generatePREnvContent();
    const envPath = join(process.cwd(), '.env.pr');
    
    writeFileSync(envPath, envContent);
    console.log(`📝 Generated PR environment file: ${envPath}`);
  }

  private generatePREnvContent(): string {
    const timestamp = new Date().toISOString();
    const shortHash = this.getShortGitHash();
    
    return `# TradeYa PR Environment Configuration
# Generated: ${timestamp}
# PR: ${this.prNumber}
# Branch: ${this.branchName}
# Author: ${this.author}

# Environment Identification
NODE_ENV=development
VITE_ENVIRONMENT=pr
VITE_APP_VERSION=pr-${this.prNumber}-${shortHash}

# PR-specific identifiers
VITE_PR_NUMBER=${this.prNumber}
VITE_PR_BRANCH=${this.branchName}
VITE_PR_AUTHOR=${this.author}

# Firebase Configuration (using staging project for PR)
VITE_FIREBASE_PROJECT_ID=tradeya-45ede
VITE_FIREBASE_AUTH_DOMAIN=tradeya-45ede.firebaseapp.com
VITE_FIREBASE_STORAGE_BUCKET=tradeya-45ede.appspot.com
VITE_FIREBASE_DATABASE_URL=https://tradeya-45ede-default-rtdb.firebaseio.com

# Firebase API credentials (should be set in CI/CD environment)
# These will be loaded from the deployment platform's environment variables
VITE_FIREBASE_API_KEY=\${FIREBASE_API_KEY}
VITE_FIREBASE_MESSAGING_SENDER_ID=\${FIREBASE_MESSAGING_SENDER_ID}
VITE_FIREBASE_APP_ID=\${FIREBASE_APP_ID}
VITE_FIREBASE_MEASUREMENT_ID=\${FIREBASE_MEASUREMENT_ID}

# Firebase Emulator Configuration (disabled for PR environments)
VITE_USE_FIREBASE_EMULATORS=false

# Debug Configuration
VITE_DEBUG_MODE=true
VITE_LOG_LEVEL=debug

# Cloudinary Configuration (use staging configuration)
VITE_CLOUDINARY_CLOUD_NAME=\${CLOUDINARY_CLOUD_NAME}
VITE_CLOUDINARY_API_KEY=\${CLOUDINARY_API_KEY}

# PR-specific features
VITE_ENABLE_PR_FEATURES=true
VITE_PR_DATA_ISOLATION=true
`;
  }

  private async updateFirebaseConfig(): Promise<void> {
    // Update .firebaserc for PR environment
    const firebasercPath = join(process.cwd(), '.firebaserc');
    
    if (existsSync(firebasercPath)) {
      const firebaserc = JSON.parse(readFileSync(firebasercPath, 'utf8'));
      
      // Add PR-specific project configuration
      if (!firebaserc.projects) {
        firebaserc.projects = {};
      }
      
      // For PR environments, we'll use the staging project
      // In a real setup, you might want to create dedicated PR projects
      firebaserc.projects.pr = 'tradeya-45ede';
      
      writeFileSync(firebasercPath, JSON.stringify(firebaserc, null, 2));
      console.log('📝 Updated .firebaserc for PR environment');
    }
  }

  private async generatePRDeploymentConfig(): Promise<void> {
    const config: PRConfig = {
      prNumber: this.prNumber,
      branchName: this.branchName,
      author: this.author,
      projectId: 'tradeya-45ede',
      environment: 'pr',
      firebaseConfig: {
        projectId: 'tradeya-45ede',
        authDomain: 'tradeya-45ede.firebaseapp.com',
        storageBucket: 'tradeya-45ede.appspot.com',
        databaseURL: 'https://tradeya-45ede-default-rtdb.firebaseio.com'
      }
    };

    const configPath = join(process.cwd(), 'config', 'pr-environment.json');
    
    // Ensure config directory exists
    const configDir = join(process.cwd(), 'config');
    if (!existsSync(configDir)) {
      require('fs').mkdirSync(configDir, { recursive: true });
    }
    
    writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log(`📝 Generated PR deployment config: ${configPath}`);
  }

  private getShortGitHash(): string {
    try {
      const { execSync } = require('child_process');
      return execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
    } catch {
      return 'unknown';
    }
  }
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const setup = new PREnvironmentSetup();
  setup.setupPREnvironment()
    .then(() => {
      console.log('🎉 PR environment setup completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ PR environment setup failed:', error);
      process.exit(1);
    });
}

export { PREnvironmentSetup };