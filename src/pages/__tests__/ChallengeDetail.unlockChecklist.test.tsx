import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ChallengeDetailPage from '../ChallengeDetailPage';
import { ToastProvider } from '../../contexts/ToastContext';

jest.mock('../../AuthContext', () => ({
  useAuth: () => ({ currentUser: { uid: 'u1' } })
}));

jest.mock('../../services/challenges', () => ({
  onChallengeSubmissions: () => () => {},
  getChallenge: jest.fn(async (id: string) => ({ success: true, data: { id, title: 'T', type: 'TRADE', rewards: { xp: 100 } } })),
  joinChallenge: jest.fn(async () => ({ success: true })),
  getUserChallengeProgress: jest.fn(async () => ({ success: false }))
}));

jest.mock('../../services/threeTierProgression', () => ({
  getUserThreeTierProgress: jest.fn(async () => ({ success: true, data: { unlockedTiers: ['SOLO'] } }))
}));

describe('ChallengeDetailPage - Unlock checklist', () => {
  it('shows Unlock criteria panel when tier not unlocked', async () => {
    render(
      <ToastProvider>
        <MemoryRouter initialEntries={["/challenges/c1"]}>
          <Routes>
            <Route path="/challenges/:challengeId" element={<ChallengeDetailPage />} />
          </Routes>
        </MemoryRouter>
      </ToastProvider>
    );
    await act(async () => {});
    expect(screen.getByText(/Unlock criteria/i)).toBeInTheDocument();
  });
});



