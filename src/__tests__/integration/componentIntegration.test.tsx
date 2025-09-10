/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';

// Mock framer-motion
jest.mock('framer-motion', () => {
  const React = require('react');
  return {
    motion: {
      div: ({ children, ...props }: any) => React.createElement('div', props, children),
      form: ({ children, ...props }: any) => React.createElement('form', props, children),
      section: ({ children, ...props }: any) => React.createElement('section', props, children),
    },
    AnimatePresence: ({ children }: any) => children,
  };
});

// Mock Firebase
jest.mock('../../firebase-config', () => ({
  db: {},
  auth: {
    currentUser: { uid: 'test-user-id', email: 'test@example.com' }
  }
}));

// Mock services
jest.mock('../../services/challenges', () => ({
  createChallenge: jest.fn(),
  getThreeTierProgression: jest.fn(),
  updateChallengeProgress: jest.fn(),
}));

jest.mock('../../services/collaboration', () => ({
  getCollaborations: jest.fn(),
  createCollaboration: jest.fn(),
  updateCollaborationStatus: jest.fn(),
}));

jest.mock('../../services/trades', () => ({
  getTrades: jest.fn(),
  createTrade: jest.fn(),
  updateTradeStatus: jest.fn(),
}));

// Mock AuthContext
jest.mock('../../AuthContext', () => ({
  useAuth: jest.fn(),
  AuthProvider: ({ children }: any) => children,
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => {
  const React = require('react');
  return {
    Zap: () => React.createElement('div', { 'data-testid': 'zap-icon' }),
    TrendingUp: () => React.createElement('div', { 'data-testid': 'trending-up-icon' }),
    Users: () => React.createElement('div', { 'data-testid': 'users-icon' }),
    Calendar: () => React.createElement('div', { 'data-testid': 'calendar-icon' }),
    Target: () => React.createElement('div', { 'data-testid': 'target-icon' }),
    Award: () => React.createElement('div', { 'data-testid': 'award-icon' }),
    Search: () => React.createElement('div', { 'data-testid': 'search-icon' }),
    Filter: () => React.createElement('div', { 'data-testid': 'filter-icon' }),
    Plus: () => React.createElement('div', { 'data-testid': 'plus-icon' }),
    X: () => React.createElement('div', { 'data-testid': 'x-icon' }),
  };
});

// Import components after mocks
import { ChallengeCreationForm } from '../../components/challenges/ChallengeCreationForm';
import { ThreeTierProgressionUI } from '../../components/challenges/ThreeTierProgressionUI';
import { SimplifiedCollaborationInterface } from '../../components/collaboration/SimplifiedCollaborationInterface';
import { useAuth } from '../../AuthContext';
import { createChallenge } from '../../services/challenges';
import { getCollaborations } from '../../services/collaboration';

// Retrieve mocked-only export safely (avoids TS error if module isn't typed to export it)
const mockChallenges = jest.requireMock('../../services/challenges') as Record<string, jest.Mock>;
const getThreeTierProgression = (mockChallenges.getThreeTierProgression ?? jest.fn()) as jest.Mock;

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockCreateChallenge = createChallenge as jest.MockedFunction<any>;
const mockGetThreeTierProgression = getThreeTierProgression as jest.MockedFunction<any>;
const mockGetCollaborations = getCollaborations as jest.MockedFunction<typeof getCollaborations>;

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>
    {children}
  </BrowserRouter>
);

describe('Component Integration Tests', () => {
  const mockUser = {
    uid: 'test-user-id',
    email: 'test@example.com',
    displayName: 'Test User',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUseAuth.mockReturnValue({
      user: mockUser,
      loading: false,
      signOut: jest.fn(),
    });
  });

  describe('Challenge System Integration', () => {
    it('should integrate challenge creation with progression tracking', async () => {
      const user = userEvent.setup();
      
      // Mock successful challenge creation
      mockCreateChallenge.mockResolvedValue({
        success: true,
        data: { id: 'new-challenge-id' },
        error: null,
      });

      // Mock progression data
      mockGetThreeTierProgression.mockResolvedValue({
        success: true,
        data: {
          currentTier: 'solo',
          soloTier: { unlocked: true, completed: 2, total: 5 },
          tradeTier: { unlocked: false, completed: 0, total: 3 },
          collaborationTier: { unlocked: false, completed: 0, total: 2 },
          overallProgress: 20,
        },
        error: null,
      });

      const onSubmit = jest.fn();

      render(
        <TestWrapper>
          <div>
            <ChallengeCreationForm onSubmit={onSubmit} />
            <ThreeTierProgressionUI />
          </div>
        </TestWrapper>
      );

      // Fill out challenge creation form
      const titleInput = screen.getByLabelText(/title/i);
      const descriptionInput = screen.getByLabelText(/description/i);
      const submitButton = screen.getByRole('button', { name: /create challenge/i });

      await user.type(titleInput, 'Integration Test Challenge');
      await user.type(descriptionInput, 'A challenge created during integration testing');
      
      // Submit the form
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockCreateChallenge).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Integration Test Challenge',
            description: 'A challenge created during integration testing',
          })
        );
      });

      // Verify progression UI updates
      await waitFor(() => {
        expect(mockGetThreeTierProgression).toHaveBeenCalled();
        expect(screen.getByText(/solo tier/i)).toBeInTheDocument();
      });
    });

    it('should handle challenge creation errors gracefully', async () => {
      const user = userEvent.setup();
      
      // Mock failed challenge creation
      mockCreateChallenge.mockResolvedValue({
        success: false,
        data: null,
        error: 'Failed to create challenge',
      });

      const onSubmit = jest.fn();

      render(
        <TestWrapper>
          <ChallengeCreationForm onSubmit={onSubmit} />
        </TestWrapper>
      );

      const titleInput = screen.getByLabelText(/title/i);
      const submitButton = screen.getByRole('button', { name: /create challenge/i });

      await user.type(titleInput, 'Test Challenge');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockCreateChallenge).toHaveBeenCalled();
        // Should show error state in UI
        expect(screen.getByText(/error/i)).toBeInTheDocument();
      });
    });
  });

  describe('Collaboration System Integration', () => {
    it('should integrate collaboration interface with data fetching', async () => {
      const user = userEvent.setup();
      
      // Mock collaboration data
      mockGetCollaborations.mockResolvedValue({
        success: true,
        data: [
          {
            id: 'collab-1',
            title: 'Web Development Project',
            description: 'Building a modern web application',
            status: 'active',
            participants: ['user-1', 'user-2'],
            createdAt: new Date(),
          },
          {
            id: 'collab-2',
            title: 'Design System Creation',
            description: 'Creating a comprehensive design system',
            status: 'pending',
            participants: ['user-3'],
            createdAt: new Date(),
          },
        ],
        error: null,
      });

      render(
        <TestWrapper>
          <SimplifiedCollaborationInterface />
        </TestWrapper>
      );

      // Wait for data to load
      await waitFor(() => {
        expect(mockGetCollaborations).toHaveBeenCalled();
        expect(screen.getByText('Web Development Project')).toBeInTheDocument();
        expect(screen.getByText('Design System Creation')).toBeInTheDocument();
      });

      // Test search functionality
      const searchInput = screen.getByPlaceholderText(/search/i);
      await user.type(searchInput, 'Web Development');

      await waitFor(() => {
        expect(screen.getByText('Web Development Project')).toBeInTheDocument();
        // Design System should be filtered out
        expect(screen.queryByText('Design System Creation')).not.toBeInTheDocument();
      });
    });

    it('should handle collaboration data loading errors', async () => {
      // Mock failed data fetching
      mockGetCollaborations.mockResolvedValue({
        success: false,
        data: null,
        error: 'Failed to load collaborations',
      });

      render(
        <TestWrapper>
          <SimplifiedCollaborationInterface />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockGetCollaborations).toHaveBeenCalled();
        // Should show error state
        expect(screen.getByText(/error/i)).toBeInTheDocument();
      });
    });
  });

  describe('Cross-Component Communication', () => {
    it('should handle authentication state changes across components', async () => {
      // Start with authenticated user
      mockUseAuth.mockReturnValue({
        user: mockUser,
        loading: false,
        signOut: jest.fn(),
      });

      const { rerender } = render(
        <TestWrapper>
          <div>
            <ChallengeCreationForm onSubmit={jest.fn()} />
            <SimplifiedCollaborationInterface />
          </div>
        </TestWrapper>
      );

      // Verify components render for authenticated user
      expect(screen.getByRole('button', { name: /create challenge/i })).toBeInTheDocument();

      // Simulate user logout
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
        signOut: jest.fn(),
      });

      rerender(
        <TestWrapper>
          <div>
            <ChallengeCreationForm onSubmit={jest.fn()} />
            <SimplifiedCollaborationInterface />
          </div>
        </TestWrapper>
      );

      // Components should handle unauthenticated state
      await waitFor(() => {
        // Should show authentication required state or redirect
        expect(screen.queryByRole('button', { name: /create challenge/i })).not.toBeInTheDocument();
      });
    });
  });

  describe('Error Boundary Integration', () => {
    it('should handle component errors gracefully', async () => {
      // Mock component error
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // Force an error in the challenge creation component
      mockCreateChallenge.mockRejectedValue(new Error('Network error'));

      const user = userEvent.setup();

      render(
        <TestWrapper>
          <ChallengeCreationForm onSubmit={jest.fn()} />
        </TestWrapper>
      );

      const titleInput = screen.getByLabelText(/title/i);
      const submitButton = screen.getByRole('button', { name: /create challenge/i });

      await user.type(titleInput, 'Test Challenge');
      await user.click(submitButton);

      await waitFor(() => {
        // Should handle error gracefully without crashing
        expect(screen.getByText(/error/i)).toBeInTheDocument();
      });

      consoleSpy.mockRestore();
    });
  });
});
