# Component Guidelines

## Button `asChild` Usage

- Our `Button` supports an `asChild` prop to compose with primitives like Radix triggers and links.
- When `asChild` is true, the Button renders only the single `children` element using Radix `Slot`. React.Children.only requires exactly one React element.
- Include any icons and text inside that single child element.

### Correct

```tsx
<Button asChild>
  <Link to="/profile">
    <Icon className="mr-2" />
    View Profile
  </Link>
  {/* single child only */}
</Button>
```

### Incorrect

```tsx
// Multiple siblings are not allowed when using asChild
<Button asChild leftIcon={<Icon />}>
  View Profile
</Button>
```

### References

- Radix UI Slot: https://www.radix-ui.com/primitives/docs/utilities/slot
- Radix Dropdown Menu: https://www.radix-ui.com/primitives/docs/components/dropdown-menu


## Glassmorphic Page Surfaces

Use the canonical glassmorphic surface for page headers, search/filter panels, and secondary panels to match the HomePage aesthetic.

### Pattern

```tsx
<div className="glassmorphic rounded-xl px-4 py-4 md:px-6 md:py-5">...
```

### Where to apply

- Page headers (title + actions)
- Search and filter panels
- Tab bars or segment controls that sit on page surfaces

### Tokens

- Prefer semantic tokens: `bg-card`, `text-foreground`, `text-muted-foreground`, `border-border`, `bg-popover` for menus.
- Brand accents: `text-primary`, `bg-primary` for CTAs and active states.

## Button Standardization

- Prefer the shared `Button` component for all actions (links via `asChild`).
- Variants map to semantic tokens: `primary`, `secondary`, `outline`, `ghost`, `destructive`, plus `success`, `warning` when appropriate.
- When composing links/menus, ensure a single child element when using `asChild`.

## Brand Color Usage

- Keep orange where it reinforces brand identity, but via tokens:
  - Primary CTAs and key actions: use `Button` with `variant="primary"` (maps to brand orange).
  - Active/selected states and key highlights: use `text-primary`/`bg-primary`.
  - Streak/energy visuals: icons and toasts may use `text-primary`.
- Use neutral tokens for affordances and inputs:
  - Focus rings/borders: `ring-ring`, `border-input`.
  - Secondary text/content: `text-muted-foreground`.
- Gradients (orange→blue/purple) are allowed and encouraged for branded surfaces.

### Tokenization rules (no raw orange utilities)

- Do not use raw single-color orange utilities in non-gradient UI, e.g. `text-orange-500`, `bg-orange-500`, `border-orange-500`, `ring-orange-500`.
- Use semantic tokens instead:
  - `text-primary`, `bg-primary`, `bg-primary/10`, `border-border`, `ring-ring`.
- Gradients remain allowed and unchanged: `bg-gradient-to-r from-orange-500 via-... to-...` is OK.

### Inputs & focus styles

- Inputs, selects, textareas must use neutral affordances:
  - `border-input` for borders
  - `focus:ring-ring` for focus rings
  - Avoid brand-colored focus rings on inputs.

### Tailwind version & syntax

- This project uses Tailwind CSS v4. Use v4 utility names and patterns. Avoid legacy v3-only utilities.

### Examples

```tsx
// Bad
<input className="border rounded ring-1 ring-orange-500 focus:ring-orange-500" />

// Good
<input className="border-input rounded ring-1 ring-ring focus:ring-ring" />

// Bad
<span className="text-orange-500">Counter</span>

// Good
<span className="text-primary">Counter</span>

// Allowed gradient (brand)
<div className="bg-gradient-to-r from-orange-500 via-purple-500 to-blue-500" />
```

## Tooling & Audits

- Run `npm run lint:brand` to flag raw single‑color `orange-*` utilities. Gradients (`from/to/via-orange-*`) are allowed.
- Run `npm run lint:glass` to verify glassmorphic surface usage is compliant.
- Both audits are wired into `npm run validate`.

### References

- Storybook vignette: `src/stories/PageSurfaces.stories.tsx`
- Design plan: `docs/TRADEYA_MODERN_DESIGN_SYSTEM_PLAN.md`

