import { renderHook, waitFor } from '@testing-library/react';
import { useSystemStats } from '../useSystemStats';
import { getSystemStats } from '../../services/firestore-extensions';

// Mock the service
jest.mock('../../services/firestore-extensions', () => ({
  getSystemStats: jest.fn(),
}));

const mockGetSystemStats = getSystemStats as jest.MockedFunction<typeof getSystemStats>;

describe('useSystemStats', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return loading state initially', () => {
    mockGetSystemStats.mockImplementation(() => new Promise(() => {})); // Never resolves
    
    const { result } = renderHook(() => useSystemStats());
    
    expect(result.current.loading).toBe(true);
    expect(result.current.stats).toBe(null);
    expect(result.current.error).toBe(null);
  });

  it('should return stats when service succeeds', async () => {
    const mockStats = {
      totalUsers: 100,
      totalTrades: 50,
      totalCollaborations: 25,
      totalChallenges: 10,
      activeUsers: 80,
      completedTrades: 30,
      lastUpdated: new Date(),
    };

    mockGetSystemStats.mockResolvedValue({
      data: mockStats,
      error: null,
    });

    const { result } = renderHook(() => useSystemStats());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.stats).toEqual(mockStats);
    expect(result.current.error).toBe(null);
    expect(result.current.lastUpdated).toEqual(mockStats.lastUpdated);
  });

  it('should return error when service fails', async () => {
    const mockError = {
      code: 'permission-denied',
      message: 'Access denied',
    };

    mockGetSystemStats.mockResolvedValue({
      data: null,
      error: mockError,
    });

    const { result } = renderHook(() => useSystemStats());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.stats).toBe(null);
    expect(result.current.error).toBe('Access denied');
  });

  it('should refresh data when refresh is called', async () => {
    const mockStats = {
      totalUsers: 100,
      totalTrades: 50,
      totalCollaborations: 25,
      totalChallenges: 10,
      activeUsers: 80,
      completedTrades: 30,
      lastUpdated: new Date(),
    };

    mockGetSystemStats.mockResolvedValue({
      data: mockStats,
      error: null,
    });

    const { result } = renderHook(() => useSystemStats());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockGetSystemStats).toHaveBeenCalledTimes(1);

    // Call refresh
    await result.current.refresh();

    expect(mockGetSystemStats).toHaveBeenCalledTimes(2);
  });
});
