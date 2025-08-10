# Collaboration Role Management System

This document outlines the plan for implementing an enhanced role management system for collaborations in TradeYa. The system will handle role transitions, abandonments, replacements, and integrate with the existing confirmation system.

## Table of Contents

1. [Current System Analysis](#current-system-analysis)
2. [Enhanced Role States](#enhanced-role-states)
3. [Role Transition Workflows](#role-transition-workflows)
4. [Database Schema Updates](#database-schema-updates)
5. [UI/UX Implementation](#uiux-implementation)
6. [Integration Points](#integration-points)
7. [Gamification Integration](#gamification-integration)
8. [Implementation Strategy](#implementation-strategy)

## Current System Analysis

The existing collaboration system includes:

```typescript
export interface CollaborationRole {
  title: string;
  filled: boolean;
  skills: string[];
  assignedUserId?: string;
  assignedUserName?: string;
}

export interface Collaboration {
  id: string;
  title: string;
  description: string;
  creatorId: string;
  creatorName?: string;
  creatorPhotoURL?: string;
  roles: CollaborationRole[];
  status: string;
  createdAt: any;
  updatedAt: any;
}
```

Current limitations:
- Binary role state (filled/unfilled)
- No history of role assignments
- No way to handle abandonment or removal
- No mechanism for role replacement
- No integration with project completion confirmation

## Enhanced Role States

We will expand role states to include:

```typescript
type RoleStatus = 
  | 'open'                 // Available for users to apply
  | 'filled'               // Assigned to a user who is active
  | 'in_progress'          // Work has started on this role
  | 'completed'            // Work for this role is finished
  | 'abandoned'            // User left without completing
  | 'removed'              // User was removed by creator
  | 'skipped'              // Role deemed unnecessary for completion
  | 'seeking_replacement'  // Looking for a new person to take over
```

This allows for more nuanced handling of role transitions throughout a collaboration's lifecycle.

## Role Transition Workflows

### Role Abandonment
When a user decides to leave a role:

1. User initiates "Leave Role" action
2. System prompts for reason
3. Role status changes to "abandoned"
4. Creator receives notification
5. Creator decides whether to:
   - Seek replacement (status → "seeking_replacement")
   - Skip role (status → "skipped")

### Role Removal
When a creator removes a user:

1. Creator initiates "Remove User" action
2. System requires documentation of reason
3. Role status changes to "removed"
4. User receives notification with reason
5. Creator decides whether to:
   - Seek replacement (status → "seeking_replacement")
   - Skip role (status → "skipped")

### Role Replacement
When finding a new user for an abandoned/removed role:

1. Role appears in directory with "Replacement Needed" tag
2. Users can apply with special application addressing:
   - Why they're suitable as a replacement
   - How they'll handle existing partial work
3. Creator reviews applications and selects replacement
4. New user is assigned (status → "filled")
5. New user has access to previous work/evidence

### Role Skipping
When a role is deemed unnecessary:

1. Creator initiates "Skip Role" action
2. System requires documentation of reason
3. Role status changes to "skipped"
4. All participants are notified
5. Project can proceed without this role
6. Creator can "Unskip" if needed later

## Database Schema Updates

```typescript
export interface CollaborationRole {
  id: string;  // Add unique ID for each role
  title: string;
  status: RoleStatus;
  skills: string[];
  
  // Assignment history
  assignments: RoleAssignment[];
  currentAssignmentId?: string;  // Points to current active assignment
  
  // Completion data
  completionEvidence?: CollaborationEvidence[];
  completionNotes?: string;
  completedAt?: any; // Timestamp
  
  // For skipped roles
  skipReason?: string;
  skippedBy?: string; // User ID
  skippedAt?: any; // Timestamp
  
  // For replacement
  replacementReason?: string;
  replacementRequestedAt?: any; // Timestamp
}

export interface RoleAssignment {
  id: string;
  userId: string;
  userName: string;
  userPhotoURL?: string;
  status: 'active' | 'completed' | 'abandoned' | 'removed';
  assignedAt: any; // Timestamp
  endedAt?: any; // Timestamp when assignment ended
  endReason?: string; // For abandoned/removed
}

export interface CollaborationEvidence {
  id: string;
  userId: string;
  title: string;
  description?: string;
  fileURL: string;
  fileType: string;
  uploadedAt: any;
  roleId: string; // For role-specific evidence
}

// Update to main Collaboration interface
export interface Collaboration {
  // Existing fields
  id: string;
  title: string;
  description: string;
  creatorId: string;
  creatorName?: string;
  creatorPhotoURL?: string;
  roles: CollaborationRole[];
  status: string;
  createdAt: any;
  updatedAt: any;
  
  // New fields for confirmation
  completionStatus?: 'not_started' | 'in_progress' | 'pending_confirmation' | 'completed';
  completionInitiatedBy?: string; // User ID
  completionInitiatedAt?: any; // Timestamp
  completionEvidence?: CollaborationEvidence[]; // Project deliverables
  completionNotes?: string;
}
```

## UI/UX Implementation

### Collaboration Detail Page Updates

#### For Project Creators:
- Role management panel showing all roles and statuses
- Action buttons for each role:
  - "Find Replacement" for abandoned/removed roles
  - "Skip Role" with reason input
  - "Remove User" with reason documentation
  - "Unskip Role" for previously skipped roles

#### For Role Participants:
- Clear status indicators for their role
- "Leave Role" button with confirmation dialog
- Access to previous work if they're a replacement
- Evidence upload interface

#### For Potential Participants:
- Clear indicators for roles seeking replacements
- Special application form for replacements
- Visibility into partial work already completed

### Status Visualization
- Color-coded role status indicators
- Progress tracking for each role
- Overall project completion percentage
- Timeline view showing role transitions

## Integration Points

### Notification System
Add new notification types:
- Role abandonment notifications
- Role removal notifications
- Replacement opportunity notifications
- Role skipped notifications

```typescript
export const createRoleTransitionNotification = async (
  userId: string,
  collaborationId: string,
  collaborationName: string,
  roleTitle: string,
  action: 'abandoned' | 'removed' | 'seeking_replacement' | 'skipped' | 'filled'
): Promise<Notification> => {
  let title = '';
  let message = '';
  
  switch (action) {
    case 'abandoned':
      title = 'Role Abandoned';
      message = `A user has left the ${roleTitle} role in "${collaborationName}".`;
      break;
    case 'removed':
      title = 'User Removed from Role';
      message = `You have been removed from the ${roleTitle} role in "${collaborationName}".`;
      break;
    case 'seeking_replacement':
      title = 'Replacement Needed';
      message = `The ${roleTitle} role in "${collaborationName}" needs a replacement.`;
      break;
    case 'skipped':
      title = 'Role Skipped';
      message = `The ${roleTitle} role in "${collaborationName}" has been skipped.`;
      break;
    case 'filled':
      title = 'Role Filled';
      message = `The ${roleTitle} role in "${collaborationName}" has been filled.`;
      break;
  }
  
  return createNotification({
    userId,
    type: 'project',
    title,
    message,
    data: {
      projectId: collaborationId
    }
  });
};
```

### Confirmation System Integration
- Only consider active and completed roles for project completion
- Skipped roles don't block project completion
- Abandoned/removed roles without replacements can be converted to skipped
- Evidence from all contributors (even former ones) is included in final deliverables

### User Profile Integration
- Show role history in user profiles
- Track completion rate for roles
- Display badges earned from role management

## Gamification Integration

### XP Awards and Penalties
- XP bonus for completing a role (+50 XP)
- XP bonus for taking over an abandoned role (+25 XP)
- XP penalty for abandoning a role without good reason (-15 XP)
- XP bonus for creators who successfully manage role transitions (+10 XP per transition)

### Badges and Achievements
- "Pinch Hitter" - Successfully completed a role as a replacement
- "Project Savior" - Completed a project despite role abandonments
- "Reliable Collaborator" - Never abandoned a role
- "Team Builder" - Successfully managed 5+ role transitions
- "Second Chance" - Gave someone a role after they abandoned a previous one

### Level-Based Benefits
- Higher level users get priority for competitive replacement roles
- Higher level creators can manage more complex role transitions
- Special tools for high-level users to facilitate smooth transitions

## Implementation Strategy

### Phase 1: Database Updates
- Update Collaboration and CollaborationRole interfaces
- Create migration script for existing collaborations
- Set up new Firebase indexes

### Phase 2: Core Role Management
- Implement role state transitions
- Create UI for basic role management
- Add notification types for role changes

### Phase 3: Replacement System
- Build replacement application workflow
- Create UI for replacement candidates
- Implement evidence transfer for replacements

### Phase 4: Integration
- Connect with confirmation system
- Integrate with gamification
- Add analytics for role transitions

### Phase 5: Testing and Refinement
- Test with various collaboration scenarios
- Gather user feedback
- Refine UX based on real usage

## Compatibility Notes

This system is designed to be backward compatible with existing collaborations:
- Existing roles with `filled: true` will be migrated to status "filled"
- Existing roles with `filled: false` will be migrated to status "open"
- No changes to existing UI until new features are fully implemented
- Phased rollout to ensure stability

## Future Considerations

- Role dependencies (some roles require others to be completed first)
- Role mentorship (experienced users helping replacements)
- Temporary role coverage (short-term help during absences)
- Role splitting (dividing responsibilities when a role is too large)
- AI assistance for matching replacement candidates to abandoned roles
