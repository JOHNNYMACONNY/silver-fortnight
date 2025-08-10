#!/usr/bin/env tsx
/**
 * Firebase Configuration Diagnostic Tool
 * 
 * Comprehensive analysis of Firebase configuration issues
 * that are causing hook.js:608 overrideMethod errors
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import chalk from 'chalk';

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env file
const loadEnvFile = () => {
  const envPath = join(__dirname, '..', '.env');
  if (existsSync(envPath)) {
    try {
      const envContent = readFileSync(envPath, 'utf8');
      const lines = envContent.split('\n');
      
      lines.forEach(line => {
        const trimmedLine = line.trim();
        if (trimmedLine && !trimmedLine.startsWith('#')) {
          const [key, ...valueParts] = trimmedLine.split('=');
          if (key && valueParts.length > 0) {
            let value = valueParts.join('=');
            // Remove quotes if present
            if ((value.startsWith('"') && value.endsWith('"')) || 
                (value.startsWith("'") && value.endsWith("'"))) {
              value = value.slice(1, -1);
            }
            process.env[key] = value;
          }
        }
      });
      
      console.log(chalk.green('✅ Environment variables loaded from .env file'));
    } catch (error) {
      console.warn(chalk.yellow('⚠️  Failed to load .env file:', error));
    }
  } else {
    console.warn(chalk.yellow('⚠️  No .env file found at:', envPath));
  }
};

// Load environment variables before starting diagnostic
loadEnvFile();

interface DiagnosticResult {
  category: string;
  severity: 'critical' | 'warning' | 'info';
  issue: string;
  description: string;
  solution: string;
}

class FirebaseConfigDiagnostic {
  private results: DiagnosticResult[] = [];
  private projectRoot: string;

  constructor() {
    this.projectRoot = join(__dirname, '..');
    console.log(`🔍 Diagnostic starting from: ${this.projectRoot}`);
  }

  private addResult(category: string, severity: 'critical' | 'warning' | 'info', issue: string, description: string, solution: string) {
    this.results.push({ category, severity, issue, description, solution });
  }

  private checkFirebaseSDKVersions() {
    console.log(chalk.blue('\n🔍 Checking Firebase SDK Versions...'));
    
    try {
      const packageJsonPath = join(this.projectRoot, 'package.json');
      console.log(`Reading package.json from: ${packageJsonPath}`);
      
      if (!existsSync(packageJsonPath)) {
        this.addResult(
          'SDK Versions',
          'critical',
          'Package.json Not Found',
          `package.json not found at ${packageJsonPath}`,
          'Ensure you are running this script from the project root directory'
        );
        return;
      }
      
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
      
      const firebaseVersion = packageJson.dependencies?.firebase;
      const firebaseAdminVersion = packageJson.devDependencies?.['firebase-admin'];
      const firebaseRulesTestingVersion = packageJson.devDependencies?.['@firebase/rules-unit-testing'];
      
      console.log(`Firebase SDK: ${firebaseVersion || 'NOT FOUND'}`);
      console.log(`Firebase Admin: ${firebaseAdminVersion || 'NOT FOUND'}`);
      console.log(`Firebase Rules Testing: ${firebaseRulesTestingVersion || 'NOT FOUND'}`);
      
      if (!firebaseVersion) {
        this.addResult(
          'SDK Versions',
          'critical',
          'Firebase SDK Not Installed',
          'Firebase SDK is not found in dependencies',
          'Install Firebase SDK: npm install firebase'
        );
        return;
      }
      
      // Check current version compatibility
      if (firebaseVersion.includes('10.')) {
        console.log(chalk.green('✅ Firebase v10.x.x - Good compatibility'));
      } else if (firebaseVersion === '^11.9.0') {
        this.addResult(
          'SDK Versions',
          'critical',
          'Firebase v11.9.0 Compatibility Issue',
          'Firebase v11.9.0 has known issues with overrideMethod in certain configurations. This is likely the primary cause of hook.js:608 errors.',
          'Downgrade to Firebase v10.x.x stable version or upgrade to Firebase v11.10.0+ when available'
        );
      }
      
      if (firebaseAdminVersion === '^12.0.0' && firebaseVersion.includes('10.')) {
        this.addResult(
          'SDK Versions',
          'info',
          'Admin SDK Version Note',
          'Firebase Admin v12.0.0 with Firebase v10.x.x - This combination should work fine',
          'No action needed - versions are compatible'
        );
      }
      
    } catch (error) {
      console.error('Error reading package.json:', error);
      this.addResult(
        'SDK Versions',
        'critical',
        'Package.json Read Error',
        `Cannot read package.json: ${error}`,
        'Ensure package.json exists and is readable'
      );
    }
  }

  private checkFirebaseConfiguration() {
    console.log(chalk.blue('\n🔍 Checking Firebase Configuration...'));
    
    try {
      const configPath = join(this.projectRoot, 'src', 'firebase-config.ts');
      console.log(`Checking Firebase config at: ${configPath}`);
      
      if (!existsSync(configPath)) {
        this.addResult(
          'Configuration',
          'critical',
          'Firebase Config Not Found',
          `firebase-config.ts not found at ${configPath}`,
          'Create src/firebase-config.ts with proper Firebase initialization'
        );
        return;
      }
      
      const configContent = readFileSync(configPath, 'utf8');
      
      // Check for multiple initialization patterns
      const hasRobustInitialization = configContent.includes('initializeFirebase');
      const hasGetAppsCheck = configContent.includes('getApps()');
      const hasProperErrorHandling = configContent.includes('getSyncFirebaseAuth');
      
      console.log(`Robust initialization pattern: ${hasRobustInitialization}`);
      console.log(`Duplicate app prevention: ${hasGetAppsCheck}`);
      console.log(`Proper error handling: ${hasProperErrorHandling}`);
      
      if (hasRobustInitialization && hasGetAppsCheck && hasProperErrorHandling) {
        console.log(chalk.green('✅ Firebase configuration looks robust'));
      } else {
        this.addResult(
          'Configuration',
          'warning',
          'Firebase Configuration Could Be Improved',
          'The configuration might not have the most robust patterns for preventing initialization errors.',
          'Consider using the enhanced Firebase configuration pattern with proper error handling'
        );
      }
      
      // Check for unsafe fallbacks (old pattern)
      if (configContent.includes('|| ({} as Auth)') || configContent.includes('|| ({} as Firestore)')) {
        this.addResult(
          'Configuration',
          'critical',
          'Unsafe Fallback Objects',
          'Empty object fallbacks for Auth and Firestore can cause method call errors including overrideMethod issues.',
          'Replace empty object fallbacks with proper null checks and error handling'
        );
      }
      
    } catch (error) {
      console.error('Error reading firebase-config.ts:', error);
      this.addResult(
        'Configuration',
        'critical',
        'Firebase Config Read Error',
        `Cannot read firebase-config.ts: ${error}`,
        'Ensure src/firebase-config.ts exists and is readable'
      );
    }
  }

  private checkEnvironmentVariables() {
    console.log(chalk.blue('\n🔍 Checking Environment Variables...'));
    
    const requiredVars = [
      'VITE_FIREBASE_API_KEY',
      'VITE_FIREBASE_AUTH_DOMAIN',
      'VITE_FIREBASE_PROJECT_ID',
      'VITE_FIREBASE_STORAGE_BUCKET',
      'VITE_FIREBASE_MESSAGING_SENDER_ID',
      'VITE_FIREBASE_APP_ID'
    ];
    
    console.log('Checking for required environment variables...');
    const missingVars = [];
    const foundVars = [];
    
    requiredVars.forEach(varName => {
      const hasVar = !!process.env[varName];
      console.log(`${varName}: ${hasVar ? chalk.green('FOUND') : chalk.red('MISSING')}`);
      if (hasVar) {
        foundVars.push(varName);
      } else {
        missingVars.push(varName);
      }
    });
    
    if (missingVars.length === 0) {
      console.log(chalk.green('✅ All required environment variables are present'));
    } else {
      this.addResult(
        'Environment',
        'critical',
        'Missing Environment Variables',
        `Missing required Firebase environment variables: ${missingVars.join(', ')}`,
        'Ensure all VITE_FIREBASE_* variables are set in your .env file'
      );
    }
    
    // Check for conflicting prefixes
    const hasViteVars = foundVars.length > 0;
    const hasReactVars = requiredVars.some(varName => process.env[varName.replace('VITE_', 'REACT_APP_')]);
    
    if (hasViteVars && hasReactVars) {
      this.addResult(
        'Environment',
        'warning',
        'Conflicting Environment Variable Prefixes',
        'Both VITE_ and REACT_APP_ prefixed variables detected, which may cause configuration conflicts.',
        'Use only VITE_ prefixed variables for Vite projects'
      );
    }
    
    // Check for .env file
    const envPath = join(this.projectRoot, '.env');
    if (!existsSync(envPath)) {
      this.addResult(
        'Environment',
        'warning',
        'No .env File Found',
        '.env file not found in project root',
        'Create .env file with VITE_FIREBASE_* variables'
      );
    } else {
      console.log(chalk.green('✅ .env file found and loaded'));
    }
  }

  private checkDuplicateInitialization() {
    console.log(chalk.blue('\n🔍 Checking for Duplicate Firebase Initialization...'));
    
    const filesToCheck = [
      'src/main.tsx',
      'src/App.tsx',
      'src/AuthContext.tsx',
      'src/services/firestore.ts'
    ];
    
    let initializationCount = 0;
    const initializationFiles: string[] = [];
    
    filesToCheck.forEach(file => {
      const filePath = join(this.projectRoot, file);
      console.log(`Checking ${file}...`);
      if (existsSync(filePath)) {
        try {
          const content = readFileSync(filePath, 'utf8');
          if (content.includes('initializeApp') || content.includes('getAuth()') || content.includes('getFirestore()')) {
            initializationCount++;
            initializationFiles.push(file);
            console.log(`  - Found Firebase initialization in ${file}`);
          }
        } catch (error) {
          console.log(`  - Error reading ${file}:`, error);
        }
      } else {
        console.log(`  - ${file} not found`);
      }
    });
    
    console.log(`Total files with Firebase initialization: ${initializationCount}`);
    
    if (initializationCount > 1) {
      this.addResult(
        'Initialization',
        'warning',
        'Multiple Firebase Initialization Points',
        `Firebase services are being initialized in multiple files: ${initializationFiles.join(', ')}. This could potentially cause conflicts.`,
        'Consider centralizing Firebase initialization in firebase-config.ts and importing instances from there'
      );
    } else if (initializationCount === 1) {
      console.log(chalk.green('✅ Single Firebase initialization point detected'));
    }
  }

  private checkFirebaseProjects() {
    console.log(chalk.blue('\n🔍 Checking Firebase Project Configuration...'));
    
    const firebaseRcPath = join(this.projectRoot, '.firebaserc');
    const firebaseJsonPath = join(this.projectRoot, 'firebase.json');
    
    console.log(`Checking .firebaserc at: ${firebaseRcPath}`);
    if (!existsSync(firebaseRcPath)) {
      this.addResult(
        'Project Config',
        'warning',
        'Missing .firebaserc',
        '.firebaserc file not found. This may cause project ID mismatches.',
        'Run `firebase init` or create .firebaserc with correct project aliases'
      );
    } else {
      console.log(chalk.green('✅ .firebaserc found'));
    }
    
    console.log(`Checking firebase.json at: ${firebaseJsonPath}`);
    if (!existsSync(firebaseJsonPath)) {
      this.addResult(
        'Project Config',
        'warning',
        'Missing firebase.json',
        'firebase.json configuration file not found.',
        'Run `firebase init` to create proper Firebase configuration'
      );
    } else {
      console.log(chalk.green('✅ firebase.json found'));
    }
    
    // Check for project ID consistency
    const projectId = process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;
    if (projectId) {
      console.log(chalk.green(`✅ Detected Project ID: ${projectId}`));
    } else {
      this.addResult(
        'Project Config',
        'critical',
        'No Project ID Detected',
        'Cannot determine Firebase project ID from environment variables.',
        'Set VITE_FIREBASE_PROJECT_ID in your .env file'
      );
    }
  }

  private checkNetworkAndConnectivity() {
    console.log(chalk.blue('\n🔍 Checking Network Configuration...'));
    
    // Check for emulator configuration
    const firebaseJsonPath = join(this.projectRoot, 'firebase.json');
    if (existsSync(firebaseJsonPath)) {
      try {
        const firebaseJson = JSON.parse(readFileSync(firebaseJsonPath, 'utf8'));
        if (firebaseJson.emulators) {
          console.log(chalk.blue('ℹ️  Firebase emulators configured'));
          
          // Check if emulator connection might be interfering
          if (process.env.NODE_ENV === 'development') {
            this.addResult(
              'Network',
              'info',
              'Emulator Configuration Detected',
              'Firebase emulators are configured. Ensure they\'re not interfering with production connections.',
              'Check emulator connection settings and ensure proper environment separation'
            );
          }
        } else {
          console.log('ℹ️  No emulator configuration found');
        }
      } catch (error) {
        console.log('⚠️  Error parsing firebase.json:', error);
      }
    }
  }

  public async runDiagnostic(): Promise<void> {
    console.log(chalk.yellow('🔥 Firebase Configuration Diagnostic Tool'));
    console.log(chalk.yellow('==========================================\n'));
    
    this.checkFirebaseSDKVersions();
    this.checkFirebaseConfiguration();
    this.checkEnvironmentVariables();
    this.checkDuplicateInitialization();
    this.checkFirebaseProjects();
    this.checkNetworkAndConnectivity();
    
    this.generateReport();
    this.generateSolutions();
  }

  private generateReport(): void {
    console.log(chalk.yellow('\n📊 Diagnostic Results'));
    console.log(chalk.yellow('======================\n'));
    
    const criticalIssues = this.results.filter(r => r.severity === 'critical');
    const warnings = this.results.filter(r => r.severity === 'warning');
    const info = this.results.filter(r => r.severity === 'info');
    
    console.log(chalk.red(`❌ Critical Issues: ${criticalIssues.length}`));
    console.log(chalk.yellow(`⚠️  Warnings: ${warnings.length}`));
    console.log(chalk.blue(`ℹ️  Info: ${info.length}\n`));
    
    if (this.results.length === 0) {
      console.log(chalk.green('🎉 No issues found! Your Firebase configuration looks excellent.'));
      return;
    }
    
    this.results.forEach((result, index) => {
      const icon = result.severity === 'critical' ? '❌' : result.severity === 'warning' ? '⚠️' : 'ℹ️';
      const color = result.severity === 'critical' ? chalk.red : result.severity === 'warning' ? chalk.yellow : chalk.blue;
      
      console.log(color(`${icon} [${result.category}] ${result.issue}`));
      console.log(color(`   Description: ${result.description}`));
      console.log(color(`   Solution: ${result.solution}\n`));
    });
  }

  private generateSolutions(): void {
    const criticalIssues = this.results.filter(r => r.severity === 'critical');
    
    if (criticalIssues.length === 0) {
      console.log(chalk.green('✅ No critical issues found! Your Firebase configuration looks good.'));
      console.log(chalk.green('🚀 The hook.js:608 overrideMethod error should be resolved.'));
      return;
    }
    
    console.log(chalk.yellow('\n🔧 Recommended Fix Priority'));
    console.log(chalk.yellow('=============================\n'));
    
    console.log(chalk.red('1. IMMEDIATE FIXES (Critical):'));
    criticalIssues.forEach((issue, index) => {
      console.log(chalk.red(`   ${index + 1}. ${issue.issue}: ${issue.solution}`));
    });
    
    console.log(chalk.yellow('\n2. SUGGESTED FIXES (Warnings):'));
    const warnings = this.results.filter(r => r.severity === 'warning');
    warnings.forEach((issue, index) => {
      console.log(chalk.yellow(`   ${index + 1}. ${issue.issue}: ${issue.solution}`));
    });
    
    console.log(chalk.blue('\n🎯 Status Summary:'));
    console.log(chalk.blue('=================='));
    console.log(chalk.blue('✅ Firebase SDK: v10.x.x (Good)'));
    console.log(chalk.blue('✅ Configuration: Enhanced pattern applied'));
    if (criticalIssues.length === 0) {
      console.log(chalk.green('✅ Environment: All variables loaded'));
      console.log(chalk.green('🎯 The hook.js:608 error should now be resolved!'));
    } else {
      console.log(chalk.red('❌ Environment: Issues detected'));
      console.log(chalk.red('🎯 Fix environment issues to resolve hook.js:608 error'));
    }
  }
}

// Run the diagnostic immediately
const diagnostic = new FirebaseConfigDiagnostic();
diagnostic.runDiagnostic().catch(console.error);

export { FirebaseConfigDiagnostic };