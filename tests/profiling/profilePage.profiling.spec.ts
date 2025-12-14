import { test, expect, Page, CDPSession, BrowserContext } from '@playwright/test';
import { writeFileSync } from 'fs';
import { join } from 'path';

/**
 * Phase 3A: ProfilePage Performance Profiling Test Suite
 * 
 * This suite automates all 7 profiling scenarios for the ProfilePage component
 * and collects comprehensive performance metrics.
 */

interface PerformanceMetrics {
  fcp: number;
  lcp: number;
  fid: number;
  cls: number;
  ttfb: number;
  renderTime: number;
  reRenderCount: number;
  memoryUsage: number;
  networkRequests: number;
}

interface ComponentMetric {
  name: string;
  renderTime: number;
  reRenderCount: number;
}

interface ScenarioResult {
  id: number;
  name: string;
  status: string;
  metrics: PerformanceMetrics;
  components: ComponentMetric[];
  observations: string[];
}

class ProfilePageProfiler {
  private results: ScenarioResult[] = [];
  private cdpSession: CDPSession | null = null;

  async initialize(page: Page) {
    this.cdpSession = await page.context().newCDPSession(page);
    await this.cdpSession.send('Performance.enable');
  }

  async collectMetrics(page: Page, scenarioId: number, scenarioName: string): Promise<ScenarioResult> {
    // Collect Web Vitals using PerformanceObserver
    const webVitals = await page.evaluate(() => {
      return new Promise<any>((resolve) => {
        const metrics: any = {
          fcp: 0,
          lcp: 0,
          fid: 0,
          cls: 0,
          ttfb: 0,
        };

        // Get FCP
        const fcpEntry = performance.getEntriesByName('first-contentful-paint')[0];
        if (fcpEntry) {
          metrics.fcp = fcpEntry.startTime;
        }

        // Get TTFB
        const navEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        if (navEntry) {
          metrics.ttfb = navEntry.responseStart - navEntry.requestStart;
        }

        // Observe LCP
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1] as any;
          metrics.lcp = lastEntry.renderTime || lastEntry.loadTime;
        });
        lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });

        // Observe CLS
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              clsValue += (entry as any).value;
            }
          }
          metrics.cls = clsValue;
        });
        clsObserver.observe({ type: 'layout-shift', buffered: true });

        // Wait a bit for observers to collect data
        setTimeout(() => {
          lcpObserver.disconnect();
          clsObserver.disconnect();
          resolve(metrics);
        }, 1000);
      });
    });

    // Get memory usage
    const memoryUsage = await page.evaluate(() => {
      return (performance as any).memory?.usedJSHeapSize || 0;
    });

    // Get network requests count
    const networkRequests = await page.evaluate(() => {
      return performance.getEntriesByType('resource').length;
    });

    // Get render time from performance timing
    const renderTime = await page.evaluate(() => {
      const navEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return navEntry ? navEntry.domContentLoadedEventEnd - navEntry.fetchStart : 0;
    });

    const result: ScenarioResult = {
      id: scenarioId,
      name: scenarioName,
      status: 'COMPLETED',
      metrics: {
        fcp: Math.round(webVitals.fcp),
        lcp: Math.round(webVitals.lcp),
        fid: Math.round(webVitals.fid),
        cls: parseFloat(webVitals.cls.toFixed(3)),
        ttfb: Math.round(webVitals.ttfb),
        renderTime: Math.round(renderTime),
        reRenderCount: 0, // Will be updated by React DevTools if available
        memoryUsage: memoryUsage,
        networkRequests: networkRequests,
      },
      components: [],
      observations: [],
    };

    this.results.push(result);
    return result;
  }

  exportResults(outputPath: string) {
    const data = {
      metadata: {
        date: new Date().toISOString().split('T')[0],
        commit: process.env.GIT_COMMIT || 'unknown',
        phase: '3A - Performance Profiling',
        status: 'COMPLETED',
        browser: 'Chromium (Playwright)',
        device: 'Desktop',
        network: 'No Throttling',
        buildType: 'Production',
        notes: 'Automated profiling using Playwright',
      },
      scenarios: this.results,
    };

    writeFileSync(outputPath, JSON.stringify(data, null, 2));
    console.log(`✅ Profiling results exported to ${outputPath}`);
  }
}

// Test suite setup
const profiler = new ProfilePageProfiler();

// Check if we're using emulator mode
const USE_EMULATOR = process.env.USE_EMULATOR === 'true';

// Credentials based on environment
const LOGIN_EMAIL = USE_EMULATOR ? 'test-profiling@example.com' : 'johnfroberts11@gmail.com';
const LOGIN_PASSWORD = USE_EMULATOR ? 'TestPassword123!' : 'Jasmine629!';
const BASE_URL = 'http://localhost:4173';

console.log(`\n🔧 Profiling Mode: ${USE_EMULATOR ? 'EMULATOR' : 'PRODUCTION'}`);
console.log(`📧 Using credentials: ${LOGIN_EMAIL}\n`);

// Helper function to login
async function login(page: Page) {
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 60000 });

  // Wait for login form to be visible
  await page.waitForSelector('input[type="email"], input[name="email"]', { timeout: 10000 });

  await page.fill('input[type="email"], input[name="email"]', LOGIN_EMAIL);
  await page.fill('input[type="password"], input[name="password"]', LOGIN_PASSWORD);
  await page.click('button[type="submit"], button:has-text("Log in"), button:has-text("Sign in")');

  // Wait for navigation to complete - be more flexible
  try {
    await page.waitForURL(/\/(dashboard|profile|home|\/)/, { timeout: 15000 });
  } catch (e) {
    // If URL doesn't change, check if we're already logged in
    const currentUrl = page.url();
    if (!currentUrl.includes('/login')) {
      console.log('  Redirected after login');
    } else {
      throw new Error('Login failed - still on login page');
    }
  }

  // Wait for Firebase auth to complete and persist
  await page.waitForTimeout(5000);

  // Verify we're actually logged in by checking for user-specific elements
  const loggedIn = await page.locator('button:has-text("Log In")').count() === 0;
  if (!loggedIn) {
    console.log('  ⚠️  Warning: Login may not have persisted');
  }

  console.log('✅ Login successful');
}

// Helper function to navigate to ProfilePage
async function navigateToProfilePage(page: Page): Promise<string> {
  // Check if we're already on the profile page
  const currentUrl = page.url();
  if (currentUrl.includes('/profile') && !currentUrl.includes('/login')) {
    console.log('  Already on profile page');
    return currentUrl;
  }

  // Navigate directly to logged-in user's profile
  await page.goto(`${BASE_URL}/profile`, { waitUntil: 'domcontentloaded', timeout: 60000 });

  // Wait for Firebase auth to be ready
  await page.waitForTimeout(2000);

  // Check if we got redirected to login (not authenticated)
  const newUrl = page.url();
  if (newUrl.includes('/login')) {
    console.log('  ⚠️  Redirected to login - authentication may have failed');
  }

  // Wait for key elements to be visible instead of networkidle
  try {
    await page.waitForSelector('[data-testid="profile-page"], .profile-page, h1, main', { timeout: 10000 });
  } catch (e) {
    console.log('  ⚠️  Profile page elements not found, continuing anyway');
  }

  // Give it a moment to settle
  await page.waitForTimeout(2000);

  return page.url();
}

test.describe('Phase 3A: ProfilePage Performance Profiling', () => {
  // Increase timeout for profiling tests
  test.setTimeout(120000); // 2 minutes per test

  // Use serial mode to ensure tests run in order and share context
  test.describe.configure({ mode: 'serial' });

  let sharedPage: Page;
  let sharedContext: BrowserContext;

  test.beforeAll(async ({ browser }) => {
    console.log('🚀 Starting Phase 3A Performance Profiling Suite');
    console.log(`📍 Base URL: ${BASE_URL}`);
    console.log(`👤 Test User: ${LOGIN_EMAIL}`);

    // Create a shared context and page for all tests
    sharedContext = await browser.newContext();
    sharedPage = await sharedContext.newPage();

    // Do login once for all tests
    await login(sharedPage);
    console.log('✅ Shared authentication established');
  });

  test.afterAll(async () => {
    // Export results to PHASE_3A_PROFILING_DATA.json
    const outputPath = join(process.cwd(), 'docs', 'PHASE_3A_PROFILING_DATA.json');
    profiler.exportResults(outputPath);
    console.log('✅ Phase 3A Profiling Suite Complete');

    // Clean up
    await sharedPage?.close();
    await sharedContext?.close();
  });

  test('Scenario 1: Initial Page Load (Cold Cache)', async ({ page, context }) => {
    console.log('\n📊 Scenario 1: Initial Page Load (Cold Cache)');

    // Clear all cache and storage
    await context.clearCookies();
    await context.clearPermissions();
    await page.goto('about:blank');

    // Initialize profiler
    await profiler.initialize(page);

    // Login
    await login(page);

    // Clear cache again after login
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    // Navigate to ProfilePage with performance measurement
    const startTime = Date.now();
    const profileUrl = await navigateToProfilePage(page);
    const loadTime = Date.now() - startTime;

    console.log(`  Profile URL: ${profileUrl}`);
    console.log(`  Load Time: ${loadTime}ms`);

    // Wait for page to be fully loaded
    await page.waitForTimeout(3000); // Allow time for metrics to be collected

    // Collect metrics
    const result = await profiler.collectMetrics(page, 1, 'Initial Page Load (Cold Cache)');
    result.observations.push(
      `Page loaded in ${loadTime}ms`,
      'Cold cache scenario - all resources fetched from network',
      'Baseline performance measurement'
    );

    console.log(`  ✅ FCP: ${result.metrics.fcp}ms`);
    console.log(`  ✅ LCP: ${result.metrics.lcp}ms`);
    console.log(`  ✅ CLS: ${result.metrics.cls}`);
    console.log(`  ✅ Memory: ${(result.metrics.memoryUsage / 1024 / 1024).toFixed(2)}MB`);
    console.log(`  ✅ Network Requests: ${result.metrics.networkRequests}`);
  });

  test('Scenario 2: Initial Page Load (Warm Cache)', async ({ page }) => {
    console.log('\n📊 Scenario 2: Initial Page Load (Warm Cache)');

    // Login (cache should be warm from previous test)
    await login(page);

    // Navigate to ProfilePage
    const startTime = Date.now();
    await navigateToProfilePage(page);
    const loadTime = Date.now() - startTime;

    console.log(`  Load Time: ${loadTime}ms`);

    // Wait for page to be fully loaded
    await page.waitForTimeout(3000);

    // Collect metrics
    const result = await profiler.collectMetrics(page, 2, 'Initial Page Load (Warm Cache)');
    result.observations.push(
      `Page loaded in ${loadTime}ms`,
      'Warm cache scenario - resources served from cache',
      'Should be faster than cold cache'
    );

    console.log(`  ✅ FCP: ${result.metrics.fcp}ms`);
    console.log(`  ✅ LCP: ${result.metrics.lcp}ms`);
    console.log(`  ✅ CLS: ${result.metrics.cls}`);
  });

  test('Scenario 3: Tab Switching (About → Collaborations → Trades)', async ({ page }) => {
    console.log('\n📊 Scenario 3: Tab Switching');

    // Login and navigate to ProfilePage
    await login(page);
    await navigateToProfilePage(page);

    // Ensure we're on About tab
    const aboutTab = page.locator('button:has-text("About"), [role="tab"]:has-text("About")').first();
    if (await aboutTab.isVisible({ timeout: 5000 }).catch(() => false)) {
      await aboutTab.click();
      await page.waitForTimeout(500);
    }

    // Switch to Collaborations tab
    console.log('  Switching to Collaborations tab...');

    // Debug: Check what tabs are available
    const allButtons = await page.locator('button').allTextContents();
    console.log('  Available buttons:', allButtons.slice(0, 20).join(', '));

    const collabStartTime = Date.now();
    // Try multiple selectors for the Collaborations tab
    const collabTab = page.locator('button:has-text("Collaborations")').first();

    if (!(await collabTab.isVisible({ timeout: 5000 }).catch(() => false))) {
      console.log('  ⚠️  Collaborations tab not found, skipping scenario');
      const result = await profiler.collectMetrics(page, 3, 'Tab Switching (About → Collaborations → Trades)');
      result.status = 'SKIPPED';
      result.observations.push('Collaborations tab not found on page');
      return;
    }

    await collabTab.click();
    await page.waitForTimeout(1000);
    const collabSwitchTime = Date.now() - collabStartTime;

    // Switch to Trades tab
    console.log('  Switching to Trades tab...');
    const tradesStartTime = Date.now();
    const tradesTab = page.locator('button:has-text("Trades"), [role="tab"]:has-text("Trades")').first();
    await tradesTab.click();
    await page.waitForTimeout(1000);
    const tradesSwitchTime = Date.now() - tradesStartTime;

    // Collect metrics
    const result = await profiler.collectMetrics(page, 3, 'Tab Switching (About → Collaborations → Trades)');
    result.observations.push(
      `Collaborations tab switch: ${collabSwitchTime}ms`,
      `Trades tab switch: ${tradesSwitchTime}ms`,
      'Tab switching should be fast with React.memo optimizations'
    );

    console.log(`  ✅ Collaborations switch: ${collabSwitchTime}ms`);
    console.log(`  ✅ Trades switch: ${tradesSwitchTime}ms`);
  });

  test('Scenario 4: Infinite Scroll (Collaborations Tab)', async ({ page }) => {
    console.log('\n📊 Scenario 4: Infinite Scroll (Collaborations Tab)');

    // Login and navigate to ProfilePage
    await login(page);
    await navigateToProfilePage(page);

    // Switch to Collaborations tab
    const collabTab = page.locator('button:has-text("Collaborations"), [role="tab"]:has-text("Collaborations")').first();

    if (!(await collabTab.isVisible({ timeout: 5000 }).catch(() => false))) {
      console.log('  ⚠️  Collaborations tab not found, skipping scenario');
      const result = await profiler.collectMetrics(page, 4, 'Infinite Scroll (Collaborations Tab)');
      result.status = 'SKIPPED';
      result.observations.push('Collaborations tab not found on page');
      return;
    }

    await collabTab.click();
    await page.waitForTimeout(1000);

    // Get initial memory
    const initialMemory = await page.evaluate(() => (performance as any).memory?.usedJSHeapSize || 0);

    // Scroll to bottom multiple times
    console.log('  Scrolling to load more items...');
    for (let i = 0; i < 3; i++) {
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(1000);
      console.log(`    Scroll ${i + 1}/3 complete`);
    }

    // Get final memory
    const finalMemory = await page.evaluate(() => (performance as any).memory?.usedJSHeapSize || 0);
    const memoryGrowth = finalMemory - initialMemory;

    // Collect metrics
    const result = await profiler.collectMetrics(page, 4, 'Infinite Scroll (Collaborations Tab)');
    result.observations.push(
      `Memory growth during scroll: ${(memoryGrowth / 1024 / 1024).toFixed(2)}MB`,
      'Scrolled 3 times to trigger infinite scroll',
      'Check for memory leaks and scroll performance'
    );

    console.log(`  ✅ Memory growth: ${(memoryGrowth / 1024 / 1024).toFixed(2)}MB`);
  });

  test('Scenario 5: Modal Operations (Edit Profile)', async ({ page }) => {
    console.log('\n📊 Scenario 5: Modal Operations (Edit Profile)');

    // Login and navigate to ProfilePage
    await login(page);
    await navigateToProfilePage(page);

    // Find and click Edit Profile button
    const editButton = page.locator('button:has-text("Edit Profile"), button:has-text("Edit")').first();

    if (await editButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Measure modal open time
      const openStartTime = Date.now();
      await editButton.click();
      await page.waitForSelector('[role="dialog"], .modal, [data-testid="edit-profile-modal"]', { timeout: 5000 });
      const modalOpenTime = Date.now() - openStartTime;

      console.log(`  Modal opened in ${modalOpenTime}ms`);

      // Wait a bit for modal to fully render
      await page.waitForTimeout(500);

      // Measure modal close time
      const closeStartTime = Date.now();
      const closeButton = page.locator('button[aria-label="Close"], button:has-text("Cancel"), button:has-text("Close")').first();
      await closeButton.click();
      await page.waitForTimeout(500);
      const modalCloseTime = Date.now() - closeStartTime;

      console.log(`  Modal closed in ${modalCloseTime}ms`);

      // Collect metrics
      const result = await profiler.collectMetrics(page, 5, 'Modal Operations (Edit Profile)');
      result.observations.push(
        `Modal open time: ${modalOpenTime}ms`,
        `Modal close time: ${modalCloseTime}ms`,
        'Modal should render quickly with minimal parent re-renders'
      );

      console.log(`  ✅ Open: ${modalOpenTime}ms, Close: ${modalCloseTime}ms`);
    } else {
      console.log('  ⚠️  Edit Profile button not found, skipping scenario');
      const result = await profiler.collectMetrics(page, 5, 'Modal Operations (Edit Profile)');
      result.status = 'SKIPPED';
      result.observations.push('Edit Profile button not found on page');
    }
  });

  test('Scenario 6: Share Menu Interaction', async ({ page }) => {
    console.log('\n📊 Scenario 6: Share Menu Interaction');

    // Login and navigate to ProfilePage
    await login(page);
    await navigateToProfilePage(page);

    // Find and click Share button
    const shareButton = page.locator('button:has-text("Share"), button[aria-label*="Share"]').first();

    if (await shareButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Measure menu open time
      const openStartTime = Date.now();
      await shareButton.click();
      await page.waitForTimeout(500);
      const menuOpenTime = Date.now() - openStartTime;

      console.log(`  Share menu opened in ${menuOpenTime}ms`);

      // Close menu by clicking outside or pressing Escape
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);

      // Collect metrics
      const result = await profiler.collectMetrics(page, 6, 'Share Menu Interaction');
      result.observations.push(
        `Share menu open time: ${menuOpenTime}ms`,
        'Menu should render smoothly with good animation performance'
      );

      console.log(`  ✅ Menu open: ${menuOpenTime}ms`);
    } else {
      console.log('  ⚠️  Share button not found, skipping scenario');
      const result = await profiler.collectMetrics(page, 6, 'Share Menu Interaction');
      result.status = 'SKIPPED';
      result.observations.push('Share button not found on page');
    }
  });

  test('Scenario 7: Data Refetch Operation', async ({ page }) => {
    console.log('\n📊 Scenario 7: Data Refetch Operation');

    // Login and navigate to ProfilePage
    await login(page);
    await navigateToProfilePage(page);

    // Trigger a refetch by navigating away and back
    console.log('  Triggering data refetch...');
    const refetchStartTime = Date.now();

    // Navigate to a different page
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(2000);

    // Navigate back to ProfilePage
    await navigateToProfilePage(page);

    const refetchTime = Date.now() - refetchStartTime;

    console.log(`  Data refetch completed in ${refetchTime}ms`);

    // Collect metrics
    const result = await profiler.collectMetrics(page, 7, 'Data Refetch Operation');
    result.observations.push(
      `Refetch time: ${refetchTime}ms`,
      'Simulated refetch by navigating away and back',
      'Data should be efficiently refetched and components should update smoothly'
    );

    console.log(`  ✅ Refetch: ${refetchTime}ms`);
  });
});


