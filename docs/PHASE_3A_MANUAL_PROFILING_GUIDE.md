# Phase 3A: Manual Profiling Guide for Scenarios 3-6

**Date:** 2025-12-14  
**Purpose:** Manual profiling instructions for scenarios that couldn't be automated due to auth persistence issues  
**Target Scenarios:** 3, 4, 5, 6

---

## 🎯 Overview

Since automated profiling couldn't capture scenarios 3-6 due to Firebase auth persistence issues in Playwright, we'll manually profile these scenarios using:
- **Chrome DevTools Performance Panel**
- **React DevTools Profiler**
- **Chrome DevTools Memory Panel**
- **Network Panel**

---

## 🛠️ Setup

### 1. Start the Application

```bash
# Build production bundle
npm run build

# Start preview server
npm run preview
```

**Expected:** Server running on `http://localhost:4173`

### 2. Open Chrome DevTools

1. Open Chrome browser
2. Navigate to `http://localhost:4173`
3. Open DevTools: `Cmd + Option + I` (Mac) or `F12` (Windows/Linux)
4. Open **Performance** tab

### 3. Login to Application

1. Click "Log In" button
2. Enter credentials:
   - **Email:** `johnfroberts11@gmail.com`
   - **Password:** `Jasmine629!`
3. Navigate to your profile page
4. Verify you can see: About, Collaborations, Trades tabs

---

## 📊 Scenario 3: Tab Switching (About → Collaborations → Trades)

### Objective
Measure performance when switching between tabs on ProfilePage.

### Steps

1. **Navigate to Profile Page**
   - URL: `http://localhost:4173/profile/{your-user-id}`
   - Ensure you're on the "About" tab (default)

2. **Start Performance Recording**
   - Click the **Record** button (⚫) in Performance panel
   - Or press `Cmd + E` (Mac) / `Ctrl + E` (Windows)

3. **Execute Tab Switching**
   - Click **"Collaborations"** tab
   - Wait 2 seconds
   - Click **"Trades"** tab
   - Wait 2 seconds
   - Click **"About"** tab
   - Wait 1 second

4. **Stop Recording**
   - Click **Stop** button (⏹️)
   - Or press `Cmd + E` / `Ctrl + E` again

5. **Collect Metrics**

   **From Performance Panel:**
   - **Tab Switch Time (About → Collaborations):** Look for the time between click event and paint
   - **Tab Switch Time (Collaborations → Trades):** Same measurement
   - **Tab Switch Time (Trades → About):** Same measurement
   - **Scripting Time:** Total JS execution time
   - **Rendering Time:** Total rendering time
   - **Painting Time:** Total painting time

   **From React DevTools Profiler:**
   - Open React DevTools → Profiler tab
   - Click **Record** (⚫)
   - Repeat tab switching sequence
   - Click **Stop** (⏹️)
   - Note **Render Duration** for each tab switch

   **Record in this format:**
   ```json
   {
     "aboutToCollaborations": {
       "switchTime": "XXXms",
       "renderDuration": "XXXms",
       "scripting": "XXXms",
       "rendering": "XXXms"
     },
     "collaborationsToTrades": { ... },
     "tradesToAbout": { ... }
   }
   ```

---

## 📊 Scenario 4: Infinite Scroll (Collaborations Tab)

### Objective
Measure performance during infinite scroll on Collaborations tab.

### Steps

1. **Navigate to Collaborations Tab**
   - Go to Profile Page
   - Click **"Collaborations"** tab
   - Ensure collaborations are loaded

2. **Start Performance Recording**
   - Click **Record** in Performance panel

3. **Execute Infinite Scroll**
   - Scroll down slowly to trigger lazy loading
   - Continue scrolling until 3-5 new items load
   - Wait 2 seconds after last item loads

4. **Stop Recording**

5. **Collect Metrics**

   **From Performance Panel:**
   - **Scroll FPS:** Look for frame rate during scrolling (target: 60 FPS)
   - **Scroll Jank:** Count dropped frames (red bars in FPS chart)
   - **Load Time per Batch:** Time from scroll trigger to new items rendered
   - **Total Scripting Time:** JS execution during scroll
   - **Layout Shifts:** Check for CLS during scroll

   **From Network Panel:**
   - **Requests Triggered:** Number of API calls during scroll
   - **Data Transfer:** Total KB transferred

   **Record in this format:**
   ```json
   {
     "scrollFPS": "XX FPS",
     "droppedFrames": "XX frames",
     "loadTimePerBatch": "XXXms",
     "scriptingTime": "XXXms",
     "networkRequests": "XX requests",
     "dataTransfer": "XX KB"
   }
   ```

---

## 📊 Scenario 5: Modal Operations (Edit Profile)

### Objective
Measure performance when opening and closing Edit Profile modal.

### Steps

1. **Navigate to Profile Page**
   - Ensure you're on your own profile
   - Locate **"Edit Profile"** button

2. **Start Performance Recording**

3. **Execute Modal Operations**
   - Click **"Edit Profile"** button
   - Wait 1 second (modal open)
   - Click **"Cancel"** or **"X"** button
   - Wait 1 second (modal close)
   - Repeat 2 more times (3 open/close cycles total)

4. **Stop Recording**

5. **Collect Metrics**

   **From Performance Panel:**
   - **Modal Open Time:** Time from click to modal fully rendered
   - **Modal Close Time:** Time from click to modal fully removed
   - **Animation Duration:** If modal has fade/slide animation
   - **Scripting Time:** JS execution for modal operations
   - **Rendering Time:** Layout and paint time

   **From React DevTools Profiler:**
   - **Component Render Time:** Time to render modal component
   - **Re-renders:** Number of re-renders triggered

   **Record in this format:**
   ```json
   {
     "modalOpenTime": "XXXms",
     "modalCloseTime": "XXXms",
     "animationDuration": "XXXms",
     "scriptingTime": "XXXms",
     "renderingTime": "XXXms",
     "componentRenderTime": "XXXms"
   }
   ```

---

## 📊 Scenario 6: Share Menu Interaction

### Objective
Measure performance when opening and interacting with Share menu.

### Steps

1. **Navigate to Profile Page**
   - Locate **"Share"** button (usually in profile header)

2. **Start Performance Recording**

3. **Execute Share Menu Interaction**
   - Click **"Share"** button
   - Wait 1 second (menu open)
   - Hover over menu items (if applicable)
   - Click outside to close menu
   - Wait 1 second (menu close)

4. **Stop Recording**

5. **Collect Metrics**

   **From Performance Panel:**
   - **Menu Open Time:** Time from click to menu fully rendered
   - **Menu Close Time:** Time from click to menu fully removed
   - **Hover Response Time:** Time for hover effects (if applicable)
   - **Scripting Time:** JS execution
   - **Rendering Time:** Layout and paint time

   **Record in this format:**
   ```json
   {
     "menuOpenTime": "XXXms",
     "menuCloseTime": "XXXms",
     "hoverResponseTime": "XXXms",
     "scriptingTime": "XXXms",
     "renderingTime": "XXXms"
   }
   ```

---

## 📝 Data Collection Template

Copy this template and fill in your measurements:

```json
{
  "scenario3_tabSwitching": {
    "aboutToCollaborations": {
      "switchTime": "",
      "renderDuration": "",
      "scripting": "",
      "rendering": ""
    },
    "collaborationsToTrades": {
      "switchTime": "",
      "renderDuration": "",
      "scripting": "",
      "rendering": ""
    },
    "tradesToAbout": {
      "switchTime": "",
      "renderDuration": "",
      "scripting": "",
      "rendering": ""
    }
  },
  "scenario4_infiniteScroll": {
    "scrollFPS": "",
    "droppedFrames": "",
    "loadTimePerBatch": "",
    "scriptingTime": "",
    "networkRequests": "",
    "dataTransfer": ""
  },
  "scenario5_modalOperations": {
    "modalOpenTime": "",
    "modalCloseTime": "",
    "animationDuration": "",
    "scriptingTime": "",
    "renderingTime": "",
    "componentRenderTime": ""
  },
  "scenario6_shareMenu": {
    "menuOpenTime": "",
    "menuCloseTime": "",
    "hoverResponseTime": "",
    "scriptingTime": "",
    "renderingTime": ""
  }
}
```

---

## 🎯 Next Steps

After collecting all metrics:
1. Save data to `docs/PHASE_3A_MANUAL_PROFILING_DATA.json`
2. Merge with automated profiling data
3. Update `docs/PHASE_3A_PRELIMINARY_BOTTLENECK_ANALYSIS.md`
4. Finalize Phase 3B optimization priorities

