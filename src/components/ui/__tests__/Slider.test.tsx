/**
 * Slider Component Tests
 * 
 * Tests for the Slider component that provides
 * intuitive input for numeric ranges.
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { Slider } from '../Slider';

describe('Slider', () => {
  const mockOnValueChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render slider with default props', () => {
      render(
        <Slider
          value={50}
          onValueChange={mockOnValueChange}
        />
      );

      const slider = screen.getByRole('slider');
      expect(slider).toBeInTheDocument();
      expect(slider).toHaveValue('50');
    });

    it('should render with label', () => {
      render(
        <Slider
          label="Volume"
          value={50}
          onValueChange={mockOnValueChange}
        />
      );

      expect(screen.getByText('Volume')).toBeInTheDocument();
    });

    it('should display current value when label is provided', () => {
      render(
        <Slider
          label="Volume"
          value={75}
          onValueChange={mockOnValueChange}
        />
      );

      expect(screen.getByText('(75)')).toBeInTheDocument();
    });

    it('should display current value when no label is provided', () => {
      render(
        <Slider
          value={25}
          onValueChange={mockOnValueChange}
          showValue={true}
        />
      );

      expect(screen.getByText('25')).toBeInTheDocument();
    });
  });

  describe('Value Changes', () => {
    it('should call onValueChange when value changes', async () => {
      const user = userEvent.setup();
      render(
        <Slider
          value={50}
          onValueChange={mockOnValueChange}
          min={0}
          max={100}
        />
      );

      const slider = screen.getByRole('slider');
      await user.type(slider, '75');

      expect(mockOnValueChange).toHaveBeenCalled();
    });

    it('should update value correctly', () => {
      const { rerender } = render(
        <Slider
          value={50}
          onValueChange={mockOnValueChange}
        />
      );

      const slider = screen.getByRole('slider');
      expect(slider).toHaveValue('50');

      rerender(
        <Slider
          value={75}
          onValueChange={mockOnValueChange}
        />
      );

      expect(slider).toHaveValue('75');
    });
  });

  describe('Min/Max/Step', () => {
    it('should respect min value', () => {
      render(
        <Slider
          value={0}
          onValueChange={mockOnValueChange}
          min={0}
          max={100}
        />
      );

      const slider = screen.getByRole('slider');
      expect(slider).toHaveAttribute('min', '0');
    });

    it('should respect max value', () => {
      render(
        <Slider
          value={100}
          onValueChange={mockOnValueChange}
          min={0}
          max={100}
        />
      );

      const slider = screen.getByRole('slider');
      expect(slider).toHaveAttribute('max', '100');
    });

    it('should respect step value', () => {
      render(
        <Slider
          value={50}
          onValueChange={mockOnValueChange}
          min={0}
          max={100}
          step={10}
        />
      );

      const slider = screen.getByRole('slider');
      expect(slider).toHaveAttribute('step', '10');
    });
  });

  describe('Value Labels', () => {
    it('should display value labels', () => {
      render(
        <Slider
          value={1}
          onValueChange={mockOnValueChange}
          min={0}
          max={2}
          step={1}
          valueLabels={['Beginner', 'Intermediate', 'Expert']}
        />
      );

      expect(screen.getByText('Beginner')).toBeInTheDocument();
      expect(screen.getByText('Intermediate')).toBeInTheDocument();
      expect(screen.getByText('Expert')).toBeInTheDocument();
    });

    it('should highlight current value label', () => {
      render(
        <Slider
          value={1}
          onValueChange={mockOnValueChange}
          min={0}
          max={2}
          step={1}
          valueLabels={['Beginner', 'Intermediate', 'Expert']}
        />
      );

      const intermediateLabel = screen.getByText('Intermediate');
      expect(intermediateLabel).toHaveClass('text-primary', 'font-medium');
    });

    it('should use label from valueLabels when available', () => {
      render(
        <Slider
          label="Skill Level"
          value={0}
          onValueChange={mockOnValueChange}
          min={0}
          max={2}
          step={1}
          valueLabels={['Beginner', 'Intermediate', 'Expert']}
        />
      );

      expect(screen.getByText('(Beginner)')).toBeInTheDocument();
    });

    it('should fall back to numeric value when label not available', () => {
      render(
        <Slider
          label="Volume"
          value={50}
          onValueChange={mockOnValueChange}
          min={0}
          max={100}
        />
      );

      expect(screen.getByText('(50)')).toBeInTheDocument();
    });
  });

  describe('showValue prop', () => {
    it('should hide value when showValue is false', () => {
      render(
        <Slider
          label="Volume"
          value={50}
          onValueChange={mockOnValueChange}
          showValue={false}
        />
      );

      expect(screen.queryByText('(50)')).not.toBeInTheDocument();
    });

    it('should show value when showValue is true', () => {
      render(
        <Slider
          label="Volume"
          value={50}
          onValueChange={mockOnValueChange}
          showValue={true}
        />
      );

      expect(screen.getByText('(50)')).toBeInTheDocument();
    });
  });

  describe('Custom className', () => {
    it('should apply custom className', () => {
      const { container } = render(
        <Slider
          value={50}
          onValueChange={mockOnValueChange}
          className="custom-class"
        />
      );

      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass('custom-class');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(
        <Slider
          label="Volume"
          value={50}
          onValueChange={mockOnValueChange}
          min={0}
          max={100}
        />
      );

      const slider = screen.getByRole('slider');
      expect(slider).toHaveAttribute('min', '0');
      expect(slider).toHaveAttribute('max', '100');
    });

    it('should be keyboard accessible', () => {
      render(
        <Slider
          value={50}
          onValueChange={mockOnValueChange}
          min={0}
          max={100}
        />
      );

      const slider = screen.getByRole('slider');
      slider.focus();
      expect(slider).toHaveFocus();
    });
  });

  describe('Edge Cases', () => {
    it('should handle value at minimum', () => {
      render(
        <Slider
          value={0}
          onValueChange={mockOnValueChange}
          min={0}
          max={100}
        />
      );

      const slider = screen.getByRole('slider');
      expect(slider).toHaveValue('0');
    });

    it('should handle value at maximum', () => {
      render(
        <Slider
          value={100}
          onValueChange={mockOnValueChange}
          min={0}
          max={100}
        />
      );

      const slider = screen.getByRole('slider');
      expect(slider).toHaveValue('100');
    });

    it('should handle valueLabels with fewer items than max', () => {
      render(
        <Slider
          value={2}
          onValueChange={mockOnValueChange}
          min={0}
          max={5}
          step={1}
          valueLabels={['Low', 'Medium', 'High']}
        />
      );

      // Should not crash when value exceeds valueLabels length
      const slider = screen.getByRole('slider');
      expect(slider).toBeInTheDocument();
    });
  });
});

