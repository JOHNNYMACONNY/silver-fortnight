# Phase 3A: ProfilePage Performance Profiling Guide

## Quick Start

### 1. Build and Start Preview Server

```bash
# Build production bundle
npm run build

# Start preview server (runs on http://localhost:4173)
npm run preview
```

### 2. Open ProfilePage in Browser

```
http://localhost:4173/profile/[userId]
```

Replace `[userId]` with a test user ID from your database.

### 3. Access React DevTools Profiler

1. Open Chrome DevTools (F12)
2. Go to "React DevTools" tab (or install extension if not present)
3. Click "Profiler" tab
4. Click record button (red circle)
5. Perform action (page load, tab switch, etc.)
6. Click stop button
7. Analyze results in Flamegraph and Ranked views

## Profiling Scenarios - Step by Step

### Scenario 1: Initial Page Load (Cold Cache)

**Setup:**
```bash
# Clear browser cache
# In Chrome DevTools > Application > Clear site data
# Or use Ctrl+Shift+Delete
```

**Steps:**
1. Hard refresh ProfilePage (Ctrl+Shift+R)
2. Open React DevTools Profiler
3. Click record
4. Wait for page to fully load
5. Click stop
6. Note metrics in template

**Key Metrics to Record:**
- FCP (First Contentful Paint)
- LCP (Largest Contentful Paint)
- TTI (Time to Interactive)
- Total render time
- Number of re-renders
- Slowest component

---

### Scenario 2: Initial Page Load (Warm Cache)

**Setup:**
- Page already loaded once

**Steps:**
1. Refresh ProfilePage (F5)
2. Open React DevTools Profiler
3. Click record
4. Wait for page to load
5. Click stop
6. Compare with cold cache metrics

---

### Scenario 3: Tab Switching

**Setup:**
- ProfilePage loaded on About tab

**Steps:**
1. Open React DevTools Profiler
2. Click record
3. Click "Collaborations" tab
4. Wait for content to load
5. Click "Trades" tab
6. Wait for content to load
7. Click stop
8. Analyze each tab switch separately

**Key Metrics:**
- Render time per tab switch
- Re-renders per tab
- Slowest component per tab

---

### Scenario 4: Infinite Scroll

**Setup:**
- ProfilePage on Collaborations tab

**Steps:**
1. Open Chrome DevTools > Performance tab
2. Click record
3. Scroll to bottom of list
4. Wait for more items to load
5. Scroll again
6. Click stop
7. Analyze flame chart

**Key Metrics:**
- Scroll FPS (frames per second)
- Render time for new items
- Memory growth
- Network requests

---

### Scenario 5: Modal Operations

**Setup:**
- ProfilePage loaded

**Steps:**
1. Open React DevTools Profiler
2. Click record
3. Click "Edit Profile" button
4. Wait for modal to open
5. Click close button
6. Click stop

**Key Metrics:**
- Modal open time
- Modal close time
- Re-renders during modal lifecycle

---

### Scenario 6: Share Menu

**Setup:**
- ProfilePage loaded

**Steps:**
1. Open React DevTools Profiler
2. Click record
3. Click "Share" button
4. Interact with menu options
5. Click stop

**Key Metrics:**
- Menu render time
- Animation smoothness
- Re-renders

---

### Scenario 7: Data Refetch

**Setup:**
- ProfilePage loaded

**Steps:**
1. Open React DevTools Profiler
2. Click record
3. Trigger refetch (e.g., pull-to-refresh or refetch button)
4. Wait for data to update
5. Click stop

**Key Metrics:**
- Refetch time
- Re-render count
- Data update time

---

## Using the ProfilePageProfiler Utility

### In Browser Console

```javascript
// Start profiling
profilePageProfiler.startScenario('Initial Load');

// Perform actions...

// End profiling and collect metrics
await profilePageProfiler.endScenario('Initial Load', [
  'Page loaded successfully',
  'All tabs rendered'
]);

// View all metrics
profilePageProfiler.getAllMetrics();

// Export as JSON
console.log(profilePageProfiler.exportMetrics());

// Export as CSV
console.log(profilePageProfiler.exportMetricsCSV());
```

---

## Lighthouse Audit

### Automated Lighthouse Audit

```bash
# Install Lighthouse CLI
npm install -g @lhci/cli@latest

# Run audit on ProfilePage
lhci autorun --config=lighthouserc.json
```

### Manual Lighthouse Audit

1. Open Chrome DevTools (F12)
2. Go to "Lighthouse" tab
3. Select "Mobile" or "Desktop"
4. Click "Analyze page load"
5. Wait for audit to complete
6. Review scores and recommendations

---

## Data Collection Template

Create a file `PHASE_3A_PROFILING_DATA.json`:

```json
{
  "date": "2025-11-02",
  "scenarios": [
    {
      "name": "Initial Page Load (Cold Cache)",
      "metrics": {
        "fcp": 0,
        "lcp": 0,
        "tti": 0,
        "tbt": 0,
        "renderTime": 0,
        "reRenders": 0
      },
      "components": [],
      "observations": []
    }
  ]
}
```

---

## Troubleshooting

### React DevTools Not Showing

- Install React DevTools extension
- Ensure development mode (check console for React warnings)
- Refresh page after installing extension

### Lighthouse Not Available

- Update Chrome to latest version
- Clear browser cache
- Try incognito mode

### Metrics Not Collecting

- Check browser console for errors
- Ensure `web-vitals` library is loaded
- Verify PerformanceObserver API support

---

## Next Steps

1. Complete all 7 profiling scenarios
2. Collect metrics in `PHASE_3A_PROFILING_DATA.json`
3. Update `PHASE_3A_BASELINE_PERFORMANCE_REPORT.md`
4. Create bottleneck analysis document
5. Plan optimizations for Phase 3B

