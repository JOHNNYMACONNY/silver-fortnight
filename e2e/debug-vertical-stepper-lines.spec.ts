import { test, expect } from '@playwright/test';

test.describe('Vertical Stepper Connector Lines Debug', () => {
  test('inspect vertical connector line positioning and connection', async ({ page }) => {
    // Collect console errors
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
        console.log(`Console error: ${msg.text()}`);
      }
    });

    // Collect page errors
    page.on('pageerror', error => {
      console.log(`Page error: ${error.message}`);
      consoleErrors.push(error.message);
    });

    // Navigate to the test page
    await page.goto('http://localhost:5175/test/ux-components', { waitUntil: 'domcontentloaded' });
    
    // Wait for React to hydrate and lazy-loaded component to load
    await page.waitForLoadState('networkidle');
    
    // Wait for the lazy-loaded component to actually render
    // Check for specific content that indicates the page has loaded
    try {
      await page.waitForSelector('text=/Vertical Stepper/i', { timeout: 15000 });
      console.log('Found "Vertical Stepper" text - page loaded');
    } catch (e) {
      console.log('Waiting for page content...');
      await page.waitForTimeout(8000); // Extra wait for lazy loading
    }

    console.log('=== Vertical Stepper Connector Lines Debug Report ===');
    console.log(`Console errors: ${consoleErrors.length}`);
    if (consoleErrors.length > 0) {
      console.log('Errors:', consoleErrors);
    }

    // Check if page loaded
    const pageTitle = await page.title();
    console.log(`Page title: ${pageTitle}`);
    
    // Check page URL
    const url = page.url();
    console.log(`Current URL: ${url}`);
    
    // Check if body has content
    const bodyText = await page.locator('body').textContent();
    console.log(`Body has content: ${bodyText ? 'Yes' : 'No'}, length: ${bodyText?.length || 0}`);

    // Use evaluate to inspect the actual DOM
    const debugInfo = await page.evaluate(() => {
      const info: any = {
        stepIndicators: [],
        connectorLines: [],
        containers: [],
      };

      // Find all elements with data-step-index
      const indicators = Array.from(document.querySelectorAll('[data-step-index]'));
      info.stepIndicators = indicators.map((el, idx) => {
        const rect = el.getBoundingClientRect();
        const styles = window.getComputedStyle(el);
        return {
          index: el.getAttribute('data-step-index'),
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height,
          bottom: rect.bottom,
          className: el.className,
        };
      });

      // Find all absolutely positioned divs (potential connector lines)
      const allDivs = Array.from(document.querySelectorAll('div'));
      const connectorLines = allDivs.filter(div => {
        const styles = window.getComputedStyle(div);
        return styles.position === 'absolute' && 
               parseFloat(styles.width) <= 4 && 
               parseFloat(styles.height) > 20 &&
               (styles.backgroundColor !== 'rgba(0, 0, 0, 0)' && styles.backgroundColor !== 'transparent');
      });

      info.connectorLines = connectorLines.map((el, idx) => {
        const rect = el.getBoundingClientRect();
        const styles = window.getComputedStyle(el);
        return {
          index: idx,
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height,
          top: rect.top,
          bottom: rect.bottom,
          left: rect.left,
          backgroundColor: styles.backgroundColor,
          computedTop: styles.top,
          computedLeft: styles.left,
          computedBottom: styles.bottom,
          computedHeight: styles.height,
        };
      });

      // Find step containers (relative positioned divs with step indicators)
      const stepContainers = allDivs.filter(div => {
        const styles = window.getComputedStyle(div);
        const hasStepIndicator = div.querySelector('[data-step-index]');
        return styles.position === 'relative' && hasStepIndicator !== null;
      });

      info.containers = stepContainers.map((el, idx) => {
        const rect = el.getBoundingClientRect();
        const styles = window.getComputedStyle(el);
        const stepIndicator = el.querySelector('[data-step-index]');
        const indicatorRect = stepIndicator?.getBoundingClientRect();
        return {
          index: idx,
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height,
          bottom: rect.bottom,
          overflow: styles.overflow,
          paddingBottom: styles.paddingBottom,
          indicatorBottom: indicatorRect?.bottom,
          indicatorHeight: indicatorRect?.height,
        };
      });

      return info;
    });

    console.log(`Found ${debugInfo.stepIndicators.length} step indicators`);
    console.log(`Found ${debugInfo.connectorLines.length} connector lines`);
    console.log(`Found ${debugInfo.containers.length} step containers`);

    // Analyze vertical stepper specifically
    if (debugInfo.stepIndicators.length >= 3) {
      // Sort indicators by Y position to find vertical layout
      const sortedIndicators = [...debugInfo.stepIndicators].sort((a, b) => a.y - b.y);
      // Vertical layout: steps have similar X positions (within 20px) and different Y positions
      const xPositions = sortedIndicators.map(ind => ind.x);
      const avgX = xPositions.reduce((sum, x) => sum + x, 0) / xPositions.length;
      const xVariance = xPositions.reduce((sum, x) => sum + Math.pow(x - avgX, 2), 0) / xPositions.length;
      const yDifferences = sortedIndicators.slice(1).map((ind, idx) => ind.y - sortedIndicators[idx].y);
      const hasVerticalSpacing = yDifferences.every(diff => diff > 30); // Steps are spaced vertically
      const isVertical = sortedIndicators.length > 1 && 
                         xVariance < 400 && // X positions are close together (variance < 20px^2)
                         hasVerticalSpacing; // Steps are spaced vertically

      if (isVertical) {
        console.log('\n=== Vertical Stepper Analysis ===');
        console.log(`Detected vertical layout (${sortedIndicators.length} steps)`);

        for (let i = 0; i < sortedIndicators.length - 1; i++) {
          const currentCircle = sortedIndicators[i];
          const nextCircle = sortedIndicators[i + 1];
          
          console.log(`\n--- Step ${i + 1} to Step ${i + 2} ---`);
          console.log(`Current circle:`);
          console.log(`  Y position: ${currentCircle.y.toFixed(2)}px`);
          console.log(`  Bottom: ${currentCircle.bottom.toFixed(2)}px`);
          console.log(`  Height: ${currentCircle.height.toFixed(2)}px`);
          console.log(`Next circle:`);
          console.log(`  Y position: ${nextCircle.y.toFixed(2)}px`);
          console.log(`  Top: ${nextCircle.y.toFixed(2)}px`);
          console.log(`  Height: ${nextCircle.height.toFixed(2)}px`);

          // Find connector line between these steps
          const lineBetween = debugInfo.connectorLines.find(line => {
            const lineBottom = line.bottom;
            const currentBottom = currentCircle.bottom;
            const nextTop = nextCircle.y;
            // Line should be near current circle bottom and extend toward next circle
            return Math.abs(line.top - currentBottom) < 10 && 
                   line.y < nextTop + 10 &&
                   line.y >= currentBottom - 5;
          });

          if (lineBetween) {
            console.log(`Connector line found:`);
            console.log(`  Top: ${lineBetween.top.toFixed(2)}px`);
            console.log(`  Bottom: ${lineBetween.bottom.toFixed(2)}px`);
            console.log(`  Height: ${lineBetween.height.toFixed(2)}px`);
            console.log(`  Computed top: ${lineBetween.computedTop}`);
            console.log(`  Computed bottom: ${lineBetween.computedBottom}`);
            console.log(`  Computed height: ${lineBetween.computedHeight}`);
            console.log(`  Background: ${lineBetween.backgroundColor}`);

            // Calculate connection status
            const circleBottom = currentCircle.bottom;
            const lineTop = lineBetween.top;
            const lineBottom = lineBetween.bottom;
            const nextCircleTop = nextCircle.y;

            const gapToCurrentCircle = Math.abs(lineTop - circleBottom);
            const gapToNextCircle = nextCircleTop - lineBottom;

            console.log(`Connection Analysis:`);
            console.log(`  Gap from current circle bottom to line top: ${gapToCurrentCircle.toFixed(2)}px`);
            console.log(`  Gap from line bottom to next circle top: ${gapToNextCircle.toFixed(2)}px`);
            console.log(`  Line connects to current circle: ${gapToCurrentCircle < 3}`);
            console.log(`  Line connects to next circle: ${gapToNextCircle <= 3}`);

            if (gapToCurrentCircle >= 3 || gapToNextCircle > 3) {
              console.log(`  ⚠️ ISSUE: Line does not connect properly!`);
              console.log(`    Current circle bottom: ${circleBottom.toFixed(2)}px`);
              console.log(`    Line should start at: ${circleBottom.toFixed(2)}px (currently at ${lineTop.toFixed(2)}px)`);
              console.log(`    Line should end at: ${nextCircleTop.toFixed(2)}px (currently at ${lineBottom.toFixed(2)}px)`);
              console.log(`    Missing height: ${(nextCircleTop - lineBottom).toFixed(2)}px`);
            } else {
              console.log(`  ✅ Line connects properly`);
            }
          } else {
            console.log(`⚠️ No connector line found between step ${i + 1} and ${i + 2}`);
          }
        }

        // Container analysis
        if (debugInfo.containers.length >= 2) {
          console.log(`\n--- Container Analysis ---`);
          debugInfo.containers.forEach((container, idx) => {
            console.log(`Container ${idx}:`);
            console.log(`  Height: ${container.height.toFixed(2)}px`);
            console.log(`  Bottom: ${container.bottom.toFixed(2)}px`);
            console.log(`  Overflow: ${container.overflow}`);
            console.log(`  PaddingBottom: ${container.paddingBottom}`);
            console.log(`  Indicator bottom: ${container.indicatorBottom?.toFixed(2)}px`);
          });
        }
      } else {
        console.log('\n⚠️ Steps appear to be in horizontal layout, not vertical');
      }
    } else {
      console.log('\n⚠️ Not enough step indicators found to analyze');
      console.log('Step indicators found:', debugInfo.stepIndicators);
    }

    console.log('\n=== Debug Report Complete ===');
  });
});
