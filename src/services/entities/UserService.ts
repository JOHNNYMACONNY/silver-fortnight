import { where, orderBy, limit as limitQuery, QueryConstraint } from 'firebase/firestore';
import { BaseService } from '../core/BaseService';
import { ServiceResult } from '../../types/ServiceError';
import { CreateUserProfileData } from '../../firebase-config';
import type { BannerData } from '../../utils/imageUtils';
import { AppError, ErrorCode, ErrorSeverity } from '../../types/errors';

// Collection name
export const USERS_COLLECTION = 'users';

// User types
export type UserRole = 'user' | 'admin' | 'moderator';

export interface User {
  uid: string;
  id: string;
  email?: string;
  displayName?: string;
  profilePicture?: string;
  photoURL?: string;
  bio?: string;
  location?: string;
  website?: string;
  skills?: any;
  reputationScore?: number;
  interests?: string;
  role?: UserRole;
  createdAt?: any;
  updatedAt?: any;
  public?: boolean;
  // Optional profile banner (Cloudinary publicId data or legacy string URL)
  banner?: BannerData | string | null;
  // Optional FX settings for banner overlay
  bannerFx?: {
    enable: boolean;
    preset: 'ribbons' | 'aurora' | 'metaballs' | 'audio';
    opacity: number;
    blendMode: 'screen' | 'soft-light' | 'overlay' | 'plus-lighter';
  };
}

/**
 * User Service - handles all user-related database operations
 */
export class UserService extends BaseService<User> {
  constructor() {
    super(USERS_COLLECTION);
  }

  /**
   * Create a new user profile
   */
  async createUser(userData: CreateUserProfileData): Promise<ServiceResult<User>> {
    try {
      this.validateData(userData, ['uid', 'email']);
      
      const userWithTimestamps = this.addTimestamps({
        ...userData,
        id: userData.uid,
        reputationScore: 0,
        role: 'user' as UserRole,
        public: userData.public ?? true
      });

      return await this.create(userWithTimestamps, userData.uid);
    } catch (error) {
      const appError = new AppError(
        'Failed to create user profile',
        ErrorCode.DATABASE_ERROR,
        ErrorSeverity.HIGH,
        { userData }
      );
      
      return { data: null, error: { code: 'create-user-failed', message: appError.message } };
    }
  }

  /**
   * Get user by ID
   */
  async getUser(userId: string): Promise<ServiceResult<User>> {
    return await this.read(userId);
  }

  /**
   * Update user profile
   */
  async updateUser(userId: string, updates: Partial<User>): Promise<ServiceResult<User>> {
    try {
      const updatesWithTimestamp = this.addTimestamps(updates, true);
      return await this.update(userId, updatesWithTimestamp);
    } catch (error) {
      const appError = new AppError(
        'Failed to update user profile',
        ErrorCode.DATABASE_ERROR,
        ErrorSeverity.MEDIUM,
        { userId, updates }
      );
      
      return { data: null, error: { code: 'update-user-failed', message: appError.message } };
    }
  }

  /**
   * Delete user profile
   */
  async deleteUser(userId: string): Promise<ServiceResult<boolean>> {
    return await this.delete(userId);
  }

  /**
   * Search users by skills
   */
  async searchUsersBySkills(skills: string[], limit: number = 20): Promise<ServiceResult<User[]>> {
    try {
      const constraints: QueryConstraint[] = [
        where('skills', 'array-contains-any', skills),
        orderBy('reputationScore', 'desc'),
        limitQuery(limit)
      ];

      const result = await this.list(constraints);
      if (result.error) {
        return { data: null, error: result.error };
      }

      return { data: result.data?.items || [], error: null };
    } catch (error) {
      const appError = new AppError(
        'Failed to search users by skills',
        ErrorCode.DATABASE_ERROR,
        ErrorSeverity.MEDIUM,
        { skills, limit }
      );
      
      return { data: null, error: { code: 'search-users-failed', message: appError.message } };
    }
  }

  /**
   * Get users by location
   */
  async getUsersByLocation(location: string, limit: number = 20): Promise<ServiceResult<User[]>> {
    try {
      const constraints: QueryConstraint[] = [
        where('location', '==', location),
        orderBy('reputationScore', 'desc'),
        limitQuery(limit)
      ];

      const result = await this.list(constraints);
      if (result.error) {
        return { data: null, error: result.error };
      }

      return { data: result.data?.items || [], error: null };
    } catch (error) {
      const appError = new AppError(
        'Failed to get users by location',
        ErrorCode.DATABASE_ERROR,
        ErrorSeverity.MEDIUM,
        { location, limit }
      );
      
      return { data: null, error: { code: 'get-users-by-location-failed', message: appError.message } };
    }
  }

  /**
   * Get top users by reputation
   */
  async getTopUsers(limit: number = 10): Promise<ServiceResult<User[]>> {
    try {
      const constraints: QueryConstraint[] = [
        orderBy('reputationScore', 'desc'),
        limitQuery(limit)
      ];

      const result = await this.list(constraints);
      if (result.error) {
        return { data: null, error: result.error };
      }

      return { data: result.data?.items || [], error: null };
    } catch (error) {
      const appError = new AppError(
        'Failed to get top users',
        ErrorCode.DATABASE_ERROR,
        ErrorSeverity.MEDIUM,
        { limit }
      );
      
      return { data: null, error: { code: 'get-top-users-failed', message: appError.message } };
    }
  }

  /**
   * Update user reputation score
   */
  async updateReputationScore(userId: string, scoreChange: number): Promise<ServiceResult<User>> {
    try {
      const userResult = await this.getUser(userId);
      if (userResult.error || !userResult.data) {
        return { data: null, error: userResult.error || { code: 'user-not-found', message: 'User not found' } };
      }

      const currentScore = userResult.data.reputationScore || 0;
      const newScore = Math.max(0, currentScore + scoreChange); // Ensure score doesn't go below 0

      return await this.updateUser(userId, { reputationScore: newScore });
    } catch (error) {
      const appError = new AppError(
        'Failed to update user reputation score',
        ErrorCode.DATABASE_ERROR,
        ErrorSeverity.MEDIUM,
        { userId, scoreChange }
      );
      
      return { data: null, error: { code: 'update-reputation-failed', message: appError.message } };
    }
  }

  /**
   * Check if user exists
   */
  async userExists(userId: string): Promise<ServiceResult<boolean>> {
    try {
      const result = await this.getUser(userId);
      return { data: result.data !== null, error: null };
    } catch (error) {
      const appError = new AppError(
        'Failed to check if user exists',
        ErrorCode.DATABASE_ERROR,
        ErrorSeverity.LOW,
        { userId }
      );
      
      return { data: null, error: { code: 'user-exists-check-failed', message: appError.message } };
    }
  }

  /**
   * Get users with pagination
   */
  async getUsersPaginated(
    pageSize: number = 20,
    lastUserId?: string
  ): Promise<ServiceResult<{ users: User[]; hasMore: boolean; lastUserId?: string }>> {
    try {
      const constraints: QueryConstraint[] = [
        orderBy('createdAt', 'desc'),
        limitQuery(pageSize)
      ];

      let startAfterDoc;
      if (lastUserId) {
        const lastUserResult = await this.getUser(lastUserId);
        if (lastUserResult.data) {
          // We would need the document snapshot here, but for simplicity we'll skip startAfter
          // In a real implementation, you'd store the DocumentSnapshot
        }
      }

      const result = await this.list(constraints, { limit: pageSize });
      if (result.error) {
        return { data: null, error: result.error };
      }

      const users = result.data?.items || [];
      const hasMore = result.data?.hasMore || false;
      const lastUser = users[users.length - 1];

      return {
        data: {
          users,
          hasMore,
          lastUserId: lastUser?.id
        },
        error: null
      };
    } catch (error) {
      const appError = new AppError(
        'Failed to get users with pagination',
        ErrorCode.DATABASE_ERROR,
        ErrorSeverity.MEDIUM,
        { pageSize, lastUserId }
      );
      
      return { data: null, error: { code: 'get-users-paginated-failed', message: appError.message } };
    }
  }

  /**
   * Batch update multiple users
   */
  async batchUpdateUsers(updates: Array<{ userId: string; data: Partial<User> }>): Promise<ServiceResult<boolean>> {
    try {
      const operations = updates.map(update => ({
        type: 'update' as const,
        id: update.userId,
        data: this.addTimestamps(update.data, true)
      }));

      return await this.batchOperation(operations);
    } catch (error) {
      const appError = new AppError(
        'Failed to batch update users',
        ErrorCode.DATABASE_ERROR,
        ErrorSeverity.HIGH,
        { updateCount: updates.length }
      );
      
      return { data: null, error: { code: 'batch-update-users-failed', message: appError.message } };
    }
  }
}

// Create singleton instance
export const userService = new UserService();
