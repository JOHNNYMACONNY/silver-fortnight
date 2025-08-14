import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// Mock auth
jest.mock('../AuthContext', () => ({
  useAuth: () => ({ currentUser: { uid: 'user-123' }, loading: false }),
}));

// Mock toast
jest.mock('../contexts/ToastContext', () => ({
  useToast: () => ({ addToast: jest.fn() }),
}));

// Mock business metrics
jest.mock('../contexts/PerformanceContext', () => ({
  useBusinessMetrics: () => ({ track: jest.fn() })
}));

// Mock services
const mockChallenges = [
  {
    id: 'a1',
    title: 'Active One',
    description: 'Desc',
    type: 'solo',
    category: 'development',
    difficulty: 'beginner',
    requirements: [],
    rewards: { xp: 10 },
    startDate: new Date(),
    endDate: new Date(Date.now() + 86400000),
    status: 'active',
    participantCount: 0,
    completionCount: 0,
    instructions: [],
    objectives: [],
    createdBy: 'u1',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'c1',
    title: 'Completed One',
    description: 'Desc',
    type: 'solo',
    category: 'development',
    difficulty: 'advanced',
    requirements: [],
    rewards: { xp: 20 },
    startDate: new Date(),
    endDate: new Date(Date.now() - 86400000),
    status: 'completed',
    participantCount: 0,
    completionCount: 1,
    instructions: [],
    objectives: [],
    createdBy: 'u1',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'mine1',
    title: 'Mine Challenge',
    description: 'My joined challenge',
    type: 'solo',
    category: 'development',
    difficulty: 'intermediate',
    requirements: [],
    rewards: { xp: 30 },
    startDate: new Date(),
    endDate: new Date(Date.now() + 172800000),
    status: 'active',
    participantCount: 1,
    completionCount: 0,
    instructions: [],
    objectives: [],
    createdBy: 'u1',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

jest.mock('../services/challenges', () => ({
  getChallenges: jest.fn().mockResolvedValue({ success: true, challenges: mockChallenges }),
  getUserChallenges: jest.fn().mockResolvedValue({ success: true, challenges: [mockChallenges[2]] }),
  onActiveChallenges: (cb: (items: any[]) => void) => { cb([]); return () => {}; },
  getRecommendedChallenges: jest.fn().mockResolvedValue({ success: true, challenges: [] }),
  joinChallenge: jest.fn().mockResolvedValue({ success: true }),
}));

import ChallengesPage from '../pages/ChallengesPage';

describe('ChallengesPage tabs', () => {
  it('filters Active tab to show only active challenges', async () => {
    render(
      <MemoryRouter>
        <ChallengesPage />
      </MemoryRouter>
    );

    // Wait for initial render (header present)
    await screen.findAllByText(/Challenges/i);

    // Click Active tab
    const activeTab = screen.getByRole('button', { name: /Active/i });
    fireEvent.click(activeTab);

    await waitFor(() => {
      expect(screen.queryByText('Completed One')).not.toBeInTheDocument();
      expect(screen.getByText('Active One')).toBeInTheDocument();
      expect(screen.getByText('Mine Challenge')).toBeInTheDocument();
    });
  });

  it('filters Mine tab to show only user challenges by id', async () => {
    render(
      <MemoryRouter>
        <ChallengesPage />
      </MemoryRouter>
    );

    await screen.findAllByText(/Challenges/i);

    // Click My Challenges tab
    const mineTab = screen.getByRole('button', { name: /My Challenges/i });
    fireEvent.click(mineTab);

    await waitFor(() => {
      expect(screen.getByText('Mine Challenge')).toBeInTheDocument();
      expect(screen.queryByText('Active One')).not.toBeInTheDocument();
      expect(screen.queryByText('Completed One')).not.toBeInTheDocument();
    });
  });
});


