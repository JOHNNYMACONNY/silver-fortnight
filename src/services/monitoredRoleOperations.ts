import { getSyncFirebaseDb } from '../firebase-config';
import { doc, runTransaction } from 'firebase/firestore';
import { transactionManager } from './transactionManager';
import { roleTransactionHandler } from './roleTransactions';
import { rollbackManager } from '../utils/rollbackManager';
import { v4 as uuidv4 } from 'uuid';

interface RoleOperation {
  type: 'update' | 'delete' | 'create';
  roleId: string;
  data?: Record<string, any>;
  metadata?: Record<string, any>;
}

interface OperationResult {
  success: boolean;
  error?: Error;
  transactionId?: string;
}

export class MonitoredRoleOperations {
  private async executeWithTransaction(
    operation: RoleOperation
  ): Promise<OperationResult> {
    const transactionId = uuidv4();

    try {
      // Begin transaction and create snapshot
      await transactionManager.beginTransaction(transactionId);
      
      if (operation.type !== 'create') {
        await rollbackManager.createSnapshot(
          operation.roleId,
          'roles',
          await this.getCurrentRoleState(operation.roleId),
          transactionId
        );
      }

      // Execute operation
      switch (operation.type) {
        case 'update':
          await roleTransactionHandler.executeRoleUpdate(operation.roleId, operation.data || {});
          break;
          
        case 'delete':
          await this.handleRoleDeletion(operation.roleId, transactionId);
          break;
          
        case 'create':
          await this.handleRoleCreation(operation.roleId, operation.data || {}, transactionId);
          break;
      }

      // Commit transaction
      await transactionManager.commitTransaction(transactionId);

      return { success: true, transactionId };
    } catch (error) {
      // Rollback on error
      await this.handleOperationFailure(transactionId, operation);
      
      return {
        success: false,
        error: error as Error,
        transactionId
      };
    }
  }

  async updateRole(
    roleId: string,
    updates: Record<string, any>,
    metadata?: Record<string, any>
  ): Promise<OperationResult> {
    return this.executeWithTransaction({
      type: 'update',
      roleId,
      data: updates,
      metadata
    });
  }

  async deleteRole(
    roleId: string,
    metadata?: Record<string, any>
  ): Promise<OperationResult> {
    return this.executeWithTransaction({
      type: 'delete',
      roleId,
      metadata
    });
  }

  async createRole(
    roleId: string,
    data: Record<string, any>,
    metadata?: Record<string, any>
  ): Promise<OperationResult> {
    return this.executeWithTransaction({
      type: 'create',
      roleId,
      data,
      metadata
    });
  }

  private async handleOperationFailure(
    transactionId: string,
    operation: RoleOperation
  ): Promise<void> {
    try {
      await rollbackManager.rollbackTransaction(transactionId);
      await transactionManager.rollbackTransaction(transactionId);
      
      // Log failure for monitoring
      await this.logOperationFailure(operation, transactionId);
    } catch (error) {
      console.error('Failed to handle operation failure:', error);
      throw error;
    }
  }

  private async handleRoleDeletion(
    roleId: string,
    transactionId: string
  ): Promise<void> {
    const roleRef = doc(getSyncFirebaseDb(), 'roles', roleId);

    await runTransaction(getSyncFirebaseDb(), async (transaction) => {
      const roleDoc = await transaction.get(roleRef);
      
      if (!roleDoc.exists()) {
        throw new Error(`Role ${roleId} not found`);
      }

      transaction.delete(roleRef);
      
      // Record deletion in transaction log
      const logRef = doc(getSyncFirebaseDb(), 'roleTransactionLogs', transactionId);
      transaction.set(logRef, {
        type: 'delete',
        roleId,
        timestamp: Date.now(),
        transactionId
      });
    });
  }

  private async handleRoleCreation(
    roleId: string,
    data: Record<string, any>,
    transactionId: string
  ): Promise<void> {
    const roleRef = doc(getSyncFirebaseDb(), 'roles', roleId);

    await runTransaction(getSyncFirebaseDb(), async (transaction) => {
      const roleDoc = await transaction.get(roleRef);
      
      if (roleDoc.exists()) {
        throw new Error(`Role ${roleId} already exists`);
      }

      transaction.set(roleRef, {
        ...data,
        createdAt: Date.now(),
        transactionId
      });
    });
  }

  private async getCurrentRoleState(roleId: string): Promise<Record<string, any>> {
    const roleRef = doc(getSyncFirebaseDb(), 'roles', roleId);
    const roleDoc = await runTransaction(getSyncFirebaseDb(), async (transaction) => {
      return await transaction.get(roleRef);
    });

    if (!roleDoc.exists()) {
      throw new Error(`Role ${roleId} not found`);
    }

    return roleDoc.data() as Record<string, any>;
  }

  private async logOperationFailure(
    operation: RoleOperation,
    transactionId: string
  ): Promise<void> {
    const logRef = doc(getSyncFirebaseDb(), 'roleOperationFailures', `${transactionId}_${operation.roleId}`);
    
    await runTransaction(getSyncFirebaseDb(), async (transaction) => {
      transaction.set(logRef, {
        operation,
        timestamp: Date.now(),
        transactionId
      });
    });
  }
}

export const monitoredRoleOperations = new MonitoredRoleOperations();