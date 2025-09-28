
import { getSyncFirebaseDb } from '../firebase-config';
import {
  collection,
  collectionGroup,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  Timestamp,
  setDoc,
} from 'firebase/firestore';
import { XPSource } from '../types/gamification';
import { ServiceResponse } from '../types/services';

export interface AggregatedUserStats {
  userId: string;
  totalXP: number;
  tradeCount: number;
  roleCount: number;
  quickResponses: number;
  evidenceCount: number;
  updatedAt: any; // Timestamp
}

/**
 * Read-only aggregation of user stats from existing collections.
 * Falls back gracefully if some collections are unavailable.
 */
export const getUserStats = async (userId: string): Promise<AggregatedUserStats> => {
  const db = getSyncFirebaseDb();

  let totalXP = 0;
  let tradeCount = 0;
  let roleCount = 0;
  let quickResponses = 0;
  let evidenceCount = 0;

  // totalXP from userXP doc
  try {
    const xpRef = doc(db, 'userXP', userId);
    const xpSnap = await getDoc(xpRef);
    totalXP = xpSnap.exists() ? ((xpSnap.data() as any).totalXP ?? 0) : 0;
  } catch {}

  // tradeCount: trades where participants contains userId and status == completed
  try {
    const tradesRef = collection(db, 'trades');
    const q = query(
      tradesRef,
      where('participants', 'array-contains', userId),
      where('status', '==', 'completed')
    );
    const snaps = await getDocs(q);
    tradeCount = snaps.size;
  } catch {}

  // roleCount: from collaboration roles subcollections where assignedUserId or participantId matches and status completed
  try {
    const rolesGroup = collectionGroup(db, 'roles');
    // Two queries due to lack of OR support
    const qAssigned = query(
      rolesGroup,
      where('assignedUserId', '==', userId),
      where('status', '==', 'completed')
    );
    const qParticipant = query(
      rolesGroup,
      where('participantId', '==', userId),
      where('status', '==', 'completed')
    );
    const [aSnap, pSnap] = await Promise.all([getDocs(qAssigned), getDocs(qParticipant)]);
    const ids = new Set<string>();
    aSnap.forEach((d) => ids.add(d.id));
    pSnap.forEach((d) => ids.add(d.id));
    roleCount = ids.size;
  } catch {}

  // quickResponses: count xpTransactions with source == quick_response
  try {
    const txRef = collection(db, 'xpTransactions');
    const q = query(txRef, where('userId', '==', userId), where('source', '==', XPSource.QUICK_RESPONSE));
    const snaps = await getDocs(q);
    quickResponses = snaps.size;
  } catch {}

  // evidenceCount: count xpTransactions with source == evidence_submission
  try {
    const txRef = collection(db, 'xpTransactions');
    const q = query(txRef, where('userId', '==', userId), where('source', '==', XPSource.EVIDENCE_SUBMISSION));
    const snaps = await getDocs(q);
    evidenceCount = snaps.size;
  } catch {}

  return {
    userId,
    totalXP,
    tradeCount,
    roleCount,
    quickResponses,
    evidenceCount,
    updatedAt: Timestamp.now(),
  };
};

/**
 * Recompute and persist user stats into userStats/{userId} document.
 */
export const recomputeAndSaveUserStats = async (
  userId: string
): Promise<ServiceResponse<AggregatedUserStats>> => {
  try {
    const db = getSyncFirebaseDb();
    const aggregated = await getUserStats(userId);
    const statsRef = doc(db, 'userStats', userId);
    await setDoc(statsRef, aggregated, { merge: true });
    return { success: true, data: aggregated };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Failed to recompute user stats' };
  }
};

/**
 * Get persisted stats if present, else compute on the fly (and optionally persist).
 */
export const getOrComputeUserStats = async (
  userId: string,
  persistIfMissing: boolean = false
): Promise<ServiceResponse<AggregatedUserStats>> => {
  try {
    const db = getSyncFirebaseDb();
    const statsRef = doc(db, 'userStats', userId);
    const snap = await getDoc(statsRef);
    if (snap.exists()) {
      return { success: true, data: snap.data() as AggregatedUserStats };
    }
    const aggregated = await getUserStats(userId);
    if (persistIfMissing) {
      await setDoc(statsRef, aggregated, { merge: true });
    }
    return { success: true, data: aggregated };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Failed to get user stats' };
  }
};

