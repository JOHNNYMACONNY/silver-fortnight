#!/usr/bin/env node

/**
 * Technical Debt Analyzer
 * 
 * Analyzes the codebase for technical debt patterns and generates
 * a comprehensive report with actionable recommendations
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

export interface TechnicalDebtIssue {
  type: 'console-log' | 'todo-fixme' | 'deprecated-pattern' | 'hardcoded-value' | 
        'large-function' | 'duplicate-code' | 'missing-error-handling' | 
        'unused-import' | 'security-issue' | 'performance-issue';
  severity: 'low' | 'medium' | 'high' | 'critical';
  file: string;
  line: number;
  description: string;
  suggestion: string;
  code?: string;
}

export interface TechnicalDebtReport {
  timestamp: string;
  totalIssues: number;
  issuesByType: Record<string, number>;
  issuesBySeverity: Record<string, number>;
  issues: TechnicalDebtIssue[];
  recommendations: string[];
  estimatedEffort: string;
}

class TechnicalDebtAnalyzer {
  private issues: TechnicalDebtIssue[] = [];
  private srcPath: string;

  constructor(srcPath: string = 'src') {
    this.srcPath = srcPath;
  }

  async analyze(): Promise<TechnicalDebtReport> {
    console.log('🔍 Starting technical debt analysis...');
    
    this.issues = [];
    
    // Analyze different types of technical debt
    await this.analyzeConsoleStatements();
    await this.analyzeTodoFixmeComments();
    await this.analyzeDeprecatedPatterns();
    await this.analyzeHardcodedValues();
    await this.analyzeLargeFunctions();
    await this.analyzeDuplicateCode();
    await this.analyzeErrorHandling();
    await this.analyzeUnusedImports();
    await this.analyzeSecurityIssues();
    await this.analyzePerformanceIssues();

    return this.generateReport();
  }

  private async analyzeConsoleStatements(): Promise<void> {
    console.log('  📝 Analyzing console statements...');
    
    const files = this.getSourceFiles();
    
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      const lines = content.split('\n');
      
      lines.forEach((line, index) => {
        // Skip development utilities and test files
        if (file.includes('development/') || file.includes('.test.') || file.includes('logger.ts')) {
          return;
        }
        
        const consoleMatch = line.match(/console\.(log|warn|error|info|debug)\s*\(/);
        if (consoleMatch) {
          this.issues.push({
            type: 'console-log',
            severity: 'medium',
            file: this.getRelativePath(file),
            line: index + 1,
            description: `Console statement found: ${consoleMatch[0]}`,
            suggestion: 'Replace with proper logging using the logger utility',
            code: line.trim()
          });
        }
      });
    }
  }

  private async analyzeTodoFixmeComments(): Promise<void> {
    console.log('  📋 Analyzing TODO/FIXME comments...');
    
    const files = this.getSourceFiles();
    
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      const lines = content.split('\n');
      
      lines.forEach((line, index) => {
        const todoMatch = line.match(/(TODO|FIXME|HACK|XXX)[\s:]/i);
        if (todoMatch) {
          const severity = todoMatch[1].toLowerCase() === 'fixme' ? 'high' : 
                          todoMatch[1].toLowerCase() === 'hack' ? 'medium' : 'low';
          
          this.issues.push({
            type: 'todo-fixme',
            severity: severity as 'low' | 'medium' | 'high',
            file: this.getRelativePath(file),
            line: index + 1,
            description: `${todoMatch[1]} comment found`,
            suggestion: 'Address the TODO/FIXME comment or create a proper issue',
            code: line.trim()
          });
        }
      });
    }
  }

  private async analyzeDeprecatedPatterns(): Promise<void> {
    console.log('  🚫 Analyzing deprecated patterns...');
    
    const files = this.getSourceFiles();
    const deprecatedPatterns = [
      { pattern: /componentDidMount|componentWillUnmount|componentDidUpdate/, description: 'Legacy React lifecycle methods' },
      { pattern: /React\.createClass/, description: 'Deprecated React.createClass' },
      { pattern: /findDOMNode/, description: 'Deprecated findDOMNode' },
      { pattern: /String\.prototype\.substr/, description: 'Deprecated substr method' },
      { pattern: /new Date\(\)\.getYear\(\)/, description: 'Deprecated getYear method' }
    ];
    
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      const lines = content.split('\n');
      
      lines.forEach((line, index) => {
        deprecatedPatterns.forEach(({ pattern, description }) => {
          if (pattern.test(line)) {
            this.issues.push({
              type: 'deprecated-pattern',
              severity: 'high',
              file: this.getRelativePath(file),
              line: index + 1,
              description: `Deprecated pattern: ${description}`,
              suggestion: 'Update to use modern React patterns or current API',
              code: line.trim()
            });
          }
        });
      });
    }
  }

  private async analyzeHardcodedValues(): Promise<void> {
    console.log('  🔢 Analyzing hardcoded values...');
    
    const files = this.getSourceFiles();
    
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      const lines = content.split('\n');
      
      lines.forEach((line, index) => {
        // Skip config files and constants
        if (file.includes('config/') || file.includes('constants/')) {
          return;
        }
        
        // Look for hardcoded URLs, magic numbers, etc.
        const hardcodedPatterns = [
          { pattern: /https?:\/\/[^\s'"]+/, description: 'Hardcoded URL' },
          { pattern: /setTimeout\([^,]+,\s*\d{4,}/, description: 'Hardcoded timeout value' },
          { pattern: /\.slice\(0,\s*\d{2,}\)/, description: 'Hardcoded slice limit' },
          { pattern: /maxLength:\s*\d{3,}/, description: 'Hardcoded max length' }
        ];
        
        hardcodedPatterns.forEach(({ pattern, description }) => {
          if (pattern.test(line)) {
            this.issues.push({
              type: 'hardcoded-value',
              severity: 'medium',
              file: this.getRelativePath(file),
              line: index + 1,
              description: `Hardcoded value: ${description}`,
              suggestion: 'Move to configuration file or constants',
              code: line.trim()
            });
          }
        });
      });
    }
  }

  private async analyzeLargeFunctions(): Promise<void> {
    console.log('  📏 Analyzing large functions...');
    
    const files = this.getSourceFiles();
    
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      const lines = content.split('\n');
      
      let currentFunction = '';
      let functionStartLine = 0;
      let braceCount = 0;
      let inFunction = false;
      
      lines.forEach((line, index) => {
        const functionMatch = line.match(/(function\s+\w+|const\s+\w+\s*=.*=>|\w+\s*\([^)]*\)\s*{)/);
        
        if (functionMatch && !inFunction) {
          currentFunction = functionMatch[0];
          functionStartLine = index + 1;
          inFunction = true;
          braceCount = (line.match(/{/g) || []).length - (line.match(/}/g) || []).length;
        } else if (inFunction) {
          braceCount += (line.match(/{/g) || []).length - (line.match(/}/g) || []).length;
          
          if (braceCount <= 0) {
            const functionLength = index - functionStartLine + 1;
            
            if (functionLength > 100) {
              this.issues.push({
                type: 'large-function',
                severity: functionLength > 200 ? 'high' : 'medium',
                file: this.getRelativePath(file),
                line: functionStartLine,
                description: `Large function (${functionLength} lines)`,
                suggestion: 'Break down into smaller, more focused functions',
                code: currentFunction
              });
            }
            
            inFunction = false;
            currentFunction = '';
            functionStartLine = 0;
            braceCount = 0;
          }
        }
      });
    }
  }

  private async analyzeDuplicateCode(): Promise<void> {
    console.log('  🔄 Analyzing duplicate code...');
    
    // This is a simplified duplicate detection
    // In a real implementation, you might use AST parsing
    const files = this.getSourceFiles();
    const codeBlocks = new Map<string, { file: string; line: number }[]>();
    
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      const lines = content.split('\n');
      
      // Look for blocks of 5+ similar lines
      for (let i = 0; i < lines.length - 4; i++) {
        const block = lines.slice(i, i + 5).join('\n').trim();
        
        if (block.length > 100 && !block.includes('//') && !block.includes('*')) {
          const normalizedBlock = block.replace(/\s+/g, ' ');
          
          if (!codeBlocks.has(normalizedBlock)) {
            codeBlocks.set(normalizedBlock, []);
          }
          
          codeBlocks.get(normalizedBlock)!.push({
            file: this.getRelativePath(file),
            line: i + 1
          });
        }
      }
    }
    
    // Report duplicates
    codeBlocks.forEach((locations, block) => {
      if (locations.length > 1) {
        locations.forEach(location => {
          this.issues.push({
            type: 'duplicate-code',
            severity: 'medium',
            file: location.file,
            line: location.line,
            description: `Duplicate code block found (${locations.length} instances)`,
            suggestion: 'Extract into a reusable function or component',
            code: block.substring(0, 100) + '...'
          });
        });
      }
    });
  }

  private async analyzeErrorHandling(): Promise<void> {
    console.log('  ⚠️ Analyzing error handling...');
    
    const files = this.getSourceFiles();
    
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      const lines = content.split('\n');
      
      lines.forEach((line, index) => {
        // Look for async functions without try-catch
        if (line.includes('async ') && !content.includes('try {')) {
          this.issues.push({
            type: 'missing-error-handling',
            severity: 'high',
            file: this.getRelativePath(file),
            line: index + 1,
            description: 'Async function without error handling',
            suggestion: 'Add try-catch block or error boundary',
            code: line.trim()
          });
        }
        
        // Look for fetch without error handling
        if (line.includes('fetch(') && !content.includes('.catch(')) {
          this.issues.push({
            type: 'missing-error-handling',
            severity: 'medium',
            file: this.getRelativePath(file),
            line: index + 1,
            description: 'Fetch call without error handling',
            suggestion: 'Add .catch() or try-catch block',
            code: line.trim()
          });
        }
      });
    }
  }

  private async analyzeUnusedImports(): Promise<void> {
    console.log('  📦 Analyzing unused imports...');
    
    try {
      // Use ESLint to find unused imports
      const result = execSync('npx eslint src --format json --rule "no-unused-vars: error"', 
        { encoding: 'utf-8', stdio: 'pipe' });
      
      const eslintResults = JSON.parse(result);
      
      eslintResults.forEach((fileResult: any) => {
        fileResult.messages.forEach((message: any) => {
          if (message.ruleId === 'no-unused-vars') {
            this.issues.push({
              type: 'unused-import',
              severity: 'low',
              file: this.getRelativePath(fileResult.filePath),
              line: message.line,
              description: `Unused variable: ${message.message}`,
              suggestion: 'Remove unused import or variable',
              code: ''
            });
          }
        });
      });
    } catch (error) {
      console.log('    ⚠️ Could not run ESLint analysis');
    }
  }

  private async analyzeSecurityIssues(): Promise<void> {
    console.log('  🔒 Analyzing security issues...');
    
    const files = this.getSourceFiles();
    const securityPatterns = [
      { pattern: /innerHTML\s*=/, description: 'Potential XSS vulnerability with innerHTML' },
      { pattern: /eval\s*\(/, description: 'Use of eval() function' },
      { pattern: /document\.write\s*\(/, description: 'Use of document.write()' },
      { pattern: /localStorage\.setItem.*password|sessionStorage\.setItem.*password/i, description: 'Storing password in local storage' }
    ];
    
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      const lines = content.split('\n');
      
      lines.forEach((line, index) => {
        securityPatterns.forEach(({ pattern, description }) => {
          if (pattern.test(line)) {
            this.issues.push({
              type: 'security-issue',
              severity: 'critical',
              file: this.getRelativePath(file),
              line: index + 1,
              description: `Security issue: ${description}`,
              suggestion: 'Use secure alternatives and validate input',
              code: line.trim()
            });
          }
        });
      });
    }
  }

  private async analyzePerformanceIssues(): Promise<void> {
    console.log('  ⚡ Analyzing performance issues...');
    
    const files = this.getSourceFiles();
    const performancePatterns = [
      { pattern: /useEffect\(\(\) => \{[^}]*\}, \[\]\)/, description: 'Empty dependency array in useEffect' },
      { pattern: /\.map\([^)]*\)\.filter\([^)]*\)/, description: 'Chained map and filter operations' },
      { pattern: /new Date\(\).*new Date\(\)/, description: 'Multiple Date object creation' }
    ];
    
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      const lines = content.split('\n');
      
      lines.forEach((line, index) => {
        performancePatterns.forEach(({ pattern, description }) => {
          if (pattern.test(line)) {
            this.issues.push({
              type: 'performance-issue',
              severity: 'medium',
              file: this.getRelativePath(file),
              line: index + 1,
              description: `Performance issue: ${description}`,
              suggestion: 'Optimize for better performance',
              code: line.trim()
            });
          }
        });
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
    
    walkDir(this.srcPath);
    return files;
  }

  private getRelativePath(filePath: string): string {
    return path.relative(process.cwd(), filePath);
  }

  private generateReport(): TechnicalDebtReport {
    const issuesByType: Record<string, number> = {};
    const issuesBySeverity: Record<string, number> = {};
    
    this.issues.forEach(issue => {
      issuesByType[issue.type] = (issuesByType[issue.type] || 0) + 1;
      issuesBySeverity[issue.severity] = (issuesBySeverity[issue.severity] || 0) + 1;
    });
    
    const recommendations = this.generateRecommendations();
    const estimatedEffort = this.estimateEffort();
    
    return {
      timestamp: new Date().toISOString(),
      totalIssues: this.issues.length,
      issuesByType,
      issuesBySeverity,
      issues: this.issues,
      recommendations,
      estimatedEffort
    };
  }

  private generateRecommendations(): string[] {
    const recommendations = [
      'Replace console.log statements with proper logging infrastructure',
      'Address TODO/FIXME comments or convert them to proper issues',
      'Update deprecated React patterns to modern hooks',
      'Move hardcoded values to configuration files',
      'Break down large functions into smaller, focused units',
      'Extract duplicate code into reusable utilities',
      'Add proper error handling to async operations',
      'Remove unused imports and variables',
      'Address security vulnerabilities immediately',
      'Optimize performance bottlenecks'
    ];
    
    return recommendations;
  }

  private estimateEffort(): string {
    const criticalCount = this.issues.filter(i => i.severity === 'critical').length;
    const highCount = this.issues.filter(i => i.severity === 'high').length;
    const mediumCount = this.issues.filter(i => i.severity === 'medium').length;
    const lowCount = this.issues.filter(i => i.severity === 'low').length;
    
    const totalHours = (criticalCount * 4) + (highCount * 2) + (mediumCount * 1) + (lowCount * 0.5);
    
    if (totalHours < 8) return 'Less than 1 day';
    if (totalHours < 40) return `${Math.ceil(totalHours / 8)} days`;
    return `${Math.ceil(totalHours / 40)} weeks`;
  }
}

// CLI execution
async function runAnalysis() {
  const analyzer = new TechnicalDebtAnalyzer();

  try {
    const report = await analyzer.analyze();
    console.log('\n📊 Technical Debt Analysis Report');
    console.log('================================');
    console.log(`Total Issues: ${report.totalIssues}`);
    console.log(`Estimated Effort: ${report.estimatedEffort}`);
    console.log('\nIssues by Severity:');
    Object.entries(report.issuesBySeverity).forEach(([severity, count]) => {
      console.log(`  ${severity}: ${count}`);
    });

    // Save detailed report
    const reportPath = 'technical-debt-report.json';
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\nDetailed report saved to: ${reportPath}`);
  } catch (error) {
    console.error('Analysis failed:', error);
    process.exit(1);
  }
}

// Run if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  runAnalysis();
}

export { TechnicalDebtAnalyzer };
