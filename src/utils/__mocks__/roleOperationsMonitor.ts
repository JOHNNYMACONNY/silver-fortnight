import { RoleState } from '../../types/collaboration';
import { MockTimestamp } from '../__tests__/testUtils';
import { 
  TestRoleAssignment, 
  TestRoleStatusChange, 
  TestRoleOperation,
  TestOperationResult,
  isValidRoleTransition,
  TestRoleError
} from '../__tests__/testTypes';

export class RoleOperationsMonitor {
  private static instance: RoleOperationsMonitor;
  private operationHistory: TestRoleOperation[] = [];
  private failedOperations: Array<TestRoleOperation & { error: Error }> = [];
  private roleAssignments = new Map<string, string>();
  private existingRoles = new Set<string>();

  static getInstance(): RoleOperationsMonitor {
    if (!RoleOperationsMonitor.instance) {
      RoleOperationsMonitor.instance = new RoleOperationsMonitor();
    }
    return RoleOperationsMonitor.instance;
  }

  async startMonitoring(): Promise<TestOperationResult> {
    return { success: true };
  }

  async trackRoleCreation(role: any): Promise<TestOperationResult> {
    try {
      // Check for duplicate role ID
      if (this.existingRoles.has(role.id)) {
        const error = new TestRoleError(
          'Role ID already exists',
          'DUPLICATE_ROLE',
          'creation'
        );
        this.failedOperations.push({
          type: 'creation',
          roleId: role.id,
          timestamp: MockTimestamp.now(),
          error
        });
        return { success: false, error: error.message };
      }

      const operation: TestRoleOperation = {
        type: 'creation',
        roleId: role.id,
        timestamp: MockTimestamp.now(),
        details: { title: role.title }
      };

      this.operationHistory.push(operation);
      this.existingRoles.add(role.id);
      return { success: true, roleId: role.id };
    } catch (error) {
      const err = error as Error;
      this.failedOperations.push({
        type: 'creation',
        roleId: role.id,
        timestamp: MockTimestamp.now(),
        error: err
      });
      return { success: false, error: err.message };
    }
  }

  async trackStatusChange(change: TestRoleStatusChange): Promise<TestOperationResult> {
    try {
      if (!isValidRoleTransition(change.oldStatus, change.newStatus)) {
        throw new TestRoleError(
          `Invalid status transition from ${change.oldStatus} to ${change.newStatus}`,
          'INVALID_TRANSITION',
          'status-change'
        );
      }

      const operation: TestRoleOperation = {
        type: 'status-change',
        ...change,
        timestamp: MockTimestamp.now()
      };
      
      this.operationHistory.push(operation);
      return { success: true, changes: [change] };
    } catch (error) {
      const err = error as Error;
      this.failedOperations.push({
        type: 'status-change',
        roleId: change.roleId,
        timestamp: MockTimestamp.now(),
        error: err
      });
      return { success: false, error: err.message };
    }
  }

  async trackRoleAssignment(assignment: TestRoleAssignment): Promise<TestOperationResult> {
    if (this.roleAssignments.has(assignment.roleId)) {
      const error = new TestRoleError(
        'Role already assigned',
        'DUPLICATE_ASSIGNMENT',
        'assignment'
      );
      return { success: false, error: error.message };
    }

    this.roleAssignments.set(assignment.roleId, assignment.userId);
    const operation: TestRoleOperation = {
      type: 'assignment',
      ...assignment,
      timestamp: MockTimestamp.now()
    };
    
    this.operationHistory.push(operation);
    return { success: true, assignment };
  }

  async checkHealth() {
    const metrics = {
      totalOperations: this.operationHistory.length,
      failedOperations: this.failedOperations.length,
      successRate: this.operationHistory.length === 0 ? 100 :
        ((this.operationHistory.length - this.failedOperations.length) / 
        this.operationHistory.length) * 100
    };

    return {
      healthy: metrics.successRate >= 95,
      lastCheck: MockTimestamp.now(),
      metrics
    };
  }

  getOperationHistory(): TestRoleOperation[] {
    return [...this.operationHistory];
  }

  getFailedOperations(): Array<TestRoleOperation & { error: Error }> {
    return [...this.failedOperations];
  }

  reset() {
    this.operationHistory = [];
    this.failedOperations = [];
    this.roleAssignments.clear();
    this.existingRoles.clear();
  }
}

export default RoleOperationsMonitor;