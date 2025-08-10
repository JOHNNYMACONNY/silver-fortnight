#!/usr/bin/env node

/**
 * Enhanced Deploy Migration Fixes Script
 * 
 * Deploys Firestore indexes with multiple fallback methods
 * when Firebase CLI deployment fails.
 */

import { execSync } from 'child_process';
import { readFileSync, existsSync, writeFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

interface DeploymentResult {
  success: boolean;
  message: string;
  details?: string;
  method?: string;
}

interface DeploymentMethod {
  name: string;
  description: string;
  execute: () => Promise<DeploymentResult>;
}

class EnhancedMigrationFixDeployer {
  private projectId: string;
  private environment: 'staging' | 'production';
  private deploymentMethods: DeploymentMethod[];

  constructor(projectId: string, environment: 'staging' | 'production' = 'production') {
    this.projectId = projectId;
    this.environment = environment;
    this.deploymentMethods = this.initializeDeploymentMethods();
  }

  private initializeDeploymentMethods(): DeploymentMethod[] {
    return [
      {
        name: 'Firebase CLI',
        description: 'Standard Firebase CLI deployment',
        execute: () => this.deployWithFirebaseCLI()
      },
      {
        name: 'Alternative CLI',
        description: 'Alternative Firebase CLI with explicit login',
        execute: () => this.deployWithAlternativeCLI()
      },
      {
        name: 'Manual Instructions',
        description: 'Generate manual deployment instructions',
        execute: () => this.generateManualInstructions()
      },
      {
        name: 'Admin SDK',
        description: 'Deploy using Firebase Admin SDK',
        execute: () => this.deployWithAdminSDK()
      }
    ];
  }

  /**
   * Standard Firebase CLI deployment
   */
  private async deployWithFirebaseCLI(): Promise<DeploymentResult> {
    try {
      console.log('🚀 Attempting Firebase CLI deployment...');
      
      // Validate indexes file
      const validationResult = this.validateIndexesFile();
      if (!validationResult.success) {
        return validationResult;
      }

      // Deploy indexes
      const deployCommand = `firebase deploy --only firestore:indexes --project ${this.projectId}`;
      console.log(`📤 Executing: ${deployCommand}`);
      
      const output = execSync(deployCommand, { 
        encoding: 'utf-8',
        stdio: 'pipe',
        timeout: 60000 // 1 minute timeout
      });

      return {
        success: true,
        message: 'Firebase CLI deployment successful',
        details: output,
        method: 'Firebase CLI'
      };

    } catch (error: any) {
      console.error('❌ Firebase CLI deployment failed:', error.message);
      return {
        success: false,
        message: `Firebase CLI deployment failed: ${error.message}`,
        details: error.toString(),
        method: 'Firebase CLI'
      };
    }
  }

  /**
   * Alternative Firebase CLI with explicit authentication
   */
  private async deployWithAlternativeCLI(): Promise<DeploymentResult> {
    try {
      console.log('🔄 Attempting alternative Firebase CLI deployment...');
      
      // Check authentication
      try {
        execSync('firebase auth:list', { encoding: 'utf-8', stdio: 'pipe' });
        console.log('✅ Firebase authentication verified');
      } catch (authError) {
        return {
          success: false,
          message: 'Firebase authentication required',
          details: 'Run: firebase login',
          method: 'Alternative CLI'
        };
      }

      // Use specific project and force login check
      const deployCommand = `firebase use ${this.projectId} && firebase deploy --only firestore:indexes --project ${this.projectId} --force`;
      console.log(`📤 Executing: ${deployCommand}`);
      
      const output = execSync(deployCommand, { 
        encoding: 'utf-8',
        stdio: 'pipe',
        timeout: 60000
      });

      return {
        success: true,
        message: 'Alternative CLI deployment successful',
        details: output,
        method: 'Alternative CLI'
      };

    } catch (error: any) {
      return {
        success: false,
        message: `Alternative CLI deployment failed: ${error.message}`,
        details: error.toString(),
        method: 'Alternative CLI'
      };
    }
  }

  /**
   * Generate manual deployment instructions
   */
  private async generateManualInstructions(): Promise<DeploymentResult> {
    try {
      console.log('📋 Generating manual deployment instructions...');
      
      const indexesPath = join(process.cwd(), 'firestore.indexes.json');
      const indexesContent = readFileSync(indexesPath, 'utf-8');
      const indexes = JSON.parse(indexesContent);
      
      const migrationIndex = indexes.indexes.find(
        (index: any) => index.collectionId === 'migration-progress'
      );

      if (!migrationIndex) {
        return {
          success: false,
          message: 'migration-progress index not found',
          method: 'Manual Instructions'
        };
      }

      const instructions = this.generateDetailedManualSteps(migrationIndex);
      
      // Save instructions to file
      const instructionsPath = join(process.cwd(), 'MANUAL_INDEX_DEPLOYMENT.md');
      writeFileSync(instructionsPath, instructions);
      
      console.log('\n' + instructions);
      
      return {
        success: true,
        message: `Manual instructions generated: ${instructionsPath}`,
        details: instructions,
        method: 'Manual Instructions'
      };

    } catch (error: any) {
      return {
        success: false,
        message: `Failed to generate manual instructions: ${error.message}`,
        method: 'Manual Instructions'
      };
    }
  }

  /**
   * Deploy using Firebase Admin SDK (requires service account)
   */
  private async deployWithAdminSDK(): Promise<DeploymentResult> {
    try {
      console.log('🔧 Checking Admin SDK deployment option...');
      
      // This would require implementing Firebase Admin SDK index creation
      // For now, we'll provide instructions for setting it up
      
      return {
        success: false,
        message: 'Admin SDK deployment requires service account setup',
        details: `
To use Admin SDK deployment:
1. Download service account key from Firebase Console
2. Set GOOGLE_APPLICATION_CREDENTIALS environment variable
3. Implement Admin SDK index creation code
4. This is an advanced option for automated deployments
        `,
        method: 'Admin SDK'
      };

    } catch (error: any) {
      return {
        success: false,
        message: `Admin SDK deployment failed: ${error.message}`,
        method: 'Admin SDK'
      };
    }
  }

  /**
   * Validate indexes file
   */
  private validateIndexesFile(): DeploymentResult {
    const indexesPath = join(process.cwd(), 'firestore.indexes.json');
    
    if (!existsSync(indexesPath)) {
      return {
        success: false,
        message: 'firestore.indexes.json file not found'
      };
    }

    try {
      const indexesContent = readFileSync(indexesPath, 'utf-8');
      const indexes = JSON.parse(indexesContent);
      
      if (!indexes.indexes || !Array.isArray(indexes.indexes)) {
        return {
          success: false,
          message: 'Invalid indexes file format'
        };
      }

      const migrationIndex = indexes.indexes.find(
        (index: any) => index.collectionId === 'migration-progress'
      );
      
      if (!migrationIndex) {
        return {
          success: false,
          message: 'migration-progress index not found in indexes file'
        };
      }

      console.log('✅ Index validation passed');
      console.log(`📋 Found migration-progress index with ${migrationIndex.fields.length} fields`);

      return {
        success: true,
        message: 'Index validation successful'
      };

    } catch (error: any) {
      return {
        success: false,
        message: `Index validation failed: ${error.message}`
      };
    }
  }

  /**
   * Generate detailed manual steps
   */
  private generateDetailedManualSteps(migrationIndex: any): string {
    const consoleUrl = `https://console.firebase.google.com/project/${this.projectId}/firestore/indexes?tab=composite`;
    
    return `# Manual Firestore Index Creation

## 🎯 IMMEDIATE ACTION REQUIRED

The Firebase CLI deployment failed. Please create the required index manually:

### Step 1: Open Firebase Console
Open this URL in your browser:
${consoleUrl}

### Step 2: Create Composite Index
1. Click "+ Create Index" button
2. Set the following configuration:

**Collection ID:** migration-progress
**Query scope:** Collection

### Step 3: Add Fields (in exact order)
${migrationIndex.fields.map((field: any, index: number) => `
Field ${index + 1}:
- Field path: ${field.fieldPath}
- Order: ${field.order || 'N/A'}
${field.arrayConfig ? `- Array config: ${field.arrayConfig}` : ''}
`).join('')}

### Step 4: Create Index
1. Click "Create Index"
2. Wait 2-5 minutes for index to build
3. Verify status shows "Enabled"

### Step 5: Verify Creation
The index should appear as:
- Collection: migration-progress
- Fields: ${migrationIndex.fields.map((f: any) => f.fieldPath).join(', ')}
- Status: Enabled

### Step 6: Retry Migration
After the index is created and enabled:
\`\`\`bash
npm run deploy:migration-fixes
\`\`\`

## Troubleshooting

If you encounter issues:
1. Verify you have Firestore Admin permissions
2. Check you're in the correct project (${this.projectId})
3. Ensure field names match exactly
4. Contact support if permissions are needed

## Alternative Commands

Try these Firebase CLI troubleshooting commands:
\`\`\`bash
# Check CLI version
firebase --version

# Re-authenticate
firebase logout
firebase login

# Set project explicitly
firebase use ${this.projectId}

# Try deployment again
firebase deploy --only firestore:indexes --project ${this.projectId}
\`\`\`
`;
  }

  /**
   * Deploy with multiple fallback methods
   */
  async deployAll(): Promise<void> {
    console.log('\n🚀 Enhanced TradeYa Migration Fixes Deployment');
    console.log('============================================');
    console.log(`📦 Project: ${this.projectId}`);
    console.log(`🌍 Environment: ${this.environment}`);
    console.log(`⏰ Start Time: ${new Date().toISOString()}`);
    console.log(`🔄 Available Methods: ${this.deploymentMethods.length}\n`);

    const results: DeploymentResult[] = [];
    let deploymentSuccessful = false;

    // Try each deployment method
    for (const method of this.deploymentMethods) {
      if (deploymentSuccessful) break;

      console.log(`\n🔄 Trying Method: ${method.name}`);
      console.log(`📝 Description: ${method.description}`);
      
      const result = await method.execute();
      results.push(result);
      
      if (result.success) {
        console.log(`✅ ${method.name} succeeded!`);
        deploymentSuccessful = true;
      } else {
        console.log(`❌ ${method.name} failed: ${result.message}`);
        if (result.details && !result.details.includes('Manual instructions')) {
          console.log(`   Details: ${result.details.substring(0, 200)}...`);
        }
      }
    }

    // Print final summary
    this.printFinalSummary(results, deploymentSuccessful);
    
    if (deploymentSuccessful) {
      console.log('\n🎉 Deployment completed successfully!');
      console.log('\n📋 Next Steps:');
      console.log('   1. Wait 2-3 minutes for indexes to build');
      console.log('   2. Retry the migration execution');
      console.log('   3. Monitor the migration progress dashboard');
      process.exit(0);
    } else {
      console.log('\n⚠️  All automated deployments failed.');
      console.log('📋 Manual deployment instructions have been generated.');
      console.log('🔧 Check MANUAL_INDEX_DEPLOYMENT.md for detailed steps.');
      process.exit(1);
    }
  }

  private printFinalSummary(results: DeploymentResult[], successful: boolean): void {
    console.log('\n📊 Deployment Summary:');
    console.log('======================');
    
    results.forEach((result, index) => {
      const status = result.success ? '✅' : '❌';
      const method = result.method || `Method ${index + 1}`;
      console.log(`${status} ${method}: ${result.message}`);
    });

    if (!successful) {
      console.log('\n🔧 Troubleshooting Options:');
      console.log('1. Run: npm run firebase:diagnose');
      console.log('2. Run: npm run manual:index-guide');
      console.log('3. Check MANUAL_INDEX_DEPLOYMENT.md');
      console.log('4. Contact team lead for Firebase access');
    }
  }
}

// Execute deployment if script is run directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const projectArg = args.find(arg => arg.startsWith('--project='));
  const envArg = args.find(arg => arg.startsWith('--env='));
  
  const projectId = projectArg ? projectArg.split('=')[1] : 'tradeya-45ede';
  const environment = envArg ? envArg.split('=')[1] as 'staging' | 'production' : 'production';
  
  const deployer = new EnhancedMigrationFixDeployer(projectId, environment);
  deployer.deployAll().catch(error => {
    console.error('\n💥 Enhanced deployment failed:', error);
    process.exit(1);
  });
}

export { EnhancedMigrationFixDeployer };