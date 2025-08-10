/**
 * Style Consistency Checker
 * Identifies and provides fixes for styling inconsistencies across components
 */

import { designTokens, classPatterns, componentVariants } from './designSystem';

export interface StyleIssue {
  type: 'spacing' | 'color' | 'typography' | 'layout' | 'glassmorphism';
  severity: 'low' | 'medium' | 'high' | 'critical';
  component: string;
  filePath: string;
  line?: number;
  description: string;
  currentValue: string;
  suggestedFix: string;
  autoFixable: boolean;
}

export interface ConsistencyReport {
  totalIssues: number;
  issuesByType: Record<string, number>;
  issuesBySeverity: Record<string, number>;
  issues: StyleIssue[];
  autoFixableCount: number;
}

// Patterns to detect inconsistencies
const INCONSISTENCY_PATTERNS = {
  // Hardcoded spacing values
  hardcodedSpacing: /\b(p|m|gap|space)-\d+(\.\d+)?(px|rem|em)\b/g,
  
  // Direct color values instead of design tokens
  hardcodedColors: /#[0-9a-fA-F]{3,6}|rgb\([^)]+\)|rgba\([^)]+\)/g,
  
  // Inconsistent glassmorphic patterns
  inconsistentGlass: /backdrop-blur-\w+\s+bg-\w+\/\d+/g,
  
  // Non-standard spacing classes
  nonStandardSpacing: /\b(p|m|gap|space)-(1|2|3|5|7|9|11|13|14|15|17|18|19|21|22|23)\b/g,
  
  // Inconsistent typography
  inconsistentTypography: /text-(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl)\s+font-(thin|extralight|light|normal|medium|semibold|bold|extrabold|black)/g,
};

// Standard patterns that should be used
const STANDARD_PATTERNS = {
  spacing: Object.keys(designTokens.spacing),
  colors: [
    ...Object.keys(designTokens.colors.brand),
    ...Object.keys(designTokens.colors.semantic),
    'primary', 'secondary', 'accent', 'muted', 'foreground', 'background'
  ],
  glassmorphic: [
    classPatterns.glassCard,
    classPatterns.glassForm,
    classPatterns.glassNavbar,
    'glassmorphic'
  ],
  typography: [
    classPatterns.heading1,
    classPatterns.heading2,
    classPatterns.heading3,
    classPatterns.heading4,
    classPatterns.bodyLarge,
    classPatterns.bodyMedium,
    classPatterns.bodySmall,
    classPatterns.caption
  ]
};

export class StyleConsistencyChecker {
  private issues: StyleIssue[] = [];

  /**
   * Check a component's code for style inconsistencies
   */
  checkComponent(code: string, componentName: string, filePath: string): StyleIssue[] {
    this.issues = [];
    
    this.checkSpacingConsistency(code, componentName, filePath);
    this.checkColorConsistency(code, componentName, filePath);
    this.checkTypographyConsistency(code, componentName, filePath);
    this.checkGlassmorphismConsistency(code, componentName, filePath);
    this.checkLayoutConsistency(code, componentName, filePath);
    
    return this.issues;
  }

  /**
   * Check for spacing inconsistencies
   */
  private checkSpacingConsistency(code: string, componentName: string, filePath: string) {
    // Check for hardcoded spacing values
    const hardcodedMatches = code.match(INCONSISTENCY_PATTERNS.hardcodedSpacing);
    if (hardcodedMatches) {
      hardcodedMatches.forEach(match => {
        this.issues.push({
          type: 'spacing',
          severity: 'medium',
          component: componentName,
          filePath,
          description: `Hardcoded spacing value: ${match}`,
          currentValue: match,
          suggestedFix: this.suggestSpacingFix(match),
          autoFixable: true,
        });
      });
    }

    // Check for non-standard spacing classes
    const nonStandardMatches = code.match(INCONSISTENCY_PATTERNS.nonStandardSpacing);
    if (nonStandardMatches) {
      nonStandardMatches.forEach(match => {
        this.issues.push({
          type: 'spacing',
          severity: 'low',
          component: componentName,
          filePath,
          description: `Non-standard spacing class: ${match}`,
          currentValue: match,
          suggestedFix: this.suggestStandardSpacing(match),
          autoFixable: true,
        });
      });
    }
  }

  /**
   * Check for color inconsistencies
   */
  private checkColorConsistency(code: string, componentName: string, filePath: string) {
    // Check for hardcoded color values
    const colorMatches = code.match(INCONSISTENCY_PATTERNS.hardcodedColors);
    if (colorMatches) {
      colorMatches.forEach(match => {
        this.issues.push({
          type: 'color',
          severity: 'high',
          component: componentName,
          filePath,
          description: `Hardcoded color value: ${match}`,
          currentValue: match,
          suggestedFix: this.suggestColorFix(match),
          autoFixable: false, // Requires manual review
        });
      });
    }

    // Check for inconsistent brand color usage
    const brandColorPattern = /bg-(red|green|blue|yellow|purple|pink|indigo|gray|slate|zinc|neutral|stone|orange|amber|lime|emerald|teal|cyan|sky|violet|fuchsia|rose)-\d+/g;
    const brandColorMatches = code.match(brandColorPattern);
    if (brandColorMatches) {
      brandColorMatches.forEach(match => {
        if (!this.isApprovedBrandColor(match)) {
          this.issues.push({
            type: 'color',
            severity: 'medium',
            component: componentName,
            filePath,
            description: `Non-brand color usage: ${match}`,
            currentValue: match,
            suggestedFix: this.suggestBrandColorFix(match),
            autoFixable: true,
          });
        }
      });
    }
  }

  /**
   * Check for typography inconsistencies
   */
  private checkTypographyConsistency(code: string, componentName: string, filePath: string) {
    // Check for inconsistent heading patterns
    const headingPattern = /<h[1-6][^>]*className="([^"]*)"[^>]*>/g;
    let headingMatch;
    while ((headingMatch = headingPattern.exec(code)) !== null) {
      const className = headingMatch[1];
      if (!this.hasStandardTypography(className)) {
        this.issues.push({
          type: 'typography',
          severity: 'medium',
          component: componentName,
          filePath,
          description: `Inconsistent heading typography: ${className}`,
          currentValue: className,
          suggestedFix: this.suggestTypographyFix(headingMatch[0]),
          autoFixable: true,
        });
      }
    }
  }

  /**
   * Check for glassmorphism inconsistencies
   */
  private checkGlassmorphismConsistency(code: string, componentName: string, filePath: string) {
    // Check for inconsistent glassmorphic patterns
    const glassMatches = code.match(INCONSISTENCY_PATTERNS.inconsistentGlass);
    if (glassMatches) {
      glassMatches.forEach(match => {
        if (!STANDARD_PATTERNS.glassmorphic.some(pattern => match.includes(pattern))) {
          this.issues.push({
            type: 'glassmorphism',
            severity: 'medium',
            component: componentName,
            filePath,
            description: `Inconsistent glassmorphic pattern: ${match}`,
            currentValue: match,
            suggestedFix: 'Use standard glassmorphic utility class: "glassmorphic"',
            autoFixable: true,
          });
        }
      });
    }

    // Check for missing glassmorphic effects on cards
    if (code.includes('<Card') && !code.includes('variant="glass"') && !code.includes('glassmorphic')) {
      this.issues.push({
        type: 'glassmorphism',
        severity: 'low',
        component: componentName,
        filePath,
        description: 'Card component missing glassmorphic variant',
        currentValue: 'Card without glass variant',
        suggestedFix: 'Add variant="glass" or variant="premium" to Card component',
        autoFixable: false,
      });
    }
  }

  /**
   * Check for layout inconsistencies
   */
  private checkLayoutConsistency(code: string, componentName: string, filePath: string) {
    // Check for inconsistent container patterns
    if (code.includes('max-w-') && !code.includes(classPatterns.pageContainer)) {
      this.issues.push({
        type: 'layout',
        severity: 'medium',
        component: componentName,
        filePath,
        description: 'Inconsistent container pattern',
        currentValue: 'Custom container classes',
        suggestedFix: `Use standard container pattern: "${classPatterns.pageContainer}"`,
        autoFixable: true,
      });
    }

    // Check for inconsistent grid patterns
    if (code.includes('grid grid-cols-') && !code.includes('gap-6')) {
      this.issues.push({
        type: 'layout',
        severity: 'low',
        component: componentName,
        filePath,
        description: 'Grid missing standard gap',
        currentValue: 'Grid without gap-6',
        suggestedFix: 'Add gap-6 to grid layouts for consistency',
        autoFixable: true,
      });
    }
  }

  /**
   * Generate suggestions for spacing fixes
   */
  private suggestSpacingFix(value: string): string {
    const spacingMap: Record<string, string> = {
      'p-1': 'p-1', // 4px - keep
      'p-2': 'p-2', // 8px - keep
      'p-3': 'p-2', // 12px -> 8px
      'p-4': 'p-4', // 16px - keep
      'p-5': 'p-4', // 20px -> 16px
      'p-6': 'p-6', // 24px - keep
      'p-8': 'p-8', // 32px - keep
    };
    
    return spacingMap[value] || 'Use standard spacing scale (1, 2, 4, 6, 8, 12, 16, 20, 24)';
  }

  /**
   * Generate suggestions for standard spacing
   */
  private suggestStandardSpacing(value: string): string {
    const prefix = value.split('-')[0];
    const number = parseInt(value.split('-')[1]);
    
    if (number <= 2) return `${prefix}-2`;
    if (number <= 4) return `${prefix}-4`;
    if (number <= 6) return `${prefix}-6`;
    if (number <= 8) return `${prefix}-8`;
    if (number <= 12) return `${prefix}-12`;
    if (number <= 16) return `${prefix}-16`;
    if (number <= 20) return `${prefix}-20`;
    return `${prefix}-24`;
  }

  /**
   * Generate suggestions for color fixes
   */
  private suggestColorFix(value: string): string {
    if (value.includes('#f97316') || value.includes('249, 115, 22')) {
      return 'Use bg-primary or text-primary';
    }
    if (value.includes('#0ea5e9') || value.includes('14, 165, 233')) {
      return 'Use bg-secondary or text-secondary';
    }
    if (value.includes('#8b5cf6') || value.includes('139, 92, 246')) {
      return 'Use bg-accent or text-accent';
    }
    return 'Use design system color tokens (primary, secondary, accent, etc.)';
  }

  /**
   * Generate suggestions for brand color fixes
   */
  private suggestBrandColorFix(value: string): string {
    if (value.includes('orange')) return 'bg-primary';
    if (value.includes('blue')) return 'bg-secondary';
    if (value.includes('purple')) return 'bg-accent';
    if (value.includes('green')) return 'bg-success';
    if (value.includes('red')) return 'bg-destructive';
    return 'Use brand color tokens';
  }

  /**
   * Generate suggestions for typography fixes
   */
  private suggestTypographyFix(element: string): string {
    if (element.includes('<h1')) return `className="${classPatterns.heading1}"`;
    if (element.includes('<h2')) return `className="${classPatterns.heading2}"`;
    if (element.includes('<h3')) return `className="${classPatterns.heading3}"`;
    if (element.includes('<h4')) return `className="${classPatterns.heading4}"`;
    return 'Use standard typography patterns from design system';
  }

  /**
   * Check if color is approved brand color
   */
  private isApprovedBrandColor(colorClass: string): boolean {
    const approvedColors = ['orange', 'blue', 'purple', 'green', 'gray', 'red'];
    return approvedColors.some(color => colorClass.includes(color));
  }

  /**
   * Check if typography follows standard patterns
   */
  private hasStandardTypography(className: string): boolean {
    return STANDARD_PATTERNS.typography.some(pattern => 
      className.includes(pattern.split(' ')[0]) // Check first class
    );
  }

  /**
   * Generate comprehensive report
   */
  generateReport(allIssues: StyleIssue[]): ConsistencyReport {
    const issuesByType = allIssues.reduce((acc, issue) => {
      acc[issue.type] = (acc[issue.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const issuesBySeverity = allIssues.reduce((acc, issue) => {
      acc[issue.severity] = (acc[issue.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const autoFixableCount = allIssues.filter(issue => issue.autoFixable).length;

    return {
      totalIssues: allIssues.length,
      issuesByType,
      issuesBySeverity,
      issues: allIssues,
      autoFixableCount,
    };
  }

  /**
   * Generate auto-fix suggestions
   */
  generateAutoFixes(issues: StyleIssue[]): Array<{
    filePath: string;
    fixes: Array<{ find: string; replace: string; description: string }>;
  }> {
    const fixesByFile = issues
      .filter(issue => issue.autoFixable)
      .reduce((acc, issue) => {
        if (!acc[issue.filePath]) {
          acc[issue.filePath] = [];
        }
        acc[issue.filePath].push({
          find: issue.currentValue,
          replace: issue.suggestedFix,
          description: issue.description,
        });
        return acc;
      }, {} as Record<string, Array<{ find: string; replace: string; description: string }>>);

    return Object.entries(fixesByFile).map(([filePath, fixes]) => ({
      filePath,
      fixes,
    }));
  }
}
