# Collaboration Roles System

This document outlines the design and implementation plan for the Collaboration Roles System in TradeYa, which will enable users to create projects with multiple defined roles and skill requirements.

## Table of Contents

1. [System Overview](#system-overview)
2. [Database Schema](#database-schema)
3. [UI Components](#ui-components)
4. [Service Layer](#service-layer)
5. [User Flows](#user-flows)
6. [Integration Points](#integration-points)
7. [Implementation Roadmap](#implementation-roadmap)
8. [Technical Considerations](#technical-considerations)

## System Overview

The Collaboration Roles System will enhance TradeYa's existing collaboration functionality by allowing project creators to define specific roles with detailed skill requirements. Users can then apply for these roles, and creators can manage the team composition throughout the project lifecycle.

### Goals

- Enable structured team formation for creative projects
- Allow detailed role definition with specific skill requirements
- Provide a clear application and selection process for roles
- Track role fulfillment and project progress
- Support role reassignment if participants leave
- Integrate with the existing Trade Lifecycle and Evidence Embed systems

### Key Features

- **Role Definition**: Create detailed role descriptions with skill requirements
- **Role Application**: Apply for specific roles with evidence of relevant skills
- **Team Management**: Accept/reject applications and manage team composition
- **Progress Tracking**: Monitor role fulfillment and project progress
- **Role Reassignment**: Replace participants if needed
- **Completion Workflow**: Track role-specific completion status

## Database Schema

### Enhanced Collaboration Interface

```typescript
export interface Collaboration {
  // Basic collaboration info
  id: string;
  title: string;
  description: string;
  category: string;
  location?: string;
  
  // Creator info
  creatorId: string;
  creatorName?: string;
  creatorPhotoURL?: string;
  
  // Roles (enhanced)
  roles: CollaborationRole[];
  
  // Status tracking
  status: 'open' | 'in-progress' | 'pending_completion' | 'completed' | 'cancelled';
  applicationCount: number;
  
  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
  startDate?: Timestamp;
  endDate?: Timestamp;
  completedAt?: Timestamp;
  
  // Additional fields
  visibility: 'public' | 'private' | 'unlisted';
  tags?: string[];
  communicationPreferences: string[];
}
```

### CollaborationRole Interface

```typescript
export interface CollaborationRole {
  id: string;
  title: string;
  description: string;
  requiredSkills: Skill[];
  preferredSkills?: Skill[];
  
  // Participant tracking
  participantId?: string;
  participantName?: string;
  participantPhotoURL?: string;
  
  // Status
  status: 'open' | 'filled' | 'completed' | 'abandoned';
  
  // Completion tracking
  completionStatus?: 'pending' | 'completed' | 'rejected';
  completionEvidence?: EmbeddedEvidence[];
  completionNotes?: string;
  completionRequestedAt?: Timestamp;
  completionConfirmedAt?: Timestamp;
}
```

### RoleApplication Interface

```typescript
export interface RoleApplication {
  id: string;
  collaborationId: string;
  roleId: string;
  
  // Applicant info
  applicantId: string;
  applicantName?: string;
  applicantPhotoURL?: string;
  
  // Application details
  message: string;
  evidence?: EmbeddedEvidence[];
  
  // Status
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn';
  
  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
  reviewedAt?: Timestamp;
}
```

## UI Components

### 1. Role Definition Component

A form component for creating and editing roles within a collaboration:

- Role title and description fields
- Required skills selector (with skill level)
- Preferred skills selector (with skill level)
- Role status indicator
- Delete role button

### 2. Role Application Form

A form for users to apply for specific roles:

- Application message field
- Evidence submitter integration
- Relevant skills showcase
- Submit application button

### 3. Role Management Dashboard

A dashboard for collaboration creators to manage roles and applications:

- Role status overview
- Applications list per role
- Accept/reject application buttons
- Replace participant option
- Role completion tracking

### 4. Collaboration Status Tracker

A visual component showing the overall status of a collaboration:

- Role fulfillment progress
- Timeline of key events
- Role completion status
- Overall collaboration progress

### 5. Role Card Component

A card component displaying role information:

- Role title and description
- Required and preferred skills
- Current participant (if filled)
- Application button (if open)
- Status indicator

## Service Layer

### Role Management Services

```typescript
// Create a new role for a collaboration
export const createCollaborationRole = async (
  collaborationId: string,
  roleData: Omit<CollaborationRole, 'id'>
): Promise<ServiceResponse<CollaborationRole>> => {
  // Implementation
};

// Update an existing role
export const updateCollaborationRole = async (
  collaborationId: string,
  roleId: string,
  roleData: Partial<CollaborationRole>
): Promise<ServiceResponse<CollaborationRole>> => {
  // Implementation
};

// Delete a role
export const deleteCollaborationRole = async (
  collaborationId: string,
  roleId: string
): Promise<ServiceResponse<void>> => {
  // Implementation
};
```

### Role Application Services

```typescript
// Submit an application for a role
export const submitRoleApplication = async (
  collaborationId: string,
  roleId: string,
  applicationData: Omit<RoleApplication, 'id' | 'collaborationId' | 'roleId' | 'status' | 'createdAt' | 'updatedAt'>
): Promise<ServiceResponse<RoleApplication>> => {
  // Implementation
};

// Get applications for a role
export const getRoleApplications = async (
  collaborationId: string,
  roleId: string
): Promise<ServiceResponse<RoleApplication[]>> => {
  // Implementation
};

// Update application status
export const updateApplicationStatus = async (
  collaborationId: string,
  roleId: string,
  applicationId: string,
  status: 'accepted' | 'rejected'
): Promise<ServiceResponse<RoleApplication>> => {
  // Implementation
};
```

### Role Completion Services

```typescript
// Request role completion
export const requestRoleCompletion = async (
  collaborationId: string,
  roleId: string,
  completionData: {
    notes?: string;
    evidence?: EmbeddedEvidence[];
  }
): Promise<ServiceResponse<CollaborationRole>> => {
  // Implementation
};

// Confirm role completion
export const confirmRoleCompletion = async (
  collaborationId: string,
  roleId: string
): Promise<ServiceResponse<CollaborationRole>> => {
  // Implementation
};
```

## User Flows

### 1. Creating a Collaboration with Roles

1. User navigates to "Create Collaboration" page
2. User fills in basic collaboration details
3. User adds roles using the Role Definition Component
4. User specifies required and preferred skills for each role
5. User publishes the collaboration

### 2. Applying for a Role

1. User views a collaboration with open roles
2. User selects a role they're interested in
3. User completes the Role Application Form
4. User submits evidence of relevant skills
5. User submits the application

### 3. Managing Role Applications

1. Collaboration creator receives notifications of new applications
2. Creator reviews applications in the Role Management Dashboard
3. Creator accepts or rejects applications
4. When an application is accepted, the role status changes to "filled"
5. Other applications for that role are automatically rejected

### 4. Completing Role Responsibilities

1. Participant completes their assigned work
2. Participant requests role completion with evidence
3. Creator reviews the completion request
4. Creator confirms completion or requests changes
5. When all roles are completed, the collaboration status changes to "completed"

## Integration Points

### Evidence Embed System

The Collaboration Roles System will integrate with the Evidence Embed System in two key areas:

1. **Role Applications**: Applicants can attach portfolio evidence to their applications
2. **Role Completion**: Participants can submit evidence when requesting role completion

### Trade Lifecycle System

The Collaboration Roles System will follow similar patterns to the Trade Lifecycle System:

1. **Status Flow**: Similar status progression (open → in-progress → completed)
2. **Proposal/Application Flow**: Similar to trade proposals but role-specific
3. **Completion Confirmation**: Similar confirmation workflow but per-role

### Notification System

The system will create notifications at key points:

1. **Application Notifications**: New application received, application accepted/rejected
2. **Role Status Notifications**: Role filled, role abandoned, replacement needed
3. **Completion Notifications**: Role completion requested, role completion confirmed

## Implementation Roadmap

### Phase 1: Core Components (Weeks 1-2)

1. Database schema updates
   - Enhance Collaboration interface
   - Create CollaborationRole interface
   - Create RoleApplication interface

2. Basic service layer implementation
   - Role management services
   - Role application services

3. UI component development
   - Role Definition Component
   - Role Card Component

### Phase 2: Application Flow (Weeks 3-4)

1. Role Application Form
   - Integrate with Evidence Embed System
   - Implement application submission

2. Role Management Dashboard
   - Application review interface
   - Accept/reject functionality

3. Notification integration
   - Application notifications
   - Status change notifications

### Phase 3: Completion Flow (Weeks 5-6)

1. Role completion services
   - Request completion functionality
   - Confirm completion functionality

2. Collaboration Status Tracker
   - Visual progress indicators
   - Role status visualization

3. Integration with existing pages
   - Update CollaborationDetailPage
   - Update CollaborationListingPage

### Phase 4: Testing and Refinement (Weeks 7-8)

1. End-to-end testing
   - Test complete collaboration lifecycle
   - Test edge cases and error handling

2. UI/UX refinement
   - Improve visual design
   - Enhance user interactions

3. Performance optimization
   - Optimize database queries
   - Implement caching where appropriate

## Technical Considerations

### Security Rules

Firestore security rules will need to be updated to:

1. Control access to role applications
   - Only collaboration creators can read all applications
   - Users can read their own applications
   - Users can create applications for open roles

2. Control role management
   - Only collaboration creators can update roles
   - Only assigned participants can request role completion

### Backward Compatibility

The system should handle existing collaborations by:

1. Migrating simple role arrays to the new structured format
2. Preserving existing participant assignments
3. Setting appropriate default values for new fields

### Performance Considerations

1. Limit the number of roles per collaboration (suggested max: 10)
2. Implement pagination for applications if needed
3. Use subcollections for applications to avoid document size limits

### Mobile Responsiveness

Ensure all new components work well on mobile devices:

1. Responsive Role Management Dashboard
2. Touch-friendly application forms
3. Compact Role Cards for mobile view
