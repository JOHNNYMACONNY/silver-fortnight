# Button Style Guidelines

**Version:** 1.0  
**Date:** December 1, 2025  
**Status:** Active Design System Rule

---

## Core Principle: NO SOLID BACKGROUND COLORS

**All buttons in the TradeYa application MUST use transparent or semi-transparent backgrounds. Solid background colors are strictly prohibited.**

### Why This Rule Exists

1. **Design System Consistency:** Transparent backgrounds create a cohesive, modern aesthetic that aligns with glassmorphic design principles
2. **Visual Hierarchy:** Transparent backgrounds with borders allow content to show through, creating depth and visual interest
3. **Theme Compatibility:** Transparent backgrounds work better with dark mode and various background contexts
4. **Brand Identity:** Aligns with TradeYa's modern, sophisticated design language

---

## Allowed Background Styles

### ✅ Transparent Backgrounds (Allowed)
- `bg-primary/10` - 10% opacity
- `bg-primary/20` - 20% opacity  
- `bg-transparent` - Fully transparent
- `bg-background/50` - Semi-transparent background color
- `glassmorphic` - Glassmorphic effect utility class

### ✅ Gradients (Allowed)
- `bg-gradient-to-r from-primary/20 to-primary/10` - Transparent gradients
- Gradients must use opacity values (e.g., `/20`, `/10`)

### ❌ Solid Backgrounds (Prohibited)
- `bg-primary` - Solid color (NOT ALLOWED)
- `bg-primary-500` - Solid color (NOT ALLOWED)
- `bg-destructive` - Solid color (NOT ALLOWED)
- Any `bg-{color}` without opacity modifier (NOT ALLOWED)

---

## Button Variant Standards

### Standard Variants

All standard variants use transparent backgrounds with borders:

```typescript
default: "bg-primary/10 text-primary border-2 border-primary/30 hover:bg-primary/20"
destructive: "bg-destructive/10 text-destructive border-2 border-destructive/30"
outline: "border-2 border-input bg-background/50"
secondary: "bg-secondary/10 text-secondary border-2 border-secondary/30"
ghost: "hover:bg-accent/20" // Only on hover
link: "bg-transparent" // Fully transparent
```

### Custom Variants

```typescript
success: "bg-success-500/10 text-success-500 border-2 border-success-500/30"
warning: "bg-warning-500/10 text-warning-500 border-2 border-warning-500/30"
glassmorphic: "glassmorphic ... border border-white/10"
premium: "bg-gradient-to-r from-primary/20 to-primary/10 ... border-2 border-primary/30"
```

---

## Implementation Checklist

When creating or modifying buttons:

- [ ] Background uses opacity modifier (e.g., `/10`, `/20`, `/30`)
- [ ] Border is present (typically `border-2`)
- [ ] Border uses opacity modifier (e.g., `/30`, `/50`)
- [ ] Hover state uses slightly higher opacity (e.g., `/20` instead of `/10`)
- [ ] No solid `bg-{color}` classes without opacity
- [ ] Works correctly in both light and dark modes
- [ ] Maintains visual hierarchy and contrast

---

## Code Review Guidelines

### Red Flags to Watch For

1. **Solid Background Classes:**
   ```tsx
   // ❌ BAD
   <Button className="bg-primary">Click</Button>
   <Button variant="default" className="bg-red-500">Delete</Button>
   
   // ✅ GOOD
   <Button className="bg-primary/10 border-2 border-primary/30">Click</Button>
   <Button variant="destructive">Delete</Button>
   ```

2. **Missing Opacity Modifiers:**
   ```tsx
   // ❌ BAD
   className="bg-success-500"
   
   // ✅ GOOD
   className="bg-success-500/10"
   ```

3. **Missing Borders:**
   ```tsx
   // ❌ BAD (unless it's ghost or link variant)
   className="bg-primary/10" // No border
   
   // ✅ GOOD
   className="bg-primary/10 border-2 border-primary/30"
   ```

---

## Migration Guide

If you find buttons with solid backgrounds:

1. **Identify the color:** Note the current `bg-{color}` class
2. **Convert to transparent:** Change to `bg-{color}/10` or `bg-{color}/20`
3. **Add border:** Add `border-2 border-{color}/30`
4. **Update hover:** Change hover to `hover:bg-{color}/20 hover:border-{color}/50`
5. **Test:** Verify in both light and dark modes

### Example Migration

```tsx
// Before (Solid Background)
<Button className="bg-primary text-white">
  Click Me
</Button>

// After (Transparent Background)
<Button className="bg-primary/10 text-primary border-2 border-primary/30 hover:bg-primary/20">
  Click Me
</Button>
```

---

## Enforcement

### Automated Checks

- **Linting:** Consider adding ESLint rules to detect solid background classes in button components
- **Type Safety:** Button component variants are defined in `Button.tsx` and all use transparent backgrounds
- **Code Review:** All PRs should be reviewed for compliance with this guideline

### Manual Verification

1. Search codebase for: `bg-{color}(?!-\d+/\d+)` (solid backgrounds without opacity)
2. Check all Button component usages
3. Verify in browser dev tools that computed styles show transparent backgrounds

---

## Related Documentation

- [Design System Guidelines](./TRADEYA_LAYOUT_SYSTEM_ARCHITECTURE.md)
- [Component Guidelines](./COMPONENT_GUIDELINES.md)
- [Button Component Source](../../src/components/ui/Button.tsx)

---

## Questions or Issues?

If you encounter a use case where a solid background seems necessary, please:
1. Document the use case
2. Discuss with the design team
3. Consider alternative solutions (glassmorphic, gradients, etc.)
4. Update this document if an exception is approved

