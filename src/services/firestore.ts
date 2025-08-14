import { getSyncFirebaseDb } from '../firebase-config';
import { 
  doc, 
  setDoc, 
  getDoc, 
  getDocs,
  collection, 
  addDoc, 
  Timestamp,
  query,
  where,
  writeBatch,
  orderBy,
  arrayUnion,
  limit as limitQuery,
  deleteDoc,
  updateDoc,
  startAfter,
  DocumentSnapshot,
  QueryDocumentSnapshot,
  QueryConstraint,
  arrayRemove,
  DocumentData,
  Query,
  CollectionReference,
  Firestore
} from 'firebase/firestore';
import { CreateUserProfileData } from '../firebase-config';
import { ServiceResult } from '../types/ServiceError';
import { EmbeddedEvidence } from '../types/evidence';
import { CollaborationRole, CollaborationRoleData } from '../types/collaboration';
import { getOrCreateDirectConversation, createGroupConversation, sendMessage } from './chat/chatService';
import {
  userConverter,
  tradeConverter,
  collaborationConverter,
  notificationConverter,
  reviewConverter,
  tradeProposalConverter,
  collaborationApplicationConverter,
  challengeConverter,
  connectionConverter
} from './firestoreConverters';
import { ChatMessage } from '../types/chat';
import type { BannerData } from '../utils/imageUtils';
import { MessageType } from './firestoreConverters';

// Collection names
export const COLLECTIONS = {
  USERS: 'users',
  TRADES: 'trades',
  NOTIFICATIONS: 'notifications',
  CONVERSATIONS: 'conversations',
  MESSAGES: 'messages',
  CONNECTIONS: 'connections',
  REVIEWS: 'reviews',
  CHALLENGES: 'challenges',
  COLLABORATIONS: 'collaborations'
} as const;

// Export Timestamp explicitly
export { Timestamp };
export type { ServiceResult };

// Trade types (moved up to be available for filters)
export type TradeSkill = {
  name: string;
  level: 'beginner' | 'intermediate' | 'expert';
};

export type TradeStatus = 'open' | 'in-progress' | 'completed' | 'cancelled' | 'pending_confirmation' | 'pending_evidence' | 'disputed';

// Pagination and filtering interfaces
export interface PaginationOptions {
  limit?: number;
  startAfterDoc?: DocumentSnapshot;
  orderByField?: string;
  orderDirection?: 'asc' | 'desc';
}

export interface CollaborationFilters {
  status?: 'open' | 'in-progress' | 'completed' | 'cancelled';
  createdBy?: string;
  skillsRequired?: string[];
  // New unified skills filter used by UI; server maps to skillsIndex
  skills?: string[];
  maxParticipants?: number;
  timeCommitment?: string;
  // Search functionality
  searchQuery?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  category?: string;
  location?: string;
}

export interface TradeFilters {
  category?: string;
  status?: TradeStatus;
  skills?: string[];
  creatorId?: string;
  participantId?: string;
  skillsOffered?: string[];
  skillsWanted?: string[];
}

export interface UserFilters {
  role?: UserRole;
  hasSkills?: string[];
  location?: string;
  reputationScore?: { min?: number; max?: number };
}

export interface NotificationFilters {
  type?: 'message' | 'trade_interest' | 'trade_completed' | 'review' | 'collaboration' | 'challenge' | 'system' | 'trade';
  read?: boolean;
  relatedId?: string;
}

export interface PaginatedResult<T> {
  items: T[];
  hasMore: boolean;
  lastDoc?: QueryDocumentSnapshot<any>;
  totalCount?: number;
  queryMetadata?: any; // Metadata about the query execution for analytics
}

// Base types
export type UserRole = 'user' | 'admin' | 'moderator';

export interface User {
  uid: string;
  id: string;  // Required
  email?: string;
  displayName?: string; // Made optional to match actual data
  profilePicture?: string;
  photoURL?: string; // Legacy field for backward compatibility
  bio?: string;
  location?: string;
  banner?: BannerData | string | null;
  skills?: any; // Can be string, string[], or object - handled by parseSkills
  reputationScore?: number;
  interests?: string;
  role?: UserRole;
  createdAt?: Timestamp;
}

// Simplified Collaboration Types for UI
export type SimpleCollaborationRole = 'Leader' | 'Contributor' | 'Helper';

export interface SimpleCollaborationCard {
  id: string;
  title: string;
  description: string;
  myRole: SimpleCollaborationRole;
  teammates: Array<{
    name: string;
    role: SimpleCollaborationRole;
    skills: string[];
  }>;
  nextAction: string;
  progress: number;
  difficultyLevel: 1 | 2 | 3;
  timeCommitment: string;
}

export interface UserChallengeProgress {
  solo: {
    completed: number;
    available: number;
    unlocked: boolean;
  };
  trade: {
    completed: number;
    available: number;
    unlocked: boolean;
  };
  collaboration: {
    completed: number;
    available: number;
    unlocked: boolean;
  };
}

// Role mapping from simple to complex
export const ROLE_MAPPING: Record<SimpleCollaborationRole, CollaborationRole[]> = {
  'Leader': [CollaborationRole.OWNER, CollaborationRole.ADMIN],
  'Contributor': [CollaborationRole.MEMBER],
  'Helper': [CollaborationRole.VIEWER]
};

// Enhanced Challenge interfaces for three-tier system
export interface ChallengeParticipant {
  userId: string;
  userName: string;
  userPhotoURL?: string;
  role?: string; // For collaboration challenges
  joinedAt: Timestamp;
  status: 'ACTIVE' | 'COMPLETED' | 'DROPPED_OUT';
}

export interface ChallengeCriteria {
  type: 'VISUAL' | 'FUNCTIONAL' | 'CREATIVE' | 'TECHNICAL' | 'CONSTRAINT';
  description: string;
  required: boolean;
  validationMethod?: 'AUTO' | 'PEER' | 'AI' | 'MANUAL';
}

export interface ChallengeDeliverable {
  type: 'IMAGE' | 'VIDEO' | 'TEXT' | 'CODE_REPO' | 'DESIGN_FILE' | 'DOCUMENT';
  required: boolean;
  description: string;
  maxSize?: number; // in MB
  allowedFormats?: string[];
}

// Solo Challenge Configuration
export interface SoloChallengeConfig {
  focusArea: 'creativity' | 'skill-building' | 'portfolio' | 'experimentation';
  autoValidation: boolean;
  peerReviewOptional: boolean;
  pointsReward: number;
  badgesEarnable: string[];
  portfolioWorthy: boolean;
  autoAddToPortfolio: boolean;
}

// Trade Challenge Configuration
export interface TradeChallengeConfig {
  tradeAgreement: {
    userA: { offers: string; wants: string; timeCommitment: string };
    userB: { offers: string; wants: string; timeCommitment: string };
  };
  mutualDeliverables: TradeMutualDeliverable[];
  communicationChannel: string;
  milestoneTracking: boolean;
  bothParticipantsMustComplete: boolean;
  crossValidation: boolean;
}

export interface TradeMutualDeliverable {
  fromUserA: ChallengeDeliverable;
  toUserB: ChallengeDeliverable;
  dependency: 'PARALLEL' | 'SEQUENTIAL';
}

// Collaboration Challenge Configuration
export interface CollaborationChallengeConfig {
  teamRoles: SimplifiedTeamRole[];
  projectPhases: ProjectPhase[];
  leadershipModel: 'CREATOR_LED' | 'DEMOCRATIC' | 'ROTATING';
  advancedWorkflow: boolean;
  customRolePermissions: boolean;
}

export interface SimplifiedTeamRole {
  displayName: string;
  description: string;
  timeCommitment: string;
  skillsNeeded: string[];
  maxCount: number;
  internalRoleType: string; // Maps to CollaborationRoleType
}

export interface ProjectPhase {
  name: string;
  description: string;
  duration: string;
  roles: string[]; // Which roles are active in this phase
  deliverables: string[];
  order: number;
}

// Enhanced Challenge interface
export interface Challenge {
  id?: string;
  title: string;
  description: string;
  type: 'SOLO' | 'TRADE' | 'COLLABORATION';
  
  // Difficulty & Discovery
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  category: string;
  timeEstimate: '15-min' | '30-min' | '1-hour' | '2-hour' | 'multi-day';
  
  // Participation
  creatorId: string;
  participants: ChallengeParticipant[];
  maxParticipants: number;
  
  // Lifecycle
  status: 'DRAFT' | 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  deadline?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  
  // Content & Validation
  criteria: ChallengeCriteria[];
  deliverables: ChallengeDeliverable[];
  
  // AI & Personalization
  aiGenerated?: boolean;
  personalizedFor?: string[];
  skillsUsed: string[];
  skillsLearned: string[];
  
  // Type-specific configurations
  soloConfig?: SoloChallengeConfig;
  tradeConfig?: TradeChallengeConfig;
  collaborationConfig?: CollaborationChallengeConfig;
  
  // Legacy fields for backward compatibility
  deadline_legacy?: Timestamp;
  difficulty_legacy?: 'Beginner' | 'Intermediate' | 'Advanced';
  category_legacy?: string;
  participants_legacy?: string[];
}

export interface Collaboration {
  id?: string;
  title: string;
  description: string;
  roles: CollaborationRoleData[];
  creatorId: string;
  status: 'open' | 'in-progress' | 'completed' | 'recruiting' | 'cancelled';
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
}

export interface Connection {
  id?: string;
  userId: string;
  connectedUserId: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Timestamp;
  updatedAt: Timestamp;
  relatedId?: string;
  message?: string;
  // Additional fields needed by ConnectionCard
  senderId?: string;
  receiverId?: string;
  senderName?: string;
  receiverName?: string;
  senderPhotoURL?: string;
  receiverPhotoURL?: string;
  data?: {
    tradeId?: string;
    collaborationId?: string;
    challengeId?: string;
    conversationId?: string;
    url?: string;
  };
}

export interface Notification {
  id?: string;
  userId: string;
  type: 'message' | 'trade_interest' | 'trade_completed' | 'review' | 'collaboration' | 'challenge' | 'system' | 'trade';
  title: string;
  content: string;
  read: boolean;
  createdAt: Timestamp;
  relatedId?: string;
  message?: string;
  data?: {
    tradeId?: string;
    collaborationId?: string;
    challengeId?: string;
    conversationId?: string;
    url?: string;
  };
}

export interface NotificationData extends Omit<Notification, 'id' | 'createdAt' | 'read'> {}

export interface ChangeRequest {
  id: string;
  requestedBy: string;
  requestedAt: Timestamp;
  reason: string;
  status: 'pending' | 'addressed' | 'rejected';
  resolvedAt?: Timestamp;
}

export interface Trade {
  id?: string;
  title: string;
  description: string;
  creatorId: string;
  creatorName?: string;
  creatorPhotoURL?: string;
  participantId?: string;
  participantName?: string;
  participantPhotoURL?: string;
  category: string;
  skillsOffered: TradeSkill[];
  skillsWanted: TradeSkill[];
  // Aliases for backward compatibility
  offeredSkills: TradeSkill[];
  requestedSkills: TradeSkill[];
  status: TradeStatus;
  interestedUsers?: string[];
  acceptedUserId?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  completionRequestedAt?: Timestamp;
  completionRequestedBy?: string;
  completionConfirmedAt?: Timestamp;
  completionNotes?: string;
  completionEvidence?: EmbeddedEvidence[];
  autoCompleted?: boolean;
  autoCompletionReason?: string;
  autoCompletionCountdown?: number;
  evidence?: EmbeddedEvidence[];
  remindersSent?: number;
  disputeReason?: string;
  disputeDetails?: string;
  changeRequests?: ChangeRequest[];
}

export interface CollaborationApplication {
  id?: string;
  collaborationId: string;
  roleId: string;
  applicantId: string;
  applicantName?: string;
  applicantPhotoURL?: string;
  message: string;
  skills: string[];
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Review {
  id?: string;
  reviewerId: string;
  reviewerName?: string;
  reviewerPhotoURL?: string;
  targetId: string;
  targetType: 'user' | 'trade' | 'collaboration';
  rating: number;
  comment: string;
  tradeId?: string;
  collaborationId?: string;
  createdAt: Timestamp;
}

export interface TradeProposal {
  id?: string;
  tradeId: string;
  proposerId: string;
  proposerName?: string;
  proposerPhotoURL?: string;
  message: string;
  skillsOffered: TradeSkill[];
  skillsRequested: TradeSkill[];
  evidence?: EmbeddedEvidence[];
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export const createNotification = async (data: NotificationData): Promise<ServiceResult<string>> => {
  try {
    const db = getSyncFirebaseDb();
    const docRef = await addDoc(
      collection(db, COLLECTIONS.NOTIFICATIONS).withConverter(notificationConverter),
      { ...data, read: false, createdAt: Timestamp.now() }
    );
    return { data: docRef.id, error: null };
  } catch (error: any) {
    console.error('Error creating notification:', error);
    return { data: null, error: { code: error.code || 'unknown', message: error.message || 'Failed to create notification' } };
  }
};

export const markNotificationAsRead = async (notificationId: string): Promise<ServiceResult<void>> => {
  try {
    const db = getSyncFirebaseDb();
    await updateDoc(doc(db, COLLECTIONS.NOTIFICATIONS, notificationId), {
      read: true
    });
    return { data: null, error: null };
  } catch (error: any) {
    console.error('Error marking notification as read:', error);
    return { data: null, error: { code: error.code || 'unknown', message: error.message || 'Failed to mark notification as read' } };
  }
};

export const markAllNotificationsAsRead = async (userId: string): Promise<ServiceResult<void>> => {
  try {
    const db = getSyncFirebaseDb();
    const notificationsRef = collection(db, COLLECTIONS.NOTIFICATIONS);
    const unreadQuery = query(notificationsRef, where('userId', '==', userId), where('read', '==', false));
    const unreadDocs = await getDocs(unreadQuery);

    const batch = writeBatch(db);
    unreadDocs.docs.forEach(doc => {
      batch.update(doc.ref, { read: true });
    });

    await batch.commit();
    return { data: null, error: null };
  } catch (error: any) {
    console.error('Error marking all notifications as read:', error);
    return { data: null, error: { code: error.code || 'unknown', message: error.message || 'Failed to mark all notifications as read' } };
  }
};

export const createUserProfile = async (
  uid: string,
  profileData: CreateUserProfileData
): Promise<ServiceResult<void>> => {
  try {
    const db = getSyncFirebaseDb();
    const userWithId: User = {
      ...profileData,
      id: uid,
      uid: uid
    };
    await setDoc(doc(db, COLLECTIONS.USERS, uid).withConverter(userConverter), userWithId);
    return { data: null, error: null };
  } catch (error: any) {
    console.error('Error creating user profile:', error);
    return { data: null, error: { code: error.code || 'unknown', message: error.message || 'Failed to create user profile' } };
  }
};

export const getUserProfile = async (uid: string): Promise<ServiceResult<User | undefined>> => {
  try {
    const db = getSyncFirebaseDb();
    const docSnap = await getDoc(doc(db, COLLECTIONS.USERS, uid).withConverter(userConverter));
    const userData = docSnap.exists() ? docSnap.data() as User : undefined;
    return { data: userData, error: null };
  } catch (error: any) {
    console.error('Error getting user profile:', error);
    return { data: null, error: { code: error.code || 'unknown', message: error.message || 'Failed to get user profile' } };
  }
};

export const getAllUsers = async (
  pagination?: PaginationOptions,
  filters?: UserFilters
): Promise<ServiceResult<PaginatedResult<User>>> => {
  try {
    const db = getSyncFirebaseDb();
    const usersCollection = collection(db, COLLECTIONS.USERS).withConverter(userConverter);
    let usersQuery: Query<User> = query(usersCollection);

    // Apply filters
    if (filters) {
      const constraints: QueryConstraint[] = [];
      if (filters.role) {
        constraints.push(where('role', '==', filters.role));
      }
      // Add other filters as needed
      usersQuery = query(usersCollection, ...constraints);
    }
    
    // Apply pagination
    if (pagination) {
        const constraints: QueryConstraint[] = [];
        if (pagination.orderByField) {
            constraints.push(orderBy(pagination.orderByField, pagination.orderDirection || 'asc'));
        }
        if (pagination.startAfterDoc) {
            constraints.push(startAfter(pagination.startAfterDoc));
        }
        constraints.push(limitQuery(pagination.limit || 10));
        usersQuery = query(usersQuery, ...constraints);
    }

    const querySnapshot = await getDocs(usersQuery);
    
    const users = querySnapshot.docs.map(doc => doc.data());

    const lastDoc = querySnapshot.docs[querySnapshot.docs.length - 1];
    const hasMore = (pagination?.limit || 0) <= users.length;
    return { data: { items: users, hasMore, lastDoc }, error: null };
  } catch (error) {
    console.error('Error getting all users:', error);
    return { data: null, error: { code: 'unknown', message: 'Failed to get all users' } };
  }
};

export const getAllUsersLegacy = async (): Promise<ServiceResult<User[]>> => {
  try {
    const db = getSyncFirebaseDb();
    const querySnapshot = await getDocs(collection(db, COLLECTIONS.USERS).withConverter(userConverter));
    const users = querySnapshot.docs.map((doc) => doc.data() as User);
    return { data: users, error: null };
  } catch (error) {
    console.error('Error getting all users (legacy):', error);
    return { data: null, error: { code: 'unknown', message: 'Failed to get all users' } };
  }
};

export const deleteUser = async (userId: string): Promise<ServiceResult<void>> => {
  try {
    const db = getSyncFirebaseDb();
    await deleteDoc(doc(db, COLLECTIONS.USERS, userId));
    return { data: null, error: null };
  } catch (error: any) {
    console.error(`Error deleting user ${userId}:`, error);
    return { data: null, error: { code: 'unknown', message: `Failed to delete user ${userId}` } };
  }
};

export const updateUserRole = async (userId: string, role: UserRole): Promise<ServiceResult<void>> => {
  try {
    const db = getSyncFirebaseDb();
    const userRef = doc(db, COLLECTIONS.USERS, userId);
    await updateDoc(userRef, { role: role });
    return { data: null, error: null };
  } catch (error: any) {
    console.error(`Error updating role for user ${userId}:`, error);
    return { data: null, error: { code: 'unknown', message: `Failed to update role for user ${userId}` } };
  }
};

export const createTrade = async (tradeData: Omit<Trade, 'id'>): Promise<ServiceResult<string>> => {
  try {
    const db = getSyncFirebaseDb();
    const tradesCollection = collection(db, COLLECTIONS.TRADES).withConverter(tradeConverter);
    const docRef = await addDoc(tradesCollection, tradeData as Trade);
    return { data: docRef.id, error: null };
  } catch (error) {
    console.error('Error creating trade:', error);
    return { data: null, error: { code: 'unknown', message: 'Failed to create trade' } };
  }
};

// Fix getTrade function with proper type assertion
export const getTrade = async (tradeId: string): Promise<ServiceResult<Trade | undefined>> => {
  try {
    const db = getSyncFirebaseDb();
    const tradeRef = doc(db, COLLECTIONS.TRADES, tradeId).withConverter(tradeConverter);
    const docSnap = await getDoc(tradeRef);
    return { data: docSnap.exists() ? docSnap.data() as Trade : undefined, error: null };
  } catch (error) {
    console.error(`Error getting trade ${tradeId}:`, error);
    return { data: null, error: { code: 'unknown', message: 'Failed to get trade' } };
  }
};

export const updateTrade = async (tradeId: string, updates: Partial<Trade>): Promise<ServiceResult<void>> => {
  try {
    const db = getSyncFirebaseDb();
    const tradeRef = doc(db, COLLECTIONS.TRADES, tradeId);
    await updateDoc(tradeRef, updates);
    return { data: null, error: null };
  } catch (error) {
    console.error(`Error updating trade ${tradeId}:`, error);
    return { data: null, error: { code: 'unknown', message: 'Failed to update trade' } };
  }
};

export const deleteTrade = async (tradeId: string): Promise<ServiceResult<void>> => {
  try {
    const db = getSyncFirebaseDb();
    await deleteDoc(doc(db, COLLECTIONS.TRADES, tradeId));
    return { data: null, error: null };
  } catch (error) {
    console.error(`Error deleting trade ${tradeId}:`, error);
    return { data: null, error: { code: 'unknown', message: 'Failed to delete trade' } };
  }
};

export const getAllTrades = async (
  pagination?: PaginationOptions,
  filters?: TradeFilters
): Promise<ServiceResult<PaginatedResult<Trade>>> => {
  try {
    const db = getSyncFirebaseDb();
    const tradesCollection = collection(db, COLLECTIONS.TRADES).withConverter(tradeConverter);
    let tradesQuery: Query<Trade> = query(tradesCollection);
    
    // Apply filters
    if (filters) {
      const constraints: QueryConstraint[] = [];
      if (filters.category) {
        constraints.push(where('category', '==', filters.category));
      }
      if (filters.status) {
        constraints.push(where('status', '==', filters.status));
      }
      tradesQuery = query(tradesCollection, ...constraints);
    }

    // Apply pagination
    if (pagination) {
      const constraints: QueryConstraint[] = [];
      if (pagination.orderByField) {
        constraints.push(orderBy(pagination.orderByField, pagination.orderDirection || 'asc'));
      }
      if (pagination.startAfterDoc) {
        constraints.push(startAfter(pagination.startAfterDoc));
      }
      constraints.push(limitQuery(pagination.limit || 10));
      tradesQuery = query(tradesQuery, ...constraints);
    }
    
    const querySnapshot = await getDocs(tradesQuery);

    const trades = querySnapshot.docs.map(doc => doc.data());

    const lastDoc = querySnapshot.docs[querySnapshot.docs.length - 1];
    const hasMore = (pagination?.limit || 0) <= trades.length;

    return { data: { items: trades, hasMore, lastDoc }, error: null };
  } catch (error) {
    console.error('Error getting all trades:', error);
    return { data: null, error: { code: 'unknown', message: 'Failed to get all trades' } };
  }
};

export const getAllTradesLegacy = async (category?: string, limit?: number): Promise<ServiceResult<Trade[]>> => {
  try {
    const db = getSyncFirebaseDb();
    const tradesCollection = collection(db, COLLECTIONS.TRADES).withConverter(tradeConverter);
    const q = category 
      ? query(tradesCollection, where("category", "==", category), limitQuery(limit || 10))
      : query(tradesCollection, limitQuery(limit || 10));
    const querySnapshot = await getDocs(q);
    const trades = querySnapshot.docs.map(doc => doc.data() as Trade);
    return { data: trades, error: null };
  } catch (error) {
    console.error('Error getting all trades by category (legacy):', error);
    return { data: null, error: { code: 'unknown', message: 'Failed to get trades' } };
  }
};

export const getUserTrades = async (userId: string): Promise<ServiceResult<Trade[]>> => {
  try {
    const db = getSyncFirebaseDb();
    const tradesCollection = collection(db, COLLECTIONS.TRADES).withConverter(tradeConverter);

    const createdTradesQuery = query(tradesCollection, where('creatorId', '==', userId));
    const createdTradesSnapshot = await getDocs(createdTradesQuery);
    const createdTrades = createdTradesSnapshot.docs.map(doc => doc.data() as Trade);

    const participatingTradesQuery = query(tradesCollection, where('participantId', '==', userId));
    const participatingTradesSnapshot = await getDocs(participatingTradesQuery);
    const participatingTrades = participatingTradesSnapshot.docs.map(doc => doc.data() as Trade);

    return { data: [...createdTrades, ...participatingTrades], error: null };
  } catch (error) {
    console.error(`Error getting trades for user ${userId}:`, error);
    return { data: null, error: { code: 'unknown', message: 'Failed to get user trades' } };
  }
};

/**
 * Fetch follower or following user IDs for a given user
 */
export const getRelatedUserIds = async (
  userId: string,
  relation: 'followers' | 'following',
  opts?: { limit?: number }
): Promise<ServiceResult<{ ids: string[] }>> => {
  try {
    const db = getSyncFirebaseDb();
    const followsCol = collection(db, 'userFollows');
    const constraints: QueryConstraint[] = [];
    if (relation === 'followers') {
      constraints.push(where('followingId', '==', userId));
    } else {
      constraints.push(where('followerId', '==', userId));
    }
    constraints.push(orderBy('createdAt', 'desc'));
    if (opts?.limit) {
      constraints.push(limitQuery(opts.limit));
    }
    const q = query(followsCol, ...constraints);
    const snap = await getDocs(q);
    const ids = snap.docs
      .filter(d => !(d.data() as any)?.deletedAt)
      .map(d => relation === 'followers' ? (d.data() as any).followerId : (d.data() as any).followingId)
      .filter(Boolean);
    return { data: { ids }, error: null };
  } catch (error: any) {
    console.error('Error fetching related user ids:', error);
    return { data: null, error: { code: error.code || 'unknown', message: error.message || 'Failed to fetch related user ids' } };
  }
};

/**
 * Fetch users by ids in batches of 10 to comply with Firestore 'in' constraints
 */
export const getUsersByIds = async (ids: string[]): Promise<ServiceResult<User[]>> => {
  try {
    if (!ids.length) return { data: [], error: null };
    const db = getSyncFirebaseDb();
    const usersCol = collection(db, COLLECTIONS.USERS).withConverter(userConverter);
    const chunks: string[][] = [];
    for (let i = 0; i < ids.length; i += 10) chunks.push(ids.slice(i, i + 10));
    const results: User[] = [];
    for (const chunk of chunks) {
      // Use documentId() when fetching by Firestore doc ID
      const { documentId } = await import('firebase/firestore');
      const q = query(usersCol as any, where(documentId(), 'in', chunk));
      const snap = await getDocs(q);
      results.push(...snap.docs.map(d => d.data() as User));
    }
    // Deduplicate by id
    const uniqueMap = new Map<string, User>();
    for (const u of results) uniqueMap.set(u.id, u);
    return { data: Array.from(uniqueMap.values()), error: null };
  } catch (error: any) {
    console.error('Error fetching users by ids:', error);
    return { data: null, error: { code: error.code || 'unknown', message: error.message || 'Failed to fetch users' } };
  }
};

export const requestTradeCompletion = async (
  tradeId: string,
  userId: string,
  notes?: string,
  evidence?: EmbeddedEvidence[]
): Promise<ServiceResult<void>> => {
  try {
    const db = getSyncFirebaseDb();
    const tradeRef = doc(db, COLLECTIONS.TRADES, tradeId).withConverter(tradeConverter);
    const tradeDoc = await getDoc(tradeRef);

    if (!tradeDoc.exists()) {
      return { data: null, error: { code: 'not-found', message: 'Trade not found' } };
    }

    const tradeData = tradeDoc.data() as Trade;

    // Check if the user is the creator or participant
    if (tradeData.creatorId !== userId && tradeData.participantId !== userId) {
      return { data: null, error: { code: 'permission-denied', message: 'User is not part of this trade' } };
    }

    if (tradeData.status !== 'in-progress' && tradeData.status !== 'pending_evidence') {
      return { data: null, error: { code: 'invalid-status', message: 'Trade is not in a state to be completed' } };
    }

    if (tradeData.completionRequestedBy && tradeData.completionRequestedBy !== userId) {
      // The other party already requested completion, so this becomes a confirmation.
      return confirmTradeCompletion(tradeId, userId);
    }

    const updateData: Partial<Trade> = {
      status: 'pending_confirmation',
      completionRequestedAt: Timestamp.now(),
      completionRequestedBy: userId,
    };

    if (notes) {
      updateData.completionNotes = notes;
    }
    if (evidence) {
      updateData.completionEvidence = evidence;
    }

    await updateDoc(doc(db, COLLECTIONS.TRADES, tradeId), updateData);
    return { data: null, error: null };
  } catch (error) {
    console.error(`Error requesting completion for trade ${tradeId}:`, error);
    return { data: null, error: { code: 'unknown', message: 'Failed to request trade completion' } };
  }
};

export const confirmTradeCompletion = async (
  tradeId: string,
  userId: string
): Promise<ServiceResult<void>> => {
  try {
    const db = getSyncFirebaseDb();
    const tradeRef = doc(db, COLLECTIONS.TRADES, tradeId).withConverter(tradeConverter);
    const tradeDoc = await getDoc(tradeRef);

    if (!tradeDoc.exists()) {
      return { data: null, error: { code: 'not-found', message: 'Trade not found.' } };
    }
    const tradeData = tradeDoc.data() as Trade;

    const { creatorId, participantId, status, completionRequestedBy } = tradeData;

    if (status !== 'in-progress' && status !== 'pending_evidence') {
      return {
        data: null,
        error: { code: 'invalid-status', message: 'Trade is not in a state to be completed' }
      };
    }

    if (completionRequestedBy === userId) {
      return { data: null, error: { code: 'permission-denied', message: 'Cannot confirm your own completion request' } };
    }

    if (creatorId !== userId && participantId !== userId) {
      return { data: null, error: { code: 'permission-denied', message: 'User is not part of this trade' } };
    }

    await updateDoc(doc(db, COLLECTIONS.TRADES, tradeId), {
      status: 'completed',
      completionConfirmedAt: Timestamp.now(),
    });
    return { data: null, error: null };
  } catch (error) {
    console.error('Error confirming trade completion:', error);
    return { data: null, error: { code: 'unknown', message: 'Failed to confirm trade completion' } };
  }
};

export const requestTradeChanges = async (
  tradeId: string,
  userId: string,
  reason: string
): Promise<ServiceResult<void>> => {
  try {
    const db = getSyncFirebaseDb();
    const tradeRef = doc(db, COLLECTIONS.TRADES, tradeId);
    const changeRequest: ChangeRequest = {
      id: doc(collection(db, 'temp')).id, // Generate a unique ID
      requestedBy: userId,
      requestedAt: Timestamp.now(),
      reason,
      status: 'pending',
    };
    await updateDoc(tradeRef, {
      changeRequests: arrayUnion(changeRequest),
      status: 'disputed'
    });
    return { data: null, error: null };
  } catch (error: any) {
    console.error('Error requesting trade changes:', error);
    return { data: null, error: { code: 'unknown', message: 'Failed to request trade changes' } };
  }
};

export const createCollaboration = async (collaborationData: Omit<Collaboration, 'id'>): Promise<ServiceResult<string>> => {
  try {
    const db = getSyncFirebaseDb();
    const collsCollection = collection(db, COLLECTIONS.COLLABORATIONS).withConverter(collaborationConverter);
    const docRef = await addDoc(collsCollection, collaborationData as Collaboration);
    return { data: docRef.id, error: null };
  } catch (error) {
    console.error('Error creating collaboration:', error);
    return { data: null, error: { code: 'unknown', message: 'Failed to create collaboration' } };
  }
};

// Fix getCollaboration function
export const getCollaboration = async (collaborationId: string): Promise<ServiceResult<Collaboration | undefined>> => {
  try {
    const db = getSyncFirebaseDb();
    const collRef = doc(db, COLLECTIONS.COLLABORATIONS, collaborationId).withConverter(collaborationConverter);
    const docSnap = await getDoc(collRef);
    return { data: docSnap.exists() ? docSnap.data() as Collaboration : undefined, error: null };
  } catch (error) {
    console.error(`Error getting collaboration ${collaborationId}:`, error);
    return { data: null, error: { code: 'unknown', message: 'Failed to get collaboration' } };
  }
};

// Fix getAllCollaborations function with proper null checks
export const getAllCollaborations = async (
  pagination?: PaginationOptions,
  filters?: CollaborationFilters
): Promise<ServiceResult<PaginatedResult<Collaboration>>> => {
  try {
    const db = getSyncFirebaseDb();
    const collsCollection = collection(db, COLLECTIONS.COLLABORATIONS).withConverter(collaborationConverter);
    
    // Smart query building based on filter complexity
    const queryBuilder = new CollaborationQueryBuilder(collsCollection, filters);
    
    // Use simplified filters if complex index is required
    const effectiveFilters = queryBuilder.requiresComplexIndex() 
      ? queryBuilder.getSimplifiedFilters() 
      : filters;
    
    const simplifiedQueryBuilder = effectiveFilters !== filters 
      ? new CollaborationQueryBuilder(collsCollection, effectiveFilters)
      : queryBuilder;
    
    let collsQuery = simplifiedQueryBuilder.buildQuery();

    // Apply pagination with smart ordering
    const paginationConstraints: QueryConstraint[] = [];
    
    // Always add ordering for consistency (required for Firestore queries)
    const orderByField = pagination?.orderByField || simplifiedQueryBuilder.getOptimalOrderBy();
    if (orderByField) {
      paginationConstraints.push(orderBy(orderByField, pagination?.orderDirection || 'desc'));
    }
    
    if (pagination?.startAfterDoc) {
      paginationConstraints.push(startAfter(pagination.startAfterDoc));
    }
    
    // Optimize limit based on filter complexity
    const optimizedLimit = simplifiedQueryBuilder.getOptimizedLimit(pagination?.limit || 20);
    paginationConstraints.push(limitQuery(optimizedLimit));
    
    collsQuery = query(collsQuery, ...paginationConstraints);

    const querySnapshot = await getDocs(collsQuery);
    let collaborations = querySnapshot.docs.map(doc => doc.data() as Collaboration);

    // Apply client-side filtering for filters that were simplified due to index requirements
    if (effectiveFilters !== filters && filters) {
      collaborations = applyClientSideFilters(collaborations, filters, effectiveFilters);
    }

    // Apply server-side text search if available, otherwise fallback to client-side
    if (filters?.searchQuery) {
      collaborations = await applyTextSearch(collaborations, filters.searchQuery, db);
    }

    // Apply date range filtering
    if (filters?.dateRange) {
      collaborations = applyDateRangeFilter(collaborations, filters.dateRange);
    }

    const lastDoc = querySnapshot.docs[querySnapshot.docs.length - 1];
    const hasMore = collaborations.length >= (pagination?.limit || 20);

    return { 
      data: { 
        items: collaborations, 
        hasMore, 
        lastDoc,
        totalCount: collaborations.length,
        queryMetadata: {
          ...simplifiedQueryBuilder.getQueryMetadata(),
          usedSimplifiedFilters: effectiveFilters !== filters,
          originalFilters: filters,
          effectiveFilters: effectiveFilters
        }
      }, 
      error: null 
    };
  } catch (error) {
    console.error('Error getting all collaborations:', error);
    return { data: null, error: { code: 'unknown', message: 'Failed to get all collaborations' } };
  }
};

// Smart query builder for collaboration filtering
class CollaborationQueryBuilder {
  private collection: CollectionReference<Collaboration>;
  private filters: CollaborationFilters | undefined;
  private constraints: QueryConstraint[] = [];
  private queryMetadata: any = {};

  constructor(collection: CollectionReference<Collaboration>, filters?: CollaborationFilters) {
    this.collection = collection;
    this.filters = filters;
    this.buildConstraints();
  }

  private buildConstraints(): void {
    if (!this.filters) return;

    // Priority 1: Exact match filters (most efficient)
    if (this.filters.status) {
      this.constraints.push(where('status', '==', this.filters.status));
      this.queryMetadata.statusFilter = true;
    }

    if (this.filters.category) {
      this.constraints.push(where('category', '==', this.filters.category));
      this.queryMetadata.categoryFilter = true;
    }

    if (this.filters.timeCommitment) {
      this.constraints.push(where('timeCommitment', '==', this.filters.timeCommitment));
      this.queryMetadata.timeFilter = true;
    }

    // Priority 2: Range filters
    if (this.filters.maxParticipants) {
      this.constraints.push(where('maxParticipants', '<=', this.filters.maxParticipants));
      this.queryMetadata.participantFilter = true;
    }

    // Priority 3: Array filters (less efficient, use sparingly)
    const uiSkills = (this.filters as any).skills as string[] | undefined;
    const requiredSkills = this.filters.skillsRequired as string[] | undefined;
    const combinedSkills = [
      ...(Array.isArray(uiSkills) ? uiSkills : []),
      ...(Array.isArray(requiredSkills) ? requiredSkills : [])
    ];
    if (combinedSkills.length > 0) {
      // Use normalized index for better matches and performance
      const limitedSkills = combinedSkills.map(s => s.toLowerCase()).slice(0, 10);
      this.constraints.push(where('skillsIndex', 'array-contains-any', limitedSkills));
      this.queryMetadata.skillsFilter = true;
    }

    // Priority 4: String filters (least efficient, consider full-text search)
    if (this.filters.location) {
      this.constraints.push(where('location', '==', this.filters.location));
      this.queryMetadata.locationFilter = true;
    }

    if (this.filters.createdBy) {
      this.constraints.push(where('creatorId', '==', this.filters.createdBy));
      this.queryMetadata.creatorFilter = true;
    }

    // Note: Default ordering is handled by pagination logic to avoid duplicates
  }

  buildQuery(): Query<Collaboration> {
    return this.constraints.length > 0 
      ? query(this.collection, ...this.constraints)
      : query(this.collection);
  }

  getOptimalOrderBy(): string {
    // Smart ordering based on active filters
    // Avoid complex index requirements by using simple ordering
    if (this.filters?.category) return 'category';
    if (this.filters?.timeCommitment) return 'timeCommitment';
    return 'createdAt';
  }

  // Check if query requires complex indexes
  requiresComplexIndex(): boolean {
    // These combinations require composite indexes
    if (this.filters?.status && this.filters?.category) return true;
    if (this.filters?.status && this.filters?.timeCommitment) return true;
    if (this.filters?.status && this.filters?.maxParticipants) return true;
    if (this.filters?.category && this.filters?.timeCommitment) return true;
    if (this.filters?.skillsRequired && this.filters?.status) return true;
    return false;
  }

  // Get simplified filters for basic queries
  getSimplifiedFilters(): CollaborationFilters | undefined {
    if (!this.filters) return undefined;
    
    // If complex index is required, simplify the query
    if (this.requiresComplexIndex()) {
      const simplified: CollaborationFilters = {};
      
      // Keep only the most important filter to avoid index issues
      if (this.filters.status) {
        simplified.status = this.filters.status;
      } else if (this.filters.category) {
        simplified.category = this.filters.category;
      } else if (this.filters.timeCommitment) {
        simplified.timeCommitment = this.filters.timeCommitment;
      }
      
      return simplified;
    }
    
    return this.filters;
  }

  getOptimizedLimit(requestedLimit: number): number {
    // Optimize limit based on filter complexity
    const filterCount = Object.keys(this.queryMetadata).length;
    if (filterCount > 3) {
      return Math.min(requestedLimit, 50); // More filters = smaller batches
    }
    return Math.min(requestedLimit, 100); // Default optimization
  }

  getQueryMetadata(): any {
    return {
      ...this.queryMetadata,
      constraintCount: this.constraints.length,
      hasComplexFilters: this.queryMetadata.skillsFilter || this.queryMetadata.locationFilter
    };
  }
}

// Enhanced text search with server-side optimization
async function applyTextSearch(
  collaborations: Collaboration[], 
  searchQuery: string, 
  db: Firestore
): Promise<Collaboration[]> {
  const searchTerm = searchQuery.toLowerCase().trim();
  
  if (searchTerm.length < 2) return collaborations;

  // For short queries, use client-side filtering
  if (searchTerm.length < 4) {
    return collaborations.filter(collab => {
      const title = collab.title?.toLowerCase() || '';
      const description = collab.description?.toLowerCase() || '';
      const creatorName = collab.creatorName?.toLowerCase() || '';
      const skills = collab.skillsRequired?.join(' ').toLowerCase() || '';
      const category = collab.category?.toLowerCase() || '';
      
      return title.includes(searchTerm) || 
             description.includes(searchTerm) || 
             creatorName.includes(searchTerm) || 
             skills.includes(searchTerm) ||
             category.includes(searchTerm);
    });
  }

  // For longer queries, consider server-side search if available
  // This is where you could integrate Algolia, Elasticsearch, or Firestore full-text search
  // For now, we'll use optimized client-side filtering
  return collaborations.filter(collab => {
    const searchableText = [
      collab.title,
      collab.description,
      collab.creatorName,
      collab.skillsRequired?.join(' '),
      collab.category
    ].filter(Boolean).join(' ').toLowerCase();
    
    return searchableText.includes(searchTerm);
  });
}

// Date range filtering
function applyDateRangeFilter(
  collaborations: Collaboration[], 
  dateRange: { start: Date; end: Date }
): Collaboration[] {
  return collaborations.filter(collab => {
    const createdAt = collab.createdAt?.toDate() || new Date(0);
    return createdAt >= dateRange.start && createdAt <= dateRange.end;
  });
}

// Client-side filtering for complex filter combinations
function applyClientSideFilters(
  collaborations: Collaboration[],
  originalFilters: CollaborationFilters,
  effectiveFilters: CollaborationFilters | undefined
): Collaboration[] {
  return collaborations.filter(collab => {
    // Apply filters that were removed due to index requirements
    
    // Category filter
    if (originalFilters.category && collab.category !== originalFilters.category) {
      return false;
    }
    
    // Time commitment filter
    if (originalFilters.timeCommitment && collab.timeCommitment !== originalFilters.timeCommitment) {
      return false;
    }
    
    // Max participants filter
    if (originalFilters.maxParticipants && collab.maxParticipants > originalFilters.maxParticipants) {
      return false;
    }
    
    // Skills filter (supports both legacy skillsRequired and new skills)
    const legacyReq = Array.isArray(originalFilters.skillsRequired) ? originalFilters.skillsRequired : [];
    const uiSkills = Array.isArray((originalFilters as any).skills) ? (originalFilters as any).skills as string[] : [];
    const combined = [...uiSkills, ...legacyReq].map(s => s.toLowerCase());
    if (combined.length > 0) {
      const collabRequired = (collab.skillsRequired || []).map(s => (s || '').toLowerCase());
      const collabNeeded = (collab.skillsNeeded || []).map(s => (s || '').toLowerCase());
      const hasAny = combined.some(s => collabRequired.includes(s) || collabNeeded.includes(s));
      if (!hasAny) return false;
    }
    
    // Location filter
    if (originalFilters.location && collab.location !== originalFilters.location) {
      return false;
    }
    
    // Created by filter
    if (originalFilters.createdBy && collab.creatorId !== originalFilters.createdBy) {
      return false;
    }
    
    return true;
  });
}

// Fix getAllCollaborationsLegacy function
export const getAllCollaborationsLegacy = async (): Promise<ServiceResult<Collaboration[]>> => {
  try {
    const db = getSyncFirebaseDb();
    const querySnapshot = await getDocs(collection(db, COLLECTIONS.COLLABORATIONS).withConverter(collaborationConverter));
    const collaborations = querySnapshot.docs.map(doc => doc.data() as Collaboration);
    return { data: collaborations, error: null };
  } catch (error) {
    console.error('Error getting all collaborations (legacy):', error);
    return { data: null, error: { code: 'unknown', message: 'Failed to get all collaborations' } };
  }
};

export const updateCollaboration = async (collaborationId: string, updates: Partial<Collaboration>): Promise<ServiceResult<void>> => {
  try {
    const db = getSyncFirebaseDb();
    const collRef = doc(db, COLLECTIONS.COLLABORATIONS, collaborationId);
    await updateDoc(collRef, updates);
    return { data: null, error: null };
  } catch (error) {
    console.error(`Error updating collaboration ${collaborationId}:`, error);
    return { data: null, error: { code: 'unknown', message: 'Failed to update collaboration' } };
  }
};

export const deleteCollaboration = async (collaborationId: string): Promise<ServiceResult<void>> => {
  try {
    const db = getSyncFirebaseDb();
    await deleteDoc(doc(db, COLLECTIONS.COLLABORATIONS, collaborationId));
    return { data: null, error: null };
  } catch (error) {
    console.error(`Error deleting collaboration ${collaborationId}:`, error);
    return { data: null, error: { code: 'unknown', message: 'Failed to delete collaboration' } };
  }
};

// Application Functions
export const createCollaborationApplication = async (
  applicationData: Omit<CollaborationApplication, 'id' | 'createdAt' | 'updatedAt'>
): Promise<ServiceResult<string>> => {
  try {
    const db = getSyncFirebaseDb();
    const appsCollection = collection(db, COLLECTIONS.COLLABORATIONS, applicationData.collaborationId, 'roles', applicationData.roleId, 'applications').withConverter(collaborationApplicationConverter);
    const docRef = await addDoc(appsCollection, applicationData as CollaborationApplication);
    return { data: docRef.id, error: null };
  } catch (error) {
    console.error(`Error creating application for collaboration ${applicationData.collaborationId}:`, error);
    return { data: null, error: { code: 'unknown', message: 'Failed to create application' } };
  }
};

// Fix getCollaborationApplications function
export const getCollaborationApplications = async (collaborationId: string): Promise<ServiceResult<CollaborationApplication[]>> => {
  try {
    const db = getSyncFirebaseDb();
    const allApplications: CollaborationApplication[] = [];
    
    // Get all roles for this collaboration
    const rolesQuery = query(collection(db, COLLECTIONS.COLLABORATIONS, collaborationId, 'roles'));
    const rolesSnapshot = await getDocs(rolesQuery);
    
    // Get applications for each role
    for (const roleDoc of rolesSnapshot.docs) {
      const roleId = roleDoc.id;
      const applicationsQuery = query(
        collection(db, COLLECTIONS.COLLABORATIONS, collaborationId, 'roles', roleId, 'applications')
          .withConverter(collaborationApplicationConverter)
      );
      const applicationsSnapshot = await getDocs(applicationsQuery);
      
      const roleApplications = applicationsSnapshot.docs.map(doc => doc.data() as CollaborationApplication);
      allApplications.push(...roleApplications);
    }
    
    return { data: allApplications, error: null };
  } catch (error) {
    console.error(`Error getting applications for collaboration ${collaborationId}:`, error);
    return { data: null, error: { code: 'unknown', message: 'Failed to get applications' } };
  }
};

export const updateCollaborationApplication = async (
  applicationId: string,
  updates: { status: 'accepted' | 'rejected' },
  collaborationId: string,
  roleId: string // Add roleId parameter for new structure
): Promise<ServiceResult<void>> => {
  try {
    const db = getSyncFirebaseDb();
    const appRef = doc(db, COLLECTIONS.COLLABORATIONS, collaborationId, 'roles', roleId, 'applications', applicationId);
    await updateDoc(appRef, updates);
    return { data: null, error: null };
  } catch (error) {
    console.error(`Error updating application ${applicationId}:`, error);
    return { data: null, error: { code: 'unknown', message: 'Failed to update application' } };
  }
};

// Helper function for trade auto-completion countdown
export const calculateAutoCompletionCountdown = (completionRequestedAt: Timestamp | Date): number => {
  const threeDaysInMillis = 3 * 24 * 60 * 60 * 1000;
  
  const requestDate = completionRequestedAt instanceof Date 
    ? completionRequestedAt.getTime() 
    : completionRequestedAt.toDate().getTime();
  
  const autoCompletionDate = new Date(requestDate);
  autoCompletionDate.setDate(autoCompletionDate.getDate() + 3);
  
  const now = new Date();
  const daysRemaining = Math.ceil((autoCompletionDate.getTime() - now.getTime()) / threeDaysInMillis);
  
  return Math.max(0, daysRemaining);
};

// Helper function for calculating auto-completion date
export const calculateAutoCompletionDate = (completionRequestedAt: Timestamp | Date): Date => {
  const threeDaysInMillis = 3 * 24 * 60 * 60 * 1000;
  
  const requestDate = completionRequestedAt instanceof Date 
    ? completionRequestedAt.getTime() 
    : completionRequestedAt.toDate().getTime();
  
  const autoCompletionDate = new Date(requestDate);
  autoCompletionDate.setDate(autoCompletionDate.getDate() + 3);
  
  return autoCompletionDate;
};

// Helper function for determining if auto-completion should occur
export const shouldAutoComplete = (completionRequestedAt: Timestamp | Date): boolean => {
  return calculateAutoCompletionCountdown(completionRequestedAt) <= 0;
};

// Helper function for determining if a reminder should be sent
export const shouldSendReminder = (completionRequestedAt: Timestamp | Date, remindersSent: number): boolean => {
  const countdown = calculateAutoCompletionCountdown(completionRequestedAt);
  
  // Example logic: send reminder at 2 days and 1 day remaining
  if (remindersSent === 0 && countdown <= 2) {
    return true;
  }
  if (remindersSent === 1 && countdown <= 1) {
    return true;
  }
  
  return false;
};

// Fix getCollaborations function
export const getCollaborations = async (): Promise<ServiceResult<Collaboration[]>> => {
  try {
    const db = getSyncFirebaseDb();
    const querySnapshot = await getDocs(collection(db, COLLECTIONS.COLLABORATIONS).withConverter(collaborationConverter));
    const collaborations = querySnapshot.docs.map(doc => doc.data() as Collaboration);
    return { data: collaborations, error: null };
  } catch (error) {
    console.error('Error fetching collaborations:', error);
    return { data: null, error: { code: 'unknown', message: 'Failed to get collaborations' } };
  }
};

// Fix createReview function to match Review interface
export const createReview = async (
  reviewData: {
    reviewerId: string;
    reviewerName?: string;
    targetId: string;
    targetType: 'user' | 'trade' | 'collaboration';
    rating: number;
    comment: string;
    tradeId?: string;
    collaborationId?: string;
  }
): Promise<ServiceResult<string>> => {
  try {
    const db = getSyncFirebaseDb();
    const reviewsCollection = collection(db, COLLECTIONS.REVIEWS).withConverter(reviewConverter);
    
    // Create proper Review object with all required fields
    const review: Omit<Review, 'id'> = {
      reviewerId: reviewData.reviewerId,
      reviewerName: reviewData.reviewerName,
      targetId: reviewData.targetId,
      targetType: reviewData.targetType,
      rating: reviewData.rating,
      comment: reviewData.comment,
      tradeId: reviewData.tradeId,
      collaborationId: reviewData.collaborationId,
      createdAt: Timestamp.now()
    };
    
    const docRef = await addDoc(reviewsCollection, review);
    return { data: docRef.id, error: null };
  } catch (error) {
    console.error('Error creating review:', error);
    return { data: null, error: { code: 'unknown', message: 'Failed to create review' } };
  }
};

// Fix getUserReviews function
export const getUserReviews = async (userId: string): Promise<ServiceResult<Review[]>> => {
  try {
    const db = getSyncFirebaseDb();
    const reviewsQuery = query(collection(db, COLLECTIONS.REVIEWS).withConverter(reviewConverter), where('targetId', '==', userId));
    const querySnapshot = await getDocs(reviewsQuery);
    const reviews = querySnapshot.docs.map(doc => doc.data() as Review);
    return { data: reviews, error: null };
  } catch (error) {
    console.error(`Error getting reviews for user ${userId}:`, error);
    return { data: null, error: { code: 'unknown', message: 'Failed to get user reviews' } };
  }
};

export const createTradeProposal = async (proposalData: Omit<TradeProposal, 'id' | 'createdAt' | 'updatedAt'>): Promise<ServiceResult<string>> => {
  try {
    const db = getSyncFirebaseDb();
    const proposalsCollection = collection(db, COLLECTIONS.TRADES, proposalData.tradeId, 'proposals').withConverter(tradeProposalConverter);
    const docRef = await addDoc(proposalsCollection, proposalData as TradeProposal);
    return { data: docRef.id, error: null };
  } catch (error) {
    console.error(`Error creating proposal for trade ${proposalData.tradeId}:`, error);
    return { data: null, error: { code: 'unknown', message: 'Failed to create proposal' } };
  }
};

// Fix getTradeProposals function
export const getTradeProposals = async (tradeId: string): Promise<ServiceResult<TradeProposal[]>> => {
  try {
    const db = getSyncFirebaseDb();
    const proposalsQuery = query(collection(db, COLLECTIONS.TRADES, tradeId, 'proposals').withConverter(tradeProposalConverter));
    const querySnapshot = await getDocs(proposalsQuery);
    const proposals = querySnapshot.docs.map(doc => doc.data() as TradeProposal);
    return { data: proposals, error: null };
  } catch (error) {
    console.error(`Error getting proposals for trade ${tradeId}:`, error);
    return { data: null, error: { code: 'unknown', message: 'Failed to get trade proposals' } };
  }
};

// Fix updateTradeProposalStatus function with proper null checks
export const updateTradeProposalStatus = async (
  tradeId: string,
  proposalId: string,
  status: 'accepted' | 'rejected'
): Promise<ServiceResult<void>> => {
  try {
    const db = getSyncFirebaseDb();
    const tradeRef = doc(db, COLLECTIONS.TRADES, tradeId);
    const proposalRef = doc(db, COLLECTIONS.TRADES, tradeId, 'proposals', proposalId);

    const batch = writeBatch(db);

    if (status === 'accepted') {
      const proposalDoc = await getDoc(proposalRef.withConverter(tradeProposalConverter));
      if (!proposalDoc.exists()) {
        return { data: null, error: { code: 'not-found', message: 'Proposal not found' } };
      }
      const proposalData = proposalDoc.data() as TradeProposal;

      batch.update(tradeRef, {
        status: 'in-progress',
        participantId: proposalData.proposerId,
        participantName: proposalData.proposerName,
        participantPhotoURL: proposalData.proposerPhotoURL,
      });
    }

    batch.update(proposalRef, { status });
    await batch.commit();

    return { data: null, error: null };
  } catch (error) {
    console.error(`Error updating proposal ${proposalId} for trade ${tradeId}:`, error);
    return { data: null, error: { code: 'unknown', message: 'Failed to update proposal' } };
  }
};

// Fix createConversation function with proper avatar handling
export const createConversation = async (
  participants: { id: string; name: string; avatar?: string }[],
  metadata?: { tradeId?: string; tradeName?: string; conversationType?: string; [key: string]: any }
): Promise<ServiceResult<string>> => {
  try {
    if (participants.length === 2) {
      const p1 = { id: participants[0].id, name: participants[0].name, avatar: participants[0].avatar };
      const p2 = { id: participants[1].id, name: participants[1].name, avatar: participants[1].avatar };
      const conversation = await getOrCreateDirectConversation(p1, p2);
      return { data: conversation.id || '', error: null };
    } else {
      const mappedParticipants = participants.map(p => ({ id: p.id, name: p.name, avatar: p.avatar }));
      const conversation = await createGroupConversation(metadata?.tradeName || 'Group Chat', mappedParticipants);
      return { data: conversation.id || '', error: null };
    }
  } catch (error) {
    console.error('Error creating conversation:', error);
    return { data: null, error: { code: 'unknown', message: 'Failed to create conversation' } };
  }
};

export const createMessage = async (
  conversationId: string,
  messageData: {
    senderId: string;
    senderName: string;
    senderAvatar?: string;
    content: string;
    read?: boolean;
    status?: string;
    type?: string;
  }
): Promise<ServiceResult<void>> => {
  try {
    const db = getSyncFirebaseDb();
    const message: Omit<ChatMessage, 'id' | 'createdAt' | 'readBy'> = {
      conversationId: conversationId,
      senderId: messageData.senderId,
      senderName: messageData.senderName,
      senderAvatar: messageData.senderAvatar,
      content: messageData.content,
      type: (messageData.type as MessageType) || 'text',
    };
    await sendMessage(message);
    return { data: null, error: null };
  } catch (error) {
    console.error(`Error sending message to conversation ${conversationId}:`, error);
    return { data: null, error: { code: 'unknown', message: 'Failed to send message' } };
  }
};

export const getUserNotifications = async (
  userId: string,
  pagination?: PaginationOptions,
  filters?: NotificationFilters
): Promise<ServiceResult<PaginatedResult<Notification>>> => {
  try {
    const db = getSyncFirebaseDb();
    const notificationsCollection = collection(db, COLLECTIONS.NOTIFICATIONS).withConverter(notificationConverter);
    let notificationsQuery: Query<Notification> = query(notificationsCollection, where('userId', '==', userId));

    // Apply filters
    if (filters) {
      const constraints: QueryConstraint[] = [];
      if (filters.type) {
        constraints.push(where('type', '==', filters.type));
      }
      notificationsQuery = query(notificationsQuery, ...constraints);
    }
    
    // Apply pagination
    if (pagination) {
        const constraints: QueryConstraint[] = [];
        if (pagination.orderByField) {
            constraints.push(orderBy(pagination.orderByField, pagination.orderDirection || 'asc'));
        }
        if (pagination.startAfterDoc) {
            constraints.push(startAfter(pagination.startAfterDoc));
        }
        constraints.push(limitQuery(pagination.limit || 10));
        notificationsQuery = query(notificationsQuery, ...constraints);
    }

    const querySnapshot = await getDocs(notificationsQuery);

    const notifications = querySnapshot.docs.map(doc => doc.data());

    const lastDoc = querySnapshot.docs[querySnapshot.docs.length - 1];
    const hasMore = (pagination?.limit || 0) <= notifications.length;
    
    return { data: { items: notifications, hasMore, lastDoc }, error: null };
  } catch (error) {
    console.error(`Error getting notifications for user ${userId}:`, error);
    return { data: null, error: { code: 'unknown', message: 'Failed to get user notifications' } };
  }
};

export const getUnreadNotificationCount = async (userId: string): Promise<ServiceResult<number>> => {
  try {
    const db = getSyncFirebaseDb();
    const notificationsCollection = collection(db, COLLECTIONS.NOTIFICATIONS);
    const q = query(
      notificationsCollection,
      where('userId', '==', userId),
      where('read', '==', false)
    );
    const snapshot = await getDocs(q);
    return { data: snapshot.size, error: null };
  } catch (error) {
    console.error('Error getting unread notification count:', error);
    return { data: null, error: { code: 'unknown', message: 'Failed to get unread count' } };
  }
};

export const bulkMarkNotificationsAsRead = async (
  userId: string,
  notificationIds: string[]
): Promise<ServiceResult<void>> => {
  try {
    const db = getSyncFirebaseDb();
    const batch = writeBatch(db);
    notificationIds.forEach(id => {
      const notificationRef = doc(db, COLLECTIONS.NOTIFICATIONS, id);
      batch.update(notificationRef, { read: true });
    });
    await batch.commit();
    return { data: null, error: null };
  } catch (error) {
    console.error('Error bulk marking notifications as read:', error);
    return { data: null, error: { code: 'unknown', message: 'Failed to bulk mark notifications' } };
  }
};

export const searchUsers = async (
  searchTerm: string,
  pagination?: PaginationOptions,
  filters?: UserFilters
): Promise<ServiceResult<PaginatedResult<User>>> => {
  try {
    const db = getSyncFirebaseDb();
    const usersCollection = collection(db, COLLECTIONS.USERS).withConverter(userConverter);
    let searchQuery: Query<User> = query(usersCollection, where('displayName', '>=', searchTerm), where('displayName', '<=', searchTerm + '\uf8ff'));

    // Apply filters...
    if (filters) {
      const constraints: QueryConstraint[] = [];
      if (filters.role) {
          constraints.push(where('role', '==', filters.role));
      }
      searchQuery = query(searchQuery, ...constraints);
    }
    
    const totalCountQuery = searchQuery;

    if (pagination?.orderByField) {
      searchQuery = query(searchQuery, orderBy(pagination.orderByField, pagination.orderDirection || 'asc'));
    } else {
      searchQuery = query(searchQuery, orderBy('displayName'));
    }

    if (pagination?.startAfterDoc) {
      searchQuery = query(searchQuery, startAfter(pagination.startAfterDoc));
    }
    
    const finalQuery = query(searchQuery, limitQuery(pagination?.limit || 10));

    const [querySnapshot, totalCountSnapshot] = await Promise.all([
      getDocs(finalQuery),
      getDocs(totalCountQuery)
    ]);

    const users = querySnapshot.docs.map(doc => doc.data());

    const lastDoc = querySnapshot.docs[querySnapshot.docs.length - 1];
    const hasMore = users.length === (pagination?.limit || 10);
    
    return { data: { items: users, hasMore, lastDoc, totalCount: totalCountSnapshot.size }, error: null };
  } catch (error) {
    console.error('Error searching users:', error);
    return { data: null, error: { code: 'unknown', message: 'Failed to search users' } };
  }
};

export const searchTrades = async (
  searchTerm: string,
  pagination?: PaginationOptions,
  filters?: TradeFilters
): Promise<ServiceResult<PaginatedResult<Trade>>> => {
  try {
    const db = getSyncFirebaseDb();
    const tradesCollection = collection(db, COLLECTIONS.TRADES).withConverter(tradeConverter);
    let searchQuery: Query<Trade> = query(tradesCollection, where('title', '>=', searchTerm), where('title', '<=', searchTerm + '\uf8ff'));

    // Apply filters...
    if (filters) {
      const constraints: QueryConstraint[] = [];
      if (filters.category) {
        constraints.push(where('category', '==', filters.category));
      }
      if (filters.status) {
        constraints.push(where('status', '==', filters.status));
      }
      if (filters.skills && filters.skills.length > 0) {
        const normalized = filters.skills.map(s => s.toLowerCase());
        constraints.push(where('skillsIndex', 'array-contains-any', normalized.slice(0, 10)));
      }
      searchQuery = query(searchQuery, ...constraints);
    }

    const totalCountQuery = searchQuery;

    if (pagination?.orderByField) {
      searchQuery = query(searchQuery, orderBy(pagination.orderByField, pagination.orderDirection || 'asc'));
    } else {
      searchQuery = query(searchQuery, orderBy('title'));
    }

    if (pagination?.startAfterDoc) {
      searchQuery = query(searchQuery, startAfter(pagination.startAfterDoc));
    }
    
    const finalQuery = query(searchQuery, limitQuery(pagination?.limit || 10));

    const [querySnapshot, totalCountSnapshot] = await Promise.all([
      getDocs(finalQuery),
      getDocs(totalCountQuery)
    ]);

    const trades = querySnapshot.docs.map(doc => doc.data());

    const lastDoc = querySnapshot.docs[querySnapshot.docs.length - 1];
    const hasMore = trades.length === (pagination?.limit || 10);
    
    return { data: { items: trades, hasMore, lastDoc, totalCount: totalCountSnapshot.size }, error: null };
  } catch (error) {
    console.error('Error searching trades:', error);
    return { data: null, error: { code: 'unknown', message: 'Failed to search trades' } };
  }
};
