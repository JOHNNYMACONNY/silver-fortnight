/**
 * Animated Skill Badge Component Tests
 * 
 * Test suite for interactive skill badge with animations and trading context awareness
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AnimatedSkillBadge, ProposalSkillBadge, SelectionSkillBadge, NegotiationSkillBadge } from '../AnimatedSkillBadge';

// Mock the animation hooks
jest.mock('../../../hooks/useTradeYaAnimation', () => ({
  useTradeYaAnimation: jest.fn(() => ({
    animationStyles: { transform: 'scale(1)' },
    triggerAnimation: jest.fn(),
  })),
}));

jest.mock('../../../hooks/useMobileAnimation', () => ({
  useMobileAnimation: jest.fn(() => ({
    animationStyles: { touchAction: 'manipulation' },
    handleTouchStart: jest.fn(),
    handleTouchEnd: jest.fn(),
    handleTouchCancel: jest.fn(),
    isTouchDevice: false,
    triggerHapticFeedback: jest.fn(),
  })),
}));

describe('AnimatedSkillBadge', () => {
  const defaultProps = {
    skill: 'JavaScript',
    level: 'intermediate' as const,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render skill name correctly', () => {
      render(<AnimatedSkillBadge {...defaultProps} />);
      expect(screen.getByText('JavaScript')).toBeInTheDocument();
    });

    it('should render skill level when showLevel is true', () => {
      render(<AnimatedSkillBadge {...defaultProps} showLevel={true} />);
      expect(screen.getByText('Intermediate')).toBeInTheDocument();
    });

    it('should not render skill level when showLevel is false', () => {
      render(<AnimatedSkillBadge {...defaultProps} showLevel={false} />);
      expect(screen.queryByText('Intermediate')).not.toBeInTheDocument();
    });

    it('should render skill icon when showIcon is true', () => {
      render(<AnimatedSkillBadge {...defaultProps} showIcon={true} />);
      expect(screen.getByText('⚡')).toBeInTheDocument(); // intermediate icon
    });

    it('should not render skill icon when showIcon is false', () => {
      render(<AnimatedSkillBadge {...defaultProps} showIcon={false} />);
      expect(screen.queryByText('⚡')).not.toBeInTheDocument();
    });
  });

  describe('Skill Levels', () => {
    it('should render beginner level correctly', () => {
      render(<AnimatedSkillBadge skill="HTML" level="beginner" />);
      expect(screen.getByText('🌱')).toBeInTheDocument();
      expect(screen.getByText('Beginner')).toBeInTheDocument();
    });

    it('should render advanced level correctly', () => {
      render(<AnimatedSkillBadge skill="React" level="advanced" />);
      expect(screen.getByText('🚀')).toBeInTheDocument();
      expect(screen.getByText('Advanced')).toBeInTheDocument();
    });

    it('should render expert level correctly', () => {
      render(<AnimatedSkillBadge skill="TypeScript" level="expert" />);
      expect(screen.getByText('👑')).toBeInTheDocument();
      expect(screen.getByText('Expert')).toBeInTheDocument();
    });
  });

  describe('Sizes', () => {
    it('should apply small size classes', () => {
      render(<AnimatedSkillBadge {...defaultProps} size="sm" />);
      const badge = screen.getByRole('button');
      expect(badge).toHaveClass('px-2', 'py-1', 'text-xs', 'h-6');
    });

    it('should apply medium size classes', () => {
      render(<AnimatedSkillBadge {...defaultProps} size="md" />);
      const badge = screen.getByRole('button');
      expect(badge).toHaveClass('px-3', 'py-1.5', 'text-sm', 'h-8');
    });

    it('should apply large size classes', () => {
      render(<AnimatedSkillBadge {...defaultProps} size="lg" />);
      const badge = screen.getByRole('button');
      expect(badge).toHaveClass('px-4', 'py-2', 'text-base', 'h-10');
    });
  });

  describe('Variants', () => {
    it('should apply default variant styles', () => {
      render(<AnimatedSkillBadge {...defaultProps} variant="default" />);
      const badge = screen.getByRole('button');
      expect(badge).toHaveClass('bg-blue-100', 'text-blue-800', 'border-blue-200');
    });

    it('should apply outlined variant styles', () => {
      render(<AnimatedSkillBadge {...defaultProps} variant="outlined" />);
      const badge = screen.getByRole('button');
      expect(badge).toHaveClass('bg-transparent', 'border-2');
    });

    it('should apply filled variant styles', () => {
      render(<AnimatedSkillBadge {...defaultProps} variant="filled" />);
      const badge = screen.getByRole('button');
      expect(badge).toHaveClass('text-white', 'border-transparent');
    });
  });

  describe('States', () => {
    it('should show selection indicator when selected', () => {
      render(<AnimatedSkillBadge {...defaultProps} isSelected={true} />);
      const badge = screen.getByRole('button');
      expect(badge).toHaveClass('ring-2', 'ring-primary-500');
      expect(badge).toHaveAttribute('aria-pressed', 'true');
    });

    it('should apply disabled styles when disabled', () => {
      render(<AnimatedSkillBadge {...defaultProps} isDisabled={true} />);
      const badge = screen.getByRole('button');
      expect(badge).toHaveClass('opacity-50', 'cursor-not-allowed');
      expect(badge).toHaveAttribute('aria-disabled', 'true');
    });

    it('should not be clickable when disabled', () => {
      const onClick = jest.fn();
      render(<AnimatedSkillBadge {...defaultProps} isDisabled={true} onClick={onClick} />);
      
      fireEvent.click(screen.getByRole('button'));
      expect(onClick).not.toHaveBeenCalled();
    });
  });

  describe('Interactions', () => {
    it('should call onClick when clicked', () => {
      const onClick = jest.fn();
      render(<AnimatedSkillBadge {...defaultProps} onClick={onClick} />);
      
      fireEvent.click(screen.getByRole('button'));
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('should call onHover when mouse enters and leaves', () => {
      const onHover = jest.fn();
      render(<AnimatedSkillBadge {...defaultProps} onHover={onHover} />);
      
      const badge = screen.getByRole('button');
      fireEvent.mouseEnter(badge);
      expect(onHover).toHaveBeenCalledWith(true);
      
      fireEvent.mouseLeave(badge);
      expect(onHover).toHaveBeenCalledWith(false);
    });

    it('should not call onHover when disabled', () => {
      const onHover = jest.fn();
      render(<AnimatedSkillBadge {...defaultProps} isDisabled={true} onHover={onHover} />);
      
      const badge = screen.getByRole('button');
      fireEvent.mouseEnter(badge);
      expect(onHover).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<AnimatedSkillBadge {...defaultProps} onClick={jest.fn()} />);
      const badge = screen.getByRole('button');
      
      expect(badge).toHaveAttribute('tabIndex', '0');
      expect(badge).toHaveAttribute('aria-label', 'JavaScript skill badge, Intermediate level');
    });

    it('should have proper ARIA attributes when selected', () => {
      render(<AnimatedSkillBadge {...defaultProps} isSelected={true} onClick={jest.fn()} />);
      const badge = screen.getByRole('button');
      
      expect(badge).toHaveAttribute('aria-pressed', 'true');
      expect(badge).toHaveAttribute('aria-label', 'JavaScript skill badge, Intermediate level, selected');
    });

    it('should not be focusable when no onClick provided', () => {
      render(<AnimatedSkillBadge {...defaultProps} />);
      const badge = screen.getByRole('button');
      expect(badge).toHaveAttribute('tabIndex', '-1');
    });
  });

  describe('Custom Content', () => {
    it('should render custom children', () => {
      render(
        <AnimatedSkillBadge {...defaultProps}>
          <span data-testid="custom-content">Custom</span>
        </AnimatedSkillBadge>
      );
      expect(screen.getByTestId('custom-content')).toBeInTheDocument();
    });
  });
});

describe('Specialized Skill Badge Variants', () => {
  const defaultProps = {
    skill: 'React',
    level: 'advanced' as const,
  };

  it('should render ProposalSkillBadge with correct context', () => {
    render(<ProposalSkillBadge {...defaultProps} />);
    const badge = screen.getByRole('button');
    expect(badge).toHaveClass('text-white', 'border-transparent'); // filled variant
  });

  it('should render SelectionSkillBadge with correct context', () => {
    render(<SelectionSkillBadge {...defaultProps} />);
    const badge = screen.getByRole('button');
    expect(badge).toHaveClass('bg-transparent', 'border-2'); // outlined variant
  });

  it('should render NegotiationSkillBadge with correct context', () => {
    render(<NegotiationSkillBadge {...defaultProps} />);
    const badge = screen.getByRole('button');
    expect(badge).toHaveClass('bg-purple-100', 'text-purple-800'); // default variant with advanced colors
  });
});
