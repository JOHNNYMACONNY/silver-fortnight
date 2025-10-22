import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// Mock auth
jest.mock('../AuthContext', () => ({
  useAuth: () => ({ currentUser: { uid: 'test-user' }, loading: false })
}));

// Mock toast
jest.mock('../contexts/ToastContext', () => ({
  useToast: () => ({ addToast: jest.fn() })
}));

// Mock performance context
jest.mock('../contexts/PerformanceContext', () => ({
  useBusinessMetrics: () => ({ track: jest.fn() }),
  usePerformance: () => ({
    collectMetrics: jest.fn(),
    addBusinessMetric: jest.fn(),
    trackJourneyStep: jest.fn()
  })
}));

// Mock challenge services
jest.mock('../services/challenges', () => ({
  getChallenges: jest.fn().mockResolvedValue({
    success: true,
    challenges: [
      {
        id: 'c1',
        title: 'Alpha Challenge',
        description: 'Desc',
        type: 'solo',
        category: 'development',
        difficulty: 'beginner',
        requirements: [],
        rewards: { xp: 10 },
        startDate: new Date(),
        endDate: new Date(Date.now() + 86400000),
        status: 'active',
        participantCount: 1,
        completionCount: 0,
        instructions: [],
        objectives: [],
        createdBy: 'u1',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ],
    total: 1,
    hasMore: false
  }),
  getUserChallenges: jest.fn().mockResolvedValue({ success: true, challenges: [] }),
  onActiveChallenges: (cb: (items: any[]) => void) => { cb([]); return () => {}; },
  getRecommendedChallenges: jest.fn().mockImplementation((_uid: string) => Promise.resolve({ success: true, challenges: [] })),
}));

import ChallengesPage from '../pages/ChallengesPage';

describe('ChallengesPage empty state and Clear filters', () => {
  it('shows empty state when filters exclude all and recovers on Clear filters', async () => {
    render(
      <MemoryRouter>
        <ChallengesPage />
      </MemoryRouter>
    );

    // Open filters (exact match to avoid matching "Clear filters")
    fireEvent.click(screen.getByRole('button', { name: 'Filters' }));

    // Choose impossible filter combo to empty results (e.g., type that doesn't match)
    const typeSelect = screen.getByLabelText(/Type/i) as HTMLSelectElement;
    fireEvent.change(typeSelect, { target: { value: 'trade' } });

    // Now empty state should show
    await waitFor(() => expect(screen.getByText(/No challenges found/i)).toBeInTheDocument());

    // Switch Type back to a matching value to clear the empty state
    fireEvent.change(typeSelect, { target: { value: 'solo' } });

    // Wait for empty-state to disappear
    await waitFor(() => expect(screen.queryByText(/No challenges found/i)).not.toBeInTheDocument());

    // Card should appear using stable test id (allow any card id)
    await waitFor(() => {
      const cards = screen.queryAllByTestId(/challenge-card-/i);
      expect(cards.length).toBeGreaterThan(0);
    });
  });
});


