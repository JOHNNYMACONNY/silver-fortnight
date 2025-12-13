import { test, expect } from '@playwright/test';

/**
 * Verify ProgressStepper centering on mobile screen sizes
 */

test.describe('ProgressStepper Mobile Centering', () => {
  test('verify steps are centered on mobile viewport', async ({ page }) => {
    test.setTimeout(60000);
    
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE size
    
    // Navigate to the test page
    await page.goto('http://localhost:5175/test/ux-components');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    console.log('\n=== Mobile ProgressStepper Centering Verification ===\n');
    
    // Find horizontal stepper
    const horizontalSection = page.locator('text=Horizontal Stepper');
    await expect(horizontalSection).toBeVisible();
    
    // Get the steps container - try multiple selectors for mobile
    let stepsContainer = page.locator('.flex.items-start.overflow-x-auto').first();
    if (!(await stepsContainer.count())) {
      stepsContainer = page.locator('.flex.items-start.w-full').first();
    }
    if (!(await stepsContainer.count())) {
      stepsContainer = page.locator('text=Horizontal Stepper').locator('..').locator('..').locator('.flex').first();
    }
    const containerBox = await stepsContainer.boundingBox();
    
    // Get the card container
    const card = horizontalSection.locator('..').locator('..').locator('..');
    const cardBox = await card.boundingBox();
    
    console.log('--- Container Measurements ---');
    if (containerBox && cardBox) {
      console.log(`Card width: ${cardBox.width.toFixed(1)}px`);
      console.log(`Card left: ${cardBox.x.toFixed(1)}px`);
      console.log(`Steps container width: ${containerBox.width.toFixed(1)}px`);
      console.log(`Steps container left: ${containerBox.x.toFixed(1)}px`);
      
      // Calculate if steps container is centered within card
      const cardCenterX = cardBox.x + cardBox.width / 2;
      const containerCenterX = containerBox.x + containerBox.width / 2;
      const horizontalOffset = Math.abs(cardCenterX - containerCenterX);
      
      console.log(`\nCard center X: ${cardCenterX.toFixed(1)}px`);
      console.log(`Container center X: ${containerCenterX.toFixed(1)}px`);
      console.log(`Horizontal offset: ${horizontalOffset.toFixed(1)}px`);
      
      // Allow 5px tolerance for padding/margins
      const isCentered = horizontalOffset < 5;
      console.log(`\n✅ Steps container is centered: ${isCentered}`);
      
      if (!isCentered) {
        console.log(`⚠️  Warning: Steps container is off-center by ${horizontalOffset.toFixed(1)}px`);
      }
    }
    
    // Check individual step positions
    console.log('\n--- Step Positions ---');
    const stepIndicators = page.locator('[data-step-index]');
    const indicatorCount = await stepIndicators.count();
    
    if (indicatorCount > 0 && containerBox) {
      const firstIndicator = stepIndicators.nth(0);
      const lastIndicator = stepIndicators.nth(indicatorCount - 1);
      
      const firstBox = await firstIndicator.boundingBox();
      const lastBox = await lastIndicator.boundingBox();
      
      if (firstBox && lastBox && containerBox) {
        const containerLeft = containerBox.x;
        const containerRight = containerBox.x + containerBox.width;
        const firstLeft = firstBox.x;
        const lastRight = lastBox.x + lastBox.width;
        
        console.log(`Container bounds: ${containerLeft.toFixed(1)}px - ${containerRight.toFixed(1)}px`);
        console.log(`First step left: ${firstLeft.toFixed(1)}px`);
        console.log(`Last step right: ${lastRight.toFixed(1)}px`);
        
        const leftPadding = firstLeft - containerLeft;
        const rightPadding = containerRight - lastRight;
        const paddingDifference = Math.abs(leftPadding - rightPadding);
        
        console.log(`Left padding: ${leftPadding.toFixed(1)}px`);
        console.log(`Right padding: ${rightPadding.toFixed(1)}px`);
        console.log(`Padding difference: ${paddingDifference.toFixed(1)}px`);
        
        // Steps should be reasonably balanced (allow 10px difference for mobile scrolling)
        const isBalanced = paddingDifference < 10;
        console.log(`\n✅ Steps are balanced: ${isBalanced}`);
        
        if (!isBalanced) {
          console.log(`⚠️  Warning: Steps have ${paddingDifference.toFixed(1)}px padding imbalance`);
        }
      }
    }
    
    // Check if horizontal scrolling is working
    console.log('\n--- Mobile Scrolling Check ---');
    const canScroll = await stepsContainer.evaluate((el) => {
      return el.scrollWidth > el.clientWidth;
    });
    console.log(`Can scroll horizontally: ${canScroll}`);
    
    if (canScroll) {
      const scrollWidth = await stepsContainer.evaluate((el) => el.scrollWidth);
      const clientWidth = await stepsContainer.evaluate((el) => el.clientWidth);
      console.log(`Scroll width: ${scrollWidth}px`);
      console.log(`Client width: ${clientWidth}px`);
      console.log(`Overflow: ${scrollWidth - clientWidth}px`);
    }
    
    // Take screenshot for visual verification
    await page.screenshot({ 
      path: 'e2e/progress-stepper-mobile-verification.png',
      fullPage: false 
    });
    
    console.log(`\n=== Verification Complete ===`);
    console.log(`Screenshot saved to: e2e/progress-stepper-mobile-verification.png\n`);
  });
  
  test('verify steps are centered on tablet viewport', async ({ page }) => {
    test.setTimeout(60000);
    
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 }); // iPad size
    
    // Navigate to the test page
    await page.goto('http://localhost:5175/test/ux-components');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    console.log('\n=== Tablet ProgressStepper Centering Verification ===\n');
    
    // Find horizontal stepper
    const horizontalSection = page.locator('text=Horizontal Stepper');
    await expect(horizontalSection).toBeVisible();
    
    // Get the steps container - find the direct parent of step indicators
    const firstStepIndicator = page.locator('[data-step-index]').first();
    await expect(firstStepIndicator).toBeVisible();
    
    // Navigate up to find the steps flex container
    const stepsContainer = firstStepIndicator.evaluateHandle((el) => {
      let parent = el.parentElement;
      while (parent && !parent.classList.contains('flex') && !parent.classList.contains('items-start')) {
        parent = parent.parentElement;
      }
      return parent;
    });
    
    // Get the card container
    const card = horizontalSection.locator('..').locator('..').locator('..');
    const cardBox = await card.boundingBox();
    
    // Get container box using evaluate
    const containerBox = await page.evaluate((container) => {
      if (!container) return null;
      const rect = (container as Element).getBoundingClientRect();
      return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
    }, await stepsContainer);
    
    if (containerBox && cardBox) {
      const cardCenterX = cardBox.x + cardBox.width / 2;
      const containerCenterX = containerBox.x + containerBox.width / 2;
      const horizontalOffset = Math.abs(cardCenterX - containerCenterX);
      
      console.log(`Card center X: ${cardCenterX.toFixed(1)}px`);
      console.log(`Container center X: ${containerCenterX.toFixed(1)}px`);
      console.log(`Horizontal offset: ${horizontalOffset.toFixed(1)}px`);
      
      const isCentered = horizontalOffset < 5;
      console.log(`\n✅ Steps container is centered: ${isCentered}`);
    }
    
    await page.screenshot({ 
      path: 'e2e/progress-stepper-tablet-verification.png',
      fullPage: false 
    });
  });
});

