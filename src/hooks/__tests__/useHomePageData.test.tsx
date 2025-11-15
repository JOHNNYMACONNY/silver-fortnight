import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { Timestamp } from 'firebase/firestore';
import {
  HomePageDataProvider,
  useHomeStats,
  useCommunityActivity,
} from '../useHomePageData';
import { HomePageData } from '../../types/homepage';
import { fetchHomePageData } from '../../services/homepage';

jest.mock('../../services/homepage');

const mockFetchHomePageData = fetchHomePageData as jest.MockedFunction<
  typeof fetchHomePageData
>;

const nextTick = () => new Promise((resolve) => setTimeout(resolve, 0));

const mockData: HomePageData = {
  stats: {
    trades: {
      active: 12,
      completed: 8,
    },
    community: {
      activeUsers: 42,
      skillsTraded: 18,
      collaborations: 6,
      lastUpdated: Timestamp.fromDate(new Date('2025-01-01T00:00:00Z')),
    },
  },
  collaborationHighlights: [
    {
      id: 'col-1',
      title: 'Design Sprint',
      summary: 'Rapid UI exploration sprint',
      openRoles: 2,
      status: 'open',
      accent: 'purple',
    },
  ],
  challengeSpotlight: {
    id: 'challenge-1',
    title: 'Prototype Jam',
    rewardSummary: '250 XP',
    deadline: new Date('2025-01-02T12:00:00Z'),
    status: 'active',
  },
  activity: [
    {
      id: 'activity-1',
      type: 'trade',
      description: 'New trade: Motion Design for Branding',
      timestamp: new Date('2025-01-01T08:00:00Z'),
      accent: 'orange',
    },
  ],
};

const wrapper: React.FC<React.PropsWithChildren> = ({ children }) => (
  <HomePageDataProvider>{children}</HomePageDataProvider>
);

describe('useHomePageData hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('provides stats after successful fetch', async () => {
    mockFetchHomePageData.mockResolvedValue({
      success: true,
      data: mockData,
    });

    const { result } = renderHook(() => useHomeStats(), { wrapper });

    expect(result.current.loading).toBe(true);

    await act(async () => {
      await nextTick();
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.stats?.trades.active).toBe(12);
    expect(result.current.error).toBeNull();
  });

  it('surfaces error state when service fails', async () => {
    mockFetchHomePageData.mockResolvedValue({
      success: false,
      error: 'network-failure',
    });

    const { result } = renderHook(() => useCommunityActivity(), { wrapper });

    await act(async () => {
      await nextTick();
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.activity).toHaveLength(0);
    expect(result.current.error).toBe('network-failure');
  });
});

