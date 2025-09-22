/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { act } from 'react';
import userEvent from '@testing-library/user-event';
import {
  LoadingSpinner, 
  ContextualLoading, 
  SkeletonLoading, 
  ProgressiveLoading 
} from '../EnhancedLoadingStates';

 // Use project-level framer-motion mock from src/utils/__mocks__/framer-motion.js
 // (ensures aria-*, data-* and event props are preserved for testing)

describe('LoadingSpinner', () => {
  it('should render with default props', () => {
    render(<LoadingSpinner />);
    
    expect(screen.getByRole('status', { hidden: true })).toBeInTheDocument();
  });

  it('should display message when provided', () => {
    render(<LoadingSpinner message="Loading data..." />);
    
    expect(screen.getByText('Loading data...')).toBeInTheDocument();
  });

  it('should apply size classes correctly', () => {
    const { rerender } = render(<LoadingSpinner size="sm" />);
    
    let spinner = screen.getByRole('status', { hidden: true }).firstChild;
    expect(spinner).toHaveClass('w-4', 'h-4');

    rerender(<LoadingSpinner size="lg" />);
    spinner = screen.getByRole('status', { hidden: true }).firstChild;
    expect(spinner).toHaveClass('w-8', 'h-8');
  });

  it('should apply variant styles correctly', () => {
    const { rerender } = render(<LoadingSpinner variant="glass" />);
    
    let container = screen.getByRole('status', { hidden: true }).parentElement;
    expect(container).toHaveClass('glassmorphic');

    rerender(<LoadingSpinner variant="minimal" />);
    container = screen.getByRole('status', { hidden: true }).parentElement;
    expect(container).toHaveClass('flex', 'items-center', 'gap-2');
  });

  it('should be accessible', () => {
    render(<LoadingSpinner message="Loading content" />);
    
    const spinner = screen.getByRole('status', { hidden: true });
    expect(spinner).toHaveAttribute('aria-label', expect.stringContaining('loading'));
  });
});

describe('ContextualLoading', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should render with context-specific icon and message', () => {
    render(<ContextualLoading context="search" />);
    
    expect(screen.getByText(/searching for matches/i)).toBeInTheDocument();
  });

  it('should show progress when provided', () => {
    render(<ContextualLoading context="upload" progress={50} />);
    
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('should use custom stage message when provided', () => {
    render(<ContextualLoading context="save" stage="Validating input..." />);
    
    expect(screen.getByText('Validating input...')).toBeInTheDocument();
  });

  it('should auto-advance messages when no stage is provided', () => {
    render(<ContextualLoading context="load" />);
    
    expect(screen.getByText(/loading data/i)).toBeInTheDocument();
    
    // Fast-forward time to trigger message change
    act(() => { jest.advanceTimersByTime(1000); });
    
    expect(screen.getByText(/fetching updates/i)).toBeInTheDocument();
  });

  it('should show timeout state after specified time', async () => {
    const onTimeout = jest.fn();
    
    render(
      <ContextualLoading 
        context="process" 
        timeout={5000} 
        onTimeout={onTimeout}
      />
    );
    
    // Fast-forward past timeout
    act(() => { jest.advanceTimersByTime(6000); });
    
    await waitFor(() => {
      expect(screen.getByText(/taking longer than expected/i)).toBeInTheDocument();
      expect(onTimeout).toHaveBeenCalled();
    });
  });

  it('should show retry button on timeout with retry action', async () => {
    const retryAction = jest.fn();
    
    render(
      <ContextualLoading 
        context="connect" 
        timeout={1000}
        retryAction={retryAction}
      />
    );
    
    act(() => { jest.advanceTimersByTime(2000); });
    
    await waitFor(() => {
      const retryButton = screen.getByRole('button', { name: /try again/i });
      expect(retryButton).toBeInTheDocument();
    });
  });

  it('should handle retry action click', async () => {
    const retryAction = jest.fn();

    render(
      <ContextualLoading 
        context="sync" 
        timeout={1000}
        retryAction={retryAction}
      />
    );

    act(() => { jest.advanceTimersByTime(2000); });

    await waitFor(() => {
      const retryButton = screen.getByRole('button', { name: /try again/i });
      expect(retryButton).toBeInTheDocument();
      // use fireEvent to synchronously trigger handler
      fireEvent.click(retryButton);
      expect(retryAction).toHaveBeenCalled();
    });
  });

  it('should show elapsed time', async () => {
    const { container } = render(<ContextualLoading context="download" />);

    act(() => { jest.advanceTimersByTime(3000); });

    await waitFor(() => {
      expect(container.textContent).toMatch(/3s elapsed/i);
    });
  });

  it('should show estimated remaining time', async () => {
    const { container } = render(<ContextualLoading context="upload" estimatedTime={10000} />);

    act(() => { jest.advanceTimersByTime(3000); });

    await waitFor(() => {
      expect(container.textContent).toMatch(/~7s remaining/i);
    });
  });
});

describe('SkeletonLoading', () => {
  it('should render card skeleton', () => {
  const { container } = render(<SkeletonLoading type="card" />);
    
  // Check for skeleton markup by presence of role attribute or pulse class
  const skeletons = container.querySelectorAll('[role="presentation"]');
  const pulses = container.querySelectorAll('.animate-pulse');
  expect(skeletons.length + pulses.length).toBeGreaterThan(0);
  });

  it('should render list skeleton', () => {
  const { container } = render(<SkeletonLoading type="list" />);
    
  // Should render multiple list items
  const listItems = container.querySelectorAll('[role="presentation"]');
  expect(listItems.length).toBeGreaterThan(2);
  });

  it('should render profile skeleton', () => {
  const { container } = render(<SkeletonLoading type="profile" />);

  // Should include avatar placeholder
  const avatarPlaceholder = container.querySelector('[role="presentation"]');
  expect(avatarPlaceholder).toHaveClass('rounded-full');
  });

  it('should render table skeleton', () => {
  const { container } = render(<SkeletonLoading type="table" />);

  // Should render grid layout
  const tableRows = container.querySelectorAll('[role="presentation"]');
  expect(tableRows.length).toBeGreaterThan(3);
  });

  it('should render custom skeleton with children', () => {
    const { container } = render(
      <SkeletonLoading type="custom">
        <div data-testid="custom-skeleton">Custom content</div>
      </SkeletonLoading>
    );
    
    expect(container.querySelector('[data-testid="custom-skeleton"]')).toBeInTheDocument();
  });

  it('should render multiple skeletons when count is specified', () => {
  const { container } = render(<SkeletonLoading type="card" count={3} />);
    
  const containers = container.querySelectorAll('[role="presentation"]');
  // Should have multiple skeleton containers
  expect(containers.length).toBeGreaterThanOrEqual(3);
  });

  it('should apply custom className', () => {
  const { container } = render(<SkeletonLoading type="card" className="custom-skeleton" />);
    
  const el = container.querySelector('[role="presentation"]');
  // find the closest ancestor with the custom class
  const ancestorWithClass = el?.closest('.custom-skeleton');
  expect(ancestorWithClass).toBeTruthy();
  });

  it('should have proper accessibility attributes', () => {
  const { container } = render(<SkeletonLoading type="card" />);
    
  const skeleton = container.querySelector('[role="presentation"]');
  // aria-label may be on the wrapping loading container; look up the tree
  const loadingLabel = skeleton?.closest('[aria-label]')?.getAttribute('aria-label');
  expect(loadingLabel).toEqual(expect.stringContaining('loading'));
  });
});

describe('ProgressiveLoading', () => {
  const mockStages = [
    { name: 'Initialize', description: 'Setting up environment', duration: 1000 },
    { name: 'Load Data', description: 'Fetching information', duration: 2000 },
    { name: 'Render UI', description: 'Building interface', duration: 1500 },
    { name: 'Complete', description: 'Ready to use', duration: 500 },
  ];

  it('should render all stages', () => {
    const { container } = render(<ProgressiveLoading stages={mockStages} currentStage={0} />);
    
    // Ensure stage wrappers are rendered
    const stageEls = container.querySelectorAll('[data-stage]');
    expect(stageEls.length).toBeGreaterThanOrEqual(mockStages.length);
    mockStages.forEach(stage => {
      expect(container.textContent).toMatch(stage.name);
      expect(container.textContent).toMatch(stage.description);
    });
  });

  it('should highlight current stage', async () => {
  const { container } = render(<ProgressiveLoading stages={mockStages} currentStage={1} />);
    
  const currentStage = Array.from(container.querySelectorAll('[data-stage]')).find(el => el.textContent?.includes('Load Data'));
  expect(currentStage).toHaveClass('current-stage');
  });

  it('should show completed stages', async () => {
  const { container } = render(<ProgressiveLoading stages={mockStages} currentStage={2} />);
    
  const completedStage = Array.from(container.querySelectorAll('[data-stage]')).find(el => el.textContent?.includes('Initialize'));
  expect(completedStage).toHaveClass('completed');
  });

  it('should show loading indicator for current stage', async () => {
  const { container } = render(<ProgressiveLoading stages={mockStages} currentStage={1} />)
    
  const currentStageElement = Array.from(container.querySelectorAll('[data-stage]')).find(el => el.textContent?.includes('Load Data'));
  const loadingIndicator = currentStageElement?.querySelector('[data-loading]');
  expect(loadingIndicator).toBeInTheDocument();
  });

  it('should show check mark for completed stages', async () => {
  const { container } = render(<ProgressiveLoading stages={mockStages} currentStage={2} />);
    
  const completedStage = Array.from(container.querySelectorAll('[data-stage]')).find(el => el.textContent?.includes('Initialize'));
  const checkMark = completedStage?.querySelector('[data-completed]');
  expect(checkMark).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { container } = render(
      <ProgressiveLoading 
        stages={mockStages} 
        currentStage={0} 
        className="custom-progressive" 
      />
    );
    
    const progressEl = container.querySelector('[role="progressbar"]');
    expect(progressEl?.parentElement).toHaveClass('custom-progressive');
  });

  it('should be accessible', () => {
  const { container } = render(<ProgressiveLoading stages={mockStages} currentStage={1} />);
    
  const progressContainer = container.querySelector('[role="progressbar"]');
  expect(progressContainer).toHaveAttribute('aria-valuenow', '1');
  expect(progressContainer).toHaveAttribute('aria-valuemax', '3');
  expect(progressContainer).toHaveAttribute('aria-label');
  });

  it('should handle edge cases', () => {
    // Test with empty stages
  const { rerender, container } = render(<ProgressiveLoading stages={[]} currentStage={0} />);
  expect(container.textContent).toMatch(/no stages/i);

    // Test with negative current stage - reuse rerender to avoid multiple mounts
    rerender(<ProgressiveLoading stages={mockStages} currentStage={-1} />);
    expect(container.querySelector('[role="progressbar"]')).toHaveAttribute('aria-valuenow', '0');

    // Test with current stage beyond stages length
    rerender(<ProgressiveLoading stages={mockStages} currentStage={10} />);
    expect(container.querySelector('[role="progressbar"]')).toHaveAttribute('aria-valuenow', '3');
  });
});

describe('Loading States Integration', () => {
  it('should work together in complex scenarios', async () => {
    const user = userEvent.setup();
    
    const ComplexLoadingExample = () => {
      const [loadingType, setLoadingType] = React.useState<'spinner' | 'contextual' | 'skeleton' | 'progressive'>('spinner');
      
      return (
        <div>
          <button onClick={() => setLoadingType('spinner')}>Show Spinner</button>
          <button onClick={() => setLoadingType('contextual')}>Show Contextual</button>
          <button onClick={() => setLoadingType('skeleton')}>Show Skeleton</button>
          <button onClick={() => setLoadingType('progressive')}>Show Progressive</button>
          
          {loadingType === 'spinner' && <LoadingSpinner message="Loading..." />}
          {loadingType === 'contextual' && <ContextualLoading context="search" />}
          {loadingType === 'skeleton' && <SkeletonLoading type="card" />}
          {loadingType === 'progressive' && (
            <ProgressiveLoading 
              stages={[
                { name: 'Step 1', description: 'First step' },
                { name: 'Step 2', description: 'Second step' },
              ]} 
              currentStage={0} 
            />
          )}
        </div>
      );
    };

    render(<ComplexLoadingExample />);
    
    // Test switching between different loading states
    await act(async () => { await user.click(screen.getByText('Show Contextual')); });
    expect(screen.getByText(/searching for matches/i)).toBeInTheDocument();
    
  await act(async () => { await user.click(screen.getByText('Show Skeleton')); });
  const presentations = screen.getAllByRole('presentation');
  expect(presentations.length).toBeGreaterThan(0);
    
    await act(async () => { await user.click(screen.getByText('Show Progressive')); });
    expect(screen.getByText('Step 1')).toBeInTheDocument();
  });

  it('should maintain performance with multiple loading states', () => {
    const start = performance.now();
    
    render(
      <div>
        <LoadingSpinner />
        <ContextualLoading context="upload" />
        <SkeletonLoading type="list" count={5} />
        <ProgressiveLoading 
          stages={Array.from({ length: 10 }, (_, i) => ({
            name: `Stage ${i}`,
            description: `Description ${i}`,
          }))} 
          currentStage={5} 
        />
      </div>
    );
    
    const end = performance.now();
    
    // Should render quickly even with multiple loading states
    expect(end - start).toBeLessThan(100);
  });
});
