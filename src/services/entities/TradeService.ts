import { where, orderBy, limit as limitQuery, QueryConstraint, Timestamp } from 'firebase/firestore';
import { BaseService } from '../core/BaseService';
import { ServiceResult } from '../../types/ServiceError';
import { AppError, ErrorCode, ErrorSeverity } from '../../types/errors';

// Collection name
export const TRADES_COLLECTION = 'trades';

// Trade types
export type TradeStatus =
  | 'open'
  | 'in-progress'
  | 'pending_confirmation'
  | 'pending_evidence'
  | 'completed'
  | 'cancelled'
  | 'disputed';

export interface TradeSkill {
  name: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  category?: string;
  description?: string;
}

export interface Trade {
  id?: string;
  title: string;
  description: string;
  skillsOffered: TradeSkill[];
  skillsWanted: TradeSkill[];
  creatorId: string;
  creatorName?: string;
  creatorPhotoURL?: string;
  participantId?: string;
  participantName?: string;
  participantPhotoURL?: string;
  status: TradeStatus;
  location?: string;
  isRemote?: boolean;
  timeCommitment?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  completedAt?: Timestamp;
  category?: string;
  tags?: string[];
  images?: string[];
  requirements?: string;
  deliverables?: string;
  timeline?: string;
  compensation?: string;
  // Normalized skills index for server-side filtering (lowercased unique names)
  skillsIndex?: string[];
  visibility: 'public' | 'private' | 'unlisted';
}

/**
 * Trade Service - handles all trade-related database operations
 */
export class TradeService extends BaseService<Trade> {
  constructor() {
    super(TRADES_COLLECTION);
  }

  /**
   * Create a new trade
   */
  async createTrade(tradeData: Omit<Trade, 'id' | 'createdAt' | 'updatedAt'>): Promise<ServiceResult<Trade>> {
    try {
      this.validateData(tradeData, ['title', 'description', 'skillsOffered', 'skillsWanted', 'creatorId']);
      
      const computeSkillsIndex = (offered: TradeSkill[] = [], wanted: TradeSkill[] = []): string[] => {
        const normalized = new Set<string>();
        [...offered, ...wanted].forEach((s) => {
          const name = (s?.name || '').toString().trim().toLowerCase();
          if (name) normalized.add(name);
        });
        return Array.from(normalized);
      };

      const tradeWithTimestamps = this.addTimestamps({
        ...tradeData,
        status: 'open' as TradeStatus,
        visibility: tradeData.visibility ?? 'public',
        skillsIndex: computeSkillsIndex(tradeData.skillsOffered, tradeData.skillsWanted)
      });

      return await this.create(tradeWithTimestamps);
    } catch (error) {
      const appError = new AppError(
        'Failed to create trade',
        ErrorCode.DATABASE_ERROR,
        ErrorSeverity.HIGH,
        { tradeData }
      );
      
      return { data: null, error: { code: 'create-trade-failed', message: appError.message } };
    }
  }

  /**
   * Get trade by ID
   */
  async getTrade(tradeId: string): Promise<ServiceResult<Trade>> {
    return await this.read(tradeId);
  }

  /**
   * Update trade
   */
  async updateTrade(tradeId: string, updates: Partial<Trade>): Promise<ServiceResult<Trade>> {
    try {
      let updatesWithTimestamp = this.addTimestamps(updates, true);

      // If skills are being modified, recompute skillsIndex using latest data
      if (updates.skillsOffered !== undefined || updates.skillsWanted !== undefined) {
        const current = await this.read(tradeId);
        const currentTrade = current.data as Trade | undefined;
        const offered = updates.skillsOffered ?? currentTrade?.skillsOffered ?? [];
        const wanted = updates.skillsWanted ?? currentTrade?.skillsWanted ?? [];
        const normalized = new Set<string>();
        [...offered, ...wanted].forEach((s) => {
          const name = (s?.name || '').toString().trim().toLowerCase();
          if (name) normalized.add(name);
        });
        updatesWithTimestamp = {
          ...updatesWithTimestamp,
          skillsIndex: Array.from(normalized)
        };
      }

      return await this.update(tradeId, updatesWithTimestamp);
    } catch (error) {
      const appError = new AppError(
        'Failed to update trade',
        ErrorCode.DATABASE_ERROR,
        ErrorSeverity.MEDIUM,
        { tradeId, updates }
      );
      
      return { data: null, error: { code: 'update-trade-failed', message: appError.message } };
    }
  }

  /**
   * Delete trade
   */
  async deleteTrade(tradeId: string): Promise<ServiceResult<boolean>> {
    return await this.delete(tradeId);
  }

  /**
   * Get trades by creator
   */
  async getTradesByCreator(creatorId: string, limit: number = 20): Promise<ServiceResult<Trade[]>> {
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
        'Failed to get trades by creator',
        ErrorCode.DATABASE_ERROR,
        ErrorSeverity.MEDIUM,
        { creatorId, limit }
      );
      
      return { data: null, error: { code: 'get-trades-by-creator-failed', message: appError.message } };
    }
  }

  /**
   * Get trades by status
   */
  async getTradesByStatus(status: TradeStatus, limit: number = 20): Promise<ServiceResult<Trade[]>> {
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
        'Failed to get trades by status',
        ErrorCode.DATABASE_ERROR,
        ErrorSeverity.MEDIUM,
        { status, limit }
      );
      
      return { data: null, error: { code: 'get-trades-by-status-failed', message: appError.message } };
    }
  }

  /**
   * Search trades by skills
   */
  async searchTradesBySkills(skills: string[], limit: number = 20): Promise<ServiceResult<Trade[]>> {
    try {
      // Note: This is a simplified search. In production, you might want to use
      // a more sophisticated search solution like Algolia or Elasticsearch
      const constraints: QueryConstraint[] = [
        where('status', '==', 'open'),
        orderBy('createdAt', 'desc'),
        limitQuery(limit)
      ];

      const result = await this.list(constraints);
      if (result.error) {
        return { data: null, error: result.error };
      }

      // Client-side filtering for skills (in production, use proper search indexing)
      const filteredTrades = (result.data?.items || []).filter(trade => {
        const offeredSkills = trade.skillsOffered.map(skill => skill.name.toLowerCase());
        const wantedSkills = trade.skillsWanted.map(skill => skill.name.toLowerCase());
        const searchSkills = skills.map(skill => skill.toLowerCase());
        
        return searchSkills.some(skill => 
          offeredSkills.some(offered => offered.includes(skill)) ||
          wantedSkills.some(wanted => wanted.includes(skill))
        );
      });

      return { data: filteredTrades, error: null };
    } catch (error) {
      const appError = new AppError(
        'Failed to search trades by skills',
        ErrorCode.DATABASE_ERROR,
        ErrorSeverity.MEDIUM,
        { skills, limit }
      );
      
      return { data: null, error: { code: 'search-trades-by-skills-failed', message: appError.message } };
    }
  }

  /**
   * Get trades by location
   */
  async getTradesByLocation(location: string, includeRemote: boolean = true, limit: number = 20): Promise<ServiceResult<Trade[]>> {
    try {
      let constraints: QueryConstraint[];
      
      if (includeRemote) {
        // Get both location-specific and remote trades
        // Note: This requires two separate queries in Firestore
        const primaryLimit = Math.max(1, Math.ceil(limit / 2));
        const secondaryLimit = Math.max(1, limit - primaryLimit);

        const locationConstraints: QueryConstraint[] = [
          where('location', '==', location),
          where('status', '==', 'open'),
          orderBy('createdAt', 'desc'),
          limitQuery(primaryLimit)
        ];

        const remoteConstraints: QueryConstraint[] = [
          where('isRemote', '==', true),
          where('status', '==', 'open'),
          orderBy('createdAt', 'desc'),
          limitQuery(secondaryLimit)
        ];

        const [locationResult, remoteResult] = await Promise.all([
          this.list(locationConstraints),
          this.list(remoteConstraints)
        ]);

        if (locationResult.error || remoteResult.error) {
          return { 
            data: null, 
            error: locationResult.error || remoteResult.error 
          };
        }

        const combinedTrades = [
          ...(locationResult.data?.items || []),
          ...(remoteResult.data?.items || [])
        ].sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());

        return { data: combinedTrades.slice(0, limit), error: null };
      } else {
        constraints = [
          where('location', '==', location),
          where('status', '==', 'open'),
          orderBy('createdAt', 'desc'),
          limitQuery(limit)
        ];

        const result = await this.list(constraints);
        if (result.error) {
          return { data: null, error: result.error };
        }

        return { data: result.data?.items || [], error: null };
      }
    } catch (error) {
      const appError = new AppError(
        'Failed to get trades by location',
        ErrorCode.DATABASE_ERROR,
        ErrorSeverity.MEDIUM,
        { location, includeRemote, limit }
      );
      
      return { data: null, error: { code: 'get-trades-by-location-failed', message: appError.message } };
    }
  }

  /**
   * Accept a trade (join as participant)
   */
  async acceptTrade(tradeId: string, participantId: string, participantName?: string, participantPhotoURL?: string): Promise<ServiceResult<Trade>> {
    try {
      const updates: Partial<Trade> = {
        participantId,
        participantName,
        participantPhotoURL,
        status: 'in-progress'
      };

      return await this.updateTrade(tradeId, updates);
    } catch (error) {
      const appError = new AppError(
        'Failed to accept trade',
        ErrorCode.DATABASE_ERROR,
        ErrorSeverity.HIGH,
        { tradeId, participantId }
      );
      
      return { data: null, error: { code: 'accept-trade-failed', message: appError.message } };
    }
  }

  /**
   * Complete a trade
   */
  async completeTrade(tradeId: string): Promise<ServiceResult<Trade>> {
    try {
      const updates: Partial<Trade> = {
        status: 'completed',
        completedAt: Timestamp.now()
      };

      return await this.updateTrade(tradeId, updates);
    } catch (error) {
      const appError = new AppError(
        'Failed to complete trade',
        ErrorCode.DATABASE_ERROR,
        ErrorSeverity.HIGH,
        { tradeId }
      );
      
      return { data: null, error: { code: 'complete-trade-failed', message: appError.message } };
    }
  }

  /**
   * Cancel a trade
   */
  async cancelTrade(tradeId: string): Promise<ServiceResult<Trade>> {
    try {
      const updates: Partial<Trade> = {
        status: 'cancelled'
      };

      return await this.updateTrade(tradeId, updates);
    } catch (error) {
      const appError = new AppError(
        'Failed to cancel trade',
        ErrorCode.DATABASE_ERROR,
        ErrorSeverity.MEDIUM,
        { tradeId }
      );
      
      return { data: null, error: { code: 'cancel-trade-failed', message: appError.message } };
    }
  }

  /**
   * Get active trades for a user (as creator or participant)
   */
  async getActiveTradesForUser(userId: string): Promise<ServiceResult<Trade[]>> {
    try {
      // Get trades where user is creator
      const creatorActiveStatuses: TradeStatus[] = ['open', 'in-progress', 'pending_confirmation', 'pending_evidence'];
      const participantActiveStatuses: TradeStatus[] = ['in-progress', 'pending_confirmation', 'pending_evidence'];

      const creatorResult = await this.executeQuery(
        async () => {
          const constraints: QueryConstraint[] = [
            where('creatorId', '==', userId),
            where('status', 'in', creatorActiveStatuses)
          ];
          const result = await this.list(constraints);
          return result.data?.items || [];
        },
        'get active trades as creator'
      );

      // Get trades where user is participant
      const participantResult = await this.executeQuery(
        async () => {
          const constraints: QueryConstraint[] = [
            where('participantId', '==', userId),
            where('status', 'in', participantActiveStatuses)
          ];
          const result = await this.list(constraints);
          return result.data?.items || [];
        },
        'get active trades as participant'
      );

      if (creatorResult.error || participantResult.error) {
        return { 
          data: null, 
          error: creatorResult.error || participantResult.error 
        };
      }

      const allTrades = [
        ...(creatorResult.data || []),
        ...(participantResult.data || [])
      ];

      // Remove duplicates and sort by creation date
      const uniqueTrades = allTrades.filter((trade, index, self) => 
        index === self.findIndex(t => t.id === trade.id)
      ).sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());

      return { data: uniqueTrades, error: null };
    } catch (error) {
      const appError = new AppError(
        'Failed to get active trades for user',
        ErrorCode.DATABASE_ERROR,
        ErrorSeverity.MEDIUM,
        { userId }
      );
      
      return { data: null, error: { code: 'get-active-trades-failed', message: appError.message } };
    }
  }
}

// Create singleton instance
export const tradeService = new TradeService();
