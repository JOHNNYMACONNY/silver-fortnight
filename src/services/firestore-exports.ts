/**
 * Re-exports all functions from firestore services
 * This file consolidates exports from main firestore.ts and firestore-extensions.ts
 *
 * MIGRATION NOTICE: This file is being refactored to use the new service layer architecture.
 * Please use the new service classes for better separation of concerns and error handling:
 *
 * - UserService for user operations
 * - TradeService for trade operations
 * - CollaborationService for collaboration operations
 *
 * Import from: src/services/entities/[ServiceName]
 * Or use the service registry: src/services/core/ServiceRegistry
 */

// Legacy Firestore exports (deprecated - use service classes instead)
export {
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
  deleteDoc,
  updateDoc,
  startAfter,
} from 'firebase/firestore';

// New service layer exports (recommended)
export { UserService, userService } from './entities/UserService';
export { TradeService, tradeService } from './entities/TradeService';
export { CollaborationService, collaborationService } from './entities/CollaborationService';
export { BaseService } from './core/BaseService';
export {
  ServiceRegistry,
  serviceRegistry,
  getUserService,
  getTradeService,
  getCollaborationService,
  initializeServices,
  shutdownServices,
  getServiceHealth,
  getServiceMetrics
} from './core/ServiceRegistry';

export {
  COLLECTIONS,
  createNotification,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  createUserProfile,
  getUserProfile,
  getAllUsers,
  getAllUsersLegacy,
  deleteUser,
  updateUserRole,
  createTrade,
  getTrade,
  updateTrade,
  deleteTrade,
  getAllTrades,
  getAllTradesLegacy,
  getUserTrades,
  requestTradeCompletion,
  confirmTradeCompletion,
  requestTradeChanges,
  createCollaboration,
  getCollaboration,
  getCollaborations,
  getAllCollaborations,
  getAllCollaborationsLegacy,
  updateCollaboration,
  deleteCollaboration,
  createCollaborationApplication,
  getCollaborationApplications,
  updateCollaborationApplication,
  calculateAutoCompletionCountdown,
  calculateAutoCompletionDate,
  shouldAutoComplete,
  shouldSendReminder,
  createReview,
  getUserReviews,
  createTradeProposal,
  getTradeProposals,
  updateTradeProposalStatus,
  createConversation,
  createMessage,
  getUserNotifications,
  getUnreadNotificationCount,
  bulkMarkNotificationsAsRead,
  searchUsers,
  searchTrades,
} from './firestore';

export type {
  ServiceResult,
  PaginationOptions,
  CollaborationFilters,
  TradeFilters,
  UserFilters,
  NotificationFilters,
  PaginatedResult,
  User,
  SimpleCollaborationRole,
  SimpleCollaborationCard,
  UserChallengeProgress,
  ChallengeParticipant,
  ChallengeCriteria,
  ChallengeDeliverable,
  SoloChallengeConfig,
  TradeChallengeConfig,
  TradeMutualDeliverable,
  CollaborationChallengeConfig,
  SimplifiedTeamRole,
  ProjectPhase,
  Challenge,
  Collaboration,
  Connection,
  Notification,
  NotificationData,
  ChangeRequest,
  Trade,
  TradeSkill,
  TradeStatus,
  CollaborationApplication,
  Review,
  TradeProposal,
} from './firestore';

export {
    getConnections,
    getConnectionRequests,
    getSentConnectionRequests,
    updateConnectionStatus,
    removeConnection,
    createConnectionRequest,
    getChallenge,
    getSystemStats
} from './firestore-extensions';

export type {
    SystemStats
} from './firestore-extensions';