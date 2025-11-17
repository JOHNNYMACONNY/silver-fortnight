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
  private directoryFilter?: string;

  constructor(directoryFilter?: string) {
    this.directoryFilter = directoryFilter;
  }

  async fixAll(): Promise<void> {
    console.log('🔧 Starting technical debt fixes...');
    if (this.directoryFilter) {
      console.log(`📁 Filtering to directory: ${this.directoryFilter}`);
    }
    
    // Only run console replacement for this cleanup task
    await this.fixConsoleStatements();
    // Skip other fixes for now to avoid breaking changes
    // await this.fixHardcodedValues();
    // await this.fixMissingErrorHandling();
    // await this.fixUnusedImports();
    // await this.fixDeprecatedPatterns();
    // await this.updateDependencies();
    await this.generateReport();
    
    console.log('✅ Technical debt fixes completed');
  }

  private async fixConsoleStatements(): Promise<void> {
    console.log('  📝 Fixing console statements...');
    
    const files = this.getSourceFiles();
    
    for (const file of files) {
      // Skip development utilities, logger files, test files, debug utilities, and scripts
      if (
        file.includes('development/') || 
        file.includes('logger.ts') || 
        file.includes('.test.') ||
        file.includes('.spec.') ||
        file.includes('debug/') ||
        file.includes('__mocks__') ||
        file.includes('__tests__') ||
        file.includes('scripts/')
      ) {
        continue;
      }
      
      const content = fs.readFileSync(file, 'utf-8');
      let newContent = content;
      const fixes: string[] = [];
      let needsLoggerImport = false;

      // Replace console statements - manually find and replace to handle template literals correctly
      const consolePatterns = [
        { method: 'log', level: 'debug' },
        { method: 'debug', level: 'debug' },
        { method: 'info', level: 'info' },
        { method: 'warn', level: 'warn' },
        { method: 'error', level: 'error' }
      ];

      // Process in reverse order to maintain correct offsets
      const replacements: Array<{ start: number; end: number; replacement: string }> = [];

      for (const { method, level } of consolePatterns) {
        const pattern = new RegExp(`console\\.${method}\\s*\\(`, 'g');
        let match;

        while ((match = pattern.exec(newContent)) !== null) {
          const start = match.index;
          const afterMatch = start + match[0].length;
          let depth = 1;
          let i = afterMatch;
          let inString = false;
          let inTemplate = false;
          let stringChar = '';
          let args = '';

          while (i < newContent.length && depth > 0) {
            const char = newContent[i];
            const prevChar = i > 0 ? newContent[i - 1] : '';

            if (!inString && !inTemplate && (char === '"' || char === "'" || char === '`')) {
              inString = char !== '`';
              inTemplate = char === '`';
              stringChar = char;
              args += char;
            } else if ((inString && char === stringChar && prevChar !== '\\') ||
                       (inTemplate && char === '`')) {
              inString = false;
              inTemplate = false;
              args += char;
            } else if (inString || inTemplate) {
              args += char;
            } else if (char === '(' || char === '[' || char === '{') {
              depth++;
              args += char;
            } else if (char === ')' || char === ']' || char === '}') {
              depth--;
              if (depth > 0) {
                args += char;
              } else {
                // Reached closing parenthesis, don't include it in args
                break;
              }
            } else {
              args += char;
            }
            i++;
          }

          const end = i + 1; // Include the closing parenthesis
          const replacement = this.convertConsoleArgs(level as any, args, file);
          replacements.push({ start, end, replacement });
          fixes.push(`Replaced console.${method} with logger.${level}`);
          needsLoggerImport = true;
        }
      }

      // Apply replacements in reverse order to maintain correct offsets
      replacements.sort((a, b) => b.start - a.start);
      for (const { start, end, replacement } of replacements) {
        newContent = newContent.slice(0, start) + replacement + newContent.slice(end);
      }

      // Add logger import if needed (using path alias)
      if (needsLoggerImport && !this.hasLoggerImport(newContent)) {
        newContent = this.addLoggerImport(newContent);
        fixes.push('Added logger import');
      }
      
      if (newContent !== content) {
        // Create backup before modifying
        const backupPath = `${file}.backup`;
        fs.writeFileSync(backupPath, content);
        
        fs.writeFileSync(file, newContent);
        this.results.push({
          file: this.getRelativePath(file),
          fixes,
          errors: []
        });
        
        // Clean up backup after successful modification (1 second delay)
        setTimeout(() => {
          if (fs.existsSync(backupPath)) {
            fs.unlinkSync(backupPath);
          }
        }, 1000);
      }
    }
  }

  /**
   * Convert console statement arguments to logger API call
   * Handles multiple arguments intelligently
   */
  private convertConsoleArgs(
    level: 'debug' | 'info' | 'warn' | 'error',
    args: string,
    filePath: string
  ): string {
    const context = this.getContextFromFile(filePath);
    const trimmedArgs = args.trim();

    // Empty arguments
    if (!trimmedArgs) {
      return `logger.${level}('', '${context}')`;
    }

    // Parse arguments (handle commas, but respect strings, templates, objects)
    const parsedArgs = this.parseConsoleArguments(trimmedArgs);

    if (parsedArgs.length === 0) {
      return `logger.${level}('', '${context}')`;
    }

    // Single argument cases
    if (parsedArgs.length === 1) {
      const arg = parsedArgs[0];
      
      // Check if it's an Error object (for console.error)
      if (level === 'error' && this.looksLikeError(arg)) {
        // For errors, extract message and pass error object
        const errorVar = arg.trim();
        return `logger.error('Error occurred', '${context}', undefined, ${errorVar} as Error)`;
      }
      
      // Check if it's already a string (template literal or quoted string)
      if (this.isStringLiteral(arg)) {
        return `logger.${level}(${arg}, '${context}')`;
      }
      
      // It's a variable or expression - create message and data
      return `logger.${level}(\`${this.sanitizeForTemplate(arg)}\`, '${context}', ${arg})`;
    }

    // Multiple arguments - combine first as message, rest as data object
    const firstArg = parsedArgs[0];
    const restArgs = parsedArgs.slice(1);

    // If first arg is a string, use it as message base
    let message: string;
    if (this.isStringLiteral(firstArg)) {
      const trimmed = firstArg.trim();
      // Check if it's a template literal (starts and ends with `)
      if (trimmed.startsWith('`') && trimmed.endsWith('`')) {
        // Preserve template literal as-is
        message = trimmed;
      } else {
        // Regular string literal - remove quotes for message
        const cleanMessage = trimmed
          .replace(/^['"]|['"]$/g, '');
        message = `'${cleanMessage}'`;
      }
    } else {
      // First arg is a variable - create message with it
      message = `\`${this.sanitizeForTemplate(firstArg)}\``;
    }

    // Build data object from remaining arguments
    let dataObject = '{}';
    if (restArgs.length === 1) {
      // For error level with error-like variable, extract to 4th parameter
      if (level === 'error' && this.looksLikeError(restArgs[0])) {
        return `logger.error(${message}, '${context}', {}, ${restArgs[0]} as Error)`;
      }
      dataObject = restArgs[0];
    } else if (restArgs.length > 1) {
      // Create object with indexed keys
      const dataEntries = restArgs.map((arg, idx) => `arg${idx}: ${arg}`).join(', ');
      dataObject = `{ ${dataEntries} }`;
    }

    // Special handling for console.error with Error object as last argument
    if (level === 'error' && restArgs.length > 0) {
      const lastArg = restArgs[restArgs.length - 1];
      if (this.looksLikeError(lastArg)) {
        // Extract error from data and pass separately
        const dataWithoutError = restArgs.slice(0, -1);
        let dataObj = '{}';
        if (dataWithoutError.length > 0) {
          const entries = dataWithoutError.map((arg, idx) => `arg${idx}: ${arg}`).join(', ');
          dataObj = `{ ${entries} }`;
        }
        return `logger.error(${message}, '${context}', ${dataObj}, ${lastArg} as Error)`;
      }
    }

    return `logger.${level}(${message}, '${context}', ${dataObject})`;
  }

  /**
   * Parse console arguments, handling strings, templates, and nested structures
   */
  private parseConsoleArguments(args: string): string[] {
    const result: string[] = [];
    let current = '';
    let parenDepth = 0;
    let bracketDepth = 0;
    let braceDepth = 0;
    let inString = false;
    let inTemplate = false;
    let stringChar = '';

    for (let i = 0; i < args.length; i++) {
      const char = args[i];
      const prevChar = i > 0 ? args[i - 1] : '';

      // Handle string/template literal boundaries
      if (!inString && !inTemplate && (char === '"' || char === "'" || char === '`')) {
        inString = char !== '`';
        inTemplate = char === '`';
        stringChar = char;
        current += char;
      } else if ((inString && char === stringChar && prevChar !== '\\') ||
                 (inTemplate && char === '`')) {
        inString = false;
        inTemplate = false;
        current += char;
      } else if (inString || inTemplate) {
        current += char;
      }
      // Handle parentheses for function calls and nested structures
      else if (char === '(') {
        parenDepth++;
        current += char;
      } else if (char === ')') {
        parenDepth--;
        current += char;
      } else if (char === '[') {
        bracketDepth++;
        current += char;
      } else if (char === ']') {
        bracketDepth--;
        current += char;
      } else if (char === '{') {
        braceDepth++;
        current += char;
      } else if (char === '}') {
        braceDepth--;
        current += char;
      }
      // Handle comma separator (only when at depth 0 and not in string)
      else if (char === ',' && parenDepth === 0 && bracketDepth === 0 && braceDepth === 0 && !inString && !inTemplate) {
        if (current.trim()) {
          result.push(current.trim());
        }
        current = '';
      } else {
        current += char;
      }
    }

    // Push last argument
    if (current.trim()) {
      result.push(current.trim());
    }

    return result;
  }

  /**
   * Check if argument is a string literal (quoted or template)
   */
  private isStringLiteral(arg: string): boolean {
    const trimmed = arg.trim();
    return (
      (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
      (trimmed.startsWith("'") && trimmed.endsWith("'")) ||
      (trimmed.startsWith('`') && trimmed.endsWith('`'))
    );
  }

  /**
   * Check if argument looks like an Error object/variable
   */
  private looksLikeError(arg: string): boolean {
    const trimmed = arg.trim();
    // Check for common error patterns
    return (
      /error/i.test(trimmed) ||
      /exception/i.test(trimmed) ||
      /err/i.test(trimmed) ||
      trimmed.toLowerCase().includes('err')
    );
  }

  /**
   * Sanitize content for use in template literal
   */
  private sanitizeForTemplate(arg: string): string {
    // Simple sanitization - in practice might need more sophisticated handling
    return arg
      .replace(/\$\{/g, '\\${')
      .replace(/`/g, '\\`')
      .replace(/\$/g, '\\$');
  }

  /**
   * Check if file already has logger import
   */
  private hasLoggerImport(content: string): boolean {
    // Check for various import patterns
    return (
      content.includes('import { logger }') ||
      content.includes('import logger from') ||
      content.includes("from '@utils/logging/logger'") ||
      content.includes("from '@/utils/logging/logger'") ||
      content.includes("from '../utils/logging/logger'") ||
      content.includes("from '../../utils/logging/logger'") ||
      content.includes("from '../../../utils/logging/logger'")
    );
  }

  /**
   * Add logger import using path alias
   */
  private addLoggerImport(content: string): string {
    // Find the last import statement
    const importRegex = /^import\s+.*?;$/gm;
    const imports = content.match(importRegex) || [];
    
    if (imports.length === 0) {
      // No imports yet, add at the top
      return `import { logger } from '@utils/logging/logger';\n${content}`;
    }

    // Find the last import's position
    const lastImport = imports[imports.length - 1];
    const lastImportIndex = content.lastIndexOf(lastImport);
    const insertIndex = lastImportIndex + lastImport.length;

    // Check if logger import already exists (shouldn't, but double-check)
    if (!this.hasLoggerImport(content)) {
      return (
        content.slice(0, insertIndex) +
        "\nimport { logger } from '@utils/logging/logger';" +
        content.slice(insertIndex)
      );
    }

    return content;
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
          // Apply directory filter if specified
          if (!this.directoryFilter || fullPath.includes(this.directoryFilter)) {
            files.push(fullPath);
          }
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
  // Check for directory filter argument
  const directoryFilter = process.argv[2] || undefined;
  const fixer = new TechnicalDebtFixer(directoryFilter);
  await fixer.fixAll();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { TechnicalDebtFixer };
