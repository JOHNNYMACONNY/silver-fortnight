import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { StreakWidget } from '../components/features/StreakWidget';

jest.mock('../firebase-config', () => ({
  getSyncFirebaseDb: () => ({}),
}));

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: jest.fn(async () => ({ exists: () => true, data: () => ({ currentStreak: 3, longestStreak: 5, lastActivity: { toDate: () => new Date() } }) })),
}));

jest.mock('../services/streakConfig', () => ({
  getStreakMilestoneThresholds: () => [3, 7, 14, 30],
}));

describe('StreakWidget', () => {
  it('renders tooltips and milestone info', async () => {
    render(<StreakWidget userId="u1" type="login" />);
    expect(await screen.findByText('Login Streak')).toBeInTheDocument();
    expect(screen.getByText('Next Milestone')).toBeInTheDocument();
    // Tooltip trigger icon present
    expect(screen.getByLabelText('Streak info')).toBeInTheDocument();
  });
});


