import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';

interface NavigationState {
  isScrolled: boolean;
  isMobileMenuOpen: boolean;
  activePath: string;
  isCommandPaletteOpen: boolean;
}

interface NavigationActions {
  toggleMobileMenu: () => void;
  closeMobileMenu: () => void;
  openMobileMenu: () => void;
  toggleCommandPalette: () => void;
  closeCommandPalette: () => void;
  openCommandPalette: () => void;
  setScrolled: (scrolled: boolean) => void;
}

interface UseNavigationReturn extends NavigationState, NavigationActions {}

/**
 * useNavigation - Phase 4.1 Advanced Navigation Hook
 * 
 * Centralizes all navigation-related state and logic including:
 * - Scroll state detection
 * - Mobile menu state management
 * - Active path detection
 * - Command palette state (Cmd+K)
 * - Keyboard shortcut handling
 */
export const useNavigation = (): UseNavigationReturn => {
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  // Handle scroll detection
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const shouldBeScrolled = scrollTop > 10;
      
      if (shouldBeScrolled !== isScrolled) {
        setIsScrolled(shouldBeScrolled);
      }
    };

    // Throttle scroll events for performance
    let ticking = false;
    const throttledScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', throttledScroll, { passive: true });
    
    // Check initial scroll position
    handleScroll();

    return () => {
      window.removeEventListener('scroll', throttledScroll);
    };
  }, [isScrolled]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Cmd+K or Ctrl+K to open command palette
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        setIsCommandPaletteOpen(true);
      }
      
      // Escape to close open overlays
      if (event.key === 'Escape') {
        if (isCommandPaletteOpen) {
          setIsCommandPaletteOpen(false);
        } else if (isMobileMenuOpen) {
          setIsMobileMenuOpen(false);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isCommandPaletteOpen, isMobileMenuOpen]);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Action creators
  const toggleMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(prev => !prev);
  }, []);

  const closeMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(false);
  }, []);

  const openMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(true);
  }, []);

  const toggleCommandPalette = useCallback(() => {
    setIsCommandPaletteOpen(prev => !prev);
  }, []);

  const closeCommandPalette = useCallback(() => {
    setIsCommandPaletteOpen(false);
  }, []);

  const openCommandPalette = useCallback(() => {
    setIsCommandPaletteOpen(true);
  }, []);

  const setScrolled = useCallback((scrolled: boolean) => {
    setIsScrolled(scrolled);
  }, []);

  return {
    // State
    isScrolled,
    isMobileMenuOpen,
    activePath: location.pathname,
    isCommandPaletteOpen,
    
    // Actions
    toggleMobileMenu,
    closeMobileMenu,
    openMobileMenu,
    toggleCommandPalette,
    closeCommandPalette,
    openCommandPalette,
    setScrolled,
  };
}; 