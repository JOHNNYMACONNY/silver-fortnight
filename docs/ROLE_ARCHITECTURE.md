# Role Architecture Documentation

## Role Hierarchy Design

### 1. Core Role Structure
```typescript
interface BaseRole {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
  metadata: Record<string, any>;
}

interface CollaborationRole extends BaseRole {
  collaborationId: string;
  parentRoleId?: string;
  childRoleIds: string[];
  requirements: SkillRequirement[];
  permissions: RolePermission[];
  maxParticipants: number;
  currentParticipants: number;
  status: RoleStatus;
  completionCriteria: CompletionCriteria;
}

interface SkillRequirement {
  skillId: string;
  level: 'beginner' | 'intermediate' | 'expert';
  required: boolean;
  validationMethod?: 'portfolio' | 'test' | 'review';
}
```

### 2. Hierarchy Management
```typescript
class RoleHierarchyManager {
  async createHierarchy(roles: CollaborationRole[]): Promise<void> {
    // Validate hierarchy structure
    this.validateHierarchyStructure(roles);
    
    // Create roles in topological order
    const sortedRoles = this.topologicalSort(roles);
    for (const role of sortedRoles) {
      await this.createRole(role);
    }
  }

  private validateHierarchyStructure(roles: CollaborationRole[]): void {
    // Check for cycles
    if (this.hasCycles(roles)) {
      throw new Error('Hierarchy contains cycles');
    }

    // Validate parent-child relationships
    for (const role of roles) {
      if (role.parentRoleId) {
        const parent = roles.find(r => r.id === role.parentRoleId);
        if (!parent) {
          throw new Error(`Parent role ${role.parentRoleId} not found`);
        }
      }
    }
  }
}
```

## Inheritance Patterns

### 1. Permission Inheritance
```typescript
interface RolePermission {
  resource: string;
  actions: string[];
  conditions?: {
    timeRestricted?: boolean;
    requireApproval?: boolean;
  };
  inherited?: boolean;
}

class PermissionInheritanceManager {
  async calculateEffectivePermissions(roleId: string): Promise<RolePermission[]> {
    const role = await this.getRole(roleId);
    const inheritedPermissions = await this.getInheritedPermissions(role.parentRoleId);
    
    return this.mergePermissions(role.permissions, inheritedPermissions);
  }

  private mergePermissions(
    direct: RolePermission[],
    inherited: RolePermission[]
  ): RolePermission[] {
    // Override inherited permissions with direct permissions
    const mergedPermissions = new Map<string, RolePermission>();
    
    for (const permission of inherited) {
      mergedPermissions.set(permission.resource, {
        ...permission,
        inherited: true
      });
    }

    for (const permission of direct) {
      mergedPermissions.set(permission.resource, {
        ...permission,
        inherited: false
      });
    }

    return Array.from(mergedPermissions.values());
  }
}
```

### 2. Skill Inheritance
```typescript
class SkillInheritanceManager {
  async validateSkillRequirements(
    userId: string,
    roleId: string
  ): Promise<ValidationResult> {
    const role = await this.getRole(roleId);
    const userSkills = await this.getUserSkills(userId);
    
    // Check direct requirements
    const directValidation = this.validateDirectSkills(
      userSkills,
      role.requirements
    );

    // Check inherited requirements if applicable
    let inheritedValidation = { valid: true, missing: [] };
    if (role.parentRoleId) {
      inheritedValidation = await this.validateInheritedSkills(
        userSkills,
        role.parentRoleId
      );
    }

    return {
      valid: directValidation.valid && inheritedValidation.valid,
      missing: [...directValidation.missing, ...inheritedValidation.missing]
    };
  }
}
```

## State Machine Specification

### 1. Role State Definitions
```typescript
enum RoleState {
  DRAFT = 'draft',
  OPEN = 'open',
  IN_REVIEW = 'in_review',
  ASSIGNED = 'assigned',
  IN_PROGRESS = 'in_progress',
  COMPLETION_REQUESTED = 'completion_requested',
  COMPLETED = 'completed',
  ABANDONED = 'abandoned'
}

interface StateTransition {
  from: RoleState;
  to: RoleState;
  conditions: TransitionCondition[];
  sideEffects: TransitionEffect[];
}

interface TransitionCondition {
  check: () => Promise<boolean>;
  errorMessage: string;
}

interface TransitionEffect {
  execute: () => Promise<void>;
  rollback: () => Promise<void>;
}
```

### 2. State Machine Implementation
```typescript
class RoleStateMachine {
  private transitions: Map<RoleState, StateTransition[]> = new Map();

  async transition(
    roleId: string,
    targetState: RoleState
  ): Promise<void> {
    const role = await this.getRole(roleId);
    const transition = this.findTransition(role.status, targetState);
    
    if (!transition) {
      throw new Error(`Invalid transition from ${role.status} to ${targetState}`);
    }

    // Validate conditions
    await this.validateTransitionConditions(transition, role);

    // Execute transition with rollback support
    const executedEffects: TransitionEffect[] = [];
    try {
      for (const effect of transition.sideEffects) {
        await effect.execute();
        executedEffects.push(effect);
      }

      await this.updateRoleState(roleId, targetState);
    } catch (error) {
      // Rollback executed effects in reverse order
      for (const effect of executedEffects.reverse()) {
        await effect.rollback();
      }
      throw error;
    }
  }

  private async validateTransitionConditions(
    transition: StateTransition,
    role: CollaborationRole
  ): Promise<void> {
    for (const condition of transition.conditions) {
      if (!await condition.check()) {
        throw new Error(condition.errorMessage);
      }
    }
  }
}
```

## Validation Rules

### 1. Role Validation
```typescript
interface RoleValidationRule {
  validate: (role: CollaborationRole) => Promise<ValidationResult>;
  severity: 'error' | 'warning';
  code: string;
}

class RoleValidator {
  private rules: RoleValidationRule[] = [];

  addRule(rule: RoleValidationRule): void {
    this.rules.push(rule);
  }

  async validateRole(role: CollaborationRole): Promise<ValidationError[]> {
    const errors: ValidationError[] = [];

    for (const rule of this.rules) {
      const result = await rule.validate(role);
      if (!result.valid) {
        errors.push({
          code: rule.code,
          message: result.message,
          severity: rule.severity
        });
      }
    }

    return errors;
  }
}
```

### 2. Common Validation Rules
```typescript
const commonValidationRules: RoleValidationRule[] = [
  {
    validate: async (role) => ({
      valid: role.maxParticipants > 0,
      message: 'Maximum participants must be greater than 0'
    }),
    severity: 'error',
    code: 'INVALID_MAX_PARTICIPANTS'
  },
  {
    validate: async (role) => ({
      valid: role.requirements.length > 0,
      message: 'Role must have at least one skill requirement'
    }),
    severity: 'error',
    code: 'NO_SKILL_REQUIREMENTS'
  },
  {
    validate: async (role) => ({
      valid: role.childRoleIds.length <= 10,
      message: 'Role cannot have more than 10 child roles'
    }),
    severity: 'warning',
    code: 'TOO_MANY_CHILD_ROLES'
  }
];
```

## Implementation Guidelines

### 1. Role Creation
```typescript
class RoleFactory {
  async createRole(
    collaborationId: string,
    roleData: Partial<CollaborationRole>
  ): Promise<CollaborationRole> {
    // Validate base requirements
    this.validateRequiredFields(roleData);

    // Create role with defaults
    const role: CollaborationRole = {
      id: generateId(),
      collaborationId,
      childRoleIds: [],
      requirements: [],
      permissions: [],
      maxParticipants: 1,
      currentParticipants: 0,
      status: RoleState.DRAFT,
      ...roleData,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Validate complete role
    const validator = new RoleValidator();
    const errors = await validator.validateRole(role);
    if (errors.some(e => e.severity === 'error')) {
      throw new Error('Invalid role configuration');
    }

    return role;
  }
}
```

### 2. Role Updates
```typescript
class RoleUpdater {
  async updateRole(
    roleId: string,
    updates: Partial<CollaborationRole>
  ): Promise<CollaborationRole> {
    const role = await this.getRole(roleId);
    
    // Validate state transition if status is being updated
    if (updates.status && updates.status !== role.status) {
      await this.stateMachine.transition(roleId, updates.status);
    }

    // Apply updates
    const updatedRole = {
      ...role,
      ...updates,
      updatedAt: new Date()
    };

    // Validate updated role
    const validator = new RoleValidator();
    const errors = await validator.validateRole(updatedRole);
    if (errors.some(e => e.severity === 'error')) {
      throw new Error('Invalid role update');
    }

    return updatedRole;
  }
}
```

## Testing Strategy

### 1. Hierarchy Tests
```typescript
describe('Role Hierarchy', () => {
  it('should detect cycles in role hierarchy');
  it('should validate parent-child relationships');
  it('should properly inherit permissions');
  it('should handle multi-level inheritance');
});
```

### 2. State Machine Tests
```typescript
describe('Role State Machine', () => {
  it('should enforce valid state transitions');
  it('should execute transition side effects');
  it('should rollback on failed transitions');
  it('should validate transition conditions');
});