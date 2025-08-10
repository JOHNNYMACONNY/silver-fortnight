#!/usr/bin/env node
/**
 * Asset Cleanup and Organization Script
 * Cleans up redundant optimized folders and organizes assets properly
 */

const fs = require('fs').promises;
const path = require('path');

const PUBLIC_DIR = path.join(__dirname, '../public');

class AssetCleaner {
  async run() {
    console.log('🧹 Starting asset cleanup and organization...');
    
    await this.cleanupRedundantFolders();
    await this.organizeOptimizedAssets();
    await this.generateFinalReport();
    
    console.log('✨ Asset cleanup complete!');
  }

  async cleanupRedundantFolders() {
    console.log('\n📁 Cleaning up redundant folders...');
    
    const redundantPaths = [
      path.join(PUBLIC_DIR, 'optimized'),
      path.join(PUBLIC_DIR, 'icons/optimized'),
      path.join(PUBLIC_DIR, 'images/optimized/optimized')
    ];

    for (const redundantPath of redundantPaths) {
      try {
        const stats = await fs.stat(redundantPath);
        if (stats.isDirectory()) {
          // Move files to parent directory if needed
          const files = await fs.readdir(redundantPath);
          const parentDir = path.dirname(redundantPath);
          
          for (const file of files) {
            const sourcePath = path.join(redundantPath, file);
            const targetPath = path.join(parentDir, file);
            
            try {
              // Check if target already exists
              await fs.access(targetPath);
              // If it exists, remove the redundant file
              await fs.unlink(sourcePath);
              console.log(`  🗑️  Removed redundant: ${path.relative(PUBLIC_DIR, sourcePath)}`);
            } catch {
              // If target doesn't exist, move the file
              await fs.rename(sourcePath, targetPath);
              console.log(`  📦 Moved: ${path.relative(PUBLIC_DIR, sourcePath)} → ${path.relative(PUBLIC_DIR, targetPath)}`);
            }
          }
          
          // Remove empty directory
          await fs.rmdir(redundantPath);
          console.log(`  🗂️  Removed directory: ${path.relative(PUBLIC_DIR, redundantPath)}`);
        }
      } catch (error) {
        // Directory doesn't exist, skip
      }
    }
  }

  async organizeOptimizedAssets() {
    console.log('\n📋 Organizing optimized assets...');
    
    // Ensure original favicon.png is replaced with optimized version
    const originalFavicon = path.join(PUBLIC_DIR, 'favicon.png');
    const optimizedFavicon = path.join(PUBLIC_DIR, 'images/optimized/tradeya-logo.png');
    
    try {
      await fs.access(optimizedFavicon);
      await fs.copyFile(optimizedFavicon, originalFavicon);
      console.log('  ✅ Updated favicon.png with optimized version');
    } catch (error) {
      console.log('  ⚠️  Optimized favicon not found, keeping original');
    }
  }

  async generateFinalReport() {
    console.log('\n📊 Generating final asset report...');
    
    const assetTypes = {
      images: ['.png', '.jpg', '.jpeg', '.svg', '.webp'],
      icons: ['.ico'],
      configs: ['.json', '.txt', '.xml']
    };

    const report = {
      totalAssets: 0,
      byType: {},
      structure: {}
    };

    // Recursively scan assets
    const scanDirectory = async (dir, relativePath = '') => {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        const relPath = path.join(relativePath, entry.name);
        
        if (entry.isDirectory() && !entry.name.startsWith('.')) {
          report.structure[relPath] = 'directory';
          await scanDirectory(fullPath, relPath);
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name).toLowerCase();
          const stats = await fs.stat(fullPath);
          
          report.totalAssets++;
          
          // Categorize by type
          let category = 'other';
          for (const [type, extensions] of Object.entries(assetTypes)) {
            if (extensions.includes(ext)) {
              category = type;
              break;
            }
          }
          
          if (!report.byType[category]) {
            report.byType[category] = { count: 0, totalSize: 0 };
          }
          
          report.byType[category].count++;
          report.byType[category].totalSize += stats.size;
          
          report.structure[relPath] = {
            type: 'file',
            category,
            size: this.formatBytes(stats.size)
          };
        }
      }
    };

    await scanDirectory(PUBLIC_DIR);

    console.log('\n📋 Final Asset Report:');
    console.log('=====================');
    console.log(`Total assets: ${report.totalAssets}`);
    
    for (const [category, data] of Object.entries(report.byType)) {
      console.log(`${category}: ${data.count} files (${this.formatBytes(data.totalSize)})`);
    }

    // Save detailed report
    await fs.writeFile(
      path.join(PUBLIC_DIR, 'asset-report.json'),
      JSON.stringify(report, null, 2)
    );
    
    console.log('\n💾 Detailed report saved to asset-report.json');
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// Run cleanup if script is executed directly
if (require.main === module) {
  const cleaner = new AssetCleaner();
  cleaner.run().catch(console.error);
}

module.exports = AssetCleaner;
