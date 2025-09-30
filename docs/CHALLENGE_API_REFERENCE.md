# Challenge System API Reference

**Status**: Production Ready ✅  
**Date**: December 2024  
**Version**: 1.0  
**Target Audience**: Developers integrating with the challenge system

This document provides comprehensive API reference documentation for the TradeYa challenge system, including service functions, data models, error handling, and integration patterns.

## Table of Contents

1. [Core Service Functions](#core-service-functions)
2. [Data Models](#data-models)
3. [Error Handling](#error-handling)
4. [Integration Patterns](#integration-patterns)
5. [Usage Examples](#usage-examples)

## Core Service Functions

### Challenge Management

#### `createChallenge(challengeData: Partial<Challenge>): Promise<ChallengeResponse>`

Creates a new challenge with validation and default values.

**Parameters:**
- `challengeData`: Partial challenge object with required fields
  - `title` (required): Challenge title
  - `description` (required): Challenge description
  - `category` (required): Challenge category
  - `endDate` (required): Challenge end date
  - `type` (optional): Challenge type (defaults to SKILL)
  - `difficulty` (optional): Difficulty level (defaults to BEGINNER)
  - `requirements` (optional): Challenge requirements array
  - `rewards` (optional): XP and other rewards

**Returns:**
```typescript
{
  success: boolean;
  data?: Challenge;
  error?: string;
}
```

**Example:**
```typescript
const result = await createChallenge({
  title: "Build a React Component",
  description: "Create a reusable button component with TypeScript",
  category: ChallengeCategory.WEB_DEVELOPMENT,
  difficulty: ChallengeDifficulty.INTERMEDIATE,
  endDate: Timestamp.fromDate(new Date('2024-12-31')),
  rewards: { xp: 200 }
});
```

#### `getChallenges(filters: ChallengeFilters): Promise<ChallengeListResponse>`

Retrieves challenges with advanced filtering and pagination.

**Parameters:**
- `filters`: Challenge filtering options
  - `status` (optional): Array of challenge statuses
  - `category` (optional): Array of categories
  - `difficulty` (optional): Array of difficulty levels
  - `type` (optional): Array of challenge types
  - `search` (optional): Search query string
  - `sortBy` (optional): Sort field
  - `sortOrder` (optional): Sort direction
  - `limit` (optional): Maximum results (default: 20)
  - `startAfter` (optional): Pagination cursor

**Returns:**
```typescript
{
  success: boolean;
  data?: {
    challenges: Challenge[];
    hasMore: boolean;
    lastDoc?: QueryDocumentSnapshot;
  };
  error?: string;
}
```

#### `getChallenge(challengeId: string): Promise<ChallengeResponse>`

Retrieves a single challenge by ID.

**Parameters:**
- `challengeId`: Unique challenge identifier

**Returns:**
```typescript
{
  success: boolean;
  data?: Challenge;
  error?: string;
}
```

### User Challenge Participation

#### `joinChallenge(challengeId: string, userId: string): Promise<ServiceResponse<UserChallenge>>`

Allows a user to join a challenge.

**Parameters:**
- `challengeId`: Challenge to join
- `userId`: User joining the challenge

**Returns:**
```typescript
{
  success: boolean;
  data?: UserChallenge;
  error?: string;
}
```

**Side Effects:**
- Creates UserChallenge record
- Emits analytics event: `challenge_joined`
- Triggers real-time notification

#### `submitToChallenge(userId: string, challengeId: string, submission: Partial<ChallengeSubmission>): Promise<ServiceResponse<ChallengeSubmission>>`

Submits progress or final submission for a challenge.

**Parameters:**
- `userId`: User making submission
- `challengeId`: Target challenge
- `submission`: Submission data
  - `content` (required): Submission content
  - `evidence` (optional): Supporting evidence
  - `isComplete` (optional): Whether this completes the challenge

**Returns:**
```typescript
{
  success: boolean;
  data?: ChallengeSubmission;
  error?: string;
}
```

**Side Effects:**
- Updates UserChallenge progress
- Awards XP if challenge completed
- Updates leaderboards
- Triggers notifications

### Discovery and Recommendations

#### `discoverChallenges(userId: string, filters?: Partial<ChallengeFilters>): Promise<ChallengeListResponse>`

AI-powered challenge discovery with personalized recommendations.

**Parameters:**
- `userId`: User requesting recommendations
- `filters` (optional): Additional filtering criteria

**Returns:**
```typescript
{
  success: boolean;
  data?: {
    challenges: Challenge[];
    recommendations: Challenge[];
    hasMore: boolean;
  };
  error?: string;
}
```

**Features:**
- Skill-based matching
- Difficulty progression
- Completion history analysis
- Collaborative filtering

### Progress Tracking

#### `getUserChallenges(userId: string, status?: UserChallengeStatus): Promise<ServiceResponse<UserChallenge[]>>`

Retrieves user's challenge participation records.

**Parameters:**
- `userId`: Target user
- `status` (optional): Filter by participation status

**Returns:**
```typescript
{
  success: boolean;
  data?: UserChallenge[];
  error?: string;
}
```

#### `getChallengeProgress(userId: string, challengeId: string): Promise<ChallengeProgressResponse>`

Gets detailed progress for a specific user-challenge combination.

**Parameters:**
- `userId`: Target user
- `challengeId`: Target challenge

**Returns:**
```typescript
{
  success: boolean;
  data?: {
    userChallenge: UserChallenge;
    submissions: ChallengeSubmission[];
    progressPercentage: number;
    nextMilestone: string;
  };
  error?: string;
}
```

## Data Models

### Challenge

```typescript
interface Challenge {
  id: string;
  title: string;
  description: string;
  type: ChallengeType;
  category: ChallengeCategory;
  difficulty: ChallengeDifficulty;
  status: ChallengeStatus;
  requirements: string[];
  rewards: {
    xp: number;
    badges?: string[];
    unlocks?: string[];
  };
  startDate: Timestamp;
  endDate: Timestamp;
  maxParticipants?: number;
  timeEstimate?: string;
  tags?: string[];
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### UserChallenge

```typescript
interface UserChallenge {
  id: string;
  userId: string;
  challengeId: string;
  status: UserChallengeStatus;
  joinedAt: Timestamp;
  completedAt?: Timestamp;
  progress: number; // 0-100
  submissions: string[]; // ChallengeSubmission IDs
  lastActivity: Timestamp;
}
```

### ChallengeSubmission

```typescript
interface ChallengeSubmission {
  id: string;
  userId: string;
  challengeId: string;
  content: string;
  evidence?: EmbeddedEvidence[];
  isComplete: boolean;
  submittedAt: Timestamp;
  reviewStatus?: 'pending' | 'approved' | 'rejected';
  feedback?: string;
}
```

## Error Handling

### Common Error Types

- **Validation Errors**: Invalid input data
- **Permission Errors**: Unauthorized access
- **Not Found Errors**: Resource doesn't exist
- **Conflict Errors**: Business rule violations
- **System Errors**: Database or network issues

### Error Response Format

```typescript
{
  success: false;
  error: string; // Human-readable error message
  code?: string; // Machine-readable error code
  details?: any; // Additional error context
}
```

### Best Practices

1. **Always check success flag** before accessing data
2. **Handle errors gracefully** with user-friendly messages
3. **Log errors** for debugging and monitoring
4. **Implement retry logic** for transient failures

## Integration Patterns

### Real-time Updates

```typescript
// Subscribe to challenge notifications
setChallengeNotificationCallback((notification) => {
  switch (notification.type) {
    case 'challenge_joined':
      // Handle user joining challenge
      break;
    case 'challenge_completed':
      // Handle challenge completion
      break;
    case 'progress_updated':
      // Handle progress updates
      break;
  }
});
```

### Analytics Integration

```typescript
// Track challenge interactions
const { trackEvent } = useBusinessMetrics();

// Track challenge view
trackEvent('challenge_view', {
  challengeId,
  category: challenge.category,
  difficulty: challenge.difficulty
});

// Track challenge join
trackEvent('challenge_joined', {
  challengeId,
  userId,
  source: 'discovery_page'
});
```

### XP Integration

```typescript
// Challenge completion automatically awards XP
// No manual XP calls needed - handled by submitToChallenge
const result = await submitToChallenge(userId, challengeId, {
  content: "My solution...",
  isComplete: true
});

// XP is automatically awarded based on:
// - Base challenge XP (difficulty-based)
// - Completion bonuses
// - Streak multipliers
```

## Usage Examples

### Basic Challenge Flow

```typescript
// 1. Discover challenges
const discovery = await discoverChallenges(userId);
const challenges = discovery.data?.challenges || [];

// 2. Join a challenge
const joinResult = await joinChallenge(challengeId, userId);
if (!joinResult.success) {
  console.error('Failed to join:', joinResult.error);
  return;
}

// 3. Submit progress
const submission = await submitToChallenge(userId, challengeId, {
  content: "Work in progress...",
  isComplete: false
});

// 4. Complete challenge
const completion = await submitToChallenge(userId, challengeId, {
  content: "Final submission",
  evidence: [{ type: 'link', url: 'https://...' }],
  isComplete: true
});
```

### Admin Challenge Management

```typescript
// Create new challenge
const challenge = await createChallenge({
  title: "Advanced React Patterns",
  description: "Implement advanced React patterns...",
  category: ChallengeCategory.WEB_DEVELOPMENT,
  difficulty: ChallengeDifficulty.ADVANCED,
  endDate: Timestamp.fromDate(new Date('2024-12-31')),
  rewards: { xp: 500 }
});

// Monitor challenge participation
const participants = await getUserChallenges(challengeId);
```

---

*This API reference is updated with each release. Last updated: December 2024*
