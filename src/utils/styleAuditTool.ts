/**
 * Style Audit Tool
 * Comprehensive tool for auditing and fixing style inconsistencies across the codebase
 */

import { StyleConsistencyChecker, StyleIssue, ConsistencyReport } from './styleConsistencyChecker';
import { designTokens, classPatterns } from './designSystem';

export interface AuditConfig {
  includePaths: string[];
  excludePaths: string[];
  autoFix: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  types: Array<'spacing' | 'color' | 'typography' | 'layout' | 'glassmorphism'>;
}

export interface AuditResult {
  summary: ConsistencyReport;
  fileResults: Array<{
    filePath: string;
    issues: StyleIssue[];
    fixesApplied: number;
  }>;
  recommendations: string[];
}

export class StyleAuditTool {
  private checker: StyleConsistencyChecker;
  private config: AuditConfig;

  constructor(config: Partial<AuditConfig> = {}) {
    this.checker = new StyleConsistencyChecker();
    this.config = {
      includePaths: ['src/components', 'src/pages', 'src/layouts'],
      excludePaths: ['node_modules', '.git', 'dist', 'build'],
      autoFix: false,
      severity: 'low',
      types: ['spacing', 'color', 'typography', 'layout', 'glassmorphism'],
      ...config,
    };
  }

  /**
   * Run comprehensive style audit
   */
  async runAudit(): Promise<AuditResult> {
    const allIssues: StyleIssue[] = [];
    const fileResults: Array<{
      filePath: string;
      issues: StyleIssue[];
      fixesApplied: number;
    }> = [];

    // Mock file scanning - in real implementation, would scan actual files
    const mockFiles = this.getMockFileData();

    for (const { filePath, content, componentName } of mockFiles) {
      const issues = this.checker.checkComponent(content, componentName, filePath);
      const filteredIssues = this.filterIssues(issues);
      
      let fixesApplied = 0;
      if (this.config.autoFix) {
        fixesApplied = await this.applyAutoFixes(filePath, filteredIssues);
      }

      allIssues.push(...filteredIssues);
      fileResults.push({
        filePath,
        issues: filteredIssues,
        fixesApplied,
      });
    }

    const summary = this.checker.generateReport(allIssues);
    const recommendations = this.generateRecommendations(summary);

    return {
      summary,
      fileResults,
      recommendations,
    };
  }

  /**
   * Filter issues based on configuration
   */
  private filterIssues(issues: StyleIssue[]): StyleIssue[] {
    return issues.filter(issue => {
      // Filter by severity
      const severityLevels = ['low', 'medium', 'high', 'critical'];
      const configSeverityIndex = severityLevels.indexOf(this.config.severity);
      const issueSeverityIndex = severityLevels.indexOf(issue.severity);
      
      if (issueSeverityIndex < configSeverityIndex) {
        return false;
      }

      // Filter by type
      if (!this.config.types.includes(issue.type)) {
        return false;
      }

      return true;
    });
  }

  /**
   * Apply automatic fixes to a file
   */
  private async applyAutoFixes(filePath: string, issues: StyleIssue[]): Promise<number> {
    const autoFixableIssues = issues.filter(issue => issue.autoFixable);
    
    // In real implementation, would read file, apply fixes, and write back
    // For now, just return count of fixes that would be applied
    return autoFixableIssues.length;
  }

  /**
   * Generate recommendations based on audit results
   */
  private generateRecommendations(summary: ConsistencyReport): string[] {
    const recommendations: string[] = [];

    // High-level recommendations
    if (summary.totalIssues > 50) {
      recommendations.push('Consider implementing a comprehensive design system refactor');
    }

    if (summary.issuesByType.spacing > 10) {
      recommendations.push('Standardize spacing using design tokens from designSystem.ts');
    }

    if (summary.issuesByType.color > 10) {
      recommendations.push('Replace hardcoded colors with brand color tokens');
    }

    if (summary.issuesByType.glassmorphism > 5) {
      recommendations.push('Use the standard "glassmorphic" utility class for consistent glass effects');
    }

    if (summary.issuesByType.typography > 8) {
      recommendations.push('Apply standard typography patterns from classPatterns');
    }

    if (summary.autoFixableCount > 20) {
      recommendations.push(`${summary.autoFixableCount} issues can be automatically fixed`);
    }

    // Specific recommendations based on severity
    if (summary.issuesBySeverity.critical > 0) {
      recommendations.push('Address critical issues immediately - they may affect user experience');
    }

    if (summary.issuesBySeverity.high > 5) {
      recommendations.push('High severity issues should be prioritized in the next sprint');
    }

    return recommendations;
  }

  /**
   * Get mock file data for demonstration
   * In real implementation, would scan actual files
   */
  private getMockFileData() {
    return [
      {
        filePath: 'src/components/ui/Card.tsx',
        componentName: 'Card',
        content: `
          <div className="p-4 bg-white border rounded-lg shadow-md">
            <h3 className="text-lg font-bold mb-2">Card Title</h3>
            <p className="text-gray-600">Card content</p>
          </div>
        `,
      },
      {
        filePath: 'src/components/forms/LoginForm.tsx',
        componentName: 'LoginForm',
        content: `
          <form className="max-w-md mx-auto p-6 bg-white/80 backdrop-blur-md rounded-xl">
            <h2 className="text-2xl font-bold mb-4">Login</h2>
            <input className="w-full p-3 border rounded-lg mb-4" />
            <button className="w-full p-3 bg-blue-500 text-white rounded-lg">Submit</button>
          </form>
        `,
      },
      {
        filePath: 'src/pages/HomePage.tsx',
        componentName: 'HomePage',
        content: `
          <div className="min-h-screen bg-gradient-to-br from-gray-900 to-blue-900">
            <div className="max-w-6xl mx-auto px-4 py-12">
              <h1 className="text-4xl font-bold text-white mb-8">Welcome to TradeYa</h1>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="p-6 bg-white/10 backdrop-blur-md rounded-xl">
                  <h3 className="text-xl font-semibold text-white mb-4">Feature 1</h3>
                </div>
              </div>
            </div>
          </div>
        `,
      },
    ];
  }

  /**
   * Generate detailed report
   */
  generateDetailedReport(result: AuditResult): string {
    let report = '# Style Consistency Audit Report\n\n';
    
    // Summary
    report += '## Summary\n';
    report += `- Total Issues: ${result.summary.totalIssues}\n`;
    report += `- Auto-fixable: ${result.summary.autoFixableCount}\n`;
    report += `- Critical: ${result.summary.issuesBySeverity.critical || 0}\n`;
    report += `- High: ${result.summary.issuesBySeverity.high || 0}\n`;
    report += `- Medium: ${result.summary.issuesBySeverity.medium || 0}\n`;
    report += `- Low: ${result.summary.issuesBySeverity.low || 0}\n\n`;

    // Issues by type
    report += '## Issues by Type\n';
    Object.entries(result.summary.issuesByType).forEach(([type, count]) => {
      report += `- ${type}: ${count}\n`;
    });
    report += '\n';

    // Recommendations
    report += '## Recommendations\n';
    result.recommendations.forEach(rec => {
      report += `- ${rec}\n`;
    });
    report += '\n';

    // File-specific issues
    report += '## File-specific Issues\n';
    result.fileResults.forEach(fileResult => {
      if (fileResult.issues.length > 0) {
        report += `### ${fileResult.filePath}\n`;
        report += `Issues: ${fileResult.issues.length}, Fixes Applied: ${fileResult.fixesApplied}\n\n`;
        
        fileResult.issues.forEach(issue => {
          report += `- **${issue.severity.toUpperCase()}** [${issue.type}]: ${issue.description}\n`;
          report += `  - Current: \`${issue.currentValue}\`\n`;
          report += `  - Suggested: \`${issue.suggestedFix}\`\n`;
          report += `  - Auto-fixable: ${issue.autoFixable ? 'Yes' : 'No'}\n\n`;
        });
      }
    });

    return report;
  }

  /**
   * Get quick fix suggestions
   */
  getQuickFixes(): Array<{
    title: string;
    description: string;
    command: string;
    impact: 'low' | 'medium' | 'high';
  }> {
    return [
      {
        title: 'Standardize Spacing',
        description: 'Replace custom spacing with design system tokens',
        command: 'Replace p-3, p-5, etc. with standard spacing (p-2, p-4, p-6)',
        impact: 'medium',
      },
      {
        title: 'Apply Glassmorphic Utility',
        description: 'Use standard glassmorphic class for consistent glass effects',
        command: 'Replace custom backdrop-blur patterns with "glassmorphic" class',
        impact: 'high',
      },
      {
        title: 'Standardize Typography',
        description: 'Apply consistent typography patterns',
        command: 'Use classPatterns.heading1, heading2, etc. for headings',
        impact: 'medium',
      },
      {
        title: 'Brand Color Consistency',
        description: 'Replace hardcoded colors with brand tokens',
        command: 'Use bg-primary, bg-secondary, bg-accent instead of specific colors',
        impact: 'high',
      },
      {
        title: 'Container Standardization',
        description: 'Use standard container patterns',
        command: 'Apply classPatterns.pageContainer for consistent layouts',
        impact: 'low',
      },
    ];
  }

  /**
   * Export configuration for CI/CD integration
   */
  exportConfig(): string {
    return JSON.stringify({
      rules: {
        'spacing-consistency': 'error',
        'color-tokens': 'error',
        'glassmorphic-standard': 'warn',
        'typography-patterns': 'warn',
        'layout-consistency': 'warn',
      },
      designSystem: {
        spacingScale: Object.keys(designTokens.spacing),
        colorTokens: Object.keys(designTokens.colors.brand),
        typographyPatterns: Object.keys(classPatterns).filter(key => 
          key.startsWith('heading') || key.startsWith('body')
        ),
      },
      autoFix: {
        enabled: this.config.autoFix,
        types: this.config.types,
      },
    }, null, 2);
  }
}

// Export utility functions
export const createAuditTool = (config?: Partial<AuditConfig>) => new StyleAuditTool(config);

export const runQuickAudit = async () => {
  const tool = new StyleAuditTool({ autoFix: false, severity: 'medium' });
  return await tool.runAudit();
};

export const runAutoFix = async () => {
  const tool = new StyleAuditTool({ autoFix: true, severity: 'low' });
  return await tool.runAudit();
};
