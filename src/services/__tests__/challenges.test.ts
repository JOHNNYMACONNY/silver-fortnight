import {
  getUserChallenges, // Restored import
  startChallenge,
  updateChallengeProgress,
  getRecommendedChallenges,
  getChallengeStats,
  completeChallenge
} from '../challenges';
import { 
  UserChallengeStatus, 
  ChallengeType, 
  Challenge,
  UserChallenge,
  ChallengeCategory,
  ChallengeDifficulty,
  ChallengeStatus,
  RequirementType
} from '../../types/gamification';
import * as FirestoreTypes from 'firebase/firestore';

// Helper to create a mock Timestamp object
const createMockTimestamp = (seconds: number, nanoseconds: number = 0): FirestoreTypes.Timestamp => {
  const date = new Date(seconds * 1000 + nanoseconds / 1000000);
  return {
    seconds,
    nanoseconds,
    toDate: () => date,
    toMillis: () => date.getTime(),
    isEqual: (other) => other.seconds === seconds && other.nanoseconds === nanoseconds,
    valueOf: () => date.valueOf().toString(),
    toJSON: () => ({ seconds, nanoseconds }),
    toString: () => `Timestamp(seconds=${seconds}, nanoseconds=${nanoseconds})`,
  } as FirestoreTypes.Timestamp;
};

// Helper to create a mock DocumentSnapshot (can be for docs that might not exist)
const createMockDocSnapshot = <T = FirestoreTypes.DocumentData>(id: string, data: T | undefined): FirestoreTypes.DocumentSnapshot<T> => {
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
    ref: createMockDocumentReference(id, `mockCollection/${id}`),
  } as FirestoreTypes.DocumentSnapshot<T>;
};

// Helper to create a mock QueryDocumentSnapshot (for docs that are part of a query result - data always exists)
const createMockQueryDocSnapshot = <T = FirestoreTypes.DocumentData>(id: string, data: T): FirestoreTypes.QueryDocumentSnapshot<T> => {
  return {
    id,
    exists: () => true, 
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
    ref: createMockDocumentReference(id, `mockCollection/${id}`),
  } as FirestoreTypes.QueryDocumentSnapshot<T>;
};

// Helper to create a mock QuerySnapshot
const createMockQuerySnapshot = <T extends FirestoreTypes.DocumentData = FirestoreTypes.DocumentData>(docs: FirestoreTypes.QueryDocumentSnapshot<T>[]): FirestoreTypes.QuerySnapshot<T> => {
  return {
    docs,
    empty: docs.length === 0,
    size: docs.length,
    forEach: (callback: (result: FirestoreTypes.QueryDocumentSnapshot<T>) => void, thisArg?: any) => {
      docs.forEach(callback, thisArg);
    },
    docChanges: () => [], 
    query: createMockQuery<T, T>(docs.length > 0 ? docs[0].ref.firestore : undefined), // Pass firestore instance if available, or undefined
  } as FirestoreTypes.QuerySnapshot<T>;
};

// Helper for DocumentReference
const createMockDocumentReference = <AppModelType extends FirestoreTypes.DocumentData = FirestoreTypes.DocumentData, DbModelType extends FirestoreTypes.DocumentData = AppModelType>(
  id: string,
  path: string,
  firestoreInstance: FirestoreTypes.Firestore = {} as FirestoreTypes.Firestore
): FirestoreTypes.DocumentReference<AppModelType, DbModelType> => {
  const collPath = path.substring(0, path.lastIndexOf('/'));
  const parentId = collPath.substring(collPath.lastIndexOf('/') + 1);
  const ref = {
    id,
    path,
    firestore: firestoreInstance,
    parent: {
      id: parentId, 
      path: collPath, 
      withConverter: jest.fn().mockReturnThis(),
      parent: null, 
      doc: jest.fn(), 
      where: jest.fn(),
      orderBy: jest.fn(),
      limit: jest.fn(),
      firestore: firestoreInstance,
    } as FirestoreTypes.CollectionReference<FirestoreTypes.DocumentData, FirestoreTypes.DocumentData>, // Explicitly provide both type args for parent
    withConverter: jest.fn(<NewAppModel extends FirestoreTypes.DocumentData, NewDbModel extends FirestoreTypes.DocumentData, _NewTransformedAppModel = NewAppModel>(
      _converter: FirestoreTypes.FirestoreDataConverter<NewAppModel, NewDbModel, _NewTransformedAppModel>
    ) => {
      // This mock should ideally store and use the converter.
      // For now, it returns the same ref cast to the new types.
      return ref as unknown as FirestoreTypes.DocumentReference<NewAppModel, NewDbModel>;
    }),
  } as FirestoreTypes.DocumentReference<AppModelType, DbModelType>; 
  return ref;
};

// Helper for CollectionReference (which extends Query)
const createMockCollectionReference = <AppModelType extends FirestoreTypes.DocumentData = FirestoreTypes.DocumentData, DbModelType extends FirestoreTypes.DocumentData = AppModelType>(
  id: string,
  path: string,
  firestoreInstance: FirestoreTypes.Firestore = {} as FirestoreTypes.Firestore
): FirestoreTypes.CollectionReference<AppModelType, DbModelType> => {
  const ref = {
    id,
    path,
    firestore: firestoreInstance,
    parent: path.includes('/') ? createMockDocumentReference(path.substring(0, path.lastIndexOf('/')), path.substring(0, path.lastIndexOf('/')), firestoreInstance) : null, // Uses defaults for AppModelType, DbModelType
    withConverter: jest.fn(<NewAppModel extends FirestoreTypes.DocumentData, NewDbModel extends FirestoreTypes.DocumentData, _NewTransformedAppModel = NewAppModel>(
      _converter: FirestoreTypes.FirestoreDataConverter<NewAppModel, NewDbModel, _NewTransformedAppModel>
    ) => {
      return ref as unknown as FirestoreTypes.CollectionReference<NewAppModel, NewDbModel>;
    }),
    doc: jest.fn((docPath?: string) => {
      const newDocId = docPath || 'generated-doc-id-' + Math.random().toString(36).substring(7);
      return createMockDocumentReference<FirestoreTypes.DocumentData, FirestoreTypes.DocumentData>(newDocId, `${path}/${newDocId}`, firestoreInstance); // Explicitly provide both
    }),
    where: jest.fn(() => createMockQuery<AppModelType, DbModelType>(firestoreInstance)),
    orderBy: jest.fn(() => createMockQuery<AppModelType, DbModelType>(firestoreInstance)),
    limit: jest.fn(() => createMockQuery<AppModelType, DbModelType>(firestoreInstance)),
    startAfter: jest.fn(() => createMockQuery<AppModelType, DbModelType>(firestoreInstance)),
  } as FirestoreTypes.CollectionReference<AppModelType, DbModelType>;
  return ref;
};

// Helper for Query
const createMockQuery = <AppModelType extends FirestoreTypes.DocumentData = FirestoreTypes.DocumentData, DbModelType extends FirestoreTypes.DocumentData = AppModelType>(
  firestoreInstance: FirestoreTypes.Firestore = {} as FirestoreTypes.Firestore
): FirestoreTypes.Query<AppModelType, DbModelType> => {
  const queryObj = {
    firestore: firestoreInstance,
    withConverter: jest.fn(<NewAppModel extends FirestoreTypes.DocumentData, NewDbModel extends FirestoreTypes.DocumentData, _NewTransformedAppModel = NewAppModel>(
      _converter: FirestoreTypes.FirestoreDataConverter<NewAppModel, NewDbModel, _NewTransformedAppModel>
    ) => {
      return queryObj as unknown as FirestoreTypes.Query<NewAppModel, NewDbModel>;
    }),
    where: jest.fn(() => queryObj as FirestoreTypes.Query<AppModelType, DbModelType>), // Ensure correct type propagation
    orderBy: jest.fn(() => queryObj as FirestoreTypes.Query<AppModelType, DbModelType>),
    limit: jest.fn(() => queryObj as FirestoreTypes.Query<AppModelType, DbModelType>),
    startAfter: jest.fn(() => queryObj as FirestoreTypes.Query<AppModelType, DbModelType>),
  } as FirestoreTypes.Query<AppModelType, DbModelType>;
  return queryObj;
};

// Helper to create a mock Transaction object
const createMockTransaction = (): jest.Mocked<FirestoreTypes.Transaction> => {
  const mockTx = {
    get: jest.fn() as jest.MockedFunction<(<U>(documentRef: FirestoreTypes.DocumentReference<U>) => Promise<FirestoreTypes.DocumentSnapshot<U>>)>, 
    set: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
  } as jest.Mocked<FirestoreTypes.Transaction>; // Cast to the full mocked type
  return mockTx;
};

// Helper to create a mock WriteBatch object
const createMockWriteBatch = (): jest.Mocked<FirestoreTypes.WriteBatch> => {
  const batch = {
    set: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    commit: jest.fn().mockResolvedValue(undefined),
  } as jest.Mocked<FirestoreTypes.WriteBatch>; // Cast to the full mocked type
  return batch;
};


// Mock firebase-config
jest.mock('../../firebase-config', () => ({
  db: {} // Mock db object - actual functions are mocked below
}));

// Mock gamification service
jest.mock('../gamification', () => ({
  awardXP: jest.fn().mockResolvedValue({ success: true })
}));

// Mock firebase/firestore functions with proper v9 implementations
jest.mock('firebase/firestore', () => ({
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
  Timestamp: {
    now: jest.fn(() => createMockTimestamp(Math.floor(Date.now() / 1000))),
    fromDate: jest.fn((date: Date) => createMockTimestamp(Math.floor(date.getTime() / 1000)))
  }
}));

// Import and cast the mocked functions
// No need to import * as firestore again, use FirestoreTypes for types
const mockDoc = FirestoreTypes.doc as jest.MockedFunction<typeof FirestoreTypes.doc>;
const mockCollection = FirestoreTypes.collection as jest.MockedFunction<typeof FirestoreTypes.collection>;
const mockGetDoc = FirestoreTypes.getDoc as jest.MockedFunction<typeof FirestoreTypes.getDoc>;
const mockGetDocs = FirestoreTypes.getDocs as jest.MockedFunction<typeof FirestoreTypes.getDocs>;
const mockSetDoc = FirestoreTypes.setDoc as jest.MockedFunction<typeof FirestoreTypes.setDoc>; // Keep for now
const mockUpdateDoc = FirestoreTypes.updateDoc as jest.MockedFunction<typeof FirestoreTypes.updateDoc>;
const mockQuery = FirestoreTypes.query as jest.MockedFunction<typeof FirestoreTypes.query>;
const mockWhere = FirestoreTypes.where as jest.MockedFunction<typeof FirestoreTypes.where>; // Keep for now
const mockOrderBy = FirestoreTypes.orderBy as jest.MockedFunction<typeof FirestoreTypes.orderBy>; // Keep for now
const mockLimit = FirestoreTypes.limit as jest.MockedFunction<typeof FirestoreTypes.limit>; // Keep for now
const mockRunTransaction = FirestoreTypes.runTransaction as jest.MockedFunction<typeof FirestoreTypes.runTransaction>;
const mockWriteBatch = FirestoreTypes.writeBatch as jest.MockedFunction<typeof FirestoreTypes.writeBatch>; // Keep for now

// Mock notifications service
jest.mock('../notifications', () => ({
  createNotification: jest.fn()
}));

// Mock gamification service
jest.mock('../gamification', () => ({
  awardXP: jest.fn()
}));

const mockChallenge: Challenge = {
  id: 'challenge-1',
  title: 'First Trade',
  description: 'Complete your first trade',
  type: ChallengeType.SKILL,
  category: ChallengeCategory.TRADING,
  difficulty: ChallengeDifficulty.BEGINNER,
  requirements: [
    {
      id: 'req-1',
      type: RequirementType.SUBMISSION_COUNT,
      target: 1,
      description: 'Complete first trade'
    }
  ],
  rewards: {
    xp: 100,
    badges: ['first-trader'],
    unlockableFeatures: []
  },
  startDate: createMockTimestamp(1234567890, 0),
  endDate: createMockTimestamp(1234567890, 0),
  status: ChallengeStatus.ACTIVE,
  participantCount: 0,
  completionCount: 0,
  instructions: ['Complete your first trade'],
  objectives: ['Trade with another user'],
  tags: ['trading', 'beginner'],
  createdBy: 'system',
  createdAt: createMockTimestamp(1234567890, 0),
  updatedAt: createMockTimestamp(1234567890, 0)
};

const mockUserChallenge: UserChallenge = {
  id: 'user-challenge-1',
  challengeId: 'challenge-1',
  userId: 'user-1',
  status: UserChallengeStatus.ACTIVE,
  progress: 50,
  maxProgress: 100,
  startedAt: createMockTimestamp(1234567890, 0),
  lastActivityAt: createMockTimestamp(1234567890, 0)
};

describe('Challenge Service', () => {
  const mockFirestoreDb = {} as FirestoreTypes.Firestore; 

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockDoc.mockImplementation(<AppModelType extends FirestoreTypes.DocumentData, DbModelType extends FirestoreTypes.DocumentData = AppModelType, _TransformedAppModelType = AppModelType>(
      _dbOrRef: FirestoreTypes.Firestore | FirestoreTypes.DocumentReference<any, any> | FirestoreTypes.CollectionReference<any, any>, 
      path: string, 
      ...pathSegments: string[]
    ): FirestoreTypes.DocumentReference<AppModelType, DbModelType> => {
      const id = pathSegments.length > 0 ? pathSegments[pathSegments.length - 1] : (path.includes('/') ? path.substring(path.lastIndexOf('/') + 1) : 'defaultDocId');
      const fullPath = [path, ...pathSegments].join('/');
      return createMockDocumentReference<AppModelType, DbModelType>(id, fullPath, mockFirestoreDb);
    });

    mockCollection.mockImplementation(<AppModelType extends FirestoreTypes.DocumentData, DbModelType extends FirestoreTypes.DocumentData = AppModelType, _TransformedAppModelType = AppModelType>(
      _dbOrRef: FirestoreTypes.Firestore | FirestoreTypes.DocumentReference<any, any> | FirestoreTypes.CollectionReference<any, any>, 
      path: string, 
      ...pathSegments: string[]
      ): FirestoreTypes.CollectionReference<AppModelType, DbModelType> => {
      const id = pathSegments.length > 0 ? pathSegments[pathSegments.length - 1] : path;
      const fullPath = [path, ...pathSegments].join('/');
      return createMockCollectionReference<AppModelType, DbModelType>(id, fullPath, mockFirestoreDb);
    });

    mockQuery.mockImplementation(<AppModelType extends FirestoreTypes.DocumentData, DbModelType extends FirestoreTypes.DocumentData = AppModelType, _TransformedAppModelType = AppModelType>(
      queryable: FirestoreTypes.Query<AppModelType, DbModelType>, 
      ..._queryConstraints: FirestoreTypes.QueryConstraint[]
      ): FirestoreTypes.Query<AppModelType, DbModelType> => {
      const baseQuery = queryable;
      const newQueryInstance = createMockQuery<AppModelType, DbModelType>(mockFirestoreDb);

      const converterFromBase = (baseQuery as any).converter as FirestoreTypes.FirestoreDataConverter<AppModelType, DbModelType, _TransformedAppModelType> | undefined;

      if (converterFromBase && typeof newQueryInstance.withConverter === 'function') {
        return newQueryInstance.withConverter(converterFromBase);
      }
      return newQueryInstance;
    });

    mockWhere.mockReturnValue({} as FirestoreTypes.QueryFieldFilterConstraint);
    mockOrderBy.mockReturnValue({} as FirestoreTypes.QueryOrderByConstraint);
    mockLimit.mockReturnValue({} as FirestoreTypes.QueryLimitConstraint);
    
    mockGetDocs.mockResolvedValue(createMockQuerySnapshot([])); 
    mockGetDoc.mockResolvedValue(createMockDocSnapshot('default-id', undefined)); 

    mockSetDoc.mockResolvedValue(undefined); 
    mockUpdateDoc.mockResolvedValue(undefined); 
    mockRunTransaction.mockImplementation(async (_db, callback) => {
      const mockTx = createMockTransaction();
      // Provide a default implementation for transaction.get if not overridden by specific tests
      mockTx.get.mockResolvedValue(createMockDocSnapshot('default-tx-doc', undefined));
      return callback(mockTx);
    });
    mockWriteBatch.mockReturnValue(createMockWriteBatch());
  });

  describe('getUserChallenges', () => {
    it('should fetch user challenges with proper sorting', async () => {
      const mockUserChallengeData = { ...mockUserChallenge, id: 'user-challenge-1' };
      const mockChallengeData = { ...mockChallenge, id: 'challenge-1' };

      const userChallengeDocs = [
        createMockQueryDocSnapshot<UserChallenge>('user-challenge-1', mockUserChallengeData)
      ];
      const querySnapshot = createMockQuerySnapshot<UserChallenge>(userChallengeDocs);
      const challengeDocSnapshot = createMockDocSnapshot<Challenge>('challenge-1', mockChallengeData);

      // mockQuery is called internally by getDocs, so we mock getDocs's return value.
      // If specific query constraints passed to mockQuery need to be asserted,
      // then mockQuery itself would need to return a mock that records those constraints.
      mockGetDocs.mockResolvedValue(querySnapshot);
      mockGetDoc.mockResolvedValue(challengeDocSnapshot);

      const result = await getUserChallenges('user-1');

      expect(mockCollection).toHaveBeenCalledWith(expect.anything(), 'userChallenges'); // db is mocked as {}
      expect(mockWhere).toHaveBeenCalledWith('userId', '==', 'user-1');
      // expect(mockOrderBy).toHaveBeenCalledWith('lastActivityAt', 'desc'); // This is called inside getUserChallenges
      expect(mockGetDocs).toHaveBeenCalled(); // This is the key call for this path
      expect(result.success).toBe(true);
      expect(result.challenges).toHaveLength(1);
      // Add more specific assertions about the content of result.challenges if necessary
    });

    it('should handle empty results', async () => {
      const querySnapshot = createMockQuerySnapshot<UserChallenge>([]);
      mockGetDocs.mockResolvedValue(querySnapshot);

      const result = await getUserChallenges('user-1');

      expect(result.success).toBe(true);
      expect(result.challenges).toEqual([]);
    });

    it('should filter by challenge status', async () => {
      const completedUserChallengeData = {
        ...mockUserChallenge,
        id: 'user-challenge-1',
        status: UserChallengeStatus.COMPLETED
      };
      const mockChallengeData = { ...mockChallenge, id: 'challenge-1' };

      const userChallengeDocs = [
        createMockQueryDocSnapshot<UserChallenge>('user-challenge-1', completedUserChallengeData)
      ];
      const querySnapshot = createMockQuerySnapshot<UserChallenge>(userChallengeDocs);
      const challengeDocSnapshot = createMockDocSnapshot<Challenge>('challenge-1', mockChallengeData);
      
      mockGetDocs.mockResolvedValue(querySnapshot);
      mockGetDoc.mockResolvedValue(challengeDocSnapshot);

      const result = await getUserChallenges('user-1', [UserChallengeStatus.COMPLETED]);

      expect(mockWhere).toHaveBeenCalledWith('status', 'in', [UserChallengeStatus.COMPLETED]);
      expect(result.success).toBe(true);
      // Further assertions on the result if needed
    });
  });

  describe('startChallenge', () => {
    it('should start a new challenge successfully', async () => {
      const challengeDocSnapshot = createMockDocSnapshot<Challenge>('challenge-1', mockChallenge);
      const userChallengeNonExistentSnapshot = createMockDocSnapshot<UserChallenge>('user-1_challenge-1', undefined);

      mockRunTransaction.mockImplementation(async (_, transactionFunction) => {
        const mockTx = createMockTransaction();
        mockTx.get
          .mockResolvedValueOnce(challengeDocSnapshot) 
          .mockResolvedValueOnce(userChallengeNonExistentSnapshot); 
        return await transactionFunction(mockTx);
      });

      const result = await startChallenge('user-1', 'challenge-1');

      expect(result.success).toBe(true);
      expect(mockRunTransaction).toHaveBeenCalled();
      // You might want to assert that transaction.set and transaction.update were called with correct args
      // This requires accessing the mockTransaction instance used by the implementation.
      // For example, if mockTx.set was called: expect(mockTx.set).toHaveBeenCalledWith(...);
    });

    it('should handle non-existent challenge', async () => {
      const challengeNonExistentSnapshot = createMockDocSnapshot<Challenge>('non-existent-challenge', undefined);

      mockRunTransaction.mockImplementation(async (_, transactionFunction) => {
        const mockTx = createMockTransaction();
        mockTx.get.mockResolvedValue(challengeNonExistentSnapshot);
        
        try {
          return await transactionFunction(mockTx);
        } catch (error) {
          // Error is expected and handled by the SUT
          throw error;
        }
      });

      const result = await startChallenge('user-1', 'non-existent-challenge');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Challenge not found');
    });

    it('should handle already active challenge', async () => {
      const challengeDocSnapshot = createMockDocSnapshot<Challenge>('challenge-1', mockChallenge);
      const existingUserChallengeSnapshot = createMockDocSnapshot<UserChallenge>('user-1_challenge-1', mockUserChallenge);
      
      mockRunTransaction.mockImplementation(async (_, transactionFunction) => {
        const mockTx = createMockTransaction();
        mockTx.get
          .mockResolvedValueOnce(challengeDocSnapshot) 
          .mockResolvedValueOnce(existingUserChallengeSnapshot); 
        
        try {
          return await transactionFunction(mockTx);
        } catch (error) {
          throw error;
        }
      });

      const result = await startChallenge('user-1', 'challenge-1');

      expect(result.success).toBe(false);
      expect(result.error).toContain('already joined');
    });
  });

  describe('updateChallengeProgress', () => {
    it('should update challenge progress correctly', async () => {
      const userChallengeSnapshot = createMockDocSnapshot<UserChallenge>('user-1_challenge-1', mockUserChallenge);

      mockRunTransaction.mockImplementation(async (_, transactionFunction) => {
        const mockTx = createMockTransaction();
        mockTx.get.mockResolvedValue(userChallengeSnapshot);
        return await transactionFunction(mockTx);
      });

      const result = await updateChallengeProgress('user-1', 'challenge-1', 1);

      expect(result.success).toBe(true);
      expect(mockRunTransaction).toHaveBeenCalled();
      // Assert on transaction.set if needed
    });

    it('should handle non-existent user challenge', async () => {
      const userChallengeNonExistentSnapshot = createMockDocSnapshot<UserChallenge>('user-1_non-existent-challenge', undefined);

      mockRunTransaction.mockImplementation(async (_, transactionFunction) => {
        const mockTx = createMockTransaction();
        mockTx.get.mockResolvedValue(userChallengeNonExistentSnapshot);
        
        try {
          return await transactionFunction(mockTx);
        } catch (error) {
          throw error;
        }
      });

      const result = await updateChallengeProgress('user-1', 'non-existent-challenge', 1);

      expect(result.success).toBe(false);
      expect(result.error).toContain('User challenge not found');
    });
  });

  describe('getRecommendedChallenges', () => {
    it('should return recommended challenges based on user level', async () => {
      const challenge1Data = { ...mockChallenge, id: 'challenge-1' };
      const challenge2Data = { ...mockChallenge, id: 'challenge-2', difficulty: ChallengeDifficulty.INTERMEDIATE };
      
      const challengeDocs = [
        createMockQueryDocSnapshot<Challenge>('challenge-1', challenge1Data), // Use QueryDocSnapshot
        createMockQueryDocSnapshot<Challenge>('challenge-2', challenge2Data)  // Use QueryDocSnapshot
      ];
      const querySnapshot = createMockQuerySnapshot<Challenge>(challengeDocs);

      mockGetDocs.mockResolvedValue(querySnapshot);

      const result = await getRecommendedChallenges('user-1');

      expect(result.success).toBe(true);
      expect(result.challenges).toHaveLength(2);
    });

    it('should exclude already active challenges', async () => {
      const activeUserChallengeData = { ...mockUserChallenge, challengeId: 'challenge-1' };
      const activeChallengeDocs = [
        createMockQueryDocSnapshot<UserChallenge>('uc-1', activeUserChallengeData) // Use QueryDocSnapshot
      ];
      const activeChallengesSnapshot = createMockQuerySnapshot<UserChallenge>(activeChallengeDocs);

      const allChallenge1Data = { ...mockChallenge, id: 'challenge-1' };
      const allChallenge2Data = { ...mockChallenge, id: 'challenge-2' };
      const allChallengeDocs = [
        createMockQueryDocSnapshot<Challenge>('challenge-1', allChallenge1Data), // Use QueryDocSnapshot
        createMockQueryDocSnapshot<Challenge>('challenge-2', allChallenge2Data)  // Use QueryDocSnapshot
      ];
      const allChallengesSnapshot = createMockQuerySnapshot<Challenge>(allChallengeDocs);

      mockGetDocs
        .mockResolvedValueOnce(activeChallengesSnapshot) 
        .mockResolvedValueOnce(allChallengesSnapshot); 

      const result = await getRecommendedChallenges('user-1');

      expect(result.success).toBe(true);
      // Should filter out challenge-1 since it's already active
      expect(result.challenges?.every(c => c.id !== 'challenge-1')).toBe(true);
    });
  });

  describe('getChallengeStats', () => {
    it('should calculate user challenge statistics correctly', async () => {
      const mockTimestamp = createMockTimestamp(Math.floor(Date.now() / 1000));

      const userChallenge1Data = { ...mockUserChallenge, id: 'uc1', status: UserChallengeStatus.COMPLETED, completionTimeMinutes: 60, lastActivityAt: mockTimestamp };
      const userChallenge2Data = { ...mockUserChallenge, id: 'uc2', status: UserChallengeStatus.COMPLETED, completionTimeMinutes: 45, lastActivityAt: mockTimestamp };
      const userChallenge3Data = { ...mockUserChallenge, id: 'uc3', status: UserChallengeStatus.ACTIVE, lastActivityAt: mockTimestamp };
      const userChallenge4Data = { ...mockUserChallenge, id: 'uc4', status: UserChallengeStatus.ABANDONED, lastActivityAt: mockTimestamp };
      
      const userChallengeDocs = [
        createMockQueryDocSnapshot<UserChallenge>('uc1', userChallenge1Data), // Use QueryDocSnapshot
        createMockQueryDocSnapshot<UserChallenge>('uc2', userChallenge2Data), // Use QueryDocSnapshot
        createMockQueryDocSnapshot<UserChallenge>('uc3', userChallenge3Data), // Use QueryDocSnapshot
        createMockQueryDocSnapshot<UserChallenge>('uc4', userChallenge4Data), // Use QueryDocSnapshot
      ];
      const querySnapshot = createMockQuerySnapshot<UserChallenge>(userChallengeDocs);
      
      mockGetDocs.mockResolvedValue(querySnapshot);

      const result = await getChallengeStats('user-1');

      console.log('Test result:', JSON.stringify(result, null, 2));
      console.log('Mock data check:', userChallengeDocs.map(doc => doc.data()));

      expect(result.totalCompleted).toBe(2);
      expect(result.totalActive).toBe(1);
      expect(result.streakCount).toBeGreaterThanOrEqual(0);
    });

    it('should handle user with no challenges', async () => {
      const querySnapshot = createMockQuerySnapshot<UserChallenge>([]);
      mockGetDocs.mockResolvedValue(querySnapshot);

      const result = await getChallengeStats('user-1');

      expect(result.totalCompleted).toBe(0);
      expect(result.totalActive).toBe(0);
      expect(result.streakCount).toBe(0);
    });
  });

  describe('completeChallenge', () => {
    it('should complete challenge and award rewards', async () => {
      const userChallengeData = { 
        ...mockUserChallenge, 
        status: UserChallengeStatus.ACTIVE,
        startedAt: createMockTimestamp(Math.floor((Date.now() - 60000)/1000)),
      };
      const userChallengeSnapshot = createMockDocSnapshot<UserChallenge>('user-challenge-1', userChallengeData);
      const challengeSnapshot = createMockDocSnapshot<Challenge>('challenge-1', mockChallenge);

      mockGetDoc
        .mockResolvedValueOnce(userChallengeSnapshot) // For userChallengeRef
        .mockResolvedValueOnce(challengeSnapshot);    // For challengeRef (inside completeChallenge -> getChallenge)
      // mockUpdateDoc is configured in beforeEach to resolve successfully.

      const result = await completeChallenge('user-challenge-1');

      expect(result.success).toBe(true);
      expect(mockUpdateDoc).toHaveBeenCalledWith(
        expect.objectContaining({ path: 'userChallenges/user-challenge-1' }), // Check if the correct doc is updated
        expect.objectContaining({ status: UserChallengeStatus.COMPLETED })
      );
      // Potentially assert awardXP mock calls as well
    });

    it('should not complete already completed challenge', async () => {
      const userChallengeData = { 
        ...mockUserChallenge, 
        id: 'user-challenge-1', // Ensure id is part of the data for snapshot creation
        status: UserChallengeStatus.COMPLETED,
        startedAt: createMockTimestamp(Math.floor((Date.now() - 60000)/1000)),
      };
      const userChallengeSnapshot = createMockDocSnapshot<UserChallenge>('user-challenge-1', userChallengeData);
      
      mockGetDoc.mockResolvedValue(userChallengeSnapshot); // This will be for the userChallengeRef getDoc call

      const result = await completeChallenge('user-challenge-1');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Challenge already completed');
      expect(mockUpdateDoc).not.toHaveBeenCalled(); // Ensure updateDoc is not called
    });
  });
});
