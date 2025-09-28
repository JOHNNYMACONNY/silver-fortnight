import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ChallengesPage from '../ChallengesPage';

jest.mock('../../AuthContext', () => ({
  useAuth: () => ({ currentUser: { uid: 'u1' } })
}));

jest.mock('../../services/challenges', () => ({
  getChallenges: jest.fn(async () => ({ success: true, challenges: [] })),
  getUserChallenges: jest.fn(async () => ({ success: true, data: [] })),
  onActiveChallenges: (cb: any) => () => {},
  getRecommendedChallenges: jest.fn(async () => ({ success: true, challenges: [] })),
  getFeaturedDaily: jest.fn(async () => ({ id: 'd1', title: 'Daily', rewards: { xp: 50 } })),
  getFeaturedWeekly: jest.fn(async () => ({ id: 'w1', title: 'Weekly', rewards: { xp: 100 } })),
  getDailyChallenges: jest.fn(async () => ({ success: true, challenges: [] })),
  getWeeklyChallenges: jest.fn(async () => ({ success: true, challenges: [] })),
}));
jest.mock('../../contexts/PerformanceContext', () => ({
  useBusinessMetrics: () => ({ track: jest.fn() }),
  PerformanceProvider: ({ children }: any) => children
}));

jest.mock('../../components/ui/PerformanceMonitor', () => () => null);
jest.mock('../../components/ui/AnimatedHeading', () => () => null);

jest.mock('../../services/streaks', () => ({
  hasPracticedToday: jest.fn(async () => false),
  markSkillPracticeDay: jest.fn(async () => ({ success: true }))
}));


jest.mock('../../contexts/ToastContext', () => ({
  useToast: () => ({ addToast: jest.fn() })
}));

describe('ChallengesPage featured chips', () => {
  it('renders Featured today and Featured this week links when available', async () => {
    render(
      <MemoryRouter>
        <ChallengesPage />
      </MemoryRouter>
    );
    const today = await screen.findByText(/Featured today/i, {}, { timeout: 8000 });
    const week = await screen.findByText(/Featured this week/i, {}, { timeout: 8000 });
    expect(today).toBeInTheDocument();
    expect(week).toBeInTheDocument();
  });
});


