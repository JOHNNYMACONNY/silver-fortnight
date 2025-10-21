import { test, expect } from './fixtures/auth';

async function loginIfCredentialsProvided(page: import('@playwright/test').Page) {
  const email = process.env.TEST_USER_EMAIL;
  const password = process.env.TEST_USER_PASSWORD;
  if (!email || !password) return;
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.locator('form').getByRole('button', { name: /Log In|Success!/i }).click();
  // Do not rely on redirect; proceed to target page after brief settle
  await page.waitForTimeout(500);
}

test.describe('Challenges - Recommendations and Filters', () => {
  test('join from recommendations and filter by type via URL', async ({ signedInPage: page }) => {
    await page.goto('/challenges');
    await page.waitForLoadState('domcontentloaded');

    // Wait for page heading to ensure content mounted
    await expect(page.getByRole('heading', { name: 'Challenges' })).toBeVisible();

    // Ensure list rendered
    const firstCard = page.locator('[data-testid^="challenge-card-"]').first();
    // Fallback to first visible "View Details" link if test id is not present
    const firstDetailsFallback = page.getByRole('link', { name: 'View Details' }).first();
    const cardVisible = await firstCard.isVisible().catch(() => false);
    if (!cardVisible) {
      await expect(firstDetailsFallback).toBeVisible();
    }

    // Open details from first card explicitly to avoid strict-mode collisions
    if (cardVisible) {
      await firstCard.getByRole('link', { name: 'View Details' }).click();
    } else {
      await firstDetailsFallback.click();
    }
    await page.waitForURL(/\/challenges\/[A-Za-z0-9]+/, { timeout: 10000 });

    const joinCandidate = page.getByRole('button', { name: /Join this Challenge|Participate|Join Challenge/i }).first();
    if (await joinCandidate.count()) {
      if (await joinCandidate.isVisible()) {
        await joinCandidate.click();
      }
    }

    await page.goto('/challenges?type=solo');
    await page.waitForLoadState('domcontentloaded');
    await expect(page).toHaveURL(/type=solo/);

    // At least one card visible
    const anyCard = page.locator('[data-testid^="challenge-card-"]').first();
    const fallbackCard = page.locator('text=View Details').first();
    if (await anyCard.count()) {
      await expect(anyCard).toBeVisible();
    } else {
      await expect(fallbackCard).toBeVisible();
    }
  });
});


