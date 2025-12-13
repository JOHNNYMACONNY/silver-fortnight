import { test, expect } from '@playwright/test';

/**
 * Comprehensive verification of ProgressStepper component
 * Checks both horizontal and vertical orientations for bugs
 */

test.describe('ProgressStepper Comprehensive Verification', () => {
  test('comprehensive check for bugs in both orientations', async ({ page }) => {
    test.setTimeout(90000);
    
    // Listen for console errors
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // Listen for page errors
    page.on('pageerror', error => {
      consoleErrors.push(`Page error: ${error.message}`);
    });
    
    // Navigate to the test page
    await page.goto('http://localhost:5175/test/ux-components', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(5000); // Wait for React to fully render and lazy load
    
    console.log('\n=== Comprehensive ProgressStepper Bug Check ===\n');
    
    // Debug: Check current URL
    const currentUrl = page.url();
    console.log(`Current URL: ${currentUrl}`);
    
    // Log console errors
    if (consoleErrors.length > 0) {
      console.log(`\n⚠️  Found ${consoleErrors.length} console errors:`);
      consoleErrors.forEach((error, i) => {
        console.log(`  ${i + 1}. ${error.substring(0, 200)}`);
      });
    }
    
    // Wait for the page to actually render the components
    // Look for the ProgressStepper component by its text content
    await page.waitForSelector('text=Details', { timeout: 10000 }).catch(() => {
      console.log('Step labels not found, checking for ProgressStepper component...');
    });
    
    // Try to find any step indicators with multiple strategies
    let stepCount = 0;
    
    // Strategy 1: data attributes
    const stepsByDataAttr = page.locator('[data-step-index]');
    stepCount = await stepsByDataAttr.count();
    console.log(`Found ${stepCount} step indicators with [data-step-index]`);
    
    // Strategy 2: If no data attributes, find by structure
    if (stepCount === 0) {
      // Look for step labels
      const detailLabel = page.locator('text=Details').first();
      const isDetailVisible = await detailLabel.isVisible().catch(() => false);
      if (isDetailVisible) {
        console.log('Found "Details" label, step indicators should be nearby');
        // Step indicators should be siblings or parents of the label
        const stepContainer = detailLabel.locator('..').locator('..').locator('..');
        const stepsInContainer = stepContainer.locator('.rounded-full, [role="button"]');
        stepCount = await stepsInContainer.count();
        console.log(`Found ${stepCount} potential step elements by structure`);
      }
    }
    
    // Take screenshot of current state
    await page.screenshot({ path: 'e2e/debug-page-state.png', fullPage: true });
    console.log('Screenshot saved to: e2e/debug-page-state.png');
    
    // If still no steps found, check what's actually on the page
    if (stepCount === 0) {
      const pageContent = await page.content();
      console.log(`Page HTML length: ${pageContent.length}`);
      
      // Check for various indicators
      const hasTestPageContent = pageContent.includes('UX Components Test Page');
      const hasProgressStepper = pageContent.includes('ProgressStepper');
      const hasHorizontalStepper = pageContent.includes('Horizontal Stepper');
      const hasVerticalStepper = pageContent.includes('Vertical Stepper');
      
      console.log(`Has test page content: ${hasTestPageContent}`);
      console.log(`Has ProgressStepper: ${hasProgressStepper}`);
      console.log(`Has Horizontal Stepper text: ${hasHorizontalStepper}`);
      console.log(`Has Vertical Stepper text: ${hasVerticalStepper}`);
      
      // Check if there's a loading state or error
      const hasLoading = pageContent.includes('Loading') || pageContent.includes('loading');
      const hasError = pageContent.includes('Error') || pageContent.includes('error');
      console.log(`Has loading state: ${hasLoading}`);
      console.log(`Has error: ${hasError}`);
      
      // Try waiting a bit more and checking again
      console.log('\nWaiting additional 3 seconds for lazy loading...');
      await page.waitForTimeout(3000);
      
      // Check again after wait
      const stepsAfterWait = await page.locator('[data-step-index]').count();
      console.log(`Step indicators after additional wait: ${stepsAfterWait}`);
      
      if (stepsAfterWait > 0) {
        stepCount = stepsAfterWait;
        console.log('✅ Step indicators found after additional wait!');
      }
    }
    
    // ========== HORIZONTAL ORIENTATION CHECKS ==========
    console.log('--- Horizontal Stepper Checks ---');
    
    if (stepCount === 0) {
      console.log('⚠️  No step indicators found - cannot proceed with checks');
      console.log('This may indicate the page did not load correctly or components are not rendering');
      return;
    }
    
    // Get all step indicators
    const allStepIndicators = page.locator('[data-step-index]');
    const totalStepCount = await allStepIndicators.count();
    console.log(`Found ${totalStepCount} total step indicators`);
    
    // Find horizontal stepper - it should have 4 steps
    // Horizontal steps are in a flex row container
    const horizontalContainer = allStepIndicators.first().locator('..').locator('..').locator('..').first();
    const horizontalSteps = horizontalContainer.locator('[data-step-index]');
    const horizontalStepCount = await horizontalSteps.count();
    console.log(`Horizontal stepper has ${horizontalStepCount} steps`);
    
    // Get horizontal connector lines (h-1 means horizontal lines)
    const horizontalConnectors = page.locator('.absolute.rounded-full.h-1');
    const horizontalConnectorCount = await horizontalConnectors.count();
    console.log(`Found ${horizontalConnectorCount} horizontal connector lines`);
    
    // Check first few horizontal steps and connectors
    for (let i = 0; i < Math.min(4, totalStepCount); i++) {
      const step = allStepIndicators.nth(i);
      const isVisible = await step.isVisible();
      const box = await step.boundingBox();
      const styles = await step.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          width: computed.width,
          height: computed.height,
          backgroundColor: computed.backgroundColor,
          borderRadius: computed.borderRadius,
        };
      });
      
      console.log(`\nHorizontal Step ${i}:`);
      console.log(`  Visible: ${isVisible}`);
      if (box) {
        console.log(`  Position: x=${box.x.toFixed(1)}, y=${box.y.toFixed(1)}`);
        console.log(`  Size: ${box.width.toFixed(1)}px × ${box.height.toFixed(1)}px`);
      }
      console.log(`  Background: ${styles.backgroundColor}`);
      console.log(`  BorderRadius: ${styles.borderRadius}`);
    }
    
    // Check horizontal connector line connections
    if (totalStepCount >= 2 && horizontalConnectorCount >= 1) {
      const firstStep = allStepIndicators.nth(0);
      const secondStep = allStepIndicators.nth(1);
      const firstConnector = horizontalConnectors.nth(0);
      
      const firstBox = await firstStep.boundingBox();
      const secondBox = await secondStep.boundingBox();
      const connectorBox = await firstConnector.boundingBox();
      
      if (firstBox && secondBox && connectorBox) {
        const firstRightEdge = firstBox.x + firstBox.width;
        const secondLeftEdge = secondBox.x;
        const connectorStart = connectorBox.x;
        const connectorEnd = connectorBox.x + connectorBox.width;
        
        const firstCenterY = firstBox.y + firstBox.height / 2;
        const connectorCenterY = connectorBox.y + connectorBox.height / 2;
        
        console.log(`\nHorizontal Connector Analysis:`);
        console.log(`  First step right edge: ${firstRightEdge.toFixed(1)}px`);
        console.log(`  Connector start: ${connectorStart.toFixed(1)}px`);
        console.log(`  Connector end: ${connectorEnd.toFixed(1)}px`);
        console.log(`  Second step left edge: ${secondLeftEdge.toFixed(1)}px`);
        console.log(`  First step center Y: ${firstCenterY.toFixed(1)}px`);
        console.log(`  Connector center Y: ${connectorCenterY.toFixed(1)}px`);
        
        const connectsAtStart = Math.abs(connectorStart - firstRightEdge) < 5;
        const connectsAtEnd = Math.abs(connectorEnd - secondLeftEdge) < 5;
        const verticalAligned = Math.abs(connectorCenterY - firstCenterY) < 5;
        
        console.log(`\n  ✅ Connects at start: ${connectsAtStart}`);
        console.log(`  ✅ Connects at end: ${connectsAtEnd}`);
        console.log(`  ✅ Vertically aligned: ${verticalAligned}`);
        
        if (!connectsAtStart || !connectsAtEnd || !verticalAligned) {
          console.log(`  ⚠️  BUG: Horizontal connector line not properly connecting!`);
        }
      }
    }
    
    // ========== VERTICAL ORIENTATION CHECKS ==========
    console.log(`\n\n--- Vertical Stepper Checks ---`);
    
    // Scroll down to find vertical stepper
    await page.evaluate(() => window.scrollBy(0, 500));
    await page.waitForTimeout(1000);
    
    // Find vertical stepper - it uses w-0.5 (vertical lines) instead of h-1 (horizontal)
    const verticalConnectors = page.locator('.absolute.w-0\\.5.rounded-full');
    const verticalConnectorCount = await verticalConnectors.count();
    console.log(`Found ${verticalConnectorCount} vertical connector lines`);
    
    // Get vertical step indicators - they're in a flex-col container with w-0.5 connectors
    // Find step indicators that have vertical connectors as siblings
    const verticalStepParent = verticalConnectors.first().locator('..');
    const verticalStepContainer = verticalStepParent.locator('..');
    const verticalSteps = verticalStepContainer.locator('[data-step-index]');
    const verticalStepCount = await verticalSteps.count();
    console.log(`Found ${verticalStepCount} vertical step indicators`);
    
    // Check vertical step connections
    if (verticalStepCount >= 2 && verticalConnectorCount >= 1) {
      for (let i = 0; i < Math.min(2, verticalStepCount - 1); i++) {
        const currentStep = verticalSteps.nth(i);
        const nextStep = verticalSteps.nth(i + 1);
        const connector = verticalConnectors.nth(i);
        
        const currentBox = await currentStep.boundingBox();
        const nextBox = await nextStep.boundingBox();
        const connectorBox = await connector.boundingBox();
        
        if (currentBox && nextBox && connectorBox) {
          const currentCenterX = currentBox.x + currentBox.width / 2;
          const currentBottomY = currentBox.y + currentBox.height;
          const nextCenterX = nextBox.x + nextBox.width / 2;
          const nextTopY = nextBox.y;
          
          const connectorCenterX = connectorBox.x + connectorBox.width / 2;
          const connectorTopY = connectorBox.y;
          const connectorBottomY = connectorBox.y + connectorBox.height;
          
          console.log(`\nVertical Connector ${i} Analysis:`);
          console.log(`  Current step:`);
          console.log(`    Center X: ${currentCenterX.toFixed(1)}px`);
          console.log(`    Bottom Y: ${currentBottomY.toFixed(1)}px`);
          console.log(`  Next step:`);
          console.log(`    Center X: ${nextCenterX.toFixed(1)}px`);
          console.log(`    Top Y: ${nextTopY.toFixed(1)}px`);
          console.log(`  Connector:`);
          console.log(`    Center X: ${connectorCenterX.toFixed(1)}px`);
          console.log(`    Top Y: ${connectorTopY.toFixed(1)}px`);
          console.log(`    Bottom Y: ${connectorBottomY.toFixed(1)}px`);
          
          const horizontalAligned = Math.abs(connectorCenterX - currentCenterX) < 3;
          const connectsAtBottom = Math.abs(connectorTopY - currentBottomY) < 3;
          const connectsAtTop = Math.abs(connectorBottomY - nextTopY) < 3;
          
          console.log(`\n  ✅ Horizontally aligned: ${horizontalAligned}`);
          console.log(`  ✅ Connects at current bottom: ${connectsAtBottom}`);
          console.log(`  ✅ Connects at next top: ${connectsAtTop}`);
          
          if (!horizontalAligned || !connectsAtBottom || !connectsAtTop) {
            console.log(`  ⚠️  BUG: Vertical connector line ${i} not properly connecting!`);
            if (!horizontalAligned) {
              console.log(`     - Horizontal misalignment: ${Math.abs(connectorCenterX - currentCenterX).toFixed(1)}px`);
            }
            if (!connectsAtBottom) {
              console.log(`     - Gap at bottom: ${Math.abs(connectorTopY - currentBottomY).toFixed(1)}px`);
            }
            if (!connectsAtTop) {
              console.log(`     - Gap at top: ${Math.abs(connectorBottomY - nextTopY).toFixed(1)}px`);
            }
          }
        }
      }
    }
    
    // ========== GENERAL BUG CHECKS ==========
    console.log(`\n\n--- General Bug Checks ---`);
    
    // Check for any elements with zero width or height
    const allStepsForCheck = page.locator('[data-step-index]');
    const finalStepCount = await allStepsForCheck.count();
    let zeroSizeCount = 0;
    for (let i = 0; i < finalStepCount; i++) {
      const box = await allStepsForCheck.nth(i).boundingBox();
      if (box && (box.width === 0 || box.height === 0)) {
        zeroSizeCount++;
      }
    }
    console.log(`Steps with zero size: ${zeroSizeCount}`);
    if (zeroSizeCount > 0) {
      console.log(`  ⚠️  BUG: Found ${zeroSizeCount} step indicators with zero size!`);
    }
    
    // Check for overlapping steps
    const steps = await allStepsForCheck.all();
    let overlappingCount = 0;
    for (let i = 0; i < steps.length - 1; i++) {
      const box1 = await steps[i].boundingBox();
      const box2 = await steps[i + 1].boundingBox();
      if (box1 && box2) {
        // Check if they overlap (simple bounding box check)
        const overlaps = !(
          box1.x + box1.width < box2.x ||
          box2.x + box2.width < box1.x ||
          box1.y + box1.height < box2.y ||
          box2.y + box2.height < box1.y
        );
        if (overlaps) {
          overlappingCount++;
        }
      }
    }
    console.log(`Overlapping steps: ${overlappingCount}`);
    if (overlappingCount > 0) {
      console.log(`  ⚠️  BUG: Found ${overlappingCount} pairs of overlapping steps!`);
    }
    
    // Check connector line visibility
    const allConnectors = page.locator('.absolute.rounded-full').filter({
      hasNot: page.locator('[data-step-index]')
    });
    const connectorCount = await allConnectors.count();
    let invisibleConnectorCount = 0;
    for (let i = 0; i < connectorCount; i++) {
      const connector = allConnectors.nth(i);
      const isVisible = await connector.isVisible();
      if (!isVisible) {
        invisibleConnectorCount++;
      }
    }
    console.log(`Invisible connector lines: ${invisibleConnectorCount}`);
    if (invisibleConnectorCount > 0) {
      console.log(`  ⚠️  BUG: Found ${invisibleConnectorCount} invisible connector lines!`);
    }
    
    // Take screenshots
    await page.screenshot({ 
      path: 'e2e/comprehensive-stepper-check-horizontal.png',
      fullPage: false 
    });
    
    // Try to find vertical stepper, but don't fail if not found
    try {
      await page.locator('text=Vertical Stepper').scrollIntoViewIfNeeded({ timeout: 5000 });
      await page.waitForTimeout(500);
      await page.screenshot({ 
        path: 'e2e/comprehensive-stepper-check-vertical.png',
        fullPage: false 
      });
    } catch (e) {
      console.log('Vertical stepper not found, skipping screenshot');
    }
    
    console.log(`\n=== Comprehensive Check Complete ===`);
    console.log(`Screenshots saved to:`);
    console.log(`  - e2e/comprehensive-stepper-check-horizontal.png`);
    console.log(`  - e2e/comprehensive-stepper-check-vertical.png\n`);
  });
});

