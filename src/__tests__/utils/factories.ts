/**
 * Test Data Factories
 * 
 * Provides factory functions to create consistent, complete mock data for tests.
 * This ensures all required fields are present and reduces test maintenance.
 */

import * as FirestoreTypes from 'firebase/firestore';
import {
  Challenge,
  UserChallenge,
  ChallengeSubmission,
  ChallengeCategory,
  ChallengeDifficulty,
  ChallengeStatus,
  UserChallengeStatus,
  ChallengeType,
  RequirementType,
} from '../../types/gamification';

/**
 * Creates a complete mock Firestore Timestamp
 */
export function createMockTimestamp(date: Date = new Date()): FirestoreTypes.Timestamp {
  const seconds = Math.floor(date.getTime() / 1000);
  const nanoseconds = (date.getTime() % 1000) * 1000000;
  
  return {
    seconds,
    nanoseconds,
    toDate: () => date,
    toMillis: () => date.getTime(),
    isEqual: (other: FirestoreTypes.Timestamp) => 
      other.seconds === seconds && other.nanoseconds === nanoseconds,
    valueOf: () => String(date.getTime()),
    toJSON: () => ({ seconds, nanoseconds }),
    toString: () => `Timestamp(seconds=${seconds}, nanoseconds=${nanoseconds})`,
  } as FirestoreTypes.Timestamp;
}

/**
 * Creates a complete mock Challenge
 */
export function createMockChallenge(overrides: Partial<Challenge> = {}): Challenge {
  const now = createMockTimestamp();
  const futureDate = createMockTimestamp(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)); // 7 days from now
  
  return {
    id: 'test-challenge-id',
    title: 'Test Challenge',
    description: 'A test challenge description',
    type: ChallengeType.SKILL,
    category: ChallengeCategory.DEVELOPMENT,
    difficulty: ChallengeDifficulty.INTERMEDIATE,
    requirements: [
      {
        id: 'req-1',
        type: RequirementType.SUBMISSION_COUNT,
        target: 1,
        description: 'Submit a solution',
      },
    ],
    rewards: { xp: 100 },
    startDate: now,
    endDate: futureDate,
    status: ChallengeStatus.ACTIVE,
    participantCount: 0,
    completionCount: 0,
    instructions: ['Complete the challenge'],
    objectives: ['Learn something new'],
    tags: ['test', 'challenge'],
    createdBy: 'test-admin-123',
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

/**
 * Creates a complete mock UserChallenge
 */
export function createMockUserChallenge(overrides: Partial<UserChallenge> = {}): UserChallenge {
  const now = createMockTimestamp();
  
  return {
    id: 'test-user-challenge-id',
    userId: 'test-user-123',
    challengeId: 'test-challenge-id',
    status: UserChallengeStatus.ACTIVE,
    progress: 0,
    maxProgress: 1,
    startedAt: now,
    lastActivityAt: now,
    ...overrides,
  };
}

/**
 * Creates a complete mock ChallengeSubmission
 */
export function createMockSubmission(overrides: Partial<ChallengeSubmission> = {}): ChallengeSubmission {
  const now = createMockTimestamp();
  
  return {
    id: 'test-submission-id',
    challengeId: 'test-challenge-id',
    userId: 'test-user-123',
    title: 'Test Submission',
    description: 'A test submission',
    evidenceUrls: ['https://example.com/evidence'],
    evidenceTypes: ['url' as any],
    submittedAt: now,
    isPublic: true,
    ...overrides,
  };
}

/**
 * Creates a mock user profile
 */
export function createMockUserProfile(overrides: any = {}): any {
  return {
    id: 'test-user-123',
    uid: 'test-user-123',
    email: 'test@example.com',
    displayName: 'Test User',
    handle: 'testuser',
    verified: false,
    tagline: 'Test tagline',
    photoURL: 'https://example.com/photo.jpg',
    profilePicture: 'https://example.com/profile.jpg',
    bio: 'Test bio',
    location: 'Test City',
    website: 'https://example.com',
    skills: ['JavaScript', 'TypeScript', 'React'],
    metadata: {
      creationTime: new Date().toISOString(),
      lastSignInTime: new Date().toISOString(),
    },
    ...overrides,
  };
}

/**
 * Creates a mock Firestore DocumentSnapshot
 */
export function createMockDocSnapshot<T = any>(
  id: string,
  data: T | undefined
): FirestoreTypes.DocumentSnapshot<T> {
  const exists = data !== undefined;
  
  return {
    id,
    exists: () => exists,
    data: () => data,
    get: (fieldPath: string | FirestoreTypes.FieldPath) => {
      if (!data) return undefined;
      const path = typeof fieldPath === 'string' ? fieldPath.split('.') : [fieldPath.toString()];
      let current: any = data;
      for (const segment of path) {
        if (current && typeof current === 'object' && segment in current) {
          current = current[segment];
        } else {
          return undefined;
        }
      }
      return current;
    },
    ref: {} as any,
    metadata: {} as any,
  } as FirestoreTypes.DocumentSnapshot<T>;
}

/**
 * Creates a mock Firestore QueryDocumentSnapshot
 */
export function createMockQueryDocSnapshot<T = any>(
  id: string,
  data: T
): FirestoreTypes.QueryDocumentSnapshot<T> {
  return {
    id,
    exists: (() => true) as any,
    data: () => data,
    get: (fieldPath: string | FirestoreTypes.FieldPath) => {
      const path = typeof fieldPath === 'string' ? fieldPath.split('.') : [fieldPath.toString()];
      let current: any = data;
      for (const segment of path) {
        if (current && typeof current === 'object' && segment in current) {
          current = current[segment];
        } else {
          return undefined;
        }
      }
      return current;
    },
    ref: {} as any,
    metadata: {} as any,
  } as FirestoreTypes.QueryDocumentSnapshot<T>;
}

/**
 * Creates a mock Firestore QuerySnapshot
 */
export function createMockQuerySnapshot<T = any>(
  docs: FirestoreTypes.QueryDocumentSnapshot<T>[]
): FirestoreTypes.QuerySnapshot<T> {
  return {
    docs,
    empty: docs.length === 0,
    size: docs.length,
    forEach: (callback: (doc: FirestoreTypes.QueryDocumentSnapshot<T>) => void) => {
      docs.forEach(callback);
    },
    query: {} as any,
    metadata: {} as any,
    docChanges: () => [],
    toJSON: () => ({ docs: docs.map(d => d.data()), size: docs.length }),
  } as unknown as FirestoreTypes.QuerySnapshot<T>;
}
