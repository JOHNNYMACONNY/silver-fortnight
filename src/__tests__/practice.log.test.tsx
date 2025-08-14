import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ChallengesPage } from '../pages/ChallengesPage';

jest.mock('../AuthContext', () => ({
  useAuth: () => ({ currentUser: { uid: 'u1' } }),
}));

jest.mock('../services/challenges', () => ({
  getChallenges: async () => ({ success: true, challenges: [] }),
  getUserChallenges: async () => ({ success: true, challenges: [] }),
  onActiveChallenges: (cb: any) => { cb([]); return () => {}; },
  getRecommendedChallenges: async () => ({ success: true, challenges: [] }),
}));

const markSkillPracticeDayMock = jest.fn(async () => ({}));
jest.mock('../services/streaks', () => ({
  markSkillPracticeDay: (...args: any[]) => markSkillPracticeDayMock(...args),
}));

jest.mock('../contexts/ToastContext', () => ({
  useToast: () => ({ addToast: jest.fn() }),
}));

describe('ChallengesPage daily practice quick action', () => {
  it('calls markSkillPracticeDay when clicking Log practice', async () => {
    render(<ChallengesPage />);
    const btn = await screen.findByRole('button', { name: /Log practice/i });
    fireEvent.click(btn);
    expect(markSkillPracticeDayMock).toHaveBeenCalledWith('u1');
  });
});


