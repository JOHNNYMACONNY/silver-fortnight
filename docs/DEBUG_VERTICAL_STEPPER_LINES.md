# Vertical Stepper Connector Lines Debug

**Issue:** Vertical connector lines are not connecting from step to step. The line from step 1 connects to step 1's circle but doesn't extend down to connect with step 2's circle.

**Date:** January 2025

---

## Hypotheses

### Hypothesis A: Line height calculation issue
**Problem:** The connector line uses `calc(100% - {circleBottom})` which refers to the step container's height, but the next circle is in a different container separated by `gap-6` (24px for lg size).

**Current Implementation:**
- Line starts at `top: 40px` (bottom of circle for lg size)
- Line was using `height: calc(100% - 40px)` 
- Changed to use `bottom: -24px` to extend into gap

**Fix Applied:**
- Removed `height` property
- Added `bottom: -${config.gapRem * 16}px` to extend into gap
- Added `overflow-visible` to step containers and parent container

### Hypothesis B: Gap calculation mismatch
**Problem:** The gap between containers is `gap-6` (1.5rem = 24px), but the line might need to extend slightly more to actually reach INTO the next circle's top edge, not just to where the next container starts.

### Hypothesis C: Container overflow clipping
**Problem:** Even with `overflow-visible`, parent elements might still clip the line.

**Fix Applied:**
- Added `overflow-visible` to step containers (`<div className="flex items-start relative overflow-visible">`)
- Added `overflow-visible` to parent container (`<div className={cn('flex flex-col', config.spacing, 'overflow-visible', className)}>`)

---

## Changes Made

### 1. Step Container
**File:** `src/components/ui/ProgressStepper.tsx:507`
- Added `overflow-visible` to allow line to extend beyond container

### 2. Parent Container  
**File:** `src/components/ui/ProgressStepper.tsx:477`
- Added `overflow-visible` to parent flex container

### 3. Connector Line Positioning
**File:** `src/components/ui/ProgressStepper.tsx:543-577`
- Changed from `height: calc(100% - {circleBottom})` to using `bottom: -{gap}px`
- This makes the line extend from `top: {circleBottom}` through the container and into the gap

---

## Expected Behavior

After fix:
1. Line starts at bottom of current circle (e.g., 40px from top for lg size)
2. Line extends through remaining container height
3. Line extends 24px into the gap (for gap-6 = 24px)
4. Line should reach the top of the next circle

---

## Testing

Please navigate to `/test/ux-components` and check the vertical stepper. The connector lines should now:
- Start from the bottom of each circle
- Extend through the gap between steps
- Connect to the top of the next circle

