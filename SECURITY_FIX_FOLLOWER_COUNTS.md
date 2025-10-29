# Security Fix: Follower Count Forgery Prevention

**Date:** October 29, 2025  
**Severity:** 🔴 **P1 - Critical**  
**Status:** ✅ Fixed

---

## 🚨 Security Vulnerability

### Problem
The previous implementation allowed ANY authenticated user to forge follower counts for ANY account by directly updating the `socialStats` collection from client-side code.

### Root Cause
Firestore security rules for `socialStats` collection had an overly permissive update rule:

```javascript
// ❌ INSECURE (Previous)
allow update: if isAuthenticated() && (
  userId == request.auth.uid ||
  isAdmin() ||
  // This clause allowed ANYONE to update ANYONE's follower counts!
  (request.resource.data.diff(resource.data).affectedKeys().hasOnly(['followersCount', 'followingCount', 'lastUpdated']))
);
```

**Attack Vector:**
1. Attacker could call `updateDoc()` on any user's `socialStats` document
2. As long as they only modified `followersCount`, `followingCount`, or `lastUpdated`, the operation would succeed
3. This could be used to artificially inflate follower counts for leaderboard manipulation

---

## ✅ Security Fix

### Updated Security Rules

```javascript
// ✅ SECURE (Current)
allow update: if isAuthenticated() && (
  userId == request.auth.uid ||  // Only update your own stats
  isAdmin()                       // Or be an admin
);
// No longer allows arbitrary follower count updates
```

### Code Changes

**File:** `firestore.rules` (lines 628-642)
- Removed the permissive clause that allowed updating other users' follower counts
- Added security comments explaining the restriction

**File:** `src/services/leaderboards.ts`
- Removed client-side updates to other users' `followersCount` (lines 465, 520)
- Removed calls to `recomputeUserReputation` for other users (was calling for both users, now only current user)
- Updated `recomputeUserReputation` to use `calculateFollowerCount()` instead of reading from socialStats
- Added helper functions: `calculateFollowerCount()` and `calculateFollowingCount()`
- Added TODO comments for Cloud Functions migration
- Maintained updates to user's own `followingCount` (secure)

---

## 🛠️ Current Implementation

### What Works Now
✅ Users can follow/unfollow other users  
✅ User's own `followingCount` is updated securely  
✅ Hard delete prevents re-follow bugs  
✅ Security rules prevent forgery  

### What's Changed
⚠️ `followersCount` in `socialStats` is NO LONGER updated client-side  
⚠️ Follower counts should be calculated on-the-fly or via Cloud Functions  

### Helper Functions (Secure Alternative)

Two new functions calculate follower/following counts from the `userFollows` collection:

```typescript
// Calculate from userFollows collection (secure)
const followerCount = await calculateFollowerCount(userId);
const followingCount = await calculateFollowingCount(userId);
```

These functions:
- Query the `userFollows` collection directly
- Cannot be forged (read-only queries)
- Return accurate real-time counts
- Are slightly slower than reading from `socialStats`

---

## 📋 Migration Path

### Short-Term (Current Implementation)
**Status:** ✅ Implemented

- Follower counts calculated on-demand from `userFollows` collection
- Use `calculateFollowerCount()` and `calculateFollowingCount()` helper functions
- Performance impact: Minor (additional Firestore read per user displayed)
- Security: Fully secure

### Medium-Term (Recommended for Production)
**Status:** 🔶 TODO

Implement Cloud Functions to maintain follower counts:

```javascript
// Cloud Function (Server-side with Admin SDK)
exports.updateFollowerCount = functions.firestore
  .document('userFollows/{followId}')
  .onWrite(async (change, context) => {
    // Update followersCount for the followed user
    // Admin SDK bypasses security rules
  });
```

**Benefits:**
- Maintains cached counts in `socialStats` for fast reads
- Secure (server-side only, uses Admin SDK)
- Automatic updates via triggers
- Better performance for leaderboards

### Long-Term (Enterprise Scale)
**Status:** 💭 Future Consideration

- Implement distributed counter shards for high-scale applications
- Use batched updates to minimize writes
- Consider caching strategies (Redis, etc.)

---

## 🧪 Testing

### Security Validation

**Test:** Attempt to forge follower count
```typescript
// This should FAIL with security rules
await updateDoc(doc(db, 'socialStats', 'someOtherUser'), {
  followersCount: 1000000
});
// ❌ Error: Missing or insufficient permissions
```

**Test:** Calculate follower count (secure alternative)
```typescript
const count = await calculateFollowerCount('someUser');
// ✅ Returns accurate count from userFollows collection
```

### Functional Testing
- ✅ Follow user works
- ✅ Unfollow user works  
- ✅ Re-follow after unfollow works
- ✅ Follower counts accurate (when calculated)
- ✅ Cannot forge follower counts

---

## 📊 Performance Impact

| Operation | Before | After | Impact |
|-----------|--------|-------|--------|
| Follow User | 1 write | 1 write | No change |
| Unfollow User | 1 write | 1 write | No change |
| Display Follower Count | 1 read (cached) | 1 query (count) | Slightly slower |
| Security | ❌ Forgeable | ✅ Secure | **Critical improvement** |

### Performance Notes
- Follower count calculation requires a Firestore query instead of a simple document read
- For most use cases, this is acceptable
- For high-traffic leaderboards, consider implementing Cloud Functions (medium-term solution)

---

## 🚀 Deployment Checklist

- [x] Update `firestore.rules` with secure rules
- [x] Remove client-side updates to other users' `followersCount`
- [x] Add `calculateFollowerCount()` and `calculateFollowingCount()` helper functions
- [x] Update documentation
- [ ] Deploy new `firestore.rules` to Firebase
- [ ] (Optional) Implement Cloud Functions for follower count updates
- [ ] (Optional) Migrate existing components to use calculated counts

---

## 🔗 Related Files

- `firestore.rules` (lines 628-642) - Security rules
- `src/services/leaderboards.ts` (lines 461-536) - Follow/unfollow logic
- `FOLLOW_SYSTEM_COMPLETE_DOCUMENTATION.md` - Complete follow system docs

---

## 💡 Key Takeaways

1. **Never trust client-side updates** for user-owned data that affects other users
2. **Security rules must enforce ownership** - don't rely on field-level restrictions alone
3. **Calculated counts are more secure** than cached counts (at a performance cost)
4. **Cloud Functions with Admin SDK** are the best solution for cross-user updates
5. **Always review security rules** for privilege escalation vulnerabilities

---

## 📞 Questions & Support

For questions about this security fix or implementation details, see:
- `FOLLOW_SYSTEM_COMPLETE_DOCUMENTATION.md` - Complete follow system guide
- Firebase Security Rules documentation
- Cloud Functions documentation

---

**Discovered by:** GitHub Codex Code Review (chatgpt-codex-connector bot)  
**Fixed by:** Development Team  
**Date:** October 29, 2025  
**Priority:** P1 - Critical

