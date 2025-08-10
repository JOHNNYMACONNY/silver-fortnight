# TradeYa Gamification API Integration Guide

**Status**: Phase 1 IMPLEMENTED ✅  
**Date**: June 2, 2025  
**Target Audience**: Developers integrating with the gamification system

This guide provides comprehensive documentation for integrating with the TradeYa gamification system, including API usage, integration patterns, error handling, and best practices.

## Quick Start

### Basic XP Award Integration

```typescript
import { awardXP, XPSource } from '../services/gamification';

// Award XP for any user action
try {
  await awardXP(
    userId,           // Firebase Auth UID
    100,              // XP amount
    XPSource.TRADE_COMPLETION,  // XP source
    tradeId,          // Related entity ID (optional)
    'Trade completion' // Human-readable description
  );
} catch (error) {
  console.error('Gamification error (non-critical):', error);
  // Continue with main operation
}
```

### Achievement Check Integration

```typescript
import { checkAchievements } from '../services/achievements';

// Check for achievement unlocks after user action
try {
  await checkAchievements(userId);
} catch (error) {
  console.error('Achievement check failed (non-critical):', error);
}
```

## Core API Functions

### Gamification Service (`src/services/gamification.ts`)

#### `awardXP(userId, amount, source, sourceId?, description?)`

Awards XP to a user and updates their level progression.

**Parameters**:

- `userId: string` - Firebase Auth UID
- `amount: number` - XP amount to award (positive integer)
- `source: XPSource` - Source of the XP award (enum)
- `sourceId?: string` - ID of related entity (trade, role, etc.)
- `description?: string` - Human-readable description

**Returns**: `Promise<void>`

**Example**:

```typescript
await awardXP(
  'user123',
  150,
  XPSource.ROLE_COMPLETION,
  'role456',
  'Complex role completion'
);
```

#### `getUserXP(userId)`

Retrieves user's current XP and level data.

**Parameters**:

- `userId: string` - Firebase Auth UID

**Returns**: `Promise<UserXP | null>`

**Example**:

```typescript
const userXP = await getUserXP('user123');
if (userXP) {
  console.log(`Level ${userXP.currentLevel}, ${userXP.totalXP} XP`);
}
```

#### `getXPHistory(userId, limit?)`

Gets user's XP transaction history.

**Parameters**:

- `userId: string` - Firebase Auth UID
- `limit?: number` - Maximum number of transactions (default: 50)

**Returns**: `Promise<XPTransaction[]>`

**Example**:

```typescript
const history = await getXPHistory('user123', 10);
history.forEach(tx => {
  console.log(`${tx.amount} XP from ${tx.source}: ${tx.description}`);
});
```

#### `calculateLevel(totalXP)`

Calculates level from total XP amount.

**Parameters**:

- `totalXP: number` - Total XP amount

**Returns**: `LevelInfo`

**Example**:

```typescript
const levelInfo = calculateLevel(750);
console.log(`Level ${levelInfo.level}: ${levelInfo.title}`);
```

### Achievement Service (`src/services/achievements.ts`)

#### `checkAchievements(userId)`

Checks and unlocks eligible achievements for a user.

**Parameters**:

- `userId: string` - Firebase Auth UID

**Returns**: `Promise<string[]>` - Array of newly unlocked achievement IDs

**Example**:

```typescript
const newAchievements = await checkAchievements('user123');
if (newAchievements.length > 0) {
  console.log(`Unlocked ${newAchievements.length} achievements!`);
}
```

#### `getUserAchievements(userId)`

Gets all achievements unlocked by a user.

**Parameters**:

- `userId: string` - Firebase Auth UID

**Returns**: `Promise<UserAchievement[]>`

**Example**:

```typescript
const achievements = await getUserAchievements('user123');
console.log(`User has ${achievements.length} achievements`);
```

#### `getAchievementProgress(userId, achievementId)`

Gets user's progress toward a specific achievement.

**Parameters**:

- `userId: string` - Firebase Auth UID
- `achievementId: string` - Achievement identifier

**Returns**: `Promise<number>` - Progress value (0-100)

## XP Sources and Values

### Available XP Sources

```typescript
enum XPSource {
  TRADE_COMPLETION = 'trade_completion',           // 100 XP
  ROLE_COMPLETION = 'role_completion',             // 75-150 XP
  COLLABORATION_COMPLETION = 'collaboration_completion', // Variable
  PROFILE_COMPLETION = 'profile_completion',       // 50 XP
  EVIDENCE_SUBMISSION = 'evidence_submission',     // 25 XP
  QUICK_RESPONSE = 'quick_response',               // 50 XP bonus
  FIRST_TIME_BONUS = 'first_time_bonus',          // 100-150 XP
  STREAK_BONUS = 'streak_bonus',                   // Variable
  ACHIEVEMENT_UNLOCK = 'achievement_unlock'        // 25+ XP
}
```

### Recommended XP Values

| Action | Base XP | Bonuses | Total Range |
|--------|---------|---------|-------------|
| Trade Completion | 100 | +50 quick, +100 first | 100-250 |
| Role Completion | 75-150 | +150 first collab | 75-300 |
| Evidence Submission | 25 | None | 25 |
| Profile Completion | 50 | None | 50 |
| Achievement Unlock | 25-250 | Based on rarity | 25-250 |

## Integration Patterns

### 1. Trade Completion Integration

**Location**: `src/services/firestore.ts`

```typescript
export async function confirmTradeCompletion(tradeId: string, userId: string) {
  try {
    // Main trade completion logic
    await updateDoc(doc(db, 'trades', tradeId), {
      status: 'completed',
      completedAt: serverTimestamp()
    });

    // Gamification integration (non-breaking)
    try {
      // Award base XP
      await awardXP(userId, 100, XPSource.TRADE_COMPLETION, tradeId, 'Trade completion');
      
      // Check for bonuses
      const isQuickResponse = await checkQuickResponse(tradeId, userId);
      if (isQuickResponse) {
        await awardXP(userId, 50, XPSource.QUICK_RESPONSE, tradeId, 'Quick response bonus');
      }
      
      const isFirstTrade = await checkFirstTrade(userId);
      if (isFirstTrade) {
        await awardXP(userId, 100, XPSource.FIRST_TIME_BONUS, tradeId, 'First trade bonus');
      }
      
      // Check achievements
      await checkAchievements(userId);
    } catch (gamificationError) {
      console.error('Gamification error (non-critical):', gamificationError);
      // Trade completion continues normally
    }
  } catch (error) {
    console.error('Trade completion failed:', error);
    throw error;
  }
}
```

### 2. Role Completion Integration

**Location**: `src/services/roleCompletions.ts`

```typescript
export async function confirmRoleCompletion(roleId: string, userId: string) {
  try {
    // Main role completion logic
    await updateDoc(doc(db, 'collaborationRoles', roleId), {
      status: 'completed',
      completedAt: serverTimestamp()
    });

    // Gamification integration (non-breaking)
    try {
      // Determine XP based on role complexity
      const role = await getDoc(doc(db, 'collaborationRoles', roleId));
      const isComplexRole = determineRoleComplexity(role.data());
      const xpAmount = isComplexRole ? 150 : 75;
      
      await awardXP(
        userId, 
        xpAmount, 
        XPSource.ROLE_COMPLETION, 
        roleId, 
        `Role completion (${isComplexRole ? 'complex' : 'basic'} role)`
      );
      
      // Check for first collaboration bonus
      const isFirstCollaboration = await checkFirstCollaboration(userId);
      if (isFirstCollaboration) {
        await awardXP(userId, 150, XPSource.FIRST_TIME_BONUS, roleId, 'First collaboration bonus');
      }
      
      // Check achievements
      await checkAchievements(userId);
    } catch (gamificationError) {
      console.error('Gamification error (non-critical):', gamificationError);
    }
  } catch (error) {
    console.error('Role completion failed:', error);
    throw error;
  }
}
```

### 3. Evidence Submission Integration

```typescript
export async function submitEvidence(evidenceData: EvidenceData) {
  try {
    // Main evidence submission logic
    const evidenceRef = await addDoc(collection(db, 'evidence'), evidenceData);

    // Gamification integration
    try {
      await awardXP(
        evidenceData.userId,
        25,
        XPSource.EVIDENCE_SUBMISSION,
        evidenceRef.id,
        'Evidence submission'
      );
      await checkAchievements(evidenceData.userId);
    } catch (gamificationError) {
      console.error('Gamification error (non-critical):', gamificationError);
    }

    return evidenceRef.id;
  } catch (error) {
    console.error('Evidence submission failed:', error);
    throw error;
  }
}
```

## Error Handling Best Practices

### 1. Non-Breaking Integration

Always wrap gamification calls in try-catch blocks to prevent failures from affecting core functionality:

```typescript
try {
  // Core business logic
  await performMainOperation();
  
  // Gamification (non-breaking)
  try {
    await awardXP(userId, amount, source);
    await checkAchievements(userId);
  } catch (gamificationError) {
    console.error('Gamification error (non-critical):', gamificationError);
    // Main operation continues successfully
  }
} catch (error) {
  console.error('Main operation failed:', error);
  throw error;
}
```

### 2. Input Validation

Validate inputs before calling gamification functions:

```typescript
function validateXPAward(userId: string, amount: number, source: XPSource) {
  if (!userId || typeof userId !== 'string') {
    throw new Error('Invalid userId');
  }
  if (!amount || amount <= 0 || !Number.isInteger(amount)) {
    throw new Error('Invalid XP amount');
  }
  if (!Object.values(XPSource).includes(source)) {
    throw new Error('Invalid XP source');
  }
}
```

### 3. Retry Logic

Implement retry logic for transient failures:

```typescript
async function awardXPWithRetry(userId: string, amount: number, source: XPSource, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await awardXP(userId, amount, source);
      return; // Success
    } catch (error) {
      if (attempt === maxRetries) {
        console.error(`XP award failed after ${maxRetries} attempts:`, error);
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
    }
  }
}
```

## UI Component Integration

### Using Gamification Components

```typescript
import { 
  XPDisplay, 
  LevelBadge, 
  AchievementBadge, 
  GamificationDashboard 
} from '../components/gamification';

// In your component
function UserProfile({ userId }: { userId: string }) {
  return (
    <div>
      <div className="flex items-center gap-4">
        <LevelBadge userId={userId} size="large" />
        <XPDisplay userId={userId} mode="compact" />
      </div>
      
      <GamificationDashboard userId={userId} />
    </div>
  );
}
```

### Component Props

#### XPDisplay Props

```typescript
interface XPDisplayProps {
  userId: string;
  mode?: 'compact' | 'full';
  showHistory?: boolean;
  className?: string;
}
```

#### LevelBadge Props

```typescript
interface LevelBadgeProps {
  userId: string;
  size?: 'small' | 'medium' | 'large';
  showTooltip?: boolean;
  className?: string;
}
```

#### AchievementBadge Props

```typescript
interface AchievementBadgeProps {
  achievement: Achievement;
  isUnlocked: boolean;
  size?: 'small' | 'medium' | 'large';
  showDetails?: boolean;
  className?: string;
}
```

## Performance Considerations

### 1. Batch Operations

When awarding XP for multiple actions, consider batching:

```typescript
async function awardMultipleXP(awards: XPAward[]) {
  const batch = writeBatch(db);
  
  for (const award of awards) {
    // Add to batch instead of individual writes
    const xpRef = doc(collection(db, 'xpTransactions'));
    batch.set(xpRef, {
      userId: award.userId,
      amount: award.amount,
      source: award.source,
      createdAt: serverTimestamp()
    });
  }
  
  await batch.commit();
}
```

### 2. Caching Strategy

Cache frequently accessed data:

```typescript
// Cache user XP data for session duration
const userXPCache = new Map<string, UserXP>();

async function getCachedUserXP(userId: string): Promise<UserXP | null> {
  if (userXPCache.has(userId)) {
    return userXPCache.get(userId)!;
  }
  
  const userXP = await getUserXP(userId);
  if (userXP) {
    userXPCache.set(userId, userXP);
  }
  
  return userXP;
}
```

### 3. Lazy Loading

Load gamification data only when needed:

```typescript
function ProfilePage({ userId }: { userId: string }) {
  const [showGamification, setShowGamification] = useState(false);
  
  return (
    <div>
      <button onClick={() => setShowGamification(true)}>
        Show Progress
      </button>
      
      {showGamification && (
        <GamificationDashboard userId={userId} />
      )}
    </div>
  );
}
```

## Testing Integration

### Unit Tests

```typescript
import { awardXP, XPSource } from '../services/gamification';

describe('Gamification Integration', () => {
  test('should award XP for trade completion', async () => {
    const userId = 'test-user';
    const tradeId = 'test-trade';
    
    await awardXP(userId, 100, XPSource.TRADE_COMPLETION, tradeId);
    
    const userXP = await getUserXP(userId);
    expect(userXP?.totalXP).toBe(100);
  });
  
  test('should handle gamification errors gracefully', async () => {
    // Mock gamification failure
    jest.spyOn(console, 'error').mockImplementation();
    
    // Main operation should still succeed
    const result = await performTradeWithGamification('invalid-user');
    expect(result).toBeDefined();
    expect(console.error).toHaveBeenCalled();
  });
});
```

### Integration Tests

```typescript
describe('Trade Completion with Gamification', () => {
  test('should complete trade and award XP', async () => {
    const trade = await createTestTrade();
    const userId = trade.creatorId;
    
    await confirmTradeCompletion(trade.id, userId);
    
    // Verify trade completion
    const updatedTrade = await getTrade(trade.id);
    expect(updatedTrade.status).toBe('completed');
    
    // Verify XP award
    const userXP = await getUserXP(userId);
    expect(userXP?.totalXP).toBeGreaterThan(0);
  });
});
```

## Monitoring and Analytics

### Logging XP Awards

```typescript
function logXPAward(userId: string, amount: number, source: XPSource, sourceId?: string) {
  console.log(`XP Award: ${amount} XP to ${userId} from ${source}`, {
    userId,
    amount,
    source,
    sourceId,
    timestamp: new Date().toISOString()
  });
}
```

### Performance Monitoring

```typescript
async function awardXPWithMetrics(userId: string, amount: number, source: XPSource) {
  const startTime = performance.now();
  
  try {
    await awardXP(userId, amount, source);
    const duration = performance.now() - startTime;
    
    // Log performance metrics
    console.log(`XP award completed in ${duration}ms`);
  } catch (error) {
    const duration = performance.now() - startTime;
    console.error(`XP award failed after ${duration}ms:`, error);
    throw error;
  }
}
```

## Migration Guide

### Adding Gamification to Existing Features

1. **Identify Integration Points**: Find where user actions complete
2. **Add XP Awards**: Insert `awardXP()` calls after successful operations
3. **Add Achievement Checks**: Call `checkAchievements()` after XP awards
4. **Wrap in Error Handling**: Use try-catch to prevent breaking changes
5. **Test Thoroughly**: Verify both success and failure scenarios

### Example Migration

```typescript
// Before: Simple trade completion
async function confirmTrade(tradeId: string) {
  await updateDoc(doc(db, 'trades', tradeId), {
    status: 'completed'
  });
}

// After: Trade completion with gamification
async function confirmTrade(tradeId: string, userId: string) {
  await updateDoc(doc(db, 'trades', tradeId), {
    status: 'completed'
  });
  
  // Add gamification (non-breaking)
  try {
    await awardXP(userId, 100, XPSource.TRADE_COMPLETION, tradeId);
    await checkAchievements(userId);
  } catch (error) {
    console.error('Gamification error:', error);
  }
}
```

## Troubleshooting

### Common Issues

1. **XP Not Awarded**: Check user ID validity and network connectivity
2. **Achievements Not Unlocking**: Verify achievement conditions and user stats
3. **UI Not Updating**: Ensure components are re-rendering after data changes
4. **Performance Issues**: Check for excessive API calls and implement caching

### Debug Tools

```typescript
// Enable debug logging
localStorage.setItem('gamification-debug', 'true');

// Check user's current state
async function debugUserGamification(userId: string) {
  const userXP = await getUserXP(userId);
  const achievements = await getUserAchievements(userId);
  const history = await getXPHistory(userId, 10);
  
  console.log('User Gamification Debug:', {
    userXP,
    achievements,
    recentHistory: history
  });
}
```

This integration guide provides everything needed to successfully integrate with the TradeYa gamification system while maintaining system stability and performance.
