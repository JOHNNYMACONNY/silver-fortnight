import { 
  doc, 
  getDoc, 
  getDocs, 
  collection, 
  query, 
  where, 
  limit,
  DocumentData,
  QueryConstraint,
  Firestore
} from 'firebase/firestore';

/**
 * Trade data structure for skills
 */
export interface TradeSkill {
  id: string;
  name: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  category?: string;
}

/**
 * Trade participant structure
 */
export interface TradeParticipants {
  creator: string;
  participant: string | null;
}

/**
 * Complete Trade interface for migration compatibility
 */
export interface Trade {
  id: string;
  title: string;
  description?: string;
  status: 'draft' | 'active' | 'matched' | 'in_progress' | 'completed' | 'cancelled';
  
  // NEW FORMAT (primary)
  skillsOffered: TradeSkill[];
  skillsWanted: TradeSkill[];
  participants: TradeParticipants;
  
  // LEGACY FORMAT (for backward compatibility)
  offeredSkills?: TradeSkill[];
  requestedSkills?: TradeSkill[];
  creatorId?: string;
  participantId?: string | null;
  
  // Timestamps
  createdAt: any; // Firestore Timestamp
  updatedAt: any; // Firestore Timestamp
  
  // Migration metadata
  schemaVersion?: string;
  compatibilityLayerUsed?: boolean;
}

/**
 * Trade Compatibility Service
 * 
 * ⚠️  CRITICAL: Maintains backward compatibility during migration
 * 
 * This service provides a seamless interface for trade operations that works
 * with both legacy and new data formats during the migration period.
 */
export class TradeCompatibilityService {
  private db: Firestore;
  
  constructor(firestoreInstance: Firestore) {
    this.db = firestoreInstance;
  }

  /**
   * Normalize trade data to support both old and new field formats
   * 
   * @param data - Raw document data from Firestore
   * @returns Normalized Trade object
   * @throws Error if data is null or invalid
   */
  static normalizeTradeData(data: DocumentData): Trade {
    if (!data) {
      throw new Error('Trade data is null or undefined');
    }

    try {
      // Extract skills with fallback to legacy field names
      const skillsOffered = data.skillsOffered || data.offeredSkills || [];
      const skillsWanted = data.skillsWanted || data.requestedSkills || [];
      
      // Extract participant information with fallback.
      // Preserve explicit `null` when `participantId` is present but null,
      // otherwise leave as `undefined` when absent so tests relying on the
      // distinction can detect missing fields vs explicit nulls.
      const participants = data.participants || {
        creator: data.creatorId,
        participant: Object.prototype.hasOwnProperty.call(data, 'participantId')
          ? data.participantId
          : undefined
      };

  // Note: do not throw when creator is missing; preserve undefined so callers
  // and tests can detect absent creators vs explicit null. This maintains
  // compatibility with minimal or incomplete trade documents.

      return {
        ...data,
        
        // NEW FORMAT (primary)
        skillsOffered: this.normalizeSkills(skillsOffered),
        skillsWanted: this.normalizeSkills(skillsWanted),
        participants,
        
        // LEGACY FORMAT (for backward compatibility)
        offeredSkills: this.normalizeSkills(skillsOffered),
        requestedSkills: this.normalizeSkills(skillsWanted),
        creatorId: participants.creator,
        participantId: participants.participant,
        
        // Migration metadata
        schemaVersion: data.schemaVersion || '1.0',
        compatibilityLayerUsed: true
      } as Trade;
    } catch (error) {
      console.error('Error normalizing trade data:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Failed to normalize trade data: ${errorMessage}`);
    }
  }

  /**
   * Normalize skill data structure
   * 
   * @param skills - Array of skills in various formats
   * @returns Array of normalized TradeSkill objects
   */
  private static normalizeSkills(skills: any[]): TradeSkill[] {
    if (!Array.isArray(skills)) {
      return [];
    }

    return skills.map((skill, index) => {
      try {
        if (typeof skill === 'string') {
          return { 
            id: skill, 
            name: skill, 
            level: 'intermediate' as const
          };
        }
        
        if (typeof skill === 'object' && skill !== null) {
          return {
            id: skill.id || skill.name || `skill_${index}`,
            name: skill.name || skill.id || `Skill ${index + 1}`,
            level: skill.level || 'intermediate' as const,
            category: skill.category,
            ...skill
          };
        }
        
        // Fallback for unexpected formats
        return {
          id: `unknown_skill_${index}`,
          name: String(skill),
          level: 'intermediate' as const
        };
      } catch (error) {
        console.warn(`Error normalizing skill at index ${index}:`, error);
        return {
          id: `error_skill_${index}`,
          name: 'Unknown Skill',
          level: 'intermediate' as const
        };
      }
    });
  }

  /**
   * Get single trade with compatibility normalization
   * 
   * @param id - Trade document ID
   * @returns Promise resolving to normalized Trade or null if not found
   */
  async getTrade(id: string): Promise<Trade | null> {
    if (!id || typeof id !== 'string') {
      throw new Error('Trade ID must be a non-empty string');
    }

    try {
      const docRef = doc(this.db, 'trades', id);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return null;
      }

      return TradeCompatibilityService.normalizeTradeData({
        id: docSnap.id,
        ...docSnap.data()
      });
    } catch (error) {
      console.error(`Error fetching trade ${id}:`, error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Failed to fetch trade: ${errorMessage}`);
    }
  }

  /**
   * Get trades by user (supports both old and new participant formats)
   * 
   * @param userId - User ID to search for
   * @returns Promise resolving to array of normalized Trade objects
   */
  async getTradesByUser(userId: string): Promise<Trade[]> {
    if (!userId || typeof userId !== 'string') {
      throw new Error('User ID must be a non-empty string');
    }

    try {
      const allTrades: Trade[] = [];
      const seenTradeIds = new Set<string>();
      
      // Try new format queries first
      try {
        // Query for trades where user is creator
        const creatorTrades = await this.queryTrades([
          where('participants.creator', '==', userId)
        ]);
        
        creatorTrades.forEach((trade: any) => {
          if (!seenTradeIds.has(trade.id)) {
            allTrades.push(trade);
            seenTradeIds.add(trade.id);
          }
        });
        
        // Query for trades where user is participant
        const participantTrades = await this.queryTrades([
          where('participants.participant', '==', userId)
        ]);
        
        participantTrades.forEach((trade: any) => {
          if (!seenTradeIds.has(trade.id)) {
            allTrades.push(trade);
            seenTradeIds.add(trade.id);
          }
        });
      } catch (newFormatError) {
        console.log('New format query failed, trying legacy format:', newFormatError instanceof Error ? newFormatError.message : 'Unknown error');
      }
      
      // Try legacy format as fallback
      try {
        const legacyCreatorTrades = await this.queryTrades([
          where('creatorId', '==', userId)
        ]);
        
        legacyCreatorTrades.forEach((trade: any) => {
          if (!seenTradeIds.has(trade.id)) {
            allTrades.push(trade);
            seenTradeIds.add(trade.id);
          }
        });
        
        const legacyParticipantTrades = await this.queryTrades([
          where('participantId', '==', userId)
        ]);
        
        legacyParticipantTrades.forEach((trade: any) => {
          if (!seenTradeIds.has(trade.id)) {
            allTrades.push(trade);
            seenTradeIds.add(trade.id);
          }
        });
      } catch (legacyError) {
        console.log('Legacy format query also failed:', legacyError instanceof Error ? legacyError.message : 'Unknown error');
      }
      
      // Sort by creation date (newest first)
      allTrades.sort((a, b) => {
        const aTime = a.createdAt?.toMillis?.() || a.createdAt?.getTime?.() || 0;
        const bTime = b.createdAt?.toMillis?.() || b.createdAt?.getTime?.() || 0;
        return bTime - aTime;
      });
      
      return allTrades;
    } catch (error) {
      console.error(`Error getting trades for user ${userId}:`, error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Failed to get user trades: ${errorMessage}`);
    }
  }

  /**
   * Query trades with compatibility normalization
   * 
   * @param constraints - Firestore query constraints
   * @param maxResults - Maximum number of results to return
   * @returns Promise resolving to array of normalized Trade objects
   */
  async queryTrades(constraints: QueryConstraint[] = [], maxResults?: number): Promise<Trade[]> {
    // Debug log for test diagnosis
     
    console.log('[TradeCompatibilityService.queryTrades] constraints:', constraints, 'maxResults:', maxResults);
    try {
      let q = query(collection(this.db, 'trades'), ...constraints);
      
      if (maxResults) {
        q = query(q, limit(maxResults));
      }
      
      const snapshot = await getDocs(q);
      const trades = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...(typeof data === 'object' && data !== null ? data : {})
        };
      });
      
      // Apply compatibility layer normalization
      const normalizedTrades = trades.map(trade => 
        TradeCompatibilityService.normalizeTradeData(trade)
      );
      
      return normalizedTrades;
    } catch (error) {
      console.error('Error querying trades:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Failed to query trades: ${errorMessage}`);
    }
  }

  /**
   * Get active trades with skill matching
   * 
   * @param skillName - Skill to search for
   * @param searchType - Whether to search offered or wanted skills
   * @returns Promise resolving to array of matching trades
   */
  async getTradesBySkill(
    skillName: string, 
    searchType: 'offered' | 'wanted' = 'offered'
  ): Promise<Trade[]> {
    if (!skillName || typeof skillName !== 'string') {
      throw new Error('Skill name must be a non-empty string');
    }

    try {
      const fieldName = searchType === 'offered' ? 'skillsOffered' : 'skillsWanted';
      const legacyFieldName = searchType === 'offered' ? 'offeredSkills' : 'requestedSkills';
      
      const allTrades: Trade[] = [];
      const seenTradeIds = new Set<string>();
      
      // Try new format first
      try {
        const newFormatTrades = await this.queryTrades([
          where(fieldName, 'array-contains-any', [skillName]),
          where('status', '==', 'active')
        ]);
        
        newFormatTrades.forEach((trade: any) => {
          if (!seenTradeIds.has(trade.id)) {
            allTrades.push(trade);
            seenTradeIds.add(trade.id);
          }
        });
      } catch (newFormatError) {
        console.log('New format skill query failed, trying legacy format');
      }
      
      // Try legacy format as fallback
      try {
        const legacyTrades = await this.queryTrades([
          where(legacyFieldName, 'array-contains-any', [skillName]),
          where('status', '==', 'active')
        ]);
        
        legacyTrades.forEach((trade: any) => {
          if (!seenTradeIds.has(trade.id)) {
            allTrades.push(trade);
            seenTradeIds.add(trade.id);
          }
        });
      } catch (legacyError) {
        console.log('Legacy format skill query also failed');
      }
      
      return allTrades;
    } catch (error) {
      console.error(`Error searching trades by skill ${skillName}:`, error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Failed to search trades by skill: ${errorMessage}`);
    }
  }

  /**
   * Validate trade data structure
   * 
   * @param trade - Trade object to validate
   * @returns Boolean indicating if trade is valid
   */
  static validateTrade(trade: any): trade is Trade {
    try {
      return (
        trade &&
        typeof trade === 'object' &&
        typeof trade.id === 'string' &&
        typeof trade.title === 'string' &&
        Array.isArray(trade.skillsOffered) &&
        Array.isArray(trade.skillsWanted) &&
        trade.participants &&
        typeof trade.participants.creator === 'string'
      );
    } catch {
      return false;
    }
  }
}

// Export static methods for use without instantiation
export const { normalizeTradeData, validateTrade } = TradeCompatibilityService;
