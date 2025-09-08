import { Page, expect } from '@playwright/test';

/**
 * Utility functions for E2E testing
 */

export class TestUtils {
  constructor(private page: Page) {}

  /**
   * Mock authentication state for testing
   */
  async mockAuthentication(user = {
    uid: 'test-user-id',
    email: 'test@example.com',
    displayName: 'Test User'
  }) {
    await this.page.addInitScript((userData) => {
      window.localStorage.setItem('firebase:authUser:test', JSON.stringify(userData));
    }, user);
  }

  /**
   * Mock Firebase Firestore data
   */
  async mockFirestoreData(collection: string, data: Record<string, unknown>[]) {
    await this.page.addInitScript((args: { collectionName: string; documents: Record<string, unknown>[] }) => {
      // Mock Firestore data in localStorage for testing
      window.localStorage.setItem(`mock:firestore:${args.collectionName}`, JSON.stringify(args.documents));
    }, { collectionName: collection, documents: data });
  }

  /**
   * Wait for loading states to complete
   */
  async waitForLoadingComplete() {
    // Wait for any loading spinners to disappear
    await this.page.waitForSelector('[data-testid="loading-spinner"]', { state: 'hidden', timeout: 10000 });
    
    // Wait for skeleton loaders to disappear
    await this.page.waitForSelector('[data-testid="skeleton-loader"]', { state: 'hidden', timeout: 5000 });
    
    // Wait for network requests to complete
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Fill form with data
   */
  async fillForm(formData: Record<string, string>) {
    for (const [field, value] of Object.entries(formData)) {
      const selector = `[data-testid="${field}"]`;
      const element = this.page.locator(selector);
      
      // Check if element exists
      await expect(element).toBeVisible();
      
      // Handle different input types
      const tagName = await element.evaluate(el => el.tagName.toLowerCase());
      const inputType = await element.evaluate(el => el.getAttribute('type'));
      
      if (tagName === 'select') {
        await element.selectOption(value);
      } else if (tagName === 'textarea') {
        await element.fill(value);
      } else if (inputType === 'checkbox') {
        if (value === 'true') {
          await element.check();
        } else {
          await element.uncheck();
        }
      } else {
        await element.fill(value);
      }
    }
  }

  /**
   * Upload files to file input
   */
  async uploadFiles(inputSelector: string, files: Array<{
    name: string;
    mimeType: string;
    buffer: Buffer;
  }>) {
    const fileInput = this.page.locator(inputSelector);
    await fileInput.setInputFiles(files);
  }

  /**
   * Wait for toast notification and verify message
   */
  async waitForToast(expectedMessage?: string) {
    const toast = this.page.locator('[data-testid="toast-notification"]');
    await expect(toast).toBeVisible();
    
    if (expectedMessage) {
      await expect(toast).toContainText(expectedMessage);
    }
    
    return toast;
  }

  /**
   * Navigate through multi-step workflow
   */
  async navigateWorkflow(steps: Array<{
    action: () => Promise<void>;
    verification: () => Promise<void>;
  }>) {
    for (const step of steps) {
      await step.action();
      await step.verification();
    }
  }

  /**
   * Test responsive behavior
   */
  async testResponsive(testFn: () => Promise<void>) {
    const viewports = [
      { width: 375, height: 667 }, // Mobile
      { width: 768, height: 1024 }, // Tablet
      { width: 1920, height: 1080 } // Desktop
    ];

    for (const viewport of viewports) {
      await this.page.setViewportSize(viewport);
      await testFn();
    }
  }

  /**
   * Test accessibility
   */
  async checkAccessibility() {
    // This would integrate with axe-core in a real implementation
    // const elements = this.page.locator('body');

    // Check for basic accessibility attributes
    const interactiveElements = this.page.locator('button, a, input, select, textarea');
    const count = await interactiveElements.count();

    for (let i = 0; i < count; i++) {
      const element = interactiveElements.nth(i);
      const tagName = await element.evaluate(el => el.tagName.toLowerCase());

      if (tagName === 'button' || tagName === 'a') {
        // Check for accessible name
        const hasAriaLabel = await element.getAttribute('aria-label');
        const hasText = await element.textContent();

        if (!hasAriaLabel && !hasText?.trim()) {
          throw new Error(`Interactive element missing accessible name: ${tagName}`);
        }
      }
    }
  }

  /**
   * Mock API responses
   */
  async mockApiResponse(url: string, response: any, status = 200) { // eslint-disable-line @typescript-eslint/no-explicit-any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await this.page.route(url, route => {
      route.fulfill({
        status,
        contentType: 'application/json',
        body: JSON.stringify(response)
      });
    });
  }

  /**
   * Test performance metrics
   */
  async measurePerformance() {
    const performanceMetrics = await this.page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        loadTime: navigation.loadEventEnd - navigation.loadEventStart,
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
        firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0
      };
    });

    return performanceMetrics;
  }

  /**
   * Test keyboard navigation
   */
  async testKeyboardNavigation(startSelector: string, expectedStops: string[]) {
    await this.page.focus(startSelector);
    
    for (const expectedStop of expectedStops) {
      await this.page.keyboard.press('Tab');
      const focusedElement = this.page.locator(':focus');
      await expect(focusedElement).toHaveAttribute('data-testid', expectedStop);
    }
  }

  /**
   * Test drag and drop functionality
   */
  async testDragAndDrop(sourceSelector: string, targetSelector: string) {
    const source = this.page.locator(sourceSelector);
    const target = this.page.locator(targetSelector);
    
    await source.dragTo(target);
  }

  /**
   * Wait for animation to complete
   */
  async waitForAnimation(selector: string) {
    const element = this.page.locator(selector);
    
    // Wait for element to be visible
    await expect(element).toBeVisible();
    
    // Wait for animations to complete
    await this.page.waitForFunction(
      (sel) => {
        const el = document.querySelector(sel);
        if (!el) return true;
        
        const animations = el.getAnimations();
        return animations.every(animation => animation.playState === 'finished');
      },
      selector,
      { timeout: 5000 }
    );
  }

  /**
   * Test error handling
   */
  async testErrorHandling(triggerError: () => Promise<void>, expectedErrorMessage?: string) {
    await triggerError();
    
    const errorElement = this.page.locator('[data-testid="error-message"]');
    await expect(errorElement).toBeVisible();
    
    if (expectedErrorMessage) {
      await expect(errorElement).toContainText(expectedErrorMessage);
    }
  }

  /**
   * Test data persistence
   */
  async testDataPersistence(dataKey: string, expectedValue: unknown) {
    const storedValue = await this.page.evaluate((key: string) => {
      return localStorage.getItem(key);
    }, dataKey);

    expect(JSON.parse(storedValue || '{}')).toEqual(expectedValue);
  }

  /**
   * Simulate network conditions
   */
  async simulateNetworkConditions(condition: 'slow' | 'offline' | 'fast') {
    // const conditions = {
    //   slow: { downloadThroughput: 50000, uploadThroughput: 20000, latency: 500 },
    //   offline: { downloadThroughput: 0, uploadThroughput: 0, latency: 0 },
    //   fast: { downloadThroughput: 10000000, uploadThroughput: 5000000, latency: 20 }
    // };

    await this.page.context().setExtraHTTPHeaders({
      'Connection': condition === 'offline' ? 'close' : 'keep-alive'
    });

    if (condition === 'offline') {
      await this.page.context().setOffline(true);
    } else {
      await this.page.context().setOffline(false);
    }
  }

  /**
   * Test real-time updates
   */
  async testRealTimeUpdates(triggerUpdate: () => Promise<void>, expectedChange: string) {
    // Set up listener for changes
    const initialContent = await this.page.locator(expectedChange).textContent();
    
    // Trigger the update
    await triggerUpdate();
    
    // Wait for content to change
    await this.page.waitForFunction(
      (arg: { selector: string; initial: string | null }) => {
        const element = document.querySelector(arg.selector);
        return element && element.textContent !== arg.initial;
      },
      { selector: expectedChange, initial: initialContent },
      { timeout: 10000 }
    );
  }

  /**
   * Clean up test data
   */
  async cleanup() {
    // Clear localStorage
    await this.page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    
    // Clear cookies
    await this.page.context().clearCookies();
  }
}
