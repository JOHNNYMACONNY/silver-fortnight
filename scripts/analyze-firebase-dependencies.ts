import fs from 'fs';
import path from 'path';

// Types and interfaces
export interface DependencyAnalysis {
  file: string;
  firestoreImports: string[];
  serviceImports: string[];
  affectedCollections: string[];
  operationPatterns: string[];
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  details: string;
}

export interface AnalysisConfig {
  targetDirectory: string;
  includePatterns: RegExp[];
  excludePatterns?: RegExp[];
  riskAssessment: {
    criticalCollections: string[];
    highRiskCollections: string[];
    serviceFilePatterns: RegExp[];
  };
}

export interface SummaryStats {
  totalFiles: number;
  riskDistribution: Record<string, number>;
  collectionsFound: string[];
  recommendedMigrationOrder: string[];
}

// Default configuration
const DEFAULT_CONFIG: AnalysisConfig = {
  targetDirectory: './src',
  includePatterns: [/\.(ts|tsx)$/],
  excludePatterns: [/\.test\.|\.spec\.|node_modules|\.git/],
  riskAssessment: {
    criticalCollections: ['trades', 'transactions', 'payments'],
    highRiskCollections: ['users', 'conversations', 'messages', 'notifications'],
    serviceFilePatterns: [/services\//, /firestore/, /firebase/]
  }
};

// Collection name patterns to detect
const COLLECTION_PATTERNS = [
  // Standard collection references
  /collection\(db,\s*['"`]([^'"`]+)['"`]/g,
  /doc\(db,\s*['"`]([^'"`]+)['"`]/g,
  
  // Template literal patterns
  /collection\(db,\s*`([^`]+)`/g,
  /doc\(db,\s*`([^`]+)`/g,
  
  // Variable-based collections
  /collection\(db,\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\)/g,
  
  // COLLECTIONS constant usage
  /COLLECTIONS\.([A-Z_]+)/g,
  
  // String literal collections in objects
  /['"`]([a-z_]+)['"`]\s*:\s*['"`]([a-z_]+)['"`]/g
];

// Firestore operation patterns
const OPERATION_PATTERNS = {
  read: [/getDoc\s*\(/, /getDocs\s*\(/, /onSnapshot\s*\(/],
  write: [/setDoc\s*\(/, /addDoc\s*\(/, /updateDoc\s*\(/],
  delete: [/deleteDoc\s*\(/],
  batch: [/writeBatch\s*\(/, /batch\.(set|update|delete)/],
  query: [/query\s*\(/, /where\s*\(/, /orderBy\s*\(/, /limit\s*\(/]
};

/**
 * Main analysis function - scans codebase for Firebase dependencies
 */
export async function analyzeDependencies(config: AnalysisConfig = DEFAULT_CONFIG): Promise<DependencyAnalysis[]> {
  // Validate configuration
  validateConfig(config);
  
  const results: DependencyAnalysis[] = [];
  
  try {
    // Scan all files matching the patterns
    const files = await scanFiles(config.targetDirectory, config.includePatterns[0]);
    
    console.log(`📁 Scanning ${files.length} files for Firebase dependencies...`);
    
    for (const file of files) {
      // Skip excluded files
      if (config.excludePatterns?.some(pattern => pattern.test(file))) {
        continue;
      }
      
      try {
        const content = fs.readFileSync(file, 'utf8');
        const analysis = analyzeFile(file, content, config);
        
        // Only include files with dependencies
        if (analysis.firestoreImports.length > 0 || 
            analysis.serviceImports.length > 0 || 
            analysis.affectedCollections.length > 0) {
          results.push(analysis);
        }
      } catch (error) {
        console.warn(`⚠️  Warning: Could not analyze file ${file}: ${error}`);
      }
    }
    
    // Sort by risk level (CRITICAL first)
    return results.sort((a, b) => getRiskScore(b.riskLevel) - getRiskScore(a.riskLevel));
    
  } catch (error) {
    throw new Error(`Failed to analyze dependencies: ${error}`);
  }
}

/**
 * Analyze a single file for Firebase dependencies
 */
export function analyzeFile(filePath: string, content: string, config: AnalysisConfig = DEFAULT_CONFIG): DependencyAnalysis {
  const analysis: DependencyAnalysis = {
    file: filePath,
    firestoreImports: [],
    serviceImports: [],
    affectedCollections: [],
    operationPatterns: [],
    riskLevel: 'LOW',
    details: ''
  };
  
  try {
    // Analyze import patterns
    const importAnalysis = analyzeImportPatterns(content);
    analysis.firestoreImports = importAnalysis.firestoreImports;
    analysis.serviceImports = importAnalysis.serviceImports;
    
    // Collect affected collections
    analysis.affectedCollections = collectCollectionPatterns(content);
    
    // Identify operation patterns
    analysis.operationPatterns = identifyOperationPatterns(content);
    
    // Assess risk level
    analysis.riskLevel = assessRiskLevel(analysis, filePath, config);
    
    // Generate details
    analysis.details = generateFileDetails(analysis, filePath);
    
    return analysis;
    
  } catch (error) {
    // Return safe defaults on error
    console.warn(`Warning: Error analyzing ${filePath}: ${error}`);
    return analysis;
  }
}

/**
 * Scan directory for files matching pattern
 */
export async function scanFiles(dir: string, pattern: RegExp): Promise<string[]> {
  const files: string[] = [];
  
  function scanDirectory(currentDir: string): void {
    try {
      const entries = fs.readdirSync(currentDir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);
        
        if (entry.isDirectory()) {
          // Skip hidden directories and node_modules
          if (!entry.name.startsWith('.') && entry.name !== 'node_modules') {
            scanDirectory(fullPath);
          }
        } else if (entry.isFile() && pattern.test(entry.name)) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      console.warn(`Warning: Cannot scan directory ${currentDir}: ${error}`);
    }
  }
  
  scanDirectory(dir);
  return files;
}

/**
 * Analyze import patterns in file content
 */
export function analyzeImportPatterns(content: string): { firestoreImports: string[], serviceImports: string[] } {
  const firestoreImports: string[] = [];
  const serviceImports: string[] = [];
  
  // Match import statements
  const importRegex = /import\s+(?:{[^}]*}|\*\s+as\s+\w+|\w+)\s+from\s+['"`]([^'"`]+)['"`]/g;
  let match;
  
  while ((match = importRegex.exec(content)) !== null) {
    const importPath = match[1];
    
    if (importPath.includes('firebase/firestore') || importPath.includes('firebase-config')) {
      firestoreImports.push(importPath);
    } else if (importPath.includes('services/') && 
               (importPath.includes('firestore') || 
                importPath.includes('firebase') ||
                importPath.includes('collaborations') ||
                importPath.includes('gamification'))) {
      serviceImports.push(importPath);
    }
  }
  
  return { firestoreImports: [...new Set(firestoreImports)], serviceImports: [...new Set(serviceImports)] };
}

/**
 * Collect collection names from various patterns
 */
export function collectCollectionPatterns(content: string): string[] {
  const collections = new Set<string>();
  
  // Apply all collection detection patterns
  for (const pattern of COLLECTION_PATTERNS) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const collectionName = match[1];
      
      // Clean up collection names
      if (collectionName && typeof collectionName === 'string') {
        // Handle template literals and variables
        const cleanName = collectionName.replace(/\$\{[^}]+\}/g, '').replace(/\//g, '').trim();
        if (cleanName && !cleanName.includes('$') && cleanName.length < 50) {
          collections.add(cleanName);
        }
      }
    }
  }
  
  // Also check for COLLECTIONS constant values
  const collectionsConstMatch = content.match(/COLLECTIONS\s*=\s*{([^}]+)}/);
  if (collectionsConstMatch) {
    const constContent = collectionsConstMatch[1];
    const valueMatches = constContent.match(/['"`]([a-z_]+)['"`]/g);
    if (valueMatches) {
      valueMatches.forEach(match => {
        const name = match.replace(/['"`]/g, '');
        collections.add(name);
      });
    }
  }
  
  return Array.from(collections).filter(name => name.length > 0);
}

/**
 * Identify Firestore operation patterns
 */
function identifyOperationPatterns(content: string): string[] {
  const patterns: string[] = [];
  
  for (const [patternType, regexes] of Object.entries(OPERATION_PATTERNS)) {
    for (const regex of regexes) {
      if (regex.test(content)) {
        patterns.push(patternType);
        break; // Only add pattern type once
      }
    }
  }
  
  return patterns;
}

/**
 * Assess risk level based on analysis results
 */
function assessRiskLevel(analysis: DependencyAnalysis, filePath: string, config: AnalysisConfig): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
  // Check for critical collections
  const hasCriticalCollections = analysis.affectedCollections.some(col => 
    config.riskAssessment.criticalCollections.includes(col)
  );
  
  if (hasCriticalCollections) {
    return 'CRITICAL';
  }
  
  // Check if it's a core service file
  const isServiceFile = config.riskAssessment.serviceFilePatterns.some(pattern => 
    pattern.test(filePath)
  );
  
  if (isServiceFile && analysis.firestoreImports.length > 0) {
    return 'CRITICAL';
  }
  
  // Check for high-risk collections
  const hasHighRiskCollections = analysis.affectedCollections.some(col => 
    config.riskAssessment.highRiskCollections.includes(col)
  );
  
  if (hasHighRiskCollections) {
    return 'HIGH';
  }
  
  // Check for direct Firestore usage
  if (analysis.firestoreImports.length > 0 && analysis.affectedCollections.length > 0) {
    return 'HIGH';
  }
  
  // Check for service imports (indirect usage)
  if (analysis.serviceImports.length > 0 || analysis.firestoreImports.length > 0) {
    return 'MEDIUM';
  }
  
  return 'LOW';
}

/**
 * Generate detailed description for a file
 */
function generateFileDetails(analysis: DependencyAnalysis, filePath: string): string {
  const details: string[] = [];
  
  if (filePath.includes('services/')) {
    details.push('Core service file');
  }
  
  if (analysis.firestoreImports.length > 0) {
    details.push(`Direct Firestore usage (${analysis.firestoreImports.join(', ')})`);
  }
  
  if (analysis.serviceImports.length > 0) {
    details.push(`Imports Firestore services (${analysis.serviceImports.length} imports)`);
  }
  
  if (analysis.affectedCollections.length > 0) {
    details.push(`Accesses collections: ${analysis.affectedCollections.join(', ')}`);
  }
  
  if (analysis.operationPatterns.length > 0) {
    details.push(`Operations: ${analysis.operationPatterns.join(', ')}`);
  }
  
  return details.join(' | ') || 'No direct Firebase usage detected';
}

/**
 * Get numeric score for risk level (for sorting)
 */
export function getRiskScore(level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'): number {
  const scores = { LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 4 };
  return scores[level] || 0;
}

/**
 * Generate different report formats
 */
export function generateReport(results: DependencyAnalysis[], format: 'console' | 'json' | 'markdown'): string {
  switch (format) {
    case 'json':
      return generateJsonReport(results);
    case 'markdown':
      return generateMarkdownReport(results);
    case 'console':
    default:
      return generateConsoleReport(results);
  }
}

/**
 * Generate console-formatted report
 */
function generateConsoleReport(results: DependencyAnalysis[]): string {
  const lines: string[] = [];
  const stats = generateSummaryStats(results);
  
  lines.push('\n🔍 Firebase Dependency Analysis\n');
  lines.push(`📊 Summary: ${stats.totalFiles} files analyzed`);
  lines.push(`🎯 Collections found: ${stats.collectionsFound.join(', ')}`);
  lines.push(`\n📈 Risk Distribution:`);
  
  Object.entries(stats.riskDistribution).forEach(([level, count]) => {
    if (count > 0) {
      const emoji = { LOW: '🟢', MEDIUM: '🟡', HIGH: '🟠', CRITICAL: '🔴' }[level];
      lines.push(`   ${emoji} ${level}: ${count} files`);
    }
  });
  
  lines.push('\n📋 Detailed Analysis:\n');
  
  results.forEach(result => {
    const riskEmoji = {
      LOW: '🟢',
      MEDIUM: '🟡', 
      HIGH: '🟠',
      CRITICAL: '🔴'
    }[result.riskLevel];
    
    lines.push(`${riskEmoji} ${result.riskLevel} - ${result.file}`);
    
    if (result.affectedCollections.length > 0) {
      lines.push(`   Collections: ${result.affectedCollections.join(', ')}`);
    }
    
    if (result.operationPatterns.length > 0) {
      lines.push(`   Operations: ${result.operationPatterns.join(', ')}`);
    }
    
    lines.push(`   Details: ${result.details}\n`);
  });
  
  // Add migration recommendations
  lines.push('\n🚀 Migration Recommendations:\n');
  lines.push('1. Start with CRITICAL files (core services)');
  lines.push('2. Then HIGH risk files (direct collection usage)');
  lines.push('3. Update MEDIUM risk files (service imports)');
  lines.push('4. Finally address LOW risk files');
  
  return lines.join('\n');
}

/**
 * Generate JSON report
 */
function generateJsonReport(results: DependencyAnalysis[]): string {
  const stats = generateSummaryStats(results);
  
  return JSON.stringify({
    timestamp: new Date().toISOString(),
    summary: stats,
    results: results,
    recommendations: {
      migrationOrder: stats.recommendedMigrationOrder,
      criticalFiles: results.filter(r => r.riskLevel === 'CRITICAL').map(r => r.file),
      affectedCollections: stats.collectionsFound
    }
  }, null, 2);
}

/**
 * Generate Markdown report
 */
function generateMarkdownReport(results: DependencyAnalysis[]): string {
  const stats = generateSummaryStats(results);
  const lines: string[] = [];
  
  lines.push('# Firebase Dependency Analysis Report');
  lines.push(`\n*Generated: ${new Date().toISOString()}*\n`);
  
  lines.push('## Summary\n');
  lines.push(`- **Total Files Analyzed:** ${stats.totalFiles}`);
  lines.push(`- **Collections Found:** ${stats.collectionsFound.join(', ')}`);
  lines.push(`- **Risk Distribution:**`);
  
  Object.entries(stats.riskDistribution).forEach(([level, count]) => {
    if (count > 0) {
      const emoji = { LOW: '🟢', MEDIUM: '🟡', HIGH: '🟠', CRITICAL: '🔴' }[level];
      lines.push(`  - ${emoji} **${level}:** ${count} files`);
    }
  });
  
  lines.push('\n## Files by Risk Level\n');
  
  ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].forEach(level => {
    const filesAtLevel = results.filter(r => r.riskLevel === level);
    if (filesAtLevel.length > 0) {
      const emoji = { LOW: '🟢', MEDIUM: '🟡', HIGH: '🟠', CRITICAL: '🔴' }[level];
      lines.push(`### ${emoji} ${level} Risk\n`);
      
      filesAtLevel.forEach(file => {
        lines.push(`- **File:** \`${file.file}\``);
        if (file.affectedCollections.length > 0) {
          lines.push(`  - **Collections:** ${file.affectedCollections.join(', ')}`);
        }
        if (file.operationPatterns.length > 0) {
          lines.push(`  - **Operations:** ${file.operationPatterns.join(', ')}`);
        }
        lines.push(`  - **Details:** ${file.details}\n`);
      });
    }
  });
  
  lines.push('## Migration Recommendations\n');
  lines.push('1. **Start with CRITICAL files** - These are core services that require immediate attention');
  lines.push('2. **Address HIGH risk files** - Files with direct Firestore collection usage');
  lines.push('3. **Update MEDIUM risk files** - Files that import Firestore services');
  lines.push('4. **Finally handle LOW risk files** - Files with minimal Firebase dependencies');
  
  return lines.join('\n');
}

/**
 * Generate summary statistics
 */
export function generateSummaryStats(results: DependencyAnalysis[]): SummaryStats {
  const riskDistribution: Record<string, number> = {
    LOW: 0,
    MEDIUM: 0,
    HIGH: 0,
    CRITICAL: 0
  };
  
  const allCollections = new Set<string>();
  
  results.forEach(result => {
    riskDistribution[result.riskLevel]++;
    result.affectedCollections.forEach(col => allCollections.add(col));
  });
  
  const collectionsFound = Array.from(allCollections);
  
  // Generate recommended migration order
  const recommendedMigrationOrder = [
    ...results.filter(r => r.riskLevel === 'CRITICAL').map(r => r.file),
    ...results.filter(r => r.riskLevel === 'HIGH').map(r => r.file),
    ...results.filter(r => r.riskLevel === 'MEDIUM').map(r => r.file),
    ...results.filter(r => r.riskLevel === 'LOW').map(r => r.file)
  ];
  
  return {
    totalFiles: results.length,
    riskDistribution,
    collectionsFound,
    recommendedMigrationOrder
  };
}

/**
 * Validate configuration
 */
function validateConfig(config: AnalysisConfig): void {
  if (!config.targetDirectory || config.targetDirectory.trim() === '') {
    throw new Error('Target directory cannot be empty');
  }
  
  if (!config.includePatterns || config.includePatterns.length === 0) {
    throw new Error('Include patterns cannot be empty');
  }
  
  if (!config.riskAssessment) {
    throw new Error('Risk assessment configuration is required');
  }
}

/**
 * CLI interface
 */
function parseCliArgs(): { 
  directory?: string; 
  format?: 'console' | 'json' | 'markdown';
  output?: string;
} {
  const args = process.argv.slice(2);
  const options: any = {};
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--dir' || arg === '-d') {
      options.directory = args[++i];
    } else if (arg === '--format' || arg === '-f') {
      options.format = args[++i];
    } else if (arg === '--output' || arg === '-o') {
      options.output = args[++i];
    }
  }
  
  return options;
}

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
  (async () => {
    try {
      const options = parseCliArgs();
      
      const config: AnalysisConfig = {
        ...DEFAULT_CONFIG,
        targetDirectory: options.directory || DEFAULT_CONFIG.targetDirectory
      };
      
      console.log('🚀 Starting Firebase dependency analysis...');
      
      const results = await analyzeDependencies(config);
      const format = options.format || 'console';
      const report = generateReport(results, format);
      
      if (options.output) {
        fs.writeFileSync(options.output, report);
        console.log(`📄 Report saved to: ${options.output}`);
      } else {
        console.log(report);
      }
      
      // Exit with appropriate code
      const criticalCount = results.filter(r => r.riskLevel === 'CRITICAL').length;
      process.exit(criticalCount > 0 ? 1 : 0);
      
    } catch (error) {
      console.error('❌ Error during dependency analysis:', error);
      process.exit(1);
    }
  })();
}
