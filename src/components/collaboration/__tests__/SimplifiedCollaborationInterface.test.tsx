/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SimplifiedCollaborationInterface } from '../SimplifiedCollaborationInterface';
import { useAuth } from '../../../AuthContext';
import { getCollaborations, createCollaboration } from '../../../services/collaborations';
import { useToast } from '../../../contexts/ToastContext';

// Mock dependencies
jest.mock('../../../AuthContext');
jest.mock('../../../services/collaborations');
jest.mock('../../../contexts/ToastContext');

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockGetCollaborations = getCollaborations as jest.MockedFunction<typeof getCollaborations>;
const mockCreateCollaboration = createCollaboration as jest.MockedFunction<typeof createCollaboration>;
const mockUseToast = useToast as jest.MockedFunction<typeof useToast>;

const mockShowToast = jest.fn();

const mockUser = {
  uid: 'test-user-id',
  email: 'test@example.com',
  displayName: 'Test User',
};

const mockCollaborations = [
  {
    id: 'collab-1',
    title: 'Web Development Project',
    description: 'Building a modern web application',
    status: 'active',
    createdBy: 'test-user-id',
    participants: ['test-user-id', 'user-2'],
    roles: [
      {
        id: 'role-1',
        title: 'Frontend Developer',
        description: 'Develop React components',
        status: 'open',
        skillsRequired: ['React', 'TypeScript'],
      },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'collab-2',
    title: 'Mobile App Design',
    description: 'Designing a mobile application',
    status: 'planning',
    createdBy: 'user-2',
    participants: ['user-2'],
    roles: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

describe('SimplifiedCollaborationInterface', () => {
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

    mockGetCollaborations.mockResolvedValue({
      success: true,
      data: mockCollaborations,
      error: null,
    });
  });

  const renderComponent = (props = {}) => {
    const defaultProps = {
      onCollaborationSelect: jest.fn(),
      onCreateNew: jest.fn(),
    };

    return render(<SimplifiedCollaborationInterface {...defaultProps} {...props} />);
  };

  describe('Component Rendering', () => {
    it('should render collaboration list', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Web Development Project')).toBeInTheDocument();
        expect(screen.getByText('Mobile App Design')).toBeInTheDocument();
      });
    });

    it('should show loading state initially', () => {
      mockGetCollaborations.mockImplementation(() => new Promise(() => {}));
      
      renderComponent();

      expect(screen.getByText(/loading collaborations/i)).toBeInTheDocument();
    });

    it('should display create new collaboration button', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /create new collaboration/i })).toBeInTheDocument();
      });
    });

    it('should show empty state when no collaborations exist', async () => {
      mockGetCollaborations.mockResolvedValue({
        success: true,
        data: [],
        error: null,
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/no collaborations found/i)).toBeInTheDocument();
        expect(screen.getByText(/start your first collaboration/i)).toBeInTheDocument();
      });
    });
  });

  describe('Collaboration Cards', () => {
    it('should display collaboration details', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Web Development Project')).toBeInTheDocument();
        expect(screen.getByText('Building a modern web application')).toBeInTheDocument();
        expect(screen.getByText('Active')).toBeInTheDocument();
        expect(screen.getByText('2 participants')).toBeInTheDocument();
      });
    });

    it('should show role count for each collaboration', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('1 role available')).toBeInTheDocument();
      });
    });

    it('should display status badges correctly', async () => {
      renderComponent();

      await waitFor(() => {
        const activeStatus = screen.getByText('Active');
        const planningStatus = screen.getByText('Planning');
        
        expect(activeStatus).toHaveClass('status-active');
        expect(planningStatus).toHaveClass('status-planning');
      });
    });

    it('should show owner indicator for user-created collaborations', async () => {
      renderComponent();

      await waitFor(() => {
        const ownedCollaboration = screen.getByTestId('collab-collab-1');
        expect(ownedCollaboration).toHaveTextContent('Owner');
      });
    });
  });

  describe('Collaboration Interactions', () => {
    it('should call onCollaborationSelect when collaboration is clicked', async () => {
      const user = userEvent.setup();
      const onCollaborationSelect = jest.fn();
      
      renderComponent({ onCollaborationSelect });

      await waitFor(() => {
        const collaboration = screen.getByTestId('collab-collab-1');
        expect(collaboration).toBeInTheDocument();
      });

      const collaboration = screen.getByTestId('collab-collab-1');
      await user.click(collaboration);

      expect(onCollaborationSelect).toHaveBeenCalledWith('collab-1');
    });

    it('should call onCreateNew when create button is clicked', async () => {
      const user = userEvent.setup();
      const onCreateNew = jest.fn();
      
      renderComponent({ onCreateNew });

      await waitFor(() => {
        const createButton = screen.getByRole('button', { name: /create new collaboration/i });
        expect(createButton).toBeInTheDocument();
      });

      const createButton = screen.getByRole('button', { name: /create new collaboration/i });
      await user.click(createButton);

      expect(onCreateNew).toHaveBeenCalled();
    });

    it('should show quick join button for open roles', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /quick join/i })).toBeInTheDocument();
      });
    });

    it('should handle quick join action', async () => {
      const user = userEvent.setup();
      
      renderComponent();

      await waitFor(() => {
        const quickJoinButton = screen.getByRole('button', { name: /quick join/i });
        expect(quickJoinButton).toBeInTheDocument();
      });

      const quickJoinButton = screen.getByRole('button', { name: /quick join/i });
      await user.click(quickJoinButton);

      // Should show role selection modal or apply directly
      await waitFor(() => {
        expect(screen.getByText(/applying for role/i)).toBeInTheDocument();
      });
    });
  });

  describe('Filtering and Search', () => {
    it('should show filter controls', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/search collaborations/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/filter by status/i)).toBeInTheDocument();
      });
    });

    it('should filter collaborations by search term', async () => {
      const user = userEvent.setup();
      
      renderComponent();

      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText(/search collaborations/i);
        expect(searchInput).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search collaborations/i);
      await user.type(searchInput, 'Web Development');

      await waitFor(() => {
        expect(screen.getByText('Web Development Project')).toBeInTheDocument();
        expect(screen.queryByText('Mobile App Design')).not.toBeInTheDocument();
      });
    });

    it('should filter collaborations by status', async () => {
      const user = userEvent.setup();
      
      renderComponent();

      await waitFor(() => {
        const statusFilter = screen.getByLabelText(/filter by status/i);
        expect(statusFilter).toBeInTheDocument();
      });

      const statusFilter = screen.getByLabelText(/filter by status/i);
      await user.selectOptions(statusFilter, 'active');

      await waitFor(() => {
        expect(screen.getByText('Web Development Project')).toBeInTheDocument();
        expect(screen.queryByText('Mobile App Design')).not.toBeInTheDocument();
      });
    });

    it('should show no results message when filters match nothing', async () => {
      const user = userEvent.setup();
      
      renderComponent();

      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText(/search collaborations/i);
        expect(searchInput).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search collaborations/i);
      await user.type(searchInput, 'nonexistent project');

      await waitFor(() => {
        expect(screen.getByText(/no collaborations match your search/i)).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message when collaborations fail to load', async () => {
      mockGetCollaborations.mockResolvedValue({
        success: false,
        data: null,
        error: new Error('Failed to load collaborations'),
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/failed to load collaborations/i)).toBeInTheDocument();
      });
    });

    it('should show retry button on error', async () => {
      mockGetCollaborations.mockResolvedValue({
        success: false,
        data: null,
        error: new Error('Network error'),
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
      });
    });

    it('should handle retry action', async () => {
      const user = userEvent.setup();
      
      mockGetCollaborations
        .mockResolvedValueOnce({
          success: false,
          data: null,
          error: new Error('Network error'),
        })
        .mockResolvedValueOnce({
          success: true,
          data: mockCollaborations,
          error: null,
        });

      renderComponent();

      await waitFor(() => {
        const retryButton = screen.getByRole('button', { name: /retry/i });
        expect(retryButton).toBeInTheDocument();
      });

      const retryButton = screen.getByRole('button', { name: /retry/i });
      await user.click(retryButton);

      await waitFor(() => {
        expect(screen.getByText('Web Development Project')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels for collaboration cards', async () => {
      renderComponent();

      await waitFor(() => {
        const collaborationCard = screen.getByTestId('collab-collab-1');
        expect(collaborationCard).toHaveAttribute('aria-label', expect.stringContaining('Web Development Project'));
        expect(collaborationCard).toHaveAttribute('role', 'button');
      });
    });

    it('should support keyboard navigation', async () => {
      renderComponent();

      await waitFor(() => {
        const firstCard = screen.getByTestId('collab-collab-1');
        firstCard.focus();
        expect(document.activeElement).toBe(firstCard);
      });

      // Test Tab navigation
      fireEvent.keyDown(document.activeElement!, { key: 'Tab' });
      
      const secondCard = screen.getByTestId('collab-collab-2');
      expect(document.activeElement).toBe(secondCard);
    });

    it('should handle Enter key activation', async () => {
      const onCollaborationSelect = jest.fn();
      
      renderComponent({ onCollaborationSelect });

      await waitFor(() => {
        const collaborationCard = screen.getByTestId('collab-collab-1');
        collaborationCard.focus();
      });

      fireEvent.keyDown(document.activeElement!, { key: 'Enter' });

      expect(onCollaborationSelect).toHaveBeenCalledWith('collab-1');
    });

    it('should announce filter results to screen readers', async () => {
      const user = userEvent.setup();
      
      renderComponent();

      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText(/search collaborations/i);
        expect(searchInput).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search collaborations/i);
      await user.type(searchInput, 'Web');

      await waitFor(() => {
        const announcement = screen.getByRole('status');
        expect(announcement).toHaveTextContent(/1 collaboration found/i);
      });
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
        const container = screen.getByTestId('collaboration-interface');
        expect(container).toHaveClass('mobile-layout');
      });
    });

    it('should show grid layout on larger screens', async () => {
      // Mock desktop viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1200,
      });

      renderComponent();

      await waitFor(() => {
        const container = screen.getByTestId('collaboration-interface');
        expect(container).toHaveClass('grid-layout');
      });
    });

    it('should stack cards vertically on small screens', async () => {
      // Mock small viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 320,
      });

      renderComponent();

      await waitFor(() => {
        const cardContainer = screen.getByTestId('collaboration-cards');
        expect(cardContainer).toHaveClass('stack-layout');
      });
    });
  });

  describe('Performance', () => {
    it('should virtualize long lists of collaborations', async () => {
      // Mock large dataset
      const manyCollaborations = Array.from({ length: 100 }, (_, i) => ({
        ...mockCollaborations[0],
        id: `collab-${i}`,
        title: `Collaboration ${i}`,
      }));

      mockGetCollaborations.mockResolvedValue({
        success: true,
        data: manyCollaborations,
        error: null,
      });

      renderComponent();

      await waitFor(() => {
        // Should only render visible items
        const visibleCards = screen.getAllByTestId(/collab-/);
        expect(visibleCards.length).toBeLessThan(100);
      });
    });

    it('should debounce search input', async () => {
      const user = userEvent.setup();
      
      renderComponent();

      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText(/search collaborations/i);
        expect(searchInput).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search collaborations/i);
      
      // Type rapidly
      await user.type(searchInput, 'test');

      // Should debounce and only filter after delay
      expect(searchInput).toHaveValue('test');
    });
  });
});
