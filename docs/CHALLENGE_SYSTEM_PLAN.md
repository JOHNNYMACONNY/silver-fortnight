# TradeYa Challenge System Implementation Plan

This document outlines the comprehensive plan for implementing the challenge system in TradeYa, including both AI-generated personalized challenges and scheduled community challenges. This plan is designed to integrate seamlessly with existing features and planned future enhancements.

## Table of Contents

1. [System Overview](#system-overview)
2. [Challenge Types](#challenge-types)
3. [Data Structure](#data-structure)
   3.1. [Required Changes to `src/types/gamification.ts`](#31-required-changes-to-srctypesgamificationts)
4. [Core Components](#core-components)
5. [AI Integration with OpenRouter](#ai-integration-with-openrouter)
6. [Scheduled Challenges System](#scheduled-challenges-system)
7. [User Interface](#user-interface)
   7.1. [Detailed UI Component Design](#detailed-ui-component-design)
8. [Integration Points](#integration-points)
9. [Implementation Phases](#implementation-phases)
10. [Technical Considerations](#technical-considerations)
11. [Compatibility Guidelines](#compatibility-guidelines)

## System Overview

The TradeYa Challenge System will provide users with two complementary types of challenges:

1. **AI-Generated Personalized Challenges**: Cost-efficient, template-based challenges tailored to individual users' skills and interests
2. **Scheduled Community Challenges**: Regular challenges available to all users on daily, weekly, and monthly cycles

This dual approach balances personalization with community engagement while managing API costs and system resources.

## Challenge Types

### Personalized Challenges

- **Skill-Based Challenges**: Focused on specific skills the user wants to develop
- **Industry-Specific Challenges**: Tailored to user's professional field
- **Quick Challenges**: Short tasks completable in under an hour
- **Comprehensive Challenges**: More involved projects for deeper skill development

### Scheduled Community Challenges

- **Daily Challenges**: Quick tasks refreshed every 24 hours
### Scheduling Automation (Implemented - MVP)

- Cloud Functions added to manage lifecycle:
  - `activateChallenges` (hourly): moves `upcoming` → `active` when `startDate <= now`.
  - `completeChallenges` (hourly): moves `active` → `completed` when `endDate <= now`.
  - `scheduleWeeklyChallenges` (Mondays): seeds upcoming challenges from `challengeTemplates` with `recurrence`.
- Client surfaces a minimal “Featured today/this week” chip on `ChallengesPage` using convenience helpers.
  - Featured chips include subtle tooltips clarifying that base + bonus XP are available on completion.

Indexes:
- Ensure composite indexes exist for queries on `challenges` by `status`, `startDate`, `endDate` as needed by schedulers.


### Reward Visibility (Base vs Bonus)

- All challenge views should consistently display rewards as "Base" and "Bonus" where applicable.
- Detail page: show Base XP and a compact list of potential bonuses.
- Completion results: show total XP and a secondary line with "Base: +X / Bonus: +Y".

### Practice UX (Minimal)

- Keep “Log practice” quick action.
- Show a subtle “Practiced today” indicator (text with dot) on the Challenges page when the user has logged practice for the day.
- **Weekly Challenges**: More substantial challenges running Monday-Sunday
- **Monthly Competitions**: Major challenges with significant depth
- **Themed Series**: Connected challenges around seasonal or industry themes

### Challenge Categories

- **Design**: UI/UX, graphic design, illustration, branding
- **Development**: Web, mobile, game development
- **Audio**: Music production, sound design, mixing, podcasting
- **Video**: Filmmaking, editing, animation, motion graphics
- **Writing**: Copywriting, content creation, storytelling
- **Photography**: Portrait, product, landscape, conceptual
- **3D**: Modeling, texturing, animation, rendering
- **Mixed Media**: Challenges combining multiple disciplines

## Data Structure

### Challenge Interface

```typescript
export interface Challenge {
  id: string;
  title: string;
  description: string;
  category: string;
  subcategory?: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  createdBy: string; // 'ai', 'system', or user ID
  creatorName?: string;
  creatorPhotoURL?: string;
  createdAt: any; // Timestamp
  updatedAt: any; // Timestamp
  status: 'draft' | 'scheduled' | 'active' | 'completed' | 'archived'; // Overall status of the challenge definition
  
  // Challenge type information
  type: 'skill' | 'industry' | 'quick' | 'comprehensive' | 'daily' | 'weekly' | 'monthly' | 'series';
  isPersonalized: boolean;
  isScheduled: boolean;
  forUserId?: string; // For personalized challenges
  
  // Scheduling information
  startDate?: any; // Timestamp
  endDate?: any; // Timestamp
  
  // Challenge content
  objectives: string[];
  resources?: {
    title: string;
    description?: string;
    url: string;
    type: 'article' | 'video' | 'tool' | 'template';
  }[];
  evaluationCriteria?: string[];
  
  // Series information
  seriesId?: string;
  seriesOrder?: number;
  
  // Rewards definition for completing this challenge
  rewards: ChallengeRewardDefinition; // Defines what rewards are given upon completion
  
  // Participation
  participants?: string[]; // User IDs
  participantCount?: number;
  
  // Submissions (Master list of all submissions for this challenge, if needed for public view)
  // Alternatively, submissions are primarily tracked under UserChallenge.
  submissions?: {
    id: string;
    userId: string;
    userName?: string;
    userPhotoURL?: string;
    content: string;
    evidenceUrls?: string[];
    createdAt: any;
    status: 'pending' | 'approved' | 'featured';
    rating?: number;
    feedback?: {
      userId: string;
      comment: string;
      rating: number;
      createdAt: any;
    }[];
  }[];
}

// Defines the rewards a challenge offers
export interface ChallengeRewardDefinition {
  xp: number; // Base XP for completion
  badges?: string[]; // Badge IDs or names awarded
  unlockableFeatures?: string[];
  // Potential for bonus XP criteria, e.g., { bonusXpForSpeed: 50 }
}

// Represents the actual rewards a user received for a specific completion instance
export interface ChallengeRewardEarned {
  xpAwarded: number;
  badgesAwarded?: string[];
  unlockableFeaturesAwarded?: string[];
}

export interface ChallengeSeries {
  id: string;
  title: string;
  description: string;
  category: string;
  createdBy: string;
  createdAt: any;
  updatedAt: any;
  status: 'active' | 'completed' | 'archived';
  challenges: string[]; // IDs of challenges in this series
  completionBadge?: string;
  completionXpBonus?: number;
}

export interface UserChallenge {
  userId: string;
  challengeId: string;
  joinedAt: any;
  status: 'joined' | 'in_progress' | 'submitted' | 'completed' | 'abandoned' | 'pending_review' | 'failed'; // Align with src/types/gamification.ts UserChallengeStatus
  submissionId?: string; // ID of the final submission, if applicable
  submittedAt?: any;
  completedAt?: any;
  xpEarned?: number; // Actual XP earned by the user for this challenge completion
  badgesEarned?: string[]; // Actual badges earned by the user for this challenge completion
  progress?: number; // Current progress (e.g., objectives completed)
  maxProgress?: number; // Total progress units (e.g., total objectives)
  submissions?: ChallengeSubmission[]; // History of submissions/progress updates for this user on this challenge
  completionTimeMinutes?: number; // Time taken to complete, if tracked
  // Data related to a specific completion instance, if needed for history (e.g., from ChallengeCompletion.tsx's completionData)
  // perfectScoreAchieved?: boolean;
  // speedBonusAchieved?: boolean;
}

export interface ChallengeSubmission { // Represents a single submission (progress or final) by a user for a challenge
  id: string; // Auto-generated
  userId: string;
  challengeId: string;
  title?: string; // e.g., "Progress Update" or final submission title
  content: string; // Detailed description or reflection
  evidenceUrls?: string[]; // Links to evidence
  notes?: string; // Additional notes
  createdAt: any; // Timestamp
  submissionType: 'progress_update' | 'final_submission';
  status?: 'pending_review' | 'approved' | 'rejected' | 'draft'; // Status of this specific submission
}

export interface ChallengeTemplate {
  id: string;
  title: string; // With placeholders like {{skill}} or {{medium}}
  baseDescription: string; // With placeholders
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  type: 'skill' | 'industry' | 'quick' | 'comprehensive' | 'daily' | 'weekly' | 'monthly';
  baseObjectives: string[]; // With placeholders
  baseEvaluationCriteria?: string[]; // With placeholders
  placeholders: string[]; // List of placeholders used in this template
  baseXpReward: number;
  timeEstimate: string;
}
```

### Firestore Collections

- `/challenges`: All challenges (both personalized and scheduled) - stores `Challenge` objects.
- `/challengeSeries`: Series of related challenges - stores `ChallengeSeries` objects.
- `/challengeTemplates`: Templates for AI-generated challenges - stores `ChallengeTemplate` objects.
- `/users/{userId}/userChallenges`: User-challenge relationships - stores `UserChallenge` objects.
- `/users/{userId}/challengeSubmissions`: User's submissions across all challenges - stores `ChallengeSubmission` objects (optional, if not embedded in `UserChallenge`). Consider if `UserChallenge.submissions` is sufficient.

### 3.1. Required Changes to `src/types/gamification.ts`

To fully support the Challenge System as defined in this plan, the central `src/types/gamification.ts` file will require updates. The following types and interfaces should be modified or added to align with the definitions in Section 3 ("Data Structure") of this plan. This ensures consistency and provides the necessary type support for the new challenge features.

**Summary of Key Changes:**

1. **`ChallengeType`**:
    - **Current:** Enum (`DAILY`, `WEEKLY`, `SKILL`, `COMMUNITY`, `SPECIAL_EVENT`, `PERSONAL`)
    - **Planned:** String literal union.
    - **Action:** Replace the existing enum with:

        ```typescript
        export type ChallengeType = 'skill' | 'industry' | 'quick' | 'comprehensive' | 'daily' | 'weekly' | 'monthly' | 'series';
        ```

2. **`ChallengeCategory`**:
    - **Current:** Enum (includes `TRADING`, `COLLABORATION`, `COMMUNITY` alongside creative fields).
    - **Planned:** String literal union focusing on creative disciplines as outlined in this plan's "Challenge Categories" section.
    - **Action:** Replace the existing enum with:

        ```typescript
        export type ChallengeCategory = 'design' | 'development' | 'audio' | 'video' | 'writing' | 'photography' | '3d' | 'mixed_media';
        ```

        *(Note: The `Challenge` interface's `category` field should use this type).*

3. **`ChallengeStatus` (for the master Challenge object)**:
    - **Current:** Enum (`DRAFT`, `UPCOMING`, `ACTIVE`, `COMPLETED`, `ARCHIVED`, `CANCELLED`)
    - **Planned:** String literal union with slightly different values.
    - **Action:** Replace the existing enum with:

        ```typescript
        export type ChallengeStatus = 'draft' | 'scheduled' | 'active' | 'completed' | 'archived';
        ```

4. **`UserChallengeStatus` (for user's participation status)**:
    - **Current:** Enum (`ACTIVE`, `COMPLETED`, `ABANDONED`, `SUBMITTED`)
    - **Planned:** String literal union with more granular states.
    - **Action:** Replace the existing enum with:

        ```typescript
        export type UserChallengeStatus = 'joined' | 'in_progress' | 'submitted' | 'completed' | 'abandoned' | 'pending_review' | 'failed';
        ```

5. **`Challenge` Interface**:
    - **Action:** Update the existing `Challenge` interface in `src/types/gamification.ts` to match the definition in Section 3 of this plan. Key changes include:
        - `type: ChallengeType` (using the new planned type).
        - `category: ChallengeCategory` (using the new planned type).
        - `status: ChallengeStatus` (using the new planned type).
        - Rename `rewards: ChallengeReward` to `rewards: ChallengeRewardDefinition` (see below).
        - Add `isPersonalized: boolean`.
        - Add `isScheduled: boolean`.
        - Add `forUserId?: string`.
        - Add `seriesId?: string`.
        - Add `seriesOrder?: number`.
        - Ensure fields like `objectives: string[]`, `resources`, `evaluationCriteria` are present as per the plan.
        - Fields like `requirements`, `instructions` from the current `Challenge` type in `gamification.ts` should be reviewed. If they are not in the plan's `Challenge` definition (Section 3), they should be removed or reconciled (e.g., `instructions` might be part of `description` or `objectives`).

6. **`UserChallenge` Interface**:
    - **Action:** Update the existing `UserChallenge` interface in `src/types/gamification.ts`. Key changes include:
        - `status: UserChallengeStatus` (using the new planned type).
        - Add `xpEarned?: number`.
        - Add `badgesEarned?: string[]`.
        - Ensure other fields like `progress`, `maxProgress`, `submissions`, `completionTimeMinutes` align with the plan's definition in Section 3.

7. **Reward Interfaces**:
    - **Action:**
        - Rename the existing `ChallengeReward` interface in `src/types/gamification.ts` to `ChallengeRewardDefinition` to match the plan. Its structure (`xp: number`, `badges?: string[]`, etc.) is largely compatible.
        - Add the new `ChallengeRewardEarned` interface as defined in Section 3 of this plan:

            ```typescript
            export interface ChallengeRewardEarned {
              xpAwarded: number;
              badgesAwarded?: string[];
              unlockableFeaturesAwarded?: string[];
            }
            ```

These changes will ensure that `src/types/gamification.ts` accurately reflects the data structures required by the new Challenge System. The TypeScript errors currently observed in test files and services are expected to be largely resolved once these type updates are implemented, though further code adjustments in those files might be necessary to correctly utilize the new types.

## Core Components

### Challenge Service

The central service managing challenge creation, retrieval, and lifecycle:

```typescript
// Key functions to implement

// Create a new challenge (base function)
createChallenge(challengeData: Partial<Challenge>): Promise<{ challengeId: string | null; error: string | null }>

// Get challenge by ID
getChallenge(challengeId: string): Promise<{ challenge: Challenge | null; error: string | null }>

// Get challenges with filtering
getChallenges(filters: ChallengeFilters): Promise<{ challenges: Challenge[]; error: string | null }> // ChallengeFilters from src/types/gamification.ts

// Get recommended challenges for a user
getRecommendedChallenges(userId: string, limit?: number): Promise<{ challenges: Challenge[]; error: string | null }>

// Join a challenge
joinChallenge(challengeId: string, userId: string): Promise<{ success: boolean; error: string | null }> // Creates/updates UserChallenge

// Submit to a challenge (for progress updates or final submission)
submitToChallenge(userId: string, challengeId: string, submission: Partial<ChallengeSubmission>): Promise<{ submissionId: string | null; error: string | null }> // Creates ChallengeSubmission, updates UserChallenge.status and UserChallenge.submissions

// Get user's challenge participation records
getUserChallenges(userId: string, status?: UserChallengeStatus): Promise<{ userChallenges: UserChallenge[]; error: string | null }> // Returns UserChallenge objects

// Update challenge status (admin/system function for the master Challenge object)
updateMasterChallengeStatus(challengeId: string, status: ChallengeStatus): Promise<{ success: boolean; error: string | null }>

// Complete a challenge for a user (called after final submission is approved or auto-approved)
// This function updates UserChallenge status to 'completed', records rewards, completion time etc.
markUserChallengeCompleted(userId: string, challengeId: string, submissionId?: string, completionDetails: { xpEarned: number; badgesEarned?: string[]; completionTimeMinutes?: number; /* other completionData */ }): Promise<{ success: boolean; error: string | null }>
```

### Challenge Template System

A system for managing templates used by the AI to generate challenges:

```typescript
// Key functions to implement

// Create a challenge template
createChallengeTemplate(templateData: Partial<ChallengeTemplate>): Promise<{ templateId: string | null; error: string | null }>

// Get templates by category
getTemplatesByCategory(category: string): Promise<{ templates: ChallengeTemplate[]; error: string | null }>

// Select appropriate template for user
selectTemplateForUser(userSkills: string[], difficulty?: string): Promise<ChallengeTemplate>

// Fill template placeholders
fillTemplatePlaceholders(template: ChallengeTemplate, fillers: Record<string, string>): Challenge
```

### User Challenge Management

Functions for managing a user's relationship with challenges:

```typescript
// Key functions to implement

// Get user's active challenges (combines UserChallenge data with Challenge details)
getUserActiveChallenges(userId: string): Promise<{ activeChallenges: Array<{userChallenge: UserChallenge, challengeDetails: Challenge}>; error: string | null }>

// Get user's completed challenges (combines UserChallenge data with Challenge details)
getUserCompletedChallenges(userId: string): Promise<{ completedChallenges: Array<{userChallenge: UserChallenge, challengeDetails: Challenge}>; error: string | null }>

// Get a specific user challenge progress details
getUserChallengeProgress(userId: string, challengeId: string): Promise<{ userChallenge: UserChallenge | null; challengeDetails: Challenge | null; error: string | null }>

// Update user challenge status (e.g., from 'joined' to 'in_progress', or 'abandoned')
updateUserChallengeParticipationStatus(userId: string, challengeId: string, status: UserChallengeStatus): Promise<{ success: boolean; error: string | null }>
```

## AI Integration with OpenRouter

### Efficient AI Challenge Generation

To minimize token usage while still providing personalized challenges:

1. **Template-Based Generation**:
   - Use pre-defined templates with placeholders
   - AI only fills in specific details rather than generating entire challenges
   - Significantly reduces token consumption

2. **User Clustering**:
   - Group users with similar skills/interests
   - Generate one challenge per cluster instead of per user
   - Share challenges among similar users

3. **Caching Strategy**:
   - Cache generated challenges for reuse
   - Implement variation system instead of generating completely new challenges
   - Store previously generated challenges as references

### OpenRouter Integration Service

```typescript
// Key functions to implement

// Get completion from OpenRouter (base function)
getOpenRouterCompletion(prompt: string, model: string = 'mistralai/mistral-7b-instruct'): Promise<string>

// Generate challenge fillers for template
generateChallengeFillers(template: ChallengeTemplate, userSkills: string[], userLevel: number): Promise<Record<string, string>>

// Generate personalized challenge
generatePersonalizedChallenge(userId: string, params?: ChallengeGenerationParams): Promise<{ challenge: Challenge | null; error: string | null }>

// Generate scheduled challenge
generateScheduledChallenge(config: ScheduledChallengeConfig): Promise<{ challenge: Challenge | null; error: string | null }>
```

### Prompt Templates

Efficient prompts for different challenge types:

```typescript
// Daily challenge prompt template
const DAILY_CHALLENGE_PROMPT = `
Create a quick daily challenge for creative professionals.
Theme: {{theme}}
Category: {{category}}
Difficulty: {{difficulty}}

Return a JSON object with:
- title: Catchy, specific title
- objectives: 2-3 clear goals
- timeEstimate: "15-30 minutes"
`;

// Personalized challenge prompt template
const PERSONALIZED_CHALLENGE_PROMPT = `
Fill in the placeholders for this challenge template:
Title: "{{templateTitle}}"
Description: "{{templateDescription}}"

User skills: {{userSkills}}
User level: {{userLevel}}

Return ONLY a JSON object with these fields:
- fillers: object with key-value pairs for each placeholder
- difficulty: suggested difficulty level
- timeEstimate: estimated hours to complete
`;
```

## Scheduled Challenges System

### Challenge Scheduling Service

```typescript
// Key functions to implement

// Schedule a challenge
scheduleChallenge(challengeData: ScheduledChallengeData): Promise<{ challengeId: string | null; error: string | null }>

// Get active scheduled challenges
getActiveScheduledChallenges(): Promise<{ challenges: Challenge[]; error: string | null }>

// Get upcoming scheduled challenges
getUpcomingScheduledChallenges(limit?: number): Promise<{ challenges: Challenge[]; error: string | null }>

// Activate scheduled challenges (when start time is reached)
activateScheduledChallenges(): Promise<{ activated: number; error: string | null }>

// Complete expired challenges (when end time is reached)
completeExpiredChallenges(): Promise<{ completed: number; error: string | null }>

// Schedule recurring challenges (daily, weekly, monthly)
scheduleRecurringChallenges(): Promise<{ scheduled: number; error: string | null }>
```

### Challenge Automation

Cloud functions to manage the challenge lifecycle:

```typescript
// Daily function to activate scheduled challenges
exports.activateChallenges = functions.pubsub
  .schedule('every 1 hours')
  .onRun(async () => {
    await activateScheduledChallenges();
    return null;
  });

// Daily function to complete expired challenges
exports.completeChallenges = functions.pubsub
  .schedule('every 1 hours')
  .onRun(async () => {
    await completeExpiredChallenges();
    return null;
  });

// Weekly function to schedule upcoming challenges
exports.scheduleWeeklyChallenges = functions.pubsub
  .schedule('every monday 00:00')
  .onRun(async () => {
    await scheduleRecurringChallenges();
    return null;
  });
```

## User Interface

### Challenge Hub Page

Central location for discovering and participating in challenges:

- **Active Challenges**: Currently available challenges
- **Challenge Calendar**: Visual calendar of scheduled challenges. A compact strip (`src/components/features/challenges/ChallengeCalendar.tsx`) now appears on `ChallengesPage` with a "View all" link. The full list view is available at `/challenges/calendar` (`src/pages/ChallengeCalendarPage.tsx`).
  - Accessibility & UX:
    - Strip and page include polite live announcements with counts after load.
    - Loading states are announced via `aria-busy`.
    - The page includes a short subtitle clarifying cadence: “Daily challenges reset daily; Weekly challenges run Monday–Sunday.”
  - Analytics:
    - `challenge_calendar_strip_view` on strip data load
    - `challenge_calendar_view_all_click` on “View all”
    - `challenge_calendar_page_view` on page data load
- **Leaderboards**: Rankings for different challenge types
- **Upcoming Challenges**: Preview of future challenges
- **Completed Challenges**: Archive of past challenges

### Challenge Detail Page

Comprehensive view of a single challenge:

- **Challenge Information**: Title, description, objectives
- **Participation Controls**: Join button, submission form
- **Timeline**: Start/end dates, time remaining
- **Resources**: Helpful links and materials
- **Submissions Gallery**: View other participants' work
- **Leaderboard**: Top participants for this challenge

### Challenge Submission Components

Specialized components for submitting challenge work:

- **Submission Form**: Title, description, reflection
- **Evidence Uploader**: Interface for embedding evidence from external sources
- **Feedback Request**: Option to request specific feedback
- **Preview**: Review submission before finalizing

### Challenge Discovery Components

Components for finding relevant challenges:

- **Challenge Cards**: Compact preview of challenges. Use the standardized `ChallengeCard` (`src/components/features/challenges/ChallengeCard.tsx`), which wraps the shared `Card` shell (variant/premium, tilt, glow) and supports an optional `footer` slot for CTAs (e.g., View/Join). This component is already used in `ChallengesPage.tsx` and `ChallengeDiscoveryInterface.tsx`.
- **Challenge Filters**: Category, difficulty, time commitment
- **Challenge Search**: Find specific challenges
- **Recommended Challenges**: Personalized suggestions

### Detailed UI Component Design

This section will detail the specific design for each UI component required for the Challenge System. For each component or component group, the following aspects need to be defined:

- **Props**: Input data and configuration options.
- **State**: Internal data managed by the component.
- **User Interactions**: How users interact with the component and the resulting actions or events.
- **Visual Design & Layout**: Detailed description or mockups of the component's appearance, structure, and responsiveness.
- **API Interactions**: Specific `ChallengeService` (or other service) functions the component will call.

**A. Review Existing Challenge Components:**

The following components already have existing files and need to be reviewed against the full requirements in this plan. Their design details (Props, State, Interactions, Visuals, API calls) should be documented or updated here:

- **`ChallengeCard.tsx`**
  - Current implementation note: The codebase provides a standardized `ChallengeCard` at `src/components/features/challenges/ChallengeCard.tsx` built on the shared `Card` system for consistent aesthetics with Trade/Collaboration/User cards. It exposes:
    - `challenge: Challenge`
    - `recommendation?: ChallengeRecommendation` (for discovery context badges/details)
    - `onSelect?: (challenge: Challenge) => void` (card-level navigation handler)
    - `footer?: React.ReactNode` (slot to render page-specific CTAs like View/Join; children should call `e.stopPropagation()`)
    - `variant?: 'default' | 'glass' | 'elevated' | 'premium'` (defaults to `premium`), `enhanced?: boolean`
  - This standardized component is now used by `ChallengesPage.tsx` (including the new tabs All/Active/Mine) and `ChallengeDiscoveryInterface.tsx`.
  - **Purpose:** Displays a summary of a single challenge in a card format, providing key information and actions like viewing details, joining, or leaving the challenge.
  - **Props:**
    - `challenge: Challenge`: The core data object for the challenge (referencing `Challenge` type from `src/types/gamification.ts`).
    - `onJoin?: () => void`: Optional callback executed when the "Join Challenge" button is clicked.
    - `onLeave?: () => void`: Optional callback executed when the "Leave Challenge" button is clicked.
    - `isParticipating?: boolean` (default: `false`): Indicates if the current user is participating. Affects button display and shows a "You're participating" badge.
    - `currentUserId?: string`: ID of the current user, used to conditionally render action buttons (Join/Leave).
    - *(Proposed Addition)* `userChallengeProgress?: { current: number, max: number } | number`: Data to display actual user progress on the challenge (e.g., `{ current: 2, max: 5 }` or a percentage `50`).
  - **State (Internal):**
    - Largely stateless, derives display from props.
    - Contains helper functions for:
      - `formatDate(timestamp: any): string`: Formats Firestore timestamp to a readable date string.
      - `getDaysRemaining(): string`: Calculates and formats the days remaining until `challenge.endDate`.
      - `getTypeBadgeColor(): string`: Returns Tailwind CSS classes for challenge type badge.
      - `getDifficultyColor(): string`: Returns Tailwind CSS classes for challenge difficulty badge.
      - `getStatusColor(): string`: Returns Tailwind CSS classes for challenge status badge.
  - **User Interactions:**
    - **View Details:** Clicking "View Details" (a `react-router-dom <Link>`) navigates to `/challenges/${challenge.id}`.
    - **Join Challenge:** Button appears if `currentUserId` is provided, `challenge.status` is `ACTIVE`, and `isParticipating` is `false`. Calls `onJoin` prop on click.
    - **Leave Challenge:** Button appears if `currentUserId` is provided, `challenge.status` is `ACTIVE`, and `isParticipating` is `true`. Calls `onLeave` prop on click.
  - **Visual Design & Layout:**
    - Built using `Card`, `CardHeader`, `CardBody`, `CardFooter` (from `../ui/Card`) and `Button` (from `../ui/Button`).
    - Displays `type`, `difficulty`, `status` as colored badges.
    - Shows XP reward (e.g., `100 XP` from `challenge.rewards.xp`).
    - Displays challenge `title`, days remaining, and `startDate`.
    - Shows a `line-clamp-3` truncated `description`.
    - Displays `tags` (skills) if available.
    - Shows `participantCount`.
    - If `isParticipating` is true, shows a "You're participating" badge.
    - Includes a progress bar (currently hardcoded to 0%, needs to be dynamic via `userChallengeProgress` prop).
    - Uses Lucide-react icons (`Trophy`, `Clock`, `Calendar`, `Users`, `Star`).
    - Supports dark mode via Tailwind CSS.
  - **API Interactions (Indirect via Props):**
    - Receives `challenge` data (presumably fetched by a parent component using `challenges.ts` service).
    - `onJoin` and `onLeave` props are expected to trigger API calls in the parent component (e.g., `challengeService.joinChallenge(challenge.id, userId)`).
  - **Notes & Potential Updates:**
    - **Type Reconciliation:** Ensure the `Challenge` type in `src/types/gamification.ts` is fully aligned with the `Challenge` interface in `CHALLENGE_SYSTEM_PLAN.md`. The card should be updated to reflect any new relevant fields (e.g., `timeEstimate`, `creatorName`).
    - **Dynamic Progress:** Implement dynamic progress display using the proposed `userChallengeProgress` prop. The `challenge.objectives` can be used to determine the nature of progress if `maxProgress` is based on objective count.
    - **Enhanced Rewards Display:** Consider displaying icons or indicators for other reward types (e.g., badges) if specified in `challenge.rewards.badges`.
    - **Prop Definition Consolidation:** Reconcile the `ChallengeCardProps` in `ChallengeCard.tsx` with the one in `src/types/gamification.ts`. The local definition seems more current for its specific join/leave functionality.
    - **Accessibility (A11y):** Review for ARIA attributes and keyboard navigation, though base UI components should handle some of this.

- **`ChallengeList.tsx`**
  - **Purpose:** Renders a list or grid of `ChallengeCard` components, with controls for searching, filtering, sorting, and view mode. Handles fetching challenges and user participation status.
  - **Props:**
    - `showFilters?: boolean` (default: `true`): Toggles visibility of the filter button and panel.
    - `defaultFilters?: Partial<ChallengeFilters>` (default: `{}`): Pre-applied filters passed to the `getChallenges` service call on initial load. `ChallengeFilters` is from `src/types/gamification.ts`.
    - `maxItems?: number`: Maximum number of challenges to fetch (defaults to 50 if not provided, used in `getChallenges` limit).
    - `variant?: 'grid' | 'list'` (default: `'grid'`): Initial display mode (grid or list).
    - `showHeader?: boolean` (default: `true`): Toggles visibility of the header section (title, count, view/sort controls).
  - **State (Internal):**
    - `challenges: Challenge[]`: Stores the raw list of challenges fetched from the `getChallenges` service.
    - `filteredChallenges: Challenge[]`: Challenges displayed after client-side filters (search, category dropdowns) are applied.
    - `userChallengeParticipations: UserChallenge[]`: List of `UserChallenge` records for the current user (fetched via `getUserChallenges` service). Used to determine `isParticipating` for each `ChallengeCard`.
    - `loading: boolean`: Indicates if challenges are being fetched.
    - `error: string | null`: Stores error messages from fetch operations.
    - `searchTerm: string`: Current value of the search input.
    - `selectedCategory: ChallengeCategory | ''`: Selected category for filtering.
    - `selectedDifficulty: ChallengeDifficulty | ''`: Selected difficulty for filtering.
    - `selectedStatus: ChallengeStatus | ''`: Selected status for filtering.
    - `selectedType: ChallengeType | ''`: Selected type for filtering.
    - `sortBy: ChallengeSortBy`: Current field for sorting (e.g., `START_DATE`).
    - `sortOrder: 'asc' | 'desc'`: Current sort order.
    - `showFiltersPanel: boolean`: Controls visibility of the filter selection panel.
    - `viewMode: 'grid' | 'list'`: Current display mode for the challenge cards.
    - Utilizes `useAuth()` for `currentUser` and `useToast()` for notifications.
  - **User Interactions:**
    - **Search:** Text input filters challenges client-side by title, description, or tags.
    - **Filtering (Client-Side):** Dropdowns for Category, Difficulty, Status, and Type apply filters to the `challenges` array. A "Reset Filters" button clears these.
    - **Sorting (Server-Side):** Changing `sortBy` or `sortOrder` triggers a re-fetch of challenges via `getChallenges` service with new sort parameters.
    - **View Mode Toggle:** Buttons switch between 'grid' and 'list' rendering of `ChallengeCard`s.
    - **Join/Leave Challenge:** Actions delegated to `ChallengeCard`s, which call `handleJoinChallenge` or `handleLeaveChallenge` in this component. These handlers then invoke service functions (`joinChallenge`, `leaveChallenge`) and re-fetch data.
    - **Error Retry:** "Try Again" button appears on fetch error to re-attempt `fetchChallenges`.
  - **Visual Design & Layout:**
    - Optional header with title, challenge count, view/sort/filter controls.
    - Search bar.
    - Collapsible panel for filter dropdowns.
    - Displays `ChallengeCard`s in a responsive grid or a vertical list.
    - Includes loading spinner, error message display, and a "no challenges found" message.
    - Styled with Tailwind CSS, `themeClasses`, `cn` utility, and Lucide-react icons.
  - **API Interactions (Direct):**
    - `getChallenges(filters: ChallengeFilters)`: Fetches challenges based on `defaultFilters`, `maxItems`, `sortBy`, `sortOrder`.
    - `getUserChallenges(userId: string)`: Fetches `UserChallenge` records for the current user.
    - `joinChallenge(challengeId: string, userId: string)`: Called when a user joins a challenge.
    - `leaveChallenge(challengeId: string, userId: string)`: Called when a user leaves a challenge.
  - **Notes & Potential Updates:**
    - **Server-Side Filtering:** Currently, interactive filters (search, dropdowns) are client-side. For scalability, these should be moved server-side by updating `fetchChallenges` to take all filter parameters from the state.
    - **Pagination:** Lacks pagination. Consider adding for large numbers of challenges (e.g., using `offset` in `ChallengeFilters`).
    - **`userChallengeParticipations` Type:** Ensure this state is correctly typed as `UserChallenge[]`.
    - **Prop Definition Consolidation:** Reconcile `ChallengeListProps` in `ChallengeList.tsx` with the one in `src/types/gamification.ts`. The local props `variant` and `showHeader` are not in the shared type. The shared type's `onChallengeClick` is not implemented.
    - **`showSearch` Prop:** The `ChallengeListProps` in `gamification.ts` has `showSearch`, but search is always rendered in the component. Decide if this prop is needed.

- **`ChallengeProgress.tsx`**
  - **Purpose:** Displays detailed progress for a specific challenge a user is participating in. Shows objectives, submission history, and provides a form to submit new progress updates or final submissions.
  - **Props:**
    - `challengeId: string` (required): ID of the challenge.
    - `challenge?: Challenge`: Optional full `Challenge` object (fetched if not provided).
    - `userChallenge?: UserChallenge`: Optional `UserChallenge` object (fetched if not provided).
    - `showSubmissionForm?: boolean` (default: `true`): Controls visibility of the submission form.
    - `onProgressUpdate?: (updatedUserChallenge: UserChallenge) => void`: Callback when `UserChallenge` data is fetched/updated.
  - **State (Internal):**
    - `challengeData: Challenge | null`: Stores the fetched `Challenge` details.
    - `userChallengeData: UserChallenge | null`: Stores the fetched `UserChallenge` details.
    - `loading: boolean`: Loading state for fetching data.
    - `submitting: boolean`: Loading state for submitting new progress/submission.
    - `error: string | null`: Error messages.
    - `submissionText: string`: Text for new submission.
    - `submissionFiles: File[]`: (Currently unused for actual upload) Files for submission.
    - `submissionNotes: string`: Additional notes for submission.
    - Utilizes `useAuth()` for `currentUser` and `useToast()` for notifications.
  - **User Interactions:**
    - **Submit Progress/Final Submission:** Users fill a form (details, notes) and click "Submit". This calls `handleSubmit`, which constructs a `ChallengeSubmission` (distinguishing between `progress_update` and `final_submission` based on context) and sends it to `submitToChallenge` service. Re-fetches `UserChallenge` data on success. If it's a final submission, it might trigger the `markUserChallengeCompleted` flow after approval.
    - **Try Again:** Button to re-fetch data on error.
  - **Visual Design & Layout:**
    - **Progress Overview Card:** Displays "Your Progress", status (icon & text), progress bar (`userChallengeData.progress` / `userChallengeData.maxProgress`), and stats (Started, Last Activity, Completed, Time Spent).
    - **Objectives Card:** (If `challengeData.objectives` provided) Lists objectives, marking completed ones based on `userChallengeData.progress`.
    - **Submissions History Card:** (If `userChallengeData.submissions` exist) Lists past submissions with details.
    - **Submission Form Card:** (If `showSubmissionForm` and challenge is active/in_progress) Form with textareas for details and notes, and a "Submit" button.
    - **Completion Message Card:** (If challenge is completed by user) Congratulatory message with XP earned (from `userChallengeData.xpEarned`).
    - Includes loading, error, and "Not Participating" states.
    - Styled with Tailwind CSS, `themeClasses`, `cn` utility, and Lucide-react icons.
  - **API Interactions (Direct):**
    - `getChallenge(challengeId)`: Fetches `Challenge` details if not passed via props.
    - `getUserChallengeProgress(userId: string, challengeId: string)`: Fetches/refreshes `UserChallenge` data if not passed via props.
    - `submitToChallenge(userId: string, challengeId: string, submission: Partial<ChallengeSubmission>)`: Submits new progress or final submission.
    - Potentially triggers `markUserChallengeCompleted` flow indirectly (e.g., after a final submission is approved by an admin or auto-approved).
  - **Notes & Potential Updates:**
    - **`UserChallenge` & `Challenge` Data Fetching:** Component should efficiently fetch `Challenge` and `UserChallenge` data if not provided.
    - **`ChallengeSubmission` Type:** Ensure `submissionType` ('progress_update' | 'final_submission') is correctly set.
    - **File Uploads:** The `submissionFiles` state suggests intent for file uploads. `evidenceUrls` in `ChallengeSubmission` needs full implementation.
    - **Objective Completion Logic:** Assumes `userChallengeData.progress` directly maps to the number of completed objectives. This should be consistent with backend logic for updating progress.
    - **Final Submission Flow:** Clarify how a "final submission" leads to the challenge being marked as 'completed' for the user (e.g., admin review, auto-approval, then calling `markUserChallengeCompleted`).

- **`ChallengeCompletion.tsx`**
  - **Purpose:** A modal dialog displayed *after* a user successfully completes a challenge (i.e., after `markUserChallengeCompleted` is successful). It provides a celebratory experience with animations, and displays rewards earned and key completion statistics. This component is presentational.
  - **Props:**
    - `isOpen: boolean` (required): Controls modal visibility.
    - `onClose: () => void` (required): Callback to close the modal.
    - `challenge: Challenge` (required): The `Challenge` object that was completed.
    - `completionData?: { timeSpent?: number; bonusAchieved?: boolean; perfectScoreAchieved?: boolean; streak?: number; }`: Optional data about the specific completion instance (e.g., time, bonuses achieved during this completion).
    - `rewardsEarned: ChallengeRewardEarned` (required): Object detailing actual rewards the user received (XP, badges, unlockable features).
    - `onContinue?: () => void`: Optional callback for a "Next Challenge" button.
  - **State (Internal):**
    - `showAnimation: boolean`: Manages overall modal entry/exit animation.
    - `animationPhase: number` (0-3): Controls staggered animation of modal content.
  - **User Interactions:**
    - **Close Modal:** Clicking backdrop, 'X' icon, or "Close" button triggers `onClose`.
    - **Continue:** If `onContinue` is provided, a "Next Challenge" button calls this callback.
  - **Visual Design & Layout:**
    - Full-screen backdrop with a centered, animated modal.
    - **Header:** Celebratory design with gradient, animated dots, and an animated `Trophy` icon. Displays "Challenge Complete!" and the completed challenge's title.
    - **Content:**
      - **Achievement Badges:** (If applicable from `completionData`) Displays badges like "Perfect Score", "Speed Bonus", "Nx Streak" with icons.
      - **Rewards Earned:** Lists XP, badges, and unlockable features earned, each in a styled section, using `rewardsEarned` prop.
      - **Completion Stats:** (If `completionData` provided) Shows time spent and a "Completed" indicator.
      - **Action Buttons:** "Close" and optional "Next Challenge" button.
    - Features phased animations for content reveal.
    - Styled with Tailwind CSS, `themeClasses`, `cn` utility, and Lucide-react icons.
  - **API Interactions (Direct):** None. All data is received via props.
  - **Notes & Potential Updates:**
    - **Data Source:** The `rewardsEarned` and `completionData` props should be populated from the result of the `markUserChallengeCompleted` service call (or related data fetched for the completed `UserChallenge` record).
    - **`completionData` Storage:** Determine if `completionData` (timeSpent, bonusAchieved, perfectScoreAchieved, streak related to this completion) should be stored persistently in the `UserChallenge` record.

**B. Design for Challenge Hub Page Components:**

- **Challenge Hub Page (`ChallengesPage.tsx` or similar):**
  - Overall layout and navigation. This page will likely render `ChallengeDashboard.tsx` for logged-in users, or a more general discovery view (like `ChallengeList` with full filters) for guests or as a main browsing interface.
- **`ChallengeDashboard.tsx`**
  - **Purpose:** Provides a personalized overview for the current user, summarizing their challenge statistics, overall progress, recommended challenges, and recently available challenges. It acts as a primary user-facing entry point for their challenge activities.
  - **Placement:** Likely a key component rendered on the main `/challenges` page for logged-in users, or on a dedicated `/dashboard/challenges` route.
  - **Props:**
    - `showRecommendations?: boolean` (default: `true`): Toggles visibility of the "Recommended for You" section.
    - `showStats?: boolean` (default: `true`): Toggles visibility of the user's challenge statistics cards.
    - `maxRecentChallenges?: number` (default: `6`): Number of challenges for the "Latest Challenges" section (uses `ChallengeList`).
  - **State (Internal):**
    - `userChallengeData: UserChallenge[]`: Stores the user's challenge participation data (raw `UserChallenge` records).
    - `recommendedChallenges: Challenge[]`: Stores challenges recommended for the user.
    - `recentChallenges: Challenge[]`: Stores recently active challenges.
    - `loading: boolean`: Fetching state.
    - `error: string | null`: Error messages.
    - `userStats: { totalChallenges, completedChallenges, inProgressChallenges, totalXPEarned, currentStreak, averageCompletionTime } | null`: Calculated/fetched user statistics.
  - **User Interactions:**
    - Links to "Browse All Challenges" (`/challenges`), "View All Recommended" (`/challenges?recommended=true`).
    - "Try Again" button on error to re-fetch data.
  - **Visual Design & Layout:**
    - **Welcome Section:** Title, description, "Browse All Challenges" button.
    - **Stats Overview (Optional, if `userStats` available):** Cards for Completed, In Progress, XP Earned, Day Streak.
    - **Progress Overview (if `userStats` available):** Completion Rate progress bar, Avg. Time, Success Rate, This Month's completions.
    - **Recommended Challenges (Optional):** Grid of `ChallengeCard`s.
    - **Latest Challenges:** Uses `ChallengeList` (grid view, no filters/header shown by default).
    - **Empty State:** Message encouraging challenge exploration if no challenges are associated with the user.
  - **API Interactions (Direct):**
    - `getUserChallenges(userId: string)`: Fetches user's `UserChallenge` records.
    - `getChallenges(filters)`: Fetches recent active challenges for the "Latest Challenges" section.
    - `getRecommendedChallenges(userId: string)`: Fetches personalized recommendations.
    - `getUserChallengeStats(userId: string)`: Fetches aggregated statistics for the user (total XP, streak, avg completion time, etc.).
  - **Notes & Potential Updates:**
    - **Data Hydration for Stats:** The dashboard should primarily rely on `getUserChallengeStats` for aggregated data. `userChallengeData` (list of `UserChallenge` records) might be used for displaying lists of active/completed challenges if needed within the dashboard itself, or this is delegated to separate `ChallengeList` instances.
    - **`UserChallenge` objects:** When displaying `ChallengeCard`s for recommended or recent challenges, the dashboard needs to determine `isParticipating` status by checking against `userChallengeData`.
    - **Streak Logic:** Overall user streak should come from `getUserChallengeStats`.
- **Active Challenges Display:**
  - Component to list currently active challenges (personalized and community). Could be an instance of `ChallengeList` filtered by status and user participation.
- **Challenge Calendar:**
  - Component to visually display scheduled challenges.
- **Challenge Leaderboards Display:**
  - Component to show leaderboards specific to challenges.
- **Upcoming Challenges Preview:**
  - Component to list upcoming scheduled challenges. Could be an instance of `ChallengeList` filtered appropriately.
- **Completed Challenges Archive:**
  - Component to display a user's or community's past challenges. For a user, this would be a `ChallengeList` filtered by user participation and 'completed' status.

**C. Design for Challenge Detail Page Components:**

- **Challenge Detail Page (e.g., `ChallengeDetailPage.tsx`):**
  - Overall layout for displaying a single challenge. Will likely use `ChallengeProgress.tsx` if the user is participating, or a general info display otherwise.
- **Challenge Information Display:**
  - Component to show title, description, objectives, rewards, etc.
- **Participation Controls:**
  - Join/Leave challenge buttons, submission initiation.
- **Timeline Display:**
  - Component for start/end dates, time remaining.
- **Resources List:**
  - Component to display helpful links and materials.
- **Submissions Gallery:**
  - Component to view other participants' work (if public).
- **Challenge-Specific Leaderboard:**
  - Component for leaderboard related to the specific challenge.

**D. Design for Challenge Submission Components:**

- **Submission Form (`ChallengeSubmissionForm.tsx`):**
  - Fields for title, description, reflection. This might be integrated within `ChallengeProgress.tsx` or be a standalone modal/form.
- **Evidence Uploader Integration:**
  - How the existing/planned evidence system integrates here.
- **Feedback Request Options:**
  - UI elements for requesting specific feedback.
- **Submission Preview:**
  - Component to review submission before finalizing.

**E. Design for New Challenge Discovery Components:**

- **Challenge Filters Component:**
  - UI for filtering by category, difficulty, time commitment, etc. (already part of `ChallengeList.tsx` but could be a standalone reusable component).
- **Challenge Search Component:**
  - Input field and logic for searching challenges (already part of `ChallengeList.tsx`).
- **Recommended Challenges Display:**
  - Component to show personalized challenge suggestions (as seen in `ChallengeDashboard.tsx`, could be a reusable section).

This detailed component design will serve as the blueprint for the UI implementation phase.

## Integration Points

### Profile System Integration

```typescript
// Add to user profile service

// Get user's aggregated challenge statistics
getUserChallengeStats(userId: string): Promise<{
  totalChallengesJoined: number;
  completedChallenges: number;
  inProgressChallenges: number;
  totalXPEarned: number; // Total XP earned from all challenges
  badgesEarned: string[]; // Unique badge IDs/names earned from all challenges
  currentChallengeStreak: number; // User's current challenge completion streak
  averageCompletionTimeMinutes?: number; // Average time in minutes for completed challenges
  error?: string | null;
}>

// Add challenge tab to profile page
// In ProfilePage.tsx, add a new tab for challenges, potentially using ChallengeList filtered for the profile user.
```

### Notification System Integration

```typescript
// Add to notification service

// Send challenge start notifications
sendChallengeStartNotifications(challengeId: string): Promise<{ success: boolean; error: string | null }>

// Send challenge reminder notifications
sendChallengeReminderNotifications(challengeId: string): Promise<{ success: boolean; error: string | null }>

// Send challenge completion notifications (to user upon their completion)
sendUserChallengeCompletionNotification(userId: string, challengeId: string): Promise<{ success: boolean; error: string | null }>
```

### Gamification System Integration

```typescript
// Add to XP service / Gamification Service

// Award XP for challenge completion (This logic is part of markUserChallengeCompleted)
// awardChallengeCompletionXP(userId: string, challengeId: string, xpAmount: number): Promise<{ success: boolean; error: string | null }>

// Award badge for challenge completion (This logic is part of markUserChallengeCompleted)
// awardChallengeBadge(userId: string, challengeId: string, badgeId: string): Promise<{ success: boolean; error: string | null }>

// Track challenge streak (server-side logic, updated when a challenge is completed)
updateUserChallengeStreak(userId: string, challengeCompletedDate: any): Promise<{ newStreak: number; error: string | null }>
```

### Portfolio System Integration

```typescript
// Add to portfolio service

// Generate portfolio item from completed challenge (IMPLEMENTED)
generateChallengePortfolioItem(
  challenge: Challenge,
  userChallenge: UserChallenge,
  userId: string,
  defaultVisibility: boolean
): Promise<{ success: boolean; error: string | null }>

// Get portfolio items from challenges (via existing getUserPortfolioItems with type filter)
getUserPortfolioItems(userId: string, { type: 'challenge' }): Promise<PortfolioItem[]>
```

### Evidence System Integration

```typescript
// Integrate with planned evidence embed system

// Add evidence to challenge submission
addEvidenceToSubmission(submissionId: string, evidence: EmbeddedEvidence): Promise<{ success: boolean; error: string | null }>

// Get evidence for submission
getSubmissionEvidence(submissionId: string): Promise<{ evidence: EmbeddedEvidence[]; error: string | null }>
```

## Implementation Phases

### Phase 1: Core Challenge System (2-3 weeks)

1. **Database Setup**:
   - Create challenge-related collections
   - Set up necessary indexes
   - Define security rules

2. **Basic Challenge Service**:
   - Implement core CRUD operations for `Challenge`, `UserChallenge`, `ChallengeSubmission`.
   - Implement `joinChallenge`, `submitToChallenge`, `markUserChallengeCompleted`.
   - Retrieval functions: `getChallenge`, `getChallenges`, `getUserChallenges`, `getUserChallengeProgress`.

3. **Simple UI Components**:
   - `ChallengeCard.tsx`
   - `ChallengeList.tsx` (basic version, client-side filters initially)
   - `ChallengeProgress.tsx` (for displaying progress and submitting updates/final)
   - `ChallengeCompletion.tsx` (modal)
   - Basic `ChallengeDetailPage.tsx` structure.

### Phase 2: Scheduled Challenges & User Dashboard (2-3 weeks)

1. **Scheduling System**:
   - Implement challenge scheduling functions (`scheduleChallenge`, `activateScheduledChallenges`, etc.)
   - Create automation for challenge lifecycle (Cloud Functions).
   - Build recurring challenge generation.

2. **User Dashboard & Hub**:
   - Develop `ChallengeDashboard.tsx`.
   - Implement `getUserChallengeStats` service.
   - Enhance `ChallengesPage.tsx` to act as a hub, incorporating the dashboard.
   - Implement `ChallengeCalendar` component.

3. **Advanced `ChallengeList` Features**:
    - Server-side filtering and pagination for `ChallengeList.tsx`.

### Phase 3: AI-Generated Challenges (3-4 weeks)

1. **Template System**:
   - Create challenge templates (`ChallengeTemplate` structure and service functions).
   - Implement template selection logic.
   - Build placeholder filling system.

2. **OpenRouter Integration**:
   - Set up API connection.
   - Implement efficient prompting.
   - Create response parsing and validation.
   - Implement `getRecommendedChallenges` service.

3. **User Clustering (Optional/Future Enhancement)**:
   - Develop skill-based clustering.
   - Implement challenge sharing logic.
   - Build caching system for AI-generated challenges.

### Phase 4: Integration and Polish (2-3 weeks)

1. **Notification Integration**:
   - Add challenge-related notifications.
   - Implement reminders and alerts.
   - Create notification preferences.

2. **Gamification Integration**:
   - Robust server-side streak tracking (`updateUserChallengeStreak`).
   - Ensure `markUserChallengeCompleted` correctly updates all gamification aspects.

3. **Portfolio Integration**:
   - Add challenge submissions to portfolio.
   - Create portfolio showcase components.
   - Implement skill verification (if applicable).

4. **Testing and Refinement**:
    - Comprehensive testing of all features.
    - Performance optimization.
    - UI/UX polish.

## Technical Considerations

### Performance Optimization

1. **Query Optimization**:
   - Create indexes for common queries:
     - challenges by status, category, type
     - userChallenges by userId, status
     - active scheduled challenges

2. **Caching Strategy**:
   - Cache active/popular challenges.
   - Cache challenge templates.
   - Cache user challenge stats (`getUserChallengeStats` results).

3. **Batch Processing**:
   - Process challenge status updates in batches.
   - Generate multiple challenges in single operations.
   - Update leaderboards periodically rather than in real-time.

### Security Rules

```firestore
// Firestore security rules for challenges

match /challenges/{challengeId} {
  // Anyone can read public challenges
  allow read: if resource.data.isPersonalized == false || resource.data.status == 'active' || resource.data.status == 'completed';
  
  // Users can read their personalized challenges
  allow read: if resource.data.isPersonalized == true && 
              resource.data.forUserId == request.auth.uid;
  
  // Admin/System can create/update/delete challenges
  allow write: if request.auth.token.admin == true; 
  // allow create: if request.auth.token.admin == true || 
  //               request.resource.data.createdBy == 'system' || 
  //               request.resource.data.createdBy == 'ai';
}

match /users/{userId}/userChallenges/{userChallengeId} {
  // Users can read and write their own challenge data
  allow read, write: if request.auth.uid == userId;
  
  // Admin can read all user challenge data
  allow read: if request.auth.token.admin == true;
}

match /users/{userId}/challengeSubmissions/{submissionId} {
  // Users can read and write their own submissions
  allow read, write: if request.auth.uid == userId;
  
  // Potentially allow read for challenge admins/reviewers or public submissions
  // allow read: if resource.data.isPublic == true;
  // allow read: if isChallengeParticipant(resource.data.challengeId) && resource.data.challengeId in get(/databases/$(database)/documents/challenges/$(resource.data.challengeId)).data.participants;
}
```

### Error Handling

1. **Graceful Degradation**:
   - Fallback to template challenges if AI generation fails
   - Show cached challenges if fetching fails
   - Provide default values for missing data

2. **Retry Logic**:
   - Implement exponential backoff for API calls
   - Retry failed challenge generation
   - Queue failed operations for later processing

3. **User Feedback**:
   - Clear error messages for users
   - Loading states for all operations
   - Fallback UI for error states

## Compatibility Guidelines

To ensure this feature integrates well with the existing app and doesn't break anything, follow these guidelines:

### 1. Non-Invasive Integration

- **Add, Don't Modify**: Create new components and functions rather than modifying existing ones
- **Use Subcollections**: Store challenge data in dedicated collections to avoid affecting existing data
- **Separate Concerns**: Keep challenge logic separate from other system logic

### 2. Backward Compatibility

- **Handle Missing Data**: Gracefully handle cases where challenge data doesn't exist
- **Progressive Enhancement**: Add challenge features incrementally
- **Fallback Displays**: Provide fallbacks for users without challenges

### 3. Error Handling

- **Fail Gracefully**: If challenge operations fail, they shouldn't affect other app functionality
- **Retry Mechanisms**: Implement retry logic for critical operations
- **Error Logging**: Log errors for debugging without disrupting user experience

### 4. Testing Strategy

- **Isolated Testing**: Test challenge components in isolation
- **Integration Testing**: Test integration with other systems
- **Regression Testing**: Ensure existing functionality isn't affected

### 5. Implementation Checklist

Before implementing:

- [ ] Ensure Firebase security rules are properly configured
- [ ] Verify OpenRouter API access and quotas
- [ ] Check that user profile system supports additional data
- [ ] Confirm notification system can handle new notification types

During implementation:

- [ ] Add new components without modifying existing ones
- [ ] Create new service functions that don't affect existing ones
- [ ] Test each component in isolation before integration
- [ ] Implement proper error handling

After implementation:

- [ ] Verify existing features still work correctly
- [ ] Check performance with many challenges
- [ ] Test on different devices and screen sizes
- [ ] Ensure dark/light mode compatibility
