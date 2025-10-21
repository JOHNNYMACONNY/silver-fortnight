# Storybook Usage

This guide explains how to preview the latest gamification and challenges components in Storybook for quick visual QA.

## Run Storybook

```bash
npm run storybook
```

## Notable Stories

- Weekly XP Goal
  - File: `src/stories/WeeklyXPGoal.stories.tsx`
  - Variants:
    - Default (target 500)
    - Goal Met (mocked)
    - Edited Target (800)

- Leaderboard
  - File: `src/stories/Leaderboard.stories.tsx`
  - Variants:
    - Global (Top 5)
    - Global with My Circle Toggle

- Challenge Card
  - File: `src/stories/ChallengeCard.stories.tsx`
  - Variants:
    - Locked (Trade tier)
    - Unlocked (Trade tier)

## Notes
- Some stories use lightweight mocks for `AuthContext` and progression to render component states without backend.
- My Circle toggle appears only if the user follows someone in the app. In Storybook, the toggle may be visible based on mocked state.

