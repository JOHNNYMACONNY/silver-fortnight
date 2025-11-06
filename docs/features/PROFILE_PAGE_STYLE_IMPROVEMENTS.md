# Profile Page Style Improvements

## Status
- Implemented: July 2025
- Files impacted: `src/pages/ProfilePage.tsx`

## Changes
- Banner header added via `ProfileBanner` with overlaid avatar container
- Larger, responsive title and compact meta row with icons (email, dates)
- Accessible tablist semantics for sections (role="tablist"/"tab"/"tabpanel")
- Enhanced skeleton loader for banner and header while profile loads
 - Reputation badge next to display name via `ReputationBadge`
 - Compact stats strip: total trades and trades this week via `getDashboardStats`
 - Website, location, member-since badge in header meta row
 - Subtle animated underline on active/hovered tabs
 - Social integration: `UserSocialStats` (compact) in header and `SocialFeatures` for follow/unfollow
 - Tab a11y: roving focus with Left/Right arrows and dynamic `tabIndex`
 - Performance: lazy-load `PortfolioTab` and prefetch on tab hover (also for Gamification)
 - Copy actions: added copy buttons for Email and UID with accessible labels
 - Privacy: email hidden in header for non-owners; shown with copy in About tab for owners
 - True stats deferral: `getDashboardStats` and `getUserSocialStats` fetched via IntersectionObserver when header enters viewport
 - Composite reputation: 0–100 score computed on the client from XP (50%), trades (30%), followers (20%)
 - Sticky tabs: tab bar made sticky with smooth scroll to sections
 - Scrollspy: active tab updates automatically as sections enter the viewport
 - Tab a11y extended: Home/End key support in addition to Arrow keys
 - Followers clickthrough: followers cell opens `UserDirectoryPage` via `?relation=followers&user=<id>`
 - Per-tab skeletons: added loading placeholders for Portfolio and Gamification panels
 - Reputation tooltip: explains how the composite score is calculated
- Added share action: copy/share profile link with Web Share API fallback
- Added inline edit modal: update `displayName`, `bio`, `website`, `location` using `userService.updateUser`
- Added profile completeness banner for owners with progress bar and quick entry point to edit
- Added avatar upload with preview using Cloudinary unsigned upload; stores `profilePicture` publicId
- Added compact skills editor (string array) with add/remove and cap of 10
- Added collaborations and trades tab content: lazy-loaded lists with skeletons and empty states
- Upgraded collaborations to use `CollaborationCard` and trades to use `TradeCard` for consistency
- Added lightweight in-tab pagination (Load more) and View all CTAs for collaborations and trades
- Portfolio tab: owner-only "Add project" CTA; richer per-card skeletons
 - Banner: owners can now update/remove banner inline. Field stored on user as `banner: BannerData | null`. Display renders via `ProfileBanner` with fallbacks.
 - Handle and sharing: `@handle` display (privacy-aware), share prefers `/u/{handle}` falling back to `/profile/{uid}`. Header copy icon and modal link with live preview + copy. Handle validation/uniqueness in edit modal.
 - Tagline: one-line tagline under name; editable in modal.
  - Deep-links: tabs support `#about`, `#portfolio`, `#progress`, `#collaborations`, `#trades`; last tab remembered. Tab scroller position persists across visits.
 - Skill chips: clicking a skill switches to Portfolio with a client-side skill filter + clear pill.
 - Reviews: header shows rating chip (avg · count) and up to 2 preview lines, with a “See all reviews” link. Lightweight skeletons while loading.
  - Analytics: lightweight event logging for share/copy/tab changes/skill clicks via Firestore `events` collection.
  - Motion/accessibility: all programmatic scrolling respects `prefers-reduced-motion` and falls back to non-animated scrolling for those users.
  - Overflow-aware tabs: horizontal overflow is handled with fades and desktop chevrons that only appear when needed and disable at edges.

## Rationale
- Improve visual hierarchy and alignment with design primitives (`Box`, `Stack`, `Cluster`)
- Establish consistent profile header pattern used across the app (cards vs page)
- Improve completion and engagement by prompting owners to finish key profile fields
- Enable quick self-serve edits without leaving the profile page
## Implementation Notes

- `src/pages/ProfilePage.tsx`
  - New modal built with `SimpleModal` and wired to `userService.updateUser`
  - Share button uses `navigator.share` if available; otherwise copies URL and triggers toast
  - Completeness score: 5 fields weighted equally (photo, bio, skills, location, website)
  - Env flag: `VITE_PROFILE_ENRICH_ROLES` (default true). Set to 'false' to disable role subcollection lookups
  - Banner editing: pass `bannerUrl`, `isEditable`, `onBannerChange`, `onBannerRemove` to `ProfileBanner`. Persist via `userService.updateUser`. Added `banner?: BannerData | string | null` to user types in `services/entities/UserService.ts` and `services/firestore.ts`.
  - Handle/Privacy/Tagline: added `handle`, `handlePrivate`, `verified`, and `tagline` support; edit modal validation and link preview.
  - Reviews: uses `getUserReviews` to fetch, computes avg/count, renders preview and link.
  - Analytics: `src/services/analytics.ts` added with `logEvent(name, metadata)`
  - See also: `docs/ENHANCED_SEARCH_UI_IMPLEMENTATION.md` for the sticky search, StatChips, and pagination pattern used on Collaborations, which informs consistency with profile tabs and list sections.

### Latest updates

- Filters and pagination
  - Collaborations and Trades tabs now include simple filters (All, Yours)
  - In-tab pagination via "Load more" plus infinite scroll sentinel
  - Visible count summary (e.g., "Showing 6 of 14")

- Accessibility improvements
  - "Load more" buttons expose `aria-busy` and `aria-live="polite"` while loading
  - List containers have IDs (`profile-collaborations-list`, `profile-trades-list`) referenced by `aria-controls`
  - Infinite scroll sentinels are marked `aria-hidden="true"`

- Role enrichment
  - Fetch of roles subcollection limited to currently visible slice
  - Per-collaboration caching avoids repeat lookups during the session
  - Fully gated by `VITE_PROFILE_ENRICH_ROLES`

- Portfolio UX
  - Owner-only "Add project" CTA on the Profile page and also inside `PortfolioTab`
  - Richer per-card skeletons while portfolio tab lazy-loads
 - Header UX
  - Website label normalized to strip protocol and `www.`

- Completeness banner
  - Shows the next missing fields (up to 3) with a compact "and N more" tail

### File map

- `src/pages/ProfilePage.tsx`
  - Avatar upload + preview, skills editor, share button
  - Tabs: Collaborations (with `CollaborationCard`), Trades (with `TradeCard`), Portfolio (lazy)
  - Filters, pagination, infinite scroll, a11y for load-more
  - Role enrichment and caching (env flag controlled)
- `src/components/features/portfolio/PortfolioTab.tsx`
  - Empty-state CTA for owners (Add project)
  - Skeletons and existing filter/view controls
  - Skill filter integration via window event; pinned (featured) items row above regular items

### Operational notes

- Env setup: if role lookups are too chatty in a given environment, add `VITE_PROFILE_ENRICH_ROLES='false'` to disable
- Cards link to `/collaborations/:id` and `/trades/:tradeId`; ensure those routes remain active in `src/App.tsx`

## Follow-ups

- Optional: add avatar/skills editors inline or link to a full settings page
- Optional: guard website input with stricter validation and normalization
- Better a11y for keyboard/screenreader users on tab navigation

## Next Candidates (Optional)
- Persist reputation score in `socialStats` for caching/backfill and analytics
- Server-side relation filtering for directory (query `userFollows` to return true followers/following lists)
- Profile completion prompts using `ProfileCompletionSteps`
- Cardized content sections with consistent `bg-card` and spacing
- Per-tab skeletons for About/Trades (About pending) to improve perceived performance
- Inline banner edit for own profile (uses existing `ProfileBanner` edit controls)

## QA Notes
- Verified no linter errors after edits
- No breaking changes to routing; data loading unchanged
 - Navbar overlap: kept default `z-navigation` and no page-level z-index; header negative margin only overlaps banner, not nav
