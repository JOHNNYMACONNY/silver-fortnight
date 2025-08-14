# Accessibility Audit Checklist

**Instructions:**
- For each page/component, check all items.
- Log issues in the “Notes/Issues” column.
- Use this as a living document—update as you fix issues.

## Step-by-Step Accessibility Audit Guide

1. **Open the page or component file.**
2. **Check keyboard navigation:**
   - Ensure all interactive elements are reachable by Tab/Shift+Tab.
   - Tab order should be logical and intuitive.
3. **Check focus states:**
   - All focusable elements must have a visible, accessible focus indicator.
   - Focus should not be lost or hidden during navigation.
4. **Test with a screen reader:**
   - Use a screen reader (e.g., VoiceOver, NVDA) to verify logical reading order and announcements.
   - All important content and controls should be accessible.
5. **Check ARIA attributes and labels:**
   - All controls must have appropriate ARIA attributes and/or accessible labels.
   - Use `aria-label`, `aria-labelledby`, `aria-describedby`, and roles as needed.
6. **Verify color contrast:**
   - All text and interactive elements must meet WCAG AA contrast (4.5:1 for normal text).
   - Test in both light and dark mode.
7. **Test reduced motion:**
   - Animations and transitions must respect `prefers-reduced-motion`.
   - No essential information should be lost if motion is reduced.
8. **Log any issues or notes in the audit table.**
   - Mark each checklist item as [x] (pass), [ ] (needs review/fix), or [!] (issue found).
   - Add details in the Notes/Issues column.
9. **Update the audit as you fix issues.**
   - Re-test and mark items as [x] when resolved.
10. **Repeat for the next page or component.**

**Tip:** Use browser dev tools and accessibility extensions to help with testing.

---


| Page/Component         | Keyboard Navigation | Focus States | Screen Reader | ARIA/Labels | Color Contrast | Reduced Motion | Notes/Issues |
|------------------------|--------------------|--------------|---------------|-------------|---------------|---------------|--------------|
| Glassmorphic Modules   | [x]                | [x]          | [x]           | [x]         | [x]           | [x]           | All use .glassmorphic utility class; consistent a11y and contrast |
| Button                 | [x]                | [x]          | [x]           | [x]         | [x]           | [x]           | ARIA for loading implemented; default type="button" enforced |
| Card                   | [x]                | [x]          | [x]           | [x]         | [x]           | [x]           | -            |
| Alert                  | [x]                | [x]          | [x]           | [x]         | [x]           | [x]           | -            |
| Modal                  | [x]                | [x]          | [x]           | [x]         | [x]           | [x]           | role="dialog" and aria-modal present; add focus trap + restore-to-trigger focus |
| HomePage               | [ ]                | [ ]          | [ ]           | [ ]         | [ ]           | [ ]           |              |
| HomePage (bento/grid) | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | Some visual/accessibility quirks; will revisit after design system migration |
| Navbar                 | [x] | [x] | [x] | [x] | [x] | [x] | Fully theme-aware, strong color contrast, keyboard/focus unchanged |
| Footer                 | [x] | [x] | [x] | [ ] | [x] | [x] | - |
| MainLayout             | [x] | [x] | [x] | [ ] | [x] | [x] | - |
| Box (primitive)        | [x] | [x] | [x] | [ ] | [x] | [x] | - |
| Grid (primitive)       | [x] | [x] | [x] | [ ] | [x] | [x] | - |
| EvidenceDisplay        | [x] | [x] | [x] | [x] | [x] | [x] | Keyboard activation, lazy images, decoding=async |
| LoginPage              | [ ]                | [ ]          | [ ]           | [ ]         | [ ]           | [ ]           |              |
| SignUpPage             | [ ]                | [ ]          | [ ]           | [ ]         | [ ]           | [ ]           |              |
| TradeCard              | [ ]                | [ ]          | [ ]           | [ ]         | [ ]           | [ ]           |              |
| CollaborationCard      | [ ]                | [ ]          | [ ]           | [ ]         | [ ]           | [ ]           |              |
| ProfileCard            | [ ]                | [ ]          | [ ]           | [ ]         | [ ]           | [ ]           |              |
| EnhancedInput          | [ ]                | [ ]          | [ ]           | [ ]         | [ ]           | [ ]           |              |
| Input                  | [x] | [x] | [x] | [x] | [x] | [x] | -            |
| Textarea               | [x] | [x] | [x] | [x] | [x] | [x] | -            |
| Select                 | [x] | [x] | [x] | [x] | [x] | [x] | Radix UI handles a11y |
| ...                    | ...                | ...          | ...           | ...         | ...           | ...           | ...          |

**Legend:**
- [ ] = Needs review/fix
- [x] = Pass
- [!] = Issue found (describe in Notes/Issues)

**Checklist Items:**
- **Keyboard Navigation**: All interactive elements reachable by Tab/Shift+Tab.
- **Focus States**: Visible, accessible focus indicators.
- **Screen Reader**: Proper announcements, logical reading order.
- **ARIA/Labels**: All controls have appropriate ARIA attributes/labels.
- **Color Contrast**: Meets WCAG AA (4.5:1 for text).
- **Reduced Motion**: Animations respect `prefers-reduced-motion`. 

**Note:** All glassmorphic modules (forms, cards, navbar, etc.) now use the universal .glassmorphic utility class, ensuring consistent accessibility and theme compliance. 

---

## Latest UX Audit Findings (2025-08-10)

- Button semantics
  - Risk: Default `<button>` type may submit forms unintentionally.
  - Location: `src/components/ui/Button.tsx`
  - Recommendation: Default to `type="button"` (allow override to `submit` as needed).

- Clickable cards using `role="button"`
  - Observation: Cards are wrapped in a focusable container with `role="button"` and keyboard handlers. This is largely accessible, but nested interactive elements can bubble clicks to the card and trigger unintended navigation.
  - Locations: `src/components/features/connections/ConnectionCard.tsx`, `src/components/features/users/UserCard.tsx`, `src/components/features/trades/TradeCard.tsx`, `src/components/ui/ProfileCard.tsx`
  - Recommendation: Prefer wrapping the card in a `<Link>` or make only specific regions clickable. Ensure action buttons/links inside call `event.stopPropagation()`.

- Action buttons inside clickable cards
  - Issue: In `ConnectionCard`, action buttons (Accept/Decline/Remove) do not stop propagation; clicking them may also trigger card navigation.
  - Location: `src/components/features/connections/ConnectionCard.tsx`
  - Status: Implemented in `ConnectionCard` (stopPropagation on actions). Still audit `UserCard`, `TradeCard`, `ProfileCard` for parity.
  - Recommendation: Ensure all clickable-card children stop propagation.

- Keyboard access for custom clickable blocks
  - Issue: Evidence preview container is mouse-only clickable, lacking keyboard access.
  - Location: `src/components/features/evidence/EvidenceDisplay.tsx`
  - Status: Implemented (role, tabIndex, Enter/Space handlers).
  - Recommendation: Apply same pattern to any similar preview blocks.

- Modal focus management
  - Observation: Modal sets `role="dialog"` and `aria-modal`. However, focus trapping and return-to-trigger focus are not handled.
  - Location: `src/components/ui/Modal.tsx`
  - Recommendation: Add focus trap (e.g., `focus-trap`/`react-focus-lock`), set initial focus inside, and restore focus to the opener on close.

- Banner selector tile semantics
  - Observation: Banner tiles use `role="button"` + keyboard handlers, but could benefit from a more explicit accessible name and visible focus outline.
  - Location: `src/components/ui/BannerSelector.tsx`
  - Recommendation: Add `aria-label` with the formatted name and ensure a visible focus ring.

- Images performance/accessibility
  - Observation: Many `<img>` elements do not specify `loading="lazy"`/`decoding="async"`; some decorative images might need `alt=""` when purely decorative.
  - Locations: Various (e.g., avatars, thumbnails, collaborators list)
  - Recommendation: Add `loading="lazy"` on non-critical images, `decoding="async"`, and ensure correct `alt` usage. Standardize across components.

- System alerts/confirm dialogs
  - Observation: Several uses of `alert/confirm` create blocking, inconsistent UX.
  - Locations: e.g., `src/pages/TradeDetailPage.tsx`, `src/components/forms/ProfileCompletionSteps.tsx`, `src/components/features/portfolio/PortfolioItem.tsx`, others
  - Recommendation: Replace with app `Toast` and a reusable confirm modal.

- Reduced motion
  - Observation: Rich animations; ensure global respect for `prefers-reduced-motion` in custom animation hooks.
  - Locations: `src/components/animations/*`, `src/hooks/*`
  - Recommendation: Gate non-essential animations behind reduced-motion checks.

These notes should be cross-checked and items marked in the table above as they are addressed.