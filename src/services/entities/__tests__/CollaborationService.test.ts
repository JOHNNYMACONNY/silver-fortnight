// Mock Firebase deps before importing service
jest.mock('../../../firebase-config', () => ({
  getSyncFirebaseDb: jest.fn(() => ({})),
  getFirebaseInstances: jest.fn(async () => ({ db: {} })),
  initializeFirebase: jest.fn(async () => undefined)
}));

// Provide a controllable Firestore mock
const firestoreState: { docs: any[]; readDoc?: any } = { docs: [] };
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(() => ({})),
  doc: jest.fn(() => ({})),
  setDoc: jest.fn(async () => undefined),
  getDoc: jest.fn(async () => firestoreState.readDoc ?? ({ exists: () => true, data: () => ({}) })),
  getDocs: jest.fn(async () => ({ docs: firestoreState.docs })),
  updateDoc: jest.fn(async () => undefined),
  deleteDoc: jest.fn(async () => undefined),
  query: jest.fn(() => ({})),
  where: jest.fn(() => ({})),
  orderBy: jest.fn(() => ({})),
  startAfter: jest.fn(() => ({})),
  limit: jest.fn(() => ({})),
  writeBatch: jest.fn(() => ({ set: jest.fn(), update: jest.fn(), delete: jest.fn(), commit: jest.fn(async () => undefined) })),
  Timestamp: { now: () => ({ toMillis: () => Date.now() }) }
}));

import { collaborationService } from '../CollaborationService';

describe('CollaborationService ServiceResult behavior', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    firestoreState.docs = [];
    firestoreState.readDoc = undefined;
  });

  it('returns success with items for searchCollaborations', async () => {
    firestoreState.docs = [
      { data: () => ({
        id: 'c1',
        title: 'React UI Kit',
        description: 'Build components',
        roles: [],
        creatorId: 'u1',
        status: 'open',
        createdAt: { toMillis: () => Date.now() },
        updatedAt: { toMillis: () => Date.now() },
        skillsRequired: ['React'],
        maxParticipants: 5,
      }) }
    ];

    const res = await collaborationService.searchCollaborations({ status: ['open'] }, 10);
    expect(res.error).toBeNull();
    expect(res.data).toHaveLength(1);
    expect(res.data?.[0].title).toBe('React UI Kit');
  });

  it('returns empty array when no results found', async () => {
    firestoreState.docs = [];
    const res = await collaborationService.searchCollaborations({}, 10);
    expect(res.error).toBeNull();
    expect(res.data).toEqual([]);
  });

  it('propagates error from list()', async () => {
    const ff = require('firebase/firestore');
    ff.getDocs.mockRejectedValueOnce(new Error('List failed'));
    const res = await collaborationService.searchCollaborations({}, 10);
    expect(res.data).toBeNull();
    expect(res.error?.code).toBe('list-failed');
  });

  it('wraps unexpected exceptions with service error (via read)', async () => {
    const ff = require('firebase/firestore');
    ff.getDoc.mockImplementationOnce(async () => { throw new Error('boom'); });
    const res = await collaborationService.getCollaboration('id1');
    expect(res.data).toBeNull();
    expect(res.error?.code).toBe('read-failed');
  });

  it('joinCollaboration returns error if already participant', async () => {
    firestoreState.readDoc = {
      exists: () => true,
      data: () => ({
        id: 'c1', title: 'React UI', description: '', roles: [], creatorId: 'u1', status: 'open',
        createdAt: { toMillis: () => Date.now() }, updatedAt: { toMillis: () => Date.now() },
        skillsRequired: ['React'], maxParticipants: 5, participants: ['u2']
      })
    };

    const res = await collaborationService.joinCollaboration('c1', 'u2');
    expect(res.data).toBeNull();
    expect(res.error?.code).toBe('already-joined');
  });

  it('joinCollaboration returns error if full', async () => {
    firestoreState.readDoc = {
      exists: () => true,
      data: () => ({
        id: 'c1', title: 'React UI', description: '', roles: [], creatorId: 'u1', status: 'open',
        createdAt: { toMillis: () => Date.now() }, updatedAt: { toMillis: () => Date.now() },
        skillsRequired: ['React'], maxParticipants: 1, participants: ['u2']
      })
    };

    const res = await collaborationService.joinCollaboration('c1', 'u3');
    expect(res.data).toBeNull();
    expect(res.error?.code).toBe('collaboration-full');
  });

  it('joinCollaboration updates and returns success', async () => {
    const ff = require('firebase/firestore');
    const initial = {
      id: 'c1', title: 'React UI', description: '', roles: [], creatorId: 'u1', status: 'open',
      createdAt: { toMillis: () => Date.now() }, updatedAt: { toMillis: () => Date.now() },
      skillsRequired: ['React'], maxParticipants: 3, participants: [], collaborators: []
    };
    const updated = { ...initial, participants: ['u9'], collaborators: ['u9'] };

    ff.getDoc.mockResolvedValueOnce({ exists: () => true, data: () => initial }); // getCollaboration
    ff.updateDoc.mockResolvedValueOnce(undefined); // update
    ff.getDoc.mockResolvedValueOnce({ exists: () => true, data: () => updated }); // read after update

    const res = await collaborationService.joinCollaboration('c1', 'u9');
    expect(res.error).toBeNull();
    expect(res.data?.participants).toContain('u9');
  });
});

