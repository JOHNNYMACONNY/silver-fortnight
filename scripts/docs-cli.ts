#!/usr/bin/env tsx
/**
 * TradeYa Documentation CLI Tools
 * 
 * Developer-friendly command-line interface for documentation operations
 * including search, navigation, contribution guidelines, and quick actions.
 * 
 * @author TradeYa Documentation Agent
 * @version 1.0.0
 * @created 2025-06-09
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { DocumentationMaintainer } from './maintain-docs';
import { glob } from 'glob';
import chalk from 'chalk';
import inquirer from 'inquirer';

// CLI Configuration
const CLI_CONFIG = {
  docsPath: path.join(process.cwd(), 'docs'),
  templatesPath: path.join(process.cwd(), 'docs', 'templates'),
  contributionGuide: 'docs/CONTRIBUTING_TO_DOCS.md'
};

// Document Templates
const DOCUMENT_TEMPLATES = {
  'implementation-summary': {
    name: 'Implementation Summary',
    template: `# {FEATURE_NAME} Implementation Summary

**Status:** 🟢 Complete | 🟡 In Progress | 🔴 Blocked  
**Created:** {DATE}  
**Last Updated:** {DATE}  
**Implementation Phase:** {PHASE}

---

## 📋 Implementation Overview

### **Objective**
{OBJECTIVE_DESCRIPTION}

### **Key Components Implemented**
- [ ] Component 1
- [ ] Component 2
- [ ] Component 3

### **Files Modified/Created**
\`\`\`
{FILE_LIST}
\`\`\`

---

## ✅ Implementation Results

### **Success Metrics**
- **Functionality:** ✅ All core features working
- **Testing:** ✅ Unit tests passing
- **Integration:** ✅ Integrates with existing systems
- **Performance:** ✅ Meets performance requirements

### **Technical Achievements**
{TECHNICAL_ACHIEVEMENTS}

---

## 🔧 Usage Instructions

### **For Developers**
\`\`\`typescript
{USAGE_EXAMPLE}
\`\`\`

### **Integration Points**
{INTEGRATION_POINTS}

---

## 📊 Testing & Validation

### **Test Coverage**
- Unit Tests: {UNIT_TEST_COVERAGE}%
- Integration Tests: {INTEGRATION_TEST_COVERAGE}%
- E2E Tests: {E2E_TEST_COVERAGE}%

### **Validation Results**
{VALIDATION_RESULTS}

---

## 🚀 Production Readiness

**Status:** 🟢 Production Ready

### **Deployment Checklist**
- [x] Code review completed
- [x] Tests passing
- [x] Documentation updated
- [x] Performance validated
- [x] Security review passed

---

## 📚 References

- **Related Documentation:** {RELATED_DOCS}
- **Dependencies:** {DEPENDENCIES}
- **Next Steps:** {NEXT_STEPS}

---

**Last Updated:** {DATE}  
**Maintained By:** TradeYa Development Team
`
  },
  
  'technical-guide': {
    name: 'Technical Guide',
    template: `# {GUIDE_TITLE}

**Purpose:** {PURPOSE}  
**Audience:** {AUDIENCE}  
**Created:** {DATE}  
**Last Updated:** {DATE}

---

## 📖 Overview

{OVERVIEW_DESCRIPTION}

### **Prerequisites**
- {PREREQUISITE_1}
- {PREREQUISITE_2}
- {PREREQUISITE_3}

---

## 🚀 Getting Started

### **Step 1: Setup**
\`\`\`bash
{SETUP_COMMANDS}
\`\`\`

### **Step 2: Configuration**
\`\`\`typescript
{CONFIGURATION_EXAMPLE}
\`\`\`

### **Step 3: Implementation**
\`\`\`typescript
{IMPLEMENTATION_EXAMPLE}
\`\`\`

---

## 🔧 Advanced Usage

### **Advanced Configuration**
{ADVANCED_CONFIG}

### **Custom Implementation**
{CUSTOM_IMPLEMENTATION}

---

## 📚 API Reference

### **Core Methods**
{API_REFERENCE}

### **Configuration Options**
{CONFIG_OPTIONS}

---

## 🧪 Testing

### **Unit Testing**
\`\`\`typescript
{UNIT_TEST_EXAMPLE}
\`\`\`

### **Integration Testing**
\`\`\`typescript
{INTEGRATION_TEST_EXAMPLE}
\`\`\`

---

## ❓ Troubleshooting

### **Common Issues**
{COMMON_ISSUES}

### **Debug Tips**
{DEBUG_TIPS}

---

## 📞 Support

- **Documentation:** {RELATED_DOCS}
- **Examples:** {EXAMPLES}
- **Community:** {COMMUNITY_LINKS}

---

**Last Updated:** {DATE}  
**Maintained By:** TradeYa Development Team
`
  },
  
  'firestore-guide': {
    name: 'Firestore Migration Guide',
    template: `# {MIGRATION_TITLE}

**Migration Phase:** {PHASE}  
**Priority:** 🔥 CRITICAL  
**Created:** {DATE}  
**Last Updated:** {DATE}

---

## 🎯 Migration Overview

### **Objective**
{MIGRATION_OBJECTIVE}

### **Migration Scope**
- **Collections Affected:** {COLLECTIONS}
- **Data Volume:** {DATA_VOLUME}
- **Timeline:** {TIMELINE}

### **Critical Dependencies**
- {DEPENDENCY_1}
- {DEPENDENCY_2}
- {DEPENDENCY_3}

---

## 🔥 Firestore Configuration

### **Security Rules**
\`\`\`javascript
{SECURITY_RULES}
\`\`\`

### **Indexes Required**
\`\`\`json
{FIRESTORE_INDEXES}
\`\`\`

### **Collection Structure**
\`\`\`typescript
{COLLECTION_STRUCTURE}
\`\`\`

---

## 🔄 Migration Steps

### **Phase 1: Preparation**
1. {PREP_STEP_1}
2. {PREP_STEP_2}
3. {PREP_STEP_3}

### **Phase 2: Data Migration**
\`\`\`typescript
{MIGRATION_SCRIPT}
\`\`\`

### **Phase 3: Validation**
\`\`\`typescript
{VALIDATION_SCRIPT}
\`\`\`

---

## ⚠️ Critical Considerations

### **Breaking Changes**
{BREAKING_CHANGES}

### **Rollback Procedure**
{ROLLBACK_PROCEDURE}

### **Performance Impact**
{PERFORMANCE_IMPACT}

---

## 🧪 Testing Strategy

### **Pre-Migration Testing**
{PRE_MIGRATION_TESTS}

### **Post-Migration Validation**
{POST_MIGRATION_VALIDATION}

---

## 📊 Monitoring & Alerts

### **Key Metrics**
{KEY_METRICS}

### **Alert Configuration**
{ALERT_CONFIG}

---

## 🚨 Emergency Procedures

### **Rollback Triggers**
{ROLLBACK_TRIGGERS}

### **Emergency Contacts**
{EMERGENCY_CONTACTS}

---

**🔥 FIRESTORE PRIORITY DOCUMENTATION**  
**Last Updated:** {DATE}  
**Maintained By:** TradeYa Database Team
`
  }
};

/**
 * Documentation CLI Class
 */
class DocumentationCLI {
  private maintainer: DocumentationMaintainer;

  constructor() {
    this.maintainer = new DocumentationMaintainer();
  }

  /**
   * Initialize CLI system
   */
  async initialize(): Promise<void> {
    await this.maintainer.initialize();
    await this.ensureTemplatesDirectory();
  }

  /**
   * Interactive documentation dashboard
   */
  async dashboard(): Promise<void> {
    console.log(chalk.blue.bold('\n📚 TradeYa Documentation Dashboard\n'));

    const choices = [
      { name: '📊 Health Dashboard', value: 'health' },
      { name: '🔍 Search Documentation', value: 'search' },
      { name: '📝 Create New Document', value: 'create' },
      { name: '🔥 Firestore Priority Docs', value: 'firestore' },
      { name: '🔗 Validate References', value: 'validate' },
      { name: '📁 Archive Management', value: 'archive' },
      { name: '📋 Contribution Guide', value: 'contribute' },
      { name: '🚀 Quick Actions', value: 'quick' },
      { name: '❌ Exit', value: 'exit' }
    ];

    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'What would you like to do?',
        choices
      }
    ]);

    switch (action) {
      case 'health':
        await this.showHealthDashboard();
        break;
      case 'search':
        await this.searchDocumentation();
        break;
      case 'create':
        await this.createDocument();
        break;
      case 'firestore':
        await this.showFirestorePriority();
        break;
      case 'validate':
        await this.validateReferences();
        break;
      case 'archive':
        await this.manageArchives();
        break;
      case 'contribute':
        await this.showContributionGuide();
        break;
      case 'quick':
        await this.quickActions();
        break;
      case 'exit':
        console.log(chalk.green('\n👋 Goodbye!\n'));
        return;
    }

    // Return to dashboard unless exiting
    if (action !== 'exit') {
      await this.dashboard();
    }
  }

  /**
   * Search through documentation
   */
  async searchDocumentation(): Promise<void> {
    console.log(chalk.blue.bold('\n🔍 Documentation Search\n'));

    const { searchTerm } = await inquirer.prompt([
      {
        type: 'input',
        name: 'searchTerm',
        message: 'Enter search term:',
        validate: (input) => input.length > 0 || 'Please enter a search term'
      }
    ]);

    const results = await this.performSearch(searchTerm);

    if (results.length === 0) {
      console.log(chalk.yellow('\n❌ No results found\n'));
      return;
    }

    console.log(chalk.green(`\n✅ Found ${results.length} results:\n`));
    
    for (const result of results.slice(0, 10)) {
      console.log(chalk.cyan(`📄 ${result.file}`));
      console.log(chalk.gray(`   ${result.preview}`));
      console.log(chalk.blue(`   Path: ${result.path}\n`));
    }

    if (results.length > 10) {
      console.log(chalk.yellow(`... and ${results.length - 10} more results\n`));
    }
  }

  /**
   * Create new documentation from templates
   */
  async createDocument(): Promise<void> {
    console.log(chalk.blue.bold('\n📝 Create New Documentation\n'));

    const templateChoices = Object.entries(DOCUMENT_TEMPLATES).map(([key, template]) => ({
      name: template.name,
      value: key
    }));

    const { templateType } = await inquirer.prompt([
      {
        type: 'list',
        name: 'templateType',
        message: 'Select document template:',
        choices: templateChoices
      }
    ]);

    const { fileName } = await inquirer.prompt([
      {
        type: 'input',
        name: 'fileName',
        message: 'Enter file name (without .md extension):',
        validate: (input) => {
          if (input.length === 0) return 'Please enter a file name';
          if (!/^[a-zA-Z0-9_-]+$/.test(input)) return 'File name can only contain letters, numbers, hyphens, and underscores';
          return true;
        }
      }
    ]);

    await this.createDocumentFromTemplate(templateType, fileName);
  }

  /**
   * Show Firestore priority documentation
   */
  async showFirestorePriority(): Promise<void> {
    console.log(chalk.red.bold('\n🔥 Firestore Priority Documentation\n'));

    await this.maintainer.checkFirestorePriority();

    const firestoreDocs = [
      'FIRESTORE_MIGRATION_IMPLEMENTATION_GUIDE.md',
      'FIRESTORE_INDEX_VERIFICATION_IMPLEMENTATION_SUMMARY.md',
      'PHASE_1_FIRESTORE_MIGRATION_INFRASTRUCTURE_IMPLEMENTATION_PROMPT.md',
      'REALTIME_LISTENER_BEST_PRACTICES.md'
    ];

    console.log(chalk.red('\n📋 Critical Firestore Documents:\n'));
    
    for (const doc of firestoreDocs) {
      const docPath = path.join(CLI_CONFIG.docsPath, doc);
      try {
        await fs.access(docPath);
        console.log(chalk.green(`✅ ${doc}`));
      } catch {
        console.log(chalk.red(`❌ ${doc} (MISSING)`));
      }
    }

    console.log(chalk.yellow('\n⚠️  These documents are critical for Firestore migration and should never be archived.\n'));
  }

  /**
   * Show health dashboard
   */
  async showHealthDashboard(): Promise<void> {
    console.log(chalk.blue.bold('\n📊 Documentation Health Dashboard\n'));
    await this.maintainer.generateHealthDashboard();
  }

  /**
   * Validate cross-references
   */
  async validateReferences(): Promise<void> {
    console.log(chalk.blue.bold('\n🔗 Validating Cross-References\n'));
    
    await this.maintainer.analyzeDocumentation();
    const brokenRefs = await this.maintainer.validateCrossReferences();
    
    if (brokenRefs.length === 0) {
      console.log(chalk.green('✅ All cross-references are valid\n'));
    } else {
      console.log(chalk.red(`❌ Found ${brokenRefs.length} broken references:\n`));
      for (const ref of brokenRefs) {
        console.log(chalk.yellow(`  ${ref}`));
      }
      console.log();
    }
  }

  /**
   * Manage archives
   */
  async manageArchives(): Promise<void> {
    console.log(chalk.blue.bold('\n📁 Archive Management\n'));

    const choices = [
      { name: '📊 Show Archive Candidates', value: 'candidates' },
      { name: '📦 Archive Documents (Dry Run)', value: 'archive-dry' },
      { name: '⚠️  Archive Documents (Execute)', value: 'archive-execute' },
      { name: '📂 List Archived Documents', value: 'list-archived' },
      { name: '🔙 Back', value: 'back' }
    ];

    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'Archive management action:',
        choices
      }
    ]);

    switch (action) {
      case 'candidates':
        await this.showArchiveCandidates();
        break;
      case 'archive-dry':
        await this.maintainer.archiveOutdatedDocuments(true);
        break;
      case 'archive-execute':
        const { confirm } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'confirm',
            message: 'Are you sure you want to archive documents? This action cannot be undone.',
            default: false
          }
        ]);
        if (confirm) {
          await this.maintainer.archiveOutdatedDocuments(false);
        }
        break;
      case 'list-archived':
        await this.listArchivedDocuments();
        break;
      case 'back':
        return;
    }
  }

  /**
   * Show contribution guide
   */
  async showContributionGuide(): Promise<void> {
    console.log(chalk.blue.bold('\n📋 Documentation Contribution Guide\n'));
    
    const guideContent = `# Contributing to TradeYa Documentation

## 📝 Documentation Standards

### **File Naming Convention**
- Use UPPERCASE with underscores: \`FEATURE_IMPLEMENTATION_SUMMARY.md\`
- Implementation summaries: \`{FEATURE}_IMPLEMENTATION_SUMMARY.md\`
- Technical guides: \`{FEATURE}_GUIDE.md\`
- Status documents: \`{FEATURE}_STATUS.md\`

### **Document Structure**
- Start with clear title and metadata
- Use consistent heading hierarchy
- Include status indicators (🟢🟡🔴)
- Add creation and update dates
- End with maintainer information

### **Content Guidelines**
- Write for your future self and teammates
- Include code examples with syntax highlighting
- Use emojis for visual organization
- Link to related documentation
- Keep implementation summaries up-to-date

### **Firestore Documentation Priority** 🔥
- Firestore migration docs are CRITICAL
- Never archive Firestore-related documentation
- Update immediately when migration procedures change
- Include rollback procedures and emergency contacts

## 🔧 Tools & Commands

### **CLI Tools**
\`\`\`bash
# Documentation dashboard
npm run docs:dashboard

# Health check
npm run docs:health

# Search documentation
npm run docs:search

# Create new document
npm run docs:create

# Validate cross-references
npm run docs:validate
\`\`\`

### **Automation**
- Health checks run daily via GitHub Actions
- Cross-reference validation on PR
- Automatic archival of outdated content
- Firestore documentation monitoring

## 📊 Quality Metrics

- **Completeness**: All features have implementation summaries
- **Currency**: Documents updated within 30 days of changes
- **Accuracy**: All cross-references valid
- **Accessibility**: Clear navigation and search

## 🚀 Best Practices

1. **Update documentation with code changes**
2. **Use templates for consistency**
3. **Tag Firestore-related content appropriately**
4. **Review documentation in PRs**
5. **Archive outdated content regularly**

---

**For more information, use the docs CLI: \`npm run docs:dashboard\`**
`;

    console.log(guideContent);
    
    // Optionally save the guide
    const { saveGuide } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'saveGuide',
        message: 'Save this guide to docs/CONTRIBUTING_TO_DOCS.md?',
        default: true
      }
    ]);

    if (saveGuide) {
      await fs.writeFile(CLI_CONFIG.contributionGuide, guideContent);
      console.log(chalk.green(`\n✅ Contribution guide saved to ${CLI_CONFIG.contributionGuide}\n`));
    }
  }

  /**
   * Quick actions menu
   */
  async quickActions(): Promise<void> {
    console.log(chalk.blue.bold('\n🚀 Quick Actions\n'));

    const choices = [
      { name: '⚡ Quick Health Check', value: 'quick-health' },
      { name: '🔥 Firestore Status', value: 'firestore-status' },
      { name: '📝 Recent Documents', value: 'recent-docs' },
      { name: '🔍 Find Document', value: 'find-doc' },
      { name: '📊 Document Stats', value: 'doc-stats' },
      { name: '🔙 Back', value: 'back' }
    ];

    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'Select quick action:',
        choices
      }
    ]);

    switch (action) {
      case 'quick-health':
        await this.quickHealthCheck();
        break;
      case 'firestore-status':
        await this.maintainer.checkFirestorePriority();
        break;
      case 'recent-docs':
        await this.showRecentDocuments();
        break;
      case 'find-doc':
        await this.findDocument();
        break;
      case 'doc-stats':
        await this.showDocumentStats();
        break;
      case 'back':
        return;
    }
  }

  // Utility Methods
  private async performSearch(searchTerm: string): Promise<any[]> {
    const files = await glob('**/*.md', { cwd: CLI_CONFIG.docsPath });
    const results = [];

    for (const file of files) {
      const filePath = path.join(CLI_CONFIG.docsPath, file);
      try {
        const content = await fs.readFile(filePath, 'utf-8');
        const lines = content.split('\n');
        
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].toLowerCase().includes(searchTerm.toLowerCase())) {
            results.push({
              file: path.basename(file),
              path: file,
              line: i + 1,
              preview: lines[i].trim().substring(0, 100) + '...'
            });
            break; // Only first match per file
          }
        }
      } catch (error) {
        // Skip files that can't be read
      }
    }

    return results;
  }

  private async createDocumentFromTemplate(templateType: string, fileName: string): Promise<void> {
    const template = DOCUMENT_TEMPLATES[templateType];
    let content = template.template;

    // Replace template variables
    const replacements = {
      '{DATE}': new Date().toISOString().split('T')[0],
      '{FEATURE_NAME}': fileName.replace(/_/g, ' '),
      '{GUIDE_TITLE}': fileName.replace(/_/g, ' '),
      '{MIGRATION_TITLE}': fileName.replace(/_/g, ' ')
    };

    for (const [placeholder, value] of Object.entries(replacements)) {
      content = content.replace(new RegExp(placeholder, 'g'), value);
    }

    const filePath = path.join(CLI_CONFIG.docsPath, `${fileName}.md`);
    await fs.writeFile(filePath, content);

    console.log(chalk.green(`\n✅ Created ${fileName}.md from ${template.name} template`));
    console.log(chalk.blue(`📂 Location: ${filePath}\n`));
  }

  private async ensureTemplatesDirectory(): Promise<void> {
    await fs.mkdir(CLI_CONFIG.templatesPath, { recursive: true });
  }

  private async showArchiveCandidates(): Promise<void> {
    await this.maintainer.analyzeDocumentation();
    console.log(chalk.yellow('\n📦 Archive candidates will be shown in the analysis...\n'));
  }

  private async listArchivedDocuments(): Promise<void> {
    const archivePath = path.join(CLI_CONFIG.docsPath, 'archived');
    try {
      const archivedFiles = await glob('**/*.md', { cwd: archivePath });
      
      if (archivedFiles.length === 0) {
        console.log(chalk.yellow('\n📂 No archived documents found\n'));
        return;
      }

      console.log(chalk.blue(`\n📂 Found ${archivedFiles.length} archived documents:\n`));
      
      for (const file of archivedFiles) {
        console.log(chalk.gray(`  📄 ${file}`));
      }
      
      console.log();
    } catch (error) {
      console.log(chalk.yellow('\n📂 Archive directory not found\n'));
    }
  }

  private async quickHealthCheck(): Promise<void> {
    console.log(chalk.blue('\n⚡ Running quick health check...\n'));
    
    const files = await glob('**/*.md', { cwd: CLI_CONFIG.docsPath });
    const recentFiles = [];
    const totalFiles = files.length;
    
    for (const file of files) {
      const filePath = path.join(CLI_CONFIG.docsPath, file);
      const stats = await fs.stat(filePath);
      const ageInDays = (Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60 * 24);
      
      if (ageInDays < 7) {
        recentFiles.push(file);
      }
    }

    console.log(chalk.green(`📊 Total Documents: ${totalFiles}`));
    console.log(chalk.green(`📅 Recently Updated: ${recentFiles.length}`));
    console.log(chalk.blue(`📂 Documentation Health: ${recentFiles.length > 0 ? '🟢 Good' : '🟡 Moderate'}\n`));
  }

  private async showRecentDocuments(): Promise<void> {
    const files = await glob('**/*.md', { cwd: CLI_CONFIG.docsPath });
    const recentFiles = [];
    
    for (const file of files) {
      const filePath = path.join(CLI_CONFIG.docsPath, file);
      const stats = await fs.stat(filePath);
      const ageInDays = (Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60 * 24);
      
      if (ageInDays < 7) {
        recentFiles.push({ file, modified: stats.mtime, ageInDays });
      }
    }

    recentFiles.sort((a, b) => b.modified.getTime() - a.modified.getTime());

    console.log(chalk.blue(`\n📅 Recently Updated Documents (last 7 days):\n`));
    
    if (recentFiles.length === 0) {
      console.log(chalk.yellow('No documents updated in the last 7 days\n'));
      return;
    }

    for (const doc of recentFiles.slice(0, 10)) {
      const daysAgo = Math.floor(doc.ageInDays);
      console.log(chalk.green(`📄 ${doc.file} (${daysAgo} days ago)`));
    }
    
    console.log();
  }

  private async findDocument(): Promise<void> {
    const { fileName } = await inquirer.prompt([
      {
        type: 'input',
        name: 'fileName',
        message: 'Enter document name (partial match):',
        validate: (input) => input.length > 0 || 'Please enter a document name'
      }
    ]);

    const files = await glob('**/*.md', { cwd: CLI_CONFIG.docsPath });
    const matches = files.filter(file => 
      file.toLowerCase().includes(fileName.toLowerCase())
    );

    if (matches.length === 0) {
      console.log(chalk.yellow('\n❌ No matching documents found\n'));
      return;
    }

    console.log(chalk.green(`\n✅ Found ${matches.length} matching documents:\n`));
    
    for (const match of matches) {
      console.log(chalk.cyan(`📄 ${match}`));
    }
    
    console.log();
  }

  private async showDocumentStats(): Promise<void> {
    const files = await glob('**/*.md', { cwd: CLI_CONFIG.docsPath });
    let totalWords = 0;
    let totalLines = 0;
    
    const categories = {
      implementation: 0,
      guide: 0,
      status: 0,
      firestore: 0,
      other: 0
    };

    for (const file of files) {
      const filePath = path.join(CLI_CONFIG.docsPath, file);
      const content = await fs.readFile(filePath, 'utf-8');
      
      totalWords += content.split(/\s+/).length;
      totalLines += content.split('\n').length;
      
      // Categorize
      const fileName = file.toLowerCase();
      if (fileName.includes('implementation_summary')) categories.implementation++;
      else if (fileName.includes('guide')) categories.guide++;
      else if (fileName.includes('status')) categories.status++;
      else if (fileName.includes('firestore') || fileName.includes('migration')) categories.firestore++;
      else categories.other++;
    }

    console.log(chalk.blue('\n📊 Documentation Statistics:\n'));
    console.log(chalk.green(`📄 Total Documents: ${files.length}`));
    console.log(chalk.green(`📝 Total Words: ${totalWords.toLocaleString()}`));
    console.log(chalk.green(`📏 Total Lines: ${totalLines.toLocaleString()}`));
    console.log(chalk.blue('\n📋 Categories:'));
    console.log(chalk.cyan(`  Implementation Summaries: ${categories.implementation}`));
    console.log(chalk.cyan(`  Technical Guides: ${categories.guide}`));
    console.log(chalk.cyan(`  Status Documents: ${categories.status}`));
    console.log(chalk.red(`  🔥 Firestore Documents: ${categories.firestore}`));
    console.log(chalk.cyan(`  Other Documents: ${categories.other}`));
    console.log();
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'dashboard';
  
  const cli = new DocumentationCLI();
  await cli.initialize();
  
  try {
    switch (command) {
      case 'dashboard':
      case 'dash':
        await cli.dashboard();
        break;
        
      case 'search':
        await cli.searchDocumentation();
        break;
        
      case 'create':
        await cli.createDocument();
        break;
        
      case 'firestore':
        await cli.showFirestorePriority();
        break;
        
      case 'health':
        await cli.showHealthDashboard();
        break;
        
      case 'help':
      default:
        console.log(`
🤖 TradeYa Documentation CLI

Usage: npx tsx scripts/docs-cli.ts [command]

Commands:
  dashboard   Interactive documentation dashboard (default)
  search      Search through documentation
  create      Create new document from template
  firestore   Show Firestore priority documentation
  health      Show documentation health dashboard
  help        Show this help message

Examples:
  npx tsx scripts/docs-cli.ts dashboard
  npx tsx scripts/docs-cli.ts search
  npx tsx scripts/docs-cli.ts create
`);
        break;
    }
  } catch (error) {
    console.error(chalk.red('❌ Error:'), error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

// Execute if run directly
main().catch(console.error);

export { DocumentationCLI };