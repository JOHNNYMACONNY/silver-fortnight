import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { useNavigation } from '../useNavigation';

// Mock react-router-dom
const mockLocation = { pathname: '/test' };
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useLocation: () => mockLocation,
}));

// Helper to render hook with router context
const renderUseNavigation = (initialPath = '/test') => {
  mockLocation.pathname = initialPath;
  return renderHook(() => useNavigation(), {
    wrapper: ({ children }: { children: React.ReactNode }) =>
      React.createElement(MemoryRouter, { initialEntries: [initialPath] }, children),
  });
};

// Mock requestAnimationFrame for scroll throttling tests
global.requestAnimationFrame = jest.fn((cb) => {
  setTimeout(cb, 0);
  return 1;
});

describe('useNavigation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset scroll position
    Object.defineProperty(window, 'scrollY', {
      writable: true,
      value: 0,
    });
  });

  afterEach(() => {
    // Clean up event listeners
    window.removeEventListener('scroll', jest.fn());
    document.removeEventListener('keydown', jest.fn());
  });

  describe('Initial State', () => {
    it('should initialize with correct default values', () => {
      const { result } = renderUseNavigation();

      expect(result.current.isScrolled).toBe(false);
      expect(result.current.isMobileMenuOpen).toBe(false);
      expect(result.current.isCommandPaletteOpen).toBe(false);
      expect(result.current.activePath).toBe('/test');
    });

    it('should provide all required action functions', () => {
      const { result } = renderUseNavigation();

      expect(typeof result.current.toggleMobileMenu).toBe('function');
      expect(typeof result.current.closeMobileMenu).toBe('function');
      expect(typeof result.current.openMobileMenu).toBe('function');
      expect(typeof result.current.toggleCommandPalette).toBe('function');
      expect(typeof result.current.closeCommandPalette).toBe('function');
      expect(typeof result.current.openCommandPalette).toBe('function');
      expect(typeof result.current.setScrolled).toBe('function');
    });
  });

  describe('Mobile Menu State Management', () => {
    it('should toggle mobile menu state', () => {
      const { result } = renderUseNavigation();

      act(() => {
        result.current.toggleMobileMenu();
      });

      expect(result.current.isMobileMenuOpen).toBe(true);

      act(() => {
        result.current.toggleMobileMenu();
      });

      expect(result.current.isMobileMenuOpen).toBe(false);
    });

    it('should open mobile menu', () => {
      const { result } = renderUseNavigation();

      act(() => {
        result.current.openMobileMenu();
      });

      expect(result.current.isMobileMenuOpen).toBe(true);
    });

    it('should close mobile menu', () => {
      const { result } = renderUseNavigation();

      // First open it
      act(() => {
        result.current.openMobileMenu();
      });

      expect(result.current.isMobileMenuOpen).toBe(true);

      // Then close it
      act(() => {
        result.current.closeMobileMenu();
      });

      expect(result.current.isMobileMenuOpen).toBe(false);
    });

    it('should close mobile menu when route changes', () => {
      const { result, rerender } = renderUseNavigation('/initial');

      // Open mobile menu
      act(() => {
        result.current.openMobileMenu();
      });

      expect(result.current.isMobileMenuOpen).toBe(true);

      // Change route
      mockLocation.pathname = '/new-route';
      rerender();

      expect(result.current.isMobileMenuOpen).toBe(false);
    });
  });

  describe('Command Palette State Management', () => {
    it('should toggle command palette state', () => {
      const { result } = renderUseNavigation();

      act(() => {
        result.current.toggleCommandPalette();
      });

      expect(result.current.isCommandPaletteOpen).toBe(true);

      act(() => {
        result.current.toggleCommandPalette();
      });

      expect(result.current.isCommandPaletteOpen).toBe(false);
    });

    it('should open command palette', () => {
      const { result } = renderUseNavigation();

      act(() => {
        result.current.openCommandPalette();
      });

      expect(result.current.isCommandPaletteOpen).toBe(true);
    });

    it('should close command palette', () => {
      const { result } = renderUseNavigation();

      // First open it
      act(() => {
        result.current.openCommandPalette();
      });

      expect(result.current.isCommandPaletteOpen).toBe(true);

      // Then close it
      act(() => {
        result.current.closeCommandPalette();
      });

      expect(result.current.isCommandPaletteOpen).toBe(false);
    });
  });

  describe('Scroll State Management', () => {
    it('should detect scroll state when scrolled beyond threshold', async () => {
      const { result } = renderUseNavigation();

      // Simulate scroll beyond threshold (>10px)
      Object.defineProperty(window, 'scrollY', {
        writable: true,
        value: 50,
      });

      // Trigger scroll event
      act(() => {
        window.dispatchEvent(new Event('scroll'));
      });

      // Wait for requestAnimationFrame
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
      });

      expect(result.current.isScrolled).toBe(true);
    });

    it('should not be scrolled when below threshold', async () => {
      const { result } = renderUseNavigation();

      // Simulate scroll below threshold (<=10px)
      Object.defineProperty(window, 'scrollY', {
        writable: true,
        value: 5,
      });

      // Trigger scroll event
      act(() => {
        window.dispatchEvent(new Event('scroll'));
      });

      // Wait for requestAnimationFrame
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
      });

      expect(result.current.isScrolled).toBe(false);
    });

    it('should manually set scroll state', async () => {
      const { result } = renderUseNavigation();

      // Set scroll position to match the desired state to avoid conflict with scroll effect
      Object.defineProperty(window, 'scrollY', {
        writable: true,
        value: 50, // Above threshold for scrolled state
      });

      act(() => {
        result.current.setScrolled(true);
      });

      // Wait for any async effects
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
      });

      expect(result.current.isScrolled).toBe(true);

      // Set scroll position to match the desired state
      Object.defineProperty(window, 'scrollY', {
        writable: true,
        value: 0, // Below threshold for non-scrolled state
      });

      act(() => {
        result.current.setScrolled(false);
      });

      // Wait for any async effects
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
      });

      expect(result.current.isScrolled).toBe(false);
    });
  });

  describe('Active Path Tracking', () => {
    it('should track active path from location', () => {
      const { result } = renderUseNavigation('/trades');
      expect(result.current.activePath).toBe('/trades');
    });

    it('should update active path when location changes', () => {
      const { result, rerender } = renderUseNavigation('/trades');
      expect(result.current.activePath).toBe('/trades');

      mockLocation.pathname = '/collaborations';
      rerender();

      expect(result.current.activePath).toBe('/collaborations');
    });
  });

  describe('Keyboard Shortcuts', () => {
    it('should open command palette with Cmd+K', () => {
      const { result } = renderUseNavigation();

      act(() => {
        const event = new KeyboardEvent('keydown', {
          key: 'k',
          metaKey: true,
        });
        document.dispatchEvent(event);
      });

      expect(result.current.isCommandPaletteOpen).toBe(true);
    });

    it('should open command palette with Ctrl+K', () => {
      const { result } = renderUseNavigation();

      act(() => {
        const event = new KeyboardEvent('keydown', {
          key: 'k',
          ctrlKey: true,
        });
        document.dispatchEvent(event);
      });

      expect(result.current.isCommandPaletteOpen).toBe(true);
    });

    it('should close command palette with Escape when open', () => {
      const { result } = renderUseNavigation();

      // First open command palette
      act(() => {
        result.current.openCommandPalette();
      });

      expect(result.current.isCommandPaletteOpen).toBe(true);

      // Then press Escape
      act(() => {
        const event = new KeyboardEvent('keydown', {
          key: 'Escape',
        });
        document.dispatchEvent(event);
      });

      expect(result.current.isCommandPaletteOpen).toBe(false);
    });

    it('should close mobile menu with Escape when open and command palette is closed', () => {
      const { result } = renderUseNavigation();

      // First open mobile menu
      act(() => {
        result.current.openMobileMenu();
      });

      expect(result.current.isMobileMenuOpen).toBe(true);

      // Then press Escape
      act(() => {
        const event = new KeyboardEvent('keydown', {
          key: 'Escape',
        });
        document.dispatchEvent(event);
      });

      expect(result.current.isMobileMenuOpen).toBe(false);
    });

    it('should prioritize command palette over mobile menu when both are open and Escape is pressed', () => {
      const { result } = renderUseNavigation();

      // Open both mobile menu and command palette
      act(() => {
        result.current.openMobileMenu();
        result.current.openCommandPalette();
      });

      expect(result.current.isMobileMenuOpen).toBe(true);
      expect(result.current.isCommandPaletteOpen).toBe(true);

      // Press Escape - should close command palette first
      act(() => {
        const event = new KeyboardEvent('keydown', {
          key: 'Escape',
        });
        document.dispatchEvent(event);
      });

      expect(result.current.isCommandPaletteOpen).toBe(false);
      expect(result.current.isMobileMenuOpen).toBe(true); // Should remain open
    });

    it('should prevent default behavior for Cmd+K', () => {
      const { result } = renderUseNavigation();
      const preventDefault = jest.fn();

      act(() => {
        const event = new KeyboardEvent('keydown', {
          key: 'k',
          metaKey: true,
        });
        // Mock preventDefault
        Object.defineProperty(event, 'preventDefault', {
          value: preventDefault,
        });
        document.dispatchEvent(event);
      });

      expect(preventDefault).toHaveBeenCalled();
    });
  });

  describe('Performance and Memory Management', () => {
    it('should clean up event listeners on unmount', () => {
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
      const removeDocumentEventListenerSpy = jest.spyOn(document, 'removeEventListener');

      const { unmount } = renderUseNavigation();

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function));
      expect(removeDocumentEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    });

    it('should throttle scroll events using requestAnimationFrame', () => {
      const requestAnimationFrameSpy = jest.spyOn(window, 'requestAnimationFrame');

      renderUseNavigation();

      // Trigger multiple scroll events rapidly
      act(() => {
        window.dispatchEvent(new Event('scroll'));
        window.dispatchEvent(new Event('scroll'));
        window.dispatchEvent(new Event('scroll'));
      });

      // Should only call requestAnimationFrame once due to throttling
      expect(requestAnimationFrameSpy).toHaveBeenCalledTimes(1);
    });

    it('should use passive scroll listeners for better performance', () => {
      const addEventListenerSpy = jest.spyOn(window, 'addEventListener');

      renderUseNavigation();

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'scroll',
        expect.any(Function),
        { passive: true }
      );
    });
  });
});
