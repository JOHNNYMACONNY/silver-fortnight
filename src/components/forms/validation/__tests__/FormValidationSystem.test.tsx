/**
 * Form Validation System Tests
 * 
 * Comprehensive tests for the validation system including real-time feedback,
 * accessibility compliance, and integration with form components.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

// Mock framer-motion to avoid animation issues in tests
jest.mock('framer-motion', () => ({
  motion: {
    div: 'div',
    p: 'p',
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
}));

import {
  ValidationProvider,
  useValidation,
  ValidationRules,
  ValidationMessage,
} from '../FormValidationSystem';

// Test component that uses validation
const TestFormComponent: React.FC<{
  fieldName: string;
  rules: any[];
  initialValue?: string;
}> = ({ fieldName, rules, initialValue = '' }) => {
  const { validateField, getFieldState } = useValidation();
  const [value, setValue] = React.useState(initialValue);
  const fieldState = getFieldState(fieldName);

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    await validateField(fieldName, newValue, rules);
  };

  return (
    <div>
      <input
        data-testid={`input-${fieldName}`}
        value={value}
        onChange={handleChange}
        aria-describedby={fieldState.message ? `${fieldName}-validation` : undefined}
        aria-invalid={fieldState.state === 'invalid'}
      />
      <ValidationMessage
        fieldName={fieldName}
        data-testid={`validation-${fieldName}`}
      />
    </div>
  );
};

// Wrapper component for tests
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ValidationProvider enableRealTimeValidation={true} debounceMs={100}>
    {children}
  </ValidationProvider>
);

describe('FormValidationSystem', () => {
  describe('ValidationRules', () => {
    test('required rule validates correctly', async () => {
      const rule = ValidationRules.required('Field is required');
      
      expect(await rule.validator!('')).toBe(false);
      expect(await rule.validator!('   ')).toBe(false);
      expect(await rule.validator!('value')).toBe(true);
      expect(await rule.validator!([])).toBe(false);
      expect(await rule.validator!(['item'])).toBe(true);
    });

    test('email rule validates correctly', async () => {
      const rule = ValidationRules.email();
      
      expect(await rule.validator!('')).toBe(true); // Allow empty
      expect(await rule.validator!('invalid')).toBe(false);
      expect(await rule.validator!('test@example.com')).toBe(true);
      expect(await rule.validator!('user+tag@domain.co.uk')).toBe(true);
    });

    test('phone rule validates correctly', async () => {
      const rule = ValidationRules.phone();
      
      expect(await rule.validator!('')).toBe(true); // Allow empty
      expect(await rule.validator!('123')).toBe(false);
      expect(await rule.validator!('(555) 123-4567')).toBe(true);
      expect(await rule.validator!('+1-555-123-4567')).toBe(true);
      expect(await rule.validator!('5551234567')).toBe(true);
    });

    test('number rule validates correctly', async () => {
      const rule = ValidationRules.number(0, 100);
      
      expect(await rule.validator!('')).toBe(true); // Allow empty
      expect(await rule.validator!('abc')).toBe(false);
      expect(await rule.validator!('-5')).toBe(false);
      expect(await rule.validator!('150')).toBe(false);
      expect(await rule.validator!('50')).toBe(true);
      expect(await rule.validator!('0')).toBe(true);
      expect(await rule.validator!('100')).toBe(true);
    });

    test('minLength rule validates correctly', async () => {
      const rule = ValidationRules.minLength(5);
      
      expect(await rule.validator!('')).toBe(true); // Allow empty
      expect(await rule.validator!('abc')).toBe(false);
      expect(await rule.validator!('abcde')).toBe(true);
      expect(await rule.validator!('abcdef')).toBe(true);
    });

    test('maxLength rule validates correctly', async () => {
      const rule = ValidationRules.maxLength(5);
      
      expect(await rule.validator!('')).toBe(true); // Allow empty
      expect(await rule.validator!('abc')).toBe(true);
      expect(await rule.validator!('abcde')).toBe(true);
      expect(await rule.validator!('abcdef')).toBe(false);
    });

    test('pattern rule validates correctly', async () => {
      const rule = ValidationRules.pattern(/^[A-Z]+$/, 'Must be uppercase letters only');
      
      expect(await rule.validator!('')).toBe(true); // Allow empty
      expect(await rule.validator!('abc')).toBe(false);
      expect(await rule.validator!('ABC')).toBe(true);
      expect(await rule.validator!('ABC123')).toBe(false);
    });

    test('custom rule validates correctly', async () => {
      const rule = ValidationRules.custom(
        (value) => value === 'special',
        'Must be "special"'
      );
      
      expect(await rule.validator!('')).toBe(false);
      expect(await rule.validator!('other')).toBe(false);
      expect(await rule.validator!('special')).toBe(true);
    });
  });

  describe('ValidationProvider and useValidation', () => {
    test('validates field with single rule', async () => {
      render(
        <TestWrapper>
          <TestFormComponent
            fieldName="email"
            rules={[ValidationRules.required(), ValidationRules.email()]}
          />
        </TestWrapper>
      );

      const input = screen.getByTestId('input-email');
      
      // Test empty value (should fail required)
      await userEvent.type(input, 'a');
      await userEvent.clear(input);
      
      await waitFor(() => {
        expect(screen.getByText('This field is required')).toBeInTheDocument();
      });

      // Test invalid email
      await userEvent.type(input, 'invalid-email');
      
      await waitFor(() => {
        expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
      });

      // Test valid email
      await userEvent.clear(input);
      await userEvent.type(input, 'test@example.com');
      
      await waitFor(() => {
        expect(screen.queryByText('Please enter a valid email address')).not.toBeInTheDocument();
        expect(screen.queryByText('This field is required')).not.toBeInTheDocument();
      });
    });

    test('validates field with multiple rules', async () => {
      render(
        <TestWrapper>
          <TestFormComponent
            fieldName="password"
            rules={[
              ValidationRules.required('Password is required'),
              ValidationRules.minLength(8, 'Password must be at least 8 characters'),
              ValidationRules.pattern(/(?=.*[A-Z])/, 'Password must contain uppercase letter')
            ]}
          />
        </TestWrapper>
      );

      const input = screen.getByTestId('input-password');
      
      // Test short password
      await userEvent.type(input, 'abc');
      
      await waitFor(() => {
        expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument();
      });

      // Test long but no uppercase
      await userEvent.clear(input);
      await userEvent.type(input, 'abcdefgh');
      
      await waitFor(() => {
        expect(screen.getByText('Password must contain uppercase letter')).toBeInTheDocument();
      });

      // Test valid password
      await userEvent.clear(input);
      await userEvent.type(input, 'Abcdefgh');
      
      await waitFor(() => {
        expect(screen.queryByText('Password must contain uppercase letter')).not.toBeInTheDocument();
        expect(screen.queryByText('Password must be at least 8 characters')).not.toBeInTheDocument();
      });
    });

    test('shows validating state during async validation', async () => {
      const slowValidator = ValidationRules.custom(
        async (value) => {
          await new Promise(resolve => setTimeout(resolve, 200));
          return value === 'valid';
        },
        'Must be "valid"'
      );

      render(
        <TestWrapper>
          <TestFormComponent
            fieldName="async"
            rules={[slowValidator]}
          />
        </TestWrapper>
      );

      const input = screen.getByTestId('input-async');
      
      await userEvent.type(input, 'test');
      
      // Should show validating state
      await waitFor(() => {
        expect(screen.getByText('Validating...')).toBeInTheDocument();
      });

      // Should eventually show validation result
      await waitFor(() => {
        expect(screen.getByText('Must be "valid"')).toBeInTheDocument();
      }, { timeout: 1000 });
    });
  });

  describe('ValidationMessage Component', () => {
    test('renders validation message with correct styling', async () => {
      render(
        <TestWrapper>
          <TestFormComponent
            fieldName="test"
            rules={[ValidationRules.required()]}
          />
        </TestWrapper>
      );

      const input = screen.getByTestId('input-test');

      await userEvent.type(input, 'a');
      await userEvent.clear(input);

      await waitFor(() => {
        const message = screen.getByText('This field is required');
        expect(message).toBeInTheDocument();

        // The text-red-600 class is applied to the container div with role="alert"
        const alertContainer = message.closest('[role="alert"]');
        expect(alertContainer).toBeInTheDocument();
        expect(alertContainer).toHaveClass('text-red-600');
      });
    });

    test('supports accessibility attributes', async () => {
      render(
        <TestWrapper>
          <TestFormComponent
            fieldName="accessible"
            rules={[ValidationRules.required()]}
          />
        </TestWrapper>
      );

      const input = screen.getByTestId('input-accessible');
      
      await userEvent.type(input, 'a');
      await userEvent.clear(input);
      
      await waitFor(() => {
        const message = screen.getByText('This field is required');
        expect(message.closest('[role="alert"]')).toBeInTheDocument();
        expect(message.closest('[aria-live="polite"]')).toBeInTheDocument();
        expect(input).toHaveAttribute('aria-invalid', 'true');
      });
    });

    test('animates message transitions', async () => {
      render(
        <TestWrapper>
          <TestFormComponent
            fieldName="animated"
            rules={[ValidationRules.required(), ValidationRules.email()]}
          />
        </TestWrapper>
      );

      const input = screen.getByTestId('input-animated');
      
      // Trigger required error
      await userEvent.type(input, 'a');
      await userEvent.clear(input);
      
      await waitFor(() => {
        expect(screen.getByText('This field is required')).toBeInTheDocument();
      });

      // Change to email error
      await userEvent.type(input, 'invalid-email');
      
      await waitFor(() => {
        expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
        expect(screen.queryByText('This field is required')).not.toBeInTheDocument();
      });
    });
  });

  describe('Accessibility Compliance', () => {
    test('provides proper ARIA attributes', async () => {
      render(
        <TestWrapper>
          <TestFormComponent
            fieldName="aria-test"
            rules={[ValidationRules.required()]}
          />
        </TestWrapper>
      );

      const input = screen.getByTestId('input-aria-test');
      
      // Initially should not have aria-invalid
      expect(input).toHaveAttribute('aria-invalid', 'false');
      
      // Trigger validation error
      await userEvent.type(input, 'a');
      await userEvent.clear(input);
      
      await waitFor(() => {
        expect(input).toHaveAttribute('aria-invalid', 'true');
        expect(input).toHaveAttribute('aria-describedby');
      });
    });

    test('supports screen readers with live regions', async () => {
      render(
        <TestWrapper>
          <TestFormComponent
            fieldName="screen-reader"
            rules={[ValidationRules.required()]}
          />
        </TestWrapper>
      );

      const input = screen.getByTestId('input-screen-reader');
      
      await userEvent.type(input, 'a');
      await userEvent.clear(input);
      
      await waitFor(() => {
        const liveRegion = screen.getByRole('alert');
        expect(liveRegion).toHaveAttribute('aria-live', 'polite');
        expect(liveRegion).toHaveAttribute('aria-atomic', 'true');
      });
    });
  });

  describe('Performance and Debouncing', () => {
    test('debounces validation calls', async () => {
      const mockValidator = jest.fn().mockResolvedValue(true);
      const customRule = ValidationRules.custom(mockValidator, 'Test rule');

      render(
        <ValidationProvider debounceMs={100}>
          <TestFormComponent
            fieldName="debounced"
            rules={[customRule]}
          />
        </ValidationProvider>
      );

      const input = screen.getByTestId('input-debounced');
      
      // Type multiple characters quickly
      await userEvent.type(input, 'abc', { delay: 10 });
      
      // Should only call validator once after debounce
      await waitFor(() => {
        expect(mockValidator).toHaveBeenCalledTimes(1);
        expect(mockValidator).toHaveBeenCalledWith('abc');
      });
    });
  });
});
