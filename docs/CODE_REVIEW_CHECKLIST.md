# Code Review Checklist for TradeYa

**Purpose:** Comprehensive checklist to ensure all code (especially AI-generated) follows TradeYa design system patterns, accessibility standards, performance best practices, and code quality requirements.

**Last Updated:** December 2024

---

## Quick Reference

- **Full Checklist:** See sections below
- **Accessibility Details:** [Accessibility Audit Checklist](./guides/ACCESSIBILITY_AUDIT_CHECKLIST.md)
- **Security Details:** [Security Implementation](./features/SECURITY_IMPLEMENTATION.md)
- **Design System Rules:** [`.cursor/rules/design-system.mdc`](../.cursor/rules/design-system.mdc)
- **AI Guidelines:** [AI Prompt Guidelines](./AI_PROMPT_GUIDELINES.md)

---

## Design System Compliance

**Reference:** [Design System Rules](../.cursor/rules/design-system.mdc)

- [ ] Uses TradeYa color tokens (primary-500, secondary-500, etc.) - **no hardcoded colors**
- [ ] Includes dark mode variants (dark:bg-..., dark:text-...)
- [ ] Uses 4px base spacing scale (p-4, p-6, p-8, etc.)
- [ ] Uses `cn()` utility for className merging
- [ ] Follows existing component patterns from `src/components/ui/`
- [ ] Uses glassmorphic utility class (not custom glassmorphism)
- [ ] Typography uses defined font families (font-sans, font-heading)

### Examples

**DO:**
```tsx
import { cn } from '@/utils/cn';
import { Button } from '@/components/ui/Button';

<div className={cn(
  'bg-primary-500 dark:bg-primary-600',
  'p-4 space-y-4',
  className
)}>
  <Button variant="glassmorphic">Action</Button>
</div>
```

**DON'T:**
```tsx
// ❌ Hardcoded colors
<div className="bg-orange-500 p-5">
  <button className="bg-white/10 backdrop-blur">Action</button>
</div>
```

---

## Accessibility (A11y)

**Reference:** [Accessibility Audit Checklist](./guides/ACCESSIBILITY_AUDIT_CHECKLIST.md)

- [ ] Interactive elements have ARIA labels where needed
- [ ] Keyboard navigation works (Tab, Enter, Space, Escape)
- [ ] Focus management implemented (focus-visible styles)
- [ ] Screen reader support (semantic HTML, ARIA attributes)
- [ ] Reduced motion support (prefers-reduced-motion)
- [ ] Color contrast meets WCAG AA standards (4.5:1 for text)
- [ ] Touch targets are minimum 44px on mobile

### Examples

**DO:**
```tsx
<button
  aria-label="Close dialog"
  aria-busy={isLoading}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleClick();
    }
  }}
  className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
>
  {isLoading ? <Loader2 className="animate-spin" /> : 'Submit'}
</button>
```

**DON'T:**
```tsx
// ❌ Missing ARIA, no keyboard support
<div onClick={handleClick} className="cursor-pointer">
  Submit
</div>
```

---

## TypeScript & Type Safety

- [ ] All props have TypeScript interfaces
- [ ] No `any` types (except in error handling where necessary)
- [ ] Proper return types defined
- [ ] Exported types are reusable
- [ ] JSDoc comments for complex functions
- [ ] Type guards used where appropriate

### Examples

**DO:**
```tsx
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'premium' | 'glassmorphic';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ variant, isLoading, ...props }) => {
  // Implementation
};
```

**DON'T:**
```tsx
// ❌ Missing types, using any
export const Button = ({ variant, isLoading, ...props }: any) => {
  // Implementation
};
```

---

## Performance

- [ ] No unnecessary re-renders (React.memo, useMemo, useCallback)
- [ ] Expensive operations are memoized
- [ ] Images are lazy-loaded
- [ ] Code-split where appropriate (lazy imports for routes)
- [ ] Event handlers not recreated on each render
- [ ] Long lists are virtualized (if applicable)
- [ ] Debounced search inputs (if applicable)

### Examples

**DO:**
```tsx
const MemoizedComponent = React.memo(ExpensiveComponent);

const handleClick = useCallback(() => {
  // Handler logic
}, [dependencies]);

const expensiveValue = useMemo(() => {
  return computeExpensiveValue(data);
}, [data]);
```

**DON'T:**
```tsx
// ❌ Recreates handler on every render
const Component = () => {
  const handleClick = () => {
    // Handler logic
  };
  return <button onClick={handleClick}>Click</button>;
};
```

---

## Security

**Reference:** [Security Implementation](./features/SECURITY_IMPLEMENTATION.md)

- [ ] Input validation implemented
- [ ] Authentication checks in place
- [ ] Authorization rules enforced
- [ ] XSS prevention (React handles, but verify no dangerouslySetInnerHTML)
- [ ] Sensitive data handled securely (no localStorage for tokens)
- [ ] Error messages don't expose sensitive information
- [ ] Firestore security rules updated (if database changes)

### Examples

**DO:**
```tsx
// Input validation
const handleSubmit = async (data: FormData) => {
  if (!data.email || !isValidEmail(data.email)) {
    throw new ServiceError('Invalid email', 400);
  }
  // Process data
};

// Secure error handling
try {
  await operation();
} catch (error) {
  logger.error('Operation failed', { context: 'operation-name' });
  throw new ServiceError('Operation failed', 500);
}
```

**DON'T:**
```tsx
// ❌ Storing tokens in localStorage
localStorage.setItem('token', token);

// ❌ Exposing sensitive info in errors
catch (error) {
  throw new Error(`Database error: ${error.sql}`);
}
```

---

## Component Patterns

**Reference:** [Design System Documentation](../src/components/ui/DESIGN_SYSTEM_DOCUMENTATION.md)

- [ ] Uses existing components from `src/components/ui/` before creating new ones
- [ ] Component follows TradeYa component structure pattern
- [ ] Proper displayName set for debugging
- [ ] forwardRef used when ref forwarding needed
- [ ] Component is properly exported
- [ ] Props interface extends appropriate base types

### Examples

**DO:**
```tsx
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';

export const MyFeature: React.FC<MyFeatureProps> = ({ ...props }) => {
  return (
    <Card variant="glass">
      <CardHeader>
        <CardTitle>Title</CardTitle>
      </CardHeader>
      <CardContent>
        <Button variant="premium">Action</Button>
      </CardContent>
    </Card>
  );
};

MyFeature.displayName = "MyFeature";
```

**DON'T:**
```tsx
// ❌ Creating duplicate component instead of using existing
const MyButton = ({ children }) => {
  return <button className="bg-primary-500">{children}</button>;
};
```

---

## TradeYa-Specific Patterns

- [ ] Uses semantic color classes for topics (trades, collaborations, etc.)
- [ ] Follows glassmorphism pattern correctly
- [ ] Mobile optimization (44px touch targets)
- [ ] Loading states implemented
- [ ] Error states handled gracefully
- [ ] Empty states shown appropriately
- [ ] Uses TradeYa service patterns (ServiceResult, error handling)

### Examples

**DO:**
```tsx
import { semanticClasses, type Topic } from '@/utils/semanticColors';

const topic: Topic = 'trades';
const classes = semanticClasses(topic);

<Button className={classes.bgSolid} topic={topic}>
  Trade Action
</Button>

// Service pattern
const result: ServiceResult<Data> = await fetchData();
if (result.error) {
  throw new ServiceError(result.error.message, result.error.code);
}
```

**DON'T:**
```tsx
// ❌ Not using semantic classes
<Button className="bg-orange-500">Trade Action</Button>

// ❌ Not using ServiceResult pattern
const data = await fetchData(); // What if it fails?
```

---

## Code Quality

- [ ] Clear file organization
- [ ] Consistent naming conventions (camelCase for functions, PascalCase for components)
- [ ] Reusable code extracted to utilities
- [ ] Well-documented (comments for complex logic)
- [ ] No magic numbers/strings (use constants)
- [ ] Error handling implemented
- [ ] No console.log statements (use logger utility)

### Examples

**DO:**
```tsx
// Constants defined
const MAX_RETRIES = 3;
const ERROR_MESSAGES = {
  NETWORK: 'Network error occurred',
  VALIDATION: 'Invalid input',
} as const;

// Using logger
import { logger } from '@/utils/logging/logger';
logger.debug('Operation started', { context: 'feature-name' });
```

**DON'T:**
```tsx
// ❌ Magic numbers and console.log
if (retries < 3) {
  console.log('Retrying...');
  // Retry logic
}
```

---

## Testing

- [ ] Unit tests added for new functions/utilities
- [ ] Component tests added for new components
- [ ] Integration tests for new features
- [ ] Edge cases tested
- [ ] Error cases tested
- [ ] All tests passing

### Examples

**DO:**
```tsx
// Component test
describe('Button', () => {
  it('renders with correct variant', () => {
    render(<Button variant="premium">Click</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-gradient-to-r');
  });

  it('handles loading state', () => {
    render(<Button isLoading>Click</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
```

---

## AI-Generated Code Special Attention

When reviewing AI-generated code, pay extra attention to:

- [ ] **Design System Compliance** - AI often hardcodes colors or misses dark mode
- [ ] **Component Reuse** - AI may create duplicate components instead of using existing ones
- [ ] **Accessibility** - AI may miss ARIA labels or keyboard navigation
- [ ] **TradeYa Patterns** - AI may not use semantic classes or ServiceResult patterns
- [ ] **Type Safety** - AI may use `any` types or skip proper interfaces

**Tip:** Reference [AI Prompt Guidelines](./AI_PROMPT_GUIDELINES.md) when generating code to prevent these issues.

---

## Quick Checklist for PR Comments

Copy this into PR comments for quick checks:

```
## Code Review Checklist

### Design System
- [ ] Color tokens used (no hardcoded colors)
- [ ] Dark mode variants included
- [ ] Spacing scale followed (4px base)
- [ ] Existing components used where possible

### Accessibility
- [ ] ARIA labels present
- [ ] Keyboard navigation works
- [ ] Focus states visible
- [ ] Color contrast adequate

### TypeScript
- [ ] Proper types defined
- [ ] No `any` types
- [ ] Interfaces exported if reusable

### Performance
- [ ] No unnecessary re-renders
- [ ] Memoization where needed
- [ ] Lazy loading for images/routes

### Security
- [ ] Input validation
- [ ] Auth/authorization checks
- [ ] No sensitive data exposure

### TradeYa Patterns
- [ ] Semantic classes used
- [ ] ServiceResult pattern followed
- [ ] Loading/error/empty states handled
```

---

## Related Documentation

- [Design System Rules](../.cursor/rules/design-system.mdc) - Always-applied design system guidelines
- [AI Prompt Guidelines](./AI_PROMPT_GUIDELINES.md) - Guidelines for AI-generated code
- [Accessibility Audit Checklist](./guides/ACCESSIBILITY_AUDIT_CHECKLIST.md) - Detailed accessibility checks
- [Security Implementation](./features/SECURITY_IMPLEMENTATION.md) - Security checklist and patterns
- [Design System Documentation](../src/components/ui/DESIGN_SYSTEM_DOCUMENTATION.md) - Component patterns
- [Feature Spec Template](./FEATURE_SPEC_TEMPLATE.md) - Feature planning template

---

**Last Updated:** December 2024  
**Status:** Active - Use for all code reviews

