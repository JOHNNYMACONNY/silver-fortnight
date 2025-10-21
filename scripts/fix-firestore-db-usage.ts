#!/usr/bin/env tsx
/**
 * Fix Firestore Database Usage Script
 * 
 * Fixes all instances where `db` is used as a Firestore instance
 * instead of calling `db()` as a function.
 * 
 * This resolves the FirebaseError: Expected first argument to collection()
 * to be a CollectionReference, a DocumentReference or FirebaseFirestore
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { glob } from 'glob';
import { join } from 'path';
import chalk from 'chalk';

interface FixResult {
  file: string;
  fixes: number;
  changes: string[];
}

class FirestoreDbUsageFixer {
  private fixes: FixResult[] = [];
  private totalFixes = 0;

  constructor(private projectRoot: string) {}

  /**
   * Find all TypeScript files that might use Firebase db
   */
  private async findTargetFiles(): Promise<string[]> {
    const patterns = [
      'src/**/*.ts',
      'src/**/*.tsx',
      '!src/**/*.test.ts',
      '!src/**/*.test.tsx',
      '!src/**/__tests__/**',
      '!src/**/__mocks__/**'
    ];

    const files: string[] = [];
    for (const pattern of patterns) {
      const matches = await glob(pattern, { cwd: this.projectRoot });
      files.push(...matches.map(f => join(this.projectRoot, f)));
    }

    return [...new Set(files)]; // Remove duplicates
  }

  /**
   * Fix db usage in a single file
   */
  private fixDbUsageInFile(filePath: string): FixResult {
    const result: FixResult = {
      file: filePath.replace(this.projectRoot + '/', ''),
      fixes: 0,
      changes: []
    };

    if (!existsSync(filePath)) {
      return result;
    }

    let content = readFileSync(filePath, 'utf8');
    const originalContent = content;

    // Check if file imports db from firebase-config
    if (!content.includes('from \'../firebase-config\'') && 
        !content.includes('from \'../../firebase-config\'') &&
        !content.includes('from \'../../../firebase-config\'')) {
      return result; // Skip files that don't import db
    }

    // Define patterns to fix
    const patterns = [
      // collection(db, ...)
      {
        pattern: /collection\(\s*db\s*,/g,
        replacement: 'collection(db(),',
        description: 'collection(db, ...) → collection(db(), ...)'
      },
      // doc(db, ...)
      {
        pattern: /doc\(\s*db\s*,/g,
        replacement: 'doc(db(),',
        description: 'doc(db, ...) → doc(db(), ...)'
      },
      // writeBatch(db)
      {
        pattern: /writeBatch\(\s*db\s*\)/g,
        replacement: 'writeBatch(db())',
        description: 'writeBatch(db) → writeBatch(db())'
      },
      // runTransaction(db, ...)
      {
        pattern: /runTransaction\(\s*db\s*,/g,
        replacement: 'runTransaction(db(),',
        description: 'runTransaction(db, ...) → runTransaction(db(), ...)'
      },
      // getDocs from collection or query that uses db
      {
        pattern: /=\s*collection\(\s*db\s*,/g,
        replacement: '= collection(db(),',
        description: 'collection assignment with db → db()'
      }
    ];

    // Apply each pattern
    for (const { pattern, replacement, description } of patterns) {
      const matches = content.match(pattern);
      if (matches) {
        content = content.replace(pattern, replacement);
        result.fixes += matches.length;
        result.changes.push(`${description}: ${matches.length} fix(es)`);
      }
    }

    // Only write if changes were made
    if (content !== originalContent) {
      writeFileSync(filePath, content, 'utf8');
      console.log(chalk.green(`✅ Fixed ${result.fixes} db usage issues in ${result.file}`));
      result.changes.forEach(change => {
        console.log(chalk.gray(`  - ${change}`));
      });
    }

    return result;
  }

  /**
   * Run the fix process
   */
  public async run(): Promise<void> {
    console.log(chalk.yellow('🔧 Firebase Firestore DB Usage Fixer'));
    console.log(chalk.yellow('=====================================\n'));

    console.log(chalk.blue('Finding target files...'));
    const files = await this.findTargetFiles();
    console.log(chalk.blue(`Found ${files.length} TypeScript files to check\n`));

    console.log(chalk.blue('Fixing db usage patterns...'));
    
    for (const file of files) {
      const result = this.fixDbUsageInFile(file);
      if (result.fixes > 0) {
        this.fixes.push(result);
        this.totalFixes += result.fixes;
      }
    }

    this.generateReport();
  }

  /**
   * Generate final report
   */
  private generateReport(): void {
    console.log(chalk.yellow('\n📊 Fix Summary'));
    console.log(chalk.yellow('===============\n'));

    if (this.totalFixes === 0) {
      console.log(chalk.green('🎉 No db usage issues found! All files are already using db() correctly.'));
      return;
    }

    console.log(chalk.green(`✅ Fixed ${this.totalFixes} db usage issues in ${this.fixes.length} files:\n`));

    this.fixes.forEach(fix => {
      console.log(chalk.cyan(`📁 ${fix.file} (${fix.fixes} fixes)`));
      fix.changes.forEach(change => {
        console.log(chalk.gray(`  • ${change}`));
      });
      console.log('');
    });

    console.log(chalk.green('🎯 All Firebase db usage patterns have been fixed!'));
    console.log(chalk.green('The FirebaseError about collection() expecting a Firestore instance should now be resolved.'));
    
    console.log(chalk.yellow('\n🚀 Next Steps:'));
    console.log(chalk.white('1. Run your application to verify the fix'));
    console.log(chalk.white('2. Test the NotificationsProvider functionality'));
    console.log(chalk.white('3. Ensure no hook.js:608 errors occur'));
  }
}

// Run the fixer
const projectRoot = process.cwd();
const fixer = new FirestoreDbUsageFixer(projectRoot);

fixer.run().catch(error => {
  console.error(chalk.red('❌ Error running db usage fixer:'), error);
  process.exit(1);
});

export { FirestoreDbUsageFixer };