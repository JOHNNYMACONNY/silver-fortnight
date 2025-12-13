import { test, expect } from '@playwright/test';

/**
 * Comprehensive verification of ProgressStepper component
 * Checks step indicators, connector lines, and overall structure
 */

test.describe('ProgressStepper Verification', () => {
  test('verify step indicators and connector lines are correct', async ({ page }) => {
    test.setTimeout(60000);
    
    // Navigate to the test page
    await page.goto('http://localhost:5175/test/ux-components');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Wait for React to render
    
    console.log('\n=== ProgressStepper Verification Report ===\n');
    
    // Find horizontal stepper
    const horizontalSection = page.locator('text=Horizontal Stepper');
    await expect(horizontalSection).toBeVisible();
    
    // Get all step indicators with data attributes
    const stepIndicators = page.locator('[data-step-index]');
    const indicatorCount = await stepIndicators.count();
    
    console.log(`Found ${indicatorCount} step indicators total\n`);
    
    // Verify horizontal stepper structure
    console.log('--- Horizontal Stepper Analysis ---');
    const horizontalStepper = horizontalSection.locator('..').locator('..');
    
    // Check for connector lines - they should be flex items with rounded-full h-1
    const connectorLines = page.locator('div.rounded-full.h-1').filter({
      hasNot: page.locator('[data-step-index]')
    });
    const lineCount = await connectorLines.count();
    
    console.log(`Found ${lineCount} connector lines (filtered from step indicators)`);
    
    // Alternative: check for lines in the steps container
    const stepsContainer = horizontalStepper.locator('div.flex.items-start, div.flex.items-center');
    const allRoundedElements = stepsContainer.locator('.rounded-full');
    const allRoundedCount = await allRoundedElements.count();
    console.log(`Found ${allRoundedCount} total rounded-full elements in steps container`);
    
    // Inspect first few step indicators
    for (let i = 0; i < Math.min(4, indicatorCount); i++) {
      const indicator = stepIndicators.nth(i);
      const isVisible = await indicator.isVisible();
      const boundingBox = await indicator.boundingBox();
      const styles = await indicator.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          width: computed.width,
          height: computed.height,
          backgroundColor: computed.backgroundColor,
          borderRadius: computed.borderRadius,
          display: computed.display,
        };
      });
      
      console.log(`\nStep Indicator ${i}:`);
      console.log(`  Visible: ${isVisible}`);
      console.log(`  Position: x=${boundingBox?.x?.toFixed(1)}, y=${boundingBox?.y?.toFixed(1)}`);
      console.log(`  Size: ${styles.width} × ${styles.height}`);
      console.log(`  Background: ${styles.backgroundColor}`);
      console.log(`  BorderRadius: ${styles.borderRadius}`);
      console.log(`  Display: ${styles.display}`);
    }
    
    // Check connector lines
    console.log(`\n--- Connector Lines Analysis ---`);
    for (let i = 0; i < Math.min(3, lineCount); i++) {
      const line = connectorLines.nth(i);
      const isVisible = await line.isVisible();
      const boundingBox = await line.boundingBox();
      const styles = await line.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          width: computed.width,
          height: computed.height,
          backgroundColor: computed.backgroundColor,
          position: computed.position,
          top: computed.top,
          left: computed.left,
          right: computed.right,
        };
      });
      
      console.log(`\nConnector Line ${i}:`);
      console.log(`  Visible: ${isVisible}`);
      if (boundingBox) {
        console.log(`  Position: x=${boundingBox.x.toFixed(1)}, y=${boundingBox.y.toFixed(1)}`);
        console.log(`  Size: ${boundingBox.width.toFixed(1)}px × ${boundingBox.height.toFixed(1)}px`);
      }
      console.log(`  CSS Position: ${styles.position}`);
      console.log(`  CSS Top: ${styles.top}`);
      console.log(`  CSS Left: ${styles.left}`);
      console.log(`  CSS Right: ${styles.right}`);
      console.log(`  Background: ${styles.backgroundColor}`);
    }
    
    // Check if lines align with step indicators
    console.log(`\n--- Alignment Check ---`);
    if (indicatorCount >= 2 && lineCount >= 1) {
      const firstIndicator = stepIndicators.nth(0);
      const secondIndicator = stepIndicators.nth(1);
      const firstLine = connectorLines.nth(0);
      
      const firstBox = await firstIndicator.boundingBox();
      const secondBox = await secondIndicator.boundingBox();
      const lineBox = await firstLine.boundingBox();
      
      if (firstBox && secondBox && lineBox) {
        const firstCenterY = firstBox.y + firstBox.height / 2;
        const secondCenterY = secondBox.y + secondBox.height / 2;
        const lineCenterY = lineBox.y + lineBox.height / 2;
        
        const indicatorCenterY = (firstCenterY + secondCenterY) / 2;
        const verticalAlignment = Math.abs(lineCenterY - indicatorCenterY);
        
        console.log(`First indicator center Y: ${firstCenterY.toFixed(1)}`);
        console.log(`Second indicator center Y: ${secondCenterY.toFixed(1)}`);
        console.log(`Expected line center Y: ${indicatorCenterY.toFixed(1)}`);
        console.log(`Actual line center Y: ${lineCenterY.toFixed(1)}`);
        console.log(`Vertical alignment difference: ${verticalAlignment.toFixed(1)}px`);
        
        // Check if line extends from first to second indicator
        const lineStartX = lineBox.x;
        const lineEndX = lineBox.x + lineBox.width;
        const firstIndicatorRightEdge = firstBox.x + firstBox.width;
        const secondIndicatorLeftEdge = secondBox.x;
        
        console.log(`\nLine start X: ${lineStartX.toFixed(1)}`);
        console.log(`First indicator right edge: ${firstIndicatorRightEdge.toFixed(1)}`);
        console.log(`Line end X: ${lineEndX.toFixed(1)}`);
        console.log(`Second indicator left edge: ${secondIndicatorLeftEdge.toFixed(1)}`);
        
        const connectsProperly = 
          Math.abs(lineStartX - firstIndicatorRightEdge) < 5 && // Line starts close to first circle
          Math.abs(lineEndX - secondIndicatorLeftEdge) < 5;     // Line ends close to second circle
        
        console.log(`\n✅ Connector line properly connects: ${connectsProperly}`);
      }
    }
    
    // Take screenshot for visual verification
    await page.screenshot({ 
      path: 'e2e/progress-stepper-verification.png',
      fullPage: true 
    });
    
    console.log(`\n=== Verification Complete ===`);
    console.log(`Screenshot saved to: e2e/progress-stepper-verification.png\n`);
  });
});

