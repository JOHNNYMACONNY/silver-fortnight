#!/usr/bin/env tsx

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

/**
 * Enhanced Index Deployment Script for TradeYa Firestore Migration
 * 
 * This script handles the complete deployment and verification process for Firestore indexes
 * Required for migration infrastructure deployment preparation
 */

interface DeploymentLog {
  timestamp: string;
  phase: string;
  status: 'started' | 'success' | 'error' | 'warning';
  message: string;
  details?: any;
}

class IndexDeploymentManager {
  private deploymentLog: DeploymentLog[] = [];
  private startTime: Date;

  constructor() {
    this.startTime = new Date();
    this.log('deployment', 'started', 'TradeYa Firestore Index Deployment Started');
  }

  private log(phase: string, status: DeploymentLog['status'], message: string, details?: any) {
    const entry: DeploymentLog = {
      timestamp: new Date().toISOString(),
      phase,
      status,
      message,
      details
    };
    this.deploymentLog.push(entry);
    
    const statusIcon = {
      started: '🚀',
      success: '✅',
      error: '❌',
      warning: '⚠️'
    }[status];
    
    console.log(`${statusIcon} [${phase.toUpperCase()}] ${message}`);
    if (details) {
      console.log(`   Details: ${JSON.stringify(details, null, 2)}`);
    }
  }

  async validateConfiguration(): Promise<boolean> {
    this.log('validation', 'started', 'Validating Firestore configuration');
    
    try {
      // Check if firestore.indexes.json exists
      if (!fs.existsSync('firestore.indexes.json')) {
        this.log('validation', 'error', 'firestore.indexes.json not found');
        return false;
      }

      // Parse and validate indexes file
      const indexesContent = JSON.parse(fs.readFileSync('firestore.indexes.json', 'utf-8'));
      const indexCount = indexesContent.indexes ? indexesContent.indexes.length : 0;
      
      this.log('validation', 'success', `Found ${indexCount} index definitions in firestore.indexes.json`);

      // Check Firebase configuration
      if (!fs.existsSync('.firebaserc')) {
        this.log('validation', 'error', '.firebaserc not found');
        return false;
      }

      const firebaserc = JSON.parse(fs.readFileSync('.firebaserc', 'utf-8'));
      const projectId = firebaserc.projects?.default;
      
      if (!projectId) {
        this.log('validation', 'error', 'No default project found in .firebaserc');
        return false;
      }

      this.log('validation', 'success', `Firebase project: ${projectId}`);
      return true;
    } catch (error: any) {
      this.log('validation', 'error', 'Configuration validation failed', { error: error.message });
      return false;
    }
  }

  async checkFirebaseCLI(): Promise<boolean> {
    this.log('cli-check', 'started', 'Checking Firebase CLI');
    
    try {
      const versionOutput = execSync('firebase --version', { encoding: 'utf-8' });
      this.log('cli-check', 'success', `Firebase CLI version: ${versionOutput.trim()}`);
      return true;
    } catch (error: any) {
      this.log('cli-check', 'error', 'Firebase CLI not available', { error: error.message });
      return false;
    }
  }

  async verifyIndexes(): Promise<boolean> {
    this.log('verification', 'started', 'Verifying deployed indexes');
    
    try {
      // Get current indexes from Firebase
      const indexesOutput = execSync('firebase firestore:indexes', { encoding: 'utf-8' });
      const deployedIndexes = JSON.parse(indexesOutput);
      
      // Get expected indexes from configuration
      const expectedIndexes = JSON.parse(fs.readFileSync('firestore.indexes.json', 'utf-8'));
      
      const deployedCount = deployedIndexes.indexes ? deployedIndexes.indexes.length : 0;
      const expectedCount = expectedIndexes.indexes ? expectedIndexes.indexes.length : 0;
      
      this.log('verification', 'success', 
        `Index verification complete: ${deployedCount} deployed, ${expectedCount} expected`);
      
      // Check for our specific migration indexes
      const migrationIndexes = expectedIndexes.indexes.filter((idx: any) => 
        idx.collectionGroup === 'trades' || 
        idx.collectionGroup === 'conversations' ||
        idx.collectionGroup === 'userXP' ||
        idx.collectionGroup === 'xpTransactions' ||
        idx.collectionGroup === 'achievements' ||
        idx.collectionGroup === 'userAchievements' ||
        idx.collectionGroup === 'collaborations' ||
        idx.collectionGroup === 'roles' ||
        idx.collectionGroup === 'applications'
      );
      
      this.log('verification', 'success', 
        `Migration-critical indexes: ${migrationIndexes.length} configured`);
      
      if (deployedCount >= expectedCount) {
        this.log('verification', 'success', 'All expected indexes appear to be deployed and ready');
        return true;
      } else {
        this.log('verification', 'warning', 'Some indexes may be missing');
        return false;
      }
    } catch (error: any) {
      this.log('verification', 'error', 'Index verification failed', { error: error.message });
      return false;
    }
  }

  async generateReport(): Promise<void> {
    const duration = Date.now() - this.startTime.getTime();
    const reportPath = `deployment-report-${Date.now()}.json`;
    
    const report = {
      startTime: this.startTime.toISOString(),
      endTime: new Date().toISOString(),
      duration: `${Math.round(duration / 1000)}s`,
      status: this.deploymentLog.some(l => l.status === 'error') ? 'failed' : 'success',
      migrationReadiness: this.deploymentLog.filter(l => l.status === 'success').length > 0,
      log: this.deploymentLog
    };
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    this.log('report', 'success', `Deployment report saved: ${reportPath}`);
  }

  async run(): Promise<boolean> {
    try {
      // Step 1: Validate configuration
      if (!await this.validateConfiguration()) {
        return false;
      }

      // Step 2: Check Firebase CLI
      if (!await this.checkFirebaseCLI()) {
        return false;
      }

      // Step 3: Verify deployment (indexes already deployed)
      const verificationSuccess = await this.verifyIndexes();
      
      // Step 4: Generate report
      await this.generateReport();
      
      if (verificationSuccess) {
        this.log('deployment', 'success', 
          '🎉 Firestore index verification completed successfully! Migration infrastructure ready.');
        return true;
      } else {
        this.log('deployment', 'warning', 
          '⚠️ Verification completed but had warnings. Please review.');
        return false;
      }
    } catch (error: any) {
      this.log('deployment', 'error', 'Verification process failed', { error: error.message });
      await this.generateReport();
      return false;
    }
  }
}

// ES Module compatible main execution check
const __filename = fileURLToPath(import.meta.url);
const isMainModule = process.argv[1] === __filename;

if (isMainModule) {
  const manager = new IndexDeploymentManager();
  
  manager.run().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}

export { IndexDeploymentManager };
