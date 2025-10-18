# TradeYa UX Audit - Manual Browser Testing Guide

**Date:** October 15, 2025  
**Server:** http://localhost:5175  
**Status:** Ready for Testing

---

## Testing Accounts

### Primary Account (Creator)
- **Email:** johnfroberts11@gmail.com
- **Password:** Jasmine629!
- **Role:** Create collaborations, trades, challenges

### Secondary Account (Joiner)
- **Login:** LJKEONI (Google Sign-in)
- **Role:** Join/apply to items created by primary account

---

## Fixed Bugs to Verify

### ✅ Bug #1: Collaboration Creation Form
**What was fixed:**
- Replaced legacy form with modern `CollaborationForm`
- Added proper role management interface
- Added null safety for `creatorPhotoURL` field

**Testing Steps:**
1. Login as `johnfroberts11@gmail.com`
2. Navigate to: http://localhost:5175/collaborations/new
3. Fill out collaboration form:
   - Title: "Test Collab - [Current Time]"
   - Description: "Testing collaboration creation after bug fix"
   - Add at least 2 roles with different names and descriptions
   - Set skills required
   - Set max participants
4. Submit form
5. **Expected:** ✅ Success toast appears
6. **Expected:** ✅ Redirected to collaboration detail page
7. **Expected:** ✅ All roles are visible in the roles section
8. **Expected:** ✅ No console errors

**Look for:**
- Clean glassmorphic UI (consistent with create flow)
- All form fields save correctly
- Roles appear in the detail view
- No Firebase "invalid data" errors

---

### ✅ Bug #2: Collaboration Application (photoURL fix)
**What was fixed:**
- Changed `applicantPhotoURL: userProfile.photoURL` to include `|| null` fallback
- Added defensive converter to filter undefined values
- Added retrieval logic for 'general' applications

**Testing Steps:**
1. **Logout** from primary account
2. **Login** as LJKEONI (Google Sign-in)
3. Navigate to: http://localhost:5175/collaborations
4. Find the collaboration created by John F. Roberts
5. Click "Apply to Collaborate" button
6. Fill out application form:
   - Select a role (if role-specific) or use general application
   - Write application message
7. Submit application
8. **Expected:** ✅ Success toast: "Application submitted successfully"
9. **Expected:** ✅ No console errors about `undefined` photoURL
10. **Logout** from LJKEONI
11. **Login** as `johnfroberts11@gmail.com`
12. Navigate to the collaboration detail page
13. Scroll to "Applications" or "Pending Applications" section
14. **Expected:** ✅ LJ Chioni's application is visible
15. **Expected:** ✅ Application shows correct name and message
16. **Expected:** ✅ Photo displays or shows default avatar

**Look for:**
- No Firebase "Unsupported field value: undefined" error
- Application saved successfully
- Application retrieved and displayed to creator
- Works for users with AND without profile photos

---

### ✅ Bug #3: Trade Proposal (photoURL fix)
**What was fixed:**
- Changed `proposerPhotoURL: currentUser.photoURL || undefined` to `|| null`
- Added defensive converter for trade proposals
- Updated TypeScript interface

**Testing Steps:**

**Part A: Create a Trade (Primary Account)**
1. Login as `johnfroberts11@gmail.com`
2. Navigate to: http://localhost:5175/trades/create
3. Create a new trade:
   - Title: "Test Trade - [Current Time]"
   - Description: "Testing trade proposal workflow"
   - Category: Choose any
   - Upload image (optional)
4. Submit trade
5. **Expected:** ✅ Trade created successfully
6. Note the trade URL for next steps

**Part B: Submit Proposal (Secondary Account)**
1. **Logout** from primary account
2. **Login** as LJKEONI
3. Navigate to the trade created by John F. Roberts
4. Click "Make Proposal" or "Propose Trade" button
5. Fill out proposal form:
   - Message: "I'm interested in this trade"
   - Offer details (if applicable)
6. Submit proposal
7. **Expected:** ✅ Success toast: "Proposal submitted"
8. **Expected:** ✅ No console errors about `undefined` photoURL
9. **Logout** from LJKEONI
10. **Login** as `johnfroberts11@gmail.com`
11. Navigate to the trade detail page
12. Look for "Proposals" section
13. **Expected:** ✅ LJ Chioni's proposal is visible
14. **Expected:** ✅ Proposal shows correct user info
15. **Expected:** ✅ Photo displays or shows default avatar

**Look for:**
- No Firebase "Unsupported field value: undefined" error
- Proposal saves successfully
- Proposal displays to trade creator
- Works regardless of user photo status

---

## Additional Workflows to Test

### Workflow 4: Joining Trades
**Purpose:** Verify trade matching system works

**Testing Steps:**
1. Login as `johnfroberts11@gmail.com`
2. Create a trade if none exist
3. **Logout** and login as LJKEONI
4. Browse available trades
5. Click "Join Trade" or equivalent
6. Complete join flow
7. **Expected:** ✅ Match confirmation appears
8. **Expected:** ✅ Both users see the match
9. **Expected:** ✅ Chat/messaging becomes available

---

### Workflow 5: Profile Management
**Purpose:** Verify profile viewing and editing

**Testing Steps:**
1. Login as any account
2. Click profile menu/avatar
3. Navigate to profile page
4. Test editing:
   - Change display name
   - Update bio
   - Upload profile photo (if not set)
5. Save changes
6. **Expected:** ✅ Changes persist after reload
7. View other user's profile
8. **Expected:** ✅ Profile cards display correctly

---

### Workflow 6: Messaging System
**Purpose:** Verify chat functionality

**Testing Steps:**
1. Ensure both accounts have some connection (trade, collaboration)
2. Login as `johnfroberts11@gmail.com`
3. Navigate to messages/chat
4. Find conversation with LJ Chioni
5. Send a test message
6. **Logout** and login as LJKEONI
7. Check for message notification
8. Open conversation
9. Reply to message
10. **Expected:** ✅ Messages appear in real-time
11. **Expected:** ✅ Timestamps are correct
12. **Expected:** ✅ Read receipts work (if implemented)

---

### Workflow 7: Search Functionality
**Purpose:** Verify search works across all content types

**Testing Steps:**
1. Login as any account
2. Use global search (if available) or page-specific search
3. Test searching for:
   - Users: Search "John" or "LJ"
   - Trades: Search for trade keywords
   - Collaborations: Search for collaboration titles
4. **Expected:** ✅ Relevant results appear
5. **Expected:** ✅ Click results navigate correctly
6. **Expected:** ✅ No broken links or 404s

---

### Workflow 8: Notifications
**Purpose:** Verify notification system works

**Testing Steps:**
1. Create an action that triggers notification:
   - Apply to collaboration
   - Send trade proposal
   - Accept/reject application
2. Check notification bell/icon
3. **Expected:** ✅ Notification count updates
4. Click notification
5. **Expected:** ✅ Navigates to relevant content
6. Mark notification as read
7. **Expected:** ✅ Count decreases

---

## Browser Console Checks

### Throughout ALL tests, monitor console for:

**❌ Should NOT see:**
- `FirebaseError: Function addDoc() called with invalid data`
- `Unsupported field value: undefined`
- `Missing or insufficient permissions`
- React hydration errors
- Unhandled promise rejections

**✅ Should see (acceptable):**
- Normal Firebase SDK info logs
- React development mode warnings (in dev)
- Successful API calls (200 status codes)

---

## Test Results Template

### Use this template to record findings:

```
## Test Session: [Date/Time]

### Bug #1: Collaboration Creation
- Status: [ ] Pass / [ ] Fail
- Notes: 
- Screenshots: 
- Issues Found:

### Bug #2: Collaboration Application
- Status: [ ] Pass / [ ] Fail
- Notes:
- Screenshots:
- Issues Found:

### Bug #3: Trade Proposal
- Status: [ ] Pass / [ ] Fail
- Notes:
- Screenshots:
- Issues Found:

### Additional Workflows
- Joining Trades: [ ] Pass / [ ] Fail
- Profile Management: [ ] Pass / [ ] Fail
- Messaging: [ ] Pass / [ ] Fail
- Search: [ ] Pass / [ ] Fail
- Notifications: [ ] Pass / [ ] Fail

### Overall Assessment
- Critical Issues: 
- UX Improvements Needed:
- Positive Highlights:
```

---

## Quick Test Checklist

Use this for rapid verification:

- [ ] Collaboration creation works (with roles)
- [ ] Collaboration application submits (no photoURL error)
- [ ] Application appears in creator's view
- [ ] Trade proposal submits (no photoURL error)
- [ ] Proposal appears in creator's view
- [ ] Join trade workflow completes
- [ ] Profile editing saves correctly
- [ ] Messages send/receive
- [ ] Search returns results
- [ ] Notifications display and work
- [ ] No console errors throughout testing
- [ ] All navigation links work
- [ ] Mobile responsive (if testing mobile)

---

## Priority Testing Order

1. **Highest Priority:** Bugs #1-3 (Collaboration creation, application, trade proposal)
2. **High Priority:** Joining trades, applications visibility
3. **Medium Priority:** Messaging, profile management
4. **Low Priority:** Search, notifications (if other features work)

---

## Testing Tips

### Getting Clean Test Results
1. Clear browser cache before starting: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
2. Open browser DevTools: `Cmd+Option+I` (Mac) or `F12` (Windows)
3. Keep Console tab visible throughout testing
4. Use Network tab to verify API calls succeed (200 status)

### If Something Fails
1. Screenshot the error
2. Copy full console error message
3. Note exact steps to reproduce
4. Check Network tab for failed requests
5. Verify you're on correct URL (localhost:5175)

### Switching Accounts Quickly
1. Use browser profiles (Chrome) or containers (Firefox)
2. Or use Incognito/Private window for second account
3. Or manually logout/login (slower)

---

## Success Criteria

**All tests pass if:**
- ✅ All 3 fixed bugs work without errors
- ✅ No Firebase "undefined" errors in console
- ✅ Applications and proposals are visible to creators
- ✅ Forms submit successfully
- ✅ Data persists after page reload
- ✅ Navigation flows work smoothly

**Ready for production if:**
- ✅ All success criteria met
- ✅ No critical bugs found
- ✅ UX is consistent across workflows
- ✅ Performance is acceptable (page loads < 3s)

---

## Post-Testing Actions

After completing all tests:
1. Compile findings into comprehensive report
2. Take screenshots of successful flows
3. Document any new bugs discovered
4. Update audit plan with completion status
5. Create prioritized fix list for any issues found

---

**Tester:** Manual Testing Required  
**Estimated Time:** 45-60 minutes for comprehensive testing  
**Environment:** Development (localhost:5175)  
**Status:** Ready to Begin

---

*This guide ensures thorough verification of all bug fixes and core workflows before deployment to production.*

