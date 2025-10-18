# Trade Joining Workflow - Manual Testing Guide

**Phase:** 1B - Joiner Workflows (Mobile)  
**Workflow:** Joining Trades  
**Date:** October 14, 2025  
**Bug Status:** ✅ Fixed proactively

---

## 🎯 Test Objective

Verify that a secondary user (LJKEONI) can successfully discover, propose to join, and complete the trade matching workflow with a trade created by the primary user (johnfroberts11@gmail.com).

---

## 📋 Prerequisites

**Before Starting:**
- ✅ johnfroberts11@gmail.com has created at least one open trade (Phase 1A completed)
- ✅ LJKEONI account is ready to use
- ✅ App running on localhost:5176
- ✅ Bug fix applied (photoURL handling)

---

## 🧪 Testing Steps

### **Part 1: Discover Trades (As LJKEONI)**

#### Step 1.1: Navigate to Trades Page
1. **Login as:** LJKEONI
2. **Navigate to:** `http://localhost:5176/trades`
3. **Verify:**
   - [ ] Trades page loads successfully
   - [ ] No console errors
   - [ ] Trade cards display properly

#### Step 1.2: Find johnfroberts11's Trade
1. **Look for:** Trade created by johnfroberts11@gmail.com
2. **Check visibility:**
   - [ ] Trade title is visible
   - [ ] Creator name is visible
   - [ ] Skills offered/requested are visible
   - [ ] "Open" status badge is visible
3. **Screenshot:** `mobile-trades-list-ljkeoni.png`

#### Step 1.3: View Trade Details
1. **Click:** On the trade card
2. **Verify detail page:**
   - [ ] Title displays correctly
   - [ ] Full description visible
   - [ ] Skills listed with proficiency levels
   - [ ] Creator profile information visible
   - [ ] "Submit Proposal" or "Make Proposal" button visible
3. **Screenshot:** `mobile-trade-detail-view-ljkeoni.png`

---

### **Part 2: Submit Trade Proposal**

#### Step 2.1: Open Proposal Form
1. **Click:** "Submit Proposal" or "Make Proposal" button
2. **Verify form loads:**
   - [ ] Form modal/page appears
   - [ ] Message textarea is present
   - [ ] Optional evidence upload section visible
   - [ ] Submit button enabled
3. **Screenshot:** `mobile-trade-proposal-form-empty.png`

#### Step 2.2: Fill Out Proposal
1. **Message field:** Type a proposal message
   ```
   Example: "Hi! I'd love to trade my web development skills for your design expertise. I have 5 years experience with React and Node.js. Let me know if you're interested!"
   ```
2. **Optional Evidence:**
   - Add portfolio links if UI allows
   - Skip if not relevant to quick testing
3. **Screenshot:** `mobile-trade-proposal-form-filled.png`

#### Step 2.3: Submit Proposal
1. **Click:** Submit/Send Proposal button
2. **Watch for:**
   - [ ] Loading state appears
   - [ ] Success toast notification: "Your proposal has been submitted successfully!"
   - [ ] Redirected or proposal form closes
   - [ ] No errors in console
3. **Console check:** Look for any Firebase errors (especially photoURL related)
4. **Screenshot:** `mobile-trade-proposal-success.png`

---

### **Part 3: Verify Proposal Submission**

#### Step 3.1: Check Proposal Status (As LJKEONI)
1. **Navigate to:** Your profile or "My Proposals" section (if available)
2. **Verify:**
   - [ ] Proposal appears in sent proposals
   - [ ] Status shows "Pending"
3. **Screenshot:** `mobile-trade-my-proposals.png`

---

### **Part 4: Accept Proposal (As johnfroberts11@gmail.com)**

#### Step 4.1: Switch Accounts
1. **Logout from:** LJKEONI
2. **Login as:** johnfroberts11@gmail.com

#### Step 4.2: View Proposals
1. **Navigate to:** `http://localhost:5176/trades`
2. **Click:** On your trade
3. **Look for:** "View Proposals" button or "Proposals" tab
4. **Click:** To view proposals
5. **Verify:**
   - [ ] LJKEONI's proposal is visible
   - [ ] Proposal message is readable
   - [ ] Proposer name/photo visible
   - [ ] "Accept" button is present
3. **Screenshot:** `mobile-trade-proposals-list.png`

#### Step 4.3: Accept Proposal
1. **Click:** "Accept" button on LJKEONI's proposal
2. **Watch for:**
   - [ ] Confirmation dialog (if any)
   - [ ] Success toast: "Proposal accepted" or similar
   - [ ] Trade status changes to "In Progress"
   - [ ] LJKEONI appears as participant
   - [ ] No console errors
3. **Console check:** Look for any Firebase errors
4. **Screenshot:** `mobile-trade-proposal-accepted.png`

---

### **Part 5: Verify Trade Status Update**

#### Step 5.1: Check Trade Status (As johnfroberts11)
1. **Navigate back to:** Trade detail page
2. **Verify:**
   - [ ] Status badge shows "In Progress"
   - [ ] LJKEONI appears as participant/partner
   - [ ] Action buttons changed (e.g., "Submit Evidence")
3. **Screenshot:** `mobile-trade-in-progress-creator.png`

#### Step 5.2: Check as Participant (As LJKEONI)
1. **Logout and login as:** LJKEONI
2. **Navigate to:** Trades page
3. **Find:** The trade you proposed to
4. **Verify:**
   - [ ] Status shows "In Progress"
   - [ ] You appear as participant
   - [ ] Access to trade actions/evidence submission
3. **Screenshot:** `mobile-trade-in-progress-participant.png`

---

## ❌ **Error Scenarios to Watch For**

### Firebase Errors:
- ❌ `Unsupported field value: undefined` (photoURL bug - should be fixed)
- ❌ `Missing or insufficient permissions` (security rules issue)
- ❌ `Function addDoc() called with invalid data`

### UI/UX Issues:
- ⚠️ Trade card information incomplete
- ⚠️ Buttons not working/clickable
- ⚠️ Toast notifications not appearing
- ⚠️ Loading states stuck
- ⚠️ Navigation issues

---

## 📊 **Report Back**

### For Each Issue Found:
1. **Screenshot** of the error
2. **Console error** (full text)
3. **Steps to reproduce**
4. **Which account** (LJKEONI or johnfroberts11)
5. **Expected vs actual behavior**

### If Everything Works:
Report success with:
- ✅ All checkboxes completed
- ✅ No console errors
- ✅ Screenshots captured
- ✅ Smooth user experience

---

## 🎯 **Success Criteria**

**✅ Test PASSES if:**
- LJKEONI can view johnfroberts11's trades
- LJKEONI can submit a proposal successfully
- johnfroberts11 receives and sees the proposal
- johnfroberts11 can accept the proposal
- Trade status updates to "In Progress" for both users
- No Firebase/console errors occur
- All UI elements work as expected

**❌ Test FAILS if:**
- Any Firebase errors appear
- Proposal submission fails
- Proposal acceptance fails
- Status doesn't update
- Data doesn't persist

---

**Bug Prevention:** The photoURL bug has been fixed proactively. You should NOT encounter the `undefined` photoURL error that we saw with collaboration applications. If you do, please report immediately!



