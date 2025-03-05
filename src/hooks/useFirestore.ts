import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, QueryConstraint, DocumentData } from 'firebase/firestore';
import { getDb, withRetry } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';

interface FirestoreState<T> {
  data: T[];
  loading: boolean;
  error: Error | null;
}

export function useFirestore<T extends DocumentData>(
  collectionName: string,
  queryConstraints: QueryConstraint[] = []
) {
  const [state, setState] = useState<FirestoreState<T>>({
    data: [],
    loading: true,
    error: null,
  });

  // Get auth state
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    // Don't set up subscription until auth is ready and user is logged in
    if (authLoading) {
      setState(prev => ({ ...prev, loading: true }));
      return;
    }

    if (!user) {
      setState({ data: [], loading: false, error: null });
      return;
    }

    let unsubscribe: (() => void) | undefined;
    
    const setupSubscription = async () => {
      try {
        console.debug(`Setting up Firestore subscription for ${collectionName}`, {
          queryConstraints: queryConstraints.map(qc => qc.type)
        });
        
        const db = await getDb();
        const collectionRef = collection(db, collectionName);
        if (!collectionRef) {
          console.error(`Collection ${collectionName} not found`);
          setState({
            data: [],
            loading: false,
            error: new Error(`Collection ${collectionName} not found`),
          });
          return;
        }

        // Set up real-time listener with retry mechanism
        const unsub = await withRetry(
          () => new Promise<() => void>((resolve, reject) => {
            try {
              const unsubscribe = onSnapshot(
                query(collectionRef, ...queryConstraints),
                (snapshot) => {
                  console.debug(`Received Firestore snapshot for ${collectionName}:`, {
                    documentCount: snapshot.docs.length,
                    timestamp: new Date().toISOString()
                  });

                  const data = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                  })) as T[];

                  setState({
                    data,
                    loading: false,
                    error: null,
                  });
                },
                (error) => {
                  console.error(`Firestore subscription error for ${collectionName}:`, {
                    error,
                    code: error.code,
                    message: error.message,
                    timestamp: new Date().toISOString()
                  });
                  setState((prev) => ({
                    ...prev,
                    loading: false,
                    error: error as Error,
                  }));
                  reject(error);
                }
              );
              resolve(unsubscribe);
            } catch (error) {
              reject(error);
            }
          }),
          3, // maxRetries
          1000, // baseDelay
          (attempt, error) => {
            console.warn(
              `Retrying Firestore subscription for ${collectionName} (attempt ${attempt}):`,
              error
            );
          }
        );
        
        unsubscribe = unsub;
      } catch (error) {
        console.error(`Failed to set up Firestore subscription for ${collectionName}:`, error);
        setState((prev) => ({
          ...prev,
          loading: false,
          error: error as Error,
        }));
      }
    };

    setupSubscription();

    // Cleanup subscription
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [collectionName, user, authLoading, ...queryConstraints]);

  return state;
}
