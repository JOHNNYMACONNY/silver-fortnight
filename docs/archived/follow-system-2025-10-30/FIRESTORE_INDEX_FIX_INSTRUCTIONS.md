# Firestore Index Fix - Step-by-Step Instructions

**Status**: 🚫 **ACTION REQUIRED** - Manual Firebase Console Access Needed  
**Priority**: P0 - Critical (Blocks all follow functionality)  
**Estimated Time**: 5-15 minutes

---

## Problem Summary

The real-time follower count feature is fully implemented but blocked by a missing Firestore composite index. This index cannot be deployed via Firebase CLI due to a corrupted index on the server.

**Error Message:**
```
FirebaseError: The query requires an index. You can create it here: 
https://console.firebase.google.com/v1/r/project/tradeya-45ede/firestore/indexes?create_composite=...
```

---

## Solution: Manual Index Creation

### Method 1: Direct Link (Fastest - RECOMMENDED)

1. **Click this link** (auto-opens index creation form):
   ```
   https://console.firebase.google.com/v1/r/project/tradeya-45ede/firestore/indexes?create_composite=ClFwcm9qZWN0cy90cmFkZXlhLTQ1ZWRlL2RhdGFiYXNlcy8oZGVmYXVsdCkvY29sbGVjdGlvbkdyb3Vwcy91c2VyRm9sbG93cy9pbmRleGVzL18QARoOCgpmb2xsb3dlcklkEAEaDQoJY3JlYXRlZEF0EAIaDAoIX19uYW1lX18QAg
   ```

2. **Sign in** to Firebase Console with your Firebase admin account:
   - Email: `ljkeoni@gmail.com` (or your Firebase admin account)

3. **Review the auto-populated index** (should show):
   - Collection ID: `userFollows`
   - Fields:
     - `followerId` (Ascending)
     - `createdAt` (Descending)
   - Query scope: Collection

4. **Click "Create Index"**

5. **Wait 5-10 minutes** for the index to build
   - Status will show "Building..." then "Enabled"
   - You'll receive an email when it's done

6. **Test** the follow functionality:
   ```bash
   # Navigate to http://localhost:5175
   # Login and try to follow a user
   # Verify follower counts display correctly
   ```

**Time**: ~15 minutes (5 min manual + 10 min build time)

---

### Method 2: Manual Index Creation (if link doesn't work)

1. **Go to Firebase Console**:
   ```
   https://console.firebase.google.com/project/tradeya-45ede/firestore/indexes
   ```

2. **Sign in** with your Firebase admin account

3. **Click "Create Index"** button

4. **Fill in the form**:
   - **Collection ID**: `userFollows`
   - **Query scope**: Collection
   - **Fields**:
     1. Field: `followerId`, Order: Ascending
     2. Field: `createdAt`, Order: Descending

5. **Click "Create"**

6. **Wait 5-10 minutes** for index to build

7. **Test** the follow functionality

**Time**: ~20 minutes (10 min manual + 10 min build time)

---

### Method 3: Fix Corrupted Index + Deploy All (Advanced)

**Only do this if you want to fix the root cause**

1. **Go to Firebase Console → Firestore → Indexes**:
   ```
   https://console.firebase.google.com/project/tradeya-45ede/firestore/indexes
   ```

2. **Find the corrupted index**:
   - Look for an index on `collaborations` collection
   - Status might show "Error" or "Failed"
   - Look for any index with `__name__` field (invalid)

3. **Delete the corrupted index**:
   - Click the three dots menu → Delete
   - Confirm deletion

4. **Deploy all indexes via CLI**:
   ```bash
   cd /Volumes/YBF_Storage/Projects/silver-fortnight
   firebase deploy --only firestore:indexes --project tradeya-45ede
   ```

5. **Wait 10-15 minutes** for all indexes to build

6. **Test** the follow functionality

**Time**: ~30 minutes (15 min manual + 15 min build time)

**Pros**: Fixes root cause, deploys all missing indexes  
**Cons**: More complex, may break existing queries temporarily

---

## Verification Steps

After the index is created, verify it works:

### 1. Check Index Status

```bash
# Visit Firebase Console
https://console.firebase.google.com/project/tradeya-45ede/firestore/indexes
```

Look for:
- ✅ Collection: `userFollows`
- ✅ Fields: `followerId` (Ascending), `createdAt` (Descending)
- ✅ Status: "Enabled" (not "Building")

### 2. Test in Browser

1. **Start dev server** (if not running):
   ```bash
   npm run dev
   ```

2. **Navigate to**: `http://localhost:5175`

3. **Login** with test account

4. **Go to user directory** and click on any user profile

5. **Test follow functionality**:
   - ✅ Click "Follow" button
   - ✅ Button changes to "Following"
   - ✅ Follower count updates immediately
   - ✅ Click "Unfollow"
   - ✅ Button changes back to "Follow"
   - ✅ Follower count decrements
   - ✅ Click "Follow" again (test re-follow)
   - ✅ Should work without errors

### 3. Check Browser Console

**Open DevTools → Console**, should see:
- ✅ No Firestore index errors
- ✅ No permission errors
- ✅ Successful follow/unfollow operations

**Before fix** (errors):
```javascript
[ERROR] The query requires an index...
[ERROR] Missing or insufficient permissions...
```

**After fix** (clean):
```javascript
// No errors related to userFollows or socialStats
```

---

## Troubleshooting

### Issue: Index is stuck in "Building" state for >30 minutes

**Solution**: 
- This is normal for large collections
- Wait up to 1 hour for first-time index builds
- If still building after 1 hour, check Firebase status page: https://status.firebase.google.com/

### Issue: "Permission denied" when creating index

**Solution**:
- Ensure you're signed in with an account that has Firebase admin/owner role
- Check IAM permissions in Google Cloud Console
- Required roles: `Firebase Admin` or `Cloud Datastore Owner`

### Issue: Follow button still doesn't work after index is built

**Checklist**:
1. ✅ Refresh the browser page (hard refresh: Cmd+Shift+R)
2. ✅ Check index status is "Enabled" (not "Building")
3. ✅ Check browser console for different error messages
4. ✅ Verify Firestore rules are deployed:
   ```bash
   firebase deploy --only firestore:rules --project tradeya-45ede
   ```
5. ✅ Test with a different user profile

### Issue: "Index already exists" error

**Solution**:
- The index may already be building/built
- Check Firebase Console → Indexes tab
- If status is "Enabled", you're good to go!
- If status is "Error", delete and recreate

---

## Technical Details

### Why This Index is Required

The `calculateFollowerCount()` and `calculateFollowingCount()` functions query the `userFollows` collection with compound filters:

```typescript
// Follower count query
query(
  collection(db, 'userFollows'),
  where('followingId', '==', userId)  // Who is following this user?
)

// Following count query
query(
  collection(db, 'userFollows'),
  where('followerId', '==', userId),  // Who is this user following?
  orderBy('createdAt', 'desc')        // Requires composite index!
)
```

Firestore requires a composite index for queries that:
1. Filter on a field (`followerId`)
2. Sort on a different field (`createdAt`)

### Index Specification

```json
{
  "collectionGroup": "userFollows",
  "queryScope": "COLLECTION",
  "fields": [
    {"fieldPath": "followerId", "order": "ASCENDING"},
    {"fieldPath": "createdAt", "order": "DESCENDING"}
  ]
}
```

This is defined in `firestore.indexes.json` (lines 509-515) but not yet deployed to Firebase servers.

---

## Next Steps After Fix

Once the index is created and enabled:

1. ✅ **Test follow functionality** (see Verification Steps above)

2. ✅ **Mark feature as complete**:
   - Real-time follower counts working
   - No Cloud Functions required (Spark plan compatible)
   - Secure implementation (no forgery possible)

3. ✅ **Monitor Firestore usage**:
   - Each profile view = 3 Firestore reads
   - Spark plan limit: 50,000 reads/day
   - ≈ 16,666 profile views/day before hitting limit

4. ✅ **Consider future optimizations**:
   - Client-side caching (reduce reads)
   - Upgrade to Blaze plan + Cloud Functions (better performance)

---

## Files Reference

### Implementation Files
- `src/services/leaderboards.ts` - Real-time calculation logic
- `firestore.rules` - Security rules (already deployed)
- `firestore.indexes.json` - Index definitions (not yet deployed)

### Documentation
- `REAL_TIME_FOLLOWER_COUNT_AUDIT.md` - Comprehensive audit report
- `SECURITY_FIX_FOLLOWER_COUNTS.md` - Security advisory
- `SECURITY_FIX_VERIFICATION.md` - Security verification
- `FIRESTORE_INDEX_FIX_INSTRUCTIONS.md` - This document

---

## Support Links

- **Firebase Console**: https://console.firebase.google.com/project/tradeya-45ede
- **Firestore Indexes**: https://console.firebase.google.com/project/tradeya-45ede/firestore/indexes
- **Firebase Status**: https://status.firebase.google.com/
- **Firestore Index Documentation**: https://firebase.google.com/docs/firestore/query-data/indexing

---

**Last Updated**: October 30, 2025  
**Created By**: AI Assistant  
**Action Required By**: Firebase Admin (ljkeoni@gmail.com)

