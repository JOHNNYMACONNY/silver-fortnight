#!/usr/bin/env node

import * as fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  reset: '\x1b[0m'
};

const issues = [];
const warnings = [];

async function getAllFiles(dir, fileList = []) {
  const files = await fs.readdir(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stats = await fs.stat(filePath);
    
    if (stats.isDirectory() && !file.startsWith('node_modules') && !file.startsWith('.')) {
      await getAllFiles(filePath, fileList);
    } else if (stats.isFile() && (file.endsWith('.js') || file.endsWith('.jsx') || file.endsWith('.ts') || file.endsWith('.tsx'))) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

async function verifyImports(filePath) {
  const content = await fs.readFile(filePath, 'utf8');
  const lines = content.split('\n');
  
  const importRegex = /from ['"]([^'"]+)['"]/g;
  const fileDir = path.dirname(filePath);
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    let match;
    
    while ((match = importRegex.exec(line)) !== null) {
      const importPath = match[1];
      if (importPath.startsWith('.')) {
        // Resolve the full path
        const fullPath = path.resolve(fileDir, importPath);
        const possibleExtensions = ['.js', '.jsx', '.ts', '.tsx', '/index.js', '/index.jsx', '/index.ts', '/index.tsx'];
        
        let found = false;
        for (const ext of possibleExtensions) {
          const testPath = fullPath + ext;
          try {
            await fs.access(testPath);
            // Check case sensitivity
            const actualPath = (await fs.readdir(path.dirname(testPath)))
                               .find(f => f.toLowerCase() === path.basename(testPath).toLowerCase());
            if (actualPath && actualPath !== path.basename(testPath)) {
              issues.push({
                file: filePath,
                line: i + 1,
                message: `Case mismatch: "${path.basename(testPath)}" should be "${actualPath}"`
              });
            }
            found = true;
            break;
          } catch {
            // File doesn't exist with this extension, continue checking others
            continue;
          }
        }
        
        if (!found) {
          warnings.push({
            file: filePath,
            line: i + 1,
            message: `Import not found: ${importPath}`
          });
        }
      }
    }
  }
}

async function verifyEnvironmentVariables() {
  // Check for .env.development variables
  const envContent = await fs.readFile('.env.development', 'utf8').catch(() => '');
  const envVars = new Set(envContent.split('\n')
    .map(line => line.split('=')[0])
    .filter(Boolean));

  // Get environment variables used in the code
  const files = await getAllFiles('src');
  for (const file of files) {
    const content = await fs.readFile(file, 'utf8');
    const envUsageRegex = /process\.env\.(\w+)/g;
    let match;
    
    while ((match = envUsageRegex.exec(content)) !== null) {
      const envVar = match[1];
      if (!envVars.has(envVar)) {
        warnings.push({
          file: file,
          message: `Environment variable "${envVar}" is used but not defined in .env.development`
        });
      }
    }
  }
}

async function main() {
  console.log('🔍 Verifying deployment configuration...\n');

  // Check Node.js version
  const requiredNode = '18.17.0';
  const currentNode = process.version;
  if (currentNode.localeCompare(requiredNode, undefined, { numeric: true }) < 0) {
    issues.push({
      message: `Node.js version mismatch: required ${requiredNode}, current ${currentNode}`
    });
  }

  // Check case sensitivity in imports
  const files = await getAllFiles('src');
  for (const file of files) {
    await verifyImports(file);
  }

  // Check environment variables
  await verifyEnvironmentVariables();

  // Display results
  if (issues.length > 0) {
    console.log(`${colors.red}❌ Found ${issues.length} issues that will cause deployment failures:${colors.reset}\n`);
    issues.forEach(issue => {
      if (issue.file) {
        console.log(`${colors.red}• ${issue.file}${issue.line ? `:${issue.line}` : ''}${colors.reset}`);
      }
      console.log(`  ${issue.message}\n`);
    });
  }

  if (warnings.length > 0) {
    console.log(`${colors.yellow}⚠️  Found ${warnings.length} potential warnings:${colors.reset}\n`);
    warnings.forEach(warning => {
      if (warning.file) {
        console.log(`${colors.yellow}• ${warning.file}${warning.line ? `:${warning.line}` : ''}${colors.reset}`);
      }
      console.log(`  ${warning.message}\n`);
    });
  }

  if (issues.length === 0 && warnings.length === 0) {
    console.log(`${colors.green}✅ No deployment issues found${colors.reset}\n`);
  }

  // Exit with error if issues were found
  process.exit(issues.length > 0 ? 1 : 0);
}

main().catch(error => {
  console.error('Error running verification:', error);
  process.exit(1);
});
