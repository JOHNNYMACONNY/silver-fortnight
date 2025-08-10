import { logTransaction, TransactionLog } from './transactionLogging';
import { getSyncFirebaseDb } from '../firebase-config';
import { onSnapshot, collection, query, orderBy } from 'firebase/firestore';
import { CollaborationRoleData } from '../types/collaboration';

interface RoleOperation {
  type: 'create' | 'update' | 'delete';
  roleId: string;
  collaborationId: string;
  timestamp: number;
  data: any;
  status: 'started' | 'completed' | 'failed';
  error?: string;
}

export class RoleOperationsMonitor {
  private static instance: RoleOperationsMonitor;
  private operations: Map<string, RoleOperation> = new Map();
  private unsubscribers: Map<string, () => void> = new Map();

  private constructor() {}

  static getInstance(): RoleOperationsMonitor {
    if (!RoleOperationsMonitor.instance) {
      RoleOperationsMonitor.instance = new RoleOperationsMonitor();
    }
    return RoleOperationsMonitor.instance;
  }

  startMonitoring(collaborationId: string) {
    // Monitor the roles collection
    const db = getSyncFirebaseDb();
    const rolesRef = collection(db, `collaborations/${collaborationId}/roles`);
    const rolesQuery = query(rolesRef, orderBy('updatedAt', 'desc'));

    const unsubscribe = onSnapshot(rolesQuery, 
      (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          const role = change.doc.data() as CollaborationRoleData;
          const operationId = `${collaborationId}-${change.doc.id}-${Date.now()}`;
          
          const operation: RoleOperation = {
            type: change.type as any,
            roleId: change.doc.id,
            collaborationId,
            timestamp: Date.now(),
            data: role,
            status: change.type === 'removed' ? 'completed' : 'started'
          };

          this.operations.set(operationId, operation);
          
          // Log the transaction
          this.logRoleOperation(operation);
        });
      },
      (error) => {
        // Log error through transaction logging system instead of console
        this.logError(collaborationId, error);
      }
    );

    this.unsubscribers.set(collaborationId, unsubscribe);
  }

  stopMonitoring(collaborationId: string) {
    const unsubscribe = this.unsubscribers.get(collaborationId);
    if (unsubscribe) {
      unsubscribe();
      this.unsubscribers.delete(collaborationId);
    }
  }

  private logRoleOperation(operation: RoleOperation) {
    const transactionLog: TransactionLog = {
      operation: `role_${operation.type}`,
      timestamp: operation.timestamp,
      details: {
        collaborationId: operation.collaborationId,
        roleId: operation.roleId,
        roleData: operation.data,
        operationType: operation.type
      },
      status: operation.status,
      error: operation.error
    };

    logTransaction(transactionLog);
  }

  private logError(collaborationId: string, error: any) {
    const transactionLog: TransactionLog = {
      operation: 'role_monitoring_error',
      timestamp: Date.now(),
      details: {
        collaborationId,
        errorMessage: error.message
      },
      status: 'failed',
      error: error.message
    };

    logTransaction(transactionLog);
  }

  getOperationHistory(collaborationId: string): RoleOperation[] {
    return Array.from(this.operations.values())
      .filter(op => op.collaborationId === collaborationId)
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  verifyRoleData(roleId: string, expectedData: { [K in keyof Partial<CollaborationRoleData>]: CollaborationRoleData[K] | ((value: any) => boolean) }): boolean {
    const operations = Array.from(this.operations.values())
      .filter(op => op.roleId === roleId)
      .sort((a, b) => b.timestamp - a.timestamp);

    if (operations.length === 0) return false;

    const latestOperation = operations[0];
    const currentData = latestOperation.data;

    return Object.entries(expectedData).every(([key, expectedValue]) => {
      if (typeof expectedValue === 'function') {
        return expectedValue(currentData[key as keyof CollaborationRoleData]);
      }
      return currentData[key as keyof CollaborationRoleData] === expectedValue;
    });
  }

  checkTransactionAtomicity(operationIds: string[]): boolean {
    const operations = operationIds
      .map(id => this.operations.get(id))
      .filter(op => op !== undefined) as RoleOperation[];

    if (operations.length !== operationIds.length) return false;

    const statuses = new Set(operations.map(op => op.status));
    return statuses.size === 1 && statuses.has('completed');
  }
}

// Export a singleton instance
export const roleMonitor = RoleOperationsMonitor.getInstance();