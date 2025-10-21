# TradeYa Trade Lifecycle System

This document outlines the complete trade lifecycle system for TradeYa, integrating both the Trade Proposal Flow and the Trade Confirmation System into a cohesive end-to-end experience.

## Table of Contents

1. [System Overview](#system-overview)
2. [Complete Trade Lifecycle](#complete-trade-lifecycle)
3. [Database Schema](#database-schema)
4. [UI Components](#ui-components)
5. [Service Layer](#service-layer)
6. [Integration Points](#integration-points)
7. [Implementation Strategy](#implementation-strategy)
8. [Technical Considerations](#technical-considerations)

## System Overview

The Trade Lifecycle System manages the entire lifecycle of a trade from creation to completion, providing a structured, intuitive experience for users at every stage.

### Goals

- Create a seamless end-to-end trade experience
- Provide clear status visibility throughout the trade lifecycle
- Formalize the proposal and participant selection process
- Ensure both parties agree that a trade has been completed satisfactorily
- Increase trust and accountability in the trading process
- Reduce disputes and misunderstandings between users

### Key Features

#### Trade Proposal Flow
- Structured skill selection and matching
- Formal proposal submission system
- Proposal management dashboard
- Clear participant tracking
- One-click proposal acceptance

#### Trade Confirmation System
- Two-sided confirmation requirement
- Evidence upload capability using Evidence Embed System
- Time-based auto-resolution
- Dispute handling process
- Status tracking and visualization

## Complete Trade Lifecycle

### 1. Trade Creation
- Creator selects offered/requested skills using structured interface
- Sets timeframe and communication preferences
- Trade published with status "open"

### 2. Proposal Submission
- Interested users submit formal proposals
- Skill matching shows compatibility
- Proposers can attach portfolio evidence
- Creator receives notifications about new proposals

### 3. Proposal Acceptance
- Creator reviews proposals in dashboard
- Selects proposal to accept
- Trade status changes to "in-progress"
- Participant is formally recorded in trade record
- Other proposers are notified their proposals were not selected

### 4. Trade Execution
- Users work together to complete the trade
- Can communicate through messaging system
- Both prepare evidence of their work

### 5. Completion Request
- Either user can initiate completion request
- Submits evidence using Evidence Embed System
- Trade status changes to "pending_confirmation"
- Other user receives notification about pending confirmation

### 6. Completion Confirmation
- Other user reviews evidence
- Can confirm completion or request changes
- If confirmed, status changes to "completed"
- If changes requested, returns to "in-progress" with notes
- Both users receive XP and achievements

### 7. Auto-Resolution
- If second user doesn't respond within 7 days, send reminder notifications
- After 14 days with no response, system auto-completes the trade
- Auto-completion is noted in the trade history

## Database Schema

### Enhanced Trade Interface

```typescript
export interface Trade {
  // Basic trade info
  id: string;
  title: string;
  description: string;
  category: string;
  location?: string;
  
  // Creator info
  creatorId: string;
  creatorName?: string;
  creatorPhotoURL?: string;
  
  // Enhanced skill structure
  offeredSkills: TradeSkill[];  // Structured skill objects instead of strings
  requestedSkills: TradeSkill[];
  timeframe: string;  // Expected completion timeframe
  communicationPreferences: string[];
  
  // Participant tracking
  participantId?: string;  // ID of accepted proposer
  participantName?: string;
  participantPhotoURL?: string;
  
  // Status tracking
  status: 'open' | 'in-progress' | 'pending_confirmation' | 'completed' | 'cancelled' | 'disputed';
  proposalCount: number;  // Count of active proposals
  
  // Confirmation system fields
  completionRequestedBy?: string;  // User ID of who requested completion
  completionRequestedAt?: any;  // Timestamp
  completionConfirmedAt?: any;  // Timestamp
  completionEvidence?: EmbeddedEvidence[];  // Using Evidence Embed System
  completionNotes?: string;  // Notes about completion
  changeRequests?: ChangeRequest[];  // History of change requests
  autoCompletedAt?: any;  // Timestamp if auto-completed
  
  // Timestamps
  createdAt: any;
  updatedAt: any;
}

// Structured skill object
export interface TradeSkill {
  id: string;
  name: string;
  category: string;
  level?: 'beginner' | 'intermediate' | 'expert';
  estimatedHours?: number;
}

// Trade proposal interface
export interface TradeProposal {
  id: string;
  tradeId: string;
  userId: string;
  userName?: string;
  userPhotoURL?: string;
  userRating?: number;
  
  // Skill matching
  offeredSkills: TradeSkill[];  // Skills the proposer is offering
  requestedSkills: TradeSkill[];  // Skills the proposer wants in return
  
  // Proposal details
  message: string;
  timeframe: string;
  availability: string[];
  portfolioEvidence?: EmbeddedEvidence[];  // Using Evidence Embed System
  
  // Status tracking
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn';
  createdAt: any; // Timestamp
  updatedAt: any; // Timestamp
  acceptedAt?: any; // Timestamp
  rejectedAt?: any; // Timestamp
}

// Change request interface
export interface ChangeRequest {
  id: string;
  requestedBy: string;  // User ID
  requestedAt: any;  // Timestamp
  reason: string;  // Why changes are needed
  status: 'pending' | 'addressed' | 'rejected';
  resolvedAt?: any;  // Timestamp when addressed/rejected
}
```

### Firestore Collections

1. **Trades Collection**:
   - Main trade documents with all fields

2. **Trade Proposals Subcollection**:
   - `trades/{tradeId}/proposals/{proposalId}`
   - Stores all proposals for a trade

3. **Trade Evidence Subcollection**:
   - `trades/{tradeId}/evidence/{evidenceId}`
   - Stores evidence metadata (actual content via Evidence Embed System)

4. **Change Requests Subcollection**:
   - `trades/{tradeId}/changeRequests/{requestId}`
   - Stores change request history

### Firestore Indexes

Create the following indexes in Firebase:
- Collection: `trades`, Fields: `status` (ascending), `createdAt` (descending)
- Collection: `trades`, Fields: `participantId` (ascending), `status` (ascending)
- Collection: `trades`, Fields: `creatorId` (ascending), `status` (ascending)
- Collection: `trades`, Fields: `completionRequestedAt` (ascending), `status` (ascending)
- Collection: `trades/*/proposals`, Fields: `status` (ascending), `createdAt` (descending)

## UI Components

### Trade Creation Components

1. **Enhanced Trade Creation Form**:
   - Categorized skill selector component
   - Dual-column interface for offered/requested skills
   - Skill level selector
   - Timeframe and communication preference options

2. **Skill Selector Component**:
   - Searchable, categorized skill selection
   - Skill level options (beginner, intermediate, expert)
   - Estimated time commitment input

### Trade Proposal Components

1. **Proposal Form Component**:
   - Skill matching interface
   - Portfolio/evidence attachment section using Evidence Embed System
   - Availability selector
   - Timeframe estimator

2. **Proposal Dashboard Component**:
   - Filterable list of proposals
   - Comparison view for multiple proposals
   - Quick actions (accept, reject, message)
   - Sorting options (by match quality, user rating, etc.)

3. **Proposal Card Component**:
   - Display user info and rating
   - Show matched skills
   - Preview of portfolio evidence
   - Accept/reject/message buttons

### Trade Confirmation Components

1. **Trade Status Display Component**:
   - Visual timeline of trade progress
   - Color-coded status indicators
   - Action buttons based on current status and user role

2. **Completion Request Component**:
   - Evidence submission interface using Evidence Embed System
   - Completion notes field
   - Preview of submitted evidence

3. **Confirmation Review Component**:
   - Evidence display with expand/collapse
   - Confirm/request changes buttons
   - Change request form

4. **Change Request Component**:
   - Reason for changes input
   - Specific change requirements
   - Timeline for addressing changes

## Service Layer

### Trade Creation Services

```typescript
// Create a new trade with enhanced skill structure
export const createTrade = async (
  tradeData: Omit<Trade, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'proposalCount'>
): Promise<{ tradeId: string | null; error: string | null }> => {
  try {
    const tradeRef = doc(collection(db, COLLECTIONS.TRADES));
    
    const newTrade: Trade = {
      ...tradeData,
      id: tradeRef.id,
      status: 'open',
      proposalCount: 0,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };
    
    await setDoc(tradeRef, newTrade);
    
    return { tradeId: tradeRef.id, error: null };
  } catch (err: any) {
    console.error('Error creating trade:', err);
    return { tradeId: null, error: err.message };
  }
};
```

### Trade Proposal Services

```typescript
// Submit a proposal for a trade
export const submitTradeProposal = async (
  tradeId: string,
  proposal: Omit<TradeProposal, 'id' | 'createdAt' | 'updatedAt' | 'status'>
): Promise<{ proposalId: string | null; error: string | null }> => {
  try {
    const tradeRef = doc(db, COLLECTIONS.TRADES, tradeId);
    const tradeSnap = await getDoc(tradeRef);
    
    if (!tradeSnap.exists()) {
      return { proposalId: null, error: 'Trade not found' };
    }
    
    const trade = tradeSnap.data() as Trade;
    
    if (trade.status !== 'open') {
      return { proposalId: null, error: 'Trade is not open for proposals' };
    }
    
    // Create proposal
    const proposalRef = doc(collection(db, COLLECTIONS.TRADES, tradeId, 'proposals'));
    
    const newProposal: TradeProposal = {
      ...proposal,
      id: proposalRef.id,
      tradeId,
      status: 'pending',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };
    
    await setDoc(proposalRef, newProposal);
    
    // Update proposal count on trade
    await updateDoc(tradeRef, {
      proposalCount: increment(1),
      updatedAt: Timestamp.now()
    });
    
    // Create notification for trade creator
    await createNotification({
      userId: trade.creatorId,
      type: 'trade_proposal',
      title: 'New Trade Proposal',
      message: `You have received a new proposal for your trade "${trade.title}"`,
      data: {
        tradeId,
        proposalId: proposalRef.id
      }
    });
    
    return { proposalId: proposalRef.id, error: null };
  } catch (err: any) {
    console.error('Error submitting proposal:', err);
    return { proposalId: null, error: err.message };
  }
};

// Accept a trade proposal
export const acceptTradeProposal = async (
  tradeId: string,
  proposalId: string
): Promise<{ success: boolean; error: string | null }> => {
  try {
    const tradeRef = doc(db, COLLECTIONS.TRADES, tradeId);
    const proposalRef = doc(db, COLLECTIONS.TRADES, tradeId, 'proposals', proposalId);
    
    const [tradeSnap, proposalSnap] = await Promise.all([
      getDoc(tradeRef),
      getDoc(proposalRef)
    ]);
    
    if (!tradeSnap.exists()) {
      return { success: false, error: 'Trade not found' };
    }
    
    if (!proposalSnap.exists()) {
      return { success: false, error: 'Proposal not found' };
    }
    
    const trade = tradeSnap.data() as Trade;
    const proposal = proposalSnap.data() as TradeProposal;
    
    if (trade.status !== 'open') {
      return { success: false, error: 'Trade is not open for acceptance' };
    }
    
    if (proposal.status !== 'pending') {
      return { success: false, error: 'Proposal is not pending' };
    }
    
    // Start a batch to update multiple documents
    const batch = writeBatch(db);
    
    // Update the trade
    batch.update(tradeRef, {
      status: 'in-progress',
      participantId: proposal.userId,
      participantName: proposal.userName || '',
      participantPhotoURL: proposal.userPhotoURL || '',
      updatedAt: Timestamp.now()
    });
    
    // Update the accepted proposal
    batch.update(proposalRef, {
      status: 'accepted',
      acceptedAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    
    // Get other pending proposals
    const otherProposalsQuery = query(
      collection(db, COLLECTIONS.TRADES, tradeId, 'proposals'),
      where('status', '==', 'pending'),
      where('id', '!=', proposalId)
    );
    
    const otherProposalsSnap = await getDocs(otherProposalsQuery);
    
    // Update other proposals to rejected
    otherProposalsSnap.forEach(doc => {
      batch.update(doc.ref, {
        status: 'rejected',
        rejectedAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
    });
    
    // Commit all updates
    await batch.commit();
    
    // Create notifications
    await Promise.all([
      // Notify accepted proposer
      createNotification({
        userId: proposal.userId,
        type: 'trade_proposal_accepted',
        title: 'Proposal Accepted',
        message: `Your proposal for trade "${trade.title}" has been accepted!`,
        data: { tradeId }
      }),
      
      // Notify rejected proposers
      ...otherProposalsSnap.docs.map(doc => {
        const rejectedProposal = doc.data() as TradeProposal;
        return createNotification({
          userId: rejectedProposal.userId,
          type: 'trade_proposal_rejected',
          title: 'Proposal Not Selected',
          message: `Another proposal was selected for trade "${trade.title}"`,
          data: { tradeId }
        });
      })
    ]);
    
    return { success: true, error: null };
  } catch (err: any) {
    console.error('Error accepting proposal:', err);
    return { success: false, error: err.message };
  }
};
```

### Trade Confirmation Services

```typescript
// Request trade completion
export const requestTradeCompletion = async (
  tradeId: string,
  userId: string,
  notes?: string,
  evidence?: EmbeddedEvidence[]
): Promise<{ success: boolean; error: string | null }> => {
  try {
    const tradeRef = doc(db, COLLECTIONS.TRADES, tradeId);
    const tradeSnap = await getDoc(tradeRef);
    
    if (!tradeSnap.exists()) {
      return { success: false, error: 'Trade not found' };
    }
    
    const trade = tradeSnap.data() as Trade;
    
    if (trade.status !== 'in-progress') {
      return { success: false, error: 'Trade must be in progress to request completion' };
    }
    
    // Verify user is a participant
    if (userId !== trade.creatorId && userId !== trade.participantId) {
      return { success: false, error: 'Only trade participants can request completion' };
    }
    
    // Update trade status
    await updateDoc(tradeRef, {
      status: 'pending_confirmation',
      completionRequestedBy: userId,
      completionRequestedAt: Timestamp.now(),
      completionNotes: notes || '',
      completionEvidence: evidence || [],
      updatedAt: Timestamp.now()
    });
    
    // Determine recipient for notification
    const recipientId = userId === trade.creatorId ? trade.participantId : trade.creatorId;
    
    // Create notification
    if (recipientId) {
      await createTradeConfirmationNotification(
        recipientId,
        tradeId,
        trade.title,
        'requested'
      );
    }
    
    return { success: true, error: null };
  } catch (err: any) {
    console.error('Error requesting trade completion:', err);
    return { success: false, error: err.message };
  }
};

// Confirm trade completion
export const confirmTradeCompletion = async (
  tradeId: string,
  userId: string
): Promise<{ success: boolean; error: string | null }> => {
  try {
    const tradeRef = doc(db, COLLECTIONS.TRADES, tradeId);
    const tradeSnap = await getDoc(tradeRef);
    
    if (!tradeSnap.exists()) {
      return { success: false, error: 'Trade not found' };
    }
    
    const trade = tradeSnap.data() as Trade;
    
    if (trade.status !== 'pending_confirmation') {
      return { success: false, error: 'Trade is not pending confirmation' };
    }
    
    // Verify user is a participant
    if (userId !== trade.creatorId && userId !== trade.participantId) {
      return { success: false, error: 'Only trade participants can confirm completion' };
    }
    
    // Verify user is not the one who requested completion
    if (userId === trade.completionRequestedBy) {
      return { success: false, error: 'You cannot confirm your own completion request' };
    }
    
    // Update trade status
    await updateDoc(tradeRef, {
      status: 'completed',
      completionConfirmedAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    
    // Create notifications for both users
    await Promise.all([
      createTradeConfirmationNotification(
        trade.creatorId,
        tradeId,
        trade.title,
        'confirmed'
      ),
      trade.participantId ? 
        createTradeConfirmationNotification(
          trade.participantId,
          tradeId,
          trade.title,
          'confirmed'
        ) : Promise.resolve()
    ]);
    
    // Award XP to both users
    if (trade.completionRequestedAt) {
      const now = Timestamp.now();
      const requestTime = trade.completionRequestedAt;
      
      // Check if confirmation was prompt (within 24 hours)
      const isPrompt = (now.seconds - requestTime.seconds) < 86400; // 24 hours in seconds
      
      await Promise.all([
        awardTradeCompletionXP(trade.creatorId, isPrompt),
        trade.participantId ? 
          awardTradeCompletionXP(trade.participantId, isPrompt) : Promise.resolve()
      ]);
    }
    
    return { success: true, error: null };
  } catch (err: any) {
    console.error('Error confirming trade completion:', err);
    return { success: false, error: err.message };
  }
};

// Request changes to trade
export const requestTradeChanges = async (
  tradeId: string,
  userId: string,
  reason: string
): Promise<{ success: boolean; error: string | null }> => {
  try {
    const tradeRef = doc(db, COLLECTIONS.TRADES, tradeId);
    const tradeSnap = await getDoc(tradeRef);
    
    if (!tradeSnap.exists()) {
      return { success: false, error: 'Trade not found' };
    }
    
    const trade = tradeSnap.data() as Trade;
    
    if (trade.status !== 'pending_confirmation') {
      return { success: false, error: 'Trade is not pending confirmation' };
    }
    
    // Verify user is a participant
    if (userId !== trade.creatorId && userId !== trade.participantId) {
      return { success: false, error: 'Only trade participants can request changes' };
    }
    
    // Verify user is not the one who requested completion
    if (userId === trade.completionRequestedBy) {
      return { success: false, error: 'You cannot request changes to your own completion request' };
    }
    
    // Create change request
    const changeRequest: ChangeRequest = {
      id: uuidv4(),
      requestedBy: userId,
      requestedAt: Timestamp.now(),
      reason,
      status: 'pending'
    };
    
    const changeRequests = trade.changeRequests || [];
    
    // Update trade status
    await updateDoc(tradeRef, {
      status: 'in-progress',
      changeRequests: [...changeRequests, changeRequest],
      updatedAt: Timestamp.now()
    });
    
    // Create notification for the other user
    const recipientId = userId === trade.creatorId ? trade.participantId : trade.creatorId;
    
    if (recipientId) {
      await createTradeConfirmationNotification(
        recipientId,
        tradeId,
        trade.title,
        'changes_requested'
      );
    }
    
    return { success: true, error: null };
  } catch (err: any) {
    console.error('Error requesting changes:', err);
    return { success: false, error: err.message };
  }
};
```

## Integration Points

### Evidence Embed System Integration

The Trade Lifecycle System integrates with the Evidence Embed System in two key areas:

1. **Proposal Submission**:
   - Proposers can attach portfolio evidence to their proposals
   - Uses the EvidenceSubmitter component from the Evidence Embed System
   - Evidence is stored using the EmbeddedEvidence interface

2. **Completion Requests**:
   - Users can submit evidence when requesting completion
   - Evidence is displayed when reviewing completion requests
   - Uses the EvidenceGallery component to display multiple evidence items

### Notification System Integration

The Trade Lifecycle System creates notifications at key points:

1. **Proposal Notifications**:
   - New proposal received
   - Proposal accepted
   - Proposal rejected

2. **Confirmation Notifications**:
   - Completion requested
   - Completion confirmed
   - Changes requested
   - Reminder notifications

### Gamification Integration

The Trade Lifecycle System awards XP and achievements:

1. **XP Awards**:
   - Points for creating trades
   - Points for submitting proposals
   - Points for completing trades
   - Bonus points for prompt confirmation

2. **Achievements**:
   - "Trade Master" for completing multiple trades
   - "Quick Responder" for prompt confirmations
   - "Reliable Trader" for completing trades without change requests

## Implementation Strategy

To implement the complete Trade Lifecycle System effectively, we'll use a phased approach:

### Phase 1: Trade Proposal System (Weeks 1-3)

1. **Week 1: Database & Core Services**
   - Update Trade interface with new fields
   - Create TradeProposal interface and subcollection
   - Implement core service functions for proposals
   - Set up Firebase indexes

2. **Week 2: UI Components - Creation & Proposals**
   - Enhance trade creation form with structured skills
   - Build proposal submission form
   - Create proposal dashboard for trade creators
   - Implement proposal card components

3. **Week 3: Proposal Flow Integration**
   - Connect proposal acceptance to trade status
   - Implement notification system for proposals
   - Add participant tracking to trades
   - Test the complete proposal flow

### Phase 2: Trade Confirmation System (Weeks 4-6)

4. **Week 4: Confirmation Database & Services**
   - Implement completion request services
   - Create change request functionality
   - Set up confirmation status tracking
   - Integrate with Evidence Embed System

5. **Week 5: Confirmation UI Components**
   - Build completion request interface
   - Create confirmation review components
   - Implement change request form
   - Update trade detail page with dynamic sections

6. **Week 6: Auto-Resolution & Notifications**
   - Implement reminder notifications
   - Create auto-completion functionality
   - Set up Cloud Functions for scheduled tasks
   - Test the complete confirmation flow

### Phase 3: Integration & Refinement (Weeks 7-8)

7. **Week 7: Gamification & User Experience**
   - Connect to XP system
   - Implement achievements and badges
   - Enhance user dashboard with trade status
   - Add progress visualization

8. **Week 8: Testing & Deployment**
   - Comprehensive testing of the complete lifecycle
   - Fix any issues or edge cases
   - Performance optimization
   - Documentation and deployment

## Technical Considerations

### Performance Optimization

1. **Query Optimization**:
   - Create proper indexes for all queries
   - Use subcollections for proposals and evidence
   - Implement pagination for proposal lists

2. **Batch Operations**:
   - Use batch writes for multi-document updates
   - Implement transactions for critical operations

### Security Rules

1. **Trade Access Control**:
   - Only creator can update trade details
   - Only participants can request/confirm completion
   - Public read access for open trades

2. **Proposal Security**:
   - Only creator can accept/reject proposals
   - Users can only see their own proposals
   - Users can only submit one proposal per trade

### Error Handling

1. **Graceful Degradation**:
   - Handle network errors with retry mechanisms
   - Provide clear error messages to users
   - Implement fallback UI for failed operations

2. **Data Validation**:
   - Validate all inputs on client and server
   - Ensure proper status transitions
   - Prevent duplicate operations

### Mobile Considerations

1. **Responsive Design**:
   - Optimize all components for mobile
   - Simplify proposal dashboard for small screens
   - Use touch-friendly controls

2. **Offline Support**:
   - Implement offline capabilities where possible
   - Queue operations for when connection is restored
   - Cache critical data for offline viewing

---

This comprehensive Trade Lifecycle System creates a seamless experience from trade creation to completion, formalizing the proposal process and ensuring fair, transparent trade confirmation. By integrating with the Evidence Embed System and implementing proper gamification, it encourages positive user behavior and builds trust in the platform.
