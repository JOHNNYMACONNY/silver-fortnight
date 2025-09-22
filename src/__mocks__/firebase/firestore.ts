import { jest } from '@jest/globals';

// Mock Functions
const mockJestFn = () => {
  const fn = jest.fn() as any;
  fn.mockReturnThis = () => {
    fn.mockImplementation(() => fn);
    return fn;
  };
  return fn;
};

// Mock Data
const createDocRef = (id: string): any => ({
  id,
  path: `mock/path/${id}`,
  get: mockJestFn().mockResolvedValue(createDocSnapshot({ id } as any)),
  set: mockJestFn().mockResolvedValue(undefined),
  update: mockJestFn().mockResolvedValue(undefined),
  delete: mockJestFn().mockResolvedValue(undefined)
});

const createDocSnapshot = (data: any = null): any => ({
  exists: () => data !== null,
  data: () => data,
  id: 'mock-doc-id',
  ref: createDocRef('mock-doc-id')
});

// Export the mocked functions
export const doc = mockJestFn().mockImplementation((db: any, collectionName: string, documentId: string) => {
  return createDocRef(documentId);
});

export const getDoc = jest.fn().mockResolvedValue(createDocSnapshot({ id: 'mock-doc-id', exists: true } as any));

export const collection = mockJestFn().mockImplementation((db: any, collectionName: string) => ({
  doc: mockJestFn().mockImplementation((id: string) => createDocRef(id)),
  add: mockJestFn().mockResolvedValue(createDocRef('new-doc-id')),
  where: mockJestFn().mockReturnThis(),
  orderBy: mockJestFn().mockReturnThis(),
  limit: mockJestFn().mockReturnThis(),
  get: mockJestFn().mockResolvedValue({
    docs: [],
    empty: true,
    size: 0,
    forEach: mockJestFn()
  })
}));

export const query = mockJestFn().mockReturnThis();
export const where = mockJestFn().mockReturnThis();
export const orderBy = mockJestFn().mockReturnThis();
export const limit = mockJestFn().mockReturnThis();
export const addDoc = mockJestFn().mockResolvedValue(createDocRef('new-doc-id'));
export const updateDoc = mockJestFn().mockResolvedValue(undefined);
export const getDocs = mockJestFn().mockResolvedValue({
  docs: [],
  empty: true,
  size: 0,
  forEach: mockJestFn()
});

// Export types
export type { DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';
