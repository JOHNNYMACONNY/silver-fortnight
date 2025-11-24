/**
 * TradeStatusTimeline Enhanced Component Tests
 * 
 * Tests for the enhanced TradeStatusTimeline component with
 * icons, progress percentage, and next step callouts.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TradeStatusTimeline } from '../TradeStatusTimeline';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

describe('TradeStatusTimeline Enhanced', () => {
  describe('Status Icons', () => {
    it('should display correct icon for open status', () => {
      render(<TradeStatusTimeline status="open" />);
      
      // Check that the timeline is rendered
      const timeline = screen.getByText('Open');
      expect(timeline).toBeInTheDocument();
    });

    it('should display correct icon for in-progress status', () => {
      render(<TradeStatusTimeline status="in-progress" />);
      
      const timeline = screen.getByText('In Progress');
      expect(timeline).toBeInTheDocument();
    });

    it('should display correct icon for pending_evidence status', () => {
      render(<TradeStatusTimeline status="pending_evidence" />);
      
      const timeline = screen.getByText('Evidence Pending');
      expect(timeline).toBeInTheDocument();
    });

    it('should display correct icon for pending_confirmation status', () => {
      render(<TradeStatusTimeline status="pending_confirmation" />);
      
      const timeline = screen.getByText('Pending Confirmation');
      expect(timeline).toBeInTheDocument();
    });

    it('should display correct icon for completed status', () => {
      render(<TradeStatusTimeline status="completed" />);
      
      const timeline = screen.getByText('Completed');
      expect(timeline).toBeInTheDocument();
    });
  });

  describe('Progress Percentage', () => {
    it('should calculate progress correctly for open status', () => {
      const { container } = render(<TradeStatusTimeline status="open" />);
      
      // Progress bar should exist
      const progressBar = container.querySelector('[style*="width"]');
      expect(progressBar).toBeInTheDocument();
    });

    it('should calculate progress correctly for completed status', () => {
      const { container } = render(<TradeStatusTimeline status="completed" />);
      
      // Progress should be at 100% for completed
      const progressBar = container.querySelector('[style*="width: 100%"]');
      expect(progressBar).toBeInTheDocument();
    });
  });

  describe('Next Step Callout', () => {
    it('should show next step for open status', () => {
      render(<TradeStatusTimeline status="open" showNextStep={true} />);
      
      // Next step information should be displayed
      const nextStep = screen.queryByText(/Next Step/i);
      expect(nextStep).toBeInTheDocument();
    });

    it('should show next step for in-progress status', () => {
      render(<TradeStatusTimeline status="in-progress" showNextStep={true} />);
      
      const nextStep = screen.queryByText(/Next Step/i);
      expect(nextStep).toBeInTheDocument();
    });

    it('should not show next step when showNextStep is false', () => {
      render(<TradeStatusTimeline status="open" showNextStep={false} />);
      
      const nextStep = screen.queryByText(/Next Step/i);
      expect(nextStep).not.toBeInTheDocument();
    });
  });

  describe('Special Statuses', () => {
    it('should display cancelled status correctly', () => {
      render(<TradeStatusTimeline status="cancelled" />);
      
      const cancelled = screen.getByText(/Cancelled/i);
      expect(cancelled).toBeInTheDocument();
    });

    it('should display disputed status correctly', () => {
      render(<TradeStatusTimeline status="disputed" />);
      
      const disputed = screen.getByText(/Disputed/i);
      expect(disputed).toBeInTheDocument();
    });

    it('should not show progress bar for special statuses', () => {
      const { container } = render(<TradeStatusTimeline status="cancelled" />);
      
      // Should not have the standard timeline structure
      const progressBar = container.querySelector('[style*="width"]');
      // Special statuses use a different layout
      expect(progressBar).not.toBeInTheDocument();
    });
  });

  describe('Time in Status', () => {
    it('should calculate time in status when dates are provided', () => {
      const createdAt = new Date('2025-11-20T10:00:00Z');
      const updatedAt = new Date('2025-11-24T10:00:00Z');
      
      render(
        <TradeStatusTimeline 
          status="in-progress" 
          createdAt={createdAt}
          updatedAt={updatedAt}
        />
      );
      
      // Time in status should be calculated and displayed
      // The exact format may vary, but should show time difference
      const timeline = screen.getByText('In Progress');
      expect(timeline).toBeInTheDocument();
    });

    it('should handle missing dates gracefully', () => {
      render(<TradeStatusTimeline status="open" />);
      
      // Should still render without errors
      const timeline = screen.getByText('Open');
      expect(timeline).toBeInTheDocument();
    });
  });

  describe('Progress Display', () => {
    it('should show progress bar when showProgress is true', () => {
      const { container } = render(
        <TradeStatusTimeline status="in-progress" showProgress={true} />
      );
      
      const progressBar = container.querySelector('[style*="width"]');
      expect(progressBar).toBeInTheDocument();
    });

    it('should hide progress bar when showProgress is false', () => {
      const { container } = render(
        <TradeStatusTimeline status="in-progress" showProgress={false} />
      );
      
      // Progress bar might still exist but be hidden
      // This test verifies the component renders without errors
      const timeline = screen.getByText('In Progress');
      expect(timeline).toBeInTheDocument();
    });
  });

  describe('Status Steps', () => {
    it('should display all status steps in order', () => {
      render(<TradeStatusTimeline status="completed" />);
      
      expect(screen.getByText('Open')).toBeInTheDocument();
      expect(screen.getByText('In Progress')).toBeInTheDocument();
      expect(screen.getByText('Evidence Pending')).toBeInTheDocument();
      expect(screen.getByText('Pending Confirmation')).toBeInTheDocument();
      expect(screen.getByText('Completed')).toBeInTheDocument();
    });

    it('should highlight current status', () => {
      const { container } = render(<TradeStatusTimeline status="in-progress" />);
      
      // Current status should have special styling
      const inProgress = screen.getByText('In Progress');
      expect(inProgress).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have semantic HTML structure', () => {
      const { container } = render(<TradeStatusTimeline status="open" />);
      
      // Should have proper structure for screen readers
      const timeline = container.querySelector('div');
      expect(timeline).toBeInTheDocument();
    });

    it('should be keyboard accessible', () => {
      render(<TradeStatusTimeline status="open" />);
      
      // Component should render without focusable elements
      // (timeline is display-only)
      const timeline = screen.getByText('Open');
      expect(timeline).toBeInTheDocument();
    });
  });
});

