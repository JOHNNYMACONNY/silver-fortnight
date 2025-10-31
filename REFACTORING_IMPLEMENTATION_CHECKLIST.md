# ProfilePage Refactoring - Implementation Checklist

**Status:** Ready for Implementation  
**Timeline:** 6.5-9.5 days  
**Start Date:** TBD  
**Completion Target:** TBD

---

## Pre-Flight Checklist

- [ ] Review validation report (PROFILE_PAGE_REFACTORING_VALIDATION_REPORT.md)
- [ ] Review refactoring guide (PROFILE_PAGE_REFACTORING_GUIDE.md)
- [ ] Approve adjusted timeline (6.5-9.5 days)
- [ ] Create feature branch: `refactor/profile-page-modular`
- [ ] Backup current ProfilePage.tsx
- [ ] Run baseline tests: `npm test src/pages/__tests__/Profile`
- [ ] Run baseline type-check: `npm run type-check`
- [ ] Document baseline metrics (file size, test coverage, performance)

---

## Phase 0: Preparation (0.5 days)

### 0.1 Create Type Definitions
- [ ] Create `src/types/user.ts`
- [ ] Define consolidated `UserProfile` interface with:
  - [ ] All properties from ProfilePage.UserProfile
  - [ ] All properties from UserService.User
  - [ ] Add missing `bannerFx` property
  - [ ] Add missing `id` property
  - [ ] Consolidate `photoURL` and `profilePicture`
- [ ] Export `UserProfile` type
- [ ] Run type-check: `npm run type-check`

### 0.2 Create Directory Structure
- [ ] Create `src/pages/ProfilePage/` directory
- [ ] Create `src/pages/ProfilePage/components/` directory
- [ ] Create `src/pages/ProfilePage/hooks/` directory
- [ ] Create `src/pages/ProfilePage/types/` directory
- [ ] Create `src/pages/ProfilePage/__tests__/` directory

### 0.3 Migrate Existing Tests
- [ ] Move `src/pages/__tests__/ProfileHeaderSnapshots.test.tsx` to `src/pages/ProfilePage/__tests__/`
- [ ] Move `src/pages/__tests__/ProfileTabsA11y.test.tsx` to `src/pages/ProfilePage/__tests__/`
- [ ] Update test imports from `'../ProfilePage'` to `'../ProfilePage'` (same relative path)
- [ ] Run tests to verify: `npm test ProfilePage`
- [ ] Commit: "chore: migrate ProfilePage tests to new location"

### 0.4 Create Local Type Exports
- [ ] Create `src/pages/ProfilePage/types/index.ts`
- [ ] Re-export `UserProfile` from `src/types/user.ts`
- [ ] Define local types: `TabType`, `ProfilePageProps`
- [ ] Commit: "chore: create ProfilePage type definitions"

**Phase 0 Completion Criteria:**
- [ ] All tests passing
- [ ] Type-check passing
- [ ] Directory structure created
- [ ] Types consolidated

---

## Phase 1: Extract Sub-Components (2-3 days)

### 1.1 Extract ProfileHeader Component
- [ ] Create `src/pages/ProfilePage/components/ProfileHeader.tsx`
- [ ] Extract JSX for profile header section (avatar, name, stats)
- [ ] Extract related state: `isFollowing`, `followersCount`, `followingCount`
- [ ] Extract related handlers: `handleFollow`, `handleUnfollow`
- [ ] Define `ProfileHeaderProps` interface
- [ ] Update ProfilePage to use `<ProfileHeader />`
- [ ] Run tests: `npm test ProfilePage`
- [ ] Commit: "refactor: extract ProfileHeader component"

### 1.2 Extract ProfileEditModal Component
- [ ] Create `src/pages/ProfilePage/components/ProfileEditModal.tsx`
- [ ] Extract edit modal JSX
- [ ] Extract related state: `isEditing`, `editedProfile`, `isSaving`
- [ ] Extract related handlers: `handleSave`, `handleCancel`, `handleInputChange`
- [ ] Define `ProfileEditModalProps` interface
- [ ] Update ProfilePage to use `<ProfileEditModal />`
- [ ] Run tests: `npm test ProfilePage`
- [ ] Commit: "refactor: extract ProfileEditModal component"

### 1.3 Extract ProfileShareMenu Component
- [ ] Create `src/pages/ProfilePage/components/ProfileShareMenu.tsx`
- [ ] Extract share menu JSX
- [ ] Extract related state: `showShareMenu`
- [ ] Extract related handlers: `handleShare`, `copyProfileLink`
- [ ] Define `ProfileShareMenuProps` interface
- [ ] Update ProfilePage to use `<ProfileShareMenu />`
- [ ] Run tests: `npm test ProfilePage`
- [ ] Commit: "refactor: extract ProfileShareMenu component"

### 1.4 Extract ProfileTabs Component
- [ ] Create `src/pages/ProfilePage/components/ProfileTabs.tsx`
- [ ] Extract tab navigation JSX
- [ ] Extract related state: `activeTab`
- [ ] Extract related handlers: `handleTabChange`
- [ ] Define `ProfileTabsProps` interface
- [ ] Update ProfilePage to use `<ProfileTabs />`
- [ ] Run tests: `npm test ProfilePage`
- [ ] Commit: "refactor: extract ProfileTabs component"

### 1.5 Extract Tab Content Components
- [ ] Create `src/pages/ProfilePage/components/ProfileAboutTab.tsx`
  - [ ] Extract about tab JSX
  - [ ] Define `ProfileAboutTabProps` interface
- [ ] Create `src/pages/ProfilePage/components/ProfileCollaborationsTab.tsx`
  - [ ] Extract collaborations tab JSX
  - [ ] Define `ProfileCollaborationsTabProps` interface
- [ ] Create `src/pages/ProfilePage/components/ProfileTradesTab.tsx`
  - [ ] Extract trades tab JSX
  - [ ] Define `ProfileTradesTabProps` interface
- [ ] Update ProfilePage to use tab components
- [ ] Run tests: `npm test ProfilePage`
- [ ] Commit: "refactor: extract tab content components"

### 1.6 Move ProfilePage to New Location
- [ ] Copy `src/pages/ProfilePage.tsx` to `src/pages/ProfilePage/ProfilePage.tsx`
- [ ] Update imports in new ProfilePage.tsx
- [ ] Update App.tsx import: `import ProfilePage from './pages/ProfilePage/ProfilePage'`
- [ ] Run tests: `npm test`
- [ ] Delete old `src/pages/ProfilePage.tsx`
- [ ] Commit: "refactor: move ProfilePage to new directory structure"

**Phase 1 Completion Criteria:**
- [ ] All components extracted
- [ ] All tests passing
- [ ] ProfilePage.tsx reduced to ~800-1000 lines
- [ ] No duplicate code

---

## Phase 2: Extract Custom Hooks (1-2 days)

### 2.1 Extract useProfileData Hook
- [ ] Create `src/pages/ProfilePage/hooks/useProfileData.ts`
- [ ] Extract profile fetching logic
- [ ] Return: `{ profile, loading, error, refetch }`
- [ ] Use `userService.getUser(userId)`
- [ ] Update ProfilePage to use hook
- [ ] Run tests: `npm test ProfilePage`
- [ ] Commit: "refactor: extract useProfileData hook"

### 2.2 Extract useProfileStats Hook
- [ ] Create `src/pages/ProfilePage/hooks/useProfileStats.ts`
- [ ] Extract stats and reviews fetching logic
- [ ] Return: `{ stats, reviews, loading, error }`
- [ ] Update ProfilePage to use hook
- [ ] Run tests: `npm test ProfilePage`
- [ ] Commit: "refactor: extract useProfileStats hook"

### 2.3 Extract useCollaborationsList Hook
- [ ] Create `src/pages/ProfilePage/hooks/useCollaborationsList.ts`
- [ ] Extract collaborations fetching logic
- [ ] Use `collaborationService.getCollaborationsForUser(userId)`
- [ ] Return: `{ collaborations, loading, error, refetch }`
- [ ] Update ProfileCollaborationsTab to use hook
- [ ] Run tests: `npm test ProfilePage`
- [ ] Commit: "refactor: extract useCollaborationsList hook"

### 2.4 Extract useTradesList Hook
- [ ] Create `src/pages/ProfilePage/hooks/useTradesList.ts`
- [ ] Extract trades fetching logic
- [ ] ⚠️ Use `tradeService.getActiveTradesForUser(userId)` (not getTradesForUser)
- [ ] Return: `{ trades, loading, error, refetch }`
- [ ] Update ProfileTradesTab to use hook
- [ ] Run tests: `npm test ProfilePage`
- [ ] Commit: "refactor: extract useTradesList hook"

### 2.5 Extract useProfileEdit Hook
- [ ] Create `src/pages/ProfilePage/hooks/useProfileEdit.ts`
- [ ] Extract edit form state management
- [ ] Return: `{ editedProfile, isSaving, handleChange, handleSave, handleCancel }`
- [ ] Update ProfileEditModal to use hook
- [ ] Run tests: `npm test ProfilePage`
- [ ] Commit: "refactor: extract useProfileEdit hook"

**Phase 2 Completion Criteria:**
- [ ] All hooks extracted
- [ ] All tests passing
- [ ] ProfilePage.tsx reduced to ~400-600 lines
- [ ] State management consolidated

---

## Phase 3: Improve Type Safety (1 day)

### 3.1 Replace Any Types
- [ ] Find all `any` types in ProfilePage components
- [ ] Replace with proper interfaces
- [ ] Update service call types
- [ ] Run type-check: `npm run type-check`
- [ ] Commit: "refactor: replace any types with proper interfaces"

### 3.2 Add Missing Type Properties
- [ ] Ensure `bannerFx` is in UserProfile type
- [ ] Ensure `id` is in UserProfile type
- [ ] Update all component props to use UserProfile
- [ ] Run type-check: `npm run type-check`
- [ ] Commit: "refactor: add missing type properties"

### 3.3 Strict Null Checks
- [ ] Add null checks for optional properties
- [ ] Use optional chaining where appropriate
- [ ] Add default values where needed
- [ ] Run type-check: `npm run type-check`
- [ ] Commit: "refactor: improve null safety"

**Phase 3 Completion Criteria:**
- [ ] No `any` types
- [ ] All properties typed
- [ ] Type-check passing with no errors
- [ ] Null safety improved

---

## Phase 4: Add Comprehensive Tests (2-3 days)

### 4.1 Hook Tests
- [ ] Create `src/pages/ProfilePage/hooks/__tests__/useProfileData.test.ts`
  - [ ] Test loading state
  - [ ] Test success state
  - [ ] Test error state
  - [ ] Test refetch
- [ ] Create `src/pages/ProfilePage/hooks/__tests__/useProfileStats.test.ts`
- [ ] Create `src/pages/ProfilePage/hooks/__tests__/useCollaborationsList.test.ts`
- [ ] Create `src/pages/ProfilePage/hooks/__tests__/useTradesList.test.ts`
- [ ] Create `src/pages/ProfilePage/hooks/__tests__/useProfileEdit.test.ts`
- [ ] Run tests: `npm test ProfilePage/hooks`
- [ ] Commit: "test: add comprehensive hook tests"

### 4.2 Component Tests
- [ ] Create `src/pages/ProfilePage/components/__tests__/ProfileHeader.test.tsx`
  - [ ] Test rendering
  - [ ] Test follow/unfollow
  - [ ] Test accessibility
- [ ] Create tests for all extracted components
- [ ] Run tests: `npm test ProfilePage/components`
- [ ] Commit: "test: add component tests"

### 4.3 Integration Tests
- [ ] Update `src/pages/ProfilePage/__tests__/ProfilePage.test.tsx`
  - [ ] Test full page rendering
  - [ ] Test tab switching
  - [ ] Test edit flow
  - [ ] Test error states
- [ ] Run tests: `npm test ProfilePage`
- [ ] Commit: "test: add integration tests"

### 4.4 Coverage Check
- [ ] Run coverage: `npm test -- --coverage ProfilePage`
- [ ] Verify 70%+ coverage
- [ ] Add tests for uncovered lines
- [ ] Commit: "test: achieve 70%+ coverage"

**Phase 4 Completion Criteria:**
- [ ] All hooks tested
- [ ] All components tested
- [ ] Integration tests passing
- [ ] 70%+ test coverage

---

## Post-Refactoring Validation

### Performance Benchmarks
- [ ] Measure initial render time
- [ ] Measure tab switch time
- [ ] Compare with baseline
- [ ] Verify no regression (< 10% slower)

### Accessibility Audit
- [ ] Run existing a11y tests
- [ ] Test keyboard navigation
- [ ] Test screen reader compatibility
- [ ] Fix any issues found

### Code Quality
- [ ] Run linter: `npm run lint`
- [ ] Fix all linting errors
- [ ] Run type-check: `npm run type-check`
- [ ] Review code complexity

### Documentation
- [ ] Update component documentation
- [ ] Add JSDoc comments to hooks
- [ ] Update README if needed
- [ ] Document any breaking changes

---

## Final Checklist

- [ ] All tests passing (100%)
- [ ] Type-check passing
- [ ] Linter passing
- [ ] 70%+ test coverage achieved
- [ ] No performance regression
- [ ] Accessibility tests passing
- [ ] Code review completed
- [ ] Documentation updated
- [ ] Create PR with detailed description
- [ ] Deploy to staging
- [ ] Manual QA on staging
- [ ] Monitor for issues
- [ ] Merge to main

---

## Rollback Plan

If critical issues are discovered:

1. **Immediate Rollback**
   - [ ] Revert merge commit
   - [ ] Deploy previous version
   - [ ] Notify team

2. **Issue Analysis**
   - [ ] Document the issue
   - [ ] Identify root cause
   - [ ] Create fix plan

3. **Re-deployment**
   - [ ] Fix issues in feature branch
   - [ ] Re-test thoroughly
   - [ ] Re-deploy when ready

---

**Checklist Created:** October 31, 2025  
**Ready for Implementation:** ✅ YES  
**Estimated Completion:** 6.5-9.5 days from start

