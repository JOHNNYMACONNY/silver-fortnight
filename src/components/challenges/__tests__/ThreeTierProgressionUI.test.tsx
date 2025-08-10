/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThreeTierProgressionUI } from '../ThreeTierProgressionUI';
import { useAuth } from '../../../AuthContext';
import { getThreeTierProgression, unlockNextTier } from '../../../services/threeTierProgression';
import { useToast } from '../../../contexts/ToastContext';

// Mock dependencies
jest.mock('../../../AuthContext');
jest.mock('../../../services/threeTierProgression');
jest.mock('../../../contexts/ToastContext');

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockGetThreeTierProgression = getThreeTierProgression as jest.MockedFunction<typeof getThreeTierProgression>;
const mockUnlockNextTier = unlockNextTier as jest.MockedFunction<typeof unlockNextTier>;
const mockUseToast = useToast as jest.MockedFunction<typeof useToast>;

const mockShowToast = jest.fn();

const mockUser = {
  uid: 'test-user-id',
  email: 'test@example.com',
  displayName: 'Test User',
};

const mockProgressionData = {
  userId: 'test-user-id',
  currentTier: 'solo' as const,
  tiers: {
    solo: {
      unlocked: true,
      completed: false,
      progress: 60,
      challenges: [
        { id: 'solo-1', completed: true, title: 'Basic HTML' },
        { id: 'solo-2', completed: true, title: 'CSS Styling' },
        { id: 'solo-3', completed: false, title: 'JavaScript Basics' },
      ],
    },
    trade: {
      unlocked: false,
      completed: false,
      progress: 0,
      challenges: [],
    },
    collaboration: {
      unlocked: false,
      completed: false,
      progress: 0,
      challenges: [],
    },
  },
  overallProgress: 20,
};

describe('ThreeTierProgressionUI', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUseAuth.mockReturnValue({
      user: mockUser,
      loading: false,
      signOut: jest.fn(),
    });

    mockUseToast.mockReturnValue({
      showToast: mockShowToast,
      removeToast: jest.fn(),
    });

    mockGetThreeTierProgression.mockResolvedValue({
      success: true,
      data: mockProgressionData,
      error: null,
    });
  });

  const renderComponent = (props = {}) => {
    const defaultProps = {
      onTierSelect: jest.fn(),
      onChallengeSelect: jest.fn(),
    };

    return render(<ThreeTierProgressionUI {...defaultProps} {...props} />);
  };

  describe('Component Rendering', () => {
    it('should render all three tiers', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/solo challenges/i)).toBeInTheDocument();
        expect(screen.getByText(/trade challenges/i)).toBeInTheDocument();
        expect(screen.getByText(/collaboration challenges/i)).toBeInTheDocument();
      });
    });

    it('should show loading state initially', () => {
      mockGetThreeTierProgression.mockImplementation(() => new Promise(() => {}));
      
      renderComponent();

      expect(screen.getByText(/loading progression/i)).toBeInTheDocument();
    });

    it('should display overall progress', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/overall progress/i)).toBeInTheDocument();
        expect(screen.getByText('20%')).toBeInTheDocument();
      });
    });

    it('should show current tier indicator', async () => {
      renderComponent();

      await waitFor(() => {
        const soloTier = screen.getByTestId('tier-solo');
        expect(soloTier).toHaveClass('current-tier');
      });
    });
  });

  describe('Tier States', () => {
    it('should show unlocked tier as accessible', async () => {
      renderComponent();

      await waitFor(() => {
        const soloTier = screen.getByTestId('tier-solo');
        expect(soloTier).not.toHaveClass('locked');
        expect(soloTier).toHaveAttribute('aria-disabled', 'false');
      });
    });

    it('should show locked tiers as disabled', async () => {
      renderComponent();

      await waitFor(() => {
        const tradeTier = screen.getByTestId('tier-trade');
        const collaborationTier = screen.getByTestId('tier-collaboration');
        
        expect(tradeTier).toHaveClass('locked');
        expect(collaborationTier).toHaveClass('locked');
        expect(tradeTier).toHaveAttribute('aria-disabled', 'true');
        expect(collaborationTier).toHaveAttribute('aria-disabled', 'true');
      });
    });

    it('should display tier progress correctly', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('60%')).toBeInTheDocument(); // Solo tier progress
      });
    });

    it('should show completed challenges count', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('2/3 completed')).toBeInTheDocument();
      });
    });
  });

  describe('Tier Interactions', () => {
    it('should call onTierSelect when unlocked tier is clicked', async () => {
      const user = userEvent.setup();
      const onTierSelect = jest.fn();
      
      renderComponent({ onTierSelect });

      await waitFor(() => {
        const soloTier = screen.getByTestId('tier-solo');
        expect(soloTier).toBeInTheDocument();
      });

      const soloTier = screen.getByTestId('tier-solo');
      await user.click(soloTier);

      expect(onTierSelect).toHaveBeenCalledWith('solo');
    });

    it('should not call onTierSelect when locked tier is clicked', async () => {
      const user = userEvent.setup();
      const onTierSelect = jest.fn();
      
      renderComponent({ onTierSelect });

      await waitFor(() => {
        const tradeTier = screen.getByTestId('tier-trade');
        expect(tradeTier).toBeInTheDocument();
      });

      const tradeTier = screen.getByTestId('tier-trade');
      await user.click(tradeTier);

      expect(onTierSelect).not.toHaveBeenCalled();
    });

    it('should show unlock button for next available tier', async () => {
      // Mock progression where solo is completed
      const completedSoloProgression = {
        ...mockProgressionData,
        tiers: {
          ...mockProgressionData.tiers,
          solo: {
            ...mockProgressionData.tiers.solo,
            completed: true,
            progress: 100,
          },
        },
      };

      mockGetThreeTierProgression.mockResolvedValue({
        success: true,
        data: completedSoloProgression,
        error: null,
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /unlock trade tier/i })).toBeInTheDocument();
      });
    });

    it('should handle tier unlock', async () => {
      const user = userEvent.setup();
      
      // Mock progression where solo is completed
      const completedSoloProgression = {
        ...mockProgressionData,
        tiers: {
          ...mockProgressionData.tiers,
          solo: {
            ...mockProgressionData.tiers.solo,
            completed: true,
            progress: 100,
          },
        },
      };

      mockGetThreeTierProgression.mockResolvedValue({
        success: true,
        data: completedSoloProgression,
        error: null,
      });

      mockUnlockNextTier.mockResolvedValue({
        success: true,
        data: { unlockedTier: 'trade' },
        error: null,
      });

      renderComponent();

      await waitFor(() => {
        const unlockButton = screen.getByRole('button', { name: /unlock trade tier/i });
        expect(unlockButton).toBeInTheDocument();
      });

      const unlockButton = screen.getByRole('button', { name: /unlock trade tier/i });
      await user.click(unlockButton);

      await waitFor(() => {
        expect(mockUnlockNextTier).toHaveBeenCalledWith('test-user-id', 'trade');
        expect(mockShowToast).toHaveBeenCalledWith('Trade tier unlocked!', 'success');
      });
    });
  });

  describe('Challenge Display', () => {
    it('should display challenges for current tier', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Basic HTML')).toBeInTheDocument();
        expect(screen.getByText('CSS Styling')).toBeInTheDocument();
        expect(screen.getByText('JavaScript Basics')).toBeInTheDocument();
      });
    });

    it('should show completed challenge indicators', async () => {
      renderComponent();

      await waitFor(() => {
        const completedChallenges = screen.getAllByTestId('challenge-completed');
        expect(completedChallenges).toHaveLength(2);
      });
    });

    it('should call onChallengeSelect when challenge is clicked', async () => {
      const user = userEvent.setup();
      const onChallengeSelect = jest.fn();
      
      renderComponent({ onChallengeSelect });

      await waitFor(() => {
        const challenge = screen.getByText('JavaScript Basics');
        expect(challenge).toBeInTheDocument();
      });

      const challenge = screen.getByText('JavaScript Basics');
      await user.click(challenge);

      expect(onChallengeSelect).toHaveBeenCalledWith('solo-3');
    });
  });

  describe('Error Handling', () => {
    it('should display error message when progression data fails to load', async () => {
      mockGetThreeTierProgression.mockResolvedValue({
        success: false,
        data: null,
        error: new Error('Failed to load progression'),
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/failed to load progression/i)).toBeInTheDocument();
      });
    });

    it('should handle unlock tier errors', async () => {
      const user = userEvent.setup();
      
      // Mock progression where solo is completed
      const completedSoloProgression = {
        ...mockProgressionData,
        tiers: {
          ...mockProgressionData.tiers,
          solo: {
            ...mockProgressionData.tiers.solo,
            completed: true,
            progress: 100,
          },
        },
      };

      mockGetThreeTierProgression.mockResolvedValue({
        success: true,
        data: completedSoloProgression,
        error: null,
      });

      mockUnlockNextTier.mockResolvedValue({
        success: false,
        data: null,
        error: new Error('Failed to unlock tier'),
      });

      renderComponent();

      await waitFor(() => {
        const unlockButton = screen.getByRole('button', { name: /unlock trade tier/i });
        expect(unlockButton).toBeInTheDocument();
      });

      const unlockButton = screen.getByRole('button', { name: /unlock trade tier/i });
      await user.click(unlockButton);

      await waitFor(() => {
        expect(mockShowToast).toHaveBeenCalledWith('Failed to unlock tier', 'error');
      });
    });

    it('should show retry button on error', async () => {
      mockGetThreeTierProgression.mockResolvedValue({
        success: false,
        data: null,
        error: new Error('Network error'),
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels for tiers', async () => {
      renderComponent();

      await waitFor(() => {
        const soloTier = screen.getByTestId('tier-solo');
        expect(soloTier).toHaveAttribute('aria-label', expect.stringContaining('Solo tier'));
        expect(soloTier).toHaveAttribute('role', 'button');
      });
    });

    it('should announce tier state changes', async () => {
      const user = userEvent.setup();
      
      // Mock progression where solo is completed
      const completedSoloProgression = {
        ...mockProgressionData,
        tiers: {
          ...mockProgressionData.tiers,
          solo: {
            ...mockProgressionData.tiers.solo,
            completed: true,
            progress: 100,
          },
        },
      };

      mockGetThreeTierProgression.mockResolvedValue({
        success: true,
        data: completedSoloProgression,
        error: null,
      });

      mockUnlockNextTier.mockResolvedValue({
        success: true,
        data: { unlockedTier: 'trade' },
        error: null,
      });

      renderComponent();

      await waitFor(() => {
        const unlockButton = screen.getByRole('button', { name: /unlock trade tier/i });
        expect(unlockButton).toBeInTheDocument();
      });

      const unlockButton = screen.getByRole('button', { name: /unlock trade tier/i });
      await user.click(unlockButton);

      // Check for screen reader announcements
      await waitFor(() => {
        const announcement = screen.getByRole('status');
        expect(announcement).toHaveTextContent(/trade tier unlocked/i);
      });
    });

    it('should support keyboard navigation', async () => {
      renderComponent();

      await waitFor(() => {
        const soloTier = screen.getByTestId('tier-solo');
        soloTier.focus();
        expect(document.activeElement).toBe(soloTier);
      });

      // Test Enter key activation
      fireEvent.keyDown(document.activeElement!, { key: 'Enter' });
      // Should trigger tier selection
    });
  });

  describe('Responsive Design', () => {
    it('should adapt layout for mobile screens', async () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      renderComponent();

      await waitFor(() => {
        const container = screen.getByTestId('progression-container');
        expect(container).toHaveClass('mobile-layout');
      });
    });

    it('should show condensed view on small screens', async () => {
      // Mock small viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 320,
      });

      renderComponent();

      await waitFor(() => {
        // Should show condensed tier cards
        const tierCards = screen.getAllByTestId(/tier-/);
        tierCards.forEach(card => {
          expect(card).toHaveClass('condensed');
        });
      });
    });
  });
});
