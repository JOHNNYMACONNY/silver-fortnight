import { test as base, expect, Page } from '@playwright/test';

type Fixtures = {
  signedInPage: Page;
};

export const test = base.extend<Fixtures>({
  signedInPage: async ({ page }, use) => {
    const email = process.env.TEST_USER_EMAIL;
    const password = process.env.TEST_USER_PASSWORD;
    if (email && password) {
      await page.goto('/login');
      await page.getByLabel('Email').fill(email);
      await page.getByLabel('Password').fill(password);
      await page.locator('form').getByRole('button', { name: /Log In|Success!/i }).click();
      // Brief settle; app may redirect after login effect
      await page.waitForTimeout(800);
    }
    await use(page);
  },
});

export { expect };


