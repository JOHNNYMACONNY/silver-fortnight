import { getSyncFirebaseDb } from '../firebase-config';
import {
  doc,
  setDoc,
  getDoc,
  getDocs,
  collection,
  Timestamp,
  query,
  where,
  orderBy,
  updateDoc,
  QueryDocumentSnapshot,
  DocumentData
} from 'firebase/firestore';
import { CollaborationRoleData, CompletionRequest, CompletionRequestStatus, RoleState } from '../types/collaboration';
import { EmbeddedEvidence } from '../types/evidence';
import { ServiceResponse } from '../types/services';
import { createNotification } from './notifications';
import { updateCollaborationRoleCounts } from './collaborationRoles';
import { generateCollaborationPortfolioItem } from './portfolio';

/**
 * Request role completion
 */
export const requestRoleCompletion = async (
  collaborationId: string,
  roleId: string,
  userId: string,
  completionData: {
    notes: string;
    evidence?: EmbeddedEvidence[];
  }
): Promise<ServiceResponse<CompletionRequest>> => {
  try {
    // Validate role exists and user is the participant
    const roleRef = doc(db(), `collaborations/${collaborationId}/roles`, roleId);
    const roleSnap = await getDoc(roleRef);

    if (!roleSnap.exists()) {
      return { success: false, error: 'Role not found' };
    }

    const role = roleSnap.data() as CollaborationRoleData;

    if (role.status !== RoleState.FILLED) {
      return { success: false, error: 'Only filled roles can request completion' };
    }

    if (role.participantId !== userId) {
      return { success: false, error: 'Only the assigned participant can request completion' };
    }

    // Get collaboration data
    const collaborationRef = doc(db(), 'collaborations', collaborationId);
    const collaborationSnap = await getDoc(collaborationRef);

    if (!collaborationSnap.exists()) {
      return { success: false, error: 'Collaboration not found' };
    }

    const collaboration = collaborationSnap.data() as any;

    // Get user data
    const userRef = doc(db(), 'users', userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return { success: false, error: 'User not found' };
    }

    const userData = userSnap.data();

    // Check if there's already a pending completion request
    const existingRequestQuery = query(
      collection(db(), `collaborations/${collaborationId}/completionRequests`),
      where('roleId', '==', roleId),
      where('status', '==', CompletionRequestStatus.PENDING)
    );

    const existingRequestSnap = await getDocs(existingRequestQuery);

    if (!existingRequestSnap.empty) {
      return { success: false, error: 'There is already a pending completion request for this role' };
    }

    // Create completion request
    const requestRef = doc(collection(db(), `collaborations/${collaborationId}/completionRequests`));

    const newRequest: CompletionRequest = {
      id: requestRef.id,
      roleId,
      requesterId: userId,
      requesterName: (userData as any)?.displayName || '',
      notes: completionData.notes,
      evidence: completionData.evidence || [],
      status: CompletionRequestStatus.PENDING,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    await setDoc(requestRef, newRequest);

    // Update role completion status
    await updateDoc(roleRef, {
      completionStatus: CompletionRequestStatus.PENDING,
      completionRequestedAt: Timestamp.now(),
      completionNotes: completionData.notes,
      completionEvidence: completionData.evidence || [],
      updatedAt: Timestamp.now()
    });

    // Create notification for collaboration creator
    await createNotification({
      recipientId: collaboration.creatorId,
      type: 'role_completion_requested',
      title: 'Role Completion Requested',
      message: `${(userData as any)?.displayName || 'Someone'} has requested to mark the "${role.title}" role as completed.`,
      data: {
        collaborationId,
        roleId,
        requestId: requestRef.id
      },
      createdAt: Timestamp.now()
    });

    // Update collaboration status if needed
    await updateCollaborationRoleCounts(collaborationId, "default");

    return { success: true, data: newRequest };
  } catch (error) {
    console.error('Error requesting role completion:', error);
    return { success: false, error: 'Failed to request completion' };
  }
};

/**
 * Confirm role completion
 */
export const confirmRoleCompletion = async (
  collaborationId: string,
  roleId: string,
  requestId: string,
  userId: string
): Promise<ServiceResponse<CollaborationRoleData>> => {
  try {
    // Validate collaboration and user is the creator
    const collaborationRef = doc(db(), 'collaborations', collaborationId);
    const collaborationSnap = await getDoc(collaborationRef);

    if (!collaborationSnap.exists()) {
      return { success: false, error: 'Collaboration not found' };
    }

    const collaboration = collaborationSnap.data() as any;

    if (collaboration?.creatorId !== userId) {
      return { success: false, error: 'Only the collaboration creator can confirm completion' };
    }

    // Validate role exists and has a pending completion request
    const roleRef = doc(db(), `collaborations/${collaborationId}/roles`, roleId);
    const roleSnap = await getDoc(roleRef);

    if (!roleSnap.exists()) {
      return { success: false, error: 'Role not found' };
    }

    const role = roleSnap.data() as CollaborationRoleData;

    if (role.completionStatus !== CompletionRequestStatus.PENDING) {
      return { success: false, error: 'This role does not have a pending completion request' };
    }

    // Validate completion request exists
    const requestRef = doc(db(), `collaborations/${collaborationId}/completionRequests`, requestId);
    const requestSnap = await getDoc(requestRef);

    if (!requestSnap.exists()) {
      return { success: false, error: 'Completion request not found' };
    }

    const request = requestSnap.data() as CompletionRequest;

    if (request.status !== CompletionRequestStatus.PENDING) {
      return { success: false, error: 'This completion request has already been processed' };
    }

    // Update completion request status
    await updateDoc(requestRef, {
      status: CompletionRequestStatus.APPROVED,
      reviewedAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });

    // Update role status
    await updateDoc(roleRef, {
      status: RoleState.COMPLETED,
      completionStatus: CompletionRequestStatus.APPROVED,
      completionConfirmedAt: Timestamp.now(),
      completedAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });

    // Create notification for requester
    await createNotification({
      recipientId: request.requesterId,
      type: 'role_completion_confirmed',
      title: 'Role Completion Confirmed',
      message: `Your completion request for the "${role.title}" role has been approved!`,
      data: {
        collaborationId,
        roleId
      },
      createdAt: Timestamp.now()
    });

    // Update collaboration status
    await updateCollaborationRoleCounts(collaborationId, "default");

    // Generate portfolio item for the role participant
    // Note: We continue even if portfolio generation fails to avoid blocking role completion
    try {
      await generateCollaborationPortfolioItem(
        {
          id: collaborationId,
          title: collaboration.title,
          description: collaboration.description,
          creatorId: collaboration.creatorId,
          creatorName: collaboration.creatorName,
          creatorPhotoURL: collaboration.creatorPhotoURL,
          participants: collaboration.participants
        },
        {
          id: role.id,
          title: role.title,
          description: role.description,
          requiredSkills: role.requiredSkills,
          completionEvidence: role.completionEvidence,
          completedAt: Timestamp.now(),
          assignedUserId: role.assignedUserId
        },
        request.requesterId,
        true // defaultVisibility
      );
    } catch (portfolioError: any) {
      // Log portfolio generation error but don't fail the role completion
      console.warn('Portfolio generation failed for collaboration role:', portfolioError.message);
    }

    // Award XP for role completion
    try {
      const { awardRoleCompletionXP } = await import('./gamification');

      // Determine if this is a complex role based on required skills and description length
      const isComplexRole = role.requiredSkills.length > 2 || role.description.length > 200;

      await awardRoleCompletionXP(request.requesterId, role.id, isComplexRole);
    } catch (gamificationError: any) {
      // Log gamification error but don't fail the role completion
      console.warn('Gamification XP award failed for role completion:', gamificationError.message);
    }

    return {
      success: true,
      data: {
        ...role,
        status: RoleState.COMPLETED,
        completionStatus: CompletionRequestStatus.APPROVED,
        completionConfirmedAt: Timestamp.now(),
        completedAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      } as CollaborationRoleData
    };
  } catch (error) {
    console.error('Error confirming role completion:', error);
    return { success: false, error: 'Failed to confirm completion' };
  }
};

/**
 * Reject role completion
 */
export const rejectRoleCompletion = async (
  collaborationId: string,
  roleId: string,
  requestId: string,
  userId: string,
  reason: string
): Promise<ServiceResponse<CompletionRequest>> => {
  try {
    // Validate collaboration and user is the creator
    const collaborationRef = doc(db(), 'collaborations', collaborationId);
    const collaborationSnap = await getDoc(collaborationRef);

    if (!collaborationSnap.exists()) {
      return { success: false, error: 'Collaboration not found' };
    }

    const collaboration = collaborationSnap.data() as any;

    if (collaboration?.creatorId !== userId) {
      return { success: false, error: 'Only the collaboration creator can reject completion' };
    }

    // Validate role exists and has a pending completion request
    const roleRef = doc(db(), `collaborations/${collaborationId}/roles`, roleId);
    const roleSnap = await getDoc(roleRef);

    if (!roleSnap.exists()) {
      return { success: false, error: 'Role not found' };
    }

    const role = roleSnap.data() as CollaborationRoleData;

    if (role.completionStatus !== CompletionRequestStatus.PENDING) {
      return { success: false, error: 'This role does not have a pending completion request' };
    }

    // Validate completion request exists
    const requestRef = doc(db(), `collaborations/${collaborationId}/completionRequests`, requestId);
    const requestSnap = await getDoc(requestRef);

    if (!requestSnap.exists()) {
      return { success: false, error: 'Completion request not found' };
    }

    const request = requestSnap.data() as CompletionRequest;

    if (request.status !== CompletionRequestStatus.PENDING) {
      return { success: false, error: 'This completion request has already been processed' };
    }

    // Update completion request status
    await updateDoc(requestRef, {
      status: CompletionRequestStatus.REJECTED,
      reviewedAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });

    // Update role status
    await updateDoc(roleRef, {
      completionStatus: CompletionRequestStatus.REJECTED,
      updatedAt: Timestamp.now()
    });

    // Create notification for requester
    await createNotification({
      recipientId: request.requesterId,
      type: 'role_completion_rejected',
      title: 'Role Completion Rejected',
      message: `Your completion request for the "${role.title}" role was rejected. Reason: ${reason}`,
      data: {
        collaborationId,
        roleId,
        reason
      },
      createdAt: Timestamp.now()
    });

    return {
      success: true,
      data: {
        ...request,
        status: CompletionRequestStatus.REJECTED,
        reviewedAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      } as CompletionRequest
    };
  } catch (error) {
    console.error('Error rejecting role completion:', error);
    return { success: false, error: 'Failed to reject completion' };
  }
};

/**
 * Get completion requests for a collaboration
 */
export const getCompletionRequests = async (
  collaborationId: string
): Promise<ServiceResponse<CompletionRequest[]>> => {
  try {
    const requestsQuery = query(
      collection(db(), `collaborations/${collaborationId}/completionRequests`),
      orderBy('createdAt', 'desc')
    );

    const requestsSnap = await getDocs(requestsQuery);
    const requests = requestsSnap.docs.map((doc: QueryDocumentSnapshot<unknown, DocumentData>) => doc.data() as CompletionRequest);

    return { success: true, data: requests };
  } catch (error) {
    console.error('Error getting completion requests:', error);
    return { success: false, error: 'Failed to get completion requests' };
  }
};
