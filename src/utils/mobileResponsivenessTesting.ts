/**
 * Mobile Responsiveness Testing Utilities
 * Provides automated testing for mobile responsiveness and touch interactions
 */

export interface ResponsivenessIssue {
  type: 'error' | 'warning' | 'info';
  category: 'touch-targets' | 'viewport' | 'layout' | 'performance' | 'accessibility';
  message: string;
  element?: HTMLElement;
  severity: 'critical' | 'serious' | 'moderate' | 'minor';
  recommendation?: string;
}

export interface ResponsivenessTestResult {
  passed: boolean;
  issues: ResponsivenessIssue[];
  score: number; // 0-100
  summary: {
    touchTargets: number;
    viewport: number;
    layout: number;
    performance: number;
    accessibility: number;
  };
  deviceResults: {
    mobile: boolean;
    tablet: boolean;
    desktop: boolean;
  };
}

/**
 * Mobile responsiveness testing for components
 */
export class MobileResponsivenessTester {
  private container: HTMLElement;
  private originalViewport: { width: number; height: number };

  constructor(container: HTMLElement) {
    this.container = container;
    this.originalViewport = {
      width: window.innerWidth,
      height: window.innerHeight,
    };
  }

  /**
   * Run comprehensive responsiveness tests
   */
  async runTests(): Promise<ResponsivenessTestResult> {
    const issues: ResponsivenessIssue[] = [];

    // Test different viewport sizes
    const deviceResults = {
      mobile: await this.testViewport(375, 667, 'mobile'), // iPhone SE
      tablet: await this.testViewport(768, 1024, 'tablet'), // iPad
      desktop: await this.testViewport(1920, 1080, 'desktop'), // Desktop
    };

    // Collect issues from all viewport tests
    issues.push(...this.testTouchTargets());
    issues.push(...this.testLayoutResponsiveness());
    issues.push(...this.testPerformanceOptimizations());
    issues.push(...this.testMobileAccessibility());

    // Calculate summary and score
    const summary = this.calculateSummary(issues);
    const score = this.calculateScore(summary, deviceResults);

    // Restore original viewport
    this.restoreViewport();

    return {
      passed: issues.filter(i => i.type === 'error').length === 0,
      issues,
      score,
      summary,
      deviceResults,
    };
  }

  /**
   * Test specific viewport size
   */
  private async testViewport(width: number, height: number, device: string): Promise<boolean> {
    // Simulate viewport change
    Object.defineProperty(window, 'innerWidth', { value: width, writable: true });
    Object.defineProperty(window, 'innerHeight', { value: height, writable: true });
    
    // Trigger resize event
    window.dispatchEvent(new Event('resize'));
    
    // Wait for layout to settle
    await new Promise(resolve => setTimeout(resolve, 100));

    // Check if layout is functional
    const isScrollable = this.container.scrollHeight > this.container.clientHeight;
    const hasOverflow = this.checkForOverflow();
    const hasProperSpacing = this.checkSpacing();

    return !hasOverflow && hasProperSpacing;
  }

  /**
   * Test touch target sizes
   */
  private testTouchTargets(): ResponsivenessIssue[] {
    const issues: ResponsivenessIssue[] = [];
    const minTouchTarget = 44; // iOS guidelines

    const interactiveElements = this.container.querySelectorAll(
      'button, a, input, select, textarea, [role="button"], [tabindex]:not([tabindex="-1"])'
    );

    interactiveElements.forEach((element) => {
      const htmlElement = element as HTMLElement;
      const rect = htmlElement.getBoundingClientRect();
      const computedStyle = window.getComputedStyle(htmlElement);

      // Check minimum touch target size
      if (rect.width < minTouchTarget || rect.height < minTouchTarget) {
        const minDimension = Math.min(rect.width, rect.height);
        
        issues.push({
          type: minDimension < 32 ? 'error' : 'warning',
          category: 'touch-targets',
          message: `Touch target too small: ${Math.round(rect.width)}x${Math.round(rect.height)}px (minimum: ${minTouchTarget}x${minTouchTarget}px)`,
          element: htmlElement,
          severity: minDimension < 32 ? 'critical' : 'serious',
          recommendation: 'Increase padding or minimum dimensions to meet touch target guidelines',
        });
      }

      // Check touch target spacing
      const siblings = Array.from(htmlElement.parentElement?.children || [])
        .filter(el => el !== htmlElement && this.isInteractive(el as HTMLElement));

      siblings.forEach(sibling => {
        const siblingRect = (sibling as HTMLElement).getBoundingClientRect();
        const distance = this.calculateDistance(rect, siblingRect);
        
        if (distance < 8) { // Minimum 8px spacing
          issues.push({
            type: 'warning',
            category: 'touch-targets',
            message: `Touch targets too close: ${Math.round(distance)}px spacing (minimum: 8px)`,
            element: htmlElement,
            severity: 'moderate',
            recommendation: 'Increase spacing between interactive elements',
          });
        }
      });
    });

    return issues;
  }

  /**
   * Test layout responsiveness
   */
  private testLayoutResponsiveness(): ResponsivenessIssue[] {
    const issues: ResponsivenessIssue[] = [];

    // Check for horizontal overflow
    if (this.checkForOverflow()) {
      issues.push({
        type: 'error',
        category: 'layout',
        message: 'Horizontal overflow detected on mobile viewport',
        severity: 'critical',
        recommendation: 'Use responsive design patterns and avoid fixed widths',
      });
    }

    // Check for proper text scaling
    const textElements = this.container.querySelectorAll('p, span, div, h1, h2, h3, h4, h5, h6');
    textElements.forEach(element => {
      const computedStyle = window.getComputedStyle(element as HTMLElement);
      const fontSize = parseFloat(computedStyle.fontSize);
      
      if (fontSize < 14) {
        issues.push({
          type: 'warning',
          category: 'layout',
          message: `Text too small for mobile: ${fontSize}px (minimum: 14px)`,
          element: element as HTMLElement,
          severity: 'moderate',
          recommendation: 'Use responsive font sizes or increase base font size',
        });
      }
    });

    // Check for proper image responsiveness
    const images = this.container.querySelectorAll('img');
    images.forEach(img => {
      const rect = img.getBoundingClientRect();
      const containerRect = this.container.getBoundingClientRect();
      
      if (rect.width > containerRect.width) {
        issues.push({
          type: 'warning',
          category: 'layout',
          message: 'Image wider than container on mobile',
          element: img,
          severity: 'moderate',
          recommendation: 'Use responsive image techniques (max-width: 100%)',
        });
      }
    });

    return issues;
  }

  /**
   * Test performance optimizations
   */
  private testPerformanceOptimizations(): ResponsivenessIssue[] {
    const issues: ResponsivenessIssue[] = [];

    // Check for reduced motion support
    const animatedElements = this.container.querySelectorAll('[class*="animate"], [class*="transition"]');
    let hasReducedMotionSupport = false;

    animatedElements.forEach(element => {
      const computedStyle = window.getComputedStyle(element as HTMLElement);
      if (computedStyle.getPropertyValue('--motion-reduce') || 
          element.classList.toString().includes('motion-reduce')) {
        hasReducedMotionSupport = true;
      }
    });

    if (animatedElements.length > 0 && !hasReducedMotionSupport) {
      issues.push({
        type: 'warning',
        category: 'performance',
        message: 'Animations detected without reduced motion support',
        severity: 'moderate',
        recommendation: 'Add @media (prefers-reduced-motion: reduce) support',
      });
    }

    // Check for touch-action optimization
    const touchElements = this.container.querySelectorAll('button, a, [role="button"]');
    touchElements.forEach(element => {
      const computedStyle = window.getComputedStyle(element as HTMLElement);
      const touchAction = computedStyle.touchAction;
      
      if (touchAction === 'auto') {
        issues.push({
          type: 'info',
          category: 'performance',
          message: 'Consider adding touch-action: manipulation for better touch response',
          element: element as HTMLElement,
          severity: 'minor',
          recommendation: 'Add touch-action: manipulation CSS property',
        });
      }
    });

    return issues;
  }

  /**
   * Test mobile accessibility
   */
  private testMobileAccessibility(): ResponsivenessIssue[] {
    const issues: ResponsivenessIssue[] = [];

    // Check for proper viewport meta tag
    const viewportMeta = document.querySelector('meta[name="viewport"]');
    if (!viewportMeta) {
      issues.push({
        type: 'error',
        category: 'accessibility',
        message: 'Missing viewport meta tag',
        severity: 'critical',
        recommendation: 'Add <meta name="viewport" content="width=device-width, initial-scale=1">',
      });
    }

    // Check for zoom prevention
    const viewportContent = viewportMeta?.getAttribute('content') || '';
    if (viewportContent.includes('user-scalable=no') || viewportContent.includes('maximum-scale=1')) {
      issues.push({
        type: 'warning',
        category: 'accessibility',
        message: 'Zoom disabled or restricted',
        severity: 'serious',
        recommendation: 'Allow users to zoom for accessibility',
      });
    }

    return issues;
  }

  /**
   * Helper methods
   */
  private isInteractive(element: HTMLElement): boolean {
    const interactiveTags = ['button', 'a', 'input', 'select', 'textarea'];
    const hasRole = element.getAttribute('role') === 'button';
    const hasTabIndex = element.hasAttribute('tabindex') && element.getAttribute('tabindex') !== '-1';
    
    return interactiveTags.includes(element.tagName.toLowerCase()) || hasRole || hasTabIndex;
  }

  private calculateDistance(rect1: DOMRect, rect2: DOMRect): number {
    const centerX1 = rect1.left + rect1.width / 2;
    const centerY1 = rect1.top + rect1.height / 2;
    const centerX2 = rect2.left + rect2.width / 2;
    const centerY2 = rect2.top + rect2.height / 2;
    
    return Math.sqrt(Math.pow(centerX2 - centerX1, 2) + Math.pow(centerY2 - centerY1, 2));
  }

  private checkForOverflow(): boolean {
    return this.container.scrollWidth > this.container.clientWidth;
  }

  private checkSpacing(): boolean {
    // Basic spacing check - ensure elements aren't overlapping
    const elements = Array.from(this.container.querySelectorAll('*'));
    for (let i = 0; i < elements.length - 1; i++) {
      const rect1 = elements[i].getBoundingClientRect();
      const rect2 = elements[i + 1].getBoundingClientRect();
      
      // Check for overlap
      if (rect1.right > rect2.left && rect1.left < rect2.right &&
          rect1.bottom > rect2.top && rect1.top < rect2.bottom) {
        return false;
      }
    }
    return true;
  }

  private restoreViewport(): void {
    Object.defineProperty(window, 'innerWidth', { 
      value: this.originalViewport.width, 
      writable: true 
    });
    Object.defineProperty(window, 'innerHeight', { 
      value: this.originalViewport.height, 
      writable: true 
    });
    window.dispatchEvent(new Event('resize'));
  }

  private calculateSummary(issues: ResponsivenessIssue[]) {
    return issues.reduce(
      (summary, issue) => {
        summary[issue.category]++;
        return summary;
      },
      { touchTargets: 0, viewport: 0, layout: 0, performance: 0, accessibility: 0 }
    );
  }

  private calculateScore(
    summary: { touchTargets: number; viewport: number; layout: number; performance: number; accessibility: number },
    deviceResults: { mobile: boolean; tablet: boolean; desktop: boolean }
  ): number {
    const weights = { touchTargets: 25, viewport: 20, layout: 20, performance: 15, accessibility: 20 };
    const totalDeductions = Object.entries(summary).reduce(
      (total, [category, count]) => total + count * weights[category as keyof typeof weights],
      0
    );

    // Bonus for device compatibility
    const deviceBonus = Object.values(deviceResults).filter(Boolean).length * 5;

    return Math.max(0, Math.min(100, 100 - totalDeductions + deviceBonus));
  }
}

/**
 * Quick mobile responsiveness test
 */
export const testMobileResponsiveness = async (element: HTMLElement): Promise<ResponsivenessTestResult> => {
  const tester = new MobileResponsivenessTester(element);
  return await tester.runTests();
};

/**
 * Generate responsiveness report
 */
export const generateResponsivenessReport = (result: ResponsivenessTestResult): string => {
  const { issues, score, summary, deviceResults } = result;
  
  let report = `Mobile Responsiveness Score: ${score}/100\n\n`;
  
  report += `Device Compatibility:\n`;
  report += `- Mobile: ${deviceResults.mobile ? '✅' : '❌'}\n`;
  report += `- Tablet: ${deviceResults.tablet ? '✅' : '❌'}\n`;
  report += `- Desktop: ${deviceResults.desktop ? '✅' : '❌'}\n\n`;
  
  report += `Issue Summary:\n`;
  report += `- Touch Targets: ${summary.touchTargets}\n`;
  report += `- Viewport: ${summary.viewport}\n`;
  report += `- Layout: ${summary.layout}\n`;
  report += `- Performance: ${summary.performance}\n`;
  report += `- Accessibility: ${summary.accessibility}\n\n`;

  if (issues.length > 0) {
    report += `Issues Found:\n`;
    issues.forEach((issue, index) => {
      report += `${index + 1}. [${issue.severity.toUpperCase()}] ${issue.message}\n`;
      if (issue.recommendation) {
        report += `   💡 ${issue.recommendation}\n`;
      }
    });
  } else {
    report += `No responsiveness issues found!\n`;
  }

  return report;
};
