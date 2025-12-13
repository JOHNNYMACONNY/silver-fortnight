import { test } from '@playwright/test';

test('inspect vertical connector line positioning and connection', async ({ page }) => {
  await page.goto('http://localhost:5175/test/ux-components');
  await page.waitForLoadState('networkidle');
  
  // Wait for "Vertical Stepper" heading to appear
  await page.waitForSelector('text=/Vertical Stepper/i', { timeout: 15000 });
  await page.waitForTimeout(2000); // Wait for components to fully render

  console.log('=== Vertical Stepper Connector Lines Debug Report ===');

  // Find the vertical stepper section by locating elements near the "Vertical Stepper" heading
  const debugInfo = await page.evaluate(() => {
    const info: any = {
      stepIndicators: [],
      connectorLines: [],
      containers: [],
    };

    // Find all step indicators on the page
    const allIndicators = Array.from(document.querySelectorAll('[data-step-index]'));
    
    // Find the "Vertical Stepper" heading
    const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
    const verticalHeading = headings.find(h => h.textContent?.includes('Vertical Stepper'));
    
    if (!verticalHeading) {
      return { error: 'Vertical Stepper heading not found' };
    }

    const headingRect = verticalHeading.getBoundingClientRect();
    const headingBottom = headingRect.bottom;

    // Filter indicators that appear after the "Vertical Stepper" heading
    // and before the next major section (or end of document)
    const verticalIndicators = allIndicators.filter(indicator => {
      const rect = indicator.getBoundingClientRect();
      // Indicator should be below the heading
      return rect.y > headingBottom - 50 && rect.y < headingBottom + 1000;
    });

    info.stepIndicators = verticalIndicators.map((el, idx) => {
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

    // Sort by Y position to ensure correct order
    info.stepIndicators.sort((a, b) => a.y - b.y);

    // Find connector lines - look for absolutely positioned divs near the step indicators
    const allDivs = Array.from(document.querySelectorAll('div'));
    const connectorLines = allDivs.filter(div => {
      const styles = window.getComputedStyle(div);
      const rect = div.getBoundingClientRect();
      // Connector line: absolute, thin width (2-4px), tall height (>20px), positioned near indicators
      const isThin = parseFloat(styles.width) <= 4 && parseFloat(styles.width) > 0;
      const isTall = parseFloat(styles.height) > 20;
      const isAbsolute = styles.position === 'absolute';
      const isNearIndicators = info.stepIndicators.some(ind => 
        Math.abs(rect.x - ind.x) < 30 && 
        rect.y >= ind.bottom - 10 && 
        rect.y < ind.bottom + 200
      );
      const hasColor = styles.backgroundColor && 
                       styles.backgroundColor !== 'rgba(0, 0, 0, 0)' && 
                       styles.backgroundColor !== 'transparent';
      
      return isAbsolute && isThin && isTall && isNearIndicators && hasColor;
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
        parentClassName: el.parentElement?.className,
      };
    });

    return info;
  });

  if (debugInfo.error) {
    console.log(`Error: ${debugInfo.error}`);
    return;
  }

  console.log(`Found ${debugInfo.stepIndicators.length} step indicators in vertical stepper`);
  console.log(`Found ${debugInfo.connectorLines.length} connector lines`);

  if (debugInfo.stepIndicators.length >= 2) {
    console.log('\n=== Vertical Stepper Analysis ===');
    
    for (let i = 0; i < debugInfo.stepIndicators.length - 1; i++) {
      const currentCircle = debugInfo.stepIndicators[i];
      const nextCircle = debugInfo.stepIndicators[i + 1];
      
      console.log(`\n--- Step ${i + 1} to Step ${i + 2} ---`);
      console.log(`Current circle:`);
      console.log(`  Y position: ${currentCircle.y.toFixed(2)}px`);
      console.log(`  Bottom: ${currentCircle.bottom.toFixed(2)}px`);
      console.log(`  Height: ${currentCircle.height.toFixed(2)}px`);
      console.log(`  X position: ${currentCircle.x.toFixed(2)}px`);
      console.log(`Next circle:`);
      console.log(`  Y position: ${nextCircle.y.toFixed(2)}px`);
      console.log(`  Top: ${nextCircle.y.toFixed(2)}px`);
      console.log(`  Height: ${nextCircle.height.toFixed(2)}px`);
      console.log(`  X position: ${nextCircle.x.toFixed(2)}px`);

      // Find connector line between these steps
      const circleBottom = currentCircle.bottom;
      const nextCircleTop = nextCircle.y;
      
      const lineBetween = debugInfo.connectorLines.find(line => {
        const lineTop = line.top;
        const lineBottom = line.bottom;
        // Line should start near current circle bottom and end near next circle top
        const startsNearCurrent = Math.abs(lineTop - circleBottom) < 5;
        const endsNearNext = Math.abs(lineBottom - nextCircleTop) <= 5;
        const isVertical = Math.abs(line.x - currentCircle.x) < 30; // Same X position
        
        return isVertical && (startsNearCurrent || endsNearNext || 
               (lineTop >= circleBottom - 5 && lineBottom <= nextCircleTop + 5));
      });

      if (lineBetween) {
        console.log(`\nConnector line found:`);
        console.log(`  Top: ${lineBetween.top.toFixed(2)}px`);
        console.log(`  Bottom: ${lineBetween.bottom.toFixed(2)}px`);
        console.log(`  Height: ${lineBetween.height.toFixed(2)}px`);
        console.log(`  X position: ${lineBetween.x.toFixed(2)}px`);
        console.log(`  Computed top: ${lineBetween.computedTop}`);
        console.log(`  Computed bottom: ${lineBetween.computedBottom}`);
        console.log(`  Computed height: ${lineBetween.computedHeight}`);
        console.log(`  Background: ${lineBetween.backgroundColor}`);

        // Calculate connection status
        const lineTop = lineBetween.top;
        const lineBottom = lineBetween.bottom;

        const gapToCurrentCircle = Math.abs(lineTop - circleBottom);
        const gapToNextCircle = Math.abs(lineBottom - nextCircleTop);

        console.log(`\nConnection Analysis:`);
        console.log(`  Current circle bottom: ${circleBottom.toFixed(2)}px`);
        console.log(`  Line top: ${lineTop.toFixed(2)}px`);
        console.log(`  Line bottom: ${lineBottom.toFixed(2)}px`);
        console.log(`  Next circle top: ${nextCircleTop.toFixed(2)}px`);
        console.log(`  Gap from current circle bottom to line top: ${gapToCurrentCircle.toFixed(2)}px`);
        console.log(`  Gap from line bottom to next circle top: ${gapToNextCircle.toFixed(2)}px`);
        console.log(`  Line connects to current circle: ${gapToCurrentCircle <= 3} (gap: ${gapToCurrentCircle.toFixed(2)}px)`);
        console.log(`  Line connects to next circle: ${gapToNextCircle <= 3} (gap: ${gapToNextCircle.toFixed(2)}px)`);

        if (gapToCurrentCircle > 3 || gapToNextCircle > 3) {
          console.log(`  ⚠️ ISSUE: Line does not connect properly!`);
          console.log(`    Current circle bottom: ${circleBottom.toFixed(2)}px`);
          console.log(`    Line should start at: ${circleBottom.toFixed(2)}px (currently at ${lineTop.toFixed(2)}px, gap: ${gapToCurrentCircle.toFixed(2)}px)`);
          console.log(`    Line should end at: ${nextCircleTop.toFixed(2)}px (currently at ${lineBottom.toFixed(2)}px, gap: ${gapToNextCircle.toFixed(2)}px)`);
          if (lineBottom < nextCircleTop) {
            console.log(`    Missing height: ${(nextCircleTop - lineBottom).toFixed(2)}px`);
          }
        } else {
          console.log(`  ✅ Line connects properly!`);
        }
      } else {
        console.log(`\n⚠️ No connector line found between step ${i + 1} and ${i + 2}`);
        console.log(`  Looking for line from ${circleBottom.toFixed(2)}px to ${nextCircleTop.toFixed(2)}px`);
        console.log(`  Available connector lines: ${debugInfo.connectorLines.length}`);
        if (debugInfo.connectorLines.length > 0) {
          debugInfo.connectorLines.forEach((line, idx) => {
            console.log(`    Line ${idx}: top=${line.top.toFixed(2)}, bottom=${line.bottom.toFixed(2)}, x=${line.x.toFixed(2)}`);
          });
        }
      }
    }
  } else {
    console.log(`⚠️ Not enough step indicators found (${debugInfo.stepIndicators.length}, need at least 2)`);
  }

  console.log('\n=== Debug Report Complete ===');
});

