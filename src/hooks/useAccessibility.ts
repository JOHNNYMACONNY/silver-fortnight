import { useEffect, useState, useCallback } from 'react';

/**
 * Accessibility preferences and utilities hook
 * Provides standardized accessibility features across components
 */
export interface AccessibilityPreferences {
  prefersReducedMotion: boolean;
  prefersHighContrast: boolean;
  prefersLargeText: boolean;
  keyboardNavigation: boolean;
  screenReaderActive: boolean;
}

export interface AccessibilityUtils {
  // Focus management
  trapFocus: (container: HTMLElement) => () => void;
  restoreFocus: (element: HTMLElement | null) => void;
  
  // Keyboard navigation
  handleKeyboardNavigation: (
    event: KeyboardEvent,
    options: {
      onEnter?: () => void;
      onSpace?: () => void;
      onEscape?: () => void;
      onArrowUp?: () => void;
      onArrowDown?: () => void;
      onArrowLeft?: () => void;
      onArrowRight?: () => void;
    }
  ) => void;
  
  // ARIA utilities
  generateId: (prefix?: string) => string;
  announceToScreenReader: (message: string, priority?: 'polite' | 'assertive') => void;
  
  // Form accessibility
  getFormFieldProps: (
    id: string,
    options?: {
      required?: boolean;
      invalid?: boolean;
      describedBy?: string[];
      label?: string;
    }
  ) => {
    id: string;
    'aria-required'?: boolean;
    'aria-invalid'?: boolean;
    'aria-describedby'?: string;
    'aria-label'?: string;
  };
}

let idCounter = 0;

export const useAccessibility = (): AccessibilityPreferences & AccessibilityUtils => {
  const [preferences, setPreferences] = useState<AccessibilityPreferences>({
    prefersReducedMotion: false,
    prefersHighContrast: false,
    prefersLargeText: false,
    keyboardNavigation: false,
    screenReaderActive: false,
  });

  // Detect accessibility preferences
  useEffect(() => {
    const updatePreferences = () => {
      setPreferences({
        prefersReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
        prefersHighContrast: window.matchMedia('(prefers-contrast: high)').matches,
        prefersLargeText: window.matchMedia('(prefers-reduced-data: reduce)').matches,
        keyboardNavigation: false, // Will be updated based on user interaction
        screenReaderActive: false, // Will be updated based on detection
      });
    };

    updatePreferences();

    // Listen for changes
    const mediaQueries = [
      window.matchMedia('(prefers-reduced-motion: reduce)'),
      window.matchMedia('(prefers-contrast: high)'),
      window.matchMedia('(prefers-reduced-data: reduce)'),
    ];

    mediaQueries.forEach(mq => mq.addEventListener('change', updatePreferences));

    return () => {
      mediaQueries.forEach(mq => mq.removeEventListener('change', updatePreferences));
    };
  }, []);

  // Detect keyboard navigation
  useEffect(() => {
    const handleKeyDown = () => {
      setPreferences(prev => ({ ...prev, keyboardNavigation: true }));
    };

    const handleMouseDown = () => {
      setPreferences(prev => ({ ...prev, keyboardNavigation: false }));
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);

  // Focus trap utility
  const trapFocus = useCallback((container: HTMLElement) => {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);

    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  }, []);

  // Restore focus utility
  const restoreFocus = useCallback((element: HTMLElement | null) => {
    if (element && typeof element.focus === 'function') {
      element.focus();
    }
  }, []);

  // Keyboard navigation handler
  const handleKeyboardNavigation = useCallback((
    event: KeyboardEvent,
    options: {
      onEnter?: () => void;
      onSpace?: () => void;
      onEscape?: () => void;
      onArrowUp?: () => void;
      onArrowDown?: () => void;
      onArrowLeft?: () => void;
      onArrowRight?: () => void;
    }
  ) => {
    switch (event.key) {
      case 'Enter':
        if (options.onEnter) {
          event.preventDefault();
          options.onEnter();
        }
        break;
      case ' ':
        if (options.onSpace) {
          event.preventDefault();
          options.onSpace();
        }
        break;
      case 'Escape':
        if (options.onEscape) {
          event.preventDefault();
          options.onEscape();
        }
        break;
      case 'ArrowUp':
        if (options.onArrowUp) {
          event.preventDefault();
          options.onArrowUp();
        }
        break;
      case 'ArrowDown':
        if (options.onArrowDown) {
          event.preventDefault();
          options.onArrowDown();
        }
        break;
      case 'ArrowLeft':
        if (options.onArrowLeft) {
          event.preventDefault();
          options.onArrowLeft();
        }
        break;
      case 'ArrowRight':
        if (options.onArrowRight) {
          event.preventDefault();
          options.onArrowRight();
        }
        break;
    }
  }, []);

  // Generate unique IDs
  const generateId = useCallback((prefix = 'a11y') => {
    return `${prefix}-${++idCounter}`;
  }, []);

  // Screen reader announcements
  const announceToScreenReader = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }, []);

  // Form field accessibility props
  const getFormFieldProps = useCallback((
    id: string,
    options: {
      required?: boolean;
      invalid?: boolean;
      describedBy?: string[];
      label?: string;
    } = {}
  ) => {
    const props: any = { id };
    
    if (options.required) {
      props['aria-required'] = true;
    }
    
    if (options.invalid) {
      props['aria-invalid'] = true;
    }
    
    if (options.describedBy && options.describedBy.length > 0) {
      props['aria-describedby'] = options.describedBy.join(' ');
    }
    
    if (options.label) {
      props['aria-label'] = options.label;
    }
    
    return props;
  }, []);

  return {
    ...preferences,
    trapFocus,
    restoreFocus,
    handleKeyboardNavigation,
    generateId,
    announceToScreenReader,
    getFormFieldProps,
  };
};

export default useAccessibility;
