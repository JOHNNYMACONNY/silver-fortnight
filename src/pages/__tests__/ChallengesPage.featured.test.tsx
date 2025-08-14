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
    await act(async () => {});
    expect(screen.getByText(/Featured today/i)).toBeInTheDocument();
    expect(screen.getByText(/Featured this week/i)).toBeInTheDocument();
  });
});


