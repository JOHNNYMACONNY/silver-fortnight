// src/services/collaborations.ts
import { getSyncFirebaseDb } from '../firebase-config';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  runTransaction,
  writeBatch,
  increment,
  Timestamp
} from 'firebase/firestore';
import { CollaborationRoleData } from '../types/collaboration';
import { logger } from '@utils/logging/logger';

interface Collaboration {
  id: string;
  title: string;
  description: string;
  creatorId: string;
  creatorName: string;
  creatorPhotoURL: string;
  status: string;
  roleCount: number;
  filledRoleCount: number;
  completedRoleCount: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  roles: CollaborationRoleData[];
}

interface RoleData {
  title: string;
  description: string;
  requiredSkills: Array<{ name: string; level: string; }>;
  preferredSkills: Array<{ name: string; level: string; }>;
  status?: 'open' | 'filled' | 'completed';
  participantId?: string;
  participantPhotoURL?: string;
  applicationCount?: number;
}

export async function getUserCollaborationsWithRoles(userId: string): Promise<Collaboration[]> {
  const collaborationsRef = collection(getSyncFirebaseDb(), 'collaborations');
  const q = query(
    collaborationsRef,
    where('participantIds', 'array-contains', userId)
  );
  const snapshot = await getDocs(q);

  const collaborations: Collaboration[] = [];
  for (const docSnap of snapshot.docs) {
    const data = docSnap.data() as Record<string, any>;
    const collaborationId = docSnap.id;
    
    // Fetch roles from subcollection
    const rolesRef = collection(doc(collaborationsRef, collaborationId), 'roles');
    const rolesSnapshot = await getDocs(rolesRef);
    const roles = rolesSnapshot.docs.map(roleDoc => {
      const roleData = roleDoc.data() as Record<string, any>;
      return {
        id: roleDoc.id,
        collaborationId,
        title: roleData.title || '',
        description: roleData.description || '',
        status: roleData.status || 'open',
        childRoleIds: roleData.childRoleIds || [],
        applicationCount: roleData.applicationCount || 0,
        participantId: roleData.participantId,
        participantName: roleData.participantName,
        participantPhotoURL: roleData.participantPhotoURL,
        requiredSkills: roleData.requiredSkills || [],
        preferredSkills: roleData.preferredSkills || [],
        createdAt: roleData.createdAt,
        updatedAt: roleData.updatedAt,
        filledAt: roleData.filledAt,
        completedAt: roleData.completedAt,
        completionStatus: roleData.completionStatus
      } as CollaborationRoleData;
    });

    collaborations.push({
      id: collaborationId,
      title: data.title || 'Untitled Collaboration',
      description: data.description || '',
      creatorId: data.creatorId || '',
      creatorName: data.creatorName || '',
      creatorPhotoURL: data.creatorPhotoURL || '',
      status: data.status || 'recruiting',
      roleCount: data.roleCount || 0,
      filledRoleCount: data.filledRoleCount || 0,
      completedRoleCount: data.completedRoleCount || 0,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      roles: roles
    });
  }
  return collaborations;
}

export async function createInitialRoles(
  collaborationId: string,
  rolesData: RoleData[]
): Promise<string[]> {
  const collaborationRef = doc(getSyncFirebaseDb(), 'collaborations', collaborationId);
  const rolesCollection = collection(collaborationRef, 'roles');

  return await runTransaction(getSyncFirebaseDb(), async (transaction) => {
    const collaborationDoc = await transaction.get(collaborationRef);
    if (!collaborationDoc.exists()) {
      throw new Error('Collaboration not found');
    }

    const roleIds: string[] = [];
    const now = Timestamp.now();

    // Create all role documents in the same transaction
    for (const roleData of rolesData) {
      const roleRef = doc(rolesCollection);
      transaction.set(roleRef, {
        ...roleData,
        status: 'open',
        applicationCount: 0,
        createdAt: now,
        updatedAt: now
      });
      roleIds.push(roleRef.id);
    }

    // Update collaboration document with total role count
    transaction.update(collaborationRef, {
      roleCount: increment(rolesData.length),
      updatedAt: now
    });

    return roleIds;
  });
}

export async function createRole(collaborationId: string, roleData: RoleData): Promise<string> {
  const [roleId] = await createInitialRoles(collaborationId, [roleData]);
  return roleId;
}

export async function updateRole(
  collaborationId: string,
  roleId: string,
  roleData: Partial<RoleData>
): Promise<void> {
  const collaborationRef = doc(getSyncFirebaseDb(), 'collaborations', collaborationId);
  const roleRef = doc(collaborationRef, 'roles', roleId);

  await runTransaction(getSyncFirebaseDb(), async (transaction) => {
    const roleDoc = await transaction.get(roleRef);
    if (!roleDoc.exists()) {
      throw new Error('Role not found');
    }

    const currentRoleData = roleDoc.data() as Record<string, any>;
    const wasFilledBefore = currentRoleData.status === 'filled';
    const wasCompletedBefore = currentRoleData.status === 'completed';
    const willBeFilled = roleData.status === 'filled';
    const willBeCompleted = roleData.status === 'completed';

    // Update role document
    transaction.update(roleRef, {
      ...roleData,
      updatedAt: Timestamp.now()
    });

    // Update collaboration counters if status changed
    const updates: any = { updatedAt: Timestamp.now() };
    if (wasFilledBefore && !willBeFilled && !willBeCompleted) {
      updates.filledRoleCount = increment(-1);
    } else if (!wasFilledBefore && willBeFilled) {
      updates.filledRoleCount = increment(1);
    }
    
    if (wasCompletedBefore && !willBeCompleted) {
      updates.completedRoleCount = increment(-1);
    } else if (!wasCompletedBefore && willBeCompleted) {
      updates.completedRoleCount = increment(1);
      if (wasFilledBefore) {
        updates.filledRoleCount = increment(-1);
      }
    }

    transaction.update(collaborationRef, updates);
  });
}

export async function deleteRole(collaborationId: string, roleId: string): Promise<void> {
  const collaborationRef = doc(getSyncFirebaseDb(), 'collaborations', collaborationId);
  const roleRef = doc(collaborationRef, 'roles', roleId);

  await runTransaction(getSyncFirebaseDb(), async (transaction) => {
    const roleDoc = await transaction.get(roleRef);
    if (!roleDoc.exists()) {
      throw new Error('Role not found');
    }

    const roleData = roleDoc.data() as Record<string, any>;
    if (roleData.status !== 'open') {
      throw new Error('Cannot delete a role that is not open');
    }

    // Delete role document
    transaction.delete(roleRef);

    // Update collaboration counters
    transaction.update(collaborationRef, {
      roleCount: increment(-1),
      updatedAt: Timestamp.now()
    });
  });
}

export async function getRoles(collaborationId: string): Promise<CollaborationRoleData[]> {
  const collaborationRef = doc(getSyncFirebaseDb(), 'collaborations', collaborationId);
  const rolesCollection = collection(collaborationRef, 'roles');
  const snapshot = await getDocs(rolesCollection);

  return snapshot.docs
    .map(doc => {
      const data = doc.data() as Record<string, any>;
      if (!data) {
        return null;
      }
      
      return {
        id: doc.id,
        collaborationId,
        title: data.title || '',
        description: data.description || '',
        status: data.status || 'open',
        childRoleIds: data.childRoleIds || [],
        applicationCount: data.applicationCount || 0,
        parentRoleId: data.parentRoleId,
        participantId: data.participantId,
        participantName: data.participantName,
        participantPhotoURL: data.participantPhotoURL,
        requiredSkills: data.requiredSkills || [],
        preferredSkills: data.preferredSkills || [],
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        filledAt: data.filledAt,
        completedAt: data.completedAt,
        completionStatus: data.completionStatus
      } as CollaborationRoleData;
    })
    .filter(Boolean) as CollaborationRoleData[]; // Filter out any null values
}

export async function batchUpdateRoles(
  collaborationId: string,
  updates: Array<{ roleId: string; data: Partial<RoleData>; }>
): Promise<void> {
  const batch = writeBatch(getSyncFirebaseDb());
  const collaborationRef = doc(getSyncFirebaseDb(), 'collaborations', collaborationId);

  let filledCountDelta = 0;
  let completedCountDelta = 0;

  // First get all role documents to check status changes
  const rolePromises = updates.map(async ({ roleId }) => {
    const roleRef = doc(collaborationRef, 'roles', roleId);
    return getDoc(roleRef);
  });
  const roleDocs = await Promise.all(rolePromises);

  // Calculate counter changes and create updates
  updates.forEach(({ roleId, data }, index) => {
    const roleRef = doc(collaborationRef, 'roles', roleId);
    const currentData = roleDocs[index].data() as Record<string, any>;
    
    if (currentData) {
      const wasFilledBefore = currentData.status === 'filled';
      const wasCompletedBefore = currentData.status === 'completed';
      const willBeFilled = data.status === 'filled';
      const willBeCompleted = data.status === 'completed';

      if (wasFilledBefore && !willBeFilled && !willBeCompleted) filledCountDelta--;
      else if (!wasFilledBefore && willBeFilled) filledCountDelta++;
      
      if (wasCompletedBefore && !willBeCompleted) completedCountDelta--;
      else if (!wasCompletedBefore && willBeCompleted) {
        completedCountDelta++;
        if (wasFilledBefore) filledCountDelta--;
      }
    }

    batch.update(roleRef, {
      ...data,
      updatedAt: Timestamp.now()
    });
  });

  // Update collaboration document if counters changed
  if (filledCountDelta !== 0 || completedCountDelta !== 0) {
    const updates: any = { updatedAt: Timestamp.now() };
    if (filledCountDelta !== 0) updates.filledRoleCount = increment(filledCountDelta);
    if (completedCountDelta !== 0) updates.completedRoleCount = increment(completedCountDelta);
    batch.update(collaborationRef, updates);
  }

  await batch.commit();
}

/**
 * Get a single collaboration by ID with basic data
 */
export async function getCollaboration(collaborationId: string): Promise<{
  success: boolean;
  data?: any;
  error?: { message: string };
}> {
  try {
    const collaborationRef = doc(getSyncFirebaseDb(), 'collaborations', collaborationId);
    const collaborationSnap = await getDoc(collaborationRef);

    if (!collaborationSnap.exists()) {
      return {
        success: false,
        error: { message: 'Collaboration not found' }
      };
    }

    const data = collaborationSnap.data() as Record<string, any>;
    const collaboration = {
      id: collaborationSnap.id,
      title: data?.title || '',
      description: data?.description || '',
      creatorId: data?.creatorId || '',
      creatorName: data?.creatorName || '',
      creatorPhotoURL: data?.creatorPhotoURL || '',
      status: data?.status || 'recruiting',
      roleCount: data?.roleCount || 0,
      filledRoleCount: data?.filledRoleCount || 0,
      completedRoleCount: data?.completedRoleCount || 0,
      createdAt: data?.createdAt,
      updatedAt: data?.updatedAt
    };

    return {
      success: true,
      data: collaboration
    };
  } catch (error: any) {
    logger.error('Error getting collaboration:', 'SERVICE', {}, error as Error);
    return {
      success: false,
      error: { message: error.message || 'Failed to get collaboration' }
    };
  }
}
