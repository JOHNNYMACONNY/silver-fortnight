import { test, expect } from '@playwright/test';

test.describe('Visual Regression', () => {
    test('landing page should match snapshot', async ({ page }) => {
        await page.goto('/');

        // Wait for critical elements (e.g., hero section) to ensure hydration
        // Using a generic selector or just wait for load state
        await page.waitForLoadState('networkidle');

        // Take a full page screenshot
        // Note: 'toHaveScreenshot' will automatically compare with baseline on subsequent runs
        await expect(page).toHaveScreenshot('landing-page.png', { fullPage: true });
    });

    // Add more pages here as needed
    // test('login page', async ({ page }) => { ... });
});
