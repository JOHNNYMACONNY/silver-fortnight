#!/usr/bin/env node

/**
 * Build Optimizer Script
 * Analyzes and optimizes build performance
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class BuildOptimizer {
  constructor() {
    this.startTime = Date.now();
    this.metrics = {
      dependencies: {},
      buildSteps: {},
      optimizations: []
    };
  }

  log(message) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${message}`);
  }

  async analyzeDependencies() {
    this.log('🔍 Analyzing dependencies...');
    
    try {
      // Check package.json size
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      const functionsPackageJson = JSON.parse(fs.readFileSync('functions/package.json', 'utf8'));
      
      this.metrics.dependencies = {
        mainDeps: Object.keys(packageJson.dependencies || {}).length,
        mainDevDeps: Object.keys(packageJson.devDependencies || {}).length,
        functionsDeps: Object.keys(functionsPackageJson.dependencies || {}).length,
        functionsDevDeps: Object.keys(functionsPackageJson.devDependencies || {}).length,
        scripts: Object.keys(packageJson.scripts || {}).length
      };
      
      this.log(`📊 Main project: ${this.metrics.dependencies.mainDeps} deps, ${this.metrics.dependencies.mainDevDeps} dev deps`);
      this.log(`📊 Functions: ${this.metrics.dependencies.functionsDeps} deps, ${this.metrics.dependencies.functionsDevDeps} dev deps`);
      this.log(`📊 Scripts: ${this.metrics.dependencies.scripts} scripts`);
      
    } catch (error) {
      this.log(`❌ Error analyzing dependencies: ${error.message}`);
    }
  }

  async checkBuildCache() {
    this.log('🗂️ Checking build cache...');
    
    const cacheFiles = [
      'functions/.tsbuildinfo',
      'dist',
      'functions/lib'
    ];
    
    const cacheStatus = {};
    
    for (const file of cacheFiles) {
      try {
        const stats = fs.statSync(file);
        cacheStatus[file] = {
          exists: true,
          size: stats.size,
          modified: stats.mtime
        };
      } catch (error) {
        cacheStatus[file] = { exists: false };
      }
    }
    
    this.metrics.cache = cacheStatus;
    this.log(`📁 Cache status: ${JSON.stringify(cacheStatus, null, 2)}`);
  }

  async suggestOptimizations() {
    this.log('💡 Analyzing optimization opportunities...');
    
    const suggestions = [];
    
    // Check for heavy dependencies
    if (this.metrics.dependencies.mainDeps > 50) {
      suggestions.push({
        type: 'dependency',
        message: 'Consider reducing main project dependencies',
        impact: 'high'
      });
    }
    
    if (this.metrics.dependencies.functionsDeps > 10) {
      suggestions.push({
        type: 'functions',
        message: 'Functions have many dependencies - consider moving heavy deps to main project',
        impact: 'medium'
      });
    }
    
    // Check for missing cache
    if (!this.metrics.cache?.['functions/.tsbuildinfo']?.exists) {
      suggestions.push({
        type: 'cache',
        message: 'Enable TypeScript incremental compilation for functions',
        impact: 'high'
      });
    }
    
    // Check for large number of scripts
    if (this.metrics.dependencies.scripts > 100) {
      suggestions.push({
        type: 'scripts',
        message: 'Too many scripts - consider consolidating or removing unused ones',
        impact: 'medium'
      });
    }
    
    this.metrics.optimizations = suggestions;
    
    if (suggestions.length > 0) {
      this.log('🎯 Optimization suggestions:');
      suggestions.forEach((suggestion, index) => {
        const emoji = suggestion.impact === 'high' ? '🔴' : suggestion.impact === 'medium' ? '🟡' : '🟢';
        this.log(`${emoji} ${index + 1}. ${suggestion.message} (${suggestion.impact} impact)`);
      });
    } else {
      this.log('✅ No major optimization opportunities found');
    }
  }

  async generateReport() {
    const endTime = Date.now();
    const duration = endTime - this.startTime;
    
    this.log(`\n📈 Build Optimizer Report (${duration}ms)`);
    this.log('=' .repeat(50));
    
    // Dependencies summary
    this.log('\n📦 Dependencies Summary:');
    this.log(`   Main project: ${this.metrics.dependencies.mainDeps} deps, ${this.metrics.dependencies.mainDevDeps} dev deps`);
    this.log(`   Functions: ${this.metrics.dependencies.functionsDeps} deps, ${this.metrics.dependencies.functionsDevDeps} dev deps`);
    this.log(`   Total scripts: ${this.metrics.dependencies.scripts}`);
    
    // Cache summary
    if (this.metrics.cache) {
      this.log('\n🗂️ Cache Status:');
      Object.entries(this.metrics.cache).forEach(([file, status]) => {
        const emoji = status.exists ? '✅' : '❌';
        const size = status.exists ? ` (${Math.round(status.size / 1024)}KB)` : '';
        this.log(`   ${emoji} ${file}${size}`);
      });
    }
    
    // Optimizations
    if (this.metrics.optimizations.length > 0) {
      this.log('\n💡 Optimization Opportunities:');
      this.metrics.optimizations.forEach((opt, index) => {
        const emoji = opt.impact === 'high' ? '🔴' : opt.impact === 'medium' ? '🟡' : '🟢';
        this.log(`   ${emoji} ${opt.message}`);
      });
    }
    
    // Save report
    const reportPath = `build-optimizer-report-${Date.now()}.json`;
    fs.writeFileSync(reportPath, JSON.stringify(this.metrics, null, 2));
    this.log(`\n💾 Report saved to: ${reportPath}`);
  }

  async run() {
    this.log('🚀 Starting build optimization analysis...');
    
    await this.analyzeDependencies();
    await this.checkBuildCache();
    await this.suggestOptimizations();
    await this.generateReport();
    
    this.log('✅ Build optimization analysis complete!');
  }
}

// Run if called directly
if (require.main === module) {
  const optimizer = new BuildOptimizer();
  optimizer.run().catch(console.error);
}

module.exports = BuildOptimizer;