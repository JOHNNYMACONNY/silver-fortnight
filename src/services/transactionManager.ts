 

import { doc, runTransaction, setDoc } from 'firebase/firestore';
import { getSyncFirebaseDb } from '../firebase-config';

export enum IsolationLevel {
  READ_UNCOMMITTED = 'READ_UNCOMMITTED',
  READ_COMMITTED = 'READ_COMMITTED',
  REPEATABLE_READ = 'REPEATABLE_READ',
  SERIALIZABLE = 'SERIALIZABLE'
}

interface LockOptions {
  lockId: string;
  ownerId: string;
  timeout: number;
  retryCount?: number;
  retryDelay?: number;
}


export class TransactionManager {
  private isolationLevel: IsolationLevel;
  
  constructor(isolationLevel: IsolationLevel = IsolationLevel.READ_COMMITTED) {
    this.isolationLevel = isolationLevel;
  }

  async acquireLock({ lockId, ownerId, timeout, retryCount = 3, retryDelay = 1000 }: LockOptions): Promise<boolean> {
    const lockRef = doc(getSyncFirebaseDb(), 'locks', lockId);

    for (let attempt = 0; attempt < retryCount; attempt++) {
      try {
        const result = await runTransaction(getSyncFirebaseDb(), async (transaction) => {
          const lockDoc = await transaction.get(lockRef);
          
          if (!lockDoc.exists() || this.isLockExpired(lockDoc.data())) {
            const lockData = {
              ownerId,
              expiresAt: Date.now() + timeout,
              acquiredAt: Date.now()
            };
            transaction.set(lockRef, lockData);
            return true;
          }
          return false;
        });

        if (result) return true;
        
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      } catch (error) {
        console.error('Lock acquisition error:', error);
        if (attempt === retryCount - 1) throw error;
      }
    }

    return false;
  }

  async releaseLock(lockId: string, ownerId: string): Promise<boolean> {
    const lockRef = doc(getSyncFirebaseDb(), 'locks', lockId);
    
    try {
      const success = await runTransaction(getSyncFirebaseDb(), async (transaction) => {
        const lockDoc = await transaction.get(lockRef);
        
        if (!lockDoc.exists()) return true;
        
        const lockData = lockDoc.data() as any;
        if (lockData?.ownerId === ownerId) {
          transaction.delete(lockRef);
          return true;
        }
        return false;
      });

      return success;
    } catch (error) {
      console.error('Lock release error:', error);
      throw error;
    }
  }

  async beginTransaction(id: string): Promise<void> {
    const transactionRef = doc(getSyncFirebaseDb(), 'transactions', id);
    
    await setDoc(transactionRef, {
      startTime: Date.now(),
      isolationLevel: this.isolationLevel,
      status: 'active'
    });
  }

  async commitTransaction(id: string): Promise<void> {
    const transactionRef = doc(getSyncFirebaseDb(), 'transactions', id);
    
    await setDoc(transactionRef, {
      status: 'committed',
      commitTime: Date.now()
    }, { merge: true });
  }

  async rollbackTransaction(id: string): Promise<void> {
    const transactionRef = doc(getSyncFirebaseDb(), 'transactions', id);
    
    await setDoc(transactionRef, {
      status: 'rolled_back',
      rollbackTime: Date.now()
    }, { merge: true });
  }

  private isLockExpired(lockData: any): boolean {
    return lockData.expiresAt < Date.now();
  }

}

export const transactionManager = new TransactionManager(IsolationLevel.READ_COMMITTED);
