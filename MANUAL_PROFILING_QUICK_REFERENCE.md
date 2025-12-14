# Manual Profiling Quick Reference Card

**Application URL:** http://localhost:4175  
**Login Credentials:**
- Email: `johnfroberts11@gmail.com`
- Password: `Jasmine629!`

---

## 🎯 Quick Workflow

### For Each Scenario:

1. **Open Chrome DevTools** → `Cmd + Option + I`
2. **Go to Performance Tab**
3. **Click Record (⚫)** → `Cmd + E`
4. **Perform Actions** (see below)
5. **Click Stop (⏹️)** → `Cmd + E`
6. **Collect Metrics** (see below)
7. **Record in JSON file**

---

## 📊 Scenario 3: Tab Switching

**Actions:**
1. Navigate to your profile page
2. Start recording
3. Click "Collaborations" tab → wait 2s
4. Click "Trades" tab → wait 2s
5. Click "About" tab → wait 1s
6. Stop recording

**Metrics to Collect:**
- Switch time (click → paint complete)
- Scripting time
- Rendering time
- Painting time

**React DevTools Profiler:**
- Record same sequence
- Note render duration for each tab switch

---

## 📊 Scenario 4: Infinite Scroll

**Actions:**
1. Go to profile → Collaborations tab
2. Start recording
3. Scroll down slowly to trigger lazy loading
4. Continue until 3-5 new items load
5. Wait 2s after last item
6. Stop recording

**Metrics to Collect:**
- Scroll FPS (target: 60 FPS)
- Dropped frames (red bars in FPS chart)
- Load time per batch
- Scripting time
- Network requests (Network tab)
- Data transfer (Network tab)

---

## 📊 Scenario 5: Modal Operations

**Actions:**
1. Go to your profile page
2. Start recording
3. Click "Edit Profile" → wait 1s
4. Click "Cancel" or "X" → wait 1s
5. Repeat 2 more times (3 cycles total)
6. Stop recording

**Metrics to Collect:**
- Modal open time
- Modal close time
- Animation duration
- Scripting time
- Rendering time

**React DevTools Profiler:**
- Component render time
- Re-render count

---

## 📊 Scenario 6: Share Menu

**Actions:**
1. Go to your profile page
2. Start recording
3. Click "Share" button → wait 1s
4. Hover over menu items
5. Click outside to close → wait 1s
6. Stop recording

**Metrics to Collect:**
- Menu open time
- Menu close time
- Hover response time
- Scripting time
- Rendering time

---

## 📝 How to Read Performance Panel

### Timeline Sections:
- **FPS Chart** (top): Green = 60 FPS, Red = dropped frames
- **CPU Chart**: Shows scripting (yellow), rendering (purple), painting (green)
- **Network**: Shows requests during recording
- **Frames**: Individual frame timing

### Key Metrics:
- **Scripting Time**: Yellow sections in CPU chart
- **Rendering Time**: Purple sections in CPU chart
- **Painting Time**: Green sections in CPU chart
- **Total Time**: Duration from start to end of action

### Finding Specific Times:
1. Zoom into the timeline (scroll wheel)
2. Find the click event (red marker)
3. Find the next paint event (green bar)
4. Measure time between them

---

## 📝 Data Entry Format

**File:** `docs/PHASE_3A_MANUAL_PROFILING_DATA.json`

**Example Entry:**
```json
"aboutToCollaborations": {
  "switchTime": "150ms",
  "renderDuration": "45ms",
  "scripting": "80ms",
  "rendering": "50ms",
  "painting": "20ms"
}
```

**Tips:**
- Round to nearest millisecond
- Include units (ms, FPS, KB)
- Add observations in "observations" array
- Update "status" to "COMPLETED" when done

---

## 🔧 Troubleshooting

**If you get logged out:**
- Re-login and continue
- This is the auth persistence issue we're working around

**If DevTools is slow:**
- Close other tabs
- Disable extensions
- Restart Chrome

**If you can't find a metric:**
- Take a screenshot
- Note what you can measure
- Add to observations

---

## ✅ Completion Checklist

- [ ] Scenario 3: Tab Switching - All 3 transitions measured
- [ ] Scenario 4: Infinite Scroll - FPS, load time, network measured
- [ ] Scenario 5: Modal Operations - Open/close times measured
- [ ] Scenario 6: Share Menu - Open/close times measured
- [ ] All data entered in `docs/PHASE_3A_MANUAL_PROFILING_DATA.json`
- [ ] Status updated to "COMPLETED" for each scenario
- [ ] Observations added for any issues or insights

---

## 📞 When You're Done

Let me know and I'll:
1. Review the collected data
2. Merge with automated profiling data
3. Update bottleneck analysis
4. Finalize Phase 3B optimization plan

---

**Good luck! Take your time and be thorough. Quality data = better optimizations! 🚀**

