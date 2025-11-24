# AI Prompt Guidelines for TradeYa Development

**Purpose:** Guidelines for writing effective prompts when using AI (Cursor, ChatGPT, etc.) to generate code for TradeYa

**Last Updated:** December 2024

---

## 🎯 Core Principles

1. **Always reference the design system** - Mention TradeYa design tokens and patterns
2. **Reference existing code** - Point to similar components/features
3. **Be specific about requirements** - Don't leave room for interpretation
4. **Include context** - Mention the feature, user flow, and related systems

---

## 📝 Prompt Templates

### Creating a New Component

**Good Prompt:**
```
Create a [ComponentName] component for TradeYa that:
- Uses TradeYa design system (primary-500 orange, secondary-500 blue)
- Follows the pattern from src/components/ui/Button.tsx
- Includes dark mode support (dark:bg-...)
- Uses the glassmorphic utility class for glass effects
- Includes proper TypeScript types
- Has accessibility attributes (ARIA labels, keyboard navigation)
- Uses the cn() utility for className merging
- Follows the spacing scale (4px base: p-4, p-6, etc.)

Reference:
- Design system: docs/design/TRADEYA_LAYOUT_SYSTEM_ARCHITECTURE.md
- Similar component: src/components/ui/[SimilarComponent].tsx
```

**Bad Prompt:**
```
Create a button component
```

### Modifying an Existing Component

**Good Prompt:**
```
Modify the [ComponentName] component at src/components/ui/[ComponentName].tsx to:
- Add [specific feature]
- Maintain existing TradeYa design system patterns
- Keep all existing variants and props
- Add proper TypeScript types for new props
- Include dark mode variants
- Update tests if needed

Do not change:
- Existing API/props structure
- Color tokens (use primary-500, secondary-500, etc.)
- Spacing scale usage
```

### Creating a Feature

**Good Prompt:**
```
Create a [FeatureName] feature for TradeYa following this spec:
[Link to or paste spec document]

Requirements:
- Use TradeYa design system (see .cursor/rules/design-system.mdc)
- Reference existing similar features: [list similar features]
- Follow component patterns from src/components/ui/
- Use services from src/services/
- Include proper error handling
- Add loading states
- Support dark mode
- Include accessibility features

Database changes needed:
[Describe if any]

Related systems:
[Describe integrations]
```

---

## 🎨 Design System Prompts

### When Creating UI Elements

**Always include:**
```
Use TradeYa design system:
- Colors: primary-500 (#f97316), secondary-500 (#0ea5e9), success-500, warning-500, error-500
- Spacing: 4px base scale (p-4 = 16px, p-6 = 24px)
- Typography: Inter for body, Outfit for headings
- Glassmorphism: Use "glassmorphic border-glass" utility class
- Dark mode: Always include dark: variants
- Components: Reference existing components in src/components/ui/
```

### When Styling Components

**Good:**
```
Style this component using TradeYa design tokens:
- Background: bg-white dark:bg-neutral-800
- Text: text-neutral-900 dark:text-neutral-100
- Border: border-glass (for glassmorphic) or border-neutral-200 dark:border-neutral-700
- Spacing: Use p-4, p-6, space-y-4, etc. (4px base scale)
- Shadows: shadow-md, shadow-lg (not custom values)
```

**Bad:**
```
Make it look nice with orange and blue
```

---

## 🔧 Code Quality Prompts

### TypeScript

**Always specify:**
```
- Use strict TypeScript types
- Define interfaces for all props
- Use proper return types
- Include JSDoc comments for complex functions
- Export types that might be reused
```

### Error Handling

**Always include:**
```
- Handle network errors gracefully
- Show user-friendly error messages
- Log errors for debugging
- Provide fallback UI states
- Use try-catch for async operations
```

### Performance

**For complex features:**
```
- Use React.memo for expensive components
- Implement lazy loading where appropriate
- Debounce search inputs
- Virtualize long lists
- Optimize re-renders with useMemo/useCallback
```

---

## 📚 Context Prompts

### When Asking About Existing Code

**Good:**
```
Explain how [FeatureName] works in TradeYa:
- Reference: src/[path]/[file].tsx
- Related documentation: docs/[path]/[doc].md
- How does it integrate with [other system]?
```

### When Debugging

**Good:**
```
Debug this issue in TradeYa:
- Error: [paste error]
- Component: src/[path]/[file].tsx
- Related service: src/services/[service].ts
- Expected behavior: [describe]
- Actual behavior: [describe]
- Steps to reproduce: [list]
```

---

## ✅ Checklist for AI Prompts

Before submitting a prompt, ensure it includes:

- [ ] **Design System:** Mentions TradeYa colors, spacing, components
- [ ] **Context:** References existing code or features
- [ ] **Requirements:** Specific, not vague
- [ ] **TypeScript:** Requests proper types
- [ ] **Accessibility:** Mentions ARIA, keyboard navigation
- [ ] **Dark Mode:** Requests dark mode support
- [ ] **Error Handling:** Specifies error handling approach
- [ ] **Testing:** Mentions if tests are needed

---

## 🚫 Common Mistakes to Avoid

1. **Too vague:**
   ❌ "Create a button"
   ✅ "Create a Button component following TradeYa design system..."

2. **Missing context:**
   ❌ "Add a form"
   ✅ "Add a form to [specific page] using TradeYa Input components..."

3. **Ignoring design system:**
   ❌ "Style it with orange"
   ✅ "Use primary-500 (#f97316) from TradeYa color system..."

4. **No references:**
   ❌ "Create a modal"
   ✅ "Create a modal similar to src/components/ui/Modal.tsx..."

5. **Missing accessibility:**
   ❌ "Add a dropdown"
   ✅ "Add an accessible dropdown with keyboard navigation and ARIA labels..."

---

## 📖 Example Prompts

### Example 1: Creating a New Page

```
Create a new TradeYa page component at src/pages/NewFeaturePage.tsx that:

1. Uses the MainLayout component
2. Displays a list of items using the Card component
3. Uses TradeYa design system:
   - Primary orange (primary-500) for CTAs
   - Glassmorphic cards with hover effects
   - Dark mode support
   - 4px spacing scale
4. Fetches data from src/services/[ServiceName].ts
5. Includes loading and error states
6. Has proper TypeScript types
7. Is accessible (keyboard nav, ARIA labels)

Reference:
- Similar page: src/pages/TradesPage.tsx
- Card component: src/components/ui/Card.tsx
- Design system: docs/design/TRADEYA_LAYOUT_SYSTEM_ARCHITECTURE.md
```

### Example 2: Adding a Feature to Existing Component

```
Add a "filter" feature to the TradeList component at src/components/features/TradeList.tsx:

1. Add a filter dropdown using the Select component from src/components/ui/Select.tsx
2. Filter by trade status (open, in-progress, completed)
3. Maintain existing functionality
4. Use TradeYa design tokens (primary-500, etc.)
5. Include dark mode variants
6. Add proper TypeScript types
7. Update the component's props interface
8. Keep existing tests passing

Do not:
- Change the existing API
- Remove any existing features
- Change the color scheme
```

### Example 3: Fixing a Bug

```
Fix the bug in src/components/ui/Button.tsx where the loading state doesn't show:

1. The isLoading prop is set but the spinner doesn't appear
2. Check the Loader2 component import from lucide-react
3. Ensure the spinner is properly conditionally rendered
4. Maintain all existing variants and props
5. Test in both light and dark modes
6. Ensure accessibility is not affected

Current code location: src/components/ui/Button.tsx (lines 74-140)
```

---

## 🔗 Related Documents

- [Design System Rules](../.cursor/rules/design-system.mdc)
- [Design System Documentation](./design/TRADEYA_LAYOUT_SYSTEM_ARCHITECTURE.md)
- [Feature Spec Template](./FEATURE_SPEC_TEMPLATE.md)
- [Component Guidelines](./design/COMPONENT_GUIDELINES.md)

---

## 💡 Pro Tips

1. **Use Plan Mode First:** For complex features, use Cursor's Plan Mode to generate a detailed plan, then refine it
2. **Iterate:** Start with a basic prompt, then refine based on results
3. **Reference Often:** Always point to existing code - AI learns from your codebase
4. **Be Specific:** The more specific, the better the results
5. **Review Generated Code:** Always review AI-generated code for design system compliance

---

**Last Updated:** December 2024

