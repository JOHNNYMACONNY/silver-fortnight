/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    form: ({ children, ...props }: any) => <form {...props}>{children}</form>,
  },
  AnimatePresence: ({ children }: any) => children,
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Zap: () => <div data-testid="zap-icon" />,
  TrendingUp: () => <div data-testid="trending-up-icon" />,
  Users: () => <div data-testid="users-icon" />,
  Calendar: () => <div data-testid="calendar-icon" />,
  Target: () => <div data-testid="target-icon" />,
  Award: () => <div data-testid="award-icon" />,
}));

// Mock AuthContext
jest.mock('../../../AuthContext', () => ({
  useAuth: jest.fn(),
}));

// Mock services
jest.mock('../../../services/challenges', () => ({
  createChallenge: jest.fn(),
}));

// Import after mocks
import { ChallengeCreationForm } from '../ChallengeCreationForm';
import { useAuth } from '../../../AuthContext';
import { createChallenge } from '../../../services/challenges';

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockCreateChallenge = createChallenge as jest.MockedFunction<typeof createChallenge>;

const mockUser = {
  uid: 'test-user-id',
  email: 'test@example.com',
  displayName: 'Test User',
};

describe('ChallengeCreationForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockUseAuth.mockReturnValue({
      user: mockUser,
      loading: false,
      signOut: jest.fn(),
    });

    mockCreateChallenge.mockResolvedValue({
      success: true,
      data: { id: 'test-challenge-id' },
      error: null,
    });
  });

  const renderComponent = (props = {}) => {
    const defaultProps = {
      onChallengeCreated: jest.fn(),
      onCancel: jest.fn(),
    };

    return render(<ChallengeCreationForm {...defaultProps} {...props} />);
  };

  describe('Form Rendering', () => {
    it('should render all form fields', () => {
      renderComponent();

      expect(screen.getByLabelText(/challenge title/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/difficulty/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/estimated time/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/skills required/i)).toBeInTheDocument();
    });

    it('should render form buttons', () => {
      renderComponent();

      expect(screen.getByRole('button', { name: /create challenge/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('should show loading state when user is not loaded', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: true,
        signOut: jest.fn(),
      });

      renderComponent();

      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should show validation errors for empty required fields', async () => {
      const user = userEvent.setup();
      renderComponent();

      const submitButton = screen.getByRole('button', { name: /create challenge/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/title is required/i)).toBeInTheDocument();
        expect(screen.getByText(/description is required/i)).toBeInTheDocument();
      });
    });

    it('should validate minimum title length', async () => {
      const user = userEvent.setup();
      renderComponent();

      const titleInput = screen.getByLabelText(/challenge title/i);
      await user.type(titleInput, 'ab'); // Too short

      const submitButton = screen.getByRole('button', { name: /create challenge/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/title must be at least 3 characters/i)).toBeInTheDocument();
      });
    });

    it('should validate description length', async () => {
      const user = userEvent.setup();
      renderComponent();

      const descriptionInput = screen.getByLabelText(/description/i);
      await user.type(descriptionInput, 'short'); // Too short

      const submitButton = screen.getByRole('button', { name: /create challenge/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/description must be at least 10 characters/i)).toBeInTheDocument();
      });
    });

    it('should validate skills selection', async () => {
      const user = userEvent.setup();
      renderComponent();

      // Fill required fields but leave skills empty
      await user.type(screen.getByLabelText(/challenge title/i), 'Test Challenge');
      await user.type(screen.getByLabelText(/description/i), 'This is a test challenge description');

      const submitButton = screen.getByRole('button', { name: /create challenge/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/at least one skill is required/i)).toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    const fillValidForm = async (user: any) => {
      await user.type(screen.getByLabelText(/challenge title/i), 'Test Challenge');
      await user.type(screen.getByLabelText(/description/i), 'This is a comprehensive test challenge description');
      
      // Select category
      const categorySelect = screen.getByLabelText(/category/i);
      await user.selectOptions(categorySelect, 'web-development');
      
      // Select difficulty
      const difficultySelect = screen.getByLabelText(/difficulty/i);
      await user.selectOptions(difficultySelect, 'intermediate');
      
      // Set estimated time
      await user.type(screen.getByLabelText(/estimated time/i), '120');
      
      // Add skills
      const skillsInput = screen.getByLabelText(/skills required/i);
      await user.type(skillsInput, 'React, TypeScript');
    };

    it('should submit form with valid data', async () => {
      const user = userEvent.setup();
      const onChallengeCreated = jest.fn();
      
      renderComponent({ onChallengeCreated });

      await fillValidForm(user);

      const submitButton = screen.getByRole('button', { name: /create challenge/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockCreateChallenge).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Test Challenge',
            description: 'This is a comprehensive test challenge description',
            category: 'web-development',
            difficulty: 'intermediate',
            estimatedTimeMinutes: 120,
            skillsRequired: ['React', 'TypeScript'],
            createdBy: mockUser.uid,
          })
        );
      });

      // Verify success behavior
      expect(onChallengeCreated).toHaveBeenCalledWith({ id: 'test-challenge-id' });
    });

    it('should handle submission errors', async () => {
      const user = userEvent.setup();
      
      mockCreateChallenge.mockResolvedValue({
        success: false,
        data: null,
        error: new Error('Failed to create challenge'),
      });

      renderComponent();

      await fillValidForm(user);

      const submitButton = screen.getByRole('button', { name: /create challenge/i });
      await user.click(submitButton);

      await waitFor(() => {
        // Should show error state in UI
        expect(screen.getByText(/error/i)).toBeInTheDocument();
      });
    });

    it('should show loading state during submission', async () => {
      const user = userEvent.setup();
      
      // Make the promise hang to test loading state
      mockCreateChallenge.mockImplementation(() => new Promise(() => {}));

      renderComponent();

      await fillValidForm(user);

      const submitButton = screen.getByRole('button', { name: /create challenge/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/creating challenge/i)).toBeInTheDocument();
        expect(submitButton).toBeDisabled();
      });
    });
  });

  describe('Form Interactions', () => {
    it('should call onCancel when cancel button is clicked', async () => {
      const user = userEvent.setup();
      const onCancel = jest.fn();
      
      renderComponent({ onCancel });

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(onCancel).toHaveBeenCalled();
    });

    it('should reset form when reset button is clicked', async () => {
      const user = userEvent.setup();
      renderComponent();

      // Fill some fields
      await user.type(screen.getByLabelText(/challenge title/i), 'Test Title');
      await user.type(screen.getByLabelText(/description/i), 'Test Description');

      // Find and click reset button (if it exists)
      const resetButton = screen.queryByRole('button', { name: /reset/i });
      if (resetButton) {
        await user.click(resetButton);

        expect(screen.getByLabelText(/challenge title/i)).toHaveValue('');
        expect(screen.getByLabelText(/description/i)).toHaveValue('');
      }
    });

    it('should handle skill tag addition and removal', async () => {
      const user = userEvent.setup();
      renderComponent();

      const skillsInput = screen.getByLabelText(/skills required/i);
      
      // Add skills
      await user.type(skillsInput, 'React{enter}');
      await user.type(skillsInput, 'TypeScript{enter}');

      // Check if skills are displayed as tags
      expect(screen.getByText('React')).toBeInTheDocument();
      expect(screen.getByText('TypeScript')).toBeInTheDocument();

      // Remove a skill tag (if remove buttons exist)
      const removeButtons = screen.queryAllByRole('button', { name: /remove/i });
      if (removeButtons.length > 0) {
        await user.click(removeButtons[0]);
        
        await waitFor(() => {
          expect(screen.queryByText('React')).not.toBeInTheDocument();
        });
      }
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      renderComponent();

      expect(screen.getByLabelText(/challenge title/i)).toHaveAttribute('aria-required', 'true');
      expect(screen.getByLabelText(/description/i)).toHaveAttribute('aria-required', 'true');
    });

    it('should associate error messages with form fields', async () => {
      const user = userEvent.setup();
      renderComponent();

      const submitButton = screen.getByRole('button', { name: /create challenge/i });
      await user.click(submitButton);

      await waitFor(() => {
        const titleInput = screen.getByLabelText(/challenge title/i);
        const errorMessage = screen.getByText(/title is required/i);
        
        expect(titleInput).toHaveAttribute('aria-describedby');
        expect(errorMessage).toHaveAttribute('id');
      });
    });

    it('should support keyboard navigation', async () => {
      renderComponent();

      const titleInput = screen.getByLabelText(/challenge title/i);
      titleInput.focus();

      expect(document.activeElement).toBe(titleInput);

      // Tab to next field
      fireEvent.keyDown(titleInput, { key: 'Tab' });
      
      const descriptionInput = screen.getByLabelText(/description/i);
      expect(document.activeElement).toBe(descriptionInput);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long input values', async () => {
      const user = userEvent.setup();
      renderComponent();

      const longTitle = 'A'.repeat(200);
      const titleInput = screen.getByLabelText(/challenge title/i);
      
      await user.type(titleInput, longTitle);

      // Should truncate or show validation error
      expect(titleInput.value.length).toBeLessThanOrEqual(100);
    });

    it('should handle special characters in input', async () => {
      const user = userEvent.setup();
      renderComponent();

      const titleWithSpecialChars = 'Test Challenge! @#$%^&*()';
      await user.type(screen.getByLabelText(/challenge title/i), titleWithSpecialChars);

      expect(screen.getByLabelText(/challenge title/i)).toHaveValue(titleWithSpecialChars);
    });

    it('should handle network errors gracefully', async () => {
      const user = userEvent.setup();
      
      mockCreateChallenge.mockRejectedValue(new Error('Network error'));

      renderComponent();

      await fillValidForm(user);

      const submitButton = screen.getByRole('button', { name: /create challenge/i });
      await user.click(submitButton);

      await waitFor(() => {
        // Should show error state in UI
        expect(screen.getByText(/error/i)).toBeInTheDocument();
      });
    });
  });
});
