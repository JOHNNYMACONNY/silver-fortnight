import { where, orderBy, limit as limitQuery, QueryConstraint, Timestamp } from 'firebase/firestore';
import { BaseService } from '../core/BaseService';
import { ServiceResult } from '../../types/ServiceError';
import { CollaborationRoleData } from '../../types/collaboration';
import { AppError, ErrorCode, ErrorSeverity } from '../../types/errors';

// Collection name
export const COLLABORATIONS_COLLECTION = 'collaborations';

// Collaboration types
export type CollaborationStatus = 'open' | 'in-progress' | 'completed' | 'recruiting' | 'cancelled';

export interface Collaboration {
  id?: string;
  title: string;
  description: string;
  roles: CollaborationRoleData[];
  creatorId: string;
  status: CollaborationStatus;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  creatorName?: string;
  creatorPhotoURL?: string;
  skillsRequired: string[];
  maxParticipants: number;
  participants?: string[];
  simplifiedView?: boolean;
  autoAssignRoles?: boolean;
  timeCommitment?: string;
  ownerId?: string;
  ownerName?: string;
  ownerPhotoURL?: string;
  location?: string;
  isRemote?: boolean;
  timeline?: string;
  compensation?: string;
  skillsNeeded?: string[];
  collaborators?: string[];
  images?: string[];
  category?: string;
  // Normalized skills index for server-side filtering (lowercased unique names)
  skillsIndex?: string[];
}

export interface CollaborationFilters {
  status?: CollaborationStatus[];
  skills?: string[];
  location?: string;
  isRemote?: boolean;
  category?: string;
  searchQuery?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  maxParticipants?: {
    min?: number;
    max?: number;
  };
}

/**
 * Collaboration Service - handles all collaboration-related database operations
 */
export class CollaborationService extends BaseService<Collaboration> {
  constructor() {
    super(COLLABORATIONS_COLLECTION);
  }

  /**
   * Create a new collaboration
   */
  async createCollaboration(collaborationData: Omit<Collaboration, 'id' | 'createdAt' | 'updatedAt'>): Promise<ServiceResult<Collaboration>> {
    try {
      this.validateData(collaborationData, ['title', 'description', 'roles', 'creatorId', 'skillsRequired', 'maxParticipants']);
      
      const computeSkillsIndex = (required: string[] = [], needed: string[] = []): string[] => {
        const normalized = new Set<string>();
        [...required, ...needed].forEach((s) => {
          const name = (s || '').toString().trim().toLowerCase();
          if (name) normalized.add(name);
        });
        return Array.from(normalized);
      };

      const collaborationWithTimestamps = this.addTimestamps({
        ...collaborationData,
        status: 'open' as CollaborationStatus,
        participants: [],
        collaborators: [],
        skillsIndex: computeSkillsIndex(collaborationData.skillsRequired, collaborationData.skillsNeeded)
      });

      return await this.create(collaborationWithTimestamps);
    } catch (error) {
      const appError = new AppError(
        'Failed to create collaboration',
        ErrorCode.DATABASE_ERROR,
        ErrorSeverity.HIGH,
        { collaborationData }
      );
      
      return { data: null, error: { code: 'create-collaboration-failed', message: appError.message } };
    }
  }

  /**
   * Get collaboration by ID
   */
  async getCollaboration(collaborationId: string): Promise<ServiceResult<Collaboration>> {
    return await this.read(collaborationId);
  }

  /**
   * Update collaboration
   */
  async updateCollaboration(collaborationId: string, updates: Partial<Collaboration>): Promise<ServiceResult<Collaboration>> {
    try {
      let updatesWithTimestamp = this.addTimestamps(updates, true);

      if (updates.skillsRequired !== undefined || updates.skillsNeeded !== undefined) {
        const current = await this.read(collaborationId);
        const currentCollab = current.data as Collaboration | undefined;
        const required = updates.skillsRequired ?? currentCollab?.skillsRequired ?? [];
        const needed = updates.skillsNeeded ?? currentCollab?.skillsNeeded ?? [];
        const normalized = new Set<string>();
        [...required, ...needed].forEach((s) => {
          const name = (s || '').toString().trim().toLowerCase();
          if (name) normalized.add(name);
        });
        updatesWithTimestamp = {
          ...updatesWithTimestamp,
          skillsIndex: Array.from(normalized)
        };
      }

      return await this.update(collaborationId, updatesWithTimestamp);
    } catch (error) {
      const appError = new AppError(
        'Failed to update collaboration',
        ErrorCode.DATABASE_ERROR,
        ErrorSeverity.MEDIUM,
        { collaborationId, updates }
      );
      
      return { data: null, error: { code: 'update-collaboration-failed', message: appError.message } };
    }
  }

  /**
   * Delete collaboration
   */
  async deleteCollaboration(collaborationId: string): Promise<ServiceResult<boolean>> {
    return await this.delete(collaborationId);
  }

  /**
   * Get collaborations by creator
   */
  async getCollaborationsByCreator(creatorId: string, limit: number = 20): Promise<ServiceResult<Collaboration[]>> {
    try {
      const constraints: QueryConstraint[] = [
        where('creatorId', '==', creatorId),
        orderBy('createdAt', 'desc'),
        limitQuery(limit)
      ];

      const result = await this.list(constraints);
      if (result.error) {
        return { data: null, error: result.error };
      }

      return { data: result.data?.items || [], error: null };
    } catch (error) {
      const appError = new AppError(
        'Failed to get collaborations by creator',
        ErrorCode.DATABASE_ERROR,
        ErrorSeverity.MEDIUM,
        { creatorId, limit }
      );
      
      return { data: null, error: { code: 'get-collaborations-by-creator-failed', message: appError.message } };
    }
  }

  /**
   * Get collaborations by status
   */
  async getCollaborationsByStatus(status: CollaborationStatus, limit: number = 20): Promise<ServiceResult<Collaboration[]>> {
    try {
      const constraints: QueryConstraint[] = [
        where('status', '==', status),
        orderBy('createdAt', 'desc'),
        limitQuery(limit)
      ];

      const result = await this.list(constraints);
      if (result.error) {
        return { data: null, error: result.error };
      }

      return { data: result.data?.items || [], error: null };
    } catch (error) {
      const appError = new AppError(
        'Failed to get collaborations by status',
        ErrorCode.DATABASE_ERROR,
        ErrorSeverity.MEDIUM,
        { status, limit }
      );
      
      return { data: null, error: { code: 'get-collaborations-by-status-failed', message: appError.message } };
    }
  }

  /**
   * Search collaborations with filters
   */
  async searchCollaborations(filters: CollaborationFilters, limit: number = 20): Promise<ServiceResult<Collaboration[]>> {
    try {
      let constraints: QueryConstraint[] = [
        orderBy('createdAt', 'desc'),
        limitQuery(limit)
      ];

      // Add status filter
      if (filters.status && filters.status.length > 0) {
        if (filters.status.length === 1) {
          constraints.unshift(where('status', '==', filters.status[0]));
        } else {
          constraints.unshift(where('status', 'in', filters.status));
        }
      }

      // Add location filter
      if (filters.location && !filters.isRemote) {
        constraints.unshift(where('location', '==', filters.location));
      } else if (filters.isRemote) {
        constraints.unshift(where('isRemote', '==', true));
      }

      // Add category filter
      if (filters.category) {
        constraints.unshift(where('category', '==', filters.category));
      }

      const result = await this.list(constraints);
      if (result.error) {
        return { data: null, error: result.error };
      }

      let collaborations = result.data?.items || [];

      // Apply client-side filtering for complex queries
      if (filters.skills && filters.skills.length > 0) {
        collaborations = collaborations.filter(collab => 
          filters.skills!.some(skill => 
            collab.skillsRequired.some(required => 
              required.toLowerCase().includes(skill.toLowerCase())
            ) ||
            (collab.skillsNeeded && collab.skillsNeeded.some(needed => 
              needed.toLowerCase().includes(skill.toLowerCase())
            ))
          )
        );
      }

      // Apply search query filter
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        collaborations = collaborations.filter(collab =>
          collab.title.toLowerCase().includes(query) ||
          collab.description.toLowerCase().includes(query) ||
          collab.skillsRequired.some(skill => skill.toLowerCase().includes(query))
        );
      }

      // Apply participant count filter
      if (filters.maxParticipants) {
        collaborations = collaborations.filter(collab => {
          const participantCount = collab.participants?.length || 0;
          const min = filters.maxParticipants!.min;
          const max = filters.maxParticipants!.max;
          
          if (min !== undefined && participantCount < min) return false;
          if (max !== undefined && participantCount > max) return false;
          
          return true;
        });
      }

      // Apply date range filter
      if (filters.dateRange) {
        const startTime = filters.dateRange.start.getTime();
        const endTime = filters.dateRange.end.getTime();
        
        collaborations = collaborations.filter(collab => {
          const createdTime = collab.createdAt.toMillis();
          return createdTime >= startTime && createdTime <= endTime;
        });
      }

      return { data: collaborations, error: null };
    } catch (error) {
      const appError = new AppError(
        'Failed to search collaborations',
        ErrorCode.DATABASE_ERROR,
        ErrorSeverity.MEDIUM,
        { filters, limit }
      );
      
      return { data: null, error: { code: 'search-collaborations-failed', message: appError.message } };
    }
  }

  /**
   * Join a collaboration
   */
  async joinCollaboration(collaborationId: string, userId: string, roleId?: string): Promise<ServiceResult<Collaboration>> {
    try {
      const collaborationResult = await this.getCollaboration(collaborationId);
      if (collaborationResult.error || !collaborationResult.data) {
        return { data: null, error: collaborationResult.error || { code: 'collaboration-not-found', message: 'Collaboration not found' } };
      }

      const collaboration = collaborationResult.data;
      const currentParticipants = collaboration.participants || [];
      
      // Check if user is already a participant
      if (currentParticipants.includes(userId)) {
        return { data: null, error: { code: 'already-joined', message: 'User already joined this collaboration' } };
      }

      // Check if collaboration is full
      if (currentParticipants.length >= collaboration.maxParticipants) {
        return { data: null, error: { code: 'collaboration-full', message: 'Collaboration is full' } };
      }

      const updates: Partial<Collaboration> = {
        participants: [...currentParticipants, userId],
        collaborators: [...(collaboration.collaborators || []), userId]
      };

      // Update status if this fills the collaboration
      if (updates.participants!.length >= collaboration.maxParticipants) {
        updates.status = 'in-progress';
      }

      return await this.updateCollaboration(collaborationId, updates);
    } catch (error) {
      const appError = new AppError(
        'Failed to join collaboration',
        ErrorCode.DATABASE_ERROR,
        ErrorSeverity.HIGH,
        { collaborationId, userId, roleId }
      );
      
      return { data: null, error: { code: 'join-collaboration-failed', message: appError.message } };
    }
  }

  /**
   * Leave a collaboration
   */
  async leaveCollaboration(collaborationId: string, userId: string): Promise<ServiceResult<Collaboration>> {
    try {
      const collaborationResult = await this.getCollaboration(collaborationId);
      if (collaborationResult.error || !collaborationResult.data) {
        return { data: null, error: collaborationResult.error || { code: 'collaboration-not-found', message: 'Collaboration not found' } };
      }

      const collaboration = collaborationResult.data;
      const currentParticipants = collaboration.participants || [];
      const currentCollaborators = collaboration.collaborators || [];
      
      const updates: Partial<Collaboration> = {
        participants: currentParticipants.filter(id => id !== userId),
        collaborators: currentCollaborators.filter(id => id !== userId)
      };

      // Update status if needed
      if (updates.participants!.length < collaboration.maxParticipants && collaboration.status === 'in-progress') {
        updates.status = 'recruiting';
      }

      return await this.updateCollaboration(collaborationId, updates);
    } catch (error) {
      const appError = new AppError(
        'Failed to leave collaboration',
        ErrorCode.DATABASE_ERROR,
        ErrorSeverity.MEDIUM,
        { collaborationId, userId }
      );
      
      return { data: null, error: { code: 'leave-collaboration-failed', message: appError.message } };
    }
  }

  /**
   * Complete a collaboration
   */
  async completeCollaboration(collaborationId: string): Promise<ServiceResult<Collaboration>> {
    try {
      const updates: Partial<Collaboration> = {
        status: 'completed'
      };

      return await this.updateCollaboration(collaborationId, updates);
    } catch (error) {
      const appError = new AppError(
        'Failed to complete collaboration',
        ErrorCode.DATABASE_ERROR,
        ErrorSeverity.HIGH,
        { collaborationId }
      );
      
      return { data: null, error: { code: 'complete-collaboration-failed', message: appError.message } };
    }
  }

  /**
   * Get collaborations for a user (as creator or participant)
   */
  async getCollaborationsForUser(userId: string): Promise<ServiceResult<Collaboration[]>> {
    try {
      // Get collaborations where user is creator
      const creatorResult = await this.getCollaborationsByCreator(userId);
      
      // Get collaborations where user is participant
      const participantResult = await this.executeQuery(
        async () => {
          const constraints: QueryConstraint[] = [
            where('participants', 'array-contains', userId)
          ];
          const result = await this.list(constraints);
          return result.data?.items || [];
        },
        'get collaborations as participant'
      );

      if (creatorResult.error || participantResult.error) {
        return { 
          data: null, 
          error: creatorResult.error || participantResult.error 
        };
      }

      const allCollaborations = [
        ...(creatorResult.data || []),
        ...(participantResult.data || [])
      ];

      // Remove duplicates and sort by creation date
      const uniqueCollaborations = allCollaborations.filter((collab, index, self) => 
        index === self.findIndex(c => c.id === collab.id)
      ).sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());

      return { data: uniqueCollaborations, error: null };
    } catch (error) {
      const appError = new AppError(
        'Failed to get collaborations for user',
        ErrorCode.DATABASE_ERROR,
        ErrorSeverity.MEDIUM,
        { userId }
      );
      
      return { data: null, error: { code: 'get-collaborations-for-user-failed', message: appError.message } };
    }
  }
}

// Create singleton instance
export const collaborationService = new CollaborationService();
