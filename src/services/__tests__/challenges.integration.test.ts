import {
  createChallenge,
  joinChallenge,
  submitToChallenge,
  getUserChallenges,
  getRecommendedChallenges,
  completeChallenge,
  getUserChallengeStats,
} from "../challenges";
import { awardXPWithLeaderboardUpdate } from "../gamification";
import { updateProgressionOnChallengeCompletion } from "../threeTierProgression";
import { markChallengeDay } from "../streaks";
import { addSkillXP } from "../skillXP";
import {
  Challenge,
  UserChallenge,
  ChallengeSubmission,
  ChallengeType,
  ChallengeCategory,
  ChallengeDifficulty,
  ChallengeStatus,
  UserChallengeStatus,
  RequirementType,
} from "../../types/gamification";
import * as FirestoreTypes from "firebase/firestore";

// Mock Firebase and related services
jest.mock("../../firebase-config", () => ({
  getSyncFirebaseDb: jest.fn(() => ({})),
}));

jest.mock("../gamification", () => ({
  awardXPWithLeaderboardUpdate: jest.fn(),
}));

jest.mock("../threeTierProgression", () => ({
  updateProgressionOnChallengeCompletion: jest.fn(),
}));

jest.mock("../streaks", () => ({
  markChallengeDay: jest.fn(),
}));

jest.mock("../skillXP", () => ({
  addSkillXP: jest.fn(),
}));

// Mock Firestore functions
jest.mock("firebase/firestore", () => ({
  doc: jest.fn(),
  collection: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  runTransaction: jest.fn(),
  Timestamp: {
    now: jest.fn(() => ({
      seconds: Math.floor(Date.now() / 1000),
      nanoseconds: 0,
      toDate: () => new Date(),
      toMillis: () => Date.now(),
      isEqual: (other: any) => other.seconds === Math.floor(Date.now() / 1000),
      valueOf: () => String(Date.now()),
      toJSON: () => ({ seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 }),
    })),
    fromDate: jest.fn((date: Date) => ({
      seconds: Math.floor(date.getTime() / 1000),
      nanoseconds: 0,
      toDate: () => date,
      toMillis: () => date.getTime(),
      isEqual: (other: any) => other.seconds === Math.floor(date.getTime() / 1000),
      valueOf: () => String(date.getTime()),
      toJSON: () => ({ seconds: Math.floor(date.getTime() / 1000), nanoseconds: 0 }),
    })),
  },
}));

// Get mocked functions
const mockAwardXP = awardXPWithLeaderboardUpdate as jest.MockedFunction<
  typeof awardXPWithLeaderboardUpdate
>;
const mockUpdateProgression =
  updateProgressionOnChallengeCompletion as jest.MockedFunction<
    typeof updateProgressionOnChallengeCompletion
  >;
const mockMarkChallengeDay = markChallengeDay as jest.MockedFunction<
  typeof markChallengeDay
>;
const mockAddSkillXP = addSkillXP as jest.MockedFunction<typeof addSkillXP>;

const mockSetDoc = FirestoreTypes.setDoc as jest.MockedFunction<
  typeof FirestoreTypes.setDoc
>;
const mockGetDoc = FirestoreTypes.getDoc as jest.MockedFunction<
  typeof FirestoreTypes.getDoc
>;
const mockGetDocs = FirestoreTypes.getDocs as jest.MockedFunction<
  typeof FirestoreTypes.getDocs
>;
const mockUpdateDoc = FirestoreTypes.updateDoc as jest.MockedFunction<
  typeof FirestoreTypes.updateDoc
>;
const mockRunTransaction = FirestoreTypes.runTransaction as jest.MockedFunction<
  typeof FirestoreTypes.runTransaction
>;

describe("Challenge System Integration Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default successful responses
    mockAwardXP.mockResolvedValue({ success: true, newXP: 100, newLevel: 5 });
    mockUpdateProgression.mockResolvedValue({ success: true });
    mockMarkChallengeDay.mockResolvedValue({ success: true });
    mockAddSkillXP.mockResolvedValue({ success: true });

    mockSetDoc.mockResolvedValue(undefined);
    mockUpdateDoc.mockResolvedValue(undefined);
  });

  describe("Complete Challenge Lifecycle Integration", () => {
    it.skip("should handle complete challenge creation to completion flow", async () => {
      // Step 1: Create a challenge
      const challengeData = {
        title: "Integration Test Challenge",
        description: "A comprehensive test challenge",
        category: ChallengeCategory.DEVELOPMENT,
        difficulty: ChallengeDifficulty.INTERMEDIATE,
        createdBy: "test-admin-123", // Required field
        endDate: FirestoreTypes.Timestamp.fromDate(
          new Date(Date.now() + 86400000)
        ),
        rewards: { xp: 300 },
        requirements: [
          {
            id: "req-1",
            type: RequirementType.SUBMISSION_COUNT,
            target: 1,
            description: "Submit working solution",
          },
        ],
      };

      const createResult = await createChallenge(challengeData);
      expect(createResult.success).toBe(true);
      expect(mockSetDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          title: "Integration Test Challenge",
          category: ChallengeCategory.DEVELOPMENT,
          difficulty: ChallengeDifficulty.INTERMEDIATE,
        })
      );

      // Step 2: User joins the challenge
      const challengeId = "test-challenge-id";
      const userId = "test-user-id";

      // Mock challenge exists and user hasn't joined
      const mockChallenge: Challenge = {
        id: challengeId,
        title: "Integration Test Challenge",
        description: "A comprehensive test challenge",
        type: ChallengeType.SKILL,
        category: ChallengeCategory.DEVELOPMENT,
        difficulty: ChallengeDifficulty.INTERMEDIATE,
        requirements: challengeData.requirements!,
        rewards: { xp: 300 },
        startDate: FirestoreTypes.Timestamp.now(),
        endDate: challengeData.endDate!,
        status: ChallengeStatus.ACTIVE,
        participantCount: 0,
        completionCount: 0,
        instructions: [],
        objectives: [],
        tags: [],
        createdBy: "admin",
        createdAt: FirestoreTypes.Timestamp.now(),
        updatedAt: FirestoreTypes.Timestamp.now(),
      };

      mockRunTransaction.mockImplementation(async (_, transactionFunction) => {
        const mockTx = {
          get: jest
            .fn()
            .mockResolvedValueOnce({
              exists: () => true,
              data: () => mockChallenge,
            })
            .mockResolvedValueOnce({ exists: () => false }),
          set: jest.fn(),
          update: jest.fn(),
        } as any;
        return await transactionFunction(mockTx);
      });

      const joinResult = await joinChallenge(challengeId, userId);
      expect(joinResult.success).toBe(true);

      // Step 3: User submits to the challenge
      const submissionData = {
        title: "My Integration Solution",
        description: "Complete solution for the integration test",
        evidenceUrls: ["https://github.com/user/solution"],
        evidenceTypes: ["repository"],
        isPublic: true,
      };

      const submitResult = await submitToChallenge(
        userId,
        challengeId,
        submissionData
      );
      expect(submitResult.success).toBe(true);
      expect(mockSetDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          userId,
          challengeId,
          title: "My Integration Solution",
        })
      );

      // Step 4: Complete the challenge
      const userChallengeId = `${userId}_${challengeId}`;

      // Mock user challenge exists and is active
      const mockUserChallenge: UserChallenge = {
        id: userChallengeId,
        challengeId,
        userId,
        status: UserChallengeStatus.ACTIVE,
        progress: 100,
        maxProgress: 100,
        startedAt: FirestoreTypes.Timestamp.now(),
        lastActivityAt: FirestoreTypes.Timestamp.now(),
      };

      mockGetDoc
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => mockUserChallenge,
        })
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => mockChallenge,
        });

      const completeResult = await completeChallenge(userChallengeId);
      expect(completeResult.success).toBe(true);

      // Verify all integrations were called
      expect(mockUpdateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          status: UserChallengeStatus.COMPLETED,
        })
      );
      expect(mockAwardXP).toHaveBeenCalledWith(
        userId,
        300,
        "challenge_completion"
      );
      expect(mockUpdateProgression).toHaveBeenCalledWith(userId, challengeId);
      expect(mockMarkChallengeDay).toHaveBeenCalledWith(userId);
      expect(mockAddSkillXP).toHaveBeenCalledWith(
        userId,
        ChallengeCategory.DEVELOPMENT,
        300
      );
    });

    it.skip("should handle challenge completion with gamification integration failures gracefully", async () => {
      const userChallengeId = "user-challenge-1";
      const challengeId = "challenge-1";
      const userId = "user-1";

      // Mock user challenge and challenge data
      const mockUserChallenge: UserChallenge = {
        id: userChallengeId,
        challengeId,
        userId,
        status: UserChallengeStatus.ACTIVE,
        progress: 100,
        maxProgress: 100,
        startedAt: FirestoreTypes.Timestamp.now(),
        lastActivityAt: FirestoreTypes.Timestamp.now(),
      };

      const mockChallenge: Challenge = {
        id: challengeId,
        title: "Test Challenge",
        description: "Test description",
        type: ChallengeType.SKILL,
        category: ChallengeCategory.DEVELOPMENT,
        difficulty: ChallengeDifficulty.BEGINNER,
        requirements: [],
        rewards: { xp: 100 },
        startDate: FirestoreTypes.Timestamp.now(),
        endDate: FirestoreTypes.Timestamp.now(),
        status: ChallengeStatus.ACTIVE,
        participantCount: 1,
        completionCount: 0,
        instructions: [],
        objectives: [],
        tags: [],
        createdBy: "admin",
        createdAt: FirestoreTypes.Timestamp.now(),
        updatedAt: FirestoreTypes.Timestamp.now(),
      };

      mockGetDoc
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => mockUserChallenge,
        })
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => mockChallenge,
        });

      // Mock some gamification services to fail
      mockAwardXP.mockResolvedValue({
        success: false,
        error: "XP service unavailable",
      });
      mockUpdateProgression.mockResolvedValue({
        success: false,
        error: "Progression service error",
      });
      mockMarkChallengeDay.mockResolvedValue({ success: true }); // This one succeeds
      mockAddSkillXP.mockResolvedValue({
        success: false,
        error: "Skill XP service error",
      });

      const result = await completeChallenge(userChallengeId);

      // Challenge should still complete successfully even if some integrations fail
      expect(result.success).toBe(true);
      expect(mockUpdateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          status: UserChallengeStatus.COMPLETED,
        })
      );

      // Verify all services were attempted
      expect(mockAwardXP).toHaveBeenCalled();
      expect(mockUpdateProgression).toHaveBeenCalled();
      expect(mockMarkChallengeDay).toHaveBeenCalled();
      expect(mockAddSkillXP).toHaveBeenCalled();
    });
  });

  describe("Challenge Recommendation Integration", () => {
    it("should integrate with user profile and gamification data for recommendations", async () => {
      const userId = "test-user-id";

      // Mock user's active challenges
      const mockActiveUserChallenges = [
        {
          id: "uc-1",
          challengeId: "active-challenge-1",
          userId,
          status: UserChallengeStatus.ACTIVE,
          progress: 50,
          maxProgress: 100,
          startedAt: FirestoreTypes.Timestamp.now(),
          lastActivityAt: FirestoreTypes.Timestamp.now(),
        },
      ];

      // Mock available challenges
      const mockAvailableChallenges = [
        {
          id: "challenge-2",
          title: "Advanced React",
          description: "Advanced React patterns",
          type: ChallengeType.SKILL,
          category: ChallengeCategory.DEVELOPMENT,
          difficulty: ChallengeDifficulty.INTERMEDIATE,
          requirements: [],
          rewards: { xp: 200 },
          startDate: FirestoreTypes.Timestamp.now(),
          endDate: FirestoreTypes.Timestamp.fromDate(
            new Date(Date.now() + 86400000)
          ),
          status: ChallengeStatus.ACTIVE,
          participantCount: 5,
          completionCount: 2,
          instructions: [],
          objectives: [],
          tags: ["react", "advanced"],
          createdBy: "admin",
          createdAt: FirestoreTypes.Timestamp.now(),
          updatedAt: FirestoreTypes.Timestamp.now(),
        },
        {
          id: "challenge-3",
          title: "Vue.js Basics",
          description: "Learn Vue.js fundamentals",
          type: ChallengeType.SKILL,
          category: ChallengeCategory.DEVELOPMENT,
          difficulty: ChallengeDifficulty.BEGINNER,
          requirements: [],
          rewards: { xp: 150 },
          startDate: FirestoreTypes.Timestamp.now(),
          endDate: FirestoreTypes.Timestamp.fromDate(
            new Date(Date.now() + 86400000)
          ),
          status: ChallengeStatus.ACTIVE,
          participantCount: 10,
          completionCount: 8,
          instructions: [],
          objectives: [],
          tags: ["vue", "beginner"],
          createdBy: "admin",
          createdAt: FirestoreTypes.Timestamp.now(),
          updatedAt: FirestoreTypes.Timestamp.now(),
        },
      ];

      // Mock Firestore responses
      mockGetDocs
        .mockResolvedValueOnce({
          docs: mockActiveUserChallenges.map((uc) => ({
            id: uc.id,
            data: () => uc,
            exists: () => true,
          })),
          size: mockActiveUserChallenges.length,
          empty: false,
        } as any)
        .mockResolvedValueOnce({
          docs: mockAvailableChallenges.map((c) => ({
            id: c.id,
            data: () => ({ ...c, id: c.id }),
            exists: () => true,
          })),
          size: mockAvailableChallenges.length,
          empty: false,
        } as any);

      const result = await getRecommendedChallenges(userId);

      expect(result.success).toBe(true);
      expect(result.challenges).toBeDefined();

      // Should exclude active challenges
      const recommendedIds = result.challenges?.map((c) => c.id) || [];
      expect(recommendedIds).not.toContain("active-challenge-1");

      // Should include available challenges
      expect(recommendedIds).toContain("challenge-2");
      expect(recommendedIds).toContain("challenge-3");
    });
  });

  describe("Challenge Statistics Integration", () => {
    it.skip("should calculate comprehensive user statistics across all systems", async () => {
      const userId = "test-user-id";

      // Mock user challenge data with various statuses and completion times
      const mockUserChallenges = [
        {
          id: "uc-1",
          challengeId: "c-1",
          userId,
          status: UserChallengeStatus.COMPLETED,
          progress: 100,
          maxProgress: 100,
          startedAt: FirestoreTypes.Timestamp.fromDate(
            new Date(Date.now() - 7200000)
          ), // 2 hours ago
          lastActivityAt: FirestoreTypes.Timestamp.fromDate(
            new Date(Date.now() - 3600000)
          ), // 1 hour ago
          completionTimeMinutes: 60,
        },
        {
          id: "uc-2",
          challengeId: "c-2",
          userId,
          status: UserChallengeStatus.COMPLETED,
          progress: 100,
          maxProgress: 100,
          startedAt: FirestoreTypes.Timestamp.fromDate(
            new Date(Date.now() - 10800000)
          ), // 3 hours ago
          lastActivityAt: FirestoreTypes.Timestamp.fromDate(
            new Date(Date.now() - 7200000)
          ), // 2 hours ago
          completionTimeMinutes: 90,
        },
        {
          id: "uc-3",
          challengeId: "c-3",
          userId,
          status: UserChallengeStatus.ACTIVE,
          progress: 75,
          maxProgress: 100,
          startedAt: FirestoreTypes.Timestamp.fromDate(
            new Date(Date.now() - 1800000)
          ), // 30 minutes ago
          lastActivityAt: FirestoreTypes.Timestamp.fromDate(
            new Date(Date.now() - 900000)
          ), // 15 minutes ago
        },
        {
          id: "uc-4",
          challengeId: "c-4",
          userId,
          status: UserChallengeStatus.ABANDONED,
          progress: 25,
          maxProgress: 100,
          startedAt: FirestoreTypes.Timestamp.fromDate(
            new Date(Date.now() - 86400000)
          ), // 1 day ago
          lastActivityAt: FirestoreTypes.Timestamp.fromDate(
            new Date(Date.now() - 43200000)
          ), // 12 hours ago
        },
      ];

      mockGetDocs.mockResolvedValue({
        docs: mockUserChallenges.map((uc) => ({
          id: uc.id,
          data: () => ({ ...uc, id: uc.id }),
          exists: () => true,
        })),
        size: mockUserChallenges.length,
        empty: false,
      } as any);

      const stats = await getUserChallengeStats(userId);

      expect(stats.totalCompleted).toBe(2);
      expect(stats.totalActive).toBe(1);
      expect(stats.averageCompletionTime).toBe(75); // (60 + 90) / 2
      expect(stats.streakCount).toBeGreaterThanOrEqual(0);

      // Verify XP calculation
      expect(stats.totalXPEarned).toBeGreaterThan(0);
    });
  });

  describe("Error Handling and Resilience", () => {
    it.skip("should handle partial system failures gracefully", async () => {
      const userId = "test-user-id";
      const challengeId = "test-challenge-id";

      // Mock Firestore failure
      mockGetDocs.mockRejectedValue(new Error("Firestore connection error"));

      const result = await getUserChallenges(userId);

      expect(result.success).toBe(false);
      expect(result.error).toContain("Firestore connection error");
      expect(result.challenges).toBeUndefined();
    });

    it.skip("should maintain data consistency during concurrent operations", async () => {
      const challengeId = "concurrent-challenge";
      const userId1 = "user-1";
      const userId2 = "user-2";

      // Mock challenge data
      const mockChallenge: Challenge = {
        id: challengeId,
        title: "Concurrent Test Challenge",
        description: "Testing concurrent operations",
        type: ChallengeType.SKILL,
        category: ChallengeCategory.DEVELOPMENT,
        difficulty: ChallengeDifficulty.BEGINNER,
        requirements: [],
        rewards: { xp: 100 },
        startDate: FirestoreTypes.Timestamp.now(),
        endDate: FirestoreTypes.Timestamp.fromDate(
          new Date(Date.now() + 86400000)
        ),
        status: ChallengeStatus.ACTIVE,
        participantCount: 0,
        completionCount: 0,
        instructions: [],
        objectives: [],
        tags: [],
        createdBy: "admin",
        createdAt: FirestoreTypes.Timestamp.now(),
        updatedAt: FirestoreTypes.Timestamp.now(),
      };

      // Mock transaction for concurrent joins
      mockRunTransaction.mockImplementation(async (_, transactionFunction) => {
        const mockTx = {
          get: jest
            .fn()
            .mockResolvedValue({
              exists: () => true,
              data: () => mockChallenge,
            })
            .mockResolvedValue({ exists: () => false }),
          set: jest.fn(),
          update: jest.fn(),
        } as any;
        return await transactionFunction(mockTx);
      });

      // Simulate concurrent joins
      const joinPromises = [
        joinChallenge(challengeId, userId1),
        joinChallenge(challengeId, userId2),
      ];

      const results = await Promise.all(joinPromises);

      // Both should succeed due to transaction isolation
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(true);

      // Verify transactions were used for consistency
      expect(mockRunTransaction).toHaveBeenCalledTimes(2);
    });
  });
});
