/**
 * Comprehensive test suite for ChallengeDetailPage
 * Tests accessibility, functionality, and user interactions
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ChallengeDetailPage } from '../ChallengeDetailPage';
import { useAuth } from '../../AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { onChallengeSubmissions, getChallenge, joinChallenge, getUserChallengeProgress } from '../../services/challenges';
import { getUserThreeTierProgress } from '../../services/threeTierProgression';

// Mock dependencies
jest.mock('../../AuthContext');
jest.mock('../../contexts/ToastContext');
jest.mock('../../services/challenges');
jest.mock('../../services/threeTierProgression');
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({ challengeId: 'test-challenge-id' }),
}));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockUseToast = useToast as jest.MockedFunction<typeof useToast>;
const mockGetChallenge = getChallenge as jest.MockedFunction<typeof getChallenge>;
const mockJoinChallenge = joinChallenge as jest.MockedFunction<typeof joinChallenge>;
const mockGetUserChallengeProgress = getUserChallengeProgress as jest.MockedFunction<typeof getUserChallengeProgress>;
const mockGetUserThreeTierProgress = getUserThreeTierProgress as jest.MockedFunction<typeof getUserThreeTierProgress>;
const mockOnChallengeSubmissions = onChallengeSubmissions as jest.MockedFunction<typeof onChallengeSubmissions>;

// Mock challenge data
const mockChallenge = {
  id: 'test-challenge-id',
  title: 'Test Challenge',
  description: 'This is a test challenge description',
  difficulty: 'intermediate',
  status: 'OPEN',
  endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
  rewards: {
    points: 100,
    badges: ['test-badge']
  },
  requirements: {
    minLevel: 1,
    maxParticipants: 100
  }
};

const mockUser = {
  uid: 'test-user-id',
  email: 'test@example.com',
  displayName: 'Test User'
};

const mockSubmissions = [
  {
    id: 'submission-1',
    userId: 'user-1',
    challengeId: 'test-challenge-id',
    submittedAt: { toDate: () => new Date() },
    embeddedEvidence: []
  }
];

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('ChallengeDetailPage', () => {
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Setup default mock implementations
    mockUseAuth.mockReturnValue({
      currentUser: mockUser,
      loading: false,
      signIn: jest.fn(),
      signOut: jest.fn(),
      signUp: jest.fn()
    });

    mockUseToast.mockReturnValue({
      addToast: jest.fn(),
      removeToast: jest.fn(),
      toasts: []
    });

    mockGetChallenge.mockResolvedValue({
      success: true,
      data: mockChallenge
    });

    mockGetUserChallengeProgress.mockResolvedValue({
      success: true,
      progressPercentage: 0
    });

    mockGetUserThreeTierProgress.mockResolvedValue({
      success: true,
      data: {
        currentTier: 1,
        progress: 50
      }
    });

    mockOnChallengeSubmissions.mockReturnValue(() => {});
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels and roles', async () => {
      // Mock user as NOT participating initially
      mockGetUserChallengeProgress.mockResolvedValue({
        success: false,
        progressPercentage: 0
      });
      
      renderWithRouter(<ChallengeDetailPage />);
      
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
        expect(screen.getByLabelText('Challenge details page')).toBeInTheDocument();
        expect(screen.getByRole('navigation')).toBeInTheDocument();
      });
    });

    it('should have proper heading structure', async () => {
      // Mock user as NOT participating initially
      mockGetUserChallengeProgress.mockResolvedValue({
        success: false,
        progressPercentage: 0
      });
      
      renderWithRouter(<ChallengeDetailPage />);
      
      await waitFor(() => {
        const headings = screen.getAllByRole('heading', { level: 3 });
        expect(headings.length).toBeGreaterThan(0);
        const title = headings.find(h => h.textContent === 'Test Challenge');
        expect(title).toBeInTheDocument();
      });
    });

    it('should support keyboard navigation', async () => {
      // Mock user as NOT participating initially
      mockGetUserChallengeProgress.mockResolvedValue({
        success: false,
        progressPercentage: 0
      });
      
      renderWithRouter(<ChallengeDetailPage />);
      
      await waitFor(() => {
        const participateButton = screen.getByRole('button', { name: /join challenge/i });
        participateButton.focus();
        expect(participateButton).toHaveFocus();
      });
    });

    it('should have proper ARIA labels for interactive elements', async () => {
      // Mock user as NOT participating initially
      mockGetUserChallengeProgress.mockResolvedValue({
        success: false,
        progressPercentage: 0
      });
      
      renderWithRouter(<ChallengeDetailPage />);
      
      await waitFor(() => {
        expect(screen.getByLabelText('Difficulty level: Intermediate')).toBeInTheDocument();
        expect(screen.getByLabelText('Status: OPEN')).toBeInTheDocument();
        expect(screen.getByLabelText('Join challenge')).toBeInTheDocument();
      });
    });

    it('should announce dynamic content updates', async () => {
      renderWithRouter(<ChallengeDetailPage />);
      
      await waitFor(() => {
        const liveRegion = document.getElementById('challenge-updates');
        expect(liveRegion).toBeInTheDocument();
        expect(liveRegion).toHaveAttribute('aria-live', 'polite');
      });
    });
  });

  describe('User Interactions', () => {
    it('should handle participation correctly', async () => {
      // Mock user as NOT participating initially
      mockGetUserChallengeProgress.mockResolvedValue({
        success: false,
        progressPercentage: 0
      });
      
      mockJoinChallenge.mockResolvedValue({
        success: true
      });

      renderWithRouter(<ChallengeDetailPage />);
      
      // Wait for the challenge to load first
      await waitFor(() => {
        expect(screen.getByText('Test Challenge')).toBeInTheDocument();
      });
      
      await waitFor(() => {
        const participateButton = screen.getByRole('button', { name: /join challenge/i });
        fireEvent.click(participateButton);
      });

      expect(mockJoinChallenge).toHaveBeenCalledWith('test-challenge-id', 'test-user-id');
    });

    it('should handle participation errors', async () => {
      // Mock user as NOT participating initially
      mockGetUserChallengeProgress.mockResolvedValue({
        success: false,
        progressPercentage: 0
      });
      
      mockJoinChallenge.mockResolvedValue({
        success: false,
        error: 'Failed to join challenge'
      });

      const mockAddToast = jest.fn();
      mockUseToast.mockReturnValue({
        addToast: mockAddToast,
        removeToast: jest.fn(),
        toasts: []
      });

      renderWithRouter(<ChallengeDetailPage />);
      
      // Wait for the challenge to load first
      await waitFor(() => {
        expect(screen.getByText('Test Challenge')).toBeInTheDocument();
      });
      
      await waitFor(() => {
        const participateButton = screen.getByRole('button', { name: /join challenge/i });
        fireEvent.click(participateButton);
      });

      expect(mockAddToast).toHaveBeenCalledWith('error', 'Failed to join challenge');
    });

    it('should disable participation when user is not logged in', async () => {
      mockUseAuth.mockReturnValue({
        currentUser: null,
        loading: false,
        signIn: jest.fn(),
        signOut: jest.fn(),
        signUp: jest.fn()
      });

      renderWithRouter(<ChallengeDetailPage />);
      
      // Wait for the challenge to load first
      await waitFor(() => {
        expect(screen.getByText('Test Challenge')).toBeInTheDocument();
      });
      
      await waitFor(() => {
        const participateButton = screen.getByRole('button', { name: /join challenge/i });
        fireEvent.click(participateButton);
      });

      expect(mockJoinChallenge).not.toHaveBeenCalled();
    });

    it('should handle keyboard events for participation', async () => {
      // Mock user as NOT participating initially
      mockGetUserChallengeProgress.mockResolvedValue({
        success: false,
        progressPercentage: 0
      });
      
      mockJoinChallenge.mockResolvedValue({
        success: true
      });

      renderWithRouter(<ChallengeDetailPage />);
      
      // Wait for the challenge to load first
      await waitFor(() => {
        expect(screen.getByText('Test Challenge')).toBeInTheDocument();
      });
      
      await waitFor(() => {
        const participateButton = screen.getByRole('button', { name: /join challenge/i });
        fireEvent.keyDown(participateButton, { key: 'Enter' });
      });

      expect(mockJoinChallenge).toHaveBeenCalled();
    });
  });

  describe('Loading States', () => {
    it('should show loading spinner while fetching challenge', () => {
      mockGetChallenge.mockImplementation(() => new Promise(() => {})); // Never resolves
      
      renderWithRouter(<ChallengeDetailPage />);
      
      expect(screen.getByText('Loading challenge details...')).toBeInTheDocument();
    });

    it('should show error message when challenge fetch fails', async () => {
      mockGetChallenge.mockResolvedValue({
        success: false,
        error: 'Challenge not found'
      });

      renderWithRouter(<ChallengeDetailPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Challenge not found')).toBeInTheDocument();
      });
    });
  });

  describe('Challenge Information Display', () => {
    it('should display challenge title and description', async () => {
      renderWithRouter(<ChallengeDetailPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Test Challenge')).toBeInTheDocument();
        expect(screen.getByText('This is a test challenge description')).toBeInTheDocument();
      });
    });

    it('should display difficulty and status badges', async () => {
      renderWithRouter(<ChallengeDetailPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Intermediate')).toBeInTheDocument();
        expect(screen.getByText('OPEN')).toBeInTheDocument();
      });
    });

    it('should display time remaining for active challenges', async () => {
      renderWithRouter(<ChallengeDetailPage />);
      
      await waitFor(() => {
        // Check if time remaining is displayed (format may vary)
        expect(screen.getAllByText(/left|remaining|days|hours/i)).toHaveLength(2);
      });
    });
  });

  describe('Responsive Design', () => {
    it('should be responsive on different screen sizes', async () => {
      renderWithRouter(<ChallengeDetailPage />);
      
      await waitFor(() => {
        const mainContainer = screen.getByRole('main');
        expect(mainContainer).toHaveClass('max-w-7xl', 'mx-auto');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      mockGetChallenge.mockRejectedValue(new Error('Network error'));

      renderWithRouter(<ChallengeDetailPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
    });

    it('should handle missing challenge data', async () => {
      mockGetChallenge.mockResolvedValue({
        success: true,
        data: null
      });

      renderWithRouter(<ChallengeDetailPage />);
      
      await waitFor(() => {
        expect(screen.getByText(/Challenge not found|Failed to fetch challenge/)).toBeInTheDocument();
      });
    });
  });
});
