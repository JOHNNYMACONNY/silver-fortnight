#!/usr/bin/env node

/**
 * Script to check for solid background colors in Button components
 * 
 * Usage: node scripts/check-button-backgrounds.js
 * 
 * This script scans the codebase for Button components that might use
 * solid background colors, which violates our design system guidelines.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SOLID_BG_PATTERN = /bg-(primary|secondary|destructive|success|warning|danger|accent|error|info)-\d+(?![/\d])/g;
const BUTTON_PATTERNS = [
  /<Button[^>]*>/g,
  /Button\s*\(/g,
  /variant=["'](default|primary|destructive|secondary|success|warning|danger|accent)["']/g,
];

function findFiles(dir, extensions = ['.tsx', '.ts', '.jsx', '.js']) {
  const files = [];
  
  function walk(currentPath) {
    const entries = fs.readdirSync(currentPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);
      
      // Skip node_modules, .git, dist, build, etc.
      if (entry.isDirectory()) {
        if (!['node_modules', '.git', 'dist', 'build', '.next', 'coverage'].includes(entry.name)) {
          walk(fullPath);
        }
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name);
        if (extensions.includes(ext)) {
          files.push(fullPath);
        }
      }
    }
  }
  
  walk(dir);
  return files;
}

function checkFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const issues = [];
  
  // Check for solid backgrounds in Button-related code
  const lines = content.split('\n');
  lines.forEach((line, index) => {
    // Skip if it's in Button.tsx (we control that file)
    if (filePath.includes('Button.tsx') && !filePath.includes('ButtonShadcnTest')) {
      return;
    }
    
    // Check for Button components specifically (not Badge, Card, etc.)
    const hasButton = /<Button[^>]*>/.test(line) || /Button\s*\(/.test(line);
    
    if (hasButton) {
      const solidBgMatches = line.match(SOLID_BG_PATTERN);
      if (solidBgMatches) {
        // Only flag if it's actually a Button component, not a Badge or other component
        const isButtonComponent = line.includes('<Button') || 
                                  (line.includes('Button') && line.includes('variant='));
        
        if (isButtonComponent) {
          issues.push({
            file: filePath,
            line: index + 1,
            content: line.trim(),
            matches: solidBgMatches,
          });
        }
      }
    }
  });
  
  return issues;
}

function main() {
  console.log('🔍 Checking for solid background colors in Button components...\n');
  
  const srcDir = path.join(__dirname, '..', 'src');
  const files = findFiles(srcDir);
  
  let totalIssues = 0;
  const allIssues = [];
  
  files.forEach(file => {
    const issues = checkFile(file);
    if (issues.length > 0) {
      allIssues.push(...issues);
      totalIssues += issues.length;
    }
  });
  
  if (totalIssues === 0) {
    console.log('✅ No solid background colors found in Button components!\n');
    process.exit(0);
  } else {
    console.log(`⚠️  Found ${totalIssues} potential issue(s):\n`);
    
    allIssues.forEach(issue => {
      console.log(`📄 ${path.relative(process.cwd(), issue.file)}:${issue.line}`);
      console.log(`   ${issue.content}`);
      console.log(`   ❌ Solid background detected: ${issue.matches.join(', ')}`);
      console.log(`   💡 Use transparent background instead (e.g., bg-primary/10 with border-2 border-primary/30)\n`);
    });
    
    console.log('\n📚 See docs/design/BUTTON_STYLE_GUIDELINES.md for guidelines.');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { checkFile, findFiles };

