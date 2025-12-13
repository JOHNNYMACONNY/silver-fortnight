import { test, expect } from '@playwright/test';

/**
 * Verify vertical ProgressStepper connector lines connect properly
 */

test.describe('Vertical ProgressStepper Connector Lines', () => {
  test('verify vertical connector lines connect circles properly', async ({ page }) => {
    test.setTimeout(60000);
    
    // Navigate to the test page
    await page.goto('http://localhost:5175/test/ux-components');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    console.log('\n=== Vertical ProgressStepper Connector Lines Verification ===\n');
    
    // Get all step indicators - there should be both horizontal and vertical steppers
    const allStepIndicators = page.locator('[data-step-index]');
    await expect(allStepIndicators.first()).toBeVisible({ timeout: 10000 });
    
    // Find vertical stepper indicators - they're in a flex-col container
    // Vertical stepper has steps in a column layout
    const verticalStepIndicators = page.locator('.flex.flex-col').locator('[data-step-index]');
    const indicatorCount = await verticalStepIndicators.count();
    
    console.log(`Found ${indicatorCount} step indicators\n`);
    
    // Get connector lines (vertical lines)
    const connectorLines = page.locator('.absolute.w-0\\.5.rounded-full');
    const lineCount = await connectorLines.count();
    
    console.log(`Found ${lineCount} connector lines\n`);
    
    // Check alignment for first few steps
    for (let i = 0; i < Math.min(3, indicatorCount - 1); i++) {
      const currentIndicator = verticalStepIndicators.nth(i);
      const nextIndicator = verticalStepIndicators.nth(i + 1);
      
      // Find the connector line for this step - it should be in the same container
      const stepContainer = currentIndicator.locator('..').locator('..');
      const connectorLine = stepContainer.locator('.absolute.w-0\\.5').first();
      
      const currentBox = await currentIndicator.boundingBox();
      const nextBox = await nextIndicator.boundingBox();
      const lineBox = await connectorLine.boundingBox();
      
      if (currentBox && nextBox && lineBox) {
        // Calculate circle centers
        const currentCenterX = currentBox.x + currentBox.width / 2;
        const currentCenterY = currentBox.y + currentBox.height / 2;
        const currentBottomY = currentBox.y + currentBox.height;
        
        const nextCenterX = nextBox.x + nextBox.width / 2;
        const nextCenterY = nextBox.y + nextBox.height / 2;
        const nextTopY = nextBox.y;
        
        const lineCenterX = lineBox.x + lineBox.width / 2;
        const lineTopY = lineBox.y;
        const lineBottomY = lineBox.y + lineBox.height;
        
        console.log(`--- Step ${i} to Step ${i + 1} ---`);
        console.log(`Current circle:`);
        console.log(`  Center: (${currentCenterX.toFixed(1)}, ${currentCenterY.toFixed(1)})`);
        console.log(`  Bottom: ${currentBottomY.toFixed(1)}px`);
        console.log(`Next circle:`);
        console.log(`  Center: (${nextCenterX.toFixed(1)}, ${nextCenterY.toFixed(1)})`);
        console.log(`  Top: ${nextTopY.toFixed(1)}px`);
        console.log(`Connector line:`);
        console.log(`  Center X: ${lineCenterX.toFixed(1)}px`);
        console.log(`  Top Y: ${lineTopY.toFixed(1)}px`);
        console.log(`  Bottom Y: ${lineBottomY.toFixed(1)}px`);
        
        // Check horizontal alignment (line should be at circle center X)
        const horizontalAlignment = Math.abs(lineCenterX - currentCenterX);
        console.log(`\nHorizontal alignment difference: ${horizontalAlignment.toFixed(1)}px`);
        
        // Check vertical connection (line should start at current circle bottom, end at next circle top)
        const connectsAtBottom = Math.abs(lineTopY - currentBottomY);
        const connectsAtTop = Math.abs(lineBottomY - nextTopY);
        
        console.log(`Line start to current circle bottom: ${connectsAtBottom.toFixed(1)}px`);
        console.log(`Line end to next circle top: ${connectsAtTop.toFixed(1)}px`);
        
        const connectsProperly = 
          horizontalAlignment < 3 && // Line is centered on circle (3px tolerance)
          connectsAtBottom < 3 &&    // Line starts at circle bottom (3px tolerance)
          connectsAtTop < 3;         // Line ends at next circle top (3px tolerance)
        
        console.log(`\n✅ Connector line properly connects: ${connectsProperly}`);
        
        if (!connectsProperly) {
          console.log(`⚠️  Issues:`);
          if (horizontalAlignment >= 3) {
            console.log(`  - Horizontal misalignment: ${horizontalAlignment.toFixed(1)}px`);
          }
          if (connectsAtBottom >= 3) {
            console.log(`  - Line doesn't start at circle bottom: ${connectsAtBottom.toFixed(1)}px gap`);
          }
          if (connectsAtTop >= 3) {
            console.log(`  - Line doesn't end at next circle top: ${connectsAtTop.toFixed(1)}px gap`);
          }
        }
      }
    }
    
    // Take screenshot
    await page.screenshot({ 
      path: 'e2e/vertical-stepper-verification.png',
      fullPage: false 
    });
    
    console.log(`\n=== Verification Complete ===`);
    console.log(`Screenshot saved to: e2e/vertical-stepper-verification.png\n`);
  });
});

