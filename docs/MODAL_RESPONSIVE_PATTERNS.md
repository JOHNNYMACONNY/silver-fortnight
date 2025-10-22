# Modal Responsive Patterns

**Date:** October 9, 2025  
**Version:** 1.0  
**Status:** ✅ Active Standard  
**Component:** `src/components/ui/Modal.tsx`

---

## Overview

This document establishes the standard patterns for creating responsive, accessible, and glassmorphic modals in the TradeYa application. Follow these patterns to ensure consistency across all modal implementations.

---

## 🎯 Core Principles

### 1. Glassmorphic Design
- **Pure transparency**: No solid backgrounds, only blur effects
- **Light tints**: Use `bg-white/5` for subtle depth
- **Unified effect**: Modal container provides the glass effect, inner sections stay transparent

### 2. Mobile-First Approach
- **Base styles**: Designed for mobile (< 640px)
- **Progressive enhancement**: Add complexity for larger screens
- **Touch-friendly**: Minimum 44x44px interactive targets

### 3. Semantic HTML
- **Modal container**: `<dialog>` role with proper ARIA attributes
- **Sections**: `<header>`, `<section>`, `<footer>` elements
- **Headings**: Use `<h2>` for modal title (proper hierarchy)

### 4. Z-Index Layering
- **Modal backdrop**: `z-[70]` (above navbar at z-[55], below toasts at z-70+)
- **Never use**: `z-modal` (only z-40, too low)

---

## 📐 Responsive Size Classes

### Implementation (src/components/ui/Modal.tsx, Lines 34-41)

```typescript
const sizeClasses = {
  sm: 'max-w-sm w-full',
  md: 'max-w-md w-full',
  lg: 'max-w-lg w-full lg:max-w-2xl',
  xl: 'max-w-xl w-full md:max-w-2xl lg:max-w-3xl',
  xxl: 'max-w-2xl w-full md:max-w-3xl lg:max-w-4xl xl:max-w-5xl',
  full: 'max-w-full w-[calc(100%-1rem)] sm:w-[calc(100%-2rem)] md:w-[calc(100%-4rem)] lg:w-[calc(100%-6rem)]'
};
```

### Breakpoint Strategy

| Size | Mobile (<640px) | Tablet (640-1024px) | Desktop (1024px+) | Use Case |
|------|----------------|-------------------|------------------|----------|
| `sm` | max-w-sm | max-w-sm | max-w-sm | Confirmations, alerts |
| `md` | max-w-md | max-w-md | max-w-md | Simple forms |
| `lg` | max-w-lg | max-w-lg | max-w-2xl | Standard modals |
| `xl` | max-w-xl | max-w-2xl | max-w-3xl | **Proposal details** |
| `xxl` | max-w-2xl | max-w-3xl | max-w-4xl → max-w-5xl | Complex forms |
| `full` | calc(100%-1rem) | calc(100%-2rem) | calc(100%-4rem) | Full-screen experiences |

---

## 🎨 Glassmorphic Styling Pattern

### Modal Container (Lines 197-209)

```typescript
<Box
  ref={modalRef}
  className={cn(
    // Base glassmorphic effect
    'w-full rounded-xl sm:rounded-2xl overflow-hidden backdrop-blur-2xl shadow-2xl shadow-orange-500/10 @container',
    'border border-white/20',
    
    // Responsive max-height
    '!max-h-[98vh] sm:!max-h-[95vh] md:!max-h-[90vh] lg:!max-h-[85vh]',
    
    // Layout
    '!flex !flex-col',
    'bg-white/5 dark:bg-white/5', // Light transparent tint
    'mx-auto',
    
    sizeClasses[size]
  )}
  style={{ containerType: 'inline-size' }}
>
```

### Key Classes Explained

| Class | Purpose | Why |
|-------|---------|-----|
| `backdrop-blur-2xl` | 24px blur effect | Creates frosted glass appearance |
| `bg-white/5` | 5% white tint | Subtle depth without solid color |
| `border-white/20` | 20% white border | Visible glass edge |
| `rounded-xl sm:rounded-2xl` | Adaptive corners | Less round on mobile, more on desktop |
| `shadow-orange-500/10` | Orange glow | Brand accent for trade-related modals |
| `!max-h-[98vh]` | Viewport-relative height | Prevents overflow on small screens |

---

## 📱 Responsive Padding Strategy

### Progressive Spacing

```typescript
// Header
<header className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 md:py-5">

// Content
<section className="px-3 sm:px-4 md:px-6 py-4 sm:py-5 md:py-6">

// Footer
<footer className="px-3 sm:px-4 md:px-6 py-3 sm:py-4">
```

### Padding Scale

| Screen Size | Horizontal (px) | Vertical (py) | Rationale |
|-------------|----------------|---------------|-----------|
| Mobile | px-3 (12px) | py-3 (12px) | Maximizes content space |
| Small (640px+) | px-4 (16px) | py-4 (16px) | Comfortable spacing |
| Medium (768px+) | px-6 (24px) | py-5 (20px) | Generous spacing |
| Desktop (1024px+) | px-6 (24px) | py-6 (24px) | Premium feel |

---

## ♿ Accessibility Requirements

### Required ARIA Attributes

```typescript
<Box
  role="dialog"
  aria-modal="true"
  aria-labelledby={title ? "modal-title" : undefined}
  tabIndex={-1}
>
  <header>
    <h2 id="modal-title">{title}</h2>
    <button aria-label="Close modal">
```

### Touch Targets

**All interactive elements must be ≥ 44x44px:**

```typescript
// Close button
className="min-w-[44px] min-h-[44px] flex items-center justify-center"

// Action buttons
className="min-h-[44px]"
```

### Focus Management

- **On open**: Focus first interactive element
- **On close**: Restore focus to trigger element
- **Trap focus**: Tab/Shift+Tab cycles within modal
- **ESC key**: Closes modal (unless disabled)

---

## 🚀 Best Practices

### DO ✅

1. **Use glassmorphic variant for content buttons**
   ```typescript
   <Button variant="glassmorphic" topic="trades">Submit</Button>
   ```

2. **Remove glassmorphic from inner sections**
   ```typescript
   // Modal container has glassmorphic
   // Header/content/footer are transparent
   <header className="px-4 py-4 border-b border-border/30">
   ```

3. **Add topic for brand colors**
   ```typescript
   <Button variant="glassmorphic" topic="trades">
   ```

4. **Use semantic HTML**
   ```typescript
   <article aria-labelledby="content-title">
     <header>...</header>
     <main>...</main>
     <footer>...</footer>
   </article>
   ```

5. **Handle text overflow**
   ```typescript
   <p className="break-words overflow-wrap-anywhere max-w-full">
   ```

### DON'T ❌

1. **Don't use Card wrapper in modal content**
   ```typescript
   // ❌ Bad - causes background conflicts
   <Card variant="premium">
     <CardHeader>...</CardHeader>
   </Card>
   
   // ✅ Good - direct semantic HTML
   <div>
     <header>...</header>
   </div>
   ```

2. **Don't add glassmorphic to every section**
   ```typescript
   // ❌ Bad - creates layered dark backgrounds
   <header className="glassmorphic">
   <section className="glassmorphic">
   
   // ✅ Good - only container has glassmorphic
   <Box className="glassmorphic">
     <header> // transparent
     <section> // transparent
   </Box>
   ```

3. **Don't use z-modal**
   ```typescript
   // ❌ Bad - only z-40, below navbar
   className="z-modal"
   
   // ✅ Good - z-70, above navbar
   className="z-[70]"
   ```

4. **Don't use solid backgrounds**
   ```typescript
   // ❌ Bad
   'bg-card/95 dark:bg-neutral-800'
   
   // ✅ Good
   'bg-white/5 dark:bg-white/5'
   ```

5. **Don't use variant="outline" for primary actions**
   ```typescript
   // ❌ Bad - has dark solid background
   <Button variant="outline">Submit</Button>
   
   // ✅ Good - glassmorphic
   <Button variant="glassmorphic" topic="trades">Submit</Button>
   ```

---

## 🔧 Common Patterns

### 1. Confirmation Dialog

```typescript
<Modal isOpen={isOpen} onClose={onClose} size="sm" title="Confirm Action">
  <div className="space-y-4">
    <p className="text-sm text-foreground/80">Are you sure?</p>
    <div className="flex gap-3 justify-end">
      <Button variant="outline" className="glassmorphic min-h-[44px]" onClick={onClose}>
        Cancel
      </Button>
      <Button variant="glassmorphic" topic="trades" className="min-h-[44px]" onClick={onConfirm}>
        Confirm
      </Button>
    </div>
  </div>
</Modal>
```

### 2. Form Modal

```typescript
<Modal isOpen={isOpen} onClose={onClose} size="xl" title="Submit Proposal" closeOnClickOutside={false}>
  <form onSubmit={handleSubmit} className="space-y-4">
    {/* Form fields with bg-white/5 sections */}
    <section className="bg-white/5 border border-white/20 rounded-xl p-4">
      {/* Content */}
    </section>
    
    <footer className="flex justify-end gap-3 pt-4 border-t border-border/30">
      <Button variant="outline" className="glassmorphic min-h-[44px]">Cancel</Button>
      <Button variant="glassmorphic" topic="trades" className="min-h-[44px]">Submit</Button>
    </footer>
  </form>
</Modal>
```

### 3. Detail View Modal (Proposal Pattern)

```typescript
<Modal isOpen={!!item} onClose={() => setItem(null)} size="xl" title={`Details for ${item?.title}`}>
  <article className="space-y-4" aria-labelledby="item-title">
    {/* Remove Card wrapper - use semantic divs */}
    <div className="pb-4 space-y-3">
      <header>
        {/* User info, status, etc. */}
      </header>
    </div>
    
    <div className="space-y-4">
      <main className="space-y-4">
        {/* Sections with bg-white/5 */}
        <section className="bg-white/5 border border-white/20 rounded-xl p-4">
          {/* Content */}
        </section>
      </main>
    </div>
    
    {/* Actions */}
    <div className="pt-4 border-t border-border/30">
      <footer className="flex justify-end gap-3">
        <Button variant="glassmorphic" topic="trades" className="min-h-[44px]">
          Primary Action
        </Button>
      </footer>
    </div>
  </article>
</Modal>
```

---

## 📊 Responsive Testing Checklist

### Breakpoints to Test

- [ ] **320px** - iPhone SE (smallest mobile)
- [ ] **375px** - iPhone 12/13/14
- [ ] **414px** - iPhone Plus models
- [ ] **640px** - sm breakpoint (small tablets)
- [ ] **768px** - md breakpoint (tablets)
- [ ] **1024px** - lg breakpoint (desktop)
- [ ] **1280px** - xl breakpoint (large desktop)

### Visual Checks

- [ ] Modal doesn't overflow viewport
- [ ] All text stays within containers
- [ ] Buttons are full-width on mobile
- [ ] Touch targets are ≥ 44x44px
- [ ] No horizontal scrolling
- [ ] Glassmorphic effects visible (not solid backgrounds)
- [ ] Modal appears above navbar
- [ ] Close button easily accessible

### Functional Checks

- [ ] ESC key closes modal
- [ ] Click outside closes modal (if enabled)
- [ ] Focus trap works correctly
- [ ] Tab navigation cycles through elements
- [ ] Close button restores previous focus
- [ ] Smooth animations (or none if prefers-reduced-motion)

---

## 🎨 Glassmorphic Color Patterns

### Background Tints

```typescript
// Modal container
'bg-white/5 dark:bg-white/5' // Subtle base tint

// Content sections (message, skills, etc.)
'bg-white/5 dark:bg-white/5' // Matches container

// Active/Selected states
'bg-orange-500/10' // Trade-related actions

// Hover states
'hover:bg-white/10' // Slight increase on hover
```

### Border Styles

```typescript
// Standard borders
'border border-white/20' // 20% opacity for visibility

// Hover states
'hover:border-white/30' // Subtle increase

// Colored accents (skills, evidence)
'hover:border-green-500/30' // Green for skills offered
'hover:border-blue-500/30'  // Blue for skills requested
'hover:border-orange-500/30' // Orange for evidence
```

### Gradient Overlays

```typescript
// Add subtle color coding with pseudo-elements
'relative after:absolute after:inset-0 after:rounded-xl after:bg-gradient-to-br after:from-green-500/5 after:to-transparent after:pointer-events-none'

// Content needs z-index to appear above overlay
<div className="relative z-10">
  {content}
</div>
```

---

## 🔑 Key Takeaways

### Modal Container
- ✅ Use `backdrop-blur-2xl` for strong glass effect
- ✅ Use `bg-white/5` for light tint (not bg-card or bg-neutral)
- ✅ Set `z-[70]` to appear above navigation
- ✅ Remove `glassmorphic` class (conflicts with transparency goals)
- ✅ Use inline `style={{ background: 'transparent' }}` if needed

### Inner Sections
- ✅ NO glassmorphic class on header/content/footer
- ✅ Keep sections transparent (modal provides the effect)
- ✅ Use borders for visual separation

### Content Sections
- ✅ Use `bg-white/5` for subtle section backgrounds
- ✅ Add colored gradient overlays with pseudo-elements
- ✅ Ensure text overflow handling

### Buttons
- ✅ Use `variant="glassmorphic"` for all primary/secondary actions
- ✅ Add `topic="trades"` for brand colors
- ✅ Ensure `min-h-[44px]` on all buttons
- ✅ Keep `variant="destructive"` for delete/cancel actions

---

## 📖 Related Documentation

- **TRADE_PROPOSAL_UI_IMPROVEMENTS.md** - Proposal modal implementation
- **COMPONENT_GUIDELINES.md** - General component patterns
- **GLASSMORPHIC_TRADE_COMPONENTS_VERIFICATION.md** - Implementation verification
- **Tailwind Config** - `tailwind.config.ts` for breakpoints and z-index tokens

---

## 🔄 Version History

### Version 1.0 (October 9, 2025)
- Initial modal patterns documentation
- Based on proposal details modal implementation
- Includes responsive strategies, glassmorphic patterns, and accessibility requirements

---

**Last Updated:** October 9, 2025  
**Maintained By:** Development Team  
**Review Cycle:** Monthly or when modal patterns change

