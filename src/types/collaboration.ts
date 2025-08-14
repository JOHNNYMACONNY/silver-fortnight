/**
 * Types for collaboration functionality
 */

/**
 * Available roles in a collaboration
 */
export enum CollaborationRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
  VIEWER = 'VIEWER'
}

/**
 * Represents a role entity within a collaboration
 * This is used for the detailed role management system
 */
export interface CollaborationRoleData {
  id: string;
  collaborationId: string;
  
  // Role details
  title: string;
  description: string;
  maxParticipants: number; // Added this line
  
  // Hierarchy
  parentRoleId?: string;
  childRoleIds: string[];
  
  // Participant tracking
  participantId?: string;
  participantName?: string;
  participantPhotoURL?: string;
  // Alternative assigned user field used by some services
  assignedUserId?: string;
  previousParticipantId?: string; // Added
  previousParticipantName?: string; // Added
  previousParticipantPhotoURL?: string; // Added
  abandonmentReason?: string; // Added
  abandonedAt?: any; // Added // Timestamp from Firestore
  
  // Status
  status: RoleState; // Changed from 'open' | 'filled' | 'completed' | 'abandoned'
  applicationCount: number;
  completionStatus?: CompletionRequestStatus;
  // Completion metadata used by role completion flows
  completionRequestedAt?: any; // Timestamp from Firestore
  completionConfirmedAt?: any; // Timestamp from Firestore
  completionNotes?: string;
  completionEvidence?: any[];
  
  // Skills required for the role
  requiredSkills?: Skill[];
  preferredSkills?: Skill[];
  
  // Timestamps
  createdAt: any; // Timestamp from Firestore
  updatedAt: any; // Timestamp from Firestore
  filledAt?: any; // Timestamp from Firestore
  completedAt?: any; // Timestamp from Firestore
}

/**
 * Basic collaboration information
 */
export interface CollaborationBase {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  ownerId: string;
}

/**
 * Collaboration member information
 */
export interface CollaborationMember {
  userId: string;
  role: CollaborationRole;
  addedAt: Date;
  addedBy: string;
}

/**
 * Complete collaboration type
 */
export interface Collaboration extends CollaborationBase {
  members: CollaborationMember[];
  settings: CollaborationSettings;
  metadata: CollaborationMetadata;
}

/**
 * Collaboration settings
 */
export interface CollaborationSettings {
  isPublic: boolean;
  allowInvites: boolean;
  requireApproval: boolean;
  maxMembers?: number;
  allowedRoles: CollaborationRole[];
}

/**
 * Collaboration metadata
 */
export interface CollaborationMetadata {
  tags?: string[];
  category?: string;
  status: CollaborationStatus;
  lastActivity: Date;
  membersCount: number;
}

/**
 * Collaboration status
 */
export enum CollaborationStatus {
  RECRUITING = 'recruiting',
  IN_PROGRESS = 'in-progress', 
  COMPLETED = 'completed',
  ABANDONED = 'abandoned',
  CANCELLED = 'cancelled'
}

/**
 * Permissions available in collaborations
 */
export enum CollaborationPermission {
  MANAGE_MEMBERS = 'MANAGE_MEMBERS',
  EDIT_SETTINGS = 'EDIT_SETTINGS',
  DELETE_COLLABORATION = 'DELETE_COLLABORATION',
  INVITE_MEMBERS = 'INVITE_MEMBERS',
  REMOVE_MEMBERS = 'REMOVE_MEMBERS',
  VIEW_ANALYTICS = 'VIEW_ANALYTICS',
  MANAGE_ROLES = 'MANAGE_ROLES'
}

/**
 * Role to permissions mapping
 */
export const ROLE_PERMISSIONS: Record<CollaborationRole, CollaborationPermission[]> = {
  [CollaborationRole.OWNER]: Object.values(CollaborationPermission),
  [CollaborationRole.ADMIN]: [
    CollaborationPermission.MANAGE_MEMBERS,
    CollaborationPermission.EDIT_SETTINGS,
    CollaborationPermission.INVITE_MEMBERS,
    CollaborationPermission.REMOVE_MEMBERS,
    CollaborationPermission.VIEW_ANALYTICS,
    CollaborationPermission.MANAGE_ROLES
  ],
  [CollaborationRole.MEMBER]: [
    CollaborationPermission.INVITE_MEMBERS,
    CollaborationPermission.VIEW_ANALYTICS
  ],
  [CollaborationRole.VIEWER]: []
};

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: CollaborationRole, permission: CollaborationPermission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

/**
 * Get all permissions for a role
 */
export function getPermissionsForRole(role: CollaborationRole): CollaborationPermission[] {
  return ROLE_PERMISSIONS[role];
}

/**
 * Skill interface for role requirements
 */
export interface Skill {
  id?: string;
  name: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  category?: string;
}

/**
 * Application status enum for role applications
 */
export enum ApplicationStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED', 
  REJECTED = 'REJECTED',
  WITHDRAWN = 'WITHDRAWN'
}

/**
 * Completion request status enum
 */
export enum CompletionRequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

/**
 * Role application interface
 */
export interface RoleApplication {
  id: string;
  roleId: string;
  applicantId: string;
  applicantName?: string;
  applicantPhotoURL?: string;
  message: string;
  evidence?: any[];
  status: ApplicationStatus; // Updated to use enum
  createdAt: any; // Timestamp from Firestore
  updatedAt: any; // Timestamp from Firestore
  reviewerId?: string;
  reviewerName?: string;
  rejectionReason?: string;
}

/**
 * Role state enum
 */
export enum RoleState {
  DRAFT = 'DRAFT',
  OPEN = 'OPEN',
  IN_REVIEW = 'IN_REVIEW',
  ASSIGNED = 'ASSIGNED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETION_REQUESTED = 'COMPLETION_REQUESTED',
  FILLED = 'FILLED', 
  COMPLETED = 'COMPLETED',
  ABANDONED = 'ABANDONED',
  UNNEEDED = 'UNNEEDED' // Added
}

/**
 * Role completion request interface
 */
export interface CompletionRequest {
  id: string;
  roleId: string;
  requesterId: string;
  requesterName?: string;
  requesterPhotoURL?: string;
  notes: string;
  status: CompletionRequestStatus; // Updated to use enum
  evidence?: any[];
  createdAt: any; // Timestamp from Firestore
  updatedAt: any; // Timestamp from Firestore
  reviewerId?: string;
  reviewerName?: string;
  rejectionReason?: string;
}

// Add new interface definitions for State Machine

/**
 * Condition for a state transition
 */
export interface Condition {
  check: (role: CollaborationRoleData) => Promise<boolean>;
  errorMessage: string;
}

/**
 * Effect of a state transition, including execution and rollback logic
 */
export interface TransitionEffect {
  execute: (role: CollaborationRoleData) => Promise<void>;
  rollback: (role: CollaborationRoleData) => Promise<void>;
}

/**
 * Defines a valid transition between role states
 */
export interface StateTransition {
  from: RoleState;
  to: RoleState;
  conditions: Condition[];
  sideEffects: TransitionEffect[];
}

/**
 * Represents a request to change the terms or details of a trade.
 */
export interface ChangeRequest {
  id: string;
  requestedBy: string; // UID of the user requesting the change
  requestedAt: any; // Firestore Timestamp
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'resolved' | 'withdrawn'; // Status of the change request
  resolvedAt?: any; // Firestore Timestamp
  resolverId?: string; // UID of the user who resolved the request
  resolverNotes?: string; // Notes from the resolver
}

export default {
  CollaborationRole,
  CollaborationStatus,
  CollaborationPermission,
  ROLE_PERMISSIONS,
  hasPermission,
  getPermissionsForRole
};
