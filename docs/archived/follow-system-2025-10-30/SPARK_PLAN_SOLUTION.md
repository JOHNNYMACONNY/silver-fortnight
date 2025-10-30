# Spark Plan Solution: Follower Count Management

## Overview

This document describes the **client-side solution** for managing follower counts on Firebase's free **Spark plan** (without Cloud Functions).

---

## Problem

The security fix in `firestore.rules` prevents users from updating other users' `socialStats.followersCount`. This means:
- ✅ User A can update their own `followingCount` when they follow User B
- ❌ User A **cannot** update User B's `followersCount` (would violate security rules)

**Result**: Follower counts can become stale without Cloud Functions.

---

## Solution Architecture

### 1. **Source of Truth**: `userFollows` Collection
- All follow relationships stored here
- **Cannot be forged** (secure Firestore rules)
- Used for accurate calculations

### 2. **Cached Counts**: `socialStats.followersCount` and `socialStats.followingCount`
- Stored for quick display
- Updated by the **user themselves** on login/profile view
- May be slightly stale, but **never forged**

### 3. **Critical Operations**: Always Calculate from `userFollows`
- Leaderboards: Use `calculateFollowerCount()`
- Reputation: Use `calculateFollowerCount()`
- Any operation where accuracy matters

---

## Implementation

### Auto-Refresh on Login (`AuthContext.tsx`)
Every time a user logs in, their follower/following counts are refreshed from the `userFollows` collection:

```typescript
// Refresh user's own social stats (follower/following counts) from userFollows collection
try {
  await refreshOwnSocialStats(user.uid);
} catch {
  /* non-blocking */
}
```

This happens in:
- Email sign-in
- Email sign-up
- Google OAuth sign-in
- Session restore (auth state change)

### Helper Function: `refreshOwnSocialStats()` (`leaderboards.ts`)
```typescript
export const refreshOwnSocialStats = async (userId: string): Promise<void> => {
  // Calculate accurate counts from userFollows collection
  const [followersCount, followingCount] = await Promise.all([
    calculateFollowerCount(userId),
    calculateFollowingCount(userId)
  ]);
  
  // Update user's own socialStats
  await updateDoc(socialStatsRef, {
    followersCount,
    followingCount,
    lastUpdated: Timestamp.now()
  });
}
```

**Security**: This only updates the user's **own** stats, allowed by Firestore rules.

### Accurate Calculations
```typescript
export const calculateFollowerCount = async (userId: string): Promise<number> => {
  const q = query(
    collection(db, 'userFollows'),
    where('followedId', '==', userId),
    where('isActive', '==', true)
  );
  const snapshot = await getDocs(q);
  return snapshot.size;
};

export const calculateFollowingCount = async (userId: string): Promise<number> => {
  const q = query(
    collection(db, 'userFollows'),
    where('followerId', '==', userId),
    where('isActive', '==', true)
  );
  const snapshot = await getDocs(q);
  return snapshot.size;
};
```

---

## Trade-offs

### ✅ Advantages
- **Secure**: Cannot forge follower counts
- **Free**: Works on Spark plan (no Cloud Functions needed)
- **Accurate for critical operations**: Leaderboards and reputation always use real data
- **Self-healing**: Counts auto-refresh on login
- **No manual maintenance**: No migration scripts or audits needed

### ⚠️ Limitations
- **Slightly stale display counts**: If User B is offline when User A follows them, User B's displayed count won't update until they log in
- **Not real-time**: Counts refresh on login, not instantly

---

## When to Upgrade to Cloud Functions

If you need **real-time follower count updates** across all users, you'll need:
1. Upgrade to **Blaze plan** (pay-as-you-go)
2. Deploy the Cloud Function in `functions/src/index.ts`
3. Cloud Function will update both users' counts in real-time

**Cost**: Very low for normal usage (Firebase offers generous free tier even on Blaze)

---

## Testing

### What to Test
1. Follow/unfollow works correctly
2. Follower's `followingCount` updates immediately
3. Followed user's `followersCount` updates on next login
4. Leaderboards show accurate counts (calculated from `userFollows`)
5. No security rule violations

### Browser Testing Steps
```bash
# Build and deploy
npm run build
firebase deploy --only hosting,firestore:rules

# Test in browser:
# 1. User A follows User B
# 2. Check User A's followingCount (should be +1 immediately)
# 3. Check User B's followersCount (may be stale)
# 4. Log out User B and log back in
# 5. Check User B's followersCount (should be updated now)
# 6. Check leaderboards (should show accurate counts)
```

---

## Files Modified

- `src/AuthContext.tsx`: Added `refreshOwnSocialStats()` calls on login
- `src/services/leaderboards.ts`: Added `refreshOwnSocialStats()` function
- `firestore.rules`: Restricted `socialStats` updates to owner/admin only (already deployed)

---

## Summary

This solution provides a **secure, free, and maintainable** approach to follower counts without Cloud Functions. While display counts may be slightly stale, they are:
- ✅ Never forged or tampered with
- ✅ Always accurate for critical operations (leaderboards, reputation)
- ✅ Self-healing (auto-refresh on login)
- ✅ Zero ongoing maintenance

For most use cases, this is **good enough**. Upgrade to Cloud Functions only if you need real-time updates across all users.
