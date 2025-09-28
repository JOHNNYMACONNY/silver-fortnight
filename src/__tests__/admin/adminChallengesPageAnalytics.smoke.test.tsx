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

describe('AdminDashboard analytics smoke test', () => {
  it('renders dashboard stats and displays mocked values', async () => {
    const fe = require('../../services/firestore-exports');

    render(
      <MemoryRouter>
        <AdminDashboard />
      </MemoryRouter>
    );

    // Verify analytics/stats call is made
    await waitFor(() => expect(fe.getSystemStats).toHaveBeenCalled());

    // Smoke-check key UI present
    expect(screen.getByText(/Admin Panel/i)).toBeInTheDocument();

    // Assert that a mocked stat actually renders in the UI
    const totalUsersLabel = await screen.findByText(/Total Users/i);
    const valueEl = totalUsersLabel.parentElement?.querySelector('h3');
    expect(valueEl?.textContent).toBe('0');

    // Additional assertions for other stat cards
    const totalTradesLabel = await screen.findByText(/Total Trades/i);
    const tradesValueEl = totalTradesLabel.parentElement?.querySelector('h3');
    expect(tradesValueEl?.textContent).toBe('0');

    const totalCollabLabel = await screen.findByText(/Total Collaborations/i);
    const collabValueEl = totalCollabLabel.parentElement?.querySelector('h3');
    expect(collabValueEl?.textContent).toBe('0');

    const totalMessagesLabel = await screen.findByText(/Total Messages/i);
    const messagesValueEl = totalMessagesLabel.parentElement?.querySelector('h3');
    expect(messagesValueEl?.textContent).toBe('0');


  });
});

