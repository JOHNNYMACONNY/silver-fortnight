# Shadcn Migration Test Guide

**Purpose:** Step-by-step guide to test Shadcn UI migration with TradeYa

**Status:** Ready for Testing  
**Estimated Time:** 30-60 minutes

---

## Prerequisites

- Node.js 18+
- TradeYa project set up
- Understanding of TradeYa design system

---

## Step 1: Initialize Shadcn (Dry Run)

**First, let's see what Shadcn would configure:**

```bash
# This will show you what it wants to configure
npx shadcn@latest init --dry-run
```

**Expected output:** Shows components.json configuration

---

## Step 2: Configure Shadcn for TradeYa

**Create components.json manually (recommended for first test):**

Create `components.json` in project root:

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "src/index.css",
    "baseColor": "slate",
    "cssVariables": true
  },
  "aliases": {
    "components": "@/components/ui",
    "utils": "@/utils"
  }
}
```

**Note:** You may need to adjust the aliases based on your tsconfig.json paths.

---

## Step 3: Test with Button Component

**Install Shadcn Button in a test location:**

```bash
# Install to a test directory first
npx shadcn@latest add button --yes
```

**This will:**
- Create `src/components/ui/button.tsx` (or update existing)
- Add any missing dependencies

**⚠️ Important:** If you already have a Button component, Shadcn will ask to overwrite. **Don't overwrite yet!**

---

## Step 4: Compare Components

**Compare Shadcn Button with TradeYa Button:**

1. **Check Shadcn Button:**
   ```bash
   cat src/components/ui/button.tsx
   ```

2. **Check TradeYa Button:**
   ```bash
   cat src/components/ui/Button.tsx
   ```

3. **Key differences to note:**
   - Variant system
   - Props structure
   - Styling approach
   - Accessibility features

---

## Step 5: Create Hybrid Button (Test)

**Create a test hybrid component:**

Create `src/components/ui/ButtonShadcnTest.tsx`:

```typescript
// Test: Hybrid Button combining Shadcn base with TradeYa variants
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../utils/cn"

// Shadcn base variants
const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary-500 text-white hover:bg-primary-600",
        destructive: "bg-error-500 text-white hover:bg-error-600",
        outline: "border border-glass bg-transparent hover:bg-accent",
        secondary: "bg-secondary-500 text-white hover:bg-secondary-600",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary-500 underline-offset-4 hover:underline",
        // TradeYa custom variants
        glassmorphic: "glassmorphic text-white font-medium hover:bg-white/20",
        premium: "bg-gradient-to-r from-primary-500 to-primary-400 text-white font-semibold shadow-lg",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonShadcnTestProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const ButtonShadcnTest = React.forwardRef<HTMLButtonElement, ButtonShadcnTestProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
ButtonShadcnTest.displayName = "ButtonShadcnTest"

export { ButtonShadcnTest, buttonVariants }
```

---

## Step 6: Test the Hybrid Button

**Create a test page or component:**

```typescript
// Test component
import { ButtonShadcnTest } from '@/components/ui/ButtonShadcnTest'

export const ShadcnTestPage = () => {
  return (
    <div className="p-8 space-y-4">
      <h1>Shadcn Migration Test</h1>
      
      <div className="space-x-4">
        <ButtonShadcnTest variant="default">Default</ButtonShadcnTest>
        <ButtonShadcnTest variant="glassmorphic">Glassmorphic</ButtonShadcnTest>
        <ButtonShadcnTest variant="premium">Premium</ButtonShadcnTest>
        <ButtonShadcnTest variant="outline">Outline</ButtonShadcnTest>
      </div>
    </div>
  )
}
```

**Test:**
1. Does it render correctly?
2. Do TradeYa variants work?
3. Does dark mode work?
4. Is accessibility maintained?

---

## Step 7: Evaluate Results

**Checklist:**

- [ ] Shadcn Button installed successfully
- [ ] Hybrid component created
- [ ] All variants work (Shadcn + TradeYa)
- [ ] Dark mode works
- [ ] Accessibility maintained
- [ ] Styling matches TradeYa design system
- [ ] No breaking changes to existing code

**Document findings:**
- What worked well?
- What needs adjustment?
- Any conflicts with existing code?
- Performance impact?

---

## Step 8: Decision Point

**If test is successful:**
- Proceed with gradual migration
- Update [SHADCN_MIGRATION_EVALUATION.md](./SHADCN_MIGRATION_EVALUATION.md) with results
- Plan migration of other components

**If test reveals issues:**
- Document issues
- Adjust approach
- Consider alternative strategies

---

## Rollback Plan

**If you need to rollback:**

1. **Remove test component:**
   ```bash
   rm src/components/ui/ButtonShadcnTest.tsx
   ```

2. **Remove Shadcn Button (if installed):**
   ```bash
   rm src/components/ui/button.tsx
   ```

3. **Remove components.json (if created):**
   ```bash
   rm components.json
   ```

4. **Restore from git if needed:**
   ```bash
   git checkout src/components/ui/Button.tsx
   ```

---

## Next Steps After Successful Test

1. **Update migration plan** with learnings
2. **Create migration checklist** for Button component
3. **Plan migration** of Input, Select components
4. **Document patterns** for future migrations

---

## Troubleshooting

### Issue: Path aliases not working

**Solution:** Check `tsconfig.json` paths:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### Issue: Tailwind config conflicts

**Solution:** Shadcn should work with existing Tailwind config. If conflicts occur, check:
- CSS variables setup
- Color system configuration
- Dark mode configuration

### Issue: Component overwrite warning

**Solution:** 
- Don't overwrite existing components
- Install to test location first
- Create hybrid version
- Test thoroughly before replacing

---

## Resources

- [Shadcn UI Documentation](https://ui.shadcn.com)
- [TradeYa Design System](./design/TRADEYA_LAYOUT_SYSTEM_ARCHITECTURE.md)
- [Shadcn Migration Evaluation](./SHADCN_MIGRATION_EVALUATION.md)
- [Component Guidelines](./design/COMPONENT_GUIDELINES.md)

---

**Last Updated:** December 2024  
**Status:** Ready for Testing

