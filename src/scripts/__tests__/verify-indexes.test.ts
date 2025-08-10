import { verifyIndexes, parseIndexDefinitions, compareIndexes, IndexDefinition, DeployedIndex } from '../../../scripts/verify-indexes';
import * as admin from 'firebase-admin';
import * as fs from 'fs';

// Type definitions for mocked objects
interface MockFirestore {
  listIndexes: jest.Mock;
}

type MockProcessExit = (code?: string | number | null | undefined) => never;

// Mock firebase-admin
jest.mock('firebase-admin', () => {
  const mockFirestore = {
    listIndexes: jest.fn(),
  };
  return {
    initializeApp: jest.fn(),
    firestore: jest.fn(() => mockFirestore),
  };
});

// Mock fs
jest.mock('fs', () => ({
  ...jest.requireActual('fs'), // import and retain default behavior
  readFileSync: jest.fn(),
}));

const mockFirestoreAdmin = admin.firestore() as unknown as MockFirestore;
const mockReadFileSync = fs.readFileSync as jest.Mock;

describe('verify-indexes.ts', () => {
  describe('parseIndexDefinitions', () => {
    it('should correctly parse index definitions from a JSON string', () => {
      const jsonContent = `{
        "indexes": [
          {
            "collectionGroup": "collectionA",
            "queryScope": "COLLECTION",
            "fields": [
              { "fieldPath": "field1", "order": "ASCENDING" },
              { "fieldPath": "field2", "arrayConfig": "CONTAINS" }
            ]
          }
        ],
        "fieldOverrides": []
      }`;
      const expected: IndexDefinition[] = [
        {
          collectionGroup: 'collectionA',
          queryScope: 'COLLECTION',
          fields: [
            { fieldPath: 'field1', order: 'ASCENDING' },
            { fieldPath: 'field2', arrayConfig: 'CONTAINS' },
          ],
        },
      ];
      expect(parseIndexDefinitions(jsonContent)).toEqual(expected);
    });

    it('should handle fieldOverrides correctly', () => {
      const jsonContent = `{
        "indexes": [],
        "fieldOverrides": [
          {
            "collectionGroup": "collectionB",
            "fieldPath": "fieldX",
            "indexes": [
              { "order": "DESCENDING", "queryScope": "COLLECTION_GROUP" },
              { "arrayConfig": "CONTAINS", "queryScope": "COLLECTION" }
            ]
          }
        ]
      }`;
      // Note: The structure of IndexDefinition might need adjustment
      // if fieldOverrides are to be transformed into the same shape as regular indexes.
      // For now, assuming parseIndexDefinitions focuses on the "indexes" array primarily
      // or has a specific way to merge/handle fieldOverrides.
      // This test might need refinement based on actual implementation of parseIndexDefinitions.
      const expected: IndexDefinition[] = [
        {
          collectionGroup: 'collectionB',
          queryScope: 'COLLECTION_GROUP',
          fields: [{ fieldPath: 'fieldX', order: 'DESCENDING' }],
        },
        {
          collectionGroup: 'collectionB',
          queryScope: 'COLLECTION',
          fields: [{ fieldPath: 'fieldX', arrayConfig: 'CONTAINS' }],
        },
      ];
      expect(parseIndexDefinitions(jsonContent)).toEqual(expected);
    });


    it('should return empty array for empty indexes and fieldOverrides', () => {
      const jsonContent = `{ "indexes": [], "fieldOverrides": [] }`;
      expect(parseIndexDefinitions(jsonContent)).toEqual([]);
    });
  });

  describe('compareIndexes', () => {
    const expectedIndexes: IndexDefinition[] = [
      {
        collectionGroup: 'users',
        queryScope: 'COLLECTION',
        fields: [{ fieldPath: 'name', order: 'ASCENDING' }, { fieldPath: 'age', order: 'DESCENDING' }],
      },
      {
        collectionGroup: 'products',
        queryScope: 'COLLECTION',
        fields: [{ fieldPath: 'price', order: 'ASCENDING' }],
      },
    ];

    it('should report all good when all expected indexes are deployed and active', () => {
      const deployedIndexes: DeployedIndex[] = [
        {
          name: 'projects/test-project/databases/(default)/collectionGroups/users/indexes/randomId1',
          queryScope: 'COLLECTION',
          fields: [{ fieldPath: 'name', order: 'ASCENDING' }, { fieldPath: 'age', order: 'DESCENDING' }],
          state: 'READY',
        },
        {
          name: 'projects/test-project/databases/(default)/collectionGroups/products/indexes/randomId2',
          queryScope: 'COLLECTION',
          fields: [{ fieldPath: 'price', order: 'ASCENDING' }],
          state: 'READY',
        },
      ];
      const result = compareIndexes(expectedIndexes, deployedIndexes);
      expect(result.allMatch).toBe(true);
      expect(result.missingIndexes).toEqual([]);
      expect(result.notReadyIndexes).toEqual([]);
      expect(result.unexpectedIndexes).toEqual([]);
    });

    it('should report missing indexes', () => {
      const deployedIndexes: DeployedIndex[] = [
        {
          name: 'projects/test-project/databases/(default)/collectionGroups/users/indexes/randomId1',
          queryScope: 'COLLECTION',
          fields: [{ fieldPath: 'name', order: 'ASCENDING' }, { fieldPath: 'age', order: 'DESCENDING' }],
          state: 'READY',
        },
      ];
      const result = compareIndexes(expectedIndexes, deployedIndexes);
      expect(result.allMatch).toBe(false);
      expect(result.missingIndexes).toEqual([expectedIndexes[1]]);
      expect(result.notReadyIndexes).toEqual([]);
      expect(result.unexpectedIndexes).toEqual([]);
    });

    it('should report not ready indexes', () => {
      const deployedIndexes: DeployedIndex[] = [
        {
          name: 'projects/test-project/databases/(default)/collectionGroups/users/indexes/randomId1',
          queryScope: 'COLLECTION',
          fields: [{ fieldPath: 'name', order: 'ASCENDING' }, { fieldPath: 'age', order: 'DESCENDING' }],
          state: 'READY',
        },
        {
          name: 'projects/test-project/databases/(default)/collectionGroups/products/indexes/randomId2',
          queryScope: 'COLLECTION',
          fields: [{ fieldPath: 'price', order: 'ASCENDING' }],
          state: 'CREATING',
        },
      ];
      const result = compareIndexes(expectedIndexes, deployedIndexes);
      expect(result.allMatch).toBe(false);
      expect(result.missingIndexes).toEqual([]);
      expect(result.notReadyIndexes).toEqual([{
        expected: expectedIndexes[1],
        actual: deployedIndexes[1]
      }]);
      expect(result.unexpectedIndexes).toEqual([]);
    });

    it('should report unexpected indexes', () => {
      const deployedIndexes: DeployedIndex[] = [
        {
          name: 'projects/test-project/databases/(default)/collectionGroups/users/indexes/randomId1',
          queryScope: 'COLLECTION',
          fields: [{ fieldPath: 'name', order: 'ASCENDING' }, { fieldPath: 'age', order: 'DESCENDING' }],
          state: 'READY',
        },
        {
          name: 'projects/test-project/databases/(default)/collectionGroups/products/indexes/randomId2',
          queryScope: 'COLLECTION',
          fields: [{ fieldPath: 'price', order: 'ASCENDING' }],
          state: 'READY',
        },
        {
          name: 'projects/test-project/databases/(default)/collectionGroups/orders/indexes/randomId3',
          queryScope: 'COLLECTION',
          fields: [{ fieldPath: 'total', order: 'DESCENDING' }],
          state: 'READY',
        },
      ];
      const result = compareIndexes(expectedIndexes, deployedIndexes);
      expect(result.allMatch).toBe(false); // Or true if unexpected are just warnings
      expect(result.missingIndexes).toEqual([]);
      expect(result.notReadyIndexes).toEqual([]);
      expect(result.unexpectedIndexes).toEqual([deployedIndexes[2]]);
    });

    it('should handle complex scenarios with mixed states', () => {
        const specificExpected: IndexDefinition[] = [
            { collectionGroup: 'A', queryScope: 'COLLECTION', fields: [{ fieldPath: 'f1', order: 'ASCENDING' }] },
            { collectionGroup: 'B', queryScope: 'COLLECTION', fields: [{ fieldPath: 'f2', arrayConfig: 'CONTAINS' }] },
            { collectionGroup: 'C', queryScope: 'COLLECTION_GROUP', fields: [{ fieldPath: 'f3', order: 'DESCENDING' }] },
        ];
        const specificDeployed: DeployedIndex[] = [
            { name: 'idx_A_f1', collectionGroup: 'A', queryScope: 'COLLECTION', fields: [{ fieldPath: 'f1', order: 'ASCENDING' }], state: 'READY' },
            // B is missing
            { name: 'idx_C_f3', collectionGroup: 'C', queryScope: 'COLLECTION_GROUP', fields: [{ fieldPath: 'f3', order: 'DESCENDING' }], state: 'CREATING' },
            { name: 'idx_D_f4', collectionGroup: 'D', queryScope: 'COLLECTION', fields: [{ fieldPath: 'f4', order: 'ASCENDING' }], state: 'READY' }, // Unexpected
        ];

        const result = compareIndexes(specificExpected, specificDeployed);
        expect(result.allMatch).toBe(false);
        expect(result.missingIndexes).toEqual([specificExpected[1]]);
        expect(result.notReadyIndexes).toEqual([{ expected: specificExpected[2], actual: specificDeployed[1] }]);
        expect(result.unexpectedIndexes).toEqual([specificDeployed[2]]);
    });
  });

  describe('verifyIndexes (main function)', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    const mockFirebaseRcContent = `{ "projects": { "default": "test-project-default", "staging": "test-project-staging" } }`;
    const mockIndexesJsonContent = `{
      "indexes": [{
        "collectionGroup": "tasks",
        "queryScope": "COLLECTION",
        "fields": [{ "fieldPath": "done", "order": "ASCENDING" }]
      }],
      "fieldOverrides": []
    }`;

    const expectedParsedIndexes: IndexDefinition[] = [{
      collectionGroup: 'tasks',
      queryScope: 'COLLECTION',
      fields: [{ fieldPath: 'done', order: 'ASCENDING' }],
    }];

    it('should succeed if all indexes match and are ready (default project)', async () => {
      mockReadFileSync.mockImplementation((path) => {
        if (path === '.firebaserc') return mockFirebaseRcContent;
        if (path === 'firestore.indexes.json') return mockIndexesJsonContent;
        return '';
      });
      mockFirestoreAdmin.listIndexes.mockResolvedValue([
        {
          name: 'projects/test-project-default/databases/(default)/collectionGroups/tasks/indexes/autoId1',
          queryScope: 'COLLECTION',
          fields: [{ fieldPath: 'done', order: 'ASCENDING' }],
          state: 'READY',
        }
      ]);

      const consoleSpy = jest.spyOn(console, 'log');
      const processExitSpy = jest.spyOn(process, 'exit').mockImplementation((() => {}) as MockProcessExit);


      await verifyIndexes('default', 'firestore.indexes.json');

      expect(admin.initializeApp).toHaveBeenCalledWith({ projectId: 'test-project-default' });
      expect(mockFirestoreAdmin.listIndexes).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('All 1 expected indexes are deployed and active.'));
      expect(processExitSpy).toHaveBeenCalledWith(0);

      consoleSpy.mockRestore();
      processExitSpy.mockRestore();
    });

    it('should succeed if all indexes match and are ready (staging project)', async () => {
        mockReadFileSync.mockImplementation((path) => {
          if (path === '.firebaserc') return mockFirebaseRcContent;
          if (path === 'firestore.indexes.json') return mockIndexesJsonContent;
          return '';
        });
        mockFirestoreAdmin.listIndexes.mockResolvedValue([
          {
            name: 'projects/test-project-staging/databases/(default)/collectionGroups/tasks/indexes/autoId1',
            queryScope: 'COLLECTION',
            fields: [{ fieldPath: 'done', order: 'ASCENDING' }],
            state: 'READY',
          }
        ]);

        const consoleSpy = jest.spyOn(console, 'log');
        const processExitSpy = jest.spyOn(process, 'exit').mockImplementation((() => {}) as MockProcessExit);


        await verifyIndexes('staging', 'firestore.indexes.json');

        expect(admin.initializeApp).toHaveBeenCalledWith({ projectId: 'test-project-staging' });
        expect(mockFirestoreAdmin.listIndexes).toHaveBeenCalled();
        expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('All 1 expected indexes are deployed and active.'));
        expect(processExitSpy).toHaveBeenCalledWith(0);
        consoleSpy.mockRestore();
        processExitSpy.mockRestore();
      });


    it('should fail if an index is missing', async () => {
      mockReadFileSync.mockImplementation((path) => {
        if (path === '.firebaserc') return mockFirebaseRcContent;
        if (path === 'firestore.indexes.json') return mockIndexesJsonContent;
        return '';
      });
      mockFirestoreAdmin.listIndexes.mockResolvedValue([]); // No indexes deployed

      const consoleErrorSpy = jest.spyOn(console, 'error');
      const processExitSpy = jest.spyOn(process, 'exit').mockImplementation((() => {}) as MockProcessExit);

      await verifyIndexes('default', 'firestore.indexes.json');

      expect(admin.initializeApp).toHaveBeenCalledWith({ projectId: 'test-project-default' });
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Missing indexes:'));
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('- Collection: tasks'));
      expect(processExitSpy).toHaveBeenCalledWith(1);

      consoleErrorSpy.mockRestore();
      processExitSpy.mockRestore();
    });

    it('should fail if an index is not ready', async () => {
        mockReadFileSync.mockImplementation((path) => {
          if (path === '.firebaserc') return mockFirebaseRcContent;
          if (path === 'firestore.indexes.json') return mockIndexesJsonContent;
          return '';
        });
        mockFirestoreAdmin.listIndexes.mockResolvedValue([
          {
            name: 'projects/test-project-default/databases/(default)/collectionGroups/tasks/indexes/autoId1',
            queryScope: 'COLLECTION',
            fields: [{ fieldPath: 'done', order: 'ASCENDING' }],
            state: 'CREATING', // Not ready
          }
        ]);

        const consoleErrorSpy = jest.spyOn(console, 'error');
        const processExitSpy = jest.spyOn(process, 'exit').mockImplementation((() => {}) as MockProcessExit);


        await verifyIndexes('default', 'firestore.indexes.json');

        expect(admin.initializeApp).toHaveBeenCalledWith({ projectId: 'test-project-default' });
        expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Indexes not ready:'));
        expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('- Collection: tasks, Current state: CREATING'));
        expect(processExitSpy).toHaveBeenCalledWith(1);
        consoleErrorSpy.mockRestore();
        processExitSpy.mockRestore();
      });

      it('should report unexpected indexes and fail', async () => {
        mockReadFileSync.mockImplementation((path) => {
          if (path === '.firebaserc') return mockFirebaseRcContent;
          if (path === 'firestore.indexes.json') return mockIndexesJsonContent; // Defines 1 index
          return '';
        });
        mockFirestoreAdmin.listIndexes.mockResolvedValue([
          { // Expected
            name: 'projects/test-project-default/databases/(default)/collectionGroups/tasks/indexes/autoId1',
            queryScope: 'COLLECTION',
            fields: [{ fieldPath: 'done', order: 'ASCENDING' }],
            state: 'READY',
          },
          { // Unexpected
            name: 'projects/test-project-default/databases/(default)/collectionGroups/extra/indexes/autoId2',
            queryScope: 'COLLECTION',
            fields: [{ fieldPath: 'field', order: 'DESCENDING' }],
            state: 'READY',
          }
        ]);

        const consoleWarnSpy = jest.spyOn(console, 'warn');
        const processExitSpy = jest.spyOn(process, 'exit').mockImplementation((() => {}) as MockProcessExit);


        await verifyIndexes('default', 'firestore.indexes.json');

        expect(admin.initializeApp).toHaveBeenCalledWith({ projectId: 'test-project-default' });
        expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('Unexpected indexes found:'));
        expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('- Name: projects/test-project-default/databases/(default)/collectionGroups/extra/indexes/autoId2'));
        // Depending on strictness, this might exit 0 if only unexpected, or 1 if considered a failure.
        // For this test, let's assume unexpected indexes also cause a non-zero exit.
        expect(processExitSpy).toHaveBeenCalledWith(1);
        consoleWarnSpy.mockRestore();
        processExitSpy.mockRestore();
      });

      it('should handle unknown environment by trying to use it as project ID or exiting', async () => {
        mockReadFileSync.mockImplementation((path) => {
          if (path === '.firebaserc') return mockFirebaseRcContent; // Does not contain 'unknown-env'
          if (path === 'firestore.indexes.json') return mockIndexesJsonContent;
          return '';
        });
        // Mock listIndexes to simulate successful connection if projectId was valid
        mockFirestoreAdmin.listIndexes.mockResolvedValue([]);


        const consoleErrorSpy = jest.spyOn(console, 'error');
        const processExitSpy = jest.spyOn(process, 'exit').mockImplementation((() => {}) as MockProcessExit);

        // Scenario 1: 'unknown-env' is treated as a direct projectId
        // To test this, we'd need to see if initializeApp is called with it.
        // For this test, let's assume it fails to find it in .firebaserc and exits.
        await verifyIndexes('unknown-env', 'firestore.indexes.json');
        expect(admin.initializeApp).not.toHaveBeenCalledWith({ projectId: 'unknown-env' }); // Or it might be called, then fail.
                                                                                        // Let's assume the script checks .firebaserc first.
        expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining("Error: Project ID for environment 'unknown-env' not found in .firebaserc and it's not 'default'."));
        expect(processExitSpy).toHaveBeenCalledWith(1);


        consoleErrorSpy.mockRestore();
        processExitSpy.mockRestore();
      });

      it('should handle error when reading .firebaserc', async () => {
        mockReadFileSync.mockImplementation((path) => {
          if (path === '.firebaserc') throw new Error('Failed to read .firebaserc');
          return '';
        });

        const consoleErrorSpy = jest.spyOn(console, 'error');
        const processExitSpy = jest.spyOn(process, 'exit').mockImplementation((() => {}) as MockProcessExit);

        await verifyIndexes('default', 'firestore.indexes.json');

        expect(consoleErrorSpy).toHaveBeenCalledWith("Error reading .firebaserc: Failed to read .firebaserc");
        expect(processExitSpy).toHaveBeenCalledWith(1);
        consoleErrorSpy.mockRestore();
        processExitSpy.mockRestore();
      });

      it('should handle error when reading indexes.json', async () => {
        mockReadFileSync.mockImplementation((path) => {
          if (path === '.firebaserc') return mockFirebaseRcContent;
          if (path === 'firestore.indexes.json') throw new Error('Failed to read indexes.json');
          return '';
        });

        const consoleErrorSpy = jest.spyOn(console, 'error');
        const processExitSpy = jest.spyOn(process, 'exit').mockImplementation((() => {}) as MockProcessExit);

        await verifyIndexes('default', 'firestore.indexes.json');
        expect(consoleErrorSpy).toHaveBeenCalledWith("Error reading or parsing indexes file firestore.indexes.json: Failed to read indexes.json");
        expect(processExitSpy).toHaveBeenCalledWith(1);
        consoleErrorSpy.mockRestore();
        processExitSpy.mockRestore();
      });

      it('should handle error when listing indexes from Firestore', async () => {
        mockReadFileSync.mockImplementation((path) => {
          if (path === '.firebaserc') return mockFirebaseRcContent;
          if (path === 'firestore.indexes.json') return mockIndexesJsonContent;
          return '';
        });
        mockFirestoreAdmin.listIndexes.mockRejectedValue(new Error('Firestore API error'));

        const consoleErrorSpy = jest.spyOn(console, 'error');
        const processExitSpy = jest.spyOn(process, 'exit').mockImplementation((() => {}) as MockProcessExit);

        await verifyIndexes('default', 'firestore.indexes.json');
        expect(consoleErrorSpy).toHaveBeenCalledWith("Error fetching deployed indexes: Firestore API error");
        expect(processExitSpy).toHaveBeenCalledWith(1);
        consoleErrorSpy.mockRestore();
        processExitSpy.mockRestore();
      });
  });
});