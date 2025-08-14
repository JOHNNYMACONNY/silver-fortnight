import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// Mocks
jest.mock('../contexts/PerformanceContext', () => ({
  useBusinessMetrics: () => ({ track: jest.fn() })
}));

jest.mock('../services/challenges', () => ({
  getDailyChallenges: jest.fn().mockResolvedValue({ success: true, challenges: [
    { id: 'd1', title: 'Daily A', description: '', type: 'daily', category: 'development', difficulty: 'beginner', requirements: [], rewards: { xp: 10 }, startDate: new Date(), endDate: new Date(), status: 'active', participantCount: 0, completionCount: 0, instructions: [], objectives: [], createdBy: 'sys', createdAt: new Date(), updatedAt: new Date() },
  ], total: 1, hasMore: false }),
  getWeeklyChallenges: jest.fn().mockResolvedValue({ success: true, challenges: [
    { id: 'w1', title: 'Weekly A', description: '', type: 'weekly', category: 'development', difficulty: 'beginner', requirements: [], rewards: { xp: 50 }, startDate: new Date(), endDate: new Date(), status: 'active', participantCount: 0, completionCount: 0, instructions: [], objectives: [], createdBy: 'sys', createdAt: new Date(), updatedAt: new Date() },
  ], total: 1, hasMore: false }),
}));

import ChallengeCalendarPage from '../pages/ChallengeCalendarPage';

describe('ChallengeCalendarPage', () => {
  it('renders daily and weekly sections and items', async () => {
    render(
      <MemoryRouter>
        <ChallengeCalendarPage />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText(/Challenge Calendar/i)).toBeInTheDocument());

    expect(screen.getByText(/Daily/i)).toBeInTheDocument();
    expect(screen.getByText(/Weekly/i)).toBeInTheDocument();
    expect(screen.getByText(/Daily A/i)).toBeInTheDocument();
    expect(screen.getByText(/Weekly A/i)).toBeInTheDocument();
  });
});


