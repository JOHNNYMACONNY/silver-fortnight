import { jest, describe, beforeEach, it, expect } from '@jest/globals';
import { RoleState } from '../../types/collaboration';
import { RoleOperationsMonitor } from '../__mocks__/roleOperationsMonitor';
import { MockTimestamp } from './testUtils';
import { TestRoleError } from './testTypes';
import {
  createMockRoleDocument,
  createMockStatusChange,
  createMockRoleAssignment,
  createMockHealthCheck,
  createMockRoleProgression,
  MOCK_ROLE_TRANSITIONS
} from './testDataGenerators';

describe('Role Monitoring System', () => {
  let monitor: RoleOperationsMonitor;

  beforeEach(() => {
    jest.clearAllMocks();
    monitor = RoleOperationsMonitor.getInstance();
    monitor.reset();
  });

  it('should start comprehensive monitoring', async () => {
    const mockRoles = [
      createMockRoleDocument('role-1', RoleState.DRAFT),
      createMockRoleDocument('role-2', RoleState.FILLED)
    ];

    const result = await monitor.startMonitoring();
    
    expect(result.success).toBe(true);
    expect(mockRoles).toHaveLength(2);
  });

  it('should track role creation', async () => {
    const role = createMockRoleDocument('new-role', RoleState.DRAFT);

    const result = await monitor.trackRoleCreation(role.data());
    expect(result.success).toBe(true);
    expect(result.roleId).toBe('new-role');
  });

  it('should detect failed operations', async () => {
    // First create a role
    const role = createMockRoleDocument('duplicate-role', RoleState.DRAFT);
    await monitor.trackRoleCreation(role.data());

    // Try to create the same role again
    const result = await monitor.trackRoleCreation(role.data());
    
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(monitor.getFailedOperations()).toHaveLength(1);
  });

  it('should track role status changes', async () => {
    const statusChange = createMockStatusChange(
      'test-role-1',
      RoleState.DRAFT,
      RoleState.IN_REVIEW
    );

    const result = await monitor.trackStatusChange(statusChange);
    expect(result.success).toBe(true);
    expect(result.changes).toBeDefined();
    expect(result.changes?.[0].newStatus).toBe(RoleState.IN_REVIEW);
  });

  it('should detect duplicate role assignments', async () => {
    const assignment1 = createMockRoleAssignment('test-role-1', 'user-1');
    const assignment2 = createMockRoleAssignment('test-role-1', 'user-2');

    const result1 = await monitor.trackRoleAssignment(assignment1);
    const result2 = await monitor.trackRoleAssignment(assignment2);

    expect(result1.success).toBe(true);
    expect(result2.success).toBe(false);
    expect(result2.error).toBe('Role already assigned');
  });

  it('should maintain health checks', async () => {
    const healthCheck = await monitor.checkHealth();
    const expectedCheck = createMockHealthCheck(true);

    expect(healthCheck.healthy).toBe(expectedCheck.healthy);
    expect(healthCheck.metrics.successRate).toBe(expectedCheck.metrics.successRate);
    expect(healthCheck.lastCheck).toBeInstanceOf(MockTimestamp);
  });

  it('should follow valid role state progression', async () => {
    const { role, transitions } = createMockRoleProgression('test-role-1');
    await monitor.trackRoleCreation(role.data());

    for (const transition of transitions) {
      const result = await monitor.trackStatusChange({
        roleId: transition.roleId,
        oldStatus: transition.oldStatus as RoleState,
        newStatus: transition.newStatus as RoleState
      });
      expect(result.success).toBe(true);
    }

    const history = monitor.getOperationHistory();
    const statusChanges = history.filter(op => op.type === 'status-change');
    expect(statusChanges).toHaveLength(MOCK_ROLE_TRANSITIONS.length);
  });

  it('should validate role state transitions', async () => {
    // Valid transition
    const validChange = createMockStatusChange(
      'test-role-1',
      RoleState.DRAFT,
      RoleState.IN_REVIEW
    );

    const validResult = await monitor.trackStatusChange(validChange);
    expect(validResult.success).toBe(true);

    // Invalid transition
    const invalidChange = createMockStatusChange(
      'test-role-1',
      RoleState.DRAFT,
      RoleState.COMPLETED
    );

    const invalidResult = await monitor.trackStatusChange(invalidChange);
    expect(invalidResult.success).toBe(false);
    expect(invalidResult.error).toContain('Invalid status transition');
  });
});