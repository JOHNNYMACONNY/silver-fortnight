import { getSyncFirebaseDb } from '../firebase-config';
import { Timestamp, doc, getDoc, runTransaction, collection } from 'firebase/firestore';
import { ServiceResponse } from '../types/services';
import { UserSkillXP, SkillXPTransaction } from '../types/gamification';
import { markSkillPracticeDay } from './streaks';

/**
 * Add skill-specific XP and record a transaction.
 * Creates `userSkillXP` doc if missing. Returns updated record.
 */
export const addSkillXP = async (
  userId: string,
  skillName: string,
  amount: number,
  source: string,
  sourceId?: string,
  description?: string
): Promise<ServiceResponse<UserSkillXP>> => {
  try {
    const db = getSyncFirebaseDb();
    const key = `${userId}_${skillName.toLowerCase().replace(/\s+/g, '_')}`;
    const ref = doc(db, 'userSkillXP', key);

    const updated = await runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);

      let current: UserSkillXP;
      if (!snap.exists()) {
        current = {
          userId,
          skillName,
          totalXP: 0,
          level: 1,
          masteryLevel: 'novice',
          lastUpdated: Timestamp.now(),
          createdAt: Timestamp.now()
        };
      } else {
        current = snap.data() as UserSkillXP;
      }

      const newTotal = Math.max(0, current.totalXP + amount);
      const { level, mastery } = calculateSkillLevel(newTotal);

      const next: UserSkillXP = {
        ...current,
        totalXP: newTotal,
        level,
        masteryLevel: mastery,
        lastUpdated: Timestamp.now()
      };

      tx.set(ref, next as any);

      // write transaction record
      const txnRef = doc(collection(db, 'skillXPTransactions'));
      const txn: SkillXPTransaction = {
        id: txnRef.id,
        userId,
        skillName,
        amount,
        source,
        sourceId,
        description,
        createdAt: Timestamp.now()
      };
      tx.set(txnRef, txn as any);

      return next;
    });

    // Mark skill practice streak (non-blocking)
    try { await markSkillPracticeDay(userId); } catch {}
    return { success: true, data: updated };
  } catch (error: any) {
    console.error('addSkillXP failed', error);
    return { success: false, error: error?.message || 'Failed to add skill XP' };
  }
};

export const getUserSkillXP = async (
  userId: string,
  skillName: string
): Promise<ServiceResponse<UserSkillXP>> => {
  try {
    const db = getSyncFirebaseDb();
    const key = `${userId}_${skillName.toLowerCase().replace(/\s+/g, '_')}`;
    const ref = doc(db, 'userSkillXP', key);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      return { success: false, error: 'Not found' };
    }
    return { success: true, data: snap.data() as UserSkillXP };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Failed to load skill XP' };
  }
};

function calculateSkillLevel(totalXP: number): { level: number; mastery: UserSkillXP['masteryLevel'] } {
  // Simple thresholds; can be tuned later or moved to config
  if (totalXP >= 5000) return { level: 5, mastery: 'master' };
  if (totalXP >= 2500) return { level: 4, mastery: 'expert' };
  if (totalXP >= 1200) return { level: 3, mastery: 'advanced' };
  if (totalXP >= 400) return { level: 2, mastery: 'intermediate' };
  return { level: 1, mastery: 'novice' };
}


