#!/usr/bin/env node

/**
 * Fast Build Script
 * Optimized build process for faster deployments
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class FastBuild {
  constructor() {
    this.startTime = Date.now();
    this.isCI = process.env.CI || process.env.VERCEL || process.env.NETLIFY;
  }

  log(message) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${message}`);
  }

  async runCommand(command, args = [], options = {}) {
    return new Promise((resolve, reject) => {
      this.log(`Running: ${command} ${args.join(' ')}`);
      
      const child = spawn(command, args, {
        stdio: 'inherit',
        shell: true,
        ...options
      });

      child.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Command failed with exit code ${code}`));
        }
      });

      child.on('error', (error) => {
        reject(error);
      });
    });
  }

  async checkCache() {
    this.log('🔍 Checking build cache...');
    
    const cacheFiles = [
      'functions/lib',
      'functions/.tsbuildinfo',
      'dist'
    ];

    let hasCache = false;
    for (const file of cacheFiles) {
      if (fs.existsSync(file)) {
        hasCache = true;
        this.log(`✅ Found cache: ${file}`);
      }
    }

    if (!hasCache) {
      this.log('⚠️ No cache found - this will be a full build');
    }

    return hasCache;
  }

  async buildFunctions() {
    this.log('🔧 Building Firebase Functions...');
    
    try {
      if (this.isCI) {
        // Fast CI build - skip asset processing
        await this.runCommand('cd functions && npm ci --ignore-scripts');
        await this.runCommand('cd functions && npm run build');
      } else {
        // Development build with caching
        await this.runCommand('cd functions && npm ci --prefer-offline --no-audit --ignore-scripts');
        await this.runCommand('cd functions && npm run build:fast');
      }
      
      this.log('✅ Functions build complete');
    } catch (error) {
      this.log(`❌ Functions build failed: ${error.message}`);
      throw error;
    }
  }

  async buildFrontend() {
    this.log('🎨 Building frontend...');
    
    try {
      await this.runCommand('npx vite build');
      this.log('✅ Frontend build complete');
    } catch (error) {
      this.log(`❌ Frontend build failed: ${error.message}`);
      throw error;
    }
  }

  async buildAssets() {
    if (this.isCI) {
      this.log('⏭️ Skipping asset processing in CI');
      return;
    }

    this.log('🖼️ Processing assets...');
    
    try {
      await this.runCommand('npm run assets:optimize');
      await this.runCommand('npm run assets:cleanup');
      this.log('✅ Asset processing complete');
    } catch (error) {
      this.log(`❌ Asset processing failed: ${error.message}`);
      throw error;
    }
  }

  async generateReport() {
    const endTime = Date.now();
    const duration = Math.round((endTime - this.startTime) / 1000);
    
    this.log(`\n📊 Build Report`);
    this.log('=' .repeat(40));
    this.log(`⏱️ Total time: ${duration} seconds`);
    this.log(`🏗️ Build type: ${this.isCI ? 'CI' : 'Development'}`);
    this.log(`📁 Output: dist/`);
    this.log(`🔧 Functions: functions/lib/`);
    
    if (duration < 300) {
      this.log('🚀 Excellent build performance!');
    } else if (duration < 600) {
      this.log('✅ Good build performance');
    } else {
      this.log('⚠️ Build could be optimized further');
    }
  }

  async run() {
    try {
      this.log('🚀 Starting fast build...');
      
      const hasCache = await this.checkCache();
      
      if (this.isCI) {
        // CI build - minimal steps
        await this.buildFunctions();
        await this.buildFrontend();
      } else {
        // Development build - with assets
        await this.buildFunctions();
        await this.buildAssets();
        await this.buildFrontend();
      }
      
      await this.generateReport();
      this.log('✅ Build completed successfully!');
      
    } catch (error) {
      this.log(`❌ Build failed: ${error.message}`);
      process.exit(1);
    }
  }
}

// Run if called directly
if (require.main === module) {
  const fastBuild = new FastBuild();
  fastBuild.run().catch(console.error);
}

module.exports = FastBuild;