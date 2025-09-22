/**
 * GlassmorphicBadge Component Tests
 * 
 * Comprehensive test suite for the GlassmorphicBadge component
 * covering variants, brand accents, animations, and Phase 3 enhancements.
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { GlassmorphicBadge } from '../GlassmorphicBadge';

// Mock framer-motion to avoid animation issues in tests
jest.mock('framer-motion', () => {
  const React = require('react');
  return {
    __esModule: true,
    motion: {
      span: (props: any) => React.createElement('span', props, props.children),
    },
  };
});

describe('GlassmorphicBadge', () => {
  const defaultProps = {
    children: 'Test Badge',
  };

  describe('Basic Rendering', () => {
    it('renders badge with default props', () => {
      render(<GlassmorphicBadge {...defaultProps} />);
      
      const badge = screen.getByText('Test Badge');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('glassmorphic');
      expect(badge).toHaveClass('inline-flex', 'items-center', 'rounded-full');
    });

    it('renders with custom className', () => {
      render(<GlassmorphicBadge {...defaultProps} className="custom-class" />);
      
      const badge = screen.getByText('Test Badge');
      expect(badge).toHaveClass('custom-class');
    });

    it('renders with icon', () => {
      const icon = <span data-testid="test-icon">🎯</span>;
      render(<GlassmorphicBadge {...defaultProps} icon={icon} />);
      
      expect(screen.getByTestId('test-icon')).toBeInTheDocument();
      expect(screen.getByText('Test Badge')).toBeInTheDocument();
    });
  });

  describe('Badge Variants', () => {
    it('applies default variant styles', () => {
      render(<GlassmorphicBadge {...defaultProps} />);
      
      const badge = screen.getByText('Test Badge');
      expect(badge).toHaveClass('border-primary/20', 'bg-primary/10', 'text-primary');
    });

    it('applies success variant styles', () => {
      render(<GlassmorphicBadge {...defaultProps} variant="success" />);
      
      const badge = screen.getByText('Test Badge');
      expect(badge).toHaveClass('border-green-500/20', 'bg-green-500/10', 'text-green-700');
    });

    it('applies warning variant styles', () => {
      render(<GlassmorphicBadge {...defaultProps} variant="warning" />);
      
      const badge = screen.getByText('Test Badge');
      expect(badge).toHaveClass('border-yellow-500/20', 'bg-yellow-500/10', 'text-yellow-700');
    });

    it('applies error variant styles', () => {
      render(<GlassmorphicBadge {...defaultProps} variant="error" />);
      
      const badge = screen.getByText('Test Badge');
      expect(badge).toHaveClass('border-red-500/20', 'bg-red-500/10', 'text-red-700');
    });

    it('applies info variant styles', () => {
      render(<GlassmorphicBadge {...defaultProps} variant="info" />);
      
      const badge = screen.getByText('Test Badge');
      expect(badge).toHaveClass('border-blue-500/20', 'bg-blue-500/10', 'text-blue-700');
    });

    it('applies neutral variant styles', () => {
      render(<GlassmorphicBadge {...defaultProps} variant="neutral" />);
      
      const badge = screen.getByText('Test Badge');
      expect(badge).toHaveClass('border-gray-500/20', 'bg-gray-500/10', 'text-gray-700');
    });

    it('applies gradient variant styles', () => {
      render(<GlassmorphicBadge {...defaultProps} variant="gradient" />);
      
      const badge = screen.getByText('Test Badge');
      expect(badge).toHaveClass('border-gradient-to-r', 'from-orange-500', 'to-blue-500');
    });
  });

  describe('Brand Accents', () => {
    it('applies orange brand accent', () => {
      render(<GlassmorphicBadge {...defaultProps} brandAccent="orange" />);
      
      const badge = screen.getByText('Test Badge');
      expect(badge).toHaveClass('border-orange-500/20', 'bg-orange-500/10', 'text-orange-700');
    });

    it('applies blue brand accent', () => {
      render(<GlassmorphicBadge {...defaultProps} brandAccent="blue" />);
      
      const badge = screen.getByText('Test Badge');
      expect(badge).toHaveClass('border-blue-500/20', 'bg-blue-500/10', 'text-blue-700');
    });

    it('applies purple brand accent', () => {
      render(<GlassmorphicBadge {...defaultProps} brandAccent="purple" />);
      
      const badge = screen.getByText('Test Badge');
      expect(badge).toHaveClass('border-purple-500/20', 'bg-purple-500/10', 'text-purple-700');
    });

    it('applies gradient brand accent', () => {
      render(<GlassmorphicBadge {...defaultProps} brandAccent="gradient" />);
      
      const badge = screen.getByText('Test Badge');
      expect(badge).toHaveClass('border-gradient-to-r', 'from-orange-500', 'to-purple-500');
    });
  });

  describe('Size Variants', () => {
    it('applies small size styles', () => {
      render(<GlassmorphicBadge {...defaultProps} size="sm" />);
      
      const badge = screen.getByText('Test Badge');
      expect(badge).toHaveClass('px-2', 'py-0.5', 'text-xs');
    });

    it('applies medium size styles by default', () => {
      render(<GlassmorphicBadge {...defaultProps} />);
      
      const badge = screen.getByText('Test Badge');
      expect(badge).toHaveClass('px-2.5', 'py-0.5', 'text-xs');
    });

    it('applies large size styles', () => {
      render(<GlassmorphicBadge {...defaultProps} size="lg" />);
      
      const badge = screen.getByText('Test Badge');
      expect(badge).toHaveClass('px-3', 'py-1', 'text-sm');
    });

    it('applies extra large size styles', () => {
      render(<GlassmorphicBadge {...defaultProps} size="xl" />);
      
      const badge = screen.getByText('Test Badge');
      expect(badge).toHaveClass('px-4', 'py-1.5', 'text-base');
    });
  });

  describe('Phase 3 Hover Effects', () => {
    it('applies hover scale effect to default variant', () => {
      render(<GlassmorphicBadge {...defaultProps} />);
      
      const badge = screen.getByText('Test Badge');
      expect(badge).toHaveClass('hover:scale-105', 'active:scale-95');
    });

    it('applies hover shadow effects to default variant', () => {
      render(<GlassmorphicBadge {...defaultProps} />);
      
      const badge = screen.getByText('Test Badge');
      expect(badge).toHaveClass('hover:shadow-lg', 'hover:shadow-primary/20');
    });

    it('applies hover border effects to default variant', () => {
      render(<GlassmorphicBadge {...defaultProps} />);
      
      const badge = screen.getByText('Test Badge');
      expect(badge).toHaveClass('hover:border-primary/30', 'hover:bg-primary/20');
    });

    it('applies brand-specific hover effects for orange accent', () => {
      render(<GlassmorphicBadge {...defaultProps} brandAccent="orange" />);
      
      const badge = screen.getByText('Test Badge');
      expect(badge).toHaveClass('hover:bg-orange-500/20', 'hover:border-orange-500/30');
      expect(badge).toHaveClass('hover:shadow-orange-500/20');
    });

    it('applies brand-specific hover effects for blue accent', () => {
      render(<GlassmorphicBadge {...defaultProps} brandAccent="blue" />);
      
      const badge = screen.getByText('Test Badge');
      expect(badge).toHaveClass('hover:bg-blue-500/20', 'hover:border-blue-500/30');
      expect(badge).toHaveClass('hover:shadow-blue-500/20');
    });

    it('applies brand-specific hover effects for purple accent', () => {
      render(<GlassmorphicBadge {...defaultProps} brandAccent="purple" />);
      
      const badge = screen.getByText('Test Badge');
      expect(badge).toHaveClass('hover:bg-purple-500/20', 'hover:border-purple-500/30');
      expect(badge).toHaveClass('hover:shadow-purple-500/20');
    });
  });

  describe('Animation Variants', () => {
    it('applies pulse animation', () => {
      render(<GlassmorphicBadge {...defaultProps} animation="pulse" />);
      
      const badge = screen.getByText('Test Badge');
      expect(badge).toHaveClass('animate-pulse');
    });

    it('applies bounce animation', () => {
      render(<GlassmorphicBadge {...defaultProps} animation="bounce" />);
      
      const badge = screen.getByText('Test Badge');
      expect(badge).toHaveClass('animate-bounce');
    });

    it('applies ping animation', () => {
      render(<GlassmorphicBadge {...defaultProps} animation="ping" />);
      
      const badge = screen.getByText('Test Badge');
      expect(badge).toHaveClass('animate-ping');
    });

    it('applies spin animation', () => {
      render(<GlassmorphicBadge {...defaultProps} animation="spin" />);
      
      const badge = screen.getByText('Test Badge');
      expect(badge).toHaveClass('animate-spin');
    });

    it('applies no animation by default', () => {
      render(<GlassmorphicBadge {...defaultProps} />);
      
      const badge = screen.getByText('Test Badge');
      expect(badge).not.toHaveClass('animate-pulse', 'animate-bounce', 'animate-ping', 'animate-spin');
    });
  });

  describe('Interactive Features', () => {
    it('applies interactive cursor when interactive prop is true', () => {
      render(<GlassmorphicBadge {...defaultProps} interactive />);
      
      const badge = screen.getByText('Test Badge');
      expect(badge).toHaveClass('cursor-pointer');
    });

    it('applies glow effect when glow prop is true', () => {
      render(<GlassmorphicBadge {...defaultProps} glow />);
      
      const badge = screen.getByText('Test Badge');
      expect(badge).toHaveClass('shadow-lg', 'shadow-current/20');
    });

    it('applies pulsing effect when pulsing prop is true', () => {
      render(<GlassmorphicBadge {...defaultProps} pulsing />);
      
      const badge = screen.getByText('Test Badge');
      expect(badge).toHaveClass('animate-pulse');
    });

    it('handles click events when interactive', async () => {
      const handleClick = jest.fn();
      render(
        <GlassmorphicBadge {...defaultProps} interactive onClick={handleClick} />
      );
      
      const badge = screen.getByText('Test Badge');
      await userEvent.click(badge);
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Bounce on Mount', () => {
    it('applies bounce animation on mount when bounceOnMount is true', async () => {
      render(<GlassmorphicBadge {...defaultProps} bounceOnMount />);
      
      const badge = screen.getByText('Test Badge');
      
      // Initially should have opacity and scale for bounce effect
      await waitFor(() => {
        expect(badge).toHaveClass('animate-bounce');
      });
    });

    it('applies custom transition for bounce on mount', () => {
      render(<GlassmorphicBadge {...defaultProps} bounceOnMount />);
      
      const badge = screen.getByText('Test Badge');
      expect(badge).toHaveStyle({
        transition: 'all 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)'
      });
    });
  });

  describe('GPU Acceleration', () => {
    it('applies transform-gpu class for smooth animations', () => {
      render(<GlassmorphicBadge {...defaultProps} />);
      
      const badge = screen.getByText('Test Badge');
      expect(badge).toHaveClass('transform-gpu');
    });
  });

  describe('Icon Animation', () => {
    it('applies icon hover scale effect', () => {
      const icon = <span data-testid="test-icon">🎯</span>;
      render(<GlassmorphicBadge {...defaultProps} icon={icon} />);
      
      const iconElement = screen.getByTestId('test-icon');
      expect(iconElement).toHaveClass('group-hover:scale-110');
    });
  });

  describe('Accessibility', () => {
    it('supports keyboard navigation when interactive', async () => {
      render(<GlassmorphicBadge {...defaultProps} interactive />);
      
      const badge = screen.getByText('Test Badge');
      
      await userEvent.tab();
      expect(badge).toHaveFocus();
    });

    it('has proper focus ring', () => {
      render(<GlassmorphicBadge {...defaultProps} interactive />);
      
      const badge = screen.getByText('Test Badge');
      expect(badge).toHaveClass('focus:outline-none', 'focus:ring-2', 'focus:ring-ring');
    });

    it('supports disabled state', () => {
      render(<GlassmorphicBadge {...defaultProps} disabled />);
      
      const badge = screen.getByText('Test Badge');
      expect(badge).toHaveClass('opacity-50', 'cursor-not-allowed');
    });
  });

  describe('Blur Intensity', () => {
    it('applies small blur intensity', () => {
      render(<GlassmorphicBadge {...defaultProps} blur="sm" />);
      
      const badge = screen.getByText('Test Badge');
      expect(badge).toHaveClass('backdrop-blur-sm');
    });

    it('applies medium blur intensity by default', () => {
      render(<GlassmorphicBadge {...defaultProps} />);
      
      const badge = screen.getByText('Test Badge');
      expect(badge).toHaveClass('backdrop-blur-md');
    });

    it('applies large blur intensity', () => {
      render(<GlassmorphicBadge {...defaultProps} blur="lg" />);
      
      const badge = screen.getByText('Test Badge');
      expect(badge).toHaveClass('backdrop-blur-lg');
    });

    it('applies extra large blur intensity', () => {
      render(<GlassmorphicBadge {...defaultProps} blur="xl" />);
      
      const badge = screen.getByText('Test Badge');
      expect(badge).toHaveClass('backdrop-blur-xl');
    });
  });
});
