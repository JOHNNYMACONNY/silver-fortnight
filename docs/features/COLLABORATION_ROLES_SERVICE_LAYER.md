# Collaboration Roles System: Service Layer

This document outlines the service layer implementation for the Collaboration Roles System in TradeYa, including Firebase service functions, utility methods, and integration with existing services.

## Table of Contents

1. [Overview](#overview)
2. [Service Functions](#service-functions)
3. [Utility Functions](#utility-functions)
4. [Error Handling](#error-handling)
5. [Integration with Existing Services](#integration-with-existing-services)
6. [Testing Strategy](#testing-strategy)

## Overview

The service layer for the Collaboration Roles System will provide a clean API for interacting with Firestore, handling business logic, and ensuring data consistency. It will include functions for:

- Creating, updating, and deleting roles
- Submitting and managing role applications
- Handling role completion requests
- Managing collaboration status based on role changes

## Service Functions

### Role Management Services

```typescript
// src/services/collaborationRoles.ts

import { db } from '../firebase';
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  Timestamp, 
  runTransaction,
  writeBatch
} from 'firebase/firestore';
import { CollaborationRole, RoleApplication, Skill } from '../types';
import { ServiceResponse } from '../types/services';

/**
 * Create a new role for a collaboration
 */
export const createCollaborationRole = async (
  collaborationId: string,
  roleData: Omit<CollaborationRole, 'id' | 'collaborationId' | 'status' | 'applicationCount' | 'createdAt' | 'updatedAt'>
): Promise<ServiceResponse<CollaborationRole>> => {
  try {
    // Validate collaboration exists
    const collaborationRef = doc(db, 'collaborations', collaborationId);
    const collaborationSnap = await getDoc(collaborationRef);
    
    if (!collaborationSnap.exists()) {
      return { success: false, error: 'Collaboration not found' };
    }
    
    // Create role document
    const roleRef = doc(collection(db, `collaborations/${collaborationId}/roles`));
    
    const newRole: CollaborationRole = {
      id: roleRef.id,
      collaborationId,
      ...roleData,
      status: 'open',
      applicationCount: 0,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };
    
    await setDoc(roleRef, newRole);
    
    // Update role count in collaboration document
    await runTransaction(db, async (transaction) => {
      const collaborationDoc = await transaction.get(collaborationRef);
      const collaborationData = collaborationDoc.data();
      
      transaction.update(collaborationRef, {
        roleCount: (collaborationData.roleCount || 0) + 1,
        updatedAt: Timestamp.now()
      });
    });
    
    return { success: true, data: newRole };
  } catch (error) {
    console.error('Error creating collaboration role:', error);
    return { success: false, error: 'Failed to create role' };
  }
};

/**
 * Update an existing role
 */
export const updateCollaborationRole = async (
  collaborationId: string,
  roleId: string,
  roleData: Partial<CollaborationRole>
): Promise<ServiceResponse<CollaborationRole>> => {
  try {
    const roleRef = doc(db, `collaborations/${collaborationId}/roles`, roleId);
    const roleSnap = await getDoc(roleRef);
    
    if (!roleSnap.exists()) {
      return { success: false, error: 'Role not found' };
    }
    
    const currentRole = roleSnap.data() as CollaborationRole;
    
    // Prevent updating certain fields directly
    const { id, collaborationId: cId, createdAt, ...updatableFields } = roleData;
    
    const updates = {
      ...updatableFields,
      updatedAt: Timestamp.now()
    };
    
    await updateDoc(roleRef, updates);
    
    // If status changed to filled or completed, update collaboration counts
    if (
      (currentRole.status !== 'filled' && updates.status === 'filled') ||
      (currentRole.status !== 'completed' && updates.status === 'completed')
    ) {
      await updateCollaborationRoleCounts(collaborationId);
    }
    
    return { 
      success: true, 
      data: { ...currentRole, ...updates } as CollaborationRole 
    };
  } catch (error) {
    console.error('Error updating collaboration role:', error);
    return { success: false, error: 'Failed to update role' };
  }
};

/**
 * Delete a role
 */
export const deleteCollaborationRole = async (
  collaborationId: string,
  roleId: string
): Promise<ServiceResponse<void>> => {
  try {
    const roleRef = doc(db, `collaborations/${collaborationId}/roles`, roleId);
    const roleSnap = await getDoc(roleRef);
    
    if (!roleSnap.exists()) {
      return { success: false, error: 'Role not found' };
    }
    
    const role = roleSnap.data() as CollaborationRole;
    
    // Check if role can be deleted
    if (role.status !== 'open') {
      return { success: false, error: 'Cannot delete a role that is filled or completed' };
    }
    
    // Delete all applications for this role
    const applicationsQuery = query(
      collection(db, `collaborations/${collaborationId}/roles/${roleId}/applications`)
    );
    const applicationsSnap = await getDocs(applicationsQuery);
    
    const batch = writeBatch(db);
    
    applicationsSnap.forEach((appDoc) => {
      batch.delete(appDoc.ref);
    });
    
    // Delete the role
    batch.delete(roleRef);
    
    await batch.commit();
    
    // Update role count in collaboration document
    await updateCollaborationRoleCounts(collaborationId);
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting collaboration role:', error);
    return { success: false, error: 'Failed to delete role' };
  }
};

/**
 * Get all roles for a collaboration
 */
export const getCollaborationRoles = async (
  collaborationId: string
): Promise<ServiceResponse<CollaborationRole[]>> => {
  try {
    const rolesQuery = query(
      collection(db, `collaborations/${collaborationId}/roles`),
      orderBy('createdAt', 'asc')
    );
    
    const rolesSnap = await getDocs(rolesQuery);
    const roles = rolesSnap.docs.map(doc => doc.data() as CollaborationRole);
    
    return { success: true, data: roles };
  } catch (error) {
    console.error('Error getting collaboration roles:', error);
    return { success: false, error: 'Failed to get roles' };
  }
};
```

### Role Application Services

```typescript
/**
 * Submit an application for a role
 */
export const submitRoleApplication = async (
  collaborationId: string,
  roleId: string,
  userId: string,
  applicationData: {
    message: string;
    evidence?: EmbeddedEvidence[];
  }
): Promise<ServiceResponse<RoleApplication>> => {
  try {
    // Validate role exists and is open
    const roleRef = doc(db, `collaborations/${collaborationId}/roles`, roleId);
    const roleSnap = await getDoc(roleRef);
    
    if (!roleSnap.exists()) {
      return { success: false, error: 'Role not found' };
    }
    
    const role = roleSnap.data() as CollaborationRole;
    
    if (role.status !== 'open') {
      return { success: false, error: 'This role is no longer accepting applications' };
    }
    
    // Get user data
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      return { success: false, error: 'User not found' };
    }
    
    const userData = userSnap.data();
    
    // Check if user already applied
    const existingApplicationQuery = query(
      collection(db, `collaborations/${collaborationId}/roles/${roleId}/applications`),
      where('applicantId', '==', userId)
    );
    
    const existingApplicationSnap = await getDocs(existingApplicationQuery);
    
    if (!existingApplicationSnap.empty) {
      return { success: false, error: 'You have already applied for this role' };
    }
    
    // Create application
    const applicationRef = doc(collection(db, `collaborations/${collaborationId}/roles/${roleId}/applications`));
    
    const newApplication: RoleApplication = {
      id: applicationRef.id,
      collaborationId,
      roleId,
      applicantId: userId,
      applicantName: userData.displayName || '',
      applicantPhotoURL: userData.photoURL || null,
      message: applicationData.message,
      evidence: applicationData.evidence || [],
      status: 'pending',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };
    
    await setDoc(applicationRef, newApplication);
    
    // Update application count
    await updateDoc(roleRef, {
      applicationCount: (role.applicationCount || 0) + 1,
      updatedAt: Timestamp.now()
    });
    
    // Create notification for collaboration creator
    await createNotification({
      recipientId: role.creatorId,
      type: 'role_application',
      title: 'New Role Application',
      message: `${userData.displayName || 'Someone'} applied for the "${role.title}" role in your collaboration.`,
      data: {
        collaborationId,
        roleId,
        applicationId: applicationRef.id
      },
      createdAt: Timestamp.now()
    });
    
    return { success: true, data: newApplication };
  } catch (error) {
    console.error('Error submitting role application:', error);
    return { success: false, error: 'Failed to submit application' };
  }
};

/**
 * Get applications for a role
 */
export const getRoleApplications = async (
  collaborationId: string,
  roleId: string
): Promise<ServiceResponse<RoleApplication[]>> => {
  try {
    const applicationsQuery = query(
      collection(db, `collaborations/${collaborationId}/roles/${roleId}/applications`),
      orderBy('createdAt', 'desc')
    );
    
    const applicationsSnap = await getDocs(applicationsQuery);
    const applications = applicationsSnap.docs.map(doc => doc.data() as RoleApplication);
    
    return { success: true, data: applications };
  } catch (error) {
    console.error('Error getting role applications:', error);
    return { success: false, error: 'Failed to get applications' };
  }
};

/**
 * Update application status (accept/reject)
 */
export const updateApplicationStatus = async (
  collaborationId: string,
  roleId: string,
  applicationId: string,
  status: 'accepted' | 'rejected',
  userId: string
): Promise<ServiceResponse<RoleApplication>> => {
  try {
    // Validate collaboration and role
    const collaborationRef = doc(db, 'collaborations', collaborationId);
    const collaborationSnap = await getDoc(collaborationRef);
    
    if (!collaborationSnap.exists()) {
      return { success: false, error: 'Collaboration not found' };
    }
    
    const collaboration = collaborationSnap.data();
    
    // Only creator can update application status
    if (collaboration.creatorId !== userId) {
      return { success: false, error: 'Only the collaboration creator can accept or reject applications' };
    }
    
    const roleRef = doc(db, `collaborations/${collaborationId}/roles`, roleId);
    const roleSnap = await getDoc(roleRef);
    
    if (!roleSnap.exists()) {
      return { success: false, error: 'Role not found' };
    }
    
    const role = roleSnap.data() as CollaborationRole;
    
    if (role.status !== 'open') {
      return { success: false, error: 'This role is no longer accepting applications' };
    }
    
    // Get the application
    const applicationRef = doc(db, `collaborations/${collaborationId}/roles/${roleId}/applications`, applicationId);
    const applicationSnap = await getDoc(applicationRef);
    
    if (!applicationSnap.exists()) {
      return { success: false, error: 'Application not found' };
    }
    
    const application = applicationSnap.data() as RoleApplication;
    
    if (application.status !== 'pending') {
      return { success: false, error: 'This application has already been processed' };
    }
    
    // Update application status
    await updateDoc(applicationRef, {
      status,
      reviewedAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    
    // If accepting, update role and reject other applications
    if (status === 'accepted') {
      await runTransaction(db, async (transaction) => {
        // Update role status and participant
        transaction.update(roleRef, {
          status: 'filled',
          participantId: application.applicantId,
          participantName: application.applicantName,
          participantPhotoURL: application.applicantPhotoURL,
          filledAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        });
        
        // Reject other pending applications
        const otherApplicationsQuery = query(
          collection(db, `collaborations/${collaborationId}/roles/${roleId}/applications`),
          where('status', '==', 'pending'),
          where('id', '!=', applicationId)
        );
        
        const otherApplicationsSnap = await getDocs(otherApplicationsQuery);
        
        otherApplicationsSnap.forEach((appDoc) => {
          transaction.update(appDoc.ref, {
            status: 'rejected',
            reviewedAt: Timestamp.now(),
            updatedAt: Timestamp.now()
          });
          
          // Create rejection notifications (would be done outside transaction in production)
          const appData = appDoc.data() as RoleApplication;
          createNotification({
            recipientId: appData.applicantId,
            type: 'application_rejected',
            title: 'Application Rejected',
            message: `Your application for the "${role.title}" role was not selected.`,
            data: {
              collaborationId,
              roleId
            },
            createdAt: Timestamp.now()
          });
        });
        
        // Update collaboration status if needed
        const allRolesQuery = query(
          collection(db, `collaborations/${collaborationId}/roles`)
        );
        
        const allRolesSnap = await getDocs(allRolesQuery);
        const allRoles = allRolesSnap.docs.map(doc => doc.data() as CollaborationRole);
        
        const allFilled = allRoles.every(r => r.status === 'filled' || r.status === 'completed');
        
        if (allFilled && collaboration.status === 'open') {
          transaction.update(collaborationRef, {
            status: 'in-progress',
            updatedAt: Timestamp.now()
          });
        }
      });
      
      // Create acceptance notification
      await createNotification({
        recipientId: application.applicantId,
        type: 'application_accepted',
        title: 'Application Accepted',
        message: `Your application for the "${role.title}" role was accepted!`,
        data: {
          collaborationId,
          roleId
        },
        createdAt: Timestamp.now()
      });
    } else {
      // Create rejection notification
      await createNotification({
        recipientId: application.applicantId,
        type: 'application_rejected',
        title: 'Application Rejected',
        message: `Your application for the "${role.title}" role was not selected.`,
        data: {
          collaborationId,
          roleId
        },
        createdAt: Timestamp.now()
      });
    }
    
    // Update collaboration role counts
    await updateCollaborationRoleCounts(collaborationId);
    
    return { 
      success: true, 
      data: { 
        ...application, 
        status, 
        reviewedAt: Timestamp.now(), 
        updatedAt: Timestamp.now() 
      } as RoleApplication 
    };
  } catch (error) {
    console.error('Error updating application status:', error);
    return { success: false, error: 'Failed to update application status' };
  }
};
```

## Utility Functions

```typescript
/**
 * Update role counts in the collaboration document
 */
export const updateCollaborationRoleCounts = async (
  collaborationId: string
): Promise<void> => {
  try {
    const rolesQuery = query(
      collection(db, `collaborations/${collaborationId}/roles`)
    );
    
    const rolesSnap = await getDocs(rolesQuery);
    const roles = rolesSnap.docs.map(doc => doc.data() as CollaborationRole);
    
    const roleCount = roles.length;
    const filledRoleCount = roles.filter(r => r.status === 'filled' || r.status === 'completed').length;
    const completedRoleCount = roles.filter(r => r.status === 'completed').length;
    
    const collaborationRef = doc(db, 'collaborations', collaborationId);
    
    await updateDoc(collaborationRef, {
      roleCount,
      filledRoleCount,
      completedRoleCount,
      updatedAt: Timestamp.now()
    });
    
    // Update collaboration status if needed
    if (roleCount > 0) {
      if (completedRoleCount === roleCount) {
        await updateDoc(collaborationRef, { status: 'completed' });
      } else if (filledRoleCount === roleCount && completedRoleCount === 0) {
        await updateDoc(collaborationRef, { status: 'in-progress' });
      } else if (filledRoleCount > 0 && completedRoleCount > 0 && completedRoleCount < roleCount) {
        await updateDoc(collaborationRef, { status: 'pending_completion' });
      }
    }
  } catch (error) {
    console.error('Error updating collaboration role counts:', error);
    throw error;
  }
};

/**
 * Check if a user can apply for a role
 */
export const canUserApplyForRole = async (
  userId: string,
  collaborationId: string,
  roleId: string
): Promise<{ canApply: boolean; reason?: string }> => {
  try {
    // Check if user is the collaboration creator
    const collaborationRef = doc(db, 'collaborations', collaborationId);
    const collaborationSnap = await getDoc(collaborationRef);
    
    if (!collaborationSnap.exists()) {
      return { canApply: false, reason: 'Collaboration not found' };
    }
    
    const collaboration = collaborationSnap.data();
    
    if (collaboration.creatorId === userId) {
      return { canApply: false, reason: 'You cannot apply for roles in your own collaboration' };
    }
    
    // Check if role is open
    const roleRef = doc(db, `collaborations/${collaborationId}/roles`, roleId);
    const roleSnap = await getDoc(roleRef);
    
    if (!roleSnap.exists()) {
      return { canApply: false, reason: 'Role not found' };
    }
    
    const role = roleSnap.data() as CollaborationRole;
    
    if (role.status !== 'open') {
      return { canApply: false, reason: 'This role is no longer accepting applications' };
    }
    
    // Check if user already applied
    const existingApplicationQuery = query(
      collection(db, `collaborations/${collaborationId}/roles/${roleId}/applications`),
      where('applicantId', '==', userId)
    );
    
    const existingApplicationSnap = await getDocs(existingApplicationQuery);
    
    if (!existingApplicationSnap.empty) {
      return { canApply: false, reason: 'You have already applied for this role' };
    }
    
    // Check if user already has a role in this collaboration
    const userRolesQuery = query(
      collection(db, `collaborations/${collaborationId}/roles`),
      where('participantId', '==', userId)
    );
    
    const userRolesSnap = await getDocs(userRolesQuery);
    
    if (!userRolesSnap.empty) {
      return { canApply: false, reason: 'You already have a role in this collaboration' };
    }
    
    return { canApply: true };
  } catch (error) {
    console.error('Error checking if user can apply for role:', error);
    return { canApply: false, reason: 'An error occurred while checking eligibility' };
  }
};
```

## Error Handling

The service layer will use a consistent error handling approach:

1. **ServiceResponse Type**: All service functions return a `ServiceResponse<T>` object with success/error information
2. **Detailed Error Messages**: Error messages are user-friendly and specific
3. **Error Logging**: All errors are logged to the console for debugging
4. **Transaction Safety**: Firestore transactions are used for operations that update multiple documents

## Integration with Existing Services

### Notification Service Integration

The Collaboration Roles System will integrate with the existing notification system:

```typescript
import { createNotification } from './notifications';

// Notification types
// - role_application: When a user applies for a role
// - application_accepted: When a user's application is accepted
// - application_rejected: When a user's application is rejected
// - role_completion_requested: When a participant requests role completion
// - role_completion_confirmed: When a role completion is confirmed
// - collaboration_completed: When all roles in a collaboration are completed
```

### User Service Integration

```typescript
import { getUserProfile } from './users';

// Used to get user information for applications and role assignments
```

### Evidence Embed System Integration

```typescript
import { validateEvidence } from './evidenceValidator';

// Used to validate evidence submitted with applications and completion requests
```

## Testing Strategy

### Unit Tests

```typescript
// Example test for createCollaborationRole
describe('createCollaborationRole', () => {
  it('should create a new role for a valid collaboration', async () => {
    // Mock Firestore responses
    // ...
    
    const result = await createCollaborationRole('collaboration-id', {
      title: 'Test Role',
      description: 'Test Description',
      requiredSkills: [{ name: 'JavaScript', level: 'intermediate' }]
    });
    
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data?.title).toBe('Test Role');
    expect(result.data?.status).toBe('open');
  });
  
  it('should return error for non-existent collaboration', async () => {
    // Mock Firestore responses for non-existent collaboration
    // ...
    
    const result = await createCollaborationRole('invalid-id', {
      title: 'Test Role',
      description: 'Test Description',
      requiredSkills: [{ name: 'JavaScript', level: 'intermediate' }]
    });
    
    expect(result.success).toBe(false);
    expect(result.error).toBe('Collaboration not found');
  });
});
```

### Integration Tests

```typescript
// Example integration test for the application flow
describe('Role Application Flow', () => {
  it('should allow a user to apply and creator to accept', async () => {
    // Create test collaboration and role
    // ...
    
    // Submit application
    const applicationResult = await submitRoleApplication(
      collaborationId,
      roleId,
      applicantId,
      {
        message: 'I would like to apply',
        evidence: []
      }
    );
    
    expect(applicationResult.success).toBe(true);
    
    // Accept application
    const acceptResult = await updateApplicationStatus(
      collaborationId,
      roleId,
      applicationResult.data!.id,
      'accepted',
      creatorId
    );
    
    expect(acceptResult.success).toBe(true);
    
    // Verify role status
    const roleResult = await getCollaborationRole(collaborationId, roleId);
    expect(roleResult.data?.status).toBe('filled');
    expect(roleResult.data?.participantId).toBe(applicantId);
  });
});
```
