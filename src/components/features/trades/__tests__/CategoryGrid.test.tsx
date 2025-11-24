/**
 * CategoryGrid Component Tests
 * 
 * Tests for the CategoryGrid component that displays
 * trade categories in a visual grid format.
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CategoryGrid } from '../CategoryGrid';
import { SkillCategory } from '../../../../utils/skillMapping';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  },
}));

// Mock semanticClasses
jest.mock('../../../../utils/semanticColors', () => ({
  semanticClasses: jest.fn((topic: string) => ({
    text: 'text-primary',
    bgSolid: 'bg-primary',
    bgSubtle: 'bg-primary/10',
    badge: 'bg-primary/20',
  })),
}));

// Mock categoryConfig
jest.mock('../../../../utils/skillMapping', () => ({
  categoryConfig: {
    design: {
      icon: () => <span data-testid="design-icon">🎨</span>,
      label: 'Design',
      topic: 'design',
    },
    development: {
      icon: () => <span data-testid="dev-icon">💻</span>,
      label: 'Development',
      topic: 'development',
    },
    marketing: {
      icon: () => <span data-testid="marketing-icon">📢</span>,
      label: 'Marketing',
      topic: 'marketing',
    },
  },
  SkillCategory: {} as any,
}));

describe('CategoryGrid', () => {
  const mockOnCategorySelect = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render all categories', () => {
      render(
        <CategoryGrid
          onCategorySelect={mockOnCategorySelect}
        />
      );

      expect(screen.getByText('All Categories')).toBeInTheDocument();
      expect(screen.getByText('Design')).toBeInTheDocument();
      expect(screen.getByText('Development')).toBeInTheDocument();
      expect(screen.getByText('Marketing')).toBeInTheDocument();
    });

    it('should render "All Categories" option', () => {
      render(
        <CategoryGrid
          onCategorySelect={mockOnCategorySelect}
        />
      );

      const allButton = screen.getByText('All Categories').closest('button');
      expect(allButton).toBeInTheDocument();
    });

    it('should render category icons', () => {
      render(
        <CategoryGrid
          onCategorySelect={mockOnCategorySelect}
        />
      );

      expect(screen.getByTestId('design-icon')).toBeInTheDocument();
      expect(screen.getByTestId('dev-icon')).toBeInTheDocument();
      expect(screen.getByTestId('marketing-icon')).toBeInTheDocument();
    });
  });

  describe('Category Selection', () => {
    it('should call onCategorySelect when category is clicked', () => {
      render(
        <CategoryGrid
          onCategorySelect={mockOnCategorySelect}
        />
      );

      const designButton = screen.getByText('Design').closest('button');
      fireEvent.click(designButton!);

      expect(mockOnCategorySelect).toHaveBeenCalledWith('design');
    });

    it('should call onCategorySelect with "all" when All Categories is clicked', () => {
      render(
        <CategoryGrid
          onCategorySelect={mockOnCategorySelect}
        />
      );

      const allButton = screen.getByText('All Categories').closest('button');
      fireEvent.click(allButton!);

      expect(mockOnCategorySelect).toHaveBeenCalledWith('all');
    });

    it('should deselect category when clicking selected category', () => {
      render(
        <CategoryGrid
          onCategorySelect={mockOnCategorySelect}
          selectedCategory="design"
        />
      );

      const designButton = screen.getByText('Design').closest('button');
      fireEvent.click(designButton!);

      expect(mockOnCategorySelect).toHaveBeenCalledWith('design');
    });
  });

  describe('Selected State', () => {
    it('should highlight selected category', () => {
      const { container } = render(
        <CategoryGrid
          onCategorySelect={mockOnCategorySelect}
          selectedCategory="design"
        />
      );

      const designButton = screen.getByText('Design').closest('button');
      expect(designButton).toHaveClass('ring-2', 'ring-primary/50');
    });

    it('should highlight "All Categories" when no category is selected', () => {
      render(
        <CategoryGrid
          onCategorySelect={mockOnCategorySelect}
        />
      );

      const allButton = screen.getByText('All Categories').closest('button');
      expect(allButton).toHaveClass('ring-2', 'ring-primary/50');
    });
  });

  describe('Category Counts', () => {
    it('should display count badge when count > 0', () => {
      const categoryCounts = {
        design: 5,
        development: 10,
      };

      render(
        <CategoryGrid
          onCategorySelect={mockOnCategorySelect}
          categoryCounts={categoryCounts}
        />
      );

      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('10')).toBeInTheDocument();
    });

    it('should not display count badge when count is 0', () => {
      const categoryCounts = {
        design: 0,
        marketing: 5,
      };

      render(
        <CategoryGrid
          onCategorySelect={mockOnCategorySelect}
          categoryCounts={categoryCounts}
        />
      );

      expect(screen.queryByText('0')).not.toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('should not display count badge when categoryCounts is not provided', () => {
      render(
        <CategoryGrid
          onCategorySelect={mockOnCategorySelect}
        />
      );

      // Count badges should not be present
      const badges = screen.queryAllByText(/\d+/);
      expect(badges.length).toBe(0);
    });
  });

  describe('Custom className', () => {
    it('should apply custom className', () => {
      const { container } = render(
        <CategoryGrid
          onCategorySelect={mockOnCategorySelect}
          className="custom-class"
        />
      );

      const grid = container.firstChild;
      expect(grid).toHaveClass('custom-class');
    });
  });

  describe('Accessibility', () => {
    it('should have button elements for keyboard navigation', () => {
      render(
        <CategoryGrid
          onCategorySelect={mockOnCategorySelect}
        />
      );

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('should be keyboard accessible', () => {
      render(
        <CategoryGrid
          onCategorySelect={mockOnCategorySelect}
        />
      );

      const designButton = screen.getByText('Design').closest('button');
      designButton?.focus();
      expect(designButton).toHaveFocus();
    });
  });
});

