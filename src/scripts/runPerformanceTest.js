/**
 * Performance Test Runner
 * 
 * This script launches a headless browser to collect performance metrics
 * for the TradeYa application.
 * 
 * Usage:
 * node src/scripts/runPerformanceTest.js
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// URLs to test
const urls = [
  'http://localhost:5174/', // Home page
  'http://localhost:5174/dashboard', // Dashboard
  'http://localhost:5174/trades', // Trades page
  'http://localhost:5174/profile', // Profile page
  'http://localhost:5174/messages', // Messages page
  'http://localhost:5174/projects', // Projects/Collaborations page
];

// Function to run the performance test
async function runPerformanceTest() {
  console.log('Starting performance test...');
  
  // Launch browser
  const browser = await puppeteer.launch({
    headless: false, // Set to true for headless mode
    defaultViewport: {
      width: 1280,
      height: 800
    }
  });
  
  const page = await browser.newPage();
  
  // Enable performance metrics collection
  await page.coverage.startJSCoverage();
  
  // Collect metrics for each URL
  const metrics = {};
  
  for (const url of urls) {
    console.log(`Testing ${url}...`);
    
    // Navigate to the URL
    await page.goto(url, { waitUntil: 'networkidle2' });
    
    // Wait for metrics to be collected
    await page.waitForTimeout(5000);
    
    // Get metrics from the page
    const pageMetrics = await page.evaluate(() => {
      return window.__PERFORMANCE_METRICS__ || {};
    });
    
    // Merge metrics
    Object.assign(metrics, pageMetrics);
    
    console.log(`Completed testing ${url}`);
  }
  
  // Generate report
  const report = await page.evaluate(() => {
    return window.__GENERATE_METRICS_REPORT__ ? window.__GENERATE_METRICS_REPORT__() : '';
  });
  
  // Get JS coverage
  const jsCoverage = await page.coverage.stopJSCoverage();
  
  // Calculate unused bytes
  let totalBytes = 0;
  let usedBytes = 0;
  
  for (const entry of jsCoverage) {
    totalBytes += entry.text.length;
    
    for (const range of entry.ranges) {
      usedBytes += range.end - range.start;
    }
  }
  
  const unusedRatio = (totalBytes - usedBytes) / totalBytes * 100;
  
  console.log(`Total JS bytes: ${totalBytes}`);
  console.log(`Used JS bytes: ${usedBytes}`);
  console.log(`Unused JS bytes: ${totalBytes - usedBytes} (${unusedRatio.toFixed(2)}%)`);
  
  // Add coverage information to the report
  const coverageReport = `
## JavaScript Code Coverage

| Metric | Value |
|--------|-------|
| Total JS bytes | ${totalBytes} |
| Used JS bytes | ${usedBytes} |
| Unused JS bytes | ${totalBytes - usedBytes} |
| Unused ratio | ${unusedRatio.toFixed(2)}% |

`;
  
  const finalReport = report + coverageReport;
  
  // Save the report
  const reportPath = path.resolve(__dirname, '../../src/components/ui/PERFORMANCE_METRICS_REPORT.md');
  fs.writeFileSync(reportPath, finalReport);
  
  console.log(`Report saved to ${reportPath}`);
  
  // Close the browser
  await browser.close();
  
  console.log('Performance test completed.');
}

// Run the test
runPerformanceTest().catch(console.error);
