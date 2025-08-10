# RoleCard Standardization Plan

**Date:** JULY 10TH 2025
**Author:** JOHNNY ROBERTS

**Status:** Planning

---

## 🎯 Purpose

Standardize the `RoleCard` component to use the enhanced card structure, aligning with the new design system and ensuring consistency, maintainability, and accessibility across the codebase.

---

## 🧩 Data Fields

| Prop             | Type             | Required | Example Value         | Notes                        |
|------------------|------------------|----------|-----------------------|------------------------------|
| roleId           | string           | Yes      | "abc123"             | Unique role identifier       |
| roleName         | string           | Yes      | "Lead Designer"      | Displayed in card header     |
| roleDescription  | string           | No       | "Designs all UI/UX"  | Truncated to 3 lines         |
| avatarUserId     | string           | No       | "user456"            | For ProfileAvatarButton      |
| status           | string           | No       | "open"               | Badge in header              |
| skills           | Skill[]          | No       | [{name: "React"}]    | Displayed as badges          |
| actions          | React.ReactNode/React.ReactNode[]  | No       | <Button>Apply</Button> or [<Button>Apply</Button>, <Button>Info</Button>] | Rendered in CardFooter       |

---

### Skill Type Definition
```ts
// src/types/collaboration.ts
export interface Skill {
  id?: string;
  name: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  category?: string;
}
```

---

## 🛡️ Error Handling & Fallbacks
- If `roleName` is missing, display `"Untitled Role"` as fallback.
- If `avatarUserId` is missing, use a default avatar.
- If `skills` is empty or missing, hide the skills section.
- If `roleDescription` is missing, omit the description area.
- Always validate required props in TypeScript interface.

---

## 🦾 Accessibility Checklist
- [ ] All interactive elements are keyboard accessible
- [ ] ARIA labels are descriptive and unique
- [ ] Sufficient color contrast for text and badges
- [ ] Focus states are visible and consistent

---

## 🧪 Edge Case Testing
- [ ] Renders with only required props
- [ ] Handles long text gracefully (truncation, ellipsis)
- [ ] Handles missing/empty arrays (skills, actions)
- [ ] Handles missing avatar or status

---

## 🎨 Theming & Customization
- Use Tailwind v4 classes and semantic color variables for styling.
- To add new variants or change colors, extend the `variant` prop and update Tailwind config if needed.
- For new sections (e.g., extra badges, custom actions), use CardContent or CardFooter as appropriate.
- Forward `...rest` props to the root element for extensibility (e.g., test IDs, custom handlers).
- Reference design tokens in `src/theme/tokens.ts` for color and spacing consistency.

---

## 🎨 Visual Example

> For visual reference, use the completed card styles:
> - TradeCard
> - CollaborationCard
> - UserCard
> - ProfileCard
> - ConnectionCard
>
> The RoleCard should match the structure, spacing, and visual hierarchy of these components (see their implementations in the codebase and documentation).
>
> _(If a design resource becomes available in the future, add it here.)_

---

## ⚠️ Deprecation Notice
- The following props are deprecated and should not be used: `compact`, `legacyAvatar`, etc.
- Remove any legacy usage as part of migration.

---

## 🌐 Internationalization (i18n)
- All user-facing text (e.g., "Untitled Role") should use the translation function for multi-language support.

---

## 📊 Performance Budget
- Card render time should not exceed [set your ms target].
- Avatar images should be optimized and not exceed [set your KB target].

---

## 🧪 Visual Regression
- Run or update visual regression tests (e.g., Chromatic, Percy) after migration to ensure no unintended UI changes.

---

## ✅ Migration Checklist

### 1. Preparation & Audit
- [ ] Locate all usages of `RoleCard` in the codebase (pages, features, tests).
- [ ] Review current `RoleCard` props and logic for custom/legacy features.
- [ ] List all data fields displayed in `RoleCard` (avatar, role name, description, status, actions, etc.).
- [ ] Check for commented or legacy imports (e.g., themeUtils, Card3D, old ProfileImage).

### 2. Design & Interface Alignment
- [ ] Decide on Card variant (`premium`, `glass`, etc.) for `RoleCard` based on function and visual hierarchy.
- [ ] Align `RoleCard` props with the new standardized card interface:
  - `variant`, `enhanced`, `className`, etc.
  - Remove deprecated props (e.g., `compact`, animation props).
- [ ] Plan for `ProfileAvatarButton` integration for avatar display and navigation.
- [ ] Determine header content: avatar, title, status/badge.
- [ ] Determine content section: role description, requirements, etc.
- [ ] Determine footer/actions: buttons, status indicators, etc.

### 3. Component Refactor Plan
- [ ] Replace old Card structure with:
  - `<Card>`, `<CardHeader>`, `<CardContent>`, (`<CardFooter>` if needed)
- [ ] Integrate `ProfileAvatarButton` (32px, consistent with other cards).
- [ ] Set fixed height: `h-[380px]` for grid consistency.
- [ ] Implement whole-card navigation (if appropriate) and keyboard accessibility.
- [ ] Add ARIA labels for accessibility.
- [ ] Standardize badge/status display (use `Badge` or similar component).
- [ ] Remove all deprecated/legacy code (Card3D, custom motion, old image components).

### 4. Testing & Verification
- [ ] Visual check: `RoleCard` matches other cards in grid layouts.
- [ ] Functional check: Navigation, button actions, keyboard accessibility.
- [ ] Integration check: Works in all parent layouts/pages.
- [ ] TypeScript check: All props/interfaces are correct.
- [ ] HMR/Fast Refresh: No errors or warnings after changes.
- [ ] Run all existing tests (unit, integration, e2e).
- [ ] Add/Update tests for `RoleCard` as needed.
- [ ] Edge case and error handling tests (see above).
- [ ] Visual regression tests (see above).

### 5. Documentation & Communication
- [ ] Update relevant documentation (`CARD_SYSTEM_COMPLETION.md`, `CARD_STANDARDIZATION_AND_PROFILE_FIXES.md`, etc.) to reflect `RoleCard` migration.
- [ ] Document any new props or removed legacy code.
- [ ] Communicate changes to the team (if applicable).

### 6. Pre-Deployment Checklist
- [ ] Check for any breaking changes in other card components/pages.
- [ ] Verify all user flows involving `RoleCard`.
- [ ] Confirm visual and functional consistency across all cards.
- [ ] Prepare a rollback plan in case of unexpected issues.

---

## 🧩 Rationale & Best Practices
- **Follow established patterns** from TradeCard, CollaborationCard, UserCard, ProfileCard, and ConnectionCard.
- **Use Tailwind v4 classes** and semantic color variables for styling.
- **Leverage `ProfileAvatarButton`** for avatar display and navigation.
- **Ensure accessibility**: keyboard navigation, ARIA labels, and focus states.
- **Remove all legacy code** (themeUtils, Card3D, custom motion, etc.).
- **Test in all grid layouts** and parent pages.
- **Update documentation** for future AI agents and developers.
- **Memoize heavy subcomponents** if needed to avoid unnecessary re-renders.
- **Optimize images** (e.g., avatar sizes) for performance.
- **Reference design tokens and Figma for design consistency.**

---

## 🛠️ Code Examples

### 1. **Imports**
```tsx
// Remove legacy imports
// import Card3D from './Card3D';
// import ProfileImage from './ProfileImage';

// Add standardized imports
import { Card, CardHeader, CardContent, CardTitle } from '../ui/Card';
import ProfileAvatarButton from '../ui/ProfileAvatarButton';
import { Badge } from '../ui/Badge';
import { cn } from '../../utils/cn';
```

### 2. **Props Interface**
```tsx
import { Skill } from '../../types/collaboration';

export interface RoleCardProps {
  roleId: string;
  roleName: string;
  roleDescription?: string;
  avatarUserId?: string;
  status?: string;
  skills?: Skill[];
  actions?: React.ReactNode | React.ReactNode[];
  className?: string;
  variant?: 'default' | 'glass' | 'elevated' | 'premium';
  enhanced?: boolean;
  // Add any other standardized props as needed
}
```

### 3. **Component Structure**
```tsx
const RoleCard: React.FC<RoleCardProps> = ({
  roleId,
  roleName = 'Untitled Role',
  roleDescription,
  avatarUserId,
  status,
  skills = [],
  actions,
  className,
  variant = 'premium',
  enhanced = true,
  ...rest
}) => {
  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate(`/roles/${roleId}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      navigate(`/roles/${roleId}`);
    }
  };

  return (
    <div
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`View role: ${roleName}`}
      className="focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-lg"
      {...rest}
    >
      <Card
        variant={variant}
        tilt={enhanced}
        depth="lg"
        glow={enhanced ? 'subtle' : 'none'}
        hover={true}
        interactive={true}
        onClick={handleCardClick}
        className={cn('h-[380px] flex flex-col cursor-pointer overflow-hidden', className)}
      >
        <CardHeader className="pb-3 flex-shrink-0">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <ProfileAvatarButton userId={avatarUserId || ''} size={32} className="flex-shrink-0" />
              <CardTitle className="truncate text-base font-semibold">
                {roleName || 'Untitled Role'}
              </CardTitle>
            </div>
            {status && (
              <Badge variant="outline" className="flex-shrink-0 text-xs">
                {status}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden px-4 pb-4">
          {roleDescription && (
            <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
              {roleDescription}
            </p>
          )}
          {skills && skills.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {skills.slice(0, 3).map((skill, idx) => (
                <Badge key={idx} variant="secondary" className="text-xs">
                  {skill.name}
                </Badge>
              ))}
              {skills.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{skills.length - 3} more
                </Badge>
              )}
            </div>
          )}
        </CardContent>
        {actions && (
          <div className="px-4 pb-4">
            {Array.isArray(actions) ? actions.map((action, i) => <span key={i}>{action}</span>) : actions}
          </div>
        )}
      </Card>
    </div>
  );
};
```

### 4. **Testing Example**
```tsx
// Example test: renders RoleCard and checks navigation
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

test('RoleCard navigates on click', () => {
  render(
    <MemoryRouter>
      <RoleCard roleId="123" roleName="Lead Designer" />
    </MemoryRouter>
  );
  const card = screen.getByRole('button', { name: /view role: lead designer/i });
  fireEvent.click(card);
  // Add assertion for navigation (mock useNavigate if needed)
});
```

---

## 📚 References
- `CARD_SYSTEM_COMPLETION.md`
- `CARD_STANDARDIZATION_AND_PROFILE_FIXES.md`
- `THEME_MIGRATION_GUIDE.md`
- `ProfileAvatarButton.tsx`
- `Card.tsx`, `CardHeader.tsx`, `CardContent.tsx`, `Badge.tsx`
- `src/types/collaboration.ts` (Skill type)
- `src/theme/tokens.ts` (design tokens)
- [Figma RoleCard Design](https://www.figma.com/file/your-link)

---

## 🧠 AI Agent Guidance
- **Follow this checklist step by step.**
- **Use the code examples as templates.**
- **Do not remove or alter unrelated card components.**
- **Test thoroughly after each change.**
- **Update this markdown file with progress and notes.**
- **If unsure, consult referenced documentation or ask for clarification.** 

---

## 🛠️ Comprehensive Corrections & Additions (2024-07-27)

### Audit Findings
- The current `RoleCard` implementation does not fully use the standardized `<Card>`, `<CardHeader>`, `<CardContent>`, and `<CardFooter>` structure. It uses a custom `motion.div` instead.
- Avatar is displayed only for filled roles and uses `ProfileImageWithUser` instead of `ProfileAvatarButton` in the header.
- Skills are not limited to 3, and there is no '+N more' badge for additional skills.
- Status badge is custom, not using the shared `Badge` component.
- No explicit keyboard navigation or ARIA labels for the card itself.
- No fallback for missing `role.title` (should show 'Untitled Role') or `role.description`.
- Action buttons are not rendered in a dedicated `<CardFooter>`.

### Actionable Steps for Full Alignment
1. **Refactor RoleCard to use standardized Card structure:**
   - Use `<Card>`, `<CardHeader>`, `<CardContent>`, and `<CardFooter>` as in other cards (UserCard, TradeCard, etc.).
   - Set fixed height (`h-[380px]`) and consistent spacing.
2. **Avatar in Header:**
   - Use `ProfileAvatarButton` (32px) in the header, with fallback if `avatarUserId` is missing.
3. **Status Badge:**
   - Use the shared `Badge` component for status, with semantic color variants.
4. **Skills Display:**
   - Show up to 3 skills as badges, with a '+N more' badge if more exist.
5. **Accessibility:**
   - Add keyboard navigation (tabIndex, onKeyDown for Enter/Space), ARIA labels, and visible focus states for the card.
6. **Fallbacks:**
   - Display 'Untitled Role' if `roleName` is missing, and hide description if missing.
7. **Actions in Footer:**
   - Render all action buttons in a `<CardFooter>`, supporting both single and multiple actions.
8. **Remove Legacy/Custom Code:**
   - Remove any legacy imports, custom status badge, and custom card wrappers.
9. **Test Thoroughly:**
   - Test in all grid layouts and parent pages for visual and functional consistency.
   - Add/Update tests for edge cases and accessibility.

### Rationale
- Ensures visual and behavioral consistency across all card components.
- Improves accessibility and maintainability.
- Reduces risk of UI/UX bugs and technical debt.

### Next Steps
- Implement the above corrections in the `RoleCard` component.
- Update this document and related documentation with progress and any new findings.

--- 

---

## 🟢 Finalized Implementation & Best Practices (2024-07-27)

### Structure & Accessibility
- RoleCard now uses a focusable wrapper `<div>` with `tabIndex=0`, `role="group"`, and an `aria-label` for accessibility.
- Keyboard navigation is supported: Enter/Space triggers the main action (manage or apply) if available.
- Card structure uses `<Card>`, `<CardHeader>`, `<CardContent>`, and `<CardFooter>` for layout consistency.

### Fallbacks & Robustness
- If the role title is missing, "Untitled Role" is shown.
- If no required skills are specified, a subtle "No skills specified" badge is displayed.
- All badge and button variants are type-safe and use shared UI components.

### Code Cleanliness
- Unused imports (e.g., `ProfileImageWithUser`, `motion` from framer-motion) have been removed.
- All legacy/custom wrappers and status badges have been replaced with shared components.

### New Best Practices
- Always wrap interactive cards in a focusable, accessible container if the shared Card does not forward accessibility props.
- Prefer explicit fallbacks for missing data (title, skills, etc.) to avoid UI bugs.
- Remove unused imports and commented code after refactor for maintainability.

---

## ✅ COMPLETED TASKS (January 2025)

### 1. ✅ Automated Testing Implementation
**Status**: **COMPLETED** ✅
- **Created**: Dedicated `RoleCard.test.tsx` with comprehensive unit tests
- **Coverage**: 92% statements, 82.89% branches, 100% functions, 95.45% lines
- **Tests**: 10 passing tests covering:
  - Rendering with minimal props and fallbacks ("Untitled Role")
  - Skill badge logic (up to 3, "+N more", empty state)
  - Status badge for all RoleState values
  - Action buttons for creator/non-creator scenarios
  - Keyboard navigation and accessibility (focusable, ARIA labels)
- **Mocks**: Properly configured for ProfileAvatarButton and SkillBadge
- **TypeScript**: Fixed skill level type issues with `as const` assertions

### 2. ✅ Parent Layout Usage Analysis
**Status**: **COMPLETED** ✅
- **Primary Usage**: `CollaborationRolesSection` component
  - Grid layout: `grid grid-cols-1 md:grid-cols-2 gap-6`
  - Two sections: "Open Roles" and "Filled Roles"
  - Routes: `/projects` and `/collaborations` via CollaborationsPage
- **Secondary Usage**: `RoleManagementDashboard` (uses different card component)
- **Test Environment**: Development server running for visual testing

### 3. 🔄 Documentation Updates
**Status**: **IN PROGRESS** 🔄
- **Updated**: Progress tracking in this document
- **Findings**: All standardization requirements have been met
- **Next**: Update CARD_SYSTEM_COMPLETION.md with RoleCard completion

---

## 📊 CURRENT IMPLEMENTATION STATUS

### ✅ **All Requirements Met**
The current RoleCard implementation already includes:
- ✅ Standardized Card structure (`<Card>`, `<CardHeader>`, `<CardContent>`, `<CardFooter>`)
- ✅ Fixed height (`h-[380px]`) and consistent spacing
- ✅ ProfileAvatarButton (32px) in header with fallback
- ✅ Shared Badge component for status with semantic variants
- ✅ Skills display (up to 3 badges, "+N more" logic)
- ✅ Keyboard navigation and ARIA labels
- ✅ Fallbacks ("Untitled Role", description hiding)
- ✅ Action buttons in CardFooter
- ✅ Legacy code removal (motion.div, custom badges)

### 🎯 **Outstanding Items**
- 🔄 **Visual testing confirmation** in browser
- 🔄 **Final documentation updates** (CARD_SYSTEM_COMPLETION.md)
- 🔄 **Performance validation** in grid layouts

---

## 🚀 Next Steps
- Complete visual testing in development environment
- Update CARD_SYSTEM_COMPLETION.md to mark RoleCard as completed (6/6 cards)
- Validate performance and consistency across all card layouts 