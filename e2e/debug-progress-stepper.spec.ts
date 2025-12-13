import { test, expect } from '@playwright/test';

/**
 * Debug script for ProgressStepper component
 * This script will inspect the step indicators and log detailed information
 */

test.describe('ProgressStepper Debug', () => {
  test('inspect step indicators visibility', async ({ page }) => {
    // Set a longer timeout for debugging
    test.setTimeout(60000);
    // Navigate to the test page
    await page.goto('http://localhost:5175/test/ux-components');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Wait a bit for React to render
    await page.waitForTimeout(1000);
    
    // Find the ProgressStepper component section
    const horizontalStepper = page.locator('text=Horizontal Stepper').locator('..').locator('..');
    
    // Get all step indicator divs using data attributes
    const stepIndicators = page.locator('[data-step-index]');
    const count = await stepIndicators.count();
    
    console.log(`\n=== ProgressStepper Debug Report ===`);
    console.log(`Found ${count} step indicators`);
    
    // Inspect each step indicator
    for (let i = 0; i < count; i++) {
      const indicator = stepIndicators.nth(i);
      
      // Get element info
      const isVisible = await indicator.isVisible();
      const boundingBox = await indicator.boundingBox();
      const dataStepIndex = await indicator.getAttribute('data-step-index');
      const dataStepActive = await indicator.getAttribute('data-step-active');
      const dataStepCompleted = await indicator.getAttribute('data-step-completed');
      
      // Get computed styles
      const styles = await indicator.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          display: computed.display,
          visibility: computed.visibility,
          opacity: computed.opacity,
          width: computed.width,
          height: computed.height,
          backgroundColor: computed.backgroundColor,
          border: computed.border,
          borderWidth: computed.borderWidth,
          borderRadius: computed.borderRadius,
          position: computed.position,
          zIndex: computed.zIndex,
          className: el.className,
          innerHTML: el.innerHTML,
        };
      });
      
      console.log(`\n--- Step Indicator ${i} (index: ${dataStepIndex}) ---`);
      console.log(`  Active: ${dataStepActive}, Completed: ${dataStepCompleted}`);
      console.log(`  Visible: ${isVisible}`);
      console.log(`  BoundingBox: ${JSON.stringify(boundingBox)}`);
      console.log(`  Styles:`);
      console.log(`    display: ${styles.display}`);
      console.log(`    visibility: ${styles.visibility}`);
      console.log(`    opacity: ${styles.opacity}`);
      console.log(`    width: ${styles.width}`);
      console.log(`    height: ${styles.height}`);
      console.log(`    backgroundColor: ${styles.backgroundColor}`);
      console.log(`    border: ${styles.border}`);
      console.log(`    borderWidth: ${styles.borderWidth}`);
      console.log(`    borderRadius: ${styles.borderRadius}`);
      console.log(`    position: ${styles.position}`);
      console.log(`    zIndex: ${styles.zIndex}`);
      console.log(`    className: ${styles.className}`);
      console.log(`    innerHTML: ${styles.innerHTML.substring(0, 100)}...`);
      
      // Check parent container
      const parent = indicator.locator('..');
      const parentStyles = await parent.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          display: computed.display,
          flexDirection: computed.flexDirection,
          alignItems: computed.alignItems,
          justifyContent: computed.justifyContent,
          className: el.className,
        };
      });
      
      console.log(`  Parent container:`);
      console.log(`    display: ${parentStyles.display}`);
      console.log(`    flexDirection: ${parentStyles.flexDirection}`);
      console.log(`    className: ${parentStyles.className}`);
    }
    
    // Take a screenshot
    await page.screenshot({ 
      path: 'e2e/debug-progress-stepper.png',
      fullPage: true 
    });
    
    // Get the HTML structure around the stepper
    const stepperHTML = await page.locator('text=Horizontal Stepper').locator('..').locator('..').innerHTML();
    console.log(`\n--- Stepper HTML Structure (first 1000 chars) ---`);
    console.log(stepperHTML.substring(0, 1000));
    
    // Check for any console errors
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    console.log(`\n=== Debug Report Complete ===`);
    
    // Write detailed report to file
    const report = {
      timestamp: new Date().toISOString(),
      stepIndicatorCount: count,
      errors,
    };
    
    await page.evaluate(() => {
      console.log('Debug report generated');
    });
  });
});

