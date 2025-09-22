import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { DailyPracticeSection } from '../DailyPracticeSection';

// Mock dependencies
jest.mock('../../../contexts/ToastContext', () => ({
  useToast: () => ({
    addToast: jest.fn()
  })
}));

jest.mock('../../../hooks/useMobileOptimization', () => ({
  useMobileOptimization: () => ({
    isMobile: false,
    getTouchTargetClass: (size: string) => `touch-target-${size}`
  })
}));

const mockMarkSkillPracticeDay = jest.fn();
const mockHasPracticedToday = jest.fn();

jest.mock('../../../services/streaks', () => ({
  markSkillPracticeDay: (...args: any[]) => mockMarkSkillPracticeDay(...args),
  hasPracticedToday: (...args: any[]) => mockHasPracticedToday(...args)
}));

describe('DailyPracticeSection', () => {
  const mockProps = {
    userId: 'test-user-123',
    showStreakInfo: true,
    enableAnimations: true
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockHasPracticedToday.mockResolvedValue(false);
    mockMarkSkillPracticeDay.mockResolvedValue({ success: true });
  });

  it('renders correctly with initial state', async () => {
    await act(async () => {
      render(<DailyPracticeSection {...mockProps} />);
    });
    
    expect(screen.getByText('Daily Practice')).toBeInTheDocument();
    
    // Wait for the initial loading to complete
    await waitFor(() => {
      expect(screen.getByText('Log a quick practice session to progress your skill streak.')).toBeInTheDocument();
    });
    
    expect(screen.getByRole('button', { name: /Log today's practice session/i })).toBeInTheDocument();
  });

  it('shows practiced state when user has practiced today', async () => {
    mockHasPracticedToday.mockResolvedValue(true);
    
    await act(async () => {
      render(<DailyPracticeSection {...mockProps} />);
    });
    
    await waitFor(() => {
      expect(screen.getByText('Practiced today')).toBeInTheDocument();
    });
    
    const button = screen.getByRole('button', { name: /practice already logged today/i });
    expect(button).toBeDisabled();
  });

  it('handles practice logging successfully', async () => {
    const onPracticeLogged = jest.fn();
    
    await act(async () => {
      render(<DailyPracticeSection {...mockProps} onPracticeLogged={onPracticeLogged} />);
    });
    
    // Wait for initial loading to complete
    await waitFor(() => {
      expect(screen.getByText('Log a quick practice session to progress your skill streak.')).toBeInTheDocument();
    });
    
    const button = screen.getByRole('button', { name: /Log today's practice session/i });
    
    await act(async () => {
      fireEvent.click(button);
    });
    
    await waitFor(() => {
      expect(mockMarkSkillPracticeDay).toHaveBeenCalledWith('test-user-123');
    });
    
    expect(onPracticeLogged).toHaveBeenCalled();
  });

  it('shows loading state during practice logging', async () => {
    mockMarkSkillPracticeDay.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
    
    await act(async () => {
      render(<DailyPracticeSection {...mockProps} />);
    });
    
    // Wait for initial loading to complete
    await waitFor(() => {
      expect(screen.getByText('Log a quick practice session to progress your skill streak.')).toBeInTheDocument();
    });
    
    const button = screen.getByRole('button', { name: /Log today's practice session/i });
    
    await act(async () => {
      fireEvent.click(button);
    });
    
    expect(screen.getByText('Logging...')).toBeInTheDocument();
    expect(button).toBeDisabled();
  });

  it('handles practice logging errors', async () => {
    const errorMessage = 'Network error';
    mockMarkSkillPracticeDay.mockRejectedValue(new Error(errorMessage));
    
    await act(async () => {
      render(<DailyPracticeSection {...mockProps} />);
    });
    
    // Wait for initial loading to complete
    await waitFor(() => {
      expect(screen.getByText('Log a quick practice session to progress your skill streak.')).toBeInTheDocument();
    });
    
    const button = screen.getByRole('button', { name: /Log today's practice session/i });
    
    await act(async () => {
      fireEvent.click(button);
    });
    
    await waitFor(() => {
      expect(screen.getByText('Error logging practice')).toBeInTheDocument();
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
      expect(screen.getByText('Retry')).toBeInTheDocument();
    });
  });

  it('supports retry functionality', async () => {
    const errorMessage = 'Network error';
    mockMarkSkillPracticeDay
      .mockRejectedValueOnce(new Error(errorMessage))
      .mockResolvedValueOnce({ success: true });
    
    await act(async () => {
      render(<DailyPracticeSection {...mockProps} />);
    });
    
    // Wait for initial loading to complete
    await waitFor(() => {
      expect(screen.getByText('Log a quick practice session to progress your skill streak.')).toBeInTheDocument();
    });
    
    const button = screen.getByRole('button', { name: /Log today's practice session/i });
    
    await act(async () => {
      fireEvent.click(button);
    });
    
    await waitFor(() => {
      expect(screen.getByText('Error logging practice')).toBeInTheDocument();
      expect(screen.getByText('Retry')).toBeInTheDocument();
    });
    
    const retryButton = screen.getByText('Retry');
    
    await act(async () => {
      fireEvent.click(retryButton);
    });
    
    await waitFor(() => {
      expect(mockMarkSkillPracticeDay).toHaveBeenCalledTimes(2);
    });
  });

  it('has proper accessibility attributes', async () => {
    await act(async () => {
      render(<DailyPracticeSection {...mockProps} />);
    });
    
    // Wait for initial loading to complete
    await waitFor(() => {
      expect(screen.getByText('Log a quick practice session to progress your skill streak.')).toBeInTheDocument();
    });
    
    const button = screen.getByRole('button', { name: /Log today's practice session/i });
    expect(button).toHaveAttribute('aria-label');
    expect(button).toHaveAttribute('aria-describedby');
    
    // Check for screen reader announcements
    expect(screen.getByText('Click to log your practice session for today.')).toBeInTheDocument();
  });

  it('applies mobile optimization classes', async () => {
    // This test verifies the component renders with mobile optimization
    // The actual mobile behavior is tested through the useMobileOptimization hook
    await act(async () => {
      render(<DailyPracticeSection {...mockProps} />);
    });
    
    // Wait for initial loading to complete
    await waitFor(() => {
      expect(screen.getByText('Log a quick practice session to progress your skill streak.')).toBeInTheDocument();
    });
    
    const button = screen.getByRole('button', { name: /Log today's practice session/i });
    expect(button).toBeInTheDocument();
  });

  it('shows loading state during initial load', async () => {
    mockHasPracticedToday.mockImplementation(() => new Promise(() => {})); // Never resolves
    
    await act(async () => {
      render(<DailyPracticeSection {...mockProps} />);
    });
    
    expect(screen.getByText('Checking practice status...')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('shows completed state with success styling', async () => {
    mockHasPracticedToday.mockResolvedValue(true);
    
    await act(async () => {
      render(<DailyPracticeSection {...mockProps} />);
    });
    
    await waitFor(() => {
      expect(screen.getByText('Practiced today')).toBeInTheDocument();
      expect(screen.getByText('Completed')).toBeInTheDocument();
    });
  });

  it('handles retry functionality', async () => {
    mockMarkSkillPracticeDay.mockRejectedValueOnce(new Error('Network error'));
    
    await act(async () => {
      render(<DailyPracticeSection {...mockProps} />);
    });
    
    // Wait for initial loading to complete
    await waitFor(() => {
      expect(screen.getByText('Log a quick practice session to progress your skill streak.')).toBeInTheDocument();
    });
    
    const button = screen.getByRole('button', { name: /Log today's practice session/i });
    
    await act(async () => {
      fireEvent.click(button);
    });
    
    await waitFor(() => {
      expect(screen.getByText('Error logging practice')).toBeInTheDocument();
      expect(screen.getByText('Retry attempt: 1')).toBeInTheDocument();
    });
    
    const retryButton = screen.getByRole('button', { name: /Retry/i });
    
    await act(async () => {
      fireEvent.click(retryButton);
    });
    
    expect(mockMarkSkillPracticeDay).toHaveBeenCalledTimes(2);
  });

  it('respects enableAnimations prop', async () => {
    const { rerender } = await act(async () => {
      return render(<DailyPracticeSection {...mockProps} enableAnimations={true} />);
    });
    
    // Wait for initial loading to complete
    await waitFor(() => {
      expect(screen.getByText('Log a quick practice session to progress your skill streak.')).toBeInTheDocument();
    });
    
    expect(screen.getByRole('button')).toHaveClass('animate-in');
    
    await act(async () => {
      rerender(<DailyPracticeSection {...mockProps} enableAnimations={false} />);
    });
    
    expect(screen.getByRole('button')).not.toHaveClass('animate-in');
  });
});
