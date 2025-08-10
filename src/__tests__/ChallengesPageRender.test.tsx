import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// Mock auth context
jest.mock('../AuthContext', () => ({
  useAuth: () => ({ currentUser: { uid: 'test-user' }, loading: false }),
}));

// Mock toast
jest.mock('../contexts/ToastContext', () => ({
  useToast: () => ({ addToast: jest.fn() }),
}));

// Mock challenge services
jest.mock('../services/challenges', () => ({
  getChallenges: jest.fn().mockResolvedValue({
    success: true,
    challenges: [
      {
        id: 'c1',
        title: 'Test Challenge A',
        description: 'Desc A',
        type: 'solo',
        category: 'development',
        difficulty: undefined, // intentionally missing to test hardening
        requirements: [],
        rewards: { xp: 50 },
        startDate: new Date(),
        endDate: new Date(Date.now() + 86400000),
        status: 'active',
        participantCount: 1,
        completionCount: 0,
        instructions: [],
        objectives: [],
        createdBy: 'u1',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    total: 1,
    hasMore: false,
  }),
  getUserChallenges: jest.fn().mockResolvedValue({ success: true, challenges: [] }),
  onActiveChallenges: (cb: (items: any[]) => void) => { cb([]); return () => {}; },
  getRecommendedChallenges: jest.fn().mockResolvedValue({
    success: true,
    challenges: [
      {
        id: 'r1',
        title: 'Recommended Challenge',
        description: 'Try this one',
        type: 'solo',
        category: 'development',
        difficulty: 'beginner',
        requirements: [],
        rewards: { xp: 25 },
        startDate: new Date(),
        endDate: new Date(Date.now() + 172800000),
        status: 'active',
        participantCount: 0,
        completionCount: 0,
        instructions: [],
        objectives: [],
        createdBy: 'u1',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
  }),
  joinChallenge: jest.fn().mockResolvedValue({ success: true }),
}));

import ChallengesPage from '../pages/ChallengesPage';

describe('ChallengesPage', () => {
  it('renders without crashing and shows challenges and recommendations', async () => {
    render(
      <MemoryRouter>
        <ChallengesPage />
      </MemoryRouter>
    );

    // Header
    expect(await screen.findByText(/Challenges/i)).toBeInTheDocument();

    // Recommended section appears
    await waitFor(() => expect(screen.getByText(/Recommended for you/i)).toBeInTheDocument());
    expect(screen.getByText(/Recommended Challenge/i)).toBeInTheDocument();

    // Main list shows Test Challenge A
    expect(await screen.findByText(/Test Challenge A/i)).toBeInTheDocument();
  });
});


