#!/usr/bin/env node

/**
 * Manual Index Creation Guide
 * 
 * Provides step-by-step instructions for manually creating Firestore indexes
 * when Firebase CLI deployment fails.
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

interface IndexField {
  fieldPath: string;
  order?: 'ASCENDING' | 'DESCENDING';
  arrayConfig?: 'CONTAINS';
}

interface FirestoreIndex {
  collectionId?: string;
  collectionGroup?: string;
  queryScope: 'COLLECTION' | 'COLLECTION_GROUP';
  fields: IndexField[];
}

interface IndexConfiguration {
  indexes: FirestoreIndex[];
  fieldOverrides: any[];
}

class ManualIndexCreationGuide {
  private projectId: string;
  private indexes: FirestoreIndex[];

  constructor(projectId: string = 'tradeya-45ede') {
    this.projectId = projectId;
    this.indexes = [];
    this.loadIndexes();
  }

  private loadIndexes(): void {
    try {
      const indexesPath = join(process.cwd(), 'firestore.indexes.json');
      const indexesContent = readFileSync(indexesPath, 'utf-8');
      const config: IndexConfiguration = JSON.parse(indexesContent);
      this.indexes = config.indexes;
    } catch (error) {
      console.error('❌ Could not load firestore.indexes.json:', error);
      process.exit(1);
    }
  }

  /**
   * Generate Firebase Console URLs for index creation
   */
  generateFirebaseConsoleUrls(): { [key: string]: string } {
    const baseUrl = `https://console.firebase.google.com/project/${this.projectId}/firestore/indexes`;
    
    return {
      main: baseUrl,
      composite: `${baseUrl}?tab=composite`,
      singleField: `${baseUrl}?tab=single-field`
    };
  }

  /**
   * Find the migration-progress index
   */
  getMigrationProgressIndex(): FirestoreIndex | null {
    return this.indexes.find(index => 
      index.collectionId === 'migration-progress'
    ) || null;
  }

  /**
   * Generate manual creation instructions
   */
  generateManualInstructions(): void {
    console.log('\n🔧 Manual Firestore Index Creation Guide');
    console.log('=========================================');
    console.log(`📦 Project: ${this.projectId}`);
    console.log(`⏰ Time: ${new Date().toISOString()}\n`);

    const urls = this.generateFirebaseConsoleUrls();
    const migrationIndex = this.getMigrationProgressIndex();

    if (!migrationIndex) {
      console.error('❌ migration-progress index not found in firestore.indexes.json');
      return;
    }

    console.log('🎯 IMMEDIATE PRIORITY: Create migration-progress Index');
    console.log('====================================================\n');

    console.log('1. 🌐 Open Firebase Console:');
    console.log(`   ${urls.composite}\n`);

    console.log('2. 🔍 Navigate to Indexes:');
    console.log('   - Click "Firestore Database" in the left sidebar');
    console.log('   - Click "Indexes" tab');
    console.log('   - Click "Composite" sub-tab\n');

    console.log('3. ➕ Create New Composite Index:');
    console.log('   - Click "+ Create Index" button');
    console.log('   - Collection ID: migration-progress');
    console.log('   - Query scope: Collection\n');

    console.log('4. 📋 Add Fields (in this exact order):');
    migrationIndex.fields.forEach((field, index) => {
      console.log(`   Field ${index + 1}:`);
      console.log(`   - Field path: ${field.fieldPath}`);
      if (field.order) {
        console.log(`   - Order: ${field.order}`);
      }
      if (field.arrayConfig) {
        console.log(`   - Array config: ${field.arrayConfig}`);
      }
      console.log('');
    });

    console.log('5. 💾 Save Index:');
    console.log('   - Click "Create Index"');
    console.log('   - Wait for index to build (typically 2-5 minutes)\n');

    console.log('6. ✅ Verify Index Creation:');
    console.log('   - Index should appear in the Composite Indexes list');
    console.log('   - Status should show "Building" then "Enabled"\n');

    this.generateAllIndexesInstructions();
    this.generateAlternativeUrlMethod();
    this.generateTroubleshootingSteps();
  }

  /**
   * Generate instructions for all indexes
   */
  private generateAllIndexesInstructions(): void {
    console.log('\n📑 ALL INDEXES REFERENCE');
    console.log('========================\n');

    console.log('If you need to create ALL indexes manually, here\'s the complete list:\n');

    this.indexes.forEach((index, i) => {
      const collection = index.collectionId || index.collectionGroup;
      const scope = index.queryScope === 'COLLECTION_GROUP' ? 'Collection Group' : 'Collection';
      
      console.log(`Index ${i + 1}: ${collection}`);
      console.log(`- Collection: ${collection}`);
      console.log(`- Query Scope: ${scope}`);
      console.log('- Fields:');
      
      index.fields.forEach((field, j) => {
        let fieldStr = `  ${j + 1}. ${field.fieldPath}`;
        if (field.order) fieldStr += ` (${field.order})`;
        if (field.arrayConfig) fieldStr += ` [${field.arrayConfig}]`;
        console.log(fieldStr);
      });
      console.log('');
    });
  }

  /**
   * Generate direct URL method for index creation
   */
  private generateAlternativeUrlMethod(): void {
    const migrationIndex = this.getMigrationProgressIndex();
    if (!migrationIndex) return;

    console.log('\n🔗 DIRECT URL METHOD (Alternative)');
    console.log('==================================\n');

    // Create a pre-filled URL (this would need to be constructed based on Firebase Console URL patterns)
    const directUrl = this.generateDirectIndexUrl(migrationIndex);
    
    console.log('1. 🎯 Use this direct link to create the migration-progress index:');
    console.log(`   ${directUrl}\n`);
    
    console.log('2. 📋 Verify the pre-filled fields match:');
    migrationIndex.fields.forEach((field, index) => {
      console.log(`   - Field ${index + 1}: ${field.fieldPath} (${field.order || 'N/A'})`);
    });
    console.log('');
    
    console.log('3. 💾 Click "Create Index" to save\n');
  }

  /**
   * Generate direct URL for index creation (approximate)
   */
  private generateDirectIndexUrl(index: FirestoreIndex): string {
    const baseUrl = `https://console.firebase.google.com/project/${this.projectId}/firestore/indexes`;
    const collection = index.collectionId || index.collectionGroup;
    
    // This is an approximation - the actual URL structure may vary
    return `${baseUrl}?tab=composite&create=true&collection=${collection}&scope=${index.queryScope}`;
  }

  /**
   * Generate troubleshooting steps
   */
  private generateTroubleshootingSteps(): void {
    console.log('\n🛠️  TROUBLESHOOTING');
    console.log('==================\n');

    console.log('❓ If index creation fails:');
    console.log('1. Check that you have Firestore Admin permissions');
    console.log('2. Verify you\'re in the correct project (tradeya-45ede)');
    console.log('3. Ensure field names are typed exactly as shown');
    console.log('4. Check for existing indexes that might conflict\n');

    console.log('❓ If you can\'t access Firebase Console:');
    console.log('1. Verify you\'re logged into the correct Google account');
    console.log('2. Contact the project owner for access permissions');
    console.log('3. Try the alternative CLI troubleshooting script\n');

    console.log('❓ After index creation:');
    console.log('1. Wait 2-5 minutes for index to build');
    console.log('2. Refresh the Firebase Console page');
    console.log('3. Retry your migration script');
    console.log('4. Check the index status shows "Enabled"\n');
  }

  /**
   * Generate a JSON file with index configuration for reference
   */
  generateIndexReference(): void {
    const migrationIndex = this.getMigrationProgressIndex();
    if (!migrationIndex) return;

    const reference = {
      projectId: this.projectId,
      timestamp: new Date().toISOString(),
      migrationProgressIndex: migrationIndex,
      firebaseConsoleUrls: this.generateFirebaseConsoleUrls(),
      manualSteps: [
        'Open Firebase Console',
        'Navigate to Firestore > Indexes > Composite',
        'Click "Create Index"',
        'Set Collection ID to "migration-progress"',
        'Add fields as specified',
        'Click "Create Index"',
        'Wait for index to build'
      ]
    };

    const outputPath = join(process.cwd(), 'manual-index-creation-reference.json');
    writeFileSync(outputPath, JSON.stringify(reference, null, 2));
    
    console.log(`\n📄 Reference file created: ${outputPath}`);
  }

  /**
   * Run the complete guide
   */
  run(): void {
    this.generateManualInstructions();
    this.generateIndexReference();
    
    console.log('\n🎉 Manual Index Creation Guide Complete!');
    console.log('\n🚀 NEXT STEPS:');
    console.log('1. Create the migration-progress index using the instructions above');
    console.log('2. Wait 2-5 minutes for the index to build');
    console.log('3. Retry your migration deployment script');
    console.log('4. Monitor the migration progress\n');
  }
}

// Execute guide if script is run directly
if (require.main === module) {
  const args = process.argv.slice(2);
  const projectArg = args.find(arg => arg.startsWith('--project='));
  const projectId = projectArg ? projectArg.split('=')[1] : 'tradeya-45ede';
  
  const guide = new ManualIndexCreationGuide(projectId);
  guide.run();
}

export { ManualIndexCreationGuide };