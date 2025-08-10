/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { 
  FeedbackForm, 
  SmartNotifications, 
  ProgressIndicator,
  UserGuidanceTooltip 
} from '../EnhancedFeedbackSystem';
import { useToast } from '../../../contexts/ToastContext';

// Mock dependencies
jest.mock('../../../contexts/ToastContext');

const mockUseToast = useToast as jest.MockedFunction<typeof useToast>;
const mockShowToast = jest.fn();

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    form: ({ children, ...props }: any) => <form {...props}>{children}</form>,
  },
  AnimatePresence: ({ children }: any) => children,
}));

describe('FeedbackForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUseToast.mockReturnValue({
      showToast: mockShowToast,
      removeToast: jest.fn(),
    });
  });

  const renderComponent = (props = {}) => {
    const defaultProps = {
      onSubmit: jest.fn(),
      onCancel: jest.fn(),
    };

    return render(<FeedbackForm {...defaultProps} {...props} />);
  };

  describe('Form Rendering', () => {
    it('should render all form fields', () => {
      renderComponent();

      expect(screen.getByLabelText(/feedback type/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/subject/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/priority/i)).toBeInTheDocument();
    });

    it('should show step indicator for multi-step form', () => {
      renderComponent({ multiStep: true });

      expect(screen.getByText(/step 1 of 3/i)).toBeInTheDocument();
    });

    it('should render category-specific fields', async () => {
      const user = userEvent.setup();
      renderComponent();

      const typeSelect = screen.getByLabelText(/feedback type/i);
      await user.selectOptions(typeSelect, 'bug-report');

      await waitFor(() => {
        expect(screen.getByLabelText(/steps to reproduce/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/expected behavior/i)).toBeInTheDocument();
      });
    });

    it('should show attachment option for bug reports', async () => {
      const user = userEvent.setup();
      renderComponent();

      const typeSelect = screen.getByLabelText(/feedback type/i);
      await user.selectOptions(typeSelect, 'bug-report');

      await waitFor(() => {
        expect(screen.getByLabelText(/attach screenshot/i)).toBeInTheDocument();
      });
    });
  });

  describe('Form Validation', () => {
    it('should validate required fields', async () => {
      const user = userEvent.setup();
      const onSubmit = jest.fn();
      
      renderComponent({ onSubmit });

      const submitButton = screen.getByRole('button', { name: /submit feedback/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/subject is required/i)).toBeInTheDocument();
        expect(screen.getByText(/description is required/i)).toBeInTheDocument();
      });

      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('should validate minimum description length', async () => {
      const user = userEvent.setup();
      renderComponent();

      const descriptionField = screen.getByLabelText(/description/i);
      await user.type(descriptionField, 'short');

      const submitButton = screen.getByRole('button', { name: /submit feedback/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/description must be at least 10 characters/i)).toBeInTheDocument();
      });
    });

    it('should validate email format when contact info is provided', async () => {
      const user = userEvent.setup();
      renderComponent();

      const emailField = screen.getByLabelText(/email/i);
      await user.type(emailField, 'invalid-email');

      const submitButton = screen.getByRole('button', { name: /submit feedback/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/please enter a valid email/i)).toBeInTheDocument();
      });
    });

    it('should show real-time validation feedback', async () => {
      const user = userEvent.setup();
      renderComponent();

      const subjectField = screen.getByLabelText(/subject/i);
      await user.type(subjectField, 'Valid subject');

      await waitFor(() => {
        expect(screen.getByTestId('subject-validation')).toHaveClass('valid');
      });
    });
  });

  describe('Multi-Step Form', () => {
    it('should navigate between steps', async () => {
      const user = userEvent.setup();
      renderComponent({ multiStep: true });

      // Fill first step
      await user.type(screen.getByLabelText(/subject/i), 'Test Subject');
      await user.selectOptions(screen.getByLabelText(/feedback type/i), 'feature-request');

      const nextButton = screen.getByRole('button', { name: /next/i });
      await user.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText(/step 2 of 3/i)).toBeInTheDocument();
      });
    });

    it('should prevent navigation with invalid data', async () => {
      const user = userEvent.setup();
      renderComponent({ multiStep: true });

      const nextButton = screen.getByRole('button', { name: /next/i });
      await user.click(nextButton);

      // Should stay on step 1
      expect(screen.getByText(/step 1 of 3/i)).toBeInTheDocument();
    });

    it('should allow going back to previous steps', async () => {
      const user = userEvent.setup();
      renderComponent({ multiStep: true });

      // Fill and advance to step 2
      await user.type(screen.getByLabelText(/subject/i), 'Test Subject');
      await user.selectOptions(screen.getByLabelText(/feedback type/i), 'general');
      await user.click(screen.getByRole('button', { name: /next/i }));

      await waitFor(() => {
        expect(screen.getByText(/step 2 of 3/i)).toBeInTheDocument();
      });

      const backButton = screen.getByRole('button', { name: /back/i });
      await user.click(backButton);

      expect(screen.getByText(/step 1 of 3/i)).toBeInTheDocument();
    });

    it('should preserve data when navigating between steps', async () => {
      const user = userEvent.setup();
      renderComponent({ multiStep: true });

      const subjectValue = 'Test Subject';
      await user.type(screen.getByLabelText(/subject/i), subjectValue);
      await user.selectOptions(screen.getByLabelText(/feedback type/i), 'bug-report');
      await user.click(screen.getByRole('button', { name: /next/i }));

      // Go back
      await user.click(screen.getByRole('button', { name: /back/i }));

      // Data should be preserved
      expect(screen.getByLabelText(/subject/i)).toHaveValue(subjectValue);
      expect(screen.getByLabelText(/feedback type/i)).toHaveValue('bug-report');
    });
  });

  describe('Form Submission', () => {
    it('should submit valid form data', async () => {
      const user = userEvent.setup();
      const onSubmit = jest.fn();
      
      renderComponent({ onSubmit });

      // Fill form
      await user.type(screen.getByLabelText(/subject/i), 'Test Feedback');
      await user.type(screen.getByLabelText(/description/i), 'This is a detailed feedback description');
      await user.selectOptions(screen.getByLabelText(/feedback type/i), 'feature-request');
      await user.selectOptions(screen.getByLabelText(/priority/i), 'medium');

      const submitButton = screen.getByRole('button', { name: /submit feedback/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            subject: 'Test Feedback',
            description: 'This is a detailed feedback description',
            type: 'feature-request',
            priority: 'medium',
          })
        );
      });
    });

    it('should show loading state during submission', async () => {
      const user = userEvent.setup();
      const onSubmit = jest.fn(() => new Promise(() => {})); // Never resolves
      
      renderComponent({ onSubmit });

      // Fill required fields
      await user.type(screen.getByLabelText(/subject/i), 'Test');
      await user.type(screen.getByLabelText(/description/i), 'Test description');

      const submitButton = screen.getByRole('button', { name: /submit feedback/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/submitting feedback/i)).toBeInTheDocument();
        expect(submitButton).toBeDisabled();
      });
    });

    it('should handle submission errors', async () => {
      const user = userEvent.setup();
      const onSubmit = jest.fn().mockRejectedValue(new Error('Submission failed'));
      
      renderComponent({ onSubmit });

      // Fill and submit form
      await user.type(screen.getByLabelText(/subject/i), 'Test');
      await user.type(screen.getByLabelText(/description/i), 'Test description');
      await user.click(screen.getByRole('button', { name: /submit feedback/i }));

      await waitFor(() => {
        expect(mockShowToast).toHaveBeenCalledWith(
          expect.stringContaining('failed'),
          'error'
        );
      });
    });

    it('should show success message on successful submission', async () => {
      const user = userEvent.setup();
      const onSubmit = jest.fn().mockResolvedValue({ success: true });
      
      renderComponent({ onSubmit });

      // Fill and submit form
      await user.type(screen.getByLabelText(/subject/i), 'Test');
      await user.type(screen.getByLabelText(/description/i), 'Test description');
      await user.click(screen.getByRole('button', { name: /submit feedback/i }));

      await waitFor(() => {
        expect(mockShowToast).toHaveBeenCalledWith(
          expect.stringContaining('thank you'),
          'success'
        );
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels and descriptions', () => {
      renderComponent();

      expect(screen.getByLabelText(/subject/i)).toHaveAttribute('aria-required', 'true');
      expect(screen.getByLabelText(/description/i)).toHaveAttribute('aria-required', 'true');
    });

    it('should associate error messages with form fields', async () => {
      const user = userEvent.setup();
      renderComponent();

      const submitButton = screen.getByRole('button', { name: /submit feedback/i });
      await user.click(submitButton);

      await waitFor(() => {
        const subjectField = screen.getByLabelText(/subject/i);
        const errorMessage = screen.getByText(/subject is required/i);
        
        expect(subjectField).toHaveAttribute('aria-describedby');
        expect(errorMessage).toHaveAttribute('id');
      });
    });

    it('should support keyboard navigation', () => {
      renderComponent();

      const subjectField = screen.getByLabelText(/subject/i);
      subjectField.focus();

      expect(document.activeElement).toBe(subjectField);

      // Tab to next field
      fireEvent.keyDown(subjectField, { key: 'Tab' });
      
      const typeField = screen.getByLabelText(/feedback type/i);
      expect(document.activeElement).toBe(typeField);
    });

    it('should announce form progress in multi-step mode', () => {
      renderComponent({ multiStep: true });

      const progressAnnouncement = screen.getByRole('status');
      expect(progressAnnouncement).toHaveTextContent(/step 1 of 3/i);
    });
  });
});

describe('SmartNotifications', () => {
  const mockNotifications = [
    {
      id: '1',
      type: 'success' as const,
      title: 'Success!',
      message: 'Operation completed successfully',
      timestamp: new Date(),
    },
    {
      id: '2',
      type: 'error' as const,
      title: 'Error',
      message: 'Something went wrong',
      timestamp: new Date(),
      actions: [{ label: 'Retry', action: jest.fn() }],
    },
  ];

  it('should render notifications', () => {
    render(<SmartNotifications notifications={mockNotifications} />);

    expect(screen.getByText('Success!')).toBeInTheDocument();
    expect(screen.getByText('Error')).toBeInTheDocument();
  });

  it('should show action buttons when provided', () => {
    render(<SmartNotifications notifications={mockNotifications} />);

    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  it('should handle notification dismissal', async () => {
    const user = userEvent.setup();
    const onDismiss = jest.fn();
    
    render(<SmartNotifications notifications={mockNotifications} onDismiss={onDismiss} />);

    const dismissButtons = screen.getAllByRole('button', { name: /dismiss/i });
    await user.click(dismissButtons[0]);

    expect(onDismiss).toHaveBeenCalledWith('1');
  });

  it('should auto-dismiss notifications after timeout', async () => {
    jest.useFakeTimers();
    const onDismiss = jest.fn();
    
    render(
      <SmartNotifications 
        notifications={mockNotifications} 
        onDismiss={onDismiss}
        autoHideDelay={3000}
      />
    );

    jest.advanceTimersByTime(3500);

    await waitFor(() => {
      expect(onDismiss).toHaveBeenCalledWith('1');
    });

    jest.useRealTimers();
  });

  it('should group similar notifications', () => {
    const similarNotifications = [
      { ...mockNotifications[0], id: '1' },
      { ...mockNotifications[0], id: '2' },
      { ...mockNotifications[0], id: '3' },
    ];

    render(<SmartNotifications notifications={similarNotifications} groupSimilar />);

    expect(screen.getByText(/3 similar notifications/i)).toBeInTheDocument();
  });
});

describe('ProgressIndicator', () => {
  it('should render progress bar with correct value', () => {
    render(<ProgressIndicator value={50} max={100} />);

    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '50');
    expect(progressBar).toHaveAttribute('aria-valuemax', '100');
  });

  it('should show percentage when enabled', () => {
    render(<ProgressIndicator value={75} max={100} showPercentage />);

    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  it('should display custom label', () => {
    render(<ProgressIndicator value={30} max={100} label="Upload Progress" />);

    expect(screen.getByText('Upload Progress')).toBeInTheDocument();
  });

  it('should show indeterminate state', () => {
    render(<ProgressIndicator indeterminate />);

    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveClass('indeterminate');
  });

  it('should apply size variants', () => {
    const { rerender } = render(<ProgressIndicator value={50} size="sm" />);
    
    let progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveClass('h-1');

    rerender(<ProgressIndicator value={50} size="lg" />);
    progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveClass('h-3');
  });
});

describe('UserGuidanceTooltip', () => {
  it('should show tooltip on hover', async () => {
    const user = userEvent.setup();
    
    render(
      <UserGuidanceTooltip content="This is helpful guidance">
        <button>Hover me</button>
      </UserGuidanceTooltip>
    );

    const trigger = screen.getByRole('button', { name: /hover me/i });
    await user.hover(trigger);

    await waitFor(() => {
      expect(screen.getByText('This is helpful guidance')).toBeInTheDocument();
    });
  });

  it('should show tooltip on focus', async () => {
    render(
      <UserGuidanceTooltip content="Keyboard accessible guidance">
        <button>Focus me</button>
      </UserGuidanceTooltip>
    );

    const trigger = screen.getByRole('button', { name: /focus me/i });
    trigger.focus();

    await waitFor(() => {
      expect(screen.getByText('Keyboard accessible guidance')).toBeInTheDocument();
    });
  });

  it('should hide tooltip when trigger loses focus', async () => {
    const user = userEvent.setup();
    
    render(
      <UserGuidanceTooltip content="Temporary guidance">
        <button>Focus me</button>
      </UserGuidanceTooltip>
    );

    const trigger = screen.getByRole('button', { name: /focus me/i });
    trigger.focus();

    await waitFor(() => {
      expect(screen.getByText('Temporary guidance')).toBeInTheDocument();
    });

    await user.tab(); // Move focus away

    await waitFor(() => {
      expect(screen.queryByText('Temporary guidance')).not.toBeInTheDocument();
    });
  });

  it('should support different placements', () => {
    render(
      <UserGuidanceTooltip content="Top placement" placement="top">
        <button>Button</button>
      </UserGuidanceTooltip>
    );

    const trigger = screen.getByRole('button');
    trigger.focus();

    const tooltip = screen.getByRole('tooltip');
    expect(tooltip).toHaveAttribute('data-placement', 'top');
  });

  it('should be accessible', () => {
    render(
      <UserGuidanceTooltip content="Accessible tooltip">
        <button>Accessible button</button>
      </UserGuidanceTooltip>
    );

    const trigger = screen.getByRole('button');
    trigger.focus();

    const tooltip = screen.getByRole('tooltip');
    expect(tooltip).toHaveAttribute('id');
    expect(trigger).toHaveAttribute('aria-describedby', tooltip.id);
  });
});
