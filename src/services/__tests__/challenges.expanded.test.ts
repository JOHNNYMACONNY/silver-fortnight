import {
  createChallenge,
  joinChallenge,
  submitToChallenge,
  getChallenges,
  getActiveChallenges,
  getDailyChallenges,
  getWeeklyChallenges,
  getFeaturedDaily,
  getFeaturedWeekly,
  getUserActiveChallenges,
  getUserCompletedChallenges,
  getUserChallengeStats,
} from "../challenges";
import {
  Challenge,
  ChallengeSubmission,
  UserChallenge,
  ChallengeType,
  ChallengeCategory,
  ChallengeDifficulty,
  ChallengeStatus,
  UserChallengeStatus,
  ChallengeSortBy,
  RequirementType,
} from "../../types/gamification";
import * as FirestoreTypes from "firebase/firestore";

// Mock Firebase
jest.mock("../../firebase-config", () => ({
  getSyncFirebaseDb: jest.fn(() => ({})),
}));

jest.mock("../gamification", () => ({
  awardXPWithLeaderboardUpdate: jest.fn().mockResolvedValue({ success: true }),
}));

jest.mock("../threeTierProgression", () => ({
  updateProgressionOnChallengeCompletion: jest
    .fn()
    .mockResolvedValue({ success: true }),
}));

jest.mock("../streaks", () => ({
  markChallengeDay: jest.fn().mockResolvedValue({ success: true }),
}));

jest.mock("../skillXP", () => ({
  addSkillXP: jest.fn().mockResolvedValue({ success: true }),
}));

// Helper to create mock Timestamp
const createMockTimestamp = (
  seconds: number,
  nanoseconds: number = 0
): FirestoreTypes.Timestamp => {
  const date = new Date(seconds * 1000 + nanoseconds / 1000000);
  return {
    seconds,
    nanoseconds,
    toDate: () => date,
    toMillis: () => date.getTime(),
    isEqual: (other) =>
      other.seconds === seconds && other.nanoseconds === nanoseconds,
    valueOf: () => date.valueOf().toString(),
    toJSON: () => ({ seconds, nanoseconds }),
    toString: () => `Timestamp(seconds=${seconds}, nanoseconds=${nanoseconds})`,
  } as FirestoreTypes.Timestamp;
};

// Helper to create mock DocumentSnapshot
const createMockDocSnapshot = <T = FirestoreTypes.DocumentData>(
  id: string,
  data: T | undefined
): FirestoreTypes.DocumentSnapshot<T> => {
  const exists = data !== undefined;
  return {
    id,
    exists: () => exists,
    data: () => data,
    get: (fieldPath: string | FirestoreTypes.FieldPath) => {
      if (!data) return undefined;
      const path =
        typeof fieldPath === "string"
          ? fieldPath.split(".")
          : [fieldPath.toString()];
      let current: any = data;
      for (const segment of path) {
        if (current && typeof current === "object" && segment in current) {
          current = current[segment];
        } else {
          return undefined;
        }
      }
      return current;
    },
    ref: {} as FirestoreTypes.DocumentReference<T>,
  } as FirestoreTypes.DocumentSnapshot<T>;
};

// Helper to create mock QueryDocumentSnapshot
const createMockQueryDocSnapshot = <T = FirestoreTypes.DocumentData>(
  id: string,
  data: T
): FirestoreTypes.QueryDocumentSnapshot<T> => {
  return {
    id,
    exists: () => true,
    data: () => data,
    get: (fieldPath: string | FirestoreTypes.FieldPath) => {
      const path =
        typeof fieldPath === "string"
          ? fieldPath.split(".")
          : [fieldPath.toString()];
      let current: any = data;
      for (const segment of path) {
        if (current && typeof current === "object" && segment in current) {
          current = current[segment];
        } else {
          return undefined;
        }
      }
      return current;
    },
    ref: {} as FirestoreTypes.DocumentReference<T>,
  } as FirestoreTypes.QueryDocumentSnapshot<T>;
};

// Helper to create mock QuerySnapshot
const createMockQuerySnapshot = <T = FirestoreTypes.DocumentData>(
  docs: FirestoreTypes.QueryDocumentSnapshot<T>[]
): FirestoreTypes.QuerySnapshot<T> => {
  return {
    docs,
    size: docs.length,
    empty: docs.length === 0,
    forEach: (
      callback: (result: FirestoreTypes.QueryDocumentSnapshot<T>) => void
    ) => {
      docs.forEach(callback);
    },
    query: {} as FirestoreTypes.Query<T>,
  } as FirestoreTypes.QuerySnapshot<T>;
};

// Mock Firestore functions
jest.mock("firebase/firestore", () => ({
  doc: jest.fn(),
  collection: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  startAfter: jest.fn(),
  runTransaction: jest.fn(),
  writeBatch: jest.fn(),
  onSnapshot: jest.fn(),
  Timestamp: {
    now: jest.fn(() => createMockTimestamp(Math.floor(Date.now() / 1000))),
    fromDate: jest.fn((date: Date) =>
      createMockTimestamp(Math.floor(date.getTime() / 1000))
    ),
  },
}));

// Get mocked functions
const mockDoc = FirestoreTypes.doc as jest.MockedFunction<
  typeof FirestoreTypes.doc
>;
const mockCollection = FirestoreTypes.collection as jest.MockedFunction<
  typeof FirestoreTypes.collection
>;
const mockGetDoc = FirestoreTypes.getDoc as jest.MockedFunction<
  typeof FirestoreTypes.getDoc
>;
const mockGetDocs = FirestoreTypes.getDocs as jest.MockedFunction<
  typeof FirestoreTypes.getDocs
>;
const mockSetDoc = FirestoreTypes.setDoc as jest.MockedFunction<
  typeof FirestoreTypes.setDoc
>;
const mockUpdateDoc = FirestoreTypes.updateDoc as jest.MockedFunction<
  typeof FirestoreTypes.updateDoc
>;
const mockQuery = FirestoreTypes.query as jest.MockedFunction<
  typeof FirestoreTypes.query
>;
const mockWhere = FirestoreTypes.where as jest.MockedFunction<
  typeof FirestoreTypes.where
>;
const mockOrderBy = FirestoreTypes.orderBy as jest.MockedFunction<
  typeof FirestoreTypes.orderBy
>;
const mockLimit = FirestoreTypes.limit as jest.MockedFunction<
  typeof FirestoreTypes.limit
>;
const mockRunTransaction = FirestoreTypes.runTransaction as jest.MockedFunction<
  typeof FirestoreTypes.runTransaction
>;

// Mock data
const mockChallenge: Challenge = {
  id: "challenge-1",
  title: "React Component Challenge",
  description: "Build a reusable React component",
  type: ChallengeType.SKILL,
  category: ChallengeCategory.DEVELOPMENT,
  difficulty: ChallengeDifficulty.INTERMEDIATE,
  requirements: [
    {
      id: "req-1",
      type: RequirementType.SUBMISSION_COUNT,
      target: 1,
      description: "Submit working component",
    },
  ],
  rewards: {
    xp: 200,
    badges: ["component-builder"],
    unlockableFeatures: [],
  },
  startDate: createMockTimestamp(Math.floor(Date.now() / 1000) - 86400),
  endDate: createMockTimestamp(Math.floor(Date.now() / 1000) + 86400),
  status: ChallengeStatus.ACTIVE,
  participantCount: 5,
  completionCount: 2,
  instructions: [
    "Create a reusable component",
    "Add TypeScript support",
    "Include tests",
  ],
  objectives: ["Build component", "Write tests", "Document usage"],
  tags: ["react", "typescript", "components"],
  createdBy: "admin",
  createdAt: createMockTimestamp(Math.floor(Date.now() / 1000) - 172800),
  updatedAt: createMockTimestamp(Math.floor(Date.now() / 1000) - 86400),
};

const mockUserChallenge: UserChallenge = {
  id: "user-challenge-1",
  challengeId: "challenge-1",
  userId: "user-1",
  status: UserChallengeStatus.ACTIVE,
  progress: 50,
  maxProgress: 100,
  startedAt: createMockTimestamp(Math.floor(Date.now() / 1000) - 3600),
  lastActivityAt: createMockTimestamp(Math.floor(Date.now() / 1000) - 1800),
};

const mockSubmission: ChallengeSubmission = {
  id: "submission-1",
  userId: "user-1",
  challengeId: "challenge-1",
  title: "My React Component",
  description: "A reusable button component with TypeScript",
  evidenceUrls: ["https://github.com/user/component"],
  evidenceTypes: ["repository"],
  submittedAt: createMockTimestamp(Math.floor(Date.now() / 1000)),
  isPublic: true,
};

describe("Challenge Service - Expanded Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mocks
    mockDoc.mockReturnValue({ id: "mock-doc-id" } as any);
    mockCollection.mockReturnValue({} as any);
    mockQuery.mockReturnValue({} as any);
    mockWhere.mockReturnValue({} as any);
    mockOrderBy.mockReturnValue({} as any);
    mockLimit.mockReturnValue({} as any);
    mockSetDoc.mockResolvedValue(undefined);
    mockUpdateDoc.mockResolvedValue(undefined);
    mockGetDoc.mockResolvedValue(createMockDocSnapshot("default", undefined));
    mockGetDocs.mockResolvedValue(createMockQuerySnapshot([]));
  });

  describe("createChallenge", () => {
    it("should create a new challenge with all required fields", async () => {
      const challengeData = {
        title: "New Challenge",
        description: "Test challenge description",
        category: ChallengeCategory.DEVELOPMENT,
        difficulty: ChallengeDifficulty.BEGINNER,
        endDate: createMockTimestamp(Math.floor(Date.now() / 1000) + 86400),
        rewards: { xp: 100 },
      };

      const result = await createChallenge(challengeData);

      expect(result.success).toBe(true);
      expect(mockSetDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          title: "New Challenge",
          description: "Test challenge description",
          category: ChallengeCategory.DEVELOPMENT,
          difficulty: ChallengeDifficulty.BEGINNER,
          status: ChallengeStatus.DRAFT,
        })
      );
    });

    it("should handle missing optional fields with defaults", async () => {
      const challengeData = {
        title: "Minimal Challenge",
        category: ChallengeCategory.DESIGN,
        endDate: createMockTimestamp(Math.floor(Date.now() / 1000) + 86400),
      };

      const result = await createChallenge(challengeData);

      expect(result.success).toBe(true);
      expect(mockSetDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          title: "Minimal Challenge",
          description: "",
          type: ChallengeType.SKILL,
          difficulty: ChallengeDifficulty.BEGINNER,
          requirements: [],
          rewards: expect.objectContaining({ xp: expect.any(Number) }),
        })
      );
    });

    it("should handle creation errors gracefully", async () => {
      mockSetDoc.mockRejectedValue(new Error("Firestore error"));

      const challengeData = {
        title: "Error Challenge",
        category: ChallengeCategory.DEVELOPMENT,
        endDate: createMockTimestamp(Math.floor(Date.now() / 1000) + 86400),
      };

      const result = await createChallenge(challengeData);

      expect(result.success).toBe(false);
      expect(result.error).toContain("Failed to create challenge");
    });
  });

  describe("joinChallenge", () => {
    it("should successfully join an active challenge", async () => {
      const challengeSnapshot = createMockDocSnapshot(
        "challenge-1",
        mockChallenge
      );
      const userChallengeSnapshot = createMockDocSnapshot(
        "user-1_challenge-1",
        undefined
      );

      mockRunTransaction.mockImplementation(async (_, transactionFunction) => {
        const mockTx = {
          get: jest
            .fn()
            .mockResolvedValueOnce(challengeSnapshot)
            .mockResolvedValueOnce(userChallengeSnapshot),
          set: jest.fn(),
          update: jest.fn(),
        } as any;
        return await transactionFunction(mockTx);
      });

      const result = await joinChallenge("challenge-1", "user-1");

      expect(result.success).toBe(true);
      expect(mockRunTransaction).toHaveBeenCalled();
    });

    it("should prevent joining non-existent challenge", async () => {
      const challengeSnapshot = createMockDocSnapshot("challenge-1", undefined);

      mockRunTransaction.mockImplementation(async (_, transactionFunction) => {
        const mockTx = {
          get: jest.fn().mockResolvedValue(challengeSnapshot),
          set: jest.fn(),
          update: jest.fn(),
        } as any;

        try {
          return await transactionFunction(mockTx);
        } catch (error) {
          throw error;
        }
      });

      const result = await joinChallenge("non-existent", "user-1");

      expect(result.success).toBe(false);
      expect(result.error).toContain("Challenge not found");
    });

    it("should prevent joining already joined challenge", async () => {
      const challengeSnapshot = createMockDocSnapshot(
        "challenge-1",
        mockChallenge
      );
      const existingUserChallengeSnapshot = createMockDocSnapshot(
        "user-1_challenge-1",
        mockUserChallenge
      );

      mockRunTransaction.mockImplementation(async (_, transactionFunction) => {
        const mockTx = {
          get: jest
            .fn()
            .mockResolvedValueOnce(challengeSnapshot)
            .mockResolvedValueOnce(existingUserChallengeSnapshot),
          set: jest.fn(),
          update: jest.fn(),
        } as any;

        try {
          return await transactionFunction(mockTx);
        } catch (error) {
          throw error;
        }
      });

      const result = await joinChallenge("challenge-1", "user-1");

      expect(result.success).toBe(false);
      expect(result.error).toContain("already joined");
    });
  });

  describe("submitToChallenge", () => {
    it("should create a challenge submission successfully", async () => {
      const submissionData = {
        title: "My Solution",
        description: "Working implementation",
        evidenceUrls: ["https://github.com/user/solution"],
        evidenceTypes: ["repository"],
        isPublic: true,
      };

      const result = await submitToChallenge(
        "user-1",
        "challenge-1",
        submissionData
      );

      expect(result.success).toBe(true);
      expect(mockSetDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          userId: "user-1",
          challengeId: "challenge-1",
          title: "My Solution",
          description: "Working implementation",
          evidenceUrls: ["https://github.com/user/solution"],
          isPublic: true,
        })
      );
    });

    it("should handle submission with embedded evidence", async () => {
      const submissionData = {
        title: "Code Solution",
        description: "Implementation with code",
        embeddedEvidence: [
          {
            type: "code" as const,
            content: "const Button = () => <button>Click me</button>",
            language: "typescript",
          },
        ],
      };

      const result = await submitToChallenge(
        "user-1",
        "challenge-1",
        submissionData
      );

      expect(result.success).toBe(true);
      expect(mockSetDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          embeddedEvidence: expect.arrayContaining([
            expect.objectContaining({
              type: "code",
              content: expect.stringContaining("Button"),
              language: "typescript",
            }),
          ]),
        })
      );
    });

    it("should handle submission errors gracefully", async () => {
      mockSetDoc.mockRejectedValue(new Error("Submission failed"));

      const submissionData = {
        title: "Error Submission",
        description: "This will fail",
      };

      const result = await submitToChallenge(
        "user-1",
        "challenge-1",
        submissionData
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain("Failed to submit to challenge");
    });
  });
});
