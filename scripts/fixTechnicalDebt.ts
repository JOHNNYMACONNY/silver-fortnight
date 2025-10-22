#!/usr/bin/env node

/**
 * Technical Debt Fix Implementation
 * 
 * Systematically addresses technical debt issues identified in the codebase
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

interface FixResult {
  file: string;
  fixes: string[];
  errors: string[];
}

class TechnicalDebtFixer {
  private results: FixResult[] = [];

  async fixAll(): Promise<void> {
    console.log('🔧 Starting technical debt fixes...');
    
    await this.fixConsoleStatements();
    await this.fixHardcodedValues();
    await this.fixMissingErrorHandling();
    await this.fixUnusedImports();
    await this.fixDeprecatedPatterns();
    await this.updateDependencies();
    await this.generateReport();
    
    console.log('✅ Technical debt fixes completed');
  }

  private async fixConsoleStatements(): Promise<void> {
    console.log('  📝 Fixing console statements...');
    
    const files = this.getSourceFiles();
    
    for (const file of files) {
      // Skip development utilities and logger files
      if (file.includes('development/') || file.includes('logger.ts') || file.includes('.test.')) {
        continue;
      }
      
      const content = fs.readFileSync(file, 'utf-8');
      let newContent = content;
      const fixes: string[] = [];
      
      // Replace console.log with logger calls
      const consoleLogPattern = /console\.log\s*\(\s*([^)]+)\s*\)/g;
      newContent = newContent.replace(consoleLogPattern, (match, args) => {
        fixes.push(`Replaced console.log with logger.debug`);
        return `logger.debug(${args}, '${this.getContextFromFile(file)}')`;
      });
      
      // Replace console.error with logger calls
      const consoleErrorPattern = /console\.error\s*\(\s*([^)]+)\s*\)/g;
      newContent = newContent.replace(consoleErrorPattern, (match, args) => {
        fixes.push(`Replaced console.error with logger.error`);
        return `logger.error(${args}, '${this.getContextFromFile(file)}')`;
      });
      
      // Replace console.warn with logger calls
      const consoleWarnPattern = /console\.warn\s*\(\s*([^)]+)\s*\)/g;
      newContent = newContent.replace(consoleWarnPattern, (match, args) => {
        fixes.push(`Replaced console.warn with logger.warn`);
        return `logger.warn(${args}, '${this.getContextFromFile(file)}')`;
      });
      
      // Add logger import if needed
      if (newContent !== content && !newContent.includes("import { logger }")) {
        const importMatch = newContent.match(/^(import.*?;\n)+/m);
        if (importMatch) {
          const lastImportIndex = importMatch[0].lastIndexOf('\n');
          newContent = newContent.slice(0, lastImportIndex) + 
                      "\nimport { logger } from '../utils/logging/logger';" +
                      newContent.slice(lastImportIndex);
          fixes.push('Added logger import');
        }
      }
      
      if (newContent !== content) {
        fs.writeFileSync(file, newContent);
        this.results.push({
          file: this.getRelativePath(file),
          fixes,
          errors: []
        });
      }
    }
  }

  private async fixHardcodedValues(): Promise<void> {
    console.log('  🔢 Fixing hardcoded values...');
    
    const files = this.getSourceFiles();
    const configImports = new Set<string>();
    
    for (const file of files) {
      if (file.includes('config/') || file.includes('constants/')) {
        continue;
      }
      
      const content = fs.readFileSync(file, 'utf-8');
      let newContent = content;
      const fixes: string[] = [];
      
      // Replace hardcoded timeouts
      const timeoutPattern = /setTimeout\([^,]+,\s*(\d{4,})\)/g;
      newContent = newContent.replace(timeoutPattern, (match, timeout) => {
        fixes.push(`Replaced hardcoded timeout ${timeout} with config value`);
        configImports.add('config');
        return match.replace(timeout, 'config.ui.animations.defaultDuration');
      });
      
      // Replace hardcoded URLs
      const urlPattern = /(https?:\/\/[^\s'"]+)/g;
      newContent = newContent.replace(urlPattern, (match, url) => {
        if (!url.includes('localhost') && !url.includes('example.com')) {
          fixes.push(`Replaced hardcoded URL with config value`);
          configImports.add('config');
          return 'config.app.baseUrl';
        }
        return match;
      });
      
      // Add config import if needed
      if (configImports.has('config') && !newContent.includes("import { config }")) {
        const importMatch = newContent.match(/^(import.*?;\n)+/m);
        if (importMatch) {
          const lastImportIndex = importMatch[0].lastIndexOf('\n');
          newContent = newContent.slice(0, lastImportIndex) + 
                      "\nimport { config } from '../config/appConfig';" +
                      newContent.slice(lastImportIndex);
          fixes.push('Added config import');
        }
      }
      
      if (newContent !== content) {
        fs.writeFileSync(file, newContent);
        this.results.push({
          file: this.getRelativePath(file),
          fixes,
          errors: []
        });
      }
    }
  }

  private async fixMissingErrorHandling(): Promise<void> {
    console.log('  ⚠️ Adding missing error handling...');
    
    const files = this.getSourceFiles();
    
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      let newContent = content;
      const fixes: string[] = [];
      
      // Add try-catch to async functions without error handling
      const asyncFunctionPattern = /async\s+function\s+(\w+)[^{]*\{([^}]*(?:\{[^}]*\}[^}]*)*)\}/g;
      newContent = newContent.replace(asyncFunctionPattern, (match, funcName, body) => {
        if (!body.includes('try') && !body.includes('catch')) {
          fixes.push(`Added error handling to async function ${funcName}`);
          return match.replace(body, `\n  try {${body}\n  } catch (error) {\n    logger.error('Error in ${funcName}', '${this.getContextFromFile(file)}', undefined, error as Error);\n    throw error;\n  }\n`);
        }
        return match;
      });
      
      if (newContent !== content) {
        fs.writeFileSync(file, newContent);
        this.results.push({
          file: this.getRelativePath(file),
          fixes,
          errors: []
        });
      }
    }
  }

  private async fixUnusedImports(): Promise<void> {
    console.log('  📦 Removing unused imports...');
    
    try {
      execSync('npx eslint src --fix --rule "no-unused-vars: error"', { 
        stdio: 'pipe' 
      });
      
      this.results.push({
        file: 'Multiple files',
        fixes: ['Removed unused imports via ESLint'],
        errors: []
      });
    } catch (error) {
      console.log('    ⚠️ Could not automatically fix unused imports');
    }
  }

  private async fixDeprecatedPatterns(): Promise<void> {
    console.log('  🚫 Fixing deprecated patterns...');
    
    const files = this.getSourceFiles();
    
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      let newContent = content;
      const fixes: string[] = [];
      
      // Replace componentDidMount with useEffect
      if (newContent.includes('componentDidMount')) {
        newContent = newContent.replace(
          /componentDidMount\(\)\s*\{([^}]*)\}/g,
          'useEffect(() => {$1}, [])'
        );
        fixes.push('Replaced componentDidMount with useEffect');
      }
      
      // Replace componentWillUnmount with useEffect cleanup
      if (newContent.includes('componentWillUnmount')) {
        newContent = newContent.replace(
          /componentWillUnmount\(\)\s*\{([^}]*)\}/g,
          'useEffect(() => { return () => {$1}; }, [])'
        );
        fixes.push('Replaced componentWillUnmount with useEffect cleanup');
      }
      
      if (newContent !== content) {
        fs.writeFileSync(file, newContent);
        this.results.push({
          file: this.getRelativePath(file),
          fixes,
          errors: []
        });
      }
    }
  }

  private async updateDependencies(): Promise<void> {
    console.log('  📦 Updating dependencies...');
    
    try {
      // Run dependency update script
      execSync('npx tsx scripts/updateDependencies.ts --safe-only', { 
        stdio: 'inherit' 
      });
      
      this.results.push({
        file: 'package.json',
        fixes: ['Updated safe dependencies'],
        errors: []
      });
    } catch (error) {
      this.results.push({
        file: 'package.json',
        fixes: [],
        errors: ['Failed to update dependencies']
      });
    }
  }

  private getSourceFiles(): string[] {
    const files: string[] = [];
    
    const walkDir = (dir: string) => {
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
          walkDir(fullPath);
        } else if (stat.isFile() && (item.endsWith('.ts') || item.endsWith('.tsx'))) {
          files.push(fullPath);
        }
      }
    };
    
    walkDir('src');
    return files;
  }

  private getContextFromFile(filePath: string): string {
    const relativePath = this.getRelativePath(filePath);
    const parts = relativePath.split('/');
    
    if (parts.includes('components')) {
      return 'COMPONENT';
    } else if (parts.includes('services')) {
      return 'SERVICE';
    } else if (parts.includes('utils')) {
      return 'UTILITY';
    } else if (parts.includes('contexts')) {
      return 'CONTEXT';
    } else if (parts.includes('pages')) {
      return 'PAGE';
    }
    
    return 'APP';
  }

  private getRelativePath(filePath: string): string {
    return path.relative(process.cwd(), filePath);
  }

  private async generateReport(): Promise<void> {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        filesModified: this.results.length,
        totalFixes: this.results.reduce((sum, result) => sum + result.fixes.length, 0),
        totalErrors: this.results.reduce((sum, result) => sum + result.errors.length, 0)
      },
      results: this.results,
      recommendations: [
        'Run full test suite to verify fixes',
        'Review changes before committing',
        'Monitor application performance',
        'Update documentation if needed'
      ]
    };
    
    fs.writeFileSync('technical-debt-fixes-report.json', JSON.stringify(report, null, 2));
    
    console.log('\n📊 Technical Debt Fixes Report');
    console.log('==============================');
    console.log(`Files modified: ${report.summary.filesModified}`);
    console.log(`Total fixes applied: ${report.summary.totalFixes}`);
    console.log(`Errors encountered: ${report.summary.totalErrors}`);
    console.log('\nDetailed report saved to: technical-debt-fixes-report.json');
  }
}

// CLI execution
async function main() {
  const fixer = new TechnicalDebtFixer();
  await fixer.fixAll();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { TechnicalDebtFixer };
