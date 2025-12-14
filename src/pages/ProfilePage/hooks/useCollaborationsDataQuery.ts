/**
 * React Query Hook for Collaborations Data
 * Phase 3B: Data Refetch Optimization
 * 
 * Replaces useCollaborationsData with React Query for intelligent caching
 */

import { useQuery } from '@tanstack/react-query';
import { collaborationService } from '../../../services/entities/CollaborationService';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { initializeFirebase, getFirebaseInstances } from '../../../firebase-config';
import { logger } from '@utils/logging/logger';

/**
 * Collaboration data interface
 */
export interface CollaborationData {
  id: string;
  title: string;
  description?: string;
  creatorId: string;
  participants?: string[];
  status?: string;
  [key: string]: any;
}

/**
 * Fetch collaborations for a user
 */
const fetchCollaborations = async (targetUserId: string): Promise<CollaborationData[]> => {
  try {
    const res = await collaborationService.getCollaborationsForUser(targetUserId);
    if (res.error) {
      logger.error('Failed to load collaborations:', 'PAGE', {}, res.error as Error);
      return [];
    }
    return (res.data as CollaborationData[]) || [];
  } catch (error) {
    logger.error('Error fetching collaborations:', 'PAGE', {}, error as Error);
    return [];
  }
};

/**
 * Fetch user role for a specific collaboration
 */
const fetchUserRole = async (
  collaborationId: string,
  targetUserId: string
): Promise<string | null> => {
  try {
    await initializeFirebase();
    const { db } = await getFirebaseInstances();
    if (!db) return null;

    const rolesRef = collection(db, "collaborations", collaborationId, "roles");
    const q = query(rolesRef, where("participantId", "==", targetUserId));
    const snap = await getDocs(q);
    const first = snap.docs[0]?.data() as any | undefined;
    return first?.title ? String(first.title) : null;
  } catch (error) {
    logger.warn('Could not fetch user role:', 'PAGE', error);
    return null;
  }
};

/**
 * React Query hook for collaborations data
 */
export const useCollaborationsDataQuery = (
  targetUserId: string | undefined,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: ['collaborations', targetUserId],
    queryFn: () => fetchCollaborations(targetUserId!),
    enabled: !!targetUserId && enabled,
    // Data is fresh for 5 minutes (inherited from global config)
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * React Query hook for user role in a collaboration
 */
export const useCollaborationRoleQuery = (
  collaborationId: string,
  targetUserId: string | undefined,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: ['collaboration-role', collaborationId, targetUserId],
    queryFn: () => fetchUserRole(collaborationId, targetUserId!),
    enabled: !!collaborationId && !!targetUserId && enabled,
    // Roles don't change often, cache for 10 minutes
    staleTime: 10 * 60 * 1000,
  });
};

