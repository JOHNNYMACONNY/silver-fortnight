# Collaboration Roles System: Database Schema

This document provides detailed information about the database schema changes required to implement the Collaboration Roles System in TradeYa.

## Table of Contents

1. [Overview](#overview)
2. [Firestore Collections Structure](#firestore-collections-structure)
3. [Interface Definitions](#interface-definitions)
4. [Migration Strategy](#migration-strategy)
5. [Security Rules](#security-rules)
6. [Indexing Requirements](#indexing-requirements)

## Overview

The Collaboration Roles System requires several enhancements to the existing database schema to support:

- Detailed role definitions with skill requirements
- Role applications from interested users
- Role status tracking throughout the collaboration lifecycle
- Role-specific completion tracking

## Firestore Collections Structure

### Collections and Subcollections

```
/collaborations/{collaborationId}
    /roles/{roleId}
        /applications/{applicationId}
    /messages/{messageId}
    /completionRequests/{requestId}
```

### Document Structure

1. **Collaboration Document**
   - Basic collaboration information
   - Summary of roles (count, filled status)
   - Overall collaboration status

2. **Role Documents**
   - Detailed role information
   - Required and preferred skills
   - Current participant information
   - Role status and completion information

3. **Application Documents**
   - Applicant information
   - Application message
   - Evidence references
   - Application status

4. **Completion Request Documents**
   - Role-specific completion requests
   - Evidence references
   - Completion notes
   - Request status

## Interface Definitions

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
  
  // Roles summary (for quick access)
  roleCount: number;
  filledRoleCount: number;
  completedRoleCount: number;
  
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
export interface CollaborationRoleData { // Changed from CollaborationRole to CollaborationRoleData
  id: string;
  collaborationId: string;
  
  // Role details
  title: string;
  description: string;
  maxParticipants: number; 
  requiredSkills: Skill[]; 
  preferredSkills?: Skill[];
  
  // Hierarchy
  parentRoleId?: string; 
  childRoleIds: string[]; 
  
  // Participant tracking
  participantId?: string;
  participantName?: string;
  participantPhotoURL?: string;
  previousParticipantId?: string; 
  previousParticipantName?: string; 
  previousParticipantPhotoURL?: string; 
  abandonmentReason?: string; 
  abandonedAt?: Timestamp; // Timestamp from Firestore
  
  // Status
  // Updated to use RoleState enum from src/types/collaboration.ts
  status: \'DRAFT\' | \'OPEN\' | \'IN_REVIEW\' | \'ASSIGNED\' | \'IN_PROGRESS\' | \'COMPLETION_REQUESTED\' | \'FILLED\' | \'COMPLETED\' | \'ABANDONED\' | \'UNNEEDED\';
  applicationCount: number;
  
  // Completion tracking
  completionStatus?: \'pending\' | \'approved\' | \'rejected\';
  
  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
  filledAt?: Timestamp;
  completedAt?: Timestamp;
}
```

### Skill Interface

```typescript
export interface Skill {
  name: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
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

### CompletionRequest Interface

```typescript
export interface CompletionRequest {
  id: string;
  collaborationId: string;
  roleId: string;
  
  // Requester info
  requesterId: string;
  requesterName?: string;
  
  // Request details
  notes: string;
  evidence?: EmbeddedEvidence[];
  
  // Status
  status: 'pending' | 'approved' | 'rejected';
  
  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
  reviewedAt?: Timestamp;
}
```

## Migration Strategy

To migrate existing collaborations to the new schema:

1. **Create Roles Collection**
   - For each collaboration, create a roles subcollection
   - Convert existing simple role arrays to full role documents
   - Set appropriate default values for new fields

2. **Update Collaboration Documents**
   - Add new fields with appropriate default values
   - Calculate and set roleCount, filledRoleCount, and completedRoleCount
   - Update status field if needed

3. **Migration Script**

```typescript
import { db } from '../firebase-config'; // Adjusted import based on codebase
import { collection, getDocs, doc, setDoc, writeBatch, Timestamp } from 'firebase/firestore';
import { Collaboration, CollaborationRole, Skill } from '../types/collaboration'; // Assuming Collaboration and Skill interfaces are defined here

const migrateCollaborations = async () => {
  const collaborationsRef = collection(db, 'collaborations');
  const collaborationsSnapshot = await getDocs(collaborationsRef);
  
  const batch = writeBatch(db);
  
  for (const collaborationDoc of collaborationsSnapshot.docs) {
    const collaboration = collaborationDoc.data() as Collaboration; // Cast to Collaboration interface
    const collaborationId = collaborationDoc.id;
    
    // Extract existing roles array (assuming a simple array structure before, e.g., collaboration.roles = [{ title: 'Role 1', filled: true, ... }])
    const existingRoles: any[] = (collaboration as any).roles || []; // Use any[] for old, simpler structure
    
    // Initialize counts for the new collaboration document
    let filledRoleCount = 0;
    let completedRoleCount = 0;
    let roleCount = 0; // Keep track of total roles migrated
    
    // Use Promise.all for batching role creation operations within each collaboration
    const roleCreationPromises = existingRoles.map(async (existingRole, index) => {
      // Determine role status based on old structure, default to 'open'
      let status: CollaborationRole['status'] = 'open';
      if (existingRole.filled === true) { // Explicitly check for boolean true
        status = 'filled';
        filledRoleCount++;
      } else if (existingRole.status === 'completed') { // Check if old structure had a status field
         status = 'completed';
         completedRoleCount++;
      } else if (existingRole.status === 'abandoned') { // Check for abandoned status
         status = 'abandoned';
      }

      // Assuming a simple structure for existing skills, e.g., an array of strings or objects like { name: 'SkillName', level: 'intermediate' }
      // You might need to adjust this mapping based on your actual old skill structure
      const mapOldSkillsToNew = (oldSkills: any[]): Skill[] => {
        if (!Array.isArray(oldSkills)) return [];
        return oldSkills.map((skill: any) => {
          if (typeof skill === 'string') {
            return { id: skill.toLowerCase().replace(/\s+/g, '-'), name: skill, level: 'intermediate', category: '' }; // Map string skill to new interface
          } else if (skill && typeof skill === 'object') {
             return {
              id: skill.id || skill.name.toLowerCase().replace(/\s+/g, '-') || `skill-${Math.random().toString(36).substring(7)}`, // Generate ID if missing
              name: skill.name || 'Unknown Skill',
              level: skill.level || 'intermediate', // Default level if not present
              category: skill.category || '' // Default category if not present
             };
          }
          return { id: `skill-${Math.random().toString(36).substring(7)}`, name: 'Invalid Skill', level: 'intermediate', category: '' }; // Handle unexpected format
        }).filter(skill => skill.name !== 'Invalid Skill'); // Filter out invalid skills
      };

      const requiredSkills: Skill[] = mapOldSkillsToNew(existingRole.requiredSkills || existingRole.skills || []); // Check for both requiredSkills and a generic skills array
      const preferredSkills: Skill[] = mapOldSkillsToNew(existingRole.preferredSkills || []);

      // Create new role document reference
      const roleRef = doc(collection(db, `collaborations/${collaborationId}/roles`));
      const roleId = roleRef.id;

      const newRole: CollaborationRole = {
        id: roleId,
        collaborationId: collaborationId,
        title: existingRole.title || `Migrated Role ${index + 1}`, // Default title if not present
        description: existingRole.description || '',
        requiredSkills: requiredSkills,
        preferredSkills: preferredSkills,
        // Map other fields from existingRole if they exist in the old structure
        participantId: existingRole.participantId || undefined,
        participantName: existingRole.participantName || undefined,
        participantPhotoURL: existingRole.participantPhotoURL || undefined,
        status: status,
        // Set default values for new fields from schema, or infer if possible from old data
        completionStatus: existingRole.completionStatus || (status === 'completed' ? 'completed' : undefined), // Infer if role status is completed
        completionEvidence: existingRole.completionEvidence || [],
        completionNotes: existingRole.completionNotes || '',
        completionRequestedAt: existingRole.completionRequestedAt || undefined,
        completionConfirmedAt: existingRole.completionConfirmedAt || undefined,
        createdAt: existingRole.createdAt || collaboration.createdAt || Timestamp.now(), // Use role timestamp, then collaboration, then now
        updatedAt: existingRole.updatedAt || Timestamp.now(),
        filledAt: existingRole.filledAt || (status === 'filled' ? Timestamp.now() : undefined), // Use existing if available, or set if newly filled
        completedAt: existingRole.completedAt || (status === 'completed' ? Timestamp.now() : undefined), // Use existing if available, or set if newly completed

        // Add default values for other required CollaborationRole fields from schema
        parentRoleId: existingRole.parentRoleId || undefined,
        childRoleIds: existingRole.childRoleIds || [],
        requirements: existingRole.requirements || [], // Assuming this might have existed or default to empty
        permissions: existingRole.permissions || [], // Assuming this might have existed or default to empty
        maxParticipants: existingRole.maxParticipants || 1, // Default to 1 participant if not specified
        currentParticipants: existingRole.currentParticipants || (status === 'filled' ? 1 : 0), // Default based on status
        metadata: existingRole.metadata || {},
        applicationCount: existingRole.applicationCount || 0, // Default application count
        previousParticipantId: existingRole.previousParticipantId || undefined, // Map if exists or default
      };
      
      // Add set operation to the batch for the new role document
      batch.set(roleRef, newRole);
      roleCount++; // Increment total role count for this collaboration
    });

    // Wait for all role promises to be prepared within this collaboration before proceeding to the next
    await Promise.all(roleCreationPromises);

    // Update the main collaboration document with new counts and possibly status
    // Assuming the Collaboration interface in src/types/collaboration.ts includes these fields
    const collaborationUpdates: Partial<Collaboration> = {
      roleCount: roleCount,
      filledRoleCount: filledRoleCount,
      // Recalculate completedRoleCount based on the roles just migrated for this collaboration
      completedRoleCount: existingRoles.filter(role => role.status === 'completed').length, // Assuming old structure had status
      // Update collaboration status if needed based on role statuses. This logic is complex and depends on
      // your specific requirements for when a collaboration status changes based on role statuses.
      // For simplicity, we will primarily rely on the role counts, but you might need to add
      // custom logic here based on your application's rules.
      updatedAt: Timestamp.now(),
      // You might also want to update the main collaboration status based on the new role counts
      // For example, if all roles are completed, mark the collaboration as completed.
      // This would require adding more complex logic here.
      // status: calculateNewCollaborationStatus(roleCount, filledRoleCount, completedRoleCount, collaboration.status)
    };

    // Add update operation to the batch for the collaboration document
    // Use the collaborationDoc.ref to update the existing document
    batch.update(collaborationDoc.ref, collaborationUpdates);
  }
  
  // Commit the batch
  try {
    await batch.commit();
    console.log(`Migration complete for ${collaborationsSnapshot.docs.length} collaborations.`);
  } catch (error) {
    console.error('Error committing migration batch:', error);
  }
};

// Execute the migration function
migrateCollaborations();
```

## Security Rules

```
service cloud.firestore {
  match /databases/{database}/documents {
    // Collaboration rules
    match /collaborations/{collaborationId} {
      allow read;
      allow create: if request.auth != null;
      allow update, delete: if request.auth.uid == resource.data.creatorId;
      
      // Roles subcollection
      match /roles/{roleId} {
        allow read;
        allow create, update, delete: if request.auth.uid == get(/databases/$(database)/documents/collaborations/$(collaborationId)).data.creatorId;
        
        // Applications subcollection
        match /applications/{applicationId} {
          allow read: if request.auth.uid == get(/databases/$(database)/documents/collaborations/$(collaborationId)).data.creatorId || 
                       request.auth.uid == resource.data.applicantId;
          allow create: if request.auth != null && 
                         get(/databases/$(database)/documents/collaborations/$(collaborationId)/roles/$(roleId)).data.status == 'open';
          allow update: if (request.auth.uid == resource.data.applicantId && 
                           request.resource.data.status == 'withdrawn') || 
                          request.auth.uid == get(/databases/$(database)/documents/collaborations/$(collaborationId)).data.creatorId;
          allow delete: if request.auth.uid == resource.data.applicantId && 
                         resource.data.status == 'pending';
        }
      }
      
      // Completion requests subcollection
      match /completionRequests/{requestId} {
        allow read: if request.auth.uid == get(/databases/$(database)/documents/collaborations/$(collaborationId)).data.creatorId || 
                     request.auth.uid == resource.data.requesterId;
        allow create: if request.auth != null && 
                       exists(/databases/$(database)/documents/collaborations/$(collaborationId)/roles/$(request.resource.data.roleId)) && 
                       get(/databases/$(database)/documents/collaborations/$(collaborationId)/roles/$(request.resource.data.roleId)).data.participantId == request.auth.uid;
        allow update: if request.auth.uid == get(/databases/$(database)/documents/collaborations/$(collaborationId)).data.creatorId;
        allow delete: if request.auth.uid == resource.data.requesterId && 
                       resource.data.status == 'pending';
      }
    }
  }
}
```

## Indexing Requirements

Create the following composite indexes to support efficient queries:

1. **Role Applications by Status**
   - Collection: `collaborations/{collaborationId}/roles/{roleId}/applications`
   - Fields: `status` (ascending), `createdAt` (descending)

2. **Roles by Status**
   - Collection: `collaborations/{collaborationId}/roles`
   - Fields: `status` (ascending), `createdAt` (ascending)

3. **Collaborations by Creator and Status**
   - Collection: `collaborations`
   - Fields: `creatorId` (ascending), `status` (ascending), `updatedAt` (descending)

4. **Collaborations with Open Roles**
   - Collection: `collaborations`
   - Fields: `status` (ascending), `roleCount` (ascending), `filledRoleCount` (ascending), `createdAt` (descending)
