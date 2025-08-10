/**
 * Accessibility Testing Utilities
 * Provides automated accessibility validation for components
 */

export interface AccessibilityIssue {
  type: 'error' | 'warning' | 'info';
  rule: string;
  message: string;
  element?: HTMLElement;
  severity: 'critical' | 'serious' | 'moderate' | 'minor';
}

export interface AccessibilityTestResult {
  passed: boolean;
  issues: AccessibilityIssue[];
  score: number; // 0-100
  summary: {
    critical: number;
    serious: number;
    moderate: number;
    minor: number;
  };
}

/**
 * Comprehensive accessibility testing for components
 */
export class AccessibilityTester {
  private container: HTMLElement;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  /**
   * Run all accessibility tests
   */
  async runTests(): Promise<AccessibilityTestResult> {
    const issues: AccessibilityIssue[] = [];

    // Run individual test categories
    issues.push(...this.testKeyboardNavigation());
    issues.push(...this.testAriaLabels());
    issues.push(...this.testColorContrast());
    issues.push(...this.testFocusManagement());
    issues.push(...this.testSemanticStructure());
    issues.push(...this.testFormAccessibility());
    issues.push(...this.testImageAccessibility());

    // Calculate score and summary
    const summary = this.calculateSummary(issues);
    const score = this.calculateScore(summary);

    return {
      passed: issues.filter(i => i.type === 'error').length === 0,
      issues,
      score,
      summary
    };
  }

  /**
   * Test keyboard navigation
   */
  private testKeyboardNavigation(): AccessibilityIssue[] {
    const issues: AccessibilityIssue[] = [];
    const focusableElements = this.container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    focusableElements.forEach((element) => {
      const htmlElement = element as HTMLElement;
      
      // Check if element is focusable
      if (htmlElement.tabIndex < 0 && !htmlElement.hasAttribute('tabindex')) {
        issues.push({
          type: 'warning',
          rule: 'keyboard-navigation',
          message: 'Interactive element may not be keyboard accessible',
          element: htmlElement,
          severity: 'serious'
        });
      }

      // Check for visible focus indicators
      const computedStyle = window.getComputedStyle(htmlElement, ':focus');
      if (!computedStyle.outline && !computedStyle.boxShadow) {
        issues.push({
          type: 'warning',
          rule: 'focus-visible',
          message: 'Element lacks visible focus indicator',
          element: htmlElement,
          severity: 'moderate'
        });
      }
    });

    return issues;
  }

  /**
   * Test ARIA labels and attributes
   */
  private testAriaLabels(): AccessibilityIssue[] {
    const issues: AccessibilityIssue[] = [];

    // Check buttons without accessible names
    const buttons = this.container.querySelectorAll('button');
    buttons.forEach((button) => {
      const hasAccessibleName = 
        button.textContent?.trim() ||
        button.getAttribute('aria-label') ||
        button.getAttribute('aria-labelledby') ||
        button.querySelector('img')?.getAttribute('alt');

      if (!hasAccessibleName) {
        issues.push({
          type: 'error',
          rule: 'button-name',
          message: 'Button must have an accessible name',
          element: button as HTMLElement,
          severity: 'critical'
        });
      }
    });

    // Check form inputs without labels
    const inputs = this.container.querySelectorAll('input, textarea, select');
    inputs.forEach((input) => {
      const hasLabel = 
        input.getAttribute('aria-label') ||
        input.getAttribute('aria-labelledby') ||
        this.container.querySelector(`label[for="${input.id}"]`) ||
        input.closest('label');

      if (!hasLabel) {
        issues.push({
          type: 'error',
          rule: 'form-label',
          message: 'Form control must have an associated label',
          element: input as HTMLElement,
          severity: 'critical'
        });
      }
    });

    // Check for proper heading structure
    const headings = this.container.querySelectorAll('h1, h2, h3, h4, h5, h6');
    let previousLevel = 0;
    headings.forEach((heading) => {
      const currentLevel = parseInt(heading.tagName.charAt(1));
      if (currentLevel > previousLevel + 1) {
        issues.push({
          type: 'warning',
          rule: 'heading-order',
          message: 'Heading levels should not skip levels',
          element: heading as HTMLElement,
          severity: 'moderate'
        });
      }
      previousLevel = currentLevel;
    });

    return issues;
  }

  /**
   * Test color contrast (basic check)
   */
  private testColorContrast(): AccessibilityIssue[] {
    const issues: AccessibilityIssue[] = [];
    const textElements = this.container.querySelectorAll('*');

    textElements.forEach((element) => {
      const htmlElement = element as HTMLElement;
      const computedStyle = window.getComputedStyle(htmlElement);
      const textContent = htmlElement.textContent?.trim();

      if (textContent && textContent.length > 0) {
        const color = computedStyle.color;
        const backgroundColor = computedStyle.backgroundColor;

        // Basic contrast check (simplified)
        if (color === backgroundColor) {
          issues.push({
            type: 'error',
            rule: 'color-contrast',
            message: 'Text color and background color are the same',
            element: htmlElement,
            severity: 'critical'
          });
        }
      }
    });

    return issues;
  }

  /**
   * Test focus management
   */
  private testFocusManagement(): AccessibilityIssue[] {
    const issues: AccessibilityIssue[] = [];

    // Check for focus traps in modals
    const modals = this.container.querySelectorAll('[role="dialog"], [role="alertdialog"]');
    modals.forEach((modal) => {
      const focusableElements = modal.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      if (focusableElements.length === 0) {
        issues.push({
          type: 'warning',
          rule: 'focus-trap',
          message: 'Modal should contain at least one focusable element',
          element: modal as HTMLElement,
          severity: 'serious'
        });
      }
    });

    return issues;
  }

  /**
   * Test semantic structure
   */
  private testSemanticStructure(): AccessibilityIssue[] {
    const issues: AccessibilityIssue[] = [];

    // Check for proper landmark usage
    const landmarks = this.container.querySelectorAll(
      'main, nav, aside, section, article, header, footer, [role="main"], [role="navigation"], [role="complementary"], [role="banner"], [role="contentinfo"]'
    );

    if (landmarks.length === 0) {
      issues.push({
        type: 'info',
        rule: 'landmarks',
        message: 'Consider using landmark elements for better navigation',
        severity: 'minor'
      });
    }

    // Check for list structure
    const listItems = this.container.querySelectorAll('li');
    listItems.forEach((li) => {
      const parent = li.parentElement;
      if (parent && !['UL', 'OL'].includes(parent.tagName)) {
        issues.push({
          type: 'error',
          rule: 'list-structure',
          message: 'List items must be contained within ul or ol elements',
          element: li as HTMLElement,
          severity: 'serious'
        });
      }
    });

    return issues;
  }

  /**
   * Test form accessibility
   */
  private testFormAccessibility(): AccessibilityIssue[] {
    const issues: AccessibilityIssue[] = [];

    // Check for fieldset/legend in form groups
    const forms = this.container.querySelectorAll('form');
    forms.forEach((form) => {
      const radioGroups = form.querySelectorAll('input[type="radio"]');
      const checkboxGroups = form.querySelectorAll('input[type="checkbox"]');

      if (radioGroups.length > 1) {
        const fieldset = form.querySelector('fieldset');
        if (!fieldset) {
          issues.push({
            type: 'warning',
            rule: 'fieldset-legend',
            message: 'Related form controls should be grouped with fieldset/legend',
            element: form as HTMLElement,
            severity: 'moderate'
          });
        }
      }
    });

    return issues;
  }

  /**
   * Test image accessibility
   */
  private testImageAccessibility(): AccessibilityIssue[] {
    const issues: AccessibilityIssue[] = [];

    const images = this.container.querySelectorAll('img');
    images.forEach((img) => {
      const alt = img.getAttribute('alt');
      const ariaLabel = img.getAttribute('aria-label');
      const ariaLabelledby = img.getAttribute('aria-labelledby');

      if (!alt && !ariaLabel && !ariaLabelledby) {
        issues.push({
          type: 'error',
          rule: 'image-alt',
          message: 'Images must have alternative text',
          element: img as HTMLElement,
          severity: 'serious'
        });
      }
    });

    return issues;
  }

  /**
   * Calculate summary of issues
   */
  private calculateSummary(issues: AccessibilityIssue[]) {
    return issues.reduce(
      (summary, issue) => {
        summary[issue.severity]++;
        return summary;
      },
      { critical: 0, serious: 0, moderate: 0, minor: 0 }
    );
  }

  /**
   * Calculate accessibility score (0-100)
   */
  private calculateScore(summary: { critical: number; serious: number; moderate: number; minor: number }) {
    const weights = { critical: 25, serious: 10, moderate: 5, minor: 1 };
    const totalDeductions = 
      summary.critical * weights.critical +
      summary.serious * weights.serious +
      summary.moderate * weights.moderate +
      summary.minor * weights.minor;

    return Math.max(0, 100 - totalDeductions);
  }
}

/**
 * Quick accessibility test for components
 */
export const testComponentAccessibility = async (element: HTMLElement): Promise<AccessibilityTestResult> => {
  const tester = new AccessibilityTester(element);
  return await tester.runTests();
};

/**
 * Generate accessibility report
 */
export const generateAccessibilityReport = (result: AccessibilityTestResult): string => {
  const { issues, score, summary } = result;
  
  let report = `Accessibility Score: ${score}/100\n\n`;
  report += `Summary:\n`;
  report += `- Critical Issues: ${summary.critical}\n`;
  report += `- Serious Issues: ${summary.serious}\n`;
  report += `- Moderate Issues: ${summary.moderate}\n`;
  report += `- Minor Issues: ${summary.minor}\n\n`;

  if (issues.length > 0) {
    report += `Issues Found:\n`;
    issues.forEach((issue, index) => {
      report += `${index + 1}. [${issue.severity.toUpperCase()}] ${issue.message} (${issue.rule})\n`;
    });
  } else {
    report += `No accessibility issues found!\n`;
  }

  return report;
};
