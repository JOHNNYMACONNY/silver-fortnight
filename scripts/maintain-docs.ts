#!/usr/bin/env tsx
/**
 * TradeYa Documentation Maintenance Automation System
 * 
 * This script provides intelligent documentation lifecycle management with:
 * - Automated archival of outdated documents
 * - Firestore migration documentation prioritization
 * - Metadata preservation and cross-reference validation
 * - Document age analysis and relevance scoring
 * - Intelligent flagging of potentially disruptive documents
 * 
 * Usage:
 *   npx tsx scripts/maintain-docs.ts [command] [options]
 * 
 * Commands:
 *   analyze     - Analyze documentation health and identify issues
 *   archive     - Archive outdated documents with metadata preservation
 *   validate    - Validate cross-references and consistency
 *   priority    - Check Firestore documentation priority status
 *   health      - Generate documentation health dashboard
 * 
 * @author TradeYa Documentation Agent
 * @version 1.0.0
 * @created 2025-06-09
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { createHash } from 'crypto';
import { glob } from 'glob';

// Types and Interfaces
interface DocumentMetadata {
  filePath: string;
  fileName: string;
  size: number;
  created: Date;
  modified: Date;
  lastAccessed: Date;
  contentHash: string;
  wordCount: number;
  lineCount: number;
  status: DocumentStatus;
  category: DocumentCategory;
  priority: DocumentPriority;
  dependencies: string[];
  crossReferences: string[];
  firestoreRelevance: number; // 0-100 score
  relevanceScore: number; // 0-100 overall relevance
  archivalRisk: ArchivalRisk;
}

interface ArchivalAnalysis {
  totalDocuments: number;
  activeDocuments: number;
  obsoleteDocuments: number;
  archiveCandidates: DocumentMetadata[];
  firestoreDocuments: DocumentMetadata[];
  criticalDocuments: DocumentMetadata[];
  brokenReferences: string[];
  healthScore: number;
}

enum DocumentStatus {
  ACTIVE = 'active',
  OBSOLETE = 'obsolete',
  ARCHIVED = 'archived',
  SUPERSEDED = 'superseded',
  DEPRECATED = 'deprecated'
}

enum DocumentCategory {
  IMPLEMENTATION_SUMMARY = 'implementation-summary',
  PLANNING_DOCUMENT = 'planning-document',
  TECHNICAL_GUIDE = 'technical-guide',
  STATUS_UPDATE = 'status-update',
  FIRESTORE_MIGRATION = 'firestore-migration',
  PERFORMANCE_DOCS = 'performance-docs',
  SYSTEM_DESIGN = 'system-design',
  TESTING_DOCS = 'testing-docs',
  LEGACY_CONTENT = 'legacy-content'
}

enum DocumentPriority {
  CRITICAL = 'critical',      // Must never be archived (active dev dependency)
  HIGH = 'high',             // Important reference docs
  MEDIUM = 'medium',         // General documentation
  LOW = 'low',               // Archive candidates
  OBSOLETE = 'obsolete'      // Should be archived immediately
}

enum ArchivalRisk {
  NONE = 'none',             // Safe to archive
  LOW = 'low',               // Minor impact if archived
  MEDIUM = 'medium',         // Could disrupt workflows
  HIGH = 'high',             // Would cause implementation issues
  CRITICAL = 'critical'      // Must never be archived
}

// Configuration
const CONFIG = {
  docsPath: path.join(process.cwd(), 'docs'),
  archivePath: path.join(process.cwd(), 'docs', 'archived'),
  metadataPath: path.join(process.cwd(), 'docs', '.metadata'),
  firestoreKeywords: [
    'firestore', 'migration', 'database', 'index', 'query',
    'collection', 'document', 'transaction', 'security rules'
  ],
  criticalPatterns: [
    'IMPLEMENTATION_GUIDE', 'CRITICAL', 'PRODUCTION',
    'ACTIVE', 'CURRENT_PROJECT_STATUS', 'MASTER_PLAN'
  ],
  obsoletePatterns: [
    'PROMPT', 'PLAN.md', 'STRATEGY.md', 'TODO',
    'DRAFT', 'WIP', 'EXPERIMENTAL'
  ],
  maxDocumentAge: 90, // days
  minRelevanceScore: 30 // 0-100
};

// Firestore Documentation Priority System
const FIRESTORE_PRIORITY_DOCS = [
  'FIRESTORE_MIGRATION_IMPLEMENTATION_GUIDE.md',
  'FIRESTORE_INDEX_VERIFICATION_IMPLEMENTATION_SUMMARY.md',
  'PHASE_1_FIRESTORE_MIGRATION_INFRASTRUCTURE_IMPLEMENTATION_PROMPT.md',
  'REALTIME_LISTENER_BEST_PRACTICES.md'
];

/**
 * Main Documentation Maintenance Class
 */
class DocumentationMaintainer {
  private documents: Map<string, DocumentMetadata> = new Map();
  private analysis: ArchivalAnalysis | null = null;

  /**
   * Initialize the documentation maintenance system
   */
  async initialize(): Promise<void> {
    console.log('🤖 Initializing TradeYa Documentation Maintenance System...');
    
    // Ensure required directories exist
    await this.ensureDirectories();
    
    // Load existing metadata
    await this.loadMetadata();
    
    console.log('✅ Documentation system initialized');
  }

  /**
   * Analyze all documentation for health, relevance, and archival candidates
   */
  async analyzeDocumentation(): Promise<ArchivalAnalysis> {
    console.log('📊 Analyzing documentation health and relevance...');
    
    const docFiles = await glob('**/*.md', { cwd: CONFIG.docsPath });
    let processedCount = 0;
    
    for (const file of docFiles) {
      if (file.startsWith('archived/')) continue; // Skip already archived
      
      const metadata = await this.analyzeDocument(file);
      this.documents.set(file, metadata);
      
      processedCount++;
      if (processedCount % 10 === 0) {
        console.log(`📋 Processed ${processedCount}/${docFiles.length} documents`);
      }
    }
    
    // Generate analysis
    this.analysis = await this.generateAnalysis();
    
    // Save metadata
    await this.saveMetadata();
    
    console.log('✅ Documentation analysis complete');
    return this.analysis;
  }

  /**
   * Analyze individual document for metadata and relevance
   */
  private async analyzeDocument(filePath: string): Promise<DocumentMetadata> {
    const fullPath = path.join(CONFIG.docsPath, filePath);
    const stats = await fs.stat(fullPath);
    const content = await fs.readFile(fullPath, 'utf-8');
    
    const metadata: DocumentMetadata = {
      filePath,
      fileName: path.basename(filePath),
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime,
      lastAccessed: stats.atime,
      contentHash: this.generateContentHash(content),
      wordCount: this.countWords(content),
      lineCount: content.split('\n').length,
      status: this.determineStatus(filePath, content),
      category: this.categorizeDocument(filePath, content),
      priority: this.determinePriority(filePath, content),
      dependencies: this.extractDependencies(content),
      crossReferences: this.extractCrossReferences(content),
      firestoreRelevance: this.calculateFirestoreRelevance(content),
      relevanceScore: this.calculateRelevanceScore(filePath, content, stats),
      archivalRisk: this.assessArchivalRisk(filePath, content)
    };
    
    return metadata;
  }

  /**
   * Generate comprehensive analysis of documentation health
   */
  private async generateAnalysis(): Promise<ArchivalAnalysis> {
    const docs = Array.from(this.documents.values());
    
    const analysis: ArchivalAnalysis = {
      totalDocuments: docs.length,
      activeDocuments: docs.filter(d => d.status === DocumentStatus.ACTIVE).length,
      obsoleteDocuments: docs.filter(d => d.status === DocumentStatus.OBSOLETE).length,
      archiveCandidates: docs.filter(d => 
        d.priority === DocumentPriority.LOW && 
        d.archivalRisk === ArchivalRisk.NONE
      ),
      firestoreDocuments: docs.filter(d => d.firestoreRelevance > 70),
      criticalDocuments: docs.filter(d => d.priority === DocumentPriority.CRITICAL),
      brokenReferences: await this.findBrokenReferences(),
      healthScore: this.calculateHealthScore(docs)
    };
    
    return analysis;
  }

  /**
   * Archive outdated documents with metadata preservation
   */
  async archiveOutdatedDocuments(dryRun: boolean = true): Promise<void> {
    if (!this.analysis) {
      throw new Error('Must run analysis before archiving');
    }
    
    console.log(`📁 ${dryRun ? 'Simulating' : 'Executing'} document archival...`);
    
    for (const doc of this.analysis.archiveCandidates) {
      await this.archiveDocument(doc, dryRun);
    }
    
    console.log(`✅ Archival ${dryRun ? 'simulation' : 'execution'} complete`);
  }

  /**
   * Archive individual document with metadata preservation
   */
  private async archiveDocument(doc: DocumentMetadata, dryRun: boolean): Promise<void> {
    const sourcePath = path.join(CONFIG.docsPath, doc.filePath);
    const archivePath = path.join(CONFIG.archivePath, doc.filePath);
    const metadataPath = archivePath + '.meta.json';
    
    console.log(`📦 ${dryRun ? '[DRY RUN]' : ''} Archiving: ${doc.fileName}`);
    
    if (!dryRun) {
      // Ensure archive directory exists
      await fs.mkdir(path.dirname(archivePath), { recursive: true });
      
      // Move document to archive
      await fs.rename(sourcePath, archivePath);
      
      // Save metadata
      const archiveMetadata = {
        ...doc,
        archivedAt: new Date().toISOString(),
        archivedReason: 'Automated archival - low relevance score',
        originalPath: doc.filePath
      };
      
      await fs.writeFile(metadataPath, JSON.stringify(archiveMetadata, null, 2));
      
      // Update document status
      doc.status = DocumentStatus.ARCHIVED;
    }
  }

  /**
   * Validate cross-references and document consistency
   */
  async validateCrossReferences(): Promise<string[]> {
    console.log('🔗 Validating cross-references and document consistency...');
    
    const brokenReferences: string[] = [];
    
    for (const [filePath, doc] of this.documents) {
      for (const ref of doc.crossReferences) {
        const referencedPath = path.resolve(path.dirname(path.join(CONFIG.docsPath, filePath)), ref);
        const relativePath = path.relative(CONFIG.docsPath, referencedPath);
        
        try {
          await fs.access(referencedPath);
        } catch {
          brokenReferences.push(`${filePath} -> ${ref}`);
        }
      }
    }
    
    console.log(`✅ Cross-reference validation complete. Found ${brokenReferences.length} broken references.`);
    return brokenReferences;
  }

  /**
   * Check Firestore documentation priority and accessibility
   */
  async checkFirestorePriority(): Promise<void> {
    console.log('🔥 Checking Firestore documentation priority status...');
    
    const firestoreDocs = Array.from(this.documents.values())
      .filter(doc => doc.firestoreRelevance > 50)
      .sort((a, b) => b.firestoreRelevance - a.firestoreRelevance);
    
    console.log('\n🎯 High-Priority Firestore Documents:');
    for (const doc of firestoreDocs.slice(0, 10)) {
      const status = doc.priority === DocumentPriority.CRITICAL ? '🟢' : 
                    doc.priority === DocumentPriority.HIGH ? '🟡' : '🟠';
      console.log(`  ${status} ${doc.fileName} (${doc.firestoreRelevance}% relevance)`);
    }
    
    // Ensure critical Firestore docs are never archived
    for (const doc of firestoreDocs) {
      if (doc.firestoreRelevance > 80) {
        doc.priority = DocumentPriority.CRITICAL;
        doc.archivalRisk = ArchivalRisk.CRITICAL;
      }
    }
    
    console.log('✅ Firestore documentation priority check complete');
  }

  /**
   * Generate documentation health dashboard
   */
  async generateHealthDashboard(): Promise<void> {
    if (!this.analysis) {
      await this.analyzeDocumentation();
    }
    
    console.log('\n📊 === TRADEYA DOCUMENTATION HEALTH DASHBOARD ===\n');
    
    // Overall Health
    const healthEmoji = this.analysis!.healthScore >= 90 ? '🟢' : 
                       this.analysis!.healthScore >= 70 ? '🟡' : '🔴';
    console.log(`Overall Health: ${healthEmoji} ${this.analysis!.healthScore}%\n`);
    
    // Document Statistics
    console.log('📈 Document Statistics:');
    console.log(`  Total Documents: ${this.analysis!.totalDocuments}`);
    console.log(`  Active Documents: ${this.analysis!.activeDocuments}`);
    console.log(`  Archive Candidates: ${this.analysis!.archiveCandidates.length}`);
    console.log(`  Firestore Docs: ${this.analysis!.firestoreDocuments.length}`);
    console.log(`  Critical Docs: ${this.analysis!.criticalDocuments.length}`);
    console.log(`  Broken References: ${this.analysis!.brokenReferences.length}\n`);
    
    // Critical Documents
    console.log('🎯 Critical Documents (Never Archive):');
    for (const doc of this.analysis!.criticalDocuments.slice(0, 5)) {
      console.log(`  🔒 ${doc.fileName}`);
    }
    
    // Archive Candidates
    if (this.analysis!.archiveCandidates.length > 0) {
      console.log('\n📁 Archive Candidates:');
      for (const doc of this.analysis!.archiveCandidates.slice(0, 5)) {
        console.log(`  📦 ${doc.fileName} (${doc.relevanceScore}% relevance)`);
      }
    }
    
    // Firestore Priority
    console.log('\n🔥 Firestore Documentation Priority:');
    const topFirestore = this.analysis!.firestoreDocuments
      .sort((a, b) => b.firestoreRelevance - a.firestoreRelevance)
      .slice(0, 3);
    for (const doc of topFirestore) {
      console.log(`  🎯 ${doc.fileName} (${doc.firestoreRelevance}% relevance)`);
    }
    
    console.log('\n✅ Health dashboard generated successfully');
  }

  // Utility Methods
  private generateContentHash(content: string): string {
    return createHash('md5').update(content).digest('hex');
  }

  private countWords(content: string): number {
    return content.split(/\s+/).filter(word => word.length > 0).length;
  }

  private determineStatus(filePath: string, content: string): DocumentStatus {
    if (CONFIG.obsoletePatterns.some(pattern => filePath.includes(pattern))) {
      return DocumentStatus.OBSOLETE;
    }
    
    if (content.includes('DEPRECATED') || content.includes('OBSOLETE')) {
      return DocumentStatus.DEPRECATED;
    }
    
    if (content.includes('SUPERSEDED') || content.includes('REPLACED BY')) {
      return DocumentStatus.SUPERSEDED;
    }
    
    return DocumentStatus.ACTIVE;
  }

  private categorizeDocument(filePath: string, content: string): DocumentCategory {
    if (filePath.includes('IMPLEMENTATION_SUMMARY') || content.includes('✅ COMPLETE')) {
      return DocumentCategory.IMPLEMENTATION_SUMMARY;
    }
    
    if (CONFIG.firestoreKeywords.some(keyword => 
      content.toLowerCase().includes(keyword.toLowerCase()))) {
      return DocumentCategory.FIRESTORE_MIGRATION;
    }
    
    if (filePath.includes('PERFORMANCE') || content.includes('performance')) {
      return DocumentCategory.PERFORMANCE_DOCS;
    }
    
    if (filePath.includes('PLAN') || filePath.includes('PROMPT')) {
      return DocumentCategory.PLANNING_DOCUMENT;
    }
    
    if (filePath.includes('GUIDE') || content.includes('## Setup') || content.includes('## Usage')) {
      return DocumentCategory.TECHNICAL_GUIDE;
    }
    
    if (filePath.includes('STATUS') || content.includes('Current Status')) {
      return DocumentCategory.STATUS_UPDATE;
    }
    
    return DocumentCategory.SYSTEM_DESIGN;
  }

  private determinePriority(filePath: string, content: string): DocumentPriority {
    if (CONFIG.criticalPatterns.some(pattern => filePath.includes(pattern)) ||
        FIRESTORE_PRIORITY_DOCS.includes(path.basename(filePath))) {
      return DocumentPriority.CRITICAL;
    }
    
    if (content.includes('IMPLEMENTATION_SUMMARY') || 
        content.includes('PRODUCTION READY') ||
        this.calculateFirestoreRelevance(content) > 70) {
      return DocumentPriority.HIGH;
    }
    
    if (CONFIG.obsoletePatterns.some(pattern => filePath.includes(pattern))) {
      return DocumentPriority.OBSOLETE;
    }
    
    return DocumentPriority.MEDIUM;
  }

  private extractDependencies(content: string): string[] {
    const dependencies: string[] = [];
    const depPatterns = [
      /depends on ([A-Z_]+\.md)/gi,
      /requires ([A-Z_]+\.md)/gi,
      /see also ([A-Z_]+\.md)/gi
    ];
    
    for (const pattern of depPatterns) {
      const matches = content.match(pattern);
      if (matches) {
        dependencies.push(...matches);
      }
    }
    
    return [...new Set(dependencies)];
  }

  private extractCrossReferences(content: string): string[] {
    const references: string[] = [];
    const refPatterns = [
      /\[.*?\]\(([^)]+\.md)\)/g,
      /\[([A-Z_]+\.md)\]/g
    ];
    
    for (const pattern of refPatterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        references.push(match[1]);
      }
    }
    
    return [...new Set(references)];
  }

  private calculateFirestoreRelevance(content: string): number {
    let score = 0;
    const lowerContent = content.toLowerCase();
    
    for (const keyword of CONFIG.firestoreKeywords) {
      const occurrences = (lowerContent.match(new RegExp(keyword.toLowerCase(), 'g')) || []).length;
      score += occurrences * 10;
    }
    
    // Bonus for specific Firestore sections
    if (lowerContent.includes('firestore migration')) score += 30;
    if (lowerContent.includes('database migration')) score += 25;
    if (lowerContent.includes('index verification')) score += 20;
    if (lowerContent.includes('security rules')) score += 15;
    
    return Math.min(score, 100);
  }

  private calculateRelevanceScore(filePath: string, content: string, stats: any): number {
    let score = 50; // Base score
    
    // Age factor (newer is more relevant)
    const ageInDays = (Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60 * 24);
    if (ageInDays < 7) score += 20;
    else if (ageInDays < 30) score += 10;
    else if (ageInDays > CONFIG.maxDocumentAge) score -= 20;
    
    // Content quality indicators
    if (content.includes('✅ COMPLETE')) score += 15;
    if (content.includes('PRODUCTION READY')) score += 15;
    if (content.includes('IMPLEMENTATION_SUMMARY')) score += 10;
    
    // Negative indicators
    if (content.includes('TODO') || content.includes('DRAFT')) score -= 10;
    if (content.includes('DEPRECATED')) score -= 30;
    if (filePath.includes('PROMPT') && !filePath.includes('IMPLEMENTATION')) score -= 15;
    
    // File size (too small might be incomplete)
    if (stats.size < 1000) score -= 10;
    
    return Math.max(0, Math.min(100, score));
  }

  private assessArchivalRisk(filePath: string, content: string): ArchivalRisk {
    if (CONFIG.criticalPatterns.some(pattern => filePath.includes(pattern)) ||
        FIRESTORE_PRIORITY_DOCS.includes(path.basename(filePath))) {
      return ArchivalRisk.CRITICAL;
    }
    
    if (content.includes('ACTIVE DEVELOPMENT') || 
        content.includes('CURRENT IMPLEMENTATION')) {
      return ArchivalRisk.HIGH;
    }
    
    if (content.includes('REFERENCE') || content.includes('GUIDE')) {
      return ArchivalRisk.MEDIUM;
    }
    
    if (CONFIG.obsoletePatterns.some(pattern => filePath.includes(pattern))) {
      return ArchivalRisk.NONE;
    }
    
    return ArchivalRisk.LOW;
  }

  private calculateHealthScore(docs: DocumentMetadata[]): number {
    let score = 100;
    
    // Deduct for broken references
    score -= this.analysis?.brokenReferences.length || 0 * 2;
    
    // Deduct for too many obsolete documents
    const obsoleteRatio = docs.filter(d => d.status === DocumentStatus.OBSOLETE).length / docs.length;
    score -= obsoleteRatio * 30;
    
    // Deduct for low relevance documents
    const lowRelevanceCount = docs.filter(d => d.relevanceScore < CONFIG.minRelevanceScore).length;
    score -= (lowRelevanceCount / docs.length) * 20;
    
    return Math.max(0, Math.min(100, score));
  }

  private async findBrokenReferences(): Promise<string[]> {
    // This would be implemented to scan for broken internal links
    // For now, return empty array as placeholder
    return [];
  }

  private async ensureDirectories(): Promise<void> {
    await fs.mkdir(CONFIG.archivePath, { recursive: true });
    await fs.mkdir(CONFIG.metadataPath, { recursive: true });
  }

  private async loadMetadata(): Promise<void> {
    // Load existing metadata if available
    // Implementation would read from CONFIG.metadataPath
  }

  private async saveMetadata(): Promise<void> {
    const metadataFile = path.join(CONFIG.metadataPath, 'documents.json');
    const metadata = Object.fromEntries(this.documents);
    await fs.writeFile(metadataFile, JSON.stringify(metadata, null, 2));
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'help';
  
  const maintainer = new DocumentationMaintainer();
  await maintainer.initialize();
  
  try {
    switch (command) {
      case 'analyze':
        await maintainer.analyzeDocumentation();
        break;
        
      case 'archive':
        const dryRun = !args.includes('--execute');
        await maintainer.analyzeDocumentation();
        await maintainer.archiveOutdatedDocuments(dryRun);
        break;
        
      case 'validate':
        await maintainer.analyzeDocumentation();
        await maintainer.validateCrossReferences();
        break;
        
      case 'priority':
        await maintainer.analyzeDocumentation();
        await maintainer.checkFirestorePriority();
        break;
        
      case 'health':
        await maintainer.generateHealthDashboard();
        break;
        
      case 'help':
      default:
        console.log(`
🤖 TradeYa Documentation Maintenance System

Usage: npx tsx scripts/maintain-docs.ts [command] [options]

Commands:
  analyze     Analyze documentation health and identify issues
  archive     Archive outdated documents (add --execute to actually archive)
  validate    Validate cross-references and consistency
  priority    Check Firestore documentation priority status
  health      Generate documentation health dashboard
  help        Show this help message

Options:
  --execute   Actually execute archival (default is dry-run)

Examples:
  npx tsx scripts/maintain-docs.ts health
  npx tsx scripts/maintain-docs.ts archive --execute
  npx tsx scripts/maintain-docs.ts priority
`);
        break;
    }
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export type { DocumentMetadata, ArchivalAnalysis };
export { DocumentationMaintainer };