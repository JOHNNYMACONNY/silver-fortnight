/**
 * GlassmorphicForm Component Tests
 * 
 * Comprehensive test suite for the GlassmorphicForm component
 * covering all variants, props, accessibility, and user interactions.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { GlassmorphicForm, GlassmorphicFormSection, GlassmorphicFormActions } from '../GlassmorphicForm';

// Mock framer-motion
jest.mock('framer-motion', () => {
  const React = require('react');
  return {
    motion: {
      div: ({ children, ...props }: any) => React.createElement('div', props, children),
      form: ({ children, ...props }: any) => React.createElement('form', props, children),
    },
    AnimatePresence: ({ children }: { children: React.ReactNode }) => React.createElement(React.Fragment, null, children),
  };
});

describe('GlassmorphicForm', () => {
  const defaultProps = {
    children: <div>Form content</div>,
  };

  describe('Basic Rendering', () => {
    it('renders form with default props', () => {
      render(<GlassmorphicForm {...defaultProps} />);

      const form = document.querySelector('form');
      expect(form).toBeInTheDocument();
      expect(form).toHaveTextContent('Form content');
    });

    it('renders with custom id', () => {
      render(<GlassmorphicForm {...defaultProps} id="test-form" />);

      const form = document.querySelector('form');
      expect(form).toHaveAttribute('id', 'test-form');
    });

    it('applies custom className', () => {
      render(<GlassmorphicForm {...defaultProps} className="custom-class" />);
      
      const form = document.querySelector('form');
      expect(form).toHaveClass('custom-class');
    });
  });

  describe('Form Variants', () => {
    it('applies standard variant styles by default', () => {
      render(<GlassmorphicForm {...defaultProps} />);
      
      const form = document.querySelector('form');
      expect(form).toHaveClass('glassmorphic');
      expect(form).toHaveClass('rounded-2xl');
      expect(form).toHaveClass('transition-all', 'duration-500', 'ease-out');
    });

    it('applies elevated variant styles', () => {
      render(<GlassmorphicForm {...defaultProps} variant="elevated" />);
      
      const form = document.querySelector('form');
      expect(form).toHaveClass('glassmorphic');
      expect(form).toHaveClass('rounded-3xl');
      expect(form).toHaveClass('shadow-2xl');
      expect(form).toHaveClass('transition-all', 'duration-500', 'ease-out');
    });

    it('applies modal variant styles', () => {
      render(<GlassmorphicForm {...defaultProps} variant="modal" />);
      
      const form = document.querySelector('form');
      expect(form).toHaveClass('glassmorphic');
      expect(form).toHaveClass('shadow-beautiful');
      expect(form).toHaveClass('transition-all', 'duration-500', 'ease-out');
    });

    it('applies stepped variant styles', () => {
      render(<GlassmorphicForm {...defaultProps} variant="stepped" />);
      
      const form = document.querySelector('form');
      expect(form).toHaveClass('glassmorphic');
      expect(form).toHaveClass('border-l-4');
      expect(form).toHaveClass('rounded-r-2xl');
      expect(form).toHaveClass('transition-all', 'duration-500', 'ease-out');
    });
  });

  describe('Phase 3 Hover Effects', () => {
    it('applies hover effects to standard variant', () => {
      render(<GlassmorphicForm {...defaultProps} />);
      
      const form = document.querySelector('form');
      expect(form).toHaveClass('hover:shadow-xl', 'hover:shadow-primary/10');
      expect(form).toHaveClass('hover:scale-[1.01]');
    });

    it('applies enhanced hover effects to elevated variant', () => {
      render(<GlassmorphicForm {...defaultProps} variant="elevated" />);
      
      const form = document.querySelector('form');
      expect(form).toHaveClass('hover:shadow-2xl', 'hover:shadow-primary/15');
      expect(form).toHaveClass('hover:scale-[1.02]');
    });

    it('applies hover effects to modal variant', () => {
      render(<GlassmorphicForm {...defaultProps} variant="modal" />);
      
      const form = document.querySelector('form');
      expect(form).toHaveClass('hover:shadow-xl', 'hover:shadow-secondary/10');
      expect(form).toHaveClass('hover:scale-[1.01]');
    });

    it('applies hover effects to stepped variant', () => {
      render(<GlassmorphicForm {...defaultProps} variant="stepped" />);
      
      const form = document.querySelector('form');
      expect(form).toHaveClass('hover:shadow-xl', 'hover:shadow-purple/10');
      expect(form).toHaveClass('hover:scale-[1.01]');
    });
  });

  describe('Blur Intensity', () => {
    it('uses the canonical glassmorphic surface regardless of blurIntensity', () => {
      render(<GlassmorphicForm {...defaultProps} blurIntensity="sm" />);
      const form = document.querySelector('form');
      expect(form).toHaveClass('glassmorphic');
    });
  });

  describe('Brand Accents', () => {
    it('applies orange brand accent', () => {
      render(<GlassmorphicForm {...defaultProps} brandAccent="orange" />);
      
      const form = document.querySelector('form');
      expect(form).toHaveClass('ring-ring/20');
    });

    it('applies blue brand accent', () => {
      render(<GlassmorphicForm {...defaultProps} brandAccent="blue" />);
      
      const form = document.querySelector('form');
      expect(form).toHaveClass('ring-blue-500/20');
    });

    it('applies purple brand accent', () => {
      render(<GlassmorphicForm {...defaultProps} brandAccent="purple" />);
      
      const form = document.querySelector('form');
      expect(form).toHaveClass('ring-purple-500/20');
    });
  });

  describe('Form Submission', () => {
    it('calls onSubmit when form is submitted', async () => {
      const handleSubmit = jest.fn();
      render(
        <GlassmorphicForm {...defaultProps} onSubmit={handleSubmit}>
          <button type="submit">Submit</button>
        </GlassmorphicForm>
      );

      const submitButton = screen.getByRole('button', { name: 'Submit' });
      await userEvent.click(submitButton);

      expect(handleSubmit).toHaveBeenCalledTimes(1);
    });

    it('prevents default form submission', async () => {
      const handleSubmit = jest.fn();
      render(
        <GlassmorphicForm {...defaultProps} onSubmit={handleSubmit}>
          <button type="submit">Submit</button>
        </GlassmorphicForm>
      );

      const form = document.querySelector('form');
      fireEvent.submit(form);

      expect(handleSubmit).toHaveBeenCalledTimes(1);
      const event = handleSubmit.mock.calls[0][0];
      expect(event.defaultPrevented).toBe(true);
    });
  });

  describe('Z-Index', () => {
    it('applies custom z-index', () => {
      render(<GlassmorphicForm {...defaultProps} zIndex={20} />);
      
      const form = document.querySelector('form');
      expect(form).toHaveStyle({ zIndex: '20' });
    });

    it('applies default z-index', () => {
      render(<GlassmorphicForm {...defaultProps} />);
      
      const form = document.querySelector('form');
      expect(form).toHaveStyle({ zIndex: '10' });
    });
  });

  describe('Accessibility', () => {
    it('has proper form role', () => {
      render(<GlassmorphicForm {...defaultProps} />);
      
      const form = document.querySelector('form');
      expect(form).toBeInTheDocument();
    });

    it('supports keyboard navigation', async () => {
      render(
        <GlassmorphicForm {...defaultProps}>
          <input type="text" placeholder="Test input" />
          <button type="submit">Submit</button>
        </GlassmorphicForm>
      );

      const input = screen.getByPlaceholderText('Test input');
      const button = screen.getByRole('button', { name: 'Submit' });

      // Tab to input
      await userEvent.tab();
      expect(input).toHaveFocus();

      // Tab to button
      await userEvent.tab();
      expect(button).toHaveFocus();
    });
  });
});

describe('GlassmorphicFormSection', () => {
  const defaultProps = {
    children: <div>Section content</div>,
  };

  describe('Basic Rendering', () => {
    it('renders section with default props', () => {
      render(<GlassmorphicFormSection {...defaultProps} />);
      
      const section = screen.getByText('Section content');
      expect(section.parentElement).toHaveClass('rounded-xl');
      expect(section.parentElement).toHaveClass('glassmorphic');
    });

    it('renders with title', () => {
      render(<GlassmorphicFormSection {...defaultProps} title="Test Title" />);
      
      expect(screen.getByText('Test Title')).toBeInTheDocument();
      expect(screen.getByText('Test Title')).toHaveClass('text-lg', 'font-semibold');
    });

    it('renders with description', () => {
      render(<GlassmorphicFormSection {...defaultProps} description="Test description" />);
      
      expect(screen.getByText('Test description')).toBeInTheDocument();
      expect(screen.getByText('Test description')).toHaveClass('text-sm');
    });

    it('renders with both title and description', () => {
      render(
        <GlassmorphicFormSection 
          {...defaultProps} 
          title="Test Title" 
          description="Test description" 
        />
      );
      
      expect(screen.getByText('Test Title')).toBeInTheDocument();
      expect(screen.getByText('Test description')).toBeInTheDocument();
    });
  });

  describe('Section Variants', () => {
    it('applies default variant styles', () => {
      render(<GlassmorphicFormSection {...defaultProps} />);
      
      const section = screen.getByText('Section content').parentElement;
      expect(section).toHaveClass('glassmorphic');
    });

    it('applies highlighted variant styles', () => {
      render(<GlassmorphicFormSection {...defaultProps} variant="highlighted" />);
      
      const section = screen.getByText('Section content').parentElement;
      expect(section).toHaveClass('glassmorphic');
      expect(section).toHaveClass('border-strong');
    });

    it('applies subtle variant styles', () => {
      render(<GlassmorphicFormSection {...defaultProps} variant="subtle" />);
      
      const section = screen.getByText('Section content').parentElement;
      expect(section).toHaveClass('glassmorphic');
      expect(section).toHaveClass('border-standard');
    });
  });
});

describe('GlassmorphicFormActions', () => {
  const defaultProps = {
    children: <button>Action Button</button>,
  };

  describe('Basic Rendering', () => {
    it('renders actions with default props', () => {
      render(<GlassmorphicFormActions {...defaultProps} />);
      
      const button = screen.getByRole('button', { name: 'Action Button' });
      expect(button.parentElement).toHaveClass('flex', 'items-center', 'gap-3');
      expect(button.parentElement).toHaveClass('justify-end'); // default align
    });
  });

  describe('Alignment Options', () => {
    it('applies left alignment', () => {
      render(<GlassmorphicFormActions {...defaultProps} align="left" />);
      
      const container = screen.getByRole('button').parentElement;
      expect(container).toHaveClass('justify-start');
    });

    it('applies center alignment', () => {
      render(<GlassmorphicFormActions {...defaultProps} align="center" />);
      
      const container = screen.getByRole('button').parentElement;
      expect(container).toHaveClass('justify-center');
    });

    it('applies between alignment', () => {
      render(<GlassmorphicFormActions {...defaultProps} align="between" />);
      
      const container = screen.getByRole('button').parentElement;
      expect(container).toHaveClass('justify-between');
    });
  });

  describe('Action Variants', () => {
    it('applies default variant styles', () => {
      render(<GlassmorphicFormActions {...defaultProps} />);
      
      const container = screen.getByRole('button').parentElement;
      expect(container).toHaveClass('pt-6', 'border-t', 'border-border');
    });

    it('applies elevated variant styles', () => {
      render(<GlassmorphicFormActions {...defaultProps} variant="elevated" />);
      
      const container = screen.getByRole('button').parentElement;
      expect(container).toHaveClass('glassmorphic');
      expect(container).toHaveClass('rounded-b-2xl');
    });

    it('applies floating variant styles', () => {
      render(<GlassmorphicFormActions {...defaultProps} variant="floating" />);
      
      const container = screen.getByRole('button').parentElement;
      expect(container).toHaveClass('glassmorphic');
    });
  });
});
