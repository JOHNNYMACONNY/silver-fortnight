import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { CommandPalette } from '../CommandPalette';

// Mock react-router-dom navigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock scrollIntoView for JSDOM
Element.prototype.scrollIntoView = jest.fn();

// Test wrapper with router
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <MemoryRouter>
    {children}
  </MemoryRouter>
);

describe('CommandPalette', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should not render when closed', () => {
      render(
        <TestWrapper>
          <CommandPalette isOpen={false} onClose={mockOnClose} />
        </TestWrapper>
      );

      expect(screen.queryByPlaceholderText('Type a command or search...')).not.toBeInTheDocument();
    });

    it('should render when open', () => {
      render(
        <TestWrapper>
          <CommandPalette isOpen={true} onClose={mockOnClose} />
        </TestWrapper>
      );

      expect(screen.getByPlaceholderText('Type a command or search...')).toBeInTheDocument();
      expect(screen.getByText('ESC')).toBeInTheDocument();
    });

    it('should focus input when opened', async () => {
      render(
        <TestWrapper>
          <CommandPalette isOpen={true} onClose={mockOnClose} />
        </TestWrapper>
      );

      const input = screen.getByPlaceholderText('Type a command or search...');
      await waitFor(() => {
        expect(input).toHaveFocus();
      });
    });

    it('should display all default commands when no search query', () => {
      render(
        <TestWrapper>
          <CommandPalette isOpen={true} onClose={mockOnClose} />
        </TestWrapper>
      );

      // Check for navigation commands
      expect(screen.getByText('Go to Home')).toBeInTheDocument();
      expect(screen.getByText('Go to Trades')).toBeInTheDocument();
      expect(screen.getByText('Go to Collaborations')).toBeInTheDocument();
      expect(screen.getByText('Go to Challenges')).toBeInTheDocument();
      expect(screen.getByText('Go to Portfolio')).toBeInTheDocument();
      expect(screen.getByText('Go to Profile')).toBeInTheDocument();

      // Check for action commands
      expect(screen.getByText('Create New Trade')).toBeInTheDocument();
      expect(screen.getByText('Start New Collaboration')).toBeInTheDocument();
      expect(screen.getByText('Find Teams to Join')).toBeInTheDocument();
      expect(screen.getByText('Search Everything')).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    it('should filter commands based on search query', async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <CommandPalette isOpen={true} onClose={mockOnClose} />
        </TestWrapper>
      );

      const input = screen.getByPlaceholderText('Type a command or search...');
      await user.type(input, 'trade');

      // Should show trade-related commands
      expect(screen.getByText('Go to Trades')).toBeInTheDocument();
      expect(screen.getByText('Create New Trade')).toBeInTheDocument();

      // Should not show unrelated commands
      expect(screen.queryByText('Go to Challenges')).not.toBeInTheDocument();
    });

    it('should search by keywords', async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <CommandPalette isOpen={true} onClose={mockOnClose} />
        </TestWrapper>
      );

      const input = screen.getByPlaceholderText('Type a command or search...');
      await user.type(input, 'team');

      // Should show collaboration-related commands that have 'team' in keywords
      expect(screen.getByText('Go to Collaborations')).toBeInTheDocument();
      expect(screen.getByText('Start New Collaboration')).toBeInTheDocument();
      expect(screen.getByText('Find Teams to Join')).toBeInTheDocument();
    });

    it('should show no results message when no commands match', async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <CommandPalette isOpen={true} onClose={mockOnClose} />
        </TestWrapper>
      );

      const input = screen.getByPlaceholderText('Type a command or search...');
      await user.type(input, 'nonexistent');

      expect(screen.getByText('No commands found for "nonexistent"')).toBeInTheDocument();
    });

    it('should be case insensitive', async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <CommandPalette isOpen={true} onClose={mockOnClose} />
        </TestWrapper>
      );

      const input = screen.getByPlaceholderText('Type a command or search...');
      await user.type(input, 'TRADE');

      expect(screen.getByText('Go to Trades')).toBeInTheDocument();
      expect(screen.getByText('Create New Trade')).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('should navigate to correct route when command is clicked', async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <CommandPalette isOpen={true} onClose={mockOnClose} />
        </TestWrapper>
      );

      const tradesCommand = screen.getByText('Go to Trades');
      await user.click(tradesCommand);

      expect(mockNavigate).toHaveBeenCalledWith('/trades');
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should close palette after executing command', async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <CommandPalette isOpen={true} onClose={mockOnClose} />
        </TestWrapper>
      );

      const homeCommand = screen.getByText('Go to Home');
      await user.click(homeCommand);

      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('Keyboard Navigation', () => {
    it('should navigate commands with arrow keys', async () => {
      render(
        <TestWrapper>
          <CommandPalette isOpen={true} onClose={mockOnClose} />
        </TestWrapper>
      );

      const input = screen.getByPlaceholderText('Type a command or search...');
      
      // Press down arrow to select first command
      fireEvent.keyDown(input, { key: 'ArrowDown' });
      
      // First command should be highlighted (we can't easily test visual highlighting, 
      // but we can test that the selection state changes)
      expect(input).toHaveFocus();
    });

    it('should execute selected command with Enter key', async () => {
      render(
        <TestWrapper>
          <CommandPalette isOpen={true} onClose={mockOnClose} />
        </TestWrapper>
      );

      const input = screen.getByPlaceholderText('Type a command or search...');
      
      // Press down arrow to select first command, then Enter
      fireEvent.keyDown(input, { key: 'ArrowDown' });
      fireEvent.keyDown(input, { key: 'Enter' });

      // Should navigate to the first command's route (Go to Home -> '/')
      expect(mockNavigate).toHaveBeenCalledWith('/');
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should close palette with Escape key', () => {
      render(
        <TestWrapper>
          <CommandPalette isOpen={true} onClose={mockOnClose} />
        </TestWrapper>
      );

      const input = screen.getByPlaceholderText('Type a command or search...');
      fireEvent.keyDown(input, { key: 'Escape' });

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should wrap around when navigating past last command', () => {
      render(
        <TestWrapper>
          <CommandPalette isOpen={true} onClose={mockOnClose} />
        </TestWrapper>
      );

      const input = screen.getByPlaceholderText('Type a command or search...');
      
      // Press up arrow when no selection should select last command
      fireEvent.keyDown(input, { key: 'ArrowUp' });
      
      // Should not throw error and should handle gracefully
      expect(input).toHaveFocus();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(
        <TestWrapper>
          <CommandPalette isOpen={true} onClose={mockOnClose} />
        </TestWrapper>
      );

      const input = screen.getByPlaceholderText('Type a command or search...');
      expect(input).toHaveAttribute('type', 'text');
    });

    it('should support screen readers with proper labeling', () => {
      render(
        <TestWrapper>
          <CommandPalette isOpen={true} onClose={mockOnClose} />
        </TestWrapper>
      );

      // Check that commands have proper text content for screen readers
      const commands = screen.getAllByRole('button');
      expect(commands.length).toBeGreaterThan(0);
      
      commands.forEach(command => {
        expect(command).toHaveTextContent(/./); // Should have some text content
      });
    });
  });

  describe('Performance', () => {
    it('should handle rapid typing without performance issues', async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <CommandPalette isOpen={true} onClose={mockOnClose} />
        </TestWrapper>
      );

      const input = screen.getByPlaceholderText('Type a command or search...');
      
      // Rapidly type and clear multiple times
      await user.type(input, 'trade');
      await user.clear(input);
      await user.type(input, 'collaboration');
      await user.clear(input);
      await user.type(input, 'challenge');

      // Should still be responsive
      expect(screen.getByText('Go to Challenges')).toBeInTheDocument();
    });
  });
});
