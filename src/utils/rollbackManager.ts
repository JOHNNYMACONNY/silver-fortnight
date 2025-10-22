import { doc, getDoc, setDoc, collection, query, where, getDocs, writeBatch } from 'firebase/firestore';
import { getSyncFirebaseDb } from '../firebase-config';
import { v4 as uuidv4 } from 'uuid';

interface StateSnapshot {
  id: string;
  timestamp: number;
  entityId: string;
  entityType: string;
  data: any;
  metadata: {
    version: number;
    checksum: string;
    transactionId: string;
  };
}

export class RollbackManager {
  private readonly snapshotCollection = 'stateSnapshots';
  
  async createSnapshot(
    entityId: string, 
    entityType: string, 
    data: any, 
    transactionId: string
  ): Promise<StateSnapshot> {
    const snapshot: StateSnapshot = {
      id: uuidv4(),
      timestamp: Date.now(),
      entityId,
      entityType,
      data: this.deepClone(data),
      metadata: {
        version: await this.getCurrentVersion(entityType, entityId),
        checksum: await this.calculateChecksum(data),
        transactionId
      }
    };

    const db = getSyncFirebaseDb();
    await setDoc(
      doc(db, this.snapshotCollection, snapshot.id), 
      snapshot
    );

    return snapshot;
  }

  async restoreSnapshot(snapshotId: string): Promise<void> {
    const snapshot = await this.getSnapshot(snapshotId);
    
    if (!snapshot) {
      throw new Error(`Snapshot ${snapshotId} not found`);
    }

    if (!await this.validateSnapshot(snapshot)) {
      throw new Error(`Invalid snapshot ${snapshotId}`);
    }

    await this.applySnapshot(snapshot);
  }

  async rollbackTransaction(transactionId: string): Promise<void> {
    const snapshots = await this.getTransactionSnapshots(transactionId);
    
    // Sort snapshots in reverse chronological order
    const sortedSnapshots = snapshots.sort((a, b) => b.timestamp - a.timestamp);
    
    const db = getSyncFirebaseDb();
    const batch = writeBatch(db);

    try {
      for (const snapshot of sortedSnapshots) {
        const entityRef = doc(db, snapshot.entityType, snapshot.entityId);
        batch.set(entityRef, {
          ...snapshot.data,
          rollbackTimestamp: Date.now(),
          rollbackSnapshotId: snapshot.id
        });
      }

      await batch.commit();
    } catch (error) {
      console.error(`Failed to rollback transaction ${transactionId}:`, error);
      throw error;
    }
  }

  async getLastValidSnapshot(entityId: string, entityType: string): Promise<StateSnapshot | null> {
    const db = getSyncFirebaseDb();
    const snapshotsRef = collection(db, this.snapshotCollection);
    const q = query(
      snapshotsRef,
      where('entityId', '==', entityId),
      where('entityType', '==', entityType)
    );

    const snapshots = await getDocs(q);
    const validSnapshots = await Promise.all(
      snapshots.docs
        .map(doc => doc.data() as StateSnapshot)
        .filter(async snapshot => await this.validateSnapshot(snapshot))
    );

    return validSnapshots.sort((a, b) => b.timestamp - a.timestamp)[0] || null;
  }

  private async getSnapshot(snapshotId: string): Promise<StateSnapshot | null> {
    const db = getSyncFirebaseDb();
    const snapshotRef = doc(db, this.snapshotCollection, snapshotId);
    const snapshotDoc = await getDoc(snapshotRef);
    
    return snapshotDoc.exists() ? (snapshotDoc.data() as StateSnapshot) : null;
  }

  private async getTransactionSnapshots(transactionId: string): Promise<StateSnapshot[]> {
    const db = getSyncFirebaseDb();
    const snapshotsRef = collection(db, this.snapshotCollection);
    const q = query(
      snapshotsRef,
      where('metadata.transactionId', '==', transactionId)
    );

    const snapshots = await getDocs(q);
    return snapshots.docs.map(doc => doc.data() as StateSnapshot);
  }

  private async validateSnapshot(snapshot: StateSnapshot): Promise<boolean> {
    if (!snapshot?.metadata?.version || !snapshot?.metadata?.checksum) {
      return false;
    }

    const calculatedChecksum = await this.calculateChecksum(snapshot.data);
    return calculatedChecksum === snapshot.metadata.checksum;
  }

  private async getCurrentVersion(entityType: string, entityId: string): Promise<number> {
    const db = getSyncFirebaseDb();
    const entityRef = doc(db, entityType, entityId);
    const entityDoc = await getDoc(entityRef);
    
    if (!entityDoc.exists()) {
      return 1;
    }

    const data = entityDoc.data() as any;
    return (data?.version || 0) + 1;
  }

  private async calculateChecksum(data: any): Promise<string> {
    const str = JSON.stringify(data);
    const msgBuffer = new TextEncoder().encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  private async applySnapshot(snapshot: StateSnapshot): Promise<void> {
    const db = getSyncFirebaseDb();
    const entityRef = doc(db, snapshot.entityType, snapshot.entityId);
    
    await setDoc(entityRef, {
      ...snapshot.data,
      restoredFromSnapshot: snapshot.id,
      restoredAt: Date.now()
    });
  }

  private deepClone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
  }
}

export const rollbackManager = new RollbackManager();