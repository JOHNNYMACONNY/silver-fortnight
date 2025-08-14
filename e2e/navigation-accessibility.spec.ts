import { test, expect } from './fixtures/auth';
import AxeBuilder from '@axe-core/playwright';

test.describe('Navigation Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should not have any accessibility violations on navbar', async ({ page }) => {
    const accessibilityScanResults = await new AxeBuilder({ page })
      .include('nav')
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should not have accessibility violations on mobile menu', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Open mobile menu
    const mobileMenuButton = page.locator('[data-testid="mobile-menu-button"]');
    await mobileMenuButton.click();

    // Wait for menu to be visible
    const mobileMenu = page.locator('[data-testid="mobile-menu"]');
    await expect(mobileMenu).toBeVisible();

    // Run accessibility scan on mobile menu
    const accessibilityScanResults = await new AxeBuilder({ page })
      .include('[data-testid="mobile-menu"]')
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should not have accessibility violations on command palette', async ({ page }) => {
    // Open command palette
    const isMac = process.platform === 'darwin';
    const modifier = isMac ? 'Meta' : 'Control';
    
    await page.keyboard.press(`${modifier}+KeyK`);

    // Wait for command palette to be visible
    const commandPalette = page.locator('[data-testid="command-palette"]');
    await expect(commandPalette).toBeVisible();

    // Run accessibility scan on command palette
    const accessibilityScanResults = await new AxeBuilder({ page })
      .include('[data-testid="command-palette"]')
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should have proper ARIA labels and roles', async ({ page }) => {
    // Check navbar has proper role
    const navbar = page.locator('nav');
    await expect(navbar).toHaveAttribute('role', 'navigation');

    // Check mobile menu button has proper ARIA attributes
    await page.setViewportSize({ width: 375, height: 667 });
    const mobileMenuButton = page.locator('[data-testid="mobile-menu-button"]');
    
    await expect(mobileMenuButton).toHaveAttribute('aria-label');
    await expect(mobileMenuButton).toHaveAttribute('aria-expanded', 'false');

    // Open mobile menu and check aria-expanded changes
    await mobileMenuButton.click();
    await expect(mobileMenuButton).toHaveAttribute('aria-expanded', 'true');
  });

  test('should have proper focus management in command palette', async ({ page }) => {
    // Open command palette
    const isMac = process.platform === 'darwin';
    const modifier = isMac ? 'Meta' : 'Control';
    
    await page.keyboard.press(`${modifier}+KeyK`);

    // Check if search input is focused
    const searchInput = page.locator('[data-testid="command-palette-search"]');
    await expect(searchInput).toBeFocused();

    // Type to show results
    await searchInput.fill('profile');

    // Use arrow keys to navigate results
    await page.keyboard.press('ArrowDown');
    
    // Check if first result is focused
    const firstResult = page.locator('[data-testid="command-palette-results"] [role="option"]:first-child');
    await expect(firstResult).toBeFocused();

    // Navigate to next result
    await page.keyboard.press('ArrowDown');
    const secondResult = page.locator('[data-testid="command-palette-results"] [role="option"]:nth-child(2)');
    await expect(secondResult).toBeFocused();

    // Navigate back up
    await page.keyboard.press('ArrowUp');
    await expect(firstResult).toBeFocused();
  });

  test('should have proper color contrast', async ({ page }) => {
    // Run accessibility scan specifically for color contrast
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .include('nav')
      .analyze();

    // Filter for color contrast violations
    const colorContrastViolations = accessibilityScanResults.violations.filter(
      violation => violation.id === 'color-contrast'
    );

    expect(colorContrastViolations).toEqual([]);
  });

  test('should be navigable with keyboard only', async ({ page }) => {
    // Start from the beginning of the page
    await page.keyboard.press('Tab');

    // Check if we can tab through all navigation elements
    const navLinks = page.locator('nav a');
    const linkCount = await navLinks.count();

    for (let i = 0; i < linkCount; i++) {
      const currentLink = navLinks.nth(i);
      await expect(currentLink).toBeFocused();
      
      if (i < linkCount - 1) {
        await page.keyboard.press('Tab');
      }
    }
  });

  test('should announce navigation changes to screen readers', async ({ page }) => {
    // Check if navigation has proper landmarks
    const navbar = page.locator('nav');
    await expect(navbar).toHaveAttribute('role', 'navigation');

    // Check if navigation links have proper text content
    const navLinks = page.locator('nav a');
    const linkCount = await navLinks.count();

    for (let i = 0; i < linkCount; i++) {
      const link = navLinks.nth(i);
      const textContent = await link.textContent();
      expect(textContent).toBeTruthy();
      expect(textContent?.trim().length).toBeGreaterThan(0);
    }
  });

  test('should handle high contrast mode', async ({ page }) => {
    // Simulate high contrast mode
    await page.emulateMedia({ colorScheme: 'dark', forcedColors: 'active' });

    // Run accessibility scan
    const accessibilityScanResults = await new AxeBuilder({ page })
      .include('nav')
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should work with reduced motion preferences', async ({ page }) => {
    // Simulate reduced motion preference
    await page.emulateMedia({ reducedMotion: 'reduce' });

    // Open and close mobile menu to test animations
    await page.setViewportSize({ width: 375, height: 667 });
    const mobileMenuButton = page.locator('[data-testid="mobile-menu-button"]');
    
    await mobileMenuButton.click();
    const mobileMenu = page.locator('[data-testid="mobile-menu"]');
    await expect(mobileMenu).toBeVisible();

    await mobileMenuButton.click();
    await expect(mobileMenu).not.toBeVisible();

    // Test command palette
    const isMac = process.platform === 'darwin';
    const modifier = isMac ? 'Meta' : 'Control';
    
    await page.keyboard.press(`${modifier}+KeyK`);
    const commandPalette = page.locator('[data-testid="command-palette"]');
    await expect(commandPalette).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(commandPalette).not.toBeVisible();
  });
});
