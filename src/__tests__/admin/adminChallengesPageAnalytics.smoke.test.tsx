import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import AdminDashboard from '../../pages/admin/AdminDashboard';

// Mock problematic ESM util to avoid import.meta in Jest
jest.mock('../../utils/imageUtils', () => ({ getProfileImageUrl: () => '' }));

jest.mock('../../AuthContext', () => ({
  useAuth: () => ({ userProfile: { id: 'admin1', role: 'admin', email: 'a@b.com' } })
}));

jest.mock('../../contexts/ToastContext', () => ({
  useToast: () => ({ addToast: jest.fn() })
}));

jest.mock('../../services/firestore-exports', () => ({
  getSystemStats: jest.fn(async () => ({
    data: { totalUsers: 0, totalTrades: 0, totalCollaborations: 0, totalMessages: 0 },
    error: null
  })),
  getAllUsers: jest.fn(async () => ({ data: { items: [] }, error: null })),
  getAllTrades: jest.fn(async () => ({ data: { items: [] }, error: null })),
  getAllCollaborations: jest.fn(async () => ({ data: { items: [] }, error: null })),
  updateUserRole: jest.fn(async () => ({ error: null })),
  deleteUser: jest.fn(async () => ({ error: null }))
}));

jest.mock('../../services/adminGamificationMetrics', () => ({
  getGamificationMetrics7d: jest.fn(async () => ({
    data: {
      totalXP: 0,
      totalAchievements: 0,
      streakMilestones: 0,
      uniqueRecipients: 0,
      perDay: {
        xpAwardsByDate: {},
        achievementsByDate: {},
        streakMilestonesByDate: {}
      }
    },
    error: null
  }))
}));

describe('AdminDashboard analytics smoke test', () => {
  it.skip('renders dashboard stats and displays mocked values', async () => {
    const fe = require('../../services/firestore-exports');

    render(
      <MemoryRouter>
        <AdminDashboard />
      </MemoryRouter>
    );

    // Smoke-check key UI present
    expect(screen.getByText(/Admin Panel/i)).toBeInTheDocument();

    // Wait for stats to load (loading spinner to disappear)
    await waitFor(() => {
      const spinners = screen.queryAllByRole('status', { hidden: true });
      const loadingDivs = document.querySelectorAll('.animate-spin');
      expect(loadingDivs.length).toBe(0);
    }, { timeout: 5000 });

    // Verify analytics/stats call was made
    expect(fe.getSystemStats).toHaveBeenCalled();

    // Assert that mocked stats render in the UI
    const totalUsersLabel = screen.getByText(/Total Users/i);
    const valueEl = totalUsersLabel.parentElement?.querySelector('h3');
    expect(valueEl?.textContent).toBe('0');

    // Additional assertions for other stat cards
    const totalTradesLabel = screen.getByText(/Total Trades/i);
    const tradesValueEl = totalTradesLabel.parentElement?.querySelector('h3');
    expect(tradesValueEl?.textContent).toBe('0');

    const totalCollabLabel = screen.getByText(/Total Collaborations/i);
    const collabValueEl = totalCollabLabel.parentElement?.querySelector('h3');
    expect(collabValueEl?.textContent).toBe('0');

    const totalMessagesLabel = screen.getByText(/Total Messages/i);
    const messagesValueEl = totalMessagesLabel.parentElement?.querySelector('h3');
    expect(messagesValueEl?.textContent).toBe('0');
  });
});

