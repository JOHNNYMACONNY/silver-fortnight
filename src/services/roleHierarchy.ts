import { CollaborationRoleData } from '../types/collaboration';

export class RoleHierarchyManager {
  constructor() {}

  /**
   * Creates a hierarchy of roles in the correct order while validating relationships
   */
  async createHierarchy(roles: CollaborationRoleData[]): Promise<void> {
    // Validate hierarchy structure first
    this.validateHierarchyStructure(roles);
    
    // Create roles in topological order to ensure parents exist before children
    const sortedRoles = this.topologicalSort(roles);
    // TODO: Use sortedRoles in the future implementation to create roles in order
    
    // TODO: Implement role creation in Firestore for sortedRoles
    // The actual creation logic should go here, using a service like roleTransactions.ts
  }

  /**
   * Validates the hierarchy structure for cycles and valid parent relationships
   */
  private validateHierarchyStructure(roles: CollaborationRoleData[]): void {
    // Check for cycles in the role hierarchy
    if (this.hasCycles(roles)) {
      throw new Error('Role hierarchy contains cycles');
    }

    // Validate all parent-child relationships
    for (const role of roles) {
      if (role.parentRoleId) {
        const parent = roles.find(r => r.id === role.parentRoleId);
        if (!parent) {
          throw new Error(`Parent role ${role.parentRoleId} not found`);
        }
      }
    }
  }

  /**
   * Performs topological sort on roles to determine creation order
   */
  private topologicalSort(roles: CollaborationRoleData[]): CollaborationRoleData[] {
    const visited = new Set<string>();
    const sorted: CollaborationRoleData[] = [];
    const visiting = new Set<string>();

    const visit = (role: CollaborationRoleData) => {
      if (visiting.has(role.id)) {
        throw new Error('Cycle detected in role hierarchy');
      }
      if (visited.has(role.id)) {
        return;
      }

      visiting.add(role.id);

      // Visit parent first if it exists
      if (role.parentRoleId) {
        const parent = roles.find(r => r.id === role.parentRoleId);
        if (parent) {
          visit(parent);
        }
      }

      visiting.delete(role.id);
      visited.add(role.id);
      sorted.push(role);
    };

    // Visit all roles
    for (const role of roles) {
      if (!visited.has(role.id)) {
        visit(role);
      }
    }

    return sorted;
  }

  /**
   * Detects cycles in the role hierarchy
   */
  private hasCycles(roles: CollaborationRoleData[]): boolean {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const hasCycle = (roleId: string): boolean => {
      if (recursionStack.has(roleId)) {
        return true;
      }
      if (visited.has(roleId)) {
        return false;
      }

      visited.add(roleId);
      recursionStack.add(roleId);

      const role = roles.find(r => r.id === roleId);
      if (!role) {
        return false;
      }

      // Check children
      for (const childId of role.childRoleIds) {
        if (hasCycle(childId)) {
          return true;
        }
      }

      recursionStack.delete(roleId);
      return false;
    };

    // Check each role as a potential starting point
    for (const role of roles) {
      if (!visited.has(role.id)) {
        if (hasCycle(role.id)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Creates a new role in Firestore
   * @todo Implement and use this method when integrating with Firestore
   * @private
   */
  // private async createRole(): Promise<void> {
  //   // Implementation for creating role in Firestore will go here
  //   // This will be integrated with roleTransactions.ts
  // }

  /**
   * Gets all child roles for a given role
   */
  async getChildRoles(): Promise<CollaborationRoleData[]> {
    // Implementation for fetching child roles will go here
    return [];
  }

  /**
   * Gets the parent role for a given role
   */
  async getParentRole(): Promise<CollaborationRoleData | null> {
    // Implementation for fetching parent role will go here
    return null;
  }

  /**
   * Updates parent-child relationships between roles
   */
  async updateHierarchyRelationships(): Promise<void> {
    // Implementation for updating hierarchy relationships will go here
  }
}