import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ChallengesPage from '../ChallengesPage';

jest.mock('../../AuthContext', () => ({
  useAuth: () => ({ currentUser: { uid: 'u1' } })
}));

// Mock streaks service
const mockHasPracticedToday = jest.fn(async () => false);
const mockMarkSkillPracticeDay = jest.fn(async () => ({ success: true }));
jest.mock('../../services/streaks', () => ({
  hasPracticedToday: (...args: any[]) => mockHasPracticedToday(...args),
  markSkillPracticeDay: (...args: any[]) => mockMarkSkillPracticeDay(...args),
}));

// Minimal other mocks
jest.mock('../../services/challenges', () => ({
  getChallenges: jest.fn(async () => ({ success: true, challenges: [] })),
  getUserChallenges: jest.fn(async () => ({ success: true, data: [] })),
  onActiveChallenges: (cb: any) => () => {},
  getRecommendedChallenges: jest.fn(async () => ({ success: true, challenges: [] })),
}));

jest.mock('../../contexts/ToastContext', () => ({
  useToast: () => ({ addToast: jest.fn() })
}));

describe('ChallengesPage - Practice indicator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows "Practiced today" after logging practice', async () => {
    render(
      <MemoryRouter>
        <ChallengesPage />
      </MemoryRouter>
    );
    await act(async () => {});

    // Initially not practiced
    expect(screen.queryByText(/Practiced today/i)).not.toBeInTheDocument();

    // Click Log practice
    const btn = screen.getByRole('button', { name: /Log practice/i });
    fireEvent.click(btn);
    // After click, component sets indicator optimistically; assert visible
    await act(async () => {});
    expect(screen.getByText(/Practiced today/i)).toBeInTheDocument();
  });
});


