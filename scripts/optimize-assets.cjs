#!/usr/bin/env node
/**
 * Asset Optimization Script
 * Optimizes images and organizes static files in the public folder
 * Safe to run during migration - only affects static assets
 */

const fs = require('fs').promises;
const path = require('path');
const sharp = require('sharp');

const PUBLIC_DIR = path.join(__dirname, '../public');
const OPTIMIZED_DIR = path.join(PUBLIC_DIR, 'optimized');

class AssetOptimizer {
  constructor() {
    this.stats = {
      originalSize: 0,
      optimizedSize: 0,
      filesProcessed: 0
    };
  }

  async run() {
    console.log('🚀 Starting asset optimization...');
    
    // Create optimized directory structure
    await this.createDirectoryStructure();
    
    // Optimize existing images
    await this.optimizeImages();
    
    // Generate favicons in multiple sizes
    await this.generateFavicons();
    
    // Organize static files
    await this.organizeStaticFiles();
    
    // Generate optimization report
    this.generateReport();
  }

  async createDirectoryStructure() {
    const dirs = [
      path.join(PUBLIC_DIR, 'icons'),
      path.join(PUBLIC_DIR, 'images', 'logos'),
      path.join(PUBLIC_DIR, 'images', 'optimized'),
      path.join(PUBLIC_DIR, 'assets', 'css'),
      path.join(PUBLIC_DIR, 'assets', 'js')
    ];

    for (const dir of dirs) {
      try {
        await fs.mkdir(dir, { recursive: true });
        console.log(`✅ Created directory: ${path.relative(PUBLIC_DIR, dir)}`);
      } catch (error) {
        if (error.code !== 'EEXIST') {
          console.error(`❌ Error creating directory ${dir}:`, error.message);
        }
      }
    }
  }

  async optimizeImages() {
    console.log('\n📸 Optimizing images...');
    
    const imagePaths = await this.findImages(PUBLIC_DIR);
    
    for (const imagePath of imagePaths) {
      await this.optimizeImage(imagePath);
    }
  }

  async findImages(dir) {
    const images = [];
    const entries = await fs.readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory() && !entry.name.startsWith('.')) {
        images.push(...await this.findImages(fullPath));
      } else if (entry.isFile() && this.isImageFile(entry.name)) {
        images.push(fullPath);
      }
    }
    
    return images;
  }

  isImageFile(filename) {
    const imageExtensions = ['.png', '.jpg', '.jpeg', '.svg', '.webp'];
    return imageExtensions.some(ext => filename.toLowerCase().endsWith(ext));
  }

  async optimizeImage(imagePath) {
    try {
      const originalStats = await fs.stat(imagePath);
      this.stats.originalSize += originalStats.size;
      
      const relativePath = path.relative(PUBLIC_DIR, imagePath);
      const ext = path.extname(imagePath).toLowerCase();
      
      console.log(`  Processing: ${relativePath} (${this.formatBytes(originalStats.size)})`);
      
      let optimizedPath = imagePath;
      
      if (ext === '.svg') {
        // Simple SVG optimization using built-in string operations
        const svgContent = await fs.readFile(imagePath, 'utf8');
        const optimizedSvg = svgContent
          .replace(/\s+/g, ' ')
          .replace(/>\s+</g, '><')
          .trim();
        
        if (optimizedSvg.length < svgContent.length) {
          await fs.writeFile(imagePath, optimizedSvg);
          console.log(`    ✅ SVG optimized: ${this.formatBytes(Buffer.byteLength(optimizedSvg))}`);
        }
        optimizedPath = imagePath;
      } else if (['.png', '.jpg', '.jpeg'].includes(ext)) {
        // Create optimized directory path
        const optimizedDir = path.join(path.dirname(imagePath), 'optimized');
        await fs.mkdir(optimizedDir, { recursive: true });
        
        optimizedPath = path.join(optimizedDir, path.basename(imagePath));
        
        if (ext === '.png') {
          // Optimize PNG with sharp
          await sharp(imagePath)
            .png({ 
              quality: 85, 
              compressionLevel: 9,
              progressive: true
            })
            .toFile(optimizedPath);
        } else {
          // Optimize JPEG
          await sharp(imagePath)
            .jpeg({ 
              quality: 85, 
              progressive: true,
              mozjpeg: true
            })
            .toFile(optimizedPath);
        }
      }
      
      const optimizedStats = await fs.stat(optimizedPath);
      this.stats.optimizedSize += optimizedStats.size;
      this.stats.filesProcessed++;
      
      const savings = originalStats.size - optimizedStats.size;
      const percentage = originalStats.size > 0 ? ((savings / originalStats.size) * 100).toFixed(1) : 0;
      
      console.log(`    ✅ Optimized: ${this.formatBytes(optimizedStats.size)} (-${percentage}%)`);
      
    } catch (error) {
      console.error(`    ❌ Error optimizing ${imagePath}:`, error.message);
    }
  }

  async generateFavicons() {
    console.log('\n🎨 Generating favicon variations...');
    
    const logoPath = path.join(PUBLIC_DIR, 'images', 'tradeya-logo.png');
    const iconsDir = path.join(PUBLIC_DIR, 'icons');
    
    const sizes = [16, 32, 48, 96, 144, 192, 256, 512];
    
    try {
      for (const size of sizes) {
        const outputPath = path.join(iconsDir, `favicon-${size}x${size}.png`);
        
        await sharp(logoPath)
          .resize(size, size, { 
            fit: 'contain', 
            background: { r: 255, g: 255, b: 255, alpha: 0 } 
          })
          .png({ quality: 90 })
          .toFile(outputPath);
          
        console.log(`  ✅ Generated: favicon-${size}x${size}.png`);
      }
      
      // Generate ICO file for older browsers
      await sharp(logoPath)
        .resize(32, 32)
        .png()
        .toFile(path.join(PUBLIC_DIR, 'favicon.ico'));
        
      console.log('  ✅ Generated: favicon.ico');
      
    } catch (error) {
      console.error('❌ Error generating favicons:', error.message);
    }
  }

  async organizeStaticFiles() {
    console.log('\n📁 Organizing static files...');
    
    // Move CSS and JS files to assets folder
    const entries = await fs.readdir(PUBLIC_DIR, { withFileTypes: true });
    
    for (const entry of entries) {
      if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        let targetDir = null;
        
        if (ext === '.css') {
          targetDir = path.join(PUBLIC_DIR, 'assets', 'css');
        } else if (ext === '.js' && !entry.name.includes('middleware')) {
          targetDir = path.join(PUBLIC_DIR, 'assets', 'js');
        }
        
        if (targetDir) {
          const sourcePath = path.join(PUBLIC_DIR, entry.name);
          const targetPath = path.join(targetDir, entry.name);
          
          try {
            await fs.rename(sourcePath, targetPath);
            console.log(`  📦 Moved: ${entry.name} → assets/${path.basename(targetDir)}/`);
          } catch (error) {
            if (error.code !== 'ENOENT') {
              console.error(`❌ Error moving ${entry.name}:`, error.message);
            }
          }
        }
      }
    }
  }

  generateReport() {
    const totalSavings = this.stats.originalSize - this.stats.optimizedSize;
    const percentage = this.stats.originalSize > 0 
      ? ((totalSavings / this.stats.originalSize) * 100).toFixed(1)
      : 0;
    
    console.log('\n📊 Optimization Report');
    console.log('========================');
    console.log(`Files processed: ${this.stats.filesProcessed}`);
    console.log(`Original size: ${this.formatBytes(this.stats.originalSize)}`);
    console.log(`Optimized size: ${this.formatBytes(this.stats.optimizedSize)}`);
    console.log(`Total savings: ${this.formatBytes(totalSavings)} (${percentage}%)`);
    console.log('\n✨ Asset optimization complete!');
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// Run optimization if script is executed directly
if (require.main === module) {
  const optimizer = new AssetOptimizer();
  optimizer.run().catch(console.error);
}

module.exports = AssetOptimizer;
