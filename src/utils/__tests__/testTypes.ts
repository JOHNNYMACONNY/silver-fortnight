import { RoleState } from '../../types/collaboration';
import { MockTimestamp } from './testUtils';
import { jest, beforeEach } from '@jest/globals';

// Common interfaces for testing
export interface TestRoleAssignment {
  roleId: string;
  userId: string;
}

export interface TestRoleStatusChange {
  roleId: string;
  oldStatus: RoleState;
  newStatus: RoleState;
}

export interface TestRoleOperation {
  type: 'creation' | 'update' | 'status-change' | 'assignment';
  roleId: string;
  timestamp?: MockTimestamp;
  [key: string]: any;
}

export interface TestOperationResult {
  success: boolean;
  error?: string;
  roleId?: string;
  changes?: TestRoleStatusChange[];
  assignment?: TestRoleAssignment;
}

export interface TestRoleMetrics {
  totalOperations: number;
  failedOperations: number;
  successRate: number;
}

export interface TestHealthCheck {
  healthy: boolean;
  lastCheck: MockTimestamp;
  metrics: TestRoleMetrics;
}

export interface TestRoleData {
  id: string;
  title: string;
  status: RoleState;
  createdAt: MockTimestamp;
  updatedAt: MockTimestamp;
  [key: string]: any;
}

export interface TestRoleDocument {
  id: string;
  data: () => TestRoleData;
  exists: boolean;
  ref: {
    id: string;
    path: string;
  };
}

export interface TestCollectionSnapshot {
  docs: TestRoleDocument[];
  empty: boolean;
  size: number;
}

export interface TestBatchOperation {
  type: 'set' | 'update' | 'delete';
  ref: any;
  data?: any;
}

export interface TestBatch {
  set: (ref: any, data: any) => void;
  update: (ref: any, data: any) => void;
  delete: (ref: any) => void;
  commit: () => Promise<void>;
  operations: () => TestBatchOperation[];
}

// Test error types
export class TestRoleError extends Error {
  code: string;
  operation: string;

  constructor(message: string, code: string, operation: string) {
    super(message);
    this.name = 'TestRoleError';
    this.code = code;
    this.operation = operation;
  }
}

// Common test constants
export const TEST_ROLE_STATES = {
  VALID_TRANSITIONS: new Map<RoleState, RoleState[]>([
    [RoleState.DRAFT, [RoleState.IN_REVIEW]],
    [RoleState.IN_REVIEW, [RoleState.OPEN, RoleState.DRAFT]],
    [RoleState.OPEN, [RoleState.FILLED]],
    [RoleState.FILLED, [RoleState.IN_PROGRESS]],
    [RoleState.IN_PROGRESS, [RoleState.COMPLETION_REQUESTED]],
    [RoleState.COMPLETION_REQUESTED, [RoleState.COMPLETED, RoleState.IN_PROGRESS]]
  ]),
  
  DEFAULT_TIMELINE: [
    RoleState.DRAFT,
    RoleState.IN_REVIEW,
    RoleState.OPEN,
    RoleState.FILLED,
    RoleState.IN_PROGRESS,
    RoleState.COMPLETION_REQUESTED,
    RoleState.COMPLETED
  ]
};

// Test helper functions
export function isValidRoleTransition(from: RoleState, to: RoleState): boolean {
  const validNextStates = TEST_ROLE_STATES.VALID_TRANSITIONS.get(from);
  return validNextStates?.includes(to) ?? false;
}

export function createTestRole(
  id: string,
  status: RoleState = RoleState.DRAFT,
  extraData: Partial<TestRoleData> = {}
): TestRoleDocument {
  const now = MockTimestamp.now();
  
  return {
    id,
    exists: true,
    ref: { id, path: `roles/${id}` },
    data: () => ({
      id,
      title: `Test Role ${id}`,
      status,
      createdAt: now,
      updatedAt: now,
      ...extraData
    })
  };
}