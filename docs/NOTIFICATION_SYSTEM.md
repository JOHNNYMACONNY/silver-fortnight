# Notification System Architecture

**Last Updated:** October 22, 2025  
**Critical Fix Applied:** October 22, 2025 - Display Bug Fixed

## ⚠️ RECENT CRITICAL FIX (Oct 22, 2025)

**Issue:** Notifications displayed only timestamp, no content  
**Root Cause:** UI components were displaying `message` field instead of `content` field  
**Fix:** Updated NotificationsPage and NotificationDropdown to display `title` and `content || message`  
**Files Fixed:** NotificationsPage.tsx, NotificationDropdown.tsx  
**Status:** ✅ FIXED

See [`/NOTIFICATION_DISPLAY_BUG_FIX.md`](/NOTIFICATION_DISPLAY_BUG_FIX.md) for full details.

---

## Overview
Unified notification service handling all 20+ notification types with deduplication and parameter normalization.

## Available Notification Types

### Trade Notifications
- `trade` - General trade notification
- `trade_interest` - User interested in trade
- `trade_completed` - Trade completed
- `trade_reminder` - Reminder to confirm trade (sent by Cloud Functions)

### Collaboration Notifications
- `collaboration` - General collaboration notification
- `role_application` - User applied to role
- `application_accepted` - Application accepted
- `application_rejected` - Application rejected
- `role_completion_requested` - Role completion requested
- `role_completion_confirmed` - Role completion confirmed
- `role_completion_rejected` - Role completion rejected

### Challenge Notifications
- `challenge` - General challenge notification
- `challenge_completed` - Challenge completed
- `tier_unlocked` - New tier unlocked

### Gamification Notifications
- `streak_milestone` - Streak milestone reached
- `new_follower` - New follower gained
- `level_up` - User leveled up
- `achievement_unlocked` - Achievement unlocked

### Other Notifications
- `message` - Direct message
- `review` - Review notification
- `system` - System notification

## Creating Notifications

### Basic Usage
```typescript
import { createNotification, NotificationType } from './services/notifications/unifiedNotificationService';

await createNotification({
  recipientId: userId, // or use userId (both supported)
  type: NotificationType.TRADE_COMPLETED,
  title: 'Trade Completed',
  message: 'Your trade has been completed!', // or use content (both supported)
  relatedId: tradeId,
  data: { tradeId },
  priority: 'high' // optional: low, medium (default), high
});
```

### Parameter Formats
The unified service supports BOTH parameter formats for backward compatibility:

**Format 1 (CreateNotificationParams):**
- `recipientId` → normalized to `userId`
- `message` → normalized to `content`

**Format 2 (NotificationData):**
- `userId` → used directly
- `content` → used directly

Both formats work seamlessly. Use whichever format matches your context.

### Preventing Duplicates
Use `deduplicationKey` to prevent duplicate notifications within 5 minutes:

```typescript
await createNotification({
  recipientId: userId,
  type: NotificationType.TRADE_REMINDER,
  title: 'Trade Reminder',
  message: 'Please confirm trade',
  deduplicationKey: `trade-reminder-${tradeId}-${userId}`, // Prevent duplicates within 5 minutes
  priority: 'high'
});
```

### Helper Functions
Use helper functions for common patterns:

```typescript
import { createTradeNotification } from './services/notifications/unifiedNotificationService';

// Automatically sets correct type, title, content based on trade event
await createTradeNotification({
  recipientId: userId,
  tradeId: 'abc123',
  tradeTitle: 'My Trade',
  type: 'request' // or 'confirm', 'complete', 'reminder'
});
```

Helper function types:
- `'request'` → Trade completion requested
- `'confirm'` → Trade confirmed as completed
- `'complete'` → Trade auto-completed
- `'reminder'` → Trade completion reminder

## Cloud Functions
Cloud Functions CANNOT import TypeScript enums from src/ directory.
Use string constants instead:

```typescript
// functions/src/index.ts
const NOTIFICATION_TYPE_TRADE_REMINDER = 'trade_reminder';

await createNotification({
  userId: recipientId,
  type: NOTIFICATION_TYPE_TRADE_REMINDER,
  title: 'Trade Reminder',
  content: 'Please confirm completion',
  relatedId: tradeId,
  priority: 'high'
});
```

**Important:** String constants in Cloud Functions MUST match the NotificationType enum values in `src/services/notifications/unifiedNotificationService.ts`.

## Priority Levels

Set appropriate priority levels for different notification types:

- **high** - Urgent actions required (reminders, completion requests, acceptances)
- **medium** (default) - Normal notifications (completions, confirmations)
- **low** - Informational only (rejections, follows, reopened roles)

Examples:
```typescript
// High priority - requires immediate action
NotificationType.TRADE_REMINDER → priority: 'high'
NotificationType.APPLICATION_ACCEPTED → priority: 'high'
NotificationType.ROLE_COMPLETION_REQUESTED → priority: 'high'
NotificationType.LEVEL_UP → priority: 'high'
NotificationType.ACHIEVEMENT_UNLOCKED → priority: 'high'
NotificationType.TIER_UNLOCKED → priority: 'high'

// Medium priority - informational with potential action
NotificationType.TRADE_COMPLETED → priority: 'medium'
NotificationType.CHALLENGE_COMPLETED → priority: 'medium'
NotificationType.ROLE_COMPLETION_CONFIRMED → priority: 'medium'
NotificationType.ROLE_APPLICATION → priority: 'medium'
NotificationType.STREAK_MILESTONE → priority: 'medium'

// Low priority - informational only
NotificationType.APPLICATION_REJECTED → priority: 'low'
NotificationType.NEW_FOLLOWER → priority: 'low'
NotificationType.SYSTEM → priority: 'low'
```

## Architecture

### Notification Flow

1. **Service Layer** calls `createNotification()` with notification data
2. **Unified Service** normalizes parameters (recipientId→userId, message→content)
3. **Deduplication Check** (if deduplicationKey provided) queries for recent duplicates
4. **Firestore Write** creates notification document
5. **Real-time Listener** updates UI (NotificationsContext)
6. **UI Display** shows notification in NotificationDropdown and NotificationsPage

### Deduplication Strategy

Deduplication prevents the same notification from being sent multiple times within a 5-minute window.

**How it works:**
1. Provide a unique `deduplicationKey` when creating notification
2. Service queries for notifications with same userId + deduplicationKey created within last 5 minutes
3. If duplicate found, notification creation is skipped (returns null data)
4. If no duplicate, notification is created normally

**When to use:**
- Trade reminders (prevent multiple reminder notifications)
- Challenge completions (prevent rapid re-completion notifications)
- Any event that might trigger multiple times quickly

## Notification Type Categorization

For UI filtering, notifications are categorized:

| Filter Category | Notification Types Included |
|----------------|----------------------------|
| Trades | trade, trade_interest, trade_completed, trade_reminder |
| Collaborations | collaboration, role_application, application_accepted, application_rejected, role_completion_requested, role_completion_confirmed, role_completion_rejected |
| Challenges | challenge, challenge_completed, tier_unlocked |
| Messages | message |
| System | system, review, new_follower, level_up, achievement_unlocked, streak_milestone |

## Best Practices

1. ✅ **Always use NotificationType enum** in client code (not string literals)
2. ✅ **Use helper functions** when available (e.g., createTradeNotification)
3. ✅ **Set appropriate priority** (high for urgent, medium for normal, low for informational)
4. ✅ **Use deduplicationKey** for notifications that might trigger multiple times
5. ✅ **Include relatedId** for navigation (tradeId, challengeId, collaborationId, etc.)
6. ✅ **Use descriptive titles and messages** that clearly explain what happened
7. ✅ **Include relevant data** in the data field for UI context
8. ✅ **Use Cloud Function string constants** (not enums) in functions/src/

## Common Pitfalls

❌ **Don't** use string literals for types in client code - use NotificationType enum
❌ **Don't** import TypeScript enums in Cloud Functions - use string constants
❌ **Don't** forget to set relatedId for notifications that link to specific entities
❌ **Don't** skip priority - always set it appropriately
❌ **Don't** create duplicate notification systems - use unified service only
❌ **Don't** mix recipientId/userId or message/content arbitrarily - be consistent in each file

## Migration Guide

If you're updating old code to use the unified service:

### Step 1: Update Import
```typescript
// Old
import { createNotification } from './firestore';

// New
import { createNotification, NotificationType } from './notifications/unifiedNotificationService';
```

### Step 2: Update Type to Enum
```typescript
// Old
type: 'trade_completed'

// New  
type: NotificationType.TRADE_COMPLETED
```

### Step 3: Add Priority
```typescript
// Add priority field
priority: 'medium'
```

### Step 4: Test
Verify notification appears correctly in notification center and has proper icon/color.

## Glassmorphic UI Styling

Notifications use consistent glassmorphic design:

- **NotificationItem**: Glassmorphic cards with backdrop blur
- **NotificationsPage**: Glassmorphic header, filters, and list container
- **NotificationDropdown**: Already glassmorphic (no changes needed)

**Color Scheme (Preserved):**
- Trade interest: green icons (bg-green-100, text-green-600)
- Trade completed: purple icons (bg-purple-100, text-purple-600)
- Messages: blue icons (bg-blue-100, text-blue-600)
- Collaborations: indigo icons (bg-indigo-100, text-indigo-600)
- Reviews: yellow icons (bg-yellow-100, text-yellow-600)
- System: gray icons (bg-gray-100, text-gray-600)

## Files Modified

**New Files:**
- `src/services/notifications/unifiedNotificationService.ts`
- `src/services/notifications/__tests__/notificationDeduplication.test.ts`
- `docs/NOTIFICATION_SYSTEM.md` (this file)

**Modified Files:**
- `src/services/firestore.ts` - Updated interface, proxy to unified service
- `src/types/services.ts` - Added priority and deduplicationKey fields
- `src/services/autoResolution.ts` - Removed duplicate reminder system
- `functions/src/index.ts` - Use string constants for types
- `src/services/challengeCompletion.ts` - Use proper enum types
- `src/services/streaks.ts` - Migrated to unified service
- `src/services/roleCompletions.ts` - Migrated to unified service
- `src/services/roleApplications.ts` - Migrated to unified service
- `src/services/roleAbandonment.ts` - Migrated to unified service
- `src/services/leaderboards.ts` - Migrated to unified service
- `src/services/gamification.ts` - Migrated to unified service
- `src/services/achievements.ts` - Migrated to unified service
- `src/components/features/notifications/NotificationItem.tsx` - Glassmorphic styling
- `src/pages/NotificationsPage.tsx` - Glassmorphic styling

## Testing

Run tests:
```bash
npm test -- notificationDeduplication.test.ts
```

Manual testing checklist in implementation plan.

## Support

For questions or issues with the notification system, refer to:
- This documentation
- `NOTIFICATION_SYSTEM_CONSOLIDATION_PLAN_CORRECTED.md`
- `NOTIFICATIONS_CATEGORIZATION_INVESTIGATION.md`

