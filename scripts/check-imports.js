#!/usr/bin/env node

/**
 * Script to check for common import/export issues
 * Run with: node scripts/check-imports.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SRC_DIR = path.join(__dirname, '../src');
const ISSUES = [];

/**
 * Check for common import/export issues
 */
function checkFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const relativePath = path.relative(process.cwd(), filePath);
  
  // Check for mixed import styles
  const namedImports = content.match(/import\s*\{[^}]+\}\s*from/g) || [];
  const defaultImports = content.match(/import\s+\w+\s+from/g) || [];
  
  // Check for console.log in production code (not test files)
  if (!filePath.includes('.test.') && !filePath.includes('debug') && !filePath.includes('scripts')) {
    const consoleMatches = content.match(/console\.log\(/g) || [];
    if (consoleMatches.length > 0) {
      ISSUES.push({
        file: relativePath,
        type: 'console.log',
        message: `Found ${consoleMatches.length} console.log statements`,
        severity: 'warning'
      });
    }
  }
  
  // Check for empty src attributes (but ignore intentional cancellation)
  const emptySrcMatches = content.match(/src\s*=\s*['"]\s*['"]/g) || [];
  if (emptySrcMatches.length > 0 && !content.includes('Cancel the request')) {
    ISSUES.push({
      file: relativePath,
      type: 'empty-src',
      message: 'Found empty src attributes',
      severity: 'error'
    });
  }
  
  // Check for incorrect fetchPriority casing in DOM attributes
  const fetchPriorityMatches = content.match(/fetchPriority\s*=/g) || [];
  if (fetchPriorityMatches.length > 0 && content.includes('<img')) {
    ISSUES.push({
      file: relativePath,
      type: 'dom-property',
      message: 'Found fetchPriority in DOM element (should be fetchpriority)',
      severity: 'error'
    });
  }
  
  // Check for process.env in client code
  if (!filePath.includes('node_modules') && !filePath.includes('.config.')) {
    const processEnvMatches = content.match(/process\.env\./g) || [];
    if (processEnvMatches.length > 0) {
      ISSUES.push({
        file: relativePath,
        type: 'process-env',
        message: 'Found process.env usage (use import.meta.env in Vite)',
        severity: 'warning'
      });
    }
  }
}

/**
 * Recursively scan directory
 */
function scanDirectory(dir) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      scanDirectory(filePath);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      checkFile(filePath);
    }
  }
}

/**
 * Main execution
 */
function main() {
  console.log('🔍 Checking for common import/export and code quality issues...\n');
  
  scanDirectory(SRC_DIR);
  
  if (ISSUES.length === 0) {
    console.log('✅ No issues found!');
    return;
  }
  
  // Group issues by type
  const groupedIssues = ISSUES.reduce((acc, issue) => {
    if (!acc[issue.type]) acc[issue.type] = [];
    acc[issue.type].push(issue);
    return acc;
  }, {});
  
  // Display results
  Object.entries(groupedIssues).forEach(([type, issues]) => {
    const severity = issues[0].severity;
    const icon = severity === 'error' ? '❌' : '⚠️';
    
    console.log(`${icon} ${type.toUpperCase()} (${issues.length} files):`);
    issues.forEach(issue => {
      console.log(`  ${issue.file}: ${issue.message}`);
    });
    console.log();
  });
  
  const errorCount = ISSUES.filter(i => i.severity === 'error').length;
  const warningCount = ISSUES.filter(i => i.severity === 'warning').length;
  
  console.log(`Summary: ${errorCount} errors, ${warningCount} warnings`);
  
  if (errorCount > 0) {
    process.exit(1);
  }
}

main();
