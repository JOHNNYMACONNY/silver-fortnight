/**
 * Auto Style Fixer
 * Automatically applies consistent styling patterns across components
 */

import { classPatterns, designTokens, componentVariants } from './designSystem';

export interface StyleFix {
  pattern: RegExp;
  replacement: string;
  description: string;
  category: 'spacing' | 'color' | 'typography' | 'layout' | 'glassmorphism';
}

export interface FixResult {
  originalCode: string;
  fixedCode: string;
  appliedFixes: Array<{
    description: string;
    category: string;
    before: string;
    after: string;
  }>;
  fixCount: number;
}

// Comprehensive style fixes
export const STYLE_FIXES: StyleFix[] = [
  // Spacing Fixes
  {
    pattern: /\bp-3\b/g,
    replacement: 'p-4',
    description: 'Standardize padding to design system scale',
    category: 'spacing',
  },
  {
    pattern: /\bp-5\b/g,
    replacement: 'p-6',
    description: 'Standardize padding to design system scale',
    category: 'spacing',
  },
  {
    pattern: /\bm-3\b/g,
    replacement: 'm-4',
    description: 'Standardize margin to design system scale',
    category: 'spacing',
  },
  {
    pattern: /\bm-5\b/g,
    replacement: 'm-6',
    description: 'Standardize margin to design system scale',
    category: 'spacing',
  },
  {
    pattern: /\bgap-3\b/g,
    replacement: 'gap-4',
    description: 'Standardize gap to design system scale',
    category: 'spacing',
  },
  {
    pattern: /\bgap-5\b/g,
    replacement: 'gap-6',
    description: 'Standardize gap to design system scale',
    category: 'spacing',
  },

  // Container Fixes
  {
    pattern: /max-w-\w+\s+mx-auto\s+px-\d+(?:\s+sm:px-\d+)?(?:\s+lg:px-\d+)?/g,
    replacement: classPatterns.pageContainer,
    description: 'Use standard page container pattern',
    category: 'layout',
  },

  // Grid Fixes
  {
    pattern: /grid\s+grid-cols-1\s+md:grid-cols-2\s+lg:grid-cols-3(?!\s+gap-6)/g,
    replacement: classPatterns.responsiveGrid,
    description: 'Use standard responsive grid with consistent gap',
    category: 'layout',
  },

  // Typography Fixes
  {
    pattern: /text-4xl\s+font-bold/g,
    replacement: classPatterns.heading1.split(' ').slice(0, 2).join(' '),
    description: 'Use standard heading 1 pattern',
    category: 'typography',
  },
  {
    pattern: /text-3xl\s+font-semibold/g,
    replacement: classPatterns.heading2.split(' ').slice(0, 2).join(' '),
    description: 'Use standard heading 2 pattern',
    category: 'typography',
  },
  {
    pattern: /text-2xl\s+font-semibold/g,
    replacement: classPatterns.heading3.split(' ').slice(0, 2).join(' '),
    description: 'Use standard heading 3 pattern',
    category: 'typography',
  },
  {
    pattern: /text-xl\s+font-medium/g,
    replacement: classPatterns.heading4.split(' ').slice(0, 2).join(' '),
    description: 'Use standard heading 4 pattern',
    category: 'typography',
  },

  // Glassmorphic Fixes
  {
    pattern: /backdrop-blur-md\s+bg-white\/75\s+dark:bg-neutral-800\/65\s+border\s+border-white\/20\s+dark:border-neutral-700\/30\s+rounded-xl\s+shadow-glass/g,
    replacement: 'glassmorphic',
    description: 'Use standard glassmorphic utility class',
    category: 'glassmorphism',
  },
  {
    pattern: /backdrop-blur-lg\s+bg-white\/80\s+dark:bg-neutral-800\/70\s+border-2\s+border-white\/30\s+dark:border-neutral-700\/40\s+rounded-2xl/g,
    replacement: classPatterns.glassForm,
    description: 'Use standard glass form pattern',
    category: 'glassmorphism',
  },

  // Button Fixes
  {
    pattern: /bg-gradient-to-r\s+from-orange-500\s+to-orange-600\s+hover:from-orange-600\s+hover:to-orange-700\s+text-white\s+font-medium\s+px-6\s+py-3\s+rounded-lg\s+transition-all\s+duration-200/g,
    replacement: componentVariants.button.primary,
    description: 'Use standard primary button variant',
    category: 'color',
  },

  // Color Fixes
  {
    pattern: /bg-blue-500/g,
    replacement: 'bg-secondary',
    description: 'Use brand color token instead of hardcoded blue',
    category: 'color',
  },
  {
    pattern: /bg-orange-500/g,
    replacement: 'bg-primary',
    description: 'Use brand color token instead of hardcoded orange',
    category: 'color',
  },
  {
    pattern: /bg-purple-500/g,
    replacement: 'bg-accent',
    description: 'Use brand color token instead of hardcoded purple',
    category: 'color',
  },
  {
    pattern: /text-blue-500/g,
    replacement: 'text-secondary',
    description: 'Use brand color token instead of hardcoded blue text',
    category: 'color',
  },
  {
    pattern: /text-orange-500/g,
    replacement: 'text-primary',
    description: 'Use brand color token instead of hardcoded orange text',
    category: 'color',
  },
  {
    pattern: /text-purple-500/g,
    replacement: 'text-accent',
    description: 'Use brand color token instead of hardcoded purple text',
    category: 'color',
  },

  // Flex Layout Fixes
  {
    pattern: /flex\s+items-center\s+justify-center/g,
    replacement: classPatterns.centerContent,
    description: 'Use standard center content pattern',
    category: 'layout',
  },
  {
    pattern: /flex\s+items-center\s+justify-between/g,
    replacement: classPatterns.spaceBetween,
    description: 'Use standard space between pattern',
    category: 'layout',
  },

  // Input Fixes
  {
    pattern: /w-full\s+px-4\s+py-3\s+bg-white\/50\s+dark:bg-neutral-800\/50\s+border\s+border-white\/20\s+dark:border-neutral-700\/30\s+rounded-lg\s+focus:ring-2\s+focus:ring-orange-500\/50\s+focus:border-orange-500\/50\s+transition-all\s+duration-200/g,
    replacement: classPatterns.textInput,
    description: 'Use standard text input pattern',
    category: 'layout',
  },
];

export class AutoStyleFixer {
  /**
   * Apply all relevant fixes to code
   */
  applyFixes(code: string, categories?: Array<'spacing' | 'color' | 'typography' | 'layout' | 'glassmorphism'>): FixResult {
    let fixedCode = code;
    const appliedFixes: Array<{
      description: string;
      category: string;
      before: string;
      after: string;
    }> = [];

    const relevantFixes = categories 
      ? STYLE_FIXES.filter(fix => categories.includes(fix.category))
      : STYLE_FIXES;

    for (const fix of relevantFixes) {
      const matches = fixedCode.match(fix.pattern);
      if (matches) {
        matches.forEach(match => {
          appliedFixes.push({
            description: fix.description,
            category: fix.category,
            before: match,
            after: fix.replacement,
          });
        });
        fixedCode = fixedCode.replace(fix.pattern, fix.replacement);
      }
    }

    return {
      originalCode: code,
      fixedCode,
      appliedFixes,
      fixCount: appliedFixes.length,
    };
  }

  /**
   * Apply fixes to specific component patterns
   */
  fixComponentPattern(code: string, componentType: 'card' | 'button' | 'form' | 'layout'): FixResult {
    const categoryMap = {
      card: ['glassmorphism', 'spacing'],
      button: ['color', 'spacing'],
      form: ['glassmorphism', 'layout', 'spacing'],
      layout: ['layout', 'spacing'],
    } as const;

    return this.applyFixes(code, categoryMap[componentType]);
  }

  /**
   * Generate fix suggestions without applying them
   */
  suggestFixes(code: string): Array<{
    description: string;
    category: string;
    pattern: string;
    suggestion: string;
    impact: 'low' | 'medium' | 'high';
  }> {
    const suggestions: Array<{
      description: string;
      category: string;
      pattern: string;
      suggestion: string;
      impact: 'low' | 'medium' | 'high';
    }> = [];

    for (const fix of STYLE_FIXES) {
      const matches = code.match(fix.pattern);
      if (matches) {
        matches.forEach(match => {
          suggestions.push({
            description: fix.description,
            category: fix.category,
            pattern: match,
            suggestion: fix.replacement,
            impact: this.getFixImpact(fix.category),
          });
        });
      }
    }

    return suggestions;
  }

  /**
   * Get impact level for fix category
   */
  private getFixImpact(category: string): 'low' | 'medium' | 'high' {
    const impactMap = {
      spacing: 'medium',
      color: 'high',
      typography: 'medium',
      layout: 'high',
      glassmorphism: 'medium',
    } as const;

    return impactMap[category as keyof typeof impactMap] || 'low';
  }

  /**
   * Validate that fixes maintain functionality
   */
  validateFixes(originalCode: string, fixedCode: string): {
    isValid: boolean;
    warnings: string[];
    errors: string[];
  } {
    const warnings: string[] = [];
    const errors: string[] = [];

    // Check for potential breaking changes
    if (originalCode.includes('onClick') && !fixedCode.includes('onClick')) {
      errors.push('onClick handler may have been removed');
    }

    if (originalCode.includes('className=') && !fixedCode.includes('className=')) {
      errors.push('className attribute may have been removed');
    }

    // Check for style consistency
    const originalClassCount = (originalCode.match(/className="/g) || []).length;
    const fixedClassCount = (fixedCode.match(/className="/g) || []).length;
    
    if (Math.abs(originalClassCount - fixedClassCount) > 2) {
      warnings.push('Significant change in className count detected');
    }

    return {
      isValid: errors.length === 0,
      warnings,
      errors,
    };
  }

  /**
   * Generate comprehensive fix report
   */
  generateFixReport(results: FixResult[]): {
    totalFixes: number;
    fixesByCategory: Record<string, number>;
    mostCommonIssues: Array<{ description: string; count: number }>;
    recommendations: string[];
  } {
    const totalFixes = results.reduce((sum, result) => sum + result.fixCount, 0);
    
    const fixesByCategory: Record<string, number> = {};
    const issueCount: Record<string, number> = {};

    results.forEach(result => {
      result.appliedFixes.forEach(fix => {
        fixesByCategory[fix.category] = (fixesByCategory[fix.category] || 0) + 1;
        issueCount[fix.description] = (issueCount[fix.description] || 0) + 1;
      });
    });

    const mostCommonIssues = Object.entries(issueCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([description, count]) => ({ description, count }));

    const recommendations: string[] = [];
    
    if (fixesByCategory.spacing > 10) {
      recommendations.push('Consider establishing spacing guidelines for the team');
    }
    
    if (fixesByCategory.color > 10) {
      recommendations.push('Implement design token usage in development workflow');
    }
    
    if (fixesByCategory.glassmorphism > 5) {
      recommendations.push('Create reusable glassmorphic components');
    }

    return {
      totalFixes,
      fixesByCategory,
      mostCommonIssues,
      recommendations,
    };
  }
}

// Export utility functions
export const createAutoFixer = () => new AutoStyleFixer();

export const quickFix = (code: string, categories?: Array<'spacing' | 'color' | 'typography' | 'layout' | 'glassmorphism'>) => {
  const fixer = new AutoStyleFixer();
  return fixer.applyFixes(code, categories);
};

export const suggestFixes = (code: string) => {
  const fixer = new AutoStyleFixer();
  return fixer.suggestFixes(code);
};
