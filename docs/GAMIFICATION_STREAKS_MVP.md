# Gamification Streaks MVP

Status: Implemented (MVP) — Extended in Phase 2B.2

## Scope
- Persist `userStreaks` in Firestore (`currentStreak`, `longestStreak`, `lastActivity`).
- Update challenge streaks on challenge completion.
- Award milestone XP at thresholds 3, 7, 14, 30 days.

## Files
- `src/types/gamification.ts` — `UserStreak`, `StreakType`.
- `src/services/streaks.ts` — `updateUserStreak`, `markChallengeDay`, milestone XP via `awardXPWithLeaderboardUpdate`.
- `src/services/streakConfig.ts` — provides `getStreakMilestoneThresholds()`; configurable via `VITE_STREAK_THRESHOLDS`.
- `src/services/challenges.ts` — call `markChallengeDay(...)` on completion.

## Behavior
- Same day: no double increment.
- +1 day: increment streak.
- >1 day gap: reset to 1.

## Phase 2B.2 Updates
- Added `markLoginDay` and `markSkillPracticeDay` in `src/services/streaks.ts`.
- Wired login streak updates in `src/AuthContext.tsx` on sign-in and session restore.
- UI widgets:
  - `src/components/features/StreakWidget.tsx` (full) with days-to-next hint; used on dashboard and GamificationDashboard Streaks section; now includes tooltips for thresholds and milestone XP (+`XP_VALUES.CHALLENGE_STREAK_BONUS`).
  - `src/components/features/StreakWidgetCompact.tsx` (compact) used in profile header; now includes a tooltip for quick context.
- Integrated `StreakWidget` into `src/pages/DashboardPage.tsx` and `src/components/gamification/GamificationDashboard.tsx` (overview tab Streaks summary).
- Added a “View streak details” link in the `GamificationDashboard` Streaks summary header that opens the History tab with an optional Streaks panel.
- Streak milestone notifications: toast added in `NotificationContainer` with “View” action routing to Progress tab; toggle added in `NotificationPreferences` (`streakToasts`).
 - Realtime emission: milestones now also emit in-app notifications via `emitGamificationNotification` for immediate toasts.
 - Freeze logic: a single missed day can be automatically covered if a freeze is available. Defaults: `maxFreezes = 1`, configurable via `VITE_STREAK_MAX_FREEZES`.
- Auto-freeze preference: Users can toggle auto-freeze in Notification Preferences. Stored per-user in `localStorage` (`streak-auto-freeze-<uid>`). Streak engine respects this preference via `isAutoFreezeEnabled()`.
- UI polish: Upcoming Milestones are collapsible by default; a subtle "Freeze used" badge appears only on the day a freeze is consumed.

## XP Guidance (Dashboard)

- Weekly XP Goal widget shows progress toward a weekly target (default 500 XP).
- XP Breakdown is hidden by default behind a "See breakdown" button to reduce noise.

## Daily Practice Quick Action

- Surface a simple "Log practice" action in streak details and on the `Challenges` page to increment the skill practice streak (`markSkillPracticeDay`).

### Practice Indicator (Implemented)

- The `Challenges` page shows a subtle "Practiced today" indicator after logging practice.
- Indicator resets daily and links users toward streak details for more context.

## Next Steps
- Streak milestone notifications via GamificationNotificationContext.
- Configurable thresholds and streak freeze logic.
