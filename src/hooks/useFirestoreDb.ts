import { useState, useEffect } from 'react';
import { Firestore } from 'firebase/firestore';
import { getDb } from '../lib/firebase';

export function useFirestoreDb() {
  const [db, setDb] = useState<Firestore | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const initDb = async () => {
      try {
        const firestoreDb = await getDb();
        setDb(firestoreDb);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to initialize Firestore'));
      } finally {
        setLoading(false);
      }
    };

    initDb();
  }, []);

  return { db, loading, error };
}
