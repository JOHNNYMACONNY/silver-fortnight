import { renderHook, act } from '@testing-library/react';
import { useCollaborationSearch } from '../useCollaborationSearch';
import { getAllCollaborations } from '../../services/firestore-exports';

jest.useFakeTimers();

// Mock filter persistence to avoid URL/analytics side effects in tests
jest.mock('../../services/filterPersistence', () => ({
  useFilterPersistence: () => ({
    getFromUrl: jest.fn(() => ({})),
    syncToUrl: jest.fn(),
    getPopularFilters: jest.fn(async () => []),
    savePreferences: jest.fn(async () => undefined),
    getPreferences: jest.fn(async () => ({ savedFilters: [] })),
    trackUsage: jest.fn(async () => undefined)
  })
}));

// Mock the firestore service used by the hook
jest.mock('../../services/firestore-exports', () => ({
  getAllCollaborations: jest.fn()
}));

describe('useCollaborationSearch integration (service + debounce + persistence)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
  });

  it('performs a search and sets results, totalCount, and metadata', async () => {
    (getAllCollaborations as jest.Mock).mockResolvedValueOnce({
      data: { items: [{ id: '1', title: 'React Collaboration' }], hasMore: false, totalCount: 1, queryMetadata: { source: 'test' } },
      error: null
    });

    const { result } = renderHook(() => useCollaborationSearch({ enablePersistence: true, enableAnalytics: false, pagination: { limit: 10, orderByField: 'createdAt', orderDirection: 'desc' } }));

    await act(async () => {
      const p = result.current.search('react', { status: ['open'] });
      // advance debounce time
      jest.advanceTimersByTime(350);
      await p;
    });

    expect(getAllCollaborations).toHaveBeenCalledTimes(1);
    const callArgs = (getAllCollaborations as jest.Mock).mock.calls[0];
    expect(callArgs[0]).toEqual({ limit: 10, orderByField: 'createdAt', orderDirection: 'desc' });
    expect(callArgs[1]).toMatchObject({ searchQuery: 'react', status: ['open'] });
    expect(callArgs[2]).toEqual({ includeNonPublic: false });

    expect(result.current.results).toHaveLength(1);
    expect(result.current.totalCount).toBe(1);
    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it('handles service error and resets results', async () => {
    (getAllCollaborations as jest.Mock).mockResolvedValueOnce({
      data: null,
      error: { message: 'boom' }
    });

    const { result } = renderHook(() => useCollaborationSearch({ enablePersistence: true, enableAnalytics: false }));

    await act(async () => {
      const p = result.current.search('x', {});
      jest.advanceTimersByTime(350);
      await p;
    });

    expect(result.current.error).toBe('boom');
    expect(result.current.results).toEqual([]);
    expect(result.current.totalCount).toBe(0);
  });

  it('handles no results state properly', async () => {
    (getAllCollaborations as jest.Mock).mockResolvedValueOnce({
      data: { items: [], hasMore: false, totalCount: 0, queryMetadata: {} },
      error: null
    });

    const { result } = renderHook(() => useCollaborationSearch({ enablePersistence: true, enableAnalytics: false }));

    await act(async () => {
      const p = result.current.search('nope', {});
      jest.advanceTimersByTime(350);
      await p;
    });

    expect(result.current.results).toEqual([]);
    expect(result.current.totalCount).toBe(0);
    expect(result.current.error).toBeNull();
  });
});

