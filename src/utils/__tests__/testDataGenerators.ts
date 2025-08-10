import { RoleState } from '../../types/collaboration';
import { MockTimestamp } from './testUtils';
import {
  TestRoleDocument,
  TestRoleData,
  TestRoleStatusChange,
  TestRoleAssignment,
  TestRoleOperation,
  TestOperationResult,
  TestRoleMetrics,
  TestHealthCheck
} from './testTypes';

export function createMockRoleData(
  id: string,
  status: RoleState = RoleState.DRAFT,
  extraData: Partial<TestRoleData> = {}
): TestRoleData {
  const now = MockTimestamp.now();
  return {
    id,
    title: `Test Role ${id}`,
    status,
    createdAt: now,
    updatedAt: now,
    collaborationId: `collab-${id}`,
    requiredSkills: ['test-skill-1', 'test-skill-2'],
    description: 'Test role description',
    ...extraData
  };
}

export function createMockRoleDocument(
  id: string,
  status: RoleState = RoleState.DRAFT,
  extraData: Partial<TestRoleData> = {}
): TestRoleDocument {
  const data = createMockRoleData(id, status, extraData);
  return {
    id,
    exists: true,
    ref: { id, path: `roles/${id}` },
    data: () => data
  };
}

export function createMockStatusChange(
  roleId: string,
  oldStatus: RoleState,
  newStatus: RoleState
): TestRoleStatusChange {
  return {
    roleId,
    oldStatus,
    newStatus
  };
}

export function createMockRoleAssignment(
  roleId: string,
  userId: string = 'test-user'
): TestRoleAssignment {
  return {
    roleId,
    userId
  };
}

export function createMockOperation(
  type: TestRoleOperation['type'],
  roleId: string,
  extraData: Partial<TestRoleOperation> = {}
): TestRoleOperation {
  return {
    type,
    roleId,
    timestamp: MockTimestamp.now(),
    ...extraData
  };
}

export function createMockOperationResult(
  success: boolean,
  data: Partial<TestOperationResult> = {}
): TestOperationResult {
  return {
    success,
    ...data
  };
}

export function createMockMetrics(
  totalOperations: number = 0,
  failedOperations: number = 0
): TestRoleMetrics {
  return {
    totalOperations,
    failedOperations,
    successRate: totalOperations === 0 ? 100 :
      ((totalOperations - failedOperations) / totalOperations) * 100
  };
}

export function createMockHealthCheck(
  healthy: boolean = true,
  metrics?: TestRoleMetrics
): TestHealthCheck {
  return {
    healthy,
    lastCheck: MockTimestamp.now(),
    metrics: metrics ?? createMockMetrics()
  };
}

export function createMockStatusTransition(
  fromStatus: RoleState,
  toStatus: RoleState,
  roleId: string = 'test-role'
): TestRoleOperation {
  return createMockOperation('status-change', roleId, {
    oldStatus: fromStatus,
    newStatus: toStatus,
    timestamp: MockTimestamp.now()
  });
}

export const MOCK_ROLE_TRANSITIONS = [
  { from: RoleState.DRAFT, to: RoleState.IN_REVIEW },
  { from: RoleState.IN_REVIEW, to: RoleState.OPEN },
  { from: RoleState.OPEN, to: RoleState.FILLED },
  { from: RoleState.FILLED, to: RoleState.IN_PROGRESS },
  { from: RoleState.IN_PROGRESS, to: RoleState.COMPLETION_REQUESTED },
  { from: RoleState.COMPLETION_REQUESTED, to: RoleState.COMPLETED }
];

// Helper to create realistic role progression scenarios
export function createMockRoleProgression(roleId: string): {
  role: TestRoleDocument;
  transitions: TestRoleOperation[];
} {
  const role = createMockRoleDocument(roleId);
  const transitions: TestRoleOperation[] = [];
  let currentStatus = RoleState.DRAFT;

  for (const { to } of MOCK_ROLE_TRANSITIONS) {
    transitions.push(createMockStatusTransition(currentStatus, to, roleId));
    currentStatus = to;
  }

  return { role, transitions };
}