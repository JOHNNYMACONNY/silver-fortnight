import * as admin from 'firebase-admin';

const db = admin.firestore();

export interface ScheduledChallenge {
  id: string;
  title: string;
  status: 'draft' | 'upcoming' | 'active' | 'completed' | 'cancelled';
  startDate?: admin.firestore.Timestamp;
  endDate?: admin.firestore.Timestamp;
  recurrence?: 'daily' | 'weekly' | 'none';
}

export const activateScheduledChallenges = async (): Promise<{ activated: number; error: string | null }> => {
  try {
    const now = admin.firestore.Timestamp.now();
    const snap = await db.collection('challenges')
      .where('status', '==', 'upcoming')
      .where('startDate', '<=', now)
      .get();
    let activated = 0;
    const batch = db.batch();
    snap.forEach(docSnap => {
      batch.update(docSnap.ref, { status: 'active', lastUpdatedAt: now });
      activated += 1;
    });
    if (activated > 0) await batch.commit();
    return { activated, error: null };
  } catch (e: any) {
    return { activated: 0, error: e?.message || 'Failed to activate scheduled challenges' };
  }
};

export const completeExpiredChallenges = async (): Promise<{ completed: number; error: string | null }> => {
  try {
    const now = admin.firestore.Timestamp.now();
    const snap = await db.collection('challenges')
      .where('status', '==', 'active')
      .where('endDate', '<=', now)
      .get();
    let completed = 0;
    const batch = db.batch();
    snap.forEach(docSnap => {
      batch.update(docSnap.ref, { status: 'completed', lastUpdatedAt: now });
      completed += 1;
    });
    if (completed > 0) await batch.commit();
    return { completed, error: null };
  } catch (e: any) {
    return { completed: 0, error: e?.message || 'Failed to complete expired challenges' };
  }
};

export const scheduleRecurringChallenges = async (): Promise<{ scheduled: number; error: string | null }> => {
  try {
    const now = admin.firestore.Timestamp.now();
    const aWeek = 7 * 24 * 60 * 60 * 1000;
    const templates = await db.collection('challengeTemplates')
      .where('recurrence', 'in', ['daily', 'weekly'])
      .limit(20)
      .get();
    let scheduled = 0;
    const batch = db.batch();
    templates.forEach(t => {
      const data = t.data();
      const nextStart = data.recurrence === 'daily'
        ? admin.firestore.Timestamp.fromMillis(now.toMillis() + 24 * 60 * 60 * 1000)
        : admin.firestore.Timestamp.fromMillis(now.toMillis() + aWeek);
      const nextEnd = data.recurrence === 'daily'
        ? admin.firestore.Timestamp.fromMillis(nextStart.toMillis() + 24 * 60 * 60 * 1000)
        : admin.firestore.Timestamp.fromMillis(nextStart.toMillis() + aWeek);
      const ref = db.collection('challenges').doc();
      batch.set(ref, {
        title: data.title,
        description: data.description,
        category: data.category,
        difficulty: data.difficulty,
        rewards: data.rewards,
        status: 'upcoming',
        startDate: nextStart,
        endDate: nextEnd,
        createdBy: 'system',
        templateId: t.id,
        isPersonalized: false,
        createdAt: now,
      });
      scheduled += 1;
    });
    if (scheduled > 0) await batch.commit();
    return { scheduled, error: null };
  } catch (e: any) {
    return { scheduled: 0, error: e?.message || 'Failed to schedule recurring challenges' };
  }
};


