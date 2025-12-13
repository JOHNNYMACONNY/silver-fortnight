import { test } from '@playwright/test';

test('check if UX components page loads correctly', async ({ page }) => {
  await page.goto('http://localhost:5175/test/ux-components');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(10000); // Wait for lazy loading

  // Take screenshot
  await page.screenshot({ path: 'test-results/page-check.png', fullPage: true });
  
  // Get all text content
  const bodyText = await page.locator('body').textContent();
  console.log('Page content length:', bodyText?.length);
  console.log('Has "Vertical":', bodyText?.includes('Vertical'));
  console.log('Has "Stepper":', bodyText?.includes('Stepper'));
  console.log('Has "Progress":', bodyText?.includes('Progress'));
  
  // Check for React errors
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  
  // Check for any divs
  const divCount = await page.locator('div').count();
  console.log('Total divs on page:', divCount);
  
  // Look for any elements with "step" in class or id
  const stepElements = await page.evaluate(() => {
    const all = Array.from(document.querySelectorAll('*'));
    return all.filter(el => {
      const className = el.className?.toString() || '';
      const id = el.id || '';
      return className.toLowerCase().includes('step') || id.toLowerCase().includes('step');
    }).length;
  });
  console.log('Elements with "step" in class/id:', stepElements);
});

