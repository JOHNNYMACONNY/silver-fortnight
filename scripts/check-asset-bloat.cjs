#!/usr/bin/env node
/**
 * Asset Bloat Detection Script
 * Prevents nested optimized directories and excessive asset duplication
 * Run automatically via pre-commit hook or CI
 */

const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.join(__dirname, '../public');
const MAX_NESTING_DEPTH = 1; // Maximum allowed optimized folder depth
const MAX_PUBLIC_SIZE_MB = 50; // Alert if public directory exceeds this
const MAX_DUPLICATE_FILES = 10; // Maximum allowed duplicate files

class AssetBloatChecker {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.stats = {
      nestedOptimizedDirs: [],
      duplicateFiles: new Map(),
      totalSize: 0,
      fileCount: 0
    };
  }

  async run() {
    console.log('🔍 Checking for asset bloat...\n');
    
    // Check for nested optimized directories
    await this.checkNestedOptimized(PUBLIC_DIR);
    
    // Check for duplicate files
    await this.checkDuplicates(PUBLIC_DIR);
    
    // Check public directory size
    await this.checkPublicSize();
    
    // Report findings
    this.report();
    
    // Exit with error if critical issues found
    if (this.errors.length > 0) {
      console.error('\n❌ Asset bloat check FAILED!');
      process.exit(1);
    }
    
    console.log('\n✅ Asset bloat check PASSED!');
    process.exit(0);
  }

  async checkNestedOptimized(dir, depth = 0, optimizedDepth = 0) {
    try {
      const entries = await fs.promises.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        if (!entry.isDirectory()) continue;
        
        const fullPath = path.join(dir, entry.name);
        const relativePath = path.relative(PUBLIC_DIR, fullPath);
        
        // Check if this is an optimized directory
        const newOptimizedDepth = entry.name === 'optimized' ? optimizedDepth + 1 : optimizedDepth;
        
        // Error if nested optimized directory detected
        if (newOptimizedDepth > MAX_NESTING_DEPTH) {
          this.errors.push({
            type: 'NESTED_OPTIMIZED',
            path: relativePath,
            depth: newOptimizedDepth,
            message: `Found nested optimized directory at depth ${newOptimizedDepth}: ${relativePath}`
          });
          this.stats.nestedOptimizedDirs.push(relativePath);
          continue; // Don't recurse deeper
        }
        
        // Skip hidden directories and node_modules
        if (entry.name.startsWith('.') || entry.name === 'node_modules') {
          continue;
        }
        
        // Recurse into subdirectory
        await this.checkNestedOptimized(fullPath, depth + 1, newOptimizedDepth);
      }
    } catch (error) {
      // Directory might not exist or be accessible
      if (error.code !== 'ENOENT') {
        console.warn(`Warning: Could not read directory ${dir}: ${error.message}`);
      }
    }
  }

  async checkDuplicates(dir, fileHashes = new Map()) {
    try {
      const entries = await fs.promises.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          // Skip hidden directories and node_modules
          if (!entry.name.startsWith('.') && entry.name !== 'node_modules') {
            await this.checkDuplicates(fullPath, fileHashes);
          }
        } else if (entry.isFile()) {
          // Track file by name
          const fileName = entry.name;
          if (!fileHashes.has(fileName)) {
            fileHashes.set(fileName, []);
          }
          fileHashes.get(fileName).push(path.relative(PUBLIC_DIR, fullPath));
          
          // Count total files and size
          this.stats.fileCount++;
          try {
            const stats = await fs.promises.stat(fullPath);
            this.stats.totalSize += stats.size;
          } catch (error) {
            // File might have been deleted
          }
        }
      }
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.warn(`Warning: Could not check duplicates in ${dir}: ${error.message}`);
      }
    }
    
    // Check for excessive duplicates (only at the end of recursion)
    if (dir === PUBLIC_DIR) {
      for (const [fileName, paths] of fileHashes.entries()) {
        if (paths.length > MAX_DUPLICATE_FILES) {
          this.warnings.push({
            type: 'EXCESSIVE_DUPLICATES',
            file: fileName,
            count: paths.length,
            message: `File "${fileName}" appears ${paths.length} times (max: ${MAX_DUPLICATE_FILES})`
          });
          this.stats.duplicateFiles.set(fileName, paths);
        }
      }
    }
    
    return fileHashes;
  }

  async checkPublicSize() {
    const sizeMB = this.stats.totalSize / (1024 * 1024);
    
    if (sizeMB > MAX_PUBLIC_SIZE_MB) {
      this.warnings.push({
        type: 'LARGE_PUBLIC_DIR',
        size: sizeMB.toFixed(2),
        message: `Public directory is ${sizeMB.toFixed(2)}MB (threshold: ${MAX_PUBLIC_SIZE_MB}MB)`
      });
    }
  }

  report() {
    console.log('📊 Asset Bloat Check Results');
    console.log('═'.repeat(50));
    
    // Errors (critical)
    if (this.errors.length > 0) {
      console.log('\n❌ ERRORS (must fix):');
      this.errors.forEach(error => {
        console.log(`  • ${error.message}`);
      });
    }
    
    // Warnings (should investigate)
    if (this.warnings.length > 0) {
      console.log('\n⚠️  WARNINGS:');
      this.warnings.forEach(warning => {
        console.log(`  • ${warning.message}`);
      });
    }
    
    // Stats
    console.log('\n📈 Statistics:');
    console.log(`  • Total files: ${this.stats.fileCount}`);
    console.log(`  • Total size: ${(this.stats.totalSize / (1024 * 1024)).toFixed(2)}MB`);
    console.log(`  • Nested optimized dirs: ${this.stats.nestedOptimizedDirs.length}`);
    console.log(`  • Files with excessive duplicates: ${this.stats.duplicateFiles.size}`);
    
    if (this.stats.nestedOptimizedDirs.length > 0) {
      console.log('\n🚨 Nested Optimized Directories Found:');
      this.stats.nestedOptimizedDirs.forEach(dir => {
        console.log(`  • ${dir}`);
      });
    }
    
    if (this.stats.duplicateFiles.size > 0) {
      console.log('\n⚠️  Excessive Duplicates:');
      for (const [file, paths] of this.stats.duplicateFiles.entries()) {
        console.log(`  • ${file} (${paths.length} copies)`);
      }
    }
  }
}

// Run if executed directly
if (require.main === module) {
  const checker = new AssetBloatChecker();
  checker.run().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = AssetBloatChecker;

