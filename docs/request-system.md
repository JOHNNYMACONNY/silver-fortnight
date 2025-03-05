# Trade and Project Request System

## Overview

The request system manages trade invitations and project position applications. It provides a structured way to:
- Send trade invitations to users
- Apply for project positions
- Manage incoming and outgoing requests
- Integrate with the messaging system for contextual conversations

## Features

- **Trade Requests**
  - Send trade invitations to users
  - Accept/decline trade invitations
  - Attach messages to requests
  - Optional expiration dates
  - Real-time status updates

- **Project Position Requests**
  - Apply for project positions
  - Match required skills
  - Include relevant skills
  - Accept/decline applications
  - Position-specific messaging

- **Request Management**
  - View sent and received requests
  - Track request status
  - Real-time notifications
  - Automatic conversation creation
  - Request history

## Components

### RequestModal
A reusable modal component for sending trade invitations or project applications.

```typescript
// Trade request example
<RequestModal
  isOpen={true}
  onClose={handleClose}
  currentUserId="user123"
  recipientId="user456"
  mode="trade"
  type="invitation"
  tradeId="trade123"
  tradeName="Trading Card Collection"
/>

// Project request example
<RequestModal
  isOpen={true}
  onClose={handleClose}
  currentUserId="user123"
  recipientId="user456"
  mode="project"
  type="application"
  projectId="project123"
  projectName="Mobile App Development"
  positionId="pos123"
  positionName="Frontend Developer"
  requiredSkills={["React Native", "TypeScript"]}
/>
```

### RequestManager
A component for managing requests, showing both sent and received requests with actions.

```typescript
<RequestManager
  currentUserId="user123"
  mode="trade" // or "project"
/>
```

## Data Model

### Trade Request
```typescript
interface TradeRequest {
  id: string;
  senderId: string;
  recipientId: string;
  tradeId: string;
  tradeName: string;
  status: 'pending' | 'accepted' | 'declined';
  type: 'application' | 'invitation';
  createdAt: Timestamp;
  message?: string;
  expiresAt?: Timestamp;
}
```

### Project Position Request
```typescript
interface ProjectPositionRequest {
  id: string;
  senderId: string;
  recipientId: string;
  projectId: string;
  projectName: string;
  positionId: string;
  positionName: string;
  status: 'pending' | 'accepted' | 'declined';
  type: 'application' | 'invitation';
  createdAt: Timestamp;
  message?: string;
  expiresAt?: Timestamp;
  requiredSkills?: string[];
  proposedSkills?: string[];
}
```

## Request Management Functions

### Create Requests
```typescript
// Send a trade request
const tradeRequestId = await createTradeRequest(
  senderId,
  recipientId,
  tradeId,
  tradeName,
  'invitation',
  message,
  expiryDate
);

// Send a project request
const projectRequestId = await createProjectRequest(
  senderId,
  recipientId,
  projectId,
  projectName,
  positionId,
  positionName,
  'application',
  requiredSkills,
  proposedSkills,
  message,
  expiryDate
);
```

### Manage Requests
```typescript
// Update request status
await updateRequestStatus(requestId, 'tradeRequests', 'accepted');

// Get user's requests
const requests = await getUserRequests(userId, 'tradeRequests');

// Mark request as viewed
await markRequestViewed(requestId, 'tradeRequests');
```

## Integration with Messaging

### Request Notification
```typescript
interface RequestNotification {
  id: string;
  requestId: string;
  recipientId: string;
  type: 'trade_request' | 'project_request';
  read: boolean;
  createdAt: Timestamp;
}
```

### Request Fields
Additional fields in requests:
- `notificationSent`: boolean - Tracks if notification was created
- `viewedAt`: Timestamp - When recipient first viewed the request
- `statusUpdatedAt`: Timestamp - When status was last updated
- `statusUpdatedBy`: string - User ID who updated status

When a request is created, a context-specific conversation is automatically created between the sender and recipient. This allows for:
- Trade-specific discussions
- Position-related questions
- Status updates
- File sharing within context

The conversation is tagged with:
- Trade/Project context
- Request status
- Participant roles

## Data Migration

### Overview
The migration system moves existing trade participants and project applicants to the new request system. It ensures:
- Atomic updates using Firestore batch operations
- Error tracking and reporting
- No duplicate migrations
- Conversation context preservation

### Testing Coverage
The migration system is extensively tested:
- Batch atomicity and rollback
- Error handling and recovery
- Partial failure scenarios
- Request notification creation
- Field validation
- Context conversation creation
- Progress tracking and logging

### Migration Results
The migration script returns detailed results:
```typescript
interface Migration {
  totalProcessed: number;
  successful: number;
  failed: number;
  errors: Error[];
}
```

### Running Migrations

The migration process is split into several steps to ensure data consistency. There are two main ways to run the migrations:

#### Option 1: Run All Migrations (Recommended)
To run all migrations in the correct sequence:
```bash
npm run migrate:all
```
This will execute:
1. Conversation migrations (`migrate:conversations`)
   - Update existing conversations
   - Consolidate duplicate conversations
2. Request system migration (`migrate:requests`)

#### Option 2: Run Individual Steps
If you need more control, you can run each step separately:

1. Update and consolidate conversations:
```bash
npm run migrate:conversations
```
This combines two sub-steps that can also be run individually if needed:
- `npm run migrate:update-conversations`: Updates conversation types and adds context
- `npm run migrate:consolidate-conversations`: Merges duplicate conversations

2. Migrate to the request system:
```bash
npm run migrate:requests
```

Each step performs the following:

**Conversation Updates:**
- Add proper conversation types (direct/trade/project)
- Add context IDs and names
- Add position information where applicable
- Preserve existing messages and metadata

**Conversation Consolidation:**
- Find conversations between the same participants
- Merge conversations with same context
- Preserve all messages and metadata
- Keep the most active conversation as primary

**Request System Migration:**
- Migrate pending trade participants to trade requests
- Migrate pending project applicants to project requests
- Create context-specific conversations
- Update existing records with migration status

### Migration Validation
After running the migrations:
1. Check migration logs for any errors or warnings
2. Verify request statuses in RequestManager
3. Ensure conversations are properly consolidated
4. Test creating new requests
5. Verify notifications for migrated requests

### Rollback Plan
If issues are encountered:
1. Stop the migration process
2. Review error logs
3. Fix identified issues
4. Re-run specific migration step
5. Validate changes

## Firebase Configuration

### Required Firestore Indexes
Required composite indexes for the request system:

```json
{
  "collectionGroup": "tradeRequests",
  "fields": [
    { "fieldPath": "senderId", "order": "ASCENDING" },
    { "fieldPath": "createdAt", "order": "DESCENDING" }
  ]
},
{
  "collectionGroup": "tradeRequests",
  "fields": [
    { "fieldPath": "recipientId", "order": "ASCENDING" },
    { "fieldPath": "createdAt", "order": "DESCENDING" }
  ]
},
{
  "collectionGroup": "projectRequests",
  "fields": [
    { "fieldPath": "senderId", "order": "ASCENDING" },
    { "fieldPath": "createdAt", "order": "DESCENDING" }
  ]
},
{
  "collectionGroup": "projectRequests",
  "fields": [
    { "fieldPath": "recipientId", "order": "ASCENDING" },
    { "fieldPath": "createdAt", "order": "DESCENDING" }
  ]
}
```

### Security

Firestore security rules ensure:
- Only authenticated users can create requests
- Users can only access their own requests
- Only recipients can update request status
- Request data validation
- Proper access control for notifications

## Best Practices

1. **Creating Requests**
   - Always include relevant context (trade/project details)
   - Set appropriate expiration dates
   - Provide clear messages

2. **Managing Requests**
   - Respond to requests promptly
   - Use the messaging system for clarifications
   - Keep request messages concise

3. **UI Integration**
   - Show clear status indicators
   - Provide easy access to related conversations
   - Display relevant skills and requirements

4. **Error Handling**
   - Handle expired requests gracefully
   - Provide clear error messages
   - Implement retry mechanisms

## Future Enhancements

- Request templates
- Batch request operations
- Advanced filtering and sorting
- Request analytics
- Enhanced notification options
