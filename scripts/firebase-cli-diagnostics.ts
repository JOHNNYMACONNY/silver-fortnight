#!/usr/bin/env node

/**
 * Firebase CLI Diagnostics Script
 * 
 * Checks Firebase CLI installation, authentication, and project configuration
 * to diagnose deployment issues.
 */

import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

interface DiagnosticResult {
  check: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  solution?: string;
}

class FirebaseCLIDiagnostics {
  private results: DiagnosticResult[] = [];

  /**
   * Check if Firebase CLI is installed
   */
  checkFirebaseCLI(): DiagnosticResult {
    try {
      const version = execSync('firebase --version', { encoding: 'utf-8', stdio: 'pipe' });
      return {
        check: 'Firebase CLI Installation',
        status: 'pass',
        message: `Firebase CLI installed: ${version.trim()}`
      };
    } catch (error) {
      return {
        check: 'Firebase CLI Installation',
        status: 'fail',
        message: 'Firebase CLI not found',
        solution: 'Install Firebase CLI: npm install -g firebase-tools'
      };
    }
  }

  /**
   * Check Firebase authentication status
   */
  checkAuthentication(): DiagnosticResult {
    try {
      const auth = execSync('firebase auth:list', { encoding: 'utf-8', stdio: 'pipe' });
      if (auth.includes('No users found')) {
        return {
          check: 'Firebase Authentication',
          status: 'fail',
          message: 'Not authenticated with Firebase',
          solution: 'Run: firebase login'
        };
      }
      return {
        check: 'Firebase Authentication',
        status: 'pass',
        message: 'Authenticated with Firebase'
      };
    } catch (error) {
      return {
        check: 'Firebase Authentication',
        status: 'fail',
        message: 'Not authenticated with Firebase',
        solution: 'Run: firebase login'
      };
    }
  }

  /**
   * Check project configuration
   */
  checkProjectConfig(): DiagnosticResult {
    try {
      const firebaserc = join(process.cwd(), '.firebaserc');
      if (!existsSync(firebaserc)) {
        return {
          check: 'Project Configuration',
          status: 'fail',
          message: '.firebaserc file not found',
          solution: 'Run: firebase init or create .firebaserc file'
        };
      }

      const config = JSON.parse(readFileSync(firebaserc, 'utf-8'));
      const projectId = config.projects?.default;
      
      if (!projectId) {
        return {
          check: 'Project Configuration',
          status: 'fail',
          message: 'No default project configured',
          solution: 'Run: firebase use --add'
        };
      }

      return {
        check: 'Project Configuration',
        status: 'pass',
        message: `Default project: ${projectId}`
      };
    } catch (error) {
      return {
        check: 'Project Configuration',
        status: 'fail',
        message: 'Invalid .firebaserc configuration',
        solution: 'Fix .firebaserc file or run: firebase use --add'
      };
    }
  }

  /**
   * Check project access permissions
   */
  checkProjectAccess(projectId: string): DiagnosticResult {
    try {
      const projects = execSync('firebase projects:list', { encoding: 'utf-8', stdio: 'pipe' });
      if (projects.includes(projectId)) {
        return {
          check: 'Project Access',
          status: 'pass',
          message: `Access to project ${projectId} confirmed`
        };
      } else {
        return {
          check: 'Project Access',
          status: 'fail',
          message: `No access to project ${projectId}`,
          solution: 'Check project permissions or contact project owner'
        };
      }
    } catch (error) {
      return {
        check: 'Project Access',
        status: 'fail',
        message: 'Cannot list Firebase projects',
        solution: 'Check authentication and network connection'
      };
    }
  }

  /**
   * Check firestore.indexes.json file
   */
  checkIndexesFile(): DiagnosticResult {
    try {
      const indexesPath = join(process.cwd(), 'firestore.indexes.json');
      if (!existsSync(indexesPath)) {
        return {
          check: 'Indexes Configuration',
          status: 'fail',
          message: 'firestore.indexes.json not found',
          solution: 'Create firestore.indexes.json file'
        };
      }

      const indexesContent = readFileSync(indexesPath, 'utf-8');
      const indexes = JSON.parse(indexesContent);
      
      if (!indexes.indexes || !Array.isArray(indexes.indexes)) {
        return {
          check: 'Indexes Configuration',
          status: 'fail',
          message: 'Invalid indexes file format',
          solution: 'Fix firestore.indexes.json structure'
        };
      }

      const migrationIndex = indexes.indexes.find(
        (index: any) => index.collectionId === 'migration-progress'
      );

      if (!migrationIndex) {
        return {
          check: 'Indexes Configuration',
          status: 'warning',
          message: 'migration-progress index not found',
          solution: 'Add migration-progress index to firestore.indexes.json'
        };
      }

      return {
        check: 'Indexes Configuration',
        status: 'pass',
        message: `Found ${indexes.indexes.length} indexes including migration-progress`
      };
    } catch (error) {
      return {
        check: 'Indexes Configuration',
        status: 'fail',
        message: 'Cannot read or parse firestore.indexes.json',
        solution: 'Fix firestore.indexes.json syntax'
      };
    }
  }

  /**
   * Test Firebase CLI command execution
   */
  testFirebaseCommand(projectId: string): DiagnosticResult {
    try {
      // Test a simple Firebase command first
      execSync(`firebase firestore:indexes --project ${projectId}`, { 
        encoding: 'utf-8', 
        stdio: 'pipe',
        timeout: 30000 
      });
      
      return {
        check: 'Firebase Command Test',
        status: 'pass',
        message: 'Firebase CLI commands working correctly'
      };
    } catch (error: any) {
      return {
        check: 'Firebase Command Test',
        status: 'fail',
        message: `Firebase CLI command failed: ${error.message}`,
        solution: 'Check authentication, project access, and network connection'
      };
    }
  }

  /**
   * Run all diagnostic checks
   */
  async runDiagnostics(projectId: string = 'tradeya-45ede'): Promise<void> {
    console.log('\n🔍 Firebase CLI Diagnostics');
    console.log('===========================');
    console.log(`📦 Project: ${projectId}`);
    console.log(`⏰ Time: ${new Date().toISOString()}\n`);

    // Run all checks
    this.results.push(this.checkFirebaseCLI());
    this.results.push(this.checkAuthentication());
    this.results.push(this.checkProjectConfig());
    this.results.push(this.checkProjectAccess(projectId));
    this.results.push(this.checkIndexesFile());
    this.results.push(this.testFirebaseCommand(projectId));

    // Print results
    this.printResults();
    this.printSummary();
    this.printSolutions();
  }

  private printResults(): void {
    console.log('🔬 Diagnostic Results:');
    console.log('----------------------');
    
    this.results.forEach(result => {
      const icon = result.status === 'pass' ? '✅' : result.status === 'warning' ? '⚠️' : '❌';
      console.log(`${icon} ${result.check}: ${result.message}`);
    });
  }

  private printSummary(): void {
    const passed = this.results.filter(r => r.status === 'pass').length;
    const warnings = this.results.filter(r => r.status === 'warning').length;
    const failed = this.results.filter(r => r.status === 'fail').length;

    console.log('\n📊 Summary:');
    console.log('-----------');
    console.log(`✅ Passed: ${passed}`);
    console.log(`⚠️  Warnings: ${warnings}`);
    console.log(`❌ Failed: ${failed}`);
  }

  private printSolutions(): void {
    const failedChecks = this.results.filter(r => r.status === 'fail' && r.solution);
    
    if (failedChecks.length > 0) {
      console.log('\n🔧 Recommended Solutions:');
      console.log('-------------------------');
      
      failedChecks.forEach((result, index) => {
        console.log(`${index + 1}. ${result.check}:`);
        console.log(`   ${result.solution}\n`);
      });
    }

    // Print installation instructions
    console.log('\n📋 Installation Commands:');
    console.log('-------------------------');
    console.log('1. Install Firebase CLI:');
    console.log('   npm install -g firebase-tools');
    console.log('\n2. Login to Firebase:');
    console.log('   firebase login');
    console.log('\n3. Set project:');
    console.log('   firebase use tradeya-45ede');
    console.log('\n4. Deploy indexes:');
    console.log('   firebase deploy --only firestore:indexes --project tradeya-45ede');
  }
}

// Execute diagnostics if script is run directly
if (require.main === module) {
  const args = process.argv.slice(2);
  const projectArg = args.find(arg => arg.startsWith('--project='));
  const projectId = projectArg ? projectArg.split('=')[1] : 'tradeya-45ede';
  
  const diagnostics = new FirebaseCLIDiagnostics();
  diagnostics.runDiagnostics(projectId).catch(error => {
    console.error('\n💥 Diagnostics failed:', error);
    process.exit(1);
  });
}

export { FirebaseCLIDiagnostics };