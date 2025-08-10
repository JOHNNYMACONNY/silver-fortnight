# TypeScript Integration Fixes

## Overview

This document outlines the steps to resolve TypeScript errors and interface mismatches in the TradeYa application. These fixes will ensure type safety and proper integration between the Firestore service layer and frontend components.

## Recent Fixes Applied

### TradeConfirmationForm Test File Compilation Errors - ✅ RESOLVED

**Date:** Latest update  
**File:** `src/components/features/trades/__tests__/TradeConfirmationForm.test.tsx`  
**Status:** Fixed

#### Issues Resolved:

1. **AuthContextType Interface Mismatch**
   - **Problem:** Mock was missing required properties (`signInWithEmail`, `signInWithGoogle`, etc.) and included non-existent ones (`signUp`, `updateUserProfile`)
   - **Solution:** Updated mock to match the actual `AuthContextType` interface from `src/AuthContext.tsx`:
   ```typescript
   mockUseAuth.mockReturnValue({
     user: mockCurrentUser,
     currentUser: mockCurrentUser,
     loading: false,
     error: null,
     signIn: vi.fn(),
     signInWithEmail: vi.fn(),
     signInWithGoogle: vi.fn(),
     signOut: vi.fn(),
     logout: vi.fn(),
   });
   ```

2. **ServiceResult Interface Type Error**
   - **Problem:** `mockConfirmTradeCompletion.mockResolvedValue()` was missing required `data` property
   - **Solution:** Updated all ServiceResult mocks to include both required properties:
   ```typescript
   mockConfirmTradeCompletion.mockResolvedValue({ data: undefined, error: null });
   ```

3. **TradeSkill Level Type Mismatch**
   - **Problem:** Skill levels were using generic strings instead of typed enum values
   - **Solution:** Updated skill level assignments with proper type assertions:
   ```typescript
   offeredSkills: [{ name: 'React', level: 'intermediate' as const }],
   requestedSkills: [{ name: 'Python', level: 'beginner' as const }],
   ```

#### Key Learning Points:

- **Interface Consistency:** Always ensure test mocks match the actual interface definitions
- **ServiceResult Pattern:** All service functions return `{ data: T | null, error: Error | null }` structure
- **Type Safety:** Use `as const` assertions for string literal types to maintain type safety

#### Files Modified:
- `src/components/features/trades/__tests__/TradeConfirmationForm.test.tsx` - Test file with resolved TypeScript errors

#### Related Interfaces

- `AuthContextType` in `src/AuthContext.tsx`
- `ServiceResult<T>` in `src/services/firestore.ts`
- `TradeSkill` with level enum in `src/services/firestore.ts`

#### Validation Completed

✅ **TypeScript Compilation:** All compilation errors resolved  
✅ **Interface Consistency:** Mocks now match actual interfaces  
✅ **Type Safety:** Proper type assertions applied  
⚠️ **Test Execution:** Test runner configuration issues remain (separate from TypeScript fixes)

#### Next Steps

1. **Run Tests:** Resolve Vitest/Jest configuration conflicts
2. **Code Review:** Verify all interface changes across the codebase
3. **Integration Testing:** Test TradeConfirmationForm component in real scenarios
4. **Documentation Updates:** Update any component documentation that references the changed interfaces

## Table of Contents

1. [Evidence System Fixes](#evidence-system-fixes)
2. [Service Result Type Fixes](#service-result-type-fixes)
3. [Trade Skills Rendering](#trade-skills-rendering)
4. [Function Parameter Alignment](#function-parameter-alignment)
5. [Interface Updates](#interface-updates)
6. [Testing Plan](#testing-plan)

## Evidence System Fixes

### 1. Update EmbeddedEvidence Interface

- Location: `src/utils/embedUtils.ts`
- Priority: High
- Impact: High

#### Steps to Resolve Interface Mismatches

1. Update EmbeddedEvidence interface in `src/utils/embedUtils.ts`:

    ```typescript
    interface EmbeddedEvidence {
      id: string;
      userId: string;
      userName?: string | null;
      userPhotoURL?: string | null;
      createdAt: any;
      title: string;
      description: string;
      embedUrl: string;
      embedCode?: string | null;
      embedType: 'image' | 'video' | 'audio' | 'document' | 'code' | 'design' | 'other';
      embedService: string;
      thumbnailUrl?: string | null;
      originalUrl: string;
      [key: string]: any;
    }
    ```

2. Update components using EmbeddedEvidence:

    ```typescript
    // In TradeConfirmationForm.tsx, TradeDetailPage.tsx, TradeCompletionForm.tsx:
    <EvidenceGallery
      evidence={evidence.map(e => ({
        ...e,
        embedUrl: e.url,
        embedType: e.type,
        embedService: 'legacy',
        originalUrl: e.url
      }))}
    />
    ```

3. Update evidence submission and confirmation:

    ```typescript
    // In TradeCompletionForm.tsx, TradeConfirmationForm.tsx
    const handleSubmit = async () => {
      const evidenceWithMetadata = evidence.map(e => ({
        ...e,
        embedUrl: e.url,
        embedType: inferTypeFromUrl(e.url),
        embedService: detectServiceFromUrl(e.url),
        originalUrl: e.url
      }));
      
      await submitTradeEvidence(tradeId, userId, {
        evidence: evidenceWithMetadata,
        notes,
        timestamp: Timestamp.now()
      }, isCreator);
    };
    ```

## Service Result Type Fixes

### 1. Update Component Destructuring

Update all components using ServiceResult to properly handle data/error pattern:

```typescript
// ReviewsTab.tsx
const { data: reviews, error } = await getUserReviews(userId);

// TradeProposalDashboard.tsx
const { data: proposals, error } = await getTradeProposals(tradeId);

// ConnectionsPage.tsx
const { data: connections, error } = await getConnections(userId);
```

### 2. Replace Success Property Usage

```typescript
// TradeCompletionForm.tsx
const handleSubmit = async () => {
  const { error } = await requestTradeCompletion(tradeId, userId, notes, evidence);
  if (error) {
    setError(error.message);
    return;
  }
  onSuccess();
};

// TradeConfirmationForm.tsx
const handleConfirm = async () => {
  const { error } = await confirmTradeCompletion(tradeId);
  if (error) {
    setError(error.message);
    return;
  }
  onSuccess();
};
```

## Trade Skills Rendering

### 1. Create TradeSkillDisplay Component

```typescript
// src/components/features/trades/TradeSkillDisplay.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { TradeSkill } from '../../services/firestore';

interface TradeSkillDisplayProps {
  skill: TradeSkill;
  className?: string;
}

export const TradeSkillDisplay: React.FC<TradeSkillDisplayProps> = ({ skill, className }) => (
  <motion.span 
    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}
    whileHover={{ scale: 1.05 }}
  >
    {skill.name} <span className="ml-1 text-gray-500">({skill.level})</span>
  </motion.span>
);
```

### 2. Update Components Using Trade Skills

```typescript
// TradeCard.tsx
import { TradeSkillDisplay } from './TradeSkillDisplay';

// Replace:
{skill}

// With:
<TradeSkillDisplay skill={skill} />

// Do this in:
// - TradeCard.tsx
// - TradeDetailPage.tsx
// - TradeProposalForm.tsx
```

### 3. Handling TradeSkill Data Types and Mappings

- **Canonical Type**: Ensure the `Trade` interface (primarily in `src/services/firestore.ts`) defines `offeredSkills` and `requestedSkills` as `TradeSkill[]`. See [Interface Updates](#3-standardize-trade-interface-for-skills).
- **Data Fetching**: Expect skill data from Firestore to conform to `TradeSkill[]`.
- **Form Input to `TradeSkill[]`**: When saving or updating trades, map form inputs (e.g., comma-separated strings for skills) to the `TradeSkill[]` type. `TradeDetailPage.tsx` demonstrates this for `updateTrade`.

    ```typescript
    // Example: Mapping string input from a form to TradeSkill[]
    const offeringStringFromForm = "React, Node.js, UX Design";
    const offeredSkills: TradeSkill[] = offeringStringFromForm
      .split(',')
      .map(name => ({ name: name.trim(), level: 'intermediate' /* default or determined level */ }));
    
    // ... then use offeredSkills in the updateTrade payload
    await updateTrade(tradeId, { ...otherUpdates, offeredSkills });
    ```

- **`TradeSkill[]` to Simpler Types for Components**: Some child components (like `TradeProposalForm`) might expect a simpler array (e.g., `string[]` of skill names). Map `TradeSkill[]` from the main `trade` object accordingly.

    ```typescript
    // Example: Mapping TradeSkill[] to string[] for TradeProposalForm props
    // In TradeDetailPage.tsx, when rendering TradeProposalForm:
    const offeredSkillNames: string[] = trade.offeredSkills ? trade.offeredSkills.map(skill => skill.name) : [];
    // <TradeProposalForm offeredSkills={offeredSkillNames} ... />
    ```

- **Display Fallbacks**: When displaying skills, if `TradeSkill[]` is not directly available (e.g., legacy data with string-based `offering` / `seeking` fields), provide a fallback to parse these strings into `TradeSkill` objects for use with `TradeSkillDisplay`. `TradeDetailPage.tsx` implements this.

## Function Parameter Alignment

### 1. Update Service Function Calls

```typescript
// TradeProposalForm.tsx
const handleSubmit = async () => {
  const proposalData = {
    tradeId,
    userId: currentUser.uid,
    userName: currentUser.displayName || '',
    userPhotoURL: currentUser.photoURL || '',
    offeredSkills,
    requestedSkills,
    message,
    timeframe,
    availability
  };

  const { data: proposalId, error } = await createTradeProposal(proposalData);
};

// MessageContext.tsx
const sendMessage = async (content: string) => {
  const { error } = await createMessage(
    conversationId,
    {
      senderId: currentUser.uid,
      senderName: currentUser.displayName || 'Anonymous', // Ensure senderName and avatar are provided
      senderAvatar: currentUser.photoURL || undefined,
      content,
      read: false
      // type: 'text', // if applicable
      // status: 'sent' // if applicable
    }
  );
};
```

### 2. Align `createConversation` Parameters

- Ensure calls to `createConversation` pass a single object argument containing `participants` (an array of user identifiers with names) and `metadata` (an object with conversation context, like `tradeId`). `TradeDetailPage.tsx` was updated to follow this.

    ```typescript
    // Example: Correct createConversation call in TradeDetailPage.tsx
    const { data: conversationId, error } = await createConversation({
      participants: [
        { id: currentUser.uid, name: currentUser.displayName || 'Current User' },
        { id: tradeOwnerId, name: tradeCreator?.displayName || 'Trade Owner' }
      ],
      metadata: {
        tradeId: trade.id,
        tradeName: trade.title,
        conversationType: 'direct' // Or other relevant type like 'trade_proposal'
      }
    });
    ```

## Interface Updates

### 1. Update Review Interface

```typescript
// src/services/firestore.ts
export interface Review {
  id?: string;
  reviewerId: string;
  reviewerName: string;
  targetId: string;
  rating: number;
  content: string;
  comment: string;
  tradeId: string;
  createdAt: any;
}

// Update review creation
const handleSubmitReview = async (data: Omit<Review, 'id' | 'createdAt'>) => {
  const { error } = await createReview(data);
};
```

### 2. Update NotificationData Interface

```typescript
// src/services/firestore.ts
export interface NotificationData extends Omit<Notification, 'id'> {
  content: string;
  read: boolean;
  createdAt: any;
  userId: string;
  type: 'message' | 'trade_interest' | 'trade_completed' | 'review' | 'project' | 'challenge' | 'system' | 'trade';
  title: string;
  data?: {
    tradeId?: string;
    projectId?: string;
    challengeId?: string;
    conversationId?: string;
    url?: string;
  };
}
```

### 3. Standardize Trade Interface for Skills

- **Location**: `src/services/firestore.ts` (for the canonical `Trade` type, often named `BaseTrade` or `Trade`).
- **Priority**: High
- **Impact**: High (affects all trade-related data handling)

#### Steps

1. Define or ensure `TradeSkill` interface is robust:

    ```typescript
    // src/services/firestore.ts
    export interface TradeSkill {
      name: string;
      level: string; // e.g., 'beginner', 'intermediate', 'expert', 'proficient'
      // id?: string; // If skills are separate documents/entities linked by ID
    }
    ```

2. Update the main `Trade` interface to use `TradeSkill[]` for skill-related fields. It's recommended to make these non-optional if skills are a core part of a trade, or explicitly `TradeSkill[] | undefined` if they can be absent.

    ```typescript
    // src/services/firestore.ts
    export interface Trade { // Or BaseTrade
      id: string;
      title: string;
      description: string;
      // ... other properties like userId, userName, category, status, createdAt ...
      
      offeredSkills: TradeSkill[]; // Consistently use TradeSkill array
      requestedSkills: TradeSkill[]; // Consistently use TradeSkill array
      
      // offering?: string; // Consider deprecating if fully migrating to offeredSkills
      // seeking?: string;  // Consider deprecating if fully migrating to requestedSkills
      
      images?: string[];
      // ... other new fields like creatorId, participantId, evidence fields, etc.
    }
    ```

3. **Component Alignment**: All frontend components (e.g., `TradeDetailPage.tsx`, `TradeCard.tsx`, forms) and service interactions must align with this `TradeSkill[]` structure. This includes:
    - Type assertions or mappings when fetching data if Firestore data might not yet conform.
    - Transforming form inputs (often strings) into `TradeSkill[]` before sending data to Firestore.
    - Adapting data from `TradeSkill[]` to simpler formats (e.g., `string[]` of names) if required by specific UI components.

## Testing Plan

### 1. Unit Tests

Add the following test files:

```typescript
// src/components/features/trades/__tests__/TradeSkillDisplay.test.tsx
import { render, screen } from '@testing-library/react';
import { TradeSkillDisplay } from '../TradeSkillDisplay';

describe('TradeSkillDisplay', () => {
  it('renders skill name and level', () => {
    const skill = { name: 'React', level: 'expert' };
    render(<TradeSkillDisplay skill={skill} />);
    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('(expert)')).toBeInTheDocument();
  });
});

// src/services/__tests__/firestore.test.ts
describe('Evidence handling', () => {
  it('correctly maps legacy evidence to new format', async () => {
    const legacyEvidence = {
      id: '1',
      type: 'image',
      url: 'http://example.com/image.jpg'
    };
    
    const result = await submitTradeEvidence('trade1', 'user1', {
      evidence: [legacyEvidence],
      notes: 'Test',
      timestamp: Timestamp.now()
    }, true);
    
    expect(result.error).toBeNull();
  });
});
```

### 2. Integration Tests

```typescript
// src/integration-tests/trade-flow.test.ts
describe('Trade completion flow', () => {
  it('handles evidence submission and confirmation', async () => {
    // Setup
    const trade = await createTrade({...});
    const evidence = [{
      id: '1',
      embedUrl: 'http://example.com/image.jpg',
      embedType: 'image',
      embedService: 'custom',
      originalUrl: 'http://example.com/image.jpg'
    }];

    // Submit evidence
    const { error: submitError } = await submitTradeEvidence(
      trade.id,
      'user1',
      {
        evidence,
        notes: 'Test completion',
        timestamp: Timestamp.now()
      },
      true
    );
    expect(submitError).toBeNull();

    // Confirm completion
    const { error: confirmError } = await confirmTradeCompletion(trade.id);
    expect(confirmError).toBeNull();

    // Verify final state
    const { data: updatedTrade } = await getTrade(trade.id);
    expect(updatedTrade?.status).toBe('completed');
  });
});
```

## Implementation Order

1. Start with Evidence System Fixes
    - They affect multiple components
    - Required for trade completion flow

2. Apply Service Result Type Fixes
    - These changes touch many components
    - Critical for error handling

3. Implement Trade Skills Rendering
    - Create TradeSkillDisplay component
    - Update all trade-related components

4. Fix Function Parameters
    - Update service function signatures
    - Update all calling components

5. Update Interfaces
    - Apply Review interface changes
    - Update NotificationData usage

## Validation Steps

After implementing each section:

1. Run type checking:

    ```bash
    npm run type-check
    ```

2. Run unit tests:

    ```bash
    npm test
    ```

3. Run integration tests:

    ```bash
    npm run test:integration
    ```

4. Manual testing checklist:
    - [ ] Create a new trade with evidence
    - [ ] Submit a trade proposal
    - [ ] Complete a trade with evidence
    - [ ] Submit a review
    - [ ] Check notifications
    - [ ] Verify trade skills display

## Future Considerations

1. Consider adopting io-ts or zod for runtime type validation
2. Add automated type checking to CI pipeline
3. Consider generating TypeScript types from Firestore rules
4. Add error boundary components for evidence rendering
5. Implement proper error handling for service results
6. Add loading states for async operations
7. Consider adding retry logic for failed operations
8. Implement proper date handling with proper types
9. Add proper null checking throughout the application
10. Consider using TypeScript template literal types for string enums
