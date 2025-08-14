import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { getSyncFirebaseDb } from '../firebase-config';

export type AnalyticsEvent = {
  name: string;
  metadata?: Record<string, any>;
};

export async function logEvent(name: string, metadata?: Record<string, any>): Promise<void> {
  try {
    const db = getSyncFirebaseDb();
    if (!db) return;
    await addDoc(collection(db, 'events'), {
      name,
      metadata: metadata || {},
      createdAt: serverTimestamp(),
    });
  } catch {
    // Fail silently; analytics should never block UX
  }
}


