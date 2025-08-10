import { fetchUserData } from './userUtils';

// Mock Firestore methods
jest.mock('firebase/firestore', () => ({
  doc: jest.fn((db, collection, userId) => ({ db, collection, userId })),
  getDoc: jest.fn(async (ref) => {
    if (ref.userId === 'exists') {
      return {
        exists: () => true,
        data: () => ({
          displayName: 'Test User',
          email: 'test@example.com',
          profilePicture: 'http://example.com/pic.jpg',
        }),
      };
    } else {
      return {
        exists: () => false,
        data: () => ({}),
      };
    }
  }),
}));

// Mock db
jest.mock('../firebase-config', () => ({
  db: jest.fn(() => ({})),
}));

describe('fetchUserData', () => {
  it('returns user data when user exists', async () => {
    const data = await fetchUserData('exists');
    expect(data.displayName).toBe('Test User');
    expect(data.email).toBe('test@example.com');
    expect(data.profilePicture).toBe('http://example.com/pic.jpg');
  });

  it('returns default data when user does not exist', async () => {
    const data = await fetchUserData('notfound');
    expect(data.displayName).toMatch(/^User /);
    expect(data.profilePicture).toBeNull();
  });

  it('returns cached data if available and not expired', async () => {
    const first = await fetchUserData('exists');
    const second = await fetchUserData('exists');
    expect(second).toBe(first); // Should be the same object (from cache)
  });

  it('returns fallback data on error', async () => {
    // Simulate error by throwing in getDoc
    const { getDoc } = require('firebase/firestore');
    getDoc.mockImplementationOnce(() => { throw new Error('Firestore error'); });
    const data = await fetchUserData('errorcase');
    expect(data.displayName).toMatch(/^User /);
    expect(data.profilePicture).toBeNull();
  });
});
