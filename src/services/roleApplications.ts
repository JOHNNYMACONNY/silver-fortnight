import { getSyncFirebaseDb } from '../firebase-config';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
  runTransaction,
  updateDoc
} from 'firebase/firestore';
import { CollaborationRoleData, RoleApplication, RoleState, ApplicationStatus } from '../types/collaboration';
import { EmbeddedEvidence } from '../types/evidence';
import { ServiceResponse } from '../types/services';
import { createNotification, NotificationType } from './notifications/unifiedNotificationService';
import { updateCollaborationRoleCounts } from './collaborationRoles';

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
    const roleRef = doc(getSyncFirebaseDb(), `collaborations/${collaborationId}/roles`, roleId);
    const roleSnap = await getDoc(roleRef);

    if (!roleSnap.exists()) {
      return { success: false, error: 'Role not found' };
    }

    const role = roleSnap.data() as CollaborationRoleData;

    if (role.status !== RoleState.OPEN) {
      return { success: false, error: 'This role is no longer accepting applications' };
    }

    // Get collaboration data
    const collaborationRef = doc(getSyncFirebaseDb(), 'collaborations', collaborationId);
    const collaborationSnap = await getDoc(collaborationRef);

    if (!collaborationSnap.exists()) {
      return { success: false, error: 'Collaboration not found' };
    }

    const collaboration = collaborationSnap.data() as Record<string, any>;

    // Check if user is the collaboration creator
    if (collaboration?.creatorId === userId) {
      return { success: false, error: 'You cannot apply for roles in your own collaboration' };
    }

    // Get user data
    const userRef = doc(getSyncFirebaseDb(), 'users', userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return { success: false, error: 'User not found' };
    }

    const userData = userSnap.data() as Record<string, any>;

    // Check if user already applied
    const existingApplicationQuery = query(
      collection(getSyncFirebaseDb(), `collaborations/${collaborationId}/roles/${roleId}/applications`),
      where('applicantId', '==', userId)
    );

    const existingApplicationSnap = await getDocs(existingApplicationQuery);

    if (!existingApplicationSnap.empty) {
      return { success: false, error: 'You have already applied for this role' };
    }

    // Check if user already has a role in this collaboration
    const userRolesQuery = query(
      collection(getSyncFirebaseDb(), `collaborations/${collaborationId}/roles`),
      where('participantId', '==', userId)
    );

    const userRolesSnap = await getDocs(userRolesQuery);

    if (!userRolesSnap.empty) {
      return { success: false, error: 'You already have a role in this collaboration' };
    }

    // Create application
    const applicationRef = doc(collection(getSyncFirebaseDb(), `collaborations/${collaborationId}/roles/${roleId}/applications`));

    // Create application with all required fields for CollaborationApplication interface
    const newApplication: RoleApplication = {
      id: applicationRef.id,
      collaborationId, // CRITICAL: Add collaborationId for getCollaborationApplications to work
      roleId,
      applicantId: userId,
      applicantName: userData?.displayName || '',
      applicantPhotoURL: userData?.photoURL || null,
      message: applicationData.message,
      evidence: applicationData.evidence || [],
      skills: [], // Add skills field (required by CollaborationApplication interface)
      status: ApplicationStatus.PENDING,
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
      recipientId: collaboration?.creatorId,
      type: NotificationType.ROLE_APPLICATION,
      title: 'New Role Application',
      message: `${userData?.displayName || 'Someone'} applied for the "${role.title}" role in your collaboration.`,
      data: {
        collaborationId,
        roleId,
        applicationId: applicationRef.id
      },
      priority: 'medium',
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
      collection(getSyncFirebaseDb(), `collaborations/${collaborationId}/roles/${roleId}/applications`),
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
 * Get a specific application
 */
export const getRoleApplication = async (
  collaborationId: string,
  roleId: string,
  applicationId: string
): Promise<ServiceResponse<RoleApplication>> => {
  try {
    const applicationRef = doc(getSyncFirebaseDb(), `collaborations/${collaborationId}/roles/${roleId}/applications`, applicationId);
    const applicationSnap = await getDoc(applicationRef);

    if (!applicationSnap.exists()) {
      return { success: false, error: 'Application not found' };
    }

    return { success: true, data: applicationSnap.data() as RoleApplication };
  } catch (error) {
    console.error('Error getting role application:', error);
    return { success: false, error: 'Failed to get application' };
  }
};

/**
 * Update application status (accept/reject)
 */
export const updateApplicationStatus = async (
  collaborationId: string,
  roleId: string,
  applicationId: string,
  status: ApplicationStatus.ACCEPTED | ApplicationStatus.REJECTED,
  userId: string
): Promise<ServiceResponse<RoleApplication>> => {
  try {
    // Validate collaboration and role
    const collaborationRef = doc(getSyncFirebaseDb(), 'collaborations', collaborationId);
    const collaborationSnap = await getDoc(collaborationRef);

    if (!collaborationSnap.exists()) {
      return { success: false, error: 'Collaboration not found' };
    }

    const collaboration = collaborationSnap.data() as Record<string, any>;

    // Only creator can update application status
    if (collaboration?.creatorId !== userId) {
      return { success: false, error: 'Only the collaboration creator can accept or reject applications' };
    }

    const roleRef = doc(getSyncFirebaseDb(), `collaborations/${collaborationId}/roles`, roleId);
    const roleSnap = await getDoc(roleRef);

    if (!roleSnap.exists()) {
      return { success: false, error: 'Role not found' };
    }

    const role = roleSnap.data() as CollaborationRoleData;

    if (role.status !== RoleState.OPEN) {
      return { success: false, error: 'This role is no longer accepting applications' };
    }

    // Get the application
    const applicationRef = doc(getSyncFirebaseDb(), `collaborations/${collaborationId}/roles/${roleId}/applications`, applicationId);
    const applicationSnap = await getDoc(applicationRef);

    if (!applicationSnap.exists()) {
      return { success: false, error: 'Application not found' };
    }

    const application = applicationSnap.data() as RoleApplication;

    if (application.status !== ApplicationStatus.PENDING) {
      return { success: false, error: 'This application has already been processed' };
    }

    // Update application status
    await updateDoc(applicationRef, {
      status,
      reviewedAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });

    // If accepting, update role and reject other applications
    if (status === ApplicationStatus.ACCEPTED) {
      await runTransaction(getSyncFirebaseDb(), async (transaction) => {
        // Update role status and participant
        transaction.update(roleRef, {
          status: RoleState.FILLED,
          participantId: application.applicantId,
          participantName: application.applicantName,
          participantPhotoURL: application.applicantPhotoURL,
          filledAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        });

        // Reject other pending applications
        const otherApplicationsQuery = query(
          collection(getSyncFirebaseDb(), `collaborations/${collaborationId}/roles/${roleId}/applications`),
          where('status', '==', ApplicationStatus.PENDING),
          where('id', '!=', applicationId)
        );

        const otherApplicationsSnap = await getDocs(otherApplicationsQuery);

        otherApplicationsSnap.forEach((appDoc) => {
          transaction.update(appDoc.ref, {
            status: ApplicationStatus.REJECTED,
            reviewedAt: Timestamp.now(),
            updatedAt: Timestamp.now()
          });

          // Create rejection notifications (would be done outside transaction in production)
          const appData = appDoc.data() as RoleApplication;
          createNotification({
            recipientId: appData.applicantId,
            type: NotificationType.APPLICATION_REJECTED,
            title: 'Application Rejected',
            message: `Your application for the "${role.title}" role was not selected.`,
            data: {
              collaborationId,
              roleId
            },
            priority: 'low',
            createdAt: Timestamp.now()
          });
        });

        // Update collaboration status if needed
        const allRolesQuery = query(
          collection(getSyncFirebaseDb(), `collaborations/${collaborationId}/roles`)
        );

        const allRolesSnap = await getDocs(allRolesQuery);
        const allRoles = allRolesSnap.docs.map(doc => doc.data() as CollaborationRoleData);

        const allFilled = allRoles.every(r => r.status === RoleState.FILLED || r.status === RoleState.COMPLETED);

        // Update collaboration: Add accepted user to collaborators array
        const currentCollaborators = collaboration?.collaborators || collaboration?.participants || [];
        const updatedCollaborators = currentCollaborators.includes(application.applicantId)
          ? currentCollaborators
          : [...currentCollaborators, application.applicantId];

        const collaborationUpdates: any = {
          collaborators: updatedCollaborators,
          participants: updatedCollaborators, // Keep both for backward compatibility
          updatedAt: Timestamp.now()
        };

        if (allFilled && collaboration?.status === 'open') {
          collaborationUpdates.status = 'in-progress';
        }

        transaction.update(collaborationRef, collaborationUpdates);
      });

      // Create acceptance notification
      await createNotification({
        recipientId: application.applicantId,
        type: NotificationType.APPLICATION_ACCEPTED,
        title: 'Application Accepted',
        message: `Your application for the "${role.title}" role was accepted!`,
        data: {
          collaborationId,
          roleId
        },
        priority: 'high',
        createdAt: Timestamp.now()
      });
    } else {
      // Create rejection notification
      await createNotification({
        recipientId: application.applicantId,
        type: NotificationType.APPLICATION_REJECTED,
        title: 'Application Rejected',
        message: `Your application for the "${role.title}" role was not selected.`,
        data: {
          collaborationId,
          roleId
        },
        priority: 'low',
        createdAt: Timestamp.now()
      });
    }

    // Update collaboration role counts
    await updateCollaborationRoleCounts(collaborationId, "default");

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
