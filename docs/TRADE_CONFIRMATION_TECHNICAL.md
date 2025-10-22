# Trade Confirmation System - Technical Implementation

## Overview
This document outlines the technical implementation details for integrating the two-sided trade confirmation system into the existing TradeYa codebase.

> **Note:** This document has been superseded by the more comprehensive [Trade Lifecycle System](docs/TRADE_LIFECYCLE_SYSTEM.md) document, which integrates both the Trade Proposal Flow and the Trade Confirmation System into a cohesive end-to-end experience. Please refer to that document for the most up-to-date implementation plan.

## Technical Requirements

### Dependencies
- Firebase Firestore (existing)
- Cloudinary for evidence uploads (existing)
- React components for UI (existing)

## Database Schema Changes

### Trade Interface Update
```typescript
// Update existing Trade interface in src/services/firestore.ts
export interface Trade {
  // Existing fields
  id: string;
  title: string;
  description: string;
  offeredSkills?: string[];
  requestedSkills?: string[];
  category?: string;
  creatorId: string;
  status: 'open' | 'in-progress' | 'pending_confirmation' | 'completed' | 'cancelled' | 'disputed';
  images?: string[];
  createdAt: any;
  updatedAt: any;

  // New fields
  participantId?: string;  // ID of the non-creator participant
  participantName?: string;
  participantPhotoURL?: string;
  completionRequestedBy?: string;  // User ID who requested completion
  completionRequestedAt?: any;  // Timestamp
  completionConfirmedAt?: any;  // Timestamp
  completionEvidence?: TradeEvidence[];  // Array of evidence items
  completionNotes?: string;  // Notes about completion
  changeRequests?: ChangeRequest[];  // History of change requests
  autoCompletedAt?: any;  // Timestamp if auto-completed
}

// New interfaces
export interface TradeEvidence {
  id: string;
  userId: string;  // Who uploaded it
  fileURL: string;  // URL to the file
  fileType: string;  // MIME type
  description?: string;  // Optional description
  uploadedAt: any;  // Timestamp
}

export interface ChangeRequest {
  id: string;
  requestedBy: string;  // User ID
  requestedAt: any;  // Timestamp
  reason: string;  // Why changes are needed
  status: 'pending' | 'addressed' | 'rejected';
  resolvedAt?: any;  // Timestamp when addressed/rejected
}
```

### Firestore Indexes
Create the following indexes in Firebase:
- Collection: `trades`, Fields: `status` (ascending), `createdAt` (descending)
- Collection: `trades`, Fields: `participantId` (ascending), `status` (ascending)
- Collection: `trades`, Fields: `creatorId` (ascending), `status` (ascending)
- Collection: `trades`, Fields: `completionRequestedAt` (ascending), `status` (ascending)

## Service Layer Implementation

### Trade Service Updates
Add the following functions to `src/services/firestore.ts`:

```typescript
// Request trade completion
export const requestTradeCompletion = async (
  tradeId: string,
  userId: string,
  notes?: string,
  evidence?: TradeEvidence[]
) => {
  return await updateDocument(COLLECTIONS.TRADES, tradeId, {
    status: 'pending_confirmation',
    completionRequestedBy: userId,
    completionRequestedAt: Timestamp.now(),
    completionNotes: notes || '',
    completionEvidence: evidence || [],
    updatedAt: Timestamp.now()
  });
};

// Confirm trade completion
export const confirmTradeCompletion = async (tradeId: string) => {
  return await updateDocument(COLLECTIONS.TRADES, tradeId, {
    status: 'completed',
    completionConfirmedAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  });
};

// Request changes to trade
export const requestTradeChanges = async (
  tradeId: string,
  userId: string,
  reason: string
) => {
  const trade = await getDocument(COLLECTIONS.TRADES, tradeId);

  if (!trade) {
    return { error: { message: 'Trade not found' } };
  }

  const changeRequest = {
    id: uuidv4(),
    requestedBy: userId,
    requestedAt: Timestamp.now(),
    reason,
    status: 'pending'
  };

  const changeRequests = trade.changeRequests || [];

  return await updateDocument(COLLECTIONS.TRADES, tradeId, {
    status: 'in-progress',
    changeRequests: [...changeRequests, changeRequest],
    updatedAt: Timestamp.now()
  });
};

// Upload trade evidence
export const uploadTradeEvidence = async (
  file: File,
  tradeId: string,
  userId: string,
  description?: string
) => {
  try {
    // Upload to Cloudinary
    const { url, error } = await cloudinaryUploadImage(
      file,
      `trades/${tradeId}/evidence`
    );

    if (error || !url) {
      throw new Error(error || 'Failed to upload evidence');
    }

    // Create evidence object
    const evidence: TradeEvidence = {
      id: uuidv4(),
      userId,
      fileURL: url,
      fileType: file.type,
      description: description || '',
      uploadedAt: Timestamp.now()
    };

    return { evidence, error: null };
  } catch (err: any) {
    return { evidence: null, error: err.message };
  }
};
```

### Notification Service Updates
Add trade confirmation notification types to `src/services/notifications/notificationService.ts`:

```typescript
// Create a trade confirmation notification
export const createTradeConfirmationNotification = async (
  userId: string,
  tradeId: string,
  tradeName: string,
  action: 'requested' | 'confirmed' | 'changes_requested' | 'reminder'
): Promise<Notification> => {
  let title = '';
  let message = '';

  switch (action) {
    case 'requested':
      title = 'Trade Completion Requested';
      message = `A completion request has been submitted for trade "${tradeName}".`;
      break;
    case 'confirmed':
      title = 'Trade Completed';
      message = `The trade "${tradeName}" has been confirmed as completed.`;
      break;
    case 'changes_requested':
      title = 'Changes Requested';
      message = `Changes have been requested for trade "${tradeName}".`;
      break;
    case 'reminder':
      title = 'Pending Confirmation';
      message = `Don't forget to confirm completion for trade "${tradeName}".`;
      break;
  }

  return createNotification({
    userId,
    type: 'trade',
    title,
    message,
    data: {
      tradeId
    }
  });
};
```

## UI Component Implementation

### Trade Detail Page Updates
Update `src/pages/TradeDetailPage.tsx` to include:

1. Status display with new states
2. Completion request button for in-progress trades
3. Confirmation buttons for pending trades
4. Evidence upload component
5. Change request form

### Evidence Uploader Component
Create a new component at `src/components/features/trades/TradeEvidenceUploader.tsx`:

```typescript
import React, { useState } from 'react';
import { MultipleImageUploader } from '../uploads/MultipleImageUploader';
import { uploadTradeEvidence } from '../../../services/firestore';
import { useAuth } from '../../../AuthContext';
import { Button } from '../../ui/Button';
import { TextArea } from '../../ui/TextArea';

interface TradeEvidenceUploaderProps {
  tradeId: string;
  onEvidenceUploaded: (evidence: TradeEvidence) => void;
}

export const TradeEvidenceUploader: React.FC<TradeEvidenceUploaderProps> = ({
  tradeId,
  onEvidenceUploaded
}) => {
  const { currentUser } = useAuth();
  const [description, setDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelected = async (file: File) => {
    if (!currentUser) return;

    setIsUploading(true);
    setError(null);

    try {
      const { evidence, error } = await uploadTradeEvidence(
        file,
        tradeId,
        currentUser.uid,
        description
      );

      if (error) {
        throw new Error(error);
      }

      if (evidence) {
        onEvidenceUploaded(evidence);
        setDescription('');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to upload evidence');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Add Evidence</h3>

      <TextArea
        label="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Describe what this evidence shows..."
      />

      <MultipleImageUploader
        onImagesChange={(urls) => {
          // This component handles one file at a time
          // The actual upload is done in handleFileSelected
        }}
        folder={`trades/${tradeId}/evidence`}
        maxImages={1}
      />

      {error && (
        <p className="text-red-500 text-sm">{error}</p>
      )}
    </div>
  );
};
```

### Status Utils Update
Update `src/utils/statusUtils.ts` to include new status types:

```typescript
export const getTradeStatusClasses = (status: string): string => {
  switch (status?.toLowerCase()) {
    case 'open':
      return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300';
    case 'in-progress':
      return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300';
    case 'pending_confirmation':
      return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300';
    case 'completed':
      return 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300';
    case 'cancelled':
      return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300';
    case 'disputed':
      return 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300';
    default:
      return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300';
  }
};

export const formatStatus = (status: string): string => {
  switch (status?.toLowerCase()) {
    case 'open':
      return 'Open';
    case 'in-progress':
      return 'In Progress';
    case 'pending_confirmation':
      return 'Pending Confirmation';
    case 'completed':
      return 'Completed';
    case 'cancelled':
      return 'Cancelled';
    case 'disputed':
      return 'Disputed';
    default:
      return 'Unknown';
  }
};
```

## Auto-Resolution Implementation

Create a Cloud Function to handle auto-resolution of pending trades:

```typescript
// This would be implemented in a Firebase Cloud Function
exports.checkPendingTrades = functions.pubsub
  .schedule('every 24 hours')
  .onRun(async (context) => {
    const db = admin.firestore();

    // Get trades that have been pending for more than 14 days
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 14);

    const pendingTradesSnapshot = await db
      .collection('trades')
      .where('status', '==', 'pending_confirmation')
      .where('completionRequestedAt', '<', cutoffDate)
      .get();

    const batch = db.batch();

    pendingTradesSnapshot.forEach((doc) => {
      const tradeRef = db.collection('trades').doc(doc.id);
      batch.update(tradeRef, {
        status: 'completed',
        autoCompletedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // Create notifications for both users
      // (This would be handled separately or through another trigger)
    });

    await batch.commit();

    return null;
  });
```

## Gamification Integration

Update the XP system to award points for trade confirmations:

```typescript
// This would be added to the gamification service
export const awardTradeCompletionXP = async (userId: string, isPrompt: boolean) => {
  // Base XP for completing a trade
  let xpAmount = 50;

  // Bonus for prompt confirmation (within 24 hours)
  if (isPrompt) {
    xpAmount += 25;
  }

  return await addUserXP(userId, xpAmount, 'trade_completion');
};
```

## Implementation Timeline

### Phase 1: Core Database & Service Updates (Week 1)
- Update Trade interface
- Create new service functions
- Set up Firebase indexes

### Phase 2: UI Components (Week 2)
- Update TradeDetailPage
- Create TradeEvidenceUploader
- Update status utilities

### Phase 3: Notifications & Auto-Resolution (Week 3)
- Implement notification types
- Set up Cloud Functions for auto-resolution
- Test the complete flow

### Phase 4: Gamification Integration (Week 4)
- Connect to XP system
- Implement badges and achievements
- Final testing and deployment
