export type RoleState = 'active' | 'pending' | 'archived' | 'deleted';

export interface Role {
  id: string;
  title: string;
  description?: string;
  status: RoleState;
  createdAt: {
    seconds: number;
    nanoseconds: number;
    toDate: () => Date;
    toMillis: () => number;
  };
  updatedAt?: {
    seconds: number;
    nanoseconds: number;
    toDate: () => Date;
    toMillis: () => number;
  };
  userId: string;
  collaborationId: string;
  permissions?: string[];
  metadata?: Record<string, any>;
}

export interface RoleUpdate extends Partial<Role> {
  id: string;
}

export interface RoleOperation {
  type: 'create' | 'update' | 'delete';
  roleId: string;
  data?: Partial<Role>;
  timestamp: number;
}

export interface RoleMonitoringState {
  operations: RoleOperation[];
  activeRoles: Record<string, Role>;
  lastSyncTimestamp: number;
}

export interface RoleValidationError {
  code: string;
  message: string;
  field?: string;
}

export type RoleValidationResult = {
  isValid: true;
} | {
  isValid: false;
  errors: RoleValidationError[];
};