import { getSyncFirebaseDb } from '../firebase-config';
import { doc, updateDoc, getDoc, Timestamp, collection, query, where, getDocs } from 'firebase/firestore';
import { CollaborationRoleData, RoleState, Collaboration } from '../types/collaboration'; // Added RoleState and Collaboration
import { getAuth } from 'firebase/auth';
import { createNotification } from './notifications';

/**
 * Service for handling role abandonment in collaborations.
 * This includes abandoning filled roles, reopening abandoned roles,
 * and marking roles as no longer needed.
 */

export const abandonRole = async (roleId: string, reason: string): Promise<void> => {
  try {
    const auth = getAuth();
    if (!auth.currentUser) {
      throw new Error('You must be logged in to abandon a role');
    }

    // Get the role document
    const db = getSyncFirebaseDb();
    const roleRef = doc(db, 'collaborationRoles', roleId);
    const roleSnap = await getDoc(roleRef);

    if (!roleSnap.exists()) {
      throw new Error('Role not found');
    }

    const roleData = roleSnap.data() as CollaborationRoleData;
    const collaborationRef = doc(db, 'collaborations', roleData.collaborationId);
    const collaborationSnap = await getDoc(collaborationRef);

    if (!collaborationSnap.exists()) {
      throw new Error('Collaboration not found');
    }
    const collaborationData = collaborationSnap.data() as Collaboration; // Added type assertion

    if (collaborationData.ownerId !== auth.currentUser.uid) { // Used collaborationData.ownerId
      throw new Error('Only the collaboration creator can abandon a role');
    }

    // Check if the role is in a state that can be abandoned
    if (roleData.status !== RoleState.FILLED) { // Used RoleState.FILLED
      throw new Error('Only filled roles can be abandoned');
    }

    // Store the current participant information
    const previousParticipantId = roleData.participantId;
    const previousParticipantName = roleData.participantId;
    const previousParticipantPhotoURL = roleData.participantPhotoURL;

    // Update the role
    await updateDoc(roleRef, {
      status: 'abandoned',
      abandonmentReason: reason,
      abandonedAt: Timestamp.now(),
      previousParticipantId,
      previousParticipantName,
      previousParticipantPhotoURL,
      participantId: null,
      participantName: null,
      participantPhotoURL: null,
      updatedAt: Timestamp.now()
    });

    // Create notification for the previous participant
    if (previousParticipantId) {
      await createNotification({
        recipientId: previousParticipantId,
        type: 'system',
        title: 'Role Abandoned',
        message: `Your role "${roleData.title}" in collaboration "${collaborationData.name}" has been marked as abandoned.`,
        createdAt: Timestamp.now(),
        data: {
          url: `/collaborations/${roleData.collaborationId}`
        }
      });
    }

  } catch (error) {
    console.error('Error abandoning role:', error);
    throw error;
  }
};

/**
 * Reopen an abandoned role
 * @param roleId The ID of the role to reopen
 * @param reason The reason for reopening
 * @returns Promise that resolves when the role is reopened
 */
export const reopenRole = async (roleId: string, _reason: string): Promise<void> => {
  try {
    const auth = getAuth();
    if (!auth.currentUser) {
      throw new Error('You must be logged in to reopen a role');
    }

    // Get the role document
    const db = getSyncFirebaseDb();
    const roleRef = doc(db, 'collaborationRoles', roleId);
    const roleSnap = await getDoc(roleRef);

    if (!roleSnap.exists()) {
      throw new Error('Role not found');
    }

    const roleData = roleSnap.data() as CollaborationRoleData;
    const collaborationRef = doc(db, 'collaborations', roleData.collaborationId);
    const collaborationSnap = await getDoc(collaborationRef);

    if (!collaborationSnap.exists()) {
      throw new Error('Collaboration not found');
    }
    const collaborationData = collaborationSnap.data() as Collaboration; // Added type assertion

    if (collaborationData.ownerId !== auth.currentUser.uid) { // Used collaborationData.ownerId
      throw new Error('Only the collaboration creator can reopen a role');
    }

    // Check if the role is in a state that can be reopened
    if (roleData.status !== RoleState.ABANDONED) { // Used RoleState.ABANDONED
      throw new Error('Only abandoned roles can be reopened');
    }

    // Update the role
    await updateDoc(roleRef, {
      status: RoleState.OPEN, // Used RoleState.OPEN
      updatedAt: Timestamp.now()
    });

    // Create notification for the previous participant
    if (roleData.previousParticipantId) {
      await createNotification({
        recipientId: roleData.previousParticipantId,
        type: 'system',
        title: 'Role Reopened',
        message: `A role you previously held, "${roleData.title}" in collaboration "${collaborationData.name}", has been reopened.`,
        createdAt: Timestamp.now(),
        data: {
          url: `/collaborations/${roleData.collaborationId}`
        }
      });
    }

  } catch (error) {
    console.error('Error reopening role:', error);
    throw error;
  }
};

/**
 * Mark an abandoned role as no longer needed
 * @param roleId The ID of the role to mark as no longer needed
 * @param reason The reason for marking as no longer needed
 * @returns Promise that resolves when the role is marked as no longer needed
 */
export const markRoleAsUnneeded = async (roleId: string, _reason: string): Promise<void> => {
  try {
    const auth = getAuth();
    if (!auth.currentUser) {
      throw new Error('You must be logged in to mark a role as no longer needed');
    }

    // Get the role document
    const db = getSyncFirebaseDb();
    const roleRef = doc(db, 'collaborationRoles', roleId);
    const roleSnap = await getDoc(roleRef);

    if (!roleSnap.exists()) {
      throw new Error('Role not found');
    }

    const roleData = roleSnap.data() as CollaborationRoleData;
    const collaborationRef = doc(db, 'collaborations', roleData.collaborationId);
    const collaborationSnap = await getDoc(collaborationRef);

    if (!collaborationSnap.exists()) {
      throw new Error('Collaboration not found');
    }
    const collaborationData = collaborationSnap.data() as Collaboration; // Added type assertion

    if (collaborationData.ownerId !== auth.currentUser.uid) { // Used collaborationData.ownerId
      throw new Error('Only the collaboration creator can mark a role as no longer needed');
    }

    // Check if the role is in a state that can be marked as no longer needed
    if (roleData.status !== RoleState.ABANDONED) { // Used RoleState.ABANDONED
      throw new Error('Only abandoned roles can be marked as no longer needed');
    }

    // Update the role
    await updateDoc(roleRef, {
      status: RoleState.UNNEEDED, // Used RoleState.UNNEEDED
      updatedAt: Timestamp.now()
    });

    // Create notification for the previous participant
    if (roleData.previousParticipantId) {
      await createNotification({
        recipientId: roleData.previousParticipantId,
        type: 'system',
        title: 'Role No Longer Needed',
        message: `A role you previously held, "${roleData.title}" in collaboration "${collaborationData.name}", has been marked as no longer needed.`,
        createdAt: Timestamp.now(),
        data: {
          url: `/collaborations/${roleData.collaborationId}`
        }
      });
    }

  } catch (error) {
    console.error('Error marking role as unneeded:', error);
    throw error;
  }
};

/**
 * Get all abandoned roles for a collaboration
 * @param collaborationId The ID of the collaboration
 * @returns Promise that resolves to array of abandoned roles
 */
export const getAbandonedRoles = async (collaborationId: string): Promise<CollaborationRoleData[]> => { // Changed from CollaborationRole[]
  try {
    const db = getSyncFirebaseDb();
    const q = query(
      collection(db, 'collaborationRoles'),
      where('collaborationId', '==', collaborationId),
      where('status', '==', RoleState.ABANDONED) // Used RoleState.ABANDONED
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return { id: doc.id, ...data } as CollaborationRoleData;
    });

  } catch (error) {
    console.error('Error getting abandoned roles:', error);
    throw error;
  }
};
